// Frontend data access layer
// Currently returns mock data directly.
// When backend is ready, swap to fetch() calls to the API routes.

import { STOCKS, NEWS, INDICES, getStockBySymbol, getGainers, getLosers, getMostActive, getNewsForSymbol, getNewsById } from '@/lib/market/mock-data';
import type { MarketIndex } from '@/types/market';

// ── Market Overview ──
export async function fetchMarketOverview() {
  // Future: return fetch('/api/market/overview').then(r => r.json())
  return {
    indices: INDICES,
    fearIndex: { value: 32, level: 'fear' as const, description: 'Market showing caution', change: -8.5 },
    topGainers: getGainers().slice(0, 3),
    topLosers: getLosers().slice(0, 3),
    mostActive: getMostActive().slice(0, 3),
  };
}

// ── Stock Quote ──
export async function fetchStockQuote(symbol: string) {
  // Future: return fetch(`/api/stocks/${symbol}/quote`).then(r => r.json())
  return getStockBySymbol(symbol) || null;
}

// ── All Stocks (for markets table) ──
export async function fetchAllStocks() {
  // Future: return fetch('/api/markets').then(r => r.json())
  return STOCKS;
}

// ── News ──
export async function fetchNews() {
  // Future: return fetch('/api/news').then(r => r.json())
  return NEWS;
}

export async function fetchNewsById(id: string) {
  // Future: return fetch(`/api/news/${id}`).then(r => r.json())
  return getNewsById(id) || null;
}

export async function fetchNewsForSymbol(symbol: string) {
  // Future: return fetch(`/api/stocks/${symbol}/news`).then(r => r.json())
  return getNewsForSymbol(symbol);
}

// ── Watchlist ──
export async function fetchWatchlist() {
  // Future: return fetch('/api/user/watchlist').then(r => r.json())
  return ['AAPL', 'NVDA', 'MSFT', 'TSLA', 'SPY'];
}

export async function addToWatchlist(symbol: string) {
  // Future: return fetch('/api/user/watchlist', { method: 'POST', body: JSON.stringify({ symbol }) })
  console.log('Added to watchlist:', symbol);
  return { success: true };
}

export async function removeFromWatchlist(symbol: string) {
  // Future: return fetch(`/api/user/watchlist/${symbol}`, { method: 'DELETE' })
  console.log('Removed from watchlist:', symbol);
  return { success: true };
}

// ── Chat / AI ──
export async function sendChatMessage(message: string) {
  // Future: return fetch('/api/chat', { method: 'POST', body: JSON.stringify({ message }) }).then(r => r.json())
  return {
    message: 'This is a mock AI response. Connect to a real AI backend for actual analysis.',
    cards: [],
  };
}
