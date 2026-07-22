"use client";

import { useEffect, useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, ContactShadows, Html, Environment } from "@react-three/drei";
import {
  MAP_BUILDINGS,
  MAP_WIDTH,
  MAP_HEIGHT,
  Map2DBuildingType,
  Map2DBuilding,
} from "@/lib/campus/map2d";
import { useMapStore } from "@/stores/map-store";
import * as THREE from "three";

// ── CONSTANTS ─────────────────────────────────────────────────────────
const HEIGHTS: Record<Map2DBuildingType, number> = {
  academic: 22, hostel: 26, sports: 7, admin: 18, food: 12,
  medical: 20, landmark: 8, service: 10, parking: 3,
};
const FLOOR_H = 3.2;

function darken(hex: string, a: number) {
  return "#" + new THREE.Color(hex).lerp(new THREE.Color(0x000000), a).getHexString();
}
function lighten(hex: string, a: number) {
  return "#" + new THREE.Color(hex).lerp(new THREE.Color(0xffffff), a).getHexString();
}
function pos3(b: { x: number; y: number; w: number; h: number }): [number, number, number] {
  return [b.x + b.w / 2 - MAP_WIDTH / 2, 0, -(b.y + b.h / 2 - MAP_HEIGHT / 2)];
}
// ── MOVEMENT ──────────────────────────────────────────────────────────
function MovementController() {
  const setAvatar = useMapStore((s) => s.setAvatar);
  const setNearby = useMapStore((s) => s.setNearbyBuilding);
  useEffect(() => {
    let raf = 0, last = performance.now(), curFacing = useMapStore.getState().facing, vx = 0, vy = 0;
    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05); last = now;
      const { inputX, inputY, px: cx, py: cy } = useMapStore.getState();
      const maxSpeed = 130;
      const tx = inputX * maxSpeed, ty = inputY * maxSpeed;
      vx += (tx - vx) * 0.18; vy += (ty - vy) * 0.18;
      let nx = cx + vx * dt, ny = cy + vy * dt;
      nx = Math.max(8, Math.min(MAP_WIDTH - 8, nx)); ny = Math.max(8, Math.min(MAP_HEIGHT - 8, ny));
      for (const b of MAP_BUILDINGS) {
        if (b.walkable) continue;
        if (nx > b.x - 5 && nx < b.x + b.w + 5 && ny > b.y - 5 && ny < b.y + b.h + 5) {
          const l = nx - (b.x - 5), r = (b.x + b.w + 5) - nx, t2 = ny - (b.y - 5), bo = (b.y + b.h + 5) - ny;
          const m = Math.min(l, r, t2, bo);
          if (m === l) nx = b.x - 5; else if (m === r) nx = b.x + b.w + 5;
          else if (m === t2) ny = b.y - 5; else ny = b.y + b.h + 5;
          vx = 0; vy = 0;
        }
      }
      const sp = Math.hypot(vx, vy), moving = sp > 4;
      if (moving) {
        const d = Math.atan2(vy, vx);
        let diff = d - curFacing; while (diff > Math.PI) diff -= 2 * Math.PI; while (diff < -Math.PI) diff += 2 * Math.PI;
        curFacing += diff * 0.2;
      }
      const ns = Math.min(1, sp / maxSpeed);
      setAvatar(nx, ny, curFacing, moving, ns);
      let best: Map2DBuilding | null = null, bestD = 6400;
      for (const b of MAP_BUILDINGS) {
        if (!b.landmark) continue;
        const d2 = (b.x + b.w / 2 - nx) ** 2 + (b.y + b.h / 2 - ny) ** 2;
        if (d2 < bestD) { bestD = d2; best = b; }
      }
      setNearby(best?.id ?? null);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [setAvatar, setNearby]);
  useEffect(() => {
    const keys = new Set<string>();
    const flush = () => {
      let x = 0, y = 0;
      if (keys.has("w") || keys.has("arrowup")) y -= 1;
      if (keys.has("s") || keys.has("arrowdown")) y += 1;
      if (keys.has("a") || keys.has("arrowleft")) x -= 1;
      if (keys.has("d") || keys.has("arrowright")) x += 1;
      const m = Math.hypot(x, y); if (m > 1) { x /= m; y /= m; }
      const { inputX: ix, inputY: iy } = useMapStore.getState();
      if (!((ix !== 0 || iy !== 0) && x === 0 && y === 0)) useMapStore.getState().setInput(x, y);
    };
    const down = (e: KeyboardEvent) => {
      if (["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(e.key.toLowerCase())) e.preventDefault();
      keys.add(e.key.toLowerCase()); flush();
    };
    const up = (e: KeyboardEvent) => { keys.delete(e.key.toLowerCase()); flush(); };
    window.addEventListener("keydown", down); window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, []);
  return null;
}

// ── GROUND ────────────────────────────────────────────────────────────
function Ground() {
  const patches = useMemo(() => {
    const r = () => Math.random();
    return Array.from({ length: 40 }).map(() => ({
      pos: [(r() - 0.5) * MAP_WIDTH * 1.1, 0, (r() - 0.5) * MAP_HEIGHT * 1.1] as [number, number, number],
      s: 1 + r() * 4,
      c: r() > 0.5 ? "#5a9040" : "#4a7a2a",
    }));
  }, []);
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.15, 0]} receiveShadow>
        <planeGeometry args={[MAP_WIDTH * 1.4, MAP_HEIGHT * 1.4]} />
        <meshStandardMaterial color="#3d6b35" roughness={0.95} metalness={0} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
        <planeGeometry args={[MAP_WIDTH * 1.3, MAP_HEIGHT * 1.3]} />
        <meshStandardMaterial color="#4a7c3f" roughness={0.9} metalness={0} />
      </mesh>
      {/* Detail patches for natural ground variation */}
      {patches.map((p, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={p.pos} receiveShadow>
          <circleGeometry args={[p.s, 8]} />
          <meshStandardMaterial color={p.c} roughness={0.95} transparent opacity={0.6} />
        </mesh>
      ))}
    </group>
  );
}

// ── ULIYUM NANUM ──────────────────────────────────────────────────────
function UliyumPlaza({ b }: { b: Map2DBuilding }) {
  const [cx, , cz] = pos3(b);
  const r = Math.min(b.w, b.h) * 0.34;
  return (
    <group position={[cx, 0.1, cz]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[r * 1.08, 48]} />
        <meshStandardMaterial color="#7a9e4a" roughness={0.85} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, 0]}>
        <ringGeometry args={[r * 0.78, r * 0.96, 48]} />
        <meshStandardMaterial color="#b87a28" roughness={0.6} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.12, 0]}>
        <ringGeometry args={[r * 0.58, r * 0.72, 48]} />
        <meshStandardMaterial color="#c42a6a" roughness={0.5} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.18, 0]}>
        <ringGeometry args={[r * 0.40, r * 0.52, 48]} />
        <meshStandardMaterial color="#d4a840" roughness={0.4} metalness={0.2} />
      </mesh>
      <mesh position={[0, 2.5, 0]} castShadow>
        <cylinderGeometry args={[0.6, 1.4, 5, 12]} />
        <meshStandardMaterial color="#c8963a" roughness={0.35} metalness={0.4} />
      </mesh>
      <mesh position={[0, 4.8, 0]} castShadow>
        <sphereGeometry args={[0.5, 12, 12]} />
        <meshStandardMaterial color="#e8c150" emissive="#e8c150" emissiveIntensity={0.2} roughness={0.3} metalness={0.5} />
      </mesh>
      <Html position={[0, 6, 0]} center>
        <div className="bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-xl text-white text-sm font-bold whitespace-nowrap border border-white/25 shadow-2xl pointer-events-none select-none drop-shadow-lg">Uliyum Nanum</div>
      </Html>
    </group>
  );
}

// ── ATHLETIC TRACK & STADIUM ─────────────────────────────────────────
function AthleticStadium({ b }: { b: Map2DBuilding }) {
  const [cx, , cz] = pos3(b);
  const w = b.w, h = b.h;
  const trackW = 8, infieldW = w - 16 - trackW * 2, infieldH = h - 16 - trackW * 2;
  const seatH = 4, seatD = 5;
  return (
    <group position={[cx, 0.1, cz]}>
      {/* Base field */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[w - 8, h - 8]} />
        <meshStandardMaterial color="#4a8a3a" roughness={0.85} />
      </mesh>
      {/* Track surface (red synthetic) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.08, 0]}>
        <planeGeometry args={[w - 12, h - 12]} />
        <meshStandardMaterial color="#c42a2a" roughness={0.65} />
      </mesh>
      {/* Infield grass */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.16, 0]}>
        <planeGeometry args={[infieldW, infieldH]} />
        <meshStandardMaterial color="#5aaa4a" roughness={0.8} />
      </mesh>
      {/* Track lane lines */}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.2 + i * 0.005, 0]}>
          <planeGeometry args={[w - 14 - i * 2.5, h - 14 - i * 2.5]} />
          <meshBasicMaterial color="white" transparent opacity={0.12} side={THREE.DoubleSide} />
        </mesh>
      ))}

      {/* Seating stands - North & South */}
      {[
        { side: "north", z: -h / 2 + seatD / 2 + 1 },
        { side: "south", z: h / 2 - seatD / 2 - 1 },
      ].map(({ side, z }) => (
        <group key={side}>
          {[0, 1, 2].map((tier) => (
            <mesh key={tier} position={[0, seatH * (tier + 0.5), z]} castShadow>
              <boxGeometry args={[w - 20, seatH, seatD]} />
              <meshStandardMaterial color="#3a4a6a" roughness={0.7} />
            </mesh>
          ))}
          {[0, 1, 2].map((tier) => (
            <mesh key={`row-${tier}`} position={[0, seatH * (tier + 1), z + (side === "north" ? -0.8 : 0.8)]}>
              <boxGeometry args={[w - 24, 0.6, seatD - 0.5]} />
              <meshStandardMaterial color="#5a7a9a" roughness={0.6} />
            </mesh>
          ))}
        </group>
      ))}
      {/* Seating stands - East & West (shorter) */}
      {[
        { side: "east", x: w / 2 - seatD / 2 - 1 },
        { side: "west", x: -w / 2 + seatD / 2 + 1 },
      ].map(({ side, x }) => (
        <group key={side}>
          {[0, 1].map((tier) => (
            <mesh key={tier} position={[x, seatH * (tier + 0.5), 0]} castShadow>
              <boxGeometry args={[seatD, seatH, h * 0.4]} />
              <meshStandardMaterial color="#3a4a6a" roughness={0.7} />
            </mesh>
          ))}
        </group>
      ))}

      <Html position={[0, 8, 0]} center>
        <div className="bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-xl text-white text-sm font-bold whitespace-nowrap border border-white/25 shadow-2xl pointer-events-none select-none drop-shadow-lg">Athletic Track & Stadium</div>
      </Html>
    </group>
  );
}

// ── SPORTS COURT ──────────────────────────────────────────────────────
function SportsCourt({ b }: { b: Map2DBuilding }) {
  const [cx, , cz] = pos3(b);
  const w = b.w, h = b.h;
  const lbl = b.label.toLowerCase();
  const isVB = lbl.includes("volley");
  const isBK = lbl.includes("basket");
  const isTN = lbl.includes("tennis");
  const isFB = lbl.includes("football");
  const isCR = lbl.includes("cricket");
  const isBD = lbl.includes("badminton") || lbl.includes("shuttle");
  const col = isVB ? "#b87a28" : isBK ? "#8a2020" : isTN ? "#5080a8" : isFB ? "#5fa84a" : isCR ? "#7fb858" : isBD ? "#b83030" : b.color;
  return (
    <group position={[cx, 0.15, cz]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[w - 1.5, h - 1.5]} />
        <meshStandardMaterial color={col} roughness={0.65} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
        <planeGeometry args={[w - 3.5, h - 3.5]} />
        <meshBasicMaterial color="white" transparent opacity={0.25} side={THREE.DoubleSide} />
      </mesh>
      {/* Center line */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, 0]}>
        <planeGeometry args={[b.rotated ? 0.3 : w * 0.6, b.rotated ? h * 0.6 : 0.3]} />
        <meshBasicMaterial color="white" transparent opacity={0.4} />
      </mesh>
      {isTN && <mesh position={[0, 1.2, 0]}><boxGeometry args={[Math.min(w, h) * 0.75, 1.4, 0.06]} /><meshStandardMaterial color="#ddd" roughness={0.3} transparent opacity={0.5} /></mesh>}
      {isVB && <mesh position={[0, 1.5, 0]}><boxGeometry args={[Math.min(w, h) * 0.75, 1.8, 0.06]} /><meshStandardMaterial color="#ddd" roughness={0.3} transparent opacity={0.5} /></mesh>}
      {isBK && <>
        <mesh position={[-w / 2 + 1.5, 3, 0]} castShadow><cylinderGeometry args={[0.04, 0.04, 3, 6]} /><meshStandardMaterial color="#666" /></mesh>
        <mesh position={[w / 2 - 1.5, 3, 0]} castShadow><cylinderGeometry args={[0.04, 0.04, 3, 6]} /><meshStandardMaterial color="#666" /></mesh>
        <mesh position={[-w / 2 + 1.5, 3.8, 0]} castShadow><torusGeometry args={[0.3, 0.05, 8, 12]} /><meshStandardMaterial color="#e84040" metalness={0.3} /></mesh>
        <mesh position={[w / 2 - 1.5, 3.8, 0]} castShadow><torusGeometry args={[0.3, 0.05, 8, 12]} /><meshStandardMaterial color="#e84040" metalness={0.3} /></mesh>
        <mesh position={[-w / 2 + 1.5, 3.8, 0]} castShadow><planeGeometry args={[0.5, 0.8]} /><meshStandardMaterial color="transparent" transparent opacity={0} side={THREE.DoubleSide} /></mesh>
      </>}
      {isCR && <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.08, 0]}><planeGeometry args={[3, h - 10]} /><meshStandardMaterial color="#d4c47a" roughness={0.6} /></mesh>}
      {isFB && Array.from({ length: 5 }).map((_, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[(i - 2) * (w / 6), 0.06, 0]}><planeGeometry args={[1.2, h - 4]} /><meshBasicMaterial color="#6fb85a" transparent opacity={0.25} /></mesh>
      ))}
      <Html position={[0, 3.5, 0]} center>
        <div className="bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-lg text-white text-[10px] font-bold whitespace-nowrap border border-white/15 shadow-lg pointer-events-none select-none">{b.label}</div>
      </Html>
    </group>
  );
}

// ── GABLE ROOF ─────────────────────────────────────────────────────────
function GableRoof({ w, d, color, pitch = 0.35 }: { w: number; d: number; color: string; pitch?: number }) {
  const ro = 0.4;
  const rh = Math.min(w * pitch, 5);
  const shape = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-w / 2 - ro, 0);
    s.lineTo(w / 2 + ro, 0);
    s.lineTo(0, rh);
    s.closePath();
    return s;
  }, [w, rh, ro]);
  const tileRows = useMemo(() => {
    const rows: number[] = [];
    const count = Math.max(3, Math.floor(rh / 0.6));
    for (let i = 1; i < count; i++) {
      rows.push((i / count) * rh);
    }
    return rows;
  }, [rh]);
  return (
    <group>
      <mesh position={[0, 0, -(d + ro * 2) / 2]} castShadow>
        <extrudeGeometry args={[shape, { depth: d + ro * 2, bevelEnabled: false }]} />
        <meshStandardMaterial color={color} roughness={0.85} side={THREE.DoubleSide} />
      </mesh>
      {/* Roof tile ridges */}
      {tileRows.map((y, i) => {
        const halfWAtY = ((w / 2 + ro) * (1 - y / rh));
        return (
          <mesh key={i} position={[0, y, 0]} castShadow>
            <boxGeometry args={[halfWAtY * 2 + 0.05, 0.03, d + ro * 2]} />
            <meshStandardMaterial color={darken(color, 0.15)} roughness={0.9} />
          </mesh>
        );
      })}
      {/* Ridge tile */}
      <mesh position={[0, rh, 0]} castShadow>
        <boxGeometry args={[0.1, 0.1, d + ro * 2]} />
        <meshStandardMaterial color={lighten(color, 0.1)} roughness={0.7} />
      </mesh>
      {/* Eave trim */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[w + ro * 2 + 0.2, 0.06, d + ro * 2]} />
        <meshStandardMaterial color={darken(color, 0.2)} roughness={0.6} />
      </mesh>
    </group>
  );
}

// ── FLAT ROOF WITH DETAILS ────────────────────────────────────────────
function FlatRoof({ w, d, color }: { w: number; d: number; color: string }) {
  return (
    <group>
      <mesh position={[0, 0.2, 0]} castShadow>
        <boxGeometry args={[w + 0.6, 0.4, d + 0.6]} />
        <meshStandardMaterial color={darken(color, 0.25)} roughness={0.6} />
      </mesh>
      <mesh position={[0, -0.05, 0]}>
        <boxGeometry args={[w + 0.8, 0.1, d + 0.8]} />
        <meshStandardMaterial color={lighten(color, 0.1)} roughness={0.4} />
      </mesh>
      {[
        { x: 0, z: d / 2 + 0.1, sx: w + 0.4, sz: 0.15 },
        { x: 0, z: -d / 2 - 0.1, sx: w + 0.4, sz: 0.15 },
        { x: w / 2 + 0.1, z: 0, sx: 0.15, sz: d + 0.4 },
        { x: -w / 2 - 0.1, z: 0, sx: 0.15, sz: d + 0.4 },
      ].map((p, i) => (
        <mesh key={i} position={[p.x, 0.4, p.z]}>
          <boxGeometry args={[p.sx, 0.5, p.sz]} />
          <meshStandardMaterial color={darken(color, 0.3)} roughness={0.5} />
        </mesh>
      ))}
    </group>
  );
}

// ── BUILDING 3D WITH DETAILS ─────────────────────────────────────────
function Building({ b }: { b: Map2DBuilding }) {
  const [cx, , cz] = pos3(b);
  const h = HEIGHTS[b.type];
  const w = b.w - 0.4, d = b.h - 0.4;
  const floors = Math.max(2, Math.round(h / FLOOR_H));
  const cols = Math.max(2, Math.min(12, Math.floor(w / 5)));
  const rows = Math.max(2, floors);
  const gapX = (w - 2) / cols;
  const gapY = (h - 3) / rows;
  const isAcademic = b.type === "academic" || b.type === "medical" || b.type === "admin";
  const isHostel = b.type === "hostel";
  const acUnits = Math.max(2, Math.floor(w / 8));
  const hasGable = b.type === "hostel" || b.type === "food" || b.type === "service" || b.type === "admin" || b.type === "landmark";
  const roofColor = darken(b.color, 0.25);

  return (
    <group position={[cx, 0, cz]}>
      {/* Main body */}
      <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color={b.color} roughness={0.55} metalness={0.05} />
      </mesh>

      {/* Floor-divider bands */}
      {!b.walkable && Array.from({ length: floors - 1 }).map((_, i) => (
        <mesh key={`fb-${i}`} position={[0, (i + 1) * FLOOR_H, 0]}>
          <boxGeometry args={[w + 0.05, 0.12, d + 0.05]} />
          <meshStandardMaterial color={darken(b.color, 0.3)} roughness={0.5} />
        </mesh>
      ))}

      {/* Base trim */}
      <mesh position={[0, 0.15, 0]}>
        <boxGeometry args={[w + 0.15, 0.3, d + 0.15]} />
        <meshStandardMaterial color={darken(b.color, 0.35)} roughness={0.6} />
      </mesh>

      {/* Roof */}
      <group position={[0, h, 0]}>
        {hasGable ? (
          <GableRoof w={w} d={d} color={roofColor} pitch={b.type === "hostel" ? 0.35 : b.type === "admin" ? 0.3 : 0.4} />
        ) : (
          <FlatRoof w={w} d={d} color={roofColor} />
        )}
      </group>

      {/* Windows - front and back faces */}
      {!b.walkable && Array.from({ length: rows }).map((_, ri) =>
        Array.from({ length: cols }).map((_, ci) => {
          const wx = -w / 2 + 1 + ci * gapX + gapX / 2;
          const wy = 1.8 + ri * gapY + gapY / 2;
          const wWin = Math.min(gapX - 0.6, 1.8);
          const hWin = Math.min(gapY - 0.6, 1.8);
          return (
            <group key={`${ri}-${ci}`}>
              <mesh position={[wx, wy, d / 2 + 0.04]}>
                <planeGeometry args={[wWin + 0.1, hWin + 0.1]} />
                <meshBasicMaterial color={darken(b.color, 0.3)} />
              </mesh>
              <mesh position={[wx, wy, d / 2 + 0.06]}>
                <planeGeometry args={[wWin, hWin]} />
                <meshStandardMaterial color="#87ceeb" emissive="#4a8db7" emissiveIntensity={0.2} roughness={0.05} metalness={0.3} />
              </mesh>
              <mesh position={[wx, wy, -d / 2 - 0.04]} rotation={[0, Math.PI, 0]}>
                <planeGeometry args={[wWin + 0.1, hWin + 0.1]} />
                <meshBasicMaterial color={darken(b.color, 0.3)} />
              </mesh>
              <mesh position={[wx, wy, -d / 2 - 0.06]} rotation={[0, Math.PI, 0]}>
                <planeGeometry args={[wWin, hWin]} />
                <meshStandardMaterial color="#87ceeb" emissive="#4a8db7" emissiveIntensity={0.2} roughness={0.05} metalness={0.3} />
              </mesh>
              {/* Window sill */}
              <mesh position={[wx, wy - hWin / 2 - 0.05, d / 2 + 0.04]}>
                <boxGeometry args={[wWin + 0.15, 0.06, 0.06]} />
                <meshStandardMaterial color={lighten(b.color, 0.15)} roughness={0.5} />
              </mesh>
              <mesh position={[wx, wy - hWin / 2 - 0.05, -d / 2 - 0.04]} rotation={[0, Math.PI, 0]}>
                <boxGeometry args={[wWin + 0.15, 0.06, 0.06]} />
                <meshStandardMaterial color={lighten(b.color, 0.15)} roughness={0.5} />
              </mesh>
            </group>
          );
        })
      )}

      {/* Hostel: balcony rails on the front */}
      {isHostel && !b.walkable && Array.from({ length: cols }).map((_, ci) => {
        const wx = -w / 2 + 1 + ci * gapX + gapX / 2;
        return Array.from({ length: rows }).map((_, ri) => {
          const wy = 1.8 + ri * gapY + gapY / 2;
          return (
            <mesh key={`bal-${ri}-${ci}`} position={[wx, wy - 0.3, d / 2 + 0.15]}>
              <planeGeometry args={[1.2, 0.6]} />
              <meshBasicMaterial color={darken(b.color, 0.2)} transparent opacity={0.3} />
            </mesh>
          );
        });
      })}

      {/* AC units on roof (flat-roof academic/medical only) */}
      {!hasGable && isAcademic && !b.walkable && Array.from({ length: acUnits }).map((_, i) => (
        <mesh key={`ac-${i}`} position={[-w / 3 + (i % 4) * 2.5, h + 0.7, -d / 4 + Math.floor(i / 4) * 2.5]} castShadow>
          <boxGeometry args={[0.6, 0.4, 0.4]} />
          <meshStandardMaterial color="#888" roughness={0.7} />
        </mesh>
      ))}

      {/* Entrance canopy */}
      {!b.walkable && (
        <group position={[0, 0, d / 2 + 0.1]}>
          <mesh position={[0, 1.8, 0]}>
            <planeGeometry args={[2.8, 3.2]} />
            <meshStandardMaterial color={lighten(b.color, 0.25)} roughness={0.4} />
          </mesh>
          <mesh position={[0, 3.2, -0.1]}>
            <boxGeometry args={[3.2, 0.25, 0.3]} />
            <meshStandardMaterial color={darken(b.color, 0.3)} roughness={0.5} />
          </mesh>
          <mesh position={[-1.2, 1.2, 0.1]}>
            <boxGeometry args={[0.15, 2.4, 0.15]} />
            <meshStandardMaterial color="#aaa" roughness={0.3} metalness={0.2} />
          </mesh>
          <mesh position={[1.2, 1.2, 0.1]}>
            <boxGeometry args={[0.15, 2.4, 0.15]} />
            <meshStandardMaterial color="#aaa" roughness={0.3} metalness={0.2} />
          </mesh>
          <mesh position={[0, 0.8, 0.15]}>
            <planeGeometry args={[1.8, 2.2]} />
            <meshStandardMaterial color="#2a1a0a" roughness={0.8} />
          </mesh>
        </group>
      )}

      {/* Building label (offset higher for gable roofs) */}
      {!b.walkable && (
        <Html position={[0, h + (hasGable ? Math.min(w * 0.35, 5) + 4 : 3.5), 0]} center>
          <div className="bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-xl text-white text-xs font-bold whitespace-nowrap border border-white/25 shadow-2xl pointer-events-none select-none drop-shadow-lg">
            {b.label}
          </div>
        </Html>
      )}
    </group>
  );
}

// ── TREE ──────────────────────────────────────────────────────────────
function DetailedTree({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  const { s, rand } = useMemo(() => {
    const r = Math.random();
    return { s: scale * (0.5 + r * 0.6), rand: r };
  }, [scale]);
  const isRound = rand > 0.6;
  if (isRound) {
    const r = 0.4 + rand * 0.3;
    return (
      <group position={position} scale={s}>
        <mesh position={[0, 0.3, 0]} castShadow>
          <cylinderGeometry args={[0.04, 0.08, 0.5, 6]} />
          <meshStandardMaterial color="#4a3020" roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.6 + r * 0.4, 0]} castShadow>
          <sphereGeometry args={[r, 8, 8]} />
          <meshStandardMaterial color="#2a6a1a" roughness={0.85} />
        </mesh>
        <mesh position={[0.05, 0.75 + r * 0.3, 0.05]} castShadow>
          <sphereGeometry args={[r * 0.7, 8, 8]} />
          <meshStandardMaterial color="#3a8a2a" roughness={0.85} />
        </mesh>
      </group>
    );
  }
  const spread = 0.5 + rand * 0.5;
  const height = 1.0 + rand * 0.6;
  return (
    <group position={position} scale={s}>
      <mesh position={[0, height * 0.2, 0]} castShadow>
        <cylinderGeometry args={[0.03, 0.08, height * 0.45, 6]} />
        <meshStandardMaterial color="#4a3020" roughness={0.9} />
      </mesh>
      <mesh position={[0, height * 0.5, 0]} castShadow>
        <coneGeometry args={[spread * 0.8, height * 0.35, 7]} />
        <meshStandardMaterial color="#1a5a0a" roughness={0.85} />
      </mesh>
      <mesh position={[0, height * 0.7, 0]} castShadow>
        <coneGeometry args={[spread * 0.6, height * 0.3, 7]} />
        <meshStandardMaterial color="#2a7a1a" roughness={0.85} />
      </mesh>
      <mesh position={[0, height * 0.88, 0]} castShadow>
        <coneGeometry args={[spread * 0.38, height * 0.25, 7]} />
        <meshStandardMaterial color="#3a9a2a" roughness={0.85} />
      </mesh>
    </group>
  );
}

// ── BUSH ──────────────────────────────────────────────────────────────
function Bush({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  const s = useMemo(() => scale * (0.3 + Math.random() * 0.3), [scale]);
  return (
    <group position={position} scale={s}>
      <mesh position={[0, 0.2, 0]} castShadow>
        <sphereGeometry args={[0.3, 6, 6]} />
        <meshStandardMaterial color="#2a7a1a" roughness={0.9} />
      </mesh>
      <mesh position={[0.15, 0.15, 0.1]} castShadow>
        <sphereGeometry args={[0.25, 6, 6]} />
        <meshStandardMaterial color="#3a8a2a" roughness={0.9} />
      </mesh>
      <mesh position={[-0.1, 0.15, -0.12]} castShadow>
        <sphereGeometry args={[0.22, 6, 6]} />
        <meshStandardMaterial color="#2a6a1a" roughness={0.9} />
      </mesh>
    </group>
  );
}

// ── FLOWER BED ────────────────────────────────────────────────────────
function FlowerBed({ position }: { position: [number, number, number] }) {
  const colors = ["#e84040", "#facc15", "#a855f7", "#fb923c", "#22d3ee", "#e8a847"];
  return (
    <group position={position}>
      <mesh position={[0, -0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.3, 8]} />
        <meshStandardMaterial color="#4a3020" roughness={0.9} />
      </mesh>
      {Array.from({ length: 5 }).map((_, i) => (
        <mesh key={i} position={[Math.sin(i * 1.256) * 0.2, 0.05 + Math.random() * 0.05, Math.cos(i * 1.256) * 0.2]}>
          <sphereGeometry args={[0.03, 6, 6]} />
          <meshStandardMaterial color={colors[i % colors.length]} roughness={0.5} />
        </mesh>
      ))}
    </group>
  );
}

// ── LAMP POST ─────────────────────────────────────────────────────────
function LampPost({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.4, 0]} castShadow>
        <cylinderGeometry args={[0.03, 0.05, 0.8, 6]} />
        <meshStandardMaterial color="#444" metalness={0.4} roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.82, 0]}>
        <cylinderGeometry args={[0.04, 0.03, 0.06, 6]} />
        <meshStandardMaterial color="#333" />
      </mesh>
      <mesh position={[0.1, 0.78, 0]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshStandardMaterial color="#ffe88a" emissive="#ffe88a" emissiveIntensity={0.4} />
      </mesh>
    </group>
  );
}

// ── BENCH ─────────────────────────────────────────────────────────────
function Bench({ position, rot = 0 }: { position: [number, number, number]; rot?: number }) {
  return (
    <group position={position} rotation={[0, rot, 0]}>
      <mesh position={[0, 0.2, 0]} castShadow>
        <boxGeometry args={[0.5, 0.06, 0.2]} />
        <meshStandardMaterial color="#6a4a2a" roughness={0.8} />
      </mesh>
      <mesh position={[-0.18, 0.12, 0]} castShadow>
        <boxGeometry args={[0.04, 0.24, 0.04]} />
        <meshStandardMaterial color="#555" metalness={0.3} />
      </mesh>
      <mesh position={[0.18, 0.12, 0]} castShadow>
        <boxGeometry args={[0.04, 0.24, 0.04]} />
        <meshStandardMaterial color="#555" metalness={0.3} />
      </mesh>
      <mesh position={[0, 0.35, 0]}>
        <boxGeometry args={[0.45, 0.04, 0.04]} />
        <meshStandardMaterial color="#6a4a2a" roughness={0.8} />
      </mesh>
    </group>
  );
}

// ── ROAD SEGMENT ─────────────────────────────────────────────────────
function RoadSeg({ start, end, width = 5 }: { start: [number, number]; end: [number, number]; width?: number }) {
  const dx = end[0] - start[0], dy = end[1] - start[1];
  const len = Math.hypot(dx, dy);
  const ang = Math.atan2(dx, dy);
  const cx = (start[0] + end[0]) / 2 - MAP_WIDTH / 2;
  const cz = -((start[1] + end[1]) / 2 - MAP_HEIGHT / 2);
  if (len < 0.5) return null;
  return (
    <group position={[cx, 0.02, cz]} rotation={[0, -ang, 0]}>
      {/* Asphalt */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[width, len]} />
        <meshStandardMaterial color="#3a3a3a" roughness={0.9} />
      </mesh>
      {/* Sidewalks */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-width / 2 - 0.9, 0.01, 0]}>
        <planeGeometry args={[1.6, len]} />
        <meshStandardMaterial color="#aaa" roughness={0.8} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[width / 2 + 0.9, 0.01, 0]}>
        <planeGeometry args={[1.6, len]} />
        <meshStandardMaterial color="#aaa" roughness={0.8} />
      </mesh>
      {/* Curbs */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-width / 2, 0.02, 0]}>
        <planeGeometry args={[0.2, len]} />
        <meshStandardMaterial color="#666" roughness={0.5} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[width / 2, 0.02, 0]}>
        <planeGeometry args={[0.2, len]} />
        <meshStandardMaterial color="#666" roughness={0.5} />
      </mesh>
      {/* Center dashed line */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <planeGeometry args={[0.15, len]} />
        <meshBasicMaterial color="#e8c150" transparent opacity={0.35} />
      </mesh>
      {/* Street lights */}
      {Array.from({ length: Math.max(1, Math.floor(len / 18)) }).map((_, i) => (
        <LampPost key={i} position={[-width / 2 - 1.3, 0, -len / 2 + 4 + i * 18]} />
      ))}
      {Array.from({ length: Math.max(1, Math.floor(len / 18)) }).map((_, i) => (
        <LampPost key={`r-${i}`} position={[width / 2 + 1.3, 0, -len / 2 + 7 + i * 18]} />
      ))}
      {/* Occasional benches */}
      {Math.random() > 0.7 && (
        <Bench position={[-width / 2 - 1.3, 0, -len / 4]} rot={0} />
      )}
    </group>
  );
}

// ── ROADS ─────────────────────────────────────────────────────────────
function Roads() {
  const segs = [
    [0, 240, 440, 240], [440, 240, 840, 240], [30, 750, 30, 520], [30, 520, 30, 240],
    [30, 240, 30, 115], [760, 240, 760, 530], [760, 240, 760, 100], [0, 520, 380, 520],
    [240, 240, 240, 470], [400, 240, 400, 470], [460, 470, 460, 530],
    [460, 530, 565, 775], [565, 775, 565, 540], [460, 530, 620, 530],
    [620, 530, 820, 530], [170, 45, 170, 115], [310, 80, 310, 170],
    [35, 85, 265, 85], [820, 530, 930, 385], [820, 530, 820, 740],
    [30, 520, 200, 520], [140, 575, 140, 520],
  ] as [number, number, number, number][];
  return (
    <group>
      {segs.map((s, i) => <RoadSeg key={i} start={[s[0], s[1]]} end={[s[2], s[3]]} />)}
      {[[565, 540], [565, 775], [400, 240], [460, 530], [240, 240]].map((p, i) => (
        <mesh key={`xw-${i}`} position={[p[0] - MAP_WIDTH / 2, 0.04, -(p[1] - MAP_HEIGHT / 2)]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[5, 1]} />
          <meshBasicMaterial color="white" transparent opacity={0.25} />
        </mesh>
      ))}
    </group>
  );
}

// ── PARKING LOT ───────────────────────────────────────────────────────
function ParkingLot({ b }: { b: Map2DBuilding }) {
  const [cx, , cz] = pos3(b);
  const w = b.w, h = b.h;
  const carCols = ["#22d3ee", "#e84040", "#facc15", "#22c55e", "#a855f7", "#f97316", "#3b82f6", "#e8a847", "#fff", "#888"];
  const rows = Math.min(3, Math.floor(h / 8));
  const cols = Math.min(4, Math.floor(w / 6));
  return (
    <group position={[cx, 0.05, cz]}>
      {/* Surface */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial color="#888" roughness={0.9} />
      </mesh>
      {/* Parking lines */}
      {Array.from({ length: cols + 1 }).map((_, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[-w / 2 + i * (w / cols), 0.02, 0]}>
          <planeGeometry args={[0.08, h - 1]} />
          <meshBasicMaterial color="white" transparent opacity={0.25} />
        </mesh>
      ))}
      {/* Cars removed */}
    </group>
  );
}

// ── GARDEN AREA ───────────────────────────────────────────────────────
function GardenArea({ b }: { b: Map2DBuilding }) {
  const [cx, , cz] = pos3(b);
  const w = b.w, h = b.h;
  return (
    <group position={[cx, 0, cz]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.03, 0]} receiveShadow>
        <planeGeometry args={[w - 1, h - 1]} />
        <meshStandardMaterial color="#4a7a2a" roughness={0.95} />
      </mesh>
      {Array.from({ length: 6 }).map((_, i) => (
        <DetailedTree key={i} position={[-w / 4 + (i % 3) * (w / 3) + (Math.random() - 0.5) * 2, 0, -h / 4 + Math.floor(i / 3) * (h / 1.5) + (Math.random() - 0.5) * 2]} scale={0.4 + Math.random() * 0.5} />
      ))}
      {Array.from({ length: 4 }).map((_, i) => (
        <Bush key={`b-${i}`} position={[-w / 3 + (i % 2) * (w / 2.5) + (Math.random() - 0.5) * 1, 0, h / 4 + Math.floor(i / 2) * 0.5]} scale={0.6 + Math.random() * 0.4} />
      ))}
      {Array.from({ length: 3 }).map((_, i) => (
        <FlowerBed key={`f-${i}`} position={[i * 2 - 2, 0, -h / 3]} />
      ))}
      <Bench position={[0, 0, h / 3]} rot={0} />
    </group>
  );
}

// ── TREE CLUSTERS (landscaping around campus) ────────────────────────
function TreeClusters() {
  const elements = useMemo(() => {
    const trees: { pos: [number, number, number]; scale: number }[] = [];
    const bushes: { pos: [number, number, number]; scale: number }[] = [];
    const flowers: { pos: [number, number, number] }[] = [];
    const r = () => Math.random();

    const clusters = [
      { pos: [70, 220] as [number, number], count: 5, spread: 10 },
      { pos: [170, 220] as [number, number], count: 4, spread: 8 },
      { pos: [270, 220] as [number, number], count: 4, spread: 8 },
      { pos: [450, 220] as [number, number], count: 4, spread: 8 },
      { pos: [700, 220] as [number, number], count: 5, spread: 10 },
      { pos: [350, 500] as [number, number], count: 4, spread: 7 },
      { pos: [70, 100] as [number, number], count: 4, spread: 8 },
      { pos: [170, 100] as [number, number], count: 3, spread: 6 },
      { pos: [650, 180] as [number, number], count: 4, spread: 8 },
      { pos: [820, 180] as [number, number], count: 4, spread: 8 },
      { pos: [400, 450] as [number, number], count: 3, spread: 6 },
      { pos: [500, 440] as [number, number], count: 3, spread: 5 },
      { pos: [500, 750] as [number, number], count: 5, spread: 10 },
      { pos: [620, 750] as [number, number], count: 4, spread: 8 },
      { pos: [310, 620] as [number, number], count: 4, spread: 7 },
      { pos: [900, 540] as [number, number], count: 5, spread: 8 },
      { pos: [470, 55] as [number, number], count: 4, spread: 8 },
      { pos: [550, 55] as [number, number], count: 3, spread: 6 },
      { pos: [280, 390] as [number, number], count: 3, spread: 5 },
      { pos: [830, 450] as [number, number], count: 3, spread: 6 },
    ];

    for (const c of clusters) {
      for (let j = 0; j < c.count; j++) {
        trees.push({
          pos: [c.pos[0] + (r() - 0.5) * c.spread - MAP_WIDTH / 2, 0, -(c.pos[1] + (r() - 0.5) * c.spread - MAP_HEIGHT / 2)],
          scale: 0.4 + r() * 0.6,
        });
      }
    }

    for (let i = 0; i < 30; i++) {
      bushes.push({
        pos: [(r() - 0.5) * MAP_WIDTH * 0.8, 0, (r() - 0.5) * MAP_HEIGHT * 0.8],
        scale: 0.4 + r() * 0.6,
      });
    }

    for (let i = 0; i < 10; i++) {
      flowers.push({
        pos: [(r() - 0.5) * MAP_WIDTH * 0.6, 0, (r() - 0.5) * MAP_HEIGHT * 0.6],
      });
    }

    return { trees, bushes, flowers };
  }, []);

  return (
    <group>
      {elements.trees.map((t, i) => <DetailedTree key={i} position={t.pos} scale={t.scale} />)}
      {elements.bushes.map((b, i) => <Bush key={`bush-${i}`} position={b.pos} scale={b.scale} />)}
      {elements.flowers.map((f, i) => <FlowerBed key={`fl-${i}`} position={f.pos} />)}
    </group>
  );
}

// ── MAIN SCENE ────────────────────────────────────────────────────────
function CampusScene() {
  return (
    <group>
      <Ground />
      <Roads />
      <TreeClusters />
      {MAP_BUILDINGS.map((b) => {
        if (b.special === "athletic-track") return <AthleticStadium key={b.id} b={b} />;
        if (b.special === "uliyum") return <UliyumPlaza key={b.id} b={b} />;
        if (b.type === "parking" || b.walkable) return <ParkingLot key={b.id} b={b} />;
        if (b.type === "sports") return <SportsCourt key={b.id} b={b} />;
        if (b.id === "natchatra") return <GardenArea key={b.id} b={b} />;
        return <Building key={b.id} b={b} />;
      })}
    </group>
  );
}

// ── EXPORTED COMPONENT ────────────────────────────────────────────────
export function Campus3D() {
  return (
    <Canvas
      shadows
      camera={{ position: [350, 480, 350], zoom: 0.55, near: 1, far: 2500 }}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      gl={{
        antialias: true,
        alpha: false,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.4,
        outputColorSpace: THREE.SRGBColorSpace,
      }}
      dpr={[1, 2]}
      onCreated={({ gl }) => {
        gl.shadowMap.enabled = true;
        gl.shadowMap.type = THREE.PCFSoftShadowMap;
        gl.setClearColor("#8aba8a");
        gl.outputColorSpace = THREE.SRGBColorSpace;
      }}
    >
      {/* Fog for atmospheric depth */}
      <fog attach="fog" args={["#8aba8a", 350, 1100]} />

      {/* HDR Environment for reflections */}
      <Environment preset="sunset" />

      {/* Warm sunset lighting */}
      <ambientLight intensity={0.3} color="#ffcca0" />
      <hemisphereLight args={["#87ceeb", "#4a2a0a", 0.35]} />

      {/* Key sunlight */}
      <directionalLight
        position={[250, 350, 180]}
        intensity={2.0}
        color="#ffb87a"
        castShadow
        shadow-mapSize-width={4096}
        shadow-mapSize-height={4096}
        shadow-camera-left={-MAP_WIDTH}
        shadow-camera-right={MAP_WIDTH}
        shadow-camera-top={MAP_HEIGHT}
        shadow-camera-bottom={-MAP_HEIGHT}
        shadow-bias={-0.0005}
        shadow-normalBias={0.02}
      />
      {/* Fill light */}
      <directionalLight position={[-120, 200, -120]} intensity={0.35} color="#7ab8ff" />
      {/* Rim light */}
      <directionalLight position={[0, -100, 200]} intensity={0.15} color="#ff8844" />

      <ContactShadows position={[0, -0.1, 0]} opacity={0.35} scale={[MAP_WIDTH * 1.5, MAP_HEIGHT * 1.5]} blur={4} far={25} resolution={1024} />

      <CampusScene />
      <MovementController />

      <OrbitControls
        enableDamping
        dampingFactor={0.08}
        minZoom={0.25}
        maxZoom={4}
        minPolarAngle={Math.PI / 5}
        maxPolarAngle={Math.PI / 2.8}
        target={[0, 0, 0]}
      />
    </Canvas>
  );
}
