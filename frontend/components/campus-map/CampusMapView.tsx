"use client";

import { useEffect, useRef, useState } from "react";
import { MAP_HEIGHT, MAP_WIDTH } from "@/lib/campus/map2d";
import { useMapStore } from "@/stores/map-store";
import { PrintedMap } from "./PrintedMap";
import { InteractiveOverlay } from "./InteractiveOverlay";

type Transform = { scale: number; tx: number; ty: number };

/**
 * Wraps the printed map with a CSS transform so we can do the cinematic
 * intro zoom (satellite → ground at Front Gate) and then track the player.
 */
export function CampusMapView() {
  const containerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const px = useMapStore((s) => s.px);
  const py = useMapStore((s) => s.py);

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

  // Cinematic intro: start zoomed out so the whole map fits, then animate to
  // a closer "game camera" zoom centred on the avatar.
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

  // Compute current transform. During intro we lerp from "fit-to-screen" to
  // a player-centred zoom; afterwards we keep following the player smoothly.
  const transformRef = useRef<Transform>({ scale: 1, tx: 0, ty: 0 });
  useEffect(() => {
    if (!containerSize.w || !containerSize.h) return;
    let raf = 0;
    const followLerp = 0.12;

    const computeFit = (): Transform => {
      const s = Math.min(containerSize.w / MAP_WIDTH, containerSize.h / MAP_HEIGHT);
      return {
        scale: s,
        tx: (containerSize.w - MAP_WIDTH * s) / 2,
        ty: (containerSize.h - MAP_HEIGHT * s) / 2,
      };
    };
    const computeFollow = (zoom: number): Transform => {
      const tx = containerSize.w / 2 - px * zoom;
      const ty = containerSize.h / 2 - py * zoom;
      return { scale: zoom, tx, ty };
    };

    const apply = () => {
      const fit = computeFit();
      const followZoom = Math.max(1.6, fit.scale * 2.2);
      const goal = intro.done ? computeFollow(followZoom) : (() => {
        // Ease from fit to follow during the intro.
        const e = easeInOutCubic(intro.progress);
        const target = computeFollow(followZoom);
        return {
          scale: fit.scale + (target.scale - fit.scale) * e,
          tx: fit.tx + (target.tx - fit.tx) * e,
          ty: fit.ty + (target.ty - fit.ty) * e,
        };
      })();

      const cur = transformRef.current;
      transformRef.current = {
        scale: cur.scale + (goal.scale - cur.scale) * (intro.done ? followLerp : 1),
        tx: cur.tx + (goal.tx - cur.tx) * (intro.done ? followLerp : 1),
        ty: cur.ty + (goal.ty - cur.ty) * (intro.done ? followLerp : 1),
      };

      if (innerRef.current) {
        const t = transformRef.current;
        innerRef.current.style.transform = `translate(${t.tx}px, ${t.ty}px) scale(${t.scale})`;
      }
      raf = requestAnimationFrame(apply);
    };
    raf = requestAnimationFrame(apply);
    return () => cancelAnimationFrame(raf);
  }, [containerSize, intro.done, intro.progress, px, py]);

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
