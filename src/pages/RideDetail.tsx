import { useParams, Link } from "react-router-dom";
import {
  Star, ShieldCheck, Zap, MapPin, Clock, Car, Music2, Wifi, Snowflake,
  MessageCircle, ChevronLeft,
} from "lucide-react";
import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MOCK_RIDES } from "@/data/rides";

const RideDetail = () => {
  const { id } = useParams();
  const ride = MOCK_RIDES.find((r) => r.id === id) ?? MOCK_RIDES[0];

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
                {ride.from} → {ride.to} · {new Date(ride.date).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
              </div>

              <div className="mt-6 grid grid-cols-[1fr_auto_1fr] items-center gap-6">
                <div>
                  <div className="font-display text-3xl font-extrabold md:text-4xl">{ride.departTime}</div>
                  <div className="mt-1 text-sm text-muted-foreground">{ride.from}</div>
                </div>
                <div className="flex flex-col items-center text-xs text-muted-foreground">
                  <Clock className="mb-1 h-4 w-4" />
                  {ride.duration}
                </div>
                <div className="text-right">
                  <div className="font-display text-3xl font-extrabold md:text-4xl">{ride.arriveTime}</div>
                  <div className="mt-1 text-sm text-muted-foreground">{ride.to}</div>
                </div>
              </div>

              {/* Stops */}
              {ride.stops && (
                <div className="mt-8 border-t border-border/60 pt-6">
                  <h3 className="mb-4 text-sm font-semibold">Pickup & drop points</h3>
                  <ol className="relative ml-2 space-y-4 border-l-2 border-dashed border-border pl-6">
                    {ride.stops.map((s, i) => (
                      <li key={s} className="relative">
                        <span className={`absolute -left-[31px] top-1 flex h-5 w-5 items-center justify-center rounded-full ring-4 ring-background ${
                          i === 0 ? "bg-primary" : i === ride.stops!.length - 1 ? "bg-secondary" : "bg-muted-foreground/40"
                        }`} />
                        <div className="text-sm font-medium">{s}</div>
                        <div className="text-xs text-muted-foreground">
                          {i === 0 ? "Pickup" : i === ride.stops!.length - 1 ? "Drop-off" : "Stop"}
                        </div>
                      </li>
                    ))}
                  </ol>
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
                  {ride.driver.initials}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div className="font-display text-lg font-bold">{ride.driver.name}</div>
                    {ride.driver.verified && (
                      <Badge className="gap-1 bg-success/15 text-success hover:bg-success/20">
                        <ShieldCheck className="h-3 w-3" />
                        Verified
                      </Badge>
                    )}
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-accent text-accent" />
                      {ride.driver.rating.toFixed(2)}
                    </span>
                    <span>{ride.driver.trips} completed trips</span>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="rounded-full">
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Message
                </Button>
              </div>

              <div className="mt-6 grid gap-3 border-t border-border/60 pt-6 sm:grid-cols-2">
                <Info icon={<Car className="h-4 w-4" />} label="Vehicle" value={ride.car} />
                <Info icon={<Snowflake className="h-4 w-4" />} label="AC" value="Yes" />
                <Info icon={<Music2 className="h-4 w-4" />} label="Music" value="On request" />
                <Info icon={<Wifi className="h-4 w-4" />} label="Wi-Fi" value={ride.amenities.includes("Wi-Fi") ? "Yes" : "No"} />
              </div>
            </div>

            {/* Reviews */}
            <div className="rounded-3xl bg-card p-8 shadow-soft ring-1 ring-border/60">
              <h3 className="mb-5 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Recent reviews
              </h3>
              <div className="space-y-5">
                {[
                  { name: "Sana K.", stars: 5, text: "Very calm driver, on time and helped with luggage. Smooth ride to Jammu." },
                  { name: "Imran R.", stars: 5, text: "Great experience. The car was clean and the route via Banihal was scenic." },
                  { name: "Ayesha M.", stars: 4, text: "Comfortable. Could have been faster but overall good." },
                ].map((r) => (
                  <div key={r.name} className="border-t border-border/60 pt-5 first:border-0 first:pt-0">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold">{r.name}</div>
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`h-3.5 w-3.5 ${i < r.stars ? "fill-accent text-accent" : "text-muted"}`} />
                        ))}
                      </div>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{r.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sticky booking */}
          <aside>
            <div className="sticky top-24 rounded-3xl bg-card p-6 shadow-elevated ring-1 ring-border/60">
              <div className="flex items-baseline justify-between">
                <div>
                  <div className="font-display text-3xl font-extrabold">₹{ride.pricePerSeat}</div>
                  <div className="text-xs text-muted-foreground">per seat</div>
                </div>
                {ride.instantBook && (
                  <Badge className="gap-1 bg-accent/15 text-accent hover:bg-accent/20">
                    <Zap className="h-3 w-3 fill-accent" />
                    Instant
                  </Badge>
                )}
              </div>

              <div className="mt-6 space-y-3 border-y border-border/60 py-5 text-sm">
                <Row label="Seats available" value={`${ride.seatsLeft}`} />
                <Row label="Service fee" value="₹0" muted />
                <Row label="You pay" value={`₹${ride.pricePerSeat}`} bold />
              </div>

              <Button className="mt-5 w-full rounded-full bg-accent text-accent-foreground shadow-glow hover:bg-accent/90" size="lg">
                Book this seat
              </Button>
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

const Row = ({ label, value, muted, bold }: { label: string; value: string; muted?: boolean; bold?: boolean }) => (
  <div className="flex items-center justify-between">
    <span className={muted ? "text-muted-foreground" : ""}>{label}</span>
    <span className={bold ? "font-display text-lg font-bold" : "font-semibold"}>{value}</span>
  </div>
);

export default RideDetail;
