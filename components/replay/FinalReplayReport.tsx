// ── Final Replay Report Component ──
// Displays comprehensive final report at end of replay

'use client';

import React from 'react';
import { useReplay } from '@/lib/demo/replay';
import { cn } from '@/lib/utils';
import {
  TrendingUp,
  TrendingDown,
  Target,
  Shield,
  BarChart3,
  Award,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

export function FinalReplayReport() {
  const { state } = useReplay();
  const { metrics, decisions, initialCapital } = state;

  if (!metrics) return null;

  const formatCurrency = (value: number) => {
    const abs = Math.abs(value);
    if (abs >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
    if (abs >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
    return value.toLocaleString('vi-VN');
  };

  const pnlColor = metrics.totalPnL >= 0 ? 'text-emerald-500' : 'text-red-500';
  const pnlBg = metrics.totalPnL >= 0 ? 'bg-emerald-500/10' : 'bg-red-500/10';

  return (
    <div className="bg-card/80 backdrop-blur-sm rounded-2xl border border-border p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10">
            <Award className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">Báo Cáo Tổng Kết</h2>
            <p className="text-xs text-muted-foreground">PISI Market Replay Results</p>
          </div>
        </div>
      </div>

      {/* Main P&L */}
      <div className={cn("rounded-xl p-5", pnlBg)}>
        <p className="text-xs text-muted-foreground mb-1">Tổng P&L</p>
        <div className="flex items-baseline gap-2">
          <span className={cn("text-3xl font-bold font-mono", pnlColor)}>
            {metrics.totalPnL >= 0 ? '+' : ''}{formatCurrency(metrics.totalPnL)}
          </span>
          <span className="text-sm text-muted-foreground">VNĐ</span>
        </div>
        <div className="flex items-center gap-4 mt-2">
          <span className={cn("text-sm font-semibold", pnlColor)}>
            {metrics.returnPercent >= 0 ? '+' : ''}{metrics.returnPercent.toFixed(2)}%
          </span>
          <span className="text-xs text-muted-foreground">
            vs {(initialCapital / 1e6).toFixed(0)}M vốn ban đầu
          </span>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-muted/40 rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-1">NAV cuối kỳ</p>
          <p className="text-lg font-bold text-foreground font-mono">
            {formatCurrency(metrics.finalNAV)}
          </p>
        </div>
        <div className="bg-muted/40 rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-1">Max Drawdown</p>
          <p className="text-lg font-bold text-red-500 font-mono">
            -{metrics.maxDrawdown.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* P&L Breakdown */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Chi tiết P&L
        </p>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
            <span className="text-xs text-muted-foreground">Realized P&L</span>
            <span className={cn(
              "text-sm font-semibold font-mono",
              metrics.realizedPnL >= 0 ? 'text-emerald-500' : 'text-red-500'
            )}>
              {metrics.realizedPnL >= 0 ? '+' : ''}{formatCurrency(metrics.realizedPnL)}
            </span>
          </div>
          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
            <span className="text-xs text-muted-foreground">Unrealized P&L</span>
            <span className={cn(
              "text-sm font-semibold font-mono",
              metrics.unrealizedPnL >= 0 ? 'text-emerald-500' : 'text-red-500'
            )}>
              {metrics.unrealizedPnL >= 0 ? '+' : ''}{formatCurrency(metrics.unrealizedPnL)}
            </span>
          </div>
        </div>
      </div>

      {/* Decision Stats */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Thống kê quyết định
        </p>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
            <span className="text-xs text-muted-foreground">Quyết định hoàn thành</span>
            <span className="text-sm font-semibold text-foreground">
              {metrics.decisionsCompleted} / 5
            </span>
          </div>
          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
            <span className="text-xs text-muted-foreground">PISI recommendations</span>
            <span className="text-sm font-semibold text-primary">
              {metrics.pisiRecommendationsAccepted}
            </span>
          </div>
        </div>
      </div>

      {/* Contributors */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Đóng góp hiệu suất
        </p>
        <div className="space-y-2">
          <div className="flex items-center justify-between p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-lg">
            <div className="flex items-center gap-2">
              <ArrowUpRight className="w-4 h-4 text-emerald-500" />
              <span className="text-sm text-foreground">Top contributor</span>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-emerald-500">{metrics.topContributor.symbol}</p>
              <p className="text-xs text-muted-foreground">+{metrics.topContributor.returnPercent.toFixed(1)}%</p>
            </div>
          </div>
          <div className="flex items-center justify-between p-3 bg-red-500/5 border border-red-500/20 rounded-lg">
            <div className="flex items-center gap-2">
              <ArrowDownRight className="w-4 h-4 text-red-500" />
              <span className="text-sm text-foreground">Yếu nhất</span>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-red-500">{metrics.weakestContributor.symbol}</p>
              <p className="text-xs text-muted-foreground">{metrics.weakestContributor.returnPercent.toFixed(1)}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* PISI Impact */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <BarChart3 className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold text-primary">PISI IMPACT</span>
        </div>
        <p className="text-sm text-foreground leading-relaxed">
          {metrics.pisiImpact}
        </p>
      </div>

      {/* Buy & Hold Comparison */}
      <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Buy & Hold Return</span>
        </div>
        <span className={cn(
          "text-sm font-semibold font-mono",
          metrics.buyAndHoldReturn >= 0 ? 'text-emerald-500' : 'text-red-500'
        )}>
          {metrics.buyAndHoldReturn >= 0 ? '+' : ''}{metrics.buyAndHoldReturn.toFixed(1)}%
        </span>
      </div>
    </div>
  );
}
