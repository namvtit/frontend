'use client'

import { mockStocks } from '@/lib/mock-data'
import { TrendingUp, TrendingDown } from 'lucide-react'

export function TickerBanner() {
  // Duplicate stocks for continuous scrolling effect
  const tickerStocks = [...mockStocks, ...mockStocks, ...mockStocks]

  return (
    <div className="w-full bg-primary/5 border-b border-border overflow-hidden">
      <style>{`
        @keyframes scroll-left {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-33.333%);
          }
        }
        
        .ticker-scroll {
          animation: scroll-left 30s linear infinite;
        }
        
        .ticker-scroll:hover {
          animation-play-state: paused;
        }
      `}</style>
      
      <div className="flex items-center h-9">
        <div className="ticker-scroll flex gap-8 px-4 whitespace-nowrap">
          {tickerStocks.map((stock, idx) => {
            const isPositive = stock.change >= 0
            const changePercent = ((stock.change / stock.price) * 100).toFixed(2)
            
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
                    isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {isPositive ? (
                    <TrendingUp className="w-3.5 h-3.5" />
                  ) : (
                    <TrendingDown className="w-3.5 h-3.5" />
                  )}
                  <span>{isPositive ? '+' : ''}{changePercent}%</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
