"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AvatarSprite } from "./AvatarSprite";
import { MapNPCs } from "./NPCs";
import { MapEventMarkers } from "./EventMarkers";
import { MapNavigationPath } from "./NavigationPath";
import {
  MAP_BUILDINGS,
  MAP_BUILDINGS_BY_ID,
  MAP_HEIGHT,
  MAP_WIDTH,
  Map2DBuilding,
  buildingAt,
  nearestLandmark,
} from "@/lib/campus/map2d";
import { useMapStore } from "@/stores/map-store";

/**
 * Transparent overlay drawn on top of the printed map. Handles avatar
 * movement, building clicks, NPCs, event markers and navigation arrows.
 *
 * Renders inside the parent's CSS scaling, so we keep the SVG viewBox in
 * sync with the printed map (1024 × 820 units).
 */
export function InteractiveOverlay() {
  const svgRef = useRef<SVGSVGElement>(null);
  const px = useMapStore((s) => s.px);
  const py = useMapStore((s) => s.py);
  const facing = useMapStore((s) => s.facing);
  const isRunning = useMapStore((s) => s.isRunning);
  const speed = useMapStore((s) => s.speed);
  const selected = useMapStore((s) => s.selectedBuilding);
  const nearby = useMapStore((s) => s.nearbyBuilding);
  const navTargetId = useMapStore((s) => s.navigationTargetId);

  const setSelected = useMapStore((s) => s.setSelectedBuilding);
  const setNearby = useMapStore((s) => s.setNearbyBuilding);
  const setNav = useMapStore((s) => s.setNavigationTarget);
  const setAvatar = useMapStore((s) => s.setAvatar);

  // ── Movement loop ──────────────────────────────────────────────
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    let curFacing = useMapStore.getState().facing;
    let vx = 0;
    let vy = 0;
    const ax = 0.18; // acceleration smoothing

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const { inputX, inputY, inputRun, px: cx, py: cy } = useMapStore.getState();
      const maxSpeed = inputRun ? 230 : 130; // SVG units / second
      const targetVX = inputX * maxSpeed;
      const targetVY = inputY * maxSpeed;
      vx += (targetVX - vx) * ax;
      vy += (targetVY - vy) * ax;

      let nx = cx + vx * dt;
      let ny = cy + vy * dt;
      // Clamp to map bounds
      nx = Math.max(8, Math.min(MAP_WIDTH - 8, nx));
      ny = Math.max(8, Math.min(MAP_HEIGHT - 8, ny));

      // Building collision: if the new position lands inside a non-walkable
      // building, push back out along the shortest axis.
      const r = 5;
      for (const b of MAP_BUILDINGS) {
        if (b.walkable) continue;
        const inside =
          nx > b.x - r && nx < b.x + b.w + r && ny > b.y - r && ny < b.y + b.h + r;
        if (!inside) continue;
        const overlapL = nx - (b.x - r);
        const overlapR = (b.x + b.w + r) - nx;
        const overlapT = ny - (b.y - r);
        const overlapB = (b.y + b.h + r) - ny;
        const min = Math.min(overlapL, overlapR, overlapT, overlapB);
        if (min === overlapL) nx = b.x - r;
        else if (min === overlapR) nx = b.x + b.w + r;
        else if (min === overlapT) ny = b.y - r;
        else ny = b.y + b.h + r;
        vx = 0;
        vy = 0;
      }

      const sp = Math.hypot(vx, vy);
      const moving = sp > 4;
      if (moving) {
        const desired = Math.atan2(vy, vx);
        let diff = desired - curFacing;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        curFacing += diff * 0.2;
      }

      const normSpeed = Math.min(1, sp / maxSpeed);
      setAvatar(nx, ny, curFacing, moving, inputRun && moving, normSpeed);

      // Detect nearby landmark
      const lm = nearestLandmark(nx, ny, 80);
      setNearby(lm?.id ?? null);

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [setAvatar, setNearby]);

  // ── Keyboard input ────────────────────────────────────────────
  useEffect(() => {
    const keys = new Set<string>();
    const flush = () => {
      let x = 0;
      let y = 0;
      if (keys.has("w") || keys.has("arrowup")) y -= 1;
      if (keys.has("s") || keys.has("arrowdown")) y += 1;
      if (keys.has("a") || keys.has("arrowleft")) x -= 1;
      if (keys.has("d") || keys.has("arrowright")) x += 1;
      // Normalise diagonal
      const m = Math.hypot(x, y);
      if (m > 1) {
        x /= m;
        y /= m;
      }
      const run = keys.has("shift");
      // Only update keyboard input when joystick is idle
      const { inputX: ix, inputY: iy } = useMapStore.getState();
      const joystickActive = (ix !== 0 || iy !== 0) && x === 0 && y === 0;
      if (!joystickActive) {
        useMapStore.getState().setInput(x, y, run);
      }
    };
    const onDown = (e: KeyboardEvent) => {
      if (["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright", "shift"].includes(e.key.toLowerCase())) {
        e.preventDefault();
      }
      keys.add(e.key.toLowerCase());
      flush();
    };
    const onUp = (e: KeyboardEvent) => {
      keys.delete(e.key.toLowerCase());
      flush();
    };
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
    };
  }, []);

  // ── Click anywhere on the map ─────────────────────────────────
  const handleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg) return;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return;
    const loc = pt.matrixTransform(ctm.inverse());
    const b = buildingAt(loc.x, loc.y);
    if (b) setSelected(b.id);
    else setSelected(null);
  };

  // Highlight rectangle data
  const highlighted = useMemo(() => {
    const ids = new Set<string>();
    if (nearby) ids.add(nearby);
    if (selected) ids.add(selected);
    if (navTargetId) ids.add(navTargetId);
    return Array.from(ids)
      .map((id) => MAP_BUILDINGS_BY_ID[id])
      .filter(Boolean);
  }, [nearby, selected, navTargetId]);

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
      preserveAspectRatio="xMidYMid meet"
      className="absolute inset-0 w-full h-full"
      style={{ touchAction: "none" }}
      onClick={handleClick}
    >
      {/* Highlighted building outlines */}
      {highlighted.map((b) => (
        <BuildingHighlight
          key={b.id}
          b={b}
          color={
            b.id === navTargetId
              ? "#22d3ee"
              : b.id === selected
                ? "#fbbf24"
                : "#22c55e"
          }
        />
      ))}

      {/* Animated event markers */}
      <MapEventMarkers />

      {/* Navigation arrows */}
      <MapNavigationPath />

      {/* NPC students */}
      <MapNPCs />

      {/* Player avatar */}
      <AvatarSprite
        x={px}
        y={py}
        facing={facing}
        speed={speed}
        isRunning={isRunning}
        scale={1.4}
        glow
      />
    </svg>
  );
}

function BuildingHighlight({
  b,
  color,
}: {
  b: Map2DBuilding;
  color: string;
}) {
  return (
    <rect
      x={b.x - 1}
      y={b.y - 1}
      width={b.w + 2}
      height={b.h + 2}
      rx={2}
      fill="none"
      stroke={color}
      strokeWidth={2.2}
      style={{ filter: `drop-shadow(0 0 8px ${color})`, pointerEvents: "none" }}
    >
      <animate
        attributeName="stroke-opacity"
        values="0.65;1;0.65"
        dur="1.2s"
        repeatCount="indefinite"
      />
    </rect>
  );
}
