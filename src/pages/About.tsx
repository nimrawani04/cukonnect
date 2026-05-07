import { Link } from "react-router-dom";
import {
  Search, CalendarCheck, Car, Star, ShieldCheck, Wallet, Leaf, Users2, MessageCircle, MapPin, ArrowRight, Phone, BellRing,
} from "lucide-react";
import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";
import { Button } from "@/components/ui/button";

const steps = [
  {
    icon: <Search className="h-5 w-5" />,
    title: "1. Search your route",
    desc: "Enter your pickup and drop-off (e.g. Srinagar → Jammu) and the date you want to travel. Browse available rides with prices, departure times and driver ratings.",
  },
  {
    icon: <CalendarCheck className="h-5 w-5" />,
    title: "2. Book a seat",
    desc: "Reserve in one tap. Pay online or in cash to the driver. You'll instantly see pickup details and can chat with the driver in-app.",
  },
  {
    icon: <MessageCircle className="h-5 w-5" />,
    title: "3. Coordinate in chat",
    desc: "Confirm pickup point, share live location, and ask anything you need — all inside CuKashmir, no phone numbers required.",
  },
  {
    icon: <Car className="h-5 w-5" />,
    title: "4. Travel together",
    desc: "Meet your driver at the agreed spot, enjoy the drive across the Valley, split the cost and reduce traffic & emissions.",
  },
  {
    icon: <Star className="h-5 w-5" />,
    title: "5. Rate & build trust",
    desc: "After the ride, rate your driver (and they rate you). Reviews keep the community safe, friendly and reliable for everyone.",
  },
];

const driverSteps = [
  {
    icon: <MapPin className="h-5 w-5" />,
    title: "Publish your trip",
    desc: "Heading from Sopore to Srinagar tomorrow at 8am? Post the route, time, seats and price in under a minute.",
  },
  {
    icon: <Users2 className="h-5 w-5" />,
    title: "Get bookings",
    desc: "Passengers see your trip and book seats. You receive a notification with pickup details and can chat to coordinate.",
  },
  {
    icon: <Wallet className="h-5 w-5" />,
    title: "Drive & earn back fuel",
    desc: "Cover your fuel and tolls with shared cost. Cash or online — your choice.",
  },
];

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="bg-gradient-sky">
        <div className="container py-16 text-center md:py-24">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
            How it works
          </span>
          <h1 className="mx-auto mt-5 max-w-3xl font-display text-4xl font-extrabold leading-tight md:text-5xl">
            Carpooling across Kashmir, made simple.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground md:text-lg">
            CuKashmir connects passengers and drivers travelling the same route — share the
            ride, share the cost, and help the Valley move smarter.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/search">
              <Button size="lg" className="rounded-full">Find a ride <ArrowRight className="ml-2 h-4 w-4" /></Button>
            </Link>
            <Link to="/publish">
              <Button size="lg" variant="outline" className="rounded-full">Publish a ride</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Passenger steps */}
      <section className="container py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-bold md:text-4xl">For passengers</h2>
          <p className="mt-3 text-muted-foreground">From searching to arriving — here's the full journey.</p>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {steps.map((s) => (
            <div key={s.title} className="rounded-3xl bg-card p-7 shadow-soft ring-1 ring-border/60">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-soft">
                {s.icon}
              </span>
              <h3 className="mt-5 font-display text-lg font-bold">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Driver steps */}
      <section className="bg-gradient-sky py-20">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-bold md:text-4xl">For drivers</h2>
            <p className="mt-3 text-muted-foreground">Driving anyway? Fill the empty seats.</p>
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {driverSteps.map((s) => (
              <div key={s.title} className="rounded-3xl bg-card p-7 shadow-soft ring-1 ring-border/60">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-soft">
                  {s.icon}
                </span>
                <h3 className="mt-5 font-display text-lg font-bold">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="container py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-bold md:text-4xl">Why CuKashmir</h2>
          <p className="mt-3 text-muted-foreground">Built for the Valley, by the Valley.</p>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: <ShieldCheck className="h-5 w-5" />, title: "Verified drivers", desc: "Phone & ID verification for every driver." },
            { icon: <Wallet className="h-5 w-5" />, title: "Fair, capped prices", desc: "Cost-shared and transparent — no surge." },
            { icon: <Leaf className="h-5 w-5" />, title: "Greener travel", desc: "Fewer empty seats. Less fuel. Less traffic." },
            { icon: <BellRing className="h-5 w-5" />, title: "Real-time updates", desc: "Live chat, location and notifications." },
          ].map((f) => (
            <div key={f.title} className="rounded-2xl bg-muted/40 p-5">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/10 text-secondary">{f.icon}</span>
              <h4 className="mt-4 font-display text-base font-bold">{f.title}</h4>
              <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-muted/30 py-20">
        <div className="container max-w-3xl">
          <h2 className="text-center font-display text-3xl font-bold md:text-4xl">Frequently asked questions</h2>
          <div className="mt-10 space-y-4">
            {[
              { q: "Is CuKashmir free to join?", a: "Yes. Creating an account, browsing rides and publishing trips is free. Passengers only pay the seat price set by the driver." },
              { q: "How do I pay?", a: "You can pay online during booking or in cash directly to the driver — whichever the driver allows on their trip." },
              { q: "Can I cancel a booking?", a: "Yes. Open the trip from 'My trips' and tap cancel. Please cancel as early as possible so the driver can offer the seat to someone else." },
              { q: "Is it safe?", a: "Every driver is phone-verified. Reviews from past passengers help you choose. You can chat in-app without sharing your phone number." },
              { q: "Does it work offline / on the mobile app?", a: "Yes — install the Android APK from the project release. Push notifications for ride messages work in the background." },
            ].map((f) => (
              <details key={f.q} className="group rounded-2xl bg-card p-5 shadow-soft ring-1 ring-border/60">
                <summary className="cursor-pointer list-none font-display text-base font-bold marker:hidden">
                  <span className="flex items-center justify-between gap-4">
                    {f.q}
                    <span className="text-primary transition-transform group-open:rotate-45">+</span>
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container py-20">
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-primary p-10 text-primary-foreground md:p-16">
          <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-accent/30 blur-3xl" />
          <div className="relative grid items-center gap-8 lg:grid-cols-2">
            <div>
              <h2 className="font-display text-3xl font-bold md:text-4xl">Ready to ride?</h2>
              <p className="mt-3 max-w-lg text-primary-foreground/90">Join the Valley's carpooling community in seconds.</p>
            </div>
            <div className="flex flex-wrap gap-3 lg:justify-end">
              <Link to="/search"><Button size="lg" className="rounded-full bg-accent text-accent-foreground hover:bg-accent/90">Find a ride</Button></Link>
              <Link to="/publish"><Button size="lg" variant="outline" className="rounded-full border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10">Publish a ride</Button></Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default About;
