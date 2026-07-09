import OpenAI from "openai";
import { tools, dispatch } from "./tools";
import { getSystemPrompt } from "./system";

const client = new OpenAI({
  baseURL: process.env.BASE_URL || process.env.ANTHROPIC_BASE_URL || "https://api.openai.com/v1",
  apiKey: process.env.API_KEY || process.env.ANTHROPIC_API_KEY || "",
});

const MODEL = process.env.MODEL || process.env.ANTHROPIC_MODEL || "mimo-v2.5-pro";

export interface Message {
  role: "user" | "assistant";
  content: string;
}

export async function runAgent(
  userMessage: string,
  history: Message[]
): Promise<{ reply: string; updatedHistory: Message[] }> {
  const messages: OpenAI.ChatCompletionMessageParam[] = [
    { role: "system", content: getSystemPrompt() },
    ...history.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
    { role: "user", content: userMessage },
  ];

  // Agent loop: keep calling LLM until it returns text (no more tool_calls)
  while (true) {
    const response = await client.chat.completions.create({
      model: MODEL,
      max_tokens: 4096,
      tools,
      messages,
    });

    const choice = response.choices[0];
    const msg = choice.message;

    // Check if LLM wants to use tools
    if (msg.tool_calls && msg.tool_calls.length > 0) {
      // Add assistant message with tool_calls
      messages.push(msg);

      // Execute each tool and collect results
      for (const tc of msg.tool_calls) {
        if (tc.type !== "function") continue;
        let args: Record<string, unknown> = {};
        try {
          args = JSON.parse(tc.function.arguments);
        } catch {}
        const result = await dispatch(tc.function.name, args);
        messages.push({
          role: "tool",
          tool_call_id: tc.id,
          content: result,
        });
      }

      continue;
    }

    // No tool calls — LLM has a final text response
    const reply = msg.content || "(No response)";
    return {
      reply,
      updatedHistory: [
        ...history,
        { role: "user", content: userMessage },
        { role: "assistant", content: reply },
      ],
    };
  }
}
