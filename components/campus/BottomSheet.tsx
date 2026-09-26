"use client";
import Image from "next/image";
import { Navigation, X, MapPin } from "lucide-react";
import type { CampusLocation } from "@/types/campus";
import SlidePanel from "./SlidePanel";
import PlaceActions from "./PlaceActions";
import CampusAd from "./CampusAd";
import { conferenceEvents, findEventPlace, majorPlaceLabel, normalizePlaceName } from "@/data/majorPlaces";
import Helpline from "./Helpline";

const conferenceDescriptions: Record<string, string> = {
  "Cloak room": "Head to the Alumni lounge for the conference cloak room.",
  "Certificate corner": "Visit the Certificate corner at iHub for your conference certificate.",
  "Panel 1 + 2 + 3": "DT Playhouse: Panel 1 on the First Floor, Panel 2 on the Second Floor, and Panel 3 on the Ground Floor.",
  Spine: "Explore Spine during your conference visit. Continue to DT Playhouse for Panel 1 (First Floor), Panel 2 (Second Floor), and Panel 3 (Ground Floor).",
  Registration: "Your conference journey starts here. Head to CGC for registration and get ready to explore Chaos & Clarity.",
  Inauguration: "Join us at the Open Auditorium for the conference inauguration. Let the conversations on Chaos & Clarity begin.",
  "Panel 4": "Join us for Panel 4 at RM Hall, AI Campus, 1st Floor. Let the conversations on Chaos & Clarity continue.",
  "Car parking & bike parking": "Park your car or bike here and continue to your conference stops on campus.",
};
type Props = { location: CampusLocation; distance: number | null; walkingTime: number | null; onClose: () => void; onStartWalking: () => void };
export default function BottomSheet({ location, distance, walkingTime, onClose, onStartWalking }: Props) {
  const eventImage = conferenceEvents.find(event => event.image && findEventPlace(event, [location]))?.image;
  return <SlidePanel key={location.id} initiallyExpanded label={location.name + " details"}><div className="campus-place-details p-4 sm:p-5">
    <div className="flex items-start gap-3"><div className="min-w-0 flex-1"><p className="text-xs font-semibold uppercase tracking-widest text-teal-700">SNS Campus</p><h2 className="mt-2 break-words text-xl font-semibold sm:text-2xl">{location.name}</h2><p className="mt-1 text-sm capitalize text-zinc-500">{location.category} · {location.isVerified ? "Verified location" : "Approximate location"}</p></div><button onClick={onClose} aria-label="Close location details" className="google-round-button shrink-0"><X size={18} /></button></div>
    <div className="my-4 flex flex-wrap gap-2"><button onClick={onStartWalking} className="google-action-button bg-teal-700 text-white"><Navigation size={16} />Directions</button><PlaceActions location={location} /></div>
    <div className="relative h-44 overflow-hidden rounded-2xl bg-zinc-50"><Image src={eventImage || location.customIcon || "/place-placeholder.svg"} alt={location.name} fill sizes="380px" className="object-contain p-3" /></div>
    <p className="mt-4 text-sm leading-6 text-zinc-600">{conferenceDescriptions[majorPlaceLabel(location.name) ?? ""] || location.description || "Explore this location on the SNS campus."}</p>
    {normalizePlaceName(location.name) === "helpdesk" && <Helpline />}
    {distance !== null && <p className="mt-3 flex items-center gap-2 text-sm text-teal-700"><MapPin size={16} />{Math.round(distance)} m away{walkingTime !== null ? " · About " + Math.max(1, Math.ceil(walkingTime / 60)) + " min walk" : ""}</p>}
    <CampusAd placement="placeCard" />
  </div></SlidePanel>;
}
