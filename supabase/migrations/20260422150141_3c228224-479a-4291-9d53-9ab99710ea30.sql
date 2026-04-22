
CREATE TABLE public.ride_message_reads (
  message_id uuid NOT NULL,
  user_id uuid NOT NULL,
  ride_id uuid NOT NULL,
  read_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (message_id, user_id)
);

CREATE INDEX idx_ride_message_reads_ride ON public.ride_message_reads (ride_id);
CREATE INDEX idx_ride_message_reads_user ON public.ride_message_reads (user_id);

ALTER TABLE public.ride_message_reads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ride participants can view read receipts"
ON public.ride_message_reads
FOR SELECT
TO authenticated
USING (public.is_ride_participant(ride_id, auth.uid()));

CREATE POLICY "Participants can mark messages as read for themselves"
ON public.ride_message_reads
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND public.is_ride_participant(ride_id, auth.uid())
);

ALTER TABLE public.ride_message_reads REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ride_message_reads;
