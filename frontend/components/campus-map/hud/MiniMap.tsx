"use client";

import { useEffect, useRef } from "react";
import {
  MAP_BUILDINGS,
  MAP_BUILDINGS_BY_ID,
  MAP_HEIGHT,
  MAP_WIDTH,
} from "@/lib/campus/map2d";
import { useMapStore } from "@/stores/map-store";
import styles from "./hud.module.css";

/**
 * Compact circular minimap mirroring the printed map.
 */
export function MiniMap() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const px = useMapStore((s) => s.px);
  const py = useMapStore((s) => s.py);
  const facing = useMapStore((s) => s.facing);
  const nav = useMapStore((s) => s.navigationTargetId);
  const nearby = useMapStore((s) => s.nearbyBuilding);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;
    const sx = w / MAP_WIDTH;
    const sy = h / MAP_HEIGHT;

    ctx.clearRect(0, 0, w, h);

    // Background — same paper colour
    const grad = ctx.createRadialGradient(w / 2, h / 2, 20, w / 2, h / 2, w / 2);
    grad.addColorStop(0, "#f3b66a");
    grad.addColorStop(1, "#c97f30");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Buildings
    for (const b of MAP_BUILDINGS) {
      ctx.fillStyle = b.color;
      ctx.fillRect(b.x * sx, b.y * sy, Math.max(1, b.w * sx), Math.max(1, b.h * sy));
      if (b.id === nav) {
        ctx.strokeStyle = "#22d3ee";
        ctx.lineWidth = 1.6;
        ctx.strokeRect(b.x * sx - 0.5, b.y * sy - 0.5, b.w * sx + 1, b.h * sy + 1);
      } else if (b.id === nearby) {
        ctx.strokeStyle = "#facc15";
        ctx.lineWidth = 1.2;
        ctx.strokeRect(b.x * sx - 0.5, b.y * sy - 0.5, b.w * sx + 1, b.h * sy + 1);
      }
    }

    // Nav line
    if (nav && MAP_BUILDINGS_BY_ID[nav]) {
      const t = MAP_BUILDINGS_BY_ID[nav];
      ctx.strokeStyle = "rgba(34,211,238,0.85)";
      ctx.lineWidth = 1.4;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(px * sx, py * sy);
      ctx.lineTo((t.x + t.w / 2) * sx, (t.y + t.h / 2) * sy);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Player halo + arrow
    const x = px * sx;
    const y = py * sy;
    const halo = ctx.createRadialGradient(x, y, 1, x, y, 12);
    halo.addColorStop(0, "rgba(34,211,238,0.7)");
    halo.addColorStop(1, "rgba(34,211,238,0)");
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(x, y, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(facing + Math.PI / 2);
    ctx.fillStyle = "#22d3ee";
    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.lineTo(4, 4);
    ctx.lineTo(-4, 4);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }, [px, py, facing, nav, nearby]);

  return (
    <div
      className={`relative w-44 h-44 rounded-full overflow-hidden ${styles.glass} ${styles.neonRing}`}
    >
      <canvas ref={canvasRef} width={320} height={258} className="w-full h-full" />
      <div className="absolute top-1 left-1/2 -translate-x-1/2 text-[10px] font-bold text-cyan-300 tracking-widest">N</div>
      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[10px] font-bold text-white/40">S</div>
      <div className="absolute left-1 top-1/2 -translate-y-1/2 text-[10px] font-bold text-white/40">W</div>
      <div className="absolute right-1 top-1/2 -translate-y-1/2 text-[10px] font-bold text-white/40">E</div>
    </div>
  );
}
