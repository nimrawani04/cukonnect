-- ride_messages table
CREATE TABLE public.ride_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ride_id UUID NOT NULL REFERENCES public.rides(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  body TEXT NOT NULL CHECK (length(trim(body)) > 0 AND length(body) <= 2000),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_ride_messages_ride_id_created_at
  ON public.ride_messages(ride_id, created_at);

ALTER TABLE public.ride_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ride_messages REPLICA IDENTITY FULL;

-- Helper: is the current user a participant on this ride (driver or active booker)?
CREATE OR REPLACE FUNCTION public.is_ride_participant(_ride_id UUID, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.rides r
    WHERE r.id = _ride_id AND r.driver_id = _user_id
  ) OR EXISTS (
    SELECT 1 FROM public.bookings b
    WHERE b.ride_id = _ride_id
      AND b.passenger_id = _user_id
      AND b.status <> 'cancelled'
  );
$$;

-- RLS policies
CREATE POLICY "Ride participants can view messages"
ON public.ride_messages
FOR SELECT
TO authenticated
USING (public.is_ride_participant(ride_id, auth.uid()));

CREATE POLICY "Ride participants can send messages"
ON public.ride_messages
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = sender_id
  AND public.is_ride_participant(ride_id, auth.uid())
);

CREATE POLICY "Senders can update their own messages"
ON public.ride_messages
FOR UPDATE
TO authenticated
USING (auth.uid() = sender_id);

CREATE POLICY "Senders can delete their own messages"
ON public.ride_messages
FOR DELETE
TO authenticated
USING (auth.uid() = sender_id);

-- updated_at trigger
CREATE TRIGGER ride_messages_set_updated_at
BEFORE UPDATE ON public.ride_messages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.ride_messages;