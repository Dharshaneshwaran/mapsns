// Shared conference schedule for event cards, shortcuts, and map labels.
export const conferenceEvents = [
  { title: "Registration", venue: "CGC", names: ["cgc", "cgc building"] },
  { title: "Inauguration + Panel session one", venue: "Open Auditorium", names: ["open auditorium", "sns open auditorium", "sns open autorium"] },
  { title: "Panel sessions two + three + four", venue: "DT Playhouse", names: ["dtplayhouse", "dt playhouse"] },
  { title: "Spine", venue: "Spine", names: ["spine", "spine", "spine bioscope"] },
  { title: "Cloak room", venue: "Alumni lounge", names: ["alumni lounge", "sns alumni lounge", "cloak room", "cloakroom"] },
  { title: "Certificate corner", venue: "iHub", names: ["ihub", "i hub", "sns ihub", "sns i hub"] },
  { title: "Car parking & bike parking", venue: "Parking", names: ["car parking & bike parking", "car parking", "bike parking", "parking"] },
];

// Additional places, images, and highlights for the "More" tab.
export const morePlaces = [
  { title: "Library", venue: "SNS Library · Ground floor", names: ["library", "sns library"], icon: "/place-placeholder.svg" },
  { title: "Cafeteria", venue: "Food Court · 2nd floor", names: ["cafeteria", "food court", "canteen"], icon: "/place-placeholder.svg" },
  { title: "Innovation Hub", venue: "iHub · 3rd floor", names: ["ihub", "innovation hub", "i hub", "sns ihub", "sns i hub"], icon: "/place-placeholder.svg" },
  { title: "Open Auditorium", venue: "Open Air Theatre", names: ["open air theatre", "oat", "open auditorium", "sns open auditorium", "sns open autorium"], icon: "/place-placeholder.svg" },
  { title: "Sports Complex", venue: "SNS Sports Zone", names: ["sports", "sports complex", "sports zone"], icon: "/place-placeholder.svg" },
  { title: "Heritage Block", venue: "Heritage Building · 1st floor", names: ["heritage", "heritage block", "heritage building"], icon: "/place-placeholder.svg" },
];

export function normalizePlaceName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function majorPlaceLabel(name: string): string | undefined {
  const matches = conferenceEvents.filter(event => event.names.some(alias => normalizePlaceName(alias) === normalizePlaceName(name)));
  return matches.length ? matches.map(event => event.title).join(" / ") : undefined;
}
