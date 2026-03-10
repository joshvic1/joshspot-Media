import { NextResponse } from "next/server";

export function middleware(request) {
  const host = request.headers.get("host");

  if (host === "youtube.joshspotmedia.com") {
    return NextResponse.rewrite(new URL("/start", request.url));
  }

  return NextResponse.next();
}
