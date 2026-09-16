import { adminWriteAccess } from "@/lib/adminAuth";
import { promises as fs } from "node:fs";
import path from "node:path";
import { DEFAULT_ADS, type AdBanner, type AdsConfig, type AdPlacement } from "@/lib/ads";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const adsFile = path.join(process.cwd(), "data", "ads.json");

async function readAds(): Promise<AdsConfig> {
  try {
    return JSON.parse(await fs.readFile(adsFile, "utf8")) as AdsConfig;
  } catch {
    return DEFAULT_ADS;
  }
}

async function writeAds(config: AdsConfig): Promise<void> {
  await fs.writeFile(adsFile, `${JSON.stringify(config, null, 2)}\n`, "utf8");
}

const VALID_PLACEMENTS: AdPlacement[] = ["landing", "placeCard"];

function cleanBanner(input: Partial<AdBanner> | undefined, fallbackOrder: number): AdBanner | null {
  if (!input) return null;
  const text = (v: unknown, original: string, max: number) =>
    typeof v === "string" ? v.trim().slice(0, max) : original;
  const placements = Array.isArray(input.placements)
    ? (input.placements.filter((p): p is AdPlacement => VALID_PLACEMENTS.includes(p as AdPlacement)))
    : [];
  if (placements.length === 0) placements.push("landing");
  return {
    id: text(input.id, `ad-${Date.now()}`, 80),
    enabled: typeof input.enabled === "boolean" ? input.enabled : true,
    placements,
    eyebrow: text(input.eyebrow, "", 50),
    title: text(input.title, "", 100),
    description: text(input.description, "", 280),
    imageUrl: text(input.imageUrl, "", 500),
    linkUrl: text(input.linkUrl, "", 500),
    buttonLabel: text(input.buttonLabel, "Learn more", 40),
    order: typeof input.order === "number" ? input.order : fallbackOrder,
  };
}

export async function GET() {
  return Response.json(await readAds(), {
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}

export async function PUT(request: Request) {
  const denied = adminWriteAccess(request);
  if (denied) return denied;

  const input = (await request.json()) as Partial<AdsConfig>;
  const current = await readAds();

  if (Array.isArray(input.banners)) {
    const banners: AdBanner[] = [];
    input.banners.forEach((raw, index) => {
      const cleaned = cleanBanner(raw, index);
      if (cleaned) banners.push(cleaned);
    });
    const next: AdsConfig = { banners };
    await writeAds(next);
    return Response.json(next);
  }

  return Response.json(current, { status: 200 });
}
