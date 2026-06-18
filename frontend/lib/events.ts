import type {
  Coordinates,
  EventCategory,
  EventRecord,
  EventWithDistance,
  SortOption,
} from "@/types/event";

export const categories: EventCategory[] = [
  "Tech",
  "Startup",
  "Hackathon",
  "Workshop",
  "College",
  "Sports",
  "Cultural",
  "Music",
  "Business",
];

export const radiusOptions = [5, 10, 25, 50];

export function haversineDistanceKm(
  start: Coordinates,
  end: Coordinates,
): number {
  const earthRadiusKm = 6371;
  const dLat = toRadians(end.latitude - start.latitude);
  const dLng = toRadians(end.longitude - start.longitude);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(start.latitude)) *
      Math.cos(toRadians(end.latitude)) *
      Math.sin(dLng / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

export function formatDistance(distanceKm: number): string {
  return `${distanceKm < 1 ? distanceKm.toFixed(1) : distanceKm.toFixed(1)} km`;
}

export function searchEvents(
  events: EventRecord[],
  query: string,
): EventRecord[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return events;
  }

  return events.filter((event) =>
    [
      event.title,
      event.description,
      event.category,
      event.address,
      event.place ?? "",
      event.floor ?? "",
      event.city,
      event.organizer,
    ]
      .join(" ")
      .toLowerCase()
      .includes(normalized),
  );
}

export function getNearbyEvents(
  events: EventRecord[],
  location: Coordinates | null,
  radiusKm: number,
  search = "",
  category: EventCategory | "All" = "All",
  sortBy: SortOption = "distance",
): EventWithDistance[] {
  const filtered = searchEvents(
    events.filter((event) => event.isPublished),
    search,
  ).filter((event) => category === "All" || event.category === category);

  const withDistance = filtered.map((event) => ({
    ...event,
    distanceKm: location
      ? haversineDistanceKm(location, {
          latitude: event.latitude,
          longitude: event.longitude,
        })
      : Number.POSITIVE_INFINITY,
  }));

  const inRadius = location
    ? withDistance.filter((event) => event.distanceKm <= radiusKm)
    : withDistance;

  return inRadius.sort((left, right) => {
    if (sortBy === "date") {
      return (
        new Date(left.startDate).getTime() - new Date(right.startDate).getTime()
      );
    }

    if (sortBy === "popularity") {
      return right.popularity - left.popularity;
    }

    return left.distanceKm - right.distanceKm;
  });
}

export function getEventById(id: string): EventRecord | undefined {
  void id;
  return undefined;
}

export function getLocationLabel(location: Coordinates | null): string {
  if (!location) {
    return "Enable location access to see nearby events";
  }

  return `${location.latitude.toFixed(3)}, ${location.longitude.toFixed(3)}`;
}

export function markerProjection(
  center: Coordinates,
  point: Coordinates,
): { x: number; y: number } {
  const lngScale = 6;
  const latScale = 7;
  const dx = (point.longitude - center.longitude) * lngScale;
  const dy = (center.latitude - point.latitude) * latScale;
  const x = 50 + dx;
  const y = 50 + dy;
  return {
    x: Math.max(8, Math.min(92, x)),
    y: Math.max(8, Math.min(92, y)),
  };
}

export function buildClusters(events: EventWithDistance[]) {
  const groups = new Map<string, EventWithDistance[]>();

  for (const event of events) {
    const key = `${Math.round(event.latitude * 4) / 4}:${Math.round(
      event.longitude * 4,
    ) / 4}`;
    const existing = groups.get(key) ?? [];
    existing.push(event);
    groups.set(key, existing);
  }

  return Array.from(groups.entries()).map(([key, group]) => {
    const [latitude, longitude] = key.split(":").map(Number);
    return {
      id: key,
      latitude,
      longitude,
      events: group,
    };
  });
}
