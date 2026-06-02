"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { EscrowOrder, LeadItem, LeadStatus, QuoteDraft } from "@/types/domain";

const statusText: Record<LeadStatus, string> = {
  new: "新线索",
  contacted: "已联系",
  proposal: "方案沟通",
  won: "已成交",
  closed: "已关闭",
};

const statusDescription: Record<LeadStatus, string> = {
  new: "刚收到需求，建议先解锁联系方式并完成首次触达。",
  contacted: "已经和需求方建立联系，下一步确认范围、预算和交付物。",
  proposal: "进入方案沟通，可以生成报价单并等待需求侧接受托管。",
  won: "需求已成交，后续可以推进托管订单与交付确认。",
  closed: "线索已关闭，可保留记录但不再继续跟进。",
};

const statusStyle: Record<LeadStatus, string> = {
  new: "bg-primary/10 text-primary",
  contacted: "bg-sky-100 text-sky-700",
  proposal: "bg-amber-100 text-amber-700",
  won: "bg-green-100 text-green-700",
  closed: "bg-gray-100 text-muted",
};

const orderStatusText: Record<EscrowOrder["status"], string> = {
  escrowed: "资金托管中",
  delivered: "服务已交付",
  settled: "已确认结算",
  disputed: "争议处理中",
};

const orderStatusDescription: Record<EscrowOrder["status"], string> = {
  escrowed: "需求侧已接受报价，资金进入平台托管模拟池。",
  delivered: "响应侧已标记交付，等待需求侧确认验收。",
  settled: "需求侧确认完成，平台抽佣后模拟结算给服务者。",
  disputed: "双方对交付或范围存在争议，需要平台辅助记录。",
};

const statusSteps: Array<{
  status: LeadStatus;
  title: string;
  note: string;
}> = [
  {
    status: "new",
    title: "新线索",
    note: "确认需求来源和 Skill 匹配度",
  },
  {
    status: "contacted",
    title: "已联系",
    note: "解锁后完成首次沟通",
  },
  {
    status: "proposal",
    title: "方案沟通",
    note: "生成报价、范围和交付周期",
  },
  {
    status: "won",
    title: "已成交",
    note: "进入平台托管或线下交付记录",
  },
  {
    status: "closed",
    title: "关闭",
    note: "不合适、无响应或需求取消",
  },
];

export default function LeadDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [lead, setLead] = useState<LeadItem | null>(null);
  const [quote, setQuote] = useState<QuoteDraft | null>(null);
  const [order, setOrder] = useState<EscrowOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState("");

  useEffect(() => {
    Promise.all([
      fetch(`/api/leads/${id}`).then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "线索加载失败");
        return data.lead as LeadItem;
      }),
      fetch("/api/quotes").then((res) => res.json()),
      fetch("/api/orders").then((res) => res.json()),
    ])
      .then(([nextLead, quoteData, orderData]) => {
        setLead(nextLead);
        setQuote(
          (quoteData.quotes || []).find(
            (item: QuoteDraft) => item.leadId === nextLead.id
          ) || null
        );
        setOrder(
          (orderData.orders || []).find(
            (item: EscrowOrder) => item.leadId === nextLead.id
          ) || null
        );
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const statusIndex = useMemo(() => {
    if (!lead) return 0;
    return statusSteps.findIndex((step) => step.status === lead.status);
  }, [lead]);

  async function patchLead(body: Partial<Pick<LeadItem, "status">> & { unlock?: boolean }) {
    if (!lead) return;
    setUpdating(body.unlock ? "unlock" : body.status || "");
    try {
      const res = await fetch(`/api/leads/${lead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "更新线索失败");
        return;
      }
      setLead(data.lead);
    } catch {
      alert("更新线索失败，请重试");
    } finally {
      setUpdating("");
    }
  }

  async function createQuote() {
    if (!lead) return;
    setUpdating("quote");
    try {
      const res = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: lead.id,
          skillName: lead.skillName,
          need: lead.need,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "生成报价单失败");
        return;
      }
      setQuote(data.quote);
      setLead((current) =>
        current && current.status === "contacted"
          ? { ...current, status: "proposal" }
          : current
      );
      if (lead.status === "contacted") {
        await patchLead({ status: "proposal" });
      }
    } catch {
      alert("生成报价单失败，请重试");
    } finally {
      setUpdating("");
    }
  }

  async function acceptQuoteAndCreateOrder() {
    if (!lead || !quote) return;
    setUpdating("accept-quote");
    try {
      const quoteRes = await fetch(`/api/quotes/${quote.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "accepted" }),
      });
      const quoteData = await quoteRes.json();
      if (!quoteRes.ok) {
        alert(quoteData.error || "接受报价失败");
        return;
      }
      setQuote(quoteData.quote);

      const orderRes = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: lead.id,
          quoteId: quoteData.quote.id,
        }),
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok) {
        alert(orderData.error || "创建托管订单失败");
        return;
      }
      setOrder(orderData.order);

      const leadRes = await fetch(`/api/leads/${lead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "won" }),
      });
      const leadData = await leadRes.json();
      if (leadRes.ok) {
        setLead(leadData.lead);
      }
    } catch {
      alert("接受报价并创建订单失败，请重试");
    } finally {
      setUpdating("");
    }
  }

  async function updateOrderStatus(status: EscrowOrder["status"]) {
    if (!order) return;
    setUpdating(status);
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "更新托管订单失败");
        return;
      }
      setOrder(data.order);
    } catch {
      alert("更新托管订单失败，请重试");
    } finally {
      setUpdating("");
    }
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12 text-center text-muted">
        加载线索详情中...
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <p className="text-5xl mb-4">🕳️</p>
        <h1 className="text-xl font-semibold mb-2">{error || "线索不存在"}</h1>
        <Link href="/leads" className="text-primary hover:underline">
          返回线索列表
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link href="/leads" className="text-sm text-primary hover:underline">
            ← 返回线索列表
          </Link>
          <p className="mt-3 text-sm font-medium text-primary">线索详情工作台</p>
          <h1 className="mt-1 text-2xl font-bold">{lead.skillName}</h1>
          <p className="mt-2 text-sm text-muted">
            收到于 {new Date(lead.createdAt).toLocaleString("zh-CN")} · 线索 ID：
            {lead.id}
          </p>
        </div>
        <Link
          href={`/proxy/${lead.proxyId}`}
          className="rounded-lg border border-border bg-white px-4 py-2 text-center text-sm text-muted transition-colors hover:text-foreground"
        >
          查看对应 Skill
        </Link>
      </div>

      <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
        <p className="text-sm font-medium text-amber-900">平台边界提醒</p>
        <p className="mt-1 text-xs leading-relaxed text-amber-800">
          当前页面用于响应侧跟进线索。平台先记录需求、解锁联系方式和报价意向；
          真正服务范围、交付质量、责任边界与隐私材料仍需双方在真人沟通前确认。
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <main className="space-y-4">
          <section className="rounded-2xl border border-border bg-white p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <span
                  className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusStyle[lead.status]}`}
                >
                  {statusText[lead.status]}
                </span>
                <h2 className="mt-3 text-xl font-semibold">
                  {lead.customerName} 提交的真人服务意向
                </h2>
                <p className="mt-2 text-sm text-muted">
                  {statusDescription[lead.status]}
                </p>
              </div>
              <div
                className={`rounded-xl px-3 py-2 text-sm ${
                  lead.unlocked
                    ? "bg-green-50 text-green-700"
                    : "bg-amber-50 text-amber-700"
                }`}
              >
                {lead.unlocked ? "联系方式已解锁" : "联系方式待解锁"}
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <InfoBox label="需求方称呼" value={lead.customerName} />
              <InfoBox
                label="联系方式"
                value={lead.unlocked ? lead.contact : "支付线索解锁费后可见"}
                muted={!lead.unlocked}
              />
            </div>

            {!lead.unlocked && (
              <button
                type="button"
                onClick={() => patchLead({ unlock: true })}
                disabled={updating === "unlock"}
                className="mt-4 rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-600 disabled:opacity-60"
              >
                {updating === "unlock"
                  ? "解锁中..."
                  : "模拟支付 ¥9 解锁联系方式"}
              </button>
            )}
          </section>

          <section className="rounded-2xl border border-border bg-white p-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">需求草稿 / 试镜摘要</p>
                <p className="mt-1 text-xs text-muted">
                  这里展示需求侧从 Skill 试镜后提交的完整说明，响应侧可据此沟通报价。
                </p>
              </div>
            </div>
            <div className="rounded-xl bg-gray-50 p-4">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                {lead.need}
              </p>
            </div>
          </section>
        </main>

        <aside className="space-y-4 lg:sticky lg:top-20">
          <section className="rounded-2xl border border-border bg-white p-5">
            <p className="font-semibold">线索状态流</p>
            <div className="mt-4 space-y-3">
              {statusSteps.map((step, index) => {
                const active = step.status === lead.status;
                const passed = index < statusIndex;
                return (
                  <button
                    key={step.status}
                    type="button"
                    onClick={() => patchLead({ status: step.status })}
                    disabled={updating === step.status || active}
                    className={`w-full rounded-xl border p-3 text-left transition-colors ${
                      active
                        ? "border-primary/30 bg-primary/10"
                        : passed
                          ? "border-green-200 bg-green-50"
                          : "border-border bg-white hover:bg-gray-50"
                    } disabled:cursor-default disabled:opacity-80`}
                  >
                    <span className="text-sm font-semibold">{step.title}</span>
                    <small className="mt-1 block text-xs leading-relaxed text-muted">
                      {step.note}
                    </small>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-white p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold">报价入口</p>
                <p className="mt-1 text-xs leading-relaxed text-muted">
                  根据需求草稿自动生成 MVP 报价单，需求侧可在个人中心接受托管。
                </p>
              </div>
            </div>

            {quote ? (
              <>
                <QuoteCard quote={quote} />
                {!order && (
                  <button
                    type="button"
                    onClick={acceptQuoteAndCreateOrder}
                    disabled={updating === "accept-quote"}
                    className="mt-3 w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-dark disabled:opacity-60"
                  >
                    {updating === "accept-quote"
                      ? "创建托管订单中..."
                      : quote.status === "accepted"
                        ? "创建托管订单"
                        : "模拟需求侧接受报价并托管"}
                  </button>
                )}
              </>
            ) : (
              <button
                type="button"
                onClick={createQuote}
                disabled={updating === "quote"}
                className="mt-4 w-full rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {updating === "quote" ? "生成中..." : "生成报价单"}
              </button>
            )}
          </section>

          {order && (
            <section className="rounded-2xl border border-border bg-white p-5">
              <p className="font-semibold">托管订单</p>
              <p className="mt-1 text-xs leading-relaxed text-muted">
                这里模拟平台内成交后的资金托管、交付、确认和争议记录。
              </p>
              <OrderCard
                order={order}
                updating={updating}
                onStatusChange={updateOrderStatus}
              />
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}

function InfoBox({
  label,
  value,
  muted = false,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-gray-50 px-4 py-3">
      <p className="text-xs text-muted">{label}</p>
      <p
        className={`mt-1 text-sm font-medium ${
          muted ? "text-muted" : "text-foreground"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function QuoteCard({ quote }: { quote: QuoteDraft }) {
  return (
    <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="rounded-full bg-white px-2 py-1 text-xs font-medium text-primary">
            {quote.status === "accepted" ? "需求侧已接受" : "已发送报价"}
          </span>
          <p className="mt-3 font-semibold">{quote.title}</p>
          <p className="mt-1 text-xs text-muted">
            预计 {quote.deliveryDays} 天交付
          </p>
        </div>
        <strong className="text-2xl">¥{quote.amount}</strong>
      </div>
      <div className="mt-4 space-y-2">
        {quote.scope.map((item) => (
          <span
            key={item}
            className="block rounded-lg bg-white px-3 py-2 text-xs text-muted"
          >
            {item}
          </span>
        ))}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-lg bg-white p-3">
          <span className="text-muted">平台抽成</span>
          <strong className="mt-1 block text-base">¥{quote.platformFee}</strong>
        </div>
        <div className="rounded-lg bg-white p-3">
          <span className="text-muted">服务者预计到账</span>
          <strong className="mt-1 block text-base text-green-700">
            ¥{quote.providerReceives}
          </strong>
        </div>
      </div>
    </div>
  );
}

function OrderCard({
  order,
  updating,
  onStatusChange,
}: {
  order: EscrowOrder;
  updating: string;
  onStatusChange: (status: EscrowOrder["status"]) => void;
}) {
  return (
    <div className="mt-4 rounded-xl border border-green-200 bg-green-50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="rounded-full bg-white px-2 py-1 text-xs font-medium text-green-700">
            {orderStatusText[order.status]}
          </span>
          <p className="mt-3 font-semibold">{order.title}</p>
          <p className="mt-1 text-xs leading-relaxed text-muted">
            {orderStatusDescription[order.status]}
          </p>
        </div>
        <strong className="text-2xl">¥{order.amount}</strong>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-lg bg-white p-3">
          <span className="text-muted">平台抽成</span>
          <strong className="mt-1 block text-base">¥{order.platformFee}</strong>
        </div>
        <div className="rounded-lg bg-white p-3">
          <span className="text-muted">服务者到账</span>
          <strong className="mt-1 block text-base text-green-700">
            ¥{order.providerReceives}
          </strong>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        {(
          [
            ["escrowed", "资金托管"],
            ["delivered", "标记交付"],
            ["settled", "确认结算"],
            ["disputed", "标记争议"],
          ] as const
        ).map(([status, label]) => (
          <button
            key={status}
            type="button"
            onClick={() => onStatusChange(status)}
            disabled={updating === status || order.status === status}
            className={`rounded-lg border px-3 py-2 text-xs transition-colors ${
              order.status === status
                ? "border-green-300 bg-white text-green-700"
                : "border-green-200 bg-white/70 text-muted hover:text-foreground"
            } disabled:cursor-default disabled:opacity-70`}
          >
            {updating === status ? "更新中..." : label}
          </button>
        ))}
      </div>
    </div>
  );
}
