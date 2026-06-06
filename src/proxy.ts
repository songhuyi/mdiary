import { NextResponse, type NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionToken = request.cookies.get("authjs.session-token")?.value
    || request.cookies.get("__Secure-authjs.session-token")?.value;

  const isAuthPage = pathname === "/login" || pathname === "/register";
  const isHomePage = pathname === "/";
  const isApiOrStatic = pathname.startsWith("/api") || pathname.startsWith("/_next");

  if (isApiOrStatic) {
    return NextResponse.next();
  }

  if (isAuthPage && sessionToken) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (!sessionToken && !isAuthPage && !isHomePage) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
