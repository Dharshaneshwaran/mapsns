"use client";
import { useState } from "react";
import { ArrowUpRight, Bookmark, Building2, MapPin, Navigation, Settings, ArrowLeft, Grid3x3 } from "lucide-react";
import Image from "next/image";
import { useCampusPlaces } from "@/components/campus/useCampusPlaces";
import type { CampusLocation } from "@/types/campus";
import CampusAd from "./CampusAd";
import { useSavedPlaces } from "./PlaceActions";

import { conferenceEvents, majorPlaceLabel, normalizePlaceName } from "@/data/majorPlaces";

type Props = { onSelect: (location: CampusLocation) => void; onOpenSettings: () => void; name: string; gender: "male" | "female" };
export default function ExplorePanel({ onSelect, onOpenSettings, name }: Props) {
  const places = useCampusPlaces();
  const saved = useSavedPlaces();
  const [tab, setTab] = useState("events");
  const [showMap, setShowMap] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const normalize = normalizePlaceName;
  const cards = tab === "saved"
    ? places.filter(place => saved.includes(place.id)).map(place => ({ title: place.name, venue: "Saved place", place }))
    : conferenceEvents.map(event => ({ ...event, place: places.find(place => event.names.some(alias => normalize(alias) === normalize(place.name))) }));
  if (showMap) return <div className="event-map-return"><button onClick={() => setShowMap(false)}><ArrowLeft size={17} /> Back to event guide</button></div>;
  if (showMore) return <section className="event-landing" aria-label="More places">
    <div className="event-home">
      <div className="event-greeting" style={{ marginTop: "clamp(16px, 4vh, 40px)" }}>
        <button onClick={() => setShowMore(false)} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", color: "#74777b", display: "flex", alignItems: "center", gap: 4, fontSize: 12 }}>
          <ArrowLeft size={17} /> Back
        </button>
      </div>
      <div className="event-section-label"><h2>More places on campus</h2><span>{places.length} places</span></div>
      <div className="campus-place-grid event-grid">
        {places.map(place => <button key={place.id} className="campus-place-tile event-tile" onClick={() => onSelect(place)}>
          <span className="campus-place-art">
            {place.customIcon ? <Image src={place.customIcon} alt="" width={160} height={100} style={{ width: "auto" }} unoptimized /> : <Building2 size={48} strokeWidth={1.2} />}
            <ArrowUpRight className="campus-tile-arrow" size={15} aria-hidden="true" />
          </span>
          <span className="campus-place-name">{place.name}</span>
          <span className="campus-place-caption">{majorPlaceLabel(place.name) || "View on map"}</span>
        </button>)}

      </div>
      <p className="event-footer"><span><MapPin size={15} /></span> Discover more of SNS campus.</p>
    </div>
  </section>;
  return <section className="event-landing" aria-label="SNS event guide">
    <div className="event-home">
      <header className="event-home-header">
        <button className="event-avatar" onClick={onOpenSettings} aria-label="Open profile settings"><Image src="/uploads/map-images/gdta_logo.png" alt="GDTA" width={46} height={46} unoptimized /></button>
        <div className="event-brand"><span><b>D</b> CONFERENCE ’26</span><p>SNS Institutions · Campus guide</p></div>
      </header>
      <div className="conference-artwork">
        <Image src="/web%20image%20copy.png" alt="Colourful collage of Indian cultural landmarks, dance, and traditions" fill sizes="(min-width: 1440px) 660px, (min-width: 1024px) 46vw, 100vw" className="object-cover object-top" />
      </div>
      <div className="event-greeting">
        <div className="conference-intro"><p className="conference-welcome">{name.trim() ? `Welcome, ${name.trim()}` : "Welcome to D Conference 2026"}</p><h1>Chaos <span>&amp;</span> Clarity</h1><p className="conference-tagline">Driving Progress with Design Thinking</p><p className="conference-date">September 29 &amp; 30, 2026 · SNS Institutions</p></div>
        <div className="event-header-actions">
          <button onClick={() => setTab(tab === "saved" ? "events" : "saved")} aria-label={tab === "saved" ? "Show event sessions" : "Saved places"} aria-pressed={tab === "saved"}><Bookmark size={17} /></button>
          <button onClick={onOpenSettings} aria-label="Open settings"><Settings size={17} /></button>
        </div>
      </div>
      <button className="event-map-link" onClick={() => setShowMap(true)}>
        <span className="event-mini-map" aria-hidden="true"><MapPin size={21} /></span>
        <span className="event-map-pill">Explore campus</span>
        <span className="event-map-caption"><Navigation size={12} /> View map</span>
      </button>
      <div className="event-section-label"><h2>{tab === "saved" ? "Your saved places" : "Your event, your next stop"}</h2><span>{cards.length} {tab === "saved" ? "places" : "stops"}</span></div>
      <div className="campus-place-grid event-grid">
        {cards.map((card, index) => <button key={`${card.title}-${index}`} className="campus-place-tile event-tile" onClick={() => card.place && onSelect(card.place)} disabled={!card.place}>
          <span className="campus-place-art">
            {card.place?.customIcon ? <Image src={card.place.customIcon} alt="" width={160} height={100} style={{ width: "auto" }} unoptimized /> : <Building2 size={48} strokeWidth={1.2} />}
            {card.place && <ArrowUpRight className="campus-tile-arrow" size={15} aria-hidden="true" />}
          </span>
          <span className="campus-place-name">{card.title}</span>
          <span className="campus-place-caption">{card.venue}</span>
          {!card.place && <span className="event-unmapped">Location coming soon</span>}
        </button>)}
        {tab === "events" && <button className="campus-place-tile event-tile event-more-tile" onClick={() => setShowMore(true)}>
          <span className="campus-place-art event-more-art"><Grid3x3 size={36} strokeWidth={1.5} /></span>
          <span className="campus-place-name">More</span>
          <span className="campus-place-caption">Explore extra places</span>
        </button>}
      </div>
      {tab === "saved" && cards.length === 0 && <p className="event-empty">Save a campus place to find it here.</p>}
      <p className="event-footer"><span><MapPin size={15} /></span> A little guidance. A great day on campus.</p>
      <CampusAd placement="landing" />
    </div>
  </section>;
}
