"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewDeckPage() {
  const router = useRouter();
  const [sources, setSources] = useState<Array<{ id: string; name: string }>>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [objective, setObjective] = useState("");
  const [audience, setAudience] = useState("");
  const [styleDirection, setStyleDirection] = useState("clean and professional");
  const [loading, setLoading] = useState(false);

  const loadSources = useCallback(async () => {
    const res = await fetch("/api/sources");
    const data = await res.json();
    setSources(data.sources);
  }, []);

  useEffect(() => {
    loadSources();
  }, [loadSources]);

  async function create() {
    if (!objective.trim()) return;
    setLoading(true);
    const res = await fetch("/api/decks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        objective,
        audience,
        styleDirection,
        sourceIds: Array.from(selected),
        themeId: "clean",
      }),
    });
    const data = await res.json();
    setLoading(false);
    router.push(`/decks/${data.deck.id}`);
  }

  function toggle(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  }

  return (
    <main className="max-w-4xl mx-auto p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">New Deck</h1>
        <Link href="/decks" className="text-blue-600 hover:underline">Cancel</Link>
      </div>

      <div className="space-y-6 bg-white p-6 rounded-lg shadow">
        <div>
          <label className="block text-sm font-medium mb-1">Objective</label>
          <textarea
            value={objective}
            onChange={(e) => setObjective(e.target.value)}
            className="w-full border rounded px-3 py-2"
            rows={3}
            placeholder="What should this presentation achieve?"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Audience</label>
          <input
            type="text"
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
            className="w-full border rounded px-3 py-2"
            placeholder="e.g. executive team, engineers, customers"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Style direction</label>
          <input
            type="text"
            value={styleDirection}
            onChange={(e) => setStyleDirection(e.target.value)}
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Sources</label>
          <div className="space-y-2 max-h-48 overflow-y-auto border rounded p-3">
            {sources.map((source) => (
              <label key={source.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selected.has(source.id)}
                  onChange={() => toggle(source.id)}
                />
                <span>{source.name}</span>
              </label>
            ))}
            {sources.length === 0 && <p className="text-sm text-slate-500">No sources. Upload some first.</p>}
          </div>
        </div>

        <button
          onClick={create}
          disabled={!objective.trim() || loading}
          className="w-full py-2 bg-blue-600 text-white rounded font-medium disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create Deck"}
        </button>
      </div>
    </main>
  );
}
