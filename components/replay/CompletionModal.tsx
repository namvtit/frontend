// ── End-of-Demo Completion Modal ──
// Shown once when replay reaches day 365

'use client';

import React, { useState } from 'react';
import { useReplay } from '@/lib/demo/replay';
import { cn } from '@/lib/utils';
import {
  TrendingUp,
  TrendingDown,
  Award,
  BarChart3,
  RotateCcw,
  Share2,
  X,
  CheckCircle2,
  Minus,
} from 'lucide-react';

const USD_TO_VND = 25000;

function fmtVnd(value: number): string {
  return value.toLocaleString('vi-VN');
}

function fmtShortVnd(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
  return value.toLocaleString('vi-VN');
}

function MetricCard({
  label,
  value,
  sub,
  icon,
  valueClass,
}: {
  label: string;
  value: string;
  sub?: string;
  icon?: React.ReactNode;
  valueClass?: string;
}) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/40 border border-border">
      {icon && (
        <div className="p-2 rounded-lg bg-background shrink-0">{icon}</div>
      )}
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
        <p className={cn("text-xl font-bold font-mono text-foreground truncate", valueClass)}>
          {value}
        </p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function StrategyBadge({ accepted, total }: { accepted: number; total: number }) {
  const rate = total > 0 ? accepted / total : 0;
  let label = 'Chiến lược độc lập';
  let color = 'text-muted-foreground';
  if (rate >= 0.8) { label = 'Chiến lược tích cực'; color = 'text-emerald-500'; }
  else if (rate >= 0.5) { label = 'Chiến lược cân bằng'; color = 'text-primary'; }
  else if (rate > 0) { label = 'Chiến lược thận trọng'; color = 'text-amber-500'; }

  return (
    <div className={cn("flex items-center gap-1.5 text-xs font-semibold", color)}>
      {rate >= 0.5 ? <TrendingUp className="w-3.5 h-3.5" /> : rate > 0 ? <Minus className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
      {label}
      <span className="text-muted-foreground font-normal">({accepted}/{total} khuyến nghị)</span>
    </div>
  );
}

interface CompletionModalProps {
  onPlayAgain: () => void;
}

export function CompletionModal({ onPlayAgain }: CompletionModalProps) {
  const { state, resetReplay } = useReplay();
  const { metrics, initialCapital } = state;
  const [shareDone, setShareDone] = useState(false);
  const [shareError, setShareError] = useState(false);

  if (!metrics) return null;

  const { totalPnL, returnPercent, maxDrawdown, finalNAV, decisionsCompleted, pisiRecommendationsAccepted, pisiImpact } = metrics;

  const pnlPositive = totalPnL >= 0;
  const pnlColor = pnlPositive ? 'text-emerald-500' : 'text-red-500';
  const pnlBg = pnlPositive ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20';
  const pnlIcon = pnlPositive
    ? <TrendingUp className="w-5 h-5 text-emerald-500" />
    : <TrendingDown className="w-5 h-5 text-red-500" />;

  const pnlSign = pnlPositive ? '+' : '';
  const returnSign = returnPercent >= 0 ? '+' : '';

  const handleShare = async () => {
    setShareError(false);
    const finalVal = fmtVnd(finalNAV * USD_TO_VND);
    const returnPct = `${returnSign}${returnPercent.toFixed(1)}%`;
    const shareText = `PISI 1-Year Simulation Results\nFinal Portfolio: ${finalVal} VNĐ\nReturn: ${returnPct}\nMax Drawdown: -${maxDrawdown.toFixed(1)}%\nDecisions: ${decisionsCompleted}/5\n\nTry it at ${typeof window !== 'undefined' ? window.location.origin : 'finpilot.app'}`;

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: 'PISI 1-Year Simulation', text: shareText });
        setShareDone(true);
        return;
      } catch {
        // fall through to clipboard
      }
    }
    const clipboardText = `PISI 1-Year Simulation Results | Final: ${finalVal} VNĐ | Return: ${returnPct} | ${window.location.href}`;
    navigator.clipboard?.writeText(clipboardText).then(() => {
      setShareDone(true);
      setTimeout(() => setShareDone(false), 2500);
    }).catch(() => setShareError(true));
  };

  const handlePlayAgain = () => {
    resetReplay();
    onPlayAgain();
  };

  const handleBackdropClose = () => {
    resetReplay();
  };

  const initialCapFmt = fmtShortVnd(initialCapital * USD_TO_VND);
  const finalFmt = fmtShortVnd(finalNAV * USD_TO_VND);
  const pnlFmt = fmtVnd(Math.abs(totalPnL) * USD_TO_VND);
  const pnlPrefix = pnlPositive ? '+' : '-';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="completion-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleBackdropClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-lg bg-card rounded-2xl border border-border shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Decorative header band */}
        <div className="relative h-16 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent overflow-hidden">
          <div className="flex items-center justify-between px-6 h-full">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/20">
                <Award className="w-5 h-5 text-primary" />
              </div>
              <h2 id="completion-title" className="text-lg font-bold text-foreground">
                1-Year Simulation Completed
              </h2>
            </div>
            <button
              type="button"
              onClick={handleBackdropClose}
              className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-5">
          {/* Main P&L banner */}
          <div className={cn("flex items-center gap-4 rounded-xl p-4 border", pnlBg)}>
            {pnlIcon}
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Tổng P&amp;L</p>
              <span className={cn("text-2xl font-bold font-mono", pnlColor)}>
                {pnlPrefix}{pnlFmt} VNĐ
              </span>
            </div>
            <div className="ml-auto text-right">
              <span className={cn("text-xl font-bold font-mono", pnlColor)}>
                {returnSign}{returnPercent.toFixed(1)}%
              </span>
              <p className="text-xs text-muted-foreground">
                vs {initialCapFmt} VNĐ ban đầu
              </p>
            </div>
          </div>

          {/* Key metrics grid */}
          <div className="grid grid-cols-2 gap-3">
            <MetricCard
              label="Final Portfolio"
              value={`${finalFmt} VNĐ`}
              sub="NAV cuối kỳ"
              valueClass="text-foreground"
            />
            <MetricCard
              label="Max Drawdown"
              value={`-${maxDrawdown.toFixed(1)}%`}
              sub="Mức sụt giảm tối đa"
              valueClass="text-red-500"
            />
          </div>

          {/* Decisions + Strategy */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-muted/40 border border-border">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Quyết định hoàn thành</p>
                <p className="text-lg font-bold text-foreground">{decisionsCompleted} / 5</p>
              </div>
            </div>
            <div className="h-8 w-px bg-border" />
            <StrategyBadge accepted={pisiRecommendationsAccepted} total={decisionsCompleted} />
          </div>

          {/* Strategy summary */}
          <div className="flex items-start gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20">
            <BarChart3 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
            <p className="text-sm text-foreground leading-relaxed">{pisiImpact}</p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 px-6 pb-6">
          <button
            type="button"
            onClick={handlePlayAgain}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Play again
          </button>
          <button
            type="button"
            onClick={handleShare}
            className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-border text-foreground font-semibold text-sm hover:bg-muted/50 transition-colors"
          >
            {shareDone ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span className="text-emerald-500">Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4" />
                Share result
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
