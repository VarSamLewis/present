"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

export default function SourcesPage() {
  const [sources, setSources] = useState<Array<{ id: string; name: string; mimeType: string; sizeBytes: number; createdAt: string }>>([]);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/sources");
    const data = await res.json();
    setSources(data.sources);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function upload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    await fetch("/api/sources", { method: "POST", body: formData });
    setFile(null);
    setUploading(false);
    load();
  }

  async function remove(id: string) {
    await fetch(`/api/sources/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <main className="max-w-4xl mx-auto p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Sources</h1>
        <Link href="/" className="text-blue-600 hover:underline">Back</Link>
      </div>

      <form onSubmit={upload} className="mb-8 p-4 bg-white rounded-lg shadow flex gap-4 items-end">
        <div className="flex-1">
          <label className="block text-sm font-medium mb-1">Upload file</label>
          <input
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="w-full border rounded px-3 py-2"
            accept=".pdf,.docx,.xlsx,.md,.txt"
          />
        </div>
        <button
          type="submit"
          disabled={!file || uploading}
          className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
        >
          {uploading ? "Uploading..." : "Upload"}
        </button>
      </form>

      <div className="space-y-3">
        {sources.map((source) => (
          <div key={source.id} className="p-4 bg-white rounded-lg shadow flex items-center justify-between">
            <Link href={`/sources/${source.id}`} className="flex-1 hover:underline">
              <div className="font-medium">{source.name}</div>
              <div className="text-sm text-slate-500">{source.mimeType} · {(source.sizeBytes / 1024).toFixed(1)} KB</div>
            </Link>
            <button
              onClick={() => remove(source.id)}
              className="text-red-600 hover:text-red-800 text-sm"
            >
              Remove
            </button>
          </div>
        ))}
        {sources.length === 0 && <p className="text-slate-500">No sources yet.</p>}
      </div>
    </main>
  );
}
