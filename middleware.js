import { NextResponse } from "next/server";

export function middleware(request) {
  const host = request.headers.get("host");
  const { pathname } = request.nextUrl;

  // Only rewrite the homepage request
  if (host === "youtube.joshspotmedia.com" && pathname === "/") {
    return NextResponse.rewrite(new URL("/start", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/:path*",
};
