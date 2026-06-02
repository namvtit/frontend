import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatLargeNumber(value: number): string {
  if (value >= 1e12) return `${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(2)}K`;
  return value.toFixed(2);
}

export function formatPercent(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

export function formatNumber(value: number, decimals = 2): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function getChangeColor(value: number): string {
  if (value > 0) return "text-emerald-500";
  if (value < 0) return "text-red-500";
  return "text-zinc-400";
}

export function getChangeBg(value: number): string {
  if (value > 0) return "bg-emerald-500/10 text-emerald-500";
  if (value < 0) return "bg-red-500/10 text-red-500";
  return "bg-zinc-500/10 text-zinc-400";
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function generateSparklineData(
  points = 20,
  trend: "up" | "down" | "flat" = "up",
  seed = 42
): number[] {
  // Seeded PRNG to avoid SSR/client hydration mismatch
  let s = seed;
  function rand() {
    let t = (s += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  const data: number[] = [];
  let value = 50 + rand() * 50;
  for (let i = 0; i < points; i++) {
    const change = (rand() - 0.5) * 10;
    const trendBias = trend === "up" ? 1.5 : trend === "down" ? -1.5 : 0;
    value = Math.max(10, value + change + trendBias);
    data.push(value);
  }
  return data;
}
