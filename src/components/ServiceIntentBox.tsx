"use client";

import { useEffect, useState } from "react";

export default function ServiceIntentBox({
  proxyId,
  skillName,
  initialNeed = "",
}: {
  proxyId: string;
  skillName: string;
  initialNeed?: string;
}) {
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [need, setNeed] = useState("");
  const [riskConfirmed, setRiskConfirmed] = useState(false);
  const [privacyConfirmed, setPrivacyConfirmed] = useState(false);
  const [scopeConfirmed, setScopeConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const trustUnlocked = riskConfirmed && privacyConfirmed && scopeConfirmed;

  useEffect(() => {
    if (!initialNeed.trim()) return;
    setNeed((current) => (current.trim() ? current : initialNeed));
  }, [initialNeed]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!trustUnlocked) {
      alert("请先完成信任校验舱的三重确认");
      return;
    }
    if (!name.trim() || !contact.trim() || !need.trim()) {
      alert("请填写称呼、联系方式和需求说明");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proxyId,
          skillName,
          customerName: name.trim(),
          contact: contact.trim(),
          need: need.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "提交失败");
        return;
      }
      setSubmitted(true);
    } catch {
      alert("提交失败，请重试");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-4">
        <p className="font-medium text-green-800">意向已提交</p>
        <p className="text-sm text-green-700 mt-1">
          响应侧可以在线索后台查看并跟进你的真人服务需求。
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-xl border border-border bg-white p-4 space-y-2.5">
      <div>
        <p className="font-semibold">信任校验舱</p>
        <p className="text-xs text-muted mt-1">
          AI 试用后，如果你觉得「{skillName}」靠谱，先完成三重确认，再留下真人服务意向。
          MVP 阶段只记录线索，后续可接入线索解锁和平台托管交易。
        </p>
      </div>

      {initialNeed.trim() && (
        <div className="intent-draft-banner">
          <strong>已根据本次试镜生成需求草稿</strong>
          <span>你可以直接修改下面的需求说明，再提交给响应侧。</span>
        </div>
      )}

      <div className={`trust-mini-chamber compact ${trustUnlocked ? "unlocked" : ""}`}>
        <div className="trust-mini-ring ring-a" />
        <div className="trust-mini-ring ring-b" />
        <div className="trust-mini-core">
          <strong>{trustUnlocked ? "线索已解锁" : "等待确认"}</strong>
          <span>{trustUnlocked ? "可以提交真人服务意向" : "完成三重确认后继续"}</span>
        </div>
      </div>

      <div className="space-y-2">
        <TrustCheck
          checked={riskConfirmed}
          onClick={() => setRiskConfirmed((value) => !value)}
          title="风险提示已读"
          description="AI 输出仅供试用和初步判断，不构成专业最终意见。"
        />
        <TrustCheck
          checked={privacyConfirmed}
          onClick={() => setPrivacyConfirmed((value) => !value)}
          title="隐私资料授权"
          description="我确认自行决定是否提供联系方式和需求材料。"
        />
        <TrustCheck
          checked={scopeConfirmed}
          onClick={() => setScopeConfirmed((value) => !value)}
          title="服务边界确认"
          description="真人服务范围、报价、交付和责任由双方另行确认；如需保障，可选择后续平台托管交易。"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="你的称呼"
          className="border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <input
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          placeholder="联系方式（微信/邮箱/手机）"
          className="border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>
      <textarea
        value={need}
        onChange={(e) => setNeed(e.target.value)}
        placeholder="简单描述你的需求、预算或希望真人帮你完成什么..."
        rows={3}
        className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-y"
      />
      <button
        type="submit"
        disabled={submitting || !trustUnlocked}
        className="w-full bg-foreground text-white py-2.5 rounded-lg hover:opacity-90 transition-opacity text-sm font-medium disabled:opacity-45 disabled:cursor-not-allowed"
      >
        {submitting
          ? "提交中..."
          : trustUnlocked
            ? "提交真人服务意向"
            : "完成校验后解锁提交"}
      </button>
      <p className="text-xs text-muted leading-relaxed">
        提交前请自行确认服务范围、交付标准、报价和风险边界。平台先通过线索解锁收费，
        不强追线下成交；后续托管交易开放后再按平台内成交抽成。
      </p>
    </form>
  );
}

function TrustCheck({
  checked,
  onClick,
  title,
  description,
}: {
  checked: boolean;
  onClick: () => void;
  title: string;
  description: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`trust-check ${checked ? "checked" : ""}`}
    >
      <span className="trust-check-dot">{checked ? "✓" : ""}</span>
      <span>
        <strong>{title}</strong>
        <small>{description}</small>
      </span>
    </button>
  );
}
