'use client';

import { useState } from 'react';
import { Navbar } from '@/components/navbar';
import { StockCard, MarketMetric } from '@/components/card-components';
import { mockUserPortfolio, mockNews } from '@/lib/mock-data';
import Link from 'next/link';
import {
  TrendingUp,
  TrendingDown,
  Plus,
  Settings,
  LogOut,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();
  const [showBalance, setShowBalance] = useState(true);
  const [activeTab, setActiveTab] = useState<'holdings' | 'watchlist'>(
    'holdings'
  );

  const portfolio = mockUserPortfolio;
  const isPositive = portfolio.dayChange >= 0;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Header with User Info */}
      <section className="border-b border-border bg-card/50">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Welcome back, Investor
              </h1>
              <p className="text-muted-foreground">
                Manage your portfolio and track market movements
              </p>
            </div>
            <div className="flex gap-2">
              <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-foreground hover:bg-secondary transition-colors">
                <Settings className="h-4 w-4" />
                Settings
              </button>
              <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-foreground hover:bg-secondary transition-colors">
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          </div>

          {/* Portfolio Summary */}
          <div className="grid gap-4 sm:grid-cols-3">
            {/* Total Value */}
            <div className="rounded-lg border border-border bg-background p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Value</p>
                  <button
                    onClick={() => setShowBalance(!showBalance)}
                    className="flex items-center gap-2 mt-2 text-primary hover:text-primary/80 transition-colors"
                  >
                    <span className="text-2xl font-bold text-foreground">
                      {showBalance
                        ? `$${portfolio.totalValue.toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                          })}`
                        : '••••••'}
                    </span>
                    {showBalance ? (
                      <Eye className="h-4 w-4" />
                    ) : (
                      <EyeOff className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Day Change */}
            <div className="rounded-lg border border-border bg-background p-6">
              <p className="text-sm text-muted-foreground mb-2">Day&apos;s Change</p>
              <div
                className={`flex items-center gap-2 ${
                  isPositive
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-red-600 dark:text-red-400'
                }`}
              >
                {isPositive ? (
                  <TrendingUp className="h-6 w-6" />
                ) : (
                  <TrendingDown className="h-6 w-6" />
                )}
                <div>
                  <p className="text-2xl font-bold">
                    {isPositive ? '+' : ''}${portfolio.dayChange.toFixed(2)}
                  </p>
                  <p className="text-sm">
                    {isPositive ? '+' : ''}
                    {portfolio.dayChangePercent.toFixed(2)}%
                  </p>
                </div>
              </div>
            </div>

            {/* Holdings Count */}
            <div className="rounded-lg border border-border bg-background p-6">
              <p className="text-sm text-muted-foreground mb-4">Quick Actions</p>
              <div className="flex gap-2">
                <button className="flex items-center gap-1 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">
                  <Plus className="h-4 w-4" />
                  Buy
                </button>
                <button className="flex items-center gap-1 px-3 py-2 rounded-lg border border-border text-foreground text-sm font-medium hover:bg-secondary transition-colors">
                  <TrendingDown className="h-4 w-4" />
                  Sell
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Holdings & Watchlist Tabs */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex gap-4 border-b border-border">
            <button
              onClick={() => setActiveTab('holdings')}
              className={`px-4 py-4 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'holdings'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Your Holdings ({portfolio.holdings.length})
            </button>
            <button
              onClick={() => setActiveTab('watchlist')}
              className={`px-4 py-4 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'watchlist'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Watchlist ({portfolio.watchlist.length})
            </button>
          </div>

          {/* Holdings Grid */}
          <div className="py-8">
            {activeTab === 'holdings' && (
              <div className="grid gap-4 sm:grid-cols-2">
                {portfolio.holdings.map((stock) => (
                  <StockCard key={stock.id} stock={stock} />
                ))}
              </div>
            )}

            {activeTab === 'watchlist' && (
              <div className="grid gap-4 sm:grid-cols-2">
                {portfolio.watchlist.map((stock) => (
                  <StockCard key={stock.id} stock={stock} />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Portfolio Performance & Recent News */}
      <section>
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Performance Metrics */}
            <div className="lg:col-span-2">
              <h2 className="text-2xl font-bold text-foreground mb-6">
                Portfolio Metrics
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <MarketMetric
                  label="Largest Gain"
                  value={`+${mockUserPortfolio.holdings[0].changePercent.toFixed(2)}%`}
                  change={mockUserPortfolio.holdings[0].changePercent}
                />
                <MarketMetric
                  label="Largest Loss"
                  value={`${mockUserPortfolio.holdings[1].changePercent.toFixed(2)}%`}
                  change={mockUserPortfolio.holdings[1].changePercent}
                />
                <MarketMetric
                  label="Total Return YTD"
                  value="+18.42%"
                  change={18.42}
                />
                <MarketMetric
                  label="Benchmark Return"
                  value="+12.85%"
                  change={12.85}
                />
              </div>
            </div>

            {/* Recent News Widget */}
            <div className="rounded-lg border border-border bg-card p-6">
              <h3 className="text-lg font-bold text-foreground mb-4">
                Latest News
              </h3>
              <div className="space-y-3">
                {mockNews.slice(0, 3).map((article) => (
                  <Link
                    key={article.id}
                    href={`/news/${article.id}`}
                    className="block p-2 rounded hover:bg-secondary transition-colors group"
                  >
                    <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2">
                      {article.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {article.source}
                    </p>
                  </Link>
                ))}
              </div>
              <Link
                href="/news"
                className="mt-4 block text-center text-sm font-medium text-primary hover:text-primary/80 transition-colors"
              >
                View All News →
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
