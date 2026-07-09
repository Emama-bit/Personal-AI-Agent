import fs from "fs";
import path from "path";
import type { Message } from "./agent";

const MEMORY_DIR = process.env.MEMORY_DIR || path.join(process.cwd(), "memory");

function ensureDir() {
  if (!fs.existsSync(MEMORY_DIR)) {
    fs.mkdirSync(MEMORY_DIR, { recursive: true });
  }
}

export function saveConversation(id: string, messages: Message[]) {
  ensureDir();
  fs.writeFileSync(
    path.join(MEMORY_DIR, `${id}.json`),
    JSON.stringify(messages, null, 2)
  );
}

export function loadConversation(id: string): Message[] {
  const fp = path.join(MEMORY_DIR, `${id}.json`);
  if (!fs.existsSync(fp)) return [];
  try {
    return JSON.parse(fs.readFileSync(fp, "utf-8"));
  } catch {
    return [];
  }
}

export function listConversations(): string[] {
  ensureDir();
  return fs
    .readdirSync(MEMORY_DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.replace(".json", ""));
}
