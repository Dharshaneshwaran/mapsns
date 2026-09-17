type Point = { lat: number; lng: number };
export function routeDeviation(position: Point, points: Point[], heading: number | null) {
  const scaleX = 111320 * Math.cos(position.lat * Math.PI / 180);
  let distance = Infinity, direction = 0, progress = 0, total = 0;
  for (let i = 1; i < points.length; i++) {
    const ax = (points[i - 1].lng - position.lng) * scaleX, ay = (points[i - 1].lat - position.lat) * 111320;
    const dx = (points[i].lng - points[i - 1].lng) * scaleX, dy = (points[i].lat - points[i - 1].lat) * 111320;
    const length = dx * dx + dy * dy;
    if (length < 1) continue;
    const t = Math.max(0, Math.min(1, -(ax * dx + ay * dy) / length));
    const next = Math.hypot(ax + t * dx, ay + t * dy);
    if (next < distance) { distance = next; progress = total + t * Math.sqrt(length); direction = (Math.atan2(dx, dy) * 180 / Math.PI + 360) % 360; }
    total += Math.sqrt(length);
  }
  return { distance, progressMeters: progress, remainingFraction: total > 0 ? Math.max(0, 1 - progress / total) : 0, wrongWay: heading !== null && Number.isFinite(heading) && Math.abs(((heading - direction + 540) % 360) - 180) > 110 };
}
