"use client";

import { createElement, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Bike,
  BookOpen,
  Building2,
  BusFront,
  CarFront,
  ClipboardCheck,
  Cross,
  DoorOpen,
  Dumbbell,
  GraduationCap,
  Landmark,
  MapPin,
  Plane,
  PersonStanding,
  Presentation,
  RotateCwFadingClock,
  School,
  Theater,
  TreePine,
  Utensils,
  type LucideIcon,
} from "lucide-react";
import type { MapImage } from "@/types/mapImage";

type Props = {
  map: google.maps.Map;
  image: MapImage;
  editable?: boolean;
  selected?: boolean;
  label?: string;
  showLabelText?: boolean;
  largeIcon?: boolean;
  markerColor?: string;
  onSelect?: (id: string) => void;
  onChange?: (image: MapImage) => void;
  onClick?: (image: MapImage) => void;
};

const PLACE_ICONS: { terms: string[]; icon: LucideIcon }[] = [
  { terms: ["registration", "reception", "regestion"], icon: ClipboardCheck },
  { terms: ["plane view", "plane", "flight", "airport"], icon: Plane },
  { terms: ["clinic", "hospital", "medical"], icon: Cross },
  { terms: ["car parking", "parking area", "car park"], icon: CarFront },
  { terms: ["bike", "cycle"], icon: Bike },
  { terms: ["shuttle", "bus", "transport"], icon: BusFront },
  { terms: ["library", "book"], icon: BookOpen },
  { terms: ["canteen", "mess", "food", "cafe"], icon: Utensils },
  { terms: ["playground", "sports", "court", "ground"], icon: Dumbbell },
  { terms: ["cloak room", "cloakroom", "clock room", "clockroom", "cloak", "clock"], icon: RotateCwFadingClock },
  { terms: ["panel", "inauguration", "auditorium", "theatre", "theater"], icon: Theater },
  { terms: ["certificate", "presentation"], icon: Presentation },
  { terms: ["buddha"], icon: PersonStanding },
  { terms: ["temple", "heritage"], icon: Landmark },
  { terms: ["gate", "entrance"], icon: DoorOpen },
  { terms: ["admin", "office"], icon: Building2 },
  { terms: ["ai campus", "college", "academic", "school"], icon: GraduationCap },
  { terms: ["lawn", "garden", "park"], icon: TreePine },
  { terms: ["hall", "building", "block", "hub", "spine"], icon: School },
];

function placeIcon(name: string): LucideIcon {
  const normalizedName = name.toLowerCase();
  return PLACE_ICONS.find(({ terms }) => terms.some((term) => normalizedName.includes(term)))?.icon ?? MapPin;
}

function renderPlaceIcon(name: string, large = false) {
  return createElement(placeIcon(name), { size: large ? 18 : 13, strokeWidth: 1.8, "aria-hidden": true });
}

export default function MapImageLayer(props: Props) {
  const latest = useRef(props);
  const redraw = useRef<(() => void) | null>(null);
  const [host, setHost] = useState<HTMLDivElement | null>(null);
  useEffect(() => { latest.current = props; redraw.current?.(); });

  useEffect(() => {
    const overlay = new google.maps.OverlayView();
    const element = document.createElement("div");
    element.className = "map-marker-overlay";
    element.style.cssText = "position:absolute;transform:translate(-50%,-100%);touch-action:none";
    let gesture: { x: number; y: number; center: google.maps.Point; image: MapImage; pointerId: number } | null = null;
    let dragged = false;
    const draw = () => {
      const { image, selected } = latest.current;
      const center = overlay.getProjection()?.fromLatLngToDivPixel(new google.maps.LatLng(image.lat, image.lng));
      if (!center) return;
      element.style.left = `${center.x}px`;
      element.style.top = `${center.y}px`;
      element.style.transform = latest.current.label ? "translate(-15px,-50%)" : "translate(-50%,-100%)";
      element.style.zIndex = selected ? "100" : "10";
    };
    redraw.current = draw;
    element.addEventListener("pointerdown", (event) => {
      dragged = false;
      if (!latest.current.editable || event.button !== 0) return;
      const center = overlay.getProjection().fromLatLngToDivPixel(new google.maps.LatLng(latest.current.image.lat, latest.current.image.lng));
      if (!center) return;
      latest.current.onSelect?.(latest.current.image.id);
      gesture = { x: event.clientX, y: event.clientY, center, image: latest.current.image, pointerId: event.pointerId };
      element.setPointerCapture(event.pointerId);
    });
    element.addEventListener("pointermove", (event) => {
      if (!gesture || gesture.pointerId !== event.pointerId || !latest.current.editable) return;
      const dx = event.clientX - gesture.x;
      const dy = event.clientY - gesture.y;
      if (!dragged && Math.hypot(dx, dy) < 4) return;
      dragged = true;
      const coordinate = overlay.getProjection().fromDivPixelToLatLng(new google.maps.Point(gesture.center.x + dx, gesture.center.y + dy));
      if (!coordinate) return;
      const next = { ...gesture.image, lat: Math.max(-80, Math.min(80, coordinate.lat())), lng: coordinate.lng() };
      latest.current = { ...latest.current, image: next };
      draw();
      latest.current.onChange?.(next);
    });
    const finish = () => { gesture = null; };
    element.addEventListener("pointerup", finish);
    element.addEventListener("pointercancel", finish);
    element.addEventListener("lostpointercapture", finish);
    element.addEventListener("click", (event) => {
      event.stopPropagation();
      if (dragged) { dragged = false; return; }
      if (latest.current.editable) latest.current.onSelect?.(latest.current.image.id);
      else latest.current.onClick?.(latest.current.image);
    });
    overlay.onAdd = () => {
      overlay.getPanes()?.overlayMouseTarget.appendChild(element);
      google.maps.OverlayView.preventMapHitsAndGesturesFrom(element);
      setHost(element);
    };
    overlay.draw = draw;
    overlay.onRemove = () => element.remove();
    overlay.setMap(props.map);
    return () => { gesture = null; redraw.current = null; overlay.setMap(null); };
  }, [props.map]);

  return host ? createPortal(
    <button type="button" aria-label={props.image.name} aria-pressed={props.editable ? !!props.selected : undefined} title={props.image.name}
      className={props.label ? `campus-landmark ${props.selected ? "is-selected" : ""}` : `flex items-end justify-center rounded-lg bg-transparent transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-600 ${props.selected ? "h-12 w-11" : "h-9 w-9"}`}
      style={{ cursor: props.editable ? "grab" : "pointer" }}>
      {props.label ? <><span className="campus-landmark-dot" style={{ backgroundColor: props.markerColor, color: "white" }}>{renderPlaceIcon(props.label, props.largeIcon)}</span>{props.showLabelText && <span>{props.label}</span>}</> : <MapPin size={props.selected ? 44 : 26} strokeWidth={1.25} aria-hidden="true" className="pointer-events-none stroke-white drop-shadow-sm [&_circle]:fill-white [&_circle]:stroke-none" style={{ fill: props.markerColor || "#bd5b5b" }} />}
    </button>, host) : null;
}
