import fs from "fs";
import path from "path";

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), "data");

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function filePath(name: string) {
  return path.join(DATA_DIR, `${name}.json`);
}

export function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function readAll<T>(table: string): T[] {
  ensureDir();
  const fp = filePath(table);
  if (!fs.existsSync(fp)) return [];
  try {
    return JSON.parse(fs.readFileSync(fp, "utf-8"));
  } catch {
    return [];
  }
}

export function writeAll<T>(table: string, data: T[]) {
  ensureDir();
  fs.writeFileSync(filePath(table), JSON.stringify(data, null, 2), "utf-8");
}

export function appendOne<T extends { id: string }>(table: string, item: T) {
  const all = readAll<T>(table);
  all.push(item);
  writeAll(table, all);
  return item;
}

export function findById<T extends { id: string }>(table: string, id: string): T | undefined {
  return readAll<T>(table).find((i) => i.id === id);
}

export function updateById<T extends { id: string }>(
  table: string,
  id: string,
  updater: (item: T) => T
) {
  const all = readAll<T>(table);
  const idx = all.findIndex((i) => i.id === id);
  if (idx === -1) return undefined;
  all[idx] = updater(all[idx]);
  writeAll(table, all);
  return all[idx];
}
