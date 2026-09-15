import { cp, mkdir } from "node:fs/promises";
import path from "node:path";
const destination = path.resolve("backups", new Date().toISOString().replace(/[:.]/g, "-"));
await mkdir(destination, { recursive: true });
for (const [source, name] of [[process.env.MAP_IMAGES_DATA_DIR || ".map-data", "map-data"], [process.env.MAP_IMAGES_UPLOAD_DIR || "public/uploads/map-images", "map-images"], ["data/ads.json", "ads.json"]]) {
  try { await cp(source, path.join(destination, name), { recursive: true, errorOnExist: true, force: false }); }
  catch (error) { if (error.code !== "ENOENT") throw error; }
}
console.log(`Backup created: ${destination}`);
