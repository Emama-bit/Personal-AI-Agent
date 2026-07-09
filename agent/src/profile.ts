import fs from "fs";
import path from "path";

const PROFILE_DIR = process.env.MEMORY_DIR || path.resolve(__dirname, "../memory");
const PROFILE_FILE = path.join(PROFILE_DIR, "profile.json");

export interface PersonalProfile {
  name: string;
  avatar: string;
  bio: string;
  habits: Habit[];
  preferences: Record<string, string>;
  workStyle: Record<string, string>;
  updatedAt: string;
}

export interface Habit {
  id: string;
  category: string;
  content: string;
  source: string;
  confidence: number;
  createdAt: string;
}

const DEFAULT_PROFILE: PersonalProfile = {
  name: "",
  avatar: "",
  bio: "",
  habits: [],
  preferences: {},
  workStyle: {},
  updatedAt: new Date().toISOString(),
};

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

export function loadProfile(): PersonalProfile {
  ensureDir(PROFILE_DIR);
  if (!fs.existsSync(PROFILE_FILE)) return { ...DEFAULT_PROFILE };
  try {
    return JSON.parse(fs.readFileSync(PROFILE_FILE, "utf-8"));
  } catch {
    return { ...DEFAULT_PROFILE };
  }
}

export function saveProfile(profile: PersonalProfile): void {
  ensureDir(PROFILE_DIR);
  profile.updatedAt = new Date().toISOString();
  fs.writeFileSync(PROFILE_FILE, JSON.stringify(profile, null, 2));
}

export function addHabit(
  category: string,
  content: string,
  source: string = "conversation",
  confidence: number = 8
): Habit {
  const profile = loadProfile();
  const habit: Habit = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    category,
    content,
    source,
    confidence,
    createdAt: new Date().toISOString(),
  };
  profile.habits.push(habit);
  saveProfile(profile);
  return habit;
}

export function removeHabit(id: string): boolean {
  const profile = loadProfile();
  const idx = profile.habits.findIndex((h) => h.id === id);
  if (idx === -1) return false;
  profile.habits.splice(idx, 1);
  saveProfile(profile);
  return true;
}

export function updatePreference(key: string, value: string): void {
  const profile = loadProfile();
  profile.preferences[key] = value;
  saveProfile(profile);
}

export function updateBio(bio: string): void {
  const profile = loadProfile();
  profile.bio = bio;
  saveProfile(profile);
}

export function updateName(name: string): void {
  const profile = loadProfile();
  profile.name = name;
  saveProfile(profile);
}

export function getProfileSummary(): string {
  const p = loadProfile();
  const parts: string[] = [];
  if (p.name) parts.push(`姓名: ${p.name}`);
  if (p.bio) parts.push(`简介: ${p.bio}`);
  if (p.habits.length > 0) {
    const byCategory = p.habits.reduce((acc, h) => {
      (acc[h.category] ??= []).push(h.content);
      return acc;
    }, {} as Record<string, string[]>);
    parts.push("习惯:");
    for (const [cat, items] of Object.entries(byCategory)) {
      parts.push(`  [${cat}] ${items.join("; ")}`);
    }
  }
  if (Object.keys(p.preferences).length > 0) {
    parts.push("偏好:");
    for (const [k, v] of Object.entries(p.preferences)) {
      parts.push(`  ${k}: ${v}`);
    }
  }
  if (Object.keys(p.workStyle).length > 0) {
    parts.push("工作方式:");
    for (const [k, v] of Object.entries(p.workStyle)) {
      parts.push(`  ${k}: ${v}`);
    }
  }
  return parts.length > 0 ? parts.join("\n") : "（暂无个人画像数据）";
}
