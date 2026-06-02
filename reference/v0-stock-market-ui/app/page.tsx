'use client';

import { Navbar } from '@/components/navbar';
import { FearIndexBanner } from '@/components/fear-index-banner';
import { AlertsAndNews } from '@/components/alerts-and-news';
import { StockCard, MarketMetric, NewsCard } from '@/components/card-components';
import { mockStocks, mockMetrics, mockNews } from '@/lib/mock-data';
import { useRouter } from 'next/navigation';
import { TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const topGainers = mockStocks.sort((a, b) => b.changePercent - a.changePercent).slice(0, 3);
  const topLosers = mockStocks.sort((a, b) => a.changePercent - b.changePercent).slice(0, 3);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <FearIndexBanner />

      {/* Hero Section */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-foreground sm:text-5xl">
              Market Overview
            </h1>
            <p className="mt-2 text-lg text-muted-foreground">
              Real-time market data, insights, and analysis
            </p>
          </div>

          {/* Market Metrics Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {mockMetrics.map((metric) => (
              <MarketMetric
                key={metric.id}
                label={metric.name}
                value={metric.value}
                change={metric.change}
                icon={<BarChart3 className="h-6 w-6" />}
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
              </div>
              <div className="space-y-3">
                {topGainers.map((stock) => (
                  <StockCard key={stock.id} stock={stock} />
                ))}
              </div>
            </div>

            {/* Top Losers */}
            <div>
              <div className="mb-6 flex items-center gap-2">
                <TrendingDown className="h-6 w-6 text-red-600 dark:text-red-400" />
                <h2 className="text-2xl font-bold text-foreground">Top Losers</h2>
              </div>
              <div className="space-y-3">
                {topLosers.map((stock) => (
                  <StockCard key={stock.id} stock={stock} />
                ))}
              </div>
            </div>
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
            <a
              href="/news"
              className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
            >
              View All →
            </a>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {mockNews.slice(0, 4).map((article) => (
              <NewsCard
                key={article.id}
                title={article.title}
                description={article.description}
                category={article.category}
                timestamp={article.timestamp}
                onClick={() => router.push(`/news/${article.id}`)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-border bg-gradient-to-r from-primary/5 to-accent/5">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Start Tracking Your Portfolio
          </h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Create an account to get personalized insights, build watchlists, and
            leverage AI-powered market analysis.
          </p>
          <button
            onClick={() => router.push('/register')}
            className="inline-block px-8 py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity"
          >
            Create Account
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              © 2024 StockPro. All rights reserved.
            </p>
            <div className="flex gap-6">
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Terms
              </a>
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Privacy
              </a>
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Contact
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
