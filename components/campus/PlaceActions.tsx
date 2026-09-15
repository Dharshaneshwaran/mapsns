"use client";
import { useState, useSyncExternalStore } from "react";
import { Bookmark, Share2 } from "lucide-react";
import type { CampusLocation } from "@/types/campus";
const key = "sns-saved-places";
function subscribe(callback: () => void) { window.addEventListener("storage", callback); window.addEventListener("sns-saved", callback); return () => { window.removeEventListener("storage", callback); window.removeEventListener("sns-saved", callback); }; }
function snapshot() { try { return localStorage.getItem(key) || "[]"; } catch { return "[]"; } }
export function useSavedPlaces(): string[] {
  const value = useSyncExternalStore(subscribe, snapshot, () => "[]");
  try { const parsed = JSON.parse(value); return Array.isArray(parsed) ? parsed.filter((id) => typeof id === "string") : []; } catch { return []; }
}
export default function PlaceActions({ location }: { location: CampusLocation }) {
  const saved = useSavedPlaces(); const active = saved.includes(location.id);
  const [message, setMessage] = useState("");
  const share = async () => {
    const url = new URL(window.location.href); url.search = ""; url.searchParams.set("place", location.id);
    try {
      if (navigator.share) await navigator.share({ title: location.name, url: url.href });
      else if (navigator.clipboard) { await navigator.clipboard.writeText(url.href); setMessage("Link copied"); }
      else window.prompt("Copy this place link", url.href);
    } catch (error) { if (!(error instanceof Error && error.name === "AbortError")) window.prompt("Copy this place link", url.href); }
  };
  return <><button className="google-action-button border border-zinc-200 text-teal-700" aria-pressed={active} onClick={() => { try { localStorage.setItem(key, JSON.stringify(active ? saved.filter((id) => id !== location.id) : [...saved, location.id])); window.dispatchEvent(new Event("sns-saved")); setMessage(active ? "Removed from saved places" : "Place saved"); } catch { setMessage("Your browser could not save this place"); } }}><Bookmark size={16} fill={active ? "currentColor" : "none"} />{active ? "Saved" : "Save"}</button><button onClick={share} className="google-action-button border border-zinc-200 text-teal-700"><Share2 size={16} />Share</button>{message && <span role="status" className="w-full text-xs text-teal-700">{message}</span>}</>;
}
