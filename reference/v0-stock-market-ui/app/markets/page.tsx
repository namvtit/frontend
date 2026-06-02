'use client';

import { useState, useMemo } from 'react';
import { Navbar } from '@/components/navbar';
import { mockStocks } from '@/lib/mock-data';
import Link from 'next/link';
import { TrendingUp, TrendingDown, Search } from 'lucide-react';

export default function MarketsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'price' | 'change' | 'marketCap'>('price');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const filteredAndSortedStocks = useMemo(() => {
    let stocks = mockStocks.filter((stock) =>
      stock.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      stock.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    stocks.sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case 'price':
          aValue = a.price;
          bValue = b.price;
          break;
        case 'change':
          aValue = a.changePercent;
          bValue = b.changePercent;
          break;
        case 'marketCap':
          aValue = parseFloat(a.marketCap.replace(/[^\d.]/g, ''));
          bValue = parseFloat(b.marketCap.replace(/[^\d.]/g, ''));
          break;
      }

      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    });

    return stocks;
  }, [searchTerm, sortBy, sortOrder]);

  const toggleSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Header */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Markets</h1>
          <p className="text-muted-foreground">
            Browse and track thousands of stocks in real-time
          </p>
        </div>
      </section>

      {/* Filters Section */}
      <section className="border-b border-border bg-card/50">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by symbol or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Table Section */}
      <section>
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-muted-foreground">
                    Symbol
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-muted-foreground">
                    Name
                  </th>
                  <th
                    onClick={() => toggleSort('price')}
                    className="px-4 py-3 text-right text-sm font-semibold text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                  >
                    <div className="flex items-center justify-end gap-1">
                      Price
                      {sortBy === 'price' && (
                        <span className="text-xs">
                          {sortOrder === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => toggleSort('change')}
                    className="px-4 py-3 text-right text-sm font-semibold text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                  >
                    <div className="flex items-center justify-end gap-1">
                      Change
                      {sortBy === 'change' && (
                        <span className="text-xs">
                          {sortOrder === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-muted-foreground">
                    Change %
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-muted-foreground">
                    Volume
                  </th>
                  <th
                    onClick={() => toggleSort('marketCap')}
                    className="px-4 py-3 text-right text-sm font-semibold text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                  >
                    <div className="flex items-center justify-end gap-1">
                      Market Cap
                      {sortBy === 'marketCap' && (
                        <span className="text-xs">
                          {sortOrder === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-muted-foreground">
                    52W High
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedStocks.map((stock) => {
                  const isPositive = stock.change >= 0;
                  return (
                    <tr
                      key={stock.id}
                      className="border-b border-border hover:bg-card/50 transition-colors group cursor-pointer"
                    >
                      <td className="px-4 py-4">
                        <Link
                          href={`/stock/${stock.symbol}`}
                          className="font-semibold text-primary hover:text-primary/80 transition-colors"
                        >
                          {stock.symbol}
                        </Link>
                      </td>
                      <td className="px-4 py-4 text-sm text-foreground">
                        <Link
                          href={`/stock/${stock.symbol}`}
                          className="hover:text-primary transition-colors"
                        >
                          {stock.name}
                        </Link>
                      </td>
                      <td className="px-4 py-4 text-right font-semibold text-foreground">
                        ${stock.price.toFixed(2)}
                      </td>
                      <td
                        className={`px-4 py-4 text-right font-medium flex items-center justify-end gap-1 ${
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
                        ${Math.abs(stock.change).toFixed(2)}
                      </td>
                      <td
                        className={`px-4 py-4 text-right font-medium ${
                          isPositive
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}
                      >
                        {isPositive ? '+' : ''}
                        {stock.changePercent.toFixed(2)}%
                      </td>
                      <td className="px-4 py-4 text-right text-sm text-muted-foreground">
                        {stock.volume}
                      </td>
                      <td className="px-4 py-4 text-right text-sm font-medium text-foreground">
                        {stock.marketCap}
                      </td>
                      <td className="px-4 py-4 text-right text-sm text-muted-foreground">
                        ${stock.high52Week.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredAndSortedStocks.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                No stocks found matching your search.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
