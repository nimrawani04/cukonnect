import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Send, MessageCircle, Check, CheckCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
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
  /** When false, the chat is read-only with an "expired" notice. */
  active?: boolean;
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

const formatFullDateTime = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

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

const RideChat = ({ rideId, driverId, driverName, active = true }: Props) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [text, setText] = useState("");
  const [names, setNames] = useState<Record<string, string>>({});
  const [reads, setReads] = useState<ReadReceipt[]>([]);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Initial load (messages + read receipts)
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      const [{ data: msgs, error: msgErr }, { data: rcpts }] = await Promise.all([
        supabase
          .from("ride_messages")
          .select("*")
          .eq("ride_id", rideId)
          .order("created_at", { ascending: true }),
        supabase
          .from("ride_message_reads")
          .select("message_id, user_id, read_at")
          .eq("ride_id", rideId),
      ]);
      if (cancelled) return;
      if (msgErr) {
        toast.error("Could not load messages");
        setMessages([]);
      } else {
        setMessages((msgs ?? []) as Message[]);
      }
      setReads((rcpts ?? []) as ReadReceipt[]);
      setLoading(false);
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [rideId]);

  // Realtime subscription — messages + read receipts
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
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "ride_message_reads",
          filter: `ride_id=eq.${rideId}`,
        },
        (payload) => {
          const r = payload.new as ReadReceipt;
          setReads((prev) =>
            prev.some((x) => x.message_id === r.message_id && x.user_id === r.user_id)
              ? prev
              : [...prev, r],
          );
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [rideId]);

  // Mark incoming messages as read for the current user
  useEffect(() => {
    if (!user) return;
    const unread = messages.filter(
      (m) =>
        !m._pending &&
        m.sender_id !== user.id &&
        !reads.some((r) => r.message_id === m.id && r.user_id === user.id),
    );
    if (unread.length === 0) return;
    let cancelled = false;
    (async () => {
      const rows = unread.map((m) => ({
        message_id: m.id,
        user_id: user.id,
        ride_id: rideId,
      }));
      const { error } = await supabase.from("ride_message_reads").insert(rows);
      if (cancelled || error) return;
      // Optimistically reflect own reads (realtime will dedupe)
      setReads((prev) => {
        const next = [...prev];
        const now = new Date().toISOString();
        for (const r of rows) {
          if (!next.some((x) => x.message_id === r.message_id && x.user_id === r.user_id)) {
            next.push({ ...r, read_at: now });
          }
        }
        return next;
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [messages, reads, user, rideId]);

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
    const tempId = `temp-${crypto.randomUUID()}`;
    const optimistic: Message = {
      id: tempId,
      ride_id: rideId,
      sender_id: user.id,
      body,
      created_at: new Date().toISOString(),
      _pending: true,
    };
    setMessages((prev) => [...prev, optimistic]);
    setText("");
    setSending(true);
    const { data, error } = await supabase
      .from("ride_messages")
      .insert({ ride_id: rideId, sender_id: user.id, body })
      .select()
      .single();
    setSending(false);
    if (error || !data) {
      // Remove optimistic and surface error
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      toast.error(error?.message ?? "Could not send message");
      return;
    }
    // Replace optimistic with confirmed row
    setMessages((prev) => {
      const withoutTemp = prev.filter((m) => m.id !== tempId);
      return withoutTemp.some((m) => m.id === data.id)
        ? withoutTemp
        : [...withoutTemp, data as Message];
    });
  };

  const nameOf = (senderId: string) => {
    if (senderId === user?.id) return "You";
    if (senderId === driverId) return driverName;
    return names[senderId] ?? "Passenger";
  };

  const statusFor = (
    m: Message,
  ): {
    state: "sending" | "sent" | "read";
    readers: { user_id: string; read_at: string }[];
  } => {
    if (m._pending) return { state: "sending", readers: [] };
    const readers = reads
      .filter((r) => r.message_id === m.id && r.user_id !== m.sender_id)
      .sort((a, b) => new Date(a.read_at).getTime() - new Date(b.read_at).getTime());
    return { state: readers.length > 0 ? "read" : "sent", readers };
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
                const status = mine ? statusFor(m) : null;
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
                        } ${m._pending ? "opacity-70" : ""}`}
                      >
                        {m.body}
                      </div>
                      {mine && status && (
                        <div
                          className="mt-1 flex items-center gap-1 px-1 text-[10px] text-muted-foreground"
                          aria-label={`Message ${status.state}`}
                        >
                          {status.state === "sending" && (
                            <>
                              <Loader2 className="h-3 w-3 animate-spin" />
                              <span>Sending</span>
                            </>
                          )}
                          {status.state === "sent" && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  type="button"
                                  className="flex items-center gap-1 outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                                >
                                  <Check className="h-3 w-3" />
                                  <span>Sent · {formatTime(m.created_at)}</span>
                                </button>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="text-xs">
                                <div className="font-medium">Delivered</div>
                                <div className="text-muted-foreground">
                                  Sent {formatFullDateTime(m.created_at)}
                                </div>
                                <div className="text-muted-foreground">Not read yet</div>
                              </TooltipContent>
                            </Tooltip>
                          )}
                          {status.state === "read" && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  type="button"
                                  className="flex items-center gap-1 outline-none focus-visible:ring-2 focus-visible:ring-ring rounded text-primary"
                                >
                                  <CheckCheck className="h-3 w-3" />
                                  <span>Read · {formatTime(status.readers[status.readers.length - 1].read_at)}</span>
                                </button>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="text-xs">
                                <div className="font-medium">Read receipts</div>
                                <div className="text-muted-foreground">
                                  Sent {formatFullDateTime(m.created_at)}
                                </div>
                                <div className="mt-1 space-y-0.5">
                                  {status.readers.map((r) => (
                                    <div key={r.user_id}>
                                      {nameOf(r.user_id)} · {formatFullDateTime(r.read_at)}
                                    </div>
                                  ))}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      )}
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
