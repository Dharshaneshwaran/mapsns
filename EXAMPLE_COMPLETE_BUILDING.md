# Complete Building Implementation Example

This document shows a full end-to-end example of implementing a single building with all features: 3D model, interactions, info card, events, and navigation.

---

## 🏢 Example: Innovation Hub (G-Block)

Let's implement the **SNS iNNovation Hub** as a complete, interactive building.

---

## Step 1: Add Building Data

### File: `lib/campus/buildings.ts`

```typescript
export interface Building {
  id: string;
  name: string;
  shortName: string;
  position: { x: number; y: number; z: number };
  rotation: number;
  type: 'academic' | 'hostel' | 'sports' | 'admin' | 'food' | 'medical';
  color: string;
  dimensions: { width: number; height: number; depth: number };
  departments: string[];
  timings: { open: string; close: string };
  description: string;
  imageUrl?: string;
  facilities: string[];
  floors: number;
  capacity: number;
  contact?: {
    phone?: string;
    email?: string;
  };
}

export const INNOVATION_HUB: Building = {
  id: 'innovation-hub',
  name: 'SNS iNNovation Hub',
  shortName: 'G-Block',
  position: { x: 250, y: 0, z: -50 },
  rotation: 0,
  type: 'academic',
  color: '#E91E63', // Pink
  dimensions: { width: 40, height: 25, depth: 30 },
  departments: [
    'Innovation Lab',
    'Startup Incubator',
    'R&D Center',
    'Makerspace',
    'AI Research Lab'
  ],
  timings: { open: '08:00', close: '20:00' },
  description: 'State-of-the-art innovation and research facility fostering entrepreneurship and cutting-edge technology development.',
  imageUrl: '/images/buildings/innovation-hub.jpg',
  facilities: [
    '3D Printing Lab',
    'IoT Workshop',
    'Meeting Rooms',
    'Cafeteria',
    'Co-working Space'
  ],
  floors: 5,
  capacity: 500,
  contact: {
    phone: '+91 422 2500000',
    email: 'innovation@sns.edu.in'
  }
};
```

---

## Step 2: Create Building Component

### File: `components/campus/Buildings/InnovationHub.tsx`

```typescript
'use client';

import { useRef, useState } from 'react';
import { Group, Mesh } from 'three';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { useCampusStore } from '@/stores/campus-store';
import { Building } from '@/lib/campus/buildings';

interface InnovationHubProps {
  building: Building;
}

export function InnovationHub({ building }: InnovationHubProps) {
  const groupRef = useRef<Group>(null);
  const meshRef = useRef<Mesh>(null);
  const [hovered, setHovered] = useState(false);
  
  const avatarPosition = useCampusStore(state => state.avatarPosition);
  const setSelectedBuilding = useCampusStore(state => state.setSelectedBuilding);
  
  // Calculate distance from avatar
  const distance = Math.sqrt(
    Math.pow(avatarPosition[0] - building.position.x, 2) +
    Math.pow(avatarPosition[2] - building.position.z, 2)
  );
  
  const isNearby = distance < 30; // Within 30 units
  
  // Glow effect when nearby
  useFrame((state) => {
    if (meshRef.current) {
      if (isNearby) {
        meshRef.current.material.emissiveIntensity = 
          0.3 + Math.sin(state.clock.elapsedTime * 2) * 0.2;
      } else {
        meshRef.current.material.emissiveIntensity = 0;
      }
    }
  });
  
  const handleClick = () => {
    setSelectedBuilding(building.id);
  };
  
  return (
    <group
      ref={groupRef}
      position={[building.position.x, building.position.y, building.position.z]}
      rotation={[0, building.rotation, 0]}
    >
      {/* Main Building Structure */}
      <mesh
        ref={meshRef}
        castShadow
        receiveShadow
        onClick={handleClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <boxGeometry 
          args={[
            building.dimensions.width, 
            building.dimensions.height, 
            building.dimensions.depth
          ]} 
        />
        <meshStandardMaterial
          color={hovered ? '#FFFFFF' : building.color}
          emissive={building.color}
          emissiveIntensity={isNearby ? 0.3 : 0}
          metalness={0.3}
          roughness={0.7}
        />
      </mesh>
      
      {/* Roof */}
      <mesh position={[0, building.dimensions.height / 2 + 1, 0]} castShadow>
        <boxGeometry args={[
          building.dimensions.width + 2, 
          2, 
          building.dimensions.depth + 2
        ]} />
        <meshStandardMaterial color="#333333" />
      </mesh>
      
      {/* Windows (simple grid) */}
      {Array.from({ length: building.floors }).map((_, floor) => (
        <group key={floor} position={[0, -10 + floor * 5, 0]}>
          {/* Front windows */}
          {Array.from({ length: 6 }).map((_, i) => (
            <mesh
              key={`front-${i}`}
              position={[-15 + i * 6, 0, building.dimensions.depth / 2 + 0.1]}
            >
              <planeGeometry args={[2, 2]} />
              <meshStandardMaterial 
                color="#87CEEB" 
                emissive="#87CEEB" 
                emissiveIntensity={0.5}
              />
            </mesh>
          ))}
          
          {/* Side windows */}
          {Array.from({ length: 4 }).map((_, i) => (
            <mesh
              key={`side-${i}`}
              position={[building.dimensions.width / 2 + 0.1, 0, -10 + i * 7]}
              rotation={[0, Math.PI / 2, 0]}
            >
              <planeGeometry args={[2, 2]} />
              <meshStandardMaterial 
                color="#87CEEB" 
                emissive="#87CEEB" 
                emissiveIntensity={0.5}
              />
            </mesh>
          ))}
        </group>
      ))}
      
      {/* Entrance */}
      <mesh position={[0, -10, building.dimensions.depth / 2 + 0.2]} castShadow>
        <boxGeometry args={[6, 8, 1]} />
        <meshStandardMaterial color="#654321" />
      </mesh>
      
      {/* Door */}
      <mesh position={[0, -11, building.dimensions.depth / 2 + 0.8]}>
        <boxGeometry args={[4, 6, 0.2]} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>
      
      {/* Glow Ring (when nearby) */}
      {isNearby && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -11.9, 0]}>
          <ringGeometry args={[
            Math.max(building.dimensions.width, building.dimensions.depth) / 2 + 2,
            Math.max(building.dimensions.width, building.dimensions.depth) / 2 + 4,
            32
          ]} />
          <meshBasicMaterial 
            color={building.color} 
            transparent 
            opacity={0.3}
          />
        </mesh>
      )}
      
      {/* Floating Label */}
      {(hovered || isNearby) && (
        <Html
          position={[0, building.dimensions.height / 2 + 5, 0]}
          center
          distanceFactor={15}
        >
          <div className="bg-black/90 text-white px-4 py-2 rounded-xl backdrop-blur-md border border-white/20 whitespace-nowrap shadow-lg">
            <h3 className="font-bold text-lg">{building.shortName}</h3>
            {isNearby && (
              <p className="text-sm text-neon-blue">
                Click to view details
              </p>
            )}
          </div>
        </Html>
      )}
    </group>
  );
}
```

---

## Step 3: Create Info Card Component

### File: `components/campus/UI/BuildingInfoCard.tsx`

```typescript
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Building2, Clock, Users, Phone, Mail, 
  MapPin, Calendar, Heart, Share2, Navigation 
} from 'lucide-react';
import { useCampusStore } from '@/stores/campus-store';
import { Building } from '@/lib/campus/buildings';
import { useState } from 'react';

interface BuildingInfoCardProps {
  building: Building;
  events?: Array<{
    id: string;
    title: string;
    time: string;
    type: string;
  }>;
}

export function BuildingInfoCard({ building, events = [] }: BuildingInfoCardProps) {
  const [isFavorite, setIsFavorite] = useState(false);
  const setSelectedBuilding = useCampusStore(state => state.setSelectedBuilding);
  
  const handleClose = () => {
    setSelectedBuilding(null);
  };
  
  const handleNavigate = () => {
    // Navigate to building
    console.log('Navigate to', building.id);
  };
  
  const handleShare = () => {
    // Share building
    if (navigator.share) {
      navigator.share({
        title: building.name,
        text: building.description,
        url: window.location.href
      });
    }
  };
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 100 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 100 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed right-6 top-1/4 w-96 max-w-[90vw] max-h-[70vh] overflow-y-auto z-50"
      >
        <div className="glass-floating space-y-4 p-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white mb-1">
                {building.name}
              </h2>
              <p className="text-neon-blue text-sm flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                {building.shortName}
              </p>
            </div>
            <button
              onClick={handleClose}
              className="text-white/70 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          {/* Image */}
          {building.imageUrl && (
            <div className="w-full h-40 rounded-2xl overflow-hidden bg-black/30">
              <img 
                src={building.imageUrl} 
                alt={building.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          {/* Description */}
          <p className="text-white/80 text-sm leading-relaxed">
            {building.description}
          </p>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="glass-card p-3 text-center">
              <Building2 className="w-5 h-5 text-neon-blue mx-auto mb-1" />
              <p className="text-white text-xs">{building.floors} Floors</p>
            </div>
            <div className="glass-card p-3 text-center">
              <Users className="w-5 h-5 text-neon-green mx-auto mb-1" />
              <p className="text-white text-xs">{building.capacity} Capacity</p>
            </div>
          </div>
          
          {/* Departments */}
          {building.departments.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <Building2 className="w-4 h-4 text-neon-blue" />
                Departments
              </h3>
              <div className="flex flex-wrap gap-2">
                {building.departments.map(dept => (
                  <span
                    key={dept}
                    className="px-3 py-1 bg-neon-blue/20 text-neon-blue text-xs rounded-full border border-neon-blue/30"
                  >
                    {dept}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {/* Timings */}
          {building.timings && (
            <div className="glass-card p-3">
              <h3 className="text-white font-semibold flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-neon-green" />
                Operating Hours
              </h3>
              <p className="text-white/70 text-sm">
                {building.timings.open} - {building.timings.close}
              </p>
            </div>
          )}
          
          {/* Facilities */}
          {building.facilities && building.facilities.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-white font-semibold">Facilities</h3>
              <ul className="space-y-1">
                {building.facilities.map(facility => (
                  <li key={facility} className="text-white/70 text-sm flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-neon-blue" />
                    {facility}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Today's Events */}
          {events.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <Calendar className="w-4 h-4 text-neon-purple" />
                Today's Events
              </h3>
              <div className="space-y-2">
                {events.map(event => (
                  <div key={event.id} className="glass-card p-3">
                    <h4 className="text-white font-medium text-sm">{event.title}</h4>
                    <p className="text-white/60 text-xs">{event.time}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Contact */}
          {building.contact && (
            <div className="glass-card p-3 space-y-2">
              <h3 className="text-white font-semibold">Contact</h3>
              {building.contact.phone && (
                <a 
                  href={`tel:${building.contact.phone}`}
                  className="flex items-center gap-2 text-white/70 hover:text-neon-blue text-sm transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  {building.contact.phone}
                </a>
              )}
              {building.contact.email && (
                <a 
                  href={`mailto:${building.contact.email}`}
                  className="flex items-center gap-2 text-white/70 hover:text-neon-blue text-sm transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  {building.contact.email}
                </a>
              )}
            </div>
          )}
          
          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleNavigate}
              className="flex-1 bg-gradient-to-r from-neon-blue to-neon-green text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 shadow-neon-blue"
            >
              <Navigation className="w-5 h-5" />
              Navigate Here
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsFavorite(!isFavorite)}
              className={`px-4 rounded-xl transition-colors ${
                isFavorite 
                  ? 'bg-neon-red text-white' 
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
            >
              <Heart className="w-5 h-5" fill={isFavorite ? 'currentColor' : 'none'} />
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleShare}
              className="px-4 bg-white/10 text-white/70 hover:bg-white/20 rounded-xl transition-colors"
            >
              <Share2 className="w-5 h-5" />
            </motion.button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
```

---

## Step 4: Add Event Markers

### File: `components/campus/Interactions/EventMarker3D.tsx`

```typescript
'use client';

import { useRef } from 'react';
import { Group } from 'three';
import { useFrame } from '@react-three/fiber';
import { Html, Billboard } from '@react-three/drei';

interface Event {
  id: string;
  title: string;
  category: 'WORKSHOP' | 'HACKATHON' | 'SPORTS' | 'CULTURAL' | 'PLACEMENT' | 'EMERGENCY';
  position: { x: number; y: number; z: number };
}

const EVENT_CONFIG = {
  WORKSHOP: { icon: '🔬', color: '#3B82F6', height: 8 },
  HACKATHON: { icon: '⚡', color: '#A855F7', height: 10 },
  SPORTS: { icon: '🏆', color: '#10B981', height: 7 },
  CULTURAL: { icon: '🎵', color: '#FB923C', height: 9 },
  PLACEMENT: { icon: '💼', color: '#FCD34D', height: 8 },
  EMERGENCY: { icon: '🚨', color: '#EF4444', height: 12 }
};

export function EventMarker3D({ event }: { event: Event }) {
  const groupRef = useRef<Group>(null);
  const config = EVENT_CONFIG[event.category];
  
  // Floating animation
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.position.y = 
        event.position.y + config.height + Math.sin(state.clock.elapsedTime * 2) * 0.5;
    }
  });
  
  return (
    <group
      ref={groupRef}
      position={[event.position.x, event.position.y + config.height, event.position.z]}
    >
      {/* Background Circle */}
      <Billboard>
        <mesh>
          <circleGeometry args={[1.5, 32]} />
          <meshBasicMaterial color={config.color} opacity={0.9} transparent />
        </mesh>
      </Billboard>
      
      {/* Icon */}
      <Html center distanceFactor={10}>
        <div className="text-4xl animate-float pointer-events-none">
          {config.icon}
        </div>
      </Html>
      
      {/* Glow Ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2, 3, 32]} />
        <meshBasicMaterial 
          color={config.color} 
          transparent 
          opacity={0.2}
        />
      </mesh>
      
      {/* Particle Ring */}
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (i / 12) * Math.PI * 2;
        const radius = 2.5;
        return (
          <mesh
            key={i}
            position={[
              Math.cos(angle + Date.now() * 0.001) * radius,
              0,
              Math.sin(angle + Date.now() * 0.001) * radius
            ]}
          >
            <sphereGeometry args={[0.1, 8, 8]} />
            <meshBasicMaterial color={config.color} />
          </mesh>
        );
      })}
    </group>
  );
}
```

---

## Step 5: Integrate Everything

### File: `components/campus/CampusScene.tsx` (Updated)

```typescript
'use client';

import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';
import { OrbitControls } from '@react-three/drei';
import { CampusEnvironment } from './CampusEnvironment';
import { CampusTerrain } from './CampusTerrain';
import { InnovationHub } from './Buildings/InnovationHub';
import { EventMarker3D } from './Interactions/EventMarker3D';
import { BuildingInfoCard } from './UI/BuildingInfoCard';
import { LoadingScreen } from '../UI/LoadingScreen';
import { useCampusStore } from '@/stores/campus-store';
import { INNOVATION_HUB } from '@/lib/campus/buildings';

// Example events
const EVENTS = [
  {
    id: 'event-1',
    title: 'AI Workshop',
    category: 'WORKSHOP' as const,
    position: { x: 250, y: 0, z: -50 },
    time: '2:00 PM - 4:00 PM'
  },
  {
    id: 'event-2',
    title: 'Startup Pitch',
    category: 'PLACEMENT' as const,
    position: { x: 250, y: 0, z: -50 },
    time: '5:00 PM - 6:00 PM'
  }
];

export function CampusScene() {
  const selectedBuilding = useCampusStore(state => state.selectedBuilding);
  
  return (
    <>
      <div className="w-full h-screen">
        <Canvas
          shadows
          camera={{ position: [0, 50, 100], fov: 60 }}
        >
          <Suspense fallback={null}>
            <OrbitControls />
            <CampusEnvironment />
            <CampusTerrain />
            
            {/* Building */}
            <InnovationHub building={INNOVATION_HUB} />
            
            {/* Event Markers */}
            {EVENTS.map(event => (
              <EventMarker3D key={event.id} event={event} />
            ))}
          </Suspense>
        </Canvas>
        
        <LoadingScreen />
      </div>
      
      {/* Building Info Card */}
      {selectedBuilding === 'innovation-hub' && (
        <BuildingInfoCard 
          building={INNOVATION_HUB}
          events={EVENTS.map(e => ({
            id: e.id,
            title: e.title,
            time: e.time,
            type: e.category
          }))}
        />
      )}
    </>
  );
}
```

---

## 🎯 What You Now Have

✅ **Complete 3D Building** with:
- Main structure
- Roof and windows
- Entrance and door
- Glow effect when nearby
- Floating label

✅ **Interactive Info Card** with:
- Building details
- Departments and facilities
- Operating hours
- Today's events
- Contact information
- Navigate, favorite, and share actions

✅ **Event Markers** with:
- 3D floating icons
- Color-coded categories
- Bobbing animation
- Particle effects
- Glow rings

✅ **Full Integration** with:
- State management
- Click interactions
- Proximity detection
- Smooth animations

---

## 🚀 Next Steps

1. **Repeat for all buildings** from campus map
2. **Add navigation system** to draw path
3. **Add avatar** that walks to building
4. **Connect real event data** from backend API
5. **Add more interactions** (favorites, history, etc.)

---

**You now have a complete template for implementing any building with all features!** 🏢✨
