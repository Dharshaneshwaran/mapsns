"use client";
import { useEffect, useState } from "react";
import { CAMPUS_LOCATIONS } from "@/data/campusLocations";
import { publishedPlaces } from "@/lib/publishedPlaces";
export function useCampusPlaces() {
  const [places, setPlaces] = useState(CAMPUS_LOCATIONS);
  useEffect(() => {
    const controller = new AbortController(); let busy = false;
    const refresh = async () => { if (busy || document.hidden) return; busy = true; try { const response = await fetch("/api/map-images", { cache: "no-store", signal: controller.signal }); if (response.ok) { const data = await response.json(); if (!controller.signal.aborted) setPlaces(publishedPlaces(data.images)); } } catch {} finally { busy = false; } };
    void refresh(); const timer = setInterval(refresh, 10000); window.addEventListener("focus", refresh);
    return () => { controller.abort(); clearInterval(timer); window.removeEventListener("focus", refresh); };
  }, []);
  return places;
}
