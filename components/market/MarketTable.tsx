"use client";
import { useEffect, useMemo, useState } from "react";
import { StockQuote } from "@/lib/market/mock-data";
import { SP500_METADATA } from "@/lib/market/sp500-metadata";
import { useVisibleLiveQuotes } from "@/lib/market/use-visible-live-quotes";
import { formatCurrency, formatLargeNumber } from "@/lib/utils";
import PriceChangeBadge from "./PriceChangeBadge";
import MiniSparkline from "./MiniSparkline";
import WatchlistStar from "./WatchlistStar";
import { useDemo } from "@/lib/demo";

type SortKey = "symbol"|"price"|"day1"|"week1"|"month1"|"ytd"|"marketCap"|"volume"|"peRatio"|"eps";
type MarketRow = StockQuote & { requestSymbol: string; marketCapRank: number };

interface MarketTableProps {
  stocks: StockQuote[];
  showFilters?: boolean;
  priceFilter?: string;
  changeFilter?: string;
  marketCapFilter?: string;
  exchangeFilter?: string;
}

const EMPTY_NUMBER = Number.NaN;
const MAX_VISIBLE_STOCKS = 30;

function normalizeText(value: string) {
  return value.trim().toUpperCase().replace(/[.-]/g, "").replace(/[^A-Z0-9]+/g, " ").trim();
}

function searchRank(stock: MarketRow, query: string) {
  if (!query) return 0;
  const compactQuery = query.replace(/\s+/g, "");
  const symbol = normalizeText(stock.symbol).replace(/\s+/g, "");
  const requestSymbol = normalizeText(stock.requestSymbol).replace(/\s+/g, "");
  const name = normalizeText(stock.name);
  if (compactQuery === symbol || compactQuery === requestSymbol) return 0;
  if (symbol.startsWith(compactQuery) || requestSymbol.startsWith(compactQuery)) return 1;
  if (symbol.includes(compactQuery) || requestSymbol.includes(compactQuery)) return 2;
  if (name.includes(query)) return 3;
  return Number.POSITIVE_INFINITY;
}

function matchesMarketCapRank(rank: number, filter: string) {
  if (filter === "mega") return rank <= 20;
  if (filter === "large") return rank > 20 && rank <= 200;
  if (filter === "mid") return rank > 200 && rank <= 400;
  if (filter === "small") return rank > 400;
  return true;
}

function hasFiniteValue(value: number) {
  return Number.isFinite(value);
}

function compareNumbers(a: number, b: number, direction: "asc" | "desc") {
  const aAvailable = hasFiniteValue(a);
  const bAvailable = hasFiniteValue(b);
  if (!aAvailable && !bAvailable) return 0;
  if (!aAvailable) return 1;
  if (!bAvailable) return -1;
  return direction === "asc" ? a - b : b - a;
}

function formatOptionalCurrency(value: number) {
  return hasFiniteValue(value) ? formatCurrency(value) : "—";
}

function formatOptionalLargeNumber(value: number) {
  return hasFiniteValue(value) ? formatLargeNumber(value) : "—";
}

export default function MarketTable({
  stocks,
  showFilters = true,
  priceFilter = "all",
  changeFilter = "all",
  marketCapFilter = "all",
  exchangeFilter = "all",
}: MarketTableProps) {
  const { state } = useDemo();
  const [sortKey, setSortKey] = useState<SortKey>("marketCap");
  const [sortDir, setSortDir] = useState<"asc"|"desc">("desc");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sectorFilter, setSectorFilter] = useState("all");

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedSearch(search), 300);
    return () => window.clearTimeout(timeout);
  }, [search]);

  const universe = useMemo<MarketRow[]>(() => {
    const seededBySymbol = new Map(stocks.map((stock) => [stock.symbol.toUpperCase(), stock]));
    const metadataSymbols = new Set(SP500_METADATA.map((stock) => stock.symbol));
    const sp500Rows = SP500_METADATA.map((metadata) => {
      const seeded = seededBySymbol.get(metadata.symbol);
      if (seeded) {
        return { ...seeded, requestSymbol: metadata.requestSymbol, marketCapRank: metadata.marketCapRank };
      }
      return {
        symbol: metadata.symbol,
        requestSymbol: metadata.requestSymbol,
        name: metadata.name,
        exchange: metadata.exchange,
        sector: metadata.sector,
        marketCapRank: metadata.marketCapRank,
        currency: "USD",
        price: EMPTY_NUMBER,
        change: EMPTY_NUMBER,
        changePercent: EMPTY_NUMBER,
        marketCap: EMPTY_NUMBER,
        volume: EMPTY_NUMBER,
        peRatio: EMPTY_NUMBER,
        eps: EMPTY_NUMBER,
        dividendYield: EMPTY_NUMBER,
        beta: EMPTY_NUMBER,
        high52w: EMPTY_NUMBER,
        low52w: EMPTY_NUMBER,
        sparkline: [],
        day1: EMPTY_NUMBER,
        week1: EMPTY_NUMBER,
        month1: EMPTY_NUMBER,
        ytd: EMPTY_NUMBER,
      };
    });
    const preservedSeedRows = stocks
      .filter((stock) => !metadataSymbols.has(stock.symbol.toUpperCase()))
      .map((stock, index) => ({
        ...stock,
        requestSymbol: stock.symbol.replace(/\./g, "-"),
        marketCapRank: SP500_METADATA.length + index + 1,
      }));
    return [...sp500Rows, ...preservedSeedRows];
  }, [stocks]);

  const sectors = useMemo(() => ["all", ...new Set(universe.map((stock) => stock.sector))], [universe]);
  const normalizedQuery = useMemo(() => normalizeText(debouncedSearch), [debouncedSearch]);

  const visibleCandidates = useMemo(() => {
    const filtered = universe.filter((stock) => {
      if (normalizedQuery && !Number.isFinite(searchRank(stock, normalizedQuery))) return false;
      if (sectorFilter !== "all" && stock.sector !== sectorFilter) return false;
      if (exchangeFilter !== "all") {
        const exchangeMatches = exchangeFilter === "AMEX"
          ? stock.exchange === "AMEX" || stock.exchange === "NYSE American"
          : stock.exchange === exchangeFilter;
        if (!exchangeMatches) return false;
      }
      return matchesMarketCapRank(stock.marketCapRank, marketCapFilter);
    });

    return filtered.sort((a, b) => {
      if (normalizedQuery) {
        const relevance = searchRank(a, normalizedQuery) - searchRank(b, normalizedQuery);
        if (relevance !== 0) return relevance;
      }
      if (sortKey === "symbol") {
        return sortDir === "asc" ? a.symbol.localeCompare(b.symbol) : b.symbol.localeCompare(a.symbol);
      }
      if (sortKey === "marketCap") {
        return sortDir === "desc" ? a.marketCapRank - b.marketCapRank : b.marketCapRank - a.marketCapRank;
      }
      return a.marketCapRank - b.marketCapRank;
    }).slice(0, MAX_VISIBLE_STOCKS);
  }, [universe, normalizedQuery, sectorFilter, exchangeFilter, marketCapFilter, sortKey, sortDir]);

  const visibleSymbols = useMemo(
    () => visibleCandidates.map(({ symbol, requestSymbol }) => ({ symbol, requestSymbol })),
    [visibleCandidates],
  );
  useVisibleLiveQuotes(visibleSymbols);

  const sorted = useMemo(() => {
    const getPrice = (stock: MarketRow) => state.marketCache[stock.symbol.toUpperCase()]?.price ?? stock.price;
    const getDailyChange = (stock: MarketRow) => state.marketCache[stock.symbol.toUpperCase()]?.changePercent ?? stock.day1;

    const filtered = visibleCandidates.filter((stock) => {
      const price = getPrice(stock);
      const dailyChange = getDailyChange(stock);
      if (priceFilter === "lt50" && !(hasFiniteValue(price) && price < 50)) return false;
      if (priceFilter === "50to200" && !(hasFiniteValue(price) && price >= 50 && price <= 200)) return false;
      if (priceFilter === "gt200" && !(hasFiniteValue(price) && price > 200)) return false;
      if (changeFilter === "gt5" && !(hasFiniteValue(dailyChange) && dailyChange > 5)) return false;
      if (changeFilter === "gainers" && !(hasFiniteValue(dailyChange) && dailyChange > 0)) return false;
      if (changeFilter === "losers" && !(hasFiniteValue(dailyChange) && dailyChange < 0)) return false;
      if (changeFilter === "ltminus5" && !(hasFiniteValue(dailyChange) && dailyChange < -5)) return false;
      return true;
    });

    return [...filtered].sort((a, b) => {
      if (normalizedQuery) {
        const relevance = searchRank(a, normalizedQuery) - searchRank(b, normalizedQuery);
        if (relevance !== 0) return relevance;
      }
      if (sortKey === "symbol") {
        return sortDir === "asc" ? a.symbol.localeCompare(b.symbol) : b.symbol.localeCompare(a.symbol);
      }
      if (sortKey === "marketCap") {
        return sortDir === "desc" ? a.marketCapRank - b.marketCapRank : b.marketCapRank - a.marketCapRank;
      }
      const value = (stock: MarketRow) => {
        if (sortKey === "price") return getPrice(stock);
        if (sortKey === "day1") return getDailyChange(stock);
        return stock[sortKey];
      };
      return compareNumbers(value(a), value(b), sortDir);
    });
  }, [visibleCandidates, state.marketCache, priceFilter, changeFilter, normalizedQuery, sortKey, sortDir]);

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
                  <td className="font-mono font-medium">{formatOptionalCurrency(displayPrice)}</td>
                  <td>{hasFiniteValue(displayChange) ? <PriceChangeBadge value={displayChange} /> : "—"}</td>
                  <td>{hasFiniteValue(s.week1) ? <PriceChangeBadge value={s.week1} /> : "—"}</td>
                  <td>{hasFiniteValue(s.month1) ? <PriceChangeBadge value={s.month1} /> : "—"}</td>
                  <td>{hasFiniteValue(s.ytd) ? <PriceChangeBadge value={s.ytd} /> : "—"}</td>
                  <td className="font-mono">{formatOptionalLargeNumber(s.marketCap)}</td>
                  <td className="font-mono">{formatOptionalLargeNumber(s.volume)}</td>
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
        {sorted.map((s) => {
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
                  <span className="font-mono font-medium">{formatOptionalCurrency(displayPrice)}</span>
                  {hasFiniteValue(displayChange) ? <PriceChangeBadge value={displayChange} /> : <span>—</span>}
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                  <span>Vốn hóa: {formatOptionalLargeNumber(s.marketCap)}</span>
                  <span>KL: {formatOptionalLargeNumber(s.volume)}</span>
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
