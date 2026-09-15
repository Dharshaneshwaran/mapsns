import { adminWriteAccess } from "@/lib/adminAuth";
import { readFile, mkdir, writeFile, rename } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { DEFAULT_LANDING, type LandingConfig } from "@/lib/landing";
import { publishedPlaces } from "@/lib/publishedPlaces";
import { readMapImages } from "@/lib/mapImageStore";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const directory = process.env.MAP_IMAGES_DATA_DIR || path.join(process.cwd(), ".map-data");
const file = path.join(directory, "landing.json");
async function read() {
  try { return JSON.parse(await readFile(file, "utf8")) as LandingConfig; }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    try { const ads = JSON.parse(await readFile(path.join(process.cwd(), "data", "ads.json"), "utf8")); return { ...DEFAULT_LANDING, ad: ads.landing || DEFAULT_LANDING.ad }; } catch { return DEFAULT_LANDING; }
  }
}
export async function GET() {
  try { return Response.json(await read(), { headers: { "Cache-Control": "no-store" } }); }
  catch { return Response.json({ error: "Could not load sidebar settings." }, { status: 500 }); }
}
export async function PUT(request: Request) {
  const denied = adminWriteAccess(request);
  if (denied) return denied;
  let next: LandingConfig;
  const availablePlaces = publishedPlaces((await readMapImages()).images);
  try {
    const body = await request.text();
    if (body.length > 16000) throw new Error("Sidebar content is too large.");
    const input = JSON.parse(body);
    const text = (value: unknown, max: number) => { if (typeof value !== "string" || value.length > max) throw new Error("Invalid or oversized text field."); return value.trim(); };
    if (!Array.isArray(input.placeIds) || input.placeIds.length > availablePlaces.length || input.placeIds.some((id: unknown) => !availablePlaces.some((place) => place.id === id))) throw new Error("Invalid featured places.");
    const ad = input.ad;
    if (!ad || typeof ad.enabled !== "boolean") throw new Error("Invalid advertisement.");
    next = { brand: text(input.brand, 80), heading: text(input.heading, 120), description: text(input.description, 400), sectionTitle: text(input.sectionTitle, 80), placeIds: [...new Set<string>(input.placeIds)], ad: { enabled: ad.enabled, eyebrow: text(ad.eyebrow, 50), title: text(ad.title, 100), description: text(ad.description, 280), imageUrl: text(ad.imageUrl, 500), linkUrl: text(ad.linkUrl, 500), buttonLabel: text(ad.buttonLabel, 40) } };
    if (!next.heading) throw new Error("Enter a sidebar heading.");
    if (!/^(https?:\/\/|\/(?!\/))/.test(next.ad.imageUrl) || !/^https?:\/\//.test(next.ad.linkUrl)) throw new Error("Use a public image path or HTTPS image URL, and an HTTP(S) destination link.");
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Invalid settings." }, { status: 400 }); }
  try { await mkdir(directory, { recursive: true }); const temporary = path.join(directory, `landing-${randomUUID()}.tmp`); await writeFile(temporary, JSON.stringify(next, null, 2)); await rename(temporary, file); return Response.json(next); }
  catch { return Response.json({ error: "Could not save sidebar settings. Check server storage." }, { status: 500 }); }
}
