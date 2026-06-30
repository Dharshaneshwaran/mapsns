"use client";

import { useEffect, useRef, useState } from "react";
import { AvatarSprite, AvatarPalette } from "./AvatarSprite";
import { MAP_NPC_ROUTES } from "@/lib/campus/map2d";

/**
 * NPC students that walk along pre-baked routes between the buildings of
 * the campus map. Their position is computed on every animation frame and
 * passed to the shared AvatarSprite.
 */
export function MapNPCs() {
  return (
    <g>
      {MAP_NPC_ROUTES.map((route, i) => (
        <NPC key={i} route={route} startOffset={(i * 0.27) % 1} />
      ))}
    </g>
  );
}

function NPC({
  route,
  startOffset,
}: {
  route: (typeof MAP_NPC_ROUTES)[number];
  startOffset: number;
}) {
  const seg = useRef(0);
  const t = useRef(startOffset);
  const [pose, setPose] = useState({
    x: route.path[0]![0],
    y: route.path[0]![1],
    facing: 0,
  });

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      const path = route.path;
      const a = path[seg.current]!;
      const b = path[(seg.current + 1) % path.length]!;
      const dx = b[0] - a[0];
      const dy = b[1] - a[1];
      const length = Math.hypot(dx, dy) || 1;
      t.current += (route.speed * dt) / length;
      if (t.current >= 1) {
        t.current = 0;
        seg.current = (seg.current + 1) % path.length;
      } else {
        setPose({
          x: a[0] + dx * t.current,
          y: a[1] + dy * t.current,
          facing: Math.atan2(dy, dx),
        });
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [route]);

  const palette: AvatarPalette = {
    skin: "#e3b58a",
    hair: route.hair,
    shirt: route.shirt,
    pants: "#1e293b",
    shoes: "#0f172a",
    bag: "#0ea5e9",
  };

  return (
    <AvatarSprite
      x={pose.x}
      y={pose.y}
      facing={pose.facing}
      speed={0.9}
      scale={0.85}
      palette={palette}
    />
  );
}
