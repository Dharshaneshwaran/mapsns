"use client";
import { useEffect, useRef, useState, type ReactNode, type CSSProperties } from "react";

export default function SlidePanel({ children, label, initiallyExpanded = false }: { children: ReactNode; label: string; initiallyExpanded?: boolean }) {
  const maximum = 82;
  const snaps = [18, 38, maximum];
  const [height, setHeight] = useState(initiallyExpanded ? 82 : 38);
  const panel = useRef<HTMLElement>(null);
  const frame = useRef<number | null>(null);
  const animation = useRef<Animation | null>(null);
  const drag = useRef<{ y: number; height: number; available: number; visible: number; pointerId: number } | null>(null);
  const moved = useRef(false);

  const visibleHeight = () => {
    const element = panel.current;
    if (!element) return 0;
    const transform = getComputedStyle(element).transform;
    const offset = transform === "none" ? 0 : new DOMMatrixReadOnly(transform).m42;
    return element.getBoundingClientRect().height - offset;
  };

  const settle = (snap: number, from: number, available: number, animate = true) => {
    const element = panel.current;
    if (!element) return;
    animation.current?.cancel();
    animation.current = null;
    const fullHeight = available * maximum / 100;
    const target = Math.max(Math.min(144, fullHeight), available * snap / 100);
    const reset = () => {
      element.style.removeProperty("height");
      element.style.removeProperty("transform");
      element.style.removeProperty("will-change");
      element.style.setProperty("--sheet-height", `${snap}%`);
    };
    setHeight(snap);
    if (!animate || window.matchMedia("(prefers-reduced-motion: reduce)").matches || Math.abs(from - target) < 1) {
      reset();
      return;
    }
    element.style.height = `${fullHeight}px`;
    element.style.willChange = "transform";
    element.style.transform = `translate3d(0, ${fullHeight - target}px, 0)`;
    const motion = element.animate([
      { transform: `translate3d(0, ${fullHeight - from}px, 0)` },
      { transform: `translate3d(0, ${fullHeight - target}px, 0)` },
    ], { duration: 300, easing: "cubic-bezier(0.22, 1, 0.36, 1)" });
    animation.current = motion;
    motion.onfinish = () => {
      if (animation.current !== motion) return;
      reset();
      animation.current = null;
    };
  };

  const finish = (cancelled = false) => {
    const current = drag.current;
    if (!current) return;
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = null;
    const value = current.visible / current.available * 100;
    const snap = cancelled || !moved.current ? height : snaps.reduce((best, next) => Math.abs(next - value) < Math.abs(best - value) ? next : best);
    drag.current = null;
    settle(snap, current.visible, current.available, !cancelled);
  };

  useEffect(() => () => { if (frame.current !== null) cancelAnimationFrame(frame.current); animation.current?.cancel(); }, []);
  useEffect(() => {
    const resize = () => {
      finish(true);
      if (animation.current && panel.current) {
        animation.current.cancel();
        animation.current = null;
        panel.current.style.removeProperty("height");
        panel.current.style.removeProperty("transform");
        panel.current.style.removeProperty("will-change");
      }
    };
    window.addEventListener("resize", resize);
    window.visualViewport?.addEventListener("resize", resize);
    return () => { window.removeEventListener("resize", resize); window.visualViewport?.removeEventListener("resize", resize); };
  });

  return <aside ref={panel} aria-label={label} className="explore-panel" style={{ "--sheet-height": `${height}%` } as CSSProperties}>
    <button type="button" className="sheet-grip" aria-label={height > 60 ? "Collapse panel" : "Expand panel"} aria-expanded={height > 60}
      onPointerDown={(event) => {
        if (event.button !== 0 || !panel.current || drag.current) return;
        const available = panel.current.parentElement?.clientHeight || window.innerHeight;
        const visible = visibleHeight();
        if (animation.current) {
          animation.current.cancel();
          animation.current = null;
          panel.current.style.transform = `translate3d(0, ${available * maximum / 100 - visible}px, 0)`;
        }
        drag.current = { y: event.clientY, height: visible, available, visible, pointerId: event.pointerId };
        moved.current = false;
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerMove={(event) => {
        const current = drag.current;
        if (!current || current.pointerId !== event.pointerId) return;
        const delta = current.y - event.clientY;
        if (!moved.current && Math.abs(delta) <= 5) return;
        moved.current = true;
        current.visible = Math.max(Math.max(Math.min(144, current.available * maximum / 100), current.available * snaps[0] / 100), Math.min(current.available * maximum / 100, current.height + delta));
        if (frame.current !== null) return;
        frame.current = requestAnimationFrame(() => {
          frame.current = null;
          if (!panel.current || !drag.current) return;
          // Keep layout fixed during the gesture; only move the composited panel.
          panel.current.style.height = `${current.available * maximum / 100}px`;
          panel.current.style.willChange = "transform";
          panel.current.style.transform = `translate3d(0, ${current.available * maximum / 100 - current.visible}px, 0)`;
        });
      }}
      onPointerUp={() => finish()}
      onPointerCancel={() => finish(true)}
      onLostPointerCapture={() => finish(true)}
      onClick={(event) => {
        if (event.detail === 0 || !moved.current) {
          const available = panel.current?.parentElement?.clientHeight || window.innerHeight;
          settle(height > 60 ? 38 : maximum, visibleHeight(), available);
        }
        moved.current = false;
      }}><span /></button>
    <div className="explore-panel-scroll">{children}</div>
  </aside>;
}
