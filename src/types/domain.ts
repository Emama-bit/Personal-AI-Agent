export interface ProxyItem {
  id: string;
  name: string;
  domain: string;
  description: string;
  systemPrompt: string;
  createdAt: string;
  fileNames: string[];
  chunkCount: number;
}

export type SkillItem = ProxyItem;

export type LeadStatus = "new" | "contacted" | "proposal" | "won" | "closed";

export interface LeadItem {
  id: string;
  proxyId: string;
  skillName: string;
  customerName: string;
  contact: string;
  need: string;
  status: LeadStatus;
  unlocked?: boolean;
  unlockedAt?: string;
  createdAt: string;
}

export interface QuoteItem {
  id: string;
  leadId: string;
  title: string;
  amount: number;
  platformFee: number;
  providerReceives: number;
  deliveryDays: number;
  scope: string[];
  status: "sent" | "accepted";
  createdAt: string;
  acceptedAt?: string;
}

export type QuoteDraft = QuoteItem;

export interface EscrowOrder {
  id: string;
  leadId: string;
  quoteId: string;
  proxyId: string;
  skillName: string;
  customerName: string;
  title: string;
  amount: number;
  platformFee: number;
  providerReceives: number;
  status: "escrowed" | "delivered" | "settled" | "disputed";
  createdAt: string;
  deliveredAt?: string;
  settledAt?: string;
  disputedAt?: string;
}

export type EscrowOrderItem = EscrowOrder;

export interface ServiceReviewItem {
  id: string;
  orderId: string;
  leadId: string;
  proxyId: string;
  skillName: string;
  customerName: string;
  stars: number;
  comment: string;
  createdAt: string;
}

export type ServiceReview = ServiceReviewItem;

export type SkillStatus = "live" | "paused";
export type SkillFilter = "all" | SkillStatus;
