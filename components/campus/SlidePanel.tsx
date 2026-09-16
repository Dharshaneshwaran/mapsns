"use client";
import { useEffect, useRef, useState, type ReactNode, type CSSProperties } from "react";

export default function SlidePanel({ children, label, initiallyExpanded = false }: { children: ReactNode; label: string; initiallyExpanded?: boolean }) {
  const maximum = 82;
  const snaps = [18, 38, maximum];
  const [height, setHeight] = useState(initiallyExpanded ? 82 : 38);
  const panel = useRef<HTMLElement>(null);
  const frame = useRef<number | null>(null);
  const drag = useRef<{ y: number; height: number; available: number; visible: number; pointerId: number } | null>(null);
  const moved = useRef(false);

  const finish = (cancelled = false) => {
    const current = drag.current;
    if (!current) return;
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = null;
    const value = current.visible / current.available * 100;
    const snap = cancelled || !moved.current ? height : snaps.reduce((best, next) => Math.abs(next - value) < Math.abs(best - value) ? next : best);
    if (panel.current) {
      panel.current.style.removeProperty("height");
      panel.current.style.removeProperty("transform");
      panel.current.style.removeProperty("will-change");
      panel.current.style.setProperty("--sheet-height", `${snap}%`);
    }
    drag.current = null;
    setHeight(snap);
  };

  useEffect(() => () => { if (frame.current !== null) cancelAnimationFrame(frame.current); }, []);
  useEffect(() => {
    const resize = () => finish(true);
    window.addEventListener("resize", resize);
    window.visualViewport?.addEventListener("resize", resize);
    return () => { window.removeEventListener("resize", resize); window.visualViewport?.removeEventListener("resize", resize); };
  });

  return <aside ref={panel} aria-label={label} className="explore-panel" style={{ "--sheet-height": `${height}%` } as CSSProperties}>
    <button type="button" className="sheet-grip" aria-label={height > 60 ? "Collapse panel" : "Expand panel"} aria-expanded={height > 60}
      onPointerDown={(event) => {
        if (event.button !== 0 || !panel.current || drag.current) return;
        const available = panel.current.parentElement?.clientHeight || window.innerHeight;
        const visible = panel.current.getBoundingClientRect().height;
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
        current.visible = Math.max(Math.min(144, current.available * maximum / 100), Math.min(current.available * maximum / 100, current.height + delta));
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
      onClick={(event) => { if (event.detail === 0 || !moved.current) setHeight(height > 60 ? 38 : maximum); moved.current = false; }}><span /></button>
    <div className="explore-panel-scroll">{children}</div>
  </aside>;
}
