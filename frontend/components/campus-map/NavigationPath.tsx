"use client";

import { MAP_BUILDINGS_BY_ID } from "@/lib/campus/map2d";
import { useMapStore } from "@/stores/map-store";

/**
 * Glowing dashed line + animated arrows from the avatar to the active
 * navigation target, plus a pulsing destination ring.
 */
export function MapNavigationPath() {
  const targetId = useMapStore((s) => s.navigationTargetId);
  const px = useMapStore((s) => s.px);
  const py = useMapStore((s) => s.py);

  if (!targetId) return null;
  const target = MAP_BUILDINGS_BY_ID[targetId];
  if (!target) return null;

  const tx = target.x + target.w / 2;
  const ty = target.y + target.h / 2;
  const radius = Math.max(target.w, target.h) / 2 + 6;

  return (
    <g pointerEvents="none">
      {/* Dashed glowing path */}
      <line
        x1={px}
        y1={py}
        x2={tx}
        y2={ty}
        stroke="#22d3ee"
        strokeOpacity={0.45}
        strokeWidth={5}
        strokeLinecap="round"
        style={{ filter: "drop-shadow(0 0 8px rgba(34,211,238,0.65))" }}
      />
      <line
        x1={px}
        y1={py}
        x2={tx}
        y2={ty}
        stroke="#a5f3fc"
        strokeWidth={1.6}
        strokeDasharray="6 6"
        strokeLinecap="round"
      >
        <animate
          attributeName="stroke-dashoffset"
          from="0"
          to="-24"
          dur="0.9s"
          repeatCount="indefinite"
        />
      </line>

      {/* Destination ring */}
      <g transform={`translate(${tx} ${ty})`}>
        <circle r={radius} fill="none" stroke="#22d3ee" strokeWidth={2.5} opacity={0.85} />
        <circle r={radius - 4} fill="none" stroke="rgba(34,211,238,0.4)" strokeWidth={2}>
          <animate attributeName="r" values={`${radius - 6};${radius + 6};${radius - 6}`} dur="1.4s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.7;0.05;0.7" dur="1.4s" repeatCount="indefinite" />
        </circle>
        <circle r={3} fill="#22d3ee">
          <animate attributeName="r" values="3;5;3" dur="1s" repeatCount="indefinite" />
        </circle>
      </g>
    </g>
  );
}
