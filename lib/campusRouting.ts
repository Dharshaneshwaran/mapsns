import roads from "../data/campus-roads.json" with { type: "json" };
import { isInsideCampus } from "../data/campusBoundary.ts";
import type { Coordinate } from "@/types/campus";

const meters = (a: Coordinate, b: Coordinate) => Math.hypot((a.lat - b.lat) * 111320, (a.lng - b.lng) * 109240);

// Existing campus road geometry from mapsns/frontend/public/campus-roads.json.
// Join only shared vertices; never invent connections across unmapped ground.
export function campusWalkingRoute(start: Coordinate, end: Coordinate) {
  if (!isInsideCampus(start.lat, start.lng) || !isInsideCampus(end.lat, end.lng)) return null;
  const nodes: Coordinate[] = [];
  const edges: Map<number, number>[] = [];
  const ids = new Map<string, number>();
  const node = (p: Coordinate) => {
    const key = `${p.lng},${p.lat}`;
    const old = ids.get(key);
    if (old !== undefined) return old;
    const id = nodes.length;
    nodes.push(p); edges.push(new Map()); ids.set(key, id);
    return id;
  };
  const connect = (a: number, b: number) => {
    const distance = meters(nodes[a], nodes[b]);
    edges[a].set(b, distance); edges[b].set(a, distance);
  };
  const segments: [number, number][] = [];
  for (const road of roads.roads) {
    for (let i = 1; i < road.length; i++) {
      const a = { lng: road[i - 1][0], lat: road[i - 1][1] };
      const b = { lng: road[i][0], lat: road[i][1] };
      if (!isInsideCampus(a.lat, a.lng) || !isInsideCampus(b.lat, b.lng)) continue;
      const u = node(a), v = node(b);
      segments.push([u, v]); connect(u, v);
    }
  }
  const snap = (p: Coordinate) => {
    let best: { u: number; v: number; p: Coordinate; gap: number } | null = null;
    for (const [u, v] of segments) {
      const a = nodes[u], b = nodes[v];
      const dx = (b.lng - a.lng) * 109240, dy = (b.lat - a.lat) * 111320;
      const length2 = dx * dx + dy * dy;
      if (!length2) continue;
      const t = Math.max(0, Math.min(1, (((p.lng - a.lng) * 109240 * dx) + ((p.lat - a.lat) * 111320 * dy)) / length2));
      const projected = { lng: a.lng + t * (b.lng - a.lng), lat: a.lat + t * (b.lat - a.lat) };
      const gap = meters(p, projected);
      if (!best || gap < best.gap) best = { u, v, p: projected, gap };
    }
    return best && best.gap <= 30 ? best : null;
  };
  const first = snap(start), last = snap(end);
  if (!first || !last) return null;
  const source = node(first.p), target = node(last.p);
  connect(source, first.u); connect(source, first.v);
  connect(target, last.u); connect(target, last.v);
  if (first.u === last.u && first.v === last.v) connect(source, target);
  const distances = nodes.map(() => Infinity), previous = nodes.map(() => -1);
  const visited = new Set<number>();
  distances[source] = 0;
  while (true) {
    let current = -1;
    for (let i = 0; i < nodes.length; i++) {
      if (!visited.has(i) && Number.isFinite(distances[i]) && (current < 0 || distances[i] < distances[current])) current = i;
    }
    if (current < 0) return null;
    if (current === target) break;
    visited.add(current);
    for (const [next, weight] of edges[current]) {
      if (distances[current] + weight < distances[next]) {
        distances[next] = distances[current] + weight; previous[next] = current;
      }
    }
  }
  const path: Coordinate[] = [];
  for (let at = target; at !== -1; at = previous[at]) path.push(nodes[at]);
  path.reverse();
  if (path.length === 1) path.push({ ...path[0] });
  return { points: path, distanceMeters: distances[target], durationSeconds: distances[target] / 1.25 };
}
