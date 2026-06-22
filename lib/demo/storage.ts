// ── sessionStorage helper ──
import type { DemoState } from './types';
import { createSeedState } from './seed';

const STORAGE_KEY = 'trading_demo_state';

export function loadState(): DemoState {
  if (typeof window === 'undefined') return createSeedState();
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return createSeedState();
    const parsed = JSON.parse(raw) as DemoState;
    // Basic sanity check
    if (
      typeof parsed.cashBalance !== 'number' ||
      !parsed.holdings ||
      !Array.isArray(parsed.transactions) ||
      !Array.isArray(parsed.watchlist)
    ) {
      return createSeedState();
    }
    return parsed;
  } catch {
    return createSeedState();
  }
}

export function saveState(state: DemoState): void {
  if (typeof window === 'undefined') return;
  try {
    state.lastUpdatedAt = new Date().toISOString();
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // sessionStorage full or unavailable — ignore
  }
}

export function clearState(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(STORAGE_KEY);
}
