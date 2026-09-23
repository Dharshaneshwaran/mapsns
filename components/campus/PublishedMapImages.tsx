"use client";

import { useEffect, useState } from "react";
import { DEFAULT_MAP_IMAGES } from "@/data/mapImages";
import type { MapImage, MapImageDocument } from "@/types/mapImage";
import MapImageLayer from "./MapImageLayer";
import type { CampusLocation } from "@/types/campus";
import { majorPlaceLabel } from "@/data/majorPlaces";

export default function PublishedMapImages({ map, onClick, selectedLocation }: { map: google.maps.Map; selectedLocation: CampusLocation | null; onClick: (image: MapImage) => void }) {
  const [images, setImages] = useState(DEFAULT_MAP_IMAGES);
  useEffect(() => {
    let etag = "";
    let busy = false;
    const controller = new AbortController();
    const refresh = async () => {
      if (busy || document.hidden) return;
      busy = true;
      try {
        const response = await fetch("/api/map-images", { cache: "no-store", signal: controller.signal, headers: etag ? { "If-None-Match": etag } : {} });
        if (response.ok) {
          const data: MapImageDocument = await response.json();
          if (!controller.signal.aborted) { setImages(data.images); etag = response.headers.get("etag") || ""; }
        }
      } catch { /* Keep the last successful map during a temporary connection failure. */ }
      finally { busy = false; }
    };
    void refresh();
    const timer = setInterval(refresh, 10000);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => { controller.abort(); clearInterval(timer); window.removeEventListener("focus", refresh); document.removeEventListener("visibilitychange", refresh); };
  }, []);
  const hasSelectedMarker = selectedLocation && images.some((image) => (image.locationId || image.id) === selectedLocation.id);
  const fallback: MapImage | null = selectedLocation && !hasSelectedMarker ? {
    id: selectedLocation.id, locationId: selectedLocation.id, name: selectedLocation.name,
    src: "lucide:map-pin", ...selectedLocation.position,
    width: 0.0001, height: 0.0001, rotation: 0, opacity: 1,
  } : null;
  return <>
    {images.map((image) => <MapImageLayer key={image.id} map={map} image={image} label={majorPlaceLabel(image.name) || image.name} selected={(image.locationId || image.id) === selectedLocation?.id} onClick={onClick} />)}
    {fallback && <MapImageLayer key={`selected-${fallback.id}`} map={map} image={fallback} label={fallback.name} selected onClick={onClick} />}
  </>;
}
