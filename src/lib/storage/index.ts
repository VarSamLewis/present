import fs from "fs";
import path from "path";
import { config } from "@/lib/config";

export const uploadsDir = path.join(config.DATA_DIRECTORY, "uploads");
export const decksDir = path.join(config.DATA_DIRECTORY, "decks");

export function ensureStorage() {
  fs.mkdirSync(uploadsDir, { recursive: true });
  fs.mkdirSync(decksDir, { recursive: true });
}

export function sourceDir(sourceId: string) {
  const dir = path.join(uploadsDir, sourceId);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function writeSourceFile(sourceId: string, filename: string, data: Buffer) {
  const dir = sourceDir(sourceId);
  const filePath = path.join(dir, filename);
  fs.writeFileSync(filePath, data);
  return filePath;
}

export function readSourceFile(sourceId: string, filename: string): Buffer {
  return fs.readFileSync(path.join(sourceDir(sourceId), filename));
}

export function deckDir(deckId: string) {
  const dir = path.join(decksDir, deckId);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function deckScreenshotsDir(deckId: string) {
  const dir = path.join(deckDir(deckId), "screenshots");
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function deckExportsDir(deckId: string) {
  const dir = path.join(deckDir(deckId), "exports");
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

ensureStorage();
