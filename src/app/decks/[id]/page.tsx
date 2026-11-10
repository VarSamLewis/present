"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { DeckManifest } from "@/lib/schemas";
import { buildSlideDocument } from "@/lib/rendering/document";
import { getTheme } from "@/lib/generation/themes";

type SlideVersion = {
  id: string;
  slideId: string;
  revision: number;
  purpose: string;
  primaryMessage: string;
  summary: string;
  html: string;
  css: string;
  data: string;
  sources: string;
  createdAt: string;
};

type SlideRecord = {
  id: string;
  deckId: string;
  orderIndex: number;
  currentVersionId: string | null;
};

type DeckRecord = {
  id: string;
  title: string;
  audience: string;
  objective: string;
  styleDirection: string;
  themeId: string;
};

export default function DeckEditorPage() {
  const { id } = useParams<{ id: string }>();
  const [deck, setDeck] = useState<DeckRecord | null>(null);
  const [slides, setSlides] = useState<SlideRecord[]>([]);
  const [versions, setVersions] = useState<SlideVersion[]>([]);
  const [selectedSlideId, setSelectedSlideId] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [regenerating, setRegenerating] = useState(false);
  const [manifest, setManifest] = useState<DeckManifest | null>(null);
  const [tailwindCss, setTailwindCss] = useState("");

  useEffect(() => {
    fetch("/slide-tailwind.css")
      .then((res) => res.text())
      .then(setTailwindCss);
  }, []);

  const load = useCallback(async () => {
    const res = await fetch(`/api/decks/${id}`);
    const data = await res.json();
    setDeck(data.deck);
    setSlides(data.slides);
    setVersions(data.slideVersions);
    if (data.manifest) {
      setManifest(data.manifest);
    }
    if (data.slides.length > 0 && !selectedSlideId) {
      setSelectedSlideId(data.slides[0].id);
    }
  }, [id, selectedSlideId]);

  useEffect(() => {
    load();
  }, [load]);

  async function generateDeck() {
    setGenerating(true);
    const res = await fetch(`/api/decks/${id}/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sourceIds: [] }),
    });
    const data = await res.json();
    setManifest(data.manifest);
    setGenerating(false);
    load();
  }

  async function regenerateSlide(instruction?: string) {
    if (!selectedSlideId || !manifest) return;
    setRegenerating(true);
    await fetch(`/api/slides/${selectedSlideId}/regenerate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ manifest, sourceIds: [], instruction }),
    });
    setRegenerating(false);
    setChatInput("");
    load();
  }

  async function saveDirectEdit(html: string, css: string) {
    if (!selectedSlideId) return;
    await fetch(`/api/slides/${selectedSlideId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ version: { html, css } }),
    });
    load();
  }

  async function reorderSlide(slideId: string, direction: number) {
    const idx = slides.findIndex((s) => s.id === slideId);
    const target = slides[idx + direction];
    if (!target) return;
    await fetch(`/api/slides/${slideId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderIndex: target.orderIndex }),
    });
    await fetch(`/api/slides/${target.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderIndex: slides[idx].orderIndex }),
    });
    load();
  }

  const selectedVersion = versions.find((v) => v.slideId === selectedSlideId);
  const selectedSlide = slides.find((s) => s.id === selectedSlideId);
  const theme = deck ? getTheme(deck.themeId) : undefined;

  const previewDoc = selectedVersion && theme
    ? buildSlideDocument(
        {
          id: selectedSlideId!,
          deckId: id,
          revision: selectedVersion.revision,
          intent: { purpose: selectedVersion.purpose, primaryMessage: selectedVersion.primaryMessage },
          content: { html: selectedVersion.html, css: selectedVersion.css },
          data: JSON.parse(selectedVersion.data),
          sources: JSON.parse(selectedVersion.sources),
          summary: selectedVersion.summary,
        },
        theme,
        tailwindCss
      )
    : "";

  return (
    <main className="h-screen flex flex-col bg-slate-100">
      <header className="bg-white border-b px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/decks" className="text-blue-600 hover:underline">← Decks</Link>
          <h1 className="text-xl font-bold">{deck?.title}</h1>
        </div>
        <div className="flex gap-3">
          <button
            onClick={generateDeck}
            disabled={generating}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {generating ? "Generating..." : "Generate Deck"}
          </button>
          <Link href={`/decks/${id}/present`} className="px-4 py-2 bg-slate-800 text-white rounded hover:bg-slate-900">
            Present
          </Link>
          <a
            href={`/api/export/${id}/pdf`}
            className="px-4 py-2 border border-slate-300 rounded hover:bg-slate-100"
          >
            Export PDF
          </a>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <aside className="w-64 bg-white border-r overflow-y-auto p-4">
          <h2 className="text-sm font-semibold text-slate-500 uppercase mb-3">Slides</h2>
          <div className="space-y-2">
            {slides.map((slide, idx) => {
              const version = versions.find((v) => v.slideId === slide.id);
              return (
                <button
                  key={slide.id}
                  onClick={() => setSelectedSlideId(slide.id)}
                  className={`w-full text-left p-3 rounded border ${selectedSlideId === slide.id ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:bg-slate-50"}`}
                >
                  <div className="text-xs text-slate-400">Slide {idx + 1}</div>
                  <div className="text-sm font-medium truncate">{version?.purpose || "Untitled"}</div>
                </button>
              );
            })}
          </div>
        </aside>

        <section className="flex-1 flex flex-col min-w-0">
          {selectedVersion ? (
            <>
              <div className="flex-1 p-6 overflow-auto flex justify-center bg-slate-200">
                <iframe
                  title="slide-preview"
                  srcDoc={previewDoc}
                  className="border shadow-lg bg-white"
                  style={{ width: 960, height: 540 }}
                />
              </div>

              <div className="h-64 bg-white border-t flex">
                <div className="flex-1 p-4 overflow-y-auto border-r">
                  <h3 className="text-sm font-semibold mb-2">Direct edit</h3>
                  <textarea
                    className="w-full h-24 text-xs font-mono border rounded p-2 mb-2"
                    defaultValue={selectedVersion.html}
                    onBlur={(e) => saveDirectEdit(e.target.value, selectedVersion.css)}
                  />
                  <textarea
                    className="w-full h-16 text-xs font-mono border rounded p-2"
                    defaultValue={selectedVersion.css}
                    onBlur={(e) => saveDirectEdit(selectedVersion.html, e.target.value)}
                  />
                </div>

                <div className="flex-1 p-4 overflow-y-auto">
                  <h3 className="text-sm font-semibold mb-2">Revision chat</h3>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="e.g. make the title bigger"
                      className="flex-1 border rounded px-2 py-1 text-sm"
                      onKeyDown={(e) => e.key === "Enter" && regenerateSlide(chatInput)}
                    />
                    <button
                      onClick={() => regenerateSlide(chatInput)}
                      disabled={regenerating}
                      className="px-3 py-1 bg-blue-600 text-white rounded text-sm disabled:opacity-50"
                    >
                      {regenerating ? "..." : "Go"}
                    </button>
                  </div>

                  <div className="mt-4 flex gap-2 flex-wrap">
                    <button
                      onClick={() => reorderSlide(selectedSlideId!, -1)}
                      disabled={!selectedSlide || selectedSlide.orderIndex === 1}
                      className="text-xs px-2 py-1 border rounded"
                    >
                      Move up
                    </button>
                    <button
                      onClick={() => reorderSlide(selectedSlideId!, 1)}
                      disabled={!selectedSlide || selectedSlide.orderIndex === slides.length}
                      className="text-xs px-2 py-1 border rounded"
                    >
                      Move down
                    </button>
                    <button onClick={() => regenerateSlide()} className="text-xs px-2 py-1 border rounded">
                      Regenerate
                    </button>
                  </div>

                  {selectedVersion.sources && (
                    <div className="mt-4">
                      <h4 className="text-xs font-semibold text-slate-500 mb-1">Citations</h4>
                      <ul className="text-xs text-slate-600 list-disc list-inside">
                        {JSON.parse(selectedVersion.sources).map((s: { label: string }, i: number) => (
                          <li key={i}>{s.label}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-500">
              {generating ? "Generating your deck..." : "Select a slide or generate the deck."}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
