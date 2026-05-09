
CREATE OR REPLACE FUNCTION public.get_ride_seat_summary(_ride_id uuid)
RETURNS TABLE(
  confirmed_seats integer,
  pending_seats integer,
  female_count integer,
  male_count integer,
  other_count integer,
  unknown_count integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    COALESCE(SUM(CASE WHEN b.status = 'confirmed' THEN b.seats_booked ELSE 0 END), 0)::int,
    COALESCE(SUM(CASE WHEN b.status = 'pending'   THEN b.seats_booked ELSE 0 END), 0)::int,
    COALESCE(SUM(CASE WHEN p.gender = 'female' AND b.status IN ('pending','confirmed') THEN b.seats_booked ELSE 0 END), 0)::int,
    COALESCE(SUM(CASE WHEN p.gender = 'male'   AND b.status IN ('pending','confirmed') THEN b.seats_booked ELSE 0 END), 0)::int,
    COALESCE(SUM(CASE WHEN p.gender = 'other'  AND b.status IN ('pending','confirmed') THEN b.seats_booked ELSE 0 END), 0)::int,
    COALESCE(SUM(CASE WHEN (p.gender IS NULL OR p.gender = 'prefer_not_to_say')
                       AND b.status IN ('pending','confirmed') THEN b.seats_booked ELSE 0 END), 0)::int
  FROM public.bookings b
  LEFT JOIN public.profiles p ON p.user_id = b.passenger_id
  WHERE b.ride_id = _ride_id
    AND b.status IN ('pending', 'confirmed');
$$;

REVOKE ALL ON FUNCTION public.get_ride_seat_summary(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_ride_seat_summary(uuid) TO authenticated;
