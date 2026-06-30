// 2D campus map data laid out to match the printed SNS College map.
// All coordinates use the SVG viewBox 0..1200 (x) × 0..820 (y).
// North is up, the Front Gate is at the bottom-centre.

export type Map2DBuildingType =
  | "academic"
  | "hostel"
  | "sports"
  | "admin"
  | "food"
  | "medical"
  | "landmark"
  | "service"
  | "parking";

export interface Map2DBuilding {
  id: string;
  label: string;
  /** Rectangle in SVG units. */
  x: number;
  y: number;
  w: number;
  h: number;
  /** Fill colour matched to the printed map. */
  color: string;
  textColor?: string;
  /** Override label font-size; defaults are chosen from the box dimensions. */
  fontSize?: number;
  /** Rotate the label 90° (for tall narrow rectangles). */
  rotated?: boolean;
  type: Map2DBuildingType;
  /** Major landmark — glows when the player is nearby and shows on minimap. */
  landmark?: boolean;
  /** Player can walk over this rectangle (plazas, parking, gates). */
  walkable?: boolean;
  /** Optional description shown in the info card. */
  description?: string;
  departments?: string[];
  facilities?: string[];
  timings?: { open: string; close: string };
  /** Renders an extra detail inside the box (athletic track oval, plaza disc, …). */
  special?: "athletic-track" | "uliyum";
}

// ── BUILDINGS ────────────────────────────────────────────────────────
// Tuned by eye from the printed campus map.

export const MAP_BUILDINGS: Map2DBuilding[] = [
  // ── TOP ROW (north edge) ────────────────────────────────────────
  { id: "natchatra", label: "Natchatra Garden", x: 8, y: 30, w: 22, h: 80,
    color: "#5d8a3c", textColor: "#fff", fontSize: 7, rotated: true, type: "landmark",
    description: "A small landscaped garden at the north-west corner of campus." },

  { id: "boys-hostel-g", label: "Boys Hostel G-Block", x: 35, y: 40, w: 225, h: 45,
    color: "#2b2f36", textColor: "#fff", fontSize: 12, type: "hostel", landmark: true,
    description: "Long residential hostel running across the northern edge of campus." },

  { id: "boys-hostel-h", label: "Boys Hostel H-Block", x: 265, y: 45, w: 88, h: 70,
    color: "#2b2f36", textColor: "#fff", fontSize: 11, type: "hostel",
    description: "Boys Hostel H-Block." },

  { id: "generator-1", label: "Generator & Power Room", x: 360, y: 5, w: 42, h: 32,
    color: "#7a7a7a", textColor: "#fff", fontSize: 5, type: "service" },

  { id: "plant-1", label: "Plant 1", x: 410, y: 5, w: 28, h: 22,
    color: "#5d8a3c", textColor: "#fff", fontSize: 7, type: "landmark" },
  { id: "plant-2", label: "Plant 2", x: 442, y: 5, w: 28, h: 22,
    color: "#5d8a3c", textColor: "#fff", fontSize: 7, type: "landmark" },

  { id: "cricket-pitch", label: "Cricket Pitch", x: 475, y: 35, w: 50, h: 50,
    color: "#7fb858", textColor: "#fff", fontSize: 8, type: "sports", landmark: true,
    description: "Outdoor cricket pitch and practice nets." },
  { id: "football-ground", label: "Football Ground", x: 530, y: 35, w: 50, h: 80,
    color: "#e8884a", textColor: "#fff", fontSize: 8, type: "sports", rotated: true,
    description: "Open football turf." },

  // ── SECOND TIER ────────────────────────────────────────────────
  { id: "dt-play-house", label: "DT Play House", x: 8, y: 115, w: 22, h: 60,
    color: "#c53030", textColor: "#fff", fontSize: 6, rotated: true, type: "service" },

  { id: "ai-d", label: "SNSCT AI Campus D-Block", x: 35, y: 115, w: 80, h: 115,
    color: "#3aa75a", textColor: "#fff", fontSize: 10, type: "academic", landmark: true,
    description: "AI campus D-Block with classrooms and labs.",
    departments: ["Artificial Intelligence", "Computer Science"] },

  { id: "ai-e", label: "SNSCT AI Campus E-Block", x: 118, y: 115, w: 30, h: 115,
    color: "#c93c7a", textColor: "#fff", fontSize: 7, rotated: true, type: "academic" },

  { id: "backup-genset-2", label: "Backup Genset 2", x: 151, y: 115, w: 68, h: 28,
    color: "#888", textColor: "#fff", fontSize: 7, type: "service" },

  { id: "ai-f", label: "SNSCT AI Campus F-Block", x: 222, y: 148, w: 60, h: 82,
    color: "#3aa75a", textColor: "#fff", fontSize: 8, type: "academic" },

  { id: "athletic-track", label: "Athletic Track, Football & Sports Auditorium",
    x: 295, y: 80, w: 160, h: 170, color: "#6b3a8a", textColor: "#fff", fontSize: 9,
    type: "sports", landmark: true, special: "athletic-track",
    description: "400m athletic track with football turf and the indoor sports auditorium.",
    facilities: ["400m Track", "Football Turf", "Indoor Arena"] },

  { id: "long-jump", label: "Long Jump", x: 458, y: 130, w: 18, h: 95,
    color: "#9050b5", textColor: "#fff", fontSize: 7, rotated: true, type: "sports" },
  { id: "volleyball-purple", label: "Volley Ball", x: 478, y: 130, w: 18, h: 95,
    color: "#9050b5", textColor: "#fff", fontSize: 6, rotated: true, type: "sports" },
  { id: "ball-badminton", label: "Ball Badminton", x: 498, y: 130, w: 18, h: 95,
    color: "#9050b5", textColor: "#fff", fontSize: 5, rotated: true, type: "sports" },

  { id: "basketball-court-top", label: "Basket Ball Court", x: 520, y: 110, w: 50, h: 40,
    color: "#a23030", textColor: "#fff", fontSize: 6, type: "sports" },
  { id: "kho-kho", label: "Kho-Kho Ground", x: 520, y: 155, w: 50, h: 80,
    color: "#a04050", textColor: "#fff", fontSize: 7, rotated: true, type: "sports" },

  { id: "girls-hostel", label: "Girls Hostel", x: 578, y: 100, w: 55, h: 160,
    color: "#7c3aa0", textColor: "#fff", fontSize: 10, rotated: true, type: "hostel",
    landmark: true, description: "Residential hostel for female students." },
  { id: "physiotherapy", label: "SNS College of Physiotherapy", x: 636, y: 100, w: 55, h: 160,
    color: "#9c4dbf", textColor: "#fff", fontSize: 8, rotated: true, type: "medical",
    description: "College offering physiotherapy and rehabilitation programs.",
    departments: ["Physiotherapy"] },
  { id: "allied-health", label: "SNS College of Allied Health Science", x: 694, y: 100, w: 55, h: 160,
    color: "#3a9a4a", textColor: "#fff", fontSize: 7, rotated: true, type: "medical",
    description: "College of allied health sciences." },

  { id: "centralized-finance-office", label: "Centralized Finance Office",
    x: 760, y: 200, w: 78, h: 70, color: "#a85e30", textColor: "#fff", fontSize: 7,
    type: "admin", description: "Centralised finance and accounts office.",
    timings: { open: "09:00", close: "17:00" } },

  // ── MIDDLE TIER (large AI Campus blocks) ─────────────────────
  { id: "staff-car-parking-l", label: "Staff Car Parking", x: 8, y: 240, w: 22, h: 230,
    color: "#999", textColor: "#fff", fontSize: 7, rotated: true, type: "parking", walkable: true },
  { id: "ai-c", label: "SNSCT AI Campus C-Block", x: 35, y: 240, w: 30, h: 230,
    color: "#6abbe0", textColor: "#fff", fontSize: 9, rotated: true, type: "academic" },
  { id: "ai-b", label: "SNSCT AI Campus B-Block", x: 70, y: 240, w: 162, h: 230,
    color: "#3a9a64", textColor: "#fff", fontSize: 13, type: "academic", landmark: true,
    description: "Main AI Campus block — large auditorium, faculty rooms and AI labs.",
    departments: ["Artificial Intelligence", "Machine Learning", "Data Science"],
    facilities: ["GPU Cluster", "Seminar Hall", "AI Research Lab"],
    timings: { open: "08:00", close: "20:00" } },
  { id: "ai-a", label: "SNSCT AI Campus A-Block", x: 237, y: 240, w: 100, h: 230,
    color: "#5ab070", textColor: "#fff", fontSize: 11, type: "academic", landmark: true,
    description: "AI Campus A-Block with classrooms and research labs.",
    departments: ["Computer Vision", "NLP", "Robotics"] },
  { id: "staff-car-parking-r", label: "Staff Car Parking", x: 342, y: 240, w: 22, h: 230,
    color: "#999", textColor: "#fff", fontSize: 7, rotated: true, type: "parking", walkable: true },

  { id: "wooden-shuttle", label: "Wooden Shuttle Court", x: 400, y: 260, w: 75, h: 80,
    color: "#c53030", textColor: "#fff", fontSize: 7, type: "sports",
    description: "Indoor wooden badminton courts." },

  { id: "pharmacy", label: "SNS College of Pharmacy and Health Sciences",
    x: 480, y: 250, w: 165, h: 75, color: "#d65f4a", textColor: "#fff", fontSize: 8,
    type: "medical", landmark: true,
    description: "College of Pharmacy and Health Sciences.",
    departments: ["Pharmaceutics", "Pharmacology", "Pharmacy Practice"],
    timings: { open: "08:00", close: "17:00" } },

  { id: "food-court", label: "Urban Space (Food Court)", x: 480, y: 330, w: 135, h: 60,
    color: "#e89045", textColor: "#fff", fontSize: 9, type: "food", landmark: true,
    description: "Multi-cuisine food court for students and staff.",
    timings: { open: "07:00", close: "21:00" } },

  { id: "dt-club", label: "DT Club House", x: 400, y: 350, w: 75, h: 130,
    color: "#c53030", textColor: "#fff", fontSize: 9, type: "service",
    description: "Recreation and student-club activities." },

  { id: "defence-training", label: "Defence Training", x: 650, y: 250, w: 55, h: 140,
    color: "#3a8a4a", textColor: "#fff", fontSize: 8, rotated: true, type: "service",
    description: "NCC and defence-training facility." },

  // Car Parking label / right edge cluster
  { id: "car-parking-label", label: "Car Parking", x: 845, y: 230, w: 165, h: 26,
    color: "#888", textColor: "#fff", fontSize: 10, type: "parking", walkable: true },
  { id: "bio-gas-plant", label: "Bio-Gas Plant", x: 845, y: 265, w: 50, h: 25,
    color: "#5d8a3c", textColor: "#fff", fontSize: 6, type: "service" },
  { id: "generator-2", label: "Generator Power Room", x: 900, y: 265, w: 50, h: 25,
    color: "#7a7a7a", textColor: "#fff", fontSize: 5, type: "service" },
  { id: "east-hostel", label: "Hostel", x: 850, y: 295, w: 60, h: 80,
    color: "#d63c5e", textColor: "#fff", fontSize: 12, type: "hostel",
    description: "Eastern residential hostel block." },
  { id: "guest-house", label: "Guest House", x: 915, y: 295, w: 50, h: 80,
    color: "#5fa050", textColor: "#fff", fontSize: 7, rotated: true, type: "service",
    description: "Guest accommodation block." },

  // ── LOWER MIDDLE ─────────────────────────────────────────────
  { id: "snsct-d", label: "SNSCT D-Block", x: 480, y: 405, w: 90, h: 70,
    color: "#5fa6d0", textColor: "#fff", fontSize: 10, type: "academic",
    description: "Core engineering departments." },
  { id: "library", label: "Vivekanandha Library", x: 480, y: 478, w: 90, h: 32,
    color: "#3f88b8", textColor: "#fff", fontSize: 9, type: "academic", landmark: true,
    description: "Central library with study halls and digital resources.",
    facilities: ["Study Hall", "Digital Lab", "24/7 Reading"],
    timings: { open: "08:00", close: "22:00" } },
  { id: "e-block", label: "E-Block", x: 580, y: 405, w: 70, h: 70,
    color: "#e89045", textColor: "#fff", fontSize: 10, type: "academic" },
  { id: "chanakya", label: "Chanakya Bhavan", x: 660, y: 405, w: 130, h: 80,
    color: "#5fa84a", textColor: "#fff", fontSize: 10, type: "academic", landmark: true,
    description: "Management and humanities departments." },
  { id: "alumni-lounge", label: "Alumni Lounge", x: 580, y: 490, w: 70, h: 22,
    color: "#888", textColor: "#fff", fontSize: 6, type: "service" },

  { id: "innovation-hub", label: "SNS iNNovation Hub G-Block",
    x: 850, y: 385, w: 165, h: 145, color: "#d4307a", textColor: "#fff", fontSize: 11,
    type: "academic", landmark: true,
    description: "Flagship incubator and R&D centre with maker space, AI labs and startup studios.",
    departments: ["Innovation Lab", "Startup Incubator", "Maker Space"],
    facilities: ["3D Printing", "IoT Lab", "VR Studio", "Co-working"],
    timings: { open: "08:00", close: "20:00" } },

  { id: "sai-baba-temple", label: "Sri Sai Baba Temple", x: 433, y: 470, w: 16, h: 38,
    color: "#a23030", textColor: "#fff", fontSize: 4, rotated: true, type: "landmark" },

  // ── BOTTOM TIER ──────────────────────────────────────────────
  { id: "volleyball-1", label: "Volleyball Court I", x: 8, y: 520, w: 50, h: 42,
    color: "#8a2030", textColor: "#fff", fontSize: 6, type: "sports" },
  { id: "volleyball-2", label: "Volleyball Court II", x: 8, y: 565, w: 50, h: 42,
    color: "#8a2030", textColor: "#fff", fontSize: 6, type: "sports" },
  { id: "beach-volleyball", label: "Beach Volleyball", x: 8, y: 610, w: 50, h: 48,
    color: "#d65f4a", textColor: "#fff", fontSize: 6, type: "sports" },
  { id: "sns-spine", label: "SNS SPINE / B-SPINE", x: 8, y: 661, w: 50, h: 75,
    color: "#a52030", textColor: "#fff", fontSize: 7, type: "service" },

  { id: "chess-table-tennis", label: "Chess / Table Tennis", x: 65, y: 520, w: 72, h: 50,
    color: "#6a98c0", textColor: "#fff", fontSize: 8, type: "sports" },
  { id: "piston-factory", label: "Piston Factory Coffee Day", x: 140, y: 520, w: 160, h: 50,
    color: "#7a7a7a", textColor: "#fff", fontSize: 9, type: "food",
    description: "Coffee shop and lounge.",
    timings: { open: "07:00", close: "22:00" } },

  { id: "hand-ball", label: "Hand Ball / Fives Football Court", x: 65, y: 575, w: 72, h: 85,
    color: "#a85030", textColor: "#fff", fontSize: 6, type: "sports" },
  { id: "tennis-court", label: "Tennis Court", x: 140, y: 575, w: 160, h: 55,
    color: "#6090c0", textColor: "#fff", fontSize: 10, type: "sports" },
  { id: "outdoor-fitness", label: "Outdoor Fitness & Mgmt Games", x: 140, y: 635, w: 160, h: 22,
    color: "#5d8a3c", textColor: "#fff", fontSize: 6, type: "sports" },
  { id: "basketball-court-bottom", label: "Basket Ball Court", x: 140, y: 660, w: 160, h: 55,
    color: "#a23030", textColor: "#fff", fontSize: 10, type: "sports" },

  { id: "nursing", label: "SNS College of Nursing", x: 65, y: 661, w: 200, h: 75,
    color: "#c93c7a", textColor: "#fff", fontSize: 11, type: "medical", landmark: true,
    description: "Nursing college.", departments: ["Nursing", "Healthcare"],
    timings: { open: "08:00", close: "17:00" } },

  { id: "students-tw-parking-1", label: "Students Two Wheeler Parking",
    x: 305, y: 520, w: 32, h: 215, color: "#aaa", textColor: "#fff", fontSize: 6,
    rotated: true, type: "parking", walkable: true },
  { id: "staff-parking-bottom", label: "Staff Parking", x: 377, y: 520, w: 22, h: 215,
    color: "#aaa", textColor: "#fff", fontSize: 7, rotated: true, type: "parking", walkable: true },

  { id: "mess-block", label: "Mess Block", x: 455, y: 525, w: 70, h: 60,
    color: "#e89045", textColor: "#fff", fontSize: 10, type: "food",
    description: "Student mess hall.", timings: { open: "07:00", close: "21:30" } },

  { id: "boys-hostel-siruvani", label: "Boys Hostel Siruvani", x: 455, y: 590, w: 38, h: 118,
    color: "#c53030", textColor: "#fff", fontSize: 7, rotated: true, type: "hostel" },
  { id: "boys-hostel-vaigai", label: "Boys Hostel Vaigai", x: 497, y: 590, w: 38, h: 118,
    color: "#a85030", textColor: "#fff", fontSize: 7, rotated: true, type: "hostel" },
  { id: "admissions-office", label: "Admissions Office", x: 540, y: 590, w: 18, h: 118,
    color: "#888", textColor: "#fff", fontSize: 5, rotated: true, type: "admin" },
  { id: "24-7-lab", label: "24/7 Lab", x: 562, y: 590, w: 18, h: 90,
    color: "#888", textColor: "#fff", fontSize: 5, rotated: true, type: "service" },
  { id: "visitors-parking", label: "Visitors Parking", x: 584, y: 590, w: 18, h: 90,
    color: "#aaa", textColor: "#fff", fontSize: 5, rotated: true, type: "parking", walkable: true },

  { id: "uliyum-nanum", label: "Uliyum Nanum", x: 615, y: 520, w: 205, h: 200,
    color: "#7fb858", textColor: "#fff", fontSize: 13, type: "landmark",
    landmark: true, special: "uliyum", walkable: true,
    description: "Iconic central roundabout and gathering plaza of the campus." },

  { id: "admin-a", label: "SNSCT A-Block Administrative Office", x: 830, y: 540, w: 30, h: 185,
    color: "#666", textColor: "#fff", fontSize: 7, rotated: true, type: "admin", landmark: true,
    description: "Principal's office, examination cell and student services.",
    departments: ["Principal Office", "Examination Cell", "Accounts"],
    timings: { open: "09:00", close: "17:00" } },
  { id: "admin-b", label: "SNSCT B-Block", x: 862, y: 540, w: 30, h: 185,
    color: "#666", textColor: "#fff", fontSize: 9, rotated: true, type: "admin" },
  { id: "admin-c", label: "SNSCT C-Block", x: 894, y: 540, w: 30, h: 185,
    color: "#666", textColor: "#fff", fontSize: 9, rotated: true, type: "admin" },
  { id: "students-tw-parking-2", label: "Students Two Wheeler Parking",
    x: 926, y: 540, w: 28, h: 185, color: "#aaa", textColor: "#fff", fontSize: 5,
    rotated: true, type: "parking", walkable: true },
  { id: "staff-tw-parking", label: "Staff Two Wheeler Parking", x: 956, y: 540, w: 28, h: 185,
    color: "#aaa", textColor: "#fff", fontSize: 5, rotated: true, type: "parking", walkable: true },

  // ── BOTTOM EDGE ──────────────────────────────────────────────
  { id: "rear-gate", label: "Rear Gate", x: 80, y: 760, w: 60, h: 28,
    color: "#2b2f36", textColor: "#fff", fontSize: 8, type: "landmark", walkable: true,
    description: "Rear entrance to the campus." },
  { id: "admission-x", label: "Admission Center X-Block", x: 445, y: 740, w: 175, h: 28,
    color: "#888", textColor: "#fff", fontSize: 9, type: "admin", landmark: true,
    description: "Student admission, enrollment and verification.",
    timings: { open: "09:00", close: "17:00" } },
  { id: "clinic", label: "Clinic", x: 445, y: 775, w: 40, h: 22,
    color: "#888", textColor: "#fff", fontSize: 7, type: "medical" },
  { id: "atm", label: "ATM", x: 490, y: 775, w: 40, h: 22,
    color: "#888", textColor: "#fff", fontSize: 7, type: "service" },
  { id: "front-gate", label: "Front Gate", x: 535, y: 775, w: 60, h: 22,
    color: "#2b2f36", textColor: "#fff", fontSize: 8, type: "landmark", walkable: true,
    landmark: true,
    description: "Main entrance to the SNS College campus." },
  { id: "vinayagar-temple", label: "Vinayagar Temple", x: 820, y: 745, w: 22, h: 35,
    color: "#a23030", textColor: "#fff", fontSize: 4, rotated: true, type: "landmark" },
];

export const MAP_BUILDINGS_BY_ID = Object.fromEntries(
  MAP_BUILDINGS.map((b) => [b.id, b]),
) as Record<string, Map2DBuilding>;

// ── EVENT BINDINGS ────────────────────────────────────────────────────
// Pulsing animated event markers on top of buildings.

export type Map2DEventCategory =
  | "WORKSHOP"
  | "HACKATHON"
  | "SPORTS"
  | "CULTURAL"
  | "PLACEMENT"
  | "EMERGENCY";

export interface Map2DEvent {
  id: string;
  title: string;
  category: Map2DEventCategory;
  buildingId: string;
  time: string;
  description: string;
}

export const MAP_EVENT_CATEGORIES: Record<
  Map2DEventCategory,
  { label: string; color: string; glow: string; icon: string; pulsing?: boolean }
> = {
  WORKSHOP: { label: "Workshop", color: "#3b82f6", glow: "rgba(59,130,246,0.65)", icon: "🔬" },
  HACKATHON: { label: "Hackathon", color: "#a855f7", glow: "rgba(168,85,247,0.7)", icon: "⚡" },
  SPORTS: { label: "Sports", color: "#22c55e", glow: "rgba(34,197,94,0.65)", icon: "🏆" },
  CULTURAL: { label: "Cultural", color: "#fb923c", glow: "rgba(251,146,60,0.65)", icon: "🎵" },
  PLACEMENT: { label: "Placement", color: "#fcd34d", glow: "rgba(252,211,77,0.7)", icon: "💼" },
  EMERGENCY: { label: "Emergency", color: "#ef4444", glow: "rgba(239,68,68,0.8)", icon: "🚨", pulsing: true },
};

export const MAP_EVENTS: Map2DEvent[] = [
  { id: "m-evt-1", title: "AI/ML Workshop", category: "WORKSHOP", buildingId: "ai-b",
    time: "Today · 2:00 PM", description: "Hands-on session on transformer architectures." },
  { id: "m-evt-2", title: "Innov8 Hackathon", category: "HACKATHON", buildingId: "innovation-hub",
    time: "Today · 6:00 PM", description: "24-hour hackathon at the iNNovation Hub." },
  { id: "m-evt-3", title: "Inter-Dept Cricket", category: "SPORTS", buildingId: "cricket-pitch",
    time: "Today · 4:00 PM", description: "Inter-department cricket finals." },
  { id: "m-evt-4", title: "Cultural Night", category: "CULTURAL", buildingId: "athletic-track",
    time: "Tonight · 7:30 PM", description: "Music, dance and drama by student clubs." },
  { id: "m-evt-5", title: "TCS Placement Drive", category: "PLACEMENT", buildingId: "admin-a",
    time: "Tomorrow · 9:00 AM", description: "On-campus placement drive for final years." },
  { id: "m-evt-6", title: "Book Talk", category: "WORKSHOP", buildingId: "library",
    time: "Today · 5:00 PM", description: "Author meet-and-greet at the central library." },
  { id: "m-evt-7", title: "Open Mic", category: "CULTURAL", buildingId: "food-court",
    time: "Today · 6:30 PM", description: "Student open mic at the food court." },
  { id: "m-evt-8", title: "Fire Drill", category: "EMERGENCY", buildingId: "boys-hostel-g",
    time: "Today · 3:00 PM", description: "Mandatory fire-drill at the hostel." },
];

export const mapEventsForBuilding = (id: string) =>
  MAP_EVENTS.filter((e) => e.buildingId === id);

// ── NPC WAYPOINT ROUTES (orange walkable paths between buildings) ────
export interface NPC2DRoute {
  path: [number, number][];
  speed: number;
  shirt: string;
  hair: string;
}

export const MAP_NPC_ROUTES: NPC2DRoute[] = [
  { path: [[565, 800], [565, 600], [620, 510], [820, 510], [820, 730]],
    speed: 60, shirt: "#e11d48", hair: "#1a1a1a" },
  { path: [[450, 510], [450, 400], [580, 400], [800, 400], [900, 380], [900, 530]],
    speed: 70, shirt: "#22c55e", hair: "#3b1f12" },
  { path: [[300, 230], [285, 470], [380, 470], [380, 720]],
    speed: 65, shirt: "#22d3ee", hair: "#0f172a" },
  { path: [[155, 235], [155, 470], [300, 470], [400, 470]],
    speed: 55, shirt: "#facc15", hair: "#2a1607" },
  { path: [[745, 270], [745, 380], [830, 380], [830, 535]],
    speed: 60, shirt: "#fb923c", hair: "#1a1a1a" },
  { path: [[60, 240], [60, 510], [140, 510], [305, 510]],
    speed: 70, shirt: "#a855f7", hair: "#3b1f12" },
  { path: [[700, 90], [580, 90], [565, 270], [620, 350]],
    speed: 50, shirt: "#0ea5e9", hair: "#2a1607" },
];

// ── COORDINATE HELPERS ───────────────────────────────────────────────
export const MAP_WIDTH = 1024;
export const MAP_HEIGHT = 820;

/** Closest building under a point (or null). Walkable rectangles are skipped. */
export function buildingAt(x: number, y: number): Map2DBuilding | null {
  for (const b of MAP_BUILDINGS) {
    if (b.walkable) continue;
    if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) return b;
  }
  return null;
}

/** Nearest landmark building centre to a point, within `range`. */
export function nearestLandmark(x: number, y: number, range = 80): Map2DBuilding | null {
  let best: Map2DBuilding | null = null;
  let bestD = range * range;
  for (const b of MAP_BUILDINGS) {
    if (!b.landmark) continue;
    const cx = b.x + b.w / 2;
    const cy = b.y + b.h / 2;
    const d = (cx - x) ** 2 + (cy - y) ** 2;
    if (d < bestD) {
      bestD = d;
      best = b;
    }
  }
  return best;
}
