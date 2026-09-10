"use client";

import { CampusLocation } from "@/types/campus";
import { X, Navigation, ExternalLink, GraduationCap, UtensilsCrossed, Trophy, Home, DoorOpen, BookOpen, Music, Building2, MapPin } from "lucide-react";

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

  const formatDistance = (meters: number) => {
    if (meters < 1000) return `${Math.round(meters)}m`;
    return `${(meters / 1000).toFixed(1)}km`;
  };

  const formatTime = (seconds: number) => {
    const mins = Math.ceil(seconds / 60);
    if (mins < 1) return "< 1 min";
    return `${mins} min walk`;
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 z-40 p-3 sm:p-4 pb-6 safe-bottom">
      <div className="bottom-sheet rounded-3xl shadow-2xl shadow-black/15 max-w-md mx-auto overflow-hidden">
        <div className="relative px-4 sm:px-5 pt-4 sm:pt-5 pb-4">
          <button
            onClick={onClose}
            className="close-btn absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-start gap-3 pr-10">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
              style={{
                backgroundColor: `${categoryColors[location.category]}15`,
                border: `1.5px solid ${categoryColors[location.category]}30`,
              }}
            >
              {location.category === "academic" && <GraduationCap className="w-6 h-6" style={{ color: categoryColors[location.category] }} />}
              {location.category === "food" && <UtensilsCrossed className="w-6 h-6" style={{ color: categoryColors[location.category] }} />}
              {location.category === "sports" && <Trophy className="w-6 h-6" style={{ color: categoryColors[location.category] }} />}
              {location.category === "hostel" && <Home className="w-6 h-6" style={{ color: categoryColors[location.category] }} />}
              {location.category === "gate" && <DoorOpen className="w-6 h-6" style={{ color: categoryColors[location.category] }} />}
              {location.category === "library" && <BookOpen className="w-6 h-6" style={{ color: categoryColors[location.category] }} />}
              {location.category === "auditorium" && <Music className="w-6 h-6" style={{ color: categoryColors[location.category] }} />}
              {location.category === "admin" && <Building2 className="w-6 h-6" style={{ color: categoryColors[location.category] }} />}
              {location.category === "other" && <MapPin className="w-6 h-6" style={{ color: categoryColors[location.category] }} />}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-zinc-900 leading-tight">
                {location.name}
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                {categoryLabels[location.category]}
              </p>
              {!location.isVerified && (
                <span className="inline-block text-[10px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full mt-1">
                  Approximate coordinates
                </span>
              )}
            </div>
          </div>

          {location.description && (
            <p className="text-sm text-zinc-600 mt-3 leading-relaxed">
              {location.description}
            </p>
          )}

          {distance !== null && walkingTime !== null && (
            <div className="flex gap-3 mt-4">
              <div className="stat-box flex-1 rounded-xl p-3 text-center">
                <p className="text-lg font-bold text-zinc-900">
                  {formatDistance(distance)}
                </p>
                <p className="stat-label text-[10px] uppercase tracking-wide">
                  Distance
                </p>
              </div>
              <div className="stat-box flex-1 rounded-xl p-3 text-center">
                <p className="text-lg font-bold text-zinc-900">
                  {formatTime(walkingTime)}
                </p>
                <p className="stat-label text-[10px] uppercase tracking-wide">
                  Walking Time
                </p>
              </div>
            </div>
          )}

          <div className="flex gap-3 mt-4">
            {!isCurrentlyWalking ? (
              <button
                onClick={onStartWalking}
                className="btn-primary flex-1 text-white font-semibold py-3 rounded-2xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
              >
                <Navigation className="w-5 h-5" />
                Start Walking
              </button>
            ) : (
              <div className="flex-1 bg-emerald-50 text-emerald-700 font-semibold py-3 rounded-2xl flex items-center justify-center gap-2 border border-emerald-200">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                Walking...
              </div>
            )}
            <button
              onClick={() => {
                const { lat, lng } = location.position;
                window.open(
                  `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=walking`,
                  "_blank"
                );
              }}
              className="btn-secondary px-5 font-semibold py-3 rounded-2xl transition-colors flex items-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              View
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
