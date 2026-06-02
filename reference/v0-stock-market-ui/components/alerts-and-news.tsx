'use client';

import { mockNews, mockStocks } from '@/lib/mock-data';
import { AlertTriangle, Zap, TrendingUp, TrendingDown, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export function AlertsAndNews() {
  // Get top 3 news items
  const topNews = mockNews.slice(0, 3);
  
  // Get stocks with significant movements
  const significantMovements = mockStocks
    .sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent))
    .slice(0, 4);

  return (
    <div className="w-full border-b border-border bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Trend Alerts */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              <h3 className="font-bold text-foreground">Trend Alerts</h3>
            </div>
            <div className="space-y-3">
              {significantMovements.map((stock) => (
                <div
                  key={stock.id}
                  className="p-3 rounded-lg border border-border hover:bg-secondary/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div>
                      <div className="font-semibold text-sm text-foreground">
                        {stock.symbol}
                      </div>
                      <div className="text-xs text-muted-foreground line-clamp-1">
                        {stock.name}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className={`text-sm font-bold flex items-center justify-end gap-1 ${
                        stock.change > 0 ? 'text-green-500' : 'text-red-500'
                      }`}>
                        {stock.change > 0 ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                        {stock.change > 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                      </div>
                      <div className="text-xs text-muted-foreground">
                        ${stock.price.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Featured News */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="h-5 w-5 text-yellow-500" />
              <h3 className="font-bold text-foreground">Notable Headlines</h3>
            </div>
            <div className="space-y-3">
              {topNews.map((article) => (
                <Link
                  key={article.id}
                  href={`/news/${article.id}`}
                  className="group p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-secondary/50 transition-all"
                >
                  <div className="flex gap-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-1">
                        {article.title}
                      </h4>
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                        {article.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs px-2 py-1 rounded bg-secondary text-foreground">
                          {article.category}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {article.source}
                        </span>
                      </div>
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1 group-hover:text-primary transition-colors" />
                  </div>
                </Link>
              ))}
              <Link
                href="/news"
                className="block text-center py-2 px-3 rounded-lg border border-border text-sm font-medium text-primary hover:bg-primary/10 transition-colors"
              >
                View all news
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
