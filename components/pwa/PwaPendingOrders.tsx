import { ArrowDownLeft, ArrowUpRight, Clock3 } from "lucide-react";
import { PWA_PENDING_ORDER_DEMO } from "./demo-data";

export function PwaPendingOrders() {
  return (
    <section aria-labelledby="pwa-orders-title">
      <div className="pwa-section-heading">
        <div>
          <h2 id="pwa-orders-title">Lệnh đang treo</h2>
          <p>Dữ liệu minh hoạ · chưa kết nối orders API</p>
        </div>
        <span className="pwa-count">{PWA_PENDING_ORDER_DEMO.length}</span>
      </div>
      <div className="space-y-2.5">
        {PWA_PENDING_ORDER_DEMO.map((order) => {
          const isBuy = order.side === "BUY";
          return (
            <article key={order.id} className="pwa-order-card">
              <div className={`pwa-order-icon ${isBuy ? "pwa-order-buy" : "pwa-order-sell"}`}>
                {isBuy ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                  <h3>{order.symbol}</h3>
                  <span className="pwa-order-status"><Clock3 className="h-3 w-3" /> Chờ khớp</span>
                </div>
                <p><strong className={isBuy ? "text-emerald-500" : "text-red-500"}>{order.side}</strong> · {order.quantity} shares</p>
              </div>
              <div className="text-right">
                <span className="block text-[10px] text-muted-foreground">Limit</span>
                <strong className="font-mono text-sm">${order.limitPrice.toFixed(2)}</strong>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
