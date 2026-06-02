"use client";

import { useState } from "react";
import Link from "next/link";
import type {
  EscrowOrder,
  LeadItem,
  QuoteDraft,
  ServiceReview,
} from "@/types/domain";
import { statusText } from "./constants";
import { EscrowOrderCard } from "./EscrowOrderDesk";
import QuoteDraftCard from "./QuoteDraftCard";

export default function BuyerIntentCenter({
  leads,
  quoteDrafts,
  orders,
  serviceReviews,
  updatingLeadId,
  updatingOrderId,
  onAcceptQuote,
  onOrderStatusChange,
  onSubmitServiceReview,
}: {
  leads: LeadItem[];
  quoteDrafts: Record<string, QuoteDraft>;
  orders: Record<string, EscrowOrder>;
  serviceReviews: Record<string, ServiceReview>;
  updatingLeadId: string;
  updatingOrderId: string;
  onAcceptQuote: (lead: LeadItem) => void;
  onOrderStatusChange: (
    order: EscrowOrder,
    status: EscrowOrder["status"]
  ) => void;
  onSubmitServiceReview: (
    order: EscrowOrder,
    stars: number,
    comment: string
  ) => void;
}) {
  if (leads.length === 0) {
    return (
      <div className="dashboard-panel buyer-empty-center">
        <p className="text-4xl">🧭</p>
        <h2>还没有提交过真人服务意向</h2>
        <p>
          先去 Skill 市场试用一个 Skill AI，完成信任校验后提交意向，这里会出现你的需求进度。
        </p>
        <Link href="/#skill-market" className="dashboard-link-chip">
          去 Skill 市场试用
        </Link>
      </div>
    );
  }

  return (
    <section className="dashboard-panel buyer-intent-center">
      <div className="dashboard-section-head">
        <div>
          <h2 className="text-xl font-bold">我的服务意向</h2>
          <p className="text-sm text-muted mt-1">
            需求侧可以看到自己提交过的意向、收到的报价单，以及是否接受平台托管交易。
          </p>
        </div>
      </div>
      <div className="buyer-acceptance-note">
        <strong>需求侧验收规则</strong>
        <span>
          接受托管后，资金先进入平台模拟托管；响应侧交付后，你可以确认验收并放款，也可以发起争议暂停结算。
        </span>
      </div>
      <div className="buyer-intent-list">
        {leads.map((lead) => {
          const quote = quoteDrafts[lead.id];
          const order = orders[lead.id];
          const serviceReview = order ? serviceReviews[order.id] : undefined;
          const quoteAccepted = quote?.status === "accepted";
          const hasOrder = Boolean(order);
          return (
            <article key={lead.id} className="buyer-intent-card">
              <div className="buyer-intent-top">
                <span className={`lead-status-chip ${lead.status}`}>
                  {hasOrder
                    ? "托管订单中"
                    : quoteAccepted
                      ? "报价已接受"
                      : statusText[lead.status]}
                </span>
                <small>{new Date(lead.createdAt).toLocaleString("zh-CN")}</small>
              </div>
              <h3>{lead.skillName}</h3>
              <p className="buyer-intent-need">{lead.need}</p>

              {quote ? (
                <>
                  <QuoteDraftCard quote={quote} />
                  <div className="buyer-escrow-panel">
                    <div>
                      <strong>
                        {hasOrder
                          ? "托管交易进行中"
                          : quoteAccepted
                            ? "报价已接受，等待创建托管订单"
                            : "是否接受平台托管交易？"}
                      </strong>
                      <span>
                        {hasOrder
                          ? "在交付前资金处于平台托管模拟状态；交付后你可以确认验收或发起争议。"
                          : quoteAccepted
                            ? "如果订单没有自动生成，可以在这里补建托管订单，保证交易状态不断档。"
                          : "接受后模拟需求方将款项托管到平台，确认交付后再结算给服务者。"}
                      </span>
                    </div>
                    <button
                      type="button"
                      disabled={hasOrder || updatingLeadId === lead.id}
                      onClick={() => onAcceptQuote(lead)}
                    >
                      {hasOrder
                        ? "已进入托管"
                        : quoteAccepted
                          ? "补建托管订单"
                          : updatingLeadId === lead.id
                            ? "处理中..."
                            : "接受托管交易"}
                    </button>
                  </div>
                  {order && (
                    <>
                      <EscrowOrderCard
                        order={order}
                        role="buyer"
                        updating={updatingOrderId === order.id}
                        onOrderStatusChange={onOrderStatusChange}
                      />
                      <ServiceReviewPanel
                        order={order}
                        review={serviceReview}
                        updating={updatingOrderId === order.id}
                        onSubmit={onSubmitServiceReview}
                      />
                    </>
                  )}
                </>
              ) : (
                <div className="buyer-waiting-quote">
                  <strong>等待响应侧报价</strong>
                  <span>
                    当前意向已进入平台记录。响应侧进入方案沟通并生成报价单后，这里会显示托管金额和服务范围。
                  </span>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}

function ServiceReviewPanel({
  order,
  review,
  updating,
  onSubmit,
}: {
  order: EscrowOrder;
  review?: ServiceReview;
  updating: boolean;
  onSubmit: (order: EscrowOrder, stars: number, comment: string) => void;
}) {
  const [stars, setStars] = useState(5);
  const [comment, setComment] = useState("");

  if (review) {
    return (
      <div className="service-review-panel submitted">
        <div>
          <strong>真人服务履约评价已沉淀</strong>
          <span>
            {"★".repeat(review.stars)} ·{" "}
            {new Date(review.createdAt).toLocaleString("zh-CN")}
          </span>
        </div>
        <p>{review.comment || "已确认服务完成，未留下文字评价。"}</p>
      </div>
    );
  }

  if (order.status !== "settled") {
    return (
      <div className="service-review-panel locked">
        <strong>确认验收后可评价真人服务</strong>
        <span>
          评价只在订单确认结算后开放，会沉淀到 Skill 详情页作为履约背书。
        </span>
      </div>
    );
  }

  return (
    <div className="service-review-panel">
      <div>
        <strong>评价这次真人服务</strong>
        <span>你的评价会展示在 Skill 详情页，帮助其他需求侧判断服务质量。</span>
      </div>
      <div className="service-review-stars" aria-label="选择评分">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setStars(star)}
            className={star <= stars ? "active" : ""}
          >
            ★
          </button>
        ))}
      </div>
      <textarea
        value={comment}
        onChange={(event) => setComment(event.target.value)}
        rows={2}
        placeholder="例如：响应速度、交付质量、边界说明是否清晰..."
      />
      <button
        type="button"
        disabled={updating}
        onClick={() => onSubmit(order, stars, comment)}
      >
        {updating ? "提交中..." : "提交履约评价"}
      </button>
    </div>
  );
}
