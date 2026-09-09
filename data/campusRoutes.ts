import { WalkingRoute } from "@/types/campus";

export const CAMPUS_ROUTES: WalkingRoute[] = [
  {
    id: "main-gate-to-library",
    name: "Main Gate to Library",
    from: "main-gate",
    to: "library",
    points: [
      { lat: 11.0998, lng: 77.0273 },
      { lat: 11.1002, lng: 77.0272 },
      { lat: 11.1008, lng: 77.0271 },
      { lat: 11.1012, lng: 77.0270 },
      { lat: 11.1015, lng: 77.0269 },
      { lat: 11.1018, lng: 77.0272 },
    ],
    isPrototype: true,
  },
  {
    id: "library-to-canteen",
    name: "Library to Canteen",
    from: "library",
    to: "canteen",
    points: [
      { lat: 11.1018, lng: 77.0272 },
      { lat: 11.1020, lng: 77.0270 },
      { lat: 11.1023, lng: 77.0269 },
      { lat: 11.1026, lng: 77.0268 },
      { lat: 11.1028, lng: 77.0268 },
    ],
    isPrototype: true,
  },
  {
    id: "main-gate-to-a-block",
    name: "Main Gate to A-Block",
    from: "main-gate",
    to: "a-block",
    points: [
      { lat: 11.0998, lng: 77.0273 },
      { lat: 11.1003, lng: 77.0272 },
      { lat: 11.1008, lng: 77.0271 },
      { lat: 11.1012, lng: 77.0270 },
      { lat: 11.1015, lng: 77.0270 },
    ],
    isPrototype: true,
  },
  {
    id: "a-block-to-auditorium",
    name: "A-Block to Auditorium",
    from: "a-block",
    to: "auditorium",
    points: [
      { lat: 11.1015, lng: 77.0270 },
      { lat: 11.1016, lng: 77.0268 },
      { lat: 11.1018, lng: 77.0267 },
      { lat: 11.1020, lng: 77.0266 },
      { lat: 11.1022, lng: 77.0266 },
    ],
    isPrototype: true,
  },
];
