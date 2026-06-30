"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const navItems = [
  { href: "/map", label: "Map" },
  { href: "/campus", label: "3D Campus" },
  { href: "/#events", label: "Events" },
  { href: "/admin/login", label: "Admin" },
];

export function Navbar() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("event-discovery-theme");
    const nextTheme =
      savedTheme === "light" || savedTheme === "dark" ? savedTheme : "dark";

    setTheme(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
  }, []);

  const toggleTheme = () => {
    setTheme((current) => {
      const nextTheme = current === "dark" ? "light" : "dark";
      document.documentElement.dataset.theme = nextTheme;
      window.localStorage.setItem("event-discovery-theme", nextTheme);
      return nextTheme;
    });
  };

  const isDark = theme === "dark";

  return (
    <header
      className={[
        "sticky top-0 z-40 border-b backdrop-blur-xl",
        isDark
          ? "border-white/10 bg-slate-950/80"
          : "border-slate-200/80 bg-white/85",
      ].join(" ")}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <span
            className={[
              "grid h-10 w-10 place-items-center rounded-2xl text-sm font-semibold ring-1",
              isDark
                ? "border border-emerald-300/20 bg-emerald-300/10 text-emerald-200 ring-emerald-300/20"
                : "border border-emerald-600/15 bg-emerald-50 text-emerald-700 ring-emerald-600/10",
            ].join(" ")}
          >
            sns
          </span>
          <span>
            <span
              className={[
                "block text-sm font-medium uppercase tracking-[0.32em]",
                isDark ? "text-emerald-300/70" : "text-emerald-700/70",
              ].join(" ")}
            >
              Campus events
            </span>
            <span className={["block text-lg font-semibold", isDark ? "text-white" : "text-slate-950"].join(" ")}>
              Find what is nearby
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={["text-sm font-medium transition", isDark ? "text-slate-300 hover:text-white" : "text-slate-600 hover:text-slate-950"].join(" ")}
            >
              {item.label}
            </Link>
          ))}
          <button
            type="button"
            onClick={toggleTheme}
            className={[
              "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition",
              isDark
                ? "border border-white/10 text-white hover:border-emerald-300/40 hover:bg-white/5"
                : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
            ].join(" ")}
          >
            <span className={`h-2 w-2 rounded-full ${theme === "dark" ? "bg-emerald-300" : "bg-slate-400"}`} />
            {theme === "dark" ? "Dark" : "Light"}
          </button>
        </nav>
      </div>
    </header>
  );
}
