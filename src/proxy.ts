import type { NextFetchEvent, NextMiddleware, NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { clerkMiddleware } from "@clerk/nextjs/server";
import { isAuthConfigured, isDevAuthRequest } from "@/lib/auth";

const PUBLIC_PATHS = ["/sign-in", "/sign-up", "/api/health"];
const CLERK_INTERNAL_PREFIX = "/__clerk";

function isPublicPath(pathname: string): boolean {
  if (pathname.startsWith(CLERK_INTERNAL_PREFIX)) return true;
  return PUBLIC_PATHS.some(
    (publicPath) => pathname === publicPath || pathname.startsWith(`${publicPath}/`)
  );
}

let clerkProxy: NextMiddleware | null = null;
let loggedDevBypass = false;

function getClerkProxy() {
  // Created lazily so importing this file never requires Clerk to be configured.
  clerkProxy ??= clerkMiddleware(
    async (auth, request) => {
      const { pathname, search } = request.nextUrl;
      if (isPublicPath(pathname)) return;

      const { userId } = await auth();
      if (userId) return;

      // API clients get a machine-readable error instead of an HTML redirect.
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const signInUrl = new URL("/sign-in", request.url);
      signInUrl.searchParams.set("redirect_url", `${pathname}${search}`);
      return NextResponse.redirect(signInUrl);
    },
    { signInUrl: "/sign-in", signUpUrl: "/sign-up" }
  );
  return clerkProxy;
}

export default function proxy(request: NextRequest, event: NextFetchEvent) {
  if (!isAuthConfigured()) {
    return NextResponse.next();
  }
  if (isDevAuthRequest(request.headers.get("host"))) {
    if (!loggedDevBypass) {
      loggedDevBypass = true;
      console.info("[auth] development mode: bypassing sign-in for localhost requests");
    }
    return NextResponse.next();
  }
  return getClerkProxy()(request, event);
}

export const config = {
  matcher: [
    // Skip Next.js internals and static files, unless found in search params.
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes.
    "/(api|trpc)(.*)",
  ],
};
