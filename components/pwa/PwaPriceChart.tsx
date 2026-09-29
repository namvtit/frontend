"use client";

import { useMemo } from "react";
import { Activity, ChevronDown, Radio } from "lucide-react";
import { useDemo } from "@/lib/demo";
import { INDICES, getStockBySymbol } from "@/lib/market/mock-data";
import { useLivePrice } from "@/lib/market/use-live-prices";

const chartPoints = (values: number[], width = 330, height = 116) => {
  const low = Math.min(...values);
  const high = Math.max(...values);
  const range = high - low || 1;
  return values.map((value, index) => `${(index / (values.length - 1)) * width},${height - ((value - low) / range) * height}`).join(" ");
};

export function PwaPriceChart() {
  const fallback = getStockBySymbol("AAPL");
  const { price, changePercent, isLive, flash } = useLivePrice("AAPL", fallback);
  const { state } = useDemo();
  const points = useMemo(() => {
    const source = fallback?.sparkline ?? [1, 2];
    const last = source[source.length - 1] || 1;
    return chartPoints(source.map((point) => (point / last) * price));
  }, [fallback?.sparkline, price]);
  const updatedAt = state.marketCache.AAPL?.updatedAt;

  return (
    <section className="pwa-chart-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-white/65">
            <span className="pwa-live-dot"><Radio className="h-3 w-3" /></span>
            {isLive ? "LIVE · Yahoo Finance" : "Đang kết nối dữ liệu"}
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">AAPL</h1>
            <span className="text-xs text-white/60">Apple Inc.</span>
          </div>
        </div>
        <button className="pwa-period-button" type="button" aria-label="Chọn mã theo dõi">
          1D <ChevronDown className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="mt-3 flex items-end justify-between">
        <div>
          <p className={`font-mono text-[30px] font-semibold leading-none tracking-tight transition-colors ${flash === "up" ? "text-emerald-300" : flash === "down" ? "text-red-300" : "text-white"}`}>
            ${price.toFixed(2)}
          </p>
          <p className={`mt-2 text-sm font-semibold ${changePercent >= 0 ? "text-emerald-300" : "text-red-300"}`}>
            {changePercent >= 0 ? "+" : ""}{changePercent.toFixed(2)}% hôm nay
          </p>
        </div>
        <div className="rounded-xl bg-white/10 px-2.5 py-1.5 text-right text-[10px] text-white/65">
          <span className="block">S&P 500</span>
          <span className="font-semibold text-emerald-300">+{(state.marketCache.SPX?.changePercent ?? INDICES[0].changePercent).toFixed(2)}%</span>
        </div>
      </div>

      <div className="relative mt-4 h-30 overflow-hidden">
        <div className="absolute inset-x-0 bottom-0 h-px bg-white/10" />
        <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-white/10" />
        <svg viewBox="0 0 330 116" preserveAspectRatio="none" className="h-full w-full overflow-visible" role="img" aria-label="Biểu đồ giá AAPL trong ngày">
          <defs>
            <linearGradient id="pwa-chart-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#6ee7b7" stopOpacity="0.32" />
              <stop offset="100%" stopColor="#6ee7b7" stopOpacity="0" />
            </linearGradient>
          </defs>
          <polygon points={`0,116 ${points} 330,116`} fill="url(#pwa-chart-fill)" />
          <polyline points={points} fill="none" stroke="#6ee7b7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div className="mt-3 flex items-center justify-between text-[10px] text-white/55">
        <span className="flex items-center gap-1"><Activity className="h-3 w-3" /> Intraday</span>
        <span>{updatedAt ? `Cập nhật ${new Intl.DateTimeFormat("vi-VN", { hour: "2-digit", minute: "2-digit" }).format(new Date(updatedAt))}` : "Đang tải giá mới nhất…"}</span>
      </div>
    </section>
  );
}
