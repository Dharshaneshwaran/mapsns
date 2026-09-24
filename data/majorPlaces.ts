import type { CampusLocation } from "@/types/campus";

type ConferenceEvent = { title: string; venue: string; names: string[]; locationId?: string; image?: string };

// Shared conference schedule for event cards, shortcuts, and map labels.
export const conferenceEvents: ConferenceEvent[] = [
  { title: "Registration", venue: "CGC", names: ["cgc", "cgc building"] },
  { title: "Inauguration + Panel session one", venue: "Open Auditorium", names: ["open auditorium", "sns open auditorium", "sns open autorium", "main hall"], locationId: "a4b04246-3348-4ce1-b521-d6b4f3e5490b", image: "/uploads/map-images/15ee30aefd4e93c3cae803c6a2bd8edbdc8c7f0a51b84d54ee0e72c51a776a2e.png" },
  { title: "Panel sessions two + three + four", venue: "DT Playhouse", names: ["dtplayhouse", "dt playhouse", "parallel panel sessions"], locationId: "79999ce7-d83c-4eeb-b811-c61d0d7fb451", image: "/uploads/map-images/8f5b50c8ed91c1db2ee532d54a541a6362b505d2eafabcf611e25d3a064ef5ca.png" },
  { title: "Cloak room", venue: "Alumni lounge", names: ["alumni lounge", "sns alumni lounge", "cloak room", "cloakroom"] },
  { title: "Certificate corner", venue: "iHub", names: ["ihub", "i hub", "sns ihub", "sns i hub"] },
  { title: "Car parking & bike parking", venue: "Parking", names: ["car parking & bike parking", "car parking", "bike parking", "parking"] },
];

export function normalizePlaceName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function findEventPlace(event: ConferenceEvent, places: CampusLocation[]): CampusLocation | undefined {
  return places.find(place => place.id === event.locationId)
    ?? places.find(place => event.names.some(alias => normalizePlaceName(alias) === normalizePlaceName(place.name)));
}

export function majorPlaceLabel(name: string): string | undefined {
  const matches = conferenceEvents.filter(event => event.names.some(alias => normalizePlaceName(alias) === normalizePlaceName(name)));
  return matches.length ? matches.map(event => event.title).join(" / ") : undefined;
}
