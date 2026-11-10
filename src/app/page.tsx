import Link from "next/link";
import { isConfigured } from "@/lib/settings";
import { isAuthConfigured } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const configured = isConfigured();
  const authConfigured = isAuthConfigured();

  return (
    <main className="max-w-4xl mx-auto p-8">
      <div className="flex items-start justify-between">
        <h1 className="text-4xl font-bold mb-4">Vibeslide</h1>
        {authConfigured && (
          <a href="/api/auth/logout" className="text-sm text-slate-500 hover:text-slate-700 hover:underline mt-2">
            Sign out
          </a>
        )}
      </div>
      <p className="text-lg text-slate-600 mb-8">
        Turn documents into self-contained, locally generated presentations.
      </p>

      {!configured && (
        <div className="mb-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center justify-between">
          <span className="text-sm text-yellow-800">
            No API key configured yet. Add your OpenAI-compatible key to start generating decks.
          </span>
          <Link
            href="/settings"
            className="ml-4 px-4 py-2 bg-yellow-600 text-white rounded text-sm font-medium hover:bg-yellow-700 whitespace-nowrap"
          >
            Set up API key
          </Link>
        </div>
      )}

      <div className="flex gap-4">
        <Link
          href="/sources"
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
        >
          Manage Sources
        </Link>
        <Link
          href="/decks/new"
          className="px-6 py-3 bg-slate-800 text-white rounded-lg font-medium hover:bg-slate-900 transition"
        >
          New Deck
        </Link>
        <Link
          href="/decks"
          className="px-6 py-3 border border-slate-300 rounded-lg font-medium hover:bg-slate-100 transition"
        >
          My Decks
        </Link>
        <Link
          href="/settings"
          className="px-6 py-3 border border-slate-300 rounded-lg font-medium hover:bg-slate-100 transition"
        >
          Settings
        </Link>
      </div>
    </main>
  );
}
