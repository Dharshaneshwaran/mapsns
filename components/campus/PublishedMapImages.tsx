"use client";

import { useEffect, useState } from "react";
import { DEFAULT_MAP_IMAGES } from "@/data/mapImages";
import type { MapImage, MapImageDocument } from "@/types/mapImage";
import MapImageLayer from "./MapImageLayer";
import type { CampusLocation } from "@/types/campus";
import { majorPlaceLabel } from "@/data/majorPlaces";
import { POINTER_PALETTE } from "./SettingsDialog";

const TAP_TO_REVEAL_PLACES = ["ai campus", "sns clinic", "chanakya hall", "admin block", "shuttle service"];

function isTapToRevealPlace(name: string): boolean {
  const normalizedName = name.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  return TAP_TO_REVEAL_PLACES.some((place) => normalizedName.includes(place));
}

export default function PublishedMapImages({ map, onClick, selectedLocation }: { map: google.maps.Map; selectedLocation: CampusLocation | null; onClick: (image: MapImage) => void }) {
  const [images, setImages] = useState(DEFAULT_MAP_IMAGES);
  const [showLabels, setShowLabels] = useState(() => (map.getZoom() ?? 0) >= 18);
  const [revealedLabelId, setRevealedLabelId] = useState<string | null>(null);
  useEffect(() => {
    const updateLabelVisibility = () => setShowLabels((map.getZoom() ?? 0) >= 18);
    updateLabelVisibility();
    const listener = map.addListener("zoom_changed", updateLabelVisibility);
    return () => listener.remove();
  }, [map]);
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
    {images.map((image, index) => {
      const eventLabel = majorPlaceLabel(image.name);
      const markerId = image.locationId || image.id;
      const showLabelText = isTapToRevealPlace(image.name) ? revealedLabelId === markerId : showLabels;
      return <MapImageLayer key={image.id} map={map} image={image} label={eventLabel || image.name} showLabelText={showLabelText} largeIcon={!!eventLabel} markerColor={POINTER_PALETTE[index % POINTER_PALETTE.length]} selected={markerId === selectedLocation?.id} onClick={(clickedImage) => { setRevealedLabelId(markerId); onClick(clickedImage); }} />;
    })}
    {fallback && <MapImageLayer key={`selected-${fallback.id}`} map={map} image={fallback} label={fallback.name} showLabelText={isTapToRevealPlace(fallback.name) ? revealedLabelId === fallback.id : showLabels} largeIcon={!!majorPlaceLabel(fallback.name)} markerColor={POINTER_PALETTE[images.length % POINTER_PALETTE.length]} selected onClick={(clickedImage) => { setRevealedLabelId(fallback.id); onClick(clickedImage); }} />}
  </>;
}
