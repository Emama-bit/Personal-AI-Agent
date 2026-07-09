import { genId, readAll, writeAll } from "../lib/store";
import type { EscrowOrderItem, ServiceReviewItem } from "../types/domain";

function buildStats(reviews: ServiceReviewItem[]) {
  const avg =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.stars, 0) / reviews.length
      : 0;
  return {
    avgRating: Math.round(avg * 10) / 10,
    reviewCount: reviews.length,
  };
}

export async function handleListReviews(input: {
  proxyId?: string;
  orderId?: string;
}): Promise<string> {
  let reviews = readAll<ServiceReviewItem>("service-reviews").sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  if (input.proxyId) {
    reviews = reviews.filter((r) => r.proxyId === input.proxyId);
  }
  if (input.orderId) {
    reviews = reviews.filter((r) => r.orderId === input.orderId);
  }

  return JSON.stringify({ reviews, ...buildStats(reviews) });
}

export async function handleCreateReview(input: {
  orderId: string;
  stars: number;
  comment?: string;
}): Promise<string> {
  if (!input.orderId) return JSON.stringify({ error: "请提供订单信息" });
  if (!input.stars || input.stars < 1 || input.stars > 5) {
    return JSON.stringify({ error: "评分必须在 1-5 之间" });
  }

  const order = readAll<EscrowOrderItem>("orders").find(
    (o) => o.id === input.orderId
  );
  if (!order) return JSON.stringify({ error: "托管订单不存在" });

  if (order.status !== "settled") {
    return JSON.stringify({ error: "订单确认结算后才能评价真人服务" });
  }

  const reviews = readAll<ServiceReviewItem>("service-reviews");
  const existing = reviews.find((r) => r.orderId === input.orderId);
  if (existing) {
    return JSON.stringify({
      review: existing,
      ...buildStats(reviews.filter((r) => r.proxyId === existing.proxyId)),
    });
  }

  const review: ServiceReviewItem = {
    id: genId(),
    orderId: order.id,
    leadId: order.leadId,
    proxyId: order.proxyId,
    skillName: order.skillName,
    customerName: order.customerName,
    stars: input.stars,
    comment: input.comment || "",
    createdAt: new Date().toISOString(),
  };

  const nextReviews = [review, ...reviews];
  writeAll("service-reviews", nextReviews);

  return JSON.stringify({
    review,
    ...buildStats(nextReviews.filter((r) => r.proxyId === review.proxyId)),
  });
}
