"use client";

import { useEffect, useRef } from "react";

export interface AvatarPalette {
  skin: string;
  hair: string;
  shirt: string;
  pants: string;
  shoes: string;
}

interface AvatarSpriteProps {
  x: number;
  y: number;
  facing: number;
  speed: number;
  scale?: number;
  palette?: AvatarPalette;
  glow?: boolean;
}

const DEFAULT_PALETTE: AvatarPalette = {
  skin: "#f4c79c",
  hair: "#2b1e15",
  shirt: "#22d3ee",
  pants: "#1e293b",
  shoes: "#0f172a",
};

export function AvatarSprite({
  x,
  y,
  facing,
  speed,
  scale = 1,
  palette = DEFAULT_PALETTE,
  glow = false,
}: AvatarSpriteProps) {
  const phaseRef = useRef(0);
  const armLRef = useRef<SVGGElement>(null);
  const armRRef = useRef<SVGGElement>(null);
  const legLRef = useRef<SVGGElement>(null);
  const legRRef = useRef<SVGGElement>(null);
  const bodyRef = useRef<SVGGElement>(null);

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const tick = (t: number) => {
      const dt = (t - last) / 1000;
      last = t;
      const freq = 7;
      phaseRef.current += dt * freq * Math.min(1, speed);
      const s = Math.min(1, speed);
      const swing = Math.sin(phaseRef.current) * 45 * s;

      if (armLRef.current) armLRef.current.setAttribute("transform", `rotate(${swing})`);
      if (armRRef.current) armRRef.current.setAttribute("transform", `rotate(${-swing})`);
      if (legLRef.current) legLRef.current.setAttribute("transform", `rotate(${-swing * 0.8})`);
      if (legRRef.current) legRRef.current.setAttribute("transform", `rotate(${swing * 0.8})`);

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [speed]);

  const facingDeg = (facing * 180) / Math.PI + 90;

  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      {glow && (
        <circle r={14} fill="rgba(34,211,238,0.25)">
          <animate attributeName="r" values="13;16;13" dur="1.4s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.35;0.6;0.35" dur="1.4s" repeatCount="indefinite" />
        </circle>
      )}

      <ellipse cx={0} cy={1} rx={5.5} ry={2.3} fill="rgba(0,0,0,0.32)" />

      <g transform={`rotate(${facingDeg})`}>
        <g ref={bodyRef}>
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
          <circle r={3.6} cy={-3.4} fill={palette.skin} />
          <path
            d={`M -3.6 -3.4 A 3.6 3.6 0 0 1 3.6 -3.4 L 3.6 -3.4 Z`}
            transform="translate(0 -0.4)"
            fill={palette.hair}
          />
          <circle cx={-1.3} cy={-3.3} r={0.4} fill="#0f172a" />
          <circle cx={1.3} cy={-3.3} r={0.4} fill="#0f172a" />
        </g>
      </g>
    </g>
  );
}
