export const ACTIVE_WINDOW_MS = 120_000;
export type Area = { lat: number; lng: number };
type Visitor = { seenAt: number; area: Area | null };
export type VisitorSummary = { online: number; sharing: number; cells: (Area & { count: number })[]; updatedAt: number };

// Approximate areas (~55 m), never retain exact GPS coordinates or a location history.
export function approximateArea(value: unknown): Area | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== "object") throw new Error("Invalid location");
  const { lat, lng, accuracy } = value as Record<string, unknown>;
  if (typeof lat !== "number" || !Number.isFinite(lat) || Math.abs(lat) > 90
    || typeof lng !== "number" || !Number.isFinite(lng) || Math.abs(lng) > 180
    || typeof accuracy !== "number" || !Number.isFinite(accuracy) || accuracy < 0) throw new Error("Invalid location");
  if (accuracy > 150) return null;
  return { lat: Math.round(lat * 2000) / 2000, lng: Math.round(lng * 2000) / 2000 };
}

export class VisitorPresence {
  private visitors = new Map<string, Visitor>();
  prune(now = Date.now()) {
    for (const [id, visitor] of this.visitors) {
      if (now - visitor.seenAt >= ACTIVE_WINDOW_MS) this.visitors.delete(id);
    }
  }
  heartbeat(id: string, area: Area | null, now = Date.now()) {
    this.prune(now);
    if (!this.visitors.has(id) && this.visitors.size >= 20_000) throw new Error("Presence capacity reached");
    this.visitors.set(id, { seenAt: now, area });
  }
  summary(now = Date.now()): VisitorSummary {
    this.prune(now);
    const cells = new Map<string, Area & { count: number }>();
    let sharing = 0;
    for (const { area } of this.visitors.values()) {
      if (!area) continue;
      sharing++;
      const key = `${area.lat},${area.lng}`;
      const cell = cells.get(key);
      if (cell) cell.count++;
      else cells.set(key, { ...area, count: 1 });
    }
    return { online: this.visitors.size, sharing, cells: [...cells.values()], updatedAt: now };
  }
}
