"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ImagePlus, Save, Trash2, RotateCcw, ExternalLink } from "lucide-react";
import { loadGoogleMapsApi } from "@/lib/googleMaps";
import { CAMPUS_BOUNDARY, CAMPUS_CENTER } from "@/data/campusBoundary";
import type { MapImage, MapImageDocument } from "@/types/mapImage";
import MapImageLayer from "@/components/campus/MapImageLayer";

type Placement = { lat: number; lng: number; x: number; y: number };
const buttonClass = "flex items-center justify-center gap-2 rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40";

export default function MapImageEditor() {
  const container = useRef<HTMLDivElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const placement = useRef<{ lat: number; lng: number } | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [document, setDocument] = useState<MapImageDocument | null>(null);
  const [saved, setSaved] = useState<MapImageDocument | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [menu, setMenu] = useState<Placement | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [mapError, setMapError] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState("");
  const [placing, setPlacing] = useState(false);
  const placingRef = useRef(false);
  const lockedRef = useRef(false);
  useEffect(() => { lockedRef.current = busy || loading; }, [busy, loading]);
  const selected = document?.images.find((image) => image.id === selectedId);
  const dirty = document !== saved;

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/map-images", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to load map images.");
      setDocument(data);
      setSaved(data);
      setSelectedId(null);
      setMessage("");
      setError("");
    } catch (error) { setError(error instanceof Error ? error.message : "Unable to load map images."); }
    finally { setLoading(false); }
  }, []);

  // Load the shared server document; state updates follow the asynchronous response.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    let cancelled = false;
    let instance: google.maps.Map | null = null;
    let boundary: google.maps.Polygon | null = null;
    const listeners: google.maps.MapsEventListener[] = [];
    void loadGoogleMapsApi().then((google) => {
      if (cancelled || !container.current) return;
      instance = new google.maps.Map(container.current, { center: CAMPUS_CENTER, zoom: 18, mapTypeId: "roadmap", mapTypeControl: true, streetViewControl: false, fullscreenControl: false, tilt: 0, heading: 0, gestureHandling: "greedy", styles: [{ featureType: "poi", stylers: [{ visibility: "off" }] }] });
      const bounds = new google.maps.LatLngBounds();
      CAMPUS_BOUNDARY.forEach((point) => bounds.extend(point));
      instance.fitBounds(bounds, 45);
      boundary = new google.maps.Polygon({ map: instance, paths: CAMPUS_BOUNDARY, strokeColor: "#008b92", strokeWeight: 2, fillColor: "#008b92", fillOpacity: 0.06, clickable: false });
      listeners.push(instance.addListener("contextmenu", (event: google.maps.MapMouseEvent) => {
        event.domEvent?.preventDefault();
        if (!event.latLng || !container.current || lockedRef.current) return;
        const rect = container.current.getBoundingClientRect();
        const pointer = event.domEvent as MouseEvent;
        const position = event.latLng.toJSON();
        placement.current = position;
        setMenu({ ...position, x: Math.max(8, Math.min(pointer.clientX - rect.left, rect.width - 180)), y: Math.max(8, Math.min(pointer.clientY - rect.top, rect.height - 65)) });
      }));
      listeners.push(instance.addListener("click", (event: google.maps.MapMouseEvent) => {
        setMenu(null);
        if (placingRef.current && event.latLng && !lockedRef.current) {
          placement.current = event.latLng.toJSON();
          placingRef.current = false;
          setPlacing(false);
          fileInput.current?.click();
        } else setSelectedId(null);
      }));
      listeners.push(instance.addListener("dragstart", () => setMenu(null)));
      listeners.push(instance.addListener("zoom_changed", () => setMenu(null)));
      setMap(instance);
    }).catch((error) => { if (!cancelled) setMapError(error.message || "Unable to load the map."); });
    return () => { cancelled = true; listeners.forEach((listener) => listener.remove()); boundary?.setMap(null); };
  }, []);

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  useEffect(() => {
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setMenu(null); setPlacing(false); placingRef.current = false; }
    };
    window.addEventListener("keydown", escape);
    return () => window.removeEventListener("keydown", escape);
  }, []);

  const change = useCallback((image: MapImage) => {
    setDocument((current) => current ? { ...current, images: current.images.map((item) => item.id === image.id ? image : item) } : current);
    setMessage("");
  }, []);

  const addImage = async (file?: File) => {
    if (!file || !placement.current) return;
    const position = { ...placement.current };
    setError("");
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024) { setError("Choose a PNG, JPEG or WebP image up to 5 MB."); return; }
    setBusy(true);
    try {
      const src = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("Could not read this image."));
        reader.readAsDataURL(file);
      });
      const picture = new Image();
      picture.src = src;
      await picture.decode();
      const height = 0.0005;
      const image: MapImage = { id: crypto.randomUUID(), name: file.name.replace(/\.[^.]+$/, "").slice(0, 120) || "Map image", src, ...position, height, width: Math.max(0.00001, Math.min(0.02, height * picture.naturalWidth / picture.naturalHeight / Math.cos(position.lat * Math.PI / 180))), rotation: 0, opacity: 1 };
      setDocument((current) => current ? { ...current, images: [...current.images, image] } : current);
      setSelectedId(image.id);
      map?.panTo(position);
      setMessage("Image added to your draft. Drag it, stretch the corners, or use the rotation handle.");
    } catch { setError("This image could not be opened. Try another PNG, JPEG or WebP file."); }
    finally { setBusy(false); }
  };

  const publish = async () => {
    if (!document || busy) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/map-images", { method: "PUT", headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(document) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Publishing failed.");
      setDocument(result);
      setSaved(result);
      setMessage("Published. Public visitors will see the updated images within 10 seconds.");
    } catch (error) { setError(error instanceof Error ? error.message : "Publishing failed. Your draft is still here."); }
    finally { setBusy(false); }
  };

  return (
    <section className="mb-7 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm" aria-labelledby="map-editor-title">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 p-4">
        <div><h2 id="map-editor-title" className="text-lg font-semibold">Campus image editor</h2><p className="mt-1 text-sm text-zinc-500">Right-click the map → Add image. Move, stretch and rotate, then publish.</p></div>
        <div className="flex flex-wrap gap-2">
          <button className={buttonClass} disabled={!map || !document || busy || loading || document.images.length >= 100} onClick={() => { placingRef.current = !placing; setPlacing(!placing); setMenu(null); }}><ImagePlus size={17} />{placing ? "Cancel placement" : "Add image"}</button>
          <button className={`${buttonClass} border-teal-700 bg-teal-700 text-white`} disabled={!document || !dirty || busy || loading} onClick={publish}><Save size={17} />{busy ? "Please wait…" : "Save / Publish"}</button>
        </div>
      </div>
      <div className="grid lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="relative h-[60vh] min-h-[420px] bg-zinc-100 lg:h-[660px]" onContextMenu={(event) => event.preventDefault()}>
          <div ref={container} className="absolute inset-0" />
          {!map && <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-zinc-600">{mapError || "Loading campus map…"}</div>}
          {map && document?.images.map((image) => <MapImageLayer key={image.id} map={map} image={image} editable={!busy && !loading} selected={selectedId === image.id} onSelect={setSelectedId} onChange={change} />)}
          {placing && <p className="pointer-events-none absolute left-3 right-3 top-16 rounded-lg bg-teal-800 p-3 text-center text-sm text-white shadow-lg">Click the map where you want the image.</p>}
          {menu && !busy && !loading && <div role="menu" className="absolute z-20 rounded-xl border border-zinc-200 bg-white p-1 shadow-xl" style={{ left: menu.x, top: menu.y }}><button role="menuitem" className="flex items-center gap-2 rounded-lg px-4 py-3 text-sm hover:bg-teal-50" disabled={(document?.images.length ?? 100) >= 100} onClick={() => { placement.current = { lat: menu.lat, lng: menu.lng }; setMenu(null); setPlacing(false); placingRef.current = false; fileInput.current?.click(); }}><ImagePlus size={18} />Add image</button></div>}
        </div>
        <aside className="flex max-h-[660px] flex-col gap-4 overflow-y-auto border-t border-zinc-200 p-4 lg:border-l lg:border-t-0">
          <div className="flex items-center justify-between text-sm"><h3 className="font-semibold">Images ({document?.images.length ?? 0})</h3><span className={dirty ? "text-amber-700" : "text-teal-700"}>{loading ? "Loading…" : dirty ? "Unpublished" : "Published"}</span></div>
          <div className="max-h-40 shrink-0 space-y-1 overflow-y-auto">
            {document?.images.map((image) => <button key={image.id} disabled={busy || loading} onClick={() => { setSelectedId(image.id); map?.panTo({ lat: image.lat, lng: image.lng }); }} className={`block w-full truncate rounded-lg px-3 py-2 text-left text-sm ${selectedId === image.id ? "bg-teal-50 font-medium text-teal-800" : "hover:bg-zinc-100"}`}>{image.name}</button>)}
            {document?.images.length === 0 && <p className="text-sm text-zinc-500">Right-click the map to add your first image.</p>}
          </div>
          {selected ? <fieldset disabled={busy || loading} className="space-y-3 border-t border-zinc-200 pt-3">
            <label className="block text-xs font-medium">Image name<input className="mt-1 w-full rounded border border-zinc-300 p-2 text-sm" value={selected.name} maxLength={120} onChange={(event) => change({ ...selected, name: event.target.value })} /></label>
            <div className="grid grid-cols-2 gap-2">
              {([['width', 'Width'], ['height', 'Height']] as const).map(([key, label]) => <label key={key} className="text-xs font-medium">{label} (m)<input type="number" min="2" max="2000" step="1" className="mt-1 w-full rounded border border-zinc-300 p-2 text-sm" value={Math.round(selected[key] * 111320 * (key === "width" ? Math.cos(selected.lat * Math.PI / 180) : 1))} onChange={(event) => { if (event.target.value !== "") change({ ...selected, [key]: Math.max(0.00001, Math.min(0.02, Number(event.target.value) / (111320 * (key === "width" ? Math.cos(selected.lat * Math.PI / 180) : 1)))) }); }} /></label>)}
            </div>
            <label className="block text-xs font-medium">Rotation ({Math.round(selected.rotation)}°)<input aria-label="Image rotation" className="mt-2 w-full accent-teal-700" type="range" min="0" max="359" step="1" value={selected.rotation} onChange={(event) => change({ ...selected, rotation: Number(event.target.value) })} /></label>
            <label className="block text-xs font-medium">Opacity ({Math.round(selected.opacity * 100)}%)<input aria-label="Image opacity" className="mt-2 w-full accent-teal-700" type="range" min="0.05" max="1" step="0.05" value={selected.opacity} onChange={(event) => change({ ...selected, opacity: Number(event.target.value) })} /></label>
            <p className="text-xs leading-5 text-zinc-500">Drag the image to move. Drag any corner to stretch. Drag ↻ above the image to rotate.</p>
            <button className={`${buttonClass} w-full text-red-700`} onClick={() => { setDocument((current) => current ? { ...current, images: current.images.filter((image) => image.id !== selected.id) } : current); setSelectedId(null); setMessage("Image removed from draft. Publish to remove it from the public map."); }}><Trash2 size={15} />Remove image</button>
          </fieldset> : <p className="text-sm text-zinc-500">Select an image to edit it.</p>}
          <details className="text-xs text-zinc-500"><summary className="cursor-pointer">Admin publish key</summary><input aria-label="Admin publish key" type="password" autoComplete="off" className="mt-2 w-full rounded border border-zinc-300 p-2" placeholder="Enter key if configured" value={token} onChange={(event) => setToken(event.target.value)} /></details>
          <button className={buttonClass} disabled={busy || loading} onClick={() => { if (!dirty || window.confirm("Discard unpublished edits and load the public map?")) { setLoading(true); void load(); } }}><RotateCcw size={15} />Reload published images</button>
          <a className={`${buttonClass} text-teal-700`} href="/" target="_blank" rel="noopener" onClick={(event) => { if (window.location.hostname === "admin.localhost") { event.preventDefault(); const url = new URL(window.location.href); url.hostname = "localhost"; url.pathname = "/"; window.open(url.toString(), "_blank", "noopener"); } }}><ExternalLink size={15} />View public map</a>
        </aside>
      </div>
      <input ref={fileInput} aria-label="Upload map image" type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(event) => { void addImage(event.target.files?.[0]); event.target.value = ""; }} />
      {message && <p role="status" className="border-t border-teal-100 bg-teal-50 px-4 py-3 text-sm text-teal-800">{message}</p>}
      {error && <p role="alert" className="border-t border-red-100 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}
    </section>
  );
}
