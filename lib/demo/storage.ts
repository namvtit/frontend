// ── sessionStorage helper ──
import type { DemoState } from './types';
import { createSeedState } from './seed';

const STORAGE_KEY = 'trading_demo_state';

export function loadState(): DemoState {
  if (typeof window === 'undefined') return { ...createSeedState(), cashBalance: 0, notifications: [], feeRate: 0 };
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...createSeedState(), cashBalance: 0, notifications: [], feeRate: 0 };
    const parsed = JSON.parse(raw) as DemoState;
    if (!Array.isArray(parsed.watchlist)) return { ...createSeedState(), cashBalance: 0, notifications: [], feeRate: 0 };
    return { ...parsed, cashBalance: 0, holdings: {}, transactions: [], feeRate: 0 };
  } catch {
    return { ...createSeedState(), cashBalance: 0, notifications: [], feeRate: 0 };
  }
}

export function saveState(state: DemoState): void {
  if (typeof window === 'undefined') return;
  try {
    const { cashBalance, holdings, transactions, ...preferences } = state;
    void cashBalance; void holdings; void transactions;
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  } catch {
    // sessionStorage full or unavailable — ignore
  }
}

export function clearState(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(STORAGE_KEY);
}
