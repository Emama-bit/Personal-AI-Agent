import { NextRequest, NextResponse } from "next/server";
import { findById, readAll, writeAll, updateById } from "@/lib/store";
import { chunkText, type Chunk } from "@/lib/rag";
import type { ProxyItem } from "@/types/domain";

// GET /api/proxy/[id] — 获取单个替身
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const proxy = findById<ProxyItem>("proxies", id);
  if (!proxy) {
    return NextResponse.json({ error: "替身不存在" }, { status: 404 });
  }
  return NextResponse.json({ proxy });
}

// PUT /api/proxy/[id] — 更新替身信息
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  const proxy = findById<ProxyItem>("proxies", id);
  if (!proxy) {
    return NextResponse.json({ error: "替身不存在" }, { status: 404 });
  }

  const { name, domain, description, newTexts } = body as {
    name?: string;
    domain?: string;
    description?: string;
    newTexts?: { content: string; source: string }[];
  };

  // 如果有新文本，追加分块
  let addedChunks = 0;
  if (newTexts && newTexts.length > 0) {
    const allChunks = readAll<Chunk>("chunks");
    for (const t of newTexts) {
      if (t.content.trim()) {
        const chunks = chunkText(t.content, id, t.source);
        allChunks.push(...chunks);
        addedChunks += chunks.length;
      }
    }
    writeAll("chunks", allChunks);
  }

  // 更新替身信息
  const updated = updateById<ProxyItem>("proxies", id, (p) => ({
    ...p,
    name: name ?? p.name,
    domain: domain ?? p.domain,
    description: description ?? p.description,
    systemPrompt: buildSystemPrompt(
      name ?? p.name,
      domain ?? p.domain,
      description ?? p.description
    ),
    fileNames: [
      ...p.fileNames,
      ...(newTexts?.map((t) => t.source) || []),
    ],
    chunkCount: p.chunkCount + addedChunks,
  }));

  return NextResponse.json({ proxy: updated, addedChunks });
}

// DELETE /api/proxy/[id] — 删除替身
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const proxy = findById<ProxyItem>("proxies", id);
  if (!proxy) {
    return NextResponse.json({ error: "替身不存在" }, { status: 404 });
  }

  // 删除替身
  const proxies = readAll<ProxyItem>("proxies");
  writeAll("proxies", proxies.filter((p) => p.id !== id));

  // 删除关联的分块
  const chunks = readAll<Chunk>("chunks");
  writeAll("chunks", chunks.filter((c) => c.proxyId !== id));

  return NextResponse.json({ success: true });
}

function buildSystemPrompt(name: string, domain: string, description: string) {
  return [
    `你是「${name}」，一位${domain}领域的资深专家。`,
    description ? `关于你自己：${description}` : "",
    `请基于以下参考资料回答用户问题。`,
    `如果参考资料中没有相关内容，请基于你的专业知识诚实回答，并说明依据。`,
    `每个回答末尾标注置信度：[高] / [中] / [低] / [不确定]`,
  ].join("\n");
}
