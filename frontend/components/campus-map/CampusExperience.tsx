"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Campus3D } from "@/components/campus-map/Campus3D";
import { Campus3D_PokemonGO } from "@/components/campus-map/Campus3D_PokemonGO";
import { CampusMapHUD } from "@/components/campus-map/hud/HUD";
import { LoadingScreen } from "@/components/campus-map/hud/LoadingScreen";
import { DemoBridge } from "@/components/campus-map/DemoBridge";
import { DemoModePanel } from "@/components/demo/DemoModePanel";

type CampusExperienceProps = {
  showBackLink?: boolean;
  backHref?: string;
  backLabel?: string;
};

export function CampusExperience({
  showBackLink = true,
  backHref = "/",
  backLabel = "Back to Home",
}: CampusExperienceProps) {
  return (
    <main className="fixed inset-0 overflow-hidden bg-black">
      <LoadingScreen />

      <Campus3D_PokemonGO />
      <DemoBridge />

      <CampusMapHUD />
      <DemoModePanel />

      {showBackLink ? (
        <Link
          href={backHref}
          className="pointer-events-auto fixed top-[7.5rem] left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/15 bg-black/55 px-3 py-1.5 text-xs font-semibold text-white/85 backdrop-blur-md hover:bg-black/75"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {backLabel}
        </Link>
      ) : null}
    </main>
  );
}
