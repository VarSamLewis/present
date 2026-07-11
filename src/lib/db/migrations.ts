import Database from "better-sqlite3";

export const MIGRATIONS: Array<{ version: number; sql: string; guard?: (db: Database.Database) => boolean }> = [
  {
    version: 1,
    sql: `
      CREATE TABLE IF NOT EXISTS sources (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        filename TEXT NOT NULL,
        mimeType TEXT NOT NULL,
        sizeBytes INTEGER NOT NULL,
        createdAt TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS source_chunks (
        id TEXT PRIMARY KEY,
        sourceId TEXT NOT NULL,
        chunkIndex INTEGER NOT NULL,
        kind TEXT NOT NULL,
        text TEXT NOT NULL,
        location TEXT,
        embeddingHash TEXT,
        embedding BLOB,
        FOREIGN KEY (sourceId) REFERENCES sources(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_source_chunks_source ON source_chunks(sourceId);

      CREATE VIRTUAL TABLE IF NOT EXISTS source_chunks_fts USING fts5(
        text, content='source_chunks', content_rowid='rowid'
      );

      CREATE TRIGGER IF NOT EXISTS source_chunks_ai AFTER INSERT ON source_chunks BEGIN
        INSERT INTO source_chunks_fts(rowid, text) VALUES (new.rowid, new.text);
      END;

      CREATE TRIGGER IF NOT EXISTS source_chunks_ad AFTER DELETE ON source_chunks BEGIN
        INSERT INTO source_chunks_fts(source_chunks_fts, rowid, text) VALUES ('delete', old.rowid, old.text);
      END;

      CREATE TRIGGER IF NOT EXISTS source_chunks_au AFTER UPDATE ON source_chunks BEGIN
        INSERT INTO source_chunks_fts(source_chunks_fts, rowid, text) VALUES ('delete', old.rowid, old.text);
        INSERT INTO source_chunks_fts(rowid, text) VALUES (new.rowid, new.text);
      END;

      CREATE TABLE IF NOT EXISTS decks (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        audience TEXT NOT NULL,
        objective TEXT NOT NULL,
        styleDirection TEXT NOT NULL,
        themeId TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS slides (
        id TEXT PRIMARY KEY,
        deckId TEXT NOT NULL,
        orderIndex INTEGER NOT NULL,
        currentVersionId TEXT,
        FOREIGN KEY (deckId) REFERENCES decks(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_slides_deck ON slides(deckId);

      CREATE TABLE IF NOT EXISTS slide_versions (
        id TEXT PRIMARY KEY,
        slideId TEXT NOT NULL,
        deckId TEXT NOT NULL,
        revision INTEGER NOT NULL,
        purpose TEXT NOT NULL,
        primaryMessage TEXT NOT NULL,
        summary TEXT NOT NULL,
        html TEXT NOT NULL,
        css TEXT NOT NULL,
        data TEXT NOT NULL,
        sources TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (slideId) REFERENCES slides(id) ON DELETE CASCADE,
        FOREIGN KEY (deckId) REFERENCES decks(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_slide_versions_slide ON slide_versions(slideId);
      CREATE INDEX IF NOT EXISTS idx_slide_versions_deck ON slide_versions(deckId);

      CREATE TABLE IF NOT EXISTS schema_version (
        version INTEGER PRIMARY KEY
      );
    `,
  },
  {
    version: 2,
    sql: `
      ALTER TABLE decks ADD COLUMN manifestJson TEXT;
    `,
    guard: (db: Database.Database) => {
      const columns = db.prepare("PRAGMA table_info(decks)").all() as Array<{ name: string }>;
      return !columns.some((c) => c.name === "manifestJson");
    },
  },
];

export function migrate(db: Database.Database) {
  db.exec("PRAGMA foreign_keys = ON;");

  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_version (
      version INTEGER PRIMARY KEY
    );
  `);

  const version = db.prepare("SELECT version FROM schema_version LIMIT 1").get() as
    | { version: number }
    | undefined;
  const currentVersion = version?.version ?? 0;

  for (const migration of MIGRATIONS) {
    if (migration.version > currentVersion) {
      if (migration.guard && !migration.guard(db)) {
        continue;
      }
      db.exec(migration.sql);
      db.prepare("INSERT OR REPLACE INTO schema_version (version) VALUES (?)").run(migration.version);
    }
  }
}
