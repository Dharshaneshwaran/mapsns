"use client";

import {
  Layers,
  Navigation,
  PersonStanding,
  X,
} from "lucide-react";
import PlaceActions from "./PlaceActions";
import Image from "next/image";
import { useEffect, useRef, useState, type PointerEvent } from "react";
import type { CampusLocation, TravelMode } from "@/types/campus";
import { majorPlaceLabel } from "@/data/majorPlaces";

const journeyMessages: Record<string, string> = {
  Registration: "Your conference journey begins here!",
  "Inauguration + Panel session one": "Get ready for the opening conversations!",
  "Panel session two": "Head to RM Hall on the 1st floor. Fresh ideas and new perspectives await!",
  "Panel session three": "Your next inspiring conversation awaits!",
  "Panel session four": "Keep exploring ideas that drive progress!",
};

type Props = {
  destination: string;
  destinationGapMeters?: number;
  distance: number;
  duration: number;
  mode: TravelMode;
  onModeChange: (mode: TravelMode) => void;
  onStart: () => void;
  onClose: () => void;
  onLayers: () => void;
  location: CampusLocation;
};

function durationLabel(seconds: number) {
  const minutes = Math.max(1, Math.ceil(seconds / 60));
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return remaining ? `${hours} hr ${remaining} min` : `${hours} hr`;
}

export default function RoutePreviewOverlay({ destination, destinationGapMeters, distance, duration, mode, onModeChange, onStart, onClose, onLayers, location }: Props) {
  const eventLabel = majorPlaceLabel(location.name);
  const distanceLabel = distance < 1000 ? `${Math.round(distance)} m` : `${(distance / 1000).toFixed(1)} km`;
  const sheet = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [dragHeight, setDragHeight] = useState<number | null>(null);
  const drag = useRef<{ pointerId: number; y: number; height: number; minimum: number; maximum: number; delta: number } | null>(null);
  const moved = useRef(false);
  const collapsedHeight = useRef(320);

  const finishDrag = (cancelled = false) => {
    const current = drag.current;
    if (!current) return;
    drag.current = null;
    if (!cancelled && moved.current) setExpanded(Math.abs(current.delta) > 24 ? current.delta > 0 : expanded);
    setDragHeight(null);
  };

  useEffect(() => {
    const resize = () => { drag.current = null; setDragHeight(null); };
    window.addEventListener("resize", resize);
    window.visualViewport?.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("resize", resize);
      window.visualViewport?.removeEventListener("resize", resize);
    };
  }, []);

  const startDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || drag.current || !sheet.current || (event.target as HTMLElement).closest('[aria-label="Close route preview"]')) return;
    const height = sheet.current.getBoundingClientRect().height;
    if (!expanded) collapsedHeight.current = height;
    // Measure the CSS-constrained expanded size; max-height may remain a calc().
    const previousHeight = sheet.current.style.height;
    sheet.current.style.height = "100%";
    const maximum = sheet.current.getBoundingClientRect().height;
    sheet.current.style.height = previousHeight;
    drag.current = { pointerId: event.pointerId, y: event.clientY, height, minimum: Math.min(collapsedHeight.current, maximum), maximum, delta: 0 };
    moved.current = false;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const moveDrag = (event: PointerEvent<HTMLDivElement>) => {
    const current = drag.current;
    if (!current || current.pointerId !== event.pointerId) return;
    current.delta = current.y - event.clientY;
    if (!moved.current && Math.abs(current.delta) <= 5) return;
    moved.current = true;
    setDragHeight(Math.max(current.minimum, Math.min(current.maximum, current.height + current.delta)));
  };

  return (
    <div className="pointer-events-none absolute inset-0 z-40 text-[#202124]">
      <div className="route-search-card pointer-events-auto absolute left-3 right-3 top-3 rounded-[18px] bg-white px-4 py-2 shadow-[0_2px_8px_rgba(0,0,0,0.28)] safe-top sm:left-4 sm:right-auto sm:top-4 sm:w-[420px]">
        <div className="flex items-center gap-3 border-b border-[#e8eaed] py-1.5">
          <span className="h-3 w-3 rounded-full border-[3px] border-[#8ab4f8] bg-[#1a73e8]" />
          <span className="flex-1 text-sm text-[#1a73e8]">Your location</span>
        </div>
        <div className="flex items-center gap-3 py-1.5">
          <span className="text-lg text-[#ea4335]">⌖</span>
          <span className="min-w-0 flex-1 truncate text-sm">{destination}</span>
        </div>
      </div>

      <button onClick={onLayers} aria-label="Map layers" className="navigation-round-control pointer-events-auto absolute right-4 top-28 bg-white text-[#3c4043] hover:bg-[#f1f3f4]"><Layers className="h-6 w-6" /></button>

      <div
        ref={sheet}
        style={{ height: dragHeight ?? (expanded ? "100%" : undefined) }}
        className="route-preview-sheet pointer-events-auto absolute bottom-0 left-0 right-0 overflow-hidden rounded-t-[24px] bg-white shadow-[0_-3px_16px_rgba(0,0,0,0.2)] sm:bottom-4 sm:left-4 sm:right-auto sm:w-[420px] sm:rounded-[22px]"
        onPointerDown={(event) => event.stopPropagation()}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="shrink-0 touch-none select-none"
          onPointerDown={startDrag}
          onPointerMove={moveDrag}
          onPointerUp={() => finishDrag()}
          onPointerCancel={() => finishDrag(true)}
          onLostPointerCapture={() => finishDrag(true)}
        >
        <button type="button" className="flex h-8 w-full cursor-ns-resize items-center justify-center" aria-label={expanded ? "Collapse route panel" : "Expand route panel"} aria-expanded={expanded}
          onClick={(event) => { if (event.detail === 0 || !moved.current) setExpanded((value) => !value); moved.current = false; }}
        ><span className="h-1 w-10 rounded-full bg-[#dadce0]" /></button>
        <div className="flex shrink-0 items-center gap-2 px-5 pb-2 pt-2">
          <h2 className="min-w-0 flex-1 truncate text-[20px] font-medium">Your campus journey</h2>
          <button onClick={onClose} aria-label="Close route preview" className="google-round-button"><X className="h-[18px] w-[18px]" /></button>
        </div>
        </div>

        <div className="grid shrink-0 grid-cols-2 border-b border-[#dadce0] px-2">
          <button onClick={() => onModeChange("walking")} className={`route-mode-tab ${mode === "walking" ? "active" : ""}`}><PersonStanding className="h-[18px] w-[18px]" /><span>Walk</span></button>
          <button onClick={() => onModeChange("vehicle")} className={`route-mode-tab ${mode === "vehicle" ? "active" : ""}`}><Image src="/bullet_cart_v1/11.png" alt="" width={28} height={28} unoptimized className="h-7 w-7 object-contain" /><span>Vehicle</span></button>
        </div>

        <div className="route-preview-details px-5 py-3">
          <div className="flex items-start gap-4">
            <p className="shrink-0 whitespace-nowrap text-[20px] font-medium leading-6 text-[#188038]">{durationLabel(duration)}</p>
            <div className="min-w-0 flex-1 text-xs leading-4 text-[#5f6368]">
              <p><span className="font-medium text-[#202124]">{mode === "vehicle" ? "By vehicle" : "On foot"}</span> · Estimated journey</p>
              <p>{distanceLabel}</p>
              <p className="mt-1 font-medium text-[#202124]">On your way to {eventLabel ?? destination} — {journeyMessages[eventLabel ?? ""] ?? "Your next campus stop awaits!"}</p>
              {!!destinationGapMeters && destinationGapMeters > 30 && <p className="mt-1 text-xs">Route ends on a campus path, {Math.round(destinationGapMeters)} m from the pin. Check the entrance from there.</p>}
            </div>
          </div>
        </div>
          <div className="route-preview-actions flex shrink-0 flex-wrap gap-2 border-t border-zinc-100 bg-white px-5 pt-3">
            <button type="button" onClick={onStart} className="google-action-button relative z-10 bg-[#008c95] text-white hover:bg-[#007b83]"><Navigation className="h-4 w-4 fill-current" /> Start navigation</button>
            <PlaceActions location={location} />
            <a className="w-full text-[10px] text-zinc-500 underline" href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">? OpenStreetMap contributors</a>
          </div>
      </div>
    </div>
  );
}
