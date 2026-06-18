import type { Role } from "@prisma/client";

export type UserRole = Role;

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  createdAt: string;
}

export interface EventRecord {
  id: string;
  title: string;
  description: string;
  category:
    | "Tech"
    | "Startup"
    | "Hackathon"
    | "Workshop"
    | "College"
    | "Sports"
    | "Cultural"
    | "Music"
    | "Business";
  address: string;
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
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokenPayload {
  sub: string;
  email: string;
  role: UserRole;
}
