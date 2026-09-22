"use client";
import { useEffect, useState } from "react";
import { adImageSource, fetchAds, type AdBanner, type AdPlacement } from "@/lib/ads";

function AdCard({ banner }: { banner: AdBanner }) {
  const href = /^https?:\/\//i.test(banner.linkUrl) ? banner.linkUrl : undefined;
  const src = adImageSource(banner.imageUrl);
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="campus-ad-card mt-5 block overflow-hidden rounded-2xl border border-zinc-200 bg-white hover:border-teal-500"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {src && <img
        key={src}
        src={src}
        alt={banner.title}
        className="h-36 w-full bg-teal-50 object-contain"
        onError={(event) => {
          event.currentTarget.style.display = "none";
        }}
      />}
      <div className="p-4">
        <p className="text-[10px] uppercase tracking-widest text-zinc-500">
          Sponsored · {banner.eyebrow}
        </p>
        <h3 className="mt-1 font-semibold">{banner.title}</h3>
        <p className="mt-1 text-xs leading-5 text-zinc-500">{banner.description}</p>
        {href && <span className="mt-3 inline-block text-sm font-medium text-teal-700">
          {banner.buttonLabel} ↗
        </span>}
      </div>
    </a>
  );
}

export default function CampusAd({
  placement = "landing",
  override,
}: {
  placement?: AdPlacement;
  override?: AdBanner | AdBanner[];
}) {
  const [banners, setBanners] = useState<AdBanner[]>([]);

  useEffect(() => {
    let active = true;
    let busy = false;
    const refresh = () => {
      if (busy || document.hidden) return;
      busy = true;
      void fetchAds()
      .then((config) => {
        if (!active) return;
        setBanners(
          config.banners
            .filter((b) => b.enabled && b.placements.includes(placement))
            .sort((a, b) => a.order - b.order)
        );
      })
      .catch(() => {})
      .finally(() => { busy = false; });
    };
    refresh();
    const timer = setInterval(refresh, 10000);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => { active = false; clearInterval(timer); window.removeEventListener("focus", refresh); document.removeEventListener("visibilitychange", refresh); };
  }, [placement]);

  if (override) {
    const items = Array.isArray(override) ? override : [override];
    const enabled = items.filter((b) => b.enabled);
    if (enabled.length === 0) return null;
    return (
      <>
        {enabled.map((banner) => (
          <AdCard key={banner.id} banner={banner} />
        ))}
      </>
    );
  }

  if (banners.length === 0) return null;
  return (
    <>
      {banners.map((banner) => (
        <AdCard key={banner.id} banner={banner} />
      ))}
    </>
  );
}
