'use client';

import { STOCKS, NEWS, INDICES } from '@/lib/market/mock-data';
import { FearIndexBanner } from '@/components/market/fear-index-banner';
import { AlertsAndNews } from '@/components/market/alerts-and-news';
import { AISuggestionsSection } from '@/components/market/ai-suggestions';
import { StockCard } from '@/components/market/stock-card';
import { MarketMetric } from '@/components/market/market-metric';
import { EconomicCalendar } from '@/components/market/economic-calendar';
import { useRouter } from 'next/navigation';
import { TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import { useDemo } from '@/lib/demo';
import { useLivePrices } from '@/lib/market/use-live-prices';
import { formatNumber } from '@/lib/utils';

export default function HomePage() {
  const router = useRouter();
  const { state } = useDemo();
  const { getFlash } = useLivePrices();

  // Sort stocks using live prices for accurate top gainers/losers
  const stocksWithLivePrices = STOCKS.map((s) => {
    const cached = state.marketCache[s.symbol.toUpperCase()];
    return {
      ...s,
      changePercent: cached?.changePercent ?? s.changePercent,
      change: cached?.change ?? s.change,
      price: cached?.price ?? s.price,
    };
  });

  const topGainers = [...stocksWithLivePrices].sort((a, b) => b.changePercent - a.changePercent).slice(0, 3);
  const topLosers = [...stocksWithLivePrices].sort((a, b) => a.changePercent - b.changePercent).slice(0, 3);

  // Market indices with live data
  const MARKET_METRICS = INDICES.map((idx) => {
    const cached = state.marketCache[idx.symbol];
    const value = cached?.price ?? idx.value;
    const change = cached?.changePercent ?? idx.changePercent;
    const isLive = !!cached;
    return {
      id: idx.symbol,
      name: idx.name,
      value: formatNumber(value, 2),
      change,
      isLive,
      flash: getFlash(idx.symbol),
    };
  });

  // Extra metrics (Russell 2000, 10Y) remain static for now
  const EXTRA_METRICS = [
    { id: 'RUT', name: 'Russell 2000', value: '2,245.67', change: -0.45, isLive: false, flash: null as 'up' | 'down' | null },
    { id: 'TNX', name: 'US Treasury 10Y', value: '4.12%', change: 0.08, isLive: false, flash: null as 'up' | 'down' | null },
  ];

  const ALL_METRICS = [...MARKET_METRICS, ...EXTRA_METRICS];

  return (
    <div className="min-h-screen bg-background fade-in">
      {/* Fear Index Banner */}
      <FearIndexBanner />

      {/* Hero Section */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-foreground sm:text-5xl">
              Market Overview
            </h1>
            <p className="mt-2 text-lg text-muted-foreground flex items-center gap-2">
              Real-time market data, insights, and analysis
              <span className="live-dot" />
              <span className="text-xs font-semibold text-emerald-500 uppercase">Live</span>
            </p>
          </div>

          {/* Market Metrics Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ALL_METRICS.map((metric) => (
              <MarketMetric
                key={metric.id}
                label={metric.name}
                value={metric.value}
                change={metric.change}
                icon={<BarChart3 className="h-6 w-6" />}
                isLive={metric.isLive}
                flash={metric.flash}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Alerts and News Section */}
      <AlertsAndNews />

      {/* Top Gainers & Losers */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2">
            {/* Top Gainers */}
            <div>
              <div className="mb-6 flex items-center gap-2">
                <TrendingUp className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                <h2 className="text-2xl font-bold text-foreground">Top Gainers</h2>
                <span className="live-dot ml-1" />
              </div>
              <div className="space-y-3">
                {topGainers.map((stock) => (
                  <StockCard
                    key={stock.symbol}
                    symbol={stock.symbol}
                    name={stock.name}
                    price={stock.price}
                    change={stock.change}
                    changePercent={stock.changePercent}
                  />
                ))}
              </div>
            </div>

            {/* Top Losers */}
            <div>
              <div className="mb-6 flex items-center gap-2">
                <TrendingDown className="h-6 w-6 text-red-600 dark:text-red-400" />
                <h2 className="text-2xl font-bold text-foreground">Top Losers</h2>
                <span className="live-dot ml-1" />
              </div>
              <div className="space-y-3">
                {topLosers.map((stock) => (
                  <StockCard
                    key={stock.symbol}
                    symbol={stock.symbol}
                    name={stock.name}
                    price={stock.price}
                    change={stock.change}
                    changePercent={stock.changePercent}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI Suggestions */}
      <AISuggestionsSection />

      {/* Economic Calendar */}
      <section className="border-b border-border bg-muted/10">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="h-[500px]">
            <EconomicCalendar />
          </div>
        </div>
      </section>

      {/* Latest News */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold text-foreground">Market News</h2>
            </div>
            <Link href="/news" className="text-sm font-medium text-primary hover:text-primary/80 transition-colors">
              View All →
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {NEWS.slice(0, 4).map((article) => (
              <div
                key={article.id}
                onClick={() => router.push(`/news/${article.id}`)}
                className="group cursor-pointer rounded-lg border border-border bg-card p-4 transition-all hover:border-primary hover:shadow-lg"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-primary/10 text-primary capitalize">
                        {article.category}
                      </span>
                      <span className="text-xs text-muted-foreground">{article.source}</span>
                    </div>
                    <h3 className="font-semibold text-card-foreground line-clamp-2">{article.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{article.summary}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-border bg-gradient-to-r from-primary/5 to-accent/5">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4">Start Tracking Your Portfolio</h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Create an account to get personalized insights, build watchlists, and leverage AI-powered market analysis.
          </p>
          <Link
            href="/register"
            className="inline-block px-8 py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity"
          >
            Create Account
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">© 2026 FinPilot. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Terms</a>
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Privacy</a>
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
