/**
 * Sign-in is opt-in: set both Clerk keys to require authentication. Without
 * them the app runs wide open, which keeps local development account-free.
 */
export function getPublishableKey(): string | undefined {
  return (
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ??
    process.env.CLERK_PUBLISHABLE_KEY ??
    undefined
  );
}

export function isAuthConfigured(): boolean {
  return Boolean(getPublishableKey() && process.env.CLERK_SECRET_KEY);
}

const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

/**
 * Development convenience: `next dev` skips the gate for localhost requests
 * even when Clerk keys are configured, so a shared .env.local does not force
 * a sign-in loop locally.
 *
 * Production builds never bypass — the NODE_ENV check means a spoofed Host
 * header cannot disable auth on a deployed instance.
 */
export function isDevAuthRequest(host: string | null | undefined): boolean {
  if (process.env.NODE_ENV === "production" || !host) return false;

  let hostname: string;
  try {
    hostname = new URL(`http://${host}`).hostname;
  } catch {
    return false;
  }
  return hostname === "localhost" || hostname.endsWith(".localhost") || LOCAL_HOSTNAMES.has(hostname.toLowerCase());
}
