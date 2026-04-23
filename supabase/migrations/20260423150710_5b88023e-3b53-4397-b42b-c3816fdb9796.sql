ALTER TABLE public.ride_messages REPLICA IDENTITY FULL;
ALTER TABLE public.ride_message_reads REPLICA IDENTITY FULL;
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.ride_messages;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.ride_message_reads;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;