import Link from "next/link";
import { notFound } from "next/navigation";

import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";
import { loadEvent } from "@/lib/api";

type EventPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function EventDetailsPage({ params }: EventPageProps) {
  const { id } = await params;
  const event = await loadEvent(id);

  if (!event) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <Link href="/" className="text-sm text-cyan-300">
          Back to discovery
        </Link>
        <section className="mt-6 overflow-hidden rounded-[2rem] border border-white/10 bg-white/5">
          <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
            <img
              src={event.bannerImage}
              alt={event.title}
              className="h-72 w-full object-cover lg:h-full"
            />
            <div className="space-y-6 p-6 lg:p-10">
              <div className="inline-flex rounded-full border border-cyan-300/20 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-100">
                {event.category}
              </div>
              <h1 className="text-4xl font-black tracking-tight text-white">
                {event.title}
              </h1>
              <p className="text-slate-300">{event.description}</p>

              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  ["Venue", event.place ?? event.address],
                  ["Floor", event.floor ?? "N/A"],
                  ["City", event.city],
                  ["Organizer", event.organizer],
                  ["Contact", event.contact],
                  ["Address", event.address],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                      {label}
                    </p>
                    <p className="mt-2 text-sm text-white">{value}</p>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-3">
                <a
                  href={`https://www.google.com/maps?q=${event.latitude},${event.longitude}`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950"
                >
                  Open in Google Maps
                </a>
                <span className="rounded-full border border-white/10 px-5 py-3 text-sm text-slate-300">
                  {new Date(event.startDate).toLocaleString()}
                </span>
                <span className="rounded-full border border-white/10 px-5 py-3 text-sm text-slate-300">
                  Ends {new Date(event.endDate).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
