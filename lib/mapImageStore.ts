import "server-only";
import { mkdir, readFile, rename, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { DEFAULT_MAP_IMAGES } from "@/data/mapImages";
import { validateMapDocument } from "@/lib/mapImageValidation";
import type { MapImageDocument } from "@/types/mapImage";

const directory = process.env.MAP_IMAGES_DATA_DIR || path.join(process.cwd(), ".map-data");
const file = path.join(directory, "images.json");

export async function readMapImages(): Promise<MapImageDocument> {
  try {
    return validateMapDocument(JSON.parse(await readFile(file, "utf8")));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return { revision: "initial", images: DEFAULT_MAP_IMAGES };
    throw error;
  }
}

export class MapConflict extends Error {}

export async function saveMapImages(document: MapImageDocument): Promise<MapImageDocument> {
  await mkdir(directory, { recursive: true });
  const lock = path.join(directory, "publish.lock");
  try {
    await writeFile(lock, "publishing", { flag: "wx" });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "EEXIST") throw new MapConflict("Another publish is in progress. Try again shortly.");
    throw error;
  }
  const temporary = path.join(directory, `${randomUUID()}.tmp`);
  try {
    const current = await readMapImages();
    if (current.revision !== document.revision) throw new MapConflict("The public map changed in another tab. Reload published images before editing again.");
    const saved = { revision: randomUUID(), images: document.images };
    await writeFile(temporary, JSON.stringify(saved), { flag: "wx" });
    await rename(temporary, file);
    return saved;
  } finally {
    await unlink(temporary).catch(() => {});
    await unlink(lock);
  }
}
