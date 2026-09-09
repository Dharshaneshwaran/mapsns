"use client";

import { CATEGORY_FILTERS } from "@/data/campusLocations";
import { CampusCategory } from "@/types/campus";

type Props = {
  activeCategory: CampusCategory | "all";
  onCategoryChange: (category: CampusCategory | "all") => void;
};

export default function CategoryFilters({
  activeCategory,
  onCategoryChange,
}: Props) {
  return (
    <div className="w-full overflow-x-auto scrollbar-hide">
      <div className="flex gap-1.5 sm:gap-2 pb-1">
        {CATEGORY_FILTERS.map((filter) => {
          const isActive = activeCategory === filter.id;
          return (
            <button
              key={filter.id}
              onClick={() => onCategoryChange(filter.id)}
              className={`chip flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-full text-[10px] sm:text-xs font-semibold whitespace-nowrap transition-all duration-200 shrink-0 ${isActive ? "active" : ""}`}
            >
              <span className="text-xs sm:text-sm">{filter.icon}</span>
              {filter.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
