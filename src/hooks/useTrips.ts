import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

export type TripRole = "passenger" | "driver";
export type TripStatusFilter = "upcoming" | "completed" | "cancelled";

type ProfileLite = {
  user_id: string;
  display_name: string | null;
  rating: number;
  verified: boolean;
};

export type PassengerTrip = {
  kind: "passenger";
  booking_id: string;
  ride_id: string;
  from: string;
  to: string;
  date: string;
  departTime: string;
  arriveTime: string;
  duration: string | null;
  pricePerSeat: number;
  car: string | null;
  seatsBooked: number;
  bookingStatus: "pending" | "confirmed" | "cancelled" | "completed";
  paymentStatus: "paid" | "cash" | "refunded";
  cancellationReason: string | null;
  rideStatus: "active" | "completed" | "cancelled";
  driver: ProfileLite | null;
};

export type DriverPassenger = {
  booking_id: string;
  name: string;
  seats: number;
  status: "pending" | "confirmed" | "cancelled" | "completed";
};

export type DriverTrip = {
  kind: "driver";
  ride_id: string;
  from: string;
  to: string;
  date: string;
  departTime: string;
  arriveTime: string;
  duration: string | null;
  pricePerSeat: number;
  car: string | null;
  seatsTotal: number;
  seatsLeft: number;
  rideStatus: "active" | "completed" | "cancelled";
  cancellationReason: string | null;
  passengers: DriverPassenger[];
  earnings: number;
};

const todayIso = () => new Date().toISOString().slice(0, 10);

const classifyRide = (rideStatus: string, date: string): TripStatusFilter => {
  if (rideStatus === "cancelled") return "cancelled";
  if (rideStatus === "completed") return "completed";
  return date < todayIso() ? "completed" : "upcoming";
};

const classifyBooking = (
  bookingStatus: string,
  rideStatus: string,
  date: string,
): TripStatusFilter => {
  if (bookingStatus === "cancelled" || rideStatus === "cancelled") return "cancelled";
  if (bookingStatus === "completed" || rideStatus === "completed") return "completed";
  return date < todayIso() ? "completed" : "upcoming";
};

export const useTrips = (user: User | null, role: TripRole) => {
  const [loading, setLoading] = useState(true);
  const [passengerTrips, setPassengerTrips] = useState<PassengerTrip[]>([]);
  const [driverTrips, setDriverTrips] = useState<DriverTrip[]>([]);

  const load = useCallback(async () => {
    if (!user) {
      setPassengerTrips([]);
      setDriverTrips([]);
      setLoading(false);
      return;
    }
    setLoading(true);

    if (role === "passenger") {
      const { data: bookings } = await supabase
        .from("bookings")
        .select("*, rides(*)")
        .eq("passenger_id", user.id)
        .order("created_at", { ascending: false });

      const driverIds = Array.from(
        new Set(((bookings ?? []).map((b: any) => b.rides?.driver_id).filter(Boolean))),
      );
      const { data: profiles } = driverIds.length
        ? await supabase.from("profiles").select("user_id, display_name, rating, verified").in("user_id", driverIds)
        : { data: [] as ProfileLite[] };
      const pMap = new Map((profiles ?? []).map((p: any) => [p.user_id, p as ProfileLite]));

      const mapped: PassengerTrip[] = (bookings ?? []).map((b: any) => ({
        kind: "passenger",
        booking_id: b.id,
        ride_id: b.ride_id,
        from: b.rides?.from_location ?? "",
        to: b.rides?.to_location ?? "",
        date: b.rides?.ride_date ?? "",
        departTime: b.rides?.depart_time ?? "",
        arriveTime: b.rides?.arrive_time ?? "",
        duration: b.rides?.duration ?? null,
        pricePerSeat: b.rides?.price_per_seat ?? 0,
        car: b.rides?.car ?? null,
        seatsBooked: b.seats_booked,
        bookingStatus: b.status,
        paymentStatus: b.payment_status,
        cancellationReason: b.cancellation_reason,
        rideStatus: b.rides?.status ?? "active",
        driver: b.rides?.driver_id ? pMap.get(b.rides.driver_id) ?? null : null,
      }));
      setPassengerTrips(mapped);
    } else {
      const { data: rides } = await supabase
        .from("rides")
        .select("*, bookings(*)")
        .eq("driver_id", user.id)
        .order("ride_date", { ascending: false });

      const passengerIds = Array.from(
        new Set(((rides ?? []).flatMap((r: any) => (r.bookings ?? []).map((b: any) => b.passenger_id)))),
      );
      const { data: profiles } = passengerIds.length
        ? await supabase.from("profiles").select("user_id, display_name, rating, verified").in("user_id", passengerIds)
        : { data: [] as ProfileLite[] };
      const pMap = new Map((profiles ?? []).map((p: any) => [p.user_id, p as ProfileLite]));

      const mapped: DriverTrip[] = (rides ?? []).map((r: any) => {
        const passengers: DriverPassenger[] = (r.bookings ?? [])
          .filter((b: any) => b.status !== "cancelled")
          .map((b: any) => ({
            booking_id: b.id,
            name: pMap.get(b.passenger_id)?.display_name ?? "Passenger",
            seats: b.seats_booked,
            status: b.status,
          }));
        const confirmedSeats = passengers
          .filter((p) => p.status === "confirmed" || p.status === "completed")
          .reduce((s, p) => s + p.seats, 0);
        const earnings = confirmedSeats * (r.price_per_seat ?? 0);
        return {
          kind: "driver",
          ride_id: r.id,
          from: r.from_location,
          to: r.to_location,
          date: r.ride_date,
          departTime: r.depart_time,
          arriveTime: r.arrive_time,
          duration: r.duration,
          pricePerSeat: r.price_per_seat,
          car: r.car,
          seatsTotal: r.seats_total,
          seatsLeft: r.seats_left,
          rideStatus: r.status,
          cancellationReason: null,
          passengers,
          earnings,
        };
      });
      setDriverTrips(mapped);
    }
    setLoading(false);
  }, [user, role]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    loading,
    passengerTrips,
    driverTrips,
    reload: load,
    classifyBooking,
    classifyRide,
  };
};
