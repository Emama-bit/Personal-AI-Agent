import { NextRequest, NextResponse } from "next/server";
import { genId, readAll, writeAll } from "@/lib/store";
import type { QuoteItem } from "@/types/domain";

function buildQuote({
  leadId,
  skillName,
  need,
}: {
  leadId: string;
  skillName: string;
  need: string;
}): QuoteItem {
  const baseAmount = Math.min(2999, 499 + need.length * 8);
  const amount = Math.ceil(baseAmount / 10) * 10;
  const platformFee = Math.round(amount * 0.1);

  return {
    id: genId(),
    leadId,
    title: `${skillName.replace(" Skill", "")} 真人服务包`,
    amount,
    platformFee,
    providerReceives: amount - platformFee,
    deliveryDays: amount > 1500 ? 7 : 3,
    scope: [
      "确认需求范围与交付边界",
      "提供一次核心方案或诊断结果",
      "包含一次交付后微调沟通",
    ],
    status: "sent",
    createdAt: new Date().toISOString(),
  };
}

export async function GET() {
  const quotes = readAll<QuoteItem>("quotes").sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  return NextResponse.json({ quotes });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { leadId, skillName, need } = body as {
    leadId?: string;
    skillName?: string;
    need?: string;
  };

  if (!leadId || !skillName || !need) {
    return NextResponse.json(
      { error: "请提供线索、Skill 名称和需求内容" },
      { status: 400 }
    );
  }

  const quotes = readAll<QuoteItem>("quotes");
  const existing = quotes.find((quote) => quote.leadId === leadId);
  if (existing) {
    return NextResponse.json({ quote: existing });
  }

  const quote = buildQuote({ leadId, skillName, need });
  writeAll("quotes", [quote, ...quotes]);

  return NextResponse.json({ quote });
}
