"use client";

import styles from "./hud.module.css";

export function PlayerProfile() {
  return (
    <div className={`${styles.glass} flex items-center gap-3 p-2.5 pr-4`}>
      <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400 via-emerald-400 to-violet-500 p-[2px]">
        <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center text-lg">🧑‍🎓</div>
        <div className="absolute -bottom-1 -right-1 px-1.5 py-px rounded-full bg-amber-400 text-[10px] font-bold text-slate-900 border border-slate-900">
          5
        </div>
      </div>
      <div className="flex flex-col min-w-[110px]">
        <div className="text-white font-semibold text-sm leading-tight">Student Avatar</div>
        <div className="text-cyan-300 text-[11px]">Lv.5 · Explorer</div>
        <div className="mt-1 w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400" style={{ width: "62%" }} />
        </div>
      </div>
    </div>
  );
}
