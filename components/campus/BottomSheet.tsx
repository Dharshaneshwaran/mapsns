"use client";

import { CampusLocation } from "@/types/campus";
import { X, Navigation, MapPin, ExternalLink, GraduationCap, UtensilsCrossed, Trophy, Home, DoorOpen, BookOpen, Music, Building2 } from "lucide-react";

type Props = {
  location: CampusLocation;
  distance: number | null;
  walkingTime: number | null;
  onClose: () => void;
  onStartWalking: () => void;
  isCurrentlyWalking: boolean;
};

export default function BottomSheet({
  location,
  distance,
  walkingTime,
  onClose,
  onStartWalking,
  isCurrentlyWalking,
}: Props) {
  const categoryLabels: Record<string, string> = {
    academic: "Academic Block",
    food: "Food & Dining",
    sports: "Sports Facility",
    hostel: "Hostel",
    gate: "Campus Gate",
    library: "Library",
    auditorium: "Auditorium",
    admin: "Administration",
    other: "Other",
  };

  const categoryColors: Record<string, string> = {
    academic: "#3b82f6",
    food: "#f59e0b",
    sports: "#10b981",
    hostel: "#8b5cf6",
    gate: "#ef4444",
    library: "#06b6d4",
    auditorium: "#ec4899",
    admin: "#64748b",
    other: "#78716c",
  };

  const categoryIcons: Record<string, React.ReactNode> = {
    academic: <GraduationCap className="w-10 h-10" />,
    food: <UtensilsCrossed className="w-10 h-10" />,
    sports: <Trophy className="w-10 h-10" />,
    hostel: <Home className="w-10 h-10" />,
    gate: <DoorOpen className="w-10 h-10" />,
    library: <BookOpen className="w-10 h-10" />,
    auditorium: <Music className="w-10 h-10" />,
    admin: <Building2 className="w-10 h-10" />,
    other: <MapPin className="w-10 h-10" />,
  };

  const formatDistance = (meters: number) => {
    if (meters < 1000) return `${Math.round(meters)} m`;
    return `${(meters / 1000).toFixed(1)} km`;
  };

  const formatTime = (seconds: number) => {
    const mins = Math.ceil(seconds / 60);
    if (mins < 1) return "1 min";
    return `${mins} min`;
  };

  const color = categoryColors[location.category];

  return (
    <div className="absolute bottom-0 left-0 right-0 z-40 safe-bottom">
      <div className="bg-white rounded-t-3xl shadow-[0_-4px_20px_rgba(0,0,0,0.12)] max-w-lg mx-auto overflow-hidden">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-zinc-300" />
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center hover:bg-zinc-200 transition-colors"
        >
          <X className="w-4 h-4 text-zinc-600" />
        </button>

        {/* Content */}
        <div className="px-5 pb-6">
          {/* Title & Category */}
          <div className="pr-10">
            <h2 className="text-xl font-bold text-zinc-900">{location.name}</h2>
            <p className="text-sm text-zinc-500 mt-0.5">{categoryLabels[location.category]}</p>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={onStartWalking}
              className="flex items-center gap-2 px-4 py-2 rounded-full border border-zinc-200 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
            >
              <Navigation className="w-4 h-4" />
              Directions
            </button>
            <button
              onClick={() => {
                const { lat, lng } = location.position;
                window.open(
                  `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=walking`,
                  "_blank"
                );
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-full border border-zinc-200 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Open in Maps
            </button>
          </div>

          {/* Photo placeholder */}
          <div
            className="mt-4 h-44 rounded-2xl flex items-center justify-center"
            style={{ backgroundColor: `${color}12` }}
          >
            <div style={{ color }}>{categoryIcons[location.category]}</div>
          </div>

          {/* Description */}
          {location.description && (
            <p className="text-sm text-zinc-600 mt-4 leading-relaxed">
              {location.description}
            </p>
          )}

          {/* Divider */}
          <div className="border-t border-zinc-100 mt-4" />

          {/* Location info */}
          <div className="flex items-center gap-3 mt-4">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-zinc-900 font-medium">{location.name}</p>
              <p className="text-xs text-zinc-500">SNS College of Engineering</p>
            </div>
          </div>

          {/* Walking info */}
          {distance !== null && walkingTime !== null && (
            <>
              <div className="border-t border-zinc-100 mt-4" />
              <div className="flex items-center gap-4 mt-4 text-sm">
                <div>
                  <span className="text-zinc-500">Distance</span>
                  <span className="ml-2 font-medium text-zinc-900">{formatDistance(distance)}</span>
                </div>
                <div className="w-px h-4 bg-zinc-200" />
                <div>
                  <span className="text-zinc-500">Walking</span>
                  <span className="ml-2 font-medium text-zinc-900">{formatTime(walkingTime)}</span>
                </div>
              </div>
            </>
          )}

          {/* Start walking button */}
          {!isCurrentlyWalking && (
            <button
              onClick={onStartWalking}
              className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-full transition-colors flex items-center justify-center gap-2"
            >
              <Navigation className="w-5 h-5" />
              Start Walking
            </button>
          )}

          {isCurrentlyWalking && (
            <div className="w-full mt-4 bg-emerald-50 text-emerald-700 font-semibold py-3 rounded-full flex items-center justify-center gap-2 border border-emerald-200">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              Navigating...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
