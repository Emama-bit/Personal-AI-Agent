"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import ChatBox, { type AuditionMessage } from "@/components/ChatBox";
import RatingStars from "@/components/RatingStars";
import ServiceIntentBox from "@/components/ServiceIntentBox";
import ServiceReviewHighlights from "@/components/ServiceReviewHighlights";
import type { ProxyItem } from "@/types/domain";

function compactLine(content: string, maxLength = 96) {
  const normalized = content.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength)}...`;
}

function buildIntentDraft(proxy: ProxyItem, messages: AuditionMessage[]) {
  const userMessages = messages
    .filter((message) => message.role === "user")
    .slice(-3)
    .map((message) => compactLine(message.content));
  const assistantMessages = messages
    .filter((message) => message.role === "assistant")
    .slice(-2)
    .map((message) => compactLine(message.content, 120));

  if (userMessages.length === 0) return "";

  return [
    `我试镜了「${proxy.name}」，希望真人继续协助这个需求。`,
    "",
    "我在试镜中提出的问题/材料：",
    ...userMessages.map((message) => `- ${message}`),
    ...(assistantMessages.length > 0
      ? ["", "Skill AI 初步反馈重点：", ...assistantMessages.map((message) => `- ${message}`)]
      : []),
    "",
    "希望真人服务者继续帮我：",
    "1. 复核 AI 试镜判断是否准确；",
    "2. 给出更具体的执行方案、报价和交付周期；",
    "3. 说明服务边界、需要我补充的材料和风险点。",
  ].join("\n");
}

export default function ProxyDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [proxy, setProxy] = useState<ProxyItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showIntentModal, setShowIntentModal] = useState(false);
  const [hasAuditionMessages, setHasAuditionMessages] = useState(false);
  const [auditionMessages, setAuditionMessages] = useState<AuditionMessage[]>([]);
  const [intentDraft, setIntentDraft] = useState("");

  const handleAuditionActiveChange = useCallback((active: boolean) => {
    setHasAuditionMessages(active);
  }, []);

  const handleAuditionMessagesChange = useCallback((messages: AuditionMessage[]) => {
    setAuditionMessages(messages);
  }, []);

  const openCurrentIntent = useCallback(() => {
    if (proxy && auditionMessages.length > 0) {
      setIntentDraft(buildIntentDraft(proxy, auditionMessages));
    } else {
      setIntentDraft("");
    }
    setShowIntentModal(true);
  }, [auditionMessages, proxy]);

  const finishAudition = useCallback(
    (messages: AuditionMessage[]) => {
      if (proxy) {
        setIntentDraft(buildIntentDraft(proxy, messages));
      }
      setShowIntentModal(true);
    },
    [proxy]
  );

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    setHasAuditionMessages(false);
    setAuditionMessages([]);
    setShowIntentModal(false);
    setIntentDraft("");
    fetch(`/api/proxy/${id}`)
      .then(async (r) => {
        if (!r.ok) {
          const data = await r.json();
          throw new Error(data.error || "加载失败");
        }
        return r.json();
      })
      .then((data) => setProxy(data.proxy))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center text-muted">
        加载中...
      </div>
    );
  }

  if (error || !proxy) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <p className="text-5xl mb-4">😵</p>
        <h2 className="text-xl font-semibold mb-2">{error || "Skill 不存在"}</h2>
        <a href="/" className="text-primary hover:underline">
          返回市场
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* 头部信息 */}
      <div className="mb-4 rounded-2xl border border-border bg-white p-4 md:p-5">
        <div className="flex items-start justify-between gap-4 mb-2">
          <div>
            <p className="text-sm text-primary font-medium mb-2">Skill AI 试用页</p>
            <h1 className="text-2xl font-bold">{proxy.name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full">
                {proxy.domain}
              </span>
              <span className="text-xs bg-gray-100 text-muted px-2.5 py-1 rounded-full">
                AI 先试用
              </span>
              <span className="text-xs bg-gray-100 text-muted px-2.5 py-1 rounded-full">
                可升级真人服务
              </span>
            </div>
          </div>
          <Link
            href={`/proxy/${proxy.id}/edit`}
            className="text-xs border border-border px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors text-muted hover:text-foreground"
          >
            响应侧编辑
          </Link>
        </div>
        {proxy.description && (
          <p className="text-muted text-sm leading-relaxed">{proxy.description}</p>
        )}
        <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-muted">
          <span>{proxy.chunkCount} 条技能素材</span>
          <span>
            创建于{" "}
            {new Date(proxy.createdAt).toLocaleDateString("zh-CN")}
          </span>
          {proxy.fileNames.length > 0 && (
            <span>资料：{proxy.fileNames.join("、")}</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-4 items-start">
        <div className="space-y-3">
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5">
            <p className="text-sm font-medium text-amber-900">使用前请确认风险</p>
            <p className="text-xs text-amber-800 mt-1 leading-relaxed">
              Skill AI 输出仅用于试用和初步判断，不构成法律、医疗、金融、投资等专业最终意见。
              平台仅提供展示、试用和撮合入口；真人服务的范围、价格、交付和责任由双方自行确认。
            </p>
          </div>

          <div className="audition-stage-card">
            <div className="audition-stage-head">
              <span>Skill AI 现场试镜</span>
              <strong>先聊出判断，再决定是否找真人继续。</strong>
            </div>
            <ChatBox
              proxyId={proxy.id}
              onFinishAudition={finishAudition}
              onAuditionActiveChange={handleAuditionActiveChange}
              onAuditionMessagesChange={handleAuditionMessagesChange}
            />
          </div>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-20">
          <div className="rounded-xl border border-border bg-white p-4">
            <p className="font-semibold">试镜流程</p>
            <ol className="text-sm text-muted mt-3 space-y-2 list-decimal list-inside">
              <li>先描述具体问题，或贴一段材料。</li>
              <li>观察回答质量、方法风格和边界感。</li>
              <li>满意后点击「试镜结束，就它了」。</li>
            </ol>
          </div>
          <div className="audition-next-card">
            <span>
              {hasAuditionMessages ? "真人服务入口已就绪" : "还没聊也可以直接联系"}
            </span>
            <strong>
              {hasAuditionMessages
                ? "试镜满意后，再进入信任校验舱。"
                : "跳过试镜，直接进入信任校验舱。"}
            </strong>
            <p>
              {hasAuditionMessages
                ? "这样需求侧不会一上来就被要求留联系方式；响应侧也能获得更有意向的线索。"
                : "如果你已经明确想找真人继续，也可以先完成边界确认，再留下联系方式。"}
            </p>
            <button type="button" onClick={openCurrentIntent}>
              {hasAuditionMessages ? "我已经决定了" : "跳过试镜，直接联系"}
            </button>
          </div>
        </aside>
      </div>

      {/* 评分 */}
      <div className="mt-6 space-y-4">
        <ServiceReviewHighlights proxyId={proxy.id} />
        <RatingStars proxyId={proxy.id} />
      </div>

      {showIntentModal && (
        <div className="audition-intent-modal" role="dialog" aria-modal="true">
          <div className="audition-intent-card">
            <button
              type="button"
              className="audition-intent-close"
              onClick={() => setShowIntentModal(false)}
              aria-label="关闭信任校验舱"
            >
              ×
            </button>
            <div className="audition-intent-head">
              <span>{intentDraft ? "试镜结束，已生成草稿" : "直接联系"}</span>
              <h2>就它了，进入真人服务确认</h2>
              <p>
                {intentDraft
                  ? "我已经把本次试镜整理成需求草稿，你可以修改后再提交给响应侧。"
                  : "先完成风险、隐私和服务边界三重确认，再把联系方式交给响应侧跟进。"}
              </p>
            </div>
            <ServiceIntentBox
              proxyId={proxy.id}
              skillName={proxy.name}
              initialNeed={intentDraft}
            />
          </div>
        </div>
      )}
    </div>
  );
}
