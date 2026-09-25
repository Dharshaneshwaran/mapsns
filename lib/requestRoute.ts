import type { Coordinate, TravelMode, WalkingRoute } from "@/types/campus";
import { campusWalkingRoute } from "./campusRouting.ts";
export class CampusRouteError extends Error {}
let nextRequest = 0;
// Shared vertices on the mapped public approach roads, west of campus.
const campusApproaches: Coordinate[] = [
  { lat: 11.1006791, lng: 77.0246707 },
  { lat: 11.1037733, lng: 77.0245577 },
];

type CampusRouteResult = Pick<WalkingRoute, "points" | "distanceMeters" | "durationSeconds" | "destinationGapMeters">;

// Prefer the server-side campus graph so the browser only waits on a localhost round-trip.
async function requestCampusRouteFromServer(start: Coordinate, end: Coordinate, signal: AbortSignal): Promise<CampusRouteResult | null> {
  if (typeof window === "undefined") return null;
  try {
    const response = await fetch("/api/route", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ start, end }),
      cache: "no-store",
      signal,
    });
    if (!response.ok) return null;
    const data = await response.json() as { points?: unknown; distanceMeters?: unknown; durationSeconds?: unknown; destinationGapMeters?: unknown };
    if (!Array.isArray(data?.points) || data.points.length < 2
      || !Number.isFinite(data.distanceMeters as number) || !Number.isFinite(data.durationSeconds as number)) return null;
    const points = (data.points as unknown[]).filter(isCoordinate);
    if (points.length < 2) return null;
    return {
      points,
      distanceMeters: data.distanceMeters as number,
      durationSeconds: data.durationSeconds as number,
      destinationGapMeters: Number.isFinite(data.destinationGapMeters as number) ? data.destinationGapMeters as number : undefined,
    };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") throw error;
    return null;
  }
}

function isCoordinate(value: unknown): value is Coordinate {
  if (!value || typeof value !== "object") return false;
  const { lat, lng } = value as Record<string, unknown>;
  return typeof lat === "number" && Number.isFinite(lat) && Math.abs(lat) <= 90
    && typeof lng === "number" && Number.isFinite(lng) && Math.abs(lng) <= 180;
}

export async function requestRoute(start: Coordinate, end: Coordinate, mode: TravelMode, signal: AbortSignal, heading: number | null = null): Promise<CampusRouteResult> {
  signal.throwIfAborted();
  if (mode === "walking") {
    const fromServer = await requestCampusRouteFromServer(start, end, signal);
    if (fromServer) return fromServer;
    const campusRoute = campusWalkingRoute(start, end);
    if (campusRoute) return campusRoute;
  }
  try {
    return await requestRemoteRoute(start, end, mode, signal, heading);
  } catch (error) {
    signal.throwIfAborted();
    if (mode !== "walking" || !(error instanceof CampusRouteError)) throw error;
    // Public routing data may not connect to the internal campus ways.
    // Route to an actual shared road vertex, then follow the local graph.
    const alternatives = [];
    for (const approach of campusApproaches) {
      const inbound = campusWalkingRoute(approach, end);
      const outbound = inbound ? null : campusWalkingRoute(start, approach);
      if (!inbound && !outbound) continue;
      try {
        const outside = inbound
          ? await requestRemoteRoute(start, approach, mode, signal, heading)
          : await requestRemoteRoute(approach, end, mode, signal, heading);
        const first = inbound ? outside : outbound!;
        const last = inbound ?? outside;
        const a = first.points.at(-1)!, b = last.points[0];
        const join = Math.hypot((a.lat - b.lat) * 111320, (a.lng - b.lng) * 109240);
        // Only join coincident mapped vertices; never bridge an unknown gap.
        if (join > 1) continue;
        alternatives.push({
          points: [...first.points, ...last.points],
          distanceMeters: first.distanceMeters + last.distanceMeters + join,
          durationSeconds: first.durationSeconds + last.durationSeconds + join / 1.25,
          destinationGapMeters: inbound?.destinationGapMeters,
        });
      } catch {
        signal.throwIfAborted();
        // One approach may be disconnected; try the other mapped entrance.
      }
    }
    const shortest = alternatives.sort((a, b) => a.distanceMeters - b.distanceMeters)[0];
    if (shortest) return shortest;
    throw error;
  }
}

async function requestRemoteRoute(start: Coordinate, end: Coordinate, mode: TravelMode, signal: AbortSignal, heading: number | null) {
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
  // Campus building pins may sit away from drivable roads. Report the gap.
  const snapLimit = mode === "walking" ? 30 : 100;
  // Avoid computing unused vehicle alternatives and bound service waits.
  const requestSignal = AbortSignal.any([signal, AbortSignal.timeout(8000)]);
  const response = await fetch(`${root}/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson&alternatives=${mode === "walking"}&radiuses=${snapLimit};${snapLimit}${constrainHeading ? `&bearings=${Math.round((heading + 360) % 360)},90;` : ""}`, { signal: requestSignal });
  // OSRM returns routing failures such as NoSegment with HTTP 400.
  // Read that response before classifying it as a service outage.
  const data = await response.json().catch(() => null);
  if (data?.code === "NoSegment") throw new CampusRouteError(mode === "vehicle" ? "No drivable road within 100 m of your location or destination. Move to a campus road or switch to Walk." : "No mapped path close enough to your location or destination. Try a mapped entrance; campus footpaths may be missing from the routing data.");
  if (data?.code === "NoRoute") throw new CampusRouteError(mode === "vehicle" ? "No connected vehicle route is available. Try a campus entrance or switch to Walk." : "No mapped route connects your location to this destination. The internal campus walkways may be missing or disconnected.");
  if (!response.ok || !data) throw new Error(`Route service request failed (HTTP ${response.status}). Please retry.`);
  const candidates = Array.isArray(data.routes) ? data.routes : [];
  const gap = (a: Coordinate, b: Coordinate) => Math.hypot((a.lat - b.lat) * 111320, (a.lng - b.lng) * 111320 * Math.cos(a.lat * Math.PI / 180));
  type Candidate = { distance: number; duration: number; geometry: { coordinates: number[][] } };
  const valid = (candidates as Candidate[]).filter(candidate =>
    candidate && Number.isFinite(candidate.distance) && candidate.distance >= 0 && Number.isFinite(candidate.duration) && candidate.duration >= 0 &&
    Array.isArray(candidate.geometry?.coordinates) && candidate.geometry.coordinates.length >= 2 &&
    candidate.geometry.coordinates.every(p => Array.isArray(p) && Number.isFinite(p[0]) && Number.isFinite(p[1]))
  );
  // The green overlay is not a barrier. Choose the shortest connected alternative.
  const connected = valid.filter(candidate => {
    const first = candidate.geometry.coordinates[0], last = candidate.geometry.coordinates.at(-1)!;
    return gap(start, { lng: first[0], lat: first[1] }) <= snapLimit && gap(end, { lng: last[0], lat: last[1] }) <= snapLimit;
  });
  if (data.code === "Ok" && valid.length && !connected.length) throw new Error("The mapped route does not reach your location or destination. Choose a mapped entrance; campus footpaths may be missing from the routing data.");
  const route = connected.sort((a, b) => a.distance - b.distance)[0];
  if (data.code !== "Ok" || !route || !Number.isFinite(route.distance) || route.distance < 0 || !Number.isFinite(route.duration) || route.duration < 0 || !Array.isArray(route.geometry?.coordinates) || route.geometry.coordinates.length < 2 || !route.geometry.coordinates.every((p: unknown) => Array.isArray(p) && Number.isFinite(p[0]) && Number.isFinite(p[1]))) throw new Error("No mapped route is available to this place.");
  const points: Coordinate[] = route.geometry.coordinates.map((p: number[]) => ({ lat: p[1], lng: p[0] }));
  if (gap(start, points[0]) > snapLimit || gap(end, points[points.length - 1]) > snapLimit) throw new Error("The mapped route does not reach your location or destination. Choose a mapped entrance; campus footpaths may be missing from the routing data.");
  return { points, distanceMeters: route.distance, durationSeconds: route.duration, destinationGapMeters: gap(end, points[points.length - 1]) };
}
