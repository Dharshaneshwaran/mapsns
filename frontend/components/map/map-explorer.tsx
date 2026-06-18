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
import { getNearbyEvents, haversineDistanceKm } from "@/lib/events";
import type { Coordinates, EventRecord, EventWithDistance } from "@/types/event";
import { useLocation } from "@/hooks/use-location";

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
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<EventWithDistance | null>(null);
  const { coordinates: userLocation, startWatching } = useLocation();

  useEffect(() => {
    startWatching();
  }, [startWatching]);

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

  const location = userLocation ?? I_HUB_LOCATION;

  const upcomingEvents = useMemo(
    () =>
      events
        .filter(
          (event) =>
            event.isPublished &&
            new Date(event.startDate).getTime() > Date.now(),
        )
        .map((event) => ({
          ...event,
          distanceKm: haversineDistanceKm(location, {
            latitude: event.latitude,
            longitude: event.longitude,
          }),
        }))
        .sort((a, b) => a.distanceKm - b.distanceKm),
    [events, location],
  );

  const nearbyEvents = useMemo(
    () => getNearbyEvents(events, location, COLLEGE_RADIUS_KM, query, "All", "distance"),
    [events, location, query],
  );

  const [focused, setFocused] = useState(false);
  const [routeCoords, setRouteCoords] = useState<[number, number][] | null>(null);
  const [routeDistance, setRouteDistance] = useState<string | null>(null);
  const [routeDuration, setRouteDuration] = useState<string | null>(null);
  const [calculatingRoute, setCalculatingRoute] = useState(false);

  const clearRoute = useCallback(() => {
    setSelectedEvent(null);
    setRouteCoords(null);
    setRouteDistance(null);
    setRouteDuration(null);
  }, []);

  const calculateRoute = useCallback(async (from: Coordinates, to: EventWithDistance) => {
    if (!from) return;
    setCalculatingRoute(true);
    try {
      const res = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${from.longitude},${from.latitude};${to.longitude},${to.latitude}?overview=full&geometries=geojson`,
      );
      const data = await res.json();
      if (data.code === "Ok" && data.routes?.[0]) {
        const coords = data.routes[0].geometry.coordinates.map(
          (c: [number, number]) => [c[1], c[0]] as [number, number],
        );
        setRouteCoords(coords);
        const km = data.routes[0].distance / 1000;
        const min = Math.round(data.routes[0].duration / 60);
        setRouteDistance(km < 1 ? `${(km * 1000).toFixed(0)} m` : `${km.toFixed(1)} km`);
        setRouteDuration(`${min} min`);
      }
    } catch {
      setRouteCoords(null);
      setRouteDistance(null);
      setRouteDuration(null);
    } finally {
      setCalculatingRoute(false);
    }
  }, []);

  const handleSelectEvent = useCallback((event: EventWithDistance) => {
    setSelectedEvent(event);
    setFocused(false);
    setQuery("");
  }, []);

  useEffect(() => {
    if (selectedEvent && userLocation) {
      calculateRoute(userLocation, selectedEvent);
    }
  }, [selectedEvent, userLocation, calculateRoute]);

  if (fullPage) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-[#eef3f8] text-slate-900">
        <div className="absolute inset-0">
          <EventMap
            center={I_HUB_LOCATION}
            events={nearbyEvents}
            userLocation={userLocation}
            selectedEvent={selectedEvent}
            routeCoords={routeCoords}
            title="Campus map"
            subtitle="View all live locations across the platform."
            fullscreen
            onEventSelect={handleSelectEvent}
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

  if (selectedEvent) {
    return (
      <div className="relative flex h-screen bg-white text-slate-900">
        <aside className="hidden w-full max-w-md flex-col border-r border-slate-200 bg-white shadow-lg sm:flex">
          <div className="border-b border-slate-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 text-sm font-bold text-white">
                  E
                </div>
                <span className="text-sm font-semibold text-slate-900">Event Directions</span>
              </div>
              <button onClick={clearRoute} className="text-xs font-medium text-emerald-600 hover:text-emerald-800">
                Back
              </button>
            </div>
            <div className="mt-3 flex gap-2">
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search events"
                className="h-9 flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none placeholder:text-slate-400"
              />
              <button
                type="button"
                onClick={() => {
                  if (selectedEvent && userLocation) {
                    calculateRoute(userLocation, selectedEvent as EventWithDistance);
                  }
                }}
                disabled={calculatingRoute}
                className="h-9 rounded-lg bg-emerald-400 px-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {calculatingRoute ? "..." : "Go"}
              </button>
            </div>
          </div>

          <div className="border-b border-emerald-100 bg-emerald-50 p-4">
            <h3 className="text-sm font-semibold text-emerald-900">Directions</h3>
            <div className="mt-3 space-y-2">
              <div className="flex items-center gap-3 rounded-lg bg-white p-2.5 text-xs shadow-sm">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-[10px] font-bold text-white">A</span>
                <span className="text-slate-600">Your location</span>
                {userLocation ? (
                  <span className="ml-auto text-[10px] text-slate-400">
                    {userLocation.latitude.toFixed(4)}, {userLocation.longitude.toFixed(4)}
                  </span>
                ) : null}
              </div>
              <div className="ml-3 border-l-2 border-dashed border-emerald-300 pl-4 text-[10px]">
                {routeDistance ? (
                  <span className="text-emerald-600">{routeDistance} &mdash; {routeDuration}</span>
                ) : (
                  <span className="text-emerald-600">
                    {selectedEvent.distanceKm < 1
                      ? `${(selectedEvent.distanceKm * 1000).toFixed(0)} m`
                      : `${selectedEvent.distanceKm.toFixed(1)} km`}
                  </span>
                )}
                {calculatingRoute ? <span className="ml-2 text-slate-400">Calculating...</span> : null}
              </div>
              <div className="flex items-center gap-3 rounded-lg bg-white p-2.5 text-xs shadow-sm">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white">B</span>
                <div>
                  <div className="font-medium text-slate-900">{selectedEvent.title}</div>
                  <div className="text-slate-500">{selectedEvent.address}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-1 flex-col overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Upcoming Events
              </h2>
              <span className="text-[10px] text-slate-400">{upcomingEvents.length} events</span>
            </div>
            <div className="divide-y divide-slate-100">
              {upcomingEvents.map((event) => (
                <button
                  key={event.id}
                  onClick={() => handleSelectEvent(event)}
                  className={`flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-slate-50 ${
                    selectedEvent?.id === event.id ? "bg-emerald-50" : ""
                  }`}
                >
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg">
                    <img
                      src={event.bannerImage}
                      alt={event.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-sm font-medium text-slate-900">
                      {event.title}
                    </span>
                    <span className="mt-0.5 text-xs text-slate-500">{event.category}</span>
                    <span className="mt-1 text-xs text-slate-400">
                      {new Date(event.startDate).toLocaleDateString()}
                    </span>
                  </div>
                  <span className="shrink-0 text-xs font-medium text-emerald-600">
                    {event.distanceKm < 1
                      ? `${(event.distanceKm * 1000).toFixed(0)} m`
                      : `${event.distanceKm.toFixed(1)} km`}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-slate-200 p-3 text-center text-[10px] text-slate-400">
            {userLocation
              ? `Live location tracking active`
              : "Enable location for directions"}
          </div>
        </aside>

        <div className="fixed left-0 right-0 top-0 z-[1000] flex items-center justify-between bg-white/95 px-3 py-2 shadow-sm backdrop-blur sm:hidden">
          <button onClick={clearRoute} className="text-sm font-medium text-emerald-600">
            ← Back
          </button>
          <div className="flex flex-1 items-center gap-2 px-2">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search events"
              className="h-8 flex-1 rounded-lg border border-slate-200 bg-slate-50 px-2 text-xs text-slate-900 outline-none placeholder:text-slate-400"
            />
            <button
              type="button"
              onClick={() => {
                if (selectedEvent && userLocation) {
                  calculateRoute(userLocation, selectedEvent as EventWithDistance);
                }
              }}
              disabled={calculatingRoute}
              className="h-8 rounded-lg bg-emerald-400 px-3 text-xs font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {calculatingRoute ? "..." : "Go"}
            </button>
          </div>
          <span className="text-xs font-medium text-emerald-600">
            {selectedEvent.distanceKm < 1
              ? `${(selectedEvent.distanceKm * 1000).toFixed(0)} m`
              : `${selectedEvent.distanceKm.toFixed(1)} km`}
          </span>
        </div>

        <div className="fixed bottom-0 left-0 right-0 z-[1000] rounded-t-2xl border-t border-emerald-100 bg-white px-4 pb-6 pt-3 shadow-xl sm:hidden">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-900">Directions</span>
            {routeDistance ? (
              <span className="text-xs text-emerald-600">{routeDistance} &mdash; {routeDuration}</span>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-500 text-[8px] font-bold text-white">A</span>
            <span className="text-xs text-slate-600">Your location</span>
            <span className="ml-auto text-[9px] text-slate-400">
              {userLocation
                ? `${userLocation.latitude.toFixed(4)}, ${userLocation.longitude.toFixed(4)}`
                : ""}
            </span>
          </div>
          <div className="ml-2.5 border-l-2 border-dashed border-emerald-300 py-1 pl-3 text-[10px] text-emerald-600">
            {routeDistance ?? `${selectedEvent.distanceKm.toFixed(1)} km`}
          </div>
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-[8px] font-bold text-white">B</span>
            <span className="text-xs font-medium text-slate-900">{selectedEvent.title}</span>
          </div>
        </div>

        <main className="flex-1">
          <EventMap
            center={location}
            events={nearbyEvents}
            userLocation={userLocation}
            selectedEvent={selectedEvent}
            routeCoords={routeCoords}
            fullscreen
            mapHeightClassName="h-screen"
            onEventSelect={handleSelectEvent}
          />
        </main>
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
            <div className="relative">
              <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl shadow-slate-200/60 sm:flex-row">
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setTimeout(() => setFocused(false), 200)}
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
              {focused && !query && upcomingEvents.length > 0 && (
                <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60">
                  <div className="border-b border-slate-100 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                    Upcoming Events
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {upcomingEvents.map((event) => (
                      <button
                        key={event.id}
                        onClick={() => handleSelectEvent(event)}
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-900"
                      >
                        <span className="w-14 text-xs text-slate-400">{event.category}</span>
                        <span className="flex-1 truncate text-left">{event.title}</span>
                        <span className="text-xs font-medium text-emerald-600">
                          {event.distanceKm < 1
                            ? `${(event.distanceKm * 1000).toFixed(0)} m`
                            : `${event.distanceKm.toFixed(1)} km`}
                        </span>
                        <span className="w-20 text-right text-xs text-slate-400">
                          {new Date(event.startDate).toLocaleDateString()}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
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

        {loadError ? (
          <p className="mb-6 rounded-2xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-700">
            {loadError}
          </p>
        ) : null}

        <section id="map" className="pb-8">
          <div className="mb-5 flex flex-col gap-2 text-center">
            <p className="text-[10px] uppercase tracking-[0.32em] text-emerald-700/70">
              Live map
            </p>
            <h2 className="text-xl font-semibold text-slate-950 sm:text-2xl">
              What is happening near the campus
            </h2>
            <p className="text-sm text-slate-600">
              Search filters the loaded events, and reload fetches the newest set from the API.
            </p>
          </div>

          <EventMap
            center={location}
            events={nearbyEvents}
            userLocation={userLocation}
            selectedEvent={selectedEvent}
            routeCoords={routeCoords}
            onEventSelect={handleSelectEvent}
          />
        </section>
      </main>
    </div>
  );
}
