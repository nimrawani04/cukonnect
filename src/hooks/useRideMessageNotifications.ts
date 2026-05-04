import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Subscribes to new ride_messages for rides the user is actively involved in
 * (own active rides + confirmed bookings) and surfaces them as in-app toasts
 * + browser notifications.
 *
 * Notifications are automatically suppressed/dismissed once the user opens
 * the corresponding ride chat (which also marks messages as read via
 * ride_message_reads).
 */
export function useRideMessageNotifications() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Cache of rideId -> a friendly label ("Mumbai → Pune")
  const rideLabels = useRef<Record<string, string>>({});
  // Cache of senderId -> display name
  const senderNames = useRef<Record<string, string>>({});
  // Active toast ids per ride (so we can dismiss when chat is opened/read)
  const activeToasts = useRef<Record<string, Array<string | number>>>({});
  // Active native notifications per ride
  const activeNotifications = useRef<Record<string, Notification[]>>({});

  // Helper: clear all surfaced notifications for a given ride
  const clearForRide = (rideId: string) => {
    const ids = activeToasts.current[rideId];
    if (ids?.length) {
      ids.forEach((id) => toast.dismiss(id));
      activeToasts.current[rideId] = [];
    }
    const notes = activeNotifications.current[rideId];
    if (notes?.length) {
      notes.forEach((n) => {
        try {
          n.close();
        } catch {
          /* noop */
        }
      });
      activeNotifications.current[rideId] = [];
    }
  };

  // When the user navigates to a ride page, dismiss any pending alerts for it
  useEffect(() => {
    const match = location.pathname.match(/^\/ride\/([^/]+)/);
    if (match) clearForRide(match[1]);
  }, [location.pathname]);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    // Ask for notification permission once (non-blocking).
    if (
      typeof window !== "undefined" &&
      "Notification" in window &&
      Notification.permission === "default"
    ) {
      try {
        Notification.requestPermission().catch(() => {});
      } catch {
        /* noop */
      }
    }

    const showNotification = async (rideId: string, senderId: string, body: string) => {
      // Resolve ride label
      let label = rideLabels.current[rideId];
      if (!label) {
        const { data } = await supabase
          .from("rides")
          .select("from_location, to_location")
          .eq("id", rideId)
          .maybeSingle();
        label = data ? `${data.from_location} → ${data.to_location}` : "Ride chat";
        rideLabels.current[rideId] = label;
      }

      // Resolve sender name
      let sender = senderNames.current[senderId];
      if (!sender) {
        const { data } = await supabase
          .from("profiles")
          .select("display_name")
          .eq("user_id", senderId)
          .maybeSingle();
        sender = data?.display_name ?? "Someone";
        senderNames.current[senderId] = sender;
      }

      // Don't notify if the user is already viewing this ride
      const onThisRide =
        typeof window !== "undefined" &&
        window.location.pathname === `/ride/${rideId}`;

      if (onThisRide) return;

      const tId = toast(`${sender} · ${label}`, {
        description: body.length > 120 ? `${body.slice(0, 117)}…` : body,
        action: {
          label: "View",
          onClick: () => navigate(`/ride/${rideId}`),
        },
      });
      (activeToasts.current[rideId] ||= []).push(tId);

      // Native browser notification (only when tab not focused)
      if (
        typeof window !== "undefined" &&
        "Notification" in window &&
        Notification.permission === "granted" &&
        document.visibilityState !== "visible"
      ) {
        try {
          const n = new Notification(`${sender} · ${label}`, {
            body,
            tag: `ride-${rideId}`,
          });
          n.onclick = () => {
            window.focus();
            navigate(`/ride/${rideId}`);
            clearForRide(rideId);
            n.close();
          };
          (activeNotifications.current[rideId] ||= []).push(n);
        } catch {
          /* noop */
        }
      }
    };

    const collectRideIds = async () => {
      const { data: ownRides } = await supabase
        .from("rides")
        .select("id")
        .eq("driver_id", user.id)
        .eq("status", "active");

      const { data: bookings } = await supabase
        .from("bookings")
        .select("ride_id, status, rides!inner(status)")
        .eq("passenger_id", user.id)
        .eq("status", "confirmed");

      if (cancelled) return [] as string[];

      const ids = new Set<string>();
      (ownRides ?? []).forEach((r) => ids.add(r.id));
      (bookings ?? []).forEach((b: { ride_id: string; rides: { status: string } }) => {
        if (b.rides?.status === "active") ids.add(b.ride_id);
      });
      return Array.from(ids);
    };

    let channel: ReturnType<typeof supabase.channel> | null = null;

    (async () => {
      const rideIds = await collectRideIds();
      if (cancelled || rideIds.length === 0) return;

      channel = supabase.channel(`user-ride-messages:${user.id}`);
      for (const rid of rideIds) {
        channel.on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "ride_messages",
            filter: `ride_id=eq.${rid}`,
          },
          (payload) => {
            const m = payload.new as {
              ride_id: string;
              sender_id: string;
              body: string;
            };
            if (m.sender_id === user.id) return;
            void showNotification(m.ride_id, m.sender_id, m.body);
          },
        );

        // When the user marks messages as read (from RideChat), clear alerts
        channel.on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "ride_message_reads",
            filter: `ride_id=eq.${rid}`,
          },
          (payload) => {
            const r = payload.new as { ride_id: string; user_id: string };
            if (r.user_id === user.id) clearForRide(r.ride_id);
          },
        );
      }
      channel.subscribe();
    })();

    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, [user, navigate]);
}
