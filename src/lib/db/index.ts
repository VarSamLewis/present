import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import { config } from "@/lib/config";
import { migrate } from "@/lib/db/migrations";

let instance: Database.Database | null = null;

function getDb(): Database.Database {
  if (!instance) {
    const dbDir = path.dirname(config.DATABASE_PATH);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    instance = new Database(config.DATABASE_PATH);
    instance.pragma("journal_mode = WAL");
    migrate(instance);
  }
  return instance;
}

export const db = new Proxy({} as Database.Database, {
  get(_target, prop) {
    return Reflect.get(getDb(), prop);
  },
});
