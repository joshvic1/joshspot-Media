import { NextResponse } from "next/server";

export function middleware(request) {
  const host = request.headers.get("host");
  const { pathname } = request.nextUrl;

  // Only rewrite the homepage request
  if (host === "youtube.joshspotmedia.com" && pathname === "/") {
    return NextResponse.rewrite(new URL("/start", request.url));
  }

  const response = NextResponse.next();
  const privateRoute = /^\/(?:admin(?:-|\/)|crm(?:-|\/)|api(?:\/|$)|pay-invoice(?:\/|$)|invoice-generator(?:\/|$)|ads-calculator(?:\/|$)|pickadate(?:\/|$)|payment-success(?:\/|$))/.test(pathname);
  if (privateRoute || request.nextUrl.searchParams.has('preview')) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow, nosnippet');
    if (!pathname.startsWith('/api/blog/images/')) response.headers.set('Cache-Control', 'private, no-store');
  }
  if (['/tiktok-setup', '/start', '/growth-assessment'].includes(pathname)) response.headers.set('X-Robots-Tag', 'noindex, follow');
  return response;
}

export const config = {
  matcher: "/:path*",
};
