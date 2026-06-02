import { NextRequest, NextResponse } from "next/server";
import { findById, updateById } from "@/lib/store";
import type { LeadItem } from "@/types/domain";

const allowedStatuses: LeadItem["status"][] = [
  "new",
  "contacted",
  "proposal",
  "won",
  "closed",
];

// GET /api/leads/[id] — 查看单条线索详情
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const lead = findById<LeadItem>("leads", id);

  if (!lead) {
    return NextResponse.json({ error: "线索不存在" }, { status: 404 });
  }

  return NextResponse.json({ lead });
}

// PATCH /api/leads/[id] — 更新线索状态
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { status, unlock } = body as {
    status?: LeadItem["status"];
    unlock?: boolean;
  };

  if (unlock) {
    const unlocked = updateById<LeadItem>("leads", id, (lead) => ({
      ...lead,
      unlocked: true,
      unlockedAt: lead.unlockedAt || new Date().toISOString(),
    }));

    if (!unlocked) {
      return NextResponse.json({ error: "线索不存在" }, { status: 404 });
    }

    return NextResponse.json({ lead: unlocked });
  }

  if (!status || !allowedStatuses.includes(status)) {
    return NextResponse.json(
      { error: "线索状态无效" },
      { status: 400 }
    );
  }

  const updated = updateById<LeadItem>("leads", id, (lead) => ({
    ...lead,
    status,
  }));

  if (!updated) {
    return NextResponse.json({ error: "线索不存在" }, { status: 404 });
  }

  return NextResponse.json({ lead: updated });
}
