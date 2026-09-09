"use client";

import { useState, useRef, useEffect } from "react";
import { CampusLocation } from "@/types/campus";
import { CAMPUS_LOCATIONS } from "@/data/campusLocations";

type Props = {
  onSelectLocation: (location: CampusLocation) => void;
};

export default function CampusSearch({ onSelectLocation }: Props) {
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
    <div ref={containerRef} className="relative w-full max-w-md">
      <div
        className="search-bar flex items-center gap-2 sm:gap-3 rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3 shadow-lg shadow-black/5 cursor-text"
        onClick={() => inputRef.current?.focus()}
      >
        <svg
          className="search-icon w-5 h-5 shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
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
          className="flex-1 bg-transparent text-zinc-900 placeholder:text-zinc-400 outline-none text-sm font-medium search-input"
        />
        {query && (
          <button
            onClick={() => {
              setQuery("");
              inputRef.current?.focus();
            }}
            className="clear-btn transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div className="search-dropdown absolute top-full left-0 right-0 mt-2 rounded-2xl shadow-lg shadow-black/10 overflow-hidden z-50">
          {results.map((location) => {
            const categoryIcons: Record<string, string> = {
              academic: "🏛️",
              food: "🍽️",
              sports: "⚽",
              hostel: "🏠",
              gate: "🚪",
              library: "📚",
              auditorium: "🎭",
              admin: "🏢",
              other: "📍",
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
                <span className="text-lg">{categoryIcons[location.category]}</span>
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
