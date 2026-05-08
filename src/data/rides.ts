export type Ride = {
  id: string;
  driver: { name: string; rating: number; trips: number; verified: boolean; initials: string };
  from: string;
  to: string;
  date: string; // ISO
  departTime: string;
  arriveTime: string;
  duration: string;
  pricePerSeat: number;
  seatsLeft: number;
  seatsTotal?: number;
  car: string;
  amenities: string[];
  instantBook: boolean;
  stops?: string[];
};

export const POPULAR_ROUTES = [
  { from: "Srinagar", to: "Jammu", price: 850, duration: "7h 30m", image: "jammu" },
  { from: "Srinagar", to: "Baramulla", price: 180, duration: "1h 20m", image: "baramulla" },
  { from: "Srinagar", to: "Anantnag", price: 220, duration: "1h 40m", image: "anantnag" },
  { from: "Srinagar", to: "Airport", price: 250, duration: "0h 45m", image: "airport" },
  { from: "Srinagar", to: "Sopore", price: 200, duration: "1h 30m", image: "sopore" },
  { from: "Ganderbal", to: "Srinagar", price: 120, duration: "0h 40m", image: "srinagar" },
] as const;

// Mock rides removed: the app now uses real, realtime data from Supabase.
// See src/pages/Search.tsx for the live query + realtime subscription.
