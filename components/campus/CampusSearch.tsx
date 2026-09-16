"use client";

import { useState, useRef, useEffect } from "react";
import { CampusLocation } from "@/types/campus";
import { useCampusPlaces } from "@/components/campus/useCampusPlaces";
import { Search, X, GraduationCap, UtensilsCrossed, Trophy, Home, DoorOpen, BookOpen, Music, Building2, MapPin } from "lucide-react";

type Props = {
  onSelectLocation: (location: CampusLocation) => void;
};

export default function CampusSearch({ onSelectLocation }: Props) {
  const CAMPUS_LOCATIONS = useCampusPlaces();
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const results = query.trim()
    ? CAMPUS_LOCATIONS.filter(
        (loc) =>
          loc.name.toLowerCase().includes(query.toLowerCase()) ||
          loc.category.toLowerCase().includes(query.toLowerCase()) ||
          loc.id.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 6)
    : [];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative min-w-0 w-full max-w-md">
      <div
        className="search-bar flex items-center gap-2 sm:gap-3 rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3 shadow-lg shadow-black/5 cursor-text"
        onClick={() => inputRef.current?.focus()}
      >
        <Search className="search-icon w-5 h-5 shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search SNS campus..."
          aria-label="Search campus"
          className="min-w-0 flex-1 bg-transparent text-zinc-900 placeholder:text-zinc-400 outline-none text-sm font-medium search-input"
        />
        {query && (
          <button
            aria-label="Clear search"
            onClick={() => {
              setQuery("");
              inputRef.current?.focus();
            }}
            className="clear-btn transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div className="search-dropdown absolute top-full left-0 right-0 mt-2 rounded-2xl shadow-lg shadow-black/10 overflow-hidden z-50">
          {results.map((location) => {
            const categoryIconMap: Record<string, React.ReactNode> = {
              academic: <GraduationCap className="w-5 h-5 text-blue-500" />,
              food: <UtensilsCrossed className="w-5 h-5 text-amber-500" />,
              sports: <Trophy className="w-5 h-5 text-emerald-500" />,
              hostel: <Home className="w-5 h-5 text-purple-500" />,
              gate: <DoorOpen className="w-5 h-5 text-red-500" />,
              library: <BookOpen className="w-5 h-5 text-cyan-500" />,
              auditorium: <Music className="w-5 h-5 text-pink-500" />,
              admin: <Building2 className="w-5 h-5 text-slate-500" />,
              other: <MapPin className="w-5 h-5 text-stone-500" />,
            };

            return (
              <button
                key={location.id}
                onClick={() => {
                  onSelectLocation(location);
                  setQuery(location.name);
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-100/80 transition-colors text-left"
              >
                {categoryIconMap[location.category]}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-900 truncate">
                    {location.name}
                  </p>
                  <p className="text-xs text-zinc-500 capitalize">
                    {location.category}
                  </p>
                </div>
                {!location.isVerified && (
                  <span className="text-[10px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                    Approx
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {isOpen && query && results.length === 0 && (
        <div className="search-dropdown absolute top-full left-0 right-0 mt-2 rounded-2xl shadow-lg shadow-black/10 p-6 text-center z-50">
          <p className="text-zinc-500 text-sm">No locations found</p>
          <p className="text-zinc-400 text-xs mt-1">
            Try &quot;library&quot;, &quot;canteen&quot;, or &quot;hostel&quot;
          </p>
        </div>
      )}
    </div>
  );
}
