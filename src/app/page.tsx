import Link from "next/link";

export default function HomePage() {
  return (
    <main className="max-w-4xl mx-auto p-8">
      <h1 className="text-4xl font-bold mb-4">Vibeslide</h1>
      <p className="text-lg text-slate-600 mb-8">
        Turn documents into self-contained, locally generated presentations.
      </p>
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
      </div>
    </main>
  );
}
