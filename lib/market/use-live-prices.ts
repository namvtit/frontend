'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useDemo } from '@/lib/demo';
import type { StockQuote } from './mock-data';

/**
 * Hook to get a live-updating price for a single symbol.
 * Returns { price, change, changePercent, isLive, flash }
 * where `flash` is 'up' | 'down' | null for a brief period after a price change.
 */
export function useLivePrice(symbol: string, fallback?: StockQuote) {
  const { state } = useDemo();
  const cached = state.marketCache[symbol?.toUpperCase()];
  const prevPriceRef = useRef<number | null>(null);
  const [flash, setFlash] = useState<'up' | 'down' | null>(null);

  const price = cached?.price ?? fallback?.price ?? 0;
  const change = cached?.change ?? fallback?.change ?? 0;
  const changePercent = cached?.changePercent ?? fallback?.changePercent ?? 0;
  const isLive = !!cached;

  // Flash animation when price changes
  useEffect(() => {
    if (prevPriceRef.current !== null && prevPriceRef.current !== price) {
      const direction = price > prevPriceRef.current ? 'up' : 'down';
      setFlash(direction);
      const timer = setTimeout(() => setFlash(null), 1200);
      return () => clearTimeout(timer);
    }
    prevPriceRef.current = price;
  }, [price]);

  return { price, change, changePercent, isLive, flash };
}

/**
 * Hook to get live prices for all stocks in the market cache.
 * Returns the market cache + a helper to get a specific symbol's live data.
 */
export function useLivePrices() {
  const { state } = useDemo();
  const cache = state.marketCache;
  const prevCacheRef = useRef<Record<string, number>>({});
  const [flashes, setFlashes] = useState<Record<string, 'up' | 'down' | null>>({});

  useEffect(() => {
    const newFlashes: Record<string, 'up' | 'down' | null> = {};
    let hasChange = false;

    for (const [symbol, snapshot] of Object.entries(cache)) {
      const prev = prevCacheRef.current[symbol];
      if (prev !== undefined && prev !== snapshot.price) {
        newFlashes[symbol] = snapshot.price > prev ? 'up' : 'down';
        hasChange = true;
      }
      prevCacheRef.current[symbol] = snapshot.price;
    }

    if (hasChange) {
      setFlashes((prev) => ({ ...prev, ...newFlashes }));
      const timer = setTimeout(() => {
        setFlashes({});
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [cache]);

  const getFlash = useCallback(
    (symbol: string) => flashes[symbol?.toUpperCase()] ?? null,
    [flashes]
  );

  return { cache, flashes, getFlash };
}

/**
 * CSS class helper for flash animation.
 */
export function getFlashClass(flash: 'up' | 'down' | null): string {
  if (flash === 'up') return 'price-flash-up';
  if (flash === 'down') return 'price-flash-down';
  return '';
}
