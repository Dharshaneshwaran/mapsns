"use client";

import { useEffect, useRef } from "react";
import { useMapStore } from "@/stores/map-store";

// ── CONSTANTS ──────────────────────────────────────────────────────────
const MIN_MOVE_M = 2;        // ignore jitter smaller than 2 m
const MOVE_TIMEOUT_MS = 2000; // stop if no movement for 2 s
const GPS_SMOOTHING = 0.4;   // EMA factor for GPS position
const MAX_INPUT = 0.6;        // normalised input at typical walking speed
const GEOLOCATION_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  maximumAge: 5000,
  timeout: 10000,
};

// ── HELPERS ────────────────────────────────────────────────────────────
function toRad(deg: number) { return (deg * Math.PI) / 180; }

/** Approximate Haversine distance in metres between two lat/lng points. */
function distanceM(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
): number {
  const R = 6_371_000;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** GPS heading (0 = north, clockwise) from two positions. */
function heading(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
): number {
  return (Math.atan2(
    toRad(lng2 - lng1) * Math.cos(toRad(lat2)),
    toRad(lat2 - lat1),
  ) * 180) / Math.PI;
}

// ── COMPONENT ──────────────────────────────────────────────────────────
export function GpsWalker() {
  const gpsMode = useMapStore((s) => s.gpsMode);
  const setInput = useMapStore((s) => s.setInput);

  // Refs to avoid re-renders on every GPS tick
  const smoothLat = useRef(0);
  const smoothLng = useRef(0);
  const lastMoveTime = useRef(0);
  const lastGpsTime = useRef(0);
  const watchId = useRef<number | null>(null);
  const hasFix = useRef(false);

  useEffect(() => {
    if (!gpsMode) {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current);
        watchId.current = null;
      }
      hasFix.current = false;
      return;
    }

    if (!("geolocation" in navigator)) {
      console.warn("Geolocation not available");
      return;
    }

    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude: rawLat, longitude: rawLng, accuracy } = pos.coords;

        // Ignore very inaccurate readings
        if (accuracy > 40) return;

        // Initialise or smooth
        if (!hasFix.current) {
          smoothLat.current = rawLat;
          smoothLng.current = rawLng;
          lastGpsTime.current = performance.now();
          hasFix.current = true;
          return;
        }

        const prevLat = smoothLat.current;
        const prevLng = smoothLng.current;

        // Exponential moving average
        smoothLat.current += (rawLat - smoothLat.current) * GPS_SMOOTHING;
        smoothLng.current += (rawLng - smoothLng.current) * GPS_SMOOTHING;

        const d = distanceM(prevLat, prevLng, smoothLat.current, smoothLng.current);
        const now = performance.now();
        const dt = Math.max(0.1, (now - lastGpsTime.current) / 1000);
        lastGpsTime.current = now;

        if (d < MIN_MOVE_M) {
          // Not enough movement – stop if idle too long
          if (now - lastMoveTime.current > MOVE_TIMEOUT_MS) {
            setInput(0, 0);
          }
          return;
        }

        lastMoveTime.current = now;

        // Compute heading and speed
        const h = heading(prevLat, prevLng, smoothLat.current, smoothLng.current);
        const speedMs = d / dt;

        // Normalise input: ~1.5 m/s = MAX_INPUT
        const mag = Math.min(1, (speedMs / 1.5) * MAX_INPUT);

        // GPS heading 0 = north → inputY = -1 (SVG y increases down)
        const hRad = toRad(h);
        const ix = Math.sin(hRad) * mag;
        const iy = -Math.cos(hRad) * mag;

        setInput(ix, iy);
      },
      (err) => console.warn("GPS error:", err.message),
      GEOLOCATION_OPTIONS,
    );

    return () => {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current);
      }
    };
  }, [gpsMode, setInput]);

  return null;
}
