import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ArrowRight, Loader2, SlidersHorizontal, Wifi } from "lucide-react";
import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";
import SearchBar, { CityDataList } from "@/components/site/SearchBar";
import RideCard from "@/components/site/RideCard";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import type { Ride } from "@/data/rides";
import { format } from "date-fns";

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
  instant_book: boolean;
  status: "active" | "completed" | "cancelled";
  created_at: string;
};

type DriverProfile = {
  user_id: string;
  display_name: string | null;
  rating: number;
  trips_count: number;
  verified: boolean;
};

const initialsFor = (name: string | null | undefined) => {
  if (!name) return "D";
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
};

const toRide = (
  row: RideRow,
  driver: DriverProfile | undefined,
  seatsHeld: number,
): Ride => ({
  id: row.id,
  driver: {
    name: driver?.display_name ?? "Driver",
    rating: Number(driver?.rating ?? 5),
    trips: driver?.trips_count ?? 0,
    verified: driver?.verified ?? false,
    initials: initialsFor(driver?.display_name),
  },
  from: row.from_location,
  to: row.to_location,
  date: row.ride_date,
  departTime: row.depart_time,
  arriveTime: row.arrive_time,
  duration: row.duration ?? "—",
  pricePerSeat: row.price_per_seat,
  seatsLeft: row.seats_left,
  seatsTotal: row.seats_total,
  seatsHeld,
  car: row.car ?? "—",
  amenities: row.amenities ?? [],
  instantBook: row.instant_book,
  stops: row.stops ?? undefined,
});

const Search = () => {
  const [params] = useSearchParams();
  const from = params.get("from") ?? "Srinagar";
  const to = params.get("to") ?? "Jammu";
  const dateStr = params.get("date") ?? "";
  const seats = Number(params.get("seats") ?? 1);

  const initialDate = dateStr ? new Date(dateStr) : new Date();
  const dateKey = format(initialDate, "yyyy-MM-dd");

  const [rows, setRows] = useState<RideRow[]>([]);
  const [drivers, setDrivers] = useState<Record<string, DriverProfile>>({});
  const [loading, setLoading] = useState(true);
  const [live, setLive] = useState(false);

  const fetchDriversFor = async (driverIds: string[]) => {
    if (driverIds.length === 0) return;
    const { data } = await supabase
      .from("profiles")
      .select("user_id, display_name, rating, trips_count, verified")
      .in("user_id", driverIds);
    if (data) {
      setDrivers((prev) => {
        const next = { ...prev };
        for (const p of data as DriverProfile[]) next[p.user_id] = p;
        return next;
      });
    }
  };

  // A ride matches if the searched `from` and `to` appear (in order) in the
  // ride's full sequence: [from_location, ...stops, to_location].
  // Comparison is case-insensitive and whitespace-trimmed.
  const norm = (s: string) => s.trim().toLowerCase();
  const matchesRoute = (r: RideRow) => {
    const seq = [r.from_location, ...(r.stops ?? []), r.to_location].map(norm);
    const fi = seq.indexOf(norm(from));
    const ti = seq.indexOf(norm(to));
    return fi !== -1 && ti !== -1 && fi < ti;
  };

  const matches = (r: RideRow) =>
    r.ride_date === dateKey &&
    r.status === "active" &&
    r.seats_left >= seats &&
    matchesRoute(r);

  const load = async () => {
    setLoading(true);
    // Fetch all active rides for the date with enough seats, then match
    // origin/destination against the full route sequence (incl. stops).
    const { data, error } = await supabase
      .from("rides")
      .select("*")
      .eq("ride_date", dateKey)
      .eq("status", "active")
      .gte("seats_left", seats)
      .order("depart_time", { ascending: true });

    if (error || !data) {
      setRows([]);
      setLoading(false);
      return;
    }
    const filtered = (data as RideRow[]).filter(matchesRoute);
    setRows(filtered);
    await fetchDriversFor(Array.from(new Set(filtered.map((r) => r.driver_id))));
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to, dateKey, seats]);

  // Realtime: any new/updated ride that matches filters appears live
  useEffect(() => {
    const channel = supabase
      .channel(`search-${from}-${to}-${dateKey}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "rides" },
        async (payload) => {
          const r = payload.new as RideRow;
          if (!matches(r)) return;
          await fetchDriversFor([r.driver_id]);
          setRows((prev) =>
            prev.some((x) => x.id === r.id)
              ? prev
              : [...prev, r].sort((a, b) => a.depart_time.localeCompare(b.depart_time)),
          );
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "rides" },
        async (payload) => {
          const r = payload.new as RideRow;
          setRows((prev) => {
            const exists = prev.some((x) => x.id === r.id);
            if (matches(r)) {
              if (exists) return prev.map((x) => (x.id === r.id ? r : x));
              return [...prev, r].sort((a, b) => a.depart_time.localeCompare(b.depart_time));
            }
            return exists ? prev.filter((x) => x.id !== r.id) : prev;
          });
          if (matches(r)) await fetchDriversFor([r.driver_id]);
        },
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "rides" },
        (payload) => {
          const r = payload.old as Partial<RideRow>;
          setRows((prev) => prev.filter((x) => x.id !== r.id));
        },
      )
      .subscribe((status) => setLive(status === "SUBSCRIBED"));

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to, dateKey, seats]);

  const rides = useMemo(
    () => rows.map((r) => toRide(r, drivers[r.driver_id], r.seats_held ?? 0)),
    [rows, drivers],
  );

  return (
    <div className="min-h-screen bg-muted/20">
      <CityDataList />
      <Header />

      <section className="border-b border-border/60 bg-background">
        <div className="container py-6">
          <SearchBar variant="compact" initial={{ from, to, date: initialDate, seats }} />
        </div>
      </section>

      <section className="container grid gap-8 py-10 lg:grid-cols-[260px_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-24 rounded-3xl bg-card p-6 shadow-soft ring-1 ring-border/60">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <SlidersHorizontal className="h-4 w-4" />
              Filters
            </div>

            <FilterGroup title="Departure">
              {["Before 06:00", "06:00 — 12:00", "12:00 — 18:00", "After 18:00"].map((t) => (
                <FilterChip key={t} label={t} />
              ))}
            </FilterGroup>

            <FilterGroup title="Trust">
              <FilterChip label="Verified driver" defaultChecked />
              <FilterChip label="Instant booking" />
              <FilterChip label="4.5+ rating" defaultChecked />
            </FilterGroup>

            <FilterGroup title="Comfort">
              <FilterChip label="AC" />
              <FilterChip label="Max 2 in back" />
              <FilterChip label="Music allowed" />
            </FilterGroup>

            <Button variant="ghost" size="sm" className="mt-4 w-full">
              Reset filters
            </Button>
          </div>
        </aside>

        <div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-2xl font-bold">
                {from} <ArrowRight className="inline h-5 w-5 text-muted-foreground" /> {to}
              </h1>
              <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                {loading ? "Loading…" : `${rides.length} ride${rides.length !== 1 ? "s" : ""} available`} ·{" "}
                {seats} seat{seats !== 1 ? "s" : ""}
                {live && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[11px] font-semibold text-success">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" />
                    Live
                  </span>
                )}
              </p>
            </div>
            <select className="rounded-full border border-border bg-card px-4 py-2 text-sm font-medium shadow-soft outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <option>Earliest departure</option>
              <option>Lowest price</option>
              <option>Highest rated</option>
            </select>
          </div>

          <div className="mt-6 space-y-4">
            {loading ? (
              <div className="flex items-center justify-center rounded-3xl bg-card p-10 shadow-soft ring-1 ring-border/60">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : rides.length === 0 ? (
              <div className="rounded-3xl bg-card p-10 text-center shadow-soft ring-1 ring-border/60">
                <Wifi className="mx-auto mb-3 h-6 w-6 text-muted-foreground" />
                <p className="font-medium">No rides published yet for this route & date.</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  This page is live — new rides will appear here automatically as drivers publish them.
                </p>
              </div>
            ) : (
              rides.map((r) => <RideCard key={r.id} ride={r} />)
            )}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

const FilterGroup = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="mt-6">
    <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
      {title}
    </div>
    <div className="mt-3 flex flex-col gap-2">{children}</div>
  </div>
);

const FilterChip = ({ label, defaultChecked }: { label: string; defaultChecked?: boolean }) => (
  <label className="flex cursor-pointer items-center gap-3 rounded-xl px-2 py-1.5 text-sm hover:bg-muted">
    <input
      type="checkbox"
      defaultChecked={defaultChecked}
      className="h-4 w-4 rounded border-border accent-primary"
    />
    <span>{label}</span>
  </label>
);

export default Search;
