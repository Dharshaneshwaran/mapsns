import "server-only";
import { access, mkdir, readFile, rename, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import { createHash, randomUUID } from "node:crypto";
import { DEFAULT_MAP_IMAGES } from "@/data/mapImages";
import { isStoredMapImage, validateMapDocument } from "@/lib/mapImageValidation";
import type { MapImageDocument } from "@/types/mapImage";

const directory = process.env.MAP_IMAGES_DATA_DIR || path.join(process.cwd(), ".map-data");
const file = path.join(directory, "images.json");
export const mapImageUploadDirectory = process.env.MAP_IMAGES_UPLOAD_DIR || path.join(process.cwd(), "public", "uploads", "map-images");

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
    const images = [];
    for (const image of document.images) {
      const upload = /^data:image\/(png|jpeg|webp);base64,(.+)$/.exec(image.src);
      if (upload) {
        const bytes = Buffer.from(upload[2], "base64");
        const filename = `${createHash("sha256").update(bytes).digest("hex")}.${upload[1]}`;
        await mkdir(mapImageUploadDirectory, { recursive: true });
        try {
          // Runtime uploads are stored separately from the deployment bundle.
          await writeFile(path.join(/* turbopackIgnore: true */ mapImageUploadDirectory, filename), bytes, { flag: "wx" });
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
        }
        images.push({ ...image, src: `/uploads/map-images/${filename}` });
      } else {
        if (isStoredMapImage(image.src)) await access(path.join(/* turbopackIgnore: true */ mapImageUploadDirectory, path.basename(image.src)));
        images.push(image);
      }
    }
    const saved = { revision: randomUUID(), images };
    await writeFile(temporary, JSON.stringify(saved, null, 2), { flag: "wx" });
    await rename(temporary, file);
    return saved;
  } finally {
    await unlink(temporary).catch(() => {});
    await unlink(lock);
  }
}
