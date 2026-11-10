import crypto from "crypto";
import { db } from "@/lib/db";
import { SourceChunk } from "@/lib/schemas";

export type SourceRecord = {
  id: string;
  name: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
};

export type DeckRecord = {
  id: string;
  title: string;
  audience: string;
  objective: string;
  styleDirection: string;
  themeId: string;
  manifestJson: string | null;
  sourceIdsJson: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SlideRecord = {
  id: string;
  deckId: string;
  orderIndex: number;
  currentVersionId: string | null;
};

export type SlideVersionRecord = {
  id: string;
  slideId: string;
  deckId: string;
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

// Sources

export function createSource(record: Omit<SourceRecord, "id" | "createdAt">): SourceRecord {
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  db.prepare(
    `INSERT INTO sources (id, name, filename, mimeType, sizeBytes, createdAt) VALUES (?, ?, ?, ?, ?, ?)`
  ).run(id, record.name, record.filename, record.mimeType, record.sizeBytes, createdAt);
  return { id, ...record, createdAt };
}

export function listSources(): SourceRecord[] {
  return db.prepare("SELECT * FROM sources ORDER BY createdAt DESC").all() as SourceRecord[];
}

export function getSource(id: string): SourceRecord | undefined {
  return db.prepare("SELECT * FROM sources WHERE id = ?").get(id) as SourceRecord | undefined;
}

export function deleteSource(id: string): void {
  db.prepare("DELETE FROM sources WHERE id = ?").run(id);
}

// Source chunks

export function insertChunks(chunks: SourceChunk[]): void {
  const stmt = db.prepare(
    `INSERT INTO source_chunks (id, sourceId, chunkIndex, kind, text, location) VALUES (?, ?, ?, ?, ?, ?)`
  );
  const transaction = db.transaction((items: SourceChunk[]) => {
    for (const chunk of items) {
      stmt.run(chunk.id, chunk.sourceId, chunk.chunkIndex, chunk.kind, chunk.text, chunk.location ?? null);
    }
  });
  transaction(chunks);
}

export function getChunksBySource(sourceId: string): SourceChunk[] {
  return db
    .prepare("SELECT id, sourceId, chunkIndex, kind, text, location FROM source_chunks WHERE sourceId = ? ORDER BY chunkIndex")
    .all(sourceId) as SourceChunk[];
}

// Decks

export function createDeck(
  record: Omit<DeckRecord, "id" | "createdAt" | "updatedAt" | "sourceIdsJson"> & {
    sourceIdsJson?: string | null;
    sourceIds?: string[];
  }
): DeckRecord {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const sourceIdsJson = record.sourceIds ? JSON.stringify(record.sourceIds) : record.sourceIdsJson;
  db.prepare(
    `INSERT INTO decks (id, title, audience, objective, styleDirection, themeId, manifestJson, sourceIdsJson, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(id, record.title, record.audience, record.objective, record.styleDirection, record.themeId, record.manifestJson ?? null, sourceIdsJson ?? null, now, now);
  return { id, ...record, sourceIdsJson: sourceIdsJson ?? null, createdAt: now, updatedAt: now };
}

export function getDeckSourceIds(id: string): string[] {
  const deck = getDeck(id);
  if (!deck?.sourceIdsJson) return [];
  try {
    const parsed = JSON.parse(deck.sourceIdsJson);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function updateDeckManifest(id: string, manifestJson: string): void {
  db.prepare("UPDATE decks SET manifestJson = ?, updatedAt = ? WHERE id = ?").run(manifestJson, new Date().toISOString(), id);
}

export function listDecks(): DeckRecord[] {
  return db.prepare("SELECT * FROM decks ORDER BY updatedAt DESC").all() as DeckRecord[];
}

export function getDeck(id: string): DeckRecord | undefined {
  return db.prepare("SELECT * FROM decks WHERE id = ?").get(id) as DeckRecord | undefined;
}

export function updateDeckTimestamp(id: string): void {
  db.prepare("UPDATE decks SET updatedAt = ? WHERE id = ?").run(new Date().toISOString(), id);
}

export function deleteDeck(id: string): void {
  db.prepare("DELETE FROM decks WHERE id = ?").run(id);
}

// Slides

export function createSlide(record: Omit<SlideRecord, "id">): SlideRecord {
  const id = crypto.randomUUID();
  db.prepare(`INSERT INTO slides (id, deckId, orderIndex, currentVersionId) VALUES (?, ?, ?, ?)`).run(
    id,
    record.deckId,
    record.orderIndex,
    record.currentVersionId ?? null
  );
  return { id, ...record };
}

export function listSlides(deckId: string): SlideRecord[] {
  return db.prepare("SELECT * FROM slides WHERE deckId = ? ORDER BY orderIndex").all(deckId) as SlideRecord[];
}

export function getSlide(id: string): SlideRecord | undefined {
  return db.prepare("SELECT * FROM slides WHERE id = ?").get(id) as SlideRecord | undefined;
}

export function updateSlideOrder(id: string, orderIndex: number): void {
  db.prepare("UPDATE slides SET orderIndex = ? WHERE id = ?").run(orderIndex, id);
}

export function updateSlideCurrentVersion(slideId: string, versionId: string): void {
  db.prepare("UPDATE slides SET currentVersionId = ? WHERE id = ?").run(versionId, slideId);
}

export function deleteSlide(id: string): void {
  db.prepare("DELETE FROM slides WHERE id = ?").run(id);
}

// Settings

export function getSetting(key: string): string | undefined {
  const row = db.prepare("SELECT value FROM settings WHERE key = ?").get(key) as
    | { value: string }
    | undefined;
  return row?.value;
}

export function setSetting(key: string, value: string): void {
  db.prepare(
    `INSERT INTO settings (key, value, updatedAt) VALUES (?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updatedAt = excluded.updatedAt`
  ).run(key, value, new Date().toISOString());
}

// Slide versions

export function createSlideVersion(record: Omit<SlideVersionRecord, "id" | "createdAt">): SlideVersionRecord {
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  db.prepare(
    `INSERT INTO slide_versions (id, slideId, deckId, revision, purpose, primaryMessage, summary, html, css, data, sources, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    record.slideId,
    record.deckId,
    record.revision,
    record.purpose,
    record.primaryMessage,
    record.summary,
    record.html,
    record.css,
    record.data,
    record.sources,
    createdAt
  );
  return { id, ...record, createdAt };
}

export function listSlideVersions(slideId: string): SlideVersionRecord[] {
  return db
    .prepare("SELECT * FROM slide_versions WHERE slideId = ? ORDER BY revision DESC")
    .all(slideId) as SlideVersionRecord[];
}

export function getSlideVersion(id: string): SlideVersionRecord | undefined {
  return db.prepare("SELECT * FROM slide_versions WHERE id = ?").get(id) as SlideVersionRecord | undefined;
}

export function getCurrentSlideVersion(slideId: string): SlideVersionRecord | undefined {
  const slide = getSlide(slideId);
  if (!slide?.currentVersionId) return undefined;
  return getSlideVersion(slide.currentVersionId);
}
