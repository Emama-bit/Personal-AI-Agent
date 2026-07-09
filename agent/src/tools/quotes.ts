import { genId, readAll, writeAll, updateById } from "../lib/store";
import type { QuoteItem } from "../types/domain";

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

export async function handleListQuotes(): Promise<string> {
  const quotes = readAll<QuoteItem>("quotes").sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  return JSON.stringify({ quotes });
}

export async function handleCreateQuote(input: {
  leadId: string;
  skillName: string;
  need: string;
}): Promise<string> {
  if (!input.leadId || !input.skillName || !input.need) {
    return JSON.stringify({ error: "请提供线索、Skill 名称和需求内容" });
  }

  const quotes = readAll<QuoteItem>("quotes");
  const existing = quotes.find((q) => q.leadId === input.leadId);
  if (existing) return JSON.stringify({ quote: existing });

  const quote = buildQuote(input);
  writeAll("quotes", [quote, ...quotes]);
  return JSON.stringify({ quote });
}

export async function handleAcceptQuote(input: { id: string }): Promise<string> {
  const updated = updateById<QuoteItem>("quotes", input.id, (quote) => ({
    ...quote,
    status: "accepted" as const,
    acceptedAt: new Date().toISOString(),
  }));

  if (!updated) return JSON.stringify({ error: "报价单不存在" });
  return JSON.stringify({ quote: updated });
}
