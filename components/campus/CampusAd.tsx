"use client";
import { useEffect, useState } from "react";
import { DEFAULT_ADS, fetchAds, type AdBanner, type AdPlacement } from "@/lib/ads";

function AdCard({ banner }: { banner: AdBanner }) {
  const href = /^https?:\/\//i.test(banner.linkUrl) ? banner.linkUrl : "https://snsce.ac.in";
  const src = /^(https?:\/\/|\/(?!\/))/i.test(banner.imageUrl) ? banner.imageUrl : "/ihub.png";
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-5 block overflow-hidden rounded-2xl border border-zinc-200 bg-white hover:border-teal-500"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={banner.title}
        className="h-36 w-full bg-teal-50 object-contain"
        onError={(event) => {
          if (!(event.currentTarget as HTMLImageElement).src.endsWith("/place-placeholder.svg"))
            (event.currentTarget as HTMLImageElement).src = "/place-placeholder.svg";
        }}
      />
      <div className="p-4">
        <p className="text-[10px] uppercase tracking-widest text-zinc-500">
          Sponsored · {banner.eyebrow}
        </p>
        <h3 className="mt-1 font-semibold">{banner.title}</h3>
        <p className="mt-1 text-xs leading-5 text-zinc-500">{banner.description}</p>
        <span className="mt-3 inline-block text-sm font-medium text-teal-700">
          {banner.buttonLabel} ↗
        </span>
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
    void fetchAds()
      .then((config) => {
        if (!active) return;
        setBanners(
          config.banners
            .filter((b) => b.enabled && b.placements.includes(placement))
            .sort((a, b) => a.order - b.order)
        );
      })
      .catch(() => {});
    return () => { active = false; };
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
