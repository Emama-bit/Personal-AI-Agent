import fs from "fs";
import path from "path";

const EVENTS_DIR = process.env.MEMORY_DIR || path.resolve(__dirname, "../memory");
const EVENTS_FILE = path.join(EVENTS_DIR, "events.json");
const PEOPLE_FILE = path.join(EVENTS_DIR, "people.json");
const DECISIONS_FILE = path.join(EVENTS_DIR, "decisions.json");

// ─── Types ───────────────────────────────────────────────

export interface Event {
  id: string;
  date: string;
  category: string;
  summary: string;
  details: string;
  people: string[];
  tags: string[];
  source: string;
  createdAt: string;
}

export interface Person {
  id: string;
  name: string;
  relation: string;
  notes: string[];
  lastInteraction: string;
  interactionCount: number;
  createdAt: string;
}

export interface Decision {
  id: string;
  date: string;
  topic: string;
  options: string[];
  chosen: string;
  reason: string;
  relatedEventIds: string[];
  createdAt: string;
}

// ─── Helpers ─────────────────────────────────────────────

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function loadJSON<T>(file: string, fallback: T): T {
  ensureDir(path.dirname(file));
  if (!fs.existsSync(file)) return fallback;
  try { return JSON.parse(fs.readFileSync(file, "utf-8")); }
  catch { return fallback; }
}

function saveJSON(file: string, data: unknown) {
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

// ─── Events ──────────────────────────────────────────────

export function loadEvents(): Event[] {
  return loadJSON<Event[]>(EVENTS_FILE, []);
}

export function saveEvents(events: Event[]) {
  saveJSON(EVENTS_FILE, events);
}

export function addEvent(
  category: string,
  summary: string,
  details: string = "",
  people: string[] = [],
  tags: string[] = [],
  source: string = "conversation",
  date?: string
): Event {
  const events = loadEvents();
  const event: Event = {
    id: genId(),
    date: date || today(),
    category,
    summary,
    details,
    people,
    tags,
    source,
    createdAt: new Date().toISOString(),
  };
  events.push(event);
  saveEvents(events);

  // Auto-update people
  for (const name of people) {
    touchPerson(name, summary);
  }

  return event;
}

export function searchEvents(query: string, limit: number = 10): Event[] {
  const events = loadEvents();
  const q = query.toLowerCase();
  return events
    .filter(e =>
      e.summary.toLowerCase().includes(q) ||
      e.details.toLowerCase().includes(q) ||
      e.people.some(p => p.toLowerCase().includes(q)) ||
      e.tags.some(t => t.toLowerCase().includes(q)) ||
      e.category.toLowerCase().includes(q)
    )
    .slice(-limit)
    .reverse();
}

export function getRecentEvents(days: number = 7, limit: number = 20): Event[] {
  const events = loadEvents();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString().slice(0, 10);
  return events
    .filter(e => e.date >= cutoffStr)
    .slice(-limit)
    .reverse();
}

export function getEventsByPerson(name: string, limit: number = 10): Event[] {
  const events = loadEvents();
  const q = name.toLowerCase();
  return events
    .filter(e => e.people.some(p => p.toLowerCase().includes(q)))
    .slice(-limit)
    .reverse();
}

// ─── People ──────────────────────────────────────────────

export function loadPeople(): Person[] {
  return loadJSON<Person[]>(PEOPLE_FILE, []);
}

export function savePeople(people: Person[]) {
  saveJSON(PEOPLE_FILE, people);
}

export function touchPerson(name: string, note: string): Person {
  const people = loadPeople();
  let person = people.find(p => p.name.toLowerCase() === name.toLowerCase());
  if (!person) {
    person = {
      id: genId(),
      name,
      relation: "",
      notes: [],
      lastInteraction: today(),
      interactionCount: 0,
      createdAt: new Date().toISOString(),
    };
    people.push(person);
  }
  person.notes.push(`[${today()}] ${note}`);
  if (person.notes.length > 20) person.notes = person.notes.slice(-20);
  person.lastInteraction = today();
  person.interactionCount++;
  savePeople(people);
  return person;
}

export function updatePersonInfo(name: string, relation: string): Person {
  const people = loadPeople();
  let person = people.find(p => p.name.toLowerCase() === name.toLowerCase());
  if (!person) {
    person = {
      id: genId(),
      name,
      relation,
      notes: [],
      lastInteraction: today(),
      interactionCount: 0,
      createdAt: new Date().toISOString(),
    };
    people.push(person);
  } else {
    person.relation = relation;
  }
  savePeople(people);
  return person;
}

export function getPersonSummary(): string {
  const people = loadPeople();
  if (people.length === 0) return "（暂无人脉记录）";
  return people
    .sort((a, b) => b.interactionCount - a.interactionCount)
    .map(p => {
      const recent = p.notes.slice(-3).join("; ");
      return `${p.name}（${p.relation || "未分类"}）互动${p.interactionCount}次，最近：${recent}`;
    })
    .join("\n");
}

// ─── Decisions ───────────────────────────────────────────

export function loadDecisions(): Decision[] {
  return loadJSON<Decision[]>(DECISIONS_FILE, []);
}

export function saveDecisions(decisions: Decision[]) {
  saveJSON(DECISIONS_FILE, decisions);
}

export function addDecision(
  topic: string,
  options: string[],
  chosen: string,
  reason: string,
  relatedEventIds: string[] = []
): Decision {
  const decisions = loadDecisions();
  const decision: Decision = {
    id: genId(),
    date: today(),
    topic,
    options,
    chosen,
    reason,
    relatedEventIds,
    createdAt: new Date().toISOString(),
  };
  decisions.push(decision);
  saveDecisions(decisions);
  return decision;
}

export function getRecentDecisions(limit: number = 10): Decision[] {
  return loadDecisions().slice(-limit).reverse();
}

// ─── Summary ─────────────────────────────────────────────

export function getMemorySummary(): string {
  const events = loadEvents();
  const people = loadPeople();
  const decisions = loadDecisions();

  const parts: string[] = [];

  if (events.length > 0) {
    const recent = events.slice(-5).reverse();
    parts.push(`最近事件（共${events.length}条）：`);
    for (const e of recent) {
      const p = e.people.length > 0 ? ` [${e.people.join(",")}]` : "";
      parts.push(`  ${e.date} ${e.category}: ${e.summary}${p}`);
    }
  }

  if (people.length > 0) {
    const top = people.sort((a, b) => b.interactionCount - a.interactionCount).slice(0, 5);
    parts.push(`主要人脉（共${people.length}人）：`);
    for (const p of top) {
      parts.push(`  ${p.name}（${p.relation || "未分类"}）互动${p.interactionCount}次`);
    }
  }

  if (decisions.length > 0) {
    const recent = decisions.slice(-3).reverse();
    parts.push(`近期决策（共${decisions.length}条）：`);
    for (const d of recent) {
      parts.push(`  ${d.date} ${d.topic}: 选了"${d.chosen}"，因为${d.reason}`);
    }
  }

  return parts.length > 0 ? parts.join("\n") : "（暂无事件记忆）";
}
