'use client';

import { TrendingUp, TrendingDown } from 'lucide-react';
import type { ReactNode } from 'react';

interface MarketMetricProps {
  label: string;
  value: string;
  change: number;
  icon?: ReactNode;
  isLive?: boolean;
  flash?: 'up' | 'down' | null;
}

export function MarketMetric({ label, value, change, icon, isLive, flash }: MarketMetricProps) {
  const isPositive = change >= 0;

  const flashClass = flash === 'up' ? 'price-flash-up' : flash === 'down' ? 'price-flash-down' : '';

  return (
    <div className={`rounded-lg border border-border bg-card p-6 transition-colors ${flashClass}`}>
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm text-muted-foreground">{label}</p>
            {isLive && <span className="live-dot" title="Live data" />}
          </div>
          <p className="mt-2 text-2xl font-bold text-card-foreground font-mono tabular-nums">{value}</p>
          <div
            className={`mt-2 flex items-center gap-1 text-sm font-medium ${
              isPositive
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-red-600 dark:text-red-400'
            }`}
          >
            {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            <span className="tabular-nums">{isPositive ? '+' : ''}{change.toFixed(2)}%</span>
          </div>
        </div>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </div>
    </div>
  );
}
