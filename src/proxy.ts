import { updateSession } from "@/lib/supabase/middleware";
import { NextRequest, NextResponse } from "next/server";

function isAdminPath(pathname: string): boolean {
  return pathname.startsWith("/admin");
}

function isPublicAdminPath(pathname: string): boolean {
  return pathname === "/admin/accept-invite" || pathname.startsWith("/admin/accept-invite/");
}

function isCustomerOrdersPath(pathname: string): boolean {
  return pathname === "/account/orders" || pathname.startsWith("/account/orders/");
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const search = request.nextUrl.search;

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-url-pathname", pathname);
  requestHeaders.set("x-url-search", search);

  const forwardedRequest = new NextRequest(request.url, {
    headers: requestHeaders,
  });

  const { response, user } = await updateSession(forwardedRequest);
  const pathAndQuery = pathname + search;

  if (isCustomerOrdersPath(pathname) && !user) {
    const loginUrl = new URL("/account/login", request.url);
    loginUrl.searchParams.set("next", pathAndQuery);
    return NextResponse.redirect(loginUrl);
  }

  if (isAdminPath(pathname) && !isPublicAdminPath(pathname) && !user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathAndQuery);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/webhook/).*)"],
};
