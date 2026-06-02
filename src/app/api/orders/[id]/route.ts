import { NextRequest, NextResponse } from "next/server";
import { updateById } from "@/lib/store";
import type { EscrowOrderItem } from "@/types/domain";

const allowedStatuses: EscrowOrderItem["status"][] = [
  "escrowed",
  "delivered",
  "settled",
  "disputed",
];

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { status } = body as { status?: EscrowOrderItem["status"] };

  if (!status || !allowedStatuses.includes(status)) {
    return NextResponse.json(
      { error: "托管订单状态无效" },
      { status: 400 }
    );
  }

  const now = new Date().toISOString();
  const updated = updateById<EscrowOrderItem>("orders", id, (order) => ({
    ...order,
    status,
    deliveredAt:
      status === "delivered" ? order.deliveredAt || now : order.deliveredAt,
    settledAt: status === "settled" ? order.settledAt || now : order.settledAt,
    disputedAt:
      status === "disputed" ? order.disputedAt || now : order.disputedAt,
  }));

  if (!updated) {
    return NextResponse.json(
      { error: "托管订单不存在" },
      { status: 404 }
    );
  }

  return NextResponse.json({ order: updated });
}
