import { Link } from "react-router-dom";
import { ArrowRight, Car, Coins, Users2, ShieldCheck } from "lucide-react";
import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";
import { Button } from "@/components/ui/button";

const Publish = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <section className="bg-gradient-sky">
        <div className="container grid items-center gap-10 py-20 lg:grid-cols-2">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-secondary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-secondary">
              <Car className="h-3.5 w-3.5" />
              For drivers
            </span>
            <h1 className="mt-4 font-display text-4xl font-extrabold leading-tight md:text-5xl">
              Driving across the Valley?
              <br />
              <span className="text-accent">Earn from every empty seat.</span>
            </h1>
            <p className="mt-5 max-w-lg text-muted-foreground">
              Already heading to Jammu, Anantnag or the airport? Publish your route in under
              a minute and let trusted passengers chip in for fuel.
            </p>
            <div className="mt-7 flex gap-3">
              <Link to="/publish/new">
                <Button size="lg" className="rounded-full bg-accent text-accent-foreground hover:bg-accent/90">
                  Publish a ride
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/">
                <Button size="lg" variant="outline" className="rounded-full">
                  Find a ride instead
                </Button>
              </Link>
            </div>
          </div>

          <div className="rounded-3xl bg-card p-8 shadow-elevated ring-1 ring-border/60">
            <h3 className="font-display text-lg font-bold">Quick estimate</h3>
            <p className="text-sm text-muted-foreground">Sample earnings — Srinagar → Jammu</p>

            <div className="mt-6 space-y-3">
              {[
                { k: "Seats per trip", v: "3 seats" },
                { k: "Avg. contribution", v: "₹800 / seat" },
                { k: "Trips per week", v: "2 trips" },
              ].map((r) => (
                <div key={r.k} className="flex items-center justify-between rounded-xl bg-muted/40 px-4 py-3 text-sm">
                  <span className="text-muted-foreground">{r.k}</span>
                  <span className="font-semibold">{r.v}</span>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-2xl bg-gradient-primary p-5 text-primary-foreground shadow-soft">
              <div className="text-xs uppercase tracking-wider opacity-80">Monthly potential</div>
              <div className="mt-1 font-display text-3xl font-extrabold">₹19,200</div>
              <div className="mt-1 text-xs opacity-80">Cost-shared, not commercial. Helps cover fuel & tolls.</div>
            </div>
          </div>
        </div>
      </section>

      <section className="container py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-bold md:text-4xl">Why drivers choose CuKashmir</h2>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {[
            { icon: <Coins className="h-5 w-5" />, title: "Fair contributions", desc: "Cost-shared pricing capped to keep things friendly and legal." },
            { icon: <Users2 className="h-5 w-5" />, title: "Verified passengers", desc: "Every passenger is phone-verified. Approve who rides with you." },
            { icon: <ShieldCheck className="h-5 w-5" />, title: "Safety first", desc: "SOS button, ride tracking and 24/7 support across the Valley." },
          ].map((f) => (
            <div key={f.title} className="rounded-3xl bg-card p-7 shadow-soft ring-1 ring-border/60">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-primary text-primary-foreground">
                {f.icon}
              </div>
              <h3 className="mt-5 font-display text-lg font-bold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Publish;
