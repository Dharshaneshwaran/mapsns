import type { Coordinate } from "@/types/campus";

export const CAMPUS_BOUNDARY: Coordinate[] = [
  { lat: 11.099576688026927, lng: 77.02602315513506 },
  { lat: 11.099923202346874, lng: 77.02867522753512 },
  { lat: 11.104196584857135, lng: 77.02805896770889 },
  { lat: 11.104219565928828, lng: 77.0259851855156 },
];

export const CAMPUS_CENTER: Coordinate = {
  lat: (11.099576688026927 + 11.104219565928828) / 2,
  lng: (77.0259851855156 + 77.02867522753512) / 2,
};

export function isInsideCampus(lat: number, lng: number): boolean {
  let inside = false;
  for (let i = 0, j = CAMPUS_BOUNDARY.length - 1; i < CAMPUS_BOUNDARY.length; j = i++) {
    const xi = CAMPUS_BOUNDARY[i].lng, yi = CAMPUS_BOUNDARY[i].lat;
    const xj = CAMPUS_BOUNDARY[j].lng, yj = CAMPUS_BOUNDARY[j].lat;
    if (((yi > lat) !== (yj > lat)) && (lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }
  return inside;
}
