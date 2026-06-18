"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  COLLEGE_NAME,
  COLLEGE_RADIUS_KM,
  I_HUB_LOCATION,
} from "@/lib/college-location";
import { loadEvents } from "@/lib/api";
import { getNearbyEvents } from "@/lib/events";
import type { EventRecord, SortOption } from "@/types/event";

const EventMap = dynamic(
  () => import("@/components/map/event-map").then((module) => module.EventMap),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 text-center text-slate-500">
        Loading map...
      </div>
    ),
  },
);

type MapExplorerProps = {
  fullPage?: boolean;
};

export function MapExplorer({ fullPage = false }: MapExplorerProps) {
  const [query, setQuery] = useState("");
  const [sortBy] = useState<SortOption>("distance");
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const reloadEvents = useCallback(async () => {
    try {
      setLoadingEvents(true);
      setLoadError(null);
      const data = await loadEvents();
      setEvents(data);
    } catch {
      setLoadError("Unable to load events right now.");
    } finally {
      setLoadingEvents(false);
    }
  }, []);

  useEffect(() => {
    void reloadEvents();
  }, [reloadEvents]);

  const nearbyEvents = useMemo(
    () => getNearbyEvents(events, I_HUB_LOCATION, COLLEGE_RADIUS_KM, query, "All", sortBy),
    [events, query, sortBy],
  );

  if (fullPage) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-[#eef3f8] text-slate-900">
        <div className="absolute inset-0">
          <EventMap
            center={I_HUB_LOCATION}
            events={nearbyEvents}
            title="Campus map"
            subtitle="View all live locations across the platform."
            fullscreen
          />
        </div>

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/75 via-white/20 to-white/50" />

        <div className="pointer-events-none fixed inset-x-0 top-0 z-[1000] p-3 sm:p-4">
          <div className="mx-auto flex max-w-[1600px] flex-col gap-3">
            <div className="pointer-events-auto flex items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-3 shadow-[0_18px_45px_rgba(15,23,42,0.18)]">
              <span className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-700">
                Menu
              </span>
              <div className="flex flex-1 items-center gap-3 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 shadow-sm">
                <span className="text-slate-400">Search</span>
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search Google Maps"
                  className="w-full bg-transparent text-sm text-slate-950 outline-none placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={() => void reloadEvents()}
                  disabled={loadingEvents}
                  className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loadingEvents ? "..." : "Reload"}
                </button>
              </div>
              <Link
                href="/"
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Home
              </Link>
            </div>

            <div className="pointer-events-auto flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {["Restaurants", "Hotels", "Things to do", "Museums", "Transit", "Pharmacies", "ATMs"].map(
                (item) => (
                  <span
                    key={item}
                    className="whitespace-nowrap rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-[0_10px_24px_rgba(15,23,42,0.12)]"
                  >
                    {item}
                  </span>
                ),
              )}
            </div>
          </div>
        </div>

        <div className="pointer-events-auto fixed left-3 top-28 z-[1000] flex flex-col gap-3 sm:left-4 sm:top-32">
          <button className="grid h-12 w-12 place-items-center rounded-2xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 shadow-lg shadow-slate-300/40">
            Center
          </button>
          <button className="grid h-12 w-12 place-items-center rounded-2xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 shadow-lg shadow-slate-300/40">
            View
          </button>
          <button className="grid h-12 w-12 place-items-center rounded-2xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 shadow-lg shadow-slate-300/40">
            Refresh
          </button>
        </div>

        <div className="pointer-events-auto fixed right-3 bottom-4 z-[1000] rounded-2xl border border-slate-200 bg-white p-3 shadow-xl shadow-slate-300/40 sm:right-4">
          {loadError ? (
            <p className="max-w-xs rounded-xl border border-rose-400/30 bg-rose-50 px-3 py-2 text-xs text-rose-700">
              {loadError}
            </p>
          ) : (
            <div className="text-xs text-slate-600">{COLLEGE_NAME} map</div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f8fb] text-slate-900">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.12),transparent_26%),radial-gradient(circle_at_bottom,rgba(14,165,233,0.08),transparent_32%)]" />
      <div className="fixed inset-0 -z-10 bg-[linear-gradient(rgba(15,23,42,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.05)_1px,transparent_1px)] bg-[size:72px_72px] opacity-40" />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <section className="flex min-h-screen flex-col items-center justify-center py-10 text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-500/15 bg-emerald-500/8 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.32em] text-emerald-700">
            <span className="h-2 w-2 rounded-full bg-emerald-300" />
            Live campus preview
          </div>

          <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
            Campus events,
            <span className="block text-slate-500">without the noise.</span>
          </h1>

          <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
            Search the latest loaded events, reload when you want a fresh list, and
            explore what is happening around {COLLEGE_NAME}.
          </p>

          <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={() => void reloadEvents()}
              disabled={loadingEvents}
              className="inline-flex h-11 items-center justify-center rounded-full border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-900 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loadingEvents ? "Reloading..." : "Reload events"}
            </button>
            <Link
              href="/map"
              className="inline-flex h-11 items-center justify-center rounded-full border border-slate-200 bg-white px-5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              View map
            </Link>
          </div>

          <div className="mt-8 w-full max-w-2xl">
            <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl shadow-slate-200/60 sm:flex-row">
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search events"
                className="h-11 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none placeholder:text-slate-400"
              />
              <button
                type="button"
                onClick={() => void reloadEvents()}
                disabled={loadingEvents}
                className="h-11 rounded-xl bg-emerald-400 px-5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loadingEvents ? "Loading..." : "Refresh"}
              </button>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-[11px] text-slate-500">
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1">
                {COLLEGE_RADIUS_KM} km live radius
              </span>
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1">
                Live location enabled
              </span>
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1">
                API refreshed on demand
              </span>
            </div>
          </div>
        </section>

        <section id="map" className="pb-8">
          <div className="mb-5 flex flex-col gap-2 text-center">
            <p className="text-[10px] uppercase tracking-[0.32em] text-emerald-700/70">
              Live map
            </p>
            <h2 className="text-xl font-semibold text-slate-950 sm:text-2xl">
              What is happening near the campus
            </h2>
            <p className="text-sm text-slate-600">
              Search filters the loaded events, and reload fetches the newest set from
              the API.
            </p>
          </div>

          {loadError ? (
            <p className="mb-4 rounded-2xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-700">
              {loadError}
            </p>
          ) : null}

          <EventMap center={I_HUB_LOCATION} events={nearbyEvents} />
        </section>
      </main>
    </div>
  );
}
