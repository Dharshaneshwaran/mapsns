import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const hostname = request.headers.get("host")?.split(":")[0].toLowerCase();

  if (hostname === "admin.localhost" && request.nextUrl.pathname === "/") {
    return NextResponse.rewrite(new URL("/admin", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/"],
};
