"use client";

import { WalkingRoute } from "@/types/campus";

type Props = {
  route: WalkingRoute | null;
  isWalking: boolean;
};

export default function WalkingRouteIndicator({ route, isWalking }: Props) {
  if (!route) return null;

  return (
    <div className="absolute top-20 sm:top-24 left-1/2 -translate-x-1/2 z-30 safe-top">
      <div className="route-badge rounded-2xl shadow-lg shadow-black/10 px-3 sm:px-4 py-2 sm:py-2.5 flex items-center gap-2 sm:gap-3">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isWalking ? "bg-emerald-500 animate-pulse" : "bg-zinc-400"}`} />
          <span className="route-status text-xs font-semibold">
            {isWalking ? "Navigating" : "Route ready"}
          </span>
        </div>
        <div className="route-divider w-px h-4" />
        <span className="route-name text-xs max-w-48 truncate">{route.name}</span>
        {route.isPrototype && (
          <>
            <div className="route-divider w-px h-4" />
            <span className="text-[10px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
              Demo
            </span>
          </>
        )}
      </div>
    </div>
  );
}
