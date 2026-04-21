import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight, Calendar as CalendarIcon, Clock, Car, Users, Star,
  Wallet, MessageCircle, MapPin, AlertCircle, CheckCircle2,
  XCircle, TrendingUp, Sparkles, Loader2,
} from "lucide-react";
import { format } from "date-fns";
import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useTrips, type TripRole, type TripStatusFilter, type PassengerTrip, type DriverTrip } from "@/hooks/useTrips";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const statusMeta: Record<TripStatusFilter, { label: string; icon: React.ReactNode; cls: string }> = {
  upcoming: { label: "Upcoming", icon: <Clock className="h-3 w-3" />, cls: "bg-primary/10 text-primary" },
  completed: { label: "Completed", icon: <CheckCircle2 className="h-3 w-3" />, cls: "bg-success/15 text-success" },
  cancelled: { label: "Cancelled", icon: <XCircle className="h-3 w-3" />, cls: "bg-destructive/10 text-destructive" },
};

const initialsOf = (name?: string | null) => {
  if (!name) return "U";
  return name.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();
};

const Trips = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [role, setRole] = useState<TripRole>("passenger");
  const { loading, passengerTrips, driverTrips, reload, classifyBooking, classifyRide } = useTrips(user, role);

  const grouped = useMemo(() => {
    const groups: Record<TripStatusFilter, (PassengerTrip | DriverTrip)[]> = {
      upcoming: [],
      completed: [],
      cancelled: [],
    };
    if (role === "passenger") {
      passengerTrips.forEach((t) => {
        const s = classifyBooking(t.bookingStatus, t.rideStatus, t.date);
        groups[s].push(t);
      });
    } else {
      driverTrips.forEach((t) => {
        const s = classifyRide(t.rideStatus, t.date);
        groups[s].push(t);
      });
    }
    return groups;
  }, [role, passengerTrips, driverTrips, classifyBooking, classifyRide]);

  const counts = {
    upcoming: grouped.upcoming.length,
    completed: grouped.completed.length,
    cancelled: grouped.cancelled.length,
  };

  const stats = useMemo(() => {
    if (role === "passenger") {
      const completed = passengerTrips.filter((t) => classifyBooking(t.bookingStatus, t.rideStatus, t.date) === "completed");
      const totalSpent = completed.reduce((s, t) => s + t.pricePerSeat * t.seatsBooked, 0);
      return [
        { label: "Trips taken", value: String(completed.length), icon: <Car className="h-4 w-4" /> },
        { label: "Total spent", value: `₹${totalSpent.toLocaleString("en-IN")}`, icon: <Wallet className="h-4 w-4" /> },
        { label: "Upcoming", value: String(counts.upcoming), icon: <CalendarIcon className="h-4 w-4" /> },
      ];
    }
    const completed = driverTrips.filter((t) => classifyRide(t.rideStatus, t.date) === "completed");
    const totalEarnings = completed.reduce((s, t) => s + t.earnings, 0);
    return [
      { label: "Rides published", value: String(driverTrips.length), icon: <Car className="h-4 w-4" /> },
      { label: "Total earned", value: `₹${totalEarnings.toLocaleString("en-IN")}`, icon: <TrendingUp className="h-4 w-4" /> },
      { label: "Upcoming", value: String(counts.upcoming), icon: <CalendarIcon className="h-4 w-4" /> },
    ];
  }, [role, passengerTrips, driverTrips, counts.upcoming, classifyBooking, classifyRide]);

  /* ---------- actions ---------- */
  const cancelBooking = async (bookingId: string) => {
    const { error } = await supabase
      .from("bookings")
      .update({ status: "cancelled", cancellation_reason: "Cancelled by passenger" })
      .eq("id", bookingId);
    if (error) return toast.error(error.message);
    toast.success("Booking cancelled");
    reload();
  };

  const cancelRide = async (rideId: string) => {
    const { error } = await supabase.from("rides").update({ status: "cancelled" }).eq("id", rideId);
    if (error) return toast.error(error.message);
    toast.success("Ride cancelled");
    reload();
  };

  const updateBookingStatus = async (bookingId: string, status: "confirmed" | "cancelled") => {
    const { error } = await supabase.from("bookings").update({ status }).eq("id", bookingId);
    if (error) return toast.error(error.message);
    toast.success(status === "confirmed" ? "Passenger approved" : "Request declined");
    reload();
  };

  /* ---------- render ---------- */
  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-muted/20">
        <Header />
        <section className="container py-20">
          <div className="mx-auto max-w-md rounded-3xl bg-card p-10 text-center shadow-card ring-1 ring-border/60">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-primary text-primary-foreground">
              <Sparkles className="h-6 w-6" />
            </div>
            <h1 className="mt-4 font-display text-2xl font-extrabold">Sign in to see your trips</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Create an account to book rides and manage your journeys.
            </p>
            <Button onClick={() => navigate("/auth")} className="mt-6 rounded-full" size="lg">
              Sign in or sign up
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/20">
      <Header />

      {/* Hero */}
      <section className="border-b border-border/60 bg-background">
        <div className="container py-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                Your trips
              </span>
              <h1 className="mt-3 font-display text-3xl font-extrabold md:text-4xl">
                Hello, traveller 👋
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Manage your bookings and rides across the Valley.
              </p>
            </div>

            <div className="inline-flex rounded-full bg-muted p-1 ring-1 ring-border/60">
              {(["passenger", "driver"] as TripRole[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={cn(
                    "rounded-full px-5 py-2 text-sm font-semibold capitalize transition-all",
                    role === r
                      ? "bg-card text-foreground shadow-soft"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {stats.map((s) => (
              <div key={s.label} className="rounded-2xl bg-card p-5 shadow-soft ring-1 ring-border/60">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground">
                    {s.icon}
                  </span>
                  <div>
                    <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      {s.label}
                    </div>
                    <div className="font-display text-2xl font-extrabold">{s.value}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tabs + list */}
      <section className="container py-10">
        <Tabs defaultValue="upcoming">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <TabsList className="h-auto rounded-full bg-muted p-1">
              {(["upcoming", "completed", "cancelled"] as TripStatusFilter[]).map((s) => (
                <TabsTrigger
                  key={s}
                  value={s}
                  className="gap-2 rounded-full px-5 py-2 text-sm font-semibold capitalize data-[state=active]:bg-card data-[state=active]:shadow-soft"
                >
                  {s}
                  <span className="rounded-full bg-background px-2 py-0.5 text-[11px] font-bold tabular-nums text-muted-foreground">
                    {counts[s]}
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>

            {role === "driver" ? (
              <Link to="/publish/new">
                <Button className="rounded-full">
                  Publish a new ride
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <Link to="/">
                <Button variant="outline" className="rounded-full">
                  Find a ride
                </Button>
              </Link>
            )}
          </div>

          {loading ? (
            <div className="mt-10 flex justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            (["upcoming", "completed", "cancelled"] as TripStatusFilter[]).map((s) => {
              const list = grouped[s];
              return (
                <TabsContent key={s} value={s} className="mt-6 space-y-4">
                  {list.length === 0 ? (
                    <EmptyState role={role} status={s} />
                  ) : (
                    list.map((t) =>
                      t.kind === "passenger" ? (
                        <PassengerCard
                          key={t.booking_id}
                          trip={t}
                          statusFilter={s}
                          onCancel={() => cancelBooking(t.booking_id)}
                        />
                      ) : (
                        <DriverCard
                          key={t.ride_id}
                          trip={t}
                          statusFilter={s}
                          onCancel={() => cancelRide(t.ride_id)}
                          onApprove={(bid) => updateBookingStatus(bid, "confirmed")}
                          onDecline={(bid) => updateBookingStatus(bid, "cancelled")}
                        />
                      ),
                    )
                  )}
                </TabsContent>
              );
            })
          )}
        </Tabs>
      </section>

      <Footer />
    </div>
  );
};

/* ---------------- Passenger card ---------------- */

const PassengerCard = ({
  trip,
  statusFilter,
  onCancel,
}: {
  trip: PassengerTrip;
  statusFilter: TripStatusFilter;
  onCancel: () => void;
}) => {
  const meta = statusMeta[statusFilter];
  return (
    <article className={cn(
      "rounded-3xl bg-card p-6 shadow-soft ring-1 ring-border/60 transition-all",
      statusFilter === "cancelled" && "opacity-80",
    )}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarIcon className="h-4 w-4" />
          {trip.date ? format(new Date(trip.date), "EEE, dd MMM yyyy") : ""}
        </div>
        <Badge className={cn("gap-1.5 border-0", meta.cls)}>
          {meta.icon}
          {meta.label}
        </Badge>
      </div>

      <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <div>
          <div className="font-display text-2xl font-extrabold">{trip.departTime}</div>
          <div className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-3 w-3" />
            {trip.from}
          </div>
        </div>
        <div className="flex flex-col items-center text-xs text-muted-foreground">
          <div className="font-medium">{trip.duration ?? "—"}</div>
          <div className="relative my-1 h-px w-16 bg-border sm:w-24">
            <div className="absolute left-0 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-primary" />
            <div className="absolute right-0 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-secondary" />
          </div>
        </div>
        <div className="text-right">
          <div className="font-display text-2xl font-extrabold">{trip.arriveTime}</div>
          <div className="mt-0.5 flex items-center justify-end gap-1 text-sm text-muted-foreground">
            <MapPin className="h-3 w-3" />
            {trip.to}
          </div>
        </div>
      </div>

      {statusFilter === "cancelled" && trip.cancellationReason && (
        <div className="mt-5 flex items-start gap-2 rounded-2xl bg-destructive/5 p-3 text-xs text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{trip.cancellationReason}</span>
        </div>
      )}

      {trip.driver && (
        <div className="mt-5 flex items-center justify-between border-t border-border/60 pt-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-primary text-sm font-bold text-primary-foreground">
              {initialsOf(trip.driver.display_name)}
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-sm font-semibold">
                {trip.driver.display_name ?? "Driver"}
                {trip.driver.verified && (
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-success text-[10px] text-success-foreground">
                    ✓
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-0.5">
                  <Star className="h-3 w-3 fill-accent text-accent" />
                  {Number(trip.driver.rating).toFixed(2)}
                </span>
                {trip.car && (
                  <>
                    <span>·</span>
                    <span>{trip.car}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className="font-display text-lg font-extrabold">
              ₹{(trip.pricePerSeat * trip.seatsBooked).toLocaleString("en-IN")}
            </div>
            <div className="text-xs text-muted-foreground">
              {trip.seatsBooked} seat{trip.seatsBooked > 1 ? "s" : ""} ·{" "}
              <span className={cn(
                trip.paymentStatus === "paid" && "text-success",
                trip.paymentStatus === "refunded" && "text-muted-foreground",
              )}>
                {trip.paymentStatus === "paid" ? "Paid" : trip.paymentStatus === "cash" ? "Pay in cash" : "Refunded"}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-border/60 pt-5">
        {statusFilter === "upcoming" && (
          <>
            <Button size="sm" variant="outline" className="rounded-full">
              <MessageCircle className="mr-1.5 h-3.5 w-3.5" />
              Message driver
            </Button>
            <Button size="sm" variant="ghost" onClick={onCancel} className="rounded-full text-destructive hover:bg-destructive/10 hover:text-destructive">
              Cancel booking
            </Button>
          </>
        )}
        {statusFilter === "completed" && (
          <Button size="sm" variant="outline" className="rounded-full">
            <Star className="mr-1.5 h-3.5 w-3.5" />
            Rate trip
          </Button>
        )}
        <Link to={`/ride/${trip.ride_id}`} className="ml-auto">
          <Button size="sm" variant="ghost" className="rounded-full">
            View details
            <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
          </Button>
        </Link>
      </div>
    </article>
  );
};

/* ---------------- Driver card ---------------- */

const DriverCard = ({
  trip,
  statusFilter,
  onCancel,
  onApprove,
  onDecline,
}: {
  trip: DriverTrip;
  statusFilter: TripStatusFilter;
  onCancel: () => void;
  onApprove: (bookingId: string) => void;
  onDecline: (bookingId: string) => void;
}) => {
  const meta = statusMeta[statusFilter];
  const confirmedSeats = trip.passengers
    .filter((p) => p.status === "confirmed" || p.status === "completed")
    .reduce((s, p) => s + p.seats, 0);

  return (
    <article className={cn(
      "rounded-3xl bg-card p-6 shadow-soft ring-1 ring-border/60 transition-all",
      statusFilter === "cancelled" && "opacity-80",
    )}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarIcon className="h-4 w-4" />
          {trip.date ? format(new Date(trip.date), "EEE, dd MMM yyyy") : ""}
        </div>
        <Badge className={cn("gap-1.5 border-0", meta.cls)}>
          {meta.icon}
          {meta.label}
        </Badge>
      </div>

      <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <div>
          <div className="font-display text-2xl font-extrabold">{trip.departTime}</div>
          <div className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-3 w-3" />
            {trip.from}
          </div>
        </div>
        <div className="flex flex-col items-center text-xs text-muted-foreground">
          <div className="font-medium">{trip.duration ?? "—"}</div>
          <div className="relative my-1 h-px w-16 bg-border sm:w-24">
            <div className="absolute left-0 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-primary" />
            <div className="absolute right-0 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-secondary" />
          </div>
        </div>
        <div className="text-right">
          <div className="font-display text-2xl font-extrabold">{trip.arriveTime}</div>
          <div className="mt-0.5 flex items-center justify-end gap-1 text-sm text-muted-foreground">
            <MapPin className="h-3 w-3" />
            {trip.to}
          </div>
        </div>
      </div>

      <div className="mt-5 border-t border-border/60 pt-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold">
              {confirmedSeats} / {trip.seatsTotal}
            </span>
            <span className="text-muted-foreground">seats booked</span>
          </div>
          <div className="text-right">
            <div className="font-display text-lg font-extrabold text-success">
              ₹{trip.earnings.toLocaleString("en-IN")}
            </div>
            <div className="text-xs text-muted-foreground">
              {statusFilter === "completed" ? "Earned" : statusFilter === "upcoming" ? "Expected" : "—"}
            </div>
          </div>
        </div>

        {trip.passengers.length > 0 && (
          <div className="mt-4 space-y-2">
            {trip.passengers.map((p) => (
              <div
                key={p.booking_id}
                className="flex items-center justify-between rounded-xl bg-muted/40 px-3 py-2"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary/15 text-xs font-bold text-secondary">
                    {initialsOf(p.name)}
                  </div>
                  <div className="text-sm">
                    <div className="font-medium">{p.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {p.seats} seat{p.seats > 1 ? "s" : ""}
                    </div>
                  </div>
                </div>
                {p.status === "pending" ? (
                  statusFilter === "upcoming" ? (
                    <div className="flex gap-1.5">
                      <Button size="sm" variant="ghost" onClick={() => onDecline(p.booking_id)} className="h-7 rounded-full px-3 text-xs text-destructive hover:bg-destructive/10">
                        Decline
                      </Button>
                      <Button size="sm" onClick={() => onApprove(p.booking_id)} className="h-7 rounded-full px-3 text-xs">
                        Approve
                      </Button>
                    </div>
                  ) : (
                    <Badge className="bg-muted text-muted-foreground">Pending</Badge>
                  )
                ) : (
                  <Badge className="bg-success/15 text-success">Confirmed</Badge>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-border/60 pt-5">
        {statusFilter === "upcoming" && (
          <Button size="sm" variant="ghost" onClick={onCancel} className="rounded-full text-destructive hover:bg-destructive/10 hover:text-destructive">
            Cancel ride
          </Button>
        )}
        <Link to={`/ride/${trip.ride_id}`} className="ml-auto">
          <Button size="sm" variant="ghost" className="rounded-full">
            View details
            <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
          </Button>
        </Link>
      </div>
    </article>
  );
};

/* ---------------- Empty state ---------------- */

const EmptyState = ({ role, status }: { role: TripRole; status: TripStatusFilter }) => {
  const copy: Record<TripStatusFilter, { title: string; desc: string; cta: string; href: string }> = {
    upcoming: role === "passenger"
      ? { title: "No upcoming trips", desc: "Find a ride and book your next journey across the Valley.", cta: "Find a ride", href: "/" }
      : { title: "No upcoming rides", desc: "Publish a ride and start earning from your empty seats.", cta: "Publish a ride", href: "/publish/new" },
    completed: { title: "Nothing here yet", desc: "Your completed trips will show up here.", cta: role === "passenger" ? "Find a ride" : "Publish a ride", href: role === "passenger" ? "/" : "/publish/new" },
    cancelled: { title: "No cancellations", desc: "Cancelled trips will appear here.", cta: "Back to upcoming", href: "/trips" },
  };
  const c = copy[status];
  return (
    <div className="rounded-3xl border border-dashed border-border bg-card/60 p-12 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
        <Car className="h-6 w-6" />
      </div>
      <h3 className="mt-4 font-display text-lg font-bold">{c.title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{c.desc}</p>
      <Link to={c.href} className="mt-5 inline-block">
        <Button className="rounded-full">{c.cta}</Button>
      </Link>
    </div>
  );
};

export default Trips;
