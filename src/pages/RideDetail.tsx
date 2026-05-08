import { useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Star, ShieldCheck, Zap, MapPin, Clock, Car, Music2, Wifi, Snowflake,
  MessageCircle, ChevronLeft, Loader2, CheckCircle2, XCircle, AlertCircle,
  Navigation, Power, Users, Phone, MessageSquare,
} from "lucide-react";
import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import RideChat from "@/components/site/RideChat";
import LiveMap from "@/components/site/LiveMap";
import DriverContactSettings from "@/components/site/DriverContactSettings";
import {
  useShareDriverLocation,
  useLiveDriverLocation,
} from "@/hooks/useDriverLocation";

type RideRow = {
  id: string;
  driver_id: string;
  from_location: string;
  to_location: string;
  ride_date: string;
  depart_time: string;
  arrive_time: string;
  duration: string | null;
  price_per_seat: number;
  seats_total: number;
  seats_left: number;
  seats_held: number;
  car: string | null;
  stops: string[] | null;
  amenities: string[] | null;
  rules: Record<string, unknown> | null;
  instant_book: boolean;
  status: "active" | "completed" | "cancelled";
};

type DriverProfile = {
  user_id: string;
  display_name: string | null;
  rating: number;
  trips_count: number;
  verified: boolean;
  phone: string | null;
  share_phone: boolean;
};

type BookingRow = {
  id: string;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  seats_booked: number;
  payment_status: "paid" | "cash" | "refunded";
};

type RideStop = {
  id: string;
  name: string;
  stop_order: number;
  price_from_origin: number;
};

type Passenger = {
  passenger_id: string;
  status: BookingRow["status"];
  seats_booked: number;
  display_name: string | null;
  gender: "male" | "female" | "other" | "prefer_not_to_say" | null;
};

const initialsFor = (name: string | null | undefined) => {
  if (!name) return "U";
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
};

const genderLabel = (g: Passenger["gender"]) => {
  switch (g) {
    case "female": return "Female";
    case "male": return "Male";
    case "other": return "Other";
    case "prefer_not_to_say": return "Prefers not to say";
    default: return "Not set";
  }
};

const formatRules = (rules: Record<string, unknown> | null): string[] => {
  if (!rules) return [];
  const out: string[] = [];
  for (const [k, v] of Object.entries(rules)) {
    if (typeof v === "boolean") {
      out.push(`${v ? "✓" : "✗"} ${k.replace(/_/g, " ")}`);
    } else {
      out.push(`${k.replace(/_/g, " ")}: ${String(v)}`);
    }
  }
  return out;
};

const RideDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [ride, setRide] = useState<RideRow | null>(null);
  const [driver, setDriver] = useState<DriverProfile | null>(null);
  const [myBooking, setMyBooking] = useState<BookingRow | null>(null);
  const [booking, setBooking] = useState(false);
  const [stops, setStops] = useState<RideStop[]>([]);
  const [passengers, setPassengers] = useState<Passenger[]>([]);

  const isOwnRide = !!user && !!ride && user.id === ride.driver_id;

  // Live location: driver shares, everyone with access reads
  const liveLocation = useLiveDriverLocation(ride?.id ?? null);
  const { sharing, start: startSharing, stop: stopSharing } = useShareDriverLocation(
    ride?.id ?? null,
    user?.id ?? null,
  );

  const load = async () => {
    if (!id) return;
    setLoading(true);

    const { data: rideData, error: rideErr } = await supabase
      .from("rides")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (rideErr || !rideData) {
      setRide(null);
      setLoading(false);
      return;
    }
    setRide(rideData as RideRow);

    const [{ data: profileData }, { data: stopsData }] = await Promise.all([
      supabase
        .from("profiles")
        .select("user_id, display_name, rating, trips_count, verified, phone, share_phone")
        .eq("user_id", rideData.driver_id)
        .maybeSingle(),
      supabase
        .from("ride_stops")
        .select("id, name, stop_order, price_from_origin")
        .eq("ride_id", id)
        .order("stop_order", { ascending: true }),
    ]);
    setDriver(profileData as DriverProfile | null);
    setStops((stopsData ?? []) as RideStop[]);

    if (user) {
      const { data: bookingData } = await supabase
        .from("bookings")
        .select("id, status, seats_booked, payment_status")
        .eq("ride_id", id)
        .eq("passenger_id", user.id)
        .maybeSingle();
      setMyBooking(bookingData as BookingRow | null);
    } else {
      setMyBooking(null);
    }

    setLoading(false);
  };

  // Load passengers (with gender). Visible to driver always; passengers see fellow riders.
  const loadPassengers = async (rideId: string) => {
    const { data: bookings } = await supabase
      .from("bookings")
      .select("passenger_id, status, seats_booked")
      .eq("ride_id", rideId)
      .neq("status", "cancelled");
    if (!bookings || bookings.length === 0) {
      setPassengers([]);
      return;
    }
    const ids = Array.from(new Set(bookings.map((b) => b.passenger_id)));
    const { data: profs } = await supabase
      .from("profiles")
      .select("user_id, display_name, gender")
      .in("user_id", ids);
    const profMap = new Map((profs ?? []).map((p: any) => [p.user_id, p]));
    setPassengers(
      bookings.map((b: any) => {
        const p = profMap.get(b.passenger_id) as any;
        return {
          passenger_id: b.passenger_id,
          status: b.status,
          seats_booked: b.seats_booked,
          display_name: p?.display_name ?? null,
          gender: p?.gender ?? null,
        };
      }),
    );
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user?.id]);

  useEffect(() => {
    if (ride?.id) loadPassengers(ride.id);
  }, [ride?.id]);

  // Realtime: subscribe to ride changes (seats_left, status) and bookings on this ride
  useEffect(() => {
    if (!ride?.id) return;
    const channel = supabase
      .channel(`ride-${ride.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "rides", filter: `id=eq.${ride.id}` },
        (payload) => {
          setRide((prev) => (prev ? { ...prev, ...(payload.new as RideRow) } : prev));
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bookings", filter: `ride_id=eq.${ride.id}` },
        () => loadPassengers(ride.id),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "ride_stops", filter: `ride_id=eq.${ride.id}` },
        async () => {
          const { data } = await supabase
            .from("ride_stops")
            .select("id, name, stop_order, price_from_origin")
            .eq("ride_id", ride.id)
            .order("stop_order", { ascending: true });
          setStops((data ?? []) as RideStop[]);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [ride?.id]);

  const ruleList = useMemo(() => formatRules(ride?.rules ?? null), [ride?.rules]);

  const handleBook = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }
    if (!ride) return;
    if (ride.seats_left < 1) {
      toast.error("No seats left on this ride");
      return;
    }
    setBooking(true);
    const { data, error } = await supabase
      .from("bookings")
      .insert({
        ride_id: ride.id,
        passenger_id: user.id,
        seats_booked: 1,
        status: ride.instant_book ? "confirmed" : "pending",
      })
      .select("id, status, seats_booked, payment_status")
      .maybeSingle();
    setBooking(false);

    if (error || !data) {
      toast.error(error?.message ?? "Could not book this seat");
      return;
    }
    setMyBooking(data as BookingRow);
    toast.success(
      ride.instant_book ? "Seat confirmed! See it in My trips." : "Request sent to driver",
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/20">
        <Header />
        <div className="container flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!ride) {
    return (
      <div className="min-h-screen bg-muted/20">
        <Header />
        <div className="container py-20 text-center">
          <h1 className="font-display text-2xl font-bold">Ride not found</h1>
          <p className="mt-2 text-muted-foreground">
            This ride may have been cancelled or removed.
          </p>
          <Button asChild className="mt-6 rounded-full">
            <Link to="/search">Browse rides</Link>
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  const driverName = driver?.display_name ?? "Driver";
  const amenities = ride.amenities ?? [];
  const canSeeLive = isOwnRide || (myBooking && myBooking.status !== "cancelled");

  return (
    <div className="min-h-screen bg-muted/20">
      <Header />

      <div className="container py-8">
        <Link to="/search" className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-4 w-4" />
          Back to results
        </Link>

        <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_360px]">
          {/* Main */}
          <div className="space-y-6">
            {/* Header card */}
            <div className="rounded-3xl bg-card p-8 shadow-card ring-1 ring-border/60">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                {ride.from_location} → {ride.to_location} ·{" "}
                {new Date(ride.ride_date).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
              </div>

              <div className="mt-6 grid grid-cols-[1fr_auto_1fr] items-center gap-6">
                <div>
                  <div className="font-display text-3xl font-extrabold md:text-4xl">{ride.depart_time}</div>
                  <div className="mt-1 text-sm text-muted-foreground">{ride.from_location}</div>
                </div>
                <div className="flex flex-col items-center text-xs text-muted-foreground">
                  <Clock className="mb-1 h-4 w-4" />
                  {ride.duration ?? "—"}
                </div>
                <div className="text-right">
                  <div className="font-display text-3xl font-extrabold md:text-4xl">{ride.arrive_time}</div>
                  <div className="mt-1 text-sm text-muted-foreground">{ride.to_location}</div>
                </div>
              </div>

              {/* Stops with per-stop fares */}
              {stops.length > 0 && (
                <div className="mt-8 border-t border-border/60 pt-6">
                  <h3 className="mb-4 text-sm font-semibold">Stops & fares from {ride.from_location}</h3>
                  <ol className="relative ml-2 space-y-4 border-l-2 border-dashed border-border pl-6">
                    <li className="relative">
                      <span className="absolute -left-[31px] top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary ring-4 ring-background" />
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-semibold">{ride.from_location}</div>
                        <div className="font-display text-sm font-bold text-muted-foreground tabular-nums">₹0</div>
                      </div>
                      <div className="text-xs text-muted-foreground">Pickup</div>
                    </li>
                    {stops.map((s, i) => {
                      const isLast = i === stops.length - 1;
                      return (
                        <li key={s.id} className="relative">
                          <span className={`absolute -left-[31px] top-1 flex h-5 w-5 items-center justify-center rounded-full ring-4 ring-background ${
                            isLast ? "bg-secondary" : "bg-muted-foreground/40"
                          }`} />
                          <div className="flex items-center justify-between">
                            <div className="text-sm font-medium">{s.name}</div>
                            <div className="font-display text-sm font-bold tabular-nums">₹{s.price_from_origin}</div>
                          </div>
                          <div className="text-xs text-muted-foreground">{isLast ? "Drop-off" : "Stop"}</div>
                        </li>
                      );
                    })}
                  </ol>
                </div>
              )}

              {/* Rules */}
              {ruleList.length > 0 && (
                <div className="mt-8 border-t border-border/60 pt-6">
                  <h3 className="mb-4 text-sm font-semibold">Ride rules</h3>
                  <ul className="grid gap-2 sm:grid-cols-2">
                    {ruleList.map((r) => (
                      <li
                        key={r}
                        className="flex items-center gap-2 rounded-xl bg-muted/40 px-3 py-2 text-sm capitalize"
                      >
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Driver */}
            <div className="rounded-3xl bg-card p-8 shadow-soft ring-1 ring-border/60">
              <h3 className="mb-5 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Your driver
              </h3>
              <div className="flex items-center gap-5">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-primary text-xl font-bold text-primary-foreground shadow-soft">
                  {initialsFor(driverName)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div className="font-display text-lg font-bold">{driverName}</div>
                    {driver?.verified && (
                      <Badge className="gap-1 bg-success/15 text-success hover:bg-success/20">
                        <ShieldCheck className="h-3 w-3" />
                        Verified
                      </Badge>
                    )}
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-accent text-accent" />
                      {(driver?.rating ?? 5).toFixed(2)}
                    </span>
                    <span>{driver?.trips_count ?? 0} completed trips</span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {canSeeLive ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full"
                      onClick={() => {
                        document
                          .getElementById("ride-chat")
                          ?.scrollIntoView({ behavior: "smooth", block: "start" });
                      }}
                    >
                      <MessageCircle className="mr-2 h-4 w-4" />
                      {isOwnRide ? "Open chat" : `Message ${driverName.split(" ")[0]}`}
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full"
                      disabled
                      title="Book a seat to start chatting with the driver"
                    >
                      <MessageCircle className="mr-2 h-4 w-4" />
                      Message
                    </Button>
                  )}

                  {/* Call button: visible to passengers with a non-cancelled booking, when driver opted in */}
                  {!isOwnRide && myBooking?.status === "confirmed" && driver?.share_phone && driver?.phone && (
                    <>
                      <Button
                        asChild
                        size="sm"
                        className="rounded-full bg-success text-success-foreground hover:bg-success/90"
                      >
                        <a href={`tel:${driver.phone.replace(/[^\d+]/g, "")}`}>
                          <Phone className="mr-2 h-4 w-4" />
                          Call
                        </a>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-full"
                        onClick={() => {
                          document
                            .getElementById("ride-chat")
                            ?.scrollIntoView({ behavior: "smooth", block: "start" });
                        }}
                      >
                        <MessageSquare className="mr-2 h-4 w-4" />
                        In-app message
                      </Button>
                    </>
                  )}
                </div>
              </div>

              <div className="mt-6 grid gap-3 border-t border-border/60 pt-6 sm:grid-cols-2">
                <Info icon={<Car className="h-4 w-4" />} label="Vehicle" value={ride.car ?? "—"} />
                <Info icon={<Snowflake className="h-4 w-4" />} label="AC" value={amenities.includes("AC") ? "Yes" : "No"} />
                <Info icon={<Music2 className="h-4 w-4" />} label="Music" value={amenities.includes("Music") ? "Yes" : "On request"} />
                <Info icon={<Wifi className="h-4 w-4" />} label="Wi-Fi" value={amenities.includes("Wi-Fi") ? "Yes" : "No"} />
              </div>
            </div>

            {/* Passengers list with gender — visible to driver and confirmed riders */}
            {canSeeLive && passengers.length > 0 && (
              <div className="rounded-3xl bg-card p-8 shadow-soft ring-1 ring-border/60">
                <h3 className="mb-5 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  <Users className="h-4 w-4" />
                  Passengers ({passengers.length})
                </h3>
                <ul className="space-y-3">
                  {passengers.map((p) => (
                    <li
                      key={p.passenger_id}
                      className="flex items-center justify-between rounded-2xl bg-muted/40 px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-primary text-sm font-bold text-primary-foreground">
                          {initialsFor(p.display_name)}
                        </div>
                        <div>
                          <div className="text-sm font-semibold">
                            {p.display_name ?? "Passenger"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {genderLabel(p.gender)} · {p.seats_booked} seat{p.seats_booked > 1 ? "s" : ""}
                          </div>
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          p.status === "confirmed"
                            ? "border-success/40 bg-success/10 text-success"
                            : "border-accent/40 bg-accent/10 text-accent"
                        }
                      >
                        {p.status}
                      </Badge>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Live location: visible to driver and confirmed riders */}
            {canSeeLive && (
              <>
                {isOwnRide && (
                  <div className="rounded-3xl bg-card p-6 shadow-soft ring-1 ring-border/60">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 text-sm font-semibold">
                          <Navigation className="h-4 w-4 text-primary" />
                          Share your live location
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Passengers will see your real-time GPS while you drive. Updates every ~5 seconds.
                        </p>
                      </div>
                      <Button
                        onClick={sharing ? stopSharing : startSharing}
                        variant={sharing ? "destructive" : "default"}
                        className="rounded-full"
                      >
                        <Power className="mr-2 h-4 w-4" />
                        {sharing ? "Stop" : "Start"}
                      </Button>
                    </div>
                  </div>
                )}
                <LiveMap location={liveLocation} driverName={driverName} />
              </>
            )}

            {/* Driver-only: phone sharing settings */}
            {isOwnRide && <DriverContactSettings onSaved={load} />}

            {/* Chat: visible to driver and to passengers with an active booking */}
            {user && canSeeLive && (
              <div id="ride-chat">
                <RideChat
                  rideId={ride.id}
                  driverId={ride.driver_id}
                  driverName={driverName}
                  active={
                    ride.status === "active" &&
                    (isOwnRide || (myBooking?.status !== "cancelled"))
                  }
                />
              </div>
            )}

            {/* Hint for not-yet-booked viewers */}
            {user && !canSeeLive && !isOwnRide && (
              <div className="rounded-3xl border border-dashed border-border/60 bg-card p-6 text-center shadow-soft">
                <MessageCircle className="mx-auto mb-2 h-5 w-5 text-muted-foreground" />
                <div className="text-sm font-semibold">Chat with {driverName.split(" ")[0]}</div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Book a seat (or send a request) and a private chat with the driver opens here instantly.
                </p>
              </div>
            )}
          </div>

          {/* Sticky booking */}
          <aside>
            <div className="sticky top-24 rounded-3xl bg-card p-6 shadow-elevated ring-1 ring-border/60">
              <div className="flex items-baseline justify-between">
                <div>
                  <div className="font-display text-3xl font-extrabold">₹{ride.price_per_seat}</div>
                  <div className="text-xs text-muted-foreground">full fare</div>
                </div>
                {ride.instant_book && (
                  <Badge className="gap-1 bg-accent/15 text-accent hover:bg-accent/20">
                    <Zap className="h-3 w-3 fill-accent" />
                    Instant
                  </Badge>
                )}
              </div>

              <div className="mt-6 space-y-3 border-y border-border/60 py-5 text-sm">
                <Row
                  label="Seats available"
                  value={`${ride.seats_left} / ${ride.seats_total}`}
                  highlight={ride.seats_left === 0}
                />
                {(() => {
                  const held = ride.seats_held ?? 0;
                  const confirmed = Math.max(0, ride.seats_total - ride.seats_left - held);
                  return (
                    <>
                      <Row
                        label="Booked (confirmed)"
                        value={`${confirmed} ${confirmed === 1 ? "passenger" : "passengers"}`}
                        muted
                      />
                      {held > 0 && (
                        <Row
                          label="Held (awaiting approval)"
                          value={`${held} ${held === 1 ? "seat" : "seats"}`}
                          accent
                        />
                      )}
                    </>
                  );
                })()}
                <Row label="Service fee" value="₹0" muted />
                <Row label="You pay" value={`₹${ride.price_per_seat}`} bold />
              </div>

              {/* Booking state */}
              {ride.status !== "active" ? (
                <div className="mt-5 rounded-2xl bg-muted/60 p-4 text-center text-sm text-muted-foreground">
                  This ride is {ride.status}.
                </div>
              ) : isOwnRide ? (
                <div className="mt-5 rounded-2xl bg-muted/60 p-4 text-center text-sm text-muted-foreground">
                  This is your published ride. Manage it from{" "}
                  <Link to="/trips" className="font-semibold text-foreground underline">
                    My trips
                  </Link>
                  .
                </div>
              ) : myBooking ? (
                <BookingStatusCard status={myBooking.status} />
              ) : (
                <Button
                  onClick={handleBook}
                  disabled={booking || ride.seats_left < 1}
                  className="mt-5 w-full rounded-full bg-accent text-accent-foreground shadow-glow hover:bg-accent/90"
                  size="lg"
                >
                  {booking ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Booking...
                    </>
                  ) : ride.seats_left < 1 ? (
                    "Sold out"
                  ) : ride.instant_book ? (
                    "Book this seat"
                  ) : (
                    "Request to book"
                  )}
                </Button>
              )}

              <p className="mt-3 text-center text-xs text-muted-foreground">
                Free cancellation up to 2 hours before departure
              </p>
            </div>
          </aside>
        </div>
      </div>

      <Footer />
    </div>
  );
};

const BookingStatusCard = ({
  status,
}: {
  status: "pending" | "confirmed" | "cancelled" | "completed";
}) => {
  const cfg = {
    pending: {
      icon: <AlertCircle className="h-5 w-5" />,
      label: "Awaiting driver approval",
      className: "bg-accent/15 text-accent",
    },
    confirmed: {
      icon: <CheckCircle2 className="h-5 w-5" />,
      label: "Booking confirmed",
      className: "bg-success/15 text-success",
    },
    cancelled: {
      icon: <XCircle className="h-5 w-5" />,
      label: "Booking cancelled",
      className: "bg-destructive/15 text-destructive",
    },
    completed: {
      icon: <CheckCircle2 className="h-5 w-5" />,
      label: "Trip completed",
      className: "bg-muted text-foreground",
    },
  }[status];

  return (
    <div className={`mt-5 flex items-center justify-center gap-2 rounded-2xl p-4 text-sm font-semibold ${cfg.className}`}>
      {cfg.icon}
      {cfg.label}
    </div>
  );
};

const Info = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="flex items-center gap-3 rounded-xl bg-muted/40 p-3">
    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-background text-primary">
      {icon}
    </span>
    <div>
      <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-sm font-semibold">{value}</div>
    </div>
  </div>
);

const Row = ({
  label, value, muted, bold, highlight,
}: { label: string; value: string; muted?: boolean; bold?: boolean; highlight?: boolean }) => (
  <div className="flex items-center justify-between">
    <span className={muted ? "text-muted-foreground" : ""}>{label}</span>
    <span
      className={
        highlight
          ? "font-display text-lg font-bold text-destructive"
          : bold
            ? "font-display text-lg font-bold"
            : "font-semibold"
      }
    >
      {value}
    </span>
  </div>
);

export default RideDetail;
