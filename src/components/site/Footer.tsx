import { Mountain, Instagram, Twitter, Facebook } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="mt-24 border-t border-border/60 bg-muted/30">
      <div className="container py-14">
        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold text-primary">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground">
                <Mountain className="h-5 w-5" />
              </span>
              Cu<span className="text-accent">Kashmir</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm text-muted-foreground">
              Kashmir's intercity ride-sharing network. Cheaper than a taxi, friendlier than a bus.
            </p>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold text-foreground">Travel</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Srinagar → Jammu</li>
              <li>Srinagar → Baramulla</li>
              <li>Srinagar → Anantnag</li>
              <li>Srinagar → Airport</li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold text-foreground">Company</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>How it works</li>
              <li>Trust & Safety</li>
              <li>Careers</li>
              <li>Press</li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold text-foreground">Get the app</h4>
            <p className="text-sm text-muted-foreground">
              Coming soon to Android and iOS.
            </p>
            <div className="mt-4 flex gap-3 text-muted-foreground">
              <Instagram className="h-5 w-5 hover:text-foreground" />
              <Twitter className="h-5 w-5 hover:text-foreground" />
              <Facebook className="h-5 w-5 hover:text-foreground" />
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-3 border-t border-border/60 pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} CuKashmir. Made in the Valley.</p>
          <div className="flex gap-4">
            <span>Terms</span>
            <span>Privacy</span>
            <span>Contact</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
