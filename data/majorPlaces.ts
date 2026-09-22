// Shared conference schedule for event cards, shortcuts, and map labels.
export const conferenceEvents = [
  { title: "Registration", venue: "CGC", names: ["cgc", "cgc building"] },
  { title: "Inauguration + Panel session one", venue: "Open Auditorium", names: ["open auditorium", "sns open auditorium", "sns open autorium"] },
  { title: "Panel session two", venue: "RM Hall · 1st floor", names: ["rm hall", "r m hall", "ai campus", "RM Hall · AI Campus · 1st floor"] },
  { title: "Panel session three", venue: "DT Playhouse", names: ["dtplayhouse", "dt playhouse"] },
  { title: "Panel session four", venue: "Spine · Bioscope", names: ["spine", "spine bioscope"] },
];

// Additional places, images, and highlights for the "More" tab.
export const morePlaces = [
  { title: "Library", venue: "SNS Library · Ground floor", names: ["library", "sns library"], icon: "/cultural.png" },
  { title: "Cafeteria", venue: "Food Court · 2nd floor", names: ["cafeteria", "food court", "canteen"], icon: "/cultural.png" },
  { title: "Innovation Hub", venue: "iHub · 3rd floor", names: ["ihub", "innovation hub", "i hub"], icon: "/cultural.png" },
  { title: "Open Auditorium", venue: "Open Air Theatre", names: ["open air theatre", "oat"], icon: "/cultural.png" },
  { title: "Sports Complex", venue: "SNS Sports Zone", names: ["sports", "sports complex", "sports zone"], icon: "/cultural.png" },
  { title: "Heritage Block", venue: "Heritage Building · 1st floor", names: ["heritage", "heritage block", "heritage building"], icon: "/cultural.png" },
];

export function normalizePlaceName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function majorPlaceLabel(name: string): string | undefined {
  const matches = conferenceEvents.filter(event => event.names.some(alias => normalizePlaceName(alias) === normalizePlaceName(name)));
  return matches.length ? matches.map(event => event.title).join(" / ") : undefined;
}
