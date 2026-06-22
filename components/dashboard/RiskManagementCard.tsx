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
import { useDemo } from '@/lib/demo';

/* ── Risk Score Label ── */
function getRiskInfo(score: number) {
  if (score <= 33) return { label: 'Thấp', color: '#10b981' };
  if (score <= 66) return { label: 'Trung bình', color: '#f97316' };
  return { label: 'Cao', color: '#ef4444' };
}

/* ── Risk Gauge ── */
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

interface RiskAlert {
  id: string;
  type: 'danger' | 'warning' | 'info';
  title: string;
  description: string;
}

/* ── Alert Item ── */
function AlertItem({ alert }: { alert: RiskAlert }) {
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
  const { state, portfolio } = useDemo();
  const [showAlerts, setShowAlerts] = useState(true);

  // Dynamic calculations based on state and portfolio
  const totalCapital = portfolio.totalAccountValue;
  const pnl = portfolio.unrealizedPnL;
  const pnlPercent = portfolio.unrealizedPnLPercent;
  const isPositivePnl = pnl >= 0;

  // Calculate Equities Ratio (how much of portfolio value is in stocks vs cash)
  const equitiesRatio = totalCapital > 0 ? portfolio.totalMarketValue / totalCapital : 0;

  // Calculate weighted risk factor for holdings
  let weightedRisk = 0;
  if (portfolio.totalMarketValue > 0) {
    const riskFactors: Record<string, number> = {
      NVDA: 85,
      TSLA: 90,
      AAPL: 50,
      MSFT: 50,
      JPM: 35,
      'BRK.B': 30,
      SPY: 25,
      QQQ: 40,
    };
    let totalRiskPoints = 0;
    for (const h of portfolio.holdingDetails) {
      const factor = riskFactors[h.symbol] ?? 55;
      totalRiskPoints += h.marketValue * factor;
    }
    weightedRisk = totalRiskPoints / portfolio.totalMarketValue;
  }

  // Risk Score: starts at 10 (low risk cash), scales with equities ratio and stock volatility up to 95
  const riskScore = Math.round(
    Math.max(10, Math.min(95, equitiesRatio * (weightedRisk || 50) + (1 - equitiesRatio) * 10))
  );

  // Drawdown: Total of negative PnLs divided by total capital
  const negativePnL = portfolio.holdingDetails
    .filter((h) => h.unrealizedPnL < 0)
    .reduce((sum, h) => sum + h.unrealizedPnL, 0);
  const currentDrawdown = totalCapital > 0
    ? Math.round((Math.abs(negativePnL) / totalCapital) * 100 * 10) / 10
    : 0;

  const maxDrawdown = 15; // standard threshold
  const drawdownRatio = (currentDrawdown / maxDrawdown) * 100;

  // Open risk total (market value scaled by risk score)
  const openRiskTotal = portfolio.totalMarketValue * (riskScore / 100);
  const openRiskPercent = totalCapital > 0 ? Math.round((openRiskTotal / totalCapital) * 100 * 10) / 10 : 0;

  const { color: riskColor } = getRiskInfo(riskScore);

  // Dynamic alerts generation
  const alerts: RiskAlert[] = [];

  // 1. Position size alert
  for (const h of portfolio.holdingDetails) {
    if (h.allocationPercent > 10) {
      alerts.push({
        id: `a_pos_${h.symbol}`,
        type: h.allocationPercent > 20 ? 'danger' : 'warning',
        title: 'Tỷ trọng vị thế cao',
        description: `Mã ${h.symbol} chiếm ${h.allocationPercent.toFixed(1)}% tổng tài sản, vượt ngưỡng an toàn khuyến nghị (10%).`,
      });
    }
  }

  // 2. Drawdown alert
  if (currentDrawdown > 8) {
    alerts.push({
      id: 'a_drawdown',
      type: 'danger',
      title: 'Drawdown vượt ngưỡng',
      description: `Drawdown hiện tại ${currentDrawdown}% đang ở mức cao. Vui lòng kiểm soát các vị thế thua lỗ.`,
    });
  } else if (currentDrawdown > 4) {
    alerts.push({
      id: 'a_drawdown',
      type: 'warning',
      title: 'Drawdown gia tăng',
      description: `Drawdown hiện tại ${currentDrawdown}% đang tiếp cận ngưỡng cảnh báo (5%).`,
    });
  }

  // 3. Low cash alert
  const cashPercent = totalCapital > 0 ? (state.cashBalance / totalCapital) * 100 : 0;
  if (cashPercent < 15 && totalCapital > 0) {
    alerts.push({
      id: 'a_cash',
      type: 'warning',
      title: 'Sức mua hạn chế',
      description: `Số dư tiền mặt khả dụng chỉ còn ${cashPercent.toFixed(1)}% tổng tài sản. Cân nhắc thu hẹp danh mục trước khi mua mới.`,
    });
  }

  // 4. General risk alert
  if (riskScore > 66) {
    alerts.push({
      id: 'a_risk',
      type: 'danger',
      title: 'Điểm rủi ro danh mục cao',
      description: `Mức độ rủi ro hiện tại là ${riskScore}/100 do tập trung tỷ trọng lớn vào các nhóm cổ phiếu biến động mạnh.`,
    });
  } else if (portfolio.holdingDetails.length === 0) {
    alerts.push({
      id: 'a_empty',
      type: 'info',
      title: 'Danh mục trống',
      description: 'Chưa có vị thế cổ phiếu nào đang mở. Rủi ro ở mức tối thiểu.',
    });
  } else {
    alerts.push({
      id: 'a_info',
      type: 'info',
      title: 'Phân bổ hợp lý',
      description: 'Danh mục hiện tại đang được đa dạng hóa ổn định.',
    });
  }

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border bg-muted/30 p-4">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-orange-500" />
          <h2 className="text-lg font-bold text-foreground">Quản trị rủi ro</h2>
        </div>
        <span className="badge badge-demo text-[10px]">
          Live Risk Analysis
        </span>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="flex flex-col md:flex-row items-start gap-6">
          {/* Risk Gauge */}
          <RiskGauge score={riskScore} />

          {/* Metrics Grid */}
          <div className="flex-1 w-full grid gap-3 sm:grid-cols-2">
            {/* Tổng vốn */}
            <div className="p-3 rounded-lg border border-border hover:bg-secondary/50 transition-colors">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">Tổng tài sản (Nav)</span>
              </div>
              <p className="text-lg font-bold text-foreground">
                ${totalCapital.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
            </div>

            {/* PnL */}
            <div className="p-3 rounded-lg border border-border hover:bg-secondary/50 transition-colors">
              <div className="flex items-center gap-2 mb-1">
                <Activity className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">PnL tạm tính</span>
              </div>
              <p className={`text-lg font-bold ${isPositivePnl ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                {isPositivePnl ? '+' : ''}${pnl.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
              <span className={`text-xs font-semibold ${isPositivePnl ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                {isPositivePnl ? '+' : ''}{pnlPercent.toFixed(2)}%
              </span>
            </div>

            {/* Drawdown */}
            <div className="p-3 rounded-lg border border-border hover:bg-secondary/50 transition-colors">
              <div className="flex items-center gap-2 mb-1">
                <TrendingDown className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">Drawdown hiện tại</span>
              </div>
              <p className="text-lg font-bold text-foreground">{currentDrawdown}%</p>
              {/* Progress bar */}
              <div className="mt-1.5 w-full h-1.5 rounded-full bg-secondary overflow-hidden">
                <div
                  className="h-full transition-all"
                  style={{
                    width: `${Math.min(drawdownRatio, 100)}%`,
                    backgroundColor: drawdownRatio > 80 ? '#ef4444' : drawdownRatio > 50 ? '#f97316' : '#10b981',
                  }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">Ngưỡng tối đa: {maxDrawdown}%</p>
            </div>

            {/* Tổng rủi ro đang mở */}
            <div className="p-3 rounded-lg border border-border hover:bg-secondary/50 transition-colors">
              <div className="flex items-center gap-2 mb-1">
                <BarChart3 className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">Rủi ro đang mở</span>
              </div>
              <p className="text-lg font-bold text-foreground">
                ${openRiskTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
              <span className="text-xs font-semibold" style={{ color: riskColor }}>
                {openRiskPercent}% tổng vốn
              </span>
            </div>
          </div>
        </div>

        {/* Alerts */}
        <div className="mt-6 pt-4 border-t border-border/50">
          <button
            onClick={() => setShowAlerts(!showAlerts)}
            className="flex items-center gap-2 w-full text-left group"
          >
            <AlertTriangle className="h-4 w-4 text-orange-500" />
            <span className="text-sm font-bold text-foreground">
              Cảnh báo ({alerts.length})
            </span>
            {showAlerts ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground ml-auto group-hover:text-foreground transition-colors" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground ml-auto group-hover:text-foreground transition-colors" />
            )}
          </button>

          {showAlerts && (
            <div className="mt-3 space-y-2 slide-up">
              {alerts.map((alert) => (
                <AlertItem key={alert.id} alert={alert} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
