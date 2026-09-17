import { timingSafeEqual } from "node:crypto";
export function adminAccess(request: Request): Response | null {
  const secret = process.env.ADMIN_MAP_TOKEN;
  if (!secret) {
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
  const forbidden = () => Response.json({ error: "Publish from this site." }, { status: 403 });
  if (request.headers.get("sec-fetch-site") === "cross-site") return forbidden();
  if (origin) {
    try {
      const source = new URL(origin);
      const target = new URL(request.url);
      // Next can use its internal server hostname for request.url (e.g. localhost)
      // while the browser is visiting admin.localhost. Compare the actual HTTP authority.
      const host = request.headers.get("host");
      if (host) target.host = host;
      if (source.origin !== target.origin || source.username || source.password) return forbidden();
    } catch { return forbidden(); }
  } else if (request.headers.get("authorization")?.startsWith("Basic ")) {
    // Browser Basic credentials are ambient; scripts without Origin must use a bearer token.
    return forbidden();
  }
  return adminAccess(request);
}
