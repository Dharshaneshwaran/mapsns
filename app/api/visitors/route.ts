import { adminAccess } from "@/lib/adminAuth";
import { approximateArea, VisitorPresence } from "@/lib/visitorPresence";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const state = globalThis as typeof globalThis & { campusPresence?: VisitorPresence; campusPresenceCleanup?: ReturnType<typeof setInterval> };
const presence = state.campusPresence ??= new VisitorPresence();
state.campusPresenceCleanup ??= setInterval(() => presence.prune(), 30_000);
state.campusPresenceCleanup.unref();
const headers = { "Cache-Control": "no-store" };

export function GET(request: Request) {
  const denied = adminAccess(request);
  if (denied) return denied;
  return Response.json(presence.summary(), { headers });
}

export async function POST(request: Request) {
  if (request.headers.get("sec-fetch-site") === "cross-site") return new Response(null, { status: 403, headers });
  const id = request.headers.get("x-visitor-id") || "";
  if (!/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(id)) return new Response(null, { status: 400, headers });
  if (!request.headers.get("content-type")?.startsWith("application/json")) return new Response(null, { status: 415, headers });
  const reader = request.body?.getReader();
  if (!reader) return new Response(null, { status: 400, headers });
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > 1024) {
        await reader.cancel();
        return new Response(null, { status: 413, headers });
      }
      chunks.push(value);
    }
    const input = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    presence.heartbeat(id, approximateArea(input.location));
    return new Response(null, { status: 204, headers });
  } catch {
    return new Response(null, { status: 400, headers });
  }
}
