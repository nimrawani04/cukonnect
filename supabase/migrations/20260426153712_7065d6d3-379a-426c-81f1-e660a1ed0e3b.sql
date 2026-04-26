-- 1. Tighten participant check: exclude completed/cancelled rides
CREATE OR REPLACE FUNCTION public.is_ride_participant(_ride_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.rides r
    WHERE r.id = _ride_id
      AND r.driver_id = _user_id
      AND r.status = 'active'
  ) OR EXISTS (
    SELECT 1
    FROM public.bookings b
    JOIN public.rides r ON r.id = b.ride_id
    WHERE b.ride_id = _ride_id
      AND b.passenger_id = _user_id
      AND b.status <> 'cancelled'
      AND r.status = 'active'
  );
$function$;

-- 2. Cleanup function: purge chat data for rides that ended >24h ago
CREATE OR REPLACE FUNCTION public.purge_expired_ride_chats()
RETURNS TABLE(messages_deleted bigint, reads_deleted bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _expired_rides uuid[];
  _msg_count bigint := 0;
  _read_count bigint := 0;
BEGIN
  SELECT COALESCE(array_agg(id), ARRAY[]::uuid[])
    INTO _expired_rides
  FROM public.rides
  WHERE status IN ('completed', 'cancelled')
    AND updated_at < now() - interval '24 hours';

  IF array_length(_expired_rides, 1) IS NULL THEN
    RETURN QUERY SELECT 0::bigint, 0::bigint;
    RETURN;
  END IF;

  WITH deleted AS (
    DELETE FROM public.ride_message_reads
    WHERE ride_id = ANY(_expired_rides)
    RETURNING 1
  )
  SELECT COUNT(*) INTO _read_count FROM deleted;

  WITH deleted AS (
    DELETE FROM public.ride_messages
    WHERE ride_id = ANY(_expired_rides)
    RETURNING 1
  )
  SELECT COUNT(*) INTO _msg_count FROM deleted;

  RETURN QUERY SELECT _msg_count, _read_count;
END;
$function$;

-- 3. Enable extensions for scheduled invocation
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;