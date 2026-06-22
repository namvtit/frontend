'use client';

// ── usePisiDemo Hook ──
// Wires the PISI engine into the demo trading context.
// Reads portfolio from useDemo(), merges with market forecasts,
// resolves preset config, runs engine, and persists state.

import { useMemo, useState, useCallback, useEffect } from 'react';
import { useDemo } from '@/lib/demo';
import { MARKET_FORECASTS, getForecastByTicker } from './data/marketForecasts';
import { resolvePreset } from './presets';
import { runPisiEngine } from './pisiEngine';
import { loadPisiState, savePisiState, getDefaultPisiState } from './pisiStorage';
import type {
  PisiPortfolioOutput,
  PisiTickerInput,
  PisiResolvedConfig,
  PresetCode,
} from './types/pisi';

// ═══════════════════════════════════════════════════════════════
// Hook
// ═══════════════════════════════════════════════════════════════

export interface UsePisiDemoReturn {
  /** Currently selected preset code */
  selectedPreset: PresetCode;
  /** Change the active preset */
  setPreset: (code: PresetCode) => void;
  /** Current custom parameter overrides */
  customOverrides: Record<string, number>;
  /** Replace all custom overrides */
  setOverrides: (overrides: Record<string, number>) => void;
  /** Full portfolio-level engine output (null until ready) */
  portfolioOutput: PisiPortfolioOutput | null;
  /** Get a single ticker's output by symbol */
  getTickerOutput: (ticker: string) => PisiPortfolioOutput['ticker_outputs'][number] | undefined;
  /** Whether the engine has produced a result */
  isEngineReady: boolean;
}

export function usePisiDemo(): UsePisiDemoReturn {
  // ── Local PISI state ──
  const [selectedPreset, setSelectedPreset] = useState<PresetCode>(() => {
    const saved = loadPisiState();
    return saved.selectedPresetCode;
  });

  const [customOverrides, setCustomOverrides] = useState<Record<string, number>>(() => {
    const saved = loadPisiState();
    return saved.customOverrides;
  });

  const [profileLocked] = useState<boolean>(() => {
    const saved = loadPisiState();
    return saved.profileLocked;
  });

  // ── Demo portfolio state ──
  const { state, portfolio, getPrice } = useDemo();

  // ── Persist to localStorage whenever preset/overrides change ──
  useEffect(() => {
    savePisiState({
      version: 1,
      selectedPresetCode: selectedPreset,
      customOverrides,
      profileLocked,
    });
  }, [selectedPreset, customOverrides, profileLocked]);

  // ── Build ticker inputs from forecasts + demo holdings ──
  const tickerInputs = useMemo<PisiTickerInput[]>(() => {
    return MARKET_FORECASTS.map((forecast) => {
      const holding = state.holdings[forecast.ticker];
      const livePrice = getPrice(forecast.ticker) || forecast.currentPrice;

      return {
        ticker: forecast.ticker,
        sector_id: forecast.sectorId,
        p0: livePrice,
        forecast_price: forecast.forecastAdjClose600,
        holding_qty: holding?.quantity ?? 0,
        avg_cost: holding?.avgPrice ?? 0,
        highest_price_since_entry: holding ? livePrice : 0,
        favorite_score: 0,
        exclude_flag: 0 as const,
        model_quality_score: 1.0,
        days_since_last_sell: 999,
        liquidity_score: 1.0,
      };
    });
  }, [state.holdings, getPrice]);

  // ── Resolve config ──
  const resolvedConfig = useMemo<PisiResolvedConfig>(() => {
    const nav = portfolio.totalAccountValue;
    const peakNav = Math.max(nav, portfolio.totalAccountValue);
    const currentDd = peakNav > 0 ? Math.max(0, 1 - nav / peakNav) : 0;

    const config = resolvePreset(selectedPreset, customOverrides, profileLocked);

    // Inject live portfolio values into the config
    config.run_id = `demo_${Date.now()}`;
    config.as_of_ts = Date.now();
    config.nav = nav;
    config.cash = state.cashBalance;
    config.peak_nav = peakNav;
    config.current_portfolio_dd = currentDd;

    return config;
  }, [selectedPreset, customOverrides, profileLocked, portfolio.totalAccountValue, state.cashBalance]);

  // ── Run PISI engine ──
  const portfolioOutput = useMemo<PisiPortfolioOutput | null>(() => {
    if (tickerInputs.length === 0) return null;

    try {
      return runPisiEngine(resolvedConfig, tickerInputs);
    } catch (err) {
      console.error('[usePisiDemo] Engine error:', err);
      return null;
    }
  }, [resolvedConfig, tickerInputs]);

  // ── Public setters ──
  const setPreset = useCallback((code: PresetCode) => {
    setSelectedPreset(code);
  }, []);

  const setOverrides = useCallback((overrides: Record<string, number>) => {
    setCustomOverrides(overrides);
  }, []);

  // ── Ticker output lookup ──
  const getTickerOutput = useCallback(
    (ticker: string) => {
      if (!portfolioOutput) return undefined;
      return portfolioOutput.ticker_outputs.find((t) => t.ticker === ticker);
    },
    [portfolioOutput],
  );

  return {
    selectedPreset,
    setPreset,
    customOverrides,
    setOverrides,
    portfolioOutput,
    getTickerOutput,
    isEngineReady: portfolioOutput !== null,
  };
}
