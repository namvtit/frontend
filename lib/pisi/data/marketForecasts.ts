// ── Market Forecast Data ──
// Deterministic 600-day forecast price arrays for all 15 demo stocks.
// Uses mulberry32 seeded PRNG for reproducible paths.
// Section 3 input — forecast_price arrays.

import type { MarketForecastEntry } from '@/lib/pisi/types/pisi';

// ═══════════════════════════════════════════════════════════════
// Seeded PRNG — same as lib/market/mock-data.ts
// ═══════════════════════════════════════════════════════════════

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ═══════════════════════════════════════════════════════════════
// Seed derivation — unique per ticker
// ═══════════════════════════════════════════════════════════════

function tickerSeed(ticker: string, offset: number): number {
  let h = 0;
  for (let i = 0; i < ticker.length; i++) {
    h = (h * 31 + ticker.charCodeAt(i)) | 0;
  }
  return Math.abs(h) + offset;
}

// ═══════════════════════════════════════════════════════════════
// Path generation — geometric Brownian motion style
// ═══════════════════════════════════════════════════════════════

const FORECAST_DAYS = 600;

interface PathParams {
  drift: number;
  vol: number;
}

const PATH_BULLISH: PathParams = { drift: 0.0003, vol: 0.02 };
const PATH_MODERATE: PathParams = { drift: 0.00015, vol: 0.015 };
const PATH_SIDEWAY: PathParams = { drift: 0.00002, vol: 0.025 };
const PATH_DECLINING: PathParams = { drift: -0.0002, vol: 0.018 };
const PATH_HIGHVOL: PathParams = { drift: 0.0001, vol: 0.035 };

function generatePath(p0: number, params: PathParams, seed: number): number[] {
  const rand = mulberry32(seed);
  const prices: number[] = [p0];
  let price = p0;
  for (let t = 1; t <= FORECAST_DAYS; t++) {
    price = price * (1 + params.drift + params.vol * (rand() - 0.5));
    // Ensure price never goes below 0.01
    if (price < 0.01) price = 0.01;
    prices.push(parseFloat(price.toFixed(4)));
  }
  return prices;
}

// ═══════════════════════════════════════════════════════════════
// Asset definitions
// ═══════════════════════════════════════════════════════════════

interface AssetDef {
  ticker: string;
  name: string;
  currentPrice: number;
  sectorId: number;
  pathParams: PathParams;
  seedOffset: number;
}

const ASSET_DEFS: AssetDef[] = [
  // Bullish: drift +0.0003, vol 0.02
  { ticker: 'NVDA',  name: 'NVIDIA Corp.',          currentPrice: 210.69, sectorId: 1, pathParams: PATH_BULLISH,   seedOffset: 100  },
  { ticker: 'GOOGL', name: 'Alphabet Inc.',          currentPrice: 368.03, sectorId: 1, pathParams: PATH_BULLISH,   seedOffset: 200  },
  { ticker: 'AMZN',  name: 'Amazon.com Inc.',        currentPrice: 244.39, sectorId: 2, pathParams: PATH_BULLISH,   seedOffset: 300  },
  { ticker: 'META',  name: 'Meta Platforms Inc.',     currentPrice: 577.22, sectorId: 1, pathParams: PATH_BULLISH,   seedOffset: 400  },

  // Moderate growth: drift +0.00015, vol 0.015
  { ticker: 'AAPL',  name: 'Apple Inc.',             currentPrice: 298.01, sectorId: 1, pathParams: PATH_MODERATE,  seedOffset: 500  },
  { ticker: 'MSFT',  name: 'Microsoft Corp.',        currentPrice: 379.40, sectorId: 1, pathParams: PATH_MODERATE,  seedOffset: 600  },
  { ticker: 'SPY',   name: 'SPDR S&P 500 ETF',      currentPrice: 746.74, sectorId: 6, pathParams: PATH_MODERATE,  seedOffset: 700  },
  { ticker: 'QQQ',   name: 'Invesco QQQ Trust',      currentPrice: 740.62, sectorId: 6, pathParams: PATH_MODERATE,  seedOffset: 800  },

  // Sideway / volatile: drift ~0, vol 0.025
  { ticker: 'DIS',   name: 'Walt Disney Co.',        currentPrice: 103.89, sectorId: 7, pathParams: PATH_SIDEWAY,   seedOffset: 900  },
  { ticker: 'XOM',   name: 'Exxon Mobil Corp.',      currentPrice: 137.81, sectorId: 5, pathParams: PATH_SIDEWAY,   seedOffset: 1000 },
  { ticker: 'BRK.B', name: 'Berkshire Hathaway',     currentPrice: 489.46, sectorId: 3, pathParams: PATH_SIDEWAY,   seedOffset: 1100 },

  // Declining: drift -0.0002, vol 0.018
  { ticker: 'UNH',   name: 'UnitedHealth Group',     currentPrice: 400.96, sectorId: 4, pathParams: PATH_DECLINING, seedOffset: 1200 },
  { ticker: 'JPM',   name: 'JPMorgan Chase',         currentPrice: 325.22, sectorId: 3, pathParams: PATH_DECLINING, seedOffset: 1300 },

  // High volatility: drift +0.0001, vol 0.035
  { ticker: 'TSLA',  name: 'Tesla Inc.',             currentPrice: 400.49, sectorId: 2, pathParams: PATH_HIGHVOL,   seedOffset: 1400 },
  { ticker: 'V',     name: 'Visa Inc.',              currentPrice: 327.24, sectorId: 3, pathParams: PATH_HIGHVOL,   seedOffset: 1500 },
];

// ═══════════════════════════════════════════════════════════════
// Build forecast entries (computed once at module load)
// ═══════════════════════════════════════════════════════════════

function buildForecasts(): MarketForecastEntry[] {
  return ASSET_DEFS.map((def) => {
    const seed = tickerSeed(def.ticker, def.seedOffset);
    const forecastAdjClose600 = generatePath(def.currentPrice, def.pathParams, seed);
    return {
      ticker: def.ticker,
      name: def.name,
      currentPrice: def.currentPrice,
      sectorId: def.sectorId,
      forecastAdjClose600,
    };
  });
}

/** All 15 forecast entries — 601 prices each (P0 + 600 days) */
export const MARKET_FORECASTS: MarketForecastEntry[] = buildForecasts();

/** Look up a single forecast by ticker symbol */
export function getForecastByTicker(ticker: string): MarketForecastEntry | undefined {
  return MARKET_FORECASTS.find((f) => f.ticker === ticker);
}
