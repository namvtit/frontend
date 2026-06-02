"use client";
import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";

const SYMBOL_MAP: Record<string, string> = {
  AAPL: "NASDAQ:AAPL", MSFT: "NASDAQ:MSFT", NVDA: "NASDAQ:NVDA", GOOGL: "NASDAQ:GOOGL",
  AMZN: "NASDAQ:AMZN", META: "NASDAQ:META", TSLA: "NASDAQ:TSLA", QQQ: "NASDAQ:QQQ",
  "BRK.B": "NYSE:BRK.B", JPM: "NYSE:JPM", V: "NYSE:V", UNH: "NYSE:UNH", XOM: "NYSE:XOM",
  DIS: "NYSE:DIS", SPY: "AMEX:SPY",
};

interface TradingViewChartProps {
  symbol: string;
  height?: number;
  interval?: string;
  autosize?: boolean;
}

export default function TradingViewChart({
  symbol,
  height = 480,
  interval = "D",
  autosize = true,
}: TradingViewChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = "";

    const tvSymbol = SYMBOL_MAP[symbol] || `NASDAQ:${symbol}`;
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize,
      symbol: tvSymbol,
      interval,
      timezone: "Asia/Ho_Chi_Minh",
      theme: resolvedTheme === "dark" ? "dark" : "light",
      style: "1",
      locale: "vi_VN",
      allow_symbol_change: false,
      hide_top_toolbar: false,
      hide_legend: false,
      save_image: false,
      calendar: false,
      support_host: "https://www.tradingview.com",
    });

    containerRef.current.appendChild(script);
  }, [symbol, resolvedTheme, interval, autosize]);

  return (
    <div className="rounded-lg border border-border bg-card p-0 overflow-hidden" style={{ height }}>
      <div ref={containerRef} className="tradingview-widget-container" style={{ height: "100%", width: "100%" }}>
        <div className="flex items-center justify-center h-full">
          <div className="skeleton w-full h-full" />
        </div>
      </div>
    </div>
  );
}
