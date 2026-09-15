import { readFile } from "node:fs/promises";
import path from "node:path";
import { mapImageUploadDirectory } from "@/lib/mapImageStore";
import { MAP_IMAGE_FILENAME } from "@/lib/mapImageValidation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Serve newly uploaded public files without requiring a Next.js rebuild.
export async function GET(_request: Request, context: { params: Promise<{ filename: string }> }) {
  const { filename } = await context.params;
  if (!MAP_IMAGE_FILENAME.test(filename)) return new Response("Not found", { status: 404 });
  try {
    const bytes = await readFile(path.join(mapImageUploadDirectory, filename));
    return new Response(bytes, { headers: { "Content-Type": `image/${path.extname(filename).slice(1)}`, "Cache-Control": "public, max-age=31536000, immutable", "X-Content-Type-Options": "nosniff" } });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return new Response("Not found", { status: 404 });
    return new Response("Unable to read image", { status: 500 });
  }
}
