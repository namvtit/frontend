'use client';

import { TrendingUp, TrendingDown } from 'lucide-react';
import Link from 'next/link';

interface StockCardProps {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

export function StockCard({ symbol, name, price, change, changePercent }: StockCardProps) {
  const isPositive = change >= 0;

  return (
    <Link href={`/stocks/${symbol}`}>
      <div className="group flex items-center justify-between rounded-lg border border-border bg-card p-4 transition-all hover:border-primary hover:shadow-lg cursor-pointer">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
            <span className="font-bold text-sm text-primary">{symbol[0]}</span>
          </div>
          <div>
            <p className="font-semibold text-card-foreground">{symbol}</p>
            <p className="text-sm text-muted-foreground">{name}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <p className="text-lg font-bold text-card-foreground">${price.toFixed(2)}</p>
          <div
            className={`flex items-center gap-1 rounded px-2 py-1 ${
              isPositive
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : 'bg-red-500/10 text-red-600 dark:text-red-400'
            }`}
          >
            {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            <span className="text-sm font-medium">
              {isPositive ? '+' : ''}{changePercent.toFixed(2)}%
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
