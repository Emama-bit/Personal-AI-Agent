import type { AIProvider, ChatMessage } from "./types";
import { MockAIProvider } from "./mock";

type AIProviderType = "mock" | "openai" | "mimo" | "anthropic";

interface ProviderConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
}

class AIProviderError extends Error {
  constructor(
    message: string,
    public status?: number,
    public detail?: string
  ) {
    super(message);
  }
}

class OpenAICompatibleProvider implements AIProvider {
  constructor(private config: ProviderConfig) {}

  async chat({
    systemPrompt,
    context,
    userMessage,
    history = [],
  }: {
    systemPrompt: string;
    context: string;
    userMessage: string;
    history?: ChatMessage[];
  }): Promise<string> {
    const messages = [
      {
        role: "system",
        content: buildSystemPrompt(systemPrompt, context),
      },
      ...history.map((item) => ({
        role: item.role,
        content: item.content,
      })),
      { role: "user", content: userMessage },
    ];

    const res = await fetch(buildEndpoint(this.config.baseUrl, "chat/completions"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: this.config.model,
        messages,
        temperature: 0.4,
      }),
    });

    if (!res.ok) {
      throw await buildProviderError(res);
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content || "（AI 未返回内容）";
  }
}

class AnthropicCompatibleProvider implements AIProvider {
  constructor(private config: ProviderConfig) {}

  async chat({
    systemPrompt,
    context,
    userMessage,
    history = [],
  }: {
    systemPrompt: string;
    context: string;
    userMessage: string;
    history?: ChatMessage[];
  }): Promise<string> {
    const messages = [
      ...history.map((item) => ({
        role: item.role,
        content: item.content,
      })),
      { role: "user", content: userMessage },
    ];

    const res = await fetch(buildEndpoint(this.config.baseUrl, "v1/messages"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.config.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: this.config.model,
        max_tokens: 2048,
        temperature: 0.4,
        system: buildSystemPrompt(systemPrompt, context),
        messages,
      }),
    });

    if (!res.ok) {
      throw await buildProviderError(res);
    }

    const data = await res.json();
    if (Array.isArray(data.content)) {
      return (
        data.content
          .filter((block: { type?: string }) => block.type === "text")
          .map((block: { text?: string }) => block.text || "")
          .join("")
          .trim() || "（AI 未返回内容）"
      );
    }
    return data.content || "（AI 未返回内容）";
  }
}

let provider: AIProvider | null = null;

export function getAIProvider(): AIProvider {
  if (provider) return provider;

  const type = normalizeProviderType(process.env.AI_PROVIDER);
  const apiKey = process.env.AI_API_KEY;
  const baseUrl = process.env.AI_BASE_URL || defaultBaseUrl(type);
  const model = process.env.AI_MODEL || defaultModel(type);

  if (type === "mock" || !apiKey) {
    if (!apiKey && type !== "mock") {
      console.warn("AI_API_KEY is not set; falling back to mock provider.");
    }
    provider = new MockAIProvider();
    return provider;
  }

  if (type === "openai") {
    provider = new OpenAICompatibleProvider({ apiKey, baseUrl, model });
  } else {
    provider = new AnthropicCompatibleProvider({ apiKey, baseUrl, model });
  }

  return provider;
}

export function getSafeAIErrorMessage(error: unknown) {
  if (error instanceof AIProviderError) {
    return `AI 模型调用失败（${error.status || "unknown"}），请稍后重试或检查模型配置。`;
  }
  return "AI 模型调用失败，请稍后重试。";
}

function normalizeProviderType(value?: string): AIProviderType {
  if (value === "openai" || value === "mimo" || value === "anthropic") {
    return value;
  }
  return "mock";
}

function defaultBaseUrl(type: AIProviderType) {
  if (type === "openai") return "https://api.openai.com/v1";
  if (type === "anthropic") return "https://api.anthropic.com";
  return "";
}

function defaultModel(type: AIProviderType) {
  if (type === "openai") return "gpt-4o-mini";
  if (type === "anthropic") return "claude-3-5-haiku-latest";
  if (type === "mimo") return "mimo-v2.5-pro";
  return "mock";
}

function buildEndpoint(baseUrl: string, path: string) {
  const cleanBase = baseUrl.replace(/\/+$/, "");
  const cleanPath = path.replace(/^\/+/, "");

  if (!cleanBase) {
    throw new AIProviderError("AI_BASE_URL is required for this provider.");
  }
  if (cleanBase.endsWith(cleanPath)) {
    return cleanBase;
  }
  if (cleanBase.endsWith("/v1") && cleanPath.startsWith("v1/")) {
    return `${cleanBase}/${cleanPath.slice(3)}`;
  }
  return `${cleanBase}/${cleanPath}`;
}

function buildSystemPrompt(systemPrompt: string, context: string) {
  return [
    systemPrompt,
    "",
    "## 平台输出规则",
    "你是一个可试用的 Skill AI，必须优先体现该 Skill 发布者的方法、流程、案例和服务边界。",
    "请直接回答用户问题，不要虚构资历、案例或确定性结论。",
    "如果参考资料不足，请明确说明不足，并给出可执行的下一步问题。",
    "涉及法律、医疗、金融、投资等高风险场景时，必须提醒用户寻求合格专业人士确认。",
    "每次回答末尾用一句话标注：AI 结果仅供试用参考，复杂需求建议升级真人服务。",
    "",
    "## 当前 Skill 参考资料",
    context || "（暂无参考资料）",
  ].join("\n");
}

async function buildProviderError(res: Response) {
  const detail = await res.text().catch(() => "");
  return new AIProviderError("AI provider request failed.", res.status, detail);
}
