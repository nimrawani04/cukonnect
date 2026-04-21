
-- Profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  verified BOOLEAN NOT NULL DEFAULT false,
  rating NUMERIC(3,2) NOT NULL DEFAULT 5.00,
  trips_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by authenticated users"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Rides table
CREATE TYPE public.ride_status AS ENUM ('active', 'completed', 'cancelled');

CREATE TABLE public.rides (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  from_location TEXT NOT NULL,
  to_location TEXT NOT NULL,
  ride_date DATE NOT NULL,
  depart_time TEXT NOT NULL,
  arrive_time TEXT NOT NULL,
  duration TEXT,
  price_per_seat INTEGER NOT NULL,
  seats_total INTEGER NOT NULL DEFAULT 1,
  seats_left INTEGER NOT NULL DEFAULT 1,
  car TEXT,
  stops TEXT[] DEFAULT '{}',
  amenities TEXT[] DEFAULT '{}',
  rules JSONB DEFAULT '{}'::jsonb,
  instant_book BOOLEAN NOT NULL DEFAULT false,
  status public.ride_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.rides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view rides"
  ON public.rides FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Drivers can create their own rides"
  ON public.rides FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = driver_id);

CREATE POLICY "Drivers can update their own rides"
  ON public.rides FOR UPDATE
  TO authenticated
  USING (auth.uid() = driver_id);

CREATE POLICY "Drivers can delete their own rides"
  ON public.rides FOR DELETE
  TO authenticated
  USING (auth.uid() = driver_id);

CREATE INDEX idx_rides_driver ON public.rides(driver_id);
CREATE INDEX idx_rides_route_date ON public.rides(from_location, to_location, ride_date);

-- Bookings table
CREATE TYPE public.booking_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');
CREATE TYPE public.payment_status AS ENUM ('paid', 'cash', 'refunded');

CREATE TABLE public.bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ride_id UUID NOT NULL REFERENCES public.rides(id) ON DELETE CASCADE,
  passenger_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  seats_booked INTEGER NOT NULL DEFAULT 1,
  status public.booking_status NOT NULL DEFAULT 'pending',
  payment_status public.payment_status NOT NULL DEFAULT 'cash',
  cancellation_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Passengers can view their own bookings"
  ON public.bookings FOR SELECT
  TO authenticated
  USING (auth.uid() = passenger_id);

CREATE POLICY "Drivers can view bookings on their rides"
  ON public.bookings FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.rides WHERE rides.id = bookings.ride_id AND rides.driver_id = auth.uid()));

CREATE POLICY "Passengers can create their own bookings"
  ON public.bookings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = passenger_id);

CREATE POLICY "Passengers can update their own bookings"
  ON public.bookings FOR UPDATE
  TO authenticated
  USING (auth.uid() = passenger_id);

CREATE POLICY "Drivers can update bookings on their rides"
  ON public.bookings FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.rides WHERE rides.id = bookings.ride_id AND rides.driver_id = auth.uid()));

CREATE INDEX idx_bookings_ride ON public.bookings(ride_id);
CREATE INDEX idx_bookings_passenger ON public.bookings(passenger_id);

-- Timestamp trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_rides_updated_at
  BEFORE UPDATE ON public.rides
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'phone'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
