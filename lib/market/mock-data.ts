import { SP500_METADATA } from "./sp500-metadata";

// Mock market data for MVP
// Base prices updated June 2026 to match real market values
export interface StockQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  exchange: string;
  currency: string;
  marketCap: number;
  volume: number;
  peRatio: number;
  eps: number;
  dividendYield: number;
  beta: number;
  high52w: number;
  low52w: number;
  sector: string;
  sparkline: number[];
  day1: number;
  week1: number;
  month1: number;
  ytd: number;
}

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  category: string;
  publishedAt: string;
  symbols: string[];
  sentiment: "bullish" | "bearish" | "neutral";
  detailId?: string;
  imageUrl?: string;
  content?: string;
  url?: string;
  originalUrl?: string;
}

export interface MarketIndex {
  symbol: string;
  name: string;
  value: number;
  change: number;
  changePercent: number;
}

export interface EconomicEvent {
  id: string;
  time: string;
  currency: string;
  impact: 'high' | 'medium' | 'low';
  event: string;
  actual?: string;
  forecast: string;
  previous: string;
}

// Seeded PRNG (mulberry32) to ensure deterministic sparkline data across SSR and client
export function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let sparkSeed = 1;
export function spark(n: number, trend: "up" | "down" | "flat"): number[] {
  const rand = mulberry32(sparkSeed++);
  const d: number[] = [];
  let v = 50 + rand() * 50;
  for (let i = 0; i < n; i++) {
    v = Math.max(10, v + (rand() - 0.5) * 10 + (trend === "up" ? 1.5 : trend === "down" ? -1.5 : 0));
    d.push(v);
  }
  return d;
}

export function generateQuoteFromMetadata(meta: {
  symbol: string;
  name: string;
  exchange?: string;
  sector?: string;
  marketCapRank?: number;
}): StockQuote {
  let hash = 0;
  for (let i = 0; i < meta.symbol.length; i++) {
    hash = (hash << 5) - hash + meta.symbol.charCodeAt(i);
    hash |= 0;
  }
  const rand = mulberry32(Math.abs(hash) + 100);

  const price = Math.round((35 + rand() * 450) * 100) / 100;
  const day1 = Math.round(((rand() - 0.48) * 8.5) * 100) / 100;
  const change = Math.round((price * (day1 / 100)) * 100) / 100;
  const changePercent = day1;

  const rank = Math.max(1, meta.marketCapRank || 100);
  const baseCap = 3.6e12 / Math.pow(rank, 0.85);
  const marketCap = Math.round(baseCap * (0.85 + rand() * 0.3));
  const volume = Math.round((2_000_000 + rand() * 30_000_000) / 1000) * 1000;

  const peRatio = Math.round((14 + rand() * 32) * 10) / 10;
  const eps = Math.round((price / (peRatio || 20)) * 100) / 100;
  const dividendYield = rand() > 0.35 ? Math.round(rand() * 3.2 * 100) / 100 : 0;
  const beta = Math.round((0.65 + rand() * 1.05) * 100) / 100;

  const high52w = Math.round((price * (1.05 + rand() * 0.25)) * 100) / 100;
  const low52w = Math.round((price * (0.70 + rand() * 0.20)) * 100) / 100;

  const week1 = Math.round(((rand() - 0.47) * 9.5) * 100) / 100;
  const month1 = Math.round(((rand() - 0.45) * 16.5) * 100) / 100;
  const ytd = Math.round(((rand() - 0.42) * 38.0) * 100) / 100;

  const sparkTrend = day1 > 0.5 ? "up" : day1 < -0.5 ? "down" : "flat";
  const sparkData: number[] = [];
  let sv = 50 + rand() * 50;
  for (let i = 0; i < 20; i++) {
    sv = Math.max(10, sv + (rand() - 0.5) * 10 + (sparkTrend === "up" ? 1.5 : sparkTrend === "down" ? -1.5 : 0));
    sparkData.push(sv);
  }

  return {
    symbol: meta.symbol,
    name: meta.name,
    price,
    change,
    changePercent,
    exchange: meta.exchange || "NASDAQ",
    currency: "USD",
    marketCap,
    volume,
    peRatio,
    eps,
    dividendYield,
    beta,
    high52w,
    low52w,
    sector: meta.sector || "General",
    sparkline: sparkData,
    day1,
    week1,
    month1,
    ytd,
  };
}

export const INDICES: MarketIndex[] = [
  { symbol: "SPX", name: "S&P 500", value: 7500.58, change: 80.48, changePercent: 1.08 },
  { symbol: "IXIC", name: "Nasdaq", value: 26517.93, change: 496.28, changePercent: 1.91 },
  { symbol: "DJI", name: "Dow Jones", value: 51564.70, change: 72.15, changePercent: 0.14 },
  { symbol: "VIX", name: "VIX", value: 16.40, change: -0.01, changePercent: -0.06 },
];

export const STOCKS: StockQuote[] = [
  { symbol:"AAPL",name:"Apple Inc.",price:298.01,change:2.06,changePercent:0.70,exchange:"NASDAQ",currency:"USD",marketCap:4.50e12,volume:76700000,peRatio:33.2,eps:8.98,dividendYield:0.34,beta:1.24,high52w:317.40,low52w:196.86,sector:"Technology",sparkline:spark(20,"up"),day1:0.70,week1:2.1,month1:5.3,ytd:12.4 },
  { symbol:"MSFT",name:"Microsoft Corp.",price:379.40,change:0.49,changePercent:0.13,exchange:"NASDAQ",currency:"USD",marketCap:2.82e12,volume:58400000,peRatio:28.5,eps:13.31,dividendYield:0.88,beta:0.89,high52w:555.45,low52w:356.28,sector:"Technology",sparkline:spark(20,"up"),day1:0.13,week1:1.9,month1:4.7,ytd:-7.2 },
  { symbol:"NVDA",name:"NVIDIA Corporation",price:210.69,change:6.04,changePercent:2.95,exchange:"NASDAQ",currency:"USD",marketCap:5.15e12,volume:312000000,peRatio:54.5,eps:3.87,dividendYield:0.02,beta:1.68,high52w:220.00,low52w:90.69,sector:"Technology",sparkline:spark(20,"up"),day1:2.95,week1:12.3,month1:28.5,ytd:56.2 },
  { symbol:"GOOGL",name:"Alphabet Inc.",price:368.03,change:4.24,changePercent:1.17,exchange:"NASDAQ",currency:"USD",marketCap:2.25e12,volume:24300000,peRatio:22.1,eps:16.65,dividendYield:0.22,beta:1.06,high52w:370.00,low52w:163.59,sector:"Technology",sparkline:spark(20,"up"),day1:1.17,week1:3.2,month1:8.1,ytd:47.5 },
  { symbol:"GOOG",name:"Alphabet Inc. (Class C)",price:182.40,change:2.10,changePercent:1.16,exchange:"NASDAQ",currency:"USD",marketCap:2.24e12,volume:21800000,peRatio:22.0,eps:16.65,dividendYield:0.22,beta:1.06,high52w:191.75,low52w:129.50,sector:"Technology",sparkline:spark(20,"up"),day1:1.16,week1:3.1,month1:8.0,ytd:46.8 },
  { symbol:"AMZN",name:"Amazon.com Inc.",price:244.39,change:6.89,changePercent:2.90,exchange:"NASDAQ",currency:"USD",marketCap:2.58e12,volume:41200000,peRatio:38.3,eps:6.38,dividendYield:0,beta:1.15,high52w:245.00,low52w:175.01,sector:"Consumer Cyclical",sparkline:spark(20,"up"),day1:2.90,week1:3.1,month1:8.2,ytd:15.6 },
  { symbol:"META",name:"Meta Platforms Inc.",price:577.22,change:9.64,changePercent:1.70,exchange:"NASDAQ",currency:"USD",marketCap:1.47e12,volume:16800000,peRatio:23.7,eps:24.37,dividendYield:0.35,beta:1.22,high52w:581.00,low52w:467.56,sector:"Technology",sparkline:spark(20,"up"),day1:1.70,week1:2.1,month1:5.4,ytd:6.3 },
  { symbol:"TSLA",name:"Tesla Inc.",price:400.49,change:4.11,changePercent:1.04,exchange:"NASDAQ",currency:"USD",marketCap:1.29e12,volume:98700000,peRatio:132.1,eps:3.03,dividendYield:0,beta:2.05,high52w:465.00,low52w:198.05,sector:"Consumer Cyclical",sparkline:spark(20,"up"),day1:1.04,week1:8.9,month1:15.3,ytd:42.1 },
  { symbol:"BRK.B",name:"Berkshire Hathaway",price:489.46,change:-1.82,changePercent:-0.37,exchange:"NYSE",currency:"USD",marketCap:1.10e12,volume:3200000,peRatio:10.2,eps:48.00,dividendYield:0,beta:0.56,high52w:539.20,low52w:393.97,sector:"Financials",sparkline:spark(20,"flat"),day1:-0.37,week1:0.8,month1:2.1,ytd:15.4 },
  { symbol:"AVGO",name:"Broadcom Inc.",price:172.50,change:4.80,changePercent:2.86,exchange:"NASDAQ",currency:"USD",marketCap:805e9,volume:28400000,peRatio:38.2,eps:4.52,dividendYield:1.24,beta:1.35,high52w:185.16,low52w:128.50,sector:"Technology",sparkline:spark(20,"up"),day1:2.86,week1:5.8,month1:14.2,ytd:54.6 },
  { symbol:"WMT",name:"Walmart Inc.",price:88.65,change:0.85,changePercent:0.97,exchange:"NYSE",currency:"USD",marketCap:712e9,volume:18200000,peRatio:32.4,eps:2.74,dividendYield:0.94,beta:0.52,high52w:90.75,low52w:58.20,sector:"Consumer Defensive",sparkline:spark(20,"up"),day1:0.97,week1:2.1,month1:4.8,ytd:68.5 },
  { symbol:"JPM",name:"JPMorgan Chase",price:325.22,change:-8.24,changePercent:-2.47,exchange:"NYSE",currency:"USD",marketCap:930e9,volume:8900000,peRatio:14.8,eps:21.97,dividendYield:1.65,beta:1.08,high52w:340.00,low52w:203.23,sector:"Financials",sparkline:spark(20,"down"),day1:-2.47,week1:-1.3,month1:5.8,ytd:24.2 },
  { symbol:"LLY",name:"Eli Lilly and Co.",price:845.20,change:12.60,changePercent:1.51,exchange:"NYSE",currency:"USD",marketCap:802e9,volume:3400000,peRatio:62.5,eps:13.52,dividendYield:0.62,beta:0.78,high52w:972.53,low52w:545.00,sector:"Healthcare",sparkline:spark(20,"up"),day1:1.51,week1:4.2,month1:9.8,ytd:45.2 },
  { symbol:"V",name:"Visa Inc.",price:327.24,change:-3.14,changePercent:-0.95,exchange:"NYSE",currency:"USD",marketCap:660e9,volume:6200000,peRatio:31.5,eps:10.39,dividendYield:0.73,beta:0.94,high52w:337.00,low52w:266.88,sector:"Financials",sparkline:spark(20,"down"),day1:-0.95,week1:1.1,month1:3.2,ytd:8.7 },
  { symbol:"MA",name:"Mastercard Inc.",price:522.40,change:-2.80,changePercent:-0.53,exchange:"NYSE",currency:"USD",marketCap:485e9,volume:2900000,peRatio:37.2,eps:14.04,dividendYield:0.51,beta:0.92,high52w:535.00,low52w:392.00,sector:"Financials",sparkline:spark(20,"flat"),day1:-0.53,week1:0.8,month1:3.4,ytd:22.5 },
  { symbol:"ORCL",name:"Oracle Corp.",price:178.30,change:3.45,changePercent:1.97,exchange:"NYSE",currency:"USD",marketCap:492e9,volume:12500000,peRatio:41.8,eps:4.26,dividendYield:0.90,beta:1.18,high52w:195.00,low52w:100.50,sector:"Technology",sparkline:spark(20,"up"),day1:1.97,week1:4.5,month1:16.8,ytd:71.4 },
  { symbol:"UNH",name:"UnitedHealth Group",price:400.96,change:1.43,changePercent:0.36,exchange:"NYSE",currency:"USD",marketCap:369e9,volume:4100000,peRatio:19.9,eps:20.15,dividendYield:1.85,beta:0.72,high52w:630.73,low52w:349.00,sector:"Healthcare",sparkline:spark(20,"down"),day1:0.36,week1:-3.2,month1:-8.5,ytd:-25.3 },
  { symbol:"COST",name:"Costco Wholesale",price:935.10,change:6.80,changePercent:0.73,exchange:"NASDAQ",currency:"USD",marketCap:414e9,volume:2100000,peRatio:54.2,eps:17.25,dividendYield:0.50,beta:0.76,high52w:950.00,low52w:580.00,sector:"Consumer Defensive",sparkline:spark(20,"up"),day1:0.73,week1:1.8,month1:5.2,ytd:42.1 },
  { symbol:"NFLX",name:"Netflix Inc.",price:795.50,change:15.20,changePercent:1.95,exchange:"NASDAQ",currency:"USD",marketCap:342e9,volume:4200000,peRatio:44.8,eps:17.75,dividendYield:0,beta:1.28,high52w:830.00,low52w:445.00,sector:"Communication",sparkline:spark(20,"up"),day1:1.95,week1:5.2,month1:12.4,ytd:64.2 },
  { symbol:"HD",name:"Home Depot Inc.",price:398.20,change:-1.40,changePercent:-0.35,exchange:"NYSE",currency:"USD",marketCap:395e9,volume:3600000,peRatio:26.5,eps:15.02,dividendYield:2.26,beta:0.95,high52w:421.50,low52w:274.20,sector:"Consumer Cyclical",sparkline:spark(20,"flat"),day1:-0.35,week1:1.2,month1:3.1,ytd:15.4 },
  { symbol:"PG",name:"Procter & Gamble",price:168.40,change:0.65,changePercent:0.39,exchange:"NYSE",currency:"USD",marketCap:396e9,volume:5100000,peRatio:26.8,eps:6.28,dividendYield:2.40,beta:0.54,high52w:179.80,low52w:143.20,sector:"Consumer Defensive",sparkline:spark(20,"flat"),day1:0.39,week1:0.6,month1:1.8,ytd:14.2 },
  { symbol:"JNJ",name:"Johnson & Johnson",price:156.80,change:-0.45,changePercent:-0.29,exchange:"NYSE",currency:"USD",marketCap:378e9,volume:6200000,peRatio:24.2,eps:6.48,dividendYield:3.16,beta:0.56,high52w:168.90,low52w:143.50,sector:"Healthcare",sparkline:spark(20,"flat"),day1:-0.29,week1:-0.8,month1:-1.5,ytd:0.5 },
  { symbol:"BAC",name:"Bank of America",price:43.80,change:0.52,changePercent:1.20,exchange:"NYSE",currency:"USD",marketCap:340e9,volume:34500000,peRatio:13.5,eps:3.24,dividendYield:2.37,beta:1.28,high52w:46.50,low52w:28.40,sector:"Financials",sparkline:spark(20,"up"),day1:1.20,week1:2.4,month1:6.5,ytd:32.4 },
  { symbol:"ABBV",name:"AbbVie Inc.",price:188.50,change:1.75,changePercent:0.94,exchange:"NYSE",currency:"USD",marketCap:333e9,volume:4800000,peRatio:48.2,eps:3.91,dividendYield:3.29,beta:0.64,high52w:201.00,low52w:135.20,sector:"Healthcare",sparkline:spark(20,"up"),day1:0.94,week1:1.8,month1:4.2,ytd:22.8 },
  { symbol:"CRM",name:"Salesforce Inc.",price:312.40,change:5.60,changePercent:1.82,exchange:"NYSE",currency:"USD",marketCap:300e9,volume:5200000,peRatio:52.4,eps:5.96,dividendYield:0.51,beta:1.20,high52w:348.00,low52w:212.00,sector:"Technology",sparkline:spark(20,"up"),day1:1.82,week1:3.6,month1:10.5,ytd:18.5 },
  { symbol:"KO",name:"Coca-Cola Co.",price:68.20,change:0.32,changePercent:0.47,exchange:"NYSE",currency:"USD",marketCap:294e9,volume:12800000,peRatio:27.5,eps:2.48,dividendYield:2.84,beta:0.58,high52w:73.50,low52w:55.80,sector:"Consumer Defensive",sparkline:spark(20,"flat"),day1:0.47,week1:0.9,month1:2.1,ytd:16.8 },
  { symbol:"PEP",name:"PepsiCo Inc.",price:162.70,change:0.85,changePercent:0.53,exchange:"NASDAQ",currency:"USD",marketCap:223e9,volume:5100000,peRatio:23.8,eps:6.84,dividendYield:3.32,beta:0.55,high52w:183.00,low52w:155.00,sector:"Consumer Defensive",sparkline:spark(20,"flat"),day1:0.53,week1:0.7,month1:1.2,ytd:-2.5 },
  { symbol:"CVX",name:"Chevron Corp.",price:156.30,change:-1.85,changePercent:-1.17,exchange:"NYSE",currency:"USD",marketCap:285e9,volume:7400000,peRatio:14.2,eps:11.01,dividendYield:4.17,beta:0.88,high52w:167.00,low52w:137.50,sector:"Energy",sparkline:spark(20,"down"),day1:-1.17,week1:-1.4,month1:-2.8,ytd:4.8 },
  { symbol:"AMD",name:"Advanced Micro Devices",price:148.90,change:3.65,changePercent:2.51,exchange:"NASDAQ",currency:"USD",marketCap:241e9,volume:52000000,peRatio:98.5,eps:1.51,dividendYield:0,beta:1.72,high52w:227.30,low52w:121.80,sector:"Technology",sparkline:spark(20,"up"),day1:2.51,week1:6.5,month1:11.8,ytd:5.8 },
  { symbol:"DIS",name:"Walt Disney Co.",price:103.89,change:3.03,changePercent:3.00,exchange:"NYSE",currency:"USD",marketCap:189e9,volume:9800000,peRatio:35.2,eps:2.95,dividendYield:0.77,beta:1.32,high52w:124.00,low52w:83.91,sector:"Communication",sparkline:spark(20,"up"),day1:3.00,week1:2.8,month1:7.5,ytd:18.3 },
  { symbol:"XOM",name:"Exxon Mobil Corp.",price:137.81,change:-2.93,changePercent:-2.08,exchange:"NYSE",currency:"USD",marketCap:580e9,volume:14300000,peRatio:14.5,eps:9.50,dividendYield:2.8,beta:0.82,high52w:147.00,low52w:105.08,sector:"Energy",sparkline:spark(20,"down"),day1:-2.08,week1:-1.5,month1:-4.2,ytd:4.8 },
  { symbol:"INTC",name:"Intel Corp.",price:24.50,change:0.62,changePercent:2.60,exchange:"NASDAQ",currency:"USD",marketCap:105e9,volume:68000000,peRatio:0,eps:-0.45,dividendYield:2.04,beta:1.32,high52w:51.28,low52w:18.51,sector:"Technology",sparkline:spark(20,"up"),day1:2.60,week1:4.8,month1:8.5,ytd:-51.2 },
  { symbol:"CSCO",name:"Cisco Systems",price:57.80,change:0.42,changePercent:0.73,exchange:"NASDAQ",currency:"USD",marketCap:232e9,volume:18500000,peRatio:22.5,eps:2.57,dividendYield:2.77,beta:0.86,high52w:59.50,low52w:44.50,sector:"Technology",sparkline:spark(20,"up"),day1:0.73,week1:1.6,month1:4.2,ytd:14.5 },
  { symbol:"IBM",name:"IBM Corp.",price:218.40,change:2.15,changePercent:1.00,exchange:"NYSE",currency:"USD",marketCap:201e9,volume:3800000,peRatio:23.4,eps:9.33,dividendYield:3.06,beta:0.72,high52w:237.00,low52w:155.00,sector:"Technology",sparkline:spark(20,"up"),day1:1.00,week1:2.3,month1:7.4,ytd:35.8 },
  { symbol:"CAT",name:"Caterpillar Inc.",price:385.20,change:4.10,changePercent:1.08,exchange:"NYSE",currency:"USD",marketCap:186e9,volume:2900000,peRatio:17.8,eps:21.64,dividendYield:1.45,beta:1.12,high52w:418.00,low52w:275.00,sector:"Industrials",sparkline:spark(20,"up"),day1:1.08,week1:2.8,month1:6.5,ytd:31.5 },
  { symbol:"BA",name:"Boeing Co.",price:162.50,change:-2.40,changePercent:-1.46,exchange:"NYSE",currency:"USD",marketCap:100e9,volume:8900000,peRatio:0,eps:-4.85,dividendYield:0,beta:1.55,high52w:267.00,low52w:136.00,sector:"Industrials",sparkline:spark(20,"down"),day1:-1.46,week1:-2.8,month1:-5.4,ytd:-37.5 },
  { symbol:"GE",name:"GE Aerospace",price:186.20,change:2.80,changePercent:1.53,exchange:"NYSE",currency:"USD",marketCap:202e9,volume:4800000,peRatio:36.5,eps:5.10,dividendYield:0.60,beta:1.24,high52w:195.00,low52w:98.00,sector:"Industrials",sparkline:spark(20,"up"),day1:1.53,week1:3.2,month1:8.1,ytd:82.4 },
  { symbol:"SPY",name:"SPDR S&P 500 ETF",price:746.74,change:7.68,changePercent:1.04,exchange:"AMEX",currency:"USD",marketCap:640e9,volume:67800000,peRatio:0,eps:0,dividendYield:1.15,beta:1.0,high52w:760.00,low52w:563.65,sector:"ETF",sparkline:spark(20,"up"),day1:1.04,week1:1.5,month1:4.1,ytd:11.3 },
  { symbol:"QQQ",name:"Invesco QQQ Trust",price:740.62,change:18.11,changePercent:2.51,exchange:"NASDAQ",currency:"USD",marketCap:330e9,volume:42100000,peRatio:0,eps:0,dividendYield:0.45,beta:1.14,high52w:748.00,low52w:464.21,sector:"ETF",sparkline:spark(20,"up"),day1:2.51,week1:2.3,month1:6.1,ytd:14.7 },
];

export const ETFS: StockQuote[] = [
  { symbol:"SPY",name:"SPDR S&P 500 ETF Trust",price:592.45,change:4.82,changePercent:0.82,exchange:"AMEX",currency:"USD",marketCap:615e9,volume:58200000,peRatio:0,eps:0,dividendYield:1.18,beta:1.0,high52w:602.00,low52w:485.50,sector:"Quỹ chỉ số",sparkline:spark(20,"up"),day1:0.82,week1:1.6,month1:3.8,ytd:24.5 },
  { symbol:"QQQ",name:"Invesco QQQ Trust (Nasdaq-100)",price:518.20,change:6.94,changePercent:1.36,exchange:"NASDAQ",currency:"USD",marketCap:310e9,volume:39500000,peRatio:0,eps:0,dividendYield:0.52,beta:1.18,high52w:530.00,low52w:405.00,sector:"Công nghệ",sparkline:spark(20,"up"),day1:1.36,week1:2.4,month1:5.6,ytd:27.8 },
  { symbol:"VOO",name:"Vanguard S&P 500 ETF",price:544.10,change:4.45,changePercent:0.82,exchange:"AMEX",currency:"USD",marketCap:520e9,volume:7200000,peRatio:0,eps:0,dividendYield:1.25,beta:1.0,high52w:552.00,low52w:446.00,sector:"Quỹ chỉ số",sparkline:spark(20,"up"),day1:0.82,week1:1.5,month1:3.7,ytd:24.6 },
  { symbol:"VTI",name:"Vanguard Total Stock Market ETF",price:294.30,change:2.15,changePercent:0.74,exchange:"AMEX",currency:"USD",marketCap:430e9,volume:3800000,peRatio:0,eps:0,dividendYield:1.30,beta:1.02,high52w:298.00,low52w:238.00,sector:"Toàn thị trường",sparkline:spark(20,"up"),day1:0.74,week1:1.4,month1:3.5,ytd:23.2 },
  { symbol:"IWM",name:"iShares Russell 2000 ETF",price:228.60,change:3.12,changePercent:1.38,exchange:"AMEX",currency:"USD",marketCap:75e9,volume:29500000,peRatio:0,eps:0,dividendYield:1.15,beta:1.25,high52w:244.00,low52w:188.00,sector:"Vốn hóa nhỏ",sparkline:spark(20,"up"),day1:1.38,week1:2.8,month1:4.2,ytd:14.8 },
  { symbol:"DIA",name:"SPDR Dow Jones Industrial ETF",price:442.80,change:1.55,changePercent:0.35,exchange:"AMEX",currency:"USD",marketCap:38e9,volume:3200000,peRatio:0,eps:0,dividendYield:1.62,beta:0.88,high52w:450.00,low52w:370.00,sector:"Công nghiệp",sparkline:spark(20,"up"),day1:0.35,week1:0.9,month1:2.8,ytd:17.5 },
  { symbol:"SOXX",name:"iShares Semiconductor ETF",price:236.40,change:5.80,changePercent:2.52,exchange:"NASDAQ",currency:"USD",marketCap:16e9,volume:6400000,peRatio:0,eps:0,dividendYield:0.68,beta:1.65,high52w:268.00,low52w:175.00,sector:"Bán dẫn",sparkline:spark(20,"up"),day1:2.52,week1:6.2,month1:11.5,ytd:38.2 },
  { symbol:"XLK",name:"Technology Select Sector SPDR",price:238.10,change:3.65,changePercent:1.56,exchange:"AMEX",currency:"USD",marketCap:78e9,volume:8200000,peRatio:0,eps:0,dividendYield:0.65,beta:1.22,high52w:244.00,low52w:185.00,sector:"Công nghệ",sparkline:spark(20,"up"),day1:1.56,week1:2.9,month1:6.8,ytd:28.5 },
  { symbol:"XLF",name:"Financial Select Sector SPDR",price:49.30,change:-0.25,changePercent:-0.50,exchange:"AMEX",currency:"USD",marketCap:45e9,volume:34000000,peRatio:0,eps:0,dividendYield:1.45,beta:0.98,high52w:51.50,low52w:36.80,sector:"Tài chính",sparkline:spark(20,"flat"),day1:-0.50,week1:1.1,month1:4.2,ytd:26.4 },
  { symbol:"XLE",name:"Energy Select Sector SPDR",price:91.80,change:-1.42,changePercent:-1.52,exchange:"AMEX",currency:"USD",marketCap:36e9,volume:16500000,peRatio:0,eps:0,dividendYield:3.15,beta:0.84,high52w:98.50,low52w:80.20,sector:"Năng lượng",sparkline:spark(20,"down"),day1:-1.52,week1:-1.8,month1:-3.5,ytd:6.5 },
  { symbol:"GLD",name:"SPDR Gold Shares",price:246.50,change:1.20,changePercent:0.49,exchange:"AMEX",currency:"USD",marketCap:72e9,volume:7500000,peRatio:0,eps:0,dividendYield:0,beta:0.12,high52w:258.00,low52w:182.00,sector:"Kim loại quý",sparkline:spark(20,"up"),day1:0.49,week1:1.8,month1:4.6,ytd:28.4 },
  { symbol:"SLV",name:"iShares Silver Trust",price:29.80,change:0.45,changePercent:1.53,exchange:"AMEX",currency:"USD",marketCap:15e9,volume:22000000,peRatio:0,eps:0,dividendYield:0,beta:0.35,high52w:32.50,low52w:20.10,sector:"Kim loại quý",sparkline:spark(20,"up"),day1:1.53,week1:3.1,month1:6.2,ytd:32.1 },
  { symbol:"ARKK",name:"ARK Innovation ETF",price:54.20,change:1.85,changePercent:3.53,exchange:"AMEX",currency:"USD",marketCap:6.8e9,volume:14200000,peRatio:0,eps:0,dividendYield:0,beta:1.78,high52w:62.00,low52w:38.50,sector:"Đổi mới sáng tạo",sparkline:spark(20,"up"),day1:3.53,week1:5.8,month1:12.4,ytd:15.6 },
  { symbol:"TLT",name:"iShares 20+ Year Treasury Bond ETF",price:92.40,change:-0.38,changePercent:-0.41,exchange:"NASDAQ",currency:"USD",marketCap:58e9,volume:38500000,peRatio:0,eps:0,dividendYield:3.85,beta:0.45,high52w:101.50,low52w:86.20,sector:"Trái phiếu",sparkline:spark(20,"flat"),day1:-0.41,week1:-0.8,month1:-1.5,ytd:-4.2 },
];

export const CRYPTOS: StockQuote[] = [
  { symbol:"BTC",name:"Bitcoin",price:96850.00,change:2450.00,changePercent:2.60,exchange:"Crypto",currency:"USD",marketCap:1.91e12,volume:48500000000,peRatio:0,eps:0,dividendYield:0,beta:2.15,high52w:99800.00,low52w:42000.00,sector:"Layer 1",sparkline:spark(20,"up"),day1:2.60,week1:6.8,month1:18.5,ytd:128.4 },
  { symbol:"ETH",name:"Ethereum",price:3480.00,change:112.00,changePercent:3.33,exchange:"Crypto",currency:"USD",marketCap:418e9,volume:24200000000,peRatio:0,eps:0,dividendYield:3.20,beta:2.30,high52w:4090.00,low52w:2150.00,sector:"Smart Contracts",sparkline:spark(20,"up"),day1:3.33,week1:8.2,month1:22.4,ytd:65.2 },
  { symbol:"SOL",name:"Solana",price:224.50,change:9.80,changePercent:4.56,exchange:"Crypto",currency:"USD",marketCap:106e9,volume:8400000000,peRatio:0,eps:0,dividendYield:6.50,beta:2.85,high52w:260.00,low52w:78.00,sector:"Layer 1",sparkline:spark(20,"up"),day1:4.56,week1:14.5,month1:35.8,ytd:145.0 },
  { symbol:"BNB",name:"BNB",price:658.00,change:12.50,changePercent:1.94,exchange:"Crypto",currency:"USD",marketCap:96e9,volume:1800000000,peRatio:0,eps:0,dividendYield:0,beta:1.80,high52w:720.00,low52w:310.00,sector:"Exchange Token",sparkline:spark(20,"up"),day1:1.94,week1:4.1,month1:11.2,ytd:82.5 },
  { symbol:"XRP",name:"Ripple",price:1.86,change:0.14,changePercent:8.14,exchange:"Crypto",currency:"USD",marketCap:105e9,volume:9200000000,peRatio:0,eps:0,dividendYield:0,beta:3.10,high52w:2.45,low52w:0.48,sector:"Payments",sparkline:spark(20,"up"),day1:8.14,week1:28.5,month1:85.0,ytd:245.0 },
  { symbol:"DOGE",name:"Dogecoin",price:0.385,change:0.024,changePercent:6.65,exchange:"Crypto",currency:"USD",marketCap:56e9,volume:5400000000,peRatio:0,eps:0,dividendYield:0,beta:3.40,high52w:0.48,low52w:0.09,sector:"Meme",sparkline:spark(20,"up"),day1:6.65,week1:18.2,month1:52.0,ytd:280.0 },
  { symbol:"ADA",name:"Cardano",price:0.945,change:0.038,changePercent:4.19,exchange:"Crypto",currency:"USD",marketCap:33e9,volume:2100000000,peRatio:0,eps:0,dividendYield:2.80,beta:2.40,high52w:1.25,low52w:0.32,sector:"Smart Contracts",sparkline:spark(20,"up"),day1:4.19,week1:12.4,month1:41.5,ytd:95.0 },
  { symbol:"AVAX",name:"Avalanche",price:44.80,change:2.10,changePercent:4.92,exchange:"Crypto",currency:"USD",marketCap:18e9,volume:1200000000,peRatio:0,eps:0,dividendYield:5.20,beta:2.65,high52w:65.00,low52w:18.00,sector:"Layer 1",sparkline:spark(20,"up"),day1:4.92,week1:10.8,month1:28.6,ytd:62.0 },
  { symbol:"LINK",name:"Chainlink",price:18.90,change:0.75,changePercent:4.13,exchange:"Crypto",currency:"USD",marketCap:11.5e9,volume:850000000,peRatio:0,eps:0,dividendYield:0,beta:2.25,high52w:22.80,low52w:11.00,sector:"Oracle / DeFi",sparkline:spark(20,"up"),day1:4.13,week1:9.5,month1:32.0,ytd:48.0 },
  { symbol:"SUI",name:"Sui",price:3.45,change:0.22,changePercent:6.81,exchange:"Crypto",currency:"USD",marketCap:9.8e9,volume:1650000000,peRatio:0,eps:0,dividendYield:0,beta:3.20,high52w:3.92,low52w:0.85,sector:"Layer 1",sparkline:spark(20,"up"),day1:6.81,week1:21.0,month1:58.0,ytd:310.0 },
  { symbol:"NEAR",name:"NEAR Protocol",price:6.85,change:0.35,changePercent:5.38,exchange:"Crypto",currency:"USD",marketCap:8.2e9,volume:720000000,peRatio:0,eps:0,dividendYield:0,beta:2.70,high52w:9.00,low52w:3.40,sector:"AI & Layer 1",sparkline:spark(20,"up"),day1:5.38,week1:11.2,month1:36.5,ytd:92.0 },
];

export const FOREX: StockQuote[] = [
  { symbol:"EURUSD",name:"Euro / US Dollar (EUR/USD)",price:1.0852,change:0.0024,changePercent:0.22,exchange:"FX",currency:"USD",marketCap:0,volume:125000000000,peRatio:0,eps:0,dividendYield:0,beta:0.45,high52w:1.1210,low52w:1.0450,sector:"Major FX",sparkline:spark(20,"up"),day1:0.22,week1:0.65,month1:-0.45,ytd:-1.80 },
  { symbol:"GBPUSD",name:"British Pound / US Dollar (GBP/USD)",price:1.2965,change:0.0041,changePercent:0.32,exchange:"FX",currency:"USD",marketCap:0,volume:85000000000,peRatio:0,eps:0,dividendYield:0,beta:0.55,high52w:1.3420,low52w:1.2300,sector:"Major FX",sparkline:spark(20,"up"),day1:0.32,week1:0.85,month1:0.15,ytd:1.90 },
  { symbol:"USDJPY",name:"US Dollar / Japanese Yen (USD/JPY)",price:154.25,change:-0.45,changePercent:-0.29,exchange:"FX",currency:"JPY",marketCap:0,volume:95000000000,peRatio:0,eps:0,dividendYield:0,beta:0.60,high52w:161.90,low52w:140.25,sector:"Major FX",sparkline:spark(20,"down"),day1:-0.29,week1:-1.15,month1:1.85,ytd:9.40 },
  { symbol:"USDVND",name:"US Dollar / Vietnamese Dong (USD/VND)",price:25450,change:15,changePercent:0.06,exchange:"FX",currency:"VND",marketCap:0,volume:1500000000,peRatio:0,eps:0,dividendYield:0,beta:0.15,high52w:25520,low52w:24200,sector:"Emerging FX",sparkline:spark(20,"up"),day1:0.06,week1:0.12,month1:0.45,ytd:4.25 },
  { symbol:"AUDUSD",name:"Australian Dollar / US Dollar (AUD/USD)",price:0.6654,change:0.0032,changePercent:0.48,exchange:"FX",currency:"USD",marketCap:0,volume:45000000000,peRatio:0,eps:0,dividendYield:0,beta:0.70,high52w:0.6940,low52w:0.6350,sector:"Commodity FX",sparkline:spark(20,"up"),day1:0.48,week1:1.25,month1:-0.80,ytd:-2.30 },
  { symbol:"USDCAD",name:"US Dollar / Canadian Dollar (USD/CAD)",price:1.3860,change:-0.0028,changePercent:-0.20,exchange:"FX",currency:"CAD",marketCap:0,volume:42000000000,peRatio:0,eps:0,dividendYield:0,beta:0.50,high52w:1.4100,low52w:1.3180,sector:"Major FX",sparkline:spark(20,"down"),day1:-0.20,week1:-0.45,month1:0.65,ytd:4.60 },
  { symbol:"USDCHF",name:"US Dollar / Swiss Franc (USD/CHF)",price:0.8845,change:-0.0018,changePercent:-0.20,exchange:"FX",currency:"CHF",marketCap:0,volume:38000000000,peRatio:0,eps:0,dividendYield:0,beta:0.40,high52w:0.9220,low52w:0.8375,sector:"Safe Haven FX",sparkline:spark(20,"down"),day1:-0.20,week1:-0.65,month1:-0.30,ytd:5.10 },
];

export const INDICES_STOCKS: StockQuote[] = [
  { symbol:"SPX",name:"S&P 500 Index",price:7500.58,change:80.48,changePercent:1.08,exchange:"INDEX",currency:"USD",marketCap:45e12,volume:3800000000,peRatio:26.5,eps:283.0,dividendYield:1.22,beta:1.0,high52w:7520.00,low52w:5900.00,sector:"US Index",sparkline:spark(20,"up"),day1:1.08,week1:2.1,month1:5.3,ytd:24.2 },
  { symbol:"IXIC",name:"Nasdaq Composite",price:26517.93,change:496.28,changePercent:1.91,exchange:"INDEX",currency:"USD",marketCap:28e12,volume:5400000000,peRatio:32.8,eps:808.5,dividendYield:0.65,beta:1.25,high52w:26600.00,low52w:18200.00,sector:"Tech Index",sparkline:spark(20,"up"),day1:1.91,week1:3.4,month1:7.8,ytd:28.5 },
  { symbol:"DJI",name:"Dow Jones Industrial",price:51564.70,change:72.15,changePercent:0.14,exchange:"INDEX",currency:"USD",marketCap:15e12,volume:420000000,peRatio:21.2,eps:2432.0,dividendYield:1.75,beta:0.85,high52w:51800.00,low52w:42500.00,sector:"US Index",sparkline:spark(20,"flat"),day1:0.14,week1:0.8,month1:2.4,ytd:16.8 },
  { symbol:"VIX",name:"CBOE Volatility Index",price:16.40,change:-0.01,changePercent:-0.06,exchange:"INDEX",currency:"USD",marketCap:0,volume:0,peRatio:0,eps:0,dividendYield:0,beta:-2.8,high52w:38.50,low52w:11.80,sector:"Volatility",sparkline:spark(20,"down"),day1:-0.06,week1:-4.5,month1:-12.0,ytd:-22.5 },
  { symbol:"VNINDEX",name:"VN-Index (Việt Nam)",price:1285.50,change:8.65,changePercent:0.68,exchange:"HOSE",currency:"VND",marketCap:5.4e15,volume:780000000,peRatio:14.2,eps:90.5,dividendYield:1.85,beta:1.10,high52w:1305.00,low52w:1100.00,sector:"Vietnam Index",sparkline:spark(20,"up"),day1:0.68,week1:1.45,month1:3.20,ytd:13.80 },
  { symbol:"FTSE",name:"FTSE 100 (Anh)",price:8425.30,change:32.10,changePercent:0.38,exchange:"LSE",currency:"GBP",marketCap:2.2e12,volume:850000000,peRatio:12.8,eps:658.0,dividendYield:3.65,beta:0.78,high52w:8480.00,low52w:7450.00,sector:"European Index",sparkline:spark(20,"up"),day1:0.38,week1:0.95,month1:2.10,ytd:9.40 },
  { symbol:"N225",name:"Nikkei 225 (Nhật Bản)",price:39180.00,change:345.50,changePercent:0.89,exchange:"TSE",currency:"JPY",marketCap:4.8e12,volume:1450000000,peRatio:18.5,eps:2117.8,dividendYield:1.70,beta:1.05,high52w:42426.00,low52w:35200.00,sector:"Asian Index",sparkline:spark(20,"up"),day1:0.89,week1:2.15,month1:4.80,ytd:17.20 },
];

export const NEWS: NewsItem[] = [
  {
    id: "nvda-1",
    title: "ĐỘT PHÁ: Siêu chip Blackwell GB200 cháy hàng đến hết 2027, Big Tech ồ ạt đặt cọc thêm 50 tỷ USD",
    summary: "CEO Jensen Huang xác nhận toàn bộ năng lực sản xuất kiến trúc Blackwell của NVIDIA và đối tác TSMC đã được đặt kín đến tận cuối năm 2027. Microsoft, Meta, Google và Amazon tiếp tục tranh giành slot cung ứng với các đơn đặt cọc kỷ lục.",
    source: "Bloomberg Breaking",
    category: "earnings",
    publishedAt: "2026-09-29T19:30:00Z",
    symbols: ["NVDA", "MSFT", "META", "GOOGL"],
    sentiment: "bullish",
    content: "Tập đoàn NVIDIA vừa chính thức xác nhận toàn bộ sản lượng chip trí tuệ nhân tạo thế hệ mới kiến trúc Blackwell (bao gồm GB200 NVL72 và B200) đã được các tập đoàn công nghệ lớn nhất thế giới đặt mua kín đến hết năm 2027.\n\nCEO Jensen Huang cho biết trong cuộc phỏng vấn độc quyền với Bloomberg rằng nhu cầu điện toán đám mây cho suy luận và đào tạo mô hình ngôn ngữ lớn (LLM) đang tăng theo cấp số nhân. 'Các khách hàng không chỉ muốn mua chip, họ muốn mua trọn gói cả trung tâm dữ liệu AI vận hành bằng hạ tầng mạng Spectrum-X và hệ điều hành CUDA của chúng tôi', ông Huang nhấn mạnh.\n\nBiên lợi nhuận gộp của mảng trung tâm dữ liệu NVIDIA tiếp tục duy trì ở mức kỷ lục 75.8%, xóa tan mọi lo ngại về sự chững lại của chu kỳ đầu tư AI. Cổ phiếu NVDA lập tức tăng vọt trong phiên giao dịch và nhận được dòng vốn tổ chức mua gom kỷ lục."
  },
  {
    id: "nvda-2",
    title: "NVIDIA bắt tay liên minh 12 siêu cường quốc gia xây dựng các Siêu trung tâm tính toán chủ quyền (Sovereign AI)",
    summary: "Chính phủ hàng loạt quốc gia tại châu Âu, Trung Đông và Nhật Bản ký thỏa thuận hạ tầng AI chiến lược trị giá hàng chục tỷ USD với NVIDIA, mở ra thị trường nghìn tỷ USD mới cho hãng chip.",
    source: "Reuters Financial",
    category: "market",
    publishedAt: "2026-09-29T14:15:00Z",
    symbols: ["NVDA"],
    sentiment: "bullish",
    content: "Chiến lược 'AI Chủ quyền' (Sovereign AI) của NVIDIA đang gặt hái thành công chưa từng có khi 12 chính phủ quốc gia vừa đồng loạt công bố các siêu dự án trung tâm tính toán dữ liệu quốc gia sử dụng 100% phần cứng và phần mềm của NVIDIA.\n\nThay vì phụ thuộc hoàn toàn vào các tập đoàn công nghệ xuyên biên giới, các quốc gia nhận thức được rằng dữ liệu và trí tuệ nhân tạo là tài nguyên an ninh quốc gia tối mật. Các đơn hàng trực tiếp từ chính phủ được dự báo sẽ đóng góp hơn 20 tỷ USD doanh thu bổ sung cho NVIDIA trong năm tài chính tới.\n\nGiới phân tích Phố Wall đánh giá đây là 'mỏ vàng thứ hai' của NVIDIA sau làn sóng mở rộng của các nhà cung cấp dịch vụ đám mây Hyperscale."
  },
  {
    id: "nvda-3",
    title: "Phố Wall rúng động: Morgan Stanley và Goldman Sachs đồng loạt nâng mục tiêu giá NVDA lên $280",
    summary: "Các ngân hàng đầu tư hàng đầu thế giới nhận định đà tăng trưởng của NVIDIA chưa hề đạt đỉnh và định giá cổ phiếu vẫn đang rất rẻ so với tốc độ sinh tiền mặt và tăng trưởng EPS trên 100%.",
    source: "Wall Street Journal",
    category: "market",
    publishedAt: "2026-09-28T21:00:00Z",
    symbols: ["NVDA", "QQQ", "SPY"],
    sentiment: "bullish",
    content: "Trong một báo cáo nghiên cứu quy mô vừa công bố, hai ngân hàng đầu tư uy tín bậc nhất Phố Wall là Morgan Stanley và Goldman Sachs đã đồng loạt nâng khuyến nghị của NVDA lên mức 'Overweight' (Mua mạnh) với giá mục tiêu mới là $280/cổ phiếu, tương đương tiềm năng tăng giá hơn 33% từ mức hiện tại.\n\nChuyên gia phân tích trưởng chỉ ra rằng tỷ số PEG (P/E chia cho tốc độ tăng trưởng EPS) của NVIDIA hiện chỉ ở mức 0.78x — mức định giá cực kỳ hấp dẫn đối với một công ty nắm giữ vị thế gần như độc quyền thị phần (>85%) trong một ngành công nghiệp đang định hình lại toàn bộ nền kinh tế toàn cầu.\n\n'NVIDIA không chỉ là một công ty bán dẫn, họ là nền tảng điện toán của kỷ nguyên AI giống như Microsoft của kỷ nguyên PC', báo cáo nhấn mạnh."
  },
  {
    id: "nvda-4",
    title: "Tesla chốt siêu hợp đồng bổ sung 100.000 cụm chip NVIDIA H200 và B200 phục vụ đội xe tự hành Robotaxi",
    summary: "Elon Musk ca ngợi cụm siêu máy tính NVIDIA là 'vô đối và không thể thay thế', công bố kế hoạch mở rộng gấp ba lần công suất AI cho mô hình tự lái FSD V14 và robot Optimus.",
    source: "CNBC Tech",
    category: "technology",
    publishedAt: "2026-09-28T11:20:00Z",
    symbols: ["NVDA", "TSLA"],
    sentiment: "bullish",
    content: "Tập đoàn Tesla vừa chính thức hoàn tất hợp đồng cung ứng quy mô lớn với NVIDIA nhằm tiếp nhận thêm 100.000 bộ xử lý đồ họa H200 và kiến trúc B200 mới nhất phục vụ cho siêu máy tính Cortex và hệ sinh thái xe tự hành Robotaxi.\n\nCEO Elon Musk đã dành những lời khen ngợi đặc biệt trên mạng xã hội X: 'Hiệu năng tính toán trên mỗi Watt điện và độ ổn định của cụm DGX SuperPOD từ NVIDIA hiện nay là vượt trội so với mọi giải pháp khác trên thế giới'.\n\nHợp đồng này một lần nữa chứng minh năng lực thống trị của NVIDIA trong thị trường 'AI Vật lý' (Physical AI), từ xe tự lái cho đến robot hình người công nghiệp."
  },
  {
    id: "nvda-5",
    title: "Cơ quan quản lý Mỹ và EU rà soát thị trường chip AI: NVIDIA khẳng định tuân thủ đầy đủ quy định cạnh tranh",
    summary: "Bộ Tư pháp Mỹ và Ủy ban Châu Âu duy trì các cuộc rà soát thường kỳ về chuỗi cung ứng bán dẫn toàn cầu, trong khi NVIDIA khẳng định khách hàng luôn có quyền tự do lựa chọn giải pháp phần cứng và phần mềm.",
    source: "Financial Times",
    category: "macro",
    publishedAt: "2026-09-27T16:45:00Z",
    symbols: ["NVDA"],
    sentiment: "neutral",
    content: "Các cơ quan quản lý chống độc quyền tại Mỹ và Liên minh Châu Âu đang duy trì sự quan tâm đối với sự phát triển bùng nổ của thị trường trí tuệ nhân tạo, bao gồm việc phân bổ nguồn cung bộ xử lý đồ họa GPU cho các đối tác công nghệ.\n\nĐại diện pháp lý của NVIDIA cho biết công ty luôn hợp tác minh bạch và cung cấp đầy đủ thông tin cho các cơ quan chức năng. NVIDIA khẳng định thành công thương mại của hãng đến từ năng lực đổi mới sáng tạo liên tục và các khoản đầu tư R&D khổng lồ trong suốt ba thập kỷ qua.\n\nGiới quan sát nhận định quá trình rà soát này mang tính chất định kỳ nhằm nắm bắt các xu hướng công nghệ mới, chưa ghi nhận bất kỳ dấu hiệu vi phạm hay hành động pháp lý nào."
  },
  {
    id: "nvda-6",
    title: "OpenAI và Microsoft khởi động siêu cụm Stargate 500.000 chip NVIDIA GB200 để huấn luyện mô hình siêu trí tuệ GPT-6",
    summary: "Cụm máy chủ AI lớn nhất hành tinh chính thức kích hoạt giai đoạn 1 với hơn 100.000 chip Blackwell GB200 kết nối quang học Spectrum-X, mang lại năng lực tính toán chưa từng có trong lịch sử nhân loại.",
    source: "The Information",
    category: "technology",
    publishedAt: "2026-09-29T09:30:00Z",
    symbols: ["NVDA", "MSFT"],
    sentiment: "bullish",
    content: "Dự án siêu trung tâm dữ liệu thế kỷ 'Stargate' do OpenAI và Microsoft hợp tác đầu tư hơn 100 tỷ USD vừa chính thức tiếp nhận và đóng điện thành công lô 100.000 siêu chip NVIDIA GB200 NVL72 đầu tiên.\n\nSam Altman ca ngợi mối quan hệ đối tác công nghệ với NVIDIA: 'Kiến trúc Blackwell và hạ tầng kết nối Spectrum-X là giải pháp điện toán duy nhất trên thế giới có khả năng hiện thực hóa siêu trí tuệ nhân tạo (AGI) mà không gặp hiện tượng nghẽn cổ chai mạng'.\n\nDự kiến toàn bộ cụm Stargate sẽ mở rộng lên 500.000 GPU vào cuối năm 2027, đảm bảo lượng đơn đặt hàng khổng lồ ổn định cho NVIDIA trong nhiều năm tới."
  },
  {
    id: "nvda-7",
    title: "Báo cáo tài chính quý kiểm toán: Doanh thu trung tâm dữ liệu tăng 142% YoY, biên lợi nhuận gộp đạt kỷ lục 76.2%",
    summary: "NVIDIA công bố kết quả kinh doanh quý vượt xa mọi dự báo đồng thuận của Phố Wall. Mảng mạng quang học AI tăng trưởng phi mã 156% và dòng tiền tự do cán mốc 18.5 tỷ USD riêng trong quý.",
    source: "Wall Street Journal",
    category: "earnings",
    publishedAt: "2026-09-28T16:20:00Z",
    symbols: ["NVDA", "QQQ"],
    sentiment: "bullish",
    content: "Trong báo cáo tài chính quý nộp lên Ủy ban Chứng khoán Mỹ (SEC), NVIDIA tiếp tục phá vỡ mọi tiền lệ về tăng trưởng quy mô lớn. Doanh thu thuần đạt 38.2 tỷ USD (+128% so với cùng kỳ), trong đó mảng AI Data Center chiếm 33.1 tỷ USD.\n\nBiên lợi nhuận gộp đạt mốc không tưởng 76.2%, khẳng định quyền năng định giá độc quyền tuyệt đối trước các khách hàng Big Tech. Dòng tiền tự do (Free Cash Flow) đạt 18.5 tỷ USD, nâng tổng dự trữ tiền mặt và đầu tư tài chính ngắn hạn lên gần 35 tỷ USD.\n\nCổ phiếu NVDA tiếp tục được các quỹ đầu cơ và định chế hưu trí toàn cầu gom mua với khối lượng lớn."
  },
  {
    id: "nvda-8",
    title: "NVIDIA mở rộng hợp tác chiến lược với Apple và Google: Tối ưu hóa sâu mô hình nền tảng trên đám mây DGX Cloud",
    summary: "Thỏa thuận ba bên giúp các kỹ sư của Apple và Google có thể trực tiếp tận dụng thư viện CUDA-X và chip Blackwell để tăng tốc độ phát triển các ứng dụng AI tiêu dùng thế hệ mới.",
    source: "TechCrunch",
    category: "technology",
    publishedAt: "2026-09-28T08:15:00Z",
    symbols: ["NVDA", "AAPL", "GOOGL"],
    sentiment: "bullish",
    content: "Tại sự kiện hội nghị cấp cao công nghệ đám mây, NVIDIA, Apple và Alphabet (Google) đã công bố chương trình hợp tác hạ tầng quy mô chưa từng có. Theo đó, các mô hình Apple Intelligence và Gemini thế hệ tiếp theo sẽ được tối ưu hóa riêng biệt trên hệ sinh thái cụm máy chủ DGX Cloud của NVIDIA.\n\nViệc cả Apple và Google lựa chọn kiến trúc của NVIDIA đã dập tắt mọi nghi ngờ về việc các hãng công nghệ lớn có thể tự phát triển chip ASIC riêng để thay thế hoàn toàn GPU NVIDIA.\n\n'Sức mạnh thực sự của NVIDIA nằm ở con hào phần mềm CUDA đã tích lũy suốt 20 năm qua', chuyên gia phân tích nhận định."
  },
  {
    id: "nvda-9",
    title: "Góc nhìn định giá P/E 54.5x của NVIDIA: Cân bằng giữa tốc độ tăng trưởng EPS và dòng tiền tự do",
    summary: "Các nhà quản lý quỹ thảo luận về mức định giá hiện tại của NVDA khi cổ phiếu vượt mốc $210, ghi nhận mức PEG 0.78x vẫn nằm trong vùng hợp lý nhưng lưu ý tính biến động ngắn hạn.",
    source: "Bloomberg Analysis",
    category: "market",
    publishedAt: "2026-09-27T13:40:00Z",
    symbols: ["NVDA", "QQQ"],
    sentiment: "neutral",
    content: "Sau chuỗi ngày bứt phá mạnh mẽ đưa vốn hóa vượt $5.150 tỷ USD, các chuyên gia định giá tài sản tại Phố Wall đang có những đánh giá đa chiều về mặt bằng giá của cổ phiếu NVIDIA (NVDA).\n\nMặc dù hệ số P/E hiện tại ở mức 54.5x cao hơn so với trung bình chỉ số S&P 500, song tỷ số PEG (định giá trên tốc độ tăng trưởng lợi nhuận) chỉ ở mức 0.78x nhờ đà tăng trưởng lợi nhuận ròng hơn 150% YoY.\n\nCác chuyên gia khuyến nghị nhà đầu tư cá nhân nên duy trì chiến lược phân bổ vốn có kỷ luật, cân nhắc tái cân bằng danh mục định kỳ và tránh tâm lý mua đuổi FOMO trong các phiên biến động mạnh."
  },
  {
    id: "nvda-10",
    title: "Dòng tiền tổ chức mua ròng kỷ lục: Các quỹ ETF công nghệ (QQQ, SMH) gom thêm $4.2 tỷ cổ phiếu NVDA trong tuần",
    summary: "Dữ liệu dòng vốn tuần từ Morningstar cho thấy các quỹ hưu trí và định chế tài chính toàn cầu đang gia tăng tỷ trọng NVDA lên mức trần cho phép trong danh mục đầu tư tăng trưởng.",
    source: "Financial Times",
    category: "market",
    publishedAt: "2026-09-27T10:00:00Z",
    symbols: ["NVDA", "QQQ", "SPY"],
    sentiment: "bullish",
    content: "Theo báo cáo thống kê dòng vốn mới nhất, cổ phiếu NVIDIA (NVDA) tiếp tục là thỏi nam châm hút ròng tiền lớn nhất trên thị trường chứng khoán Mỹ với hơn 4.2 tỷ USD giá trị mua ròng chỉ trong tuần giao dịch vừa qua.\n\nSự bứt phá kỹ thuật vượt vùng cản tâm lý $200 đã kích hoạt hàng loạt lệnh mua tự động từ các quỹ định lượng (Quant Funds) và các quỹ tương hỗ bám sát chỉ số S&P 500 và Nasdaq 100.\n\nĐáng chú ý, tỷ lệ nắm giữ của các cổ đông nội bộ và ban lãnh đạo NVIDIA vẫn duy trì ở mức cao, thể hiện niềm tin tuyệt đối vào tương lai dài hạn của công ty."
  },
  {
    id: "nvda-11",
    title: "Báo cáo chuỗi cung ứng CoWoS: TSMC tăng tốc mở rộng công suất, kỳ vọng giải tỏa áp lực giao hàng cuối 2027",
    summary: "TSMC xác nhận tiến độ vận hành các phân xưởng đóng gói chip tiên tiến mới đang diễn ra đúng kế hoạch, hỗ trợ nâng sản lượng máy chủ Blackwell xuất xưởng cho NVIDIA trong các quý tới.",
    source: "Reuters Tech",
    category: "technology",
    publishedAt: "2026-09-26T15:30:00Z",
    symbols: ["NVDA"],
    sentiment: "neutral",
    content: "Báo cáo ngành bán dẫn mới nhất từ Đài Loan cho thấy đối tác sản xuất gia công TSMC đang đẩy mạnh năng lực đóng gói vi mạch 3D CoWoS nhằm đáp ứng nhu cầu tăng vọt từ các dòng chip Blackwell của NVIDIA.\n\nDù tình trạng khan hiếm nguồn cung vẫn tồn tại ở thời điểm hiện tại, dự kiến nguồn cung sẽ dần tiến tới điểm cân bằng khi hai cơ sở đóng gói mới đi vào hoạt động thương mại vào giữa năm 2027.\n\nNVIDIA cũng đang tích cực mở rộng hợp tác thử nghiệm với các nhà cung cấp đóng gói thứ cấp như ASE Technology và Amkor để đa dạng hóa nguồn cung và giảm thiểu rủi ro tập trung."
  },
  {
    id: "1",
    title: "NVIDIA chính thức gia nhập câu lạc bộ $5.000 tỷ USD vốn hóa, thiết lập cột mốc vĩ đại nhất lịch sử",
    summary: "Cổ phiếu NVDA bứt phá vượt mốc $210, đưa vốn hóa thị trường của tập đoàn dẫn đầu AI vượt ngưỡng 5.150 tỷ USD — kỷ lục vô tiền khoáng hậu trong lịch sử tài chính toàn cầu.",
    source: "Bloomberg",
    category: "earnings",
    publishedAt: "2026-09-29T17:45:00Z",
    symbols: ["NVDA", "QQQ", "SPY"],
    sentiment: "bullish",
    content: "Phiên giao dịch ngày 29/09/2026 đã chính thức đi vào biên niên sử của thị trường chứng khoán Phố Wall khi tập đoàn NVIDIA (NASDAQ: NVDA) trở thành doanh nghiệp đầu tiên trong lịch sử nhân loại đạt giá trị vốn hóa vượt mốc 5.150 tỷ USD.\n\nSự thăng hoa này được thúc đẩy bởi dòng tiền khổng lồ của các định chế tài chính toàn cầu và sự xác nhận rằng toàn bộ công suất của siêu chip Blackwell B200 và GB200 NVL72 đã cháy hàng đến hết năm 2027. Doanh thu trung tâm dữ liệu tăng vọt cùng biên lợi nhuận gộp 75.8% biến NVIDIA thành cỗ máy sinh tiền mặt chưa từng có.\n\n'Chúng ta đang chứng kiến một cuộc cách mạng công nghiệp lần thứ tư, và NVIDIA chính là nhà máy điện của kỷ nguyên này', giám đốc chiến lược tại Phố Wall bình luận."
  },
  {
    id: "2",
    title: "Fed giữ nguyên lãi suất điều hành, chờ đợi thêm tín hiệu từ lạm phát",
    summary: "Cục Dự trữ Liên bang Mỹ (Fed) quyết định giữ nguyên lãi suất quỹ liên bang ở phạm vi hiện tại, nhấn mạnh lộ trình nới lỏng chính sách sẽ phụ thuộc vào dữ liệu kinh tế sắp tới.",
    source: "Reuters",
    category: "macro",
    publishedAt: "2026-09-29T12:00:00Z",
    symbols: ["SPY", "QQQ"],
    sentiment: "neutral",
    content: "Ủy ban Thị trường Mở Liên bang (FOMC) đã biểu quyết giữ nguyên lãi suất cơ bản ở mức 5.25% - 5.50% sau cuộc họp chính sách kéo dài hai ngày. Quyết định này hoàn toàn trùng khớp với kỳ vọng của đa số các chuyên gia kinh tế trên thị trường.\n\nChủ tịch Fed Jerome Powell phát biểu tại cuộc họp báo rằng lạm phát đã có dấu hiệu hạ nhiệt nhưng các nhà hoạch định chính sách cần thêm bằng chứng vững chắc trước khi cân nhắc đợt cắt giảm lãi suất đầu tiên trong chu kỳ.\n\nCác chỉ số chính của chứng khoán Mỹ như S&P 500 và Nasdaq hầu như biến động nhẹ và dao động trong biên độ hẹp sau tuyên bố này."
  },
  {
    id: "3",
    title: "Apple đẩy mạnh tích hợp Apple Intelligence sâu vào hệ sinh thái iOS và Mac",
    summary: "Apple công bố bước tiến lớn trong chiến lược AI với việc tối ưu hóa chip dòng M và đưa các tính năng tạo sinh thông minh trực tiếp lên thiết bị thế hệ mới.",
    source: "TechCrunch",
    category: "technology",
    publishedAt: "2026-09-29T10:15:00Z",
    symbols: ["AAPL"],
    sentiment: "bullish",
    content: "Tại sự kiện công nghệ mới nhất, Apple đã giới thiệu các tính năng nâng cấp cho bộ giải pháp Apple Intelligence, cho phép xử lý các mô hình ngôn ngữ lớn ngay trên chip M-series và A-series với độ trễ thấp và bảo mật cao.\n\nĐộng thái này nhận được phản hồi rất tích cực từ giới phân tích công nghệ, khi người dùng không cần phải chia sẻ dữ liệu nhạy cảm lên đám mây mà vẫn có thể trải nghiệm các tác vụ trợ lý ảo tiên tiến.\n\nNhiều nhà phân tích kỳ vọng chu kỳ nâng cấp thiết bị của người dùng iPhone và Mac sẽ tăng tốc mạnh mẽ trong các quý cuối năm."
  },
  {
    id: "4",
    title: "Tesla triệu hồi 200,000 xe do lỗi phần mềm Autopilot và áp lực cạnh tranh gia tăng",
    summary: "Cơ quan An toàn Giao thông Quốc gia Mỹ (NHTSA) yêu cầu Tesla cập nhật phần mềm khắc phục cảnh báo trên Model 3 và Model Y, trong bối cảnh biên lợi nhuận tiếp tục chịu sức ép.",
    source: "CNBC",
    category: "market",
    publishedAt: "2026-09-29T08:45:00Z",
    symbols: ["TSLA"],
    sentiment: "bearish",
    content: "Tesla thông báo triệu hồi hơn 200.000 phương tiện thuộc các dòng Model 3 và Model Y để cập nhật phần mềm liên quan đến hệ thống tự hành Autopilot sau cuộc điều tra an toàn kéo dài từ phía NHTSA.\n\nBên cạnh thách thức về mặt pháp lý và an toàn giao thông, hãng xe điện của Elon Musk cũng đang đối mặt với cuộc chiến giá gay gắt tại thị trường Trung Quốc và châu Âu, khiến biên lợi nhuận gộp mảng ô tô sụt giảm đáng kể.\n\nCổ phiếu TSLA chịu áp lực bán ngay đầu phiên giao dịch và giảm hơn 3% khi các quỹ đầu tư tái cơ cấu danh mục ngắn hạn."
  },
  {
    id: "5",
    title: "Giá dầu WTI giảm mạnh do tồn kho thương mại Mỹ tăng vượt dự báo",
    summary: "Giá dầu thô thế giới giảm hơn 3% sau khi EIA công bố số liệu tồn kho bất ngờ tăng, dấy lên lo ngại về tốc độ hồi phục nhu cầu năng lượng toàn cầu.",
    source: "Reuters",
    category: "energy",
    publishedAt: "2026-09-28T16:30:00Z",
    symbols: ["XOM"],
    sentiment: "bearish",
    content: "Thị trường dầu mỏ thế giới ghi nhận phiên bán tháo đáng chú ý khi giá dầu thô ngọt nhẹ WTI rơi xuống dưới ngưỡng hỗ trợ kỹ thuật quan trọng. Báo cáo định kỳ từ EIA cho thấy tồn kho dầu thô thương mại của Mỹ tăng thêm 4.2 triệu thùng trong tuần qua, trái ngược hoàn toàn với dự báo giảm nhẹ của giới phân tích.\n\nÁp lực tăng nguồn cung từ các nước ngoài khối OPEC+ cùng với tín hiệu tăng trưởng kinh tế chậm lại ở một số khu vực tiêu thụ lớn đã tạo áp lực giảm giá rõ rệt lên các cổ phiếu năng lượng như Exxon Mobil.\n\nCác chuyên gia khuyến nghị nhà đầu tư theo dõi chặt chẽ quyết định sản lượng trong cuộc họp sắp tới của OPEC+."
  },
  {
    id: "6",
    title: "Berkshire Hathaway duy trì lượng tiền mặt kỷ lục, kiên nhẫn chờ cơ hội định giá",
    summary: "Báo cáo quý cho thấy tập đoàn của Warren Buffett tiếp tục nắm giữ lượng tiền mặt kỷ lục hơn 180 tỷ USD trong khi thu hẹp một số khoản đầu tư cổ phiếu ngắn hạn.",
    source: "Wall Street Journal",
    category: "market",
    publishedAt: "2026-09-28T15:00:00Z",
    symbols: ["BRK.B"],
    sentiment: "neutral",
    content: "Tập đoàn đầu tư Berkshire Hathaway vừa công bố báo cáo tài chính quý phản ánh vị thế thận trọng nhưng kiên định của huyền thoại đầu tư Warren Buffett. Lượng tiền mặt và tín phiếu kho bạc ngắn hạn của công ty đạt mức kỷ lục mới, mang lại nguồn lợi tức phi rủi ro hấp dẫn trong môi trường lãi suất hiện hành.\n\nBerkshire tiếp tục giữ vững danh mục các doanh nghiệp cốt lõi như bảo hiểm, đường sắt và năng lượng, trong khi không vội vã thực hiện các thương vụ thâu tóm lớn khi định giá thị trường chung còn ở mức cao.\n\nCổ phiếu BRK.B biến động đi ngang quanh vùng giá cân bằng, thể hiện sự tin tưởng ổn định từ các cổ đông dài hạn."
  },
  {
    id: "7",
    title: "JPMorgan Chase nâng dự báo lợi nhuận năm 2026 nhờ thu nhập lãi thuần ổn định",
    summary: "Ngân hàng lớn nhất nước Mỹ nâng triển vọng doanh thu và lợi nhuận cả năm nhờ hoạt động ngân hàng đầu tư phục hồi và biên thu nhập lãi thuần duy trì ở mức cao.",
    source: "Financial Times",
    category: "banking",
    publishedAt: "2026-09-28T14:00:00Z",
    symbols: ["JPM"],
    sentiment: "bullish",
    content: "JPMorgan Chase vừa công bố bản cập nhật triển vọng kinh doanh quý với nhiều điểm sáng đáng kể. Ban lãnh đạo ngân hàng nâng dự báo thu nhập lãi thuần (NII) cho cả năm tài chính, phản ánh khả năng quản lý danh mục tín dụng vượt trội trong môi trường lãi suất neo cao.\n\nHoạt động tư vấn M&A và bảo lãnh phát hành cổ phiếu, trái phiếu của mảng ngân hàng đầu tư cũng ghi nhận doanh số khởi sắc sau giai đoạn trầm lắng kéo dài.\n\nCEO Jamie Dimon bày tỏ sự lạc quan thận trọng về sức khỏe bảng cân đối của người tiêu dùng Mỹ, đồng thời khẳng định ngân hàng duy trì bộ đệm vốn vững chắc."
  },
  {
    id: "8",
    title: "Meta đối mặt với cuộc điều tra quy định mới về cạnh tranh tại Liên minh Châu Âu",
    summary: "Ủy ban Châu Âu mở cuộc điều tra tuân thủ Đạo luật Thị trường Kỹ thuật số (DMA) đối với mô hình quảng cáo và chính sách chia sẻ dữ liệu của Meta Platforms.",
    source: "Bloomberg",
    category: "technology",
    publishedAt: "2026-09-28T12:30:00Z",
    symbols: ["META"],
    sentiment: "bearish",
    content: "Cơ quan quản lý chống độc quyền của Liên minh Châu Âu (EU) đã chính thức mở đợt thanh tra mới nhắm vào các nền tảng mạng xã hội thuộc sở hữu của Meta Platforms bao gồm Facebook và Instagram.\n\nNội dung điều tra tập trung vào việc liệu mô hình đăng ký trả phí để không xem quảng cáo có thực sự đảm bảo quyền riêng tư và lựa chọn công bằng cho người tiêu dùng theo quy định DMA hay không.\n\nNếu bị xác định vi phạm, công ty có thể đối mặt với mức phạt tài chính đáng kể, khiến tâm lý giới đầu tư đối với cổ phiếu META trở nên thận trọng hơn."
  },
  {
    id: "9",
    title: "Microsoft đầu tư thêm $10 tỷ mở rộng trung tâm dữ liệu AI trên toàn cầu",
    summary: "Tập đoàn công bố kế hoạch đầu tư quy mô lớn vào hạ tầng máy chủ AI Azure nhằm đáp ứng nhu cầu tăng vọt từ các khách hàng doanh nghiệp sử dụng Copilot.",
    source: "The Verge",
    category: "technology",
    publishedAt: "2026-09-28T11:20:00Z",
    symbols: ["MSFT"],
    sentiment: "bullish",
    content: "Microsoft tiếp tục khẳng định cam kết dẫn đầu làn sóng điện toán đám mây AI thông qua gói đầu tư bổ sung trị giá 10 tỷ USD vào các trung tâm dữ liệu tại Bắc Mỹ và châu Âu.\n\nSố lượng doanh nghiệp đăng ký thuê bao Microsoft 365 Copilot đã tăng gấp 3 lần so với quý trước, tạo ra nguồn doanh thu định kỳ bền vững cho tập đoàn.\n\nThỏa thuận hợp tác chiến lược cùng các nhà cung ứng phần cứng hàng đầu giúp Microsoft đảm bảo đủ năng lực tính toán phục vụ các mô hình ngôn ngữ thế hệ mới."
  },
  {
    id: "10",
    title: "Alphabet công bố lộ trình phát triển mô hình Gemini thế hệ mới cho doanh nghiệp",
    summary: "Google giới thiệu các cải tiến kiến trúc cho dòng mô hình Gemini, tập trung vào khả năng xử lý ngữ cảnh dài và tối ưu hóa chi phí điện toán.",
    source: "TechCrunch",
    category: "technology",
    publishedAt: "2026-09-28T10:00:00Z",
    symbols: ["GOOGL"],
    sentiment: "neutral",
    content: "Tại hội nghị thường niên dành cho đối tác doanh nghiệp, Alphabet (Google) đã công bố bản cập nhật lộ trình công nghệ cho hệ sinh thái trí tuệ nhân tạo Gemini.\n\nPhiên bản mới mang lại khả năng phân tích tài liệu và mã nguồn phức tạp với độ dài cửa sổ ngữ cảnh lên đến hàng triệu token, đồng thời giảm thiểu mức tiêu thụ tài nguyên phần cứng.\n\nThị trường phản ứng điềm tĩnh trước thông tin này khi các chuyên gia đánh giá Alphabet đang theo đuổi chiến lược phát triển ổn định, cân bằng giữa đổi mới kỹ thuật và hiệu quả thương mại."
  },
  {
    id: "11",
    title: "UnitedHealth chịu áp lực chi phí y tế gia tăng trong bối cảnh tỷ lệ sử dụng dịch vụ cao",
    summary: "Tập đoàn bảo hiểm y tế lớn nhất nước Mỹ ghi nhận tỷ lệ chi phí y tế tăng cao hơn kỳ vọng, ảnh hưởng tiêu cực đến biên lợi nhuận hoạt động ngắn hạn.",
    source: "Wall Street Journal",
    category: "market",
    publishedAt: "2026-09-28T08:30:00Z",
    symbols: ["UNH"],
    sentiment: "bearish",
    content: "UnitedHealth Group thông báo tỷ lệ chi trả bồi thường y tế trong quý tăng lên mức 84.3%, cao hơn đáng kể so với mức mục tiêu ban đầu do số lượng ca phẫu thuật không khẩn cấp và nhu cầu chăm sóc sức khỏe ngoại trú của bệnh nhân Medicare tăng vọt.\n\nÁp lực chi phí y tế tăng khiến ban lãnh đạo phải điều chỉnh lại biên độ kỳ vọng lợi nhuận thuần trong ngắn hạn, đồng thời rà soát lại mức phí bảo hiểm cho kỳ gia hạn hợp đồng tiếp theo.\n\nCổ phiếu UNH giảm điểm và kéo lùi nhóm ngành bảo hiểm y tế trên sàn giao dịch New York."
  },
  {
    id: "12",
    title: "Amazon đạt kết quả kinh doanh quý sát dự báo, mở rộng mạng lưới logistics tự động",
    summary: "Doanh thu thương mại điện tử và dịch vụ đám mây AWS của Amazon tăng trưởng ổn định theo đúng dự kiến, công ty tiếp tục tối ưu hóa chi phí vận hành kho bãi.",
    source: "CNBC",
    category: "earnings",
    publishedAt: "2026-09-27T18:00:00Z",
    symbols: ["AMZN"],
    sentiment: "neutral",
    content: "Amazon vừa công bố báo cáo tài chính quý với doanh thu và lợi nhuận ròng sát với dự báo trung bình của các hãng phân tích. Mảng đám mây AWS duy trì tốc độ mở rộng hai con số, trong khi mảng bán lẻ trực tuyến tại thị trường Bắc Mỹ cho thấy sự ổn định về mặt dòng tiền.\n\nGiám đốc Tài chính của Amazon cho biết công ty đang tập trung vào việc tự động hóa các trung tâm xử lý đơn hàng bằng robot thế hệ mới để nâng cao năng suất giao hàng trong ngày.\n\nCổ phiếu AMZN dao động quanh mức tham chiếu trong phiên giao dịch sau khi thị trường đánh giá toàn diện các số liệu."
  },
  {
    id: "13",
    title: "Bitcoin vượt mốc $100,000 lần đầu tiên trong lịch sử tài chính số",
    summary: "Dòng tiền từ các quỹ ETF giao ngay và sự tham gia mạnh mẽ của các định chế tài chính truyền thống đưa Bitcoin thiết lập cột mốc lịch sử mới.",
    source: "CoinDesk",
    category: "crypto",
    publishedAt: "2026-09-27T16:00:00Z",
    symbols: [],
    sentiment: "bullish",
    content: "Thị trường tài sản số vừa chứng kiến thời khắc lịch sử khi giá Bitcoin chính thức vượt ngưỡng 100.000 USD trên các sàn giao dịch lớn trên toàn cầu.\n\nKể từ khi các quỹ Bitcoin ETF giao ngay được phê duyệt tại Mỹ, dòng vốn tổ chức liên tục chảy vào thị trường, biến Bitcoin thành một lớp tài sản phòng hộ được công nhận rộng rãi.\n\nThanh khoản giao dịch toàn thị trường tăng vọt, kéo theo sự bứt phá của nhiều đồng tiền mã hóa lớn khác và các cổ phiếu liên quan đến công nghệ blockchain."
  },
  {
    id: "14",
    title: "Thị trường tiền mã hóa điều chỉnh kỹ thuật sau chuỗi ngày tăng nóng",
    summary: "Hơn 400 triệu USD vị thế phái sinh bị thanh lý trong 24 giờ qua khi áp lực chốt lời ngắn hạn xuất hiện tại các vùng cản tâm lý mạnh.",
    source: "CoinDesk",
    category: "crypto",
    publishedAt: "2026-09-27T14:30:00Z",
    symbols: [],
    sentiment: "bearish",
    content: "Sau khi lập đỉnh cao mới, thị trường tài sản kỹ thuật số đã bước vào nhịp điều chỉnh kỹ thuật diện rộng. Áp lực chốt lời từ các nhà đầu tư ngắn hạn cùng với sự gia tăng đòn bẩy trên các sàn giao dịch tương lai đã kích hoạt làn sóng thanh lý vị thế long quy mô lớn.\n\nCác chuyên gia phân tích on-chain lưu ý rằng dòng tiền từ các nhà đầu tư tổ chức dài hạn vẫn giữ nguyên vị thế, song biến động giá trong ngắn hạn có thể tiếp tục tăng cao khi thị trường tìm kiếm vùng hỗ trợ mới.\n\nChỉ số tâm lý thị trường Crypto Fear & Greed tạm thời hạ nhiệt từ vùng Tham lam cực độ về mức Thận trọng."
  },
  {
    id: "15",
    title: "Visa ghi nhận khối lượng thanh toán toàn cầu tăng trưởng ổn định trong quý",
    summary: "Báo cáo hoạt động mạng lưới của Visa cho thấy chi tiêu du lịch quốc tế và giao dịch xuyên biên giới giữ nhịp độ tăng trưởng đều đặn.",
    source: "Reuters",
    category: "banking",
    publishedAt: "2026-09-27T12:00:00Z",
    symbols: ["V"],
    sentiment: "neutral",
    content: "Tập đoàn thanh toán điện tử Visa công bố khối lượng thanh toán toàn cầu tăng 8% so với cùng kỳ năm ngoái, chủ yếu nhờ vào sự phục hồi bền vững của ngành du lịch và hàng không quốc tế.\n\nChi tiêu tiêu dùng qua thẻ tín dụng và thẻ ghi nợ nội địa tại các thị trường phát triển duy trì xu hướng lành mạnh, không có dấu hiệu suy giảm đột ngột về khả năng trả nợ của chủ thẻ.\n\nCổ phiếu Visa tiếp tục diễn biến ổn định trong biên độ hẹp, phản ánh đúng đặc tính phòng thủ và vị thế đầu ngành thanh toán."
  },
  {
    id: "16",
    title: "Walt Disney ghi nhận mảng phát trực tuyến có lãi sớm hơn dự kiến",
    summary: "Dịch vụ Disney+ và Hulu lần đầu tiên mang lại lợi nhuận hoạt động dương kết hợp doanh thu phòng vé khởi sắc nhờ các bom tấn mới.",
    source: "Financial Times",
    category: "market",
    publishedAt: "2026-09-27T10:15:00Z",
    symbols: ["DIS"],
    sentiment: "bullish",
    content: "Tập đoàn giải trí Walt Disney công bố mảng kinh doanh trực tiếp đến người tiêu dùng (Direct-to-Consumer) bao gồm Disney+ và Hulu đã chính thức có lãi, hoàn thành mục tiêu chiến lược trước thời hạn dự kiến một quý.\n\nChiến lược siết chặt chi phí sản xuất nội dung cùng việc điều chỉnh giá gói dịch vụ có quảng cáo đã phát huy hiệu quả rõ nét. Bên cạnh đó, lượng khách tham quan tại các công viên giải trí chủ đề vẫn giữ mức doanh thu ấn tượng.\n\nCổ phiếu DIS bật tăng hơn 4% sau thông báo, phản ánh sự giải tỏa tâm lý đối với giới đầu tư dài hạn."
  },
  {
    id: "17",
    title: "Báo cáo việc làm Mỹ sát kỳ vọng, thị trường lao động duy trì trạng thái cân bằng",
    summary: "Số lượng việc làm phi nông nghiệp mới tạo ra đạt 175,000, tỷ lệ thất nghiệp ở mức 3.9%, củng cố kịch bản hạ cánh mềm của nền kinh tế.",
    source: "Bloomberg",
    category: "macro",
    publishedAt: "2026-09-27T08:30:00Z",
    symbols: ["SPY"],
    sentiment: "neutral",
    content: "Báo cáo việc làm phi nông nghiệp (Non-Farm Payrolls) do Bộ Lao động Mỹ vừa công bố cho thấy 175.000 việc làm mới được bổ sung trong tháng vừa qua, xấp xỉ mức dự báo 180.000 của các nhà kinh tế học.\n\nTăng trưởng tiền lương theo giờ hạ nhiệt nhẹ về mức 3.8% so với cùng kỳ năm ngoái, giảm bớt áp lực vòng xoáy lương - giá nhưng vẫn đủ hỗ trợ sức mua của các hộ gia đình.\n\nCác thị trường tài chính phản ứng tích cực với số liệu này khi khả năng nền kinh tế Mỹ đạt trạng thái hạ cánh mềm (soft landing) ngày càng được củng cố vững chắc."
  },
  {
    id: "18",
    title: "Khối quỹ ETF toàn cầu ghi nhận lượng vốn rót ròng kỷ lục vào nhóm cổ phiếu tăng trưởng",
    summary: "Dòng vốn đầu tư cá nhân và tổ chức tiếp tục đổ mạnh vào các quỹ chỉ số SPY và QQQ, phản ánh niềm tin vững chắc vào triển vọng dài hạn.",
    source: "Reuters",
    category: "market",
    publishedAt: "2026-09-26T15:00:00Z",
    symbols: ["SPY", "QQQ"],
    sentiment: "bullish",
    content: "Dữ liệu dòng vốn tuần từ các công ty nghiên cứu thị trường cho thấy các quỹ ETF theo dõi chỉ số S&P 500 và Nasdaq 100 đã thu hút hơn 8.5 tỷ USD vốn rót ròng chỉ trong 5 ngày giao dịch vừa qua.\n\nSự tham gia mạnh mẽ của dòng tiền đầu tư thụ động đã hỗ trợ vững chắc cho mặt bằng giá của các cổ phiếu vốn hóa lớn, ngay cả trong những phiên thị trường rung lắc điều chỉnh.\n\nCác nhà quản lý quỹ nhận định tâm lý chấp nhận rủi ro (risk-on) đang dần quay trở lại khi triển vọng kinh tế vĩ mô ổn định hơn và lợi nhuận doanh nghiệp tiếp tục khả quan."
  },
];

export const ECONOMIC_CALENDAR: EconomicEvent[] = [
  { id: "1", time: "08:30", currency: "USD", impact: "high", event: "Core CPI m/m", actual: "0.3%", forecast: "0.3%", previous: "0.4%" },
  { id: "2", time: "08:30", currency: "USD", impact: "high", event: "CPI m/m", actual: "0.4%", forecast: "0.4%", previous: "0.4%" },
  { id: "3", time: "08:30", currency: "USD", impact: "high", event: "CPI y/y", actual: "3.4%", forecast: "3.4%", previous: "3.5%" },
  { id: "4", time: "10:00", currency: "USD", impact: "low", event: "Cleveland CPI m/m", actual: "", forecast: "", previous: "0.3%" },
  { id: "5", time: "10:30", currency: "USD", impact: "medium", event: "Crude Oil Inventories", actual: "-2.5M", forecast: "-1.3M", previous: "7.3M" },
  { id: "6", time: "13:00", currency: "USD", impact: "high", event: "10-y Bond Auction", actual: "4.48|2.5", forecast: "", previous: "4.56|2.5" },
  { id: "7", time: "18:45", currency: "NZD", impact: "high", event: "Visitor Arrivals m/m", actual: "", forecast: "", previous: "3.8%" },
];

export function getStockBySymbol(symbol: string): StockQuote | undefined {
  if (!symbol) return undefined;
  const upper = symbol.toUpperCase().trim();
  const normalizedNoSlash = upper.replace(/[\/\-_]/g, "");

  // 1. Direct match in STOCKS
  const stock = STOCKS.find((s) => s.symbol.toUpperCase() === upper);
  if (stock) return stock;

  // 2. Direct match in ETFS
  const etf = ETFS.find((s) => s.symbol.toUpperCase() === upper);
  if (etf) return etf;

  // 3. Direct match in CRYPTOS
  const crypto = CRYPTOS.find((s) => s.symbol.toUpperCase() === upper);
  if (crypto) return crypto;

  // 4. Match in FOREX (support both EURUSD and EUR/USD)
  const fx = FOREX.find((s) => s.symbol.toUpperCase() === upper || s.symbol.replace(/[\/\-_]/g, "") === normalizedNoSlash);
  if (fx) return fx;

  // 5. Match in INDICES_STOCKS
  const idxMap: Record<string, string> = { "^GSPC": "SPX", "^IXIC": "IXIC", "^DJI": "DJI", "^VIX": "VIX" };
  const mappedIdx = idxMap[upper] || upper;
  const idx = INDICES_STOCKS.find((s) => s.symbol.toUpperCase() === mappedIdx);
  if (idx) return idx;

  // 6. Check SP500_METADATA and generate deterministic complete quote
  const meta = SP500_METADATA.find(
    (m) => m.symbol.toUpperCase() === upper || m.requestSymbol.toUpperCase() === upper
  );
  if (meta) {
    return generateQuoteFromMetadata(meta);
  }

  return undefined;
}

export function getGainers(): StockQuote[] {
  return [...STOCKS].sort((a, b) => b.day1 - a.day1).slice(0, 5);
}

export function getLosers(): StockQuote[] {
  return [...STOCKS].sort((a, b) => a.day1 - b.day1).slice(0, 5);
}

export function getMostActive(): StockQuote[] {
  return [...STOCKS].sort((a, b) => b.volume - a.volume).slice(0, 5);
}

NEWS.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

export function getTrending(): StockQuote[] {
  return [STOCKS[2], STOCKS[7], STOCKS[0], STOCKS[5], STOCKS[1]]; // NVDA, TSLA, AAPL, AMZN, MSFT
}

export function getNewsForSymbol(symbol: string): NewsItem[] {
  return NEWS
    .filter((n) => n.symbols.includes(symbol))
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
}

export function getNewsById(id: string): NewsItem | undefined {
  return NEWS.find((n) => n.id === id);
}