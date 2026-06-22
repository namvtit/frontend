'use client';

import { STOCKS } from '@/lib/market/mock-data';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { useDemo } from '@/lib/demo';
import { useLivePrices, getFlashClass } from '@/lib/market/use-live-prices';
import { useRouter } from 'next/navigation';

export function TickerBanner() {
  const { state, dispatch } = useDemo();
  const { getFlash } = useLivePrices();
  const router = useRouter();
  const tickerStocks = [...STOCKS, ...STOCKS, ...STOCKS];

  const hasUnreadAlerts = state.notifications.some(
    (n) => !n.read && n.type === 'alert'
  );

  const handleBannerClick = () => {
    if (hasUnreadAlerts) {
      state.notifications.forEach((n) => {
        if (!n.read && n.type === 'alert') {
          dispatch({ type: 'MARK_NOTIF_READ', id: n.id });
        }
      });
      router.push('/dashboard#ai-suggestions');
      setTimeout(() => {
        const el = document.getElementById('ai-suggestions');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  };

  return (
    <div
      onClick={handleBannerClick}
      className={`w-full transition-all duration-300 overflow-hidden border-b ${
        hasUnreadAlerts
          ? 'bg-amber-500/10 dark:bg-amber-950/20 border-amber-500/20 cursor-pointer hover:bg-amber-500/15'
          : 'bg-primary/5 border-border'
      }`}
    >
      <div className="flex items-center h-9">
        {/* Live indicator or Alert indicator (real critical errors only) */}
        <div className="flex items-center gap-1.5 pl-3 pr-2 shrink-0 select-none">
          {hasUnreadAlerts ? (
            <>
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider animate-pulse">Thông báo</span>
            </>
          ) : (
            <>
              <span className="live-dot" />
              <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Live</span>
            </>
          )}
        </div>

        <div className="ticker-scroll flex gap-8 px-4 whitespace-nowrap">
          {tickerStocks.map((stock, idx) => {
            const cached = state.marketCache[stock.symbol.toUpperCase()];
            const displayPrice = cached?.price ?? stock.price;
            const displayChange = cached?.change ?? stock.change;
            const displayPct = cached?.changePercent ?? stock.changePercent;
            const isPositive = displayChange >= 0;
            const flash = getFlash(stock.symbol);

            return (
              <div
                key={`${stock.symbol}-${idx}`}
                className={`flex items-center gap-2 text-sm font-medium rounded px-1.5 py-0.5 transition-colors ${getFlashClass(flash)}`}
              >
                <span className="text-muted-foreground">{stock.symbol}</span>
                <span className="font-semibold text-foreground font-mono tabular-nums">
                  ${displayPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                  <span>{isPositive ? '+' : ''}{displayPct.toFixed(2)}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
