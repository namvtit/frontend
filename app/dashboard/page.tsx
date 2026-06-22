'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import { useDemo } from '@/lib/demo';
import { getStockBySymbol, STOCKS, NEWS } from '@/lib/market/mock-data';
import { StockCard } from '@/components/market/stock-card';
import { MarketMetric } from '@/components/market/market-metric';
import { RiskManagementCard } from '@/components/dashboard/RiskManagementCard';
import { AiTradingSuggestions } from '@/components/dashboard/AiTradingSuggestions';
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

export default function DashboardPage() {
  const [showBalance, setShowBalance] = useState(true);
  const [activeTab, setActiveTab] = useState<'holdings' | 'orders' | 'watchlist'>('holdings');
  const { user, logout, isLoggedIn } = useAuth();
  const { state, getPrice } = useDemo();
  const router = useRouter();

  // Redirect if not logged in
  useEffect(() => {
    if (typeof window !== 'undefined' && !isLoggedIn) {
      router.replace('/login');
    }
  }, [isLoggedIn, router]);

  if (!isLoggedIn) return null;

  // Compute portfolio values
  const holdings = Object.values(state.holdings);
  const cashBalance = state.cashBalance;
  let totalMarketValue = 0;
  let totalUnrealizedPnL = 0;
  const enrichedHoldings = holdings.map((h) => {
    const livePrice = getPrice(h.symbol) || h.avgPrice;
    const marketValue = livePrice * h.quantity;
    const costBasis = h.avgPrice * h.quantity;
    const unrealizedPnL = marketValue - costBasis;
    totalMarketValue += marketValue;
    totalUnrealizedPnL += unrealizedPnL;
    return { ...h, livePrice, marketValue, unrealizedPnL, unrealizedPnLPercent: costBasis > 0 ? (unrealizedPnL / costBasis) * 100 : 0 };
  });
  const totalAccountValue = cashBalance + totalMarketValue;
  const dayChange = totalUnrealizedPnL;
  const dayChangePercent = totalAccountValue > cashBalance ? (totalUnrealizedPnL / totalAccountValue) * 100 : 0;
  const isPositive = dayChange >= 0;

  // Watchlist with live prices
  const watchlistStocks = state.watchlist
    .map((sym) => getStockBySymbol(sym))
    .filter(Boolean) as typeof STOCKS;

  // Sort transactions by most recent first
  const sortedTransactions = [...state.transactions].reverse();

  return (
    <div className="min-h-screen bg-background fade-in">
      {/* Header */}
      <section className="border-b border-border bg-card/50">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Welcome back, {user?.name || 'Investor'}</h1>
              <p className="text-muted-foreground">Manage your portfolio and track market movements</p>
            </div>
            <div className="flex gap-2">
              <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-foreground hover:bg-secondary transition-colors">
                <Settings className="h-4 w-4" /> Settings
              </button>
              <button onClick={logout} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-foreground hover:bg-secondary transition-colors">
                <LogOut className="h-4 w-4" /> Logout
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
                        ? `$${totalAccountValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        : '••••••'}
                    </span>
                    {showBalance ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Cash: {showBalance ? `$${cashBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '••••'}</p>
            </div>

            {/* Day Change */}
            <div className="rounded-lg border border-border bg-background p-6">
              <p className="text-sm text-muted-foreground mb-2">Total P&L</p>
              <div className={`flex items-center gap-2 ${
                isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
              }`}>
                {isPositive ? <TrendingUp className="h-6 w-6" /> : <TrendingDown className="h-6 w-6" />}
                <div>
                  <p className="text-2xl font-bold">{isPositive ? '+' : ''}${Math.abs(totalUnrealizedPnL).toFixed(2)}</p>
                  <p className="text-sm">{isPositive ? '+' : ''}{dayChangePercent.toFixed(2)}%</p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="rounded-lg border border-border bg-background p-6">
              <p className="text-sm text-muted-foreground mb-4">Quick Actions</p>
              <div className="flex gap-2">
                <Link href="/markets" className="flex items-center gap-1 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">
                  <Plus className="h-4 w-4" /> Buy
                </Link>
                <Link href="/markets" className="flex items-center gap-1 px-3 py-2 rounded-lg border border-border text-foreground text-sm font-medium hover:bg-secondary transition-colors">
                  <TrendingDown className="h-4 w-4" /> Sell
                </Link>
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
              Holdings ({enrichedHoldings.length})
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-4 py-4 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'orders'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
              id="orders-tab"
            >
              Orders ({state.transactions.length})
            </button>
            <button
              onClick={() => setActiveTab('watchlist')}
              className={`px-4 py-4 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'watchlist'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Watchlist ({state.watchlist.length})
            </button>
          </div>

          <div className="py-8">
            {activeTab === 'holdings' && (
              <>
                {enrichedHoldings.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground mb-4">Bạn chưa có vị thế nào.</p>
                    <Link href="/markets" className="btn btn-primary">Khám phá thị trường</Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {enrichedHoldings.map((h) => {
                      const isUp = h.unrealizedPnL >= 0;
                      return (
                        <Link key={h.symbol} href={`/stocks/${h.symbol}`} className="block rounded-lg border border-border bg-card p-4 hover:border-primary/50 transition-colors">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-foreground">{h.symbol}</span>
                                <span className="text-sm text-muted-foreground">{h.name}</span>
                              </div>
                              <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                                <span>{h.quantity} shares @ ${h.avgPrice.toFixed(2)}</span>
                                <span>Value: ${h.marketValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className={`text-sm font-semibold ${isUp ? 'text-emerald-500' : 'text-red-500'}`}>
                                {isUp ? '+' : ''}{h.unrealizedPnLPercent.toFixed(2)}%
                              </div>
                              <div className={`text-xs ${isUp ? 'text-emerald-500' : 'text-red-500'}`}>
                                {isUp ? '+' : ''}${h.unrealizedPnL.toFixed(2)}
                              </div>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            {activeTab === 'orders' && (
              <>
                {sortedTransactions.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground mb-4">Bạn chưa thực hiện giao dịch nào.</p>
                    <Link href="/markets" className="btn btn-primary">Bắt đầu giao dịch</Link>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="grid grid-cols-6 gap-2 px-4 py-2 text-xs font-medium text-muted-foreground border-b border-border">
                      <span>Date</span>
                      <span>Symbol</span>
                      <span>Type</span>
                      <span className="text-right">Qty</span>
                      <span className="text-right">Price</span>
                      <span className="text-right">Total</span>
                    </div>
                    {sortedTransactions.map((tx) => {
                      const isBuy = tx.type === 'buy';
                      return (
                        <div key={tx.id} className="grid grid-cols-6 gap-2 px-4 py-3 text-sm items-center border-b border-border/50 hover:bg-muted/30 transition-colors">
                          <span className="text-muted-foreground text-xs">
                            {new Date(tx.timestamp).toLocaleString('vi-VN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <div>
                            <span className="font-semibold text-foreground">{tx.symbol}</span>
                            <span className="text-xs text-muted-foreground ml-1">{tx.name}</span>
                          </div>
                          <span className={`text-xs font-medium ${isBuy ? 'text-emerald-500' : 'text-red-500'}`}>
                            {isBuy ? 'BUY' : 'SELL'}
                          </span>
                          <span className="text-right text-muted-foreground">{tx.quantity}</span>
                          <span className="text-right text-muted-foreground">${tx.price.toFixed(2)}</span>
                          <span className={`text-right font-medium ${isBuy ? 'text-red-500' : 'text-emerald-500'}`}>
                            {isBuy ? '-' : '+'}${tx.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            {activeTab === 'watchlist' && (
              <>
                {watchlistStocks.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground mb-4">Watchlist trống.</p>
                    <Link href="/markets" className="btn btn-primary">Thêm mã cổ phiếu</Link>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {watchlistStocks.map((stock) => (
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
                )}
              </>
            )}
          </div>
        </div>
      </section>

      {/* Risk Management & AI Suggestions */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-2">
            <RiskManagementCard />
            <AiTradingSuggestions />
          </div>
        </div>
      </section>

      {/* Portfolio Metrics & News */}
      <section>
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Performance Metrics */}
            <div className="lg:col-span-2">
              <h2 className="text-2xl font-bold text-foreground mb-6">Portfolio Metrics</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <MarketMetric
                  label="Portfolio Value"
                  value={`$${totalAccountValue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
                  change={dayChangePercent}
                />
                <MarketMetric
                  label="Cash Available"
                  value={`$${cashBalance.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
                  change={0}
                />
                <MarketMetric
                  label="Positions"
                  value={`${enrichedHoldings.length}`}
                  change={0}
                />
                <MarketMetric
                  label="Total Return"
                  value={`${isPositive ? '+' : ''}${dayChangePercent.toFixed(2)}%`}
                  change={dayChangePercent}
                />
              </div>
            </div>

            {/* Recent News */}
            <div className="rounded-lg border border-border bg-card p-6">
              <h3 className="text-lg font-bold text-foreground mb-4">Latest News</h3>
              <div className="space-y-3">
                {NEWS.slice(0, 3).map((article) => (
                  <Link key={article.id} href={`/news/${article.id}`} className="block p-2 rounded hover:bg-secondary transition-colors group">
                    <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2">
                      {article.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">{article.source}</p>
                  </Link>
                ))}
              </div>
              <Link href="/news" className="mt-4 block text-center text-sm font-medium text-primary hover:text-primary/80 transition-colors">
                View All News →
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
