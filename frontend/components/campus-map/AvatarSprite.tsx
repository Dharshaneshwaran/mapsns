"use client";

import { useEffect, useRef } from "react";

export interface AvatarPalette {
  skin: string;
  hair: string;
  shirt: string;
  pants: string;
  shoes: string;
  bag: string;
}

interface AvatarSpriteProps {
  /** Centre x in SVG units. */
  x: number;
  /** Centre y in SVG units. */
  y: number;
  /** Facing angle in radians (0 = +x). */
  facing: number;
  /** 0 = idle, up to 1 = full sprint. */
  speed: number;
  isRunning?: boolean;
  /** Visual scale. Default 1 = ~22 SVG units tall. */
  scale?: number;
  /** Colour palette. */
  palette?: AvatarPalette;
  /** Show a soft halo behind the avatar. */
  glow?: boolean;
}

const DEFAULT_PALETTE: AvatarPalette = {
  skin: "#f4c79c",
  hair: "#2b1e15",
  shirt: "#22d3ee",
  pants: "#1e293b",
  shoes: "#0f172a",
  bag: "#facc15",
};

/**
 * Top-down stylised avatar drawn as an SVG sprite. Limbs swing with an
 * analytical walk cycle, the body rotates to face the movement direction.
 */
export function AvatarSprite({
  x,
  y,
  facing,
  speed,
  isRunning = false,
  scale = 1,
  palette = DEFAULT_PALETTE,
  glow = false,
}: AvatarSpriteProps) {
  // Phase accumulator persisted across renders.
  const phaseRef = useRef(0);
  const armLRef = useRef<SVGGElement>(null);
  const armRRef = useRef<SVGGElement>(null);
  const legLRef = useRef<SVGGElement>(null);
  const legRRef = useRef<SVGGElement>(null);
  const headRef = useRef<SVGGElement>(null);
  const rootRef = useRef<SVGGElement>(null);

  // Drive the swing animation on every animation frame.
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const tick = (t: number) => {
      const dt = (t - last) / 1000;
      last = t;
      const stride = isRunning ? 1.7 : 1.0;
      const freq = isRunning ? 11 : 7;
      phaseRef.current += dt * freq * Math.min(1, speed);
      const s = Math.min(1, speed);
      const swing = Math.sin(phaseRef.current) * 45 * stride * s; // degrees
      const headBob = Math.abs(Math.sin(phaseRef.current)) * 1.4 * stride * s;
      const idleBob = (1 - s) * Math.sin(t * 0.0025) * 0.6;
      if (armLRef.current) armLRef.current.setAttribute("transform", `rotate(${swing})`);
      if (armRRef.current) armRRef.current.setAttribute("transform", `rotate(${-swing})`);
      if (legLRef.current) legLRef.current.setAttribute("transform", `rotate(${-swing * 0.8})`);
      if (legRRef.current) legRRef.current.setAttribute("transform", `rotate(${swing * 0.8})`);
      if (headRef.current)
        headRef.current.setAttribute("transform", `translate(0 ${-headBob - idleBob})`);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [speed, isRunning]);

  // Facing rotation in degrees with a +90° so the sprite (drawn looking up)
  // aligns with movement direction (0 rad = +x).
  const facingDeg = (facing * 180) / Math.PI + 90;

  return (
    <g ref={rootRef} transform={`translate(${x} ${y}) scale(${scale})`}>
      {/* Soft halo */}
      {glow && (
        <circle r={14} fill="rgba(34,211,238,0.25)">
          <animate attributeName="r" values="13;16;13" dur="1.4s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.35;0.6;0.35" dur="1.4s" repeatCount="indefinite" />
        </circle>
      )}

      {/* Drop shadow disc (does NOT rotate with body) */}
      <ellipse cx={0} cy={1} rx={5.5} ry={2.3} fill="rgba(0,0,0,0.32)" />

      {/* Body rotates to face the movement direction */}
      <g transform={`rotate(${facingDeg})`}>
        {/* Legs */}
        <g transform="translate(-2 4)">
          <g ref={legLRef}>
            <rect x={-1.4} y={0} width={2.6} height={4.2} rx={1.1} fill={palette.pants} />
            <rect x={-1.5} y={3.4} width={3} height={1.4} rx={0.6} fill={palette.shoes} />
          </g>
        </g>
        <g transform="translate(2 4)">
          <g ref={legRRef}>
            <rect x={-1.4} y={0} width={2.6} height={4.2} rx={1.1} fill={palette.pants} />
            <rect x={-1.5} y={3.4} width={3} height={1.4} rx={0.6} fill={palette.shoes} />
          </g>
        </g>

        {/* Backpack (slightly behind torso) */}
        <rect x={-3} y={-0.5} width={6} height={5} rx={1.2} fill={palette.bag}>
          <animate attributeName="opacity" values="1;0.95;1" dur="1.6s" repeatCount="indefinite" />
        </rect>

        {/* Torso */}
        <rect x={-3.3} y={-2} width={6.6} height={6.4} rx={1.6} fill={palette.shirt} />
        <rect x={-3.3} y={0.4} width={6.6} height={1} fill="rgba(0,0,0,0.18)" rx={0.4} />

        {/* Arms */}
        <g transform="translate(-3.6 0)">
          <g ref={armLRef}>
            <rect x={-1} y={0} width={2} height={4.2} rx={1} fill={palette.shirt} />
            <rect x={-1} y={3.5} width={2} height={1.4} rx={0.7} fill={palette.skin} />
          </g>
        </g>
        <g transform="translate(3.6 0)">
          <g ref={armRRef}>
            <rect x={-1} y={0} width={2} height={4.2} rx={1} fill={palette.shirt} />
            <rect x={-1} y={3.5} width={2} height={1.4} rx={0.7} fill={palette.skin} />
          </g>
        </g>

        {/* Head */}
        <g ref={headRef}>
          <circle r={3.6} cy={-3.4} fill={palette.skin} />
          {/* Hair cap (top half-circle) */}
          <path
            d={`M -3.6 -3.4 A 3.6 3.6 0 0 1 3.6 -3.4 L 3.6 -3.4 Z`}
            transform="translate(0 -0.4)"
            fill={palette.hair}
          />
          {/* Eyes */}
          <circle cx={-1.3} cy={-3.3} r={0.4} fill="#0f172a" />
          <circle cx={1.3} cy={-3.3} r={0.4} fill="#0f172a" />
        </g>
      </g>
    </g>
  );
}
