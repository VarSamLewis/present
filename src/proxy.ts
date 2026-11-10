import { NextRequest, NextResponse } from "next/server";
import { authkit, handleAuthkitHeaders } from "@workos-inc/authkit-nextjs";
import { isAuthConfigured } from "@/lib/auth";

export default async function proxy(request: NextRequest) {
  if (!isAuthConfigured()) {
    return NextResponse.next();
  }

  const redirectUri =
    process.env.WORKOS_REDIRECT_URI || `${request.nextUrl.origin}/api/auth/callback`;

  const { session, headers, authorizationUrl } = await authkit(request, { redirectUri });

  if (!session.user && authorizationUrl) {
    return handleAuthkitHeaders(request, headers, { redirect: authorizationUrl });
  }

  return handleAuthkitHeaders(request, headers);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|slide-tailwind.css|api/auth/callback).*)",
  ],
};
