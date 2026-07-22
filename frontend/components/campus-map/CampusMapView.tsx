"use client";

import { useEffect, useRef, useState } from "react";
import { MAP_HEIGHT, MAP_WIDTH } from "@/lib/campus/map2d";
import { PrintedMap } from "./PrintedMap";
import { InteractiveOverlay } from "./InteractiveOverlay";

type Transform = { scale: number; tx: number; ty: number };

/**
 * Wraps the printed map with a CSS transform so we can do the cinematic
 * intro zoom (satellite → ground at Front Gate) and then keep the full map
 * visible once the scene has settled.
 */
export function CampusMapView() {
  const containerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 });
  const [intro, setIntro] = useState({ done: false, progress: 0 });

  // Measure the container so we can compute the transform.
  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    const measure = () => {
      const r = el.getBoundingClientRect();
      setContainerSize({ w: r.width, h: r.height });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Cinematic intro: fade from the initial fit into the final still map.
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const duration = 3200;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      setIntro({ done: p >= 1, progress: p });
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const transformRef = useRef<Transform>({ scale: 1, tx: 0, ty: 0 });
  useEffect(() => {
    if (!containerSize.w || !containerSize.h) return;
    let raf = 0;

    const computeFit = (): Transform => {
      const scale = Math.min(containerSize.w / MAP_WIDTH, containerSize.h / MAP_HEIGHT);
      return {
        scale,
        tx: (containerSize.w - MAP_WIDTH * scale) / 2,
        ty: (containerSize.h - MAP_HEIGHT * scale) / 2,
      };
    };

    const apply = () => {
      const goal = computeFit();
      const cur = transformRef.current;
      const progress = intro.done ? 1 : easeInOutCubic(intro.progress);
      transformRef.current = {
        scale: cur.scale + (goal.scale - cur.scale) * progress,
        tx: cur.tx + (goal.tx - cur.tx) * progress,
        ty: cur.ty + (goal.ty - cur.ty) * progress,
      };

      if (innerRef.current) {
        const t = transformRef.current;
        innerRef.current.style.transform = `translate(${t.tx}px, ${t.ty}px) scale(${t.scale})`;
      }

      raf = requestAnimationFrame(apply);
    };

    raf = requestAnimationFrame(apply);
    return () => cancelAnimationFrame(raf);
  }, [containerSize, intro.done, intro.progress]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden"
      style={{
        background:
          "radial-gradient(circle at 50% 30%, #1a0d3a 0%, #050617 65%)",
      }}
    >
      {/* Vignette */}
      <div className="pointer-events-none absolute inset-0 z-10" style={{
        background: "radial-gradient(circle at center, transparent 55%, rgba(0,0,0,0.55) 100%)",
      }} />

      <div
        ref={innerRef}
        style={{
          width: MAP_WIDTH,
          height: MAP_HEIGHT,
          transformOrigin: "0 0",
          willChange: "transform",
          position: "absolute",
          left: 0,
          top: 0,
        }}
      >
        <div className="absolute inset-0">
          <PrintedMap />
        </div>
        <div className="absolute inset-0">
          <InteractiveOverlay />
        </div>
      </div>
    </div>
  );
}

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
