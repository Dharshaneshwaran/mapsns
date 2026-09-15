import { timingSafeEqual } from "node:crypto";
export function adminAccess(request: Request): Response | null {
  const host = new URL(request.url).hostname;
  const secret = process.env.ADMIN_MAP_TOKEN;
  if (!secret) {
    if (process.env.NODE_ENV === "development" && ["localhost", "admin.localhost", "127.0.0.1", "[::1]"].includes(host)) return null;
    return new Response("Configure ADMIN_MAP_TOKEN before opening the admin portal.", { status: 503 });
  }
  const auth = request.headers.get("authorization") || "";
  const expected = auth.startsWith("Basic ") ? `Basic ${Buffer.from(`${process.env.ADMIN_USERNAME || "admin"}:${secret}`).toString("base64")}` : `Bearer ${secret}`;
  const actualBytes = Buffer.from(auth), expectedBytes = Buffer.from(expected);
  if (actualBytes.length === expectedBytes.length && timingSafeEqual(actualBytes, expectedBytes)) return null;
  return Response.json({ error: "Admin sign-in required." }, { status: 401, headers: { "WWW-Authenticate": 'Basic realm="SNS Admin", charset="UTF-8"', "Cache-Control": "no-store" } });
}
export function adminWriteAccess(request: Request): Response | null {
  const origin = request.headers.get("origin");
  if (origin && new URL(origin).host !== request.headers.get("host")) return Response.json({ error: "Publish from this site." }, { status: 403 });
  return adminAccess(request);
}
