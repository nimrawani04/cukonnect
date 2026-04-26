import { useEffect, useState } from "react";
import { Phone, PhoneOff, Loader2, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { z } from "zod";

// Loose international format: optional +, 7-15 digits, allow spaces/dashes for input.
const phoneSchema = z
  .string()
  .trim()
  .min(7, "Phone number is too short")
  .max(20, "Phone number is too long")
  .regex(/^\+?[0-9\s\-()]{7,20}$/, "Use digits only, optionally starting with +");

type Props = {
  /** Called when changes save successfully so the parent can refresh driver info. */
  onSaved?: () => void;
};

const DriverContactSettings = ({ onSaved }: Props) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [phone, setPhone] = useState("");
  const [share, setShare] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("phone, share_phone")
        .eq("user_id", user.id)
        .maybeSingle();
      if (cancelled) return;
      setPhone(data?.phone ?? "");
      setShare(Boolean(data?.share_phone));
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setError(null);

    // Validate only when sharing is on (or a phone is provided)
    let phoneToSave: string | null = phone.trim() || null;
    if (share || phoneToSave) {
      const parsed = phoneSchema.safeParse(phone);
      if (!parsed.success) {
        const msg = parsed.error.issues[0]?.message ?? "Invalid phone";
        setError(msg);
        return;
      }
      phoneToSave = parsed.data;
    }
    if (share && !phoneToSave) {
      setError("Add a phone number to enable sharing");
      return;
    }

    setSaving(true);
    const { error: updErr } = await supabase
      .from("profiles")
      .update({ phone: phoneToSave, share_phone: share })
      .eq("user_id", user.id);
    setSaving(false);

    if (updErr) {
      toast.error(updErr.message ?? "Could not save your contact settings");
      return;
    }
    toast.success(
      share
        ? "Passengers with a booking can now call you"
        : "Phone number saved (private)",
    );
    onSaved?.();
  };

  if (loading) {
    return (
      <div className="rounded-3xl bg-card p-6 shadow-soft ring-1 ring-border/60">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading contact settings…
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl bg-card p-6 shadow-soft ring-1 ring-border/60">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Phone className="h-4 w-4 text-primary" />
          Driver contact
        </div>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Optionally let passengers call you. Your number stays hidden until you turn this on,
        and only passengers with an active booking can see it.
      </p>

      <div className="mt-4 space-y-4">
        <div>
          <Label htmlFor="driver-phone" className="text-xs font-medium">
            Phone number
          </Label>
          <Input
            id="driver-phone"
            type="tel"
            inputMode="tel"
            placeholder="+91 98765 43210"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              if (error) setError(null);
            }}
            maxLength={20}
            className="mt-1"
          />
          {error && (
            <div className="mt-1 text-xs font-medium text-destructive">{error}</div>
          )}
        </div>

        <div className="flex items-start justify-between gap-3 rounded-2xl bg-muted/40 p-3">
          <div className="flex-1">
            <Label htmlFor="share-phone" className="text-sm font-semibold">
              Allow passengers to call me
            </Label>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {share ? (
                <span className="inline-flex items-center gap-1 text-success">
                  <Phone className="h-3 w-3" /> Visible to confirmed passengers
                </span>
              ) : (
                <span className="inline-flex items-center gap-1">
                  <PhoneOff className="h-3 w-3" /> Hidden from everyone
                </span>
              )}
            </p>
          </div>
          <Switch id="share-phone" checked={share} onCheckedChange={setShare} />
        </div>

        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full rounded-full"
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving…
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save contact settings
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default DriverContactSettings;
