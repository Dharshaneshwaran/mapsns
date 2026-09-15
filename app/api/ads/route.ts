import { adminWriteAccess } from "@/lib/adminAuth";
import { promises as fs } from "node:fs";
import path from "node:path";
import { DEFAULT_ADS, type AdPlacement, type AdsConfig } from "@/lib/ads";

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

function cleanPlacement(value: Partial<AdPlacement> | undefined, fallback: AdPlacement): AdPlacement {
  const text = (input: unknown, original: string, max: number) =>
    typeof input === "string" ? input.trim().slice(0, max) : original;

  return {
    enabled: typeof value?.enabled === "boolean" ? value.enabled : fallback.enabled,
    eyebrow: text(value?.eyebrow, fallback.eyebrow, 50),
    title: text(value?.title, fallback.title, 100),
    description: text(value?.description, fallback.description, 280),
    imageUrl: text(value?.imageUrl, fallback.imageUrl, 500),
    linkUrl: text(value?.linkUrl, fallback.linkUrl, 500),
    buttonLabel: text(value?.buttonLabel, fallback.buttonLabel, 40),
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
  const current = await readAds();
  const input = (await request.json()) as Partial<AdsConfig>;
  const next: AdsConfig = {
    landing: cleanPlacement(input.landing, current.landing),
    placeCard: cleanPlacement(input.placeCard, current.placeCard),
  };

  await fs.writeFile(adsFile, `${JSON.stringify(next, null, 2)}\n`, "utf8");
  return Response.json(next);
}
