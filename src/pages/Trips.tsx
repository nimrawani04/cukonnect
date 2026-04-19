import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight, Calendar as CalendarIcon, Clock, Car, Users, Star, ShieldCheck,
  Wallet, MessageCircle, MoreHorizontal, MapPin, AlertCircle, CheckCircle2,
  XCircle, TrendingUp, Sparkles,
} from "lucide-react";
import { format } from "date-fns";
import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { MOCK_TRIPS, type Trip, type TripRole, type TripStatus } from "@/data/trips";

const statusMeta: Record<TripStatus, { label: string; icon: React.ReactNode; cls: string }> = {
  upcoming: { label: "Upcoming", icon: <Clock className="h-3 w-3" />, cls: "bg-primary/10 text-primary" },
  completed: { label: "Completed", icon: <CheckCircle2 className="h-3 w-3" />, cls: "bg-success/15 text-success" },
  cancelled: { label: "Cancelled", icon: <XCircle className="h-3 w-3" />, cls: "bg-destructive/10 text-destructive" },
};

const Trips = () => {
  const [role, setRole] = useState<TripRole>("passenger");

  const trips = useMemo(() => MOCK_TRIPS.filter((t) => t.role === role), [role]);

  const counts = useMemo(() => ({
    upcoming: trips.filter((t) => t.status === "upcoming").length,
    completed: trips.filter((t) => t.status === "completed").length,
    cancelled: trips.filter((t) => t.status === "cancelled").length,
  }), [trips]);

  const stats = useMemo(() => {
    if (role === "passenger") {
      const completed = trips.filter((t) => t.status === "completed");
      const totalSpent = completed.reduce((s, t) => s + (t.pricePerSeat * (t.seatsBooked ?? 1)), 0);
      return [
        { label: "Trips taken", value: String(completed.length), icon: <Car className="h-4 w-4" /> },
        { label: "Total spent", value: `₹${totalSpent}`, icon: <Wallet className="h-4 w-4" /> },
        { label: "Upcoming", value: String(counts.upcoming), icon: <CalendarIcon className="h-4 w-4" /> },
      ];
    }
    const completed = trips.filter((t) => t.status === "completed");
    const totalEarnings = completed.reduce((s, t) => s + (t.earnings ?? 0), 0);
    return [
      { label: "Rides published", value: String(trips.length), icon: <Car className="h-4 w-4" /> },
      { label: "Total earned", value: `₹${totalEarnings}`, icon: <TrendingUp className="h-4 w-4" /> },
      { label: "Upcoming", value: String(counts.upcoming), icon: <CalendarIcon className="h-4 w-4" /> },
    ];
  }, [trips, role, counts]);

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

            {/* Role switcher */}
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

          {/* Stats */}
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
              {(["upcoming", "completed", "cancelled"] as TripStatus[]).map((s) => (
                <TabsTrigger
                  key={s}
                  value={s}
                  className="gap-2 rounded-full px-5 py-2 text-sm font-semibold capitalize data-[state=active]:bg-card data-[state=active]:shadow-soft"
                >
                  {s}
                  <span className={cn(
                    "rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums",
                    "bg-background text-muted-foreground",
                  )}>
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

          {(["upcoming", "completed", "cancelled"] as TripStatus[]).map((s) => {
            const list = trips.filter((t) => t.status === s);
            return (
              <TabsContent key={s} value={s} className="mt-6 space-y-4">
                {list.length === 0 ? (
                  <EmptyState role={role} status={s} />
                ) : (
                  list.map((t) => <TripCard key={t.id} trip={t} />)
                )}
              </TabsContent>
            );
          })}
        </Tabs>
      </section>

      <Footer />
    </div>
  );
};

/* ---------------- Trip card ---------------- */

const TripCard = ({ trip }: { trip: Trip }) => {
  const meta = statusMeta[trip.status];
  const isPassenger = trip.role === "passenger";
  const isCancelled = trip.status === "cancelled";
  const isUpcoming = trip.status === "upcoming";

  return (
    <article className={cn(
      "rounded-3xl bg-card p-6 shadow-soft ring-1 ring-border/60 transition-all",
      isCancelled && "opacity-80",
    )}>
      {/* Top row: date + status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarIcon className="h-4 w-4" />
          {format(new Date(trip.date), "EEE, dd MMM yyyy")}
        </div>
        <Badge className={cn("gap-1.5 border-0", meta.cls)}>
          {meta.icon}
          {meta.label}
        </Badge>
      </div>

      {/* Route */}
      <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <div>
          <div className="font-display text-2xl font-extrabold">{trip.departTime}</div>
          <div className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-3 w-3" />
            {trip.from}
          </div>
        </div>
        <div className="flex flex-col items-center text-xs text-muted-foreground">
          <div className="font-medium">{trip.duration}</div>
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

      {/* Cancellation reason */}
      {isCancelled && trip.cancellationReason && (
        <div className="mt-5 flex items-start gap-2 rounded-2xl bg-destructive/5 p-3 text-xs text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{trip.cancellationReason}</span>
        </div>
      )}

      {/* Body: passenger view */}
      {isPassenger && trip.driver && (
        <div className="mt-5 flex items-center justify-between border-t border-border/60 pt-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-primary text-sm font-bold text-primary-foreground">
              {trip.driver.initials}
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-sm font-semibold">
                {trip.driver.name}
                {trip.driver.verified && (
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-success text-[10px] text-success-foreground">
                    ✓
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-0.5">
                  <Star className="h-3 w-3 fill-accent text-accent" />
                  {trip.driver.rating.toFixed(2)}
                </span>
                <span>·</span>
                <span>{trip.car}</span>
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className="font-display text-lg font-extrabold">
              ₹{(trip.pricePerSeat * (trip.seatsBooked ?? 1)).toLocaleString("en-IN")}
            </div>
            <div className="text-xs text-muted-foreground">
              {trip.seatsBooked} seat{(trip.seatsBooked ?? 0) > 1 ? "s" : ""} ·{" "}
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

      {/* Body: driver view */}
      {!isPassenger && (
        <div className="mt-5 border-t border-border/60 pt-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="font-semibold">
                {(trip.passengers?.reduce((s, p) => s + p.seats, 0) ?? 0)} / {trip.seatsTotal}
              </span>
              <span className="text-muted-foreground">seats booked</span>
            </div>
            <div className="text-right">
              <div className="font-display text-lg font-extrabold text-success">
                ₹{(trip.earnings ?? 0).toLocaleString("en-IN")}
              </div>
              <div className="text-xs text-muted-foreground">
                {trip.status === "completed" ? "Earned" : trip.status === "upcoming" ? "Expected" : "—"}
              </div>
            </div>
          </div>

          {trip.passengers && trip.passengers.length > 0 && (
            <div className="mt-4 space-y-2">
              {trip.passengers.map((p, i) => (
                <div
                  key={`${p.name}-${i}`}
                  className="flex items-center justify-between rounded-xl bg-muted/40 px-3 py-2"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary/15 text-xs font-bold text-secondary">
                      {p.initials}
                    </div>
                    <div className="text-sm">
                      <div className="font-medium">{p.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {p.seats} seat{p.seats > 1 ? "s" : ""}
                      </div>
                    </div>
                  </div>
                  {p.status === "pending" ? (
                    isUpcoming ? (
                      <div className="flex gap-1.5">
                        <Button size="sm" variant="ghost" className="h-7 rounded-full px-3 text-xs text-destructive hover:bg-destructive/10">
                          Decline
                        </Button>
                        <Button size="sm" className="h-7 rounded-full px-3 text-xs">
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
      )}

      {/* Actions */}
      <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-border/60 pt-5">
        {isUpcoming && isPassenger && (
          <>
            <Button size="sm" variant="outline" className="rounded-full">
              <MessageCircle className="mr-1.5 h-3.5 w-3.5" />
              Message driver
            </Button>
            <Button size="sm" variant="ghost" className="rounded-full text-destructive hover:bg-destructive/10 hover:text-destructive">
              Cancel booking
            </Button>
          </>
        )}
        {isUpcoming && !isPassenger && (
          <>
            <Button size="sm" variant="outline" className="rounded-full">
              Edit ride
            </Button>
            <Button size="sm" variant="ghost" className="rounded-full text-destructive hover:bg-destructive/10 hover:text-destructive">
              Cancel ride
            </Button>
          </>
        )}
        {trip.status === "completed" && isPassenger && (
          <Button size="sm" variant="outline" className="rounded-full">
            <Star className="mr-1.5 h-3.5 w-3.5" />
            Rate trip
          </Button>
        )}
        {trip.status === "completed" && !isPassenger && (
          <Button size="sm" variant="outline" className="rounded-full">
            View receipts
          </Button>
        )}
        <Link to={`/ride/r1`} className="ml-auto">
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

const EmptyState = ({ role, status }: { role: TripRole; status: TripStatus }) => {
  const copy: Record<TripStatus, { title: string; desc: string; cta: string; href: string }> = {
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
