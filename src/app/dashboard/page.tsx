"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import BuyerIntentCenter from "@/components/dashboard/BuyerIntentCenter";
import EscrowOrderDesk from "@/components/dashboard/EscrowOrderDesk";
import LeadWorkflowBoard from "@/components/dashboard/LeadWorkflowBoard";
import { statusText } from "@/components/dashboard/constants";
import type {
  EscrowOrder,
  LeadItem,
  LeadStatus,
  QuoteDraft,
  ServiceReview,
  SkillFilter,
  SkillItem,
  SkillStatus,
} from "@/types/domain";

const skillStatusText: Record<SkillStatus, string> = {
  live: "上架接单中",
  paused: "已暂停接单",
};

export default function DashboardPage() {
  const [skills, setSkills] = useState<SkillItem[]>([]);
  const [leads, setLeads] = useState<LeadItem[]>([]);
  const [role, setRole] = useState<"provider" | "buyer">("provider");
  const [skillStatuses, setSkillStatuses] = useState<Record<string, SkillStatus>>(
    {}
  );
  const [skillFilter, setSkillFilter] = useState<SkillFilter>("all");
  const [quoteDrafts, setQuoteDrafts] = useState<Record<string, QuoteDraft>>({});
  const [orders, setOrders] = useState<Record<string, EscrowOrder>>({});
  const [serviceReviews, setServiceReviews] = useState<Record<string, ServiceReview>>(
    {}
  );
  const [updatingLeadId, setUpdatingLeadId] = useState("");
  const [updatingOrderId, setUpdatingOrderId] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const savedRole = window.localStorage?.getItem("dashboard-role");
      if (savedRole === "provider" || savedRole === "buyer") {
        setRole(savedRole);
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      window.localStorage?.setItem("dashboard-role", role);
    } catch {}
  }, [role]);

  useEffect(() => {
    Promise.all([
      fetch("/api/proxy").then((r) => r.json()),
      fetch("/api/leads").then((r) => r.json()),
      fetch("/api/quotes").then((r) => r.json()),
      fetch("/api/orders").then((r) => r.json()),
      fetch("/api/service-reviews").then((r) => r.json()),
    ])
      .then(([proxyData, leadData, quoteData, orderData, reviewData]) => {
        const nextSkills = proxyData.proxies || [];
        const nextQuotes = quoteData.quotes || [];
        const nextOrders = orderData.orders || [];
        const nextReviews = reviewData.reviews || [];
        setSkills(nextSkills);
        setSkillStatuses(
          Object.fromEntries(
            nextSkills.map((skill: SkillItem, index: number) => [
              skill.id,
              index === 2 ? "paused" : "live",
            ])
          )
        );
        setLeads(leadData.leads || []);
        setQuoteDrafts(
          Object.fromEntries(
            nextQuotes.map((quote: QuoteDraft) => [quote.leadId, quote])
          )
        );
        setOrders(
          Object.fromEntries(
            nextOrders.map((order: EscrowOrder) => [order.leadId, order])
          )
        );
        setServiceReviews(
          Object.fromEntries(
            nextReviews.map((review: ServiceReview) => [review.orderId, review])
          )
        );
      })
      .finally(() => setLoading(false));
  }, []);

  const summary = useMemo(() => {
    const newLeads = leads.filter((lead) => lead.status === "new").length;
    const activeLeads = leads.filter((lead) =>
      ["new", "contacted", "proposal"].includes(lead.status)
    ).length;
    const wonLeads = leads.filter((lead) => lead.status === "won").length;
    const quotedLeads = leads.filter((lead) => quoteDrafts[lead.id]).length;
    const escrowOrders = Object.values(orders);
    const acceptedOrders = escrowOrders.length;
    const settledOrders = escrowOrders.filter(
      (order) => order.status === "settled"
    ).length;
    const escrowGross = escrowOrders.reduce((sum, order) => sum + order.amount, 0);
    const platformRevenue = escrowOrders.reduce(
      (sum, order) => sum + order.platformFee,
      0
    );
    const liveSkills = skills.filter(
      (skill) => (skillStatuses[skill.id] || "live") === "live"
    ).length;
    return {
      skillCount: skills.length,
      liveSkills,
      leadCount: leads.length,
      newLeads,
      activeLeads,
      wonLeads,
      quotedLeads,
      acceptedOrders,
      settledOrders,
      escrowGross,
      platformRevenue,
    };
  }, [skills, leads, skillStatuses, quoteDrafts, orders]);

  const filteredSkills = useMemo(
    () =>
      skills.filter(
        (skill) =>
          skillFilter === "all" ||
          (skillStatuses[skill.id] || "live") === skillFilter
      ),
    [skills, skillFilter, skillStatuses]
  );

  const updateSkillStatus = (skillId: string, nextStatus: SkillStatus) => {
    setSkillStatuses((current) => ({
      ...current,
      [skillId]: nextStatus,
    }));
  };

  async function updateLeadStatus(id: string, status: LeadStatus) {
    setUpdatingLeadId(id);
    try {
      const res = await fetch(`/api/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "更新失败");
        return;
      }
      setLeads((current) =>
        current.map((lead) => (lead.id === id ? data.lead : lead))
      );
    } catch {
      alert("更新失败，请重试");
    } finally {
      setUpdatingLeadId("");
    }
  }

  async function unlockLeadContact(id: string) {
    setUpdatingLeadId(id);
    try {
      const res = await fetch(`/api/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ unlock: true }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "解锁线索失败");
        return;
      }
      setLeads((current) =>
        current.map((lead) => (lead.id === id ? data.lead : lead))
      );
    } catch {
      alert("解锁线索失败，请重试");
    } finally {
      setUpdatingLeadId("");
    }
  }

  async function createQuoteDraft(lead: LeadItem) {
    setUpdatingLeadId(lead.id);
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
      setQuoteDrafts((current) => ({
        ...current,
        [lead.id]: data.quote,
      }));
    } catch {
      alert("生成报价单失败，请重试");
    } finally {
      setUpdatingLeadId("");
    }
  }

  async function acceptEscrowQuote(lead: LeadItem) {
    const quote = quoteDrafts[lead.id];
    if (!quote) {
      alert("请先等待响应侧生成报价单");
      return;
    }
    setUpdatingLeadId(lead.id);
    try {
      const res = await fetch(`/api/quotes/${quote.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "accepted" }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "接受托管失败");
        return;
      }
      setQuoteDrafts((current) => ({
        ...current,
        [lead.id]: data.quote,
      }));
      const orderRes = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: lead.id,
          quoteId: data.quote.id,
        }),
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok) {
        alert(orderData.error || "创建托管订单失败");
        return;
      }
      setOrders((current) => ({
        ...current,
        [lead.id]: orderData.order,
      }));
      await updateLeadStatus(lead.id, "won");
    } catch {
      alert("接受托管失败，请重试");
    } finally {
      setUpdatingLeadId("");
    }
  }

  async function updateOrderStatus(
    order: EscrowOrder,
    status: EscrowOrder["status"]
  ) {
    setUpdatingOrderId(order.id);
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
      setOrders((current) => ({
        ...current,
        [order.leadId]: data.order,
      }));
    } catch {
      alert("更新托管订单失败，请重试");
    } finally {
      setUpdatingOrderId("");
    }
  }

  async function submitServiceReview(
    order: EscrowOrder,
    stars: number,
    comment: string
  ) {
    setUpdatingOrderId(order.id);
    try {
      const res = await fetch("/api/service-reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.id,
          stars,
          comment,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "提交履约评价失败");
        return;
      }
      setServiceReviews((current) => ({
        ...current,
        [order.id]: data.review,
      }));
    } catch {
      alert("提交履约评价失败，请重试");
    } finally {
      setUpdatingOrderId("");
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <section className="dashboard-hero">
        <div>
          <p className="text-sm text-primary font-semibold mb-2">个人中心</p>
          <h1>统一管理你的 Skill AI</h1>
          <p>
            先用角色模拟，不接真实登录。响应侧在这里管理自己发布的 Skill AI、
            收到的真人服务线索、平台风险提示和手续费规则。
          </p>
        </div>
        <div className="dashboard-actions">
          <Link href="/create">发布新的 Skill</Link>
          <Link href="/leads">查看全部线索</Link>
        </div>
      </section>

      <section className="role-switch-panel">
        <div>
          <p className="text-sm font-semibold">当前模拟角色</p>
          <p className="text-xs text-muted mt-1">
            MVP 阶段先用前端角色切换模拟双边平台，后续再接账号体系和权限隔离。
          </p>
        </div>
        <div className="role-switch">
          <button
            type="button"
            onClick={() => setRole("provider")}
            className={role === "provider" ? "active" : ""}
          >
            响应侧：我发布 Skill
          </button>
          <button
            type="button"
            onClick={() => setRole("buyer")}
            className={role === "buyer" ? "active" : ""}
          >
            需求侧：我寻找服务
          </button>
        </div>
      </section>

      <section className="dashboard-stats">
        {role === "buyer" ? (
          <>
            <StatCard label="我提交的意向" value={summary.leadCount} />
            <StatCard label="收到的报价" value={summary.quotedLeads} />
            <StatCard label="待沟通意向" value={summary.activeLeads} />
            <StatCard label="托管订单" value={summary.acceptedOrders} />
          </>
        ) : (
          <>
            <StatCard label="已发布 Skill" value={summary.skillCount} />
            <StatCard label="上架中 Skill" value={summary.liveSkills} />
            <StatCard label="进行中线索" value={summary.activeLeads} />
            <StatCard label="已结算订单" value={summary.settledOrders} />
          </>
        )}
      </section>

      {loading ? (
        <div className="text-center py-12 text-muted">加载中...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
          <section>
            {role === "buyer" && (
              <div className="dashboard-panel mb-4">
                <h2 className="font-bold">需求侧视角（模拟）</h2>
                <p className="text-sm text-muted mt-2 leading-relaxed">
                  这里模拟需求方个人中心：查看我提交过的真人服务意向、响应侧给出的报价单，
                  并决定是否接受平台托管交易。
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link href="/#skill-market" className="dashboard-link-chip">
                    去 Skill 市场试用
                  </Link>
                  <button
                    type="button"
                    className="dashboard-link-chip"
                    onClick={() => setRole("provider")}
                  >
                    切到响应侧生成报价
                  </button>
                </div>
              </div>
            )}

            {role === "buyer" ? (
              <BuyerIntentCenter
                leads={leads}
                quoteDrafts={quoteDrafts}
                orders={orders}
                serviceReviews={serviceReviews}
                updatingLeadId={updatingLeadId}
                updatingOrderId={updatingOrderId}
                onAcceptQuote={acceptEscrowQuote}
                onOrderStatusChange={updateOrderStatus}
                onSubmitServiceReview={submitServiceReview}
              />
            ) : (
              <>
                <EscrowOrderDesk
                  orders={Object.values(orders)}
                  role="provider"
                  updatingOrderId={updatingOrderId}
                  onOrderStatusChange={updateOrderStatus}
                />

                <section className="dashboard-panel mb-6">
                  <div className="dashboard-section-head">
                    <div>
                      <h2 className="text-xl font-bold">线索工作流</h2>
                      <p className="text-sm text-muted mt-1">
                        把真人服务意向推进为小型 CRM：联系、沟通方案、成交或关闭。
                      </p>
                    </div>
                    <Link href="/leads" className="dashboard-link-chip">
                      打开完整线索后台
                    </Link>
                  </div>
                  <LeadWorkflowBoard
                    leads={leads}
                    quoteDrafts={quoteDrafts}
                    updatingLeadId={updatingLeadId}
                    onUnlockContact={unlockLeadContact}
                    onCreateQuote={createQuoteDraft}
                    onStatusChange={updateLeadStatus}
                  />
                </section>

                <div className="dashboard-section-head">
                  <div>
                    <h2 className="text-xl font-bold">我的 Skill AI</h2>
                    <p className="text-sm text-muted mt-1">
                      每个 Skill 都有一条 DNA：素材、流程、边界、转化。
                    </p>
                  </div>
                  <div className="skill-filter-tabs">
                    {[
                      ["all", "全部"],
                      ["live", "上架中"],
                      ["paused", "暂停中"],
                    ].map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setSkillFilter(value as SkillFilter)}
                        className={skillFilter === value ? "active" : ""}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {skills.length === 0 ? (
                  <EmptyCard
                    title="还没有发布 Skill"
                    description="先发布一个 Skill AI，让需求侧可以试用你的能力。"
                    href="/create"
                    action="发布 Skill"
                  />
                ) : filteredSkills.length === 0 ? (
                  <EmptyCard
                    title="当前筛选下没有 Skill"
                    description="切换筛选条件，或把暂停中的 Skill 恢复上架。"
                    href="/create"
                    action="继续发布 Skill"
                  />
                ) : (
                  <div className="space-y-4">
                    {filteredSkills.map((skill) => (
                      <SkillDnaCard
                        key={skill.id}
                        skill={skill}
                        status={skillStatuses[skill.id] || "live"}
                        leadCount={
                          leads.filter((lead) => lead.proxyId === skill.id).length
                        }
                        onStatusChange={(nextStatus) =>
                          updateSkillStatus(skill.id, nextStatus)
                        }
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </section>

          <aside>
            <div className="dashboard-panel mb-4">
              <h2 className="font-bold">平台收费模型（方案 C）</h2>
              <div className="fee-grid">
                <div>
                  <span>AI Skill 试用</span>
                  <strong>20%</strong>
                  <small>按次调用或小额试用收入抽成</small>
                </div>
                <div>
                  <span>真人线索解锁</span>
                  <strong>按条</strong>
                  <small>响应侧为有效联系方式或高意向需求付费</small>
                </div>
                <div>
                  <span>平台托管交易</span>
                  <strong>10%</strong>
                  <small>后续开放，平台内付款、交付和评价沉淀</small>
                </div>
              </div>
              <p className="text-xs text-muted leading-relaxed mt-3">
                当前 MVP 不接真实支付，也不追踪双方线下私聊成交。先用线索解锁验证供需质量，
                高价值服务再引导到平台托管交易、套餐、订阅和企业采购。
              </p>
            </div>

            <div className="dashboard-panel mb-4">
              <h2 className="font-bold">平台风险提示</h2>
              <ul className="risk-list">
                <li>平台只提供 Skill AI 展示、试用、撮合与交易辅助。</li>
                <li>AI 输出不构成法律、医疗、金融、投资等最终专业意见。</li>
                <li>真人服务前，双方需自行确认范围、价格、交付、隐私与责任边界。</li>
                <li>若双方选择线下沟通，平台不强制追踪成交；需要保障与评价沉淀时，建议走后续平台托管交易。</li>
              </ul>
            </div>

            <div className="dashboard-panel">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-bold">最近线索</h2>
                  <p className="text-xs text-muted mt-1">
                    需求侧通过信任校验舱后生成。
                  </p>
                </div>
                <Link href="/leads" className="text-sm text-primary">
                  全部
                </Link>
              </div>

              {leads.length === 0 ? (
                <p className="text-sm text-muted leading-relaxed">
                  暂无线索。用户进入 Skill 详情页、完成三重确认并提交意向后，
                  这里会显示最近需求。
                </p>
              ) : (
                <div className="space-y-3">
                  {leads.slice(0, 5).map((lead) => (
                    <Link
                      key={lead.id}
                      href={`/proxy/${lead.proxyId}`}
                      className="recent-lead"
                    >
                      <span>{statusText[lead.status]}</span>
                      <strong>{lead.skillName}</strong>
                      <small>
                        {lead.customerName} ·{" "}
                        {lead.unlocked ? lead.contact : "联系方式待解锁"}
                      </small>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="dashboard-panel mt-4">
              <h2 className="font-bold">下一步建议</h2>
              <ul className="dashboard-tips">
                <li>补充更多真实案例，提升素材完整度。</li>
                <li>写清楚“不承诺什么”，降低纠纷风险。</li>
                <li>用真人服务说明承接高价值需求。</li>
              </ul>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="dashboard-stat">
      <p>{label}</p>
      <strong>{value}</strong>
    </div>
  );
}

function SkillDnaCard({
  skill,
  status,
  leadCount,
  onStatusChange,
}: {
  skill: SkillItem;
  status: SkillStatus;
  leadCount: number;
  onStatusChange: (nextStatus: SkillStatus) => void;
}) {
  const materialScore = Math.min(100, Math.max(20, skill.chunkCount * 28));
  const processScore = skill.description.includes("流程") ? 82 : 56;
  const boundaryScore =
    skill.description.includes("边界") || skill.description.includes("不构成")
      ? 86
      : 48;
  const conversionScore = Math.min(100, 38 + leadCount * 22);
  const averageScore = Math.round(
    (materialScore + processScore + boundaryScore + conversionScore) / 4
  );

  return (
    <article className="skill-dna-card">
      <div className="skill-dna-helix" aria-hidden="true">
        {[0, 1, 2, 3, 4, 5].map((index) => (
          <span
            key={index}
            className="skill-dna-gene"
            style={
              {
                "--y": `${12 + index * 14}%`,
                "--r": index % 2 === 0 ? "-14deg" : "14deg",
                "--d": `${index * 0.14}s`,
              } as React.CSSProperties
            }
          />
        ))}
      </div>

      <div className="skill-dna-main">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full">
            {skill.domain}
          </span>
          <span className="text-xs bg-gray-100 text-muted px-2.5 py-1 rounded-full">
            DNA 完整度 {averageScore}%
          </span>
          <span className={`skill-status-pill ${status}`}>
            {skillStatusText[status]}
          </span>
        </div>
        <h3>{skill.name}</h3>
        <p>{skill.description || "暂无描述"}</p>
        <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted">
          <span>{skill.chunkCount} 条技能素材</span>
          <span>{skill.fileNames.length} 个资料来源</span>
          <span>{leadCount} 条线索</span>
        </div>
        <div className="skill-management-row">
          <div>
            <span>线索转化</span>
            <strong>
              {leadCount} 条 / {conversionScore}%
            </strong>
          </div>
          <div className="skill-actions">
            <Link href={`/proxy/${skill.id}/edit`}>编辑资料</Link>
            <Link href="/leads">查看线索</Link>
            <button
              type="button"
              onClick={() =>
                onStatusChange(status === "live" ? "paused" : "live")
              }
            >
              {status === "live" ? "暂停接单" : "恢复上架"}
            </button>
          </div>
        </div>
      </div>

      <div className="skill-dna-metrics">
        <DnaMetric label="素材" value={materialScore} />
        <DnaMetric label="流程" value={processScore} />
        <DnaMetric label="边界" value={boundaryScore} />
        <DnaMetric label="转化" value={conversionScore} />
      </div>
    </article>
  );
}

function DnaMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="dna-metric">
      <div>
        <span>{label}</span>
        <strong>{value}%</strong>
      </div>
      <div className="dna-meter">
        <i style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function EmptyCard({
  title,
  description,
  href,
  action,
}: {
  title: string;
  description: string;
  href: string;
  action: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-white p-8 text-center">
      <p className="text-4xl mb-3">🧬</p>
      <h3 className="font-bold">{title}</h3>
      <p className="text-sm text-muted mt-2 mb-5">{description}</p>
      <Link href={href} className="text-primary text-sm font-semibold">
        {action}
      </Link>
    </div>
  );
}
