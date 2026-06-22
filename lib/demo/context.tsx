'use client';

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import type {
  DemoState,
  Holding,
  TradeTransaction,
  DemoNotification,
  ChatMessage,
  AIProfile,
  MarketSnapshot,
} from './types';
import { FEE_RATE } from './types';
import { loadState, saveState, clearState } from './storage';
import { createSeedState } from './seed';
import { getStockBySymbol } from '@/lib/market/mock-data';

// ── Actions ──

type Action =
  | { type: 'HYDRATE'; state: DemoState }
  | { type: 'RESET' }
  | { type: 'BUY'; symbol: string; name: string; quantity: number; price: number }
  | { type: 'SELL'; symbol: string; name: string; quantity: number; price: number }
  | { type: 'ADD_WATCHLIST'; symbol: string }
  | { type: 'REMOVE_WATCHLIST'; symbol: string }
  | { type: 'PUSH_NOTIFICATION'; notification: Omit<DemoNotification, 'id' | 'read' | 'time'> }
  | { type: 'MARK_NOTIF_READ'; id: string }
  | { type: 'MARK_ALL_NOTIF_READ' }
  | { type: 'PUSH_CHAT'; message: ChatMessage }
  | { type: 'CLEAR_CHAT' }
  | { type: 'SET_AI_PROFILE'; profile: Partial<AIProfile> }
  | { type: 'UPDATE_MARKET_CACHE'; snapshots: MarketSnapshot[] }
  | {
      type: 'UPDATE_SETTINGS';
      cashBalance?: number;
      aiProfile?: Partial<AIProfile>;
      feeRate?: number;
      maxDrawdownThreshold?: number;
      maxPositionSizeLimit?: number;
      autoRebalance?: boolean;
      dataFeedSpeed?: 'realtime-premium' | 'realtime-standard' | 'delayed';
      preferredAiModel?: 'gemini-flash' | 'gemini-pro' | 'gpt-4o' | 'claude-sonnet';
    };

// ── Reducer ──

function reducer(state: DemoState, action: Action): DemoState {
  switch (action.type) {
    case 'HYDRATE':
      return action.state;

    case 'RESET':
      return createSeedState();

    case 'BUY': {
      const { symbol, name, quantity, price } = action;
      const gross = price * quantity;
      const currentFeeRate = state.feeRate !== undefined ? state.feeRate : FEE_RATE;
      const fee = gross * currentFeeRate;
      const total = gross + fee;
      if (total > state.cashBalance) return state; // insufficient cash

      const existing = state.holdings[symbol];
      const newQty = (existing?.quantity ?? 0) + quantity;
      const newAvg = existing
        ? (existing.avgPrice * existing.quantity + gross) / newQty
        : price;

      const tx: TradeTransaction = {
        id: `tx_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        type: 'buy',
        symbol,
        name,
        quantity,
        price,
        gross,
        fee,
        total,
        timestamp: new Date().toISOString(),
        avgPrice: newAvg,
      };

      const notif: DemoNotification = {
        id: `n_${Date.now()}`,
        title: `Mua ${symbol} thành công`,
        message: `Đã mua ${quantity} cổ phiếu ${symbol} @ $${price.toFixed(2)}. Giá vốn TB mới: $${newAvg.toFixed(2)}. Phí: $${fee.toFixed(2)}`,
        type: 'success',
        icon: '✅',
        time: 'Vừa xong',
        read: false,
      };

      return {
        ...state,
        cashBalance: state.cashBalance - total,
        holdings: {
          ...state.holdings,
          [symbol]: { symbol, name, quantity: newQty, avgPrice: newAvg },
        },
        transactions: [tx, ...state.transactions],
        notifications: [notif, ...state.notifications],
      };
    }

    case 'SELL': {
      const { symbol, name, quantity, price } = action;
      const existing = state.holdings[symbol];
      if (!existing || existing.quantity < quantity) return state; // insufficient holdings

      const gross = price * quantity;
      const currentFeeRate = state.feeRate !== undefined ? state.feeRate : FEE_RATE;
      const fee = gross * currentFeeRate;
      const net = gross - fee;
      const newQty = existing.quantity - quantity;
      const pnl = (price - existing.avgPrice) * quantity;

      const tx: TradeTransaction = {
        id: `tx_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        type: 'sell',
        symbol,
        name,
        quantity,
        price,
        gross,
        fee,
        total: net,
        timestamp: new Date().toISOString(),
        avgPrice: existing.avgPrice,
        pnl,
      };

      const notif: DemoNotification = {
        id: `n_${Date.now()}`,
        title: `Bán ${symbol} thành công`,
        message: `Đã bán ${quantity} cổ phiếu ${symbol} @ $${price.toFixed(2)}. Lợi nhuận chốt: ${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)} (Giá vốn TB: $${existing.avgPrice.toFixed(2)}). Thu ròng: $${net.toFixed(2)}`,
        type: 'success',
        icon: '💰',
        time: 'Vừa xong',
        read: false,
      };

      const newHoldings = { ...state.holdings };
      if (newQty <= 0) {
        delete newHoldings[symbol];
      } else {
        newHoldings[symbol] = { ...existing, quantity: newQty };
      }

      return {
        ...state,
        cashBalance: state.cashBalance + net,
        holdings: newHoldings,
        transactions: [tx, ...state.transactions],
        notifications: [notif, ...state.notifications],
      };
    }

    case 'ADD_WATCHLIST': {
      if (state.watchlist.includes(action.symbol)) return state;
      const notif: DemoNotification = {
        id: `n_${Date.now()}`,
        title: `${action.symbol} đã thêm vào Watchlist`,
        message: `Đã thêm ${action.symbol} vào danh sách theo dõi của bạn.`,
        type: 'info',
        icon: '⭐',
        time: 'Vừa xong',
        read: false,
      };
      return {
        ...state,
        watchlist: [...state.watchlist, action.symbol],
        notifications: [notif, ...state.notifications],
      };
    }

    case 'REMOVE_WATCHLIST': {
      const notif: DemoNotification = {
        id: `n_${Date.now()}`,
        title: `${action.symbol} đã xóa khỏi Watchlist`,
        message: `Đã xóa ${action.symbol} khỏi danh sách theo dõi.`,
        type: 'info',
        icon: '🗑️',
        time: 'Vừa xong',
        read: false,
      };
      return {
        ...state,
        watchlist: state.watchlist.filter((s) => s !== action.symbol),
        notifications: [notif, ...state.notifications],
      };
    }

    case 'PUSH_NOTIFICATION': {
      const n: DemoNotification = {
        ...action.notification,
        id: `n_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        read: false,
        time: 'Vừa xong',
      };
      return { ...state, notifications: [n, ...state.notifications] };
    }

    case 'MARK_NOTIF_READ':
      return {
        ...state,
        notifications: state.notifications.map((n) =>
          n.id === action.id ? { ...n, read: true } : n
        ),
      };

    case 'MARK_ALL_NOTIF_READ':
      return {
        ...state,
        notifications: state.notifications.map((n) => ({ ...n, read: true })),
      };

    case 'PUSH_CHAT':
      return { ...state, chatHistory: [...state.chatHistory, action.message] };

    case 'CLEAR_CHAT':
      return { ...state, chatHistory: [], aiProfile: {} };

    case 'SET_AI_PROFILE':
      return { ...state, aiProfile: { ...state.aiProfile, ...action.profile } };

    case 'UPDATE_MARKET_CACHE': {
      const cache = { ...state.marketCache };
      for (const s of action.snapshots) {
        cache[s.symbol] = s;
      }
      return { ...state, marketCache: cache };
    }

    case 'UPDATE_SETTINGS': {
      const newState = { ...state };
      if (action.cashBalance !== undefined) {
        newState.cashBalance = action.cashBalance;
      }
      if (action.aiProfile !== undefined) {
        newState.aiProfile = { ...state.aiProfile, ...action.aiProfile };
      }
      if (action.feeRate !== undefined) newState.feeRate = action.feeRate;
      if (action.maxDrawdownThreshold !== undefined) newState.maxDrawdownThreshold = action.maxDrawdownThreshold;
      if (action.maxPositionSizeLimit !== undefined) newState.maxPositionSizeLimit = action.maxPositionSizeLimit;
      if (action.autoRebalance !== undefined) newState.autoRebalance = action.autoRebalance;
      if (action.dataFeedSpeed !== undefined) newState.dataFeedSpeed = action.dataFeedSpeed;
      if (action.preferredAiModel !== undefined) newState.preferredAiModel = action.preferredAiModel;
      return newState;
    }

    default:
      return state;
  }
}

// ── Portfolio calculations ──

export interface PortfolioSummary {
  totalMarketValue: number;
  totalCost: number;
  cashBalance: number;
  totalAccountValue: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
  holdingDetails: {
    symbol: string;
    name: string;
    quantity: number;
    avgPrice: number;
    currentPrice: number;
    marketValue: number;
    unrealizedPnL: number;
    unrealizedPnLPercent: number;
    allocationPercent: number;
  }[];
}

function computePortfolio(state: DemoState): PortfolioSummary {
  const entries = Object.values(state.holdings);
  let totalMarketValue = 0;
  let totalCost = 0;

  const details = entries.map((h) => {
    // Use market cache first, then fallback to mock-data
    const cached = state.marketCache[h.symbol];
    const mockStock = getStockBySymbol(h.symbol);
    const currentPrice = cached?.price ?? mockStock?.price ?? h.avgPrice;
    const marketValue = currentPrice * h.quantity;
    const cost = h.avgPrice * h.quantity;
    const pnl = marketValue - cost;
    const pnlPct = cost > 0 ? (pnl / cost) * 100 : 0;
    totalMarketValue += marketValue;
    totalCost += cost;
    return {
      symbol: h.symbol,
      name: h.name,
      quantity: h.quantity,
      avgPrice: h.avgPrice,
      currentPrice,
      marketValue,
      unrealizedPnL: pnl,
      unrealizedPnLPercent: pnlPct,
      allocationPercent: 0, // will be filled below
    };
  });

  const totalAccountValue = state.cashBalance + totalMarketValue;
  const unrealizedPnL = totalMarketValue - totalCost;
  const unrealizedPnLPercent = totalCost > 0 ? (unrealizedPnL / totalCost) * 100 : 0;

  // Fill allocation
  for (const d of details) {
    d.allocationPercent = totalAccountValue > 0 ? (d.marketValue / totalAccountValue) * 100 : 0;
  }

  return {
    totalMarketValue,
    totalCost,
    cashBalance: state.cashBalance,
    totalAccountValue,
    unrealizedPnL,
    unrealizedPnLPercent,
    holdingDetails: details,
  };
}

// ── Context ──

interface DemoContextType {
  state: DemoState;
  portfolio: PortfolioSummary;
  dispatch: React.ActionDispatch<[action: Action]>;
  // Convenience methods
  executeBuy: (symbol: string, name: string, quantity: number, price: number) => boolean;
  executeSell: (symbol: string, name: string, quantity: number, price: number) => boolean;
  addToWatchlist: (symbol: string) => void;
  removeFromWatchlist: (symbol: string) => void;
  toggleWatchlist: (symbol: string) => void;
  isInWatchlist: (symbol: string) => boolean;
  pushChat: (msg: ChatMessage) => void;
  clearChat: () => void;
  setAIProfile: (profile: Partial<AIProfile>) => void;
  resetDemo: () => void;
  getPrice: (symbol: string) => number;
}

const DemoContext = createContext<DemoContextType | null>(null);

export function DemoProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, createSeedState());
  const fetchLivePrices = useCallback(async () => {
    try {
      const symbols = [
        'AAPL', 'MSFT', 'NVDA', 'TSLA', 'AMZN', 'GOOGL', 'META',
        'BRK-B', 'JPM', 'V', 'UNH', 'XOM', 'SPY', 'QQQ', 'DIS',
        '^GSPC', '^IXIC', '^DJI', '^VIX',
      ];
      const res = await fetch(`/api/market/live-quotes?symbols=${symbols.join(',')}`);
      if (!res.ok) throw new Error('Local API status ' + res.status);
      const data = await res.json();
      const result = data?.quoteResponse?.result;
      if (!Array.isArray(result)) throw new Error('No quote results');

      // Map Yahoo symbols to our internal symbols
      const symbolMap: Record<string, string> = {
        'BRK-B': 'BRK.B',
        '^GSPC': 'SPX',
        '^IXIC': 'IXIC',
        '^DJI': 'DJI',
        '^VIX': 'VIX',
      };
      
      const snapshots = result.map((q: any) => {
        const rawSymbol = q.symbol.toUpperCase();
        const mappedSymbol = symbolMap[rawSymbol] ?? rawSymbol;
        return {
          symbol: mappedSymbol,
          price: q.regularMarketPrice,
          change: q.regularMarketChange,
          changePercent: q.regularMarketChangePercent,
          updatedAt: new Date().toISOString(),
        };
      });
      
      dispatch({ type: 'UPDATE_MARKET_CACHE', snapshots });
    } catch (err) {
      console.warn('Failed to fetch live prices from local API:', err);
    }
  }, []);
  // Hydrate from sessionStorage on mount
  useEffect(() => {
    const saved = loadState();
    dispatch({ type: 'HYDRATE', state: saved });
    fetchLivePrices();
  }, [fetchLivePrices]);

  // Poll live prices
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchLivePrices();
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchLivePrices]);

  // Persist after every state change
  useEffect(() => {
    saveState(state);
  }, [state]);

  const portfolio = useMemo(() => computePortfolio(state), [state]);

  const getPrice = useCallback(
    (symbol: string): number => {
      const cached = state.marketCache[symbol];
      if (cached) return cached.price;
      const stock = getStockBySymbol(symbol);
      return stock?.price ?? 0;
    },
    [state.marketCache]
  );

  const executeBuy = useCallback(
    (symbol: string, name: string, quantity: number, price: number): boolean => {
      const gross = price * quantity;
      const fee = gross * FEE_RATE;
      const total = gross + fee;
      if (total > state.cashBalance) return false;
      dispatch({ type: 'BUY', symbol, name, quantity, price });
      return true;
    },
    [state.cashBalance]
  );

  const executeSell = useCallback(
    (symbol: string, name: string, quantity: number, price: number): boolean => {
      const holding = state.holdings[symbol];
      if (!holding || holding.quantity < quantity) return false;
      dispatch({ type: 'SELL', symbol, name, quantity, price });
      return true;
    },
    [state.holdings]
  );

  const addToWatchlist = useCallback(
    (symbol: string) => dispatch({ type: 'ADD_WATCHLIST', symbol }),
    []
  );

  const removeFromWatchlist = useCallback(
    (symbol: string) => dispatch({ type: 'REMOVE_WATCHLIST', symbol }),
    []
  );

  const toggleWatchlist = useCallback(
    (symbol: string) => {
      if (state.watchlist.includes(symbol)) {
        dispatch({ type: 'REMOVE_WATCHLIST', symbol });
      } else {
        dispatch({ type: 'ADD_WATCHLIST', symbol });
      }
    },
    [state.watchlist]
  );

  const isInWatchlist = useCallback(
    (symbol: string) => state.watchlist.includes(symbol),
    [state.watchlist]
  );

  const pushChat = useCallback(
    (msg: ChatMessage) => dispatch({ type: 'PUSH_CHAT', message: msg }),
    []
  );

  const clearChat = useCallback(() => dispatch({ type: 'CLEAR_CHAT' }), []);

  const setAIProfile = useCallback(
    (profile: Partial<AIProfile>) => dispatch({ type: 'SET_AI_PROFILE', profile }),
    []
  );

  const resetDemo = useCallback(() => {
    clearState();
    dispatch({ type: 'RESET' });
  }, []);

  const ctx = useMemo<DemoContextType>(
    () => ({
      state,
      portfolio,
      dispatch,
      executeBuy,
      executeSell,
      addToWatchlist,
      removeFromWatchlist,
      toggleWatchlist,
      isInWatchlist,
      pushChat,
      clearChat,
      setAIProfile,
      resetDemo,
      getPrice,
    }),
    [state, portfolio, dispatch, executeBuy, executeSell, addToWatchlist, removeFromWatchlist, toggleWatchlist, isInWatchlist, pushChat, clearChat, setAIProfile, resetDemo, getPrice]
  );

  return <DemoContext.Provider value={ctx}>{children}</DemoContext.Provider>;
}

export function useDemo() {
  const ctx = useContext(DemoContext);
  if (!ctx) throw new Error('useDemo must be used within DemoProvider');
  return ctx;
}
