export type TripStatus = "upcoming" | "completed" | "cancelled";
export type TripRole = "passenger" | "driver";

export type Trip = {
  id: string;
  role: TripRole;
  status: TripStatus;
  from: string;
  to: string;
  date: string; // ISO
  departTime: string;
  arriveTime: string;
  duration: string;
  pricePerSeat: number;
  car: string;
  // For passenger trips
  driver?: { name: string; rating: number; initials: string; verified: boolean };
  seatsBooked?: number;
  paymentStatus?: "paid" | "cash" | "refunded";
  // For driver trips
  passengers?: { name: string; initials: string; seats: number; status: "confirmed" | "pending" }[];
  seatsTotal?: number;
  earnings?: number;
  cancellationReason?: string;
};

const today = new Date();
const addDays = (d: Date, n: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x.toISOString();
};

export const MOCK_TRIPS: Trip[] = [
  // Passenger — upcoming
  {
    id: "p1",
    role: "passenger",
    status: "upcoming",
    from: "Srinagar",
    to: "Jammu",
    date: addDays(today, 2),
    departTime: "06:30",
    arriveTime: "14:00",
    duration: "7h 30m",
    pricePerSeat: 850,
    car: "Toyota Innova",
    driver: { name: "Bilal Ahmad", rating: 4.9, initials: "BA", verified: true },
    seatsBooked: 1,
    paymentStatus: "paid",
  },
  {
    id: "p2",
    role: "passenger",
    status: "upcoming",
    from: "Srinagar",
    to: "Anantnag",
    date: addDays(today, 5),
    departTime: "09:00",
    arriveTime: "10:40",
    duration: "1h 40m",
    pricePerSeat: 220,
    car: "Maruti Ertiga",
    driver: { name: "Aamir Wani", rating: 4.95, initials: "AW", verified: true },
    seatsBooked: 2,
    paymentStatus: "cash",
  },
  // Passenger — completed
  {
    id: "p3",
    role: "passenger",
    status: "completed",
    from: "Srinagar",
    to: "Baramulla",
    date: addDays(today, -7),
    departTime: "08:15",
    arriveTime: "09:35",
    duration: "1h 20m",
    pricePerSeat: 180,
    car: "Hyundai Aura",
    driver: { name: "Mehraj Dar", rating: 4.7, initials: "MD", verified: true },
    seatsBooked: 1,
    paymentStatus: "paid",
  },
  {
    id: "p4",
    role: "passenger",
    status: "completed",
    from: "Srinagar",
    to: "Airport (SXR)",
    date: addDays(today, -14),
    departTime: "05:00",
    arriveTime: "05:45",
    duration: "0h 45m",
    pricePerSeat: 250,
    car: "Toyota Etios",
    driver: { name: "Suhail Bhat", rating: 4.6, initials: "SB", verified: true },
    seatsBooked: 1,
    paymentStatus: "paid",
  },
  // Passenger — cancelled
  {
    id: "p5",
    role: "passenger",
    status: "cancelled",
    from: "Srinagar",
    to: "Sopore",
    date: addDays(today, -3),
    departTime: "14:00",
    arriveTime: "15:30",
    duration: "1h 30m",
    pricePerSeat: 200,
    car: "Maruti Swift",
    driver: { name: "Ishfaq Lone", rating: 4.5, initials: "IL", verified: true },
    seatsBooked: 1,
    paymentStatus: "refunded",
    cancellationReason: "Driver cancelled due to road closure at Pattan.",
  },

  // Driver — upcoming
  {
    id: "d1",
    role: "driver",
    status: "upcoming",
    from: "Srinagar",
    to: "Jammu",
    date: addDays(today, 1),
    departTime: "21:00",
    arriveTime: "04:30",
    duration: "7h 30m",
    pricePerSeat: 900,
    car: "Tempo Traveller",
    seatsTotal: 4,
    earnings: 2700,
    passengers: [
      { name: "Sana Khan", initials: "SK", seats: 1, status: "confirmed" },
      { name: "Imran Rashid", initials: "IR", seats: 2, status: "confirmed" },
      { name: "Ayesha Mir", initials: "AM", seats: 1, status: "pending" },
    ],
  },
  {
    id: "d2",
    role: "driver",
    status: "upcoming",
    from: "Ganderbal",
    to: "Srinagar",
    date: addDays(today, 3),
    departTime: "07:30",
    arriveTime: "08:10",
    duration: "0h 40m",
    pricePerSeat: 120,
    car: "Maruti Dzire",
    seatsTotal: 3,
    earnings: 240,
    passengers: [
      { name: "Hilal A.", initials: "HA", seats: 2, status: "confirmed" },
    ],
  },
  // Driver — completed
  {
    id: "d3",
    role: "driver",
    status: "completed",
    from: "Srinagar",
    to: "Anantnag",
    date: addDays(today, -10),
    departTime: "17:00",
    arriveTime: "18:40",
    duration: "1h 40m",
    pricePerSeat: 220,
    car: "Hyundai Creta",
    seatsTotal: 3,
    earnings: 660,
    passengers: [
      { name: "Faisal N.", initials: "FN", seats: 1, status: "confirmed" },
      { name: "Zoya P.", initials: "ZP", seats: 2, status: "confirmed" },
    ],
  },
  // Driver — cancelled
  {
    id: "d4",
    role: "driver",
    status: "cancelled",
    from: "Srinagar",
    to: "Jammu",
    date: addDays(today, -5),
    departTime: "06:00",
    arriveTime: "13:30",
    duration: "7h 30m",
    pricePerSeat: 850,
    car: "Toyota Innova",
    seatsTotal: 4,
    earnings: 0,
    passengers: [],
    cancellationReason: "You cancelled — vehicle service required.",
  },
];
