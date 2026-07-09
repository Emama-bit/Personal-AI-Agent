import { genId, readAll, writeAll, updateById } from "../lib/store";
import type { EscrowOrderItem, LeadItem, QuoteItem } from "../types/domain";

const allowedStatuses: EscrowOrderItem["status"][] = [
  "escrowed",
  "delivered",
  "settled",
  "disputed",
];

export async function handleListOrders(): Promise<string> {
  const orders = readAll<EscrowOrderItem>("orders").sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  return JSON.stringify({ orders });
}

export async function handleCreateOrder(input: {
  leadId: string;
  quoteId: string;
}): Promise<string> {
  if (!input.leadId || !input.quoteId) {
    return JSON.stringify({ error: "请提供线索和报价单信息" });
  }

  const leads = readAll<LeadItem>("leads");
  const quotes = readAll<QuoteItem>("quotes");
  const lead = leads.find((item) => item.id === input.leadId);
  const quote = quotes.find((item) => item.id === input.quoteId);

  if (!lead || !quote) {
    return JSON.stringify({ error: "线索或报价单不存在" });
  }

  if (quote.status !== "accepted") {
    return JSON.stringify({ error: "报价单尚未被需求方接受" });
  }

  const orders = readAll<EscrowOrderItem>("orders");
  const existing = orders.find((order) => order.quoteId === input.quoteId);
  if (existing) return JSON.stringify({ order: existing });

  const order: EscrowOrderItem = {
    id: genId(),
    leadId: input.leadId,
    quoteId: input.quoteId,
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
  return JSON.stringify({ order });
}

export async function handleUpdateOrder(input: {
  id: string;
  status: EscrowOrderItem["status"];
}): Promise<string> {
  if (!input.status || !allowedStatuses.includes(input.status)) {
    return JSON.stringify({ error: "托管订单状态无效" });
  }

  const now = new Date().toISOString();
  const updated = updateById<EscrowOrderItem>("orders", input.id, (order) => ({
    ...order,
    status: input.status,
    deliveredAt:
      input.status === "delivered" ? order.deliveredAt || now : order.deliveredAt,
    settledAt:
      input.status === "settled" ? order.settledAt || now : order.settledAt,
    disputedAt:
      input.status === "disputed" ? order.disputedAt || now : order.disputedAt,
  }));

  if (!updated) return JSON.stringify({ error: "托管订单不存在" });
  return JSON.stringify({ order: updated });
}
