import { NextRequest, NextResponse } from "next/server";
import { readAll, appendOne, writeAll, genId } from "@/lib/store";
import { chunkText, type Chunk } from "@/lib/rag";
import type { ProxyItem } from "@/types/domain";

// GET /api/proxy — 列出所有替身
export async function GET() {
  const proxies = readAll<ProxyItem>("proxies");
  return NextResponse.json({ proxies });
}

// POST /api/proxy — 创建替身
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, domain, description, texts } = body as {
    name: string;
    domain: string;
    description: string;
    texts: { content: string; source: string }[];
  };

  if (!name || !domain) {
    return NextResponse.json(
      { error: "名称和领域为必填" },
      { status: 400 }
    );
  }

  const id = genId();

  // 构建系统提示词
  const systemPrompt = [
    `你是「${name}」，一位${domain}领域的资深专家。`,
    description ? `关于你自己：${description}` : "",
    `请基于以下参考资料回答用户问题。`,
    `如果参考资料中没有相关内容，请基于你的专业知识诚实回答，并说明依据。`,
    `每个回答末尾标注置信度：[高] / [中] / [低] / [不确定]`,
  ].join("\n");

  // 对所有文本进行分块
  const allChunks: Chunk[] = [];
  const fileNames: string[] = [];

  if (texts && texts.length > 0) {
    for (const t of texts) {
      if (t.content.trim()) {
        const chunks = chunkText(t.content, id, t.source);
        allChunks.push(...chunks);
        fileNames.push(t.source);
      }
    }
  }

  // 存储替身
  const proxy: ProxyItem = {
    id,
    name,
    domain,
    description,
    systemPrompt,
    createdAt: new Date().toISOString(),
    fileNames,
    chunkCount: allChunks.length,
  };

  appendOne("proxies", proxy);

  // 存储分块
  if (allChunks.length > 0) {
    const existingChunks = readAll<Chunk>("chunks");
    existingChunks.push(...allChunks);
    writeAll("chunks", existingChunks);
  }

  return NextResponse.json({ proxy });
}
