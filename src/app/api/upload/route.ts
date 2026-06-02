import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

// POST /api/upload — 上传文件并提取文本
export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "未选择文件" }, { status: 400 });
  }

  const ext = path.extname(file.name).toLowerCase();
  if (![".txt", ".md"].includes(ext)) {
    return NextResponse.json(
      { error: "目前仅支持 .txt .md 文件，PDF 请复制粘贴文本" },
      { status: 400 }
    );
  }

  // 保存文件
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const savedName = `${Date.now()}_${file.name}`;
  fs.writeFileSync(path.join(UPLOAD_DIR, savedName), buffer);

  // 提取文本
  const text = buffer.toString("utf-8");

  if (!text.trim()) {
    return NextResponse.json(
      { error: "文件内容为空" },
      { status: 400 }
    );
  }

  return NextResponse.json({
    text,
    fileName: file.name,
    charCount: text.length,
  });
}
