import Link from "next/link";
import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar />

      <main className="mx-auto flex min-h-[calc(100vh-12rem)] max-w-7xl flex-col justify-center px-6 py-16 sm:px-8 lg:px-12">
        <div className="max-w-3xl">
          <div className="mb-6 inline-flex items-center rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-sm font-medium text-emerald-200">
            Discover campus events in seconds
          </div>
          <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Find what is happening around you, right from the campus home page.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
            Explore nearby activities, jump into the interactive map, or open the full 3D campus experience from one simple landing page.
          </p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Link
              href="/map"
              className="rounded-full bg-emerald-400 px-6 py-3 text-center text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
            >
              Open 2D Map
            </Link>
            <Link
              href="/campus"
              className="rounded-full border border-white/15 bg-white/5 px-6 py-3 text-center text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Open 3D Campus
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
