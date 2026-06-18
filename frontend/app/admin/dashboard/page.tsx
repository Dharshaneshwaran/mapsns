"use client";

import dynamic from "next/dynamic";
import type { ChangeEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { COLLEGE_NAME, I_HUB_LOCATION } from "@/lib/college-location";
import { findVenuePreset, venuePresets } from "@/lib/venue-presets";
import { useLocation } from "@/hooks/use-location";
import {
  createAdminEvent,
  deleteAdminEvent,
  loadEvents,
  publishAdminEvent,
  unpublishAdminEvent,
  uploadAdminImage,
} from "@/lib/api";
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

type AdminEventForm = Omit<EventRecord, "id" | "isPublished" | "popularity" | "gallery"> & {
  place: string;
  floor: string;
};

const emptyForm: AdminEventForm = {
  title: "",
  description: "",
  category: "Tech",
  address: "",
  place: "",
  floor: "",
  city: "",
  latitude: 0,
  longitude: 0,
  bannerImage: "",
  organizer: "",
  contact: "",
  startDate: "",
  endDate: "",
};

function toDateTimeLocalValue(value: string) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

function fromDateTimeLocalValue(value: string) {
  if (!value) {
    return "";
  }

  return new Date(value).toISOString();
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const { coordinates, loading, error, requestLocation } = useLocation();
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreviewUrl, setBannerPreviewUrl] = useState<string>("");
  const [location, setLocation] = useState<Coordinates | null>(I_HUB_LOCATION);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingDeleteEvent, setPendingDeleteEvent] = useState<EventRecord | null>(null);

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
            place: first.place ?? "",
            floor: first.floor ?? "",
            city: first.city,
            latitude: first.latitude,
            longitude: first.longitude,
            bannerImage: first.bannerImage,
            organizer: first.organizer,
            contact: first.contact,
            startDate: toDateTimeLocalValue(first.startDate),
            endDate: toDateTimeLocalValue(first.endDate),
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

  const suggestedVenues = useMemo(() => {
    const query = form.place.trim().toLowerCase();
    if (!query) {
      return venuePresets.slice(0, 5);
    }

    return venuePresets.filter((venue) => {
      const values = [venue.label, venue.value, ...venue.aliases].join(" ").toLowerCase();
      return values.includes(query);
    });
  }, [form.place]);

  useEffect(() => {
    if (!bannerFile) {
      setBannerPreviewUrl("");
      return;
    }

    const objectUrl = URL.createObjectURL(bannerFile);
    setBannerPreviewUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [bannerFile]);

  const loadEventIntoForm = (event: EventRecord) => {
    setSelectedEventId(event.id);
    setBannerFile(null);
    setLocation({
      latitude: event.latitude,
      longitude: event.longitude,
    });
    setForm({
      title: event.title,
      description: event.description,
      category: event.category,
      address: event.address,
      place: event.place ?? "",
      floor: event.floor ?? "",
      city: event.city,
      latitude: event.latitude,
      longitude: event.longitude,
      bannerImage: event.bannerImage,
      organizer: event.organizer,
      contact: event.contact,
      startDate: toDateTimeLocalValue(event.startDate),
      endDate: toDateTimeLocalValue(event.endDate),
    });
  };

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

  const applyVenuePreset = (venueLabel: string) => {
    const venue = findVenuePreset(venueLabel);
    if (!venue) {
      setForm((current) => ({ ...current, place: venueLabel }));
      return;
    }

    setForm((current) => ({
      ...current,
      place: venue.label,
      address: venue.address,
      city: venue.city,
      latitude: venue.latitude,
      longitude: venue.longitude,
    }));
    setLocation({
      latitude: venue.latitude,
      longitude: venue.longitude,
    });
  };

  const onCreateDraft = async () => {
    setSaveError(null);

    if (!bannerFile && !form.bannerImage.trim()) {
      setSaveError("Please upload a banner photo or paste a banner image URL.");
      return;
    }

    let bannerImage = form.bannerImage;
    if (bannerFile) {
      try {
        bannerImage = await uploadAdminImage(bannerFile, "events");
      } catch {
        setSaveError(
          "Banner upload failed. Check the R2 env values in backend/.env and restart the backend.",
        );
        return;
      }
    }

    let nextEvent: EventRecord;
    try {
      nextEvent = await createAdminEvent({
        ...form,
        bannerImage,
        place: form.place.trim() || undefined,
        floor: form.floor.trim() || undefined,
        startDate: fromDateTimeLocalValue(form.startDate),
        endDate: fromDateTimeLocalValue(form.endDate),
      });
    } catch (error) {
      setSaveError(
        error instanceof Error
          ? error.message
          : "Event save failed. Make sure the backend is running and the database schema is synced.",
      );
      return;
    }

    setEvents((current) => [nextEvent, ...current.filter((event) => event.id !== nextEvent.id)]);
    setSelectedEventId(nextEvent.id);
    setLocation({
      latitude: nextEvent.latitude,
      longitude: nextEvent.longitude,
    });
    setBannerFile(null);
    setForm(emptyForm);
    await refreshEvents(nextEvent.id);
  };

  const refreshEvents = async (preferredSelectedId?: string | null) => {
    const data = await loadEvents();
    setEvents(data);
    const nextSelected =
      data.find((event) => event.id === preferredSelectedId) ??
      data.find((event) => event.id === selectedEventId) ??
      data[0] ??
      null;
    setSelectedEventId(nextSelected?.id ?? null);
  };

  const handlePublishToggle = async (event: EventRecord) => {
    try {
      setActionError(null);
      if (event.isPublished) {
        await unpublishAdminEvent(event.id);
      } else {
        await publishAdminEvent(event.id);
      }
      await refreshEvents(event.id);
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Unable to change publish status right now.",
      );
    }
  };

  const handleDeleteEvent = async (event: EventRecord) => {
    setPendingDeleteEvent(event);
  };

  const confirmDeleteEvent = async () => {
    if (!pendingDeleteEvent) {
      return;
    }

    const eventToDelete = pendingDeleteEvent;
    setPendingDeleteEvent(null);
    try {
      setActionError(null);
      await deleteAdminEvent(eventToDelete.id);
      await refreshEvents(selectedEventId);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Unable to delete the event right now.");
    }
  };

  const mapEvents = events.map((event) => ({
    ...event,
    distanceKm: 0,
  }));

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-[1600px]">
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

        <section className="mt-8 grid gap-6 xl:grid-cols-[1.1fr_0.9fr] xl:items-start">
          <div className="space-y-4 xl:sticky xl:top-6">
            <EventMap
              title="Location picker"
              subtitle="Use your live location or drag the coordinates field to place the event marker."
              center={location}
              events={mapEvents}
              panelClassName="min-h-[76vh] xl:min-h-[82vh]"
              mapHeightClassName="h-[76vh] xl:h-[82vh]"
              onEventSelect={(event) => loadEventIntoForm(event)}
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
              {actionError ? <p className="mt-3 text-sm text-rose-300">{actionError}</p> : null}

              <div className="mt-5 grid gap-4">
                {loadingEvents ? (
                  <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/40 p-6 text-center text-sm text-slate-400">
                    Loading events from API...
                  </div>
                ) : (
                  events.map((event) => (
                    <div
                      key={event.id}
                      className={[
                        "rounded-2xl border p-4 transition",
                        selectedEventId === event.id
                          ? "border-cyan-300/50 bg-cyan-400/10"
                          : "border-white/10 bg-slate-950/40",
                      ].join(" ")}
                    >
                      <button
                        type="button"
                        onClick={() => loadEventIntoForm(event)}
                        className="block w-full text-left"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="text-xs uppercase tracking-[0.28em] text-slate-500">
                              {event.city}
                            </p>
                            <p className="mt-2 text-lg font-semibold">{event.title}</p>
                          </div>
                          <span
                            className={[
                              "shrink-0 rounded-full px-3 py-1 text-xs font-semibold",
                              event.isPublished
                                ? "bg-emerald-400/15 text-emerald-200 ring-1 ring-emerald-400/25"
                                : "bg-amber-400/10 text-amber-200 ring-1 ring-amber-400/20",
                            ].join(" ")}
                          >
                            {event.isPublished ? "Published" : "Draft"}
                          </span>
                        </div>
                      </button>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => handlePublishToggle(event)}
                          className="rounded-full border border-cyan-300/30 bg-cyan-400/10 px-3 py-1.5 text-xs font-semibold text-cyan-100 transition hover:bg-cyan-400/20"
                        >
                          {event.isPublished ? "Unpublish" : "Publish"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteEvent(event)}
                          className="rounded-full border border-rose-400/30 bg-rose-400/10 px-3 py-1.5 text-xs font-semibold text-rose-100 transition hover:bg-rose-400/20"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 xl:sticky xl:top-6">
            <h2 className="text-2xl font-bold">Create event</h2>
            <p className="mt-2 text-sm text-slate-400">
              Use the live location button or type latitude and longitude manually.
            </p>

            <div className="mt-6 grid gap-4">
              {saveError ? (
                <p className="rounded-2xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
                  {saveError}
                </p>
              ) : null}

              <div className="grid gap-4 sm:grid-cols-2">
                <input
                  value={form.title}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, title: event.target.value }))
                  }
                  placeholder="Title"
                  className="h-12 rounded-2xl border border-white/10 bg-slate-950/60 px-4 text-sm outline-none"
                />
                <div className="flex h-12 items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/60 px-4 text-sm">
                  <input
                    id="banner-upload"
                    type="file"
                    accept="image/*"
                    onChange={(event) => setBannerFile(event.target.files?.[0] ?? null)}
                    className="sr-only"
                  />
                  <label
                    htmlFor="banner-upload"
                    className="cursor-pointer rounded-full bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
                  >
                    Upload banner
                  </label>
                  <span className="truncate text-slate-300">
                    {bannerFile ? bannerFile.name : "No file selected"}
                  </span>
                </div>
                <input
                  value={form.bannerImage}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, bannerImage: event.target.value }))
                  }
                  placeholder="Banner image URL (optional)"
                  className="h-12 rounded-2xl border border-white/10 bg-slate-950/60 px-4 text-sm outline-none"
                />
                <input
                  value={form.address}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, address: event.target.value }))
                  }
                  placeholder="Address"
                  className="h-12 rounded-2xl border border-white/10 bg-slate-950/60 px-4 text-sm outline-none"
                />
                <input
                  value={form.place}
                  onChange={(event) =>
                    applyVenuePreset(event.target.value)
                  }
                  placeholder="Place / building"
                  autoComplete="off"
                  className="h-12 rounded-2xl border border-white/10 bg-slate-950/60 px-4 text-sm outline-none"
                />
                <div className="sm:col-span-2">
                  <div className="flex flex-wrap gap-2">
                    {suggestedVenues.map((venue) => (
                      <button
                        key={venue.label}
                        type="button"
                        onClick={() => applyVenuePreset(venue.label)}
                        className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1.5 text-xs font-medium text-cyan-100 transition hover:bg-cyan-400/20"
                      >
                        {venue.label}
                      </button>
                    ))}
                  </div>
                </div>
                <input
                  value={form.city}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, city: event.target.value }))
                  }
                  placeholder="City"
                  className="h-12 rounded-2xl border border-white/10 bg-slate-950/60 px-4 text-sm outline-none"
                />
                <input
                  value={form.floor}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, floor: event.target.value }))
                  }
                  placeholder="Floor"
                  className="h-12 rounded-2xl border border-white/10 bg-slate-950/60 px-4 text-sm outline-none"
                />
                <input
                  value={form.organizer}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, organizer: event.target.value }))
                  }
                  placeholder="Organizer"
                  className="h-12 rounded-2xl border border-white/10 bg-slate-950/60 px-4 text-sm outline-none"
                />
                <input
                  value={form.contact}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, contact: event.target.value }))
                  }
                  placeholder="Contact"
                  className="h-12 rounded-2xl border border-white/10 bg-slate-950/60 px-4 text-sm outline-none"
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
                <input
                  type="datetime-local"
                  value={form.startDate}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, startDate: event.target.value }))
                  }
                  placeholder="Start date"
                  className="h-12 rounded-2xl border border-white/10 bg-slate-950/60 px-4 text-sm outline-none"
                />
                <input
                  type="datetime-local"
                  value={form.endDate}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, endDate: event.target.value }))
                  }
                  placeholder="End date"
                  className="h-12 rounded-2xl border border-white/10 bg-slate-950/60 px-4 text-sm outline-none"
                />
              </div>

              <textarea
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({ ...current, description: event.target.value }))
                }
                placeholder="Description"
                className="min-h-32 rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm outline-none"
              />

              <div className="rounded-2xl border border-dashed border-cyan-300/30 bg-cyan-400/5 p-4">
                <p className="text-xs uppercase tracking-[0.28em] text-cyan-200/70">
                  Banner photo
                </p>
                <p className="mt-2 text-sm text-slate-300">
                  Upload a photo or paste a URL. Uploaded images are stored in the R2
                  bucket under the `mapssns/` folder.
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  {bannerFile ? (
                    <div className="rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-slate-300">
                      Selected file: {bannerFile.name}
                    </div>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => setBannerFile(null)}
                    className="rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/5"
                  >
                    Clear file
                  </button>
                </div>
                {bannerPreviewUrl ? (
                  <img
                    src={bannerPreviewUrl}
                    alt="Banner preview"
                    className="mt-4 h-40 w-full rounded-2xl object-cover"
                  />
                ) : null}
              </div>

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
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-medium text-cyan-300">Selected event</p>
                    <h3 className="mt-2 text-xl font-semibold">{selectedEvent.title}</h3>
                  </div>
                  <span
                    className={[
                      "w-fit rounded-full px-3 py-1 text-xs font-semibold",
                      selectedEvent.isPublished
                        ? "bg-emerald-400/15 text-emerald-200 ring-1 ring-emerald-400/25"
                        : "bg-amber-400/10 text-amber-200 ring-1 ring-amber-400/20",
                    ].join(" ")}
                  >
                    {selectedEvent.isPublished ? "Published" : "Draft"}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-400">
                  {selectedEvent.place ?? selectedEvent.address}
                </p>
                <p className="mt-1 text-sm text-slate-400">
                  Floor: {selectedEvent.floor ?? "N/A"}
                </p>
                <p className="mt-1 text-sm text-slate-400">
                  {selectedEvent.latitude.toFixed(4)}, {selectedEvent.longitude.toFixed(4)}
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void handlePublishToggle(selectedEvent)}
                    className="rounded-full border border-cyan-300/30 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-400/20"
                  >
                    {selectedEvent.isPublished ? "Unpublish" : "Publish"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteEvent(selectedEvent)}
                    className="rounded-full border border-rose-400/30 bg-rose-400/10 px-4 py-2 text-sm font-semibold text-rose-100 transition hover:bg-rose-400/20"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ) : null}
          </div>

          {pendingDeleteEvent ? (
            <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
              <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-slate-950 p-6 shadow-2xl shadow-black/40">
                <p className="text-xs uppercase tracking-[0.32em] text-rose-300/80">
                  Confirm delete
                </p>
                <h3 className="mt-2 text-2xl font-bold text-white">
                  {pendingDeleteEvent.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  This will permanently remove the event from the database and from the UI.
                </p>
                <div className="mt-6 flex flex-wrap justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setPendingDeleteEvent(null)}
                    className="rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/5"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => void confirmDeleteEvent()}
                    className="rounded-full bg-rose-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-rose-300"
                  >
                    Delete event
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
