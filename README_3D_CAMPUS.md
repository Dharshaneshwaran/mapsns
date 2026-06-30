# 🎮 SNS College 3D Interactive Campus Map

> A Pokémon GO-inspired 3D campus navigation experience with glassmorphism UI, interactive buildings, real-time events, and customizable avatars.

![Project Status](https://img.shields.io/badge/Status-Design%20Complete-blue)
![Tech](https://img.shields.io/badge/Tech-Three.js%20%7C%20React%20%7C%20Next.js-green)
![License](https://img.shields.io/badge/License-MIT-yellow)

---

## 📖 Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [Documentation](#documentation)
4. [Quick Start](#quick-start)
5. [Technology Stack](#technology-stack)
6. [Project Structure](#project-structure)
7. [Screenshots & Mockups](#screenshots--mockups)
8. [Implementation Phases](#implementation-phases)
9. [Contributing](#contributing)
10. [Resources](#resources)

---

## 🌟 Overview

Transform campus navigation into an immersive 3D experience! This project brings the SNS College campus to life with:

- 🗺️ **Real-time 3D campus map** with accurate building positions
- 🎨 **Premium glassmorphism UI** inspired by Apple VisionOS
- 👤 **Customizable avatars** with smooth animations
- 📅 **Interactive events** with 3D markers and particle effects
- 🧭 **GPS navigation** with turn-by-turn directions
- 🌤️ **Dynamic environment** with day/night cycles and weather
- 📱 **Mobile-first design** optimized for handheld devices

### Visual Style
**Pokémon GO** meets **Genshin Impact** meets **Apple VisionOS**

- Low-poly semi-realistic 3D graphics
- Vibrant colors with neon accents
- Smooth cinematic camera movements
- Premium glassmorphic UI panels

---

## ✨ Features

### 🏢 Interactive Buildings (45+ Campus Buildings)
- Click buildings for detailed information
- View departments, facilities, and operating hours
- See today's events at each location
- Navigate to any building with waypoints
- Save favorite locations

### 📅 Live Event System
- **6 Event Categories** with unique visuals:
  - 🔬 Workshops (Blue) - Hologram effects
  - ⚡ Hackathons (Purple) - Lightning particles
  - 🏆 Sports (Green) - Trophy sparkles
  - 🎵 Cultural (Orange) - Music notes
  - 💼 Placements (Gold) - Briefcase glow
  - 🚨 Emergency (Red) - Pulsing beacon
- 3D markers floating above buildings
- Real-time event updates
- RSVP and registration

### 👤 Avatar System
- **Full customization**:
  - Gender selection
  - Skin tones
  - Hair styles and colors
  - Outfits (casual, formal, sports, traditional)
  - Accessories (glasses, hat, backpack, watch)
- **Smooth animations**:
  - Walking, running, idle
  - Turning and interactions
  - Breathing and natural movements
- **Third-person camera** follows character

### 🗺️ Navigation System
- GPS-based real-time tracking
- Waypoint pathfinding
- Glowing arrows on roads
- Distance and ETA display
- Turn-by-turn directions
- "You have arrived" notifications

### 🎨 Premium UI/UX
- **Glassmorphism design**:
  - Frosted glass panels
  - Backdrop blur effects
  - Soft shadows and borders
  - Neon blue/green accents
- **HUD Elements**:
  - Player profile (top-left)
  - Circular minimap (top-right)
  - Status bar (GPS, battery, network, speed)
  - Compass (center-top)
  - Weather widget
  - Bottom navigation bar
- **Mobile Controls**:
  - Virtual joystick
  - Touch gestures
  - Swipe navigation

### 🌍 Living Campus
- NPC students walking around
- Students sitting on benches
- Cyclists on paths
- Groups gathering near hotspots
- Time-appropriate crowd density

### 🎭 Visual Effects
- Particle systems (sparkles, dust, rain)
- Day/night lighting cycle
- Dynamic weather (clear, cloudy, rainy)
- Post-processing (bloom, shadows)
- Ambient sounds and music

---

## 📚 Documentation

This project includes **6 comprehensive documentation files**:

| Document | Description | Read Time |
|----------|-------------|-----------|
| [**3D_CAMPUS_MAP_OVERVIEW.md**](./3D_CAMPUS_MAP_OVERVIEW.md) | High-level project summary and navigation guide | 10 min |
| [**DESIGN_SPEC.md**](./DESIGN_SPEC.md) | Complete technical architecture and feature specifications | 30 min |
| [**IMPLEMENTATION_ROADMAP.md**](./IMPLEMENTATION_ROADMAP.md) | Step-by-step implementation guide with code examples | 45 min |
| [**UI_DESIGN_SYSTEM.md**](./UI_DESIGN_SYSTEM.md) | UI component library and styling guide | 25 min |
| [**UI_LAYOUT_REFERENCE.md**](./UI_LAYOUT_REFERENCE.md) | Visual layout mockups with ASCII art | 15 min |
| [**GETTING_STARTED.md**](./GETTING_STARTED.md) | Quick start guide (15 minutes to first results!) | 20 min |
| [**EXAMPLE_COMPLETE_BUILDING.md**](./EXAMPLE_COMPLETE_BUILDING.md) | Full building implementation example | 15 min |

### 📖 Reading Path

**New to the project?** Follow this reading order:

1. ✅ Start here: [README_3D_CAMPUS.md](./README_3D_CAMPUS.md) (this file)
2. 📖 Overview: [3D_CAMPUS_MAP_OVERVIEW.md](./3D_CAMPUS_MAP_OVERVIEW.md)
3. 🚀 Quick start: [GETTING_STARTED.md](./GETTING_STARTED.md)
4. 🏗️ Implementation: [IMPLEMENTATION_ROADMAP.md](./IMPLEMENTATION_ROADMAP.md)
5. 🎨 UI design: [UI_DESIGN_SYSTEM.md](./UI_DESIGN_SYSTEM.md)
6. 📐 Reference: [UI_LAYOUT_REFERENCE.md](./UI_LAYOUT_REFERENCE.md)
7. 🏢 Example: [EXAMPLE_COMPLETE_BUILDING.md](./EXAMPLE_COMPLETE_BUILDING.md)
8. 📋 Full spec: [DESIGN_SPEC.md](./DESIGN_SPEC.md)

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Modern web browser (Chrome, Firefox, Safari, Edge)

### Installation (5 minutes)

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install three @types/three
npm install @react-three/fiber @react-three/drei @react-three/rapier
npm install zustand framer-motion lucide-react
npm install mapbox-gl geolib

# Run development server
npm run dev
```

### See Your First 3D Scene (10 minutes)

Follow the complete setup guide in [**GETTING_STARTED.md**](./GETTING_STARTED.md) to:
1. Create directory structure
2. Configure Tailwind CSS
3. Build basic 3D components
4. See buildings rendering in 3D!

**Result**: A working 3D campus scene with interactive buildings in 15 minutes! 🎉

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Custom Glassmorphism

### 3D Graphics
- **Engine**: Three.js (WebGL)
- **React Integration**: React Three Fiber
- **Helpers**: @react-three/drei
- **Physics**: @react-three/rapier
- **Post-Processing**: @react-three/postprocessing

### State & UI
- **State Management**: Zustand
- **Animations**: Framer Motion
- **Icons**: Lucide React

### Maps & Location
- **Minimap**: Mapbox GL JS
- **GPS**: Geolocation API + geolib
- **Coordinates**: Custom GPS ↔ 3D conversion

### 3D Assets
- **Format**: GLTF/GLB
- **Creation**: Blender
- **Animations**: Mixamo
- **Optimization**: gltf-pipeline

---

## 📁 Project Structure

```
frontend/
├── app/
│   ├── campus-3d/
│   │   └── page.tsx                 # Main 3D campus page
│   ├── globals.css                  # Global styles + glassmorphism
│   └── layout.tsx
│
├── components/
│   ├── campus/
│   │   ├── CampusScene.tsx          # Main Three.js scene
│   │   ├── CampusEnvironment.tsx    # Sky, lighting, weather
│   │   ├── CampusTerrain.tsx        # Ground plane
│   │   ├── AllBuildings.tsx         # Building renderer
│   │   │
│   │   ├── Buildings/
│   │   │   ├── SimpleBuilding.tsx   # Generic building
│   │   │   ├── InnovationHub.tsx    # Specific buildings
│   │   │   └── ...
│   │   │
│   │   ├── Character/
│   │   │   ├── PlayerAvatar.tsx     # User's character
│   │   │   ├── AvatarController.tsx # Movement logic
│   │   │   └── NPCStudent.tsx       # Background NPCs
│   │   │
│   │   ├── Effects/
│   │   │   ├── ParticleSystem.tsx   # Particle effects
│   │   │   ├── DayNightCycle.tsx    # Time-based lighting
│   │   │   └── Weather.tsx          # Rain, clouds, etc.
│   │   │
│   │   ├── Interactions/
│   │   │   ├── BuildingMarker.tsx   # Building highlights
│   │   │   ├── EventMarker3D.tsx    # 3D event markers
│   │   │   └── NavigationPath.tsx   # Route arrows
│   │   │
│   │   └── UI/
│   │       ├── CampusHUD.tsx        # Main overlay
│   │       ├── MiniMap.tsx          # Top-right map
│   │       ├── PlayerProfile.tsx    # Top-left profile
│   │       ├── NavigationBar.tsx    # Bottom nav
│   │       ├── BuildingInfoCard.tsx # Building details
│   │       ├── Compass.tsx          # Direction indicator
│   │       ├── StatusBar.tsx        # GPS, battery, etc.
│   │       └── Joystick.tsx         # Mobile controls
│   │
│   └── UI/
│       └── LoadingScreen.tsx        # 3D loading screen
│
├── hooks/
│   └── campus/
│       ├── use-campus-location.ts   # GPS tracking
│       ├── use-avatar-movement.ts   # Character movement
│       └── use-building-proximity.ts # Nearby detection
│
├── lib/
│   └── campus/
│       ├── buildings.ts             # Building data
│       ├── coordinates.ts           # GPS ↔ 3D conversion
│       ├── event-categories.ts      # Event types
│       └── npc-behaviors.ts         # NPC AI
│
├── stores/
│   ├── campus-store.ts              # Main campus state
│   ├── avatar-store.ts              # Avatar state
│   └── ui-store.ts                  # UI state
│
└── public/
    ├── models/                      # 3D models (.gltf/.glb)
    │   ├── buildings/
    │   ├── characters/
    │   └── environment/
    ├── textures/                    # Images & textures
    └── sounds/                      # Audio files
```

---

## 📸 Screenshots & Mockups

### UI Layout Overview
```
┌──────────────────────────────────────────────────────────────┐
│  [👤 Profile]                              [🗺️ MiniMap]      │
│                                                              │
│                    [☀️ Weather]         [📊 Status Bar]     │
│                                                              │
│                       [🧭]                                   │
│                                                              │
│            ╔════════════════════════╗                        │
│            ║   3D CAMPUS SCENE     ║                        │
│            ║                        ║                        │
│            ║  [Buildings & Avatar]  ║                        │
│            ║                        ║                        │
│            ╚════════════════════════╝                        │
│                                                              │
│  [🕹️]                                                        │
│                                                              │
│         [🏠  🗺️  📅  🎯  🔔  👤]                            │
│         [Navigation Bar]                                     │
└──────────────────────────────────────────────────────────────┘
```

See [**UI_LAYOUT_REFERENCE.md**](./UI_LAYOUT_REFERENCE.md) for detailed mockups!

---

## 🏗️ Implementation Phases

### ✅ Phase 1: Foundation (Weeks 1-2)
- Three.js scene setup
- Camera controls
- Basic terrain and lighting
- GPS coordinate system

### ✅ Phase 2: Buildings (Weeks 3-4)
- 3D building models
- Building interactions
- Info card UI
- Collision detection

### ⏳ Phase 3: Avatar & Animation (Week 5)
- Character model
- Movement controller
- Animation system
- NPC behaviors

### ⏳ Phase 4: Events & Markers (Week 6)
- Event data structure
- 3D event markers
- Particle effects
- Real-time updates

### ⏳ Phase 5: UI/UX (Week 7)
- HUD components
- Glassmorphism panels
- Navigation system
- Mobile controls

### ⏳ Phase 6: Effects & Polish (Week 8)
- Day/night cycle
- Weather system
- Post-processing
- Sound design

### ⏳ Phase 7: Optimization (Week 9)
- Performance tuning
- Mobile optimization
- Asset compression
- Loading strategies

### ⏳ Phase 8: Testing & Launch (Week 10)
- Cross-device testing
- Bug fixes
- Documentation
- Deployment

**Total Timeline**: 10 weeks from start to launch

---

## 🤝 Contributing

### Getting Started

1. **Read Documentation**
   - Start with [GETTING_STARTED.md](./GETTING_STARTED.md)
   - Review [IMPLEMENTATION_ROADMAP.md](./IMPLEMENTATION_ROADMAP.md)

2. **Set Up Environment**
   ```bash
   git clone <repo-url>
   cd frontend
   npm install
   npm run dev
   ```

3. **Pick a Phase**
   - Check current phase in [IMPLEMENTATION_ROADMAP.md](./IMPLEMENTATION_ROADMAP.md)
   - Start with incomplete phases

4. **Follow Style Guide**
   - Use [UI_DESIGN_SYSTEM.md](./UI_DESIGN_SYSTEM.md) for UI
   - Follow TypeScript best practices
   - Add comments to complex code

5. **Test Your Work**
   - Test on desktop and mobile
   - Check performance (60 FPS target)
   - Verify responsive design

### Code Style

```typescript
// ✅ Good
export function BuildingComponent({ building }: BuildingProps) {
  const [hovered, setHovered] = useState(false);
  
  return (
    <group position={[building.x, building.y, building.z]}>
      {/* Implementation */}
    </group>
  );
}

// ❌ Bad
export const BuildingComponent = (props) => {
  return <group>...</group>
}
```

---

## 📚 Resources

### Learning
- [Three.js Documentation](https://threejs.org/docs/)
- [React Three Fiber Docs](https://docs.pmnd.rs/react-three-fiber)
- [Drei Helpers](https://github.com/pmndrs/drei)
- [Three.js Journey](https://threejs-journey.com/) (Best course!)

### Tools
- [Blender](https://www.blender.org/) - 3D modeling
- [Mixamo](https://www.mixamo.com/) - Character animations
- [Sketchfab](https://sketchfab.com/) - 3D model reference
- [Poly Haven](https://polyhaven.com/) - Free textures

### Community
- [Three.js Discord](https://discord.gg/threejs)
- [React Three Fiber Discord](https://discord.gg/poimandres)
- [r/threejs](https://reddit.com/r/threejs)
- Stack Overflow

---

## 🎯 Project Goals

### Technical
- ✅ Modern, maintainable code
- ✅ 60 FPS on mobile devices
- ✅ < 3 second load time
- ✅ Responsive across all devices
- ✅ Accessible (WCAG AA)

### User Experience
- ✅ Intuitive navigation
- ✅ Engaging interactions
- ✅ Premium look and feel
- ✅ Fun and useful

### Impact
- Help students navigate campus
- Increase event discovery and attendance
- Showcase institution's tech innovation
- Create impressive portfolio project

---

## 📈 Success Metrics

### Performance
- Load time < 3 seconds
- 60 FPS on mobile
- GPS accuracy < 5 meters

### Engagement
- 5+ min average session
- 40%+ building interaction rate
- 60%+ event discovery rate
- 70%+ avatar customization rate

---

## 📝 License

MIT License - See LICENSE file for details

---

## 🙏 Acknowledgments

- **Inspiration**: Pokémon GO, Genshin Impact, Apple VisionOS
- **Campus**: SNS College
- **Technologies**: Three.js, React, Next.js communities

---

## 📞 Support

For questions or issues:
1. Check documentation files
2. Review [GETTING_STARTED.md](./GETTING_STARTED.md) troubleshooting
3. Search existing issues
4. Open a new issue with details

---

## 🚀 Ready to Build?

1. **Start here**: [GETTING_STARTED.md](./GETTING_STARTED.md) (15 min setup)
2. **Understand design**: [DESIGN_SPEC.md](./DESIGN_SPEC.md)
3. **Follow roadmap**: [IMPLEMENTATION_ROADMAP.md](./IMPLEMENTATION_ROADMAP.md)
4. **Reference UI**: [UI_DESIGN_SYSTEM.md](./UI_DESIGN_SYSTEM.md)
5. **See example**: [EXAMPLE_COMPLETE_BUILDING.md](./EXAMPLE_COMPLETE_BUILDING.md)

---

<div align="center">

### 🎮 Let's Build Something Amazing! 🚀

**Transform campus navigation into an unforgettable 3D experience**

[Get Started](./GETTING_STARTED.md) • [Documentation](./3D_CAMPUS_MAP_OVERVIEW.md) • [Contribute](#contributing)

---

Made with ❤️ for SNS College

</div>
