'use client';

import { TrendingUp, TrendingDown } from 'lucide-react';
import type { ReactNode } from 'react';

interface MarketMetricProps {
  label: string;
  value: string;
  change: number;
  icon?: ReactNode;
}

export function MarketMetric({ label, value, change, icon }: MarketMetricProps) {
  const isPositive = change >= 0;

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-2 text-2xl font-bold text-card-foreground">{value}</p>
          <div
            className={`mt-2 flex items-center gap-1 text-sm font-medium ${
              isPositive
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-red-600 dark:text-red-400'
            }`}
          >
            {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            <span>{isPositive ? '+' : ''}{change.toFixed(2)}%</span>
          </div>
        </div>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </div>
    </div>
  );
}
