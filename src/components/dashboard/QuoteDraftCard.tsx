import type { QuoteDraft } from "@/types/domain";

export default function QuoteDraftCard({ quote }: { quote: QuoteDraft }) {
  return (
    <div className="quote-draft-card">
      <div className="quote-draft-head">
        <span>托管报价单</span>
        <strong>¥{quote.amount}</strong>
      </div>
      <p>{quote.title}</p>
      <div className="quote-draft-scope">
        {quote.scope.map((item) => (
          <span key={item}>{item}</span>
        ))}
      </div>
      <div className="quote-draft-money">
        <span>
          平台抽成 <strong>¥{quote.platformFee}</strong>
        </span>
        <span>
          服务者预计到账 <strong>¥{quote.providerReceives}</strong>
        </span>
      </div>
      <small>模拟托管：需求方付款到平台，确认交付后结算；MVP 暂不接真实支付。</small>
    </div>
  );
}
