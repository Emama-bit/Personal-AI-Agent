import { NextRequest, NextResponse } from "next/server";
import { updateById } from "@/lib/store";
import type { QuoteItem } from "@/types/domain";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { status } = body as { status?: QuoteItem["status"] };

  if (status !== "accepted") {
    return NextResponse.json(
      { error: "报价单状态无效" },
      { status: 400 }
    );
  }

  const updated = updateById<QuoteItem>("quotes", id, (quote) => ({
    ...quote,
    status,
    acceptedAt: new Date().toISOString(),
  }));

  if (!updated) {
    return NextResponse.json({ error: "报价单不存在" }, { status: 404 });
  }

  return NextResponse.json({ quote: updated });
}
