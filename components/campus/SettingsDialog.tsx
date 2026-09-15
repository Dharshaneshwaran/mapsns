"use client";

import { useState } from "react";
import { Map, Satellite, UserRound, X } from "lucide-react";

export type Gender = "male" | "female";
export type PointerStyle = "character" | "blue" | "red" | "green";
export type MapStyle = "roadmap" | "hybrid";

export type UserProfile = {
  name: string;
  gender: Gender;
  pointerStyle: PointerStyle;
  mapStyle: MapStyle;
};

type Props = {
  profile: UserProfile;
  onSave: (profile: UserProfile) => void;
  onClose: () => void;
};

const POINTERS: { value: PointerStyle; label: string; color: string }[] = [
  { value: "character", label: "Character", color: "#4285f4" },
  { value: "blue", label: "Blue", color: "#4285f4" },
  { value: "red", label: "Red", color: "#ea4335" },
  { value: "green", label: "Green", color: "#34a853" },
];

export default function SettingsDialog({ profile, onSave, onClose }: Props) {
  const [draft, setDraft] = useState(profile);

  return (
    <div className="absolute inset-0 z-[60] flex items-end justify-center bg-zinc-900/35 sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-labelledby="settings-title">
      <div className="w-full max-w-md max-h-[90dvh] overflow-y-auto rounded-t-3xl border border-zinc-200 bg-white p-5 pb-[max(20px,env(safe-area-inset-bottom))] text-[#202124] shadow-2xl sm:rounded-3xl sm:p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
            <UserRound className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-[.18em] text-teal-700">SNS Campus</p>
            <h2 id="settings-title" className="text-xl font-semibold tracking-tight text-zinc-900">Profile settings</h2>
            <p className="mt-1 text-xs text-zinc-500">Make the campus map your own</p>
          </div>
          <button onClick={onClose} aria-label="Close settings" className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-zinc-600 hover:bg-zinc-200">
            <X className="h-4 w-4" />
          </button>
        </div>

        <label className="mt-6 block text-sm font-semibold text-zinc-700" htmlFor="profile-name">Your name</label>
        <div className="mt-2 flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 focus-within:border-teal-600 focus-within:ring-2 focus-within:ring-teal-100">
          <UserRound className="h-5 w-5 text-zinc-400" />
          <input
            id="profile-name"
            value={draft.name}
            onChange={(event) => setDraft({ ...draft, name: event.target.value })}
            placeholder="Enter your name"
            className="h-12 min-w-0 flex-1 bg-transparent text-sm text-zinc-900 outline-none placeholder:text-zinc-400"
          />
        </div>

        <fieldset className="mt-5">
          <legend className="text-sm font-semibold text-zinc-700">Gender</legend>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {(["male", "female"] as const).map((gender) => (
              <button
                key={gender}
                aria-pressed={draft.gender === gender}
                type="button"
                onClick={() => setDraft({ ...draft, gender })}
                className={`rounded-xl border px-4 py-3 text-sm font-medium capitalize ${draft.gender === gender ? "border-teal-600 bg-teal-50 text-teal-800" : "border-zinc-200 text-zinc-600 hover:bg-zinc-50"}`}
              >
                {gender}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="mt-5">
          <legend className="text-sm font-semibold text-zinc-700">Map pointer</legend>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {POINTERS.map((pointer) => (
              <button
                key={pointer.value}
                aria-pressed={draft.pointerStyle === pointer.value}
                type="button"
                onClick={() => setDraft({ ...draft, pointerStyle: pointer.value })}
                className={`flex items-center gap-2 rounded-xl border px-3 py-3 text-sm font-medium ${draft.pointerStyle === pointer.value ? "border-teal-600 bg-teal-50 text-teal-800" : "border-zinc-200 text-zinc-600 hover:bg-zinc-50"}`}
              >
                {pointer.value === "character" ? <UserRound className="h-5 w-5 text-teal-700" /> : <span className="h-5 w-5 rounded-full border-[3px] border-white shadow" style={{ backgroundColor: pointer.color }} />}
                {pointer.label}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="mt-5">
          <legend className="text-sm font-semibold text-zinc-700">Map view</legend>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button
              type="button"
              aria-pressed={draft.mapStyle === "roadmap"}
              onClick={() => setDraft({ ...draft, mapStyle: "roadmap" })}
              className={`rounded-xl border px-4 py-3 text-sm font-medium ${draft.mapStyle === "roadmap" ? "border-teal-600 bg-teal-50 text-teal-800" : "border-zinc-200 text-zinc-600 hover:bg-zinc-50"}`}
            >
              <Map className="mx-auto mb-2 h-6 w-6" />Standard
            </button>
            <button
              type="button"
              aria-pressed={draft.mapStyle === "hybrid"}
              onClick={() => setDraft({ ...draft, mapStyle: "hybrid" })}
              className={`rounded-xl border px-4 py-3 text-sm font-medium ${draft.mapStyle === "hybrid" ? "border-teal-600 bg-teal-50 text-teal-800" : "border-zinc-200 text-zinc-600 hover:bg-zinc-50"}`}
            >
              <Satellite className="mx-auto mb-2 h-6 w-6" />Satellite
            </button>
          </div>
        </fieldset>

        <button
          onClick={() => onSave({ ...draft, name: draft.name.trim() })}
          className="mt-6 w-full rounded-full bg-teal-700 py-3 text-sm font-medium text-white transition-colors hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
        >
          Save settings
        </button>
      </div>
    </div>
  );
}
