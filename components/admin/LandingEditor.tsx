"use client";
import { useEffect, useState } from "react";
import { useCampusPlaces } from "@/components/campus/useCampusPlaces";
import { type LandingConfig } from "@/lib/landing";
export default function LandingEditor() {
  const CAMPUS_LOCATIONS = useCampusPlaces();
  const [draft, setDraft] = useState<LandingConfig | null>(null);
  const [message, setMessage] = useState(""); const [error, setError] = useState(""); const [busy, setBusy] = useState(false); const [token, setToken] = useState("");
  useEffect(() => { let active = true; void fetch("/api/landing", { cache: "no-store" }).then(async (response) => { if (!response.ok) throw new Error("Could not load sidebar settings. Refresh to retry."); return response.json(); }).then((data) => { if (active) setDraft(data); }).catch((error) => { if (active) setError(error.message); }); return () => { active = false; }; }, []);
  async function save() {
    setBusy(true); setError(""); setMessage("");
    try { const response = await fetch("/api/landing", { method: "PUT", headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(draft) }); const data = await response.json(); if (!response.ok) throw new Error(data.error); setDraft(data); setMessage("Published. The landing sidebar updates within 10 seconds."); }
    catch (error) { setError(error instanceof Error ? error.message : "Save failed. Your edits are still here."); } finally { setBusy(false); }
  }
  return <section className="mb-7 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"><h2 className="text-lg font-semibold">Landing sidebar</h2><p className="mt-1 text-sm text-zinc-500">Edit the introduction and featured places shown on desktop and mobile. Ad banners are managed in the Ad banners section above.</p>
    {!draft && !error && <p className="mt-4 text-sm">Loading…</p>}
    {draft && <form onSubmit={(event) => { event.preventDefault(); void save(); }}><fieldset disabled={busy} className="mt-5 grid gap-5 md:grid-cols-2"><div className="space-y-3">
      {([['brand', 'Brand', 80], ['heading', 'Heading', 120], ['description', 'Description', 400], ['sectionTitle', 'Places heading', 80]] as const).map(([key, label, max]) => <label key={key} className="block text-sm font-medium">{label}<input required={key === "heading"} maxLength={max} value={draft[key]} onChange={(event) => { setDraft({ ...draft, [key]: event.target.value }); setMessage(""); }} className="mt-1 block w-full rounded-lg border border-zinc-300 p-2 font-normal" /></label>)}
      <h3 className="pt-2 text-sm font-semibold">Featured places</h3><div className="max-h-52 overflow-auto rounded-lg border border-zinc-200 p-3">{CAMPUS_LOCATIONS.map((place) => <label key={place.id} className="flex items-center gap-2 py-1 text-sm"><input type="checkbox" checked={draft.placeIds.includes(place.id)} onChange={(event) => { setDraft({ ...draft, placeIds: event.target.checked ? [...draft.placeIds, place.id] : draft.placeIds.filter((id) => id !== place.id) }); setMessage(""); }} />{place.name}</label>)}</div>
    </div><div className="flex flex-wrap items-end gap-3 md:col-span-2"><label className="text-xs text-zinc-500">Admin publish key (if configured)<input type="password" autoComplete="off" value={token} onChange={(event) => setToken(event.target.value)} className="mt-1 block rounded-lg border border-zinc-300 p-2" /></label><button type="submit" className="rounded-full bg-teal-700 px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50">{busy ? "Publishing…" : "Save / Publish sidebar"}</button></div></fieldset></form>}
    {message && <p role="status" className="mt-4 text-sm text-teal-700">{message}</p>}{error && <p role="alert" className="mt-4 text-sm text-red-700">{error}</p>}
  </section>;
}
