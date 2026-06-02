import { NextRequest, NextResponse } from "next/server";
import { genId, readAll, writeAll } from "@/lib/store";
import type { EscrowOrderItem, ServiceReviewItem } from "@/types/domain";

function buildStats(reviews: ServiceReviewItem[]) {
  const avg =
    reviews.length > 0
      ? reviews.reduce((sum, review) => sum + review.stars, 0) / reviews.length
      : 0;

  return {
    avgRating: Math.round(avg * 10) / 10,
    reviewCount: reviews.length,
  };
}

// GET /api/service-reviews?proxyId=xxx — 查看真人服务履约评价
export async function GET(req: NextRequest) {
  const proxyId = req.nextUrl.searchParams.get("proxyId");
  const orderId = req.nextUrl.searchParams.get("orderId");
  let reviews = readAll<ServiceReviewItem>("service-reviews").sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  if (proxyId) {
    reviews = reviews.filter((review) => review.proxyId === proxyId);
  }

  if (orderId) {
    reviews = reviews.filter((review) => review.orderId === orderId);
  }

  return NextResponse.json({
    reviews,
    ...buildStats(reviews),
  });
}

// POST /api/service-reviews — 需求侧在托管订单结算后评价真人服务
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { orderId, stars, comment = "" } = body as {
    orderId?: string;
    stars?: number;
    comment?: string;
  };

  if (!orderId) {
    return NextResponse.json({ error: "请提供订单信息" }, { status: 400 });
  }

  if (!stars || stars < 1 || stars > 5) {
    return NextResponse.json(
      { error: "评分必须在 1-5 之间" },
      { status: 400 }
    );
  }

  const order = readAll<EscrowOrderItem>("orders").find(
    (item) => item.id === orderId
  );

  if (!order) {
    return NextResponse.json({ error: "托管订单不存在" }, { status: 404 });
  }

  if (order.status !== "settled") {
    return NextResponse.json(
      { error: "订单确认结算后才能评价真人服务" },
      { status: 400 }
    );
  }

  const reviews = readAll<ServiceReviewItem>("service-reviews");
  const existing = reviews.find((review) => review.orderId === orderId);

  if (existing) {
    return NextResponse.json({
      review: existing,
      ...buildStats(reviews.filter((review) => review.proxyId === existing.proxyId)),
    });
  }

  const review: ServiceReviewItem = {
    id: genId(),
    orderId: order.id,
    leadId: order.leadId,
    proxyId: order.proxyId,
    skillName: order.skillName,
    customerName: order.customerName,
    stars,
    comment,
    createdAt: new Date().toISOString(),
  };

  const nextReviews = [review, ...reviews];
  writeAll("service-reviews", nextReviews);

  return NextResponse.json({
    review,
    ...buildStats(nextReviews.filter((item) => item.proxyId === review.proxyId)),
  });
}
