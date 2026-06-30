"use client";

import { Bell, Calendar, Compass, Home, User, Users } from "lucide-react";
import { useMapStore } from "@/stores/map-store";
import styles from "./hud.module.css";

const NAV_ITEMS = [
  { id: "home" as const, icon: Home, label: "Home" },
  { id: "explore" as const, icon: Compass, label: "Explore" },
  { id: "events" as const, icon: Calendar, label: "Events" },
  { id: "clubs" as const, icon: Users, label: "Clubs" },
  { id: "notifications" as const, icon: Bell, label: "Alerts" },
  { id: "profile" as const, icon: User, label: "Profile" },
];

export function NavigationBar() {
  const active = useMapStore((s) => s.navTab);
  const setActive = useMapStore((s) => s.setNavTab);
  const setShowEvents = useMapStore((s) => s.setShowEventsPanel);
  const setShowNotif = useMapStore((s) => s.setShowNotifications);

  const onSelect = (id: typeof NAV_ITEMS[number]["id"]) => {
    setActive(id);
    setShowEvents(id === "events");
    setShowNotif(id === "notifications");
  };

  return (
    <div className={`${styles.glass} flex items-center gap-1 p-1.5`}>
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = active === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onSelect(item.id)}
            className={[
              "flex flex-col items-center gap-0.5 px-3.5 py-2 rounded-xl transition-all duration-300",
              isActive
                ? "bg-cyan-400/15 text-cyan-300 shadow-[0_0_18px_rgba(34,211,238,0.4)]"
                : "text-white/65 hover:text-white hover:bg-white/5",
            ].join(" ")}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] font-semibold tracking-wide">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
