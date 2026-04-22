import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Send, MessageCircle, Check, CheckCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Message = {
  id: string;
  ride_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  _pending?: boolean;
};

type ReadReceipt = {
  message_id: string;
  user_id: string;
  read_at: string;
};

type Props = {
  rideId: string;
  driverId: string;
  driverName: string;
};

const initialsFor = (name: string) =>
  name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase() || "U";

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

const formatDay = (iso: string) => {
  const d = new Date(iso);
  const today = new Date();
  const sameDay =
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate();
  if (sameDay) return "Today";
  return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
};

const RideChat = ({ rideId, driverId, driverName }: Props) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [text, setText] = useState("");
  const [names, setNames] = useState<Record<string, string>>({});
  const [reads, setReads] = useState<ReadReceipt[]>([]);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Initial load
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("ride_messages")
        .select("*")
        .eq("ride_id", rideId)
        .order("created_at", { ascending: true });
      if (cancelled) return;
      if (error) {
        toast.error("Could not load messages");
        setMessages([]);
      } else {
        setMessages((data ?? []) as Message[]);
      }
      setLoading(false);
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [rideId]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`ride_messages:${rideId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "ride_messages",
          filter: `ride_id=eq.${rideId}`,
        },
        (payload) => {
          const m = payload.new as Message;
          setMessages((prev) =>
            prev.some((x) => x.id === m.id) ? prev : [...prev, m],
          );
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [rideId]);

  // Resolve sender display names
  useEffect(() => {
    const ids = Array.from(new Set(messages.map((m) => m.sender_id))).filter(
      (id) => !(id in names),
    );
    if (ids.length === 0) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("user_id, display_name")
        .in("user_id", ids);
      if (cancelled || !data) return;
      setNames((prev) => {
        const next = { ...prev };
        for (const p of data) {
          next[p.user_id] = p.display_name ?? "User";
        }
        return next;
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [messages, names]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length, loading]);

  const grouped = useMemo(() => {
    const groups: { day: string; items: Message[] }[] = [];
    for (const m of messages) {
      const day = formatDay(m.created_at);
      const last = groups[groups.length - 1];
      if (last && last.day === day) last.items.push(m);
      else groups.push({ day, items: [m] });
    }
    return groups;
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const body = text.trim();
    if (!body) return;
    if (body.length > 2000) {
      toast.error("Message is too long");
      return;
    }
    setSending(true);
    const { error } = await supabase.from("ride_messages").insert({
      ride_id: rideId,
      sender_id: user.id,
      body,
    });
    setSending(false);
    if (error) {
      toast.error(error.message ?? "Could not send message");
      return;
    }
    setText("");
  };

  const nameOf = (senderId: string) => {
    if (senderId === user?.id) return "You";
    if (senderId === driverId) return driverName;
    return names[senderId] ?? "Passenger";
  };

  return (
    <div className="rounded-3xl bg-card shadow-soft ring-1 ring-border/60">
      <div className="flex items-center gap-3 border-b border-border/60 px-6 py-4">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
          <MessageCircle className="h-4 w-4" />
        </span>
        <div>
          <div className="text-sm font-semibold">Ride chat</div>
          <div className="text-xs text-muted-foreground">
            Coordinate pickup & details with {driverId === user?.id ? "your passengers" : driverName}
          </div>
        </div>
      </div>

      <div ref={scrollRef} className="max-h-[420px] min-h-[260px] space-y-5 overflow-y-auto px-6 py-5">
        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-40 flex-col items-center justify-center text-center text-sm text-muted-foreground">
            <MessageCircle className="mb-2 h-6 w-6" />
            No messages yet. Say hi 👋
          </div>
        ) : (
          grouped.map((g) => (
            <div key={g.day} className="space-y-3">
              <div className="flex items-center justify-center">
                <span className="rounded-full bg-muted px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  {g.day}
                </span>
              </div>
              {g.items.map((m) => {
                const mine = m.sender_id === user?.id;
                const senderName = nameOf(m.sender_id);
                return (
                  <div
                    key={m.id}
                    className={`flex items-end gap-2 ${mine ? "flex-row-reverse" : ""}`}
                  >
                    <div
                      className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                        mine
                          ? "bg-accent text-accent-foreground"
                          : "bg-gradient-primary text-primary-foreground"
                      }`}
                      aria-hidden
                    >
                      {initialsFor(senderName === "You" ? "Me" : senderName)}
                    </div>
                    <div className={`max-w-[78%] ${mine ? "items-end" : "items-start"} flex flex-col`}>
                      <div className="px-1 text-[11px] text-muted-foreground">
                        {senderName} · {formatTime(m.created_at)}
                      </div>
                      <div
                        className={`mt-1 whitespace-pre-wrap break-words rounded-2xl px-4 py-2 text-sm shadow-soft ${
                          mine
                            ? "rounded-br-md bg-primary text-primary-foreground"
                            : "rounded-bl-md bg-muted text-foreground"
                        }`}
                      >
                        {m.body}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>

      <form
        onSubmit={handleSend}
        className="flex items-center gap-2 border-t border-border/60 px-4 py-3"
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write a message..."
          maxLength={2000}
          className="flex-1 rounded-full border border-border bg-background px-4 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          disabled={sending}
        />
        <Button
          type="submit"
          size="icon"
          disabled={sending || text.trim().length === 0}
          className="rounded-full"
          aria-label="Send message"
        >
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </form>
    </div>
  );
};

export default RideChat;
