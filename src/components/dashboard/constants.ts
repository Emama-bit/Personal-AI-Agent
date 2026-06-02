import type { EscrowOrder, LeadItem, LeadStatus } from "@/types/domain";

export const statusText: Record<LeadItem["status"], string> = {
  new: "新线索",
  contacted: "已联系",
  proposal: "方案沟通",
  won: "已成交",
  closed: "已关闭",
};

export const leadWorkflowColumns: {
  id: string;
  title: string;
  description: string;
  statuses: LeadStatus[];
}[] = [
  {
    id: "new",
    title: "新线索",
    description: "刚提交意向，先判断需求质量。",
    statuses: ["new"],
  },
  {
    id: "contacted",
    title: "已联系",
    description: "已开始沟通，确认预算和范围。",
    statuses: ["contacted"],
  },
  {
    id: "proposal",
    title: "方案沟通",
    description: "报价、交付物和边界正在确认。",
    statuses: ["proposal"],
  },
  {
    id: "result",
    title: "已成交/关闭",
    description: "沉淀成交记录或关闭无效线索。",
    statuses: ["won", "closed"],
  },
];

export const orderStatusText: Record<EscrowOrder["status"], string> = {
  escrowed: "资金托管中",
  delivered: "已提交交付",
  settled: "已确认结算",
  disputed: "争议处理中",
};

export const orderRoleTips: Record<
  "provider" | "buyer",
  Record<EscrowOrder["status"], string>
> = {
  provider: {
    escrowed: "需求侧已接受托管报价。请按约定交付，交付后标记已交付。",
    delivered: "你已提交交付，等待需求侧验收确认后模拟结算。",
    settled: "需求侧已确认验收，平台抽佣和服务者到账已完成模拟记录。",
    disputed: "订单进入争议记录，先回到沟通确认服务范围、交付物和责任边界。",
  },
  buyer: {
    escrowed: "你已接受报价并进入托管，等待响应侧交付；交付前如发现范围不一致可发起争议。",
    delivered: "响应侧已标记交付。请核对交付物，满意后确认验收并放款。",
    settled: "你已确认验收，订单完成；后续可以沉淀评价和复购记录。",
    disputed: "你已发起争议，先暂停结算，等待双方重新确认交付边界。",
  },
};
