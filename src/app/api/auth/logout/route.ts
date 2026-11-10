import { NextRequest, NextResponse } from "next/server";
import { signOut } from "@workos-inc/authkit-nextjs";
import { isAuthConfigured } from "@/lib/auth";

export async function GET(request: NextRequest) {
  if (!isAuthConfigured()) {
    return NextResponse.redirect(new URL("/", request.url));
  }
  await signOut({ returnTo: new URL("/", request.url).toString() });
}
