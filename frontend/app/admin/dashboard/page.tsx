"use client";

import dynamic from "next/dynamic";
import type { ChangeEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { COLLEGE_NAME, I_HUB_LOCATION } from "@/lib/college-location";
import { useLocation } from "@/hooks/use-location";
import { createAdminEvent, loadEvents } from "@/lib/api";
import type { Coordinates, EventCategory, EventRecord } from "@/types/event";

const EventMap = dynamic(
  () => import("@/components/map/event-map").then((module) => module.EventMap),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 text-center text-slate-300">
        Loading map...
      </div>
    ),
  },
);

const emptyForm: Omit<EventRecord, "id" | "isPublished" | "popularity" | "gallery"> = {
  title: "",
  description: "",
  category: "Tech",
  address: "",
  city: "",
  latitude: 0,
  longitude: 0,
  bannerImage: "",
  organizer: "",
  contact: "",
  startDate: "",
  endDate: "",
};

export default function AdminDashboardPage() {
  const router = useRouter();
  const { coordinates, loading, error, requestLocation } = useLocation();
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [location, setLocation] = useState<Coordinates | null>(I_HUB_LOCATION);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!window.localStorage.getItem("event-discovery-admin-token")) {
      router.replace("/admin/login");
    }
  }, [router]);

  useEffect(() => {
    if (coordinates) {
      setLocation(coordinates);
      setForm((current) => ({
        ...current,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
      }));
    }
  }, [coordinates]);

  useEffect(() => {
    let active = true;

    const run = async () => {
      try {
        setLoadingEvents(true);
        setLoadError(null);
        const data = await loadEvents();
        if (!active) {
          return;
        }
        setEvents(data);
        const first = data[0] ?? null;
        setSelectedEventId(first?.id ?? null);
        if (first) {
          setForm({
            title: first.title,
            description: first.description,
            category: first.category,
            address: first.address,
            city: first.city,
            latitude: first.latitude,
            longitude: first.longitude,
            bannerImage: first.bannerImage,
            organizer: first.organizer,
            contact: first.contact,
            startDate: first.startDate,
            endDate: first.endDate,
          });
        }
      } catch {
        if (active) {
          setLoadError("Unable to load events from the API.");
        }
      } finally {
        if (active) {
          setLoadingEvents(false);
        }
      }
    };

    void run();

    return () => {
      active = false;
    };
  }, []);

  const selectedEvent = useMemo(
    () => events.find((event) => event.id === selectedEventId) ?? null,
    [events, selectedEventId],
  );

  const stats = [
    { label: "Total events", value: events.length },
    { label: "Active events", value: events.filter((event) => event.isPublished).length },
    {
      label: "Upcoming events",
      value: events.filter((event) => new Date(event.startDate).getTime() > Date.now()).length,
    },
    {
      label: "Expired events",
      value: events.filter((event) => new Date(event.endDate).getTime() < Date.now()).length,
    },
  ];

  const updateLocation = (event: ChangeEvent<HTMLInputElement>) => {
    const [latitude, longitude] = event.target.value.split(",").map(Number);
    if (!Number.isNaN(latitude) && !Number.isNaN(longitude)) {
      setLocation({ latitude, longitude });
      setForm((current) => ({ ...current, latitude, longitude }));
    }
  };

  const onCreateDraft = async () => {
    const nextEvent = await createAdminEvent(form);
    setEvents((current) => [nextEvent, ...current.filter((event) => event.id !== nextEvent.id)]);
    setSelectedEventId(nextEvent.id);
    setLocation({
      latitude: nextEvent.latitude,
      longitude: nextEvent.longitude,
    });
    setForm(emptyForm);
  };

  const mapEvents = events.map((event) => ({
    ...event,
    distanceKm: 0,
  }));

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium text-cyan-300">Admin dashboard</p>
            <h1 className="mt-2 text-4xl font-black">
              Manage events, publish content, and pick locations for {COLLEGE_NAME}.
            </h1>
          </div>
          <p className="max-w-2xl text-sm text-slate-400">
            This screen gives you the event CRUD surface, dashboard metrics, and a map-backed
            location picker in one place.
          </p>
        </div>

        <section className="mt-8 grid gap-4 md:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm text-slate-400">{stat.label}</p>
              <p className="mt-2 text-3xl font-bold text-white">{stat.value}</p>
            </div>
          ))}
        </section>

        <section className="mt-8 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            <EventMap
              title="Location picker"
              subtitle="Use your live location or drag the coordinates field to place the event marker."
              center={location}
              events={mapEvents}
            />

            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Existing events</h2>
                  <p className="mt-1 text-sm text-slate-400">
                    Select any event to load its coordinates and form values.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={requestLocation}
                  className="rounded-full border border-cyan-300/40 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-400/20"
                >
                  {loading ? "Finding location..." : "Use my live location"}
                </button>
              </div>

              {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}
              {loadError ? <p className="mt-3 text-sm text-rose-300">{loadError}</p> : null}

              <div className="mt-5 grid gap-4">
                {loadingEvents ? (
                  <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/40 p-6 text-center text-sm text-slate-400">
                    Loading events from API...
                  </div>
                ) : (
                  events.map((event) => (
                  <button
                    key={event.id}
                    type="button"
                    onClick={() => {
                      setSelectedEventId(event.id);
                      setLocation({
                        latitude: event.latitude,
                        longitude: event.longitude,
                      });
                      setForm({
                        title: event.title,
                        description: event.description,
                        category: event.category,
                        address: event.address,
                        city: event.city,
                        latitude: event.latitude,
                        longitude: event.longitude,
                        bannerImage: event.bannerImage,
                        organizer: event.organizer,
                        contact: event.contact,
                        startDate: event.startDate,
                        endDate: event.endDate,
                      });
                    }}
                    className={[
                      "rounded-2xl border p-4 text-left transition",
                      selectedEventId === event.id
                        ? "border-cyan-300/50 bg-cyan-400/10"
                        : "border-white/10 bg-slate-950/40",
                    ].join(" ")}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-[0.28em] text-slate-500">
                          {event.city}
                        </p>
                        <p className="mt-2 text-lg font-semibold">{event.title}</p>
                      </div>
                    </div>
                  </button>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
            <h2 className="text-2xl font-bold">Create event</h2>
            <p className="mt-2 text-sm text-slate-400">
              Use the live location button or type latitude and longitude manually.
            </p>

            <div className="mt-6 grid gap-4">
              {[
                ["title", "Title"],
                ["address", "Address"],
                ["city", "City"],
                ["bannerImage", "Banner image"],
                ["organizer", "Organizer"],
                ["contact", "Contact"],
                ["startDate", "Start date"],
                ["endDate", "End date"],
              ].map(([key, label]) => (
                <input
                  key={key}
                  value={form[key as keyof typeof form]}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, [key]: event.target.value }))
                  }
                  placeholder={label}
                  className="h-12 rounded-2xl border border-white/10 bg-slate-950/60 px-4 text-sm outline-none"
                />
              ))}

              <textarea
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({ ...current, description: event.target.value }))
                }
                placeholder="Description"
                className="min-h-32 rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm outline-none"
              />

              <select
                value={form.category}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    category: event.target.value as EventCategory,
                  }))
                }
                className="h-12 rounded-2xl border border-white/10 bg-slate-950/60 px-4 text-sm outline-none"
              >
                {[
                  "Tech",
                  "Startup",
                  "Hackathon",
                  "Workshop",
                  "College",
                  "Sports",
                  "Cultural",
                  "Music",
                  "Business",
                ].map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>

              <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                <input
                  value={`${form.latitude},${form.longitude}`}
                  onChange={updateLocation}
                  placeholder="Latitude,Longitude"
                  className="h-12 rounded-2xl border border-white/10 bg-slate-950/60 px-4 text-sm outline-none"
                />
                <button
                  type="button"
                  onClick={requestLocation}
                  className="h-12 rounded-2xl border border-white/10 px-4 text-sm font-semibold text-white transition hover:bg-white/5"
                >
                  Use location
                </button>
              </div>

              <button
                type="button"
                onClick={onCreateDraft}
                className="h-12 rounded-2xl bg-cyan-400 text-sm font-semibold text-slate-950"
              >
                Save draft
              </button>
            </div>

            {selectedEvent ? (
              <div className="mt-8 rounded-3xl border border-white/10 bg-slate-950/50 p-5">
                <p className="text-sm font-medium text-cyan-300">Selected event</p>
                <h3 className="mt-2 text-xl font-semibold">{selectedEvent.title}</h3>
                <p className="mt-2 text-sm text-slate-400">
                  {selectedEvent.latitude.toFixed(4)}, {selectedEvent.longitude.toFixed(4)}
                </p>
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}
