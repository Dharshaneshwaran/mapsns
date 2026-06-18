import Link from "next/link";

import { formatDistance } from "@/lib/events";
import type { EventWithDistance } from "@/types/event";

type EventCardProps = {
  event: EventWithDistance;
};

export function EventCard({ event }: EventCardProps) {
  return (
    <article className="group overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl shadow-cyan-950/10 transition hover:-translate-y-1 hover:border-cyan-300/30">
      <div className="relative h-52 overflow-hidden">
        <img
          src={event.bannerImage}
          alt={event.title}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/10 to-transparent" />
        <div className="absolute left-4 top-4 rounded-full bg-slate-950/80 px-3 py-1 text-xs font-semibold text-cyan-200 ring-1 ring-cyan-300/30">
          {event.category}
        </div>
        <div className="absolute bottom-4 left-4 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white backdrop-blur">
          {formatDistance(event.distanceKm)}
        </div>
      </div>
      <div className="space-y-4 p-5">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
            {event.city}
          </p>
          <h3 className="mt-2 text-xl font-semibold text-white">{event.title}</h3>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            {event.description}
          </p>
        </div>
        <div className="flex items-center justify-between gap-4 text-sm text-slate-300">
          <span>{new Date(event.startDate).toLocaleDateString()}</span>
          <span>Popularity {event.popularity}</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm text-slate-400">{event.address}</span>
          <Link
            href={`/events/${event.id}`}
            className="rounded-full bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
          >
            View details
          </Link>
        </div>
      </div>
    </article>
  );
}
