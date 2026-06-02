"use client";

import { useEffect, useState } from "react";
import type { ServiceReview } from "@/types/domain";

export default function ServiceReviewHighlights({ proxyId }: { proxyId: string }) {
  const [reviews, setReviews] = useState<ServiceReview[]>([]);
  const [avgRating, setAvgRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);

  useEffect(() => {
    fetch(`/api/service-reviews?proxyId=${proxyId}`)
      .then((res) => res.json())
      .then((data) => {
        setReviews(data.reviews || []);
        setAvgRating(data.avgRating || 0);
        setReviewCount(data.reviewCount || 0);
      })
      .catch(() => {});
  }, [proxyId]);

  return (
    <section className="service-proof-card">
      <div className="service-proof-head">
        <div>
          <p className="text-sm font-semibold text-primary">真人服务履约背书</p>
          <h2>成交后的真实口碑沉淀</h2>
        </div>
        <div className="service-proof-score">
          <strong>{reviewCount > 0 ? avgRating : "—"}</strong>
          <span>{reviewCount} 条履约评价</span>
        </div>
      </div>

      {reviewCount === 0 ? (
        <div className="service-proof-empty">
          <strong>暂无真人服务评价</strong>
          <span>
            需求侧在托管订单确认结算后，评价会沉淀到这里，作为 Skill 的履约背书。
          </span>
        </div>
      ) : (
        <div className="service-proof-list">
          {reviews.slice(0, 3).map((review) => (
            <article key={review.id} className="service-proof-review">
              <div>
                <span>{"★".repeat(review.stars)}</span>
                <small>
                  {review.customerName} ·{" "}
                  {new Date(review.createdAt).toLocaleDateString("zh-CN")}
                </small>
              </div>
              <p>{review.comment || "需求侧确认服务已完成，未留下文字评价。"}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
