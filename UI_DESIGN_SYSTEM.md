# UI Design System - 3D Campus Map

## 🎨 Design Philosophy

The UI should feel like a **premium AAA mobile game** with influences from:
- **Pokémon GO**: Minimalist, functional, location-aware
- **Genshin Impact**: Elegant panels, smooth animations, rich colors
- **Apple VisionOS**: Glassmorphism, depth, spatial design

---

## 🌈 Color System

### Primary Colors
```css
--neon-blue: #00D9FF;
--neon-green: #00FF94;
--neon-purple: #A855F7;
--neon-orange: #FB923C;
--neon-gold: #FCD34D;
--neon-red: #EF4444;
```

### Event Category Colors
```typescript
const EVENT_COLORS = {
  WORKSHOP: '#3B82F6',      // Blue
  HACKATHON: '#A855F7',     // Purple  
  SPORTS: '#10B981',        // Green
  CULTURAL: '#FB923C',      // Orange
  PLACEMENT: '#FCD34D',     // Gold
  EMERGENCY: '#EF4444'      // Red
};
```

### Neutral Colors
```css
--glass-white: rgba(255, 255, 255, 0.1);
--glass-border: rgba(255, 255, 255, 0.2);
--overlay-dark: rgba(0, 0, 0, 0.5);
--text-primary: #FFFFFF;
--text-secondary: rgba(255, 255, 255, 0.7);
```

---

## 🪟 Glassmorphism System

### Base Glass Card
```tsx
<div className="glass-card">
  {/* Content */}
</div>
```

```css
.glass-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
  padding: 20px;
}
```

### Glass Variants

#### Dark Glass (for contrast)
```css
.glass-dark {
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}
```

#### Neon Glass (for highlights)
```css
.glass-neon-blue {
  background: rgba(0, 217, 255, 0.15);
  border: 1px solid rgba(0, 217, 255, 0.4);
  box-shadow: 
    0 0 20px rgba(0, 217, 255, 0.3),
    inset 0 0 20px rgba(0, 217, 255, 0.1);
}
```

#### Floating Glass (with shadow)
```css
.glass-floating {
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(30px);
  box-shadow: 
    0 20px 60px rgba(0, 0, 0, 0.3),
    inset 0 2px 0 rgba(255, 255, 255, 0.4);
  transform: translateY(0);
  transition: transform 0.3s ease;
}

.glass-floating:hover {
  transform: translateY(-4px);
}
```

---

## 🧩 Component Library

### 1. HUD Layout
```tsx
<div className="fixed inset-0 pointer-events-none">
  {/* Top Bar */}
  <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-auto">
    <PlayerProfile />
    <MiniMap />
  </div>
  
  {/* Status Bar */}
  <div className="absolute top-20 right-4 pointer-events-auto">
    <StatusBar />
  </div>
  
  {/* Center Compass */}
  <div className="absolute top-1/4 left-1/2 -translate-x-1/2 pointer-events-auto">
    <Compass />
  </div>
  
  {/* Bottom Navigation */}
  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-auto">
    <NavigationBar />
  </div>
  
  {/* Mobile Joystick */}
  <div className="absolute bottom-24 left-6 pointer-events-auto md:hidden">
    <Joystick />
  </div>
</div>
```

### 2. Player Profile Card
```tsx
export function PlayerProfile() {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="glass-card flex items-center gap-3 p-3"
    >
      {/* Avatar Image */}
      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-neon-blue to-neon-purple p-0.5">
        <div className="w-full h-full rounded-full bg-black/50 flex items-center justify-center">
          <img src="/avatar.png" alt="Avatar" className="w-12 h-12 rounded-full" />
        </div>
      </div>
      
      {/* User Info */}
      <div className="flex flex-col">
        <h3 className="text-white font-semibold text-sm">Rahul Kumar</h3>
        <div className="flex items-center gap-2">
          <span className="text-neon-blue text-xs">Level 5</span>
          <span className="text-white/50 text-xs">Explorer</span>
        </div>
      </div>
      
      {/* Level Progress */}
      <div className="w-24 h-1.5 bg-white/20 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-neon-blue to-neon-green w-3/4" />
      </div>
    </motion.div>
  );
}
```

### 3. MiniMap
```tsx
export function MiniMap() {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="glass-dark w-40 h-40 rounded-full p-2 relative"
    >
      {/* Map Canvas */}
      <div className="w-full h-full rounded-full overflow-hidden bg-black/30">
        <canvas id="minimap" className="w-full h-full" />
      </div>
      
      {/* Player Marker */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="w-3 h-3 bg-neon-blue rounded-full shadow-neon-blue animate-pulse" />
      </div>
      
      {/* Compass Rose */}
      <div className="absolute -top-2 left-1/2 -translate-x-1/2 text-white text-xs font-bold">
        N
      </div>
    </motion.div>
  );
}
```

### 4. Status Bar
```tsx
export function StatusBar() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card space-y-2 p-3 min-w-[120px]"
    >
      {/* GPS Accuracy */}
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-neon-green animate-pulse" />
        <span className="text-white text-xs">GPS: High</span>
      </div>
      
      {/* Battery */}
      <div className="flex items-center gap-2">
        <Battery level={85} />
        <span className="text-white text-xs">85%</span>
      </div>
      
      {/* Network */}
      <div className="flex items-center gap-2">
        <Signal strength={4} />
        <span className="text-white text-xs">5G</span>
      </div>
      
      {/* Speed */}
      <div className="flex items-center gap-2">
        <ArrowRight className="w-3 h-3 text-neon-blue" />
        <span className="text-white text-xs">2.5 km/h</span>
      </div>
    </motion.div>
  );
}
```

### 5. Compass
```tsx
export function Compass() {
  const [heading, setHeading] = useState(0);
  
  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className="glass-card w-16 h-16 rounded-full flex items-center justify-center relative"
    >
      {/* Compass Needle */}
      <motion.div
        animate={{ rotate: -heading }}
        className="absolute inset-0 flex items-center justify-center"
      >
        <div className="w-1 h-8 bg-gradient-to-b from-neon-red to-white rounded-full" />
      </motion.div>
      
      {/* Center Dot */}
      <div className="w-3 h-3 bg-white rounded-full z-10" />
      
      {/* Cardinal Directions */}
      <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-white text-xs font-bold">
        N
      </div>
    </motion.div>
  );
}
```

### 6. Weather Widget
```tsx
export function WeatherWidget() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-card flex items-center gap-3 p-3"
    >
      {/* Weather Icon */}
      <div className="w-12 h-12 flex items-center justify-center">
        <Sun className="w-8 h-8 text-yellow-400 animate-pulse-slow" />
      </div>
      
      {/* Weather Info */}
      <div>
        <h4 className="text-white text-lg font-bold">28°C</h4>
        <p className="text-white/70 text-xs">Sunny</p>
      </div>
    </motion.div>
  );
}
```

### 7. Navigation Bar
```tsx
const NAV_ITEMS = [
  { id: 'home', icon: Home, label: 'Home' },
  { id: 'explore', icon: Map, label: 'Explore' },
  { id: 'events', icon: Calendar, label: 'Events' },
  { id: 'clubs', icon: Users, label: 'Clubs' },
  { id: 'notifications', icon: Bell, label: 'Notif' },
  { id: 'profile', icon: User, label: 'Profile' },
];

export function NavigationBar() {
  const [active, setActive] = useState('explore');
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card flex items-center gap-1 p-2"
    >
      {NAV_ITEMS.map(item => {
        const Icon = item.icon;
        const isActive = active === item.id;
        
        return (
          <button
            key={item.id}
            onClick={() => setActive(item.id)}
            className={`
              flex flex-col items-center gap-1 px-4 py-2 rounded-2xl
              transition-all duration-300
              ${isActive 
                ? 'bg-neon-blue/20 text-neon-blue shadow-neon-blue' 
                : 'text-white/70 hover:text-white'
              }
            `}
          >
            <Icon className="w-5 h-5" />
            <span className="text-xs font-medium">{item.label}</span>
          </button>
        );
      })}
    </motion.div>
  );
}
```

### 8. Building Info Card
```tsx
export function BuildingInfoCard({ building }: { building: Building }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 100 }}
      className="fixed right-6 top-1/4 w-96 max-h-[60vh] overflow-y-auto"
    >
      <div className="glass-floating space-y-4 p-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">{building.name}</h2>
            <p className="text-neon-blue text-sm">{building.shortName}</p>
          </div>
          <button className="text-white/70 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        {/* Image */}
        <div className="w-full h-40 rounded-2xl overflow-hidden bg-black/30">
          <img 
            src={building.imageUrl} 
            alt={building.name}
            className="w-full h-full object-cover"
          />
        </div>
        
        {/* Description */}
        <p className="text-white/80 text-sm">{building.description}</p>
        
        {/* Departments */}
        {building.departments && (
          <div className="space-y-2">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <Building2 className="w-4 h-4 text-neon-blue" />
              Departments
            </h3>
            <div className="flex flex-wrap gap-2">
              {building.departments.map(dept => (
                <span
                  key={dept}
                  className="px-3 py-1 bg-neon-blue/20 text-neon-blue text-xs rounded-full"
                >
                  {dept}
                </span>
              ))}
            </div>
          </div>
        )}
        
        {/* Timings */}
        {building.timings && (
          <div className="space-y-2">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <Clock className="w-4 h-4 text-neon-green" />
              Timings
            </h3>
            <p className="text-white/70 text-sm">
              {building.timings.open} - {building.timings.close}
            </p>
          </div>
        )}
        
        {/* Today's Events */}
        <div className="space-y-2">
          <h3 className="text-white font-semibold flex items-center gap-2">
            <Calendar className="w-4 h-4 text-neon-purple" />
            Today's Events
          </h3>
          <div className="space-y-2">
            <EventListItem 
              title="AI Workshop"
              time="2:00 PM - 4:00 PM"
              type="WORKSHOP"
            />
            <EventListItem 
              title="Placement Drive"
              time="10:00 AM - 5:00 PM"
              type="PLACEMENT"
            />
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex gap-2">
          <button className="flex-1 bg-neon-blue text-white py-3 rounded-xl font-semibold hover:bg-neon-blue/80 transition-colors">
            Navigate
          </button>
          <button className="px-4 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors">
            <Heart className="w-5 h-5" />
          </button>
          <button className="px-4 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors">
            <Share className="w-5 h-5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
```

### 9. Virtual Joystick (Mobile)
```tsx
export function Joystick() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  
  return (
    <div className="relative w-32 h-32">
      {/* Base */}
      <div className="absolute inset-0 glass-dark rounded-full opacity-50" />
      
      {/* Stick */}
      <motion.div
        drag
        dragElastic={0.1}
        dragConstraints={{ left: -40, right: 40, top: -40, bottom: 40 }}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={() => {
          setIsDragging(false);
          setPosition({ x: 0, y: 0 });
        }}
        onDrag={(_, info) => setPosition({ x: info.offset.x, y: info.offset.y })}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 glass-card rounded-full cursor-pointer"
        style={{
          x: position.x,
          y: position.y,
        }}
      >
        <div className="w-full h-full flex items-center justify-center">
          <ArrowUp className="w-6 h-6 text-neon-blue" />
        </div>
      </motion.div>
    </div>
  );
}
```

### 10. Event Marker (3D Billboard)
```tsx
// This would be in the 3D scene
export function EventMarker3D({ event }: { event: CampusEvent }) {
  const eventType = EVENT_TYPES[event.category];
  
  return (
    <group position={[event.location.x, event.location.y + eventType.height, event.location.z]}>
      {/* Floating Icon */}
      <Billboard>
        <mesh>
          <circleGeometry args={[1.5, 32]} />
          <meshBasicMaterial color={eventType.color} opacity={0.9} transparent />
        </mesh>
        
        {/* Icon Text/Symbol */}
        <Html center>
          <div className="text-4xl animate-float">
            {eventType.icon}
          </div>
        </Html>
      </Billboard>
      
      {/* Particle Effect */}
      <ParticleEffect type={eventType.particleEffect} color={eventType.color} />
      
      {/* Glow Ring */}
      {eventType.pulsing && (
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[2, 3, 32]} />
          <meshBasicMaterial color={eventType.color} transparent opacity={0.3} />
        </mesh>
      )}
    </group>
  );
}
```

---

## 🎬 Animation System

### Entrance Animations
```tsx
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

<motion.div
  variants={containerVariants}
  initial="hidden"
  animate="visible"
>
  {items.map(item => (
    <motion.div key={item.id} variants={itemVariants}>
      {item.content}
    </motion.div>
  ))}
</motion.div>
```

### Hover Effects
```css
.interactive-element {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.interactive-element:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.2);
}
```

### Loading States
```tsx
<motion.div
  animate={{
    scale: [1, 1.2, 1],
    opacity: [0.5, 1, 0.5]
  }}
  transition={{
    duration: 2,
    repeat: Infinity,
    ease: "easeInOut"
  }}
  className="w-12 h-12 rounded-full bg-neon-blue"
/>
```

---

## 📐 Spacing System

```css
/* Padding/Margin Scale */
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-8: 32px;
--space-10: 40px;
--space-12: 48px;
--space-16: 64px;

/* Border Radius */
--radius-sm: 8px;
--radius-md: 12px;
--radius-lg: 16px;
--radius-xl: 24px;
--radius-full: 9999px;
```

---

## 🔤 Typography

```css
/* Font Families */
--font-primary: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
--font-display: 'Space Grotesk', sans-serif;
--font-mono: 'Fira Code', monospace;

/* Font Sizes */
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */
--text-3xl: 1.875rem;  /* 30px */
--text-4xl: 2.25rem;   /* 36px */

/* Font Weights */
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

---

## 📱 Responsive Breakpoints

```css
/* Mobile First */
@media (min-width: 640px) { /* sm */ }
@media (min-width: 768px) { /* md */ }
@media (min-width: 1024px) { /* lg */ }
@media (min-width: 1280px) { /* xl */ }
@media (min-width: 1536px) { /* 2xl */ }
```

---

## ✨ Accessibility

- **Color Contrast**: All text meets WCAG AA standards
- **Focus States**: Visible focus rings on all interactive elements
- **Keyboard Navigation**: Full keyboard support
- **Screen Readers**: ARIA labels on all UI elements
- **Touch Targets**: Minimum 44x44px on mobile

---

## 🎮 Interaction Patterns

### Click/Tap Feedback
```tsx
<motion.button
  whileTap={{ scale: 0.95 }}
  className="glass-card"
>
  Click Me
</motion.button>
```

### Drag Feedback
```tsx
<motion.div
  drag
  dragElastic={0.1}
  whileDrag={{ scale: 1.1, cursor: 'grabbing' }}
>
  Draggable
</motion.div>
```

### Long Press
```tsx
const handleLongPress = useLongPress(() => {
  // Action on long press
}, 500);

<div {...handleLongPress}>
  Long press me
</div>
```

---

## 🎨 Icon System

Use **Lucide React** icons throughout:
```tsx
import { 
  Home, Map, Calendar, Users, Bell, User,
  MapPin, Navigation, Clock, Building2, 
  Heart, Share, X, Menu, Settings, Search
} from 'lucide-react';
```

---

**This design system ensures consistency, accessibility, and premium feel across the entire 3D campus experience!** ✨
