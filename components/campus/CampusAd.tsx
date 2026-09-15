"use client";
import { useEffect, useState } from "react";
import { DEFAULT_ADS, fetchAds, type AdPlacement } from "@/lib/ads";
export default function CampusAd({ placement = "landing", override }: { placement?: "landing" | "placeCard"; override?: AdPlacement }) {
  const [ads, setAds] = useState(DEFAULT_ADS);
  useEffect(() => { let active = true; void fetchAds().then((data) => { if (active) setAds(data); }).catch(() => {}); return () => { active = false; }; }, []);
  const ad = override ?? ads[placement]; if (!ad?.enabled) return null;
  const href = /^https?:\/\//i.test(ad.linkUrl) ? ad.linkUrl : "https://snsce.ac.in";
  const src = /^(https?:\/\/|\/(?!\/))/i.test(ad.imageUrl) ? ad.imageUrl : "/ihub.png";
  return <a href={href} target="_blank" rel="noopener noreferrer" className="mt-5 block overflow-hidden rounded-2xl border border-zinc-200 bg-white hover:border-teal-500">
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src={src} alt={ad.title} className="h-36 w-full bg-teal-50 object-contain" onError={(event) => { if (!event.currentTarget.src.endsWith("/place-placeholder.svg")) event.currentTarget.src = "/place-placeholder.svg"; }} />
    <div className="p-4"><p className="text-[10px] uppercase tracking-widest text-zinc-500">Sponsored · {ad.eyebrow}</p><h3 className="mt-1 font-semibold">{ad.title}</h3><p className="mt-1 text-xs leading-5 text-zinc-500">{ad.description}</p><span className="mt-3 inline-block text-sm font-medium text-teal-700">{ad.buttonLabel} ↗</span></div>
  </a>;
}
