type Point = { lat: number; lng: number };
// Visual alignment only: navigation and rerouting continue to use the GPS fix.
export function routePointerPosition(position: Point, points: Point[]) {
  if (points.length < 2) return position;
  const projection = routeDeviation(position, points, null);
  if (projection.distance > 15) return position;
  const index = Math.min(Math.floor(projection.segmentProgress), points.length - 2);
  const fraction = projection.segmentProgress - index;
  const a = points[index], b = points[index + 1];
  return { lat: a.lat + (b.lat - a.lat) * fraction, lng: a.lng + (b.lng - a.lng) * fraction };
}
export function routeDeviation(position: Point, points: Point[], heading: number | null) {
  const scaleX = 111320 * Math.cos(position.lat * Math.PI / 180);
  let distance = Infinity, direction = 0, progress = 0, total = 0;
  let segmentProgress = 0;
  for (let i = 1; i < points.length; i++) {
    const ax = (points[i - 1].lng - position.lng) * scaleX, ay = (points[i - 1].lat - position.lat) * 111320;
    const dx = (points[i].lng - points[i - 1].lng) * scaleX, dy = (points[i].lat - points[i - 1].lat) * 111320;
    const length = dx * dx + dy * dy;
    if (length < 1) continue;
    const t = Math.max(0, Math.min(1, -(ax * dx + ay * dy) / length));
    const next = Math.hypot(ax + t * dx, ay + t * dy);
    if (next < distance) { distance = next; segmentProgress = i - 1 + t; progress = total + t * Math.sqrt(length); direction = (Math.atan2(dx, dy) * 180 / Math.PI + 360) % 360; }
    total += Math.sqrt(length);
  }
  return { distance, segmentProgress, progressMeters: progress, remainingFraction: total > 0 ? Math.max(0, 1 - progress / total) : 0, wrongWay: heading !== null && Number.isFinite(heading) && Math.abs(((heading - direction + 540) % 360) - 180) > 110 };
}

export function remainingRoute(position: Point, points: Point[], previousProgress = 0) {
  if (points.length < 2) return { points: [...points], progress: 0 };
  const projection = routeDeviation(position, points, null);
  // Keep completed sections hidden through small GPS reversals. Off-route fixes
  // must not erase the route while navigation waits for a new route.
  const progress = Math.min(points.length - 1, Math.max(previousProgress, projection.distance <= 30 ? projection.segmentProgress : 0));
  const index = Math.floor(progress);
  if (index >= points.length - 1) return { points: [], progress };
  const fraction = progress - index;
  const a = points[index], b = points[index + 1];
  return { progress, points: [{ lat: a.lat + (b.lat - a.lat) * fraction, lng: a.lng + (b.lng - a.lng) * fraction }, ...points.slice(index + 1)] };
}
