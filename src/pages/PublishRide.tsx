import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft, ArrowRight, ArrowRightLeft, Check, MapPin, Calendar as CalendarIcon,
  Clock, Users, Coins, Plus, X, Briefcase, Music2, Cigarette, Dog, Sparkles,
  Snowflake, MessageCircle, Car, Star,
} from "lucide-react";
import { format } from "date-fns";
import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";
import { CityDataList, KASHMIR_QUICK_ROUTES } from "@/components/site/SearchBar";
import { mergeFavoritesFirst, useFavoriteRoutes, type Route } from "@/hooks/useFavoriteRoutes";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

type Stop = { id: string; name: string; price: number };
type LuggageSize = "small" | "medium" | "large";

type FormState = {
  from: string;
  to: string;
  date?: Date;
  departTime: string;
  arriveTime: string;
  seats: number;
  pricePerSeat: number;
  car: string;
  carNumber: string;
  stops: Stop[];
  luggage: LuggageSize;
  rules: {
    smoking: boolean;
    pets: boolean;
    music: boolean;
    chatty: boolean;
    ac: boolean;
  };
  notes: string;
  instantBook: boolean;
};

const STEPS = [
  { id: 1, label: "Route" },
  { id: 2, label: "Date & time" },
  { id: 3, label: "Seats & price" },
  { id: 4, label: "Stops" },
  { id: 5, label: "Rules & luggage" },
  { id: 6, label: "Review" },
] as const;

const newId = () => Math.random().toString(36).slice(2, 9);

const PublishRide = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [data, setData] = useState<FormState>({
    from: "Srinagar",
    to: "Jammu",
    date: undefined,
    departTime: "06:30",
    arriveTime: "14:00",
    seats: 3,
    pricePerSeat: 800,
    car: "",
    carNumber: "",
    stops: [],
    luggage: "medium",
    rules: { smoking: false, pets: false, music: true, chatty: true, ac: true },
    notes: "",
    instantBook: true,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      toast.error("Please sign in to publish a ride");
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setData((d) => ({ ...d, [key]: value }));

  const stepValid = useMemo(() => {
    switch (step) {
      case 1:
        return data.from.trim().length > 1 && data.to.trim().length > 1 && data.from !== data.to;
      case 2: {
        if (!data.date || !data.departTime || !data.arriveTime) return false;
        // If the chosen date is today, depart time must be in the future
        const today = new Date();
        const isToday =
          data.date.getFullYear() === today.getFullYear() &&
          data.date.getMonth() === today.getMonth() &&
          data.date.getDate() === today.getDate();
        if (isToday) {
          const [h, m] = data.departTime.split(":").map(Number);
          const depart = new Date(data.date);
          depart.setHours(h || 0, m || 0, 0, 0);
          if (depart.getTime() <= Date.now()) return false;
        }
        return true;
      }
      case 3:
        return (
          data.seats >= 1 &&
          data.seats <= 8 &&
          data.pricePerSeat >= 50 &&
          data.car.trim().length > 1 &&
          data.carNumber.trim().length >= 4
        );
      case 4:
        return true;
      case 5:
        return true;
      case 6:
        return true;
      default:
        return false;
    }
  }, [step, data]);

  const next = () => {
    if (!stepValid) {
      if (step === 2 && data.date) {
        toast.error("Departure time must be in the future for today's date.");
      } else if (step === 3) {
        toast.error("Vehicle name and number are required.");
      } else {
        toast.error("Please complete the required fields.");
      }
      return;
    }
    if (step < STEPS.length) setStep(step + 1);
  };
  const back = () => (step > 1 ? setStep(step - 1) : navigate("/publish"));

  const submit = async () => {
    if (!user) {
      toast.error("Please sign in first");
      return navigate("/auth");
    }
    if (!data.date) return toast.error("Please pick a date");
    setSubmitting(true);
    try {
      const amenities = [
        data.rules.ac ? "AC" : null,
        data.rules.music ? "Music" : null,
      ].filter(Boolean) as string[];

      const { data: created, error } = await supabase.from("rides").insert({
        driver_id: user.id,
        from_location: data.from,
        to_location: data.to,
        ride_date: format(data.date, "yyyy-MM-dd"),
        depart_time: data.departTime,
        arrive_time: data.arriveTime,
        price_per_seat: data.pricePerSeat,
        seats_total: data.seats,
        seats_left: data.seats,
        car: data.car,
        car_number: data.carNumber.trim().toUpperCase() || null,
        stops: data.stops.map((s) => s.name),
        amenities,
        rules: {
          smoking: data.rules.smoking,
          pets: data.rules.pets,
          music: data.rules.music,
          chatty: data.rules.chatty,
          ac: data.rules.ac,
          luggage: data.luggage,
          notes: data.notes,
        },
        instant_book: data.instantBook,
        status: "active",
      }).select("id").maybeSingle();
      if (error) throw error;

      // Save the ordered stops with per-stop price-from-origin.
      // Always include the destination so passengers see the full fare table.
      if (created?.id) {
        const stopRows = [
          ...data.stops.map((s, i) => ({
            ride_id: created.id,
            stop_order: i + 1,
            name: s.name,
            price_from_origin: Math.max(0, Math.round(s.price)),
          })),
          {
            ride_id: created.id,
            stop_order: data.stops.length + 1,
            name: data.to,
            price_from_origin: data.pricePerSeat,
          },
        ];
        const { error: stopsErr } = await supabase.from("ride_stops").insert(stopRows);
        if (stopsErr) throw stopsErr;
      }

      toast.success("Your ride has been published!", {
        description: `${data.from} → ${data.to} on ${format(data.date, "EEE, dd MMM")}`,
      });
      setTimeout(() => navigate("/trips"), 900);
    } catch (err: any) {
      toast.error(err?.message ?? "Could not publish ride");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/20">
      <CityDataList />
      <Header />

      <div className="container py-10">
        <Link to="/publish" className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>

        <div className="mt-4 grid gap-8 lg:grid-cols-[280px_1fr]">
          {/* Stepper */}
          <aside>
            <div className="sticky top-24 rounded-3xl bg-card p-6 shadow-soft ring-1 ring-border/60">
              <h2 className="font-display text-lg font-bold">Publish a ride</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Takes about a minute.
              </p>

              <ol className="mt-6 space-y-1">
                {STEPS.map((s) => {
                  const done = step > s.id;
                  const active = step === s.id;
                  return (
                    <li key={s.id}>
                      <button
                        type="button"
                        disabled={s.id > step}
                        onClick={() => s.id < step && setStep(s.id)}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors",
                          active && "bg-primary/10 text-primary",
                          !active && done && "text-foreground hover:bg-muted",
                          !active && !done && "text-muted-foreground",
                          s.id <= step ? "cursor-pointer" : "cursor-not-allowed",
                        )}
                      >
                        <span
                          className={cn(
                            "flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ring-1",
                            done && "bg-success text-success-foreground ring-success",
                            active && "bg-primary text-primary-foreground ring-primary",
                            !done && !active && "bg-background text-muted-foreground ring-border",
                          )}
                        >
                          {done ? <Check className="h-3.5 w-3.5" /> : s.id}
                        </span>
                        <span className="font-medium">{s.label}</span>
                      </button>
                    </li>
                  );
                })}
              </ol>

              <div className="mt-6 rounded-2xl bg-gradient-sky p-4 text-xs text-muted-foreground">
                <Sparkles className="mb-2 h-4 w-4 text-accent" />
                Be honest about your route and timing — it builds trust faster than anything else.
              </div>
            </div>
          </aside>

          {/* Steps */}
          <main>
            <div key={step} className="animate-fade-up rounded-3xl bg-card p-6 shadow-card ring-1 ring-border/60 md:p-10">
              {step === 1 && <StepRoute data={data} update={update} />}
              {step === 2 && <StepWhen data={data} update={update} />}
              {step === 3 && <StepSeats data={data} update={update} />}
              {step === 4 && <StepStops data={data} update={update} />}
              {step === 5 && <StepRules data={data} update={update} />}
              {step === 6 && <StepReview data={data} />}

              <div className="mt-10 flex items-center justify-between border-t border-border/60 pt-6">
                <Button variant="ghost" onClick={back} className="rounded-full">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {step === 1 ? "Cancel" : "Back"}
                </Button>

                <div className="text-xs text-muted-foreground">
                  Step {step} of {STEPS.length}
                </div>

                {step < STEPS.length ? (
                  <Button onClick={next} className="rounded-full" size="lg">
                    Continue
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    onClick={submit}
                    disabled={submitting}
                    size="lg"
                    className="rounded-full bg-accent text-accent-foreground shadow-glow hover:bg-accent/90"
                  >
                    {submitting ? "Publishing…" : "Publish ride"}
                    <Check className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>

      <Footer />
    </div>
  );
};

/* ------------------------- Step components ------------------------- */

const StepHeader = ({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) => (
  <div className="mb-8">
    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-soft">
      {icon}
    </span>
    <h2 className="mt-4 font-display text-2xl font-bold md:text-3xl">{title}</h2>
    <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
  </div>
);

const StepRoute = ({
  data,
  update,
}: {
  data: FormState;
  update: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
}) => {
  const { favorites, isFavorite, toggleFavorite } = useFavoriteRoutes();
  const orderedRoutes = mergeFavoritesFirst(favorites, KASHMIR_QUICK_ROUTES);
  const currentIsFav = isFavorite({ from: data.from, to: data.to });
  const [pendingRemoval, setPendingRemoval] = useState<Route | null>(null);
  const confirmRemove = () => {
    if (!pendingRemoval) return;
    const { from: f, to: t } = pendingRemoval;
    toggleFavorite(pendingRemoval);
    toast.success(`Removed ${f} → ${t} from favorites`);
    setPendingRemoval(null);
  };
  return (
  <>
    <StepHeader
      icon={<MapPin className="h-5 w-5" />}
      title="Where are you going?"
      desc="Pick the main pickup city and your destination."
    />

    <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-end">
      <div>
        <Label htmlFor="from">Leaving from</Label>
        <Input
          id="from"
          list="kashmir-cities"
          value={data.from}
          onChange={(e) => update("from", e.target.value)}
          placeholder="e.g. Srinagar"
          className="mt-2 h-12 rounded-2xl"
        />
      </div>

      <button
        type="button"
        onClick={() => {
          const f = data.from;
          update("from", data.to);
          update("to", f);
        }}
        className="mb-1 hidden h-12 w-12 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-all hover:rotate-180 hover:text-foreground md:flex"
        aria-label="Swap"
      >
        <ArrowRightLeft className="h-4 w-4" />
      </button>

      <div>
        <Label htmlFor="to">Going to</Label>
        <Input
          id="to"
          list="kashmir-cities"
          value={data.to}
          onChange={(e) => update("to", e.target.value)}
          placeholder="e.g. Jammu"
          className="mt-2 h-12 rounded-2xl"
        />
      </div>
    </div>

    {data.from && data.to && data.from === data.to && (
      <p className="mt-3 text-xs text-destructive">Pickup and destination must be different.</p>
    )}

    <div className="mt-8">
      <div className="mb-3 flex items-center justify-between">
        <Label>{favorites.length > 0 ? "Your routes" : "Popular Kashmir routes"}</Label>
        <button
          type="button"
          onClick={() => {
            if (!data.from.trim() || !data.to.trim() || data.from === data.to) {
              toast.error("Pick two different cities first");
              return;
            }
            if (currentIsFav) {
              setPendingRemoval({ from: data.from, to: data.to });
              return;
            }
            toggleFavorite({ from: data.from, to: data.to });
            toast.success(`Saved ${data.from} → ${data.to} to favorites`);
          }}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-all",
            currentIsFav
              ? "border-accent/50 bg-accent/10 text-accent-foreground"
              : "border-border bg-background text-muted-foreground hover:border-accent/40 hover:bg-accent/5 hover:text-foreground",
          )}
          aria-label="Save current route as favorite"
          aria-pressed={currentIsFav}
        >
          <Star className={cn("h-3.5 w-3.5", currentIsFav && "fill-current")} />
          {currentIsFav ? "Saved" : "Save this route"}
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            const f = data.from;
            update("from", data.to);
            update("to", f);
          }}
          className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/5 px-3.5 py-1.5 text-xs font-semibold text-primary transition-all hover:bg-primary/10"
          aria-label="Swap From and To"
        >
          <ArrowRightLeft className="h-3.5 w-3.5" />
          Swap
        </button>
        {orderedRoutes.map(({ from: f, to: t }) => {
          const active = data.from === f && data.to === t;
          const fav = isFavorite({ from: f, to: t });
          return (
            <span
              key={`${f}-${t}`}
              className={cn(
                "inline-flex items-center overflow-hidden rounded-full border transition-colors",
                active
                  ? "border-primary/60 bg-primary/10"
                  : fav
                    ? "border-accent/50 bg-accent/5"
                    : "border-border bg-background hover:border-primary/40",
              )}
            >
              <button
                type="button"
                onClick={() => {
                  update("from", f);
                  update("to", t);
                }}
                className={cn(
                  "px-3.5 py-1.5 text-xs font-medium transition-colors",
                  active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {f} → {t}
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (fav) {
                    setPendingRemoval({ from: f, to: t });
                    return;
                  }
                  toggleFavorite({ from: f, to: t });
                  toast.success(`Saved ${f} → ${t}`);
                }}
                className={cn(
                  "flex items-center border-l px-2 py-1.5 transition-colors",
                  fav
                    ? "border-accent/30 text-accent hover:bg-accent/10"
                    : "border-border text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
                aria-label={fav ? `Unfavorite ${f} to ${t}` : `Favorite ${f} to ${t}`}
                aria-pressed={fav}
              >
                <Star className={cn("h-3.5 w-3.5", fav && "fill-current")} />
              </button>
            </span>
          );
        })}
      </div>
    </div>
    <AlertDialog open={!!pendingRemoval} onOpenChange={(open) => !open && setPendingRemoval(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove favorite route?</AlertDialogTitle>
          <AlertDialogDescription>
            {pendingRemoval
              ? `${pendingRemoval.from} → ${pendingRemoval.to} will be removed from your favorites. You can save it again anytime.`
              : ""}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep</AlertDialogCancel>
          <AlertDialogAction onClick={confirmRemove}>Remove</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </>
  );
};

const StepWhen = ({
  data,
  update,
}: {
  data: FormState;
  update: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
}) => (
  <>
    <StepHeader
      icon={<CalendarIcon className="h-5 w-5" />}
      title="When are you leaving?"
      desc="Set the date and rough timings of your trip."
    />

    <div className="grid gap-4 md:grid-cols-3">
      <div>
        <Label>Date</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "mt-2 h-12 w-full justify-start rounded-2xl text-left font-medium",
                !data.date && "text-muted-foreground",
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {data.date ? format(data.date, "EEE, dd MMM yyyy") : "Pick a date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={data.date}
              onSelect={(d) => update("date", d)}
              disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
              initialFocus
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>
      </div>

      <div>
        <Label htmlFor="depart">Departure</Label>
        <div className="relative mt-2">
          <Clock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="depart"
            type="time"
            value={data.departTime}
            onChange={(e) => update("departTime", e.target.value)}
            className="h-12 rounded-2xl pl-10"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="arrive">Estimated arrival</Label>
        <div className="relative mt-2">
          <Clock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="arrive"
            type="time"
            value={data.arriveTime}
            onChange={(e) => update("arriveTime", e.target.value)}
            className="h-12 rounded-2xl pl-10"
          />
        </div>
      </div>
    </div>

    <div className="mt-6 rounded-2xl bg-muted/40 p-4 text-xs text-muted-foreground">
      Tip: passengers prefer realistic timings. Add a buffer for checkpoints,
      weather and tunnel closures.
    </div>
  </>
);

const StepSeats = ({
  data,
  update,
}: {
  data: FormState;
  update: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
}) => (
  <>
    <StepHeader
      icon={<Users className="h-5 w-5" />}
      title="Seats & price"
      desc="How many seats are you offering, and at what contribution per seat?"
    />

    <div className="grid gap-6 md:grid-cols-2">
      <div className="rounded-2xl border border-border bg-background p-5">
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Available seats
        </Label>
        <div className="mt-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => update("seats", Math.max(1, data.seats - 1))}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-muted text-foreground hover:bg-muted/80"
          >
            −
          </button>
          <div className="text-center">
            <div className="font-display text-4xl font-extrabold tabular-nums">{data.seats}</div>
            <div className="text-xs text-muted-foreground">seats free</div>
          </div>
          <button
            type="button"
            onClick={() => update("seats", Math.min(8, data.seats + 1))}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-muted text-foreground hover:bg-muted/80"
          >
            +
          </button>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Most cars list 2–3 seats. We recommend keeping the middle back seat free for comfort.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-background p-5">
        <Label htmlFor="price" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Price per seat
        </Label>
        <div className="relative mt-4">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 font-display text-2xl font-bold text-muted-foreground">
            ₹
          </span>
          <Input
            id="price"
            type="number"
            min={50}
            max={5000}
            value={data.pricePerSeat}
            onChange={(e) => update("pricePerSeat", Number(e.target.value))}
            className="h-14 rounded-xl pl-10 font-display text-2xl font-bold"
          />
        </div>
        <div className="mt-3 flex items-center gap-2 text-xs">
          <Coins className="h-3.5 w-3.5 text-success" />
          <span className="text-muted-foreground">
            Earn up to <strong className="text-foreground">₹{data.pricePerSeat * data.seats}</strong> per trip
          </span>
        </div>
      </div>
    </div>

    <div className="mt-6 grid gap-4 md:grid-cols-2">
      <div>
        <Label htmlFor="car">
          Vehicle <span className="text-destructive">*</span>
        </Label>
        <div className="relative mt-2">
          <Car className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="car"
            value={data.car}
            onChange={(e) => update("car", e.target.value)}
            placeholder="e.g. Toyota Innova, white"
            className="h-12 rounded-2xl pl-10"
            required
          />
        </div>
      </div>
      <div>
        <Label htmlFor="carNumber">
          Vehicle number <span className="text-destructive">*</span>
        </Label>
        <Input
          id="carNumber"
          value={data.carNumber}
          onChange={(e) => update("carNumber", e.target.value.toUpperCase())}
          placeholder="e.g. JK01 AB 1234"
          maxLength={15}
          className="mt-2 h-12 rounded-2xl font-mono uppercase tracking-wider"
          required
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Helps passengers identify and trust your car at pickup.
        </p>
      </div>
    </div>

    <label className="mt-6 flex cursor-pointer items-center justify-between rounded-2xl border border-border bg-background p-4">
      <div>
        <div className="text-sm font-semibold">Instant booking</div>
        <div className="text-xs text-muted-foreground">
          Passengers book instantly without your approval. Recommended for popular routes.
        </div>
      </div>
      <input
        type="checkbox"
        checked={data.instantBook}
        onChange={(e) => update("instantBook", e.target.checked)}
        className="h-5 w-5 accent-primary"
      />
    </label>
  </>
);

const StepStops = ({
  data,
  update,
}: {
  data: FormState;
  update: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
}) => {
  const [draft, setDraft] = useState("");
  const [draftPrice, setDraftPrice] = useState("");

  const add = () => {
    const name = draft.trim();
    if (!name) return;
    const price = Math.max(0, Number(draftPrice) || 0);
    if (price >= data.pricePerSeat && data.pricePerSeat > 0) {
      toast.error(`Stop fare should be less than the full ₹${data.pricePerSeat} fare`);
      return;
    }
    update("stops", [...data.stops, { id: newId(), name, price }]);
    setDraft("");
    setDraftPrice("");
  };
  const remove = (id: string) =>
    update("stops", data.stops.filter((s) => s.id !== id));
  const setPrice = (id: string, price: number) =>
    update(
      "stops",
      data.stops.map((s) => (s.id === id ? { ...s, price: Math.max(0, price) } : s)),
    );

  return (
    <>
      <StepHeader
        icon={<MapPin className="h-5 w-5" />}
        title="Pickup & drop points"
        desc={`Add stops along your route. Set a fare from ${data.from} to each stop — passengers pay based on where they get off.`}
      />

      {/* Visual route with per-stop prices */}
      <div className="rounded-2xl border border-border bg-muted/30 p-5">
        <ol className="relative ml-2 space-y-4 border-l-2 border-dashed border-border pl-6">
          <li className="relative">
            <span className="absolute -left-[31px] top-1 h-5 w-5 rounded-full bg-primary ring-4 ring-card" />
            <div className="text-sm font-semibold">{data.from}</div>
            <div className="text-xs text-muted-foreground">Pickup · ₹0</div>
          </li>
          {data.stops.map((s) => (
            <li key={s.id} className="relative">
              <span className="absolute -left-[31px] top-1 h-5 w-5 rounded-full bg-muted-foreground/40 ring-4 ring-card" />
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-sm font-medium">{s.name}</div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">₹</span>
                    <Input
                      type="number"
                      min={0}
                      max={data.pricePerSeat}
                      value={s.price}
                      onChange={(e) => setPrice(s.id, Number(e.target.value))}
                      className="h-9 w-24 rounded-lg pl-5 text-sm font-semibold"
                      aria-label={`Fare from ${data.from} to ${s.name}`}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(s.id)}
                    className="rounded-full p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    aria-label="Remove stop"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <div className="text-xs text-muted-foreground">Stop · fare from {data.from}</div>
            </li>
          ))}
          <li className="relative">
            <span className="absolute -left-[31px] top-1 h-5 w-5 rounded-full bg-secondary ring-4 ring-card" />
            <div className="text-sm font-semibold">{data.to}</div>
            <div className="text-xs text-muted-foreground">Drop-off · ₹{data.pricePerSeat} (full fare)</div>
          </li>
        </ol>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_140px_auto]">
        <Input
          value={draft}
          list="kashmir-cities"
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())}
          placeholder="e.g. Dalgate, Jehangir Chowk"
          className="h-12 rounded-2xl"
        />
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">₹</span>
          <Input
            type="number"
            min={0}
            max={data.pricePerSeat}
            value={draftPrice}
            onChange={(e) => setDraftPrice(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())}
            placeholder="Fare"
            className="h-12 rounded-2xl pl-7"
            aria-label="Fare from origin to this stop"
          />
        </div>
        <Button onClick={add} type="button" className="h-12 rounded-2xl" variant="outline">
          <Plus className="mr-2 h-4 w-4" />
          Add stop
        </Button>
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        Tip: enter the fare a passenger pays from <strong>{data.from}</strong> to that stop. The destination uses your full ₹{data.pricePerSeat} fare.
      </p>
    </>
  );
};

const StepRules = ({
  data,
  update,
}: {
  data: FormState;
  update: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
}) => {
  const setRule = (k: keyof FormState["rules"], v: boolean) =>
    update("rules", { ...data.rules, [k]: v });

  const luggageOptions: { id: LuggageSize; label: string; desc: string; icon: React.ReactNode }[] = [
    { id: "small", label: "Small bag", desc: "Backpack only", icon: <Briefcase className="h-4 w-4" /> },
    { id: "medium", label: "Medium", desc: "Cabin-size suitcase", icon: <Briefcase className="h-4 w-4" /> },
    { id: "large", label: "Large", desc: "Full suitcase", icon: <Briefcase className="h-4 w-4" /> },
  ];

  return (
    <>
      <StepHeader
        icon={<Sparkles className="h-5 w-5" />}
        title="Rules & luggage"
        desc="Help passengers know what to expect on board."
      />

      <div>
        <Label className="mb-3 block">Luggage allowed per passenger</Label>
        <div className="grid gap-3 sm:grid-cols-3">
          {luggageOptions.map((o) => {
            const active = data.luggage === o.id;
            return (
              <button
                key={o.id}
                type="button"
                onClick={() => update("luggage", o.id)}
                className={cn(
                  "flex flex-col items-start gap-2 rounded-2xl border-2 bg-background p-4 text-left transition-all",
                  active
                    ? "border-primary bg-primary/5 shadow-soft"
                    : "border-border hover:border-primary/40",
                )}
              >
                <span className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-xl",
                  active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                )}>
                  {o.icon}
                </span>
                <div>
                  <div className="text-sm font-semibold">{o.label}</div>
                  <div className="text-xs text-muted-foreground">{o.desc}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-8">
        <Label className="mb-3 block">Ride preferences</Label>
        <div className="grid gap-3 sm:grid-cols-2">
          <RuleToggle
            icon={<Cigarette className="h-4 w-4" />}
            label="Smoking allowed"
            value={data.rules.smoking}
            onChange={(v) => setRule("smoking", v)}
          />
          <RuleToggle
            icon={<Dog className="h-4 w-4" />}
            label="Pets welcome"
            value={data.rules.pets}
            onChange={(v) => setRule("pets", v)}
          />
          <RuleToggle
            icon={<Music2 className="h-4 w-4" />}
            label="Music on"
            value={data.rules.music}
            onChange={(v) => setRule("music", v)}
          />
          <RuleToggle
            icon={<MessageCircle className="h-4 w-4" />}
            label="Chatty driver"
            value={data.rules.chatty}
            onChange={(v) => setRule("chatty", v)}
          />
          <RuleToggle
            icon={<Snowflake className="h-4 w-4" />}
            label="AC on"
            value={data.rules.ac}
            onChange={(v) => setRule("ac", v)}
          />
        </div>
      </div>

      <div className="mt-8">
        <Label htmlFor="notes">A note for passengers (optional)</Label>
        <Textarea
          id="notes"
          value={data.notes}
          onChange={(e) => update("notes", e.target.value)}
          placeholder="e.g. Will stop briefly for tea at Qazigund. Please be on time."
          maxLength={300}
          rows={4}
          className="mt-2 rounded-2xl"
        />
        <div className="mt-1 text-right text-xs text-muted-foreground">{data.notes.length}/300</div>
      </div>
    </>
  );
};

const RuleToggle = ({
  icon, label, value, onChange,
}: {
  icon: React.ReactNode;
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) => (
  <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-border bg-background p-4 transition-colors hover:border-primary/40">
    <div className="flex items-center gap-3">
      <span className={cn(
        "flex h-9 w-9 items-center justify-center rounded-xl",
        value ? "bg-success/15 text-success" : "bg-muted text-muted-foreground",
      )}>
        {icon}
      </span>
      <span className="text-sm font-medium">{label}</span>
    </div>
    <input
      type="checkbox"
      checked={value}
      onChange={(e) => onChange(e.target.checked)}
      className="h-5 w-5 accent-primary"
    />
  </label>
);

const StepReview = ({ data }: { data: FormState }) => {
  const total = data.pricePerSeat * data.seats;
  const ruleList = [
    data.rules.smoking ? "Smoking ok" : "No smoking",
    data.rules.pets ? "Pets ok" : "No pets",
    data.rules.music ? "Music on" : "Quiet ride",
    data.rules.ac ? "AC on" : "No AC",
  ];

  return (
    <>
      <StepHeader
        icon={<Check className="h-5 w-5" />}
        title="Review your ride"
        desc="Everything look good? Hit publish to make it live."
      />

      {/* Hero summary */}
      <div className="rounded-3xl bg-gradient-primary p-6 text-primary-foreground shadow-soft">
        <div className="text-xs font-semibold uppercase tracking-wider opacity-80">
          {data.date ? format(data.date, "EEE, dd MMM yyyy") : "Date not set"}
        </div>
        <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
          <div>
            <div className="font-display text-2xl font-extrabold">{data.departTime}</div>
            <div className="mt-0.5 text-sm opacity-90">{data.from}</div>
          </div>
          <ArrowRight className="h-5 w-5 opacity-70" />
          <div className="text-right">
            <div className="font-display text-2xl font-extrabold">{data.arriveTime}</div>
            <div className="mt-0.5 text-sm opacity-90">{data.to}</div>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <SummaryCard label="Seats offered" value={`${data.seats} seats`} />
        <SummaryCard label="Price per seat" value={`₹${data.pricePerSeat}`} />
        <SummaryCard label="Vehicle" value={data.car || "—"} />
        <SummaryCard
          label="Booking"
          value={data.instantBook ? "Instant booking" : "Approval required"}
        />
        <SummaryCard label="Luggage" value={data.luggage[0].toUpperCase() + data.luggage.slice(1)} />
        <SummaryCard
          label="Potential earnings"
          value={`₹${total}`}
          accent
        />
      </div>

      {data.stops.length > 0 && (
        <div className="mt-6 rounded-2xl border border-border bg-background p-5">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Stops & fares from {data.from}
          </div>
          <div className="mt-3 space-y-1.5">
            {data.stops.map((s) => (
              <div key={s.id} className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-1.5 text-sm">
                <span className="font-medium">{s.name}</span>
                <span className="font-display font-bold tabular-nums">₹{s.price}</span>
              </div>
            ))}
            <div className="flex items-center justify-between rounded-lg bg-primary/5 px-3 py-1.5 text-sm">
              <span className="font-medium">{data.to}</span>
              <span className="font-display font-bold tabular-nums text-primary">₹{data.pricePerSeat}</span>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 rounded-2xl border border-border bg-background p-5">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Preferences
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {ruleList.map((r) => (
            <span key={r} className="rounded-full bg-muted px-3 py-1 text-xs font-medium">
              {r}
            </span>
          ))}
        </div>
        {data.notes && (
          <p className="mt-4 border-t border-border/60 pt-4 text-sm text-muted-foreground">
            “{data.notes}”
          </p>
        )}
      </div>
    </>
  );
};

const SummaryCard = ({
  label, value, accent,
}: { label: string; value: string; accent?: boolean }) => (
  <div className={cn(
    "rounded-2xl border bg-background p-4",
    accent ? "border-accent/40 bg-accent/5" : "border-border",
  )}>
    <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
      {label}
    </div>
    <div className={cn(
      "mt-1 font-display font-bold",
      accent ? "text-2xl text-accent" : "text-lg",
    )}>
      {value}
    </div>
  </div>
);

export default PublishRide;
