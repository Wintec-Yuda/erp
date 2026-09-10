import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

// Routes that require at least MANAGER role.
const MANAGER_ONLY_PREFIXES = ["/hr/payroll", "/finance/accounts"];
// Routes that require ADMIN role.
const ADMIN_ONLY_PREFIXES = ["/settings/users"];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;
  const isAuthPage = pathname.startsWith("/login");

  if (!isLoggedIn && !isAuthPage) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isLoggedIn && isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin));
  }

  const role = req.auth?.user?.role;

  if (
    ADMIN_ONLY_PREFIXES.some((p) => pathname.startsWith(p)) &&
    role !== "ADMIN"
  ) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin));
  }

  if (
    MANAGER_ONLY_PREFIXES.some((p) => pathname.startsWith(p)) &&
    role !== "ADMIN" &&
    role !== "MANAGER"
  ) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
