import { proxy } from "@/proxy";
import { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-url-pathname", request.nextUrl.pathname);
  requestHeaders.set("x-url-search", request.nextUrl.search);

  const forwardedRequest = new NextRequest(request.url, {
    headers: requestHeaders,
  });

  return proxy(forwardedRequest);
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
