"use client";

import { useCallback, useRef, useState } from "react";
import { useMapStore } from "@/stores/map-store";
import styles from "./hud.module.css";

/**
 * Virtual joystick for touch + mouse drag. Writes normalised input to the
 * map store; the overlay's animation frame consumes it.
 */
export function Joystick() {
  const baseRef = useRef<HTMLDivElement>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const activeRef = useRef(false);
  const inputRun = useMapStore((s) => s.inputRun);

  const radius = 44;

  const update = useCallback((clientX: number, clientY: number) => {
    const base = baseRef.current;
    if (!base) return;
    const rect = base.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    let dx = clientX - cx;
    let dy = clientY - cy;
    const dist = Math.hypot(dx, dy);
    if (dist > radius) {
      dx = (dx / dist) * radius;
      dy = (dy / dist) * radius;
    }
    setKnob({ x: dx, y: dy });
    useMapStore.getState().setInput(dx / radius, dy / radius, useMapStore.getState().inputRun);
  }, []);

  const reset = useCallback(() => {
    setKnob({ x: 0, y: 0 });
    useMapStore.getState().setInput(0, 0, useMapStore.getState().inputRun);
    activeRef.current = false;
  }, []);

  const toggleRun = () => {
    const s = useMapStore.getState();
    s.setInput(s.inputX, s.inputY, !s.inputRun);
  };

  return (
    <div className="relative select-none touch-none">
      <div
        ref={baseRef}
        className={`relative w-32 h-32 rounded-full ${styles.glass} ${styles.neonRing} flex items-center justify-center`}
        onPointerDown={(e) => {
          (e.target as HTMLElement).setPointerCapture(e.pointerId);
          activeRef.current = true;
          update(e.clientX, e.clientY);
        }}
        onPointerMove={(e) => {
          if (!activeRef.current) return;
          update(e.clientX, e.clientY);
        }}
        onPointerUp={reset}
        onPointerCancel={reset}
        onPointerLeave={() => {
          if (activeRef.current) reset();
        }}
      >
        <div className="absolute inset-3 rounded-full border border-white/15" />
        <div className="absolute text-[10px] text-cyan-300 font-bold top-2">▲</div>
        <div className="absolute text-[10px] text-white/45 font-bold bottom-2">▼</div>
        <div className="absolute text-[10px] text-white/45 font-bold left-2">◀</div>
        <div className="absolute text-[10px] text-white/45 font-bold right-2">▶</div>

        <div
          className="absolute w-14 h-14 rounded-full bg-gradient-to-br from-cyan-300 to-emerald-300 shadow-[0_0_22px_rgba(34,211,238,0.7)] flex items-center justify-center text-slate-900 font-bold text-sm"
          style={{
            transform: `translate(${knob.x}px, ${knob.y}px)`,
            transition: activeRef.current ? "none" : "transform 0.18s ease-out",
          }}
        >
          GO
        </div>
      </div>

      <button
        onClick={toggleRun}
        className={`mt-3 w-full px-3 py-2 rounded-xl text-xs font-bold text-white ${styles.glass} ${inputRun ? styles.neonGreen : ""}`}
      >
        {inputRun ? "🏃 RUN" : "🚶 WALK"}
      </button>
    </div>
  );
}
