// ── Deterministic Historical Data Generator for Market Replay ──
// Generates 12-month price history based on seed, ensuring deterministic outcomes

import type { ReplayPrice, ReplaySeed, RiskProfile } from './types';
import { STOCKS, getStockBySymbol } from '@/lib/market/mock-data';

// Currency conversion (USD to VND)
const USD_TO_VND = 25000;

// Seeded PRNG (mulberry32) for deterministic data
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Convert date string to day offset
function dateToDays(dateStr: string): number {
  const date = new Date(dateStr);
  const start = new Date('2025-01-01');
  return Math.floor((date.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

// Generate a deterministic random walk with trend
function generatePriceSeries(
  startPrice: number,
  days: number,
  dailyVolatility: number,
  trend: number,
  seed: number
): number[] {
  const rand = mulberry32(seed);
  const prices: number[] = [];
  let price = startPrice;

  for (let i = 0; i < days; i++) {
    // Add trend + noise
    const dailyReturn = trend + (rand() - 0.5) * 2 * dailyVolatility;
    price = price * (1 + dailyReturn);
    // Prevent negative prices
    price = Math.max(price, startPrice * 0.1);
    prices.push(price);
  }

  return prices;
}

// Seed-specific scenarios
interface ScenarioConfig {
  trend: number; // Annual trend (as decimal)
  volatility: number; // Daily volatility
  events: Array<{
    dayOffset: number;
    type: 'spike' | 'drop' | 'recover';
    magnitude: number; // Percentage move
    duration: number; // Days to normalize
  }>;
  finalBoost: number; // Final period multiplier
}

const SCENARIOS: Record<ReplaySeed, Record<string, ScenarioConfig>> = {
  golden: {
    AAPL: {
      trend: 0.0004, // ~10% annual
      volatility: 0.015,
      events: [
        { dayOffset: 60, type: 'drop', magnitude: -0.08, duration: 10 },
        { dayOffset: 180, type: 'spike', magnitude: 0.12, duration: 5 },
        { dayOffset: 270, type: 'drop', magnitude: -0.05, duration: 15 },
      ],
      finalBoost: 1.15,
    },
    MSFT: {
      trend: 0.0003,
      volatility: 0.012,
      events: [
        { dayOffset: 90, type: 'spike', magnitude: 0.10, duration: 7 },
        { dayOffset: 200, type: 'drop', magnitude: -0.06, duration: 12 },
      ],
      finalBoost: 1.12,
    },
    NVDA: {
      trend: 0.0008, // Stronger trend for growth
      volatility: 0.025,
      events: [
        { dayOffset: 45, type: 'spike', magnitude: 0.20, duration: 3 },
        { dayOffset: 100, type: 'drop', magnitude: -0.15, duration: 8 },
        { dayOffset: 220, type: 'spike', magnitude: 0.25, duration: 5 },
      ],
      finalBoost: 1.35,
    },
    TSLA: {
      trend: 0.0002,
      volatility: 0.035,
      events: [
        { dayOffset: 30, type: 'drop', magnitude: -0.20, duration: 15 },
        { dayOffset: 80, type: 'spike', magnitude: 0.15, duration: 10 },
        { dayOffset: 150, type: 'drop', magnitude: -0.18, duration: 20 },
        { dayOffset: 250, type: 'spike', magnitude: 0.22, duration: 8 },
      ],
      finalBoost: 1.08,
    },
    JPM: {
      trend: 0.0003,
      volatility: 0.014,
      events: [
        { dayOffset: 70, type: 'drop', magnitude: -0.10, duration: 12 },
        { dayOffset: 190, type: 'spike', magnitude: 0.08, duration: 5 },
      ],
      finalBoost: 1.10,
    },
    GOOGL: {
      trend: 0.0004,
      volatility: 0.016,
      events: [
        { dayOffset: 110, type: 'drop', magnitude: -0.07, duration: 8 },
        { dayOffset: 230, type: 'spike', magnitude: 0.10, duration: 6 },
      ],
      finalBoost: 1.14,
    },
    AMZN: {
      trend: 0.0004,
      volatility: 0.018,
      events: [
        { dayOffset: 55, type: 'spike', magnitude: 0.12, duration: 5 },
        { dayOffset: 140, type: 'drop', magnitude: -0.09, duration: 10 },
      ],
      finalBoost: 1.16,
    },
    META: {
      trend: 0.0005,
      volatility: 0.022,
      events: [
        { dayOffset: 40, type: 'spike', magnitude: 0.15, duration: 4 },
        { dayOffset: 170, type: 'drop', magnitude: -0.12, duration: 14 },
        { dayOffset: 280, type: 'spike', magnitude: 0.18, duration: 6 },
      ],
      finalBoost: 1.20,
    },
    V: {
      trend: 0.0002,
      volatility: 0.010,
      events: [
        { dayOffset: 120, type: 'drop', magnitude: -0.05, duration: 8 },
      ],
      finalBoost: 1.06,
    },
    SPY: {
      trend: 0.0003,
      volatility: 0.012,
      events: [
        { dayOffset: 65, type: 'drop', magnitude: -0.08, duration: 10 },
        { dayOffset: 160, type: 'spike', magnitude: 0.10, duration: 6 },
        { dayOffset: 260, type: 'drop', magnitude: -0.06, duration: 12 },
      ],
      finalBoost: 1.12,
    },
  },
  resilience: {
    AAPL: {
      trend: 0.0002,
      volatility: 0.018,
      events: [
        { dayOffset: 30, type: 'drop', magnitude: -0.12, duration: 20 },
        { dayOffset: 80, type: 'drop', magnitude: -0.10, duration: 15 },
        { dayOffset: 180, type: 'spike', magnitude: 0.08, duration: 10 },
        { dayOffset: 250, type: 'drop', magnitude: -0.08, duration: 12 },
      ],
      finalBoost: 1.05,
    },
    MSFT: {
      trend: 0.0001,
      volatility: 0.015,
      events: [
        { dayOffset: 50, type: 'drop', magnitude: -0.10, duration: 18 },
        { dayOffset: 150, type: 'drop', magnitude: -0.08, duration: 14 },
      ],
      finalBoost: 1.02,
    },
    NVDA: {
      trend: 0.0003,
      volatility: 0.030,
      events: [
        { dayOffset: 40, type: 'spike', magnitude: 0.25, duration: 5 },
        { dayOffset: 90, type: 'drop', magnitude: -0.25, duration: 25 },
        { dayOffset: 200, type: 'spike', magnitude: 0.15, duration: 8 },
      ],
      finalBoost: 1.08,
    },
    TSLA: {
      trend: -0.0001, // Negative trend for resilience
      volatility: 0.040,
      events: [
        { dayOffset: 25, type: 'drop', magnitude: -0.30, duration: 30 },
        { dayOffset: 100, type: 'spike', magnitude: 0.20, duration: 15 },
        { dayOffset: 180, type: 'drop', magnitude: -0.25, duration: 25 },
        { dayOffset: 270, type: 'spike', magnitude: 0.10, duration: 10 },
      ],
      finalBoost: 0.95, // Flat to slightly negative
    },
    JPM: {
      trend: 0.0001,
      volatility: 0.016,
      events: [
        { dayOffset: 60, type: 'drop', magnitude: -0.15, duration: 20 },
        { dayOffset: 170, type: 'drop', magnitude: -0.10, duration: 15 },
      ],
      finalBoost: 1.02,
    },
    GOOGL: {
      trend: 0.0002,
      volatility: 0.018,
      events: [
        { dayOffset: 70, type: 'drop', magnitude: -0.10, duration: 15 },
        { dayOffset: 190, type: 'drop', magnitude: -0.08, duration: 12 },
      ],
      finalBoost: 1.04,
    },
    AMZN: {
      trend: 0.0002,
      volatility: 0.020,
      events: [
        { dayOffset: 45, type: 'drop', magnitude: -0.15, duration: 18 },
        { dayOffset: 140, type: 'drop', magnitude: -0.10, duration: 12 },
      ],
      finalBoost: 1.03,
    },
    META: {
      trend: 0.0002,
      volatility: 0.025,
      events: [
        { dayOffset: 35, type: 'spike', magnitude: 0.18, duration: 6 },
        { dayOffset: 100, type: 'drop', magnitude: -0.18, duration: 20 },
        { dayOffset: 220, type: 'spike', magnitude: 0.12, duration: 10 },
      ],
      finalBoost: 1.05,
    },
    V: {
      trend: 0.0001,
      volatility: 0.012,
      events: [
        { dayOffset: 55, type: 'drop', magnitude: -0.08, duration: 12 },
        { dayOffset: 160, type: 'drop', magnitude: -0.06, duration: 10 },
      ],
      finalBoost: 1.02,
    },
    SPY: {
      trend: 0.0001,
      volatility: 0.014,
      events: [
        { dayOffset: 40, type: 'drop', magnitude: -0.10, duration: 15 },
        { dayOffset: 130, type: 'drop', magnitude: -0.08, duration: 12 },
        { dayOffset: 230, type: 'drop', magnitude: -0.07, duration: 10 },
      ],
      finalBoost: 1.03,
    },
  },
};

const DEFAULT_SCENARIO: ScenarioConfig = {
  trend: 0.0003,
  volatility: 0.015,
  events: [
    { dayOffset: 90, type: 'drop', magnitude: -0.08, duration: 10 },
  ],
  finalBoost: 1.10,
};

function getScenario(symbol: string, seed: ReplaySeed): ScenarioConfig {
  return SCENARIOS[seed]?.[symbol] || DEFAULT_SCENARIO;
}

// Generate full price history for a symbol
export function generateSymbolHistory(
  symbol: string,
  seed: ReplaySeed,
  startDate: string = '2025-01-01',
  endDate: string = '2025-04-30'
): ReplayPrice[] {
  const stock = getStockBySymbol(symbol);
  const basePrice = (stock?.price || 100) * USD_TO_VND; // Convert USD to VND
  
  // Calculate days in range
  const startDays = dateToDays(startDate);
  const endDays = dateToDays(endDate);
  const days = endDays - startDays + 1;
  
  // Get scenario config
  const scenario = getScenario(symbol, seed);
  
  // Generate base price series
  const hashCode = symbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const prices = generatePriceSeries(basePrice * 0.85, days, scenario.volatility, scenario.trend, hashCode);
  
  // Apply scenario events
  const result: ReplayPrice[] = [];
  let prevPrice = prices[0];
  
  for (let i = 0; i < days; i++) {
    let price = prices[i];
    const currentDay = startDays + i;
    const currentDate = new Date('2025-01-01');
    currentDate.setDate(currentDate.getDate() + currentDay);
    const dateStr = currentDate.toISOString().split('T')[0];
    
    // Skip weekends
    const dayOfWeek = currentDate.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      continue;
    }
    
    // Apply event effects
    for (const event of scenario.events) {
      if (currentDay >= event.dayOffset && currentDay < event.dayOffset + event.duration) {
        const progress = (currentDay - event.dayOffset) / event.duration;
        const recovery = event.type === 'recover' ? progress : (1 - Math.abs(progress - 0.5) * 2);
        const maxImpact = event.magnitude * recovery;
        price = price * (1 + maxImpact);
      }
    }
    
    // Apply final boost in last 30 days
    if (i > days - 30) {
      const boostProgress = (i - (days - 30)) / 30;
      const boostFactor = 1 + (scenario.finalBoost - 1) * boostProgress;
      price = price * boostFactor;
    }
    
    const change = price - prevPrice;
    const changePercent = prevPrice > 0 ? (change / prevPrice) * 100 : 0;
    
    result.push({
      date: dateStr,
      price: Math.round(price * 100) / 100,
      change: Math.round(change * 100) / 100,
      changePercent: Math.round(changePercent * 100) / 100,
      volume: Math.floor(1000000 + Math.random() * 5000000),
    });
    
    prevPrice = price;
  }
  
  return result;
}

// Generate all price histories for a replay
export function generateReplayHistory(
  symbols: string[],
  seed: ReplaySeed,
  startDate: string = '2025-01-01',
  endDate: string = '2025-04-30'
): Record<string, ReplayPrice[]> {
  const result: Record<string, ReplayPrice[]> = {};
  
  for (const symbol of symbols) {
    result[symbol] = generateSymbolHistory(symbol, seed, startDate, endDate);
  }
  
  return result;
}

// Get price for a specific date
export function getPriceAtDate(
  history: Record<string, ReplayPrice[]>,
  symbol: string,
  date: string
): number | null {
  const prices = history[symbol];
  if (!prices) return null;
  
  // Find exact date or nearest prior
  for (let i = 0; i < prices.length; i++) {
    if (prices[i].date === date) return prices[i].price;
  }
  
  // Try to find nearest prior date
  for (let i = 0; i < prices.length; i++) {
    if (prices[i].date > date) {
      return i > 0 ? prices[i - 1].price : null;
    }
  }
  
  return prices.length > 0 ? prices[prices.length - 1].price : null;
}

// Calculate Buy & Hold return
export function calculateBuyAndHoldReturn(
  history: Record<string, ReplayPrice[]>,
  symbols: string[],
  startDate: string,
  endDate: string
): number {
  let totalReturn = 0;
  let totalWeight = 0;
  
  for (const symbol of symbols) {
    const prices = history[symbol];
    if (!prices || prices.length < 2) continue;
    
    const startPrice = prices.find(p => p.date >= startDate)?.price || prices[0].price;
    const endPrice = prices[prices.length - 1].price;
    const ret = (endPrice - startPrice) / startPrice;
    
    totalReturn += ret;
    totalWeight++;
  }
  
  return totalWeight > 0 ? (totalReturn / totalWeight) * 100 : 0;
}

// Get all trading days in range
export function getTradingDays(startDate: string, endDate: string): string[] {
  const days: string[] = [];
  const current = new Date(startDate);
  const end = new Date(endDate);
  
  while (current <= end) {
    const dayOfWeek = current.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      days.push(current.toISOString().split('T')[0]);
    }
    current.setDate(current.getDate() + 1);
  }
  
  return days;
}

// Format large number with currency
export function formatCurrencyVND(value: number): string {
  if (value >= 1e9) {
    return `${(value / 1e9).toFixed(1)} tỷ`;
  } else if (value >= 1e6) {
    return `${(value / 1e6).toFixed(1)} triệu`;
  } else if (value >= 1e3) {
    return `${(value / 1e3).toFixed(1)}K`;
  }
  return value.toFixed(0);
}

// Calculate portfolio metrics
export function calculatePortfolioMetrics(
  holdings: Record<string, { quantity: number; avgPrice: number }>,
  currentPrices: Record<string, number>,
  cashBalance: number
): {
  totalValue: number;
  unrealizedPnL: number;
  allocations: Record<string, number>;
} {
  let totalValue = cashBalance;
  const unrealizedPnL = 0;
  const allocations: Record<string, number> = {};
  
  for (const [symbol, holding] of Object.entries(holdings)) {
    const currentPrice = currentPrices[symbol] || holding.avgPrice;
    const marketValue = currentPrice * holding.quantity;
    const cost = holding.avgPrice * holding.quantity;
    
    totalValue += marketValue;
  }
  
  // Calculate allocations
  for (const [symbol, holding] of Object.entries(holdings)) {
    const currentPrice = currentPrices[symbol] || holding.avgPrice;
    const marketValue = currentPrice * holding.quantity;
    allocations[symbol] = totalValue > 0 ? (marketValue / totalValue) * 100 : 0;
  }
  
  return { totalValue, unrealizedPnL, allocations };
}
