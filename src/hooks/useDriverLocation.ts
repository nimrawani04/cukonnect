import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type LiveLocation = {
  lat: number;
  lng: number;
  heading: number | null;
  speed: number | null;
  accuracy: number | null;
  updated_at: string;
};

/**
 * Driver-side hook: shares the browser's GPS to driver_locations for the given ride.
 * Throttles updates to once every ~5 seconds to keep writes light.
 */
export function useShareDriverLocation(rideId: string | null, driverId: string | null) {
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const lastSentRef = useRef<number>(0);

  const stop = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setSharing(false);
  };

  const start = () => {
    if (!rideId || !driverId) return;
    if (!("geolocation" in navigator)) {
      setError("Your browser does not support GPS");
      toast.error("GPS is not supported in this browser");
      return;
    }
    setError(null);
    setSharing(true);
    watchIdRef.current = navigator.geolocation.watchPosition(
      async (pos) => {
        const now = Date.now();
        // Throttle to ~1 write / 5 seconds
        if (now - lastSentRef.current < 5000) return;
        lastSentRef.current = now;
        const { latitude, longitude, heading, speed, accuracy } = pos.coords;
        const { error: upsertErr } = await supabase
          .from("driver_locations")
          .upsert({
            ride_id: rideId,
            driver_id: driverId,
            lat: latitude,
            lng: longitude,
            heading: heading ?? null,
            speed: speed ?? null,
            accuracy: accuracy ?? null,
            updated_at: new Date().toISOString(),
          });
        if (upsertErr) {
          // Don't spam the user — log once
          console.error("Live location write failed", upsertErr);
        }
      },
      (geoErr) => {
        setError(geoErr.message);
        toast.error(`GPS error: ${geoErr.message}`);
        stop();
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 },
    );
  };

  useEffect(() => () => stop(), []);

  return { sharing, error, start, stop };
}

/**
 * Passenger / driver read hook: subscribes to live location for the ride.
 */
export function useLiveDriverLocation(rideId: string | null) {
  const [location, setLocation] = useState<LiveLocation | null>(null);

  useEffect(() => {
    if (!rideId) return;
    let cancelled = false;

    const load = async () => {
      const { data } = await supabase
        .from("driver_locations")
        .select("lat, lng, heading, speed, accuracy, updated_at")
        .eq("ride_id", rideId)
        .maybeSingle();
      if (!cancelled && data) setLocation(data as LiveLocation);
    };
    load();

    const channel = supabase
      .channel(`driver-loc-${rideId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "driver_locations", filter: `ride_id=eq.${rideId}` },
        (payload) => {
          const row = (payload.new ?? payload.old) as LiveLocation | undefined;
          if (row && payload.eventType !== "DELETE") setLocation(row);
          if (payload.eventType === "DELETE") setLocation(null);
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [rideId]);

  return location;
}
