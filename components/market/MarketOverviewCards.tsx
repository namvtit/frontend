"use client";
import { INDICES } from "@/lib/market/mock-data";
import { formatNumber, formatPercent, getChangeColor } from "@/lib/utils";
import PriceChangeBadge from "./PriceChangeBadge";

export default function MarketOverviewCards() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {INDICES.map((idx) => (
        <div key={idx.symbol} className="card flex flex-col gap-1">
          <span className="text-xs font-medium text-muted-foreground">{idx.name}</span>
          <span className="font-mono font-semibold text-lg">{formatNumber(idx.value, idx.symbol === "VIX" ? 2 : 2)}</span>
          <div className="flex items-center gap-2">
            <span className={`font-mono text-sm ${getChangeColor(idx.change)}`}>
              {idx.change >= 0 ? "+" : ""}{formatNumber(idx.change)}
            </span>
            <PriceChangeBadge value={idx.changePercent} />
          </div>
        </div>
      ))}
    </div>
  );
}
