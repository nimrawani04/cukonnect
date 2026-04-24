
-- 1. Gender enum + column on profiles
CREATE TYPE public.gender AS ENUM ('male', 'female', 'other', 'prefer_not_to_say');

ALTER TABLE public.profiles
  ADD COLUMN gender public.gender;

-- 2. ride_stops table: ordered stops with price-from-origin
CREATE TABLE public.ride_stops (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ride_id UUID NOT NULL REFERENCES public.rides(id) ON DELETE CASCADE,
  stop_order INTEGER NOT NULL,
  name TEXT NOT NULL,
  price_from_origin INTEGER NOT NULL DEFAULT 0,
  reached_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (ride_id, stop_order)
);

CREATE INDEX idx_ride_stops_ride_id ON public.ride_stops(ride_id);

ALTER TABLE public.ride_stops ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view ride stops"
  ON public.ride_stops FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Drivers can insert stops on their rides"
  ON public.ride_stops FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.rides r WHERE r.id = ride_id AND r.driver_id = auth.uid()));

CREATE POLICY "Drivers can update stops on their rides"
  ON public.ride_stops FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.rides r WHERE r.id = ride_id AND r.driver_id = auth.uid()));

CREATE POLICY "Drivers can delete stops on their rides"
  ON public.ride_stops FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.rides r WHERE r.id = ride_id AND r.driver_id = auth.uid()));

-- 3. driver_locations: latest GPS ping per ride (one row per ride)
CREATE TABLE public.driver_locations (
  ride_id UUID NOT NULL PRIMARY KEY REFERENCES public.rides(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  heading DOUBLE PRECISION,
  speed DOUBLE PRECISION,
  accuracy DOUBLE PRECISION,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.driver_locations ENABLE ROW LEVEL SECURITY;

-- Visible to driver and any non-cancelled booking holder
CREATE POLICY "Ride participants can view live location"
  ON public.driver_locations FOR SELECT TO authenticated
  USING (public.is_ride_participant(ride_id, auth.uid()));

CREATE POLICY "Drivers can insert their own location"
  ON public.driver_locations FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = driver_id
    AND EXISTS (SELECT 1 FROM public.rides r WHERE r.id = ride_id AND r.driver_id = auth.uid())
  );

CREATE POLICY "Drivers can update their own location"
  ON public.driver_locations FOR UPDATE TO authenticated
  USING (auth.uid() = driver_id);

CREATE POLICY "Drivers can delete their own location"
  ON public.driver_locations FOR DELETE TO authenticated
  USING (auth.uid() = driver_id);

-- 4. Auto-decrement seats_left when bookings change
CREATE OR REPLACE FUNCTION public.adjust_ride_seats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  delta INTEGER := 0;
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.status IN ('pending', 'confirmed') THEN
      delta := -NEW.seats_booked;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Was holding a seat, now released
    IF OLD.status IN ('pending', 'confirmed') AND NEW.status IN ('cancelled') THEN
      delta := OLD.seats_booked;
    -- Was cancelled, now holding a seat again (rare)
    ELSIF OLD.status IN ('cancelled') AND NEW.status IN ('pending', 'confirmed') THEN
      delta := -NEW.seats_booked;
    -- Seat count changed while still holding
    ELSIF OLD.status IN ('pending', 'confirmed') AND NEW.status IN ('pending', 'confirmed')
          AND OLD.seats_booked <> NEW.seats_booked THEN
      delta := OLD.seats_booked - NEW.seats_booked;
    END IF;
  END IF;

  IF delta <> 0 THEN
    UPDATE public.rides
       SET seats_left = GREATEST(0, LEAST(seats_total, seats_left + delta))
     WHERE id = COALESCE(NEW.ride_id, OLD.ride_id);
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER bookings_adjust_seats
AFTER INSERT OR UPDATE ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.adjust_ride_seats();

-- 5. Realtime publication for the new tables + rides + bookings
ALTER TABLE public.rides REPLICA IDENTITY FULL;
ALTER TABLE public.bookings REPLICA IDENTITY FULL;
ALTER TABLE public.driver_locations REPLICA IDENTITY FULL;
ALTER TABLE public.ride_stops REPLICA IDENTITY FULL;

ALTER PUBLICATION supabase_realtime ADD TABLE public.rides;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.driver_locations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ride_stops;
