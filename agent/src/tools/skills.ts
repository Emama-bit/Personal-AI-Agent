import { readAll, appendOne, writeAll, genId, findById, updateById } from "../lib/store";
import { chunkText, searchChunks, type Chunk } from "../lib/rag";
import type { ProxyItem } from "../types/domain";

export async function handleListSkills(): Promise<string> {
  const proxies = readAll<ProxyItem>("proxies");
  return JSON.stringify({
    skills: proxies.map((p) => ({
      id: p.id,
      name: p.name,
      domain: p.domain,
      description: p.description,
      chunkCount: p.chunkCount,
    })),
  });
}

export async function handleGetSkill(input: { id: string }): Promise<string> {
  const proxy = findById<ProxyItem>("proxies", input.id);
  if (!proxy) return JSON.stringify({ error: "Skill 不存在" });
  return JSON.stringify({ skill: proxy });
}

export async function handleCreateSkill(input: {
  name: string;
  domain: string;
  description: string;
  texts?: { content: string; source: string }[];
}): Promise<string> {
  if (!input.name || !input.domain) {
    return JSON.stringify({ error: "名称和领域为必填" });
  }

  const id = genId();

  const systemPrompt = [
    `你是「${input.name}」，一位${input.domain}领域的资深专家。`,
    input.description ? `关于你自己：${input.description}` : "",
    `请基于以下参考资料回答用户问题。`,
    `如果参考资料中没有相关内容，请基于你的专业知识诚实回答，并说明依据。`,
    `每个回答末尾标注置信度：[高] / [中] / [低] / [不确定]`,
  ].join("\n");

  const allChunks: Chunk[] = [];
  const fileNames: string[] = [];

  if (input.texts && input.texts.length > 0) {
    for (const t of input.texts) {
      if (t.content.trim()) {
        const chunks = chunkText(t.content, id, t.source);
        allChunks.push(...chunks);
        fileNames.push(t.source);
      }
    }
  }

  const proxy: ProxyItem = {
    id,
    name: input.name,
    domain: input.domain,
    description: input.description,
    systemPrompt,
    createdAt: new Date().toISOString(),
    fileNames,
    chunkCount: allChunks.length,
  };

  appendOne("proxies", proxy);

  if (allChunks.length > 0) {
    const existingChunks = readAll<Chunk>("chunks");
    existingChunks.push(...allChunks);
    writeAll("chunks", existingChunks);
  }

  return JSON.stringify({ skill: proxy });
}

export async function handleDeleteSkill(input: { id: string }): Promise<string> {
  const proxy = findById<ProxyItem>("proxies", input.id);
  if (!proxy) return JSON.stringify({ error: "Skill 不存在" });

  const proxies = readAll<ProxyItem>("proxies");
  writeAll("proxies", proxies.filter((p) => p.id !== input.id));

  const chunks = readAll<Chunk>("chunks");
  writeAll("chunks", chunks.filter((c) => c.proxyId !== input.id));

  return JSON.stringify({ success: true, deleted: proxy.name });
}

export async function handleChatWithSkill(input: {
  id: string;
  message: string;
  history?: { role: string; content: string }[];
}): Promise<string> {
  const proxy = findById<ProxyItem>("proxies", input.id);
  if (!proxy) return JSON.stringify({ error: "Skill 不存在" });

  const allChunks = readAll<Chunk>("chunks");
  const proxyChunks = allChunks.filter((c) => c.proxyId === input.id);

  const safeHistory = (input.history || []).slice(-4);
  const recentText = safeHistory.map((h) => h.content).join(" ");
  const searchQuery = input.message + " " + recentText;
  const relevantChunks = searchChunks(searchQuery, proxyChunks, 5);

  const context =
    relevantChunks.length > 0
      ? relevantChunks
          .map((chunk) => `[来源: ${chunk.source}]\n${chunk.text}`)
          .join("\n\n---\n\n")
      : "（暂无 Skill 参考资料）";

  return JSON.stringify({
    skillName: proxy.name,
    systemPrompt: proxy.systemPrompt,
    context,
    relevantSources: [...new Set(relevantChunks.map((c) => c.source))],
    note: "Use this information to answer the user's question about this skill.",
  });
}

interface Rating {
  id: string;
  proxyId: string;
  stars: number;
  comment: string;
  createdAt: string;
}

export async function handleRateSkill(input: {
  id: string;
  stars: number;
  comment?: string;
}): Promise<string> {
  if (!input.stars || input.stars < 1 || input.stars > 5) {
    return JSON.stringify({ error: "评分必须在 1-5 之间" });
  }

  const rating: Rating = {
    id: genId(),
    proxyId: input.id,
    stars: input.stars,
    comment: input.comment || "",
    createdAt: new Date().toISOString(),
  };

  appendOne("ratings", rating);

  const allRatings = readAll<Rating>("ratings").filter(
    (r) => r.proxyId === input.id
  );
  const avg =
    allRatings.reduce((sum, r) => sum + r.stars, 0) / allRatings.length;

  return JSON.stringify({
    rating,
    avgRating: Math.round(avg * 10) / 10,
    ratingCount: allRatings.length,
  });
}
