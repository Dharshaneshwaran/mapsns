import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-slate-950">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div>
          <p className="text-lg font-semibold text-white">Event Discovery</p>
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">
            A modern platform for nearby event discovery, location-based search,
            and admin event management.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-300">
          <Link href="/#discover">Discover</Link>
          <Link href="/events/1">Event details</Link>
          <Link href="/admin/login">Admin login</Link>
        </div>
      </div>
    </footer>
  );
}

