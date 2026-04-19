import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { ArrowRight, SlidersHorizontal } from "lucide-react";
import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";
import SearchBar, { CityDataList } from "@/components/site/SearchBar";
import RideCard from "@/components/site/RideCard";
import { Button } from "@/components/ui/button";
import { MOCK_RIDES } from "@/data/rides";

const Search = () => {
  const [params] = useSearchParams();
  const from = params.get("from") ?? "Srinagar";
  const to = params.get("to") ?? "Jammu";
  const dateStr = params.get("date") ?? "";
  const seats = Number(params.get("seats") ?? 1);

  const rides = useMemo(() => {
    // For demo, just adapt the from/to of mock rides
    return MOCK_RIDES.map((r) => ({ ...r, from, to })).filter((r) => r.seatsLeft >= seats);
  }, [from, to, seats]);

  const initialDate = dateStr ? new Date(dateStr) : new Date();

  return (
    <div className="min-h-screen bg-muted/20">
      <CityDataList />
      <Header />

      {/* Search bar bar */}
      <section className="border-b border-border/60 bg-background">
        <div className="container py-6">
          <SearchBar variant="compact" initial={{ from, to, date: initialDate, seats }} />
        </div>
      </section>

      <section className="container grid gap-8 py-10 lg:grid-cols-[260px_1fr]">
        {/* Filters */}
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

        {/* Results */}
        <div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-2xl font-bold">
                {from} <ArrowRight className="inline h-5 w-5 text-muted-foreground" /> {to}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {rides.length} ride{rides.length !== 1 ? "s" : ""} available · {seats} seat{seats !== 1 ? "s" : ""}
              </p>
            </div>
            <select className="rounded-full border border-border bg-card px-4 py-2 text-sm font-medium shadow-soft outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <option>Best match</option>
              <option>Earliest departure</option>
              <option>Lowest price</option>
              <option>Highest rated</option>
            </select>
          </div>

          <div className="mt-6 space-y-4">
            {rides.length === 0 ? (
              <div className="rounded-3xl bg-card p-10 text-center shadow-soft ring-1 ring-border/60">
                <p className="text-muted-foreground">
                  No rides match your filters. Try a different date or fewer seats.
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
