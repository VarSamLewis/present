import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isConfigured } from "@/lib/settings";

export const dynamic = "force-dynamic";

/**
 * Liveness/readiness probe used by container platforms (Railway, Docker
 * healthchecks). Touching the database also runs migrations on a fresh volume.
 */
export async function GET() {
  try {
    db.prepare("SELECT 1").get();
    return NextResponse.json({ ok: true, configured: isConfigured() });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Database unavailable";
    return NextResponse.json({ ok: false, error: message }, { status: 503 });
  }
}
