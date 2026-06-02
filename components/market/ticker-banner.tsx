'use client';

import { STOCKS } from '@/lib/market/mock-data';
import { TrendingUp, TrendingDown } from 'lucide-react';

export function TickerBanner() {
  const tickerStocks = [...STOCKS, ...STOCKS, ...STOCKS];

  return (
    <div className="w-full bg-primary/5 border-b border-border overflow-hidden">
      <div className="flex items-center h-9">
        <div className="ticker-scroll flex gap-8 px-4 whitespace-nowrap">
          {tickerStocks.map((stock, idx) => {
            const isPositive = stock.change >= 0;
            return (
              <div
                key={`${stock.symbol}-${idx}`}
                className="flex items-center gap-2 text-sm font-medium"
              >
                <span className="text-muted-foreground">{stock.symbol}</span>
                <span className="font-semibold text-foreground">
                  ${stock.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <div
                  className={`flex items-center gap-1 text-xs font-semibold ${
                    isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {isPositive ? (
                    <TrendingUp className="w-3.5 h-3.5" />
                  ) : (
                    <TrendingDown className="w-3.5 h-3.5" />
                  )}
                  <span>{isPositive ? '+' : ''}{stock.changePercent.toFixed(2)}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
