import { NextRequest, NextResponse } from "next/server";
import { appendOne, genId, readAll } from "@/lib/store";
import type { LeadItem } from "@/types/domain";

// GET /api/leads — 响应侧查看真人服务线索
export async function GET() {
  const leads = readAll<LeadItem>("leads").sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  return NextResponse.json({ leads });
}

// POST /api/leads — 需求侧提交真人服务意向
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { proxyId, skillName, customerName, contact, need } = body as {
    proxyId?: string;
    skillName?: string;
    customerName?: string;
    contact?: string;
    need?: string;
  };

  if (!proxyId || !skillName || !customerName || !contact || !need) {
    return NextResponse.json(
      { error: "请填写完整的服务意向信息" },
      { status: 400 }
    );
  }

  const lead: LeadItem = {
    id: genId(),
    proxyId,
    skillName,
    customerName,
    contact,
    need,
    status: "new",
    unlocked: false,
    createdAt: new Date().toISOString(),
  };

  appendOne("leads", lead);

  return NextResponse.json({ lead });
}
