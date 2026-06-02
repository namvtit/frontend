'use client';

import { Navbar } from '@/components/navbar';
import { mockStocks } from '@/lib/mock-data';
import { useParams } from 'next/navigation';
import { TrendingUp, TrendingDown, Calendar, Volume2, Percent, PieChart } from 'lucide-react';

export default function StockDetailPage() {
  const params = useParams();
  const symbol = params.symbol as string;
  const stock = mockStocks.find((s) => s.symbol === symbol.toUpperCase());

  if (!stock) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 text-center">
          <h1 className="text-2xl font-bold text-foreground">Stock not found</h1>
        </div>
      </div>
    );
  }

  const isPositive = stock.change >= 0;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Header with Price */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-primary/10">
                  <span className="text-2xl font-bold text-primary">
                    {stock.symbol[0]}
                  </span>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-foreground">
                    {stock.symbol}
                  </h1>
                  <p className="text-muted-foreground">{stock.name}</p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-4xl font-bold text-foreground">
                ${stock.price.toFixed(2)}
              </p>
              <div
                className={`mt-2 flex items-center justify-end gap-2 font-semibold ${
                  isPositive
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-red-600 dark:text-red-400'
                }`}
              >
                {isPositive ? (
                  <TrendingUp className="h-5 w-5" />
                ) : (
                  <TrendingDown className="h-5 w-5" />
                )}
                <span>
                  {isPositive ? '+' : ''}
                  {stock.change.toFixed(2)} ({stock.changePercent.toFixed(2)}%)
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Chart Placeholder */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="rounded-lg border border-border bg-card p-8">
            <div className="flex items-center justify-center h-96 bg-muted/20 rounded-lg">
              <div className="text-center">
                <PieChart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">TradingView Chart Integration</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Chart will display real-time price movements
                </p>
              </div>
            </div>
            <div className="mt-6 flex gap-2 justify-center">
              {['1D', '5D', '1M', '3M', '6M', '1Y', 'All'].map((period) => (
                <button
                  key={period}
                  className="px-3 py-1 rounded text-sm font-medium border border-border hover:bg-secondary transition-colors"
                >
                  {period}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Key Metrics Grid */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-foreground mb-6">Key Metrics</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Price */}
            <div className="rounded-lg border border-border bg-card p-6">
              <div className="flex items-center gap-2 mb-2">
                <Percent className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-medium text-muted-foreground">
                  Current Price
                </p>
              </div>
              <p className="text-2xl font-bold text-foreground">
                ${stock.price.toFixed(2)}
              </p>
            </div>

            {/* Market Cap */}
            <div className="rounded-lg border border-border bg-card p-6">
              <div className="flex items-center gap-2 mb-2">
                <PieChart className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-medium text-muted-foreground">
                  Market Cap
                </p>
              </div>
              <p className="text-2xl font-bold text-foreground">{stock.marketCap}</p>
            </div>

            {/* Volume */}
            <div className="rounded-lg border border-border bg-card p-6">
              <div className="flex items-center gap-2 mb-2">
                <Volume2 className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-medium text-muted-foreground">Volume</p>
              </div>
              <p className="text-2xl font-bold text-foreground">{stock.volume}</p>
            </div>

            {/* PE Ratio */}
            <div className="rounded-lg border border-border bg-card p-6">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-medium text-muted-foreground">P/E Ratio</p>
              </div>
              <p className="text-2xl font-bold text-foreground">{stock.pe.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </section>

      {/* 52-Week Range */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-foreground mb-6">52-Week Range</h2>
          <div className="rounded-lg border border-border bg-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-muted-foreground">Low</p>
                <p className="text-2xl font-bold text-foreground">
                  ${stock.low52Week.toFixed(2)}
                </p>
              </div>

              {/* Progress Bar */}
              <div className="flex-1 mx-6">
                <div className="h-2 bg-border rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-accent"
                    style={{
                      width: `${
                        ((stock.price - stock.low52Week) /
                          (stock.high52Week - stock.low52Week)) *
                        100
                      }%`,
                    }}
                  ></div>
                </div>
              </div>

              <div className="text-right">
                <p className="text-sm text-muted-foreground">High</p>
                <p className="text-2xl font-bold text-foreground">
                  ${stock.high52Week.toFixed(2)}
                </p>
              </div>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Current Price: ${stock.price.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-foreground mb-4">
            About {stock.name}
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            {stock.name} is a leading company in its sector with a market
            capitalization of {stock.marketCap}. The stock trades at a P/E ratio
            of {stock.pe} and has shown strong performance over the past 52 weeks,
            with a range between ${stock.low52Week.toFixed(2)} and $
            {stock.high52Week.toFixed(2)}.
          </p>
        </div>
      </section>
    </div>
  );
}
