"use client";

import { useState } from "react";
import { ArrowUp, CarFront, Footprints, ListTree, Navigation, Search, Volume2, VolumeX } from "lucide-react";
import type { TravelMode } from "@/types/campus";

type Props = {
  destination: string;
  distance: number;
  duration: number;
  mode: TravelMode;
  onExit: () => void;
};

export default function NavigationOverlay({ destination, distance, duration, mode, onExit }: Props) {
  const [muted, setMuted] = useState(false);
  const minutes = Math.max(1, Math.ceil(duration / 60));
  const distanceLabel = distance < 1000 ? `${Math.round(distance)} m` : `${(distance / 1000).toFixed(1)} km`;

  return (
    <div className="pointer-events-none absolute inset-0 z-40 text-[#202124]">
      <div className="navigation-instruction pointer-events-auto absolute left-1.5 right-1.5 top-1.5 overflow-hidden rounded-[18px] bg-[#007b7e] text-white shadow-lg safe-top sm:left-4 sm:right-auto sm:top-4 sm:w-[420px]">
        <div className="flex min-h-[80px] items-center gap-4 px-5 py-3">
          <ArrowUp className="h-9 w-9 shrink-0" strokeWidth={2.6} />
          <div className="min-w-0 flex-1">
            <p className="text-sm text-white/85">towards</p>
            <p className="truncate text-[18px] font-medium">{destination}</p>
          </div>
          <div className="rounded-lg bg-[#fdd663] px-2 py-1 text-sm font-bold text-[#5f4b00]">SNS</div>
        </div>
        <div className="w-fit rounded-tr-2xl bg-[#00676b] px-4 py-2 text-sm font-medium">Then ↱</div>
      </div>

      <div className="pointer-events-auto absolute right-3 top-[42%] flex -translate-y-1/2 flex-col gap-2.5">
        <button aria-label="Compass" className="navigation-round-control"><Navigation className="h-6 w-6 fill-[#d93025] text-[#202124]" /></button>
        <button aria-label="Search along route" className="navigation-round-control"><Search className="h-6 w-6" /></button>
        <button onClick={() => setMuted((value) => !value)} aria-label={muted ? "Unmute navigation" : "Mute navigation"} className="navigation-round-control">
          {muted ? <VolumeX className="h-6 w-6" /> : <Volume2 className="h-6 w-6" />}
        </button>
        <button aria-label="Route overview" className="navigation-round-control"><ListTree className="h-6 w-6" /></button>
      </div>

      <div className="navigation-status pointer-events-auto absolute bottom-0 left-0 right-0 flex min-h-[112px] items-center gap-3 bg-[#101112] px-3 pb-[max(14px,var(--sab))] pt-3 text-white sm:left-4 sm:right-auto sm:bottom-4 sm:w-[420px] sm:rounded-[22px] sm:pb-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-[23px] font-medium text-[#57d68d]">
            <span>{minutes} min</span>
            {mode === "walking" ? <Footprints className="h-5 w-5" /> : <CarFront className="h-5 w-5" />}
          </div>
          <p className="mt-1 truncate text-sm text-[#bdc1c6]">{distanceLabel} · {destination}</p>
        </div>
        <div className="flex h-13 w-13 items-center justify-center rounded-full bg-[#303134] text-[#8ab4f8]">
          <Navigation className="h-6 w-6 fill-current" />
        </div>
        <button onClick={onExit} className="flex h-13 w-13 items-center justify-center rounded-full bg-[#ea4335] text-sm font-medium text-white hover:bg-[#d93025]">Exit</button>
      </div>
    </div>
  );
}
