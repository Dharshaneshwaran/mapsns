import { campusWalkingRoute } from "@/lib/campusRouting";
import { BodyTooLarge, readLimitedBody } from "@/lib/requestBody";
import type { Coordinate } from "@/types/campus";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "no-store" };

function isCoordinate(value: unknown): value is Coordinate {
  if (!value || typeof value !== "object") return false;
  const { lat, lng } = value as Record<string, unknown>;
  return typeof lat === "number" && Number.isFinite(lat) && Math.abs(lat) <= 90
    && typeof lng === "number" && Number.isFinite(lng) && Math.abs(lng) <= 180;
}

export async function POST(request: Request) {
  if (request.headers.get("sec-fetch-site") === "cross-site") return new Response(null, { status: 403, headers });
  let input: unknown;
  try {
    input = JSON.parse((await readLimitedBody(request, 2048)).toString("utf8"));
  } catch (error) {
    return Response.json({ error: error instanceof BodyTooLarge ? "Route request is too large." : "Invalid route request." }, { status: 400, headers });
  }
  const body = input as { start?: unknown; end?: unknown };
  if (!isCoordinate(body?.start) || !isCoordinate(body?.end)) {
    return Response.json({ error: "Start and end must be valid coordinates." }, { status: 400, headers });
  }
  const route = campusWalkingRoute(body.start, body.end);
  if (!route) return Response.json({ error: "No mapped campus path connects these points." }, { status: 404, headers });
  return Response.json(route, { headers });
}
