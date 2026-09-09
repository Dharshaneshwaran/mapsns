"use client";

import { useTheme } from "@/context/ThemeContext";

export default function ThemeSwitcher() {
  const { mode, setMode } = useTheme();

  return (
    <div className="theme-switcher shrink-0">
      <button
        onClick={() => setMode("normal")}
        className={`theme-btn ${mode === "normal" ? "active" : ""}`}
      >
        <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        <span className="hidden sm:inline">Normal</span>
      </button>
      <button
        onClick={() => setMode("classic")}
        className={`theme-btn ${mode === "classic" ? "active" : ""}`}
      >
        <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
        </svg>
        <span className="hidden sm:inline">Classic</span>
      </button>
    </div>
  );
}
