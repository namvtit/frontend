"use client";
import { formatPercent, getChangeBg } from "@/lib/utils";

export default function PriceChangeBadge({ value, className = "" }: { value: number; className?: string }) {
  return (
    <span className={`badge ${value > 0 ? "badge-bull" : value < 0 ? "badge-bear" : "badge-neutral"} font-mono text-xs ${className}`}>
      {formatPercent(value)}
    </span>
  );
}
