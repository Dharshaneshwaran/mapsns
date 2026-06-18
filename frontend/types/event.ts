export type EventCategory =
  | "Tech"
  | "Startup"
  | "Hackathon"
  | "Workshop"
  | "College"
  | "Sports"
  | "Cultural"
  | "Music"
  | "Business";

export type SortOption = "distance" | "date" | "popularity";

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface EventRecord {
  id: string;
  title: string;
  description: string;
  category: EventCategory;
  address: string;
  place?: string | null;
  floor?: string | null;
  city: string;
  latitude: number;
  longitude: number;
  bannerImage: string;
  organizer: string;
  contact: string;
  startDate: string;
  endDate: string;
  isPublished: boolean;
  popularity: number;
  gallery: string[];
}

export interface EventWithDistance extends EventRecord {
  distanceKm: number;
}
