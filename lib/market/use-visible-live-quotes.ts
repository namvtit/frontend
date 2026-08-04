"use client";

import { useEffect, useMemo, useRef } from "react";
import { useDemo, type MarketSnapshot } from "@/lib/demo";

export interface VisibleQuoteSymbol {
  symbol: string;
  requestSymbol: string;
}

interface YahooQuoteResult {
  symbol?: string;
  regularMarketPrice?: number;
  regularMarketChange?: number;
  regularMarketChangePercent?: number;
}

interface LiveQuoteResponse {
  quoteResponse?: {
    result?: YahooQuoteResult[];
  };
}

const LIVE_QUOTE_MAX_AGE_MS = 4_500;
const LIVE_QUOTE_REFRESH_MS = 5_000;
const INITIAL_VISIBLE_QUOTE_GRACE_MS = 900;
const DEMO_PROVIDER_REQUEST_SYMBOLS = new Set([
  "AAPL", "MSFT", "NVDA", "TSLA", "AMZN", "GOOGL", "META",
  "BRK-B", "JPM", "V", "UNH", "XOM", "SPY", "QQQ", "DIS",
  "^GSPC", "^IXIC", "^DJI", "^VIX",
]);

export function useVisibleLiveQuotes(symbols: readonly VisibleQuoteSymbol[]) {
  const { state, dispatch } = useDemo();
  const cacheRef = useRef(state.marketCache);
  const generationRef = useRef(0);
  const initialRefreshScheduledRef = useRef(false);
  const deferInitialProviderSymbolsRef = useRef(true);
  const symbolsKey = useMemo(
    () => symbols.map(({ symbol, requestSymbol }) => `${symbol}:${requestSymbol}`).join("|"),
    [symbols],
  );

  useEffect(() => {
    cacheRef.current = state.marketCache;
  }, [state.marketCache]);

  useEffect(() => {
    const generation = ++generationRef.current;
    const activeSymbols = [...symbols];
    let controller: AbortController | null = null;
    let intervalId: number | null = null;
    let timeoutId: number | null = null;

    const refreshVisibleSymbols = async () => {
      const now = Date.now();
      const deferProviderSymbols = deferInitialProviderSymbolsRef.current;
      deferInitialProviderSymbolsRef.current = false;
      const missingOrStale = activeSymbols.filter(({ symbol, requestSymbol }) => {
        const cached = cacheRef.current[symbol.toUpperCase()];
        if (deferProviderSymbols && DEMO_PROVIDER_REQUEST_SYMBOLS.has(requestSymbol.toUpperCase())) {
          return false;
        }
        if (!cached) return true;
        const updatedAt = Date.parse(cached.updatedAt);
        return !Number.isFinite(updatedAt) || now - updatedAt >= LIVE_QUOTE_MAX_AGE_MS;
      });

      if (missingOrStale.length === 0) return;

      const displayByRequest = new Map<string, string>();
      for (const item of missingOrStale) {
        displayByRequest.set(item.requestSymbol.toUpperCase(), item.symbol.toUpperCase());
      }
      const requestSymbols = [...displayByRequest.keys()];

      controller?.abort();
      controller = new AbortController();

      try {
        const response = await fetch(
          `/api/market/live-quotes?symbols=${encodeURIComponent(requestSymbols.join(","))}`,
          { signal: controller.signal },
        );
        if (!response.ok) throw new Error(`Local API status ${response.status}`);

        const data = (await response.json()) as LiveQuoteResponse;
        const result = data.quoteResponse?.result;
        if (!Array.isArray(result)) throw new Error("No quote results");
        if (generation !== generationRef.current) return;

        const updatedAt = new Date().toISOString();
        const snapshots: MarketSnapshot[] = result.flatMap((quote) => {
          const requestSymbol = quote.symbol?.toUpperCase();
          const displaySymbol = requestSymbol ? displayByRequest.get(requestSymbol) : undefined;
          if (
            !displaySymbol ||
            !Number.isFinite(quote.regularMarketPrice) ||
            !Number.isFinite(quote.regularMarketChange) ||
            !Number.isFinite(quote.regularMarketChangePercent)
          ) {
            return [];
          }

          return [{
            symbol: displaySymbol,
            price: quote.regularMarketPrice as number,
            change: quote.regularMarketChange as number,
            changePercent: quote.regularMarketChangePercent as number,
            updatedAt,
          }];
        });

        if (snapshots.length > 0) {
          dispatch({ type: "UPDATE_MARKET_CACHE", snapshots });
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        console.warn("Failed to fetch visible live prices from local API:", error);
      }
    };

    const startRefreshing = () => {
      if (generation !== generationRef.current) return;
      if (document.visibilityState === "visible") {
        void refreshVisibleSymbols();
      }
      intervalId = window.setInterval(() => {
        if (document.visibilityState === "visible") {
          void refreshVisibleSymbols();
        }
      }, LIVE_QUOTE_REFRESH_MS);
    };

    if (initialRefreshScheduledRef.current) {
      startRefreshing();
    } else {
      // Give DemoProvider's existing initial request time to populate fresh
      // cache entries, then make later visible-set changes refresh immediately.
      initialRefreshScheduledRef.current = true;
      timeoutId = window.setTimeout(startRefreshing, INITIAL_VISIBLE_QUOTE_GRACE_MS);
    }

    return () => {
      generationRef.current += 1;
      controller?.abort();
      if (timeoutId !== null) window.clearTimeout(timeoutId);
      if (intervalId !== null) window.clearInterval(intervalId);
    };
  }, [dispatch, symbolsKey]);
}
