"use client";

import { AnimatePresence, motion } from "framer-motion";
import { MAP_BUILDINGS_BY_ID } from "@/lib/campus/map2d";
import { useMapStore } from "@/stores/map-store";
import styles from "./hud.module.css";

export function NearbyPrompt() {
  const nearby = useMapStore((s) => s.nearbyBuilding);
  const selected = useMapStore((s) => s.selectedBuilding);
  const showEvents = useMapStore((s) => s.showEventsPanel);
  const showNotif = useMapStore((s) => s.showNotifications);
  const open = (id: string) => useMapStore.getState().setSelectedBuilding(id);
  const b = nearby ? MAP_BUILDINGS_BY_ID[nearby] : null;
  const visible = b && !selected && !showEvents && !showNotif;

  return (
    <AnimatePresence>
      {visible && b && (
        <motion.button
          key={b.id}
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.95 }}
          onClick={() => open(b.id)}
          className={`pointer-events-auto fixed left-1/2 -translate-x-1/2 bottom-28 z-30 ${styles.glass} ${styles.pulse} px-5 py-3 flex items-center gap-3`}
        >
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg bg-gradient-to-br from-cyan-400/40 to-emerald-400/30 border border-cyan-400/40 shadow-[0_0_18px_rgba(34,211,238,0.45)]">
            ✨
          </div>
          <div className="text-left">
            <div className="text-cyan-300 text-[10px] tracking-widest font-bold uppercase">Press to interact</div>
            <div className="text-white text-sm font-bold leading-tight">{b.label}</div>
          </div>
        </motion.button>
      )}
    </AnimatePresence>
  );
}
