"use client";
import { useState } from "react";
import { MapPin, Bookmark } from "lucide-react";
import { CAMPUS_LOCATIONS } from "@/data/campusLocations";
import type { CampusLocation } from "@/types/campus";
import SlidePanel from "./SlidePanel";
import CampusAd from "./CampusAd";
import { useSavedPlaces } from "./PlaceActions";
export default function ExplorePanel({ onSelect }: { onSelect: (location: CampusLocation) => void }) {
  const [tab, setTab] = useState("explore"); const saved = useSavedPlaces();
  const places = tab === "saved" ? CAMPUS_LOCATIONS.filter((place) => saved.includes(place.id)) : CAMPUS_LOCATIONS.filter((place) => place.isVerified);
  return <SlidePanel label="Explore SNS campus"><div className="p-5"><p className="text-xs font-semibold uppercase tracking-[.18em] text-teal-700">SNS Institutions</p><h1 className="mt-2 text-2xl font-semibold tracking-tight">Your campus, connected.</h1><p className="mt-2 text-sm leading-6 text-zinc-500">Find a building. Discover a place. Get there easily.</p>
    <div className="my-4 flex gap-2" role="group" aria-label="Browse places"><button aria-pressed={tab === "explore"} onClick={() => setTab("explore")} className={`google-action-button ${tab === "explore" ? "bg-teal-700 text-white" : "bg-zinc-100"}`}><MapPin size={16} />Explore</button><button aria-pressed={tab === "saved"} onClick={() => setTab("saved")} className={`google-action-button ${tab === "saved" ? "bg-teal-700 text-white" : "bg-zinc-100"}`}><Bookmark size={16} />Saved places</button></div>
    <h2 className="mb-2 text-sm font-semibold">{tab === "saved" ? "Your saved places" : "Around campus"}</h2>{places.length === 0 && <p className="py-4 text-sm text-zinc-500">Save a place to find it here later.</p>}
    {places.map((place) => <button key={place.id} onClick={() => onSelect(place)} className="flex w-full items-center gap-3 rounded-xl px-2 py-3 text-left hover:bg-teal-50"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700"><MapPin size={20} /></span><span className="min-w-0"><span className="block truncate text-sm font-medium">{place.name}</span><span className="text-xs capitalize text-zinc-500">{place.category} · View place</span></span><span className="ml-auto text-zinc-400">›</span></button>)}<CampusAd />
  </div></SlidePanel>;
}
