'use client';

import { useState } from 'react';
import {
  Lightbulb,
  TrendingUp,
  TrendingDown,
  Pause,
  Clock,
  Star,
  Shield,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  X,
} from 'lucide-react';

/* ── Types ── */
interface AiSuggestion {
  id: string;
  symbol: string;
  signal: 'BUY' | 'SELL' | 'HOLD' | 'WAIT';
  confidence: number;
  riskLevel: 'low' | 'medium' | 'high';
  entryZone: string;
  stopLoss: string;
  takeProfit: string;
  riskReward: string;
  reason: string;
  warning: string;
  timeframe: string;
}

/* ── Mock Data ── */
const MOCK_SUGGESTIONS: AiSuggestion[] = [
  {
    id: 's1',
    symbol: 'BTCUSDT',
    signal: 'BUY',
    confidence: 78,
    riskLevel: 'medium',
    entryZone: '$101,200 – $102,500',
    stopLoss: '$98,800',
    takeProfit: '$108,500',
    riskReward: '1:2.4',
    reason: 'BTC đang tích lũy trên vùng hỗ trợ mạnh $100K, RSI divergence tăng trên khung H4, volume mua tăng dần.',
    warning: 'Biến động cao quanh vùng $100K. Có thể xảy ra false breakout.',
    timeframe: 'H4 – D1',
  },
  {
    id: 's2',
    symbol: 'ETHUSDT',
    signal: 'WAIT',
    confidence: 45,
    riskLevel: 'high',
    entryZone: '$3,850 – $3,920',
    stopLoss: '$3,700',
    takeProfit: '$4,200',
    riskReward: '1:1.8',
    reason: 'ETH đang sideways, chưa có tín hiệu breakout rõ ràng. MACD ngang, volume giảm dần.',
    warning: 'Tín hiệu chưa rõ ràng, chờ xác nhận từ BTC. Không nên vào lệnh lúc này.',
    timeframe: 'H4',
  },
  {
    id: 's3',
    symbol: 'XAUUSD',
    signal: 'SELL',
    confidence: 72,
    riskLevel: 'medium',
    entryZone: '$2,385 – $2,395',
    stopLoss: '$2,415',
    takeProfit: '$2,340',
    riskReward: '1:2.2',
    reason: 'Vàng đang ở vùng kháng cự mạnh, hình thành double top trên D1. DXY có dấu hiệu hồi phục.',
    warning: 'Tin tức CPI sắp công bố có thể gây biến động mạnh bất ngờ.',
    timeframe: 'D1',
  },
  {
    id: 's4',
    symbol: 'NVDA',
    signal: 'BUY',
    confidence: 85,
    riskLevel: 'low',
    entryZone: '$132.00 – $136.00',
    stopLoss: '$127.50',
    takeProfit: '$152.00',
    riskReward: '1:3.1',
    reason: 'Báo cáo doanh thu kỷ lục, trend tăng mạnh. AI demand tiếp tục tăng. Cup & handle pattern trên weekly.',
    warning: 'PE ratio cao. Có thể xảy ra profit-taking ngắn hạn sau earnings.',
    timeframe: 'W1',
  },
  {
    id: 's5',
    symbol: 'AAPL',
    signal: 'HOLD',
    confidence: 60,
    riskLevel: 'low',
    entryZone: '$210.00 – $215.00',
    stopLoss: '$205.00',
    takeProfit: '$230.00',
    riskReward: '1:2.5',
    reason: 'AAPL đang trong uptrend nhẹ. Vision Pro 2 là catalyst tích cực. Giữ vị thế hiện tại.',
    warning: 'Cạnh tranh mạnh từ Samsung và Meta trong mảng XR.',
    timeframe: 'D1 – W1',
  },
];

/* ── Action Color & Icon – matches ai-suggestions.tsx getActionColor/getActionIcon ── */
function getActionColor(signal: string) {
  switch (signal) {
    case 'BUY': return 'bg-emerald-600/10 border-emerald-600/30 text-emerald-700 dark:text-emerald-400';
    case 'SELL': return 'bg-red-600/10 border-red-600/30 text-red-700 dark:text-red-400';
    case 'HOLD': return 'bg-slate-600/10 border-slate-600/30 text-slate-700 dark:text-slate-400';
    case 'WAIT': return 'bg-orange-600/10 border-orange-600/30 text-orange-700 dark:text-orange-400';
    default: return 'bg-slate-600/10 border-slate-600/30';
  }
}

function getActionIcon(signal: string) {
  switch (signal) {
    case 'BUY': return <TrendingUp className="h-4 w-4" />;
    case 'SELL': return <TrendingDown className="h-4 w-4" />;
    case 'HOLD': return <Pause className="h-4 w-4" />;
    case 'WAIT': return <Clock className="h-4 w-4" />;
    default: return null;
  }
}

function getRiskLabel(level: string) {
  switch (level) {
    case 'low': return { label: 'Thấp', className: 'text-emerald-600 dark:text-emerald-400' };
    case 'medium': return { label: 'Trung bình', className: 'text-orange-600 dark:text-orange-400' };
    case 'high': return { label: 'Cao', className: 'text-red-600 dark:text-red-400' };
    default: return { label: level, className: 'text-muted-foreground' };
  }
}

/* ── Suggestion Card – follows the same card style as ai-suggestions.tsx ── */
function SuggestionCard({ suggestion }: { suggestion: AiSuggestion }) {
  const [expanded, setExpanded] = useState(false);
  const risk = getRiskLabel(suggestion.riskLevel);

  return (
    <div className="group rounded-lg border border-border bg-card p-6 hover:border-primary/50 transition-all hover:shadow-lg">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h3 className="font-semibold text-foreground">{suggestion.symbol}</h3>
          <span className="text-xs text-muted-foreground">Timeframe: {suggestion.timeframe}</span>
        </div>
        {/* Action Badge – same style as ai-suggestions */}
        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold ${getActionColor(suggestion.signal)}`}>
          {getActionIcon(suggestion.signal)}
          {suggestion.signal}
        </div>
      </div>

      {/* Confidence – same bar style as ai-suggestions */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-muted-foreground">Confidence</span>
          <span className="text-xs font-semibold text-foreground">{suggestion.confidence}%</span>
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

      {/* Risk Level */}
      <div className="mb-3 flex items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground">Risk:</span>
        <span className={`text-xs font-semibold ${risk.className}`}>{risk.label}</span>
        <span className="text-xs text-muted-foreground">•</span>
        <span className="text-xs font-medium text-muted-foreground">R:R</span>
        <span className="text-xs font-semibold text-foreground">{suggestion.riskReward}</span>
      </div>

      {/* Key Levels */}
      <div className="mb-3 flex flex-wrap gap-2">
        <span className="inline-block px-2 py-1 rounded bg-secondary text-xs font-medium text-foreground">
          Entry: {suggestion.entryZone}
        </span>
        <span className="inline-block px-2 py-1 rounded bg-secondary text-xs font-medium text-red-600 dark:text-red-400">
          SL: {suggestion.stopLoss}
        </span>
        <span className="inline-block px-2 py-1 rounded bg-secondary text-xs font-medium text-emerald-600 dark:text-emerald-400">
          TP: {suggestion.takeProfit}
        </span>
      </div>

      {/* Reasoning */}
      <p className="text-xs text-muted-foreground italic mb-3">{suggestion.reason}</p>

      {/* Expand for more */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
      >
        {expanded ? 'Thu gọn' : 'Xem chi tiết'}
        {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </button>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-border/50 space-y-3 slide-up">
          {/* Warning */}
          <div className="flex gap-2 p-3 rounded-lg border border-border">
            <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground leading-relaxed">{suggestion.warning}</p>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-foreground hover:bg-secondary/50 transition-colors">
              <Star className="h-3 w-3" /> Thêm Wishlist
            </button>
            <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-foreground hover:bg-secondary/50 transition-colors">
              <Shield className="h-3 w-3" /> Tạo kế hoạch rủi ro
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Detail Modal ── */
function DetailModal({
  suggestion,
  onClose,
}: {
  suggestion: AiSuggestion;
  onClose: () => void;
}) {
  const risk = getRiskLabel(suggestion.riskLevel);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg rounded-lg border border-border bg-card shadow-2xl slide-up overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
          <div className="flex items-center gap-3">
            <h3 className="font-bold text-foreground">{suggestion.symbol}</h3>
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold ${getActionColor(suggestion.signal)}`}>
              {getActionIcon(suggestion.signal)}
              {suggestion.signal}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors p-1"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Confidence */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-muted-foreground">Confidence</span>
              <span className="text-xs font-semibold text-foreground">{suggestion.confidence}%</span>
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

          {/* Levels */}
          <div className="flex flex-wrap gap-2">
            <span className="inline-block px-2 py-1 rounded bg-secondary text-xs font-medium text-foreground">
              Entry: {suggestion.entryZone}
            </span>
            <span className="inline-block px-2 py-1 rounded bg-secondary text-xs font-medium text-red-600 dark:text-red-400">
              SL: {suggestion.stopLoss}
            </span>
            <span className="inline-block px-2 py-1 rounded bg-secondary text-xs font-medium text-emerald-600 dark:text-emerald-400">
              TP: {suggestion.takeProfit}
            </span>
          </div>

          {/* Risk & R:R */}
          <div className="flex items-center gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Risk: </span>
              <span className={`font-semibold ${risk.className}`}>{risk.label}</span>
            </div>
            <div>
              <span className="text-muted-foreground">R:R: </span>
              <span className="font-semibold text-foreground">{suggestion.riskReward}</span>
            </div>
            <div>
              <span className="text-muted-foreground">TF: </span>
              <span className="font-semibold text-foreground">{suggestion.timeframe}</span>
            </div>
          </div>

          {/* Reason */}
          <div>
            <p className="text-xs font-semibold text-foreground mb-1">Lý do phân tích</p>
            <p className="text-sm text-muted-foreground leading-relaxed">{suggestion.reason}</p>
          </div>

          {/* Warning */}
          <div className="flex gap-2 p-3 rounded-lg border border-border">
            <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground leading-relaxed">{suggestion.warning}</p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-border flex flex-wrap gap-2">
          <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-foreground hover:bg-secondary/50 transition-colors">
            <Star className="h-3.5 w-3.5" /> Thêm Wishlist
          </button>
          <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-foreground hover:bg-secondary/50 transition-colors">
            <Shield className="h-3.5 w-3.5" /> Tạo kế hoạch rủi ro
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main Component ── */
export function AiTradingSuggestions() {
  const [selectedSuggestion, setSelectedSuggestion] = useState<AiSuggestion | null>(null);
  const [filter, setFilter] = useState<'all' | 'BUY' | 'SELL' | 'HOLD' | 'WAIT'>('all');

  const filtered = filter === 'all'
    ? MOCK_SUGGESTIONS
    : MOCK_SUGGESTIONS.filter((s) => s.signal === filter);

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      {/* Header – matches EconomicCalendar / AlertsAndNews style */}
      <div className="flex items-center justify-between border-b border-border bg-muted/30 p-4">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-amber-500" />
          <div>
            <h2 className="text-lg font-bold text-foreground">Gợi ý giao dịch từ AI</h2>
            <p className="text-xs text-muted-foreground">{MOCK_SUGGESTIONS.length} gợi ý • Cập nhật lúc 10:30</p>
          </div>
        </div>
        <span className="inline-block px-2 py-1 rounded bg-secondary text-xs font-medium text-foreground">
          AI DEMO
        </span>
      </div>

      {/* Filter – uses the same pill style as existing stock tags */}
      <div className="px-4 pt-4 pb-2 flex gap-2 overflow-x-auto">
        {(['all', 'BUY', 'SELL', 'HOLD', 'WAIT'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap border ${
              filter === f
                ? 'bg-primary/10 border-primary/30 text-primary'
                : 'bg-secondary border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {f === 'all' ? 'Tất cả' : f}
            {f !== 'all' && (
              <span className="ml-1 opacity-70">
                ({MOCK_SUGGESTIONS.filter((s) => s.signal === f).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Suggestion List */}
      <div className="p-4 space-y-4">
        {filtered.length > 0 ? (
          filtered.map((suggestion) => (
            <SuggestionCard key={suggestion.id} suggestion={suggestion} />
          ))
        ) : (
          <div className="text-center py-8 text-muted-foreground text-sm">
            Không có gợi ý nào cho bộ lọc này.
          </div>
        )}
      </div>

      {/* Disclaimer */}
      <div className="border-t border-border bg-muted/10 p-3">
        <p className="text-[11px] text-muted-foreground leading-relaxed text-center">
          <span className="font-semibold">Disclaimer:</span> Gợi ý từ AI chỉ mang tính tham khảo, không phải lời khuyên tài chính.
          Quyết định đầu tư là trách nhiệm của bạn.
        </p>
      </div>

      {/* Modal */}
      {selectedSuggestion && (
        <DetailModal
          suggestion={selectedSuggestion}
          onClose={() => setSelectedSuggestion(null)}
        />
      )}
    </div>
  );
}
