import type { MapImage } from "@/types/mapImage";

// Initial values preserve the original four ground overlays.
export const DEFAULT_MAP_IMAGES: MapImage[] = [
  { id: "temple", locationId: "temple", name: "SNS Lawn Heritage", src: "/vatta_mandalam.png", lat: 11.100665597014457, lng: 77.02657444378238, width: 0.0006 / Math.cos(11.100665597014457 * Math.PI / 180), height: 0.0006, rotation: 0, opacity: 0.9 },
  { id: "admin-building", locationId: "admin-building", name: "Admin Building", src: "/admin_building.png", lat: 11.10009421400155, lng: 77.02664133529711, width: 0.00076, height: 0.00076, rotation: 0, opacity: 0.9 },
  { id: "heritage-courtyard", locationId: "heritage-courtyard", name: "Heritage Courtyard", src: "/heritage_building.png", lat: 11.101011353839342, lng: 77.0275747454194, width: 0.001, height: 0.0008, rotation: 0, opacity: 0.9 },
  { id: "ihub", locationId: "ihub", name: "SNS Innovation Hub", src: "/ihub.png", lat: 11.100081, lng: 77.027381, width: 0.0005, height: 0.0005, rotation: 0, opacity: 0.9 },
];
