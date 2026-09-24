"use client";
import { useEffect, useRef, useState } from "react";
import { Users } from "lucide-react";
import { loadGoogleMapsApi } from "@/lib/googleMaps";
import { CAMPUS_BOUNDARY, CAMPUS_CENTER } from "@/data/campusBoundary";
import type { VisitorSummary } from "@/lib/visitorPresence";

export default function LiveVisitors() {
  const container = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [summary, setSummary] = useState<(VisitorSummary & { source?: string }) | null>(null);
  const [error, setError] = useState("");
  const [mapError, setMapError] = useState("");
  useEffect(() => {
    let stopped = false;
    let busy = false;
    const refresh = async () => {
      if (busy || document.hidden) return;
      busy = true;
      try {
        const response = await fetch("/api/visitors", { cache: "no-store", signal: AbortSignal.timeout(8000) });
        if (!response.ok) {
          const failure = await response.json().catch(() => null);
          throw new Error(response.status === 401 ? "Sign in again to view live activity." : failure?.error || "Live activity is temporarily unavailable.");
        }
        const next = await response.json() as VisitorSummary;
        if (!stopped) { setSummary(next); setError(""); }
      } catch (cause) {
        if (!stopped) { setSummary(null); setError(cause instanceof Error ? cause.message : "Unable to refresh live activity."); }
      } finally { busy = false; }
    };
    void refresh();
    const timer = setInterval(() => { void refresh(); }, 10_000);
    document.addEventListener("visibilitychange", refresh);
    return () => { stopped = true; clearInterval(timer); document.removeEventListener("visibilitychange", refresh); };
  }, []);
  useEffect(() => {
    let stopped = false;
    let boundary: google.maps.Polygon | undefined;
    void loadGoogleMapsApi().then(() => {
      if (stopped || !container.current) return;
      const instance = new google.maps.Map(container.current, { center: CAMPUS_CENTER, zoom: 17, mapTypeId: "roadmap", streetViewControl: false, mapTypeControl: false, fullscreenControl: true, gestureHandling: "cooperative" });
      boundary = new google.maps.Polygon({ map: instance, paths: CAMPUS_BOUNDARY, strokeColor: "#008b92", strokeWeight: 2, fillOpacity: 0 });
      setMap(instance);
    }).catch(() => { if (!stopped) setMapError("The map could not load. Check the Google Maps configuration or your connection. Visitor counts remain available."); });
    return () => { stopped = true; boundary?.setMap(null); };
  }, []);
  useEffect(() => {
    if (!map || !summary) return;
    const circles = summary.cells.flatMap(cell => {
      const color = cell.count >= 5 ? "#dc2626" : cell.count >= 2 ? "#f59e0b" : "#16a34a";
      return [48, 34, 20].map(radius => new google.maps.Circle({ map, center: cell, radius, strokeWeight: 0, fillColor: color, fillOpacity: 0.18, clickable: false }));
    });
    return () => { circles.forEach(circle => circle.setMap(null)); };
  }, [map, summary]);
  const fitVisitors = () => {
    if (!map || !summary?.cells.length) return;
    const bounds = new google.maps.LatLngBounds();
    summary.cells.forEach(cell => bounds.extend(cell));
    map.fitBounds(bounds, 60);
    google.maps.event.addListenerOnce(map, "idle", () => { if ((map.getZoom() ?? 0) > 18) map.setZoom(18); });
  };
  return <section className="mb-7 rounded-2xl border border-[#e3e7ee] bg-white p-5 shadow-sm" aria-label="Live visitor activity">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h2 className="flex items-center gap-2 text-lg font-semibold"><Users className="h-5 w-5 text-[#008b92]" /> Live visitors</h2><p className="mt-1 text-sm text-[#5f6368]">Active in the last 2 minutes · refreshes every 10 seconds</p></div>
      <p className="text-xs text-[#5f6368]">{summary ? `Updated ${new Date(summary.updatedAt).toLocaleTimeString()}` : error ? "Disconnected" : "Connecting…"}</p>
    </div>
    {summary?.source && <p className="mt-2 text-xs text-[#5f6368]">Data source: {summary.source}</p>}
    <div className="my-4 grid gap-3 sm:grid-cols-3" aria-live="polite">
      {[{ label: "Online now", value: summary?.online }, { label: "Sharing location", value: summary?.sharing }, { label: "Without location", value: summary ? summary.online - summary.sharing : undefined }].map(item => <div key={item.label} className="rounded-xl bg-[#f7f9fc] p-4"><p className="text-sm text-[#5f6368]">{item.label}</p><p className="mt-1 text-3xl font-semibold">{item.value ?? "—"}</p></div>)}
    </div>
    {error && <p role="status" className="mb-3 text-sm text-red-700">{error} Retrying automatically.</p>}
    <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><h3 className="font-medium">Live activity heatmap</h3><button type="button" onClick={fitVisitors} disabled={!map || !summary?.cells.length} className="rounded-full border px-3 py-2 text-sm disabled:opacity-40">Show all active areas</button></div>
    {mapError && <p role="status" className="mb-3 text-sm text-red-700">{mapError}</p>}
    <div ref={container} className="h-80 w-full rounded-xl bg-[#eef1f5]" aria-label="Map showing approximate visitor concentrations" />
    <p className="mt-3 text-sm text-[#5f6368]">Green: 1 · Amber: 2–4 · Red: 5+ visitors per approximate area.</p>
    {summary?.sharing === 0 && <p className="mt-2 text-sm text-[#5f6368]">No visitors are currently sharing an accurate location. Visitors can opt in under More → Campus activity map.</p>}
    <p className="mt-2 text-xs text-[#5f6368]">Counts represent browsers, not verified people. Admin pages are excluded. Areas are rounded to roughly 55 metres; GPS accuracy varies. No names or location history are shown.</p>
  </section>;
}
