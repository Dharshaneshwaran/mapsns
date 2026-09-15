"use client";

import {
  CarFront,
  Layers,
  Navigation,
  PersonStanding,
  X,
} from "lucide-react";
import PlaceActions from "./PlaceActions";
import type { CampusLocation, TravelMode } from "@/types/campus";

type Props = {
  destination: string;
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

export default function RoutePreviewOverlay({ destination, distance, duration, mode, onModeChange, onStart, onClose, onLayers, location }: Props) {
  const distanceLabel = distance < 1000 ? `${Math.round(distance)} m` : `${(distance / 1000).toFixed(1)} km`;
  const walkingDuration = distance / 1.4;
  const vehicleDuration = distance / 5.5;

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
        className="route-preview-sheet pointer-events-auto absolute bottom-0 left-0 right-0 overflow-hidden rounded-t-[24px] bg-white shadow-[0_-3px_16px_rgba(0,0,0,0.2)] sm:bottom-4 sm:left-4 sm:right-auto sm:w-[420px] sm:rounded-[22px]"
        onPointerDown={(event) => event.stopPropagation()}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex justify-center pt-2.5"><div className="h-1 w-10 rounded-full bg-[#dadce0]" /></div>
        <div className="flex items-center gap-2 px-5 pb-2 pt-2">
          <h2 className="min-w-0 flex-1 truncate text-[20px] font-medium">{mode === "vehicle" ? "Vehicle" : "Walking"}</h2>
          <button onClick={onClose} aria-label="Close route preview" className="google-round-button"><X className="h-[18px] w-[18px]" /></button>
        </div>

        <div className="grid grid-cols-2 border-b border-[#dadce0] px-2">
          <button onClick={() => onModeChange("walking")} className={`route-mode-tab ${mode === "walking" ? "active" : ""}`}><PersonStanding className="h-[18px] w-[18px]" /><span>Walk · {durationLabel(walkingDuration)}</span></button>
          <button onClick={() => onModeChange("vehicle")} className={`route-mode-tab ${mode === "vehicle" ? "active" : ""}`}><CarFront className="h-[18px] w-[18px]" /><span>Vehicle · {durationLabel(vehicleDuration)}</span></button>
        </div>

        <div className="px-5 pb-[max(18px,var(--sab))] pt-3">
          <div className="flex items-start gap-4">
            <p className="shrink-0 whitespace-nowrap text-[20px] font-medium leading-6 text-[#188038]">{durationLabel(duration)}</p>
            <div className="min-w-0 flex-1 text-xs leading-4 text-[#5f6368]">
              <p><span className="font-medium text-[#202124]">Estimated journey</span> · Based on distance</p>
              <p>{distanceLabel}</p>
              <p className="mt-1">Check the marked route before starting.</p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 scrollbar-hide">
            <button type="button" onClick={onStart} className="google-action-button relative z-10 bg-[#008c95] text-white hover:bg-[#007b83]"><Navigation className="h-4 w-4 fill-current" /> Start</button>
            <PlaceActions location={location} />
          </div>
        </div>
      </div>
    </div>
  );
}
