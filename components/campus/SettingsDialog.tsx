"use client";

import { useState } from "react";
import { Settings, UserRound, X } from "lucide-react";

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
    <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="settings-title">
      <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-50 text-blue-600">
            <Settings className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h2 id="settings-title" className="font-bold text-zinc-900">Profile settings</h2>
            <p className="text-xs text-zinc-500">Personalize your campus pointer</p>
          </div>
          <button onClick={onClose} aria-label="Close settings" className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-zinc-600 hover:bg-zinc-200">
            <X className="h-4 w-4" />
          </button>
        </div>

        <label className="mt-6 block text-sm font-semibold text-zinc-700" htmlFor="profile-name">Your name</label>
        <div className="mt-2 flex items-center gap-2 rounded-2xl border border-zinc-200 px-3">
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
                type="button"
                onClick={() => setDraft({ ...draft, gender })}
                className={`rounded-2xl border px-4 py-3 text-sm font-medium capitalize ${draft.gender === gender ? "border-blue-500 bg-blue-50 text-blue-700" : "border-zinc-200 text-zinc-600 hover:bg-zinc-50"}`}
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
                type="button"
                onClick={() => setDraft({ ...draft, pointerStyle: pointer.value })}
                className={`flex items-center gap-2 rounded-2xl border px-3 py-3 text-sm font-medium ${draft.pointerStyle === pointer.value ? "border-blue-500 bg-blue-50 text-blue-700" : "border-zinc-200 text-zinc-600 hover:bg-zinc-50"}`}
              >
                <span className="h-4 w-4 rounded-full border-2 border-white shadow" style={{ backgroundColor: pointer.color }} />
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
              onClick={() => setDraft({ ...draft, mapStyle: "roadmap" })}
              className={`rounded-2xl border px-4 py-3 text-sm font-medium ${draft.mapStyle === "roadmap" ? "border-blue-500 bg-blue-50 text-blue-700" : "border-zinc-200 text-zinc-600 hover:bg-zinc-50"}`}
            >
              Standard
            </button>
            <button
              type="button"
              onClick={() => setDraft({ ...draft, mapStyle: "hybrid" })}
              className={`rounded-2xl border px-4 py-3 text-sm font-medium ${draft.mapStyle === "hybrid" ? "border-blue-500 bg-blue-50 text-blue-700" : "border-zinc-200 text-zinc-600 hover:bg-zinc-50"}`}
            >
              Satellite
            </button>
          </div>
        </fieldset>

        <button
          onClick={() => onSave({ ...draft, name: draft.name.trim() })}
          className="mt-6 w-full rounded-full bg-blue-600 py-3 font-semibold text-white transition-colors hover:bg-blue-700"
        >
          Save settings
        </button>
      </div>
    </div>
  );
}
