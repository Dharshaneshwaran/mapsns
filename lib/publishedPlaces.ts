import { CAMPUS_LOCATIONS } from "@/data/campusLocations";
import type { MapImage } from "@/types/mapImage";
import type { CampusLocation } from "@/types/campus";
export function publishedPlaces(images: MapImage[]): CampusLocation[] {
  const places = new Map<string, CampusLocation>();
  for (const image of images) {
    const locationId = image.locationId || image.id;
    const original = CAMPUS_LOCATIONS.find((place) => place.id === locationId);
    places.set(locationId, { ...original, id: locationId, name: image.name, showInShortcuts: image.showInShortcuts ?? true, category: original?.category || "other", isVerified: original?.isVerified ?? false, position: { lat: image.lat, lng: image.lng }, customIcon: image.src === "lucide:map-pin" ? undefined : image.src, description: original?.description || "Published campus destination. Directions lead to the marker; place it at the accessible entrance." });
  }
  return [...places.values()].map(place => ["spine", "spine", "spinebioscope"].includes(place.name.toLowerCase().replace(/[^a-z0-9]/g, "")) ? { ...place, name: "Spine" } : place);
}
