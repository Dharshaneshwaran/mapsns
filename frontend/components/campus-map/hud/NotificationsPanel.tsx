"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useMapStore } from "@/stores/map-store";
import styles from "./hud.module.css";

const NOTIFICATIONS = [
  { id: "n1", icon: "🚨", title: "Fire drill at 3:00 PM", time: "5 min ago" },
  { id: "n2", icon: "💼", title: "TCS placement drive tomorrow", time: "1 hour ago" },
  { id: "n3", icon: "🎵", title: "Open mic at the food court tonight", time: "2 hours ago" },
  { id: "n4", icon: "🏆", title: "You unlocked: Campus Explorer", time: "5 hours ago" },
  { id: "n5", icon: "📚", title: "Library book due tomorrow", time: "Yesterday" },
];

export function NotificationsPanel() {
  const show = useMapStore((s) => s.showNotifications);
  const close = () => useMapStore.getState().setShowNotifications(false);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, x: -60 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -60 }}
          transition={{ type: "spring", stiffness: 280, damping: 28 }}
          className="pointer-events-auto fixed left-4 top-24 bottom-32 w-[min(94vw,320px)] z-30"
        >
          <div className={`${styles.glass} h-full flex flex-col overflow-hidden`}>
            <div className="p-4 pb-3 border-b border-white/10 flex items-center justify-between">
              <div>
                <div className="text-cyan-300 text-[11px] tracking-widest uppercase font-semibold">Inbox</div>
                <h2 className="text-white text-lg font-bold leading-tight">Notifications</h2>
              </div>
              <button
                onClick={close}
                className="text-white/60 hover:text-white p-1 rounded-md hover:bg-white/10"
                aria-label="Close notifications"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className={`flex-1 overflow-y-auto ${styles.noScrollbar} p-3 space-y-2`}>
              {NOTIFICATIONS.map((n) => (
                <div
                  key={n.id}
                  className="rounded-xl p-3 bg-white/5 border border-white/10 flex items-start gap-2.5"
                >
                  <div className="text-xl">{n.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-sm font-semibold">{n.title}</div>
                    <div className="text-white/55 text-[11px]">{n.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
