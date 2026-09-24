import type { VisitorSummary } from "./visitorPresence";

export async function readLiveVisitors(origin: string, token: string | undefined, fetcher: typeof fetch = fetch): Promise<VisitorSummary & { source: string }> {
  // Credentials are only ever sent to the configured project domain, never redirects.
  if (origin !== "https://map.gdta2026.com") throw new Error("Live visitor source must be https://map.gdta2026.com.");
  if (!token?.trim()) throw new Error("Set LIVE_VISITORS_ADMIN_TOKEN to the live server's ADMIN_MAP_TOKEN in .env.local, then restart the local server.");
  const response = await fetcher(`${origin}/api/visitors`, {
    headers: { Authorization: `Bearer ${token.trim()}`, "X-Visitor-Proxy": "1" },
    cache: "no-store", redirect: "error", signal: AbortSignal.timeout(8000),
  });
  if (response.status === 401 || response.status === 403) throw new Error("The live server rejected LIVE_VISITORS_ADMIN_TOKEN. Use the live server's admin token, which may differ from your local password.");
  if (!response.ok) throw new Error(`Live visitor server returned HTTP ${response.status}. Check that the visitor feature is deployed.`);
  const data = await response.json();
  if (!data || !Number.isInteger(data.online) || data.online < 0 || !Number.isInteger(data.sharing) || data.sharing < 0 || data.sharing > data.online
    || !Number.isFinite(data.updatedAt) || !Array.isArray(data.cells)
    || data.cells.some((cell: { lat: number; lng: number; count: number }) => !cell || !Number.isFinite(cell.lat) || Math.abs(cell.lat) > 90 || !Number.isFinite(cell.lng) || Math.abs(cell.lng) > 180 || !Number.isInteger(cell.count) || cell.count < 1)) {
    throw new Error("Live server returned invalid visitor data.");
  }
  return { online: data.online, sharing: data.sharing, updatedAt: data.updatedAt, cells: data.cells.map((cell: { lat: number; lng: number; count: number }) => ({ lat: cell.lat, lng: cell.lng, count: cell.count })), source: origin };
}
