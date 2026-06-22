"use client";
import { useEffect, useRef, useState, useMemo } from "react";
import { useTheme } from "next-themes";
import { BrainCircuit, TrendingUp, TrendingDown, Activity } from "lucide-react";

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
  for (let i = 1; i <= 60; i++) {
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

export interface PredictionData {
  historical: Array<{ time: string; value: number }>;
  prediction: Array<{ time: string; value: number }>;
  upperBand: Array<{ time: string; value: number }>;
  lowerBand: Array<{ time: string; value: number }>;
  lastPrice: number;
  predChange: number;
  predChangePercent: number;
}

interface AIPredictionChartProps {
  symbol: string;
  height?: number;
  /** Data từ API. Nếu không truyền sẽ dùng mock data */
  data?: PredictionData;
}

/* ── Ticker-style metric ── */
function LiveMetric({ label, value, change, pulse }: { label: string; value: string; change?: string; pulse?: boolean }) {
  const isPositive = change && !change.startsWith("-");
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-muted/40 text-xs whitespace-nowrap">
      {pulse && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono font-semibold text-foreground">{value}</span>
      {change && (
        <span className={`font-mono font-medium ${isPositive ? "text-emerald-500" : "text-red-500"}`}>
          {change}
        </span>
      )}
    </div>
  );
}

export default function AIPredictionChart({ symbol, height = 280, data: externalData }: AIPredictionChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<unknown>(null);
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const mockData = useMemo(() => generateMockData(symbol), [symbol]);
  const data = externalData ?? mockData;
  const isBullish = data.predChange >= 0;

  // Mock live metrics
  const metrics = useMemo(() => {
    const s = data.lastPrice;
    return {
      rsi: (40 + (s % 30)).toFixed(1),
      macd: ((s * 0.002) - 0.15).toFixed(3),
      volume: `${(45 + (s % 20)).toFixed(1)}M`,
      volatility: (12 + (s % 8)).toFixed(1),
      sharpe: (0.8 + (s % 5) * 0.2).toFixed(2),
      beta: (0.9 + (s % 3) * 0.15).toFixed(2),
    };
  }, [data.lastPrice]);

  useEffect(() => {
    if (!mounted || !containerRef.current) return;

    let cancelled = false;
    let resizeObserver: ResizeObserver | null = null;

    async function init() {
      if (!containerRef.current || cancelled) return;

      const lc = await import("lightweight-charts");
      const { createChart, createSeriesMarkers, LineSeries, LineStyle, LineType } = lc;

      if (cancelled || !containerRef.current) return;

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

      const predColor = isBullish
        ? (isDark ? "#34d399" : "#10b981")
        : (isDark ? "#f87171" : "#ef4444");

      // Historical line
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

      // Confidence bands
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

      // Responsive
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

  // SSR skeleton
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
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border bg-muted/30 px-4 py-3">
        <div className="flex items-center gap-2">
          <BrainCircuit className="h-4 w-4 text-purple-500" />
          <h3 className="text-sm font-bold text-foreground">Dự đoán AI</h3>
          <span className="rounded-full border border-purple-500/30 bg-purple-500/10 px-2 py-0.5 text-[10px] font-semibold text-purple-600 dark:text-purple-400">
            {externalData ? "TRỰC TIẾP" : "DỰ BÁO"}
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-4 rounded-full bg-purple-500" />
            <span className="text-muted-foreground">Lịch sử</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className={`inline-block h-0.5 w-4 rounded-full ${isBullish ? "bg-emerald-500" : "bg-red-500"}`}
              style={{ backgroundImage: "repeating-linear-gradient(90deg, currentColor 0, currentColor 4px, transparent 4px, transparent 8px)" }}
            />
            <span className="text-muted-foreground">Dự đoán</span>
          </div>
        </div>
      </div>

      {/* ── Live Metrics Bar ── */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border overflow-x-auto scrollbar-none">
        <LiveMetric label="RSI" value={metrics.rsi} pulse />
        <LiveMetric label="MACD" value={metrics.macd} change={Number(metrics.macd) >= 0 ? `+${metrics.macd}` : metrics.macd} />
        <LiveMetric label="Vol" value={metrics.volume} />
        <LiveMetric label="σ" value={`${metrics.volatility}%`} />
        <LiveMetric label="Sharpe" value={metrics.sharpe} />
        <LiveMetric label="β" value={metrics.beta} />
      </div>

      {/* ── Chart ── */}
      <div className="px-2 pt-2 overflow-hidden">
        <div ref={containerRef} className="overflow-hidden" />
      </div>

      {/* Footer stats */}
      <div className="flex items-center justify-between border-t border-border px-4 py-2.5">
        <div className="flex items-center gap-4 text-xs">
          <div>
            <span className="text-muted-foreground">Giá hiện tại: </span>
            <span className="font-mono font-semibold">${data.lastPrice.toFixed(2)}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Dự đoán 60 ngày: </span>
            <span className={`font-mono font-semibold ${isBullish ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
              {isBullish ? "+" : ""}{data.predChange.toFixed(2)} ({isBullish ? "+" : ""}{data.predChangePercent.toFixed(2)}%)
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {isBullish ? <TrendingUp className="w-3.5 h-3.5 text-emerald-500" /> : <TrendingDown className="w-3.5 h-3.5 text-red-500" />}
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
  );
}
