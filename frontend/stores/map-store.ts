"use client";

import { create } from "zustand";

interface MapState {
  // Avatar position in SVG units (1024 × 820 viewBox).
  px: number;
  py: number;
  /** Facing angle in radians (0 = right / east). */
  facing: number;
  isMoving: boolean;
  isRunning: boolean;
  speed: number;

  // Input
  inputX: number;
  inputY: number;
  inputRun: boolean;

  // Selection
  selectedBuilding: string | null;
  nearbyBuilding: string | null;
  navigationTargetId: string | null;

  // Camera (the visible viewport offset for pan/zoom)
  zoom: number;

  // UI
  navTab: "home" | "explore" | "events" | "clubs" | "notifications" | "profile";
  showEventsPanel: boolean;
  showNotifications: boolean;

  // Time / weather
  timeOfDay: number;
  weather: "clear" | "cloudy" | "rainy";

  // Actions
  setAvatar: (px: number, py: number, facing: number, isMoving: boolean, isRunning: boolean, speed: number) => void;
  setInput: (x: number, y: number, run: boolean) => void;
  setSelectedBuilding: (id: string | null) => void;
  setNearbyBuilding: (id: string | null) => void;
  setNavigationTarget: (id: string | null) => void;
  setZoom: (z: number) => void;
  setNavTab: (tab: MapState["navTab"]) => void;
  setShowEventsPanel: (show: boolean) => void;
  setShowNotifications: (show: boolean) => void;
  setTimeOfDay: (t: number) => void;
  setWeather: (w: MapState["weather"]) => void;
}

export const useMapStore = create<MapState>((set) => ({
  // Start at the Front Gate (bottom-centre).
  px: 565,
  py: 800,
  facing: -Math.PI / 2, // facing north (up)
  isMoving: false,
  isRunning: false,
  speed: 0,

  inputX: 0,
  inputY: 0,
  inputRun: false,

  selectedBuilding: null,
  nearbyBuilding: null,
  navigationTargetId: null,

  zoom: 1,

  navTab: "explore",
  showEventsPanel: false,
  showNotifications: false,

  timeOfDay: 14,
  weather: "clear",

  setAvatar: (px, py, facing, isMoving, isRunning, speed) =>
    set({ px, py, facing, isMoving, isRunning, speed }),
  setInput: (x, y, run) => set({ inputX: x, inputY: y, inputRun: run }),
  setSelectedBuilding: (id) => set({ selectedBuilding: id }),
  setNearbyBuilding: (id) => set({ nearbyBuilding: id }),
  setNavigationTarget: (id) => set({ navigationTargetId: id }),
  setZoom: (z) => set({ zoom: z }),
  setNavTab: (tab) => set({ navTab: tab }),
  setShowEventsPanel: (s) => set({ showEventsPanel: s }),
  setShowNotifications: (s) => set({ showNotifications: s }),
  setTimeOfDay: (t) => set({ timeOfDay: t }),
  setWeather: (w) => set({ weather: w }),
}));
