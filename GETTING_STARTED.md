# Getting Started - 3D Campus Map Implementation

## 🚀 Quick Start (15 minutes to see results!)

This guide will help you set up the foundation and see your first 3D scene running.

---

## 📋 Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Code editor (VS Code recommended)
- Basic knowledge of React/Next.js
- Basic knowledge of Three.js (helpful but not required)

---

## 🛠️ Step 1: Install Dependencies (3 minutes)

Navigate to your frontend directory and install the required packages:

```bash
cd frontend

# Core 3D libraries
npm install three @types/three
npm install @react-three/fiber @react-three/drei @react-three/rapier @react-three/postprocessing

# State management
npm install zustand

# Animations
npm install framer-motion

# Map utilities
npm install mapbox-gl @types/mapbox-gl geolib

# UI utilities
npm install lucide-react class-variance-authority tailwind-merge clsx

# Dev tools
npm install -D gltf-pipeline
```

**Alternative (using package.json)**:
Add these to your `package.json` dependencies and run `npm install`:

```json
{
  "dependencies": {
    "three": "^0.160.0",
    "@react-three/fiber": "^8.15.0",
    "@react-three/drei": "^9.95.0",
    "@react-three/rapier": "^1.2.0",
    "@react-three/postprocessing": "^2.16.0",
    "zustand": "^4.5.0",
    "framer-motion": "^11.0.0",
    "mapbox-gl": "^3.1.0",
    "geolib": "^3.3.4",
    "lucide-react": "^0.344.0",
    "class-variance-authority": "^0.7.0",
    "tailwind-merge": "^2.2.0",
    "clsx": "^2.1.0"
  },
  "devDependencies": {
    "@types/three": "^0.160.0",
    "@types/mapbox-gl": "^3.1.0",
    "gltf-pipeline": "^4.1.0"
  }
}
```

---

## 📁 Step 2: Create Directory Structure (2 minutes)

Run these commands in your frontend directory:

```bash
# Windows Command Prompt
mkdir components\campus
mkdir components\campus\Buildings
mkdir components\campus\Character
mkdir components\campus\Effects
mkdir components\campus\Interactions
mkdir components\campus\UI
mkdir hooks\campus
mkdir lib\campus
mkdir stores
mkdir app\campus-3d
mkdir public\models
mkdir public\models\buildings
mkdir public\models\characters
mkdir public\models\environment
mkdir public\textures
mkdir public\sounds
```

---

## 🎨 Step 3: Update Tailwind Config (1 minute)

Add glassmorphism utilities to your `tailwind.config.ts`:

```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'neon-blue': '#00D9FF',
        'neon-green': '#00FF94',
        'neon-purple': '#A855F7',
        'neon-orange': '#FB923C',
        'neon-gold': '#FCD34D',
        'neon-red': '#EF4444',
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
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
```

Add glass card styles to your `app/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer components {
  .glass-card {
    @apply bg-white/10 backdrop-blur-[20px] rounded-3xl border border-white/20 shadow-glass;
  }
  
  .glass-dark {
    @apply bg-black/30 backdrop-blur-[20px] rounded-3xl border border-white/10;
  }
  
  .glass-floating {
    @apply bg-white/12 backdrop-blur-[30px] rounded-3xl border border-white/20;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3), inset 0 2px 0 rgba(255, 255, 255, 0.4);
  }
}
```

---

## 🏪 Step 4: Create Campus Store (2 minutes)

Create `stores/campus-store.ts`:

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
  timeOfDay: number; // 0-24
  weather: 'clear' | 'cloudy' | 'rainy';
  
  // Interactions
  selectedBuilding: string | null;
  nearbyBuildings: string[];
  
  // UI
  showMiniMap: boolean;
  showCompass: boolean;
  
  // Actions
  setAvatarPosition: (pos: [number, number, number]) => void;
  setAvatarRotation: (rotation: number) => void;
  setIsMoving: (moving: boolean) => void;
  setSelectedBuilding: (id: string | null) => void;
  setTimeOfDay: (time: number) => void;
  setWeather: (weather: 'clear' | 'cloudy' | 'rainy') => void;
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
  showMiniMap: true,
  showCompass: true,
  
  setAvatarPosition: (pos) => set({ avatarPosition: pos }),
  setAvatarRotation: (rotation) => set({ avatarRotation: rotation }),
  setIsMoving: (moving) => set({ isMoving: moving }),
  setSelectedBuilding: (id) => set({ selectedBuilding: id }),
  setTimeOfDay: (time) => set({ timeOfDay: time }),
  setWeather: (weather) => set({ weather: weather }),
}));
```

---

## 🗺️ Step 5: Create Basic Building Data (2 minutes)

Create `lib/campus/buildings.ts`:

```typescript
export interface Building {
  id: string;
  name: string;
  shortName: string;
  position: { x: number; y: number; z: number };
  rotation: number;
  type: 'academic' | 'hostel' | 'sports' | 'admin' | 'food' | 'medical';
  color: string;
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
    position: { x: 50, y: 0, z: -20 },
    rotation: 0,
    type: 'academic',
    color: '#E91E63',
    description: 'Innovation and research facility',
  },
  
  AI_CAMPUS_B: {
    id: 'ai-campus-b',
    name: 'SNSCT AI Campus B-Block',
    shortName: 'AI B-Block',
    position: { x: -40, y: 0, z: 30 },
    rotation: 0,
    type: 'academic',
    color: '#009688',
    description: 'AI and ML academic block',
  },
  
  FOOD_COURT: {
    id: 'food-court',
    name: 'Urban Space Food Court',
    shortName: 'Food Court',
    position: { x: 30, y: 0, z: 25 },
    rotation: 0,
    type: 'food',
    color: '#4CAF50',
    description: 'Modern food court',
  },
};
```

---

## 🎬 Step 6: Create Basic 3D Components (3 minutes)

### Loading Screen
Create `components/UI/LoadingScreen.tsx`:

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
            
            <h1 className="text-4xl font-bold text-white">SNS Campus 3D</h1>
            <p className="text-neon-blue text-xl">Loading World...</p>
            
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

### Terrain
Create `components/campus/CampusTerrain.tsx`:

```typescript
'use client';

export function CampusTerrain() {
  return (
    <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
      <planeGeometry args={[200, 200]} />
      <meshStandardMaterial color="#D2B48C" roughness={0.8} />
    </mesh>
  );
}
```

### Environment
Create `components/campus/CampusEnvironment.tsx`:

```typescript
'use client';

import { Sky } from '@react-three/drei';

export function CampusEnvironment() {
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight
        position={[50, 50, 25]}
        intensity={1.0}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      
      {/* Sky */}
      <Sky sunPosition={[100, 20, 100]} />
      
      {/* Fog */}
      <fog attach="fog" args={['#87CEEB', 50, 300]} />
    </>
  );
}
```

### Simple Building
Create `components/campus/Buildings/SimpleBuilding.tsx`:

```typescript
'use client';

import { useRef, useState } from 'react';
import { Mesh } from 'three';
import { Building } from '@/lib/campus/buildings';
import { Html } from '@react-three/drei';

interface SimpleBuildingProps {
  building: Building;
}

export function SimpleBuilding({ building }: SimpleBuildingProps) {
  const meshRef = useRef<Mesh>(null);
  const [hovered, setHovered] = useState(false);
  
  return (
    <group position={[building.position.x, building.position.y, building.position.z]}>
      <mesh
        ref={meshRef}
        castShadow
        receiveShadow
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <boxGeometry args={[8, 6, 8]} />
        <meshStandardMaterial
          color={hovered ? '#FFFFFF' : building.color}
          emissive={hovered ? building.color : '#000000'}
          emissiveIntensity={hovered ? 0.5 : 0}
        />
      </mesh>
      
      {hovered && (
        <Html position={[0, 8, 0]} center>
          <div className="bg-black/80 text-white px-3 py-1 rounded-lg text-sm whitespace-nowrap">
            {building.shortName}
          </div>
        </Html>
      )}
    </group>
  );
}
```

### All Buildings
Create `components/campus/AllBuildings.tsx`:

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

### Main Scene
Create `components/campus/CampusScene.tsx`:

```typescript
'use client';

import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';
import { OrbitControls } from '@react-three/drei';
import { CampusEnvironment } from './CampusEnvironment';
import { CampusTerrain } from './CampusTerrain';
import { AllBuildings } from './AllBuildings';
import { LoadingScreen } from '../UI/LoadingScreen';

export function CampusScene() {
  return (
    <div className="w-full h-screen">
      <Canvas
        shadows
        camera={{ position: [0, 50, 80], fov: 60 }}
      >
        <Suspense fallback={null}>
          {/* Temporary orbit controls for testing */}
          <OrbitControls
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            maxPolarAngle={Math.PI / 2}
          />
          
          <CampusEnvironment />
          <CampusTerrain />
          <AllBuildings />
        </Suspense>
      </Canvas>
      
      <LoadingScreen />
    </div>
  );
}
```

---

## 📄 Step 7: Create Main Page (1 minute)

Create `app/campus-3d/page.tsx`:

```typescript
'use client';

import dynamic from 'next/dynamic';

const CampusScene = dynamic(
  () => import('@/components/campus/CampusScene').then(mod => mod.CampusScene),
  { ssr: false }
);

export default function Campus3DPage() {
  return (
    <main className="relative w-full h-screen overflow-hidden bg-black">
      <CampusScene />
      
      {/* Temporary UI overlay */}
      <div className="fixed top-4 left-4 glass-card p-4 z-10">
        <h1 className="text-white text-xl font-bold">SNS Campus 3D</h1>
        <p className="text-white/70 text-sm">Use mouse to navigate</p>
      </div>
    </main>
  );
}
```

---

## 🚀 Step 8: Run Your App! (1 minute)

```bash
npm run dev
```

Open your browser to `http://localhost:3000/campus-3d`

You should see:
- ✅ A 3D campus scene
- ✅ Blue sky with sun
- ✅ Tan ground plane
- ✅ 4 colored building boxes
- ✅ Building labels on hover
- ✅ Mouse controls (drag to rotate, scroll to zoom)

---

## 🎯 What You've Built

Congratulations! You now have:

1. ✅ **Basic 3D Scene**: Three.js rendering with React Three Fiber
2. ✅ **Campus Buildings**: Simple box representations of 4 buildings
3. ✅ **Environment**: Sky, lighting, and fog
4. ✅ **Interactions**: Hover effects and labels
5. ✅ **Glassmorphism UI**: Loading screen with modern glass effect
6. ✅ **State Management**: Zustand store ready for expansion

---

## 🔧 Troubleshooting

### Issue: Black screen or errors
**Solution**: Check browser console for errors. Make sure all dependencies are installed.

### Issue: "Module not found" errors
**Solution**: Run `npm install` again and restart dev server.

### Issue: Performance issues
**Solution**: Lower the plane geometry size in `CampusTerrain.tsx` (try [100, 100] instead of [200, 200]).

### Issue: TypeScript errors
**Solution**: Make sure `@types/three` is installed and restart VS Code.

---

## 📚 Next Steps

Now that you have the foundation working, you can:

1. **Add More Buildings**: Edit `lib/campus/buildings.ts` to add all campus buildings from the map
2. **Improve Building Models**: Replace boxes with better 3D models
3. **Add Avatar**: Implement character movement system
4. **Add Camera Animation**: Replace OrbitControls with cinematic intro
5. **Add UI Components**: Build the HUD elements (minimap, navigation, etc.)
6. **Add Events**: Implement event markers above buildings
7. **Add NPCs**: Create walking student characters
8. **Add Effects**: Particles, day/night cycle, weather

Refer to:
- `IMPLEMENTATION_ROADMAP.md` for detailed phase-by-phase implementation
- `UI_DESIGN_SYSTEM.md` for UI component specifications
- `DESIGN_SPEC.md` for complete feature documentation

---

## 🎓 Learning Resources

- [React Three Fiber Docs](https://docs.pmnd.rs/react-three-fiber)
- [Drei Helpers](https://github.com/pmndrs/drei#readme)
- [Three.js Journey](https://threejs-journey.com/) (Excellent paid course)
- [Three.js Examples](https://threejs.org/examples/)

---

## 💡 Pro Tips

1. **Use Browser DevTools**: Press F12 → Console to debug
2. **Install React DevTools**: Helps debug component hierarchy
3. **Use Leva for Controls**: Install `leva` package for real-time value tweaking
4. **Performance Monitor**: Add `<Stats />` from drei for FPS counter
5. **Git Commits**: Commit after each working feature

---

**You're ready to build an amazing 3D campus experience! 🚀**
