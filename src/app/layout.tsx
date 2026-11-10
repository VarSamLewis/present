import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { getPublishableKey, isAuthConfigured } from "@/lib/auth";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vibeslide",
  description: "Local-first presentation generator",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased bg-slate-50 text-slate-900 min-h-screen">
        {isAuthConfigured() ? (
          <ClerkProvider
            publishableKey={getPublishableKey()}
            signInUrl="/sign-in"
            signUpUrl="/sign-up"
          >
            {children}
          </ClerkProvider>
        ) : (
          children
        )}
      </body>
    </html>
  );
}
