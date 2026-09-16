import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getRole, ROLE_COOKIE, roleCanAccessPath } from "@/lib/roles";

// Demo build: there is no sign-in. The role cookie is the only gate.
//   no role      -> /login (role chooser)
//   role set     -> enforce that role's allowed routes
export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Legacy auth routes now land on the role chooser.
  if (pathname.startsWith("/sign-in") || pathname.startsWith("/sign-up")) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (pathname === "/login") return NextResponse.next();

  const role = getRole(req.cookies.get(ROLE_COOKIE)?.value);

  if (!role) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (!roleCanAccessPath(role.id, pathname)) {
    const url = req.nextUrl.clone();
    url.pathname = role.landingRoute;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
