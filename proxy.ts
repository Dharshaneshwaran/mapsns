import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { adminAccess } from "@/lib/adminAuth";

export function proxy(request: NextRequest) {
  const hostname = request.headers.get("host")?.split(":")[0].toLowerCase();
  if (request.nextUrl.pathname.startsWith("/admin") || (hostname === "admin.localhost" && request.nextUrl.pathname === "/")) {
    const denied = adminAccess(request);
    if (denied) return denied;
  }

  if (hostname === "admin.localhost" && request.nextUrl.pathname === "/") {
    return NextResponse.rewrite(new URL("/admin", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/admin/:path*"],
};
