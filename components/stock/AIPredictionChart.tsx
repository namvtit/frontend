"use client";
import { useEffect, useRef, useState, useMemo } from "react";
import { useTheme } from "next-themes";
import { BrainCircuit } from "lucide-react";

/* ── Mock data generator ── */
function generateMockData(symbol: string) {
  const seed = symbol.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const rng = (i: number) => Math.sin(seed * 9301 + i * 49297) * 0.5 + 0.5;

  const basePrice = 150 + (seed % 100);
  const today = new Date();
  const historical: { time: string; value: number }[] = [];
  const prediction: { time: string; value: number }[] = [];
  const upperBand: { time: string; value: number }[] = [];
  const lowerBand: { time: string; value: number }[] = [];

  let price = basePrice;
  for (let i = 59; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    if (d.getDay() === 0 || d.getDay() === 6) continue;
    const change = (rng(i * 3 + seed) - 0.48) * 4;
    price += change;
    price = Math.max(price * 0.95, Math.min(price * 1.05, price));
    historical.push({
      time: d.toISOString().split("T")[0],
      value: Math.round(price * 100) / 100,
    });
  }

  const lastPrice = historical[historical.length - 1].value;
  const lastDate = new Date(historical[historical.length - 1].time);

  prediction.push({ time: historical[historical.length - 1].time, value: lastPrice });
  upperBand.push({ time: historical[historical.length - 1].time, value: lastPrice });
  lowerBand.push({ time: historical[historical.length - 1].time, value: lastPrice });

  let predPrice = lastPrice;
  const trend = rng(seed * 7) > 0.45 ? 1 : -1;
  for (let i = 1; i <= 14; i++) {
    const d = new Date(lastDate);
    d.setDate(d.getDate() + i);
    if (d.getDay() === 0 || d.getDay() === 6) continue;
    const drift = trend * 0.3 + (rng(i * 7 + seed * 3) - 0.5) * 2;
    predPrice += drift;
    const dateStr = d.toISOString().split("T")[0];
    const spread = 1.5 + i * 0.6;

    prediction.push({ time: dateStr, value: Math.round(predPrice * 100) / 100 });
    upperBand.push({ time: dateStr, value: Math.round((predPrice + spread) * 100) / 100 });
    lowerBand.push({ time: dateStr, value: Math.round((predPrice - spread) * 100) / 100 });
  }

  const predChange = prediction[prediction.length - 1].value - lastPrice;
  const predChangePercent = (predChange / lastPrice) * 100;

  return { historical, prediction, upperBand, lowerBand, lastPrice, predChange, predChangePercent };
}

interface AIPredictionChartProps {
  symbol: string;
  height?: number;
}

export default function AIPredictionChart({ symbol, height = 280 }: AIPredictionChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<unknown>(null);
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Ensure client-side only rendering
  useEffect(() => {
    setMounted(true);
  }, []);

  const data = useMemo(() => generateMockData(symbol), [symbol]);
  const isBullish = data.predChange >= 0;

  useEffect(() => {
    if (!mounted || !containerRef.current) return;

    let cancelled = false;
    let resizeObserver: ResizeObserver | null = null;

    async function init() {
      if (!containerRef.current || cancelled) return;

      const lc = await import("lightweight-charts");
      const { createChart, createSeriesMarkers, LineSeries, LineStyle, LineType } = lc;

      if (cancelled || !containerRef.current) return;

      // Dispose previous chart
      if (chartRef.current) {
        try {
          (chartRef.current as ReturnType<typeof createChart>).remove();
        } catch {
          // ignore
        }
        chartRef.current = null;
      }

      const isDark = resolvedTheme === "dark";

      const chart = createChart(containerRef.current, {
        height,
        layout: {
          background: { color: "transparent" },
          textColor: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.4)",
          fontFamily: "'Inter', system-ui, sans-serif",
          fontSize: 11,
        },
        grid: {
          vertLines: { color: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)" },
          horzLines: { color: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)" },
        },
        crosshair: {
          vertLine: {
            color: isDark ? "rgba(168,85,247,0.3)" : "rgba(168,85,247,0.2)",
            labelBackgroundColor: isDark ? "#7c3aed" : "#8b5cf6",
          },
          horzLine: {
            color: isDark ? "rgba(168,85,247,0.3)" : "rgba(168,85,247,0.2)",
            labelBackgroundColor: isDark ? "#7c3aed" : "#8b5cf6",
          },
        },
        rightPriceScale: {
          borderVisible: false,
          scaleMargins: { top: 0.1, bottom: 0.1 },
        },
        timeScale: {
          borderVisible: false,
          timeVisible: false,
          rightOffset: 5,
        },
        handleScroll: { vertTouchDrag: false },
      });

      if (cancelled) { chart.remove(); return; }
      chartRef.current = chart;

      // Historical line (solid)
      const predColor = isBullish
        ? (isDark ? "#34d399" : "#10b981")
        : (isDark ? "#f87171" : "#ef4444");

      const historicalSeries = chart.addSeries(LineSeries, {
        color: isDark ? "#a78bfa" : "#7c3aed",
        lineWidth: 2,
        lineType: LineType.Curved,
        crosshairMarkerRadius: 4,
        crosshairMarkerBackgroundColor: isDark ? "#a78bfa" : "#7c3aed",
        priceLineVisible: false,
        lastValueVisible: false,
      });
      historicalSeries.setData(data.historical);

      // Prediction line (dashed)
      const predictionSeries = chart.addSeries(LineSeries, {
        color: predColor,
        lineWidth: 2,
        lineStyle: LineStyle.Dashed,
        lineType: LineType.Curved,
        crosshairMarkerRadius: 4,
        crosshairMarkerBackgroundColor: predColor,
        priceLineVisible: false,
        lastValueVisible: true,
      });
      predictionSeries.setData(data.prediction);

      // Upper confidence band
      const bandColor = isBullish
        ? (isDark ? "rgba(52,211,153,0.15)" : "rgba(16,185,129,0.12)")
        : (isDark ? "rgba(248,113,113,0.15)" : "rgba(239,68,68,0.12)");

      const upperSeries = chart.addSeries(LineSeries, {
        color: bandColor,
        lineWidth: 1,
        lineStyle: LineStyle.Dotted,
        crosshairMarkerVisible: false,
        priceLineVisible: false,
        lastValueVisible: false,
      });
      upperSeries.setData(data.upperBand);

      const lowerSeries = chart.addSeries(LineSeries, {
        color: bandColor,
        lineWidth: 1,
        lineStyle: LineStyle.Dotted,
        crosshairMarkerVisible: false,
        priceLineVisible: false,
        lastValueVisible: false,
      });
      lowerSeries.setData(data.lowerBand);

      // "Hôm nay" marker
      const lastHistorical = data.historical[data.historical.length - 1];
      createSeriesMarkers(historicalSeries, [
        {
          time: lastHistorical.time,
          position: "aboveBar",
          color: isDark ? "#a78bfa" : "#7c3aed",
          shape: "circle",
          text: "Hôm nay",
        },
      ]);

      chart.timeScale().fitContent();

      // Responsive resize
      resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          if (!cancelled) {
            chart.applyOptions({ width: entry.contentRect.width });
          }
        }
      });
      resizeObserver.observe(containerRef.current!);
    }

    init();

    return () => {
      cancelled = true;
      resizeObserver?.disconnect();
      if (chartRef.current) {
        try {
          (chartRef.current as { remove: () => void }).remove();
        } catch {
          // ignore
        }
        chartRef.current = null;
      }
    };
  }, [mounted, resolvedTheme, symbol, height, data, isBullish]);

  // Don't render chart container until mounted (avoids SSR mismatch)
  if (!mounted) {
    return (
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="flex items-center gap-2 border-b border-border bg-muted/30 px-4 py-3">
          <BrainCircuit className="h-4 w-4 text-purple-500" />
          <h3 className="text-sm font-bold text-foreground">Dự đoán AI</h3>
        </div>
        <div className="flex items-center justify-center" style={{ height }}>
          <div className="skeleton w-full h-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden relative">
      {/* Header - always visible */}
      <div className="flex items-center justify-between border-b border-border bg-muted/30 px-4 py-3">
        <div className="flex items-center gap-2">
          <BrainCircuit className="h-4 w-4 text-purple-500" />
          <h3 className="text-sm font-bold text-foreground">Dự đoán AI</h3>
          <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5z"/></svg>
            VIP
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-4 rounded-full bg-purple-500"></span>
            <span className="text-muted-foreground">Lịch sử</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className={`inline-block h-0.5 w-4 rounded-full ${isBullish ? "bg-emerald-500" : "bg-red-500"}`}
              style={{ backgroundImage: "repeating-linear-gradient(90deg, currentColor 0, currentColor 4px, transparent 4px, transparent 8px)" }}
            ></span>
            <span className="text-muted-foreground">Dự đoán</span>
          </div>
        </div>
      </div>

      {/* Chart + Footer wrapper with blur lock */}
      <div className="relative">
        {/* Actual chart content - blurred & non-interactive */}
        <div className="blur-[6px] pointer-events-none select-none">
          <div className="px-2 pt-2">
            <div ref={containerRef} />
          </div>

          {/* Footer stats */}
          <div className="flex items-center justify-between border-t border-border px-4 py-2.5">
            <div className="flex items-center gap-4 text-xs">
              <div>
                <span className="text-muted-foreground">Giá hiện tại: </span>
                <span className="font-mono font-semibold">${data.lastPrice.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Dự đoán 14 ngày: </span>
                <span className={`font-mono font-semibold ${isBullish ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                  {isBullish ? "+" : ""}{data.predChange.toFixed(2)} ({isBullish ? "+" : ""}{data.predChangePercent.toFixed(2)}%)
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`inline-block h-2 w-2 rounded-full ${isBullish ? "bg-emerald-500" : "bg-red-500"}`}></span>
              <span className={`text-xs font-semibold ${isBullish ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                {isBullish ? "Xu hướng tăng" : "Xu hướng giảm"}
              </span>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="border-t border-border bg-amber-500/5 px-4 py-2">
            <p className="text-[10px] text-amber-600 dark:text-amber-400">
              ⚠️ Dự đoán AI chỉ mang tính tham khảo, không phải khuyến nghị đầu tư.
            </p>
          </div>
        </div>

        {/* ── VIP Lock Overlay ── */}
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/60 dark:bg-background/70 backdrop-blur-[2px]">
          {/* Lock icon */}
          <div className="relative mb-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 dark:from-amber-500 dark:to-amber-700 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>
            {/* Crown badge */}
            <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-gradient-to-br from-amber-300 to-amber-500 flex items-center justify-center shadow-md">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5z"/></svg>
            </div>
          </div>

          {/* Text */}
          <h4 className="text-base font-bold text-foreground mb-1">Tính năng dành cho VIP</h4>
          <p className="text-sm text-muted-foreground text-center max-w-xs mb-4 leading-relaxed">
            Nâng cấp tài khoản VIP để xem dự đoán xu hướng giá từ AI và nhận tín hiệu giao dịch sớm nhất.
          </p>

          {/* CTA Button */}
          <button className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold text-sm px-6 py-2.5 shadow-lg shadow-amber-500/25 transition-all duration-200 hover:shadow-amber-500/40 hover:scale-[1.02] active:scale-[0.98]">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5z"/></svg>
            Nâng cấp VIP
          </button>

          {/* Price hint */}
          <p className="text-[11px] text-muted-foreground mt-2.5">
            Chỉ từ <span className="font-semibold text-amber-600 dark:text-amber-400">99.000đ</span>/tháng
          </p>
        </div>
      </div>
    </div>
  );
}
