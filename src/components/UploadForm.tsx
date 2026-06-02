"use client";

import { useState, useRef } from "react";

interface UploadedText {
  content: string;
  source: string;
}

export default function UploadForm({
  onTextsChange,
}: {
  onTextsChange: (texts: UploadedText[]) => void;
}) {
  const [texts, setTexts] = useState<UploadedText[]>([]);
  const [manualText, setManualText] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function updateParent(newTexts: UploadedText[]) {
    setTexts(newTexts);
    onTextsChange(newTexts);
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: fd,
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "上传失败");
        return;
      }

      updateParent([...texts, { content: data.text, source: data.fileName }]);
    } catch {
      alert("上传失败");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function addManualText() {
    if (!manualText.trim()) return;
    updateParent([
      ...texts,
      { content: manualText.trim(), source: `手动输入 #${texts.length + 1}` },
    ]);
    setManualText("");
  }

  function removeText(index: number) {
    const newTexts = texts.filter((_, i) => i !== index);
    updateParent(newTexts);
  }

  return (
    <div className="space-y-4">
      {/* 已上传列表 */}
      {texts.length > 0 && (
        <div className="space-y-2">
          <label className="text-sm font-medium">已添加的经验数据</label>
          {texts.map((t, i) => (
            <div
              key={i}
              className="flex items-center justify-between bg-gray-50 border border-border rounded-lg px-3 py-2"
            >
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium">{t.source}</span>
                <span className="text-xs text-muted ml-2">
                  {t.content.length} 字
                </span>
              </div>
              <button
                type="button"
                onClick={() => removeText(i)}
                className="text-red-400 hover:text-red-600 text-sm ml-3"
              >
                移除
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 文件上传 */}
      <div>
        <label className="text-sm font-medium block mb-1">上传文件</label>
        <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
          <input
            ref={fileRef}
            type="file"
            accept=".txt,.md"
            onChange={handleFileUpload}
            className="hidden"
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            className="cursor-pointer text-sm text-muted"
          >
            {uploading ? (
              <span>上传中...</span>
            ) : (
              <>
                <span className="text-primary">点击上传</span> 或拖拽文件
                <p className="text-xs mt-1">支持 .txt .md 格式（PDF 请粘贴文本）</p>
              </>
            )}
          </label>
        </div>
      </div>

      {/* 手动输入 */}
      <div>
        <label className="text-sm font-medium block mb-1">
          或直接粘贴文本
        </label>
        <textarea
          value={manualText}
          onChange={(e) => setManualText(e.target.value)}
          placeholder="粘贴你的专业经验、案例、知识文档..."
          rows={6}
          className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-y"
        />
        <button
          type="button"
          onClick={addManualText}
          disabled={!manualText.trim()}
          className="mt-2 text-sm bg-gray-100 text-foreground px-4 py-1.5 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
        >
          + 添加这段文本
        </button>
      </div>
    </div>
  );
}
