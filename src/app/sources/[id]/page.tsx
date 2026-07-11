"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function SourceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [source, setSource] = useState<{ id: string; name: string; mimeType: string } | null>(null);
  const [chunks, setChunks] = useState<Array<{ chunkIndex: number; kind: string; text: string; location?: string }>>([]);

  const load = useCallback(async () => {
    const res = await fetch(`/api/sources/${id}`);
    const data = await res.json();
    setSource(data.source);
    setChunks(data.chunks);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (!source) return <div className="p-8">Loading...</div>;

  return (
    <main className="max-w-4xl mx-auto p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">{source.name}</h1>
        <Link href="/sources" className="text-blue-600 hover:underline">Back</Link>
      </div>
      <div className="text-sm text-slate-500 mb-4">{source.mimeType}</div>

      <h2 className="text-xl font-semibold mb-3">Extracted chunks</h2>
      <div className="space-y-3">
        {chunks.map((chunk) => (
          <div key={chunk.chunkIndex} className="p-4 bg-white rounded-lg shadow">
            <div className="text-xs text-slate-400 mb-1">#{chunk.chunkIndex} · {chunk.kind} · {chunk.location}</div>
            <div className="whitespace-pre-wrap text-sm">{chunk.text}</div>
          </div>
        ))}
      </div>
    </main>
  );
}
