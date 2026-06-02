"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import UploadForm from "@/components/UploadForm";
import type { ProxyItem } from "@/types/domain";

interface UploadedText {
  content: string;
  source: string;
}

export default function EditProxyPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [proxy, setProxy] = useState<ProxyItem | null>(null);
  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");
  const [description, setDescription] = useState("");
  const [newTexts, setNewTexts] = useState<UploadedText[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetch(`/api/proxy/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.proxy) {
          setProxy(data.proxy);
          setName(data.proxy.name);
          setDomain(data.proxy.domain);
          setDescription(data.proxy.description);
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !domain.trim()) {
      alert("名称和领域为必填");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/proxy/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          domain: domain.trim(),
          description: description.trim(),
          newTexts: newTexts.length > 0 ? newTexts : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "保存失败");
        return;
      }

      router.push(`/proxy/${id}`);
    } catch {
      alert("保存失败");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("确定要删除这个替身吗？此操作不可撤销。")) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/proxy/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "删除失败");
        return;
      }
      router.push("/");
    } catch {
      alert("删除失败");
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center text-muted">
        加载中...
      </div>
    );
  }

  if (!proxy) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <p className="text-xl font-semibold mb-2">替身不存在</p>
        <a href="/" className="text-primary hover:underline">
          返回市场
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">编辑替身</h1>

      <form onSubmit={handleSave} className="space-y-6">
        {/* 基本信息 */}
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium block mb-1">替身名称</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>

          <div>
            <label className="text-sm font-medium block mb-1">专业领域</label>
            <input
              type="text"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>

          <div>
            <label className="text-sm font-medium block mb-1">自我介绍</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-y"
            />
          </div>
        </div>

        {/* 当前经验数据 */}
        <div>
          <h2 className="text-lg font-semibold mb-2">当前经验数据</h2>
          <p className="text-sm text-muted mb-3">
            {proxy.chunkCount} 条数据块 · {proxy.fileNames.length} 个来源
          </p>
          {proxy.fileNames.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {proxy.fileNames.map((f, i) => (
                <span
                  key={i}
                  className="text-xs bg-gray-100 text-muted px-2 py-1 rounded"
                >
                  {f}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* 追加新经验 */}
        <div>
          <h2 className="text-lg font-semibold mb-2">追加经验数据</h2>
          <p className="text-sm text-muted mb-3">
            追加更多专业文档，让替身更聪明
          </p>
          <UploadForm onTextsChange={setNewTexts} />
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 bg-primary text-white py-3 rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 font-medium"
          >
            {saving ? "保存中..." : "保存修改"}
          </button>
          <button
            type="button"
            onClick={() => router.push(`/proxy/${id}`)}
            className="px-6 py-3 border border-border rounded-lg hover:bg-gray-50 transition-colors text-sm"
          >
            取消
          </button>
        </div>
      </form>

      {/* 危险操作 */}
      <div className="mt-10 pt-6 border-t border-border">
        <h3 className="text-sm font-semibold text-red-500 mb-2">危险操作</h3>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="text-sm text-red-400 hover:text-red-600 border border-red-200 hover:border-red-400 px-4 py-2 rounded-lg transition-colors"
        >
          {deleting ? "删除中..." : "删除此替身"}
        </button>
        <p className="text-xs text-muted mt-1">
          删除后无法恢复，所有经验数据将一并清除
        </p>
      </div>
    </div>
  );
}
