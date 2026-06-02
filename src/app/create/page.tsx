"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import UploadForm from "@/components/UploadForm";

interface UploadedText {
  content: string;
  source: string;
}

export default function CreatePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");
  const [description, setDescription] = useState("");
  const [useCases, setUseCases] = useState("");
  const [serviceOffer, setServiceOffer] = useState("");
  const [riskBoundary, setRiskBoundary] = useState("");
  const [acceptedRisk, setAcceptedRisk] = useState(false);
  const [texts, setTexts] = useState<UploadedText[]>([]);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !domain.trim() || !description.trim()) {
      alert("请填写 Skill 名称、技能类目和能力介绍");
      return;
    }
    if (!acceptedRisk) {
      alert("请先确认风险提示和平台责任边界");
      return;
    }

    setSubmitting(true);
    try {
      const profileText = [
        `Skill 名称：${name.trim()}`,
        `技能类目：${domain.trim()}`,
        `能力介绍：${description.trim()}`,
        useCases.trim() ? `适用场景：${useCases.trim()}` : "",
        serviceOffer.trim() ? `真人服务说明：${serviceOffer.trim()}` : "",
        riskBoundary.trim() ? `风险边界：${riskBoundary.trim()}` : "",
      ]
        .filter(Boolean)
        .join("\n\n");

      const res = await fetch("/api/proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          domain: domain.trim(),
          description: [
            description.trim(),
            useCases.trim() ? `适用：${useCases.trim()}` : "",
            serviceOffer.trim() ? `真人服务：${serviceOffer.trim()}` : "",
            riskBoundary.trim() ? `边界：${riskBoundary.trim()}` : "",
          ]
            .filter(Boolean)
            .join("｜"),
          texts: [
            { content: profileText, source: "Skill 发布说明" },
            ...texts,
          ],
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "创建失败");
        return;
      }

      router.push(`/proxy/${data.proxy.id}`);
    } catch {
      alert("创建失败，请重试");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <p className="text-sm text-primary font-medium mb-2">响应侧发布</p>
        <h1 className="text-2xl font-bold">发布你的 Skill AI</h1>
        <p className="text-sm text-muted mt-2">
          把你的经验、流程、案例和服务边界沉淀成可试用的 AI Skill。
          需求侧先体验 AI，再决定是否联系你购买真人服务。
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 基本信息 */}
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium block mb-1">
              Skill 名称
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="如：阿岚 - 小红书选题文案 Skill"
              className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>

          <div>
            <label className="text-sm font-medium block mb-1">
              技能类目
            </label>
            <input
              type="text"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="如：内容/营销文案、技术/代码调试、设计/审美建议、商业/创业咨询"
              className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>

          <div>
            <label className="text-sm font-medium block mb-1">
              能力介绍
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="介绍你的经验背景、擅长解决的问题、方法风格和代表案例..."
              rows={3}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-y"
            />
          </div>

          <div>
            <label className="text-sm font-medium block mb-1">
              适用场景
            </label>
            <textarea
              value={useCases}
              onChange={(e) => setUseCases(e.target.value)}
              placeholder="例如：适合小红书选题、标题优化、品牌种草文案初稿；不适合最终投放承诺。"
              rows={3}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-y"
            />
          </div>

          <div>
            <label className="text-sm font-medium block mb-1">
              真人服务说明
            </label>
            <textarea
              value={serviceOffer}
              onChange={(e) => setServiceOffer(e.target.value)}
              placeholder="例如：AI 试用后，可提供 1v1 深度修改、远程咨询、定制交付、按项目报价。"
              rows={3}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-y"
            />
          </div>

          <div>
            <label className="text-sm font-medium block mb-1">
              风险边界
            </label>
            <textarea
              value={riskBoundary}
              onChange={(e) => setRiskBoundary(e.target.value)}
              placeholder="说明你的 Skill 不承诺什么，例如：不构成法律/医疗/投资建议，不保证涨粉、录用、转化或收益。"
              rows={3}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-y"
            />
          </div>
        </div>

        {/* 经验数据 */}
        <div>
          <h2 className="text-lg font-semibold mb-3">上传 Skill 素材</h2>
          <p className="text-sm text-muted mb-4">
            上传你的流程、模板、案例、FAQ、检查清单或工作记录。素材越具体，
            AI Skill 越能体现你的个人方法。
          </p>
          <UploadForm onTextsChange={setTexts} />
        </div>

        <label className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm">
          <input
            type="checkbox"
            checked={acceptedRisk}
            onChange={(e) => setAcceptedRisk(e.target.checked)}
            className="mt-1"
          />
          <span className="text-amber-900 leading-relaxed">
            我确认：平台仅提供 Skill AI 展示、试用、撮合与交易辅助服务；我不会上传无权使用的敏感资料，
            并会自行向需求侧说明真人服务范围、交付标准和风险边界。
          </span>
        </label>

        {/* 提交 */}
        <button
          type="submit"
          disabled={
            submitting ||
            !name.trim() ||
            !domain.trim() ||
            !description.trim() ||
            !acceptedRisk
          }
          className="w-full bg-primary text-white py-3 rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {submitting ? "发布中..." : "发布 Skill AI"}
        </button>
      </form>
    </div>
  );
}
