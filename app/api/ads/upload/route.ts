import { adminWriteAccess } from "@/lib/adminAuth";
import { promises as fs } from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { BodyTooLarge, readLimitedBody, isImageSignature } from "@/lib/requestBody";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const uploadDir = path.join(process.cwd(), "public", "uploads", "ads");
const ALLOWED_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpeg",
  "image/webp": "webp",
};
const MAX_BYTES = 5 * 1024 * 1024;

export async function POST(request: Request) {
  const denied = adminWriteAccess(request);
  if (denied) return denied;

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("multipart/form-data")) {
    return Response.json({ error: "Expected multipart form data." }, { status: 415 });
  }

  let formData: FormData;
  try {
    const body = await readLimitedBody(request, MAX_BYTES + 64 * 1024);
    formData = await new Response(new Uint8Array(body), { headers: { "Content-Type": contentType } }).formData();
  } catch (error) {
    return Response.json({ error: "Invalid or oversized upload." }, { status: error instanceof BodyTooLarge ? 413 : 400 });
  }

  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    return Response.json({ error: "No file uploaded." }, { status: 400 });
  }

  if (!ALLOWED_TYPES[file.type]) {
    return Response.json({ error: "Upload a PNG, JPEG, or WebP image." }, { status: 400 });
  }

  if (file.size > MAX_BYTES) {
    return Response.json({ error: "Image must be under 5 MB." }, { status: 413 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  if (!isImageSignature(bytes, file.type)) return Response.json({ error: "The file is not a supported image." }, { status: 400 });
  const ext = ALLOWED_TYPES[file.type];
  const filename = `${createHash("sha256").update(bytes).update(`${Date.now()}`).digest("hex")}.${ext}`;

  await fs.mkdir(uploadDir, { recursive: true });
  await fs.writeFile(path.join(uploadDir, filename), bytes);

  const url = `/uploads/ads/${filename}`;
  return Response.json({ url });
}
