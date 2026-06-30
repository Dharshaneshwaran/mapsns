"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

export function LoadingScreen() {
  const [progress, setProgress] = useState(0);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const target = 1800;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / target);
      setProgress(p);
      if (p < 1) raf = requestAnimationFrame(tick);
      else setTimeout(() => setHidden(true), 200);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <AnimatePresence>
      {!hidden && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-[#020617] via-[#0c1638] to-[#1c0b35]"
        >
          <div className="absolute -top-32 -left-20 w-[40rem] h-[40rem] rounded-full bg-cyan-500/15 blur-[120px]" />
          <div className="absolute -bottom-40 -right-20 w-[40rem] h-[40rem] rounded-full bg-fuchsia-500/15 blur-[120px]" />

          <div className="relative text-center space-y-6 px-6">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2.2, repeat: Infinity, ease: "linear" }}
              className="w-24 h-24 mx-auto rounded-full border-4 border-cyan-400/20 border-t-cyan-300 border-r-emerald-300 shadow-[0_0_50px_rgba(34,211,238,0.45)]"
            />
            <div>
              <div className="text-cyan-300 text-xs tracking-[0.45em] uppercase font-semibold">
                SNS · Campus
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-white mt-2 tracking-tight">
                Entering the Campus
              </h1>
              <p className="text-white/55 text-sm mt-2 max-w-sm mx-auto">
                Booting up the map, dispatching students, lighting up landmarks…
              </p>
            </div>

            <div className="w-72 mx-auto h-2 rounded-full bg-white/10 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-cyan-400 via-emerald-300 to-amber-300 shadow-[0_0_18px_rgba(34,211,238,0.7)]"
                style={{ width: `${Math.round(progress * 100)}%` }}
              />
            </div>
            <div className="text-white/60 text-xs">{Math.round(progress * 100)}%</div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
