// Shared conference schedule for event cards, shortcuts, and map labels.
export const conferenceEvents = [
  { title: "Registration", venue: "CGC", names: ["cgc", "cgc building"] },
  { title: "Inauguration + Panel session one", venue: "Open Auditorium", names: ["open auditorium", "sns open auditorium", "sns open autorium"] },
  { title: "Panel sessions two + three + four", venue: "DT Playhouse", names: ["dtplayhouse", "dt playhouse"] },
  { title: "Spin", venue: "Spin", names: ["spin", "spine", "spine bioscope"] },
];

export function normalizePlaceName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function majorPlaceLabel(name: string): string | undefined {
  const matches = conferenceEvents.filter(event => event.names.some(alias => normalizePlaceName(alias) === normalizePlaceName(name)));
  return matches.length ? matches.map(event => event.title).join(" / ") : undefined;
}
