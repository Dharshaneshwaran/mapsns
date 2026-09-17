export type Coordinate = {
  lat: number;
  lng: number;
};

export type CampusCategory =
  | "academic"
  | "food"
  | "sports"
  | "hostel"
  | "gate"
  | "library"
  | "auditorium"
  | "admin"
  | "other";

export type CampusLocation = {
  id: string;
  name: string;
  category: CampusCategory;
  position: Coordinate;
  description?: string;
  isVerified: boolean;
  customIcon?: string;
  showInShortcuts?: boolean;
};

export type WalkPoint = {
  lat: number;
  lng: number;
};

export type WalkingRoute = {
  id: string;
  name: string;
  from: string;
  to: string;
  points: WalkPoint[];
  isPrototype: boolean;
  distanceMeters?: number;
  durationSeconds?: number;
};

export type WalkingState = "idle" | "walking" | "turning" | "arrived";

export type TravelMode = "walking" | "vehicle";

export type BottomSheetState = {
  isOpen: boolean;
  location: CampusLocation | null;
  distance: number | null;
  walkingTime: number | null;
  route: WalkingRoute | null;
};

export type MapState = {
  center: Coordinate;
  zoom: number;
  mapTypeId: string;
};
