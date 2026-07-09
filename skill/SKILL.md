---
name: personal-agent
description: Personal AI Agent - learn habits, record events, manage memory, import WeChat chats
triggers:
  - personal agent
  - my habits
  - my preferences
  - remember that
  - record event
  - import wechat
  - my profile
  - what do you know about me
  - feed habit
  - my memory
---

# Personal AI Agent

A personal AI assistant that continuously learns your habits, preferences, and experiences through daily conversations and data imports.

## When to invoke this skill

- User wants to record a habit, preference, or personal information
- User wants to record an event, decision, or meeting
- User wants to import WeChat chat logs
- User wants to view their personal profile or memory
- User wants to search past events or people
- User says "remember that", "note that", "record this"

## Setup

First, check if the agent is installed:

```bash
AGENT_DIR="$HOME/personal-agent"
if [ ! -d "$AGENT_DIR" ]; then
  echo "Agent not found. Cloning from GitHub..."
  git clone https://github.com/Emama-bit/Personal-AI-Agent.git "$AGENT_DIR"
  cd "$AGENT_DIR/agent" && npm install
fi
```

## Core Concepts

The agent stores data in three systems:

1. **Profile** (`memory/profile.json`) - Habits, preferences, work style
2. **Events** (`memory/events.json`) - Events, people, decisions
3. **Memory** (`memory/`) - Conversation history

All data is stored locally and persists across sessions.

## Usage Patterns

### Recording Habits

When the user mentions a habit or preference, use the `feed_habit` tool:

```bash
cd "$AGENT_DIR/agent" && npx tsx -e "
import { addHabit } from './src/profile';
const result = addHabit('作息', '每天早上7点起床', 'conversation', 9);
console.log(JSON.stringify(result, null, 2));
"
```

### Recording Events

When the user mentions something that happened, use the `add_event` tool:

```bash
cd "$AGENT_DIR/agent" && npx tsx -e "
import { addEvent } from './src/events';
const result = addEvent('会议', '与老王讨论项目', '讨论了技术选型', ['老王'], ['技术选型']);
console.log(JSON.stringify(result, null, 2));
"
```

### Recording Decisions

When the user makes a decision, use the `add_decision` tool:

```bash
cd "$AGENT_DIR/agent" && npx tsx -e "
import { addDecision } from './src/events';
const result = addDecision('技术选型', ['Go', 'Rust', 'Python'], 'Rust', '性能更好，适合系统编程');
console.log(JSON.stringify(result, null, 2));
"
```

### Viewing Profile

To show the user their profile:

```bash
cd "$AGENT_DIR/agent" && npx tsx -e "
import { getProfileSummary } from './src/profile';
console.log(getProfileSummary());
"
```

### Viewing Memory Summary

To show events, people, and decisions:

```bash
cd "$AGENT_DIR/agent" && npx tsx -e "
import { getMemorySummary } from './src/events';
console.log(getMemorySummary());
"
```

### Searching Events

To search for specific events:

```bash
cd "$AGENT_DIR/agent" && npx tsx -e "
import { searchEvents } from './src/events';
const results = searchEvents('老王');
console.log(JSON.stringify(results, null, 2));
"
```

### Importing WeChat Chat Logs

To import WeChat chat logs:

```bash
cd "$AGENT_DIR/agent" && npx tsx -e "
import { importWeChatFile } from './src/wechat';
const result = importWeChatFile('/path/to/chat.txt', 'my-nickname');
console.log(JSON.stringify(result, null, 2));
"
```

## Auto-Extraction Rules

When chatting with the user, automatically detect and record:

### When to call feed_habit
- User describes a habit: "I usually...", "I prefer...", "I like..."
- User mentions routine: "Every morning I...", "I always..."
- User states preference: "I use VS Code", "I prefer coffee"

### When to call add_event
- User mentions meeting someone: "Had lunch with Bob", "Met with the team"
- User describes something that happened: "The server crashed", "Client approved the proposal"
- User mentions a plan: "Going to Shanghai next week", "Meeting tomorrow"

### When to call add_decision
- User makes a choice: "I decided to use Rust", "Going with option B"
- User changes mind: "Switching from Go to Rust"

### When to call touchPerson
- User mentions a name: "Bob said...", "Talked to Alice"
- User describes a relationship: "Bob is my colleague", "Alice is my client"

## Response Style

- Use the same language as the user
- Reference personal profile and event memory in responses
- Connect to historical events: "You mentioned before that..."
- Keep responses concise, warm, and conversational
- When recording, do it silently - don't always announce "I've recorded this"

## Environment Variables

The agent reads configuration from `agent/.env`:

```env
API_KEY=your-api-key
BASE_URL=https://your-proxy-url/v1
MODEL=your-model-name
DATA_DIR=../data
MEMORY_DIR=./memory
```

If the .env file doesn't exist, guide the user to create it.

## Data Location

All personal data is stored in:
- `$AGENT_DIR/agent/memory/profile.json` - Personal profile
- `$AGENT_DIR/agent/memory/events.json` - Events
- `$AGENT_DIR/agent/memory/people.json` - People
- `$AGENT_DIR/agent/memory/decisions.json` - Decisions

This directory is gitignored and never committed.
