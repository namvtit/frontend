'use client';

import {
  AlertTriangle,
  TrendingDown,
  DollarSign,
  Activity,
  ChevronDown,
  ChevronUp,
  Shield,
  BarChart3,
} from 'lucide-react';
import { useState } from 'react';

/* ── Mock Data ── */
const MOCK_RISK_DATA = {
  totalCapital: 487234.56,
  pnl: 12845.32,
  pnlPercent: 2.64,
  riskScore: 62, // 0-100
  currentDrawdown: 4.8, // %
  maxDrawdown: 15, // % threshold
  openRiskTotal: 24361.73,
  openRiskPercent: 5.0,
};

const MOCK_ALERTS = [
  {
    id: 'a1',
    type: 'warning' as const,
    title: 'Rủi ro mỗi lệnh đang cao',
    description: 'Lệnh NVDA chiếm 8.2% tổng vốn, vượt ngưỡng 5% khuyến nghị.',
  },
  {
    id: 'a2',
    type: 'danger' as const,
    title: 'Drawdown vượt ngưỡng',
    description: 'Drawdown hiện tại 4.8% đang tiến gần ngưỡng cảnh báo 5%.',
  },
  {
    id: 'a3',
    type: 'warning' as const,
    title: 'Đòn bẩy cao',
    description: 'Tổng đòn bẩy danh mục đang ở mức 2.3x, vượt mức an toàn 2x.',
  },
  {
    id: 'a4',
    type: 'info' as const,
    title: 'Risk/Reward chưa tốt',
    description: '3/5 lệnh đang mở có tỷ lệ R:R dưới 1:2. Nên cân nhắc điều chỉnh SL/TP.',
  },
];

/* ── Risk Score Label ── */
function getRiskInfo(score: number) {
  if (score <= 33) return { label: 'Thấp', color: '#10b981' };
  if (score <= 66) return { label: 'Trung bình', color: '#f97316' };
  return { label: 'Cao', color: '#ef4444' };
}

/* ── Risk Gauge (matches FearIndexBanner donut style) ── */
function RiskGauge({ score }: { score: number }) {
  const { color, label } = getRiskInfo(score);
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-3 flex-shrink-0">
      <div className="relative w-[140px] h-[140px]">
        <svg width="140" height="140" viewBox="0 0 140 140" className="transform -rotate-90">
          {/* Background ring */}
          <circle cx="70" cy="70" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="16" className="dark:stroke-zinc-700" />
          {/* Value ring */}
          <circle
            cx="70" cy="70" r={radius} fill="none"
            stroke={color} strokeWidth="16"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-1000"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-2xl font-bold text-foreground">{score}</div>
          <div className="text-[10px] text-muted-foreground text-center">{label}</div>
        </div>
      </div>
    </div>
  );
}

/* ── Alert Item ── */
function AlertItem({ alert }: { alert: typeof MOCK_ALERTS[0] }) {
  const colorMap = {
    danger: 'text-red-500',
    warning: 'text-orange-500',
    info: 'text-muted-foreground',
  };

  return (
    <div className="flex gap-3 p-3 rounded-lg border border-border hover:bg-secondary/50 transition-colors">
      <AlertTriangle className={`h-4 w-4 mt-0.5 shrink-0 ${colorMap[alert.type]}`} />
      <div className="min-w-0">
        <p className="text-sm font-semibold text-foreground">{alert.title}</p>
        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{alert.description}</p>
      </div>
    </div>
  );
}

/* ── Main Component ── */
export function RiskManagementCard() {
  const [showAlerts, setShowAlerts] = useState(true);
  const data = MOCK_RISK_DATA;
  const isPositivePnl = data.pnl >= 0;
  const drawdownRatio = (data.currentDrawdown / data.maxDrawdown) * 100;
  const { color: riskColor } = getRiskInfo(data.riskScore);

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      {/* Header – matches AlertsAndNews / EconomicCalendar header style */}
      <div className="flex items-center justify-between border-b border-border bg-muted/30 p-4">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-orange-500" />
          <h2 className="text-lg font-bold text-foreground">Quản trị rủi ro</h2>
        </div>
        <span className="inline-block px-2 py-1 rounded bg-secondary text-xs font-medium text-foreground">
          DEMO
        </span>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="flex flex-col md:flex-row items-start gap-6">
          {/* Risk Gauge – same pattern as FearIndexBanner */}
          <RiskGauge score={data.riskScore} />

          {/* Metrics Grid */}
          <div className="flex-1 w-full grid gap-3 sm:grid-cols-2">
            {/* Tổng vốn */}
            <div className="p-3 rounded-lg border border-border hover:bg-secondary/50 transition-colors">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">Tổng vốn</span>
              </div>
              <p className="text-lg font-bold text-foreground">
                ${data.totalCapital.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
            </div>

            {/* PnL */}
            <div className="p-3 rounded-lg border border-border hover:bg-secondary/50 transition-colors">
              <div className="flex items-center gap-2 mb-1">
                <Activity className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">PnL tạm tính</span>
              </div>
              <p className={`text-lg font-bold ${isPositivePnl ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                {isPositivePnl ? '+' : ''}${data.pnl.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
              <span className={`text-xs font-semibold ${isPositivePnl ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                {isPositivePnl ? '+' : ''}{data.pnlPercent.toFixed(2)}%
              </span>
            </div>

            {/* Drawdown */}
            <div className="p-3 rounded-lg border border-border hover:bg-secondary/50 transition-colors">
              <div className="flex items-center gap-2 mb-1">
                <TrendingDown className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">Drawdown hiện tại</span>
              </div>
              <p className="text-lg font-bold text-foreground">{data.currentDrawdown}%</p>
              {/* Progress bar – matches confidence bar style from ai-suggestions */}
              <div className="mt-1.5 w-full h-1.5 rounded-full bg-secondary overflow-hidden">
                <div
                  className="h-full transition-all"
                  style={{
                    width: `${Math.min(drawdownRatio, 100)}%`,
                    backgroundColor: drawdownRatio > 80 ? '#ef4444' : drawdownRatio > 50 ? '#f97316' : '#10b981',
                  }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">Ngưỡng tối đa: {data.maxDrawdown}%</p>
            </div>

            {/* Tổng rủi ro đang mở */}
            <div className="p-3 rounded-lg border border-border hover:bg-secondary/50 transition-colors">
              <div className="flex items-center gap-2 mb-1">
                <BarChart3 className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">Rủi ro đang mở</span>
              </div>
              <p className="text-lg font-bold text-foreground">
                ${data.openRiskTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
              <span className="text-xs font-semibold" style={{ color: riskColor }}>
                {data.openRiskPercent}% tổng vốn
              </span>
            </div>
          </div>
        </div>

        {/* Alerts – same expand pattern, list style matches AlertsAndNews */}
        <div className="mt-6 pt-4 border-t border-border/50">
          <button
            onClick={() => setShowAlerts(!showAlerts)}
            className="flex items-center gap-2 w-full text-left group"
          >
            <AlertTriangle className="h-4 w-4 text-orange-500" />
            <span className="text-sm font-bold text-foreground">
              Cảnh báo ({MOCK_ALERTS.length})
            </span>
            {showAlerts ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground ml-auto group-hover:text-foreground transition-colors" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground ml-auto group-hover:text-foreground transition-colors" />
            )}
          </button>

          {showAlerts && (
            <div className="mt-3 space-y-2 slide-up">
              {MOCK_ALERTS.map((alert) => (
                <AlertItem key={alert.id} alert={alert} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
