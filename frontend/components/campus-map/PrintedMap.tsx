"use client";

import { memo } from "react";
import { MAP_BUILDINGS, MAP_HEIGHT, MAP_WIDTH, Map2DBuilding } from "@/lib/campus/map2d";

/**
 * SVG renderer of the printed SNS campus map. Re-creates the orange paper,
 * coloured building blocks with hand-labelled feel, compass rose and road
 * grid from the photograph.
 */
function PrintedMapInner() {
  return (
    <svg
      viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
      preserveAspectRatio="xMidYMid meet"
      className="block w-full h-full"
      shapeRendering="geometricPrecision"
    >
      <defs>
        {/* Paper texture gradient */}
        <radialGradient id="paper" cx="50%" cy="50%" r="80%">
          <stop offset="0%" stopColor="#f0b66a" />
          <stop offset="50%" stopColor="#e69e4a" />
          <stop offset="100%" stopColor="#c97f30" />
        </radialGradient>

        {/* Fine paper grain pattern */}
        <pattern id="grain" width="6" height="6" patternUnits="userSpaceOnUse">
          <rect width="6" height="6" fill="transparent" />
          <circle cx="1" cy="1" r="0.4" fill="rgba(0,0,0,0.04)" />
          <circle cx="4" cy="4" r="0.3" fill="rgba(255,255,255,0.06)" />
        </pattern>

        {/* Subtle drop shadow for building blocks */}
        <filter id="boxShadow" x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="1.4" />
          <feOffset dx="0.6" dy="1.2" result="off" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.45" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Athletic track inner shapes */}
        <linearGradient id="track-red" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#d63030" />
          <stop offset="100%" stopColor="#a52020" />
        </linearGradient>
      </defs>

      {/* Paper background */}
      <rect width={MAP_WIDTH} height={MAP_HEIGHT} fill="url(#paper)" />
      <rect width={MAP_WIDTH} height={MAP_HEIGHT} fill="url(#grain)" />

      {/* Compass rose — top-right */}
      <Compass x={920} y={90} />

      {/* Buildings */}
      <g filter="url(#boxShadow)">
        {MAP_BUILDINGS.map((b) => (
          <BuildingBlock key={b.id} b={b} />
        ))}
      </g>

      {/* Outer paper frame */}
      <rect
        x={2}
        y={2}
        width={MAP_WIDTH - 4}
        height={MAP_HEIGHT - 4}
        fill="none"
        stroke="rgba(0,0,0,0.12)"
        strokeWidth={1.4}
        rx={4}
      />
    </svg>
  );
}

function BuildingBlock({ b }: { b: Map2DBuilding }) {
  const cx = b.x + b.w / 2;
  const cy = b.y + b.h / 2;

  return (
    <g>
      <rect
        x={b.x}
        y={b.y}
        width={b.w}
        height={b.h}
        fill={b.color}
        stroke="rgba(0,0,0,0.35)"
        strokeWidth={0.6}
        rx={1.5}
      />

      {/* Special details for athletic track and uliyum landmark */}
      {b.special === "athletic-track" && (
        <g>
          <rect
            x={b.x + 14}
            y={b.y + 25}
            width={b.w - 28}
            height={b.h - 50}
            fill="url(#track-red)"
            stroke="rgba(0,0,0,0.3)"
            strokeWidth={0.6}
            rx={(b.h - 50) / 2}
          />
          <rect
            x={b.x + 24}
            y={b.y + 35}
            width={b.w - 48}
            height={b.h - 70}
            fill="#5fa84a"
            stroke="rgba(0,0,0,0.25)"
            strokeWidth={0.5}
            rx={(b.h - 70) / 2}
          />
          <text
            x={cx}
            y={b.y + 18}
            textAnchor="middle"
            fill={b.textColor ?? "#fff"}
            fontSize={b.fontSize ?? 9}
            fontWeight={700}
            fontFamily="ui-sans-serif, system-ui, sans-serif"
            style={{ paintOrder: "stroke", stroke: "rgba(0,0,0,0.4)", strokeWidth: 1 }}
          >
            Athletic Track,
          </text>
          <text
            x={cx}
            y={cy + 3}
            textAnchor="middle"
            fill={b.textColor ?? "#fff"}
            fontSize={b.fontSize ?? 9}
            fontWeight={700}
            fontFamily="ui-sans-serif, system-ui, sans-serif"
            style={{ paintOrder: "stroke", stroke: "rgba(0,0,0,0.4)", strokeWidth: 1 }}
          >
            Football &
          </text>
          <text
            x={cx}
            y={cy + 14}
            textAnchor="middle"
            fill={b.textColor ?? "#fff"}
            fontSize={b.fontSize ?? 9}
            fontWeight={700}
            fontFamily="ui-sans-serif, system-ui, sans-serif"
            style={{ paintOrder: "stroke", stroke: "rgba(0,0,0,0.4)", strokeWidth: 1 }}
          >
            Sports Auditorium
          </text>
        </g>
      )}

      {b.special === "uliyum" && (
        <g>
          {/* concentric coloured rings of the Uliyum Nanum landmark */}
          <circle cx={cx} cy={cy} r={Math.min(b.w, b.h) * 0.34} fill="#e89045" stroke="rgba(0,0,0,0.3)" strokeWidth={0.6} />
          <circle cx={cx} cy={cy} r={Math.min(b.w, b.h) * 0.24} fill="#d4307a" stroke="rgba(0,0,0,0.3)" strokeWidth={0.5} />
          <circle cx={cx} cy={cy} r={Math.min(b.w, b.h) * 0.16} fill="#e8c150" stroke="rgba(0,0,0,0.25)" strokeWidth={0.4} />
          <text
            x={cx}
            y={cy + 4}
            textAnchor="middle"
            fill="#fff"
            fontSize={12}
            fontWeight={800}
            fontFamily="ui-sans-serif, system-ui, sans-serif"
            style={{ paintOrder: "stroke", stroke: "rgba(0,0,0,0.45)", strokeWidth: 1.2 }}
          >
            Uliyum Nanum
          </text>
        </g>
      )}

      {/* Default centred label */}
      {!b.special && (
        <g
          transform={b.rotated ? `rotate(-90 ${cx} ${cy})` : undefined}
          pointerEvents="none"
        >
          <Label
            text={b.label}
            x={cx}
            y={cy}
            maxWidth={b.rotated ? b.h - 4 : b.w - 4}
            fontSize={b.fontSize ?? Math.min(11, Math.max(5, Math.min(b.w, b.h) / 5))}
            color={b.textColor ?? "#fff"}
          />
        </g>
      )}
    </g>
  );
}

/**
 * Simple multi-line text that wraps by max chars per line. SVG doesn't support
 * automatic wrapping, so we estimate.
 */
function Label({
  text,
  x,
  y,
  maxWidth,
  fontSize,
  color,
}: {
  text: string;
  x: number;
  y: number;
  maxWidth: number;
  fontSize: number;
  color: string;
}) {
  const avgCharWidth = fontSize * 0.58;
  const maxChars = Math.max(6, Math.floor(maxWidth / avgCharWidth));
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const w of words) {
    if ((current + " " + w).trim().length > maxChars && current) {
      lines.push(current);
      current = w;
    } else {
      current = (current + " " + w).trim();
    }
  }
  if (current) lines.push(current);

  const lh = fontSize * 1.08;
  const total = lines.length * lh;
  const startY = y - total / 2 + lh * 0.78;

  return (
    <text
      x={x}
      textAnchor="middle"
      fill={color}
      fontSize={fontSize}
      fontWeight={700}
      fontFamily="ui-sans-serif, system-ui, sans-serif"
      style={{
        paintOrder: "stroke",
        stroke: "rgba(0,0,0,0.45)",
        strokeWidth: Math.max(0.6, fontSize * 0.1),
      }}
    >
      {lines.map((line, i) => (
        <tspan key={i} x={x} y={startY + i * lh}>
          {line}
        </tspan>
      ))}
    </text>
  );
}

function Compass({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      {/* Outer ring */}
      <circle r={48} fill="#fdfdfd" stroke="#1a1a1a" strokeWidth={2.2} />
      <circle r={38} fill="none" stroke="#1a1a1a" strokeWidth={1} />
      {/* Cross hairs */}
      <line x1={-46} y1={0} x2={46} y2={0} stroke="#1a1a1a" strokeWidth={1.4} />
      <line x1={0} y1={-46} x2={0} y2={46} stroke="#1a1a1a" strokeWidth={1.4} />
      {/* Diamond needle pointing up */}
      <polygon points="0,-32 8,0 0,32 -8,0" fill="#1a1a1a" />
      <polygon points="0,-32 0,0 8,0" fill="#1a1a1a" />
      <polygon points="0,32 0,0 -8,0" fill="#3a3a3a" />
      {/* Cardinals */}
      <text x={0} y={-54} textAnchor="middle" fontSize={14} fontWeight={800} fill="#1a1a1a">N</text>
      <text x={0} y={66} textAnchor="middle" fontSize={14} fontWeight={800} fill="#1a1a1a">S</text>
      <text x={-58} y={5} textAnchor="middle" fontSize={14} fontWeight={800} fill="#1a1a1a">W</text>
      <text x={58} y={5} textAnchor="middle" fontSize={14} fontWeight={800} fill="#1a1a1a">E</text>
    </g>
  );
}

export const PrintedMap = memo(PrintedMapInner);
