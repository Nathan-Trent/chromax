import { updateSession } from "@/lib/supabase/middleware";
import { type NextRequest, NextResponse } from "next/server";

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
  const { response, user } = await updateSession(request);
  const pathname = request.nextUrl.pathname;

  if (isCustomerOrdersPath(pathname) && !user) {
    const loginUrl = new URL("/account/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAdminPath(pathname) && !isPublicAdminPath(pathname) && !user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/webhook/).*)"],
};
