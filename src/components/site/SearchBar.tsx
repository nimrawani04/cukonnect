import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRightLeft, Calendar as CalendarIcon, MapPin, Users, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const KASHMIR_CITIES = [
  "Srinagar", "Jammu", "Baramulla", "Sopore", "Anantnag",
  "Kupwara", "Ganderbal", "Pulwama", "Kulgam", "Budgam",
  "Pahalgam", "Gulmarg", "Sonamarg", "Tulmulla", "TRC", "Airport (SXR)",
];

// Common Kashmir carpooling corridors used as quick-pick chips
// across the Search bar and the Publish Ride form.
export const KASHMIR_QUICK_ROUTES: { from: string; to: string }[] = [
  { from: "Srinagar", to: "Jammu" },
  { from: "Srinagar", to: "Baramulla" },
  { from: "Srinagar", to: "Sopore" },
  { from: "Srinagar", to: "Kupwara" },
  { from: "Srinagar", to: "Anantnag" },
  { from: "Srinagar", to: "Ganderbal" },
  { from: "Tulmulla", to: "TRC" },
  { from: "TRC", to: "Tulmulla" },
];

type Props = {
  variant?: "hero" | "compact";
  initial?: { from?: string; to?: string; date?: Date; seats?: number };
};

const SearchBar = ({ variant = "hero", initial }: Props) => {
  const navigate = useNavigate();
  const [from, setFrom] = useState(initial?.from ?? "Srinagar");
  const [to, setTo] = useState(initial?.to ?? "Jammu");
  const [date, setDate] = useState<Date | undefined>(initial?.date ?? new Date());
  const [seats, setSeats] = useState(initial?.seats ?? 1);

  const swap = () => {
    setFrom(to);
    setTo(from);
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams({
      from, to, seats: String(seats),
      date: date ? format(date, "yyyy-MM-dd") : "",
    });
    navigate(`/search?${params.toString()}`);
  };

  return (
    <form
      onSubmit={onSubmit}
      className={cn(
        "rounded-3xl bg-card shadow-elevated ring-1 ring-border/60",
        variant === "hero" ? "p-3" : "p-2"
      )}
    >
      <div className="grid grid-cols-1 gap-2 md:grid-cols-[1fr_auto_1fr_1fr_auto_auto]">
        {/* From */}
        <Field icon={<MapPin className="h-4 w-4 text-primary" />} label="From">
          <CityInput value={from} onChange={setFrom} placeholder="Leaving from" />
        </Field>

        {/* Swap */}
        <button
          type="button"
          onClick={swap}
          className="hidden items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-all hover:rotate-180 hover:bg-muted hover:text-foreground md:flex"
          aria-label="Swap"
        >
          <ArrowRightLeft className="h-4 w-4" />
        </button>

        {/* To */}
        <Field icon={<MapPin className="h-4 w-4 text-secondary" />} label="To">
          <CityInput value={to} onChange={setTo} placeholder="Going to" />
        </Field>

        {/* Date */}
        <Field icon={<CalendarIcon className="h-4 w-4 text-primary" />} label="Date">
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="w-full text-left text-sm font-medium outline-none"
              >
                {date ? format(date, "EEE, dd MMM") : "Pick a date"}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </Field>

        {/* Seats */}
        <Field icon={<Users className="h-4 w-4 text-primary" />} label="Seats">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSeats(Math.max(1, seats - 1))}
              className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-muted-foreground hover:text-foreground"
            >
              −
            </button>
            <span className="text-sm font-semibold tabular-nums">{seats}</span>
            <button
              type="button"
              onClick={() => setSeats(Math.min(8, seats + 1))}
              className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-muted-foreground hover:text-foreground"
            >
              +
            </button>
          </div>
        </Field>

        {/* Submit */}
        <Button
          type="submit"
          size="lg"
          className="h-full w-full rounded-2xl bg-accent text-accent-foreground shadow-glow hover:bg-accent/90 md:w-auto md:px-8"
        >
          <Search className="mr-2 h-4 w-4" />
          Search
        </Button>
      </div>
    </form>
  );
};

const Field = ({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) => (
  <div className="flex items-center gap-3 rounded-2xl px-4 py-3 transition-colors hover:bg-muted/50">
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted">
      {icon}
    </div>
    <div className="min-w-0 flex-1">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="text-sm font-medium text-foreground">{children}</div>
    </div>
  </div>
);

const CityInput = ({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) => (
  <Input
    list="kashmir-cities"
    value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    className="h-auto border-0 bg-transparent p-0 text-sm font-medium shadow-none focus-visible:ring-0"
  >
  </Input>
);

// Render the datalist once at app level via portal-less inline (acceptable)
export const CityDataList = () => (
  <datalist id="kashmir-cities">
    {KASHMIR_CITIES.map((c) => (
      <option key={c} value={c} />
    ))}
  </datalist>
);

export default SearchBar;
