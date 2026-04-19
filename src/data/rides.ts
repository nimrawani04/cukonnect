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

export const MOCK_RIDES: Ride[] = [
  {
    id: "r1",
    driver: { name: "Bilal Ahmad", rating: 4.9, trips: 142, verified: true, initials: "BA" },
    from: "Srinagar",
    to: "Jammu",
    date: new Date().toISOString(),
    departTime: "06:30",
    arriveTime: "14:00",
    duration: "7h 30m",
    pricePerSeat: 850,
    seatsLeft: 3,
    car: "Toyota Innova",
    amenities: ["AC", "Music", "Luggage"],
    instantBook: true,
    stops: ["Srinagar TRC", "Qazigund", "Banihal", "Jammu Bus Stand"],
  },
  {
    id: "r2",
    driver: { name: "Mehraj Dar", rating: 4.7, trips: 89, verified: true, initials: "MD" },
    from: "Srinagar",
    to: "Jammu",
    date: new Date().toISOString(),
    departTime: "08:00",
    arriveTime: "15:45",
    duration: "7h 45m",
    pricePerSeat: 750,
    seatsLeft: 2,
    car: "Maruti Ertiga",
    amenities: ["AC", "Charger"],
    instantBook: false,
    stops: ["Lal Chowk", "Pampore", "Qazigund", "Jammu"],
  },
  {
    id: "r3",
    driver: { name: "Aamir Wani", rating: 4.95, trips: 230, verified: true, initials: "AW" },
    from: "Srinagar",
    to: "Jammu",
    date: new Date().toISOString(),
    departTime: "21:00",
    arriveTime: "04:30",
    duration: "7h 30m",
    pricePerSeat: 900,
    seatsLeft: 4,
    car: "Tempo Traveller",
    amenities: ["AC", "Recliner", "Wi-Fi"],
    instantBook: true,
    stops: ["Srinagar TRC", "Qazigund", "Udhampur", "Jammu"],
  },
  {
    id: "r4",
    driver: { name: "Suhail Bhat", rating: 4.6, trips: 54, verified: true, initials: "SB" },
    from: "Srinagar",
    to: "Jammu",
    date: new Date().toISOString(),
    departTime: "10:30",
    arriveTime: "18:30",
    duration: "8h 00m",
    pricePerSeat: 700,
    seatsLeft: 1,
    car: "Hyundai Aura",
    amenities: ["AC"],
    instantBook: true,
  },
];
