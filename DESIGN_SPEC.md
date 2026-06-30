# SNS College 3D Interactive Campus Map - Design Specification

## 🎮 Project Overview
A 3D Pokémon GO-inspired interactive campus navigation application for SNS College with real-time location tracking, animated avatars, interactive buildings, and event markers.

## 🎨 Visual Style
- **Aesthetic**: Modern semi-realistic low-poly with vibrant colors
- **Art Direction**: Pokémon GO + Genshin Impact + Apple VisionOS
- **Color Palette**: 
  - Primary: Neon Blue (#00D9FF)
  - Secondary: Neon Green (#00FF94)
  - Accent: Purple (#A855F7), Orange (#FB923C), Gold (#FCD34D)
  - Background: Warm earth tones matching campus map

## 🏗️ Technical Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **3D Engine**: Three.js + React Three Fiber (@react-three/fiber)
- **3D Helpers**: @react-three/drei (controls, loaders, effects)
- **Physics**: @react-three/rapier (for collision detection)
- **Character Animation**: @react-three/gltf or mixamo animations
- **UI Components**: Framer Motion for animations
- **Styling**: Tailwind CSS with custom glassmorphism utilities
- **Maps**: Mapbox GL JS (for minimap) or custom 2D canvas
- **State Management**: Zustand
- **Location**: Geolocation API + custom campus coordinate mapping

### 3D Assets
- **Building Models**: Low-poly custom models (Blender export to GLTF)
- **Character Avatar**: Rigged humanoid model with animations
- **Environment**: Trees, benches, roads, decorative elements
- **Effects**: Particle systems, glowing shaders, weather effects

## 📐 Architecture

### 1. Campus Coordinate System
```typescript
// Map real GPS coordinates to 3D world space
const CAMPUS_BOUNDS = {
  center: { lat: 11.0510, lng: 76.9990 }, // SNS Front Gate
  northWest: { lat: 11.0520, lng: 76.9980 },
  southEast: { lat: 11.0500, lng: 77.0000 }
};

// Building locations from campus map
const BUILDINGS = {
  FRONT_GATE: { x: 0, z: 0, label: "Main Entrance" },
  INNOVATION_HUB: { x: 250, z: -50, label: "SNS iNNovation Hub G-Block" },
  AI_CAMPUS_B: { x: -180, z: 120, label: "SNSCT AI Campus B-Block" },
  AI_CAMPUS_A: { x: -80, z: 120, label: "SNSCT AI Campus A-Block" },
  PHARMACY: { x: 120, z: 80, label: "SNS College of Pharmacy" },
  NURSING: { x: -220, z: -40, label: "SNS College of Nursing" },
  SPORTS_COMPLEX: { x: -80, z: 200, label: "Athletic Track & Sports" },
  LIBRARY: { x: -120, z: 100, label: "Central Library" },
  FOOD_COURT: { x: 100, z: 100, label: "Urban Space Food Court" },
  HOSTEL_GIRLS: { x: 150, z: 160, label: "Girls Hostel" },
  HOSTEL_BOYS_G: { x: -200, z: 220, label: "Boys Hostel G-Block" },
  HOSTEL_BOYS_H: { x: -100, z: 220, label: "Boys Hostel H-Block" },
  ADMISSION: { x: -50, z: -80, label: "Admission Center X-Block" },
  ADMIN_A: { x: 200, z: -30, label: "SNSCT A-Block Administrative" }
  // ... add all buildings from map
};
```

### 2. Component Structure
```
app/
├── campus-3d/
│   ├── page.tsx                 # Main 3D campus page
│   └── layout.tsx               # Campus-specific layout
│
components/
├── campus/
│   ├── CampusScene.tsx          # Main Three.js scene container
│   ├── CampusEnvironment.tsx    # Sky, lighting, weather
│   ├── CampusTerrain.tsx        # Ground, roads, landscape
│   ├── Buildings/
│   │   ├── BuildingModel.tsx    # Generic building component
│   │   ├── InnovationHub.tsx    # Specific building models
│   │   ├── Library.tsx
│   │   └── ...
│   ├── Character/
│   │   ├── PlayerAvatar.tsx     # User's 3D character
│   │   ├── AvatarController.tsx # Movement & animation logic
│   │   ├── AvatarCustomizer.tsx # Avatar appearance editor
│   │   └── NPCStudent.tsx       # Background NPCs
│   ├── Interactions/
│   │   ├── BuildingMarker.tsx   # Glowing building highlights
│   │   ├── EventMarker.tsx      # 3D event icons above buildings
│   │   ├── InfoCard.tsx         # Building information popup
│   │   └── NavigationPath.tsx   # Glowing path arrows
│   ├── Effects/
│   │   ├── ParticleSystem.tsx   # General particles
│   │   ├── GlowEffect.tsx       # Building glow shaders
│   │   ├── Weather.tsx          # Rain, clouds, birds
│   │   └── DayNightCycle.tsx    # Time-based lighting
│   └── UI/
│       ├── CampusHUD.tsx        # Main overlay UI
│       ├── MiniMap.tsx          # Top-right minimap
│       ├── PlayerProfile.tsx    # Top-left profile card
│       ├── NavigationBar.tsx    # Bottom nav bar
│       ├── Compass.tsx          # Direction indicator
│       ├── StatusBar.tsx        # Battery, GPS, network
│       ├── WeatherWidget.tsx    # Current weather
│       └── Joystick.tsx         # Mobile touch controls
│
hooks/
├── use-campus-location.ts       # GPS to 3D coordinate conversion
├── use-avatar-movement.ts       # Character movement logic
├── use-building-proximity.ts    # Detect nearby buildings
├── use-day-night.ts            # Time-based effects
└── use-event-markers.ts        # Load and display events
│
lib/
├── campus-coordinates.ts        # GPS ↔ 3D conversion utilities
├── building-data.ts            # Building metadata
├── event-categories.ts         # Event types and colors
├── npc-behaviors.ts            # NPC movement patterns
└── avatar-animations.ts        # Animation state machine
│
stores/
├── campus-store.ts             # Zustand store for campus state
├── avatar-store.ts             # Avatar position & customization
└── ui-store.ts                 # UI panel states
```

## 🎮 Core Features

### 1. Camera System
```typescript
// Cinematic entrance animation
- Start: Satellite view (y: 500, looking down)
- Zoom: Smooth camera descent (3 seconds)
- End: Third-person behind avatar (y: 10, offset: -8)

// Follow camera (Pokémon GO style)
- Position: Behind and above character
- Rotation: Follows character direction
- Smoothing: Lerp interpolation
- Collision: Prevent camera clipping through buildings
```

### 2. Avatar System

#### Movement
- **Input Methods**:
  - Desktop: WASD + Mouse, Arrow Keys
  - Mobile: Virtual joystick + touch drag
  - Auto-walk: Tap destination on ground
  
- **Animations**:
  - Idle (breathing, looking around)
  - Walk (normal pace)
  - Run (double-tap or sprint button)
  - Turn (smooth rotation)
  - Interact (wave, point at building)

- **Constraints**:
  - Stay on roads and walkable paths
  - Collision with buildings
  - Speed: 2-5 units/second

#### Customization
```typescript
interface AvatarCustomization {
  gender: 'male' | 'female' | 'other';
  skinTone: string;
  hairStyle: number;
  hairColor: string;
  outfit: 'casual' | 'formal' | 'sports' | 'traditional';
  accessories: string[];
  backpack: boolean;
}
```

### 3. Building Interactions

#### Detection
- Proximity radius: 15 units
- Raycast from camera for click detection
- Glow effect when in range

#### Info Card UI (Glassmorphism)
```tsx
<div className="glass-card floating">
  <h2>{building.name}</h2>
  <p>{building.description}</p>
  
  <Section title="Departments">
    {building.departments.map(...)}
  </Section>
  
  <Section title="Today's Events">
    <EventList events={building.todayEvents} />
  </Section>
  
  <Section title="Timings">
    <TimeRange open={building.openTime} close={building.closeTime} />
  </Section>
  
  <Section title="Faculty Available">
    <FacultyList faculty={building.availableFaculty} />
  </Section>
  
  <Actions>
    <Button>Navigate Here</Button>
    <Button>View Details</Button>
    <Button>Add to Favorites</Button>
  </Actions>
</div>
```

### 4. Event System

#### Event Categories
```typescript
const EVENT_TYPES = {
  WORKSHOP: { 
    icon: '🔬', 
    color: '#3B82F6', // Blue
    particleEffect: 'hologram',
    height: 8 
  },
  HACKATHON: { 
    icon: '⚡', 
    color: '#A855F7', // Purple
    particleEffect: 'lightning',
    height: 10 
  },
  SPORTS: { 
    icon: '🏆', 
    color: '#10B981', // Green
    particleEffect: 'stars',
    height: 7 
  },
  CULTURAL: { 
    icon: '🎵', 
    color: '#FB923C', // Orange
    particleEffect: 'music-notes',
    height: 9 
  },
  PLACEMENT: { 
    icon: '💼', 
    color: '#FCD34D', // Gold
    particleEffect: 'sparkles',
    height: 8 
  },
  EMERGENCY: { 
    icon: '🚨', 
    color: '#EF4444', // Red
    particleEffect: 'beacon',
    height: 12,
    pulsing: true 
  }
};
```

#### Event Markers (3D)
- Float above building (bobbing animation)
- Rotate slowly
- Emit particles
- Click to see event details
- Distance-based scaling

### 5. NPC System
```typescript
interface NPCBehavior {
  type: 'walker' | 'sitter' | 'cyclist' | 'group';
  path: Vector3[];
  speed: number;
  animation: string;
  spawnRate: number;
}

const NPC_HOTSPOTS = [
  { location: 'FOOD_COURT', density: 'high', activities: ['sitting', 'walking'] },
  { location: 'LIBRARY', density: 'medium', activities: ['walking', 'reading'] },
  { location: 'SPORTS_COMPLEX', density: 'high', activities: ['running', 'playing'] },
  { location: 'HOSTEL', density: 'medium', activities: ['walking', 'group-chat'] }
];
```

### 6. UI/HUD System

#### Top Bar
```
┌─────────────────────────────────────────┐
│ [Profile] [Name] [Level]    [MiniMap]   │
│ [Avatar]  Lv.5 Explorer     [Compass]   │
│                             [Status]    │
└─────────────────────────────────────────┘
```

#### Status Indicators
- GPS Accuracy: High (green), Medium (yellow), Low (red)
- Battery: Icon with percentage
- Network: 4G/5G/WiFi icon
- Speed: Current walking speed (km/h)
- Weather: Live weather icon + temp

#### Bottom Navigation
```
┌─────────────────────────────────────────┐
│  [🏠]   [🗺️]   [📅]   [🎯]   [🔔]   [👤]  │
│  Home  Explore Events Clubs  Notif Profile│
└─────────────────────────────────────────┘
```

#### Side Panels (Slide-in)
- Building info (right)
- Event list (right)
- Avatar customization (center modal)
- Settings (right)
- Notifications (left)

### 7. Navigation System

#### Waypoint System
```typescript
interface NavigationPath {
  start: Vector3;
  end: Vector3;
  waypoints: Vector3[];
  distance: number;
  estimatedTime: number;
}

// Visual feedback
- Glowing arrows on road
- Dashed line on minimap
- Distance indicator
- ETA countdown
- "You have arrived" notification
```

### 8. Visual Effects

#### Particle Systems
- Building entrances: Sparkles
- Event markers: Type-specific particles
- Avatar movement: Dust clouds
- Weather: Rain, snow, leaves
- Ambient: Butterflies, birds

#### Shaders
```glsl
// Building glow (when nearby)
uniform vec3 glowColor;
uniform float glowIntensity;
varying vec3 vNormal;

void main() {
  float rim = 1.0 - dot(vNormal, vec3(0, 0, 1));
  vec3 glow = glowColor * pow(rim, 3.0) * glowIntensity;
  gl_FragColor = vec4(baseColor + glow, 1.0);
}
```

#### Post-Processing
- Bloom: Glow effects
- SSAO: Depth and shadows
- Tone Mapping: Cinematic look
- Vignette: Focus attention

### 9. Day/Night Cycle
```typescript
interface TimeSettings {
  currentTime: number; // 0-24
  sunPosition: Vector3;
  ambientLight: Color;
  directionalLight: Color;
  skyColor: Color;
  fogDensity: number;
}

const TIME_PRESETS = {
  DAWN: { time: 6, sky: '#FF6B35', ambient: 0.3 },
  MORNING: { time: 9, sky: '#87CEEB', ambient: 0.7 },
  NOON: { time: 12, sky: '#00BFFF', ambient: 1.0 },
  EVENING: { time: 18, sky: '#FF6347', ambient: 0.5 },
  NIGHT: { time: 21, sky: '#191970', ambient: 0.2 }
};
```

### 10. Performance Optimization
- LOD (Level of Detail) for distant buildings
- Frustum culling: Only render visible objects
- Instancing: Reuse tree/bench models
- Texture atlases: Reduce draw calls
- Lazy loading: Load building models on demand
- Object pooling: NPCs and particles

## 🎨 Glassmorphism UI Theme

```css
/* Glass card effect */
.glass-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 24px;
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
}

/* Neon accent */
.neon-glow {
  box-shadow: 
    0 0 20px rgba(0, 217, 255, 0.5),
    0 0 40px rgba(0, 217, 255, 0.3),
    inset 0 0 20px rgba(0, 217, 255, 0.1);
}

/* Floating animation */
@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}
```

## 📱 Responsive Design
- Desktop: Full 3D with mouse controls
- Tablet: Touch controls with joystick
- Mobile: Optimized UI, reduced effects
- VR Ready: Potential WebXR support

## 🔊 Audio Design
- Ambient: Birds, wind, campus chatter
- Footsteps: Different surfaces (grass, concrete)
- UI: Button clicks, panel slides
- Events: Notification sounds
- Music: Relaxing background track (optional)

## 🚀 Implementation Phases

### Phase 1: Foundation (Week 1-2)
- [ ] Set up Three.js + React Three Fiber
- [ ] Create basic campus terrain
- [ ] Implement camera system
- [ ] GPS to 3D coordinate conversion
- [ ] Basic avatar movement

### Phase 2: Buildings (Week 3-4)
- [ ] Model/import all campus buildings
- [ ] Position buildings accurately
- [ ] Implement collision detection
- [ ] Add building interaction system
- [ ] Create info card UI

### Phase 3: Avatar & Animation (Week 5)
- [ ] Import rigged character model
- [ ] Implement animation state machine
- [ ] Avatar customization system
- [ ] Movement constraints (roads only)
- [ ] NPC spawning and behaviors

### Phase 4: Events & Markers (Week 6)
- [ ] Event marker 3D models
- [ ] Particle systems for each type
- [ ] Event data integration
- [ ] Real-time event updates
- [ ] Notification system

### Phase 5: UI/UX (Week 7)
- [ ] HUD components (minimap, profile, etc.)
- [ ] Glassmorphism styling
- [ ] Navigation bar
- [ ] Info panels and modals
- [ ] Mobile joystick controls

### Phase 6: Effects & Polish (Week 8)
- [ ] Day/night cycle
- [ ] Weather system
- [ ] Particle effects
- [ ] Post-processing
- [ ] Sound design
- [ ] Loading screens

### Phase 7: Optimization (Week 9)
- [ ] LOD implementation
- [ ] Performance profiling
- [ ] Mobile optimization
- [ ] Asset compression
- [ ] Caching strategies

### Phase 8: Testing & Launch (Week 10)
- [ ] Cross-device testing
- [ ] Bug fixes
- [ ] User testing
- [ ] Documentation
- [ ] Deployment

## 📊 Data Models

### Building
```typescript
interface Building {
  id: string;
  name: string;
  shortName: string;
  position: { x: number, y: number, z: number };
  rotation: number;
  type: 'academic' | 'hostel' | 'sports' | 'admin' | 'food' | 'medical';
  modelUrl: string;
  departments: string[];
  capacity: number;
  floors: number;
  timings: { open: string, close: string };
  amenities: string[];
  imageUrl: string;
  description: string;
}
```

### Event
```typescript
interface CampusEvent {
  id: string;
  title: string;
  description: string;
  category: keyof typeof EVENT_TYPES;
  buildingId: string;
  location: { x: number, y: number, z: number };
  startTime: Date;
  endTime: Date;
  organizer: string;
  participants: number;
  maxCapacity: number;
  registrationUrl?: string;
  imageUrl?: string;
  tags: string[];
}
```

### Avatar
```typescript
interface Avatar {
  userId: string;
  position: { x: number, y: number, z: number };
  rotation: number;
  customization: AvatarCustomization;
  level: number;
  experience: number;
  badges: string[];
  visitedBuildings: string[];
  favoriteLocations: string[];
}
```

## 🔐 Security Considerations
- Validate GPS coordinates are within campus bounds
- Rate limit location updates
- Sanitize building/event data
- Secure avatar customization data
- Prevent unauthorized building edits

## 📈 Analytics Tracking
- Most visited buildings
- Average session duration
- Popular navigation routes
- Event engagement rates
- Avatar customization trends
- Time spent in different campus zones

## 🎯 Success Metrics
- Page load time < 3 seconds
- 60 FPS on mobile devices
- GPS accuracy < 5 meters
- User engagement > 5 minutes/session
- Building interaction rate > 40%
- Event discovery rate > 60%

---

## 🛠️ Development Commands

```bash
# Install dependencies
npm install three @react-three/fiber @react-three/drei @react-three/rapier
npm install framer-motion zustand
npm install mapbox-gl @types/mapbox-gl

# Development
npm run dev

# Build 3D assets
# Use Blender to create low-poly models
# Export as GLTF/GLB format
# Optimize with gltf-pipeline

# Optimize textures
npm install sharp
node scripts/optimize-textures.js

# Deploy
npm run build
npm run start
```

---

**Created**: 2026-06-30  
**Version**: 1.0  
**Status**: Design Phase  
**Team**: SNS College Development Team
