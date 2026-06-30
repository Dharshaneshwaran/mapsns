"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Navigation, X } from "lucide-react";
import {
  MAP_BUILDINGS_BY_ID,
  MAP_EVENTS,
  MAP_EVENT_CATEGORIES,
} from "@/lib/campus/map2d";
import { useMapStore } from "@/stores/map-store";
import styles from "./hud.module.css";

export function EventsPanel() {
  const show = useMapStore((s) => s.showEventsPanel);
  const close = () => useMapStore.getState().setShowEventsPanel(false);
  const setNav = useMapStore((s) => s.setNavigationTarget);
  const setSelected = useMapStore((s) => s.setSelectedBuilding);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, x: 60 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 60 }}
          transition={{ type: "spring", stiffness: 280, damping: 28 }}
          className="pointer-events-auto fixed right-4 top-24 bottom-32 w-[min(94vw,340px)] z-30"
        >
          <div className={`${styles.glass} h-full flex flex-col overflow-hidden`}>
            <div className="p-4 pb-3 border-b border-white/10 flex items-center justify-between">
              <div>
                <div className="text-cyan-300 text-[11px] tracking-widest uppercase font-semibold">
                  Live · Campus
                </div>
                <h2 className="text-white text-lg font-bold leading-tight">Events Today</h2>
              </div>
              <button
                onClick={close}
                className="text-white/60 hover:text-white p-1 rounded-md hover:bg-white/10"
                aria-label="Close events panel"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className={`flex-1 overflow-y-auto ${styles.noScrollbar} p-3 space-y-2`}>
              {MAP_EVENTS.map((e) => {
                const cfg = MAP_EVENT_CATEGORIES[e.category];
                const b = MAP_BUILDINGS_BY_ID[e.buildingId];
                return (
                  <div
                    key={e.id}
                    className="rounded-xl p-3 bg-white/5 border border-white/10 hover:border-cyan-400/40 hover:bg-white/8 transition-colors"
                  >
                    <div className="flex items-start gap-2">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-lg shrink-0"
                        style={{ background: cfg.color, boxShadow: `0 0 16px ${cfg.glow}` }}
                      >
                        {cfg.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-white font-semibold text-sm">{e.title}</div>
                        <div className="text-white/60 text-[11px]">
                          {b?.label} · {e.time}
                        </div>
                        <p className="text-white/70 text-[11px] mt-1">{e.description}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-2.5">
                      <button
                        onClick={() => {
                          setNav(e.buildingId);
                          close();
                        }}
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 text-slate-900"
                      >
                        <Navigation className="w-3 h-3" />
                        Navigate
                      </button>
                      <button
                        onClick={() => setSelected(e.buildingId)}
                        className="px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-white/10 text-white/85 hover:bg-white/15"
                      >
                        Details
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
