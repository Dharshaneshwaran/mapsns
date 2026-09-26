"use client";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

type Fix = { lat: number; lng: number; accuracy: number; at: number };
const SharingContext = createContext({ sharing: false, message: "", toggle: () => {} });
const SHARING_STORAGE_KEY = "campus-location-sharing";

function readSharingPreference(): "on" | "off" | "unset" {
  try {
    const value = localStorage.getItem(SHARING_STORAGE_KEY);
    if (value === "1") return "on";
    if (value === "0") return "off";
  } catch { /* Preference is best-effort. */ }
  return "unset";
}

function writeSharingPreference(enabled: boolean) {
  try {
    localStorage.setItem(SHARING_STORAGE_KEY, enabled ? "1" : "0");
  } catch { /* Preference is best-effort. */ }
}

export function VisitorPresenceProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sharing, setSharing] = useState(false);
  const [message, setMessage] = useState("");
  const fix = useRef<Fix | null>(null);
  const report = useRef<() => void>(() => {});
  useEffect(() => {
    if (pathname.startsWith("/admin") || window.location.hostname === "admin.localhost") return;
    const preference = readSharingPreference();
    if (preference !== "off") {
      const restore = Promise.resolve().then(() => {
        if (!window.isSecureContext || !navigator.geolocation) {
          setSharing(false);
          setMessage("Location sharing requires a secure connection and browser location support.");
          return;
        }
        setSharing(true);
        writeSharingPreference(true);
        setMessage(preference === "on" ? "Sharing your approximate area while this page is open." : "Allow location to show your approximate area on the campus activity map.");
      });
      void restore;
    }
    // randomUUID is unavailable on insecure pages, including phone LAN previews.
    if (typeof crypto.randomUUID !== "function") return;
    let id = crypto.randomUUID() as string;
    try {
      const stored = localStorage.getItem("campus-visitor-id");
      if (stored && /^[a-f0-9-]{36}$/i.test(stored)) id = stored;
      else localStorage.setItem("campus-visitor-id", id);
    } catch { /* Storage unavailable: count this page session. */ }
    let busy = false;
    let stopped = false;
    let pending = false;
    let lastSentAt = 0;
    const send = async (force = false) => {
      if (document.hidden || stopped) return;
      if (!force && Date.now() - lastSentAt < 8_000) return;
      if (busy) { pending = true; return; }
      busy = true;
      lastSentAt = Date.now();
      const current = fix.current;
      const location = current && Date.now() - current.at < 60_000
        ? { lat: current.lat, lng: current.lng, accuracy: current.accuracy } : null;
      try {
        await fetch("/api/visitors", { method: "POST", headers: { "Content-Type": "application/json", "X-Visitor-Id": id }, body: JSON.stringify({ location }), cache: "no-store", signal: AbortSignal.timeout(8000) });
      } catch { /* Retry without interrupting navigation. */ }
      finally { busy = false; if (pending) { pending = false; void send(true); } }
    };
    const refresh = () => { void send(true); };
    report.current = refresh;
    refresh();
    const timer = setInterval(refresh, 20_000);
    const onMove = () => { if (!document.hidden && fix.current) void send(); };
    document.addEventListener("visibilitychange", refresh);
    window.addEventListener("campus-location-updated", onMove);
    return () => { stopped = true; clearInterval(timer); document.removeEventListener("visibilitychange", refresh); window.removeEventListener("campus-location-updated", onMove); report.current = () => {}; };
  }, [pathname]);

  useEffect(() => {
    if (!sharing || pathname.startsWith("/admin") || !window.isSecureContext || !navigator.geolocation) return;
    let watch: number | undefined;
    let active = true;
    const stopWatch = () => {
      if (watch !== undefined) navigator.geolocation.clearWatch(watch);
      watch = undefined;
      fix.current = null;
    };
    const startWatch = () => {
      stopWatch();
      if (document.hidden) return;
      watch = navigator.geolocation.watchPosition(position => {
        if (!active || document.hidden) return;
        fix.current = { lat: position.coords.latitude, lng: position.coords.longitude, accuracy: position.coords.accuracy, at: position.timestamp };
        setMessage(position.coords.accuracy > 150 ? "Waiting for a more accurate location." : "Sharing your approximate area while this page is open.");
        window.dispatchEvent(new Event("campus-location-updated"));
      }, error => {
        if (!active) return;
        fix.current = null;
        setMessage(error.code === 1 ? "Location permission was denied. Sharing is off." : "Location unavailable. Waiting for a GPS signal.");
        if (error.code === 1) { setSharing(false); writeSharingPreference(false); }
        report.current();
      }, { enableHighAccuracy: true, maximumAge: 5_000, timeout: 15_000 });
    };
    startWatch();
    document.addEventListener("visibilitychange", startWatch);
    return () => { active = false; stopWatch(); document.removeEventListener("visibilitychange", startWatch); };
  }, [sharing, pathname]);

  const toggle = () => {
    if (sharing) {
      fix.current = null;
      setSharing(false);
      writeSharingPreference(false);
      setMessage("Location sharing is off.");
      report.current();
    } else if (!navigator.geolocation || !window.isSecureContext) {
      setMessage("Location sharing requires a secure connection and browser location support.");
    } else {
      setMessage("Waiting for location permission and a GPS signal.");
      setSharing(true);
      writeSharingPreference(true);
    }
  };
  return <SharingContext.Provider value={{ sharing, message, toggle }}>{children}</SharingContext.Provider>;
}

export function VisitorSharingControl() {
  const { sharing, message, toggle } = useContext(SharingContext);
  return <div className="my-4 rounded-2xl border border-[#e3e7ee] bg-white p-4">
    <h3 className="font-semibold">Campus activity map</h3>
    <p className="mt-2 text-xs text-[#5f6368]">Your browser may ask for location on open so organisers can see busy areas on the admin heatmap. Approximate only, with no names or location history. Locations expire after 2 minutes without updates. Stop anytime below.</p>
    <button type="button" onClick={toggle} aria-pressed={sharing} className="mt-3 rounded-full border border-[#dadce0] px-4 py-2 text-xs font-medium">{sharing ? "Stop sharing location" : "Share my approximate location"}</button>
    <p role="status" className="mt-2 text-xs text-[#5f6368]">{message || "Sharing is off. Anonymous online counts do not require location access."}</p>
  </div>;
}
