import { appendOne, genId, readAll, findById, updateById } from "../lib/store";
import type { LeadItem } from "../types/domain";

const allowedStatuses: LeadItem["status"][] = [
  "new",
  "contacted",
  "proposal",
  "won",
  "closed",
];

export async function handleListLeads(): Promise<string> {
  const leads = readAll<LeadItem>("leads").sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  return JSON.stringify({ leads });
}

export async function handleGetLead(input: { id: string }): Promise<string> {
  const lead = findById<LeadItem>("leads", input.id);
  if (!lead) return JSON.stringify({ error: "线索不存在" });
  return JSON.stringify({ lead });
}

export async function handleCreateLead(input: {
  proxyId: string;
  skillName: string;
  customerName: string;
  contact: string;
  need: string;
}): Promise<string> {
  if (!input.proxyId || !input.skillName || !input.customerName || !input.contact || !input.need) {
    return JSON.stringify({ error: "请填写完整的服务意向信息" });
  }

  const lead: LeadItem = {
    id: genId(),
    proxyId: input.proxyId,
    skillName: input.skillName,
    customerName: input.customerName,
    contact: input.contact,
    need: input.need,
    status: "new",
    unlocked: false,
    createdAt: new Date().toISOString(),
  };

  appendOne("leads", lead);
  return JSON.stringify({ lead });
}

export async function handleUpdateLead(input: {
  id: string;
  status?: LeadItem["status"];
  unlock?: boolean;
}): Promise<string> {
  if (input.unlock) {
    const unlocked = updateById<LeadItem>("leads", input.id, (lead) => ({
      ...lead,
      unlocked: true,
      unlockedAt: lead.unlockedAt || new Date().toISOString(),
    }));
    if (!unlocked) return JSON.stringify({ error: "线索不存在" });
    return JSON.stringify({ lead: unlocked });
  }

  if (!input.status || !allowedStatuses.includes(input.status)) {
    return JSON.stringify({ error: "线索状态无效" });
  }

  const updated = updateById<LeadItem>("leads", input.id, (lead) => ({
    ...lead,
    status: input.status!,
  }));

  if (!updated) return JSON.stringify({ error: "线索不存在" });
  return JSON.stringify({ lead: updated });
}
