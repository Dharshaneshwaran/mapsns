import { adminWriteAccess } from "@/lib/adminAuth";
import { MapConflict, readMapImages, saveMapImages } from "@/lib/mapImageStore";
import { MAX_MAP_DOCUMENT_BYTES, validateMapDocument } from "@/lib/mapImageValidation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const document = await readMapImages();
    const headers = { "Cache-Control": "no-cache", ETag: `"${document.revision}"` };
    if (request.headers.get("if-none-match") === headers.ETag) return new Response(null, { status: 304, headers });
    return Response.json(document, { headers });
  } catch (error) {
    console.error("Read map images:", error);
    return Response.json({ error: "Unable to load published map images." }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const denied = adminWriteAccess(request);
  if (denied) return denied;
  if (!request.headers.get("content-type")?.includes("application/json")) return Response.json({ error: "Expected JSON." }, { status: 415 });
  const reader = request.body?.getReader();
  if (!reader) return Response.json({ error: "Missing map data." }, { status: 400 });
  let document;
  try {
    let size = 0;
    const chunks: Uint8Array[] = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_MAP_DOCUMENT_BYTES) {
        await reader.cancel();
        return Response.json({ error: "Map images exceed the 20 MB total limit. Use smaller images." }, { status: 413 });
      }
      chunks.push(value);
    }
    document = validateMapDocument(JSON.parse(Buffer.concat(chunks).toString("utf8")));
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Invalid map data." }, { status: 400 });
  }
  try {
    return Response.json(await saveMapImages(document), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof MapConflict) return Response.json({ error: error.message }, { status: 409 });
    console.error("Publish map images:", error);
    return Response.json({ error: "Publishing failed. Check that server map storage is writable." }, { status: 500 });
  }
}
