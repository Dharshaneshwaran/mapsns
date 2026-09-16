import { readFile } from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const adUploadDir = path.join(process.cwd(), "public", "uploads", "ads");
const SAFE_FILENAME = /^[a-f0-9]{64}\.(png|jpeg|webp)$/;

export async function GET(_request: Request, context: { params: Promise<{ filename: string }> }) {
  const { filename } = await context.params;
  if (!SAFE_FILENAME.test(filename)) return new Response("Not found", { status: 404 });
  try {
    const bytes = await readFile(path.join(adUploadDir, filename));
    const ext = path.extname(filename).slice(1);
    return new Response(bytes, {
      headers: {
        "Content-Type": `image/${ext}`,
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return new Response("Not found", { status: 404 });
    return new Response("Unable to read image", { status: 500 });
  }
}
