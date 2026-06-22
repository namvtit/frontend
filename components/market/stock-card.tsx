'use client';

import { TrendingUp, TrendingDown } from 'lucide-react';
import Link from 'next/link';
import { useLivePrice, getFlashClass } from '@/lib/market/use-live-prices';
import type { StockQuote } from '@/lib/market/mock-data';

import WatchlistStar from './WatchlistStar';

interface StockCardProps {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

export function StockCard({ symbol, name, price, change, changePercent }: StockCardProps) {
  const live = useLivePrice(symbol, { price, change, changePercent } as StockQuote);
  const displayPrice = live.price || price;
  const displayChange = live.change ?? change;
  const displayPct = live.changePercent ?? changePercent;
  const isPositive = displayChange >= 0;

  return (
    <Link href={`/stocks/${symbol}`}>
      <div className={`group flex items-center justify-between rounded-lg border border-border bg-card p-4 transition-all hover:border-primary hover:shadow-lg cursor-pointer ${getFlashClass(live.flash)}`}>
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
            <span className="font-bold text-sm text-primary">{symbol[0]}</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-semibold text-card-foreground">{symbol}</p>
              {live.isLive && <span className="live-dot" title="Live price" />}
              <WatchlistStar symbol={symbol} />
            </div>
            <p className="text-sm text-muted-foreground">{name}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <p className="text-lg font-bold text-card-foreground font-mono tabular-nums">
            ${displayPrice.toFixed(2)}
          </p>
          <div
            className={`flex items-center gap-1 rounded px-2 py-1 ${
              isPositive
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : 'bg-red-500/10 text-red-600 dark:text-red-400'
            }`}
          >
            {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            <span className="text-sm font-medium tabular-nums">
              {isPositive ? '+' : ''}{displayPct.toFixed(2)}%
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
