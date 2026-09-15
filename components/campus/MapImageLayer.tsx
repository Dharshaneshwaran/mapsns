"use client";

import { useEffect, useRef } from "react";
import type { MapImage } from "@/types/mapImage";
import "@/components/admin/map-editor.css";

type Props = {
  map: google.maps.Map;
  image: MapImage;
  editable?: boolean;
  selected?: boolean;
  onSelect?: (id: string) => void;
  onChange?: (image: MapImage) => void;
  onClick?: (image: MapImage) => void;
};

export default function MapImageLayer(props: Props) {
  const latest = useRef(props);
  const redraw = useRef<(() => void) | null>(null);
  useEffect(() => { latest.current = props; redraw.current?.(); });

  useEffect(() => {
    const { map } = props;
    const overlay = new google.maps.OverlayView();
    const element = document.createElement("div");
    element.className = "map-image-overlay";
    const picture = document.createElement("img");
    picture.draggable = false;
    element.appendChild(picture);
    const handles: HTMLButtonElement[] = [];
    for (const [mode, left, top] of [["nw", "0%", "0%"], ["ne", "100%", "0%"], ["sw", "0%", "100%"], ["se", "100%", "100%"], ["rotate", "50%", "-28px"]]) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `map-image-handle ${mode === "rotate" ? "map-image-rotate" : ""}`;
      button.dataset.mode = mode;
      button.style.left = left;
      button.style.top = top;
      button.setAttribute("aria-label", mode === "rotate" ? "Rotate image" : `Stretch image ${mode}`);
      if (mode === "rotate") button.textContent = "↻";
      element.appendChild(button);
      handles.push(button);
    }

    let gesture: { image: MapImage; x: number; y: number; width: number; height: number; center: google.maps.Point; screenX: number; screenY: number; angle: number; mode: string; pointerId: number } | null = null;
    let width = 0;
    let height = 0;
    let center: google.maps.Point | null = null;
    const draw = () => {
      const { image, editable, selected } = latest.current;
      const projection = overlay.getProjection();
      if (!projection) return;
      center = projection.fromLatLngToDivPixel(new google.maps.LatLng(image.lat, image.lng));
      const nw = projection.fromLatLngToDivPixel(new google.maps.LatLng(image.lat + image.height / 2, image.lng - image.width / 2));
      const se = projection.fromLatLngToDivPixel(new google.maps.LatLng(image.lat - image.height / 2, image.lng + image.width / 2));
      if (!center || !nw || !se) return;
      width = Math.abs(se.x - nw.x);
      height = Math.abs(se.y - nw.y);
      element.style.left = `${center.x}px`;
      element.style.top = `${center.y}px`;
      element.style.width = `${width}px`;
      element.style.height = `${height}px`;
      element.style.transform = `translate(-50%, -50%) rotate(${image.rotation}deg)`;
      element.style.outline = editable && selected ? "2px solid #008b92" : "none";
      element.style.zIndex = selected ? "100" : "1";
      element.style.cursor = editable ? "move" : image.locationId ? "pointer" : "default";
      element.style.pointerEvents = editable || image.locationId ? "auto" : "none";
      picture.style.opacity = String(image.opacity);
      if (picture.getAttribute("src") !== image.src) picture.src = image.src;
      picture.alt = image.name;
      element.title = image.name;
      handles.forEach((handle) => { handle.hidden = !editable || !selected; });
    };
    redraw.current = draw;
    element.addEventListener("pointerdown", (event) => {
      if (!latest.current.editable || event.button !== 0 || !center) return;
      event.preventDefault();
      event.stopPropagation();
      latest.current.onSelect?.(latest.current.image.id);
      const rect = element.getBoundingClientRect();
      const screenX = rect.left + rect.width / 2;
      const screenY = rect.top + rect.height / 2;
      gesture = { image: { ...latest.current.image }, x: event.clientX, y: event.clientY, width, height, center, screenX, screenY, angle: Math.atan2(event.clientY - screenY, event.clientX - screenX), mode: (event.target as HTMLElement).dataset.mode || "move", pointerId: event.pointerId };
      element.setPointerCapture(event.pointerId);
    });
    element.addEventListener("pointermove", (event) => {
      if (!gesture || gesture.pointerId !== event.pointerId) return;
      const start = gesture;
      const next = { ...start.image };
      const dx = event.clientX - start.x;
      const dy = event.clientY - start.y;
      if (start.mode === "move") {
        const coordinate = overlay.getProjection().fromDivPixelToLatLng(new google.maps.Point(start.center.x + dx, start.center.y + dy));
        if (!coordinate) return;
        next.lat = Math.max(-80, Math.min(80, coordinate.lat()));
        next.lng = coordinate.lng();
      } else if (start.mode === "rotate") {
        const angle = Math.atan2(event.clientY - start.screenY, event.clientX - start.screenX);
        next.rotation = ((start.image.rotation + (angle - start.angle) * 180 / Math.PI) % 360 + 360) % 360;
      } else {
        // Convert the pointer delta into the image's rotated coordinate system.
        const radians = start.image.rotation * Math.PI / 180;
        const localX = dx * Math.cos(radians) + dy * Math.sin(radians);
        const localY = -dx * Math.sin(radians) + dy * Math.cos(radians);
        next.width = Math.max(0.00001, Math.min(0.02, start.image.width * (start.width + 2 * localX * (start.mode.includes("e") ? 1 : -1)) / start.width));
        next.height = Math.max(0.00001, Math.min(0.02, start.image.height * (start.height + 2 * localY * (start.mode.includes("s") ? 1 : -1)) / start.height));
      }
      latest.current = { ...latest.current, image: next };
      draw();
      latest.current.onChange?.(next);
    });
    const finish = () => { gesture = null; };
    element.addEventListener("pointerup", finish);
    element.addEventListener("pointercancel", finish);
    element.addEventListener("lostpointercapture", finish);
    element.addEventListener("click", () => {
      if (latest.current.editable) latest.current.onSelect?.(latest.current.image.id);
      else latest.current.onClick?.(latest.current.image);
    });
    overlay.onAdd = () => {
      overlay.getPanes()?.overlayMouseTarget.appendChild(element);
      google.maps.OverlayView.preventMapHitsAndGesturesFrom(element);
    };
    overlay.draw = draw;
    overlay.onRemove = () => { element.remove(); };
    overlay.setMap(map);
    return () => { gesture = null; redraw.current = null; overlay.setMap(null); };
    // Other props update the overlay without interrupting an active pointer gesture.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.map]);
  return null;
}
