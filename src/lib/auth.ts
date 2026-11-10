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
