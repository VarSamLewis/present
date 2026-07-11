import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import { config } from "@/lib/config";
import { migrate } from "@/lib/db/migrations";

const dbDir = path.dirname(config.DATABASE_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(config.DATABASE_PATH);
db.pragma("journal_mode = WAL");

migrate(db);

export { db };
