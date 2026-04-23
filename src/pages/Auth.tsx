import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mountain, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const Auth = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate("/trips", { replace: true });
  }, [user, loading, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const redirectUrl = `${window.location.origin}/trips`;
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectUrl,
            data: { display_name: displayName || email.split("@")[0] },
          },
        });
        if (error) throw error;
        toast.success("Welcome aboard!", { description: "Your account has been created." });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Signed in");
      }
    } catch (err: any) {
      toast.error(err?.message ?? "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  const signInWithGoogle = async () => {
    setBusy(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: `${window.location.origin}/trips`,
      });
      if (result.error) throw result.error;
      if (result.redirected) return;
      navigate("/trips", { replace: true });
    } catch (err: any) {
      toast.error(err?.message ?? "Google sign-in failed");
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-sky">
      <div className="container flex min-h-screen flex-col items-center justify-center py-10">
        <Link to="/" className="mb-6 inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>

        <div className="w-full max-w-md rounded-3xl bg-card p-8 shadow-card ring-1 ring-border/60">
          <div className="flex flex-col items-center text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-soft">
              <Mountain className="h-6 w-6" />
            </span>
            <h1 className="mt-4 font-display text-2xl font-extrabold">
              {mode === "signup" ? "Create your account" : "Welcome back"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {mode === "signup"
                ? "Join Kashmir's intercity ride network."
                : "Sign in to book rides and manage trips."}
            </p>
          </div>

          <form onSubmit={submit} className="mt-8 space-y-4">
            {mode === "signup" && (
              <div>
                <Label htmlFor="name">Full name</Label>
                <Input
                  id="name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Bilal Ahmad"
                  className="mt-2 h-12 rounded-xl"
                />
              </div>
            )}
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="mt-2 h-12 rounded-xl"
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="mt-2 h-12 rounded-xl"
              />
            </div>

            <Button type="submit" disabled={busy} className="h-12 w-full rounded-full text-base">
              {busy ? "Please wait…" : mode === "signup" ? "Create account" : "Sign in"}
            </Button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs uppercase tracking-wider text-muted-foreground">or</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={signInWithGoogle}
            className="h-12 w-full rounded-full text-base"
          >
            <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" aria-hidden>
              <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.24 1.4-1.66 4.1-5.5 4.1-3.31 0-6.01-2.74-6.01-6.1S8.69 5.9 12 5.9c1.88 0 3.14.8 3.86 1.49l2.64-2.55C16.86 3.27 14.65 2.4 12 2.4 6.86 2.4 2.7 6.55 2.7 11.7s4.16 9.3 9.3 9.3c5.37 0 8.92-3.77 8.92-9.08 0-.61-.07-1.08-.16-1.55H12z"/>
            </svg>
            Continue with Google
          </Button>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {mode === "signup" ? "Already have an account?" : "New to CuKashmir?"}{" "}
            <button
              type="button"
              onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
              className="font-semibold text-primary hover:underline"
            >
              {mode === "signup" ? "Sign in" : "Create one"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
