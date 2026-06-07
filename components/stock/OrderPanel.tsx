'use client';

import { useState, useMemo } from 'react';
import { Building2, ChevronDown, Check, ArrowUpRight, ArrowDownRight } from 'lucide-react';

/* ── Broker definitions ── */
const BROKERS = [
  { id: 'vps', name: 'VPS', desc: 'VPS Securities', fee: '0.15%', color: '#3b82f6' },
  { id: 'ssi', name: 'SSI', desc: 'SSI Securities', fee: '0.15%', color: '#f97316' },
  { id: 'vndirect', name: 'VNDS', desc: 'VNDirect', fee: '0.18%', color: '#22c55e' },
  { id: 'tcbs', name: 'TCBS', desc: 'Techcom Securities', fee: '0.15%', color: '#ef4444' },
  { id: 'mbs', name: 'MBS', desc: 'MB Securities', fee: '0.15%', color: '#a855f7' },
] as const;

type OrderType = 'limit' | 'market' | 'stop';
type OrderSide = 'buy' | 'sell';

interface OrderPanelProps {
  symbol: string;
  currentPrice: number;
  currency?: string;
}

export default function OrderPanel({ symbol, currentPrice, currency = 'USD' }: OrderPanelProps) {
  const [broker, setBroker] = useState<(typeof BROKERS)[number]['id']>(BROKERS[0].id);
  const [orderType, setOrderType] = useState<OrderType>('limit');
  const [side, setSide] = useState<OrderSide>('buy');
  const [quantity, setQuantity] = useState('100');
  const [price, setPrice] = useState(currentPrice.toFixed(2));
  const [stopPrice, setStopPrice] = useState((currentPrice * 0.95).toFixed(2));
  const [showBrokerPicker, setShowBrokerPicker] = useState(false);

  const selectedBroker = BROKERS.find((b) => b.id === broker)!;

  const orderTypes: { key: OrderType; label: string }[] = [
    { key: 'limit', label: 'Giới hạn' },
    { key: 'market', label: 'Thị trường' },
    { key: 'stop', label: 'Điều kiện' },
  ];

  const qty = parseInt(quantity) || 0;
  const prc = parseFloat(price) || 0;
  const estimatedValue = useMemo(() => {
    if (orderType === 'market') return qty * currentPrice;
    return qty * prc;
  }, [qty, prc, currentPrice, orderType]);

  const feeRate = parseFloat(selectedBroker.fee) / 100;
  const fee = estimatedValue * feeRate;

  const quickQuantities = [10, 50, 100, 500, 1000];

  const handleSubmit = () => {
    alert(
      `[DEMO] Đặt lệnh ${side === 'buy' ? 'MUA' : 'BÁN'} ${qty} ${symbol}\n` +
      `Loại: ${orderType}\n` +
      `Giá: ${orderType === 'market' ? 'Thị trường' : price}\n` +
      `Broker: ${selectedBroker.name}\n` +
      `Giá trị ước tính: ${formatMoney(estimatedValue)}`
    );
  };

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      {/* ── Header ── */}
      <div className="flex items-center justify-between border-b border-border bg-muted/30 px-4 py-3">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-bold text-foreground">Đặt lệnh</h3>
        </div>
        <span className="badge badge-demo text-[10px]">Demo</span>
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
            <span className="font-mono font-bold text-sm text-foreground">{formatMoney(currentPrice)}</span>
          </div>
        )}

        {/* ── Quantity ── */}
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Khối lượng</label>
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
            {quickQuantities.map((q) => (
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
            ))}
          </div>
        </div>

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
              {formatMoney(estimatedValue + (side === 'buy' ? fee : -fee))}
            </span>
          </div>
        </div>

        {/* ── Submit button ── */}
        <button
          onClick={handleSubmit}
          disabled={qty <= 0}
          className={`w-full py-2.5 rounded-lg text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
            side === 'buy'
              ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
              : 'bg-red-500 hover:bg-red-600 text-white'
          }`}
        >
          {side === 'buy' ? 'MUA' : 'BÁN'} {symbol} — {qty > 0 ? formatMoney(estimatedValue) : '—'}
        </button>

        {/* ── Disclaimer ── */}
        <p className="text-[10px] text-muted-foreground/50 text-center leading-tight">
          Giao diện demo, không kết nối sàn thật. Không có lệnh nào được thực thi.
        </p>
      </div>
    </div>
  );
}

/* ── Helpers ── */
function formatMoney(v: number) {
  return v.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });
}
