import type { LeadItem, LeadStatus, QuoteDraft } from "@/types/domain";
import { leadWorkflowColumns, statusText } from "./constants";
import QuoteDraftCard from "./QuoteDraftCard";

export default function LeadWorkflowBoard({
  leads,
  quoteDrafts,
  updatingLeadId,
  onUnlockContact,
  onCreateQuote,
  onStatusChange,
}: {
  leads: LeadItem[];
  quoteDrafts: Record<string, QuoteDraft>;
  updatingLeadId: string;
  onUnlockContact: (id: string) => void;
  onCreateQuote: (lead: LeadItem) => void;
  onStatusChange: (id: string, status: LeadStatus) => void;
}) {
  return (
    <div className="lead-crm-board">
      {leadWorkflowColumns.map((column) => {
        const columnLeads = leads.filter((lead) =>
          column.statuses.includes(lead.status)
        );
        return (
          <div key={column.id} className="lead-crm-column">
            <div className="lead-crm-column-head">
              <div>
                <h3>{column.title}</h3>
                <p>{column.description}</p>
              </div>
              <span>{columnLeads.length}</span>
            </div>

            {columnLeads.length === 0 ? (
              <div className="lead-crm-placeholder">暂无</div>
            ) : (
              <div className="lead-crm-stack">
                {columnLeads.map((lead) => (
                  <LeadCrmCard
                    key={lead.id}
                    lead={lead}
                    quoteDraft={quoteDrafts[lead.id]}
                    updating={updatingLeadId === lead.id}
                    onUnlockContact={onUnlockContact}
                    onCreateQuote={onCreateQuote}
                    onStatusChange={onStatusChange}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function LeadCrmCard({
  lead,
  quoteDraft,
  updating,
  onUnlockContact,
  onCreateQuote,
  onStatusChange,
}: {
  lead: LeadItem;
  quoteDraft?: QuoteDraft;
  updating: boolean;
  onUnlockContact: (id: string) => void;
  onCreateQuote: (lead: LeadItem) => void;
  onStatusChange: (id: string, status: LeadStatus) => void;
}) {
  return (
    <article className="lead-crm-card">
      <div className="lead-crm-card-top">
        <span className={`lead-status-chip ${lead.status}`}>
          {statusText[lead.status]}
        </span>
        <small>{new Date(lead.createdAt).toLocaleDateString("zh-CN")}</small>
      </div>
      <strong>{lead.customerName}</strong>
      <p>{lead.skillName}</p>
      <div className={`lead-contact-lock ${lead.unlocked ? "unlocked" : ""}`}>
        <span>{lead.unlocked ? "联系方式已解锁" : "联系方式待解锁"}</span>
        <strong>{lead.unlocked ? lead.contact : "线索解锁后可见"}</strong>
        {!lead.unlocked && (
          <button
            type="button"
            disabled={updating}
            onClick={() => onUnlockContact(lead.id)}
          >
            模拟支付 ¥9 解锁
          </button>
        )}
      </div>
      <small className="lead-crm-need">{lead.need}</small>
      {quoteDraft && <QuoteDraftCard quote={quoteDraft} />}
      <div className="lead-crm-actions">
        {lead.status === "new" && (
          <button
            type="button"
            disabled={updating}
            onClick={() => onStatusChange(lead.id, "contacted")}
          >
            标记已联系
          </button>
        )}
        {lead.status === "contacted" && (
          <button
            type="button"
            disabled={updating}
            onClick={() => onStatusChange(lead.id, "proposal")}
          >
            进入方案沟通
          </button>
        )}
        {lead.status === "proposal" && (
          <>
            {!quoteDraft && (
              <button
                type="button"
                disabled={updating}
                onClick={() => onCreateQuote(lead)}
              >
                生成报价单
              </button>
            )}
            <button
              type="button"
              disabled
              onClick={() => onStatusChange(lead.id, "won")}
              title={
                quoteDraft
                  ? "等待需求侧在个人中心接受托管报价"
                  : "先生成报价单，再由需求侧接受托管"
              }
            >
              {quoteDraft ? "等待需求侧接受" : "托管成交"}
            </button>
            <button
              type="button"
              disabled={updating}
              onClick={() => onStatusChange(lead.id, "closed")}
            >
              关闭
            </button>
          </>
        )}
        {(lead.status === "won" || lead.status === "closed") && (
          <button
            type="button"
            disabled={updating}
            onClick={() => onStatusChange(lead.id, "proposal")}
          >
            重新沟通
          </button>
        )}
      </div>
    </article>
  );
}
