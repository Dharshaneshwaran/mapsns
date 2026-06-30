"use client";

import { MiniMap } from "./MiniMap";
import { PlayerProfile } from "./PlayerProfile";
import { StatusBar } from "./StatusBar";
import { Joystick } from "./Joystick";
import { NavigationBar } from "./NavigationBar";
import { BuildingInfoCard } from "./BuildingInfoCard";
import { EventsPanel } from "./EventsPanel";
import { NotificationsPanel } from "./NotificationsPanel";
import { NavigationBanner } from "./NavigationBanner";
import { NearbyPrompt } from "./NearbyPrompt";

export function CampusMapHUD() {
  return (
    <div className="fixed inset-0 pointer-events-none z-20 select-none">
      <div className="absolute top-4 left-4 pointer-events-auto">
        <PlayerProfile />
      </div>

      <div className="absolute top-4 right-4 flex flex-col items-end gap-3 pointer-events-auto">
        <MiniMap />
        <StatusBar />
      </div>

      <NavigationBanner />

      <div className="absolute bottom-24 left-4 pointer-events-auto">
        <Joystick />
      </div>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-auto">
        <NavigationBar />
      </div>

      <BuildingInfoCard />
      <EventsPanel />
      <NotificationsPanel />
      <NearbyPrompt />
    </div>
  );
}
