"use client";
import { useRef, useState, type ReactNode, type CSSProperties } from "react";
export default function SlidePanel({ children, label }: { children: ReactNode; label: string }) {
  const [height, setHeight] = useState(38);
  const drag = useRef<{ y: number; height: number } | null>(null);
  const moved = useRef(false);
  return <aside aria-label={label} className="explore-panel" style={{ "--sheet-height": `${height}dvh` } as CSSProperties}>
    <button className="sheet-grip" aria-label={height > 60 ? "Collapse panel" : "Expand panel"} aria-expanded={height > 60}
      onPointerDown={(event) => { drag.current = { y: event.clientY, height }; moved.current = false; event.currentTarget.setPointerCapture(event.pointerId); }}
      onPointerMove={(event) => { if (drag.current) { const delta = drag.current.y - event.clientY; if (Math.abs(delta) > 5) moved.current = true; setHeight(Math.max(18, Math.min(82, drag.current.height + delta / window.innerHeight * 100))); } }}
      onPointerUp={() => { if (drag.current && moved.current) setHeight((value) => [18, 38, 82].reduce((best, snap) => Math.abs(snap - value) < Math.abs(best - value) ? snap : best)); drag.current = null; }}
      onPointerCancel={() => { drag.current = null; }}
      onClick={() => { if (!moved.current) setHeight(height > 60 ? 38 : 82); moved.current = false; }}><span /></button>
    <div className="explore-panel-scroll">{children}</div>
  </aside>;
}
