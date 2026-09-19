import type { Coordinate, TravelMode, WalkingRoute } from "@/types/campus";
import { isInsideCampus } from "../data/campusBoundary.ts";
import { campusWalkingRoute } from "./campusRouting.ts";
export class CampusRouteError extends Error {}
let nextRequest = 0;
export async function requestRoute(start: Coordinate, end: Coordinate, mode: TravelMode, signal: AbortSignal, heading: number | null = null): Promise<Pick<WalkingRoute, "points" | "distanceMeters" | "durationSeconds">> {
  signal.throwIfAborted();
  const campusRoute = mode === "walking" ? campusWalkingRoute(start, end) : null;
  if (campusRoute) return campusRoute;
  // Respect the shared public router's one-request-per-second limit per browser.
  // Cancelled requests must not reserve future slots and delay the latest selection.
  while (Date.now() < nextRequest) {
    signal.throwIfAborted();
    await new Promise<void>((resolve, reject) => {
      const cancel = () => { clearTimeout(timer); reject(signal.reason); };
      const timer = setTimeout(() => { signal.removeEventListener("abort", cancel); resolve(); }, nextRequest - Date.now());
      signal.addEventListener("abort", cancel, { once: true });
    });
  }
  signal.throwIfAborted();
  nextRequest = Date.now() + 1100;
  const root = mode === "walking" ? (process.env.NEXT_PUBLIC_WALKING_ROUTER_URL || "https://routing.openstreetmap.de/routed-foot/route/v1/foot") : (process.env.NEXT_PUBLIC_DRIVING_ROUTER_URL || "https://routing.openstreetmap.de/routed-car/route/v1/driving");
  // Pedestrians can turn around; a heading constraint can snap them to a parallel path.
  const constrainHeading = mode !== "walking" && heading !== null && Number.isFinite(heading);
  const snapLimit = mode === "walking" ? 30 : 50;
  const response = await fetch(`${root}/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson&alternatives=true&radiuses=${snapLimit};${snapLimit}${constrainHeading ? `&bearings=${Math.round((heading + 360) % 360)},90;` : ""}`, { signal });
  // OSRM returns routing failures such as NoSegment with HTTP 400.
  // Read that response before classifying it as a service outage.
  const data = await response.json().catch(() => null);
  if (data?.code === "NoSegment") throw new CampusRouteError("No mapped path close enough to your location or destination. Try a mapped entrance; campus footpaths may be missing from the routing data.");
  if (data?.code === "NoRoute") throw new CampusRouteError("No mapped route connects your location to this destination. The internal campus walkways may be missing or disconnected.");
  if (!response.ok || !data) throw new Error(`Route service request failed (HTTP ${response.status}). Please retry.`);
  const candidates = Array.isArray(data.routes) ? data.routes : [];
  const route = (isInsideCampus(end.lat, end.lng) ? candidates.find((candidate: { geometry?: { coordinates?: number[][] } }) =>
    Array.isArray(candidate.geometry?.coordinates) && candidate.geometry.coordinates.length >= 2 &&
    candidate.geometry.coordinates.every(p => Array.isArray(p) && Number.isFinite(p[0]) && Number.isFinite(p[1]) && isInsideCampus(p[1], p[0]))
  ) : undefined) ?? candidates[0];
  if (data.code !== "Ok" || !route || !Number.isFinite(route.distance) || route.distance < 0 || !Number.isFinite(route.duration) || route.duration < 0 || !Array.isArray(route.geometry?.coordinates) || route.geometry.coordinates.length < 2 || !route.geometry.coordinates.every((p: unknown) => Array.isArray(p) && Number.isFinite(p[0]) && Number.isFinite(p[1]))) throw new Error("No mapped route is available to this place.");
  const points: Coordinate[] = route.geometry.coordinates.map((p: number[]) => ({ lat: p[1], lng: p[0] }));
  const gap = (a: Coordinate, b: Coordinate) => Math.hypot((a.lat - b.lat) * 111320, (a.lng - b.lng) * 111320 * Math.cos(a.lat * Math.PI / 180));
  if (gap(start, points[0]) > snapLimit || gap(end, points[points.length - 1]) > snapLimit) throw new Error("The mapped route does not reach your location or destination. Choose a mapped entrance; campus footpaths may be missing from the routing data.");
  // The displayed campus polygon is convex, so segments between inside
  // vertices stay inside too. Never accept an outside detour to a campus pin.
  if (isInsideCampus(end.lat, end.lng) && points.some(p => !isInsideCampus(p.lat, p.lng))) {
    throw new CampusRouteError("No mapped route stays inside campus. Move to an inside-campus path and retry; the internal walkway may not be mapped yet.");
  }
  return { points, distanceMeters: route.distance, durationSeconds: route.duration };
}
