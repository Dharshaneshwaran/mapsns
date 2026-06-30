"use client";

import { useEffect, useRef } from "react";
import { useMapStore } from "@/stores/map-store";
import { DEMO_SPOTS, DEMO_SPOTS_BY_ID, useDemoStore } from "@/stores/demo-store";

/**
 * Mounted inside the /campus printed-map page. Bridges the demo store to
 * the campus map:
 * - When the user picks a "stand at" spot, teleport the avatar there.
 * - When auto-tour is on, drive the avatar through every spot by writing
 *   normalised input into the map store every frame (so the existing
 *   movement system handles collision and animation for us).
 */
export function DemoBridge() {
  const enabled = useDemoStore((s) => s.enabled);
  const spotId = useDemoStore((s) => s.spotId);
  const autoTour = useDemoStore((s) => s.autoTour);
  const setAutoTour = useDemoStore((s) => s.setAutoTour);

  // ── Teleport to selected spot ────────────────────────────────────
  // Only fires when the spot id changes (so manual walking isn't disrupted).
  const lastTeleportRef = useRef<string | null>(null);
  useEffect(() => {
    if (!enabled) return;
    if (lastTeleportRef.current === spotId) return;
    const spot = DEMO_SPOTS_BY_ID[spotId];
    if (!spot) return;
    lastTeleportRef.current = spotId;
    // Place the avatar a little south of the building so it's visible.
    const [tx, ty] = spot.mapPosition;
    useMapStore.getState().setAvatar(tx, ty + 16, -Math.PI / 2, false, false, 0);
    useMapStore.getState().setInput(0, 0, false);
    if (spot.buildingId) useMapStore.getState().setNearbyBuilding(spot.buildingId);
  }, [enabled, spotId]);

  // ── Auto-walk tour ───────────────────────────────────────────────
  useEffect(() => {
    if (!autoTour) return;

    let stage = 0;
    let raf = 0;
    const tour = DEMO_SPOTS.map((s) => s.mapPosition);

    const drive = () => {
      if (!useDemoStore.getState().autoTour) return;
      const target = tour[stage];
      if (!target) {
        setAutoTour(false);
        return;
      }
      const { px, py } = useMapStore.getState();
      const dx = target[0] - px;
      const dy = target[1] + 16 - py;
      const dist = Math.hypot(dx, dy);
      if (dist < 12) {
        // Reached: pause briefly then move to the next.
        useMapStore.getState().setInput(0, 0, false);
        const id = DEMO_SPOTS[stage]?.buildingId ?? null;
        useMapStore.getState().setNearbyBuilding(id);
        stage = (stage + 1) % tour.length;
        setTimeout(drive, 1200);
        return;
      }
      // Normalised input toward the next waypoint, running for speed.
      const ix = dx / dist;
      const iy = dy / dist;
      useMapStore.getState().setInput(ix, iy, true);
      raf = requestAnimationFrame(drive);
    };
    raf = requestAnimationFrame(drive);

    return () => {
      cancelAnimationFrame(raf);
      // Release input on stop.
      useMapStore.getState().setInput(0, 0, false);
    };
  }, [autoTour, setAutoTour]);

  return null;
}
