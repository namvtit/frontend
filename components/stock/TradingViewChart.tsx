"use client";
import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import { SP500_METADATA } from "@/lib/market/sp500-metadata";

const SPECIAL_SYMBOL_MAP: Record<string, string> = {
  // Crypto
  BTC: "BINANCE:BTCUSDT",
  ETH: "BINANCE:ETHUSDT",
  SOL: "BINANCE:SOLUSDT",
  BNB: "BINANCE:BNBUSDT",
  XRP: "BINANCE:XRPUSDT",
  DOGE: "BINANCE:DOGEUSDT",
  ADA: "BINANCE:ADAUSDT",
  AVAX: "BINANCE:AVAXUSDT",
  LINK: "BINANCE:LINKUSDT",
  SUI: "BINANCE:SUIUSDT",
  NEAR: "BINANCE:NEARUSDT",

  // Forex
  EURUSD: "FX:EURUSD",
  "EUR/USD": "FX:EURUSD",
  GBPUSD: "FX:GBPUSD",
  "GBP/USD": "FX:GBPUSD",
  USDJPY: "FX:USDJPY",
  "USD/JPY": "FX:USDJPY",
  USDVND: "FX_IDC:USDVND",
  "USD/VND": "FX_IDC:USDVND",
  AUDUSD: "FX:AUDUSD",
  "AUD/USD": "FX:AUDUSD",
  USDCAD: "FX:USDCAD",
  "USD/CAD": "FX:USDCAD",
  USDCHF: "FX:USDCHF",
  "USD/CHF": "FX:USDCHF",

  // Indices
  SPX: "SP:SPX",
  "^GSPC": "SP:SPX",
  IXIC: "NASDAQ:IXIC",
  "^IXIC": "NASDAQ:IXIC",
  DJI: "DJ:DJI",
  "^DJI": "DJ:DJI",
  VIX: "CBOE:VIX",
  "^VIX": "CBOE:VIX",
  VNINDEX: "INDEX:VNINDEX",
  FTSE: "LSE:FTSE",
  N225: "INDEX:N225",

  // ETFs
  SPY: "AMEX:SPY",
  QQQ: "NASDAQ:QQQ",
  VOO: "AMEX:VOO",
  VTI: "AMEX:VTI",
  IWM: "AMEX:IWM",
  DIA: "AMEX:DIA",
  SOXX: "NASDAQ:SOXX",
  XLK: "AMEX:XLK",
  XLF: "AMEX:XLF",
  XLE: "AMEX:XLE",
  GLD: "AMEX:GLD",
  SLV: "AMEX:SLV",
  ARKK: "AMEX:ARKK",
  TLT: "NASDAQ:TLT",

  // Stocks
  "BRK.B": "NYSE:BRK.B",
  "BRK-B": "NYSE:BRK.B",
};

function resolveTradingViewSymbol(symbol: string): string {
  const upper = symbol.toUpperCase().trim();
  if (SPECIAL_SYMBOL_MAP[upper]) return SPECIAL_SYMBOL_MAP[upper];

  // Try matching S&P 500 metadata for correct exchange
  const meta = SP500_METADATA.find(
    (m) => m.symbol.toUpperCase() === upper || m.requestSymbol.toUpperCase() === upper
  );
  if (meta) {
    const exchange = meta.exchange || "NASDAQ";
    return `${exchange}:${meta.symbol}`;
  }

  return `NASDAQ:${upper}`;
}

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

    const tvSymbol = resolveTradingViewSymbol(symbol);
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
