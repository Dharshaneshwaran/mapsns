"use client";

import { MAP_BUILDINGS_BY_ID, MAP_EVENTS, MAP_EVENT_CATEGORIES } from "@/lib/campus/map2d";
import { useMapStore } from "@/stores/map-store";

/**
 * Animated pulsing event markers floating above their host buildings.
 * Clicking a marker opens the building info card.
 */
export function MapEventMarkers() {
  const setSelected = useMapStore((s) => s.setSelectedBuilding);

  return (
    <g>
      {MAP_EVENTS.map((e) => {
        const b = MAP_BUILDINGS_BY_ID[e.buildingId];
        if (!b) return null;
        const cfg = MAP_EVENT_CATEGORIES[e.category];
        const cx = b.x + b.w / 2;
        const cy = b.y + 4;
        return (
          <g
            key={e.id}
            transform={`translate(${cx} ${cy})`}
            style={{ cursor: "pointer" }}
            onClick={(ev) => {
              ev.stopPropagation();
              setSelected(b.id);
            }}
          >
            {/* Outer glow ring */}
            <circle r={10} fill={cfg.color} opacity={0.35}>
              <animate
                attributeName="r"
                values={cfg.pulsing ? "8;16;8" : "9;12;9"}
                dur={cfg.pulsing ? "1s" : "1.8s"}
                repeatCount="indefinite"
              />
              <animate
                attributeName="opacity"
                values={cfg.pulsing ? "0.55;0.1;0.55" : "0.4;0.15;0.4"}
                dur={cfg.pulsing ? "1s" : "1.8s"}
                repeatCount="indefinite"
              />
            </circle>

            {/* Floating disc */}
            <g>
              <animateTransform
                attributeName="transform"
                type="translate"
                values="0 0; 0 -3; 0 0"
                dur="2.4s"
                repeatCount="indefinite"
              />
              <circle
                r={7}
                fill={cfg.color}
                stroke="rgba(255,255,255,0.9)"
                strokeWidth={1.2}
                style={{ filter: `drop-shadow(0 0 6px ${cfg.glow})` }}
              />
              <text
                x={0}
                y={2.5}
                textAnchor="middle"
                fontSize={8}
                style={{ userSelect: "none" }}
              >
                {cfg.icon}
              </text>
            </g>
          </g>
        );
      })}
    </g>
  );
}
