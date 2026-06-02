'use client';

import { TrendingUp, TrendingDown } from 'lucide-react';
import { Stock } from '@/lib/mock-data';
import Link from 'next/link';

interface StockCardProps {
  stock: Stock;
}

export function StockCard({ stock }: StockCardProps) {
  const isPositive = stock.change >= 0;

  return (
    <Link href={`/stock/${stock.symbol}`}>
      <div className="group flex items-center justify-between rounded-lg border border-border bg-card p-4 transition-all hover:border-primary hover:shadow-lg cursor-pointer">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
            <span className="font-bold text-sm text-primary">
              {stock.symbol[0]}
            </span>
          </div>
          <div>
            <p className="font-semibold text-card-foreground">{stock.symbol}</p>
            <p className="text-sm text-muted-foreground">{stock.name}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <p className="text-lg font-bold text-card-foreground">${stock.price.toFixed(2)}</p>
          <div
            className={`flex items-center gap-1 rounded px-2 py-1 ${
              isPositive
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : 'bg-red-500/10 text-red-600 dark:text-red-400'
            }`}
          >
            {isPositive ? (
              <TrendingUp className="h-4 w-4" />
            ) : (
              <TrendingDown className="h-4 w-4" />
            )}
            <span className="text-sm font-medium">
              {isPositive ? '+' : ''}
              {stock.changePercent.toFixed(2)}%
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

interface MarketMetricProps {
  label: string;
  value: string;
  change: number;
  icon?: React.ReactNode;
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
            {isPositive ? (
              <TrendingUp className="h-4 w-4" />
            ) : (
              <TrendingDown className="h-4 w-4" />
            )}
            <span>{isPositive ? '+' : ''}{change.toFixed(2)}%</span>
          </div>
        </div>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </div>
    </div>
  );
}

interface NewsCardProps {
  title: string;
  description: string;
  category: string;
  timestamp: string;
  onClick?: () => void;
}

export function NewsCard({ title, description, category, timestamp, onClick }: NewsCardProps) {
  const timeAgo = getTimeAgo(new Date(timestamp));

  return (
    <div
      onClick={onClick}
      className="group cursor-pointer rounded-lg border border-border bg-card p-4 transition-all hover:border-primary hover:shadow-lg"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-primary/10 text-primary capitalize">
              {category}
            </span>
            <span className="text-xs text-muted-foreground">{timeAgo}</span>
          </div>
          <h3 className="font-semibold text-card-foreground line-clamp-2">{title}</h3>
          <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'just now';
}
