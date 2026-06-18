"use client";

import { useEffect } from "react";

import { useLocation } from "@/hooks/use-location";
import type { Coordinates } from "@/types/event";

type LocationTrackerProps = {
  onLocationChange?: (location: Coordinates | null) => void;
};

export function LocationTracker({ onLocationChange }: LocationTrackerProps) {
  const { coordinates, error, loading, requestLocation } = useLocation();

  useEffect(() => {
    onLocationChange?.(coordinates);
  }, [coordinates, onLocationChange]);

  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-xl shadow-cyan-950/10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-cyan-300">Live location</p>
          <p className="mt-1 text-sm text-slate-300">
            {coordinates
              ? `Tracking ${coordinates.latitude.toFixed(3)}, ${coordinates.longitude.toFixed(3)}`
              : "Allow location to auto-load nearby events"}
          </p>
        </div>
        <button
          type="button"
          onClick={requestLocation}
          disabled={loading}
          className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Locating..." : "Use my location"}
        </button>
      </div>
      {error ? (
        <p className="mt-4 text-sm text-rose-300">{error}</p>
      ) : null}
    </section>
  );
}

