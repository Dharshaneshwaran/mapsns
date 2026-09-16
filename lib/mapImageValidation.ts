import type { MapImage, MapImageDocument } from "../types/mapImage";

export const MAX_MAP_DOCUMENT_BYTES = 20 * 1024 * 1024;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const builtInSources = new Set(["/vatta_mandalam.png", "/admin_building.png", "/heritage_building.png", "/ihub.png"]);
export const MAP_IMAGE_FILENAME = /^[a-f0-9]{64}\.(png|jpeg|webp)$/;

export function isStoredMapImage(src: string): boolean {
  return src.startsWith("/uploads/map-images/") && MAP_IMAGE_FILENAME.test(src.slice("/uploads/map-images/".length));
}

export function validateMapDocument(input: unknown): MapImageDocument {
  if (!input || typeof input !== "object") throw new Error("Invalid map document.");
  const doc = input as Record<string, unknown>;
  if (typeof doc.revision !== "string" || doc.revision.length > 100 || !Array.isArray(doc.images) || doc.images.length > 100) throw new Error("Invalid map document (maximum 100 images).");
  const ids = new Set<string>();
  const images: MapImage[] = doc.images.map((value: unknown) => {
    if (!value || typeof value !== "object") throw new Error("Invalid image.");
    const image = value as MapImage;
    if (typeof image.id !== "string" || !/^[a-zA-Z0-9-]{1,80}$/.test(image.id) || ids.has(image.id)) throw new Error("Invalid or duplicate image ID.");
    ids.add(image.id);
    if (typeof image.name !== "string" || !image.name.trim() || image.name.length > 120) throw new Error("Each image needs a name (maximum 120 characters).");
    if (typeof image.src !== "string") throw new Error("Missing image data.");
    if (image.src !== "lucide:map-pin" && !builtInSources.has(image.src) && !isStoredMapImage(image.src)) {
      const match = /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(image.src);
      if (!match || match[2].length > Math.ceil(MAX_IMAGE_BYTES / 3) * 4) throw new Error("Use a PNG, JPEG or WebP image up to 5 MB.");
      const bytes = Buffer.from(match[2], "base64");
      const valid = match[1] === "png" ? bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
        : match[1] === "jpeg" ? bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
        : bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP";
      if (!valid || bytes.length > MAX_IMAGE_BYTES) throw new Error("The uploaded file is not a supported image.");
    }
    const range = (n: number, min: number, max: number) => typeof n === "number" && Number.isFinite(n) && n >= min && n <= max;
    if (!range(image.lat, -80, 80) || !range(image.lng, -180, 180) || !range(image.width, 0.00001, 0.02) || !range(image.height, 0.00001, 0.02) || !range(image.rotation, -360, 360) || !range(image.opacity, 0.05, 1)) throw new Error("Invalid image position, size, rotation or opacity.");
    if (image.locationId !== undefined && (typeof image.locationId !== "string" || !/^[a-zA-Z0-9-]{1,80}$/.test(image.locationId))) throw new Error("Invalid linked location.");
    return { id: image.id, name: image.name.trim(), src: image.src, lat: image.lat, lng: image.lng, width: image.width, height: image.height, rotation: image.rotation, opacity: image.opacity, ...(image.locationId ? { locationId: image.locationId } : {}) };
  });
  return { revision: doc.revision, images };
}
