import roads from "../data/campus-roads.json" with { type: "json" };
import type { Coordinate } from "@/types/campus";

const meters = (a: Coordinate, b: Coordinate) => Math.hypot((a.lat - b.lat) * 111320, (a.lng - b.lng) * 109240);

type Graph = {
  nodes: Coordinate[];
  edges: Map<number, number>[];
  segments: [number, number][];
};

// Campus road geometry imported from OpenStreetMap; see scripts/import-campus-roads.mjs.
// Build the graph once per process so reroutes only run Dijkstra.
let cachedGraph: Graph | null = null;

function baseGraph(): Graph {
  if (cachedGraph) return cachedGraph;
  const nodes: Coordinate[] = [];
  const edges: Map<number, number>[] = [];
  const ids = new Map<string, number>();
  const segments: [number, number][] = [];
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
  for (const road of roads.roads) {
    for (let i = 1; i < road.length; i++) {
      const a = { lng: road[i - 1][0], lat: road[i - 1][1] };
      const b = { lng: road[i][0], lat: road[i][1] };
      const u = node(a), v = node(b);
      segments.push([u, v]); connect(u, v);
    }
  }
  cachedGraph = { nodes, edges, segments };
  return cachedGraph;
}

// Join only shared vertices; never invent connections across unmapped ground.
export function campusWalkingRoute(start: Coordinate, end: Coordinate) {
  const base = baseGraph();
  const nodes = [...base.nodes];
  const edges = base.edges.map(adjacency => new Map(adjacency));
  const segments = base.segments;
  const snap = (p: Coordinate, limit: number) => {
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
    return best && best.gap <= limit ? best : null;
  };
  // Building pins may sit away from a road. Report the gap rather than
  // drawing an unverified shortcut; GPS still must be within 30 m.
  // This is a route to a nearby path, not a verified entrance connection.
  const first = snap(start, 30), last = snap(end, 60);
  if (!first || !last) return null;
  const link = (a: number, b: number) => {
    const distance = meters(nodes[a], nodes[b]);
    edges[a].set(b, distance); edges[b].set(a, distance);
  };
  const source = nodes.length;
  nodes.push({ ...first.p }); edges.push(new Map());
  const target = nodes.length;
  nodes.push({ ...last.p }); edges.push(new Map());
  link(source, first.u); link(source, first.v);
  link(target, last.u); link(target, last.v);
  if (first.u === last.u && first.v === last.v) link(source, target);
  const distances = nodes.map(() => Infinity), previous = nodes.map(() => -1);
  const visited = new Set<number>();
  distances[source] = 0;
  // Dijkstra: minimize total mapped-road distance, including outside the overlay.
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
  return { points: path, distanceMeters: distances[target], durationSeconds: distances[target] / 1.25, destinationGapMeters: last.gap };
}
