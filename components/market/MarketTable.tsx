"use client";
import { useState, useMemo } from "react";
import { StockQuote } from "@/lib/market/mock-data";
import { formatCurrency, formatLargeNumber, formatPercent, getChangeColor } from "@/lib/utils";
import PriceChangeBadge from "./PriceChangeBadge";
import MiniSparkline from "./MiniSparkline";
import WatchlistStar from "./WatchlistStar";
import { useDemo } from "@/lib/demo";

type SortKey = "symbol"|"price"|"day1"|"week1"|"month1"|"ytd"|"marketCap"|"volume"|"peRatio"|"eps";

export default function MarketTable({ stocks, showFilters = true }: { stocks: StockQuote[]; showFilters?: boolean }) {
  const { state } = useDemo();
  const [sortKey, setSortKey] = useState<SortKey>("marketCap");
  const [sortDir, setSortDir] = useState<"asc"|"desc">("desc");
  const [search, setSearch] = useState("");
  const [sectorFilter, setSectorFilter] = useState("all");

  const sectors = useMemo(() => ["all", ...new Set(stocks.map((s) => s.sector))], [stocks]);

  const sorted = useMemo(() => {
    let filtered = stocks;
    if (search) filtered = filtered.filter((s) => s.symbol.toLowerCase().includes(search.toLowerCase()) || s.name.toLowerCase().includes(search.toLowerCase()));
    if (sectorFilter !== "all") filtered = filtered.filter((s) => s.sector === sectorFilter);
    return [...filtered].sort((a, b) => {
      const av = a[sortKey] as number;
      const bv = b[sortKey] as number;
      return sortDir === "asc" ? av - bv : bv - av;
    });
  }, [stocks, sortKey, sortDir, search, sectorFilter]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
  };

  const SortIcon = ({ k }: { k: SortKey }) => sortKey === k ? <span className="ml-1">{sortDir === "asc" ? "↑" : "↓"}</span> : null;

  return (
    <div className="fade-in">
      {showFilters && (
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <input className="input max-w-xs" placeholder="Tìm mã hoặc tên..." value={search} onChange={(e) => setSearch(e.target.value)} id="market-table-search" />
          <select className="input max-w-[160px]" value={sectorFilter} onChange={(e) => setSectorFilter(e.target.value)} id="sector-filter">
            {sectors.map((s) => <option key={s} value={s}>{s === "all" ? "Tất cả ngành" : s}</option>)}
          </select>
        </div>
      )}

      {/* Desktop table */}
      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th onClick={() => toggleSort("symbol")}>Mã <SortIcon k="symbol"/></th>
              <th>Công ty</th>
              <th onClick={() => toggleSort("price")}>Giá <SortIcon k="price"/></th>
              <th onClick={() => toggleSort("day1")}>1D % <SortIcon k="day1"/></th>
              <th onClick={() => toggleSort("week1")}>1W % <SortIcon k="week1"/></th>
              <th onClick={() => toggleSort("month1")}>1M % <SortIcon k="month1"/></th>
              <th onClick={() => toggleSort("ytd")}>YTD % <SortIcon k="ytd"/></th>
              <th onClick={() => toggleSort("marketCap")}>Vốn hóa <SortIcon k="marketCap"/></th>
              <th onClick={() => toggleSort("volume")}>KL <SortIcon k="volume"/></th>
              <th onClick={() => toggleSort("peRatio")}>P/E <SortIcon k="peRatio"/></th>
              <th onClick={() => toggleSort("eps")}>EPS <SortIcon k="eps"/></th>
              <th>Ngành</th>
              <th>Chart</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((s, i) => {
              const cached = state.marketCache[s.symbol.toUpperCase()];
              const displayPrice = cached?.price ?? s.price;
              const displayChange = cached?.changePercent ?? s.day1;
              return (
                <tr key={s.symbol} onClick={() => window.location.href = `/stocks/${s.symbol}`}>
                  <td className="text-muted-foreground">{i + 1}</td>
                  <td className="font-semibold text-primary">{s.symbol}</td>
                  <td className="max-w-[140px] truncate">{s.name}</td>
                  <td className="font-mono font-medium">{formatCurrency(displayPrice)}</td>
                  <td><PriceChangeBadge value={displayChange} /></td>
                  <td><PriceChangeBadge value={s.week1} /></td>
                  <td><PriceChangeBadge value={s.month1} /></td>
                  <td><PriceChangeBadge value={s.ytd} /></td>
                  <td className="font-mono">{formatLargeNumber(s.marketCap)}</td>
                  <td className="font-mono">{formatLargeNumber(s.volume)}</td>
                  <td className="font-mono">{s.peRatio > 0 ? s.peRatio.toFixed(1) : "—"}</td>
                  <td className="font-mono">{s.eps > 0 ? s.eps.toFixed(2) : "—"}</td>
                  <td><span className="badge badge-neutral text-xs">{s.sector}</span></td>
                  <td><MiniSparkline data={s.sparkline} /></td>
                  <td><WatchlistStar symbol={s.symbol} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="mobile-cards flex-col gap-3">
        {sorted.map((s, i) => {
          const cached = state.marketCache[s.symbol.toUpperCase()];
          const displayPrice = cached?.price ?? s.price;
          const displayChange = cached?.changePercent ?? s.day1;
          return (
            <a key={s.symbol} href={`/stocks/${s.symbol}`} className="card flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-primary">{s.symbol}</span>
                  <span className="text-xs text-muted-foreground truncate">{s.name}</span>
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <span className="font-mono font-medium">{formatCurrency(displayPrice)}</span>
                  <PriceChangeBadge value={displayChange} />
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                  <span>Vốn hóa: {formatLargeNumber(s.marketCap)}</span>
                  <span>KL: {formatLargeNumber(s.volume)}</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <MiniSparkline data={s.sparkline} width={60} height={24} />
                <WatchlistStar symbol={s.symbol} />
              </div>
            </a>
          );
        })}
      </div>

      {sorted.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg mb-2">Không tìm thấy kết quả</p>
          <p className="text-sm">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
        </div>
      )}
    </div>
  );
}
