# 3D Campus Map - Implementation Roadmap

## 🎯 Quick Start Guide

This document provides a step-by-step implementation plan for building the 3D Pokémon GO-inspired campus map.

## 📦 Required Dependencies

### Core 3D Libraries
```bash
npm install three @types/three
npm install @react-three/fiber @react-three/drei @react-three/rapier
npm install @react-three/postprocessing
npm install zustand
npm install framer-motion
```

### Map & Location
```bash
npm install mapbox-gl @types/mapbox-gl
npm install geolib
```

### UI & Utilities
```bash
npm install class-variance-authority
npm install tailwind-merge
npm install clsx
npm install lucide-react
```

### Development Tools
```bash
npm install -D @types/three
npm install -D gltf-pipeline
```

## 🏗️ Project Structure Setup

### 1. Create Directory Structure
```bash
# Frontend directories
mkdir -p components/campus/{Buildings,Character,Effects,Interactions,UI}
mkdir -p hooks/campus
mkdir -p lib/campus
mkdir -p stores
mkdir -p app/campus-3d
mkdir -p public/models/{buildings,characters,environment,effects}
mkdir -p public/textures
mkdir -p public/sounds
```

### 2. Configuration Files

#### tailwind.config.js - Add Glassmorphism Utilities
```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        'neon-blue': '#00D9FF',
        'neon-green': '#00FF94',
        'neon-purple': '#A855F7',
      },
      backdropBlur: {
        'glass': '20px',
      },
      boxShadow: {
        'glass': '0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
        'neon-blue': '0 0 20px rgba(0, 217, 255, 0.5), 0 0 40px rgba(0, 217, 255, 0.3)',
        'neon-green': '0 0 20px rgba(0, 255, 148, 0.5), 0 0 40px rgba(0, 255, 148, 0.3)',
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%, 100%': { opacity: 0.5 },
          '50%': { opacity: 1 },
        },
      },
    },
  },
}
```

## 🎬 Phase-by-Phase Implementation

---

## Phase 1: Foundation & Scene Setup (3-4 days)

### Step 1.1: Create Campus Store
**File**: `stores/campus-store.ts`

```typescript
import { create } from 'zustand';

interface CampusStore {
  // Camera
  cameraPosition: [number, number, number];
  cameraTarget: [number, number, number];
  
  // Avatar
  avatarPosition: [number, number, number];
  avatarRotation: number;
  isMoving: boolean;
  
  // Environment
  timeOfDay: number;
  weather: 'clear' | 'cloudy' | 'rainy';
  
  // Interactions
  selectedBuilding: string | null;
  nearbyBuildings: string[];
  
  // Actions
  setAvatarPosition: (pos: [number, number, number]) => void;
  setSelectedBuilding: (id: string | null) => void;
  setTimeOfDay: (time: number) => void;
}

export const useCampusStore = create<CampusStore>((set) => ({
  cameraPosition: [0, 500, 0],
  cameraTarget: [0, 0, 0],
  avatarPosition: [0, 0, 0],
  avatarRotation: 0,
  isMoving: false,
  timeOfDay: 12,
  weather: 'clear',
  selectedBuilding: null,
  nearbyBuildings: [],
  
  setAvatarPosition: (pos) => set({ avatarPosition: pos }),
  setSelectedBuilding: (id) => set({ selectedBuilding: id }),
  setTimeOfDay: (time) => set({ timeOfDay: time }),
}));
```

### Step 1.2: Campus Coordinate System
**File**: `lib/campus/coordinates.ts`

```typescript
import { Vector3 } from 'three';

// Real GPS bounds of SNS College
export const CAMPUS_BOUNDS = {
  center: { lat: 11.0510, lng: 76.9990 },
  northWest: { lat: 11.0530, lng: 76.9970 },
  southEast: { lat: 11.0490, lng: 77.0010 },
};

// Conversion factors
const LAT_TO_METERS = 111320; // meters per degree latitude
const LNG_TO_METERS = 111320 * Math.cos(CAMPUS_BOUNDS.center.lat * Math.PI / 180);

// 3D world scale (1 unit = 1 meter)
const WORLD_SCALE = 1;

export function gpsToWorld(lat: number, lng: number): Vector3 {
  const deltaLat = lat - CAMPUS_BOUNDS.center.lat;
  const deltaLng = lng - CAMPUS_BOUNDS.center.lng;
  
  const x = deltaLng * LNG_TO_METERS * WORLD_SCALE;
  const z = -deltaLat * LAT_TO_METERS * WORLD_SCALE; // Negative for proper orientation
  
  return new Vector3(x, 0, z);
}

export function worldToGps(position: Vector3): { lat: number; lng: number } {
  const lat = CAMPUS_BOUNDS.center.lat - (position.z / (LAT_TO_METERS * WORLD_SCALE));
  const lng = CAMPUS_BOUNDS.center.lng + (position.x / (LNG_TO_METERS * WORLD_SCALE));
  
  return { lat, lng };
}

export function isWithinCampus(lat: number, lng: number): boolean {
  return (
    lat >= CAMPUS_BOUNDS.southEast.lat &&
    lat <= CAMPUS_BOUNDS.northWest.lat &&
    lng >= CAMPUS_BOUNDS.northWest.lng &&
    lng <= CAMPUS_BOUNDS.southEast.lng
  );
}
```

### Step 1.3: Building Data
**File**: `lib/campus/buildings.ts`

```typescript
export interface Building {
  id: string;
  name: string;
  shortName: string;
  position: { x: number; y: number; z: number };
  rotation: number;
  type: 'academic' | 'hostel' | 'sports' | 'admin' | 'food' | 'medical';
  color: string;
  departments?: string[];
  timings?: { open: string; close: string };
  description: string;
}

export const BUILDINGS: Record<string, Building> = {
  FRONT_GATE: {
    id: 'front-gate',
    name: 'SNS College Main Entrance',
    shortName: 'Front Gate',
    position: { x: 0, y: 0, z: 0 },
    rotation: 0,
    type: 'admin',
    color: '#8B4513',
    description: 'Main entrance to SNS College campus',
  },
  
  INNOVATION_HUB: {
    id: 'innovation-hub',
    name: 'SNS iNNovation Hub',
    shortName: 'G-Block',
    position: { x: 250, y: 0, z: -50 },
    rotation: 0,
    type: 'academic',
    color: '#E91E63',
    departments: ['Innovation Lab', 'Startup Incubator', 'R&D'],
    timings: { open: '08:00', close: '20:00' },
    description: 'State-of-the-art innovation and research facility',
  },
  
  AI_CAMPUS_B: {
    id: 'ai-campus-b',
    name: 'SNSCT AI Campus B-Block',
    shortName: 'AI B-Block',
    position: { x: -180, y: 0, z: 120 },
    rotation: 0,
    type: 'academic',
    color: '#009688',
    departments: ['Artificial Intelligence', 'Machine Learning', 'Data Science'],
    timings: { open: '08:00', close: '18:00' },
    description: 'AI and ML dedicated academic block',
  },
  
  AI_CAMPUS_A: {
    id: 'ai-campus-a',
    name: 'SNSCT AI Campus A-Block',
    shortName: 'AI A-Block',
    position: { x: -80, y: 0, z: 120 },
    rotation: 0,
    type: 'academic',
    color: '#8BC34A',
    departments: ['Computer Vision', 'NLP', 'Robotics'],
    timings: { open: '08:00', close: '18:00' },
    description: 'Advanced AI research and teaching facility',
  },
  
  PHARMACY: {
    id: 'pharmacy',
    name: 'SNS College of Pharmacy and Health Sciences',
    shortName: 'Pharmacy College',
    position: { x: 120, y: 0, z: 80 },
    rotation: 0,
    type: 'medical',
    color: '#FF9800',
    departments: ['Pharmacy', 'Pharmaceutics', 'Pharmacology'],
    timings: { open: '08:00', close: '17:00' },
    description: 'Pharmacy and health sciences college',
  },
  
  NURSING: {
    id: 'nursing',
    name: 'SNS College of Nursing',
    shortName: 'Nursing',
    position: { x: -220, y: 0, z: -40 },
    rotation: 0,
    type: 'medical',
    color: '#E91E63',
    departments: ['Nursing', 'Healthcare'],
    timings: { open: '08:00', close: '17:00' },
    description: 'Professional nursing education center',
  },
  
  SPORTS_COMPLEX: {
    id: 'sports-complex',
    name: 'Athletic Track, Football & Sports Auditorium',
    shortName: 'Sports Complex',
    position: { x: -80, y: 0, z: 200 },
    rotation: 0,
    type: 'sports',
    color: '#F44336',
    departments: ['Athletics', 'Football', 'Indoor Sports'],
    timings: { open: '06:00', close: '20:00' },
    description: 'Multi-sport facility with track and auditorium',
  },
  
  FOOD_COURT: {
    id: 'food-court',
    name: 'Urban Space Food Court',
    shortName: 'Food Court',
    position: { x: 100, y: 0, z: 100 },
    rotation: 0,
    type: 'food',
    color: '#4CAF50',
    timings: { open: '07:00', close: '21:00' },
    description: 'Modern food court with multiple cuisines',
  },
  
  HOSTEL_GIRLS: {
    id: 'hostel-girls',
    name: 'Girls Hostel',
    shortName: 'Girls Hostel',
    position: { x: 150, y: 0, z: 160 },
    rotation: 0,
    type: 'hostel',
    color: '#9C27B0',
    description: 'Residential facility for female students',
  },
  
  HOSTEL_BOYS_G: {
    id: 'hostel-boys-g',
    name: 'Boys Hostel G-Block',
    shortName: 'Boys Hostel G',
    position: { x: -200, y: 0, z: 220 },
    rotation: 0,
    type: 'hostel',
    color: '#607D8B',
    description: 'Residential facility for male students',
  },
  
  ADMISSION: {
    id: 'admission',
    name: 'Admission Center X-Block',
    shortName: 'Admission',
    position: { x: -50, y: 0, z: -80 },
    rotation: 0,
    type: 'admin',
    color: '#3F51B5',
    timings: { open: '09:00', close: '17:00' },
    description: 'Student admission and registration office',
  },
  
  // Add more buildings based on the campus map...
};

export function getBuildingById(id: string): Building | undefined {
  return BUILDINGS[id];
}

export function getBuildingsByType(type: Building['type']): Building[] {
  return Object.values(BUILDINGS).filter(b => b.type === type);
}
```

### Step 1.4: Main Campus Scene
**File**: `components/campus/CampusScene.tsx`

```typescript
'use client';

import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';
import { CampusEnvironment } from './CampusEnvironment';
import { CampusTerrain } from './CampusTerrain';
import { CameraController } from './CameraController';
import { LoadingScreen } from '../UI/LoadingScreen';

export function CampusScene() {
  return (
    <div className="w-full h-screen">
      <Canvas
        shadows
        camera={{ position: [0, 500, 0], fov: 60 }}
        gl={{ antialias: true, alpha: false }}
      >
        <Suspense fallback={null}>
          <CameraController />
          <CampusEnvironment />
          <CampusTerrain />
          
          {/* Buildings will be added in Phase 2 */}
          {/* Avatar will be added in Phase 3 */}
          {/* Effects will be added in Phase 6 */}
        </Suspense>
      </Canvas>
      
      <LoadingScreen />
    </div>
  );
}
```

### Step 1.5: Environment & Lighting
**File**: `components/campus/CampusEnvironment.tsx`

```typescript
'use client';

import { Sky, Cloud } from '@react-three/drei';
import { useCampusStore } from '@/stores/campus-store';

export function CampusEnvironment() {
  const timeOfDay = useCampusStore(state => state.timeOfDay);
  
  // Calculate sun position based on time
  const sunAngle = (timeOfDay - 6) * 15; // 6am = 0°, 12pm = 90°, 6pm = 180°
  
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[100, 100, 50]}
        intensity={1.0}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={500}
        shadow-camera-left={-200}
        shadow-camera-right={200}
        shadow-camera-top={200}
        shadow-camera-bottom={-200}
      />
      <hemisphereLight args={['#87CEEB', '#5C4033', 0.3]} />
      
      {/* Sky */}
      <Sky
        sunPosition={[
          Math.cos(sunAngle * Math.PI / 180) * 100,
          Math.sin(sunAngle * Math.PI / 180) * 100,
          0
        ]}
        turbidity={8}
        rayleigh={2}
        mieCoefficient={0.005}
        mieDirectionalG={0.8}
      />
      
      {/* Clouds */}
      <Cloud
        opacity={0.3}
        speed={0.2}
        width={200}
        depth={20}
        segments={20}
        position={[0, 100, -200]}
      />
      
      <fog attach="fog" args={['#87CEEB', 100, 600]} />
    </>
  );
}
```

### Step 1.6: Terrain
**File**: `components/campus/CampusTerrain.tsx`

```typescript
'use client';

import { MeshReflectorMaterial } from '@react-three/drei';

export function CampusTerrain() {
  return (
    <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
      <planeGeometry args={[1000, 1000]} />
      <MeshReflectorMaterial
        color="#D2B48C"
        metalness={0.1}
        roughness={0.8}
        mirror={0.1}
      />
    </mesh>
  );
}
```

### Step 1.7: Camera Controller
**File**: `components/campus/CameraController.tsx`

```typescript
'use client';

import { useFrame, useThree } from '@react-three/fiber';
import { useRef, useEffect } from 'react';
import { Vector3 } from 'three';
import { useCampusStore } from '@/stores/campus-store';

export function CameraController() {
  const { camera } = useThree();
  const avatarPosition = useCampusStore(state => state.avatarPosition);
  const isIntroComplete = useRef(false);
  const introProgress = useRef(0);
  
  // Intro animation (satellite → ground)
  useEffect(() => {
    const startPos = new Vector3(0, 500, 0);
    const endPos = new Vector3(0, 10, -20);
    
    const animate = () => {
      if (introProgress.current < 1) {
        introProgress.current += 0.005;
        
        camera.position.lerpVectors(startPos, endPos, easeInOutCubic(introProgress.current));
        camera.lookAt(0, 0, 0);
        
        requestAnimationFrame(animate);
      } else {
        isIntroComplete.current = true;
      }
    };
    
    animate();
  }, [camera]);
  
  // Follow avatar (after intro)
  useFrame(() => {
    if (isIntroComplete.current) {
      const targetPos = new Vector3(
        avatarPosition[0],
        avatarPosition[1] + 10,
        avatarPosition[2] - 15
      );
      
      camera.position.lerp(targetPos, 0.1);
      camera.lookAt(avatarPosition[0], avatarPosition[1] + 2, avatarPosition[2]);
    }
  });
  
  return null;
}

function easeInOutCubic(t: number): number {
  return t < 0.5
    ? 4 * t * t * t
    : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
```

### Step 1.8: Loading Screen
**File**: `components/UI/LoadingScreen.tsx`

```typescript
'use client';

import { useProgress } from '@react-three/drei';
import { AnimatePresence, motion } from 'framer-motion';

export function LoadingScreen() {
  const { progress } = useProgress();
  const isLoaded = progress === 100;
  
  return (
    <AnimatePresence>
      {!isLoaded && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900"
        >
          <div className="text-center space-y-6">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="w-20 h-20 mx-auto border-4 border-neon-blue border-t-transparent rounded-full"
            />
            
            <h1 className="text-4xl font-bold text-white">SNS Campus</h1>
            <p className="text-neon-blue text-xl">Loading 3D World...</p>
            
            <div className="w-64 h-2 bg-white/20 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-neon-blue to-neon-green"
                style={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            
            <p className="text-white/70 text-sm">{Math.round(progress)}%</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

### Step 1.9: Main Page
**File**: `app/campus-3d/page.tsx`

```typescript
'use client';

import dynamic from 'next/dynamic';
import { CampusHUD } from '@/components/campus/UI/CampusHUD';

// Dynamically import to avoid SSR issues with Three.js
const CampusScene = dynamic(
  () => import('@/components/campus/CampusScene').then(mod => mod.CampusScene),
  { ssr: false }
);

export default function Campus3DPage() {
  return (
    <main className="relative w-full h-screen overflow-hidden bg-black">
      <CampusScene />
      <CampusHUD />
    </main>
  );
}
```

---

## Phase 2: Buildings (4-5 days)

### Step 2.1: Simple Building Component
**File**: `components/campus/Buildings/SimpleBuild.tsx`

```typescript
'use client';

import { useRef, useState } from 'react';
import { Mesh } from 'three';
import { Building } from '@/lib/campus/buildings';
import { useCampusStore } from '@/stores/campus-store';

interface SimpleBuildingProps {
  building: Building;
}

export function SimpleBuilding({ building }: SimpleBuildingProps) {
  const meshRef = useRef<Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const setSelectedBuilding = useCampusStore(state => state.setSelectedBuilding);
  
  const handleClick = () => {
    setSelectedBuilding(building.id);
  };
  
  return (
    <group position={[building.position.x, building.position.y, building.position.z]}>
      {/* Main building box */}
      <mesh
        ref={meshRef}
        castShadow
        receiveShadow
        onClick={handleClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <boxGeometry args={[20, 15, 20]} />
        <meshStandardMaterial
          color={hovered ? '#FFFFFF' : building.color}
          emissive={hovered ? building.color : '#000000'}
          emissiveIntensity={hovered ? 0.5 : 0}
        />
      </mesh>
      
      {/* Building label */}
      {hovered && (
        <Billboard position={[0, 20, 0]}>
          <div className="bg-black/80 text-white px-3 py-1 rounded-lg text-sm">
            {building.shortName}
          </div>
        </Billboard>
      )}
    </group>
  );
}
```

### Step 2.2: Render All Buildings
**File**: `components/campus/AllBuildings.tsx`

```typescript
'use client';

import { BUILDINGS } from '@/lib/campus/buildings';
import { SimpleBuilding } from './Buildings/SimpleBuilding';

export function AllBuildings() {
  return (
    <group>
      {Object.values(BUILDINGS).map(building => (
        <SimpleBuilding key={building.id} building={building} />
      ))}
    </group>
  );
}
```

---

## Phase 3: Avatar & Movement (4-5 days)

*[Implementation details for avatar system, animation controller, and movement logic]*

---

## Phase 4: Events & Markers (3-4 days)

*[Implementation details for event markers and particle systems]*

---

## Phase 5: UI/HUD (4-5 days)

*[Implementation details for glassmorphism UI components]*

---

## Phase 6: Effects & Polish (5-6 days)

*[Implementation details for day/night cycle, weather, and post-processing]*

---

## 🚀 Next Steps

1. **Install dependencies** from the list above
2. **Create directory structure**
3. **Implement Phase 1** (Foundation)
4. **Test the basic scene** with camera intro animation
5. **Add buildings** in Phase 2
6. **Continue with remaining phases**

---

## 📚 Resources

- [Three.js Documentation](https://threejs.org/docs/)
- [React Three Fiber](https://docs.pmnd.rs/react-three-fiber)
- [Drei Helpers](https://github.com/pmndrs/drei)
- [Blender for 3D Models](https://www.blender.org/)
- [Mixamo for Character Animation](https://www.mixamo.com/)
- [Pokémon GO UI Reference](https://www.youtube.com/watch?v=example)

---

**Start with Phase 1 and iterate from there!** 🎮
