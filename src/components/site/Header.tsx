import { Link, useLocation, useNavigate } from "react-router-dom";
import { Mountain, Menu, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useAuth } from "@/contexts/AuthContext";
import RoleSwitcher from "@/components/site/RoleSwitcher";

const navLinks = [
  { to: "/", label: "Find a ride" },
  { to: "/publish", label: "Publish a ride" },
  { to: "/trips", label: "My trips" },
  { to: "/about", label: "How it works" },
];

const Header = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-lg">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold text-primary">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground shadow-soft">
            <Mountain className="h-5 w-5" />
          </span>
          <span>
            Cu<span className="text-accent">Kashmir</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                pathname === l.to
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <>
              <RoleSwitcher />
              <span className="text-sm text-muted-foreground">
                {user.email}
              </span>
              <Button variant="ghost" size="sm" onClick={() => signOut()}>
                <LogOut className="mr-1 h-4 w-4" />
                Sign out
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate("/auth")}>
                Sign in
              </Button>
              <Button size="sm" className="rounded-full" onClick={() => navigate("/auth")}>
                Get started
              </Button>
            </>
          )}
        </div>

        <Sheet>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon" aria-label="Menu">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72">
            <div className="mt-8 flex flex-col gap-2">
              {navLinks.map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  className="rounded-lg px-3 py-2 text-base font-medium hover:bg-muted"
                >
                  {l.label}
                </Link>
              ))}
              <div className="mt-4 flex flex-col gap-2 border-t pt-4">
                {user ? (
                  <>
                    <RoleSwitcher className="w-full justify-between" />
                    <Button variant="outline" onClick={() => signOut()}>
                      <LogOut className="mr-1 h-4 w-4" />
                      Sign out
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" onClick={() => navigate("/auth")}>Sign in</Button>
                    <Button onClick={() => navigate("/auth")}>Get started</Button>
                  </>
                )}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
};

export default Header;
