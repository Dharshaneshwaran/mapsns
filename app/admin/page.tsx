import Link from "next/link";
import { Building2, CircleCheck, Map, MapPin, Users } from "lucide-react";
import { CAMPUS_LOCATIONS } from "@/data/campusLocations";
import MapImageEditor from "@/components/admin/MapImageEditor";
import LandingEditor from "@/components/admin/LandingEditor";
import AdBannerEditor from "@/components/admin/AdBannerEditor";
import LiveVisitors from "@/components/admin/LiveVisitors";

const managedPlaces = [
  { label: "Registration Office", locationId: "admin-building" },
  { label: "Place 1", locationId: "heritage-courtyard" },
  { label: "Place 2", locationId: "temple" },
  { label: "Place 3", locationId: "ihub" },
];

export default function AdminPage() {
  return (
    <main className="campus-admin fixed inset-0 overflow-y-auto bg-[#f7f9fc] text-[#202124]">
      <header className="border-b border-[#e3e7ee] bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#008b92] text-white">
              <Map className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#008b92]">SNS Campus</p>
              <h1 className="text-xl font-semibold">Admin Portal</h1>
            </div>
          </div>
          <Link href="http://localhost:3000" className="rounded-full border border-[#dadce0] bg-white px-4 py-2 text-sm font-medium shadow-sm hover:bg-[#f8f9fa]">
            Open campus map
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-7 lg:px-8">
        <LiveVisitors />
        <MapImageEditor />
        <AdBannerEditor />
        <LandingEditor />
        <section className="mb-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Managed places", value: managedPlaces.length, icon: Building2 },
            { label: "Campus locations", value: CAMPUS_LOCATIONS.length, icon: MapPin },
            { label: "Active routes", value: 1, icon: Map },
            { label: "System status", value: "Online", icon: CircleCheck },
          ].map(({ label, value, icon: Icon }) => (
            <article key={label} className="rounded-2xl border border-[#e3e7ee] bg-white p-5 shadow-sm">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[#e0f3f4] text-[#007b7e]"><Icon className="h-5 w-5" /></div>
              <p className="text-sm text-[#5f6368]">{label}</p>
              <p className="mt-1 text-2xl font-semibold">{value}</p>
            </article>
          ))}
        </section>

        <section className="overflow-hidden rounded-2xl border border-[#e3e7ee] bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-[#e3e7ee] px-5 py-4">
            <div>
              <h2 className="text-lg font-semibold">Map shortcuts</h2>
              <p className="text-sm text-[#5f6368]">Places displayed at the top of the campus map</p>
            </div>
            <Users className="h-5 w-5 text-[#5f6368]" />
          </div>
          <div className="divide-y divide-[#eef1f5]">
            {managedPlaces.map(({ label, locationId }) => {
              const location = CAMPUS_LOCATIONS.find((item) => item.id === locationId);
              return (
                <div key={locationId} className="grid gap-2 px-5 py-4 sm:grid-cols-[1fr_1.4fr_auto] sm:items-center">
                  <p className="font-medium">{label}</p>
                  <p className="text-sm text-[#5f6368]">{location?.name ?? locationId}</p>
                  <span className="w-fit rounded-full bg-[#e6f4ea] px-3 py-1 text-xs font-semibold text-[#137333]">Visible</span>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
