"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, MapPin, Play, Power, Square, TestTube } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { DEMO_SPOTS, useDemoStore } from "@/stores/demo-store";

/**
 * Floating "I'm pretending to be inside the campus" control panel.
 *
 * Available on every page. Lets the tester:
 * - Toggle demo mode (spoof their GPS into a campus location)
 * - Pick which building they're "standing next to"
 * - Start / stop the auto-walk tour on the /campus printed map
 * - Jump straight to either the 2D map or the printed-map experience
 */
export function DemoModePanel() {
  const enabled = useDemoStore((s) => s.enabled);
  const spotId = useDemoStore((s) => s.spotId);
  const autoTour = useDemoStore((s) => s.autoTour);
  const setEnabled = useDemoStore((s) => s.setEnabled);
  const setSpot = useDemoStore((s) => s.setSpot);
  const setAutoTour = useDemoStore((s) => s.setAutoTour);

  const [open, setOpen] = useState(false);

  return (
    <div className="fixed left-4 bottom-4 z-[60] pointer-events-auto">
      <motion.button
        onClick={() => setOpen((o) => !o)}
        whileTap={{ scale: 0.95 }}
        className={[
          "flex items-center gap-2 rounded-full px-3.5 py-2 text-xs font-semibold border backdrop-blur-md transition-colors",
          enabled
            ? "bg-emerald-500/25 border-emerald-400/60 text-emerald-100 shadow-[0_0_18px_rgba(34,197,94,0.45)]"
            : "bg-black/55 border-white/15 text-white/85 hover:bg-black/75",
        ].join(" ")}
      >
        <TestTube className="w-3.5 h-3.5" />
        Demo Mode
        <span
          className={[
            "ml-1 inline-flex w-2 h-2 rounded-full",
            enabled ? "bg-emerald-300 animate-pulse" : "bg-white/30",
          ].join(" ")}
        />
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="absolute left-0 bottom-12 w-80 max-w-[calc(100vw-2rem)] rounded-2xl border border-white/15 bg-slate-950/85 backdrop-blur-xl shadow-2xl overflow-hidden"
          >
            <div className="p-4 space-y-3 max-h-[70vh] overflow-y-auto">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-emerald-300 text-[10px] tracking-[0.3em] font-bold uppercase">
                    Test as if on campus
                  </div>
                  <div className="text-white text-sm font-semibold leading-tight mt-0.5">
                    Spoof your location to inside SNS
                  </div>
                  <p className="text-white/55 text-[11px] mt-1">
                    The 2D map will think you&apos;re standing at the selected
                    building; the 3D campus will spawn your avatar there.
                  </p>
                </div>
                <button
                  onClick={() => setEnabled(!enabled)}
                  className={[
                    "shrink-0 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold border",
                    enabled
                      ? "bg-emerald-400 text-slate-950 border-emerald-300"
                      : "bg-white/5 text-white/85 border-white/15 hover:bg-white/10",
                  ].join(" ")}
                >
                  <Power className="w-3 h-3" />
                  {enabled ? "ON" : "OFF"}
                </button>
              </div>

              <div>
                <div className="text-white/70 text-[11px] font-semibold mb-1.5">
                  Stand at…
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {DEMO_SPOTS.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => {
                        setSpot(s.id);
                        if (!enabled) setEnabled(true);
                      }}
                      className={[
                        "text-left rounded-lg px-2.5 py-1.5 text-[11px] border transition-colors",
                        spotId === s.id
                          ? "bg-cyan-400/15 border-cyan-400/50 text-cyan-200"
                          : "bg-white/5 border-white/10 text-white/80 hover:bg-white/10",
                      ].join(" ")}
                    >
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span className="font-semibold truncate">{s.label}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="text-white text-xs font-semibold">Auto-Tour</div>
                    <div className="text-white/55 text-[10px]">
                      Walks the avatar through every landmark on the 3D map.
                    </div>
                  </div>
                  <button
                    onClick={() => setAutoTour(!autoTour)}
                    className={[
                      "shrink-0 flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold border",
                      autoTour
                        ? "bg-amber-400 text-slate-950 border-amber-300"
                        : "bg-white/5 text-white/85 border-white/15 hover:bg-white/10",
                    ].join(" ")}
                  >
                    {autoTour ? (
                      <>
                        <Square className="w-3 h-3" /> Stop
                      </>
                    ) : (
                      <>
                        <Play className="w-3 h-3" /> Start
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <Link
                  href="/"
                  className="text-center text-[11px] font-semibold rounded-lg py-2 bg-white/5 border border-white/10 text-white/85 hover:bg-white/10"
                >
                  Open 2D Map
                </Link>
                <Link
                  href="/campus"
                  className="text-center text-[11px] font-semibold rounded-lg py-2 bg-gradient-to-r from-cyan-400 to-emerald-400 text-slate-950"
                >
                  Open 3D Campus
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
