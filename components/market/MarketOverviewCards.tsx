"use client";
import { INDICES } from "@/lib/market/mock-data";
import { formatNumber, getChangeColor } from "@/lib/utils";
import PriceChangeBadge from "./PriceChangeBadge";
import { useDemo } from "@/lib/demo";
import { useLivePrices, getFlashClass } from "@/lib/market/use-live-prices";

export default function MarketOverviewCards() {
  const { state } = useDemo();
  const { getFlash } = useLivePrices();

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {INDICES.map((idx) => {
        const cached = state.marketCache[idx.symbol];
        const displayValue = cached?.price ?? idx.value;
        const displayChange = cached?.change ?? idx.change;
        const displayPct = cached?.changePercent ?? idx.changePercent;
        const isLive = !!cached;
        const flash = getFlash(idx.symbol);

        return (
          <div key={idx.symbol} className={`card flex flex-col gap-1 transition-colors ${getFlashClass(flash)}`}>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">{idx.name}</span>
              {isLive && <span className="live-dot" title="Live" />}
            </div>
            <span className="font-mono font-semibold text-lg tabular-nums">
              {formatNumber(displayValue, idx.symbol === "VIX" ? 2 : 2)}
            </span>
            <div className="flex items-center gap-2">
              <span className={`font-mono text-sm tabular-nums ${getChangeColor(displayChange)}`}>
                {displayChange >= 0 ? "+" : ""}{formatNumber(displayChange)}
              </span>
              <PriceChangeBadge value={displayPct} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
