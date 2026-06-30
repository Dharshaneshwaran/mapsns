"use client";

import { Battery, Cloud, Gauge, Sun, Wifi } from "lucide-react";
import { useEffect, useState } from "react";
import { useMapStore } from "@/stores/map-store";
import styles from "./hud.module.css";

export function StatusBar() {
  const speed = useMapStore((s) => s.speed);
  const isRunning = useMapStore((s) => s.isRunning);
  const weather = useMapStore((s) => s.weather);
  const timeOfDay = useMapStore((s) => s.timeOfDay);
  const setTime = useMapStore((s) => s.setTimeOfDay);
  const setWeather = useMapStore((s) => s.setWeather);

  const [battery, setBattery] = useState(85);
  useEffect(() => {
    const nav = navigator as Navigator & {
      getBattery?: () => Promise<{ level: number; addEventListener: (e: string, cb: () => void) => void }>;
    };
    if (typeof nav.getBattery === "function") {
      nav.getBattery()
        .then((b) => {
          const update = () => setBattery(Math.round(b.level * 100));
          update();
          b.addEventListener("levelchange", update);
        })
        .catch(() => {});
    }
  }, []);

  const isNight = timeOfDay < 7 || timeOfDay > 18.5;
  const kmh = isRunning ? (speed * 12).toFixed(1) : (speed * 5).toFixed(1);

  return (
    <div className={`${styles.glass} px-3 py-2 flex flex-col gap-1.5 text-xs text-white min-w-[170px]`}>
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-white/70">GPS</span>
        <span className="ml-auto text-emerald-300 font-medium">High</span>
      </div>
      <div className="flex items-center gap-2">
        <Wifi className="w-3.5 h-3.5 text-cyan-300" />
        <span className="text-white/70">Network</span>
        <span className="ml-auto text-cyan-200 font-medium">5G</span>
      </div>
      <div className="flex items-center gap-2">
        <Battery className="w-3.5 h-3.5 text-emerald-300" />
        <span className="text-white/70">Battery</span>
        <span className="ml-auto text-white font-medium">{battery}%</span>
      </div>
      <div className="flex items-center gap-2">
        <Gauge className="w-3.5 h-3.5 text-amber-300" />
        <span className="text-white/70">Speed</span>
        <span className="ml-auto text-white font-medium">{kmh} km/h</span>
      </div>
      <button
        onClick={() => setTime((timeOfDay + 4) % 24)}
        className="flex items-center gap-2 hover:text-cyan-200"
        title="Cycle time of day"
      >
        {isNight ? <Cloud className="w-3.5 h-3.5 text-indigo-300" /> : <Sun className="w-3.5 h-3.5 text-amber-300" />}
        <span className="text-white/70">Time</span>
        <span className="ml-auto text-white font-medium">{Math.round(timeOfDay).toString().padStart(2, "0")}:00</span>
      </button>
      <button
        onClick={() => setWeather(weather === "clear" ? "cloudy" : weather === "cloudy" ? "rainy" : "clear")}
        className="flex items-center gap-2 hover:text-cyan-200"
        title="Cycle weather"
      >
        <span className="text-lg leading-none">{weather === "clear" ? "☀️" : weather === "cloudy" ? "☁️" : "🌧️"}</span>
        <span className="text-white/70 capitalize">{weather}</span>
        <span className="ml-auto text-white font-medium">28°C</span>
      </button>
    </div>
  );
}
