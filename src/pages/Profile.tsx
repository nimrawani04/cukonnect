import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, User, Settings as SettingsIcon, Sun, Moon, Monitor, Phone, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme, type Theme } from "@/hooks/useTheme";
import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Gender = "male" | "female" | "other" | "prefer_not_to_say";
type UserType = "passenger" | "driver";

const Profile = () => {
  const navigate = useNavigate();
  const { user, loading, signOut } = useAuth();
  const { theme, setTheme } = useTheme();

  const [loadingProfile, setLoadingProfile] = useState(true);
  const [saving, setSaving] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [gender, setGender] = useState<Gender | "">("");
  const [userType, setUserType] = useState<UserType | "">("");
  const [sharePhone, setSharePhone] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate("/auth", { replace: true });
      return;
    }
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("display_name, phone, avatar_url, gender, user_type, share_phone")
        .eq("user_id", user.id)
        .maybeSingle();
      if (cancelled) return;
      if (error) toast.error(error.message);
      if (data) {
        setDisplayName(data.display_name ?? "");
        setPhone(data.phone ?? "");
        setAvatarUrl(data.avatar_url ?? "");
        setGender((data.gender as Gender) ?? "");
        setUserType((data.user_type as UserType) ?? "");
        setSharePhone(data.share_phone ?? false);
      }
      setLoadingProfile(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user, loading, navigate]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: displayName || null,
        phone: phone || null,
        avatar_url: avatarUrl || null,
        gender: (gender || null) as Gender | null,
        user_type: (userType || null) as UserType | null,
        share_phone: sharePhone,
      })
      .eq("user_id", user.id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Profile updated");
  };

  if (loading || loadingProfile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-sky">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const initials = (displayName || user?.email || "?").slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container max-w-3xl py-10">
        <div className="mb-8 flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-gradient-primary text-xl font-bold text-primary-foreground shadow-soft">
            {avatarUrl ? (
              <img src={avatarUrl} alt={displayName} className="h-full w-full object-cover" />
            ) : (
              initials
            )}
          </div>
          <div>
            <h1 className="font-display text-3xl font-extrabold">{displayName || "Your profile"}</h1>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
        </div>

        <Tabs defaultValue="profile">
          <TabsList className="grid w-full max-w-sm grid-cols-2">
            <TabsTrigger value="profile">
              <User className="mr-2 h-4 w-4" /> Profile
            </TabsTrigger>
            <TabsTrigger value="settings">
              <SettingsIcon className="mr-2 h-4 w-4" /> Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="mt-6">
            <div className="rounded-3xl bg-card p-6 shadow-soft ring-1 ring-border/60 md:p-8">
              <div className="grid gap-5">
                <div className="grid gap-2">
                  <Label htmlFor="displayName">Display name</Label>
                  <Input id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your name" />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="phone">Phone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="pl-9" placeholder="+91..." />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="avatar">Avatar URL</Label>
                  <Input id="avatar" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://..." />
                </div>

                <div className="grid gap-2">
                  <Label>Gender</Label>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {(["female", "male", "other", "prefer_not_to_say"] as Gender[]).map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setGender(g)}
                        className={cn(
                          "rounded-xl border px-3 py-2.5 text-sm font-medium transition-all",
                          gender === g
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground",
                        )}
                      >
                        {g === "prefer_not_to_say" ? "Prefer not to say" : g.charAt(0).toUpperCase() + g.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label>I use CuKashmir as a</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {(["passenger", "driver"] as UserType[]).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setUserType(t)}
                        className={cn(
                          "rounded-xl border px-3 py-2.5 text-sm font-medium capitalize transition-all",
                          userType === t
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground",
                        )}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <Button onClick={save} disabled={saving} className="mt-8 h-11 rounded-full px-6">
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save changes
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="mt-6">
            <div className="space-y-6">
              <div className="rounded-3xl bg-card p-6 shadow-soft ring-1 ring-border/60 md:p-8">
                <h2 className="font-display text-lg font-bold">Appearance</h2>
                <p className="mt-1 text-sm text-muted-foreground">Choose how CuKashmir looks on this device.</p>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {(
                    [
                      { id: "light", label: "Light", icon: <Sun className="h-4 w-4" /> },
                      { id: "dark", label: "Dark", icon: <Moon className="h-4 w-4" /> },
                      { id: "system", label: "System", icon: <Monitor className="h-4 w-4" /> },
                    ] as { id: Theme; label: string; icon: JSX.Element }[]
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setTheme(opt.id)}
                      className={cn(
                        "flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-medium transition-all",
                        theme === opt.id
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground",
                      )}
                    >
                      {opt.icon}
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl bg-card p-6 shadow-soft ring-1 ring-border/60 md:p-8">
                <h2 className="font-display text-lg font-bold">Privacy</h2>
                <div className="mt-4 flex items-center justify-between gap-4">
                  <div>
                    <div className="text-sm font-medium">Share phone number with co-travellers</div>
                    <p className="text-xs text-muted-foreground">Let confirmed passengers/drivers see your phone for coordination.</p>
                  </div>
                  <Switch checked={sharePhone} onCheckedChange={setSharePhone} />
                </div>
                <Button onClick={save} disabled={saving} variant="outline" className="mt-5 rounded-full">
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Save privacy
                </Button>
              </div>

              <div className="rounded-3xl bg-card p-6 shadow-soft ring-1 ring-border/60 md:p-8">
                <h2 className="font-display text-lg font-bold">Account</h2>
                <p className="mt-1 text-sm text-muted-foreground">Sign out from this device.</p>
                <Button variant="destructive" className="mt-4 rounded-full" onClick={() => signOut().then(() => navigate("/"))}>
                  Sign out
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      <Footer />
    </div>
  );
};

export default Profile;
