"use client";

import { createContext, useContext, useState, ReactNode } from "react";

export type UIMode = "normal" | "classic";

type ThemeContextType = {
  mode: UIMode;
  setMode: (mode: UIMode) => void;
};

const ThemeContext = createContext<ThemeContextType>({
  mode: "normal",
  setMode: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<UIMode>("normal");

  return (
    <ThemeContext.Provider value={{ mode, setMode }}>
      <div className={mode === "classic" ? "theme-classic" : "theme-normal"}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
