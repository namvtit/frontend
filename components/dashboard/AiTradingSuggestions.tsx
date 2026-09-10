'use client';

import { useState } from 'react';
import {
  AlertTriangle,
  Clock,
  TrendingUp,
  TrendingDown,
  PlusCircle,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useDemo } from '@/lib/demo';
import { getStockBySymbol } from '@/lib/market/mock-data';
import { pushToast } from '@/components/ui/toast';

/* ── Types ── */
interface AiAlert {
  id: string;
  symbol: string;
  type: 'danger' | 'warning' | 'info';
  title: string;
  description: string;
  time: string;
  details: string;
  action?: 'buy' | 'sell';
}

/* ── Initial Demo Alert (1 item) ── */
const INITIAL_ALERTS: AiAlert[] = [
  {
    id: 'al_1',
    symbol: 'NVDA',
    type: 'warning',
    title: 'NVDA quá mua ngắn hạn',
    description: 'Chỉ số RSI của NVDA đạt mức 82.4, vùng quá mua cực hạn trên khung H1.',
    time: '10:30',
    details: 'Động lượng tăng điểm quá nhanh trong các phiên gần đây đang đẩy định giá ngắn hạn lên mức rủi ro. Khuyến nghị nhà đầu tư dừng mua đuổi ở vùng giá hiện tại và cân nhắc chốt lời từng phần để bảo toàn lợi nhuận.',
    action: 'sell',
  }
];

/* ── Simulated Alerts Pool ── */
const SIMULATED_ALERTS_POOL: Omit<AiAlert, 'id' | 'time'>[] = [
  {
    symbol: 'TSLA',
    type: 'danger',
    title: 'Cảnh báo: TSLA áp lực bán tháo đột biến',
    description: 'Xuất hiện phân kỳ âm và volume bán tăng vọt 150% so với trung bình 20 phiên.',
    details: 'Tin tức bất lợi về chuỗi cung ứng linh kiện pin đang đẩy tâm lý giao dịch mã TSLA vào vùng tiêu cực. Vùng hỗ trợ tiếp theo là $175. Khuyến nghị giảm vị thế hoặc dừng lỗ vị thế mua ngắn hạn.',
    action: 'sell',
  },
  {
    symbol: 'MSFT',
    type: 'info',
    title: 'Cơ hội: MSFT kiểm định vùng hỗ trợ',
    description: 'Đang hình thành mô hình tích lũy quanh đường EMA200 trên khung đồ thị H4.',
    details: 'Tích lũy khối lượng quanh vùng giá trị hợp lý. Đây là điểm vào tiềm năng cho nhà đầu tư tích sản dài hạn với tỷ lệ Risk/Reward hấp dẫn 1:3.',
    action: 'buy',
  },
  {
    symbol: 'AAPL',
    type: 'warning',
    title: 'Cảnh báo: AAPL áp sát kháng cự lịch sử',
    description: 'Đang tiến sát vùng đỉnh cũ với volume suy giảm dần báo hiệu lực mua yếu.',
    details: 'Lực cầu yếu khi tiếp cận vùng đỉnh cũ báo hiệu rủi ro điều chỉnh kỹ thuật ngắn hạn. Cân nhắc thu hẹp quy mô vị thế trước khi có xác nhận dòng tiền bứt phá rõ ràng.',
    action: 'sell',
  }
];

function getAlertColor(type: string) {
  switch (type) {
    case 'danger': return 'bg-red-600/10 border-red-600/30 text-red-700 dark:text-red-400';
    case 'warning': return 'bg-orange-600/10 border-orange-600/30 text-orange-700 dark:text-orange-400';
    case 'info': return 'bg-blue-600/10 border-blue-600/30 text-blue-700 dark:text-blue-400';
    default: return 'bg-slate-600/10 border-slate-600/30';
  }
}

function getAlertLabel(type: string) {
  switch (type) {
    case 'danger': return 'NGUY HIỂM';
    case 'warning': return 'CẢNH BÁO';
    case 'info': return 'THÔNG TIN';
    default: return type.toUpperCase();
  }
}

export function AiTradingSuggestions() {
  const { state, dispatch, executeBuy, executeSell, getPrice, trading, accountLoading } = useDemo();
  const [alerts, setAlerts] = useState<AiAlert[]>(INITIAL_ALERTS);
  const [expandedAlert, setExpandedAlert] = useState<string | null>(null);
  
  // Trade Modal State
  const [tradeModal, setTradeModal] = useState<{ symbol: string; action: 'buy' | 'sell' } | null>(null);
  const [quantity, setQuantity] = useState('10');

  // Trade Modal calculations
  const stockInfo = tradeModal ? getStockBySymbol(tradeModal.symbol) : null;
  const livePrice = tradeModal ? (getPrice(tradeModal.symbol) || stockInfo?.price || 0) : 0;
  const qty = parseInt(quantity) || 0;
  const estimatedValue = qty * livePrice;
  const fee = 0;
  const totalCost = estimatedValue + (tradeModal?.action === 'buy' ? fee : -fee);

  const cashBalance = state.cashBalance;
  const holding = tradeModal ? state.holdings[tradeModal.symbol] : null;
  const currentHolding = holding?.quantity ?? 0;

  const isBuyDisabled = tradeModal?.action === 'buy' && totalCost > cashBalance;
  const isSellDisabled = tradeModal?.action === 'sell' && qty > currentHolding;
  const isSubmitDisabled = trading || accountLoading || qty <= 0 || (tradeModal?.action === 'buy' ? isBuyDisabled : isSellDisabled);

  // Trigger simulated new alert
  const handleSimulateAlert = () => {
    // Find alerts in pool that are not currently displayed
    const existingSymbols = alerts.map((a) => a.symbol);
    const availablePool = SIMULATED_ALERTS_POOL.filter((p) => !existingSymbols.includes(p.symbol));
    
    if (availablePool.length === 0) {
      pushToast({
        title: 'Thông báo',
        message: 'Tất cả các mã cảnh báo đã được hiển thị.',
        type: 'info',
        icon: 'ℹ️',
      });
      return;
    }

    const randomSource = availablePool[Math.floor(Math.random() * availablePool.length)];
    const now = new Date();
    const timeStr = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    
    const newAlert: AiAlert = {
      ...randomSource,
      id: `al_${Date.now()}`,
      time: timeStr,
    };

    setAlerts((prev) => [newAlert, ...prev]);

    // Trigger toast notification for the new alert
    pushToast({
      title: `Cảnh báo AI mới: ${newAlert.symbol}`,
      message: `${newAlert.title} - ${newAlert.description}`,
      type: newAlert.type === 'danger' ? 'alert' : 'warning',
      icon: newAlert.type === 'danger' ? '❌' : '⚠️',
    });

    dispatch({
      type: 'PUSH_NOTIFICATION',
      notification: {
        title: `Cảnh báo AI: ${newAlert.symbol}`,
        message: `${newAlert.title} - ${newAlert.description}`,
        type: newAlert.type === 'danger' ? 'alert' : 'warning',
        icon: newAlert.type === 'danger' ? '❌' : '⚠️',
      },
    });
  };

  const handleDismissAlert = (id: string) => {
    const alertToDismiss = alerts.find((a) => a.id === id);
    if (alertToDismiss) {
      state.notifications.forEach((n) => {
        if (!n.read && (n.type === 'alert' || n.type === 'warning') && n.message.includes(alertToDismiss.symbol)) {
          dispatch({ type: 'MARK_NOTIF_READ', id: n.id });
        }
      });
    }
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  const handleExecuteTrade = async () => {
    if (!tradeModal || !stockInfo || isSubmitDisabled) return;
    const { symbol, action } = tradeModal;
    const actualName = stockInfo.name;

    const success = await (action === 'buy' ? executeBuy : executeSell)(symbol, actualName, qty, livePrice);
    if (!success) return;
    setTradeModal(null);
    setQuantity('10');
  };

  return (
    <div id="ai-suggestions" className="rounded-lg border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border bg-muted/30 p-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          <div>
            <h2 className="text-lg font-bold text-foreground font-sans">Cảnh báo giao dịch từ AI</h2>
            <p className="text-xs text-muted-foreground">{alerts.length} cảnh báo • Cập nhật gần nhất</p>
          </div>
        </div>
        <button
          onClick={handleSimulateAlert}
          className="btn btn-secondary text-xs flex items-center gap-1 py-1.5 px-3 rounded-lg border border-border hover:bg-secondary/80 transition-all font-semibold"
        >
          <PlusCircle className="h-3.5 w-3.5" />
          Tạo cảnh báo mới
        </button>
      </div>

      {/* Alert List */}
      <div className="p-4 space-y-4">
        {alerts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            Không có cảnh báo hoạt động nào.
          </div>
        ) : (
          alerts.map((alert) => {
            const isExpanded = expandedAlert === alert.id;
            return (
              <div
                key={alert.id}
                className="group rounded-lg border border-border bg-card p-5 hover:border-primary/50 transition-all hover:shadow-lg"
              >
                {/* Card Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <h3 className="font-bold text-foreground text-base font-sans">{alert.symbol}</h3>
                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5">
                      <Clock className="h-3 w-3" />
                      <span>Cập nhật lúc {alert.time}</span>
                    </div>
                  </div>
                  <div className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[10px] font-bold ${getAlertColor(alert.type)}`}>
                    {getAlertLabel(alert.type)}
                  </div>
                </div>

                {/* Title & Description */}
                <h4 className="text-sm font-semibold text-foreground mb-1 leading-snug">{alert.title}</h4>
                <p className="text-xs text-muted-foreground leading-relaxed mb-3">{alert.description}</p>

                {/* Action Buttons */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setExpandedAlert(isExpanded ? null : alert.id)}
                    className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
                  >
                    {isExpanded ? 'Thu gọn' : 'Chi tiết cảnh báo'}
                    {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  </button>

                  <button
                    onClick={() => handleDismissAlert(alert.id)}
                    className="text-xs font-semibold text-muted-foreground hover:text-red-500 transition-colors ml-2"
                  >
                    Bỏ qua
                  </button>

                  {alert.action && (
                    <button
                      onClick={() => setTradeModal({ symbol: alert.symbol, action: alert.action as 'buy' | 'sell' })}
                      className={`ml-auto py-1 px-3.5 rounded text-xs font-bold text-white transition-all shadow-sm ${
                        alert.action === 'buy' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-red-500 hover:bg-red-600'
                      }`}
                    >
                      Vào lệnh {alert.action === 'buy' ? 'Mua' : 'Bán'}
                    </button>
                  )}
                </div>

              {/* Expanded details */}
              {isExpanded && (
                <div className="mt-4 pt-3 border-t border-border/50 space-y-2.5 slide-up">
                  <div className="bg-muted/40 p-3 rounded border border-border/40">
                    <p className="text-xs text-foreground font-semibold mb-1">Chi tiết phân tích:</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{alert.details}</p>
                  </div>
                </div>
              )}
            </div>
          );
        })
      )}</div>

      {/* Disclaimer */}
      <div className="border-t border-border bg-muted/10 p-3">
        <p className="text-[11px] text-muted-foreground leading-relaxed text-center">
          <span className="font-semibold">Disclaimer:</span> Các thông báo cảnh báo từ AI chỉ mang tính tham khảo. Đầu tư tài chính có rủi ro lớn.
        </p>
      </div>

      {/* Quick Trade Modal */}
      {tradeModal && stockInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl slide-up">
            <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${tradeModal.action === 'buy' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500 animate-pulse'}`} />
              Giao Dịch từ Cảnh Báo AI
            </h3>
            
            <p className="text-xs text-muted-foreground mb-4">
              Vui lòng xác nhận thông tin đặt lệnh từ cảnh báo thị trường.
            </p>

            <div className="space-y-3 mb-6 bg-muted/30 p-4 rounded-lg border border-border/50 font-mono text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground font-sans">Loại giao dịch:</span>
                <span className={`font-bold uppercase ${tradeModal.action === 'buy' ? 'text-emerald-500' : 'text-red-500'}`}>
                  {tradeModal.action === 'buy' ? 'MUA' : 'BÁN'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground font-sans">Cổ phiếu:</span>
                <span className="font-bold text-foreground">{tradeModal.symbol} - {stockInfo.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground font-sans">Giá hiện tại:</span>
                <span className="font-bold text-foreground">${livePrice.toFixed(2)} USD</span>
              </div>
              
              {tradeModal.action === 'sell' && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground font-sans">Số lượng sở hữu:</span>
                  <span className="font-medium text-foreground">{currentHolding} CP</span>
                </div>
              )}

              {/* Quantity */}
              <div className="flex items-center justify-between border-t border-border/30 pt-2.5">
                <span className="text-muted-foreground font-sans">Số lượng:</span>
                <div className="relative w-28">
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full px-2 py-1 bg-background border border-border rounded text-right font-bold text-foreground pr-8 text-sm focus:outline-none focus:border-primary font-mono"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-sans">CP</span>
                </div>
              </div>

              <div className="flex justify-between border-t border-border/50 pt-2">
                <span className="text-muted-foreground font-sans">Giá trị ước tính:</span>
                <span className="font-bold text-foreground">${estimatedValue.toFixed(2)} USD</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground font-sans">Phí giao dịch (0%):</span>
                <span className="font-bold text-foreground">${fee.toFixed(2)} USD</span>
              </div>
              
              <div className="flex justify-between border-t border-border/50 pt-2 text-base font-bold">
                <span className="text-foreground font-sans">Tổng cộng:</span>
                <span className={tradeModal.action === 'buy' ? 'text-emerald-500' : 'text-red-500'}>
                  ${totalCost.toFixed(2)} USD
                </span>
              </div>

              {tradeModal.action === 'buy' && (
                <div className="flex justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/30 border-dashed">
                  <span className="font-sans">Tiền mặt khả dụng:</span>
                  <span>${cashBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
              )}
            </div>
            
            {tradeModal.action === 'buy' && isBuyDisabled && (
              <p className="text-xs text-red-500 font-semibold text-center mb-3">Số dư khả dụng không đủ.</p>
            )}
            {tradeModal.action === 'sell' && isSellDisabled && (
              <p className="text-xs text-red-500 font-semibold text-center mb-3">Không đủ cổ phiếu để bán.</p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => { setTradeModal(null); setQuantity('10'); }}
                className="flex-1 py-2.5 rounded-lg border border-border text-foreground hover:bg-secondary text-sm font-semibold transition-colors font-sans"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleExecuteTrade}
                disabled={isSubmitDisabled}
                className={`flex-1 py-2.5 rounded-lg text-white text-sm font-semibold transition-all font-sans disabled:opacity-40 disabled:cursor-not-allowed ${
                  tradeModal.action === 'buy' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-red-500 hover:bg-red-600'
                }`}
              >
                Đặt lệnh
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
