"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Map, Satellite, UserRound, X, Navigation, Settings2 } from "lucide-react";

export type Gender = "male" | "female";
export type PointerStyle = "character" | "blue" | "red" | "green";
export type MapStyle = "roadmap" | "satellite";
export type UserProfile = { name: string; gender: Gender; pointerStyle: PointerStyle; mapStyle: MapStyle };
type Props = { profile: UserProfile; onSave: (profile: UserProfile) => void; onClose: () => void };
const POINTERS: { value: PointerStyle; label: string; color: string }[] = [
  { value: "character", label: "Character", color: "#007b7e" },
  { value: "blue", label: "Blue", color: "#4285f4" },
  { value: "red", label: "Red", color: "#ea4335" },
  { value: "green", label: "Green", color: "#34a853" },
];
const optionClass = "relative flex cursor-pointer items-center gap-3 rounded-xl border border-zinc-200 bg-white p-3 text-sm text-zinc-700 transition-colors hover:bg-zinc-50 has-checked:border-teal-700 has-checked:bg-teal-50 has-checked:text-teal-800 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-teal-700";

export default function SettingsDialog({ profile, onSave, onClose }: Props) {
  const [draft, setDraft] = useState(profile);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    const previous = document.activeElement as HTMLElement | null;
    element?.showModal();
    return () => { element?.close(); previous?.focus(); };
  }, []);

  return <dialog ref={dialog} className="campus-settings" aria-labelledby="settings-title" onCancel={(event) => { event.preventDefault(); onClose(); }}>
    <form className="flex h-full min-h-0 flex-col" onSubmit={(event) => { event.preventDefault(); onSave({ ...draft, name: draft.name.trim() }); }}>
      <header className="flex shrink-0 items-center gap-3 border-b border-zinc-200 px-5 py-4 sm:px-6">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700"><Settings2 size={22} /></div>
        <div className="min-w-0 flex-1"><p className="text-[10px] font-semibold uppercase tracking-widest text-teal-700">SNS Campus</p><h2 id="settings-title" className="text-xl font-semibold text-zinc-900">Settings</h2></div>
        <button autoFocus type="button" onClick={onClose} aria-label="Close settings" className="google-round-button shrink-0"><X size={20} /></button>
      </header>
      <div className="min-h-0 flex-1 space-y-7 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6">
        <section aria-labelledby="profile-heading">
          <h3 id="profile-heading" className="flex items-center gap-2 text-sm font-semibold text-zinc-900"><UserRound size={17} className="text-teal-700" />Your profile</h3>
          <label className="mt-4 block text-sm text-zinc-600" htmlFor="profile-name">Your name</label>
          <input id="profile-name" name="name" autoComplete="given-name" maxLength={80} value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} placeholder="Enter your name" className="mt-2 h-12 w-full rounded-xl border border-zinc-300 bg-white px-3 text-base text-zinc-900 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100" />
          <fieldset className="mt-4"><legend className="text-sm text-zinc-600">Gender</legend><div className="mt-2 grid grid-cols-2 gap-3">
            {(["male", "female"] as const).map((gender) => <label key={gender} className={optionClass}><input type="radio" name="gender" value={gender} checked={draft.gender === gender} onChange={() => setDraft({ ...draft, gender })} className="h-4 w-4 accent-teal-700" /><span className="capitalize">{gender}</span></label>)}
          </div></fieldset>
        </section>
        <fieldset className="border-t border-zinc-100 pt-5"><legend className="flex items-center gap-2 text-sm font-semibold text-zinc-900"><Navigation size={17} className="text-teal-700" />Navigation pointer</legend>
          <p className="mb-3 text-xs leading-5 text-zinc-500">Choose how your position appears during navigation.</p>
          <div className="grid grid-cols-2 gap-3">{POINTERS.map((pointer) => <label key={pointer.value} className={optionClass}>
            <input type="radio" name="pointer" value={pointer.value} checked={draft.pointerStyle === pointer.value} onChange={() => setDraft({ ...draft, pointerStyle: pointer.value })} className="sr-only" />
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-50">{pointer.value === "character" ? <UserRound size={22} className="text-teal-700" /> : <span className="h-4 w-4 rounded-full ring-4 ring-zinc-100" style={{ backgroundColor: pointer.color }} />}</span>
            <span className="flex-1">{pointer.label}</span>{draft.pointerStyle === pointer.value && <Check size={15} aria-hidden="true" className="shrink-0" />}
          </label>)}</div>
        </fieldset>
        <fieldset className="border-t border-zinc-100 pt-5"><legend className="flex items-center gap-2 text-sm font-semibold text-zinc-900"><Map size={17} className="text-teal-700" />Map appearance</legend>
          <p className="mb-3 text-xs leading-5 text-zinc-500">Choose the view that helps you find your way.</p>
          <div className="grid grid-cols-2 gap-3">{([{ value: "roadmap", label: "Normal", description: "Roads and buildings", Icon: Map }, { value: "satellite", label: "Satellite", description: "Satellite imagery", Icon: Satellite }] as const).map(({ value, label, description, Icon }) => <label key={value} className={`${optionClass} flex-col items-start gap-2`}>
            <input type="radio" name="map-view" value={value} checked={draft.mapStyle === value} onChange={() => setDraft({ ...draft, mapStyle: value })} className="sr-only" />
            <div className="flex w-full items-center justify-between"><Icon size={24} className="text-teal-700" />{draft.mapStyle === value && <Check size={16} aria-hidden="true" />}</div>
            <span className="font-medium">{label}</span><span className="text-xs leading-4 text-zinc-500">{description}</span>
          </label>)}</div>
        </fieldset>
        <p className="text-xs text-zinc-500">Your preferences are saved on this device.</p>
      </div>
      <footer className="flex shrink-0 gap-3 border-t border-zinc-200 bg-white px-5 py-4 sm:px-6">
        <button type="button" onClick={onClose} className="google-action-button border border-zinc-200 px-5 text-zinc-700">Cancel</button>
        <button type="submit" className="google-action-button flex-1 justify-center bg-teal-700 text-white hover:bg-teal-800">Save settings</button>
      </footer>
    </form>
  </dialog>;
}
