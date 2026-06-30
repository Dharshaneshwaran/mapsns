"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Navigation2, X } from "lucide-react";
import { useMemo } from "react";
import { MAP_BUILDINGS_BY_ID } from "@/lib/campus/map2d";
import { useMapStore } from "@/stores/map-store";
import styles from "./hud.module.css";

export function NavigationBanner() {
  const targetId = useMapStore((s) => s.navigationTargetId);
  const px = useMapStore((s) => s.px);
  const py = useMapStore((s) => s.py);
  const setNav = useMapStore((s) => s.setNavigationTarget);
  const target = targetId ? MAP_BUILDINGS_BY_ID[targetId] : null;

  const { distance, etaSec, arrived } = useMemo(() => {
    if (!target) return { distance: 0, etaSec: 0, arrived: false };
    const tx = target.x + target.w / 2;
    const ty = target.y + target.h / 2;
    const d = Math.hypot(tx - px, ty - py);
    return {
      distance: d * 0.4, // approximate metres
      etaSec: (d / 130) * 1.4,
      arrived: d < Math.max(target.w, target.h) / 2 + 6,
    };
  }, [target, px, py]);

  return (
    <AnimatePresence>
      {target && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="pointer-events-auto fixed top-4 left-1/2 -translate-x-1/2 z-30"
        >
          <div className={`${styles.glass} px-4 py-2.5 flex items-center gap-3 ${arrived ? styles.neonGreen : styles.neonRing}`}>
            <div className="w-9 h-9 rounded-full bg-cyan-400/20 flex items-center justify-center text-cyan-300">
              <Navigation2 className="w-4 h-4" />
            </div>
            <div>
              {arrived ? (
                <>
                  <div className="text-emerald-300 text-[11px] tracking-widest font-bold uppercase">Arrived</div>
                  <div className="text-white text-sm font-bold">{target.label}</div>
                </>
              ) : (
                <>
                  <div className="text-cyan-300 text-[11px] tracking-widest font-bold uppercase">Navigating to</div>
                  <div className="text-white text-sm font-bold leading-tight">{target.label}</div>
                  <div className="text-white/60 text-[11px]">
                    {distance.toFixed(0)} m · ETA {Math.max(1, Math.round(etaSec))}s
                  </div>
                </>
              )}
            </div>
            <button
              onClick={() => setNav(null)}
              className="ml-2 p-1.5 rounded-lg hover:bg-white/10 text-white/70 hover:text-white"
              aria-label="Cancel navigation"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
