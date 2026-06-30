"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Building2, Clock, Heart, Navigation, Share2, Sparkles, X } from "lucide-react";
import { useState } from "react";
import { MAP_BUILDINGS_BY_ID, MAP_EVENT_CATEGORIES, mapEventsForBuilding } from "@/lib/campus/map2d";
import { useMapStore } from "@/stores/map-store";
import styles from "./hud.module.css";

export function BuildingInfoCard() {
  const id = useMapStore((s) => s.selectedBuilding);
  const setSelected = useMapStore((s) => s.setSelectedBuilding);
  const setNav = useMapStore((s) => s.setNavigationTarget);

  const b = id ? MAP_BUILDINGS_BY_ID[id] : null;
  const events = id ? mapEventsForBuilding(id) : [];
  const [fav, setFav] = useState(false);

  return (
    <AnimatePresence>
      {b && (
        <motion.div
          key={b.id}
          initial={{ opacity: 0, x: 60, scale: 0.96 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 60, scale: 0.96 }}
          transition={{ type: "spring", stiffness: 280, damping: 28 }}
          className="pointer-events-auto fixed right-4 top-24 bottom-32 w-[min(94vw,360px)] z-30"
        >
          <div className={`${styles.glass} relative h-full overflow-hidden flex flex-col`}>
            <div className="p-4 pb-3 border-b border-white/10">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-cyan-300 text-[11px] tracking-widest uppercase font-semibold">{b.type}</div>
                  <h2 className="text-white font-bold text-lg leading-tight mt-0.5">{b.label}</h2>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="text-white/60 hover:text-white p-1 rounded-md hover:bg-white/10"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className={`p-4 space-y-4 overflow-y-auto ${styles.noScrollbar} flex-1`}>
              {b.description && (
                <p className="text-white/80 text-sm leading-relaxed">{b.description}</p>
              )}

              <div className="grid grid-cols-2 gap-2">
                <Stat icon={<Building2 className="w-4 h-4 text-cyan-300" />} label="Type" value={b.type} />
                <Stat icon={<Sparkles className="w-4 h-4 text-amber-300" />} label="Block" value={b.id.toUpperCase().split("-")[0] ?? "—"} />
              </div>

              {b.departments && b.departments.length > 0 && (
                <Section title="Departments">
                  <div className="flex flex-wrap gap-1.5">
                    {b.departments.map((d) => (
                      <span
                        key={d}
                        className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-cyan-400/15 text-cyan-200 border border-cyan-400/30"
                      >
                        {d}
                      </span>
                    ))}
                  </div>
                </Section>
              )}

              {b.facilities && b.facilities.length > 0 && (
                <Section title="Facilities">
                  <ul className="space-y-1">
                    {b.facilities.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-white/80 text-xs">
                        <span className="w-1 h-1 rounded-full bg-emerald-400" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </Section>
              )}

              {b.timings && (
                <Section title="Operating Hours">
                  <div className="flex items-center gap-2 text-white/80 text-sm">
                    <Clock className="w-4 h-4 text-emerald-300" />
                    {b.timings.open} — {b.timings.close}
                  </div>
                </Section>
              )}

              {events.length > 0 && (
                <Section title="Today's Events">
                  <div className="space-y-2">
                    {events.map((e) => {
                      const cfg = MAP_EVENT_CATEGORIES[e.category];
                      return (
                        <div
                          key={e.id}
                          className="rounded-xl p-3 bg-white/5 border border-white/10 hover:border-white/30 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-base"
                              style={{ background: cfg.color, boxShadow: `0 0 14px ${cfg.glow}` }}
                            >
                              {cfg.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-white font-semibold text-sm truncate">{e.title}</div>
                              <div className="text-white/60 text-[11px]">{e.time}</div>
                            </div>
                          </div>
                          <p className="text-white/70 text-[11px] mt-2">{e.description}</p>
                        </div>
                      );
                    })}
                  </div>
                </Section>
              )}
            </div>

            <div className="p-3 border-t border-white/10 flex items-center gap-2 bg-black/20">
              <button
                onClick={() => setNav(b.id)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 shadow-[0_0_22px_rgba(34,211,238,0.55)] hover:shadow-[0_0_28px_rgba(34,211,238,0.75)] transition-shadow"
              >
                <Navigation className="w-4 h-4" />
                Navigate
              </button>
              <button
                onClick={() => setFav((f) => !f)}
                className={[
                  "p-2.5 rounded-xl border border-white/15",
                  fav ? "bg-rose-500/30 text-rose-200" : "bg-white/5 text-white/75 hover:bg-white/10",
                ].join(" ")}
                aria-label="Favourite"
              >
                <Heart className="w-4 h-4" fill={fav ? "currentColor" : "none"} />
              </button>
              <button
                onClick={() => {
                  if (typeof navigator !== "undefined" && navigator.share) {
                    navigator.share({ title: b.label, text: b.description ?? b.label }).catch(() => {});
                  }
                }}
                className="p-2.5 rounded-xl bg-white/5 text-white/75 hover:bg-white/10 border border-white/15"
                aria-label="Share"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] tracking-widest uppercase text-cyan-300/80 font-bold mb-1.5">{title}</div>
      {children}
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl p-2.5 bg-white/5 border border-white/10 flex items-center gap-2">
      {icon}
      <div>
        <div className="text-white text-sm font-bold leading-none capitalize">{value}</div>
        <div className="text-white/55 text-[10px]">{label}</div>
      </div>
    </div>
  );
}
