"use client";

import Image from "next/image";
import { CampusLocation } from "@/types/campus";
import {
  Bookmark,
  CalendarDays,
  GraduationCap,
  LocateFixed,
  MessageCircleQuestion,
  Navigation,
  Share2,
  Sparkles,
  Star,
  X,
} from "lucide-react";

type Props = {
  location: CampusLocation;
  distance: number | null;
  walkingTime: number | null;
  onClose: () => void;
  onStartWalking: () => void;
};

const categoryLabels: Record<string, string> = {
  academic: "Academic block",
  food: "Food and dining",
  sports: "Sports facility",
  hostel: "Student hostel",
  gate: "Campus entrance",
  library: "Library",
  auditorium: "Auditorium",
  admin: "College administration",
  other: "College facility",
};

export default function BottomSheet({ location, distance, walkingTime, onClose, onStartWalking }: Props) {
  const formatDistance = (meters: number) => meters < 1000 ? `${Math.round(meters)} m` : `${(meters / 1000).toFixed(1)} km`;
  const minutes = walkingTime === null ? null : Math.max(1, Math.ceil(walkingTime / 60));

  return (
    <aside className="location-details-panel absolute bottom-0 left-0 right-0 z-40 safe-bottom" aria-label={`${location.name} details`}>
      <div className="location-details-card mx-auto max-w-lg overflow-hidden rounded-t-[24px] bg-white text-[#202124] shadow-[0_-3px_16px_rgba(0,0,0,0.18)]">
        <div className="flex justify-center pb-1 pt-2.5">
          <div className="h-1 w-9 rounded-full bg-[#dadce0]" />
        </div>

        <div className="desktop-place-hero relative hidden h-56 w-full lg:block">
          <Image src="/heritage_building.png" alt={`${location.name} campus view`} fill priority sizes="404px" className="object-cover" />
        </div>

        <div className="px-5 pb-5">
          <div className="flex items-start gap-2">
            <div className="min-w-0 flex-1 pr-1">
              <h2 className="text-[21px] font-medium leading-6 tracking-[-0.2px]">{location.name}</h2>
              <div className="mt-1.5 flex flex-wrap items-center gap-1 text-xs text-[#5f6368]">
                <span>4.5</span>
                <span className="flex text-[#fbbc04]" aria-label="4.5 stars">
                  {[0, 1, 2, 3, 4].map((star) => <Star key={star} className="h-3.5 w-3.5 fill-current" strokeWidth={1.5} />)}
                </span>
                <span>(128)</span>
                {minutes !== null && <><span>·</span><span>{minutes} min</span></>}
              </div>
              <div className="mt-1 flex items-center gap-1.5 text-xs text-[#5f6368]">
                <span>{categoryLabels[location.category]}</span>
                <span>·</span>
                <GraduationCap className="h-3.5 w-3.5 text-[#1a73e8]" />
              </div>
              <p className="mt-1 text-xs"><span className="font-medium text-[#d93025]">Closed</span><span className="text-[#5f6368]"> · Opens 8:45 am</span></p>
            </div>

            <div className="flex shrink-0 gap-1.5">
              <button aria-label="Save place" className="google-round-button"><Bookmark className="h-[18px] w-[18px]" /></button>
              <button
                aria-label="Share place"
                className="google-round-button"
                onClick={() => navigator.share?.({ title: location.name, text: location.description })}
              >
                <Share2 className="h-[18px] w-[18px]" />
              </button>
              <button onClick={onClose} aria-label="Close location details" className="google-round-button"><X className="h-[18px] w-[18px]" /></button>
            </div>
          </div>

          <div className="scrollbar-hide -mx-5 mt-4 flex gap-2 overflow-x-auto px-5 pb-0.5">
            <button onClick={onStartWalking} className="google-action-button bg-[#008c95] text-white hover:bg-[#007b83]">
              <Navigation className="h-4 w-4 fill-white" /> Directions
            </button>
            <button onClick={onStartWalking} className="google-action-button bg-[#dff7fa] text-[#00676e] hover:bg-[#d2f1f5]">
              <LocateFixed className="h-4 w-4 fill-[#00676e]" /> Start
            </button>
            <button className="google-action-button bg-[#dff7fa] text-[#00676e] hover:bg-[#d2f1f5]">
              <MessageCircleQuestion className="h-4 w-4" /> Ask
            </button>
            <button className="google-action-button bg-[#dff7fa] text-[#00676e] hover:bg-[#d2f1f5]">
              <CalendarDays className="h-4 w-4" /> Save
            </button>
          </div>

          <div className="mt-4 rounded-2xl bg-[#f5f2ff] px-3 py-3 text-xs leading-5 text-[#3c4043]">
            <div className="flex items-start gap-2">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[#4f64d9]" />
              <p><span className="font-medium">Know before you go:</span> Explore the campus and follow the marked route to your destination.</p>
              <span className="ml-auto shrink-0 rounded-full bg-[#e5e5fa] px-2 py-0.5 text-[10px]">+2⌄</span>
            </div>
          </div>

          {distance !== null && (
            <p className="mt-3 text-xs text-[#5f6368]">{formatDistance(distance)} from your current location</p>
          )}

          <div className="mt-3 grid h-28 grid-cols-3 gap-1.5 overflow-hidden rounded-2xl">
            <div className="relative"><Image src="/heritage_building.png" alt="Campus building" fill sizes="140px" className="object-cover" /></div>
            <div className="relative"><Image src="/ihub.png" alt="SNS Innovation Hub" fill sizes="140px" className="object-cover" /></div>
            <div className="relative"><Image src="/admin_building.png" alt="Administration building" fill sizes="140px" className="object-cover" /></div>
          </div>

          <div className="mobile-sidebar-ad mt-4 flex items-center gap-3 rounded-2xl border border-[#dadce0] bg-white p-3 lg:hidden">
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-[#f1f3f4]">
              <Image src="/ihub.png" alt="SNS Innovation Hub" fill sizes="80px" className="object-cover" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] uppercase tracking-wide text-[#5f6368]">Campus spotlight</p>
              <h3 className="mt-0.5 text-sm font-medium text-[#202124]">Discover SNS iHub</h3>
              <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-[#5f6368]">Innovation, student projects, events, and technology opportunities.</p>
            </div>
          </div>

          <div className="desktop-sidebar-ad mt-5 hidden overflow-hidden rounded-2xl border border-[#dadce0] bg-white lg:flex lg:flex-col">
            <div className="desktop-sidebar-ad-media relative w-full overflow-hidden bg-[#f1f3f4]">
              <Image src="/ihub.png" alt="SNS Innovation Hub" fill sizes="370px" className="object-cover" />
              <span className="absolute left-2 top-2 rounded bg-black/65 px-2 py-1 text-[10px] font-medium text-white">Campus spotlight</span>
            </div>
            <div className="p-4">
              <p className="text-[11px] uppercase tracking-wide text-[#5f6368]">Advertisement</p>
              <h3 className="mt-1 text-base font-medium text-[#202124]">Discover SNS Innovation Hub</h3>
              <p className="mt-1 text-xs leading-5 text-[#5f6368]">Explore student innovation, technology projects, events, and opportunities across the SNS campus.</p>
              <button
                onClick={() => window.open("https://snsce.ac.in", "_blank", "noopener,noreferrer")}
                className="mt-3 rounded-full border border-[#dadce0] px-4 py-2 text-xs font-medium text-[#0b57d0] transition-colors hover:bg-[#f0f6ff]"
              >
                Learn more
              </button>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
