"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useMapStore } from "@/stores/map-store";
import { MAP_WIDTH, MAP_HEIGHT } from "@/lib/campus/map2d";
import * as THREE from "three";

function Humanoid() {
  const groupRef = useRef<THREE.Group>(null);
  const legLRef = useRef<THREE.Group>(null);
  const legRRef = useRef<THREE.Group>(null);
  const armLRef = useRef<THREE.Group>(null);
  const armRRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    const { px, py, facing, speed } = useMapStore.getState();
    const s = Math.min(1, speed);
    const moving = s > 0.05;

    const swing = Math.sin(state.clock.elapsedTime * 7 * s) * 0.6 * s;

    if (legLRef.current) legLRef.current.rotation.x = moving ? swing : 0;
    if (legRRef.current) legRRef.current.rotation.x = moving ? -swing : 0;
    if (armLRef.current) armLRef.current.rotation.x = moving ? -swing : 0;
    if (armRRef.current) armRRef.current.rotation.x = moving ? swing : 0;

    if (groupRef.current) {
      groupRef.current.position.x = px - MAP_WIDTH / 2;
      groupRef.current.position.z = -(py - MAP_HEIGHT / 2);
      groupRef.current.rotation.y = -facing + Math.PI;
    }
  });

  return (
    <group ref={groupRef} scale={6}>
      {/* Shadow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
        <circleGeometry args={[0.6, 16]} />
        <meshBasicMaterial color="black" transparent opacity={0.25} />
      </mesh>

      {/* Body group */}
      <group>
        {/* Torso */}
        <mesh position={[0, 0.8, 0]}>
          <capsuleGeometry args={[0.35, 0.7, 8, 12]} />
          <meshStandardMaterial color="#22d3ee" roughness={0.6} />
        </mesh>

        {/* Head */}
        <mesh position={[0, 1.5, 0]}>
          <sphereGeometry args={[0.3, 16, 16]} />
          <meshStandardMaterial color="#f4c79c" roughness={0.5} />
        </mesh>

        {/* Hair */}
        <mesh position={[0, 1.62, 0.1]}>
          <sphereGeometry args={[0.3, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#2b1e15" roughness={0.8} />
        </mesh>

        {/* Eyes */}
        <mesh position={[-0.12, 1.52, 0.28]}>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshStandardMaterial color="#0f172a" />
        </mesh>
        <mesh position={[0.12, 1.52, 0.28]}>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshStandardMaterial color="#0f172a" />
        </mesh>

        {/* Left arm */}
        <group ref={armLRef} position={[-0.45, 0.7, 0]}>
          <mesh position={[0, -0.4, 0]}>
            <capsuleGeometry args={[0.1, 0.5, 6, 8]} />
            <meshStandardMaterial color="#22d3ee" roughness={0.6} />
          </mesh>
          <mesh position={[0, -0.7, 0]}>
            <sphereGeometry args={[0.08, 8, 8]} />
            <meshStandardMaterial color="#f4c79c" roughness={0.5} />
          </mesh>
        </group>

        {/* Right arm */}
        <group ref={armRRef} position={[0.45, 0.7, 0]}>
          <mesh position={[0, -0.4, 0]}>
            <capsuleGeometry args={[0.1, 0.5, 6, 8]} />
            <meshStandardMaterial color="#22d3ee" roughness={0.6} />
          </mesh>
          <mesh position={[0, -0.7, 0]}>
            <sphereGeometry args={[0.08, 8, 8]} />
            <meshStandardMaterial color="#f4c79c" roughness={0.5} />
          </mesh>
        </group>

        {/* Left leg */}
        <group ref={legLRef} position={[-0.15, 0.25, 0]}>
          <mesh position={[0, -0.35, 0]}>
            <capsuleGeometry args={[0.12, 0.45, 6, 8]} />
            <meshStandardMaterial color="#1e293b" roughness={0.7} />
          </mesh>
          <mesh position={[0, -0.65, 0]}>
            <boxGeometry args={[0.2, 0.1, 0.35]} />
            <meshStandardMaterial color="#0f172a" roughness={0.8} />
          </mesh>
        </group>

        {/* Right leg */}
        <group ref={legRRef} position={[0.15, 0.25, 0]}>
          <mesh position={[0, -0.35, 0]}>
            <capsuleGeometry args={[0.12, 0.45, 6, 8]} />
            <meshStandardMaterial color="#1e293b" roughness={0.7} />
          </mesh>
          <mesh position={[0, -0.65, 0]}>
            <boxGeometry args={[0.2, 0.1, 0.35]} />
            <meshStandardMaterial color="#0f172a" roughness={0.8} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

export function Avatar3D() {
  return (
    <Canvas
      orthographic
      camera={{
        left: -MAP_WIDTH / 2,
        right: MAP_WIDTH / 2,
        top: MAP_HEIGHT / 2,
        bottom: -MAP_HEIGHT / 2,
        near: 0.1,
        far: 100,
        position: [0, 20, 0],
        zoom: 1,
      }}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 5,
      }}
      gl={{ alpha: true }}
      dpr={[1, 2]}
    >
      <ambientLight intensity={0.8} />
      <directionalLight position={[5, 10, 5]} intensity={1.2} />
      <directionalLight position={[-3, 8, -3]} intensity={0.4} />
      <Humanoid />
    </Canvas>
  );
}
