import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Car, Users, Mountain, Loader2, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Choice = "passenger" | "driver";
type Gender = "male" | "female" | "other" | "prefer_not_to_say";

const Onboarding = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [choice, setChoice] = useState<Choice | null>(null);
  const [checking, setChecking] = useState(true);
  const [saving, setSaving] = useState(false);

  // Bounce away if not logged in, or if already onboarded
  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate("/auth", { replace: true });
      return;
    }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("user_type")
        .eq("user_id", user.id)
        .maybeSingle();
      if (cancelled) return;
      if (data?.user_type) {
        navigate(data.user_type === "driver" ? "/publish/new" : "/search", {
          replace: true,
        });
        return;
      }
      setChecking(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user, loading, navigate]);

  const submit = async () => {
    if (!user || !choice) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ user_type: choice })
      .eq("user_id", user.id);
    setSaving(false);
    if (error) {
      toast.error(error.message ?? "Could not save your choice");
      return;
    }
    toast.success(
      choice === "driver"
        ? "Driver mode set — let's publish a ride!"
        : "Passenger mode set — find your next ride!",
    );
    navigate(choice === "driver" ? "/publish/new" : "/search", { replace: true });
  };

  if (loading || checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-sky">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-sky">
      <div className="container flex min-h-screen flex-col items-center justify-center py-10">
        <div className="w-full max-w-3xl rounded-3xl bg-card p-8 shadow-card ring-1 ring-border/60 md:p-10">
          <div className="flex flex-col items-center text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-soft">
              <Mountain className="h-6 w-6" />
            </span>
            <h1 className="mt-4 font-display text-2xl font-extrabold md:text-3xl">
              How will you use CuKashmir?
            </h1>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              Pick the role that fits you best. We'll tailor your home screen, suggestions
              and shortcuts. You can change this later in your profile.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <RoleCard
              role="passenger"
              title="I'm a passenger"
              desc="Find affordable rides across Kashmir, book a seat in seconds, and chat with the driver."
              icon={<Users className="h-6 w-6" />}
              active={choice === "passenger"}
              onSelect={() => setChoice("passenger")}
            />
            <RoleCard
              role="driver"
              title="I'm a driver"
              desc="Publish rides on your usual routes (Srinagar ↔ Jammu, Sopore, etc.), fill empty seats and share fuel costs."
              icon={<Car className="h-6 w-6" />}
              active={choice === "driver"}
              onSelect={() => setChoice("driver")}
            />
          </div>

          <Button
            onClick={submit}
            disabled={!choice || saving}
            className="mt-8 h-12 w-full rounded-full text-base"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : (
              "Continue"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

const RoleCard = ({
  role,
  title,
  desc,
  icon,
  active,
  onSelect,
}: {
  role: Choice;
  title: string;
  desc: string;
  icon: React.ReactNode;
  active: boolean;
  onSelect: () => void;
}) => (
  <button
    type="button"
    onClick={onSelect}
    aria-pressed={active}
    aria-label={title}
    className={cn(
      "group relative flex h-full flex-col items-start gap-3 rounded-2xl border p-5 text-left transition-all",
      active
        ? "border-primary bg-primary/5 shadow-soft ring-2 ring-primary/30"
        : "border-border bg-background hover:border-primary/40 hover:bg-muted/40",
    )}
  >
    <span
      className={cn(
        "flex h-11 w-11 items-center justify-center rounded-xl transition-colors",
        active
          ? "bg-primary text-primary-foreground"
          : "bg-muted text-foreground group-hover:bg-primary/10 group-hover:text-primary",
      )}
    >
      {icon}
    </span>
    <div>
      <div className="font-display text-lg font-bold">{title}</div>
      <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
    </div>
    {active && (
      <span className="absolute right-4 top-4 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
        <Check className="h-3.5 w-3.5" />
      </span>
    )}
    <span className="sr-only">{role}</span>
  </button>
);

export default Onboarding;
