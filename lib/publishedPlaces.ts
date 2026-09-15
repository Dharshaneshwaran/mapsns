import { CAMPUS_LOCATIONS } from "@/data/campusLocations";
import type { MapImage } from "@/types/mapImage";
import type { CampusLocation } from "@/types/campus";
export function publishedPlaces(images: MapImage[]): CampusLocation[] {
  const places = new Map(CAMPUS_LOCATIONS.map((place) => [place.id, place]));
  for (const image of images) {
    if (!image.locationId) continue;
    const original = places.get(image.locationId);
    places.set(image.locationId, { ...original, id: image.locationId, name: image.name, category: original?.category || "other", isVerified: original?.isVerified ?? false, position: { lat: image.lat, lng: image.lng }, customIcon: image.src, description: original?.description || "Published campus destination. Directions lead to the image centre; place it at the accessible entrance." });
  }
  return [...places.values()];
}
