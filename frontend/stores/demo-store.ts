"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Coordinates } from "@/types/event";
import {
  AI_CAMPUS_LOCATION,
  CSE_DEPT_LOCATION,
  DT_PLAYHOUSE_LOCATION,
  I_HUB_LOCATION,
  MECH_DEPT_LOCATION,
  SNS_COLLEGE_OF_TECHNOLOGY_LOCATION,
  SNS_LAWN_LOCATION,
  SPINE_CENTER_LOCATION,
} from "@/lib/college-location";

/**
 * Shared "I'm pretending to be inside the campus" state. When enabled,
 * `useLocation` returns the spoofed coordinates and the `/campus`
 * experience can spawn the avatar at the matching building.
 */

export interface DemoSpot {
  id: string;
  label: string;
  description: string;
  /** Real-world GPS for the 2D map and proximity logic. */
  coords: Coordinates;
  /** Position on the printed campus map (SVG units 0–1024 × 0–820). */
  mapPosition: [number, number];
  /** Optional building id to highlight when teleporting. */
  buildingId?: string;
}

export const DEMO_SPOTS: DemoSpot[] = [
  {
    id: "front-gate",
    label: "Front Gate",
    description: "Main entrance to SNS College.",
    coords: SNS_COLLEGE_OF_TECHNOLOGY_LOCATION,
    mapPosition: [565, 800],
    buildingId: "front-gate",
  },
  {
    id: "innovation-hub",
    label: "Innovation Hub G-Block",
    description: "Flagship incubator and R&D centre.",
    coords: I_HUB_LOCATION,
    mapPosition: [932, 457],
    buildingId: "innovation-hub",
  },
  {
    id: "ai-b",
    label: "AI Campus B-Block",
    description: "AI/ML labs and seminar halls.",
    coords: AI_CAMPUS_LOCATION,
    mapPosition: [151, 360],
    buildingId: "ai-b",
  },
  {
    id: "library",
    label: "Vivekanandha Library",
    description: "Central library with study halls.",
    coords: CSE_DEPT_LOCATION,
    mapPosition: [525, 494],
    buildingId: "library",
  },
  {
    id: "food-court",
    label: "Urban Space Food Court",
    description: "Multi-cuisine food court.",
    coords: SNS_LAWN_LOCATION,
    mapPosition: [548, 360],
    buildingId: "food-court",
  },
  {
    id: "athletic-track",
    label: "Sports Auditorium",
    description: "Athletic track and indoor sports.",
    coords: MECH_DEPT_LOCATION,
    mapPosition: [375, 165],
    buildingId: "athletic-track",
  },
  {
    id: "boys-hostel-g",
    label: "Boys Hostel G-Block",
    description: "Boys residential hostel.",
    coords: SPINE_CENTER_LOCATION,
    mapPosition: [148, 63],
    buildingId: "boys-hostel-g",
  },
  {
    id: "girls-hostel",
    label: "Girls Hostel",
    description: "Girls residential hostel.",
    coords: DT_PLAYHOUSE_LOCATION,
    mapPosition: [605, 180],
    buildingId: "girls-hostel",
  },
  {
    id: "nursing",
    label: "College of Nursing",
    description: "Nursing programs.",
    coords: {
      latitude: 11.10025,
      longitude: 77.0258,
    },
    mapPosition: [165, 698],
    buildingId: "nursing",
  },
  {
    id: "admin-a",
    label: "Admin A-Block",
    description: "Principal & exam cell.",
    coords: {
      latitude: 11.10075,
      longitude: 77.02795,
    },
    mapPosition: [845, 632],
    buildingId: "admin-a",
  },
  {
    id: "uliyum-nanum",
    label: "Uliyum Nanum",
    description: "Central plaza roundabout.",
    coords: {
      latitude: 11.1009,
      longitude: 77.0273,
    },
    mapPosition: [717, 620],
    buildingId: "uliyum-nanum",
  },
];

export const DEMO_SPOTS_BY_ID = Object.fromEntries(
  DEMO_SPOTS.map((s) => [s.id, s]),
) as Record<string, DemoSpot>;

interface DemoState {
  enabled: boolean;
  spotId: string;
  /** Auto-walk demo tour that visits every spot in order. */
  autoTour: boolean;

  setEnabled: (enabled: boolean) => void;
  setSpot: (id: string) => void;
  setAutoTour: (run: boolean) => void;
  toggle: () => void;
}

export const useDemoStore = create<DemoState>()(
  persist(
    (set) => ({
      enabled: false,
      spotId: "front-gate",
      autoTour: false,
      setEnabled: (enabled) => set({ enabled }),
      setSpot: (id) => set({ spotId: id }),
      setAutoTour: (run) => set({ autoTour: run }),
      toggle: () => set((s) => ({ enabled: !s.enabled })),
    }),
    { name: "sns-demo-mode" },
  ),
);

export const currentDemoSpot = (): DemoSpot => {
  const { spotId } = useDemoStore.getState();
  return DEMO_SPOTS_BY_ID[spotId] ?? DEMO_SPOTS[0]!;
};
