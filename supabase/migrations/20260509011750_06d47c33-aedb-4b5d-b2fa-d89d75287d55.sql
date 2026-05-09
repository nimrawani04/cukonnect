
-- 1. Add car_number to rides
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS car_number text;

-- 2. Add thread_passenger_id to ride_messages and ride_message_reads
ALTER TABLE public.ride_messages ADD COLUMN IF NOT EXISTS thread_passenger_id uuid;
ALTER TABLE public.ride_message_reads ADD COLUMN IF NOT EXISTS thread_passenger_id uuid;

CREATE INDEX IF NOT EXISTS idx_ride_messages_thread ON public.ride_messages(ride_id, thread_passenger_id);
CREATE INDEX IF NOT EXISTS idx_ride_message_reads_thread ON public.ride_message_reads(ride_id, thread_passenger_id);

-- 3. Replace RLS policies on ride_messages
DROP POLICY IF EXISTS "Ride participants can view messages" ON public.ride_messages;
DROP POLICY IF EXISTS "Ride participants can send messages" ON public.ride_messages;

CREATE POLICY "View own thread or all threads as driver"
ON public.ride_messages
FOR SELECT
TO authenticated
USING (
  is_ride_participant(ride_id, auth.uid())
  AND (
    -- Driver sees every thread
    auth.uid() = (SELECT r.driver_id FROM public.rides r WHERE r.id = ride_id)
    -- Passenger only sees their own thread
    OR (thread_passenger_id IS NOT NULL AND thread_passenger_id = auth.uid())
    -- Legacy messages without a thread (broadcast to ride participants)
    OR thread_passenger_id IS NULL
  )
);

CREATE POLICY "Send to own thread or any thread as driver"
ON public.ride_messages
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = sender_id
  AND is_ride_participant(ride_id, auth.uid())
  AND thread_passenger_id IS NOT NULL
  AND (
    -- Driver may write into any thread
    auth.uid() = (SELECT r.driver_id FROM public.rides r WHERE r.id = ride_id)
    -- Passenger may only write into their own thread
    OR auth.uid() = thread_passenger_id
  )
);

-- 4. Replace RLS policies on ride_message_reads
DROP POLICY IF EXISTS "Ride participants can view read receipts" ON public.ride_message_reads;
DROP POLICY IF EXISTS "Participants can mark messages as read for themselves" ON public.ride_message_reads;

CREATE POLICY "View read receipts in accessible threads"
ON public.ride_message_reads
FOR SELECT
TO authenticated
USING (
  is_ride_participant(ride_id, auth.uid())
  AND (
    auth.uid() = (SELECT r.driver_id FROM public.rides r WHERE r.id = ride_id)
    OR (thread_passenger_id IS NOT NULL AND thread_passenger_id = auth.uid())
    OR thread_passenger_id IS NULL
  )
);

CREATE POLICY "Mark read in own thread or any as driver"
ON public.ride_message_reads
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND is_ride_participant(ride_id, auth.uid())
  AND (
    auth.uid() = (SELECT r.driver_id FROM public.rides r WHERE r.id = ride_id)
    OR auth.uid() = thread_passenger_id
    OR thread_passenger_id IS NULL
  )
);
