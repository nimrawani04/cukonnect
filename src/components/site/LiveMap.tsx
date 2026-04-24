import { MapPin, Navigation } from "lucide-react";
import type { LiveLocation } from "@/hooks/useDriverLocation";
import { formatDistanceToNow } from "date-fns";

type Props = {
  location: LiveLocation | null;
  driverName?: string;
};

/**
 * Lightweight live-location map using an OpenStreetMap embed (no API key, no extra deps).
 * Re-renders the iframe when coordinates change to move the marker.
 */
const LiveMap = ({ location, driverName }: Props) => {
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
  const delta = 0.01; // ~1km bbox
  const bbox = `${lng - delta},${lat - delta},${lng + delta},${lat + delta}`;
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`;

  return (
    <div className="rounded-3xl bg-card p-6 shadow-soft ring-1 ring-border/60">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inset-0 animate-ping rounded-full bg-success/60" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-success" />
          </span>
          Live location {driverName ? `· ${driverName}` : ""}
        </div>
        <span className="text-xs text-muted-foreground">
          updated {formatDistanceToNow(new Date(updated_at), { addSuffix: true })}
        </span>
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-border">
        <iframe
          key={`${lat.toFixed(5)}-${lng.toFixed(5)}`}
          title="Driver live location"
          src={src}
          className="h-72 w-full"
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
