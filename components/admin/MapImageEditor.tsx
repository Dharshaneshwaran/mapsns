"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MapPinPlus, Save, Trash2, RotateCcw, ExternalLink } from "lucide-react";
import { loadGoogleMapsApi } from "@/lib/googleMaps";
import { CAMPUS_BOUNDARY, CAMPUS_CENTER } from "@/data/campusBoundary";
import type { MapImage, MapImageDocument } from "@/types/mapImage";
import MapImageLayer from "@/components/campus/MapImageLayer";

type Placement = { lat: number; lng: number; x: number; y: number };
const buttonClass = "flex items-center justify-center gap-2 rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40";

export default function MapImageEditor() {
  const container = useRef<HTMLDivElement>(null);
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

  const addMarker = useCallback((position: { lat: number; lng: number }) => {
    const id = crypto.randomUUID();
    const marker: MapImage = { id, locationId: id, name: "New marker", src: "lucide:map-pin", ...position, width: 0.0001, height: 0.0001, rotation: 0, opacity: 1 };
    setDocument((current) => current && current.images.length < 100 ? { ...current, images: [...current.images, marker] } : current);
    setSelectedId(id);
    setMessage("Marker added to your draft. Click to select it, rename it, or drag it to move.");
  }, []);

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/map-images", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to load map markers.");
      const markers = { ...data, images: data.images.map((image: MapImage) => ({ ...image, locationId: image.locationId || image.id })) };
      setDocument(markers);
      setSaved(markers);
      setSelectedId(null);
      setMessage("");
      setError("");
    } catch (error) { setError(error instanceof Error ? error.message : "Unable to load map markers."); }
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
          addMarker(placement.current!);
        } else setSelectedId(null);
      }));
      listeners.push(instance.addListener("dragstart", () => setMenu(null)));
      listeners.push(instance.addListener("zoom_changed", () => setMenu(null)));
      setMap(instance);
    }).catch((error) => { if (!cancelled) setMapError(error.message || "Unable to load the map."); });
    return () => { cancelled = true; listeners.forEach((listener) => listener.remove()); boundary?.setMap(null); };
  }, [addMarker]);

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

  const uploadImage = async (file: File | undefined) => {
    if (!file || !selected || busy) return;
    const marker = selected;
    setError("");
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024) {
      setError("Choose a PNG, JPEG or WebP image up to 5 MB.");
      return;
    }
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
      const updated = { ...marker, src };
      change(updated);
      const nextDocument = document ? { ...document, images: document.images.map((item) => item.id === updated.id ? updated : item) } : null;
      if (nextDocument) {
        const response = await fetch("/api/map-images", { method: "PUT", headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(nextDocument) });
        const result = await response.json();
        if (response.ok) {
          setDocument(result);
          setSaved(result);
          setMessage("Photo uploaded and published. Visitors will see it in the place details.");
        } else {
          setMessage("Photo added to draft. Click Save / Publish to make it visible to visitors.");
        }
      } else {
        setMessage("Photo added to draft. Click Save / Publish to make it visible to visitors.");
      }
    } catch {
      setError("This image could not be opened. Choose another PNG, JPEG or WebP file.");
    } finally { setBusy(false); }
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
      setMessage("Published. Public visitors will see the updated markers within 10 seconds.");
    } catch (error) { setError(error instanceof Error ? error.message : "Publishing failed. Your draft is still here."); }
    finally { setBusy(false); }
  };

  return (
    <section className="mb-7 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm" aria-labelledby="map-editor-title">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 p-4">
        <div><h2 id="map-editor-title" className="text-lg font-semibold">Campus marker editor</h2><p className="mt-1 text-sm text-zinc-500">Right-click the map to add a marker. Click to select, drag to move, then publish.</p></div>
        <div className="flex flex-wrap gap-2">
          <button className={buttonClass} disabled={!map || !document || busy || loading || document.images.length >= 100} onClick={() => { placingRef.current = !placing; setPlacing(!placing); setMenu(null); }}><MapPinPlus size={17} />{placing ? "Cancel placement" : "Add marker"}</button>
          <button className={`${buttonClass} border-teal-700 bg-teal-700 text-white`} disabled={!document || !dirty || busy || loading} onClick={publish}><Save size={17} />{busy ? "Please wait…" : "Save / Publish"}</button>
        </div>
      </div>
      <div className="grid lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="relative h-[60vh] min-h-[420px] bg-zinc-100 lg:h-[660px]" onContextMenu={(event) => event.preventDefault()}>
          <div ref={container} className="absolute inset-0" />
          {!map && <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-zinc-600">{mapError || "Loading campus map…"}</div>}
          {map && document?.images.map((image) => <MapImageLayer key={image.id} map={map} image={image} editable={!busy && !loading} selected={selectedId === image.id} onSelect={setSelectedId} onChange={change} />)}
          {placing && <p className="pointer-events-none absolute left-3 right-3 top-16 rounded-lg bg-teal-800 p-3 text-center text-sm text-white shadow-lg">Click the map where you want the marker.</p>}
          {menu && !busy && !loading && <div role="menu" className="absolute z-20 rounded-xl border border-zinc-200 bg-white p-1 shadow-xl" style={{ left: menu.x, top: menu.y }}><button role="menuitem" className="flex items-center gap-2 rounded-lg px-4 py-3 text-sm hover:bg-teal-50" disabled={(document?.images.length ?? 100) >= 100} onClick={() => { placement.current = { lat: menu.lat, lng: menu.lng }; setMenu(null); setPlacing(false); placingRef.current = false; addMarker(placement.current!); }}><MapPinPlus size={18} />Add marker</button></div>}
        </div>
        <aside className="flex max-h-[660px] flex-col gap-4 overflow-y-auto border-t border-zinc-200 p-4 lg:border-l lg:border-t-0">
          <div className="flex items-center justify-between text-sm"><h3 className="font-semibold">Markers ({document?.images.length ?? 0})</h3><span className={dirty ? "text-amber-700" : "text-teal-700"}>{loading ? "Loading…" : dirty ? "Unpublished" : "Published"}</span></div>
          <div className="max-h-40 shrink-0 space-y-1 overflow-y-auto">
            {document?.images.map((image) => <button key={image.id} disabled={busy || loading} onClick={() => { setSelectedId(image.id); map?.panTo({ lat: image.lat, lng: image.lng }); }} className={`block w-full truncate rounded-lg px-3 py-2 text-left text-sm ${selectedId === image.id ? "bg-teal-50 font-medium text-teal-800" : "hover:bg-zinc-100"}`}>{image.name}</button>)}
            {document?.images.length === 0 && <p className="text-sm text-zinc-500">Right-click the map to add your first marker.</p>}
          </div>
          {selected ? <fieldset disabled={busy || loading} className="space-y-3 border-t border-zinc-200 pt-3">
            <label className="block text-xs font-medium">Marker name<input className="mt-1 w-full rounded border border-zinc-300 p-2 text-sm" value={selected.name} maxLength={120} onChange={(event) => change({ ...selected, name: event.target.value })} /></label>
            <label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" checked={selected.showInShortcuts !== false} onChange={(event) => change({ ...selected, showInShortcuts: event.target.checked })} />Show in top map buttons</label>
            <p className="text-xs text-zinc-500">Choose whether this place appears in the top button row. Hidden buttons still appear as map pins and in search. Click Save / Publish to apply.</p>
            <label className="block text-xs font-medium">Destination photo
              <input aria-label="Destination photo" type="file" accept="image/png,image/jpeg,image/webp" className="mt-2 block w-full text-xs file:mr-2 file:rounded-lg file:border-0 file:bg-teal-50 file:px-3 file:py-2 file:text-teal-800" onChange={(event) => { void uploadImage(event.target.files?.[0]); event.target.value = ""; }} />
            </label>
            <p className="text-xs text-zinc-500">Upload a PNG, JPEG or WebP up to 5 MB. Visitors see this photo when they click the map pin.</p>
            {selected.src !== "lucide:map-pin" && <div className="space-y-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={selected.src} alt="Destination photo preview" className="h-28 w-full rounded-lg bg-zinc-50 object-contain" />
              <button type="button" className={`${buttonClass} w-full`} onClick={() => change({ ...selected, src: "lucide:map-pin" })}>Remove photo</button>
            </div>}
            <p className="text-xs leading-5 text-zinc-500">Click a marker to select it. Drag it to move. Published markers open their destination when clicked. Place the pin at an accessible entrance.</p>
            <button className={`${buttonClass} w-full text-red-700`} onClick={() => { setDocument((current) => current ? { ...current, images: current.images.filter((image) => image.id !== selected.id) } : current); setSelectedId(null); setMessage("Marker removed from draft. Publish to remove it from the public map."); }}><Trash2 size={15} />Remove marker</button>
          </fieldset> : <p className="text-sm text-zinc-500">Select a marker to edit it.</p>}
          <details className="text-xs text-zinc-500"><summary className="cursor-pointer">Admin publish key</summary><input aria-label="Admin publish key" type="password" autoComplete="off" className="mt-2 w-full rounded border border-zinc-300 p-2" placeholder="Enter key if configured" value={token} onChange={(event) => setToken(event.target.value)} /></details>
          <button className={buttonClass} disabled={busy || loading} onClick={() => { if (!dirty || window.confirm("Discard unpublished edits and load the public map?")) { setLoading(true); void load(); } }}><RotateCcw size={15} />Reload published markers</button>
          <a className={`${buttonClass} text-teal-700`} href="/" target="_blank" rel="noopener" onClick={(event) => { if (window.location.hostname === "admin.localhost") { event.preventDefault(); const url = new URL(window.location.href); url.hostname = "localhost"; url.pathname = "/"; window.open(url.toString(), "_blank", "noopener"); } }}><ExternalLink size={15} />View public map</a>
        </aside>
      </div>
      {message && <p role="status" className="border-t border-teal-100 bg-teal-50 px-4 py-3 text-sm text-teal-800">{message}</p>}
      {error && <p role="alert" className="border-t border-red-100 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}
    </section>
  );
}
