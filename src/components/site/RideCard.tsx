import { Link } from "react-router-dom";
import { Star, Zap, Clock, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Ride } from "@/data/rides";

const RideCard = ({ ride }: { ride: Ride }) => {
  return (
    <Link
      to={`/ride/${ride.id}`}
      className="group block rounded-3xl bg-card p-5 shadow-soft ring-1 ring-border/60 transition-all duration-300 hover:-translate-y-1 hover:shadow-card hover:ring-primary/30"
    >
      <div className="flex items-start gap-5">
        {/* Time + route */}
        <div className="flex-1">
          <div className="flex items-center gap-3 text-sm">
            <div>
              <div className="font-display text-xl font-bold text-foreground">{ride.departTime}</div>
              <div className="mt-0.5 text-xs text-muted-foreground">{ride.from}</div>
            </div>

            <div className="flex flex-1 flex-col items-center px-2">
              <div className="text-[11px] font-medium text-muted-foreground">{ride.duration}</div>
              <div className="relative my-1 h-px w-full bg-border">
                <div className="absolute left-0 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-primary" />
                <div className="absolute right-0 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-secondary" />
              </div>
              {ride.stops && (
                <div className="text-[10px] text-muted-foreground">
                  via {ride.stops.length - 2} stop{ride.stops.length - 2 !== 1 ? "s" : ""}
                </div>
              )}
            </div>

            <div className="text-right">
              <div className="font-display text-xl font-bold text-foreground">{ride.arriveTime}</div>
              <div className="mt-0.5 text-xs text-muted-foreground">{ride.to}</div>
            </div>
          </div>

          {/* Driver */}
          <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-primary text-sm font-bold text-primary-foreground">
                {ride.driver.initials}
              </div>
              <div>
                <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                  {ride.driver.name}
                  {ride.driver.verified && (
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-success text-[10px] text-success-foreground">
                      ✓
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-0.5">
                    <Star className="h-3 w-3 fill-accent text-accent" />
                    {ride.driver.rating.toFixed(2)}
                  </span>
                  <span>·</span>
                  <span>{ride.driver.trips} trips</span>
                  <span>·</span>
                  <span>{ride.car}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {ride.instantBook && (
                <Badge variant="secondary" className="gap-1 bg-accent/15 text-accent hover:bg-accent/20">
                  <Zap className="h-3 w-3 fill-accent" /> Instant
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Price */}
        <div className="flex flex-col items-end justify-between self-stretch border-l border-border/60 pl-5">
          <div className="text-right">
            <div className="font-display text-2xl font-extrabold text-foreground">
              ₹{ride.pricePerSeat}
            </div>
            <div className="text-xs text-muted-foreground">per seat</div>
          </div>
          <div className="mt-3 text-right">
            <div className="text-xs font-medium text-secondary">{ride.seatsLeft} left</div>
            {ride.seatsTotal !== undefined && ride.seatsTotal - ride.seatsLeft - (ride.seatsHeld ?? 0) > 0 && (
              <div className="text-[11px] text-muted-foreground">
                {ride.seatsTotal - ride.seatsLeft - (ride.seatsHeld ?? 0)} booked
              </div>
            )}
            {(ride.seatsHeld ?? 0) > 0 && (
              <div className="text-[11px] font-medium text-accent">
                {ride.seatsHeld} held
              </div>
            )}
            <Button size="sm" className="mt-2 rounded-full">
              Book
            </Button>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default RideCard;
