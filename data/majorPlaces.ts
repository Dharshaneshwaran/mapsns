// Display-only landmark list. All destinations remain searchable and routable.
const labels: Record<string, string> = {
  cgc: "CGC", cgcbuilding: "CGC",
  openauditorium: "Open Auditorium", snsopenauditorium: "Open Auditorium", snsopenautorium: "Open Auditorium",
  rmhall: "RM Hall", dtplayhouse: "DT Playhouse",
  spine: "Spine · Bioscope", spinebioscope: "Spine · Bioscope",
};
export function majorPlaceLabel(name: string): string | undefined {
  return labels[name.toLowerCase().replace(/[^a-z0-9]/g, "")];
}
