"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

export default function DecksPage() {
  const [decks, setDecks] = useState<Array<{ id: string; title: string; objective: string; updatedAt: string }>>([]);

  const load = useCallback(async () => {
    const res = await fetch("/api/decks");
    const data = await res.json();
    setDecks(data.decks);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function remove(id: string) {
    await fetch(`/api/decks/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <main className="max-w-4xl mx-auto p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">My Decks</h1>
        <Link href="/" className="text-blue-600 hover:underline">Back</Link>
      </div>

      <div className="mb-6">
        <Link href="/decks/new" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          New Deck
        </Link>
      </div>

      <div className="space-y-3">
        {decks.map((deck) => (
          <div key={deck.id} className="p-4 bg-white rounded-lg shadow flex items-center justify-between">
            <Link href={`/decks/${deck.id}`} className="flex-1 hover:underline">
              <div className="font-medium text-lg">{deck.title}</div>
              <div className="text-sm text-slate-500">{deck.objective}</div>
            </Link>
            <button
              onClick={() => remove(deck.id)}
              className="text-red-600 hover:text-red-800 text-sm ml-4"
            >
              Delete
            </button>
          </div>
        ))}
        {decks.length === 0 && <p className="text-slate-500">No decks yet.</p>}
      </div>
    </main>
  );
}
