import { useEffect, useState } from "react";
import { MapPin, Navigation, AlertTriangle, WifiOff } from "lucide-react";
import type { LiveLocation } from "@/hooks/useDriverLocation";

type Props = {
  location: LiveLocation | null;
  driverName?: string;
};

// Freshness thresholds (seconds)
const STALE_AFTER = 15; // amber warning
const OFFLINE_AFTER = 60; // red warning

const formatAge = (seconds: number) => {
  if (seconds < 5) return "just now";
  if (seconds < 60) return `${Math.floor(seconds)}s ago`;
  const m = Math.floor(seconds / 60);
  if (m < 60) return `${m}m ${Math.floor(seconds % 60)}s ago`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m ago`;
};

/**
 * Lightweight live-location map using an OpenStreetMap embed (no API key, no extra deps).
 * Shows a prominent "last updated" indicator that ticks every second and warns when stale.
 */
const LiveMap = ({ location, driverName }: Props) => {
  // Tick every second so the freshness label stays accurate without extra fetches
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!location) {
    return (
      <div className="rounded-3xl bg-card p-6 shadow-soft ring-1 ring-border/60">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Navigation className="h-4 w-4 text-muted-foreground" />
          Live location
        </div>
        <div className="mt-4 flex flex-col items-center justify-center rounded-2xl bg-muted/40 px-4 py-10 text-center text-sm text-muted-foreground">
          <MapPin className="mb-2 h-6 w-6" />
          The driver hasn't started sharing their location yet.
        </div>
      </div>
    );
  }

  const { lat, lng, updated_at, speed, accuracy } = location;
  const ageSec = Math.max(0, (now - new Date(updated_at).getTime()) / 1000);
  const isOffline = ageSec >= OFFLINE_AFTER;
  const isStale = !isOffline && ageSec >= STALE_AFTER;
  const isLive = !isStale && !isOffline;

  const delta = 0.01; // ~1km bbox
  const bbox = `${lng - delta},${lat - delta},${lng + delta},${lat + delta}`;
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`;

  // Status visuals
  const statusStyles = isOffline
    ? "bg-destructive/10 text-destructive ring-destructive/30"
    : isStale
      ? "bg-accent/15 text-accent ring-accent/30"
      : "bg-success/10 text-success ring-success/30";

  const dotStyles = isOffline
    ? "bg-destructive"
    : isStale
      ? "bg-accent"
      : "bg-success";

  const statusLabel = isOffline ? "Offline" : isStale ? "Connection lost" : "Live";

  return (
    <div className="rounded-3xl bg-card p-6 shadow-soft ring-1 ring-border/60">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Navigation className="h-4 w-4 text-primary" />
          Live location {driverName ? `· ${driverName}` : ""}
        </div>
        <div
          className={`flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${statusStyles}`}
          role="status"
          aria-live="polite"
        >
          <span className="relative flex h-2.5 w-2.5">
            {isLive && (
              <span className={`absolute inset-0 animate-ping rounded-full opacity-60 ${dotStyles}`} />
            )}
            <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${dotStyles}`} />
          </span>
          {statusLabel}
        </div>
      </div>

      {/* Prominent last-updated banner */}
      <div
        className={`mt-4 flex items-center gap-3 rounded-2xl px-4 py-3 ring-1 ${
          isOffline
            ? "bg-destructive/5 ring-destructive/20"
            : isStale
              ? "bg-accent/5 ring-accent/20"
              : "bg-muted/40 ring-border/40"
        }`}
      >
        {isOffline ? (
          <WifiOff className="h-5 w-5 flex-shrink-0 text-destructive" />
        ) : isStale ? (
          <AlertTriangle className="h-5 w-5 flex-shrink-0 text-accent" />
        ) : (
          <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center">
            <span className={`h-2.5 w-2.5 rounded-full ${dotStyles}`} />
          </span>
        )}
        <div className="flex-1">
          <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Last updated
          </div>
          <div
            className={`font-display text-lg font-bold tabular-nums ${
              isOffline ? "text-destructive" : isStale ? "text-accent" : ""
            }`}
            aria-label={`Last updated ${formatAge(ageSec)}`}
          >
            {formatAge(ageSec)}
          </div>
          {(isStale || isOffline) && (
            <div className="mt-0.5 text-xs text-muted-foreground">
              {isOffline
                ? `${driverName ?? "Driver"} hasn't reported in over ${Math.floor(ageSec / 60)} minute${Math.floor(ageSec / 60) === 1 ? "" : "s"}. Connection may be lost.`
                : `Updates have paused. Position may be outdated.`}
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-border">
        <iframe
          key={`${lat.toFixed(5)}-${lng.toFixed(5)}`}
          title="Driver live location"
          src={src}
          className={`h-72 w-full transition-opacity ${isOffline ? "opacity-60" : ""}`}
          loading="lazy"
        />
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
        <div className="rounded-lg bg-muted/40 p-2 text-center">
          <div className="text-muted-foreground">Lat</div>
          <div className="font-semibold tabular-nums">{lat.toFixed(4)}</div>
        </div>
        <div className="rounded-lg bg-muted/40 p-2 text-center">
          <div className="text-muted-foreground">Lng</div>
          <div className="font-semibold tabular-nums">{lng.toFixed(4)}</div>
        </div>
        <div className="rounded-lg bg-muted/40 p-2 text-center">
          <div className="text-muted-foreground">Speed</div>
          <div className="font-semibold tabular-nums">
            {speed != null ? `${Math.round(speed * 3.6)} km/h` : "—"}
          </div>
        </div>
      </div>

      {accuracy != null && (
        <p className="mt-2 text-center text-[10px] text-muted-foreground">
          Accuracy ±{Math.round(accuracy)} m
        </p>
      )}
    </div>
  );
};

export default LiveMap;
