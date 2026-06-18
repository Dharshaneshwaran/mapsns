export interface Coordinates {
  latitude: number;
  longitude: number;
}

export function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

export function haversineDistanceKm(start: Coordinates, end: Coordinates): number {
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

