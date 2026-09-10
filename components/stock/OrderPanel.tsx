'use client';

import { useState, useMemo } from 'react';
import { Building2, ChevronDown, Check, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useDemo } from '@/lib/demo';

/* ── Broker definitions ── */
const BROKERS = [
  { id: 'vps', name: 'VPS', desc: 'VPS Securities', fee: '0%', color: '#3b82f6' },
  { id: 'ssi', name: 'SSI', desc: 'SSI Securities', fee: '0%', color: '#f97316' },
  { id: 'vndirect', name: 'VNDS', desc: 'VNDirect', fee: '0%', color: '#22c55e' },
  { id: 'tcbs', name: 'TCBS', desc: 'Techcom Securities', fee: '0%', color: '#ef4444' },
  { id: 'mbs', name: 'MBS', desc: 'MB Securities', fee: '0%', color: '#a855f7' },
] as const;

type OrderType = 'limit' | 'market' | 'stop';
type OrderSide = 'buy' | 'sell';

interface OrderPanelProps {
  symbol: string;
  stockName?: string;
  currentPrice: number;
  currency?: string;
}

export default function OrderPanel({ symbol, stockName, currentPrice, currency = 'USD' }: OrderPanelProps) {
  const { state, executeBuy, executeSell, getPrice, trading, accountLoading, accountError } = useDemo();
  const [broker, setBroker] = useState<(typeof BROKERS)[number]['id']>(BROKERS[0].id);
  const [orderType, setOrderType] = useState<OrderType>('market');
  const [side, setSide] = useState<OrderSide>('buy');
  const [quantity, setQuantity] = useState('100');
  const [price, setPrice] = useState(currentPrice.toFixed(2));
  const [stopPrice, setStopPrice] = useState((currentPrice * 0.95).toFixed(2));
  const [showBrokerPicker, setShowBrokerPicker] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const selectedBroker = BROKERS.find((b) => b.id === broker)!;

  const orderTypes: { key: OrderType; label: string }[] = [
    { key: 'limit', label: 'Giới hạn' },
    { key: 'market', label: 'Thị trường' },
    { key: 'stop', label: 'Điều kiện' },
  ];

  const qty = parseInt(quantity) || 0;
  const prc = parseFloat(price) || 0;

  const holding = state.holdings[symbol];
  const currentHolding = holding?.quantity ?? 0;
  const currentAvgPrice = holding?.avgPrice ?? 0;
  const cashBalance = state.cashBalance;
  const livePrice = getPrice(symbol) || currentPrice;

  // Use livePrice for market orders, otherwise use manually specified limit price
  const executionPrice = orderType === 'market' ? livePrice : prc;

  const estimatedValue = useMemo(() => {
    return qty * executionPrice;
  }, [qty, executionPrice]);

  const fee = 0;
  const totalCost = estimatedValue + (side === 'buy' ? fee : -fee);

  const quickQuantities = [10, 50, 100, 500, 1000];

  // Calculate new average price preview (for buy orders)
  const newAvgPriceAfterBuy = useMemo(() => {
    if (side !== 'buy' || qty <= 0 || executionPrice <= 0) return null;
    const existingQty = currentHolding;
    const existingAvg = currentAvgPrice;
    const newTotalQty = existingQty + qty;
    if (newTotalQty <= 0) return null;
    return (existingAvg * existingQty + executionPrice * qty) / newTotalQty;
  }, [side, qty, executionPrice, currentHolding, currentAvgPrice]);

  // Calculate new average price preview (for sell — avg stays the same, show remaining)
  const remainingQtyAfterSell = useMemo(() => {
    if (side !== 'sell' || qty <= 0) return null;
    return Math.max(0, currentHolding - qty);
  }, [side, qty, currentHolding]);

  // PnL calculations based on current avg cost vs live price
  const unrealizedPnL = useMemo(() => {
    if (currentHolding <= 0 || currentAvgPrice <= 0) return null;
    const totalCostBasis = currentAvgPrice * currentHolding;
    const currentMarketValue = livePrice * currentHolding;
    const pnl = currentMarketValue - totalCostBasis;
    const pnlPct = (pnl / totalCostBasis) * 100;
    return { pnl, pnlPct };
  }, [currentHolding, currentAvgPrice, livePrice]);

  // Realized PnL for sell preview
  const realizedPnLPreview = useMemo(() => {
    if (side !== 'sell' || qty <= 0 || executionPrice <= 0 || currentAvgPrice <= 0) return null;
    const gain = (executionPrice - currentAvgPrice) * qty;
    const gainPct = ((executionPrice - currentAvgPrice) / currentAvgPrice) * 100;
    return { gain, gainPct };
  }, [side, qty, executionPrice, currentAvgPrice]);

  // Validation
  const isBuyDisabled = side === 'buy' && totalCost > cashBalance;
  const isSellDisabled = side === 'sell' && qty > currentHolding;
  const isSubmitDisabled = trading || accountLoading || !!accountError || qty <= 0 || executionPrice <= 0 || (side === 'buy' ? isBuyDisabled : isSellDisabled);

  const buttonText = useMemo(() => {
    if (qty <= 0) return 'Nhập khối lượng';
    if (executionPrice <= 0) return 'Nhập giá hợp lệ';
    if (side === 'buy' && isBuyDisabled) return 'Không đủ số dư tiền mặt';
    if (side === 'sell' && isSellDisabled) return 'Vượt quá số lượng sở hữu';
    return `${side === 'buy' ? 'MUA' : 'BÁN'} ${symbol}`;
  }, [qty, executionPrice, side, symbol, isBuyDisabled, isSellDisabled]);

  const handleSubmit = () => {
    if (isSubmitDisabled) return;
    setShowConfirmModal(true);
  };

  const handleConfirmOrder = async () => {
    if (isSubmitDisabled) return;
    const success = await (side === 'buy' ? executeBuy : executeSell)(symbol, stockName || symbol, qty, executionPrice);
    if (success) setShowConfirmModal(false);
  };

  return (
    <>
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        {/* ── Header ── */}
        <div className="flex items-center justify-between border-b border-border bg-muted/30 px-4 py-3">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-bold text-foreground">Đặt lệnh</h3>
          </div>
        </div>

        {/* ── Broker selector ── */}
        <div className="relative border-b border-border">
          <button
            onClick={() => setShowBrokerPicker(!showBrokerPicker)}
            className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-secondary/50 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold text-white" style={{ backgroundColor: selectedBroker.color }}>
                {selectedBroker.name.charAt(0)}
              </div>
              <div className="text-left">
                <div className="text-xs font-semibold text-foreground leading-tight">{selectedBroker.name}</div>
                <div className="text-[10px] text-muted-foreground leading-tight">{selectedBroker.desc}</div>
              </div>
            </div>
            <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${showBrokerPicker ? 'rotate-180' : ''}`} />
          </button>

          {/* Broker dropdown */}
          {showBrokerPicker && (
            <div className="absolute top-full left-0 right-0 z-50 border border-border bg-card shadow-xl rounded-b-lg overflow-hidden">
              {BROKERS.map((b) => (
                <button
                  key={b.id}
                  onClick={() => { setBroker(b.id); setShowBrokerPicker(false); }}
                  className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-left transition-colors hover:bg-secondary/50 ${b.id === broker ? 'bg-secondary/50' : ''}`}
                >
                  <div className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold text-white" style={{ backgroundColor: b.color }}>
                    {b.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-foreground">{b.name}</div>
                    <div className="text-[10px] text-muted-foreground">{b.desc}</div>
                  </div>
                  <span className="text-[10px] text-muted-foreground font-mono">Phí {b.fee}</span>
                  {b.id === broker && <Check className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 space-y-3.5">
          {accountError && <p role="alert" className="text-xs text-red-500">{accountError}</p>}
          {/* ── Buy / Sell toggle ── */}
          <div className="grid grid-cols-2 gap-1 p-1 rounded-lg bg-muted/50">
            <button
              onClick={() => setSide('buy')}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-bold transition-all ${
                side === 'buy'
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <ArrowUpRight className="h-3.5 w-3.5" />
              MUA
            </button>
            <button
              onClick={() => setSide('sell')}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-bold transition-all ${
                side === 'sell'
                  ? 'bg-red-500 text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <ArrowDownRight className="h-3.5 w-3.5" />
              BÁN
            </button>
          </div>

          {/* ── Order type tabs ── */}
          <div className="flex gap-0.5 p-0.5 rounded-lg bg-muted/50">
            {orderTypes.map((ot) => (
              <button
                key={ot.key}
                disabled={ot.key !== 'market'}
                title={ot.key !== 'market' ? 'Chỉ hỗ trợ lệnh thị trường' : undefined}
                onClick={() => setOrderType(ot.key)}
                className={`flex-1 py-1.5 text-[11px] font-medium rounded-md transition-all ${
                  orderType === ot.key
                    ? 'bg-card text-foreground shadow-sm border border-border'
                    : 'text-muted-foreground hover:text-foreground border border-transparent'
                }`}
              >
                {ot.label}
              </button>
            ))}
          </div>

          {/* ── Price input (hidden for market orders) ── */}
          {orderType !== 'market' && (
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                {orderType === 'stop' ? 'Giá kích hoạt' : 'Giá đặt'}
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  value={orderType === 'stop' ? stopPrice : price}
                  onChange={(e) => orderType === 'stop' ? setStopPrice(e.target.value) : setPrice(e.target.value)}
                  className="input font-mono text-right pr-14 text-sm"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-mono">{currency}</span>
              </div>
              {/* Quick price buttons */}
              <div className="flex gap-1 mt-1.5">
                {[
                  { label: '-5%', factor: 0.95 },
                  { label: '-1%', factor: 0.99 },
                  { label: 'MP', factor: 1 },
                  { label: '+1%', factor: 1.01 },
                  { label: '+5%', factor: 1.05 },
                ].map((p) => (
                  <button
                    key={p.label}
                    onClick={() => {
                      const val = (currentPrice * p.factor).toFixed(2);
                      orderType === 'stop' ? setStopPrice(val) : setPrice(val);
                    }}
                    className="flex-1 py-1 text-[10px] font-medium rounded-md transition-colors border border-transparent hover:border-border bg-muted/50 hover:bg-secondary text-muted-foreground hover:text-foreground"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Limit price when stop order */}
          {orderType === 'stop' && (
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Giá giới hạn</label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="input font-mono text-right pr-14 text-sm"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-mono">{currency}</span>
              </div>
            </div>
          )}

          {/* Market price display */}
          {orderType === 'market' && (
            <div className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-secondary/50 transition-colors">
              <span className="text-xs font-medium text-muted-foreground">Giá thị trường</span>
              <span className="font-mono font-bold text-sm text-foreground">{formatMoney(livePrice)}</span>
            </div>
          )}

          {/* ── Quantity ── */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-muted-foreground">Khối lượng</label>
              {side === 'sell' && (
                <span className="text-[10px] text-muted-foreground">Sở hữu: {currentHolding} CP</span>
              )}
            </div>
            <div className="relative">
              <input
                type="number"
                min="1"
                step="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="input font-mono text-right pr-10 text-sm"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">CP</span>
            </div>
            {/* Quick quantity buttons */}
            <div className="flex gap-1 mt-1.5">
              {side === 'sell' && currentHolding > 0 ? (
                // Quick fractional buttons for selling holdings
                [
                  { label: '25%', factor: 0.25 },
                  { label: '50%', factor: 0.5 },
                  { label: '75%', factor: 0.75 },
                  { label: 'Tất cả', factor: 1.0 },
                ].map((pct) => (
                  <button
                    key={pct.label}
                    onClick={() => setQuantity(Math.floor(currentHolding * pct.factor).toString())}
                    className="flex-1 py-1 text-[10px] font-medium rounded-md transition-colors border border-transparent hover:border-border bg-muted/50 hover:bg-secondary text-muted-foreground hover:text-foreground"
                  >
                    {pct.label}
                  </button>
                ))
              ) : (
                quickQuantities.map((q) => (
                  <button
                    key={q}
                    onClick={() => setQuantity(q.toString())}
                    className={`flex-1 py-1 text-[10px] font-medium rounded-md transition-colors border ${
                      parseInt(quantity) === q
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-muted/50 hover:bg-secondary text-muted-foreground hover:text-foreground border-transparent hover:border-border'
                    }`}
                  >
                    {q}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* ── Holding info (avg price, PnL) ── */}
          {currentHolding > 0 && (
            <div className="space-y-1.5 p-3 rounded-lg bg-muted/30 border border-border/50">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Đang sở hữu</span>
                <span className="font-mono font-medium text-foreground">{currentHolding} CP</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Giá vốn TB</span>
                <span className="font-mono font-semibold text-foreground">{formatMoney(currentAvgPrice)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Giá thị trường</span>
                <span className="font-mono font-medium text-foreground">{formatMoney(livePrice)}</span>
              </div>
              {unrealizedPnL && (
                <div className="flex justify-between text-xs pt-1.5 border-t border-border/30">
                  <span className="text-muted-foreground">Lãi/Lỗ chưa chốt</span>
                  <span className={`font-mono font-bold ${unrealizedPnL.pnl >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                    {unrealizedPnL.pnl >= 0 ? '+' : ''}{formatMoney(unrealizedPnL.pnl)} ({unrealizedPnL.pnlPct >= 0 ? '+' : ''}{unrealizedPnL.pnlPct.toFixed(2)}%)
                  </span>
                </div>
              )}
            </div>
          )}

          {/* ── New avg price preview ── */}
          {side === 'buy' && newAvgPriceAfterBuy !== null && qty > 0 && prc > 0 && (
            <div className="p-3 rounded-lg border border-primary/30 bg-primary/5">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">Giá vốn TB hiện tại</span>
                <span className="font-mono text-foreground">{currentAvgPrice > 0 ? formatMoney(currentAvgPrice) : '—'}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-primary font-medium">→ Giá vốn TB mới</span>
                <span className="font-mono font-bold text-primary">{formatMoney(newAvgPriceAfterBuy)}</span>
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                <span>Tổng CP sau mua</span>
                <span className="font-mono">{currentHolding + qty} CP</span>
              </div>
            </div>
          )}

          {/* ── Sell PnL preview ── */}
          {side === 'sell' && realizedPnLPreview !== null && qty > 0 && prc > 0 && currentHolding > 0 && (
            <div className={`p-3 rounded-lg border ${realizedPnLPreview.gain >= 0 ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-red-500/30 bg-red-500/5'}`}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">Giá bán</span>
                <span className="font-mono text-foreground">{formatMoney(prc)}</span>
              </div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">Giá vốn TB</span>
                <span className="font-mono text-foreground">{formatMoney(currentAvgPrice)}</span>
              </div>
              <div className="flex justify-between text-xs pt-1.5 border-t border-border/30">
                <span className={`font-medium ${realizedPnLPreview.gain >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                  {realizedPnLPreview.gain >= 0 ? '🎉 Lãi thực hiện' : '📉 Lỗ thực hiện'}
                </span>
                <span className={`font-mono font-bold ${realizedPnLPreview.gain >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                  {realizedPnLPreview.gain >= 0 ? '+' : ''}{formatMoney(realizedPnLPreview.gain)} ({realizedPnLPreview.gainPct >= 0 ? '+' : ''}{realizedPnLPreview.gainPct.toFixed(2)}%)
                </span>
              </div>
              {remainingQtyAfterSell !== null && remainingQtyAfterSell > 0 && (
                <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                  <span>CP còn lại sau bán</span>
                  <span className="font-mono">{remainingQtyAfterSell} CP (TB: {formatMoney(currentAvgPrice)})</span>
                </div>
              )}
            </div>
          )}

          {/* ── Order summary ── */}
          <div className="space-y-2 pt-3 border-t border-border/50">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Giá trị ước tính</span>
              <span className="font-mono font-medium text-foreground">{formatMoney(estimatedValue)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Phí GD ({selectedBroker.fee})</span>
              <span className="font-mono text-muted-foreground">{formatMoney(fee)}</span>
            </div>
            <div className="flex justify-between text-xs font-semibold pt-2 border-t border-border/50">
              <span className="text-foreground">Tổng cộng</span>
              <span className={`font-mono ${side === 'buy' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                {formatMoney(totalCost)}
              </span>
            </div>
            {/* Show Cash balance */}
            <div className="flex justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/30 border-dashed">
              <span>Số dư tiền mặt khả dụng:</span>
              <span className="font-mono text-foreground font-medium">{formatMoney(cashBalance)}</span>
            </div>
          </div>

          {/* ── Submit button ── */}
          <button
            onClick={handleSubmit}
            disabled={isSubmitDisabled}
            className={`w-full py-2.5 rounded-lg text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
              side === 'buy'
                ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                : 'bg-red-500 hover:bg-red-600 text-white'
            }`}
          >
            {trading ? 'Đang đặt lệnh...' : accountLoading ? 'Đang tải tài khoản...' : buttonText}
          </button>

          {/* ── Disclaimer removed ── */}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl slide-up">
            <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${side === 'buy' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500 animate-pulse'}`} />
              Xác nhận Giao dịch
            </h3>
            
            <p className="text-xs text-muted-foreground mb-4">
              Lệnh thị trường sẽ khớp theo giá xác minh tại thời điểm đặt lệnh. Giá dưới đây là ước tính.
            </p>

            <div className="space-y-3 mb-6 bg-muted/30 p-4 rounded-lg border border-border/50 font-mono text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Loại giao dịch:</span>
                <span className={`font-bold uppercase ${side === 'buy' ? 'text-emerald-500' : 'text-red-500'}`}>
                  {side === 'buy' ? 'MUA' : 'BÁN'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cổ phiếu:</span>
                <span className="font-bold text-foreground">{symbol} - {stockName || symbol}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Số lượng:</span>
                <span className="font-bold text-foreground">{qty} CP</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Giá ước tính:</span>
                <span className="font-bold text-foreground">${executionPrice.toFixed(2)} USD</span>
              </div>
              {/* Average price info in confirmation */}
              {currentHolding > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Giá vốn TB hiện tại:</span>
                  <span className="font-medium text-foreground">${currentAvgPrice.toFixed(2)} USD</span>
                </div>
              )}
              {side === 'buy' && newAvgPriceAfterBuy !== null && (
                <div className="flex justify-between">
                  <span className="text-primary">→ Giá vốn TB mới:</span>
                  <span className="font-bold text-primary">${newAvgPriceAfterBuy.toFixed(2)} USD</span>
                </div>
              )}
              {side === 'sell' && realizedPnLPreview !== null && (
                <div className="flex justify-between">
                  <span className={realizedPnLPreview.gain >= 0 ? 'text-emerald-500' : 'text-red-500'}>
                    {realizedPnLPreview.gain >= 0 ? 'Lãi thực hiện:' : 'Lỗ thực hiện:'}
                  </span>
                  <span className={`font-bold ${realizedPnLPreview.gain >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                    {realizedPnLPreview.gain >= 0 ? '+' : ''}${realizedPnLPreview.gain.toFixed(2)} ({realizedPnLPreview.gainPct.toFixed(2)}%)
                  </span>
                </div>
              )}
              <div className="flex justify-between border-t border-border/50 pt-2 mt-2">
                <span className="text-muted-foreground">Giá trị ước tính:</span>
                <span className="font-bold text-foreground">${estimatedValue.toFixed(2)} USD</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Phí giao dịch (0%):</span>
                <span className="font-bold text-foreground">${fee.toFixed(2)} USD</span>
              </div>
              <div className="flex justify-between border-t border-border/50 pt-2 mt-2 text-base font-bold">
                <span className="text-foreground">Tổng cộng:</span>
                <span className={side === 'buy' ? 'text-emerald-500' : 'text-red-500'}>
                  ${totalCost.toFixed(2)} USD
                </span>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-2.5 rounded-lg border border-border text-foreground hover:bg-secondary text-sm font-semibold transition-colors"
              >
                Quay lại
              </button>
              <button
                onClick={handleConfirmOrder}
                disabled={isSubmitDisabled}
                className={`flex-1 py-2.5 rounded-lg text-white text-sm font-semibold transition-all ${
                  side === 'buy' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-red-500 hover:bg-red-600'
                }`}
              >
                {trading ? 'Đang đặt lệnh...' : 'Xác nhận đặt lệnh'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ── Helpers ── */
function formatMoney(v: number) {
  return v.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });
}
