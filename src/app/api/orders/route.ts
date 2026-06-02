import { NextRequest, NextResponse } from "next/server";
import { genId, readAll, writeAll } from "@/lib/store";
import type { EscrowOrderItem, LeadItem, QuoteItem } from "@/types/domain";

export async function GET() {
  const orders = readAll<EscrowOrderItem>("orders").sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  return NextResponse.json({ orders });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { leadId, quoteId } = body as {
    leadId?: string;
    quoteId?: string;
  };

  if (!leadId || !quoteId) {
    return NextResponse.json(
      { error: "请提供线索和报价单信息" },
      { status: 400 }
    );
  }

  const leads = readAll<LeadItem>("leads");
  const quotes = readAll<QuoteItem>("quotes");
  const lead = leads.find((item) => item.id === leadId);
  const quote = quotes.find((item) => item.id === quoteId);

  if (!lead || !quote) {
    return NextResponse.json(
      { error: "线索或报价单不存在" },
      { status: 404 }
    );
  }

  if (quote.status !== "accepted") {
    return NextResponse.json(
      { error: "报价单尚未被需求方接受" },
      { status: 400 }
    );
  }

  const orders = readAll<EscrowOrderItem>("orders");
  const existing = orders.find((order) => order.quoteId === quoteId);
  if (existing) {
    return NextResponse.json({ order: existing });
  }

  const order: EscrowOrderItem = {
    id: genId(),
    leadId,
    quoteId,
    proxyId: lead.proxyId,
    skillName: lead.skillName,
    customerName: lead.customerName,
    title: quote.title,
    amount: quote.amount,
    platformFee: quote.platformFee,
    providerReceives: quote.providerReceives,
    status: "escrowed",
    createdAt: new Date().toISOString(),
  };

  writeAll("orders", [order, ...orders]);
  return NextResponse.json({ order });
}
