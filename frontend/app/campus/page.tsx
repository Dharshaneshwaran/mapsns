"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CampusMapView } from "@/components/campus-map/CampusMapView";
import { CampusMapHUD } from "@/components/campus-map/hud/HUD";
import { LoadingScreen } from "@/components/campus-map/hud/LoadingScreen";
import { DemoBridge } from "@/components/campus-map/DemoBridge";
import { DemoModePanel } from "@/components/demo/DemoModePanel";

export default function CampusMapPage() {
  return (
    <main className="fixed inset-0 overflow-hidden bg-black">
      <LoadingScreen />

      <CampusMapView />
      <DemoBridge />

      <CampusMapHUD />
      <DemoModePanel />

      <Link
        href="/"
        className="pointer-events-auto fixed top-[7.5rem] left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/55 hover:bg-black/75 backdrop-blur-md border border-white/15 text-white/85 text-xs font-semibold"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to 2D Map
      </Link>
    </main>
  );
}
