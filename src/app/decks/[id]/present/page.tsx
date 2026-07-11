"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { SlideBundle } from "@/lib/schemas";
import { buildSlideDocument } from "@/lib/rendering/document";
import { getTheme } from "@/lib/generation/themes";

export default function PresentPage() {
  const { id } = useParams<{ id: string }>();
  const [bundles, setBundles] = useState<SlideBundle[]>([]);
  const [themeId, setThemeId] = useState<string>("clean");
  const [index, setIndex] = useState(0);
  const [tailwindCss, setTailwindCss] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/slide-tailwind.css")
      .then((res) => res.text())
      .then(setTailwindCss);
  }, []);

  const load = useCallback(async () => {
    const res = await fetch(`/api/decks/${id}`);
    const data = await res.json();
    setThemeId(data.deck.themeId);
    const list: SlideBundle[] = [];
    for (const slide of data.slides) {
      const version = data.slideVersions.find((v: { slideId: string }) => v.slideId === slide.id);
      if (!version) continue;
      list.push({
        id: slide.id,
        deckId: id,
        revision: version.revision,
        intent: { purpose: version.purpose, primaryMessage: version.primaryMessage },
        content: { html: version.html, css: version.css },
        data: JSON.parse(version.data),
        sources: JSON.parse(version.sources),
        summary: version.summary,
      });
    }
    setBundles(list);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight" || e.key === "Space") {
        setIndex((i) => Math.min(i + 1, bundles.length - 1));
      } else if (e.key === "ArrowLeft") {
        setIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Escape") {
        if (document.fullscreenElement) document.exitFullscreen();
      } else if (e.key === "f") {
        containerRef.current?.requestFullscreen();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [bundles.length]);

  const theme = getTheme(themeId);
  const bundle = bundles[index];
  const doc = bundle && theme ? buildSlideDocument(bundle, theme, tailwindCss) : "";

  return (
    <div ref={containerRef} className="h-screen w-screen bg-black flex flex-col">
      <div className="absolute top-4 left-4 z-10 flex gap-3">
        <Link href={`/decks/${id}`} className="px-3 py-1 bg-white/90 rounded text-sm hover:bg-white">
          Exit
        </Link>
        <button
          onClick={() => containerRef.current?.requestFullscreen()}
          className="px-3 py-1 bg-white/90 rounded text-sm hover:bg-white"
        >
          Fullscreen
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        {bundle ? (
          <iframe
            title="presentation-slide"
            srcDoc={doc}
            className="border-0"
            style={{ width: "min(100%, 1600px)", aspectRatio: "16/9", maxHeight: "100%" }}
          />
        ) : (
          <p className="text-white">No slides to present.</p>
        )}
      </div>

      <div className="bg-white/10 text-white text-center py-2 text-sm">
        {bundles.length > 0 ? `${index + 1} / ${bundles.length}` : "No slides"}
      </div>
    </div>
  );
}
