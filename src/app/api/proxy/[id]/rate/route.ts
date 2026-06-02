import { NextRequest, NextResponse } from "next/server";
import { readAll, appendOne, writeAll, genId } from "@/lib/store";

interface Rating {
  id: string;
  proxyId: string;
  stars: number;
  comment: string;
  createdAt: string;
}

// POST /api/proxy/[id]/rate — 提交评分
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { stars, comment = "" } = body as {
    stars: number;
    comment?: string;
  };

  if (!stars || stars < 1 || stars > 5) {
    return NextResponse.json(
      { error: "评分必须在 1-5 之间" },
      { status: 400 }
    );
  }

  const rating: Rating = {
    id: genId(),
    proxyId: id,
    stars,
    comment,
    createdAt: new Date().toISOString(),
  };

  appendOne("ratings", rating);

  // 计算平均分
  const allRatings = readAll<Rating>("ratings").filter((r) => r.proxyId === id);
  const avg =
    allRatings.reduce((sum, r) => sum + r.stars, 0) / allRatings.length;

  return NextResponse.json({
    rating,
    avgRating: Math.round(avg * 10) / 10,
    ratingCount: allRatings.length,
  });
}

// GET /api/proxy/[id]/rate — 获取评分列表
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const allRatings = readAll<Rating>("ratings").filter((r) => r.proxyId === id);

  const avg =
    allRatings.length > 0
      ? allRatings.reduce((sum, r) => sum + r.stars, 0) / allRatings.length
      : 0;

  return NextResponse.json({
    ratings: allRatings,
    avgRating: Math.round(avg * 10) / 10,
    ratingCount: allRatings.length,
  });
}
