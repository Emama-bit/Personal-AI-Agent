import type { EscrowOrder } from "@/types/domain";
import { orderRoleTips, orderStatusText } from "./constants";

export default function EscrowOrderDesk({
  orders,
  role,
  updatingOrderId,
  onOrderStatusChange,
}: {
  orders: EscrowOrder[];
  role: "provider" | "buyer";
  updatingOrderId: string;
  onOrderStatusChange: (
    order: EscrowOrder,
    status: EscrowOrder["status"]
  ) => void;
}) {
  const sortedOrders = [...orders].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <section className="dashboard-panel escrow-order-desk mb-6">
      <div className="dashboard-section-head">
        <div>
          <h2 className="text-xl font-bold">托管交易订单台</h2>
          <p className="text-sm text-muted mt-1">
            把报价单升级成平台内订单：托管、交付、确认、抽佣结算都在这里模拟。
          </p>
        </div>
      </div>

      {sortedOrders.length === 0 ? (
        <div className="escrow-empty">
          <strong>暂无托管订单</strong>
          <span>需求侧接受报价后，这里会出现第一张可推进的托管交易单。</span>
        </div>
      ) : (
        <div className="escrow-order-list">
          {sortedOrders.map((order) => (
            <EscrowOrderCard
              key={order.id}
              order={order}
              role={role}
              updating={updatingOrderId === order.id}
              onOrderStatusChange={onOrderStatusChange}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export function EscrowOrderCard({
  order,
  role,
  updating,
  onOrderStatusChange,
}: {
  order: EscrowOrder;
  role: "provider" | "buyer";
  updating: boolean;
  onOrderStatusChange: (
    order: EscrowOrder,
    status: EscrowOrder["status"]
  ) => void;
}) {
  const canProviderDeliver = role === "provider" && order.status === "escrowed";
  const canBuyerSettle = role === "buyer" && order.status === "delivered";
  const canDispute =
    order.status === "escrowed" || order.status === "delivered";

  return (
    <article className={`escrow-order-card ${order.status}`}>
      <div className="escrow-order-top">
        <span>{orderStatusText[order.status]}</span>
        <small>{new Date(order.createdAt).toLocaleString("zh-CN")}</small>
      </div>

      <div className="escrow-order-main">
        <div>
          <h3>{order.title}</h3>
          <p>
            {order.customerName} · {order.skillName}
          </p>
          <small className="escrow-role-note">
            {orderRoleTips[role][order.status]}
          </small>
        </div>
        <strong>¥{order.amount}</strong>
      </div>

      <div className="escrow-flow">
        {[
          ["escrowed", "资金托管"],
          ["delivered", "服务交付"],
          ["settled", "确认结算"],
        ].map(([status, label], index) => (
          <span
            key={status}
            className={
              ["escrowed", "delivered", "settled"].indexOf(order.status) >=
              index
                ? "active"
                : ""
            }
          >
            {label}
          </span>
        ))}
      </div>

      <div className="escrow-money-split">
        <span>
          平台抽佣 <strong>¥{order.platformFee}</strong>
        </span>
        <span>
          服务者到账 <strong>¥{order.providerReceives}</strong>
        </span>
      </div>

      <div className="escrow-order-actions">
        {canProviderDeliver && (
          <button
            type="button"
            disabled={updating}
            onClick={() => onOrderStatusChange(order, "delivered")}
          >
            标记已交付
          </button>
        )}
        {canBuyerSettle && (
          <button
            type="button"
            disabled={updating}
            onClick={() => onOrderStatusChange(order, "settled")}
          >
            确认验收并放款
          </button>
        )}
        {canDispute && (
          <button
            type="button"
            disabled={updating}
            onClick={() => onOrderStatusChange(order, "disputed")}
          >
            {role === "buyer" ? "我有异议，发起争议" : "发起争议"}
          </button>
        )}
        {order.status === "disputed" && (
          <button
            type="button"
            disabled={updating}
            onClick={() => onOrderStatusChange(order, "escrowed")}
          >
            {role === "buyer" ? "撤销争议，退回托管" : "退回托管中"}
          </button>
        )}
        {order.status === "settled" && (
          <span className="escrow-settled-note">平台抽佣已沉淀，订单完成</span>
        )}
      </div>
    </article>
  );
}
