"use client";

import { ArrowLeft, ArrowUpRight, CarFront, Footprints, MapPin, Navigation, Route, X } from "lucide-react";
import type { TravelMode } from "@/types/campus";
import { useRef, useState } from "react";

type Props = {
  destination: string;
  destinationGapMeters?: number;
  distance: number;
  duration: number;
  mode: TravelMode;
  onExit: () => void;
  onRecenter: () => void;
  isFollowingLocation: boolean;
  onOverview: () => void;
};

export default function NavigationOverlay({ destination, destinationGapMeters, distance, duration, mode, onExit, onRecenter, onOverview, isFollowingLocation }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const sheet = useRef<HTMLElement>(null);
  const drag = useRef<{ y: number; height: number; delta: number; pointer: number } | null>(null);
  const moved = useRef(false);
  const finishDrag = (cancelled = false) => {
    const current = drag.current;
    if (!current) return;
    drag.current = null;
    if (sheet.current) {
      sheet.current.removeAttribute("data-dragging");
      sheet.current.style.removeProperty("height");
    }
    if (!cancelled && moved.current) setCollapsed(current.delta > 0);
  };
  const minutes = Math.max(1, Math.ceil(duration / 60));
  const distanceLabel = distance < 1000 ? `${Math.round(distance)} m` : `${(distance / 1000).toFixed(1)} km`;

  return (
    <div className="walk-experience pointer-events-none absolute inset-0 z-40">
      <button onClick={onOverview} aria-label="Route overview" className="walk-back pointer-events-auto"><ArrowLeft size={20} /></button>
      <div className="walk-map-label"><span />{mode === "walking" ? "Walking navigation" : "Vehicle navigation"}</div>
      <section ref={sheet} data-collapsed={collapsed} className="walk-journey pointer-events-auto" aria-label="Current journey">
        <button type="button" className="walk-sheet-grip" aria-label={collapsed ? "Expand navigation panel" : "Collapse navigation panel"} aria-expanded={!collapsed}
          onPointerDown={event => {
            if (event.button !== 0 || !sheet.current) return;
            moved.current = false;
            drag.current = { y: event.clientY, height: sheet.current.getBoundingClientRect().height, delta: 0, pointer: event.pointerId };
            event.currentTarget.setPointerCapture(event.pointerId);
          }}
          onPointerMove={event => {
            const current = drag.current;
            if (!current || current.pointer !== event.pointerId || !sheet.current) return;
            current.delta = event.clientY - current.y;
            if (Math.abs(current.delta) < 5 && !moved.current) return;
            moved.current = true;
            sheet.current.dataset.dragging = "true";
            const maximum = Math.min(310, (sheet.current.parentElement?.clientHeight || window.innerHeight) * 0.44);
            sheet.current.style.height = `${Math.max(120, Math.min(maximum, current.height - current.delta))}px`;
          }}
          onPointerUp={() => finishDrag()}
          onPointerCancel={() => finishDrag(true)}
          onLostPointerCapture={() => finishDrag(true)}
          onClick={event => { if (event.detail === 0 || !moved.current) setCollapsed(value => !value); moved.current = false; }}
        ><span className="walk-sheet-handle" /></button>
        <header className="walk-sheet-header">
          <h2>{mode === "walking" ? "Your campus walk" : "Your campus journey"}</h2>
          <span className="walk-live-label">In progress</span>
        </header>
        <div className="walk-sheet-content">
          <div className="walk-stops">
            <div className="walk-stop">
              <span className="walk-stop-icon walk-origin"><Navigation size={15} /></span>
              <div><p>From</p><h3>Your current location</h3></div>
            </div>
            <div className="walk-stop">
              <span className="walk-stop-icon walk-destination"><MapPin size={16} /></span>
              <div><p>Heading to</p><h3>{destination}</h3></div>
            </div>
          </div>
          <div className="walk-summary">
            <span className="walk-mode-illustration">{mode === "walking" ? <Footprints size={33} strokeWidth={1.4} /> : <CarFront size={33} strokeWidth={1.4} />}</span>
            <div className="walk-summary-copy"><h3>{mode === "walking" ? "On foot" : "By vehicle"}</h3><p>{distanceLabel} remaining</p></div>
            <div className="walk-eta"><strong>{minutes} <span>min</span></strong><p>Estimated arrival</p></div>
          </div>
          {!!destinationGapMeters && destinationGapMeters > 30 && <p className="walk-path-note">The mapped path ends {Math.round(destinationGapMeters)} m from the destination pin. Check the entrance from there.</p>}
          <button onClick={onRecenter} aria-label="Recenter on my location" className="walk-location-row"><span className="walk-location-icon"><Navigation size={17} /></span><span>{isFollowingLocation ? "Following your location" : "Recenter on your location"}</span><ArrowUpRight size={17} /></button>
        </div>
        <footer className="walk-actions">
          <button onClick={onOverview} className="walk-overview"><Route size={18} /> View route</button>
          <button onClick={onExit} className="walk-end"><X size={18} /> End navigation</button>
        </footer>
      </section>
    </div>
  );
}
