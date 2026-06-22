// ── Replay Orchestrator Component ──
// Displays overall replay status and controls

'use client';

import React from 'react';
import { useReplay } from '@/lib/demo/replay';
import { cn } from '@/lib/utils';
import {
  Bot,
  Clock,
  RefreshCw,
  BarChart3,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';

export function ReplayOrchestrator() {
  const { state, resetReplay } = useReplay();
  const { currentDate, currentDay, phase, initialCapital, holdings, cashBalance, currentPrice, config, decisions, currentDecisionIndex } = state;

  const totalHoldingsValue = Object.values(holdings).reduce((acc, h) => {
    const price = currentPrice[h.symbol] || h.avgPrice;
    return acc + price * h.quantity;
  }, 0);
  
  const totalValue = cashBalance + totalHoldingsValue;
  const pnl = totalValue - initialCapital;
  const pnlPercent = initialCapital > 0 ? (pnl / initialCapital) * 100 : 0;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const resolvedCount = decisions.filter(d => d.status === 'resolved').length;
  const currentDecision = decisions[currentDecisionIndex];

  return (
    <div className="bg-card/80 backdrop-blur-sm rounded-xl border border-border p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bot className="w-5 h-5 text-primary" />
          <div>
            <h2 className="font-semibold text-foreground">PISI Market Replay</h2>
            <p className="text-xs text-muted-foreground">
              {config.seed === 'golden' ? 'Chế độ Golden' : 'Chế độ Resilience'}
            </p>
          </div>
        </div>
        {phase !== 'onboarding-capital' && phase !== 'onboarding-risk' && (
          <button
            onClick={resetReplay}
            className="p-2 rounded-lg hover:bg-muted/50 transition-colors"
            title="Bắt đầu lại"
          >
            <RefreshCw className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Progress */}
      {phase !== 'onboarding-capital' && phase !== 'onboarding-risk' && (
        <>
          {/* Decision Progress */}
          <div className="bg-muted/40 rounded-xl p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-foreground">Quyết định</span>
              <span className="text-xs text-muted-foreground">
                {resolvedCount} / 5
              </span>
            </div>
            <div className="flex gap-1">
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className={cn(
                    "flex-1 h-1.5 rounded-full transition-all",
                    i < resolvedCount
                      ? "bg-primary"
                      : i === currentDecisionIndex
                      ? "bg-primary/50"
                      : "bg-muted-foreground/20"
                  )}
                />
              ))}
            </div>
            {currentDecision && currentDecision.status === 'pending' && (
              <p className="text-[10px] text-primary mt-2">
                Đang chờ: {currentDecision.title}
              </p>
            )}
          </div>

          {/* Date & Day */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>Ngày {currentDay} • {formatDate(currentDate)}</span>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-muted/40 rounded-lg p-2">
              <p className="text-[10px] text-muted-foreground">Vốn ban đầu</p>
              <p className="text-sm font-bold text-foreground font-mono">
                {(initialCapital / 1e6).toFixed(0)}M
              </p>
            </div>
            <div className="bg-muted/40 rounded-lg p-2">
              <p className="text-[10px] text-muted-foreground">NAV hiện tại</p>
              <p className="text-sm font-bold text-foreground font-mono">
                {(totalValue / 1e6).toFixed(1)}M
              </p>
            </div>
          </div>

          {/* P&L */}
          <div className="pt-3 border-t border-border">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-muted-foreground">P&L</span>
              <span className={cn(
                "font-semibold font-mono flex items-center gap-1",
                pnl >= 0 ? "text-emerald-500" : "text-red-500"
              )}>
                {pnl >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {pnl >= 0 ? '+' : ''}{(pnl / 1e6).toFixed(1)}M ({pnlPercent >= 0 ? '+' : ''}{pnlPercent.toFixed(1)}%)
              </span>
            </div>
          </div>
        </>
      )}

      {/* Onboarding Status */}
      {(phase === 'onboarding-capital' || phase === 'onboarding-risk') && (
        <div className="text-center py-4">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-primary/10 flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-primary" />
          </div>
          <p className="text-sm text-muted-foreground">
            {phase === 'onboarding-capital' 
              ? 'Chọn vốn đầu tư để bắt đầu'
              : 'Chọn hồ sơ rủi ro của bạn'}
          </p>
        </div>
      )}
    </div>
  );
}
