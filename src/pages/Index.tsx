import { Link } from "react-router-dom";
import {
  ShieldCheck, Wallet, Leaf, Users2, MountainSnow, Car, Star, MapPin, ArrowRight,
} from "lucide-react";
import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";
import SearchBar, { CityDataList } from "@/components/site/SearchBar";
import { Button } from "@/components/ui/button";
import { POPULAR_ROUTES } from "@/data/rides";
import heroImg from "@/assets/hero-kashmir.jpg";
import imgSrinagar from "@/assets/route-srinagar.jpg";
import imgJammu from "@/assets/route-jammu.jpg";
import imgBaramulla from "@/assets/route-baramulla.jpg";
import imgAnantnag from "@/assets/route-anantnag.jpg";
import imgAirport from "@/assets/route-airport.jpg";
import imgSopore from "@/assets/route-sopore.jpg";

const routeImages: Record<string, string> = {
  jammu: imgJammu,
  baramulla: imgBaramulla,
  anantnag: imgAnantnag,
  airport: imgAirport,
  sopore: imgSopore,
  srinagar: imgSrinagar,
};

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <CityDataList />
      <Header />

      {/* HERO */}
      <section className="relative isolate overflow-hidden">
        <img
          src={heroImg}
          alt="Kashmir valley with mountains and a winding road"
          width={1920}
          height={1080}
          className="absolute inset-0 -z-10 h-full w-full object-cover"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-hero" />

        <div className="container relative pb-32 pt-20 md:pb-40 md:pt-28">
          <div className="max-w-2xl animate-fade-up">
            <span className="inline-flex items-center gap-2 rounded-full bg-background/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary-foreground ring-1 ring-primary-foreground/20 backdrop-blur">
              <MountainSnow className="h-3.5 w-3.5" />
              Made for the Valley
            </span>
            <h1 className="mt-5 font-display text-4xl font-extrabold leading-[1.05] text-primary-foreground md:text-6xl lg:text-7xl">
              Share the road.
              <br />
              <span className="text-accent">Share the cost.</span>
            </h1>
            <p className="mt-5 max-w-lg text-base text-primary-foreground/90 md:text-lg">
              Kashmir's intercity carpooling network. Book a seat with a verified local driver
              between Srinagar, Jammu, Baramulla and beyond.
            </p>
          </div>

          <div className="mt-12 animate-fade-up" style={{ animationDelay: "120ms" }}>
            <SearchBar />
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm text-primary-foreground/90">
            <Stat icon={<Users2 className="h-4 w-4" />} value="12,400+" label="Travellers" />
            <Stat icon={<Car className="h-4 w-4" />} value="850+" label="Verified drivers" />
            <Stat icon={<Star className="h-4 w-4 fill-accent text-accent" />} value="4.9" label="Avg. rating" />
          </div>
        </div>
      </section>

      {/* POPULAR ROUTES */}
      <section className="container py-20">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="font-display text-3xl font-bold md:text-4xl">Popular routes</h2>
            <p className="mt-2 text-muted-foreground">
              The Valley's most travelled roads — fresh rides every day.
            </p>
          </div>
          <Link to="/search?from=Srinagar&to=Jammu" className="hidden text-sm font-semibold text-primary hover:underline md:inline">
            Browse all rides →
          </Link>
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {POPULAR_ROUTES.map((r) => (
            <Link
              key={`${r.from}-${r.to}`}
              to={`/search?from=${r.from}&to=${r.to}`}
              className="group relative overflow-hidden rounded-3xl shadow-soft ring-1 ring-border/60 transition-all duration-500 hover:-translate-y-1 hover:shadow-card"
            >
              <div className="aspect-[4/3] overflow-hidden">
                <img
                  src={routeImages[r.image]}
                  alt={`${r.from} to ${r.to}`}
                  width={800}
                  height={600}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/85 via-foreground/30 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5 text-background">
                <div className="flex items-center gap-1.5 text-sm font-medium opacity-90">
                  <MapPin className="h-3.5 w-3.5" />
                  {r.from} → {r.to}
                </div>
                <div className="mt-1 flex items-end justify-between">
                  <div className="font-display text-2xl font-extrabold">from ₹{r.price}</div>
                  <div className="rounded-full bg-background/20 px-2.5 py-1 text-xs font-medium backdrop-blur">
                    {r.duration}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="bg-gradient-sky py-20">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-bold md:text-4xl">How CuKashmir works</h2>
            <p className="mt-3 text-muted-foreground">
              Three simple steps to a smoother, cheaper ride across the Valley.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              { step: "01", title: "Search a ride", desc: "Pick your route and date. See real drivers, prices, and seats available — instantly." , icon: <MapPin className="h-5 w-5" /> },
              { step: "02", title: "Book your seat", desc: "Reserve in one tap. Pay online or in cash. Chat with the driver and confirm the pickup point.", icon: <Wallet className="h-5 w-5" /> },
              { step: "03", title: "Travel together", desc: "Meet at the agreed spot. Enjoy the drive. Rate your driver — build the trust network.", icon: <Users2 className="h-5 w-5" /> },
            ].map((s) => (
              <div key={s.step} className="rounded-3xl bg-card p-7 shadow-soft ring-1 ring-border/60">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-soft">
                    {s.icon}
                  </span>
                  <span className="font-display text-3xl font-extrabold text-muted-foreground/40">
                    {s.step}
                  </span>
                </div>
                <h3 className="mt-5 font-display text-xl font-bold">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TRUST */}
      <section className="container py-20">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-secondary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-secondary">
              <ShieldCheck className="h-3.5 w-3.5" />
              Trust & safety
            </span>
            <h2 className="mt-4 font-display text-3xl font-bold md:text-4xl">
              A community built on trust — not algorithms.
            </h2>
            <p className="mt-4 text-muted-foreground">
              Every driver on CuKashmir is verified by phone and ID. Real reviews from real
              passengers help you choose with confidence — no surprises, no scams.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <Feature icon={<ShieldCheck className="h-4 w-4" />} title="Verified drivers" desc="Phone + ID verification for everyone who lists." />
              <Feature icon={<Star className="h-4 w-4" />} title="Real ratings" desc="Two-way reviews after every completed trip." />
              <Feature icon={<Wallet className="h-4 w-4" />} title="Fair prices" desc="Cost-shared, capped, and transparent." />
              <Feature icon={<Leaf className="h-4 w-4" />} title="Greener travel" desc="Fewer empty seats. Less traffic. Less fuel." />
            </div>

            <div className="mt-8 flex gap-3">
              <Button size="lg" className="rounded-full">Find a ride</Button>
              <Button size="lg" variant="outline" className="rounded-full">Become a driver</Button>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-4 -z-10 rounded-[2.5rem] bg-gradient-warm opacity-20 blur-2xl" />
            <div className="overflow-hidden rounded-3xl shadow-elevated ring-1 ring-border">
              <img
                src={imgSrinagar}
                alt="Dal lake Srinagar"
                width={800}
                height={600}
                loading="lazy"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="absolute -bottom-6 -left-6 rounded-2xl bg-card p-4 shadow-card ring-1 ring-border">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/15 text-success">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold">98% verified</div>
                  <div className="text-xs text-muted-foreground">Active drivers</div>
                </div>
              </div>
            </div>
            <div className="absolute -right-4 -top-4 rounded-2xl bg-card p-4 shadow-card ring-1 ring-border">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/20 text-accent">
                  <Star className="h-5 w-5 fill-accent" />
                </div>
                <div>
                  <div className="text-sm font-semibold">4.9 / 5</div>
                  <div className="text-xs text-muted-foreground">Average rating</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DRIVER CTA */}
      <section className="container pb-20">
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-primary p-10 text-primary-foreground md:p-16">
          <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-accent/30 blur-3xl" />
          <div className="absolute -bottom-20 left-10 h-64 w-64 rounded-full bg-primary-glow/40 blur-3xl" />
          <div className="relative grid items-center gap-8 lg:grid-cols-2">
            <div>
              <h2 className="font-display text-3xl font-bold md:text-4xl">
                Driving anyway? Fill the empty seats.
              </h2>
              <p className="mt-4 max-w-lg text-primary-foreground/90">
                Publish your trip in under a minute. Cover your fuel, meet good company,
                and help the Valley move smarter.
              </p>
            </div>
            <div className="flex justify-start lg:justify-end">
              <Link to="/publish">
                <Button size="lg" className="rounded-full bg-accent text-accent-foreground hover:bg-accent/90">
                  Publish a ride
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

const Stat = ({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) => (
  <div className="flex items-center gap-2">
    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-background/15 backdrop-blur">
      {icon}
    </span>
    <span>
      <strong className="font-semibold">{value}</strong>{" "}
      <span className="opacity-80">{label}</span>
    </span>
  </div>
);

const Feature = ({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) => (
  <div className="rounded-2xl bg-muted/40 p-4">
    <div className="flex items-center gap-2 text-secondary">
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-secondary/10">
        {icon}
      </span>
      <h4 className="text-sm font-semibold text-foreground">{title}</h4>
    </div>
    <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{desc}</p>
  </div>
);

export default Index;
