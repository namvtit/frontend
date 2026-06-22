'use client';

import { TrendingUp, TrendingDown, Pause, Lightbulb, X } from 'lucide-react';
import { useDemo } from '@/lib/demo';
import { getStockBySymbol } from '@/lib/market/mock-data';
import { pushToast } from '@/components/ui/toast';
import { useState } from 'react';

const MOCK_AI_SUGGESTIONS = [
  {
    id: '1',
    title: 'Cơ hội từ Nhóm Công nghệ',
    description: 'Tín hiệu tích lũy mạnh mẽ từ các doanh nghiệp dẫn đầu điện toán đám mây.',
    action: 'buy' as const,
    confidence: 87,
    stocks: ['MSFT', 'GOOGL'],
    reasoning: 'Phân tích kỹ thuật cho thấy mô hình bứt phá (breakout) đi kèm khối lượng giao dịch lớn. Dòng tiền thông minh đang gia tăng vị thế.',
  },
  {
    id: '2',
    title: 'Động lượng Chip bán dẫn AI',
    description: 'Nhu cầu GPU vẫn cực kỳ mạnh mẽ vượt qua các đợt rung lắc ngắn hạn.',
    action: 'hold' as const,
    confidence: 92,
    stocks: ['NVDA'],
    reasoning: 'Nền tảng cơ bản vững chắc và tăng trưởng doanh thu kỷ lục hỗ trợ định giá hiện tại. Chờ đợi nhịp điều chỉnh kỹ thuật để gia tăng vị thế.',
  },
  {
    id: '3',
    title: 'Điều chỉnh Nhóm Xe điện EV',
    description: 'Ngành xe điện đang cho thấy tín hiệu suy yếu tương đối so với thị trường chung.',
    action: 'sell' as const,
    confidence: 78,
    stocks: ['TSLA'],
    reasoning: 'Phân kỳ âm xuất hiện trên đồ thị ngày. Những lo ngại về sản lượng và sự cạnh tranh gay gắt từ các đối thủ đang gia tăng sức ép.',
  },
];

function getActionColor(action: string) {
  switch (action) {
    case 'buy': return 'bg-emerald-600/10 border-emerald-600/30 text-emerald-700 dark:text-emerald-400';
    case 'sell': return 'bg-red-600/10 border-red-600/30 text-red-700 dark:text-red-400';
    case 'hold': return 'bg-slate-600/10 border-slate-600/30 text-slate-700 dark:text-slate-400';
    default: return 'bg-slate-600/10 border-slate-600/30';
  }
}

function getActionIcon(action: string) {
  switch (action) {
    case 'buy': return <TrendingUp className="h-4 w-4" />;
    case 'sell': return <TrendingDown className="h-4 w-4" />;
    case 'hold': return <Pause className="h-4 w-4" />;
    default: return null;
  }
}

function getActionLabel(action: string) {
  switch (action) {
    case 'buy': return 'Khuyến nghị MUA';
    case 'sell': return 'Khuyến nghị BÁN';
    case 'hold': return 'Khuyến nghị NẮM GIỮ';
    default: return action;
  }
}

export function AISuggestionsSection() {
  const { state, executeBuy, executeSell, getPrice } = useDemo();
  const [tradeModal, setTradeModal] = useState<{ symbol: string; action: 'buy' | 'sell' } | null>(null);
  const [quantity, setQuantity] = useState('10');

  // Trade modal calculations
  const stockInfo = tradeModal ? getStockBySymbol(tradeModal.symbol) : null;
  const livePrice = tradeModal ? (getPrice(tradeModal.symbol) || stockInfo?.price || 0) : 0;
  const qty = parseInt(quantity) || 0;
  const estimatedValue = qty * livePrice;
  const fee = estimatedValue * 0.0015; // 0.15% fee
  const totalCost = estimatedValue + (tradeModal?.action === 'buy' ? fee : -fee);

  const cashBalance = state.cashBalance;
  const holding = tradeModal ? state.holdings[tradeModal.symbol] : null;
  const currentHolding = holding?.quantity ?? 0;

  const isBuyDisabled = tradeModal?.action === 'buy' && totalCost > cashBalance;
  const isSellDisabled = tradeModal?.action === 'sell' && qty > currentHolding;
  const isSubmitDisabled = qty <= 0 || (tradeModal?.action === 'buy' ? isBuyDisabled : isSellDisabled);

  const handleExecuteTrade = () => {
    if (!tradeModal || !stockInfo || isSubmitDisabled) return;
    const { symbol, action } = tradeModal;
    const actualName = stockInfo.name;

    if (action === 'buy') {
      const success = executeBuy(symbol, actualName, qty, livePrice);
      if (success) {
        pushToast({
          title: `Mua thành công qua AI Insights`,
          message: `Đã khớp lệnh mua ${qty} CP ${symbol} @ $${livePrice.toFixed(2)}.`,
          type: 'success',
          icon: '✅',
        });
      } else {
        pushToast({
          title: 'Lệnh không thành công',
          message: 'Số dư tài khoản không khả dụng.',
          type: 'alert',
          icon: '❌',
        });
      }
    } else {
      const success = executeSell(symbol, actualName, qty, livePrice);
      if (success) {
        pushToast({
          title: `Bán thành công qua AI Insights`,
          message: `Đã khớp lệnh bán ${qty} CP ${symbol} @ $${livePrice.toFixed(2)}.`,
          type: 'success',
          icon: '💰',
        });
      } else {
        pushToast({
          title: 'Lệnh không thành công',
          message: 'Số lượng cổ phiếu sở hữu không đủ.',
          type: 'alert',
          icon: '❌',
        });
      }
    }
    setTradeModal(null);
    setQuantity('10');
  };

  return (
    <div className="border-b border-border">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center gap-2">
          <Lightbulb className="h-6 w-6 text-amber-500" />
          <div>
            <h2 className="text-2xl font-bold text-foreground font-sans">Gợi ý Giao dịch AI</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Phân tích thị trường thời gian thực và tín hiệu giao dịch thông minh
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {MOCK_AI_SUGGESTIONS.map((suggestion) => (
            <div
              key={suggestion.id}
              className="flex flex-col group rounded-lg border border-border bg-card p-6 hover:border-primary/50 transition-all hover:shadow-lg cursor-pointer"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors font-sans text-base">
                  {suggestion.title}
                </h3>
              </div>

              {/* Action Badge */}
              <div className="flex">
                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold ${getActionColor(suggestion.action)} mb-3`}>
                  {getActionIcon(suggestion.action)}
                  {getActionLabel(suggestion.action)}
                </div>
              </div>

              {/* Description */}
              <p className="text-sm text-muted-foreground mb-4 flex-grow">{suggestion.description}</p>

              {/* Stocks */}
              <div className="mb-3 flex flex-wrap gap-2">
                {suggestion.stocks.map((stock) => (
                  <span key={stock} className="inline-block px-2.5 py-1 rounded bg-secondary text-xs font-semibold text-foreground">
                    {stock}
                  </span>
                ))}
              </div>

              {/* Confidence */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-muted-foreground">Độ tin cậy</span>
                  <span className="text-xs font-bold text-foreground">{suggestion.confidence}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-secondary overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      suggestion.confidence >= 85 ? 'bg-emerald-500' :
                      suggestion.confidence >= 70 ? 'bg-amber-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${suggestion.confidence}%` }}
                  />
                </div>
              </div>

              {/* Reasoning */}
              <p className="text-xs text-muted-foreground/80 italic leading-relaxed mb-4">{suggestion.reasoning}</p>

              {/* Enter Order Buttons */}
              {suggestion.action !== 'hold' && (
                <div className="mt-auto pt-4 border-t border-border/50 grid grid-cols-2 gap-2">
                  {suggestion.stocks.map((stock) => (
                    <button
                      key={stock}
                      onClick={(e) => {
                        e.stopPropagation();
                        setTradeModal({ symbol: stock, action: suggestion.action as 'buy' | 'sell' });
                      }}
                      className={`w-full py-2 px-3 rounded-lg text-xs font-bold transition-all text-white shadow-sm ${
                        suggestion.action === 'buy'
                          ? 'bg-emerald-500 hover:bg-emerald-600'
                          : 'bg-red-500 hover:bg-red-600'
                      }`}
                    >
                      Vào lệnh {stock}
                    </button>
                  ))}
                </div>
              )}

              {/* View Analysis Link */}
              {suggestion.action === 'hold' && (
                <div className="mt-auto pt-4 border-t border-border/50 text-center">
                  <a href="/ai-agent" className="text-xs font-bold text-primary hover:text-primary/80 transition-colors inline-block">
                    Xem Phân Tích Chi Tiết →
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Trade Modal Overlay */}
      {tradeModal && stockInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl slide-up">
            <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${tradeModal.action === 'buy' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500 animate-pulse'}`} />
              Vào Lệnh (AI Insights)
            </h3>
            
            <p className="text-xs text-muted-foreground mb-4">
              Bạn đang thực hiện đặt lệnh nhanh dựa trên gợi ý từ hệ thống AI.
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
                <span className="text-muted-foreground font-sans">Giá thị trường:</span>
                <span className="font-bold text-foreground">${livePrice.toFixed(2)} USD</span>
              </div>
              
              {tradeModal.action === 'sell' && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground font-sans">Số lượng sở hữu:</span>
                  <span className="font-medium text-foreground">{currentHolding} CP</span>
                </div>
              )}

              {/* Quantity Input */}
              <div className="flex items-center justify-between border-t border-border/30 pt-2.5">
                <span className="text-muted-foreground font-sans">Số lượng đặt:</span>
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
                <span className="text-muted-foreground font-sans">Phí giao dịch (0.15%):</span>
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
            
            {/* Error notifications */}
            {tradeModal.action === 'buy' && isBuyDisabled && (
              <p className="text-xs text-red-500 font-semibold text-center mb-3">Số dư tiền mặt không đủ để đặt lệnh này.</p>
            )}
            {tradeModal.action === 'sell' && isSellDisabled && (
              <p className="text-xs text-red-500 font-semibold text-center mb-3">Số lượng cổ phiếu sở hữu không đủ.</p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => { setTradeModal(null); setQuantity('10'); }}
                className="flex-1 py-2.5 rounded-lg border border-border text-foreground hover:bg-secondary text-sm font-semibold transition-colors font-sans"
              >
                Quay lại
              </button>
              <button
                onClick={handleExecuteTrade}
                disabled={isSubmitDisabled}
                className={`flex-1 py-2.5 rounded-lg text-white text-sm font-semibold transition-all font-sans disabled:opacity-40 disabled:cursor-not-allowed ${
                  tradeModal.action === 'buy' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-red-500 hover:bg-red-600'
                }`}
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
