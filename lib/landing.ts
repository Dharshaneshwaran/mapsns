import { CAMPUS_LOCATIONS } from "@/data/campusLocations";
export type LandingConfig = { brand: string; heading: string; description: string; sectionTitle: string; placeIds: string[] };
export const DEFAULT_LANDING: LandingConfig = {
  brand: "SNS Institutions", heading: "Your campus, connected.", description: "Find a building. Discover a place. Get there easily.", sectionTitle: "Around campus",
  placeIds: CAMPUS_LOCATIONS.filter((place) => place.isVerified).map((place) => place.id),
};
