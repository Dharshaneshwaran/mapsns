"use client";

import { useEffect, useRef, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, OrbitControls } from "@react-three/drei";
import {
  MAP_BUILDINGS,
  MAP_WIDTH,
  MAP_HEIGHT,
  Map2DBuilding,
  Map2DBuildingType,
} from "@/lib/campus/map2d";
import { useMapStore } from "@/stores/map-store";
import { GpsWalker } from "./GpsWalker";
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

// ── SKY ────────────────────────────────────────────────────────────────
function Sky() {
  const ref = useRef<THREE.Mesh>(null);
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[800, 32, 32]} />
      <shaderMaterial
        side={THREE.BackSide}
        uniforms={{
          topColor: { value: new THREE.Color(0x4a8fe0) },
          bottomColor: { value: new THREE.Color(0xb0d4f0) },
          offset: { value: 20 },
          exponent: { value: 0.6 },
        }}
        vertexShader={`
          varying vec3 vWorldPosition;
          void main() {
            vec4 worldPos = modelMatrix * vec4(position, 1.0);
            vWorldPosition = worldPos.xyz;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          uniform vec3 topColor;
          uniform vec3 bottomColor;
          uniform float offset;
          uniform float exponent;
          varying vec3 vWorldPosition;
          void main() {
            float h = normalize(vWorldPosition + offset).y;
            gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
          }
        `}
      />
    </mesh>
  );
}

// ── CLOUDS ─────────────────────────────────────────────────────────────
function Clouds() {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (!groupRef.current) return;
    groupRef.current.children.forEach((child, i) => {
      child.position.x += delta * 0.5 * (1 + i * 0.05);
      if (child.position.x > 900) child.position.x = -900;
    });
  });
  const cloudData = useMemo(() => {
    const positions = [
      [-400, 280, -350, 1.8], [50, 300, -300, 1.5], [350, 270, -400, 2.0],
      [-200, 310, -200, 1.3], [500, 285, -250, 1.6], [-350, 290, -100, 1.4],
      [200, 320, -450, 1.7], [-500, 275, -300, 1.2], [600, 295, -350, 1.5],
      [0, 305, -500, 1.9], [-150, 280, -150, 1.1], [450, 310, -180, 1.4],
    ];
    return positions.map(([x, y, z, s]) => ({ pos: [x, y, z] as [number, number, number], scale: s }));
  }, []);
  return (
    <group ref={groupRef}>
      {cloudData.map((c, i) => (
        <Cloud key={i} position={c.pos} scale={c.scale} />
      ))}
    </group>
  );
}

function Cloud({ position, scale }: { position: [number, number, number]; scale: number }) {
  const geo = useMemo(() => new THREE.SphereGeometry(0.8, 7, 7), []);
  const mat = useMemo(() => new THREE.MeshStandardMaterial({
    color: 0xffffff, roughness: 0.1, metalness: 0,
    transparent: true, opacity: 0.85,
  }), []);
  const parts = useMemo(() => [
    [0, 0, 0, 1], [1.2, 0.3, 0.3, 0.7], [-1.1, 0.2, -0.2, 0.6],
    [0.5, 0.5, -0.8, 0.5], [-0.6, 0.4, 0.7, 0.5],
    [0.8, 0.1, 0.9, 0.4], [-0.9, 0.1, -0.7, 0.4],
    [1.6, 0, -0.5, 0.3], [-1.5, -0.1, 0.5, 0.3],
  ], []);
  return (
    <group position={position} scale={scale}>
      {parts.map(([px, py, pz, s], i) => (
        <mesh key={i} geometry={geo} material={mat} position={[px, py, pz]} scale={s} />
      ))}
    </group>
  );
}

// ── SUN ────────────────────────────────────────────────────────────────
function SunDisc() {
  const lightPos = useMemo(() => new THREE.Vector3(250, 400, 280), []);
  return (
    <group position={lightPos.clone().multiplyScalar(1.8)}>
      <mesh>
        <sphereGeometry args={[30, 16, 16]} />
        <meshBasicMaterial color={0xfff4d6} />
      </mesh>
      <mesh>
        <sphereGeometry args={[60, 16, 16]} />
        <meshBasicMaterial color={0xffe8a0} transparent opacity={0.15} />
      </mesh>
    </group>
  );
}

// ── TERRAIN ────────────────────────────────────────────────────────────
function Terrain() {
  const patches = useMemo(() => {
    return Array.from({ length: 60 }).map(() => ({
      pos: [(Math.random() - 0.5) * MAP_WIDTH * 1.2, 0, (Math.random() - 0.5) * MAP_HEIGHT * 1.2] as [number, number, number],
      s: 3 + Math.random() * 10,
      c: Math.random() > 0.5 ? "#5a9a3a" : "#3a7a2a",
    }));
  }, []);
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
        <planeGeometry args={[MAP_WIDTH * 1.5, MAP_HEIGHT * 1.5]} />
        <meshStandardMaterial color="#5a8a3a" roughness={0.95} metalness={0} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
        <planeGeometry args={[MAP_WIDTH * 1.4, MAP_HEIGHT * 1.4]} />
        <meshStandardMaterial color="#4d8c3a" roughness={0.9} metalness={0} />
      </mesh>
      {patches.map((p, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={p.pos} receiveShadow>
          <circleGeometry args={[p.s, 8]} />
          <meshStandardMaterial color={p.c} roughness={0.95} transparent opacity={0.5} />
        </mesh>
      ))}
    </group>
  );
}

// ── LAMP POST ──────────────────────────────────────────────────────────
function LampPost() {
  return (
    <group>
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
        <meshStandardMaterial color="#ffe88a" emissive="#ffe88a" emissiveIntensity={0.5} />
      </mesh>
    </group>
  );
}

// ── BENCH ──────────────────────────────────────────────────────────────
function Bench({ rot = 0 }: { rot?: number }) {
  return (
    <group rotation={[0, rot, 0]}>
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

// ── ROAD SEGMENT ──────────────────────────────────────────────────────
function RoadSeg({ start, end }: { start: [number, number]; end: [number, number] }) {
  const gRef = useRef<THREE.Group>(null);
  const dx = end[0] - start[0], dy = end[1] - start[1];
  const len = Math.hypot(dx, dy);
  const ang = Math.atan2(dx, dy);
  const cx = (start[0] + end[0]) / 2 - MAP_WIDTH / 2;
  const cz = -((start[1] + end[1]) / 2 - MAP_HEIGHT / 2);
  if (len < 0.5) return null;

  const numLamps = Math.max(1, Math.floor(len / 18));

  return (
    <group ref={gRef} position={[cx, 0, cz]} rotation={[0, -ang, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]} receiveShadow>
        <planeGeometry args={[5.5, len]} />
        <meshStandardMaterial color="#3a3a3a" roughness={0.9} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-3.65, 0.05, 0]} receiveShadow>
        <planeGeometry args={[1.8, len]} />
        <meshStandardMaterial color="#bbb" roughness={0.8} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[3.65, 0.05, 0]} receiveShadow>
        <planeGeometry args={[1.8, len]} />
        <meshStandardMaterial color="#bbb" roughness={0.8} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-2.75, 0.06, 0]}>
        <planeGeometry args={[0.25, len]} />
        <meshStandardMaterial color="#666" roughness={0.5} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[2.75, 0.06, 0]}>
        <planeGeometry args={[0.25, len]} />
        <meshStandardMaterial color="#666" roughness={0.5} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.07, 0]}>
        <planeGeometry args={[0.15, len]} />
        <meshBasicMaterial color="#e8c150" transparent opacity={0.4} />
      </mesh>
      {Array.from({ length: numLamps }).map((_, i) => (
        <group key={i} position={[-4, -0.07, -len / 2 + 4 + i * 18]}>
          <LampPost />
        </group>
      ))}
      {Array.from({ length: numLamps }).map((_, i) => (
        <group key={`r${i}`} position={[4, -0.07, -len / 2 + 7 + i * 18]}>
          <LampPost />
        </group>
      ))}
    </group>
  );
}

// ── ROADS ─────────────────────────────────────────────────────────────
function Roads() {
  const segs: [number, number, number, number][] = [
    [0, 240, 440, 240], [440, 240, 840, 240], [30, 750, 30, 520], [30, 520, 30, 240],
    [30, 240, 30, 115], [760, 240, 760, 530], [760, 240, 760, 100], [0, 520, 380, 520],
    [240, 240, 240, 470], [400, 240, 400, 470], [460, 470, 460, 530],
    [460, 530, 565, 775], [565, 775, 565, 540], [460, 530, 620, 530],
    [620, 530, 820, 530], [170, 45, 170, 115], [310, 80, 310, 170],
    [35, 85, 265, 85], [820, 530, 930, 385], [820, 530, 820, 740],
    [30, 520, 200, 520], [140, 575, 140, 520],
  ];
  const crosswalks = [[565, 540], [400, 240], [460, 530], [240, 240], [565, 775], [620, 530]];
  return (
    <group>
      {segs.map((s, i) => (
        <RoadSeg key={i} start={[s[0], s[1]]} end={[s[2], s[3]]} />
      ))}
      {crosswalks.map((p, i) => (
        <mesh key={`cw${i}`} position={[p[0] - MAP_WIDTH / 2, 0.06, -(p[1] - MAP_HEIGHT / 2)]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[5, 1]} />
          <meshBasicMaterial color="white" transparent opacity={0.25} />
        </mesh>
      ))}
    </group>
  );
}

// ── TREE ──────────────────────────────────────────────────────────────
function Tree({ scale = 1 }: { position?: [number, number, number]; scale?: number }) {
  const s = scale * (0.5 + Math.random() * 0.6);
  const isRound = Math.random() > 0.5;
  if (isRound) {
    const r = (0.3 + Math.random() * 0.3) * s;
    return (
      <group scale={s}>
        <mesh position={[0, 0.25, 0]} castShadow>
          <cylinderGeometry args={[0.03, 0.08, 0.5, 6]} />
          <meshStandardMaterial color="#4a3020" roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.5 + r * 0.5, 0]} castShadow>
          <sphereGeometry args={[r, 8, 8]} />
          <meshStandardMaterial color="#2a7a1a" roughness={0.85} />
        </mesh>
        <mesh position={[0.05, 0.55 + r * 0.4, 0.05]} castShadow>
          <sphereGeometry args={[r * 0.7, 8, 8]} />
          <meshStandardMaterial color="#3a9a2a" roughness={0.85} />
        </mesh>
      </group>
    );
  }
  const sp = (0.5 + Math.random() * 0.5) * s;
  const h = (1 + Math.random() * 0.6) * s;
  return (
    <group scale={s}>
      <mesh position={[0, h * 0.2, 0]} castShadow>
        <cylinderGeometry args={[0.03, 0.08, h * 0.45, 6]} />
        <meshStandardMaterial color="#4a3020" roughness={0.9} />
      </mesh>
      <mesh position={[0, h * 0.4, 0]} castShadow>
        <coneGeometry args={[sp * 0.8, h * 0.35, 7]} />
        <meshStandardMaterial color="#1a5a0a" roughness={0.85} />
      </mesh>
      <mesh position={[0, h * 0.6, 0]} castShadow>
        <coneGeometry args={[sp * 0.6, h * 0.3, 7]} />
        <meshStandardMaterial color="#2a7a1a" roughness={0.85} />
      </mesh>
      <mesh position={[0, h * 0.78, 0]} castShadow>
        <coneGeometry args={[sp * 0.38, h * 0.25, 7]} />
        <meshStandardMaterial color="#3a9a2a" roughness={0.85} />
      </mesh>
    </group>
  );
}

// ── BUSH ──────────────────────────────────────────────────────────────
function Bush({ scale = 1 }: { scale?: number }) {
  const s = scale * (0.3 + Math.random() * 0.3);
  return (
    <group scale={s}>
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

// ── TREE CLUSTERS ────────────────────────────────────────────────────
function TreeClusters() {
  const elements = useMemo(() => {
    const trees: { pos: [number, number, number]; scale: number }[] = [];
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
          pos: [c.pos[0] + (Math.random() - 0.5) * c.spread - MAP_WIDTH / 2, 0, -(c.pos[1] + (Math.random() - 0.5) * c.spread - MAP_HEIGHT / 2)],
          scale: 0.5 + Math.random() * 0.6,
        });
      }
    }
    return { trees };
  }, []);
  return (
    <group>
      {elements.trees.map((t, i) => <Tree key={i} position={t.pos} scale={t.scale} />)}
    </group>
  );
}
// Override Tree to accept position prop


// ── ULIYUM NANUM PLAZA ──────────────────────────────────────────────
function UliyumPlaza({ b }: { b: Map2DBuilding }) {
  const [cx, , cz] = pos3(b);
  const r = Math.min(b.w, b.h) * 0.34;
  return (
    <group position={[cx, 0, cz]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} receiveShadow>
        <circleGeometry args={[r * 1.1, 48]} />
        <meshStandardMaterial color="#7a9e4a" roughness={0.85} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.08, 0]}>
        <ringGeometry args={[r * 0.78, r * 0.98, 48]} />
        <meshStandardMaterial color="#b87a28" roughness={0.6} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.14, 0]}>
        <ringGeometry args={[r * 0.58, r * 0.72, 48]} />
        <meshStandardMaterial color="#c42a6a" roughness={0.5} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.2, 0]}>
        <ringGeometry args={[r * 0.42, r * 0.52, 48]} />
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
      <pointLight position={[0, 4.8, 0]} intensity={0.3} color="#e8c150" distance={15} />
    </group>
  );
}

// ── BUILDING ──────────────────────────────────────────────────────────
function Building({ b }: { b: Map2DBuilding }) {
  const [cx, , cz] = pos3(b);
  const h = HEIGHTS[b.type] || 8;
  const w = b.w - 0.4, d = b.h - 0.4;
  const floors = Math.max(2, Math.round(h / FLOOR_H));
  const cols = 2;
  const rows = 2;
  const gapX = (w - 2) / (cols + 1);
  const gapY = (h - 3) / (rows + 1);
  const hasGable = b.type === "hostel" || b.type === "food" || b.type === "service" || b.type === "admin" || b.type === "landmark";

  return (
    <group position={[cx, 0, cz]}>
      <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color={b.color} roughness={0.55} metalness={0.05} />
      </mesh>
      {Array.from({ length: floors - 1 }).map((_, i) => (
        <mesh key={i} position={[0, (i + 1) * FLOOR_H, 0]}>
          <boxGeometry args={[w + 0.04, 0.1, d + 0.04]} />
          <meshStandardMaterial color={darken(b.color, 0.3)} roughness={0.5} />
        </mesh>
      ))}
      <mesh position={[0, 0.15, 0]}>
        <boxGeometry args={[w + 0.15, 0.3, d + 0.15]} />
        <meshStandardMaterial color={darken(b.color, 0.35)} roughness={0.6} />
      </mesh>
      {hasGable ? (
        <GableRoof w={w} d={d} color={darken(b.color, 0.25)} pitch={b.type === "hostel" ? 0.35 : b.type === "admin" ? 0.3 : 0.4} h={h} />
      ) : (
        <FlatRoof w={w} d={d} color={darken(b.color, 0.25)} h={h} />
      )}
      {Array.from({ length: rows * cols }).map((_, i) => {
        const ri = Math.floor(i / cols);
        const ci = i % cols;
        const wx = -w / 2 + gapX + ci * gapX * 2;
        const wy = 1.8 + gapY + ri * gapY * 2;
        return (
          <group key={i}>
            <mesh position={[wx, wy, d / 2 + 0.05]}>
              <planeGeometry args={[1.8, 2]} />
              <meshStandardMaterial color="#87ceeb" emissive="#4a8db7" emissiveIntensity={0.12} roughness={0.1} metalness={0.3} />
            </mesh>
            <mesh position={[wx, wy, -d / 2 - 0.05]} rotation={[0, Math.PI, 0]}>
              <planeGeometry args={[1.8, 2]} />
              <meshStandardMaterial color="#87ceeb" emissive="#4a8db7" emissiveIntensity={0.12} roughness={0.1} metalness={0.3} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function GableRoof({ w, d, color, pitch, h }: { w: number; d: number; color: string; pitch: number; h: number }) {
  const rh = Math.min(w * pitch, 5);
  const shape = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-w / 2 - 0.4, 0);
    s.lineTo(w / 2 + 0.4, 0);
    s.lineTo(0, rh);
    s.closePath();
    return s;
  }, [w, rh]);
  return (
    <group position={[0, h, 0]}>
      <mesh position={[0, 0, -(d + 0.8) / 2]} castShadow>
        <extrudeGeometry args={[shape, { depth: d + 0.8, bevelEnabled: false }]} />
        <meshStandardMaterial color={color} roughness={0.85} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, rh, 0]} castShadow>
        <boxGeometry args={[0.1, 0.08, d + 0.8]} />
        <meshStandardMaterial color={lighten(color, 0.1)} roughness={0.7} />
      </mesh>
    </group>
  );
}

function FlatRoof({ w, d, color, h }: { w: number; d: number; color: string; h: number }) {
  return (
    <group position={[0, h, 0]}>
      <mesh position={[0, 0.2, 0]} castShadow>
        <boxGeometry args={[w + 0.6, 0.4, d + 0.6]} />
        <meshStandardMaterial color={color} roughness={0.6} />
      </mesh>
      <mesh position={[0, -0.05, 0]}>
        <boxGeometry args={[w + 0.8, 0.08, d + 0.8]} />
        <meshStandardMaterial color={lighten(color, 0.1)} roughness={0.4} />
      </mesh>
    </group>
  );
}

// ── PARKING LOT ──────────────────────────────────────────────────────
function ParkingLot({ b }: { b: Map2DBuilding }) {
  const [cx, , cz] = pos3(b);
  const carColsArr: string[] = [];
  const rows = Math.min(3, Math.floor(b.h / 8));
  const cols = Math.min(4, Math.floor(b.w / 6));
  return (
    <group position={[cx, 0.02, cz]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[b.w, b.h]} />
        <meshStandardMaterial color="#888" roughness={0.9} />
      </mesh>
      {Array.from({ length: cols + 1 }).map((_, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[-b.w / 2 + i * (b.w / cols), 0.03, 0]}>
          <planeGeometry args={[0.08, b.h - 1]} />
          <meshBasicMaterial color="white" transparent opacity={0.25} />
        </mesh>
      ))}
      {/* Cars removed */}
    </group>
  );
}

// ── SPORTS COURT ─────────────────────────────────────────────────────
function SportsCourt({ b }: { b: Map2DBuilding }) {
  const [cx, , cz] = pos3(b);
  const lbl = b.label.toLowerCase();
  const isTN = lbl.includes("tennis") || lbl.includes("volley");
  const isBK = lbl.includes("basket");
  const col = lbl.includes("volley") ? "#b87a28" : lbl.includes("basket") ? "#8a2020" : lbl.includes("tennis") ? "#5080a8" : "#5fa84a";
  return (
    <group position={[cx, 0.02, cz]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[b.w - 1.5, b.h - 1.5]} />
        <meshStandardMaterial color={col} roughness={0.65} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
        <planeGeometry args={[b.w - 3.5, b.h - 3.5]} />
        <meshBasicMaterial color="white" transparent opacity={0.2} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
        <planeGeometry args={[b.rotated ? 0.3 : b.w * 0.6, b.rotated ? b.h * 0.6 : 0.3]} />
        <meshBasicMaterial color="white" transparent opacity={0.3} />
      </mesh>
      {isTN && (
        <mesh position={[0, 1.2, 0]}>
          <boxGeometry args={[Math.min(b.w, b.h) * 0.75, 1.4, 0.06]} />
          <meshStandardMaterial color="#ddd" roughness={0.3} transparent opacity={0.5} />
        </mesh>
      )}
      {isBK && (
        <>
          {[[-b.w / 2 + 1.5, 3, 0] as [number, number, number], [b.w / 2 - 1.5, 3, 0] as [number, number, number]].map((p, i) => (
            <group key={i}>
              <mesh position={p} castShadow>
                <cylinderGeometry args={[0.04, 0.04, 3, 6]} />
                <meshStandardMaterial color="#666" />
              </mesh>
              <mesh position={[p[0], 3.8, p[2]]} castShadow>
                <torusGeometry args={[0.3, 0.05, 8, 12]} />
                <meshStandardMaterial color="#e84040" metalness={0.3} />
              </mesh>
            </group>
          ))}
        </>
      )}
    </group>
  );
}

// ── ATHLETIC TRACK ──────────────────────────────────────────────────
function AthleticStadium({ b }: { b: Map2DBuilding }) {
  const [cx, , cz] = pos3(b);
  return (
    <group position={[cx, 0.02, cz]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[b.w - 8, b.h - 8]} />
        <meshStandardMaterial color="#4a8a3a" roughness={0.85} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
        <planeGeometry args={[b.w - 12, b.h - 12]} />
        <meshStandardMaterial color="#c42a2a" roughness={0.65} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.08, 0]}>
        <planeGeometry args={[b.w - 32, b.h - 32]} />
        <meshStandardMaterial color="#5aaa4a" roughness={0.8} />
      </mesh>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.1 + i * 0.005, 0]}>
          <planeGeometry args={[b.w - 14 - i * 2.5, b.h - 14 - i * 2.5]} />
          <meshBasicMaterial color="white" transparent opacity={0.1} />
        </mesh>
      ))}
      {[[0, -b.h / 2 + 3], [0, b.h / 2 - 3]].map(([sx, sz]) =>
        [0, 1, 2].map((tier) => (
          <mesh key={`${sx}-${tier}`} position={[sx, 4 * (tier + 0.5), sz]} castShadow>
            <boxGeometry args={[b.w - 20, 4, 5]} />
            <meshStandardMaterial color="#3a4a6a" roughness={0.7} />
          </mesh>
        ))
      )}
    </group>
  );
}

// ── PLAYER (Rigged GLB Animated Character) ────────────────────────
function Player() {
  const groupRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Group>(null);
  const walkPhaseRef = useRef(0);

  useFrame((_state, delta) => {
    if (!groupRef.current) return;

    const s = useMapStore.getState();
    groupRef.current.position.x = s.px - MAP_WIDTH / 2;
    groupRef.current.position.z = -(s.py - MAP_HEIGHT / 2);
    groupRef.current.rotation.y = -s.facing + Math.PI;

    const speed = Math.min(1, s.speed);
    const moving = speed > 0.05;
    // Faster travel uses a matching, continuous gait cycle so each loop starts
    // and ends at the same pose without visible foot sliding.
    if (moving) walkPhaseRef.current += delta * (8 + speed * 6);
    const stride = moving ? Math.sin(walkPhaseRef.current) * (0.36 + speed * 0.16) : 0;

    if (leftLegRef.current) leftLegRef.current.rotation.x = stride;
    if (rightLegRef.current) rightLegRef.current.rotation.x = -stride;
    // The free left arm swings with the gait; the phone hand stays composed.
    if (leftArmRef.current) leftArmRef.current.rotation.x = -stride * 0.85;
    if (rightArmRef.current) rightArmRef.current.rotation.x = -0.3 + Math.sin(walkPhaseRef.current) * 0.045;
    if (bodyRef.current) bodyRef.current.position.y = moving ? Math.abs(Math.sin(walkPhaseRef.current * 2)) * 0.035 : 0;
  });

  return (
    <group ref={groupRef} scale={3}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]} receiveShadow>
        <circleGeometry args={[0.62, 20]} />
        <meshBasicMaterial color="#111827" transparent opacity={0.25} />
      </mesh>
      <group ref={bodyRef}>
        <mesh position={[0, 1.38, 0]} castShadow><capsuleGeometry args={[0.31, 0.72, 8, 12]} /><meshStandardMaterial color="#f4edcf" roughness={0.72} /></mesh>
        <mesh position={[0, 1.97, 0.01]} castShadow><sphereGeometry args={[0.27, 20, 16]} /><meshStandardMaterial color="#8c4d32" roughness={0.58} /></mesh>
        <mesh position={[0, 2.13, 0.02]} scale={[1.03, 0.66, 1.02]} castShadow><sphereGeometry args={[0.28, 20, 16]} /><meshStandardMaterial color="#17120f" roughness={0.9} /></mesh>
        <mesh position={[0, 1.72, 0.255]}><boxGeometry args={[0.035, 0.47, 0.02]} /><meshStandardMaterial color="#e3d59f" roughness={0.7} /></mesh>

        <mesh position={[0, 0.73, 0]} castShadow><cylinderGeometry args={[0.39, 0.47, 0.82, 16]} /><meshStandardMaterial color="#faf9f2" roughness={0.82} /></mesh>
        <mesh position={[0.05, 0.72, 0.45]}><boxGeometry args={[0.07, 0.82, 0.015]} /><meshStandardMaterial color="#d5a52b" roughness={0.55} metalness={0.16} /></mesh>

        <group ref={leftArmRef} position={[-0.37, 1.59, 0]}>
          <mesh position={[0, -0.3, 0]} castShadow><capsuleGeometry args={[0.095, 0.46, 8, 10]} /><meshStandardMaterial color="#f4edcf" roughness={0.72} /></mesh>
          <mesh position={[0, -0.61, 0]} castShadow><sphereGeometry args={[0.105, 12, 10]} /><meshStandardMaterial color="#8c4d32" roughness={0.58} /></mesh>
        </group>
        <group ref={rightArmRef} position={[0.37, 1.59, 0]}>
          <mesh position={[0, -0.3, 0]} castShadow><capsuleGeometry args={[0.095, 0.46, 8, 10]} /><meshStandardMaterial color="#f4edcf" roughness={0.72} /></mesh>
          <mesh position={[0, -0.61, 0]} castShadow><sphereGeometry args={[0.105, 12, 10]} /><meshStandardMaterial color="#8c4d32" roughness={0.58} /></mesh>
          <mesh position={[0, -0.51, 0.02]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.075, 0.02, 8, 16]} /><meshStandardMaterial color="#111827" roughness={0.5} /></mesh>
          {/* Low-poly phone is parented to this arm, keeping it locked to the hand. */}
          <group position={[0.04, -0.7, 0.07]} rotation={[-0.18, 0.1, 0]}>
            <mesh castShadow>
              <boxGeometry args={[0.15, 0.255, 0.025]} />
              <meshStandardMaterial color="#090b10" roughness={0.4} metalness={0.25} />
            </mesh>
            <mesh position={[0, 0, 0.014]}>
              <boxGeometry args={[0.12, 0.205, 0.004]} />
              <meshStandardMaterial color="#1c3852" emissive="#0b1b2a" emissiveIntensity={0.35} roughness={0.25} />
            </mesh>
          </group>
        </group>

        <group ref={leftLegRef} position={[-0.17, 0.43, 0]}>
          <mesh position={[0, -0.31, 0]} castShadow><capsuleGeometry args={[0.115, 0.39, 8, 10]} /><meshStandardMaterial color="#faf9f2" roughness={0.82} /></mesh>
          <mesh position={[0, -0.61, 0.06]} castShadow><sphereGeometry args={[0.12, 12, 8]} scale={[0.85, 0.5, 1.35]} /><meshStandardMaterial color="#8c4d32" roughness={0.58} /></mesh>
        </group>
        <group ref={rightLegRef} position={[0.17, 0.43, 0]}>
          <mesh position={[0, -0.31, 0]} castShadow><capsuleGeometry args={[0.115, 0.39, 8, 10]} /><meshStandardMaterial color="#faf9f2" roughness={0.82} /></mesh>
          <mesh position={[0, -0.61, 0.06]} castShadow><sphereGeometry args={[0.12, 12, 8]} scale={[0.85, 0.5, 1.35]} /><meshStandardMaterial color="#8c4d32" roughness={0.58} /></mesh>
        </group>
      </group>
    </group>
  );
}

// ── MOVEMENT CONTROLLER ────────────────────────────────────────────
function MovementController() {
  const setAvatar = useMapStore((s) => s.setAvatar);
  const setNearby = useMapStore((s) => s.setNearbyBuilding);
  const walkSpeed = 35;
  const avatarClearance = 14;

  useEffect(() => {
    let raf = 0, last = performance.now(), curFacing = useMapStore.getState().facing, vx = 0, vy = 0;
    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05); last = now;
      const { inputX, inputY, px: cx, py: cy } = useMapStore.getState();
      const maxSpeed = walkSpeed;
      const tx = inputX * maxSpeed, ty = inputY * maxSpeed;
      vx += (tx - vx) * 0.18; vy += (ty - vy) * 0.18;
      let nx = cx + vx * dt, ny = cy + vy * dt;
      nx = Math.max(8, Math.min(MAP_WIDTH - 8, nx)); ny = Math.max(8, Math.min(MAP_HEIGHT - 8, ny));
      for (const b of MAP_BUILDINGS) {
        if (b.walkable) continue;
        if (nx > b.x - avatarClearance && nx < b.x + b.w + avatarClearance && ny > b.y - avatarClearance && ny < b.y + b.h + avatarClearance) {
          const l = nx - (b.x - avatarClearance), r = (b.x + b.w + avatarClearance) - nx;
          const t2 = ny - (b.y - avatarClearance), bo = (b.y + b.h + avatarClearance) - ny;
          const m = Math.min(l, r, t2, bo);
          if (m === l) nx = b.x - avatarClearance; else if (m === r) nx = b.x + b.w + avatarClearance;
          else if (m === t2) ny = b.y - avatarClearance; else ny = b.y + b.h + avatarClearance;
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
      if (useMapStore.getState().gpsMode) return;
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

// ── SCENE ──────────────────────────────────────────────────────────
function CampusScene() {
  return (
    <group>
      <Terrain />
      <Roads />
      <TreeClusters />
      {MAP_BUILDINGS.map((b) => {
        if (b.special === "athletic-track") return <AthleticStadium key={b.id} b={b} />;
        if (b.special === "uliyum") return <UliyumPlaza key={b.id} b={b} />;
        if (b.type === "parking" || b.walkable) return <ParkingLot key={b.id} b={b} />;
        if (b.type === "sports") return <SportsCourt key={b.id} b={b} />;
        if (b.id === "natchatra") return <Building key={b.id} b={b} />;
        return <Building key={b.id} b={b} />;
      })}
    </group>
  );
}

// ── CAMERA FOLLOW ────────────────────────────────────────────────────
const orbitRef: { current: any } = { current: null };

function CameraFollow() {
  const { camera } = useThree();

  useFrame(() => {
    const s = useMapStore.getState();
    const target = new THREE.Vector3(s.px - MAP_WIDTH / 2, 0, -(s.py - MAP_HEIGHT / 2));
    if (orbitRef.current) {
      orbitRef.current.target.lerp(target, s.isMoving ? 0.1 : 0.05);
    }
    const facingAngle = -s.facing + Math.PI;
    const maxDist = 14;
    const height = 10;
    const sx = -Math.sin(facingAngle), sz = -Math.cos(facingAngle);

    let dist = maxDist;
    for (let d = maxDist; d >= 2; d -= 0.5) {
      const mx = target.x + sx * d + MAP_WIDTH / 2;
      const my = -(target.z + sz * d) + MAP_HEIGHT / 2;
      let blocked = false;
      for (const b of MAP_BUILDINGS) {
        if (b.walkable) continue;
        if (mx > b.x && mx < b.x + b.w && my > b.y && my < b.y + b.h) {
          blocked = true; break;
        }
      }
      if (!blocked) { dist = d; break; }
    }

    const offset = new THREE.Vector3(sx * dist, height, sz * dist);
    const idealPos = target.clone().add(offset);
    camera.position.lerp(idealPos, s.isMoving ? 0.08 : 0.04);
  });

  return null;
}

// ── GPS TOGGLE ─────────────────────────────────────────────────────
function GpsToggle() {
  const gpsMode = useMapStore((s) => s.gpsMode);
  const setGpsMode = useMapStore((s) => s.setGpsMode);

  return (
    <button
      onClick={() => setGpsMode(!gpsMode)}
      className={`fixed bottom-36 right-4 z-30 flex h-12 w-12 items-center justify-center rounded-full text-xs font-bold shadow-lg backdrop-blur-md transition-all pointer-events-auto ${
        gpsMode
          ? "bg-emerald-500/80 text-white shadow-emerald-500/40"
          : "bg-white/15 text-white/60 hover:bg-white/25"
      }`}
      title={gpsMode ? "GPS walking ON – tap to switch to joystick" : "GPS walking OFF – tap to follow your phone GPS"}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="3" />
        <line x1="12" y1="2" x2="12" y2="6" />
        <line x1="12" y1="18" x2="12" y2="22" />
        <line x1="2" y1="12" x2="6" y2="12" />
        <line x1="18" y1="12" x2="22" y2="12" />
      </svg>
    </button>
  );
}

// ── EXPORTED COMPONENT ──────────────────────────────────────────────
export function Campus3D_PokemonGO() {
  return (
    <>
    <Canvas
      shadows
      camera={{ position: [0, 750, 450], near: 0.1, far: 2000 }}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      gl={{
        antialias: false,
        alpha: false,
        powerPreference: "high-performance",
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.2,
        outputColorSpace: THREE.SRGBColorSpace,
      }}
      dpr={[1, 1.25]}
      onCreated={({ gl }) => {
        gl.shadowMap.enabled = true;
        gl.shadowMap.type = THREE.PCFShadowMap;
        gl.setClearColor("#78bce0");
      }}
    >
      <fog attach="fog" args={["#78bce0", 600, 1400]} />
      <Sky />
      <Clouds />
      <SunDisc />
      <ambientLight intensity={0.5} color="#404060" />
      <hemisphereLight args={["#87ceeb", "#3a6b1e", 0.5]} />
      <directionalLight
        position={[250, 400, 280]}
        intensity={2.5}
        color="#ffe4b5"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-left={-MAP_WIDTH}
        shadow-camera-right={MAP_WIDTH}
        shadow-camera-top={MAP_HEIGHT}
        shadow-camera-bottom={-MAP_HEIGHT}
        shadow-bias={-0.0005}
        shadow-normalBias={0.02}
      />
      <directionalLight position={[-150, 200, -150]} intensity={0.5} color="#7ab8ff" />
      <directionalLight position={[0, -100, 300]} intensity={0.2} color="#ff8844" />
      <ContactShadows position={[0, -0.1, 0]} opacity={0.28} scale={[MAP_WIDTH * 1.5, MAP_HEIGHT * 1.5]} blur={2} far={20} resolution={256} />
      <CampusScene />
      <Player />
      <MovementController />
      <CameraFollow />
      <OrbitControls
        ref={orbitRef}
        enableDamping
        dampingFactor={0.12}
        enablePan
        enableZoom
        zoomSpeed={1.2}
        zoomToCursor
        minDistance={20}
        maxDistance={1400}
        minPolarAngle={0.02}
        maxPolarAngle={Math.PI / 2.1}
        target={[0, 0, 0]}
      />
    </Canvas>
      <GpsWalker />
      <GpsToggle />
    </>
  );
}
