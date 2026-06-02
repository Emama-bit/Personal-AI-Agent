import { NextRequest, NextResponse } from "next/server";
import { findById, readAll } from "@/lib/store";
import { searchChunks, type Chunk } from "@/lib/rag";
import { getAIProvider, getSafeAIErrorMessage } from "@/lib/ai";
import type { ChatMessage } from "@/lib/ai/types";
import type { ProxyItem } from "@/types/domain";

// POST /api/proxy/[id]/chat — Skill AI 聊天推理（支持多轮对话）
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { message, history = [] } = body as {
    message: string;
    history?: ChatMessage[];
  };

  if (!message?.trim()) {
    return NextResponse.json({ error: "消息不能为空" }, { status: 400 });
  }

  const safeHistory = history
    .filter(
      (item) =>
        (item.role === "user" || item.role === "assistant") &&
        typeof item.content === "string"
    )
    .slice(-10);

  const proxy = findById<ProxyItem>("proxies", id);
  if (!proxy) {
    return NextResponse.json({ error: "Skill 不存在" }, { status: 404 });
  }

  const allChunks = readAll<Chunk>("chunks");
  const proxyChunks = allChunks.filter((c) => c.proxyId === id);

  const recentHistory = safeHistory
    .slice(-4)
    .map((item) => item.content)
    .join(" ");
  const searchQuery = message + " " + recentHistory;
  const relevantChunks = searchChunks(searchQuery, proxyChunks, 5);

  const context =
    relevantChunks.length > 0
      ? relevantChunks
          .map((chunk) => `[来源: ${chunk.source}]\n${chunk.text}`)
          .join("\n\n---\n\n")
      : "（暂无 Skill 参考资料）";

  const ai = getAIProvider();
  try {
    const reply = await ai.chat({
      systemPrompt: proxy.systemPrompt,
      context,
      userMessage: message,
      history: safeHistory,
    });

    return NextResponse.json({
      reply,
      sources: [...new Set(relevantChunks.map((chunk) => chunk.source))],
      history: [
        ...safeHistory,
        { role: "user", content: message },
        { role: "assistant", content: reply },
      ],
    });
  } catch (err: unknown) {
    console.error("Skill AI chat failed:", err);
    const fallbackReply = [
      "真实 AI 模型暂时没有连通，我先用本地 Skill 规则给你一个兜底回复：",
      "",
      context,
      "",
      "你可以继续补充需求材料；模型网关恢复后，这里会自动切回真实 AI 回复。",
      "",
      "AI 结果仅供试用参考，复杂需求建议升级真人服务。",
    ].join("\n");

    return NextResponse.json(
      {
        reply: fallbackReply,
        warning: getSafeAIErrorMessage(err),
        sources: [...new Set(relevantChunks.map((chunk) => chunk.source))],
        history: [
          ...safeHistory,
          { role: "user", content: message },
          { role: "assistant", content: fallbackReply },
        ],
      },
      { status: 200 }
    );
  }
}
