
ALTER TABLE public.rides
  ADD COLUMN IF NOT EXISTS seats_held integer NOT NULL DEFAULT 0;

-- Backfill from existing pending bookings
UPDATE public.rides r
SET seats_held = COALESCE(sub.held, 0)
FROM (
  SELECT ride_id, SUM(seats_booked)::int AS held
  FROM public.bookings
  WHERE status = 'pending'
  GROUP BY ride_id
) sub
WHERE r.id = sub.ride_id;

CREATE OR REPLACE FUNCTION public.adjust_ride_seats()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  delta INTEGER := 0;
  held_delta INTEGER := 0;
  old_held INTEGER := 0;
  new_held INTEGER := 0;
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.status IN ('pending', 'confirmed') THEN
      delta := -NEW.seats_booked;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status IN ('pending', 'confirmed') AND NEW.status IN ('cancelled') THEN
      delta := OLD.seats_booked;
    ELSIF OLD.status IN ('cancelled') AND NEW.status IN ('pending', 'confirmed') THEN
      delta := -NEW.seats_booked;
    ELSIF OLD.status IN ('pending', 'confirmed') AND NEW.status IN ('pending', 'confirmed')
          AND OLD.seats_booked <> NEW.seats_booked THEN
      delta := OLD.seats_booked - NEW.seats_booked;
    END IF;
  END IF;

  -- Held seat tracking (pending only)
  IF TG_OP = 'UPDATE' AND OLD.status = 'pending' THEN
    old_held := OLD.seats_booked;
  END IF;
  IF TG_OP IN ('INSERT', 'UPDATE') AND NEW.status = 'pending' THEN
    new_held := NEW.seats_booked;
  END IF;
  held_delta := new_held - old_held;

  IF delta <> 0 THEN
    UPDATE public.rides
       SET seats_left = GREATEST(0, LEAST(seats_total, seats_left + delta))
     WHERE id = COALESCE(NEW.ride_id, OLD.ride_id);
  END IF;

  IF held_delta <> 0 THEN
    UPDATE public.rides
       SET seats_held = GREATEST(0, LEAST(seats_total, seats_held + held_delta))
     WHERE id = COALESCE(NEW.ride_id, OLD.ride_id);
  END IF;

  RETURN NEW;
END;
$function$;

-- Ensure the trigger exists (covers INSERT/UPDATE on bookings)
DROP TRIGGER IF EXISTS adjust_ride_seats_trigger ON public.bookings;
CREATE TRIGGER adjust_ride_seats_trigger
AFTER INSERT OR UPDATE ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.adjust_ride_seats();
