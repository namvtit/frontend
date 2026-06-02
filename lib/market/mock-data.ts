// Mock market data for MVP
export interface StockQuote {
  symbol: string; name: string; price: number; change: number; changePercent: number;
  exchange: string; currency: string; marketCap: number; volume: number;
  peRatio: number; eps: number; dividendYield: number; beta: number;
  high52w: number; low52w: number; sector: string; sparkline: number[];
  day1: number; week1: number; month1: number; ytd: number;
}

export interface NewsItem {
  id: string; title: string; summary: string; source: string; category: string;
  publishedAt: string; symbols: string[]; sentiment: "bullish" | "bearish" | "neutral";
  imageUrl?: string; content?: string;
}

export interface MarketIndex {
  symbol: string; name: string; value: number; change: number; changePercent: number;
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
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let sparkSeed = 1;
function spark(n: number, trend: "up"|"down"|"flat"): number[] {
  const rand = mulberry32(sparkSeed++);
  const d: number[] = []; let v = 50 + rand()*50;
  for (let i = 0; i < n; i++) { v = Math.max(10, v + (rand()-.5)*10 + (trend==="up"?1.5:trend==="down"?-1.5:0)); d.push(v); }
  return d;
}

export const INDICES: MarketIndex[] = [
  { symbol: "SPX", name: "S&P 500", value: 5892.58, change: 42.36, changePercent: 0.72 },
  { symbol: "IXIC", name: "Nasdaq", value: 19112.32, change: 187.54, changePercent: 0.99 },
  { symbol: "DJI", name: "Dow Jones", value: 42876.12, change: -23.45, changePercent: -0.05 },
  { symbol: "VIX", name: "VIX", value: 14.82, change: -0.67, changePercent: -4.33 },
];

export const STOCKS: StockQuote[] = [
  { symbol:"AAPL",name:"Apple Inc.",price:213.25,change:3.12,changePercent:1.48,exchange:"NASDAQ",currency:"USD",marketCap:3.28e12,volume:54200000,peRatio:33.2,eps:6.42,dividendYield:0.44,beta:1.24,high52w:237.23,low52w:164.08,sector:"Technology",sparkline:spark(20,"up"),day1:1.48,week1:2.1,month1:5.3,ytd:12.4 },
  { symbol:"MSFT",name:"Microsoft Corp.",price:449.52,change:5.67,changePercent:1.28,exchange:"NASDAQ",currency:"USD",marketCap:3.34e12,volume:22100000,peRatio:36.8,eps:12.21,dividendYield:0.72,beta:0.89,high52w:468.35,low52w:362.90,sector:"Technology",sparkline:spark(20,"up"),day1:1.28,week1:1.9,month1:4.7,ytd:9.8 },
  { symbol:"NVDA",name:"NVIDIA Corp.",price:135.72,change:8.43,changePercent:6.62,exchange:"NASDAQ",currency:"USD",marketCap:3.32e12,volume:312000000,peRatio:64.5,eps:2.10,dividendYield:0.02,beta:1.68,high52w:153.13,low52w:47.32,sector:"Technology",sparkline:spark(20,"up"),day1:6.62,week1:12.3,month1:28.5,ytd:89.2 },
  { symbol:"GOOGL",name:"Alphabet Inc.",price:176.89,change:-1.23,changePercent:-0.69,exchange:"NASDAQ",currency:"USD",marketCap:2.18e12,volume:24300000,peRatio:24.1,eps:7.34,dividendYield:0.45,beta:1.06,high52w:191.75,low52w:130.67,sector:"Technology",sparkline:spark(20,"down"),day1:-0.69,week1:-1.2,month1:3.1,ytd:7.5 },
  { symbol:"AMZN",name:"Amazon.com Inc.",price:197.12,change:2.34,changePercent:1.20,exchange:"NASDAQ",currency:"USD",marketCap:2.06e12,volume:41200000,peRatio:58.3,eps:3.38,dividendYield:0,beta:1.15,high52w:201.20,low52w:151.61,sector:"Consumer Cyclical",sparkline:spark(20,"up"),day1:1.20,week1:3.1,month1:8.2,ytd:15.6 },
  { symbol:"META",name:"Meta Platforms Inc.",price:523.45,change:-4.56,changePercent:-0.86,exchange:"NASDAQ",currency:"USD",marketCap:1.33e12,volume:16800000,peRatio:25.7,eps:20.37,dividendYield:0.38,beta:1.22,high52w:544.20,low52w:390.42,sector:"Technology",sparkline:spark(20,"down"),day1:-0.86,week1:-2.1,month1:1.4,ytd:6.3 },
  { symbol:"TSLA",name:"Tesla Inc.",price:278.98,change:12.45,changePercent:4.67,exchange:"NASDAQ",currency:"USD",marketCap:890e9,volume:98700000,peRatio:72.1,eps:3.87,dividendYield:0,beta:2.05,high52w:358.64,low52w:138.80,sector:"Consumer Cyclical",sparkline:spark(20,"up"),day1:4.67,week1:8.9,month1:-5.3,ytd:42.1 },
  { symbol:"BRK.B",name:"Berkshire Hathaway",price:472.30,change:1.20,changePercent:0.25,exchange:"NYSE",currency:"USD",marketCap:1.03e12,volume:3200000,peRatio:10.2,eps:46.30,dividendYield:0,beta:0.56,high52w:491.57,low52w:393.97,sector:"Financials",sparkline:spark(20,"flat"),day1:0.25,week1:0.8,month1:2.1,ytd:5.4 },
  { symbol:"JPM",name:"JPMorgan Chase",price:243.67,change:3.89,changePercent:1.62,exchange:"NYSE",currency:"USD",marketCap:699e9,volume:8900000,peRatio:12.8,eps:19.04,dividendYield:2.1,beta:1.08,high52w:256.78,low52w:183.23,sector:"Financials",sparkline:spark(20,"up"),day1:1.62,week1:2.3,month1:5.8,ytd:14.2 },
  { symbol:"V",name:"Visa Inc.",price:312.45,change:1.56,changePercent:0.50,exchange:"NYSE",currency:"USD",marketCap:630e9,volume:6200000,peRatio:31.5,eps:9.92,dividendYield:0.75,beta:0.94,high52w:325.67,low52w:252.70,sector:"Financials",sparkline:spark(20,"up"),day1:0.50,week1:1.1,month1:3.2,ytd:8.7 },
  { symbol:"UNH",name:"UnitedHealth Group",price:487.23,change:-8.34,changePercent:-1.68,exchange:"NYSE",currency:"USD",marketCap:449e9,volume:4100000,peRatio:18.9,eps:25.78,dividendYield:1.5,beta:0.72,high52w:630.73,low52w:436.38,sector:"Healthcare",sparkline:spark(20,"down"),day1:-1.68,week1:-3.2,month1:-8.5,ytd:-15.3 },
  { symbol:"XOM",name:"Exxon Mobil Corp.",price:108.67,change:-0.89,changePercent:-0.81,exchange:"NYSE",currency:"USD",marketCap:458e9,volume:14300000,peRatio:13.5,eps:8.05,dividendYield:3.4,beta:0.82,high52w:126.34,low52w:95.77,sector:"Energy",sparkline:spark(20,"down"),day1:-0.81,week1:-1.5,month1:-4.2,ytd:-7.8 },
  { symbol:"SPY",name:"SPDR S&P 500 ETF",price:587.42,change:4.23,changePercent:0.72,exchange:"AMEX",currency:"USD",marketCap:540e9,volume:67800000,peRatio:0,eps:0,dividendYield:1.25,beta:1.0,high52w:602.48,low52w:493.86,sector:"ETF",sparkline:spark(20,"up"),day1:0.72,week1:1.5,month1:4.1,ytd:11.3 },
  { symbol:"QQQ",name:"Invesco QQQ Trust",price:512.34,change:5.67,changePercent:1.12,exchange:"NASDAQ",currency:"USD",marketCap:280e9,volume:42100000,peRatio:0,eps:0,dividendYield:0.55,beta:1.14,high52w:537.21,low52w:413.07,sector:"ETF",sparkline:spark(20,"up"),day1:1.12,week1:2.3,month1:6.1,ytd:14.7 },
  { symbol:"DIS",name:"Walt Disney Co.",price:112.34,change:1.23,changePercent:1.11,exchange:"NYSE",currency:"USD",marketCap:205e9,volume:9800000,peRatio:38.2,eps:2.94,dividendYield:0.88,beta:1.32,high52w:123.74,low52w:83.91,sector:"Communication",sparkline:spark(20,"up"),day1:1.11,week1:2.8,month1:7.5,ytd:18.3 },
];

export const NEWS: NewsItem[] = [
  { id:"1",title:"NVIDIA đạt doanh thu kỷ lục nhờ nhu cầu AI tăng mạnh",summary:"Doanh thu Q1 của NVIDIA vượt kỳ vọng Wall Street, tăng 262% so với cùng kỳ nhờ nhu cầu chip AI bùng nổ.",source:"Bloomberg",category:"earnings",publishedAt:"2026-05-10T14:30:00Z",symbols:["NVDA"],sentiment:"bullish" },
  { id:"2",title:"Fed giữ nguyên lãi suất, thị trường phản ứng tích cực",summary:"Cục Dự trữ Liên bang Mỹ quyết định giữ nguyên lãi suất, phát tín hiệu có thể cắt giảm trong Q3.",source:"Reuters",category:"macro",publishedAt:"2026-05-10T12:00:00Z",symbols:["SPY","QQQ"],sentiment:"bullish" },
  { id:"3",title:"Apple ra mắt Vision Pro 2 với giá thấp hơn",summary:"Apple công bố thế hệ tiếp theo của Vision Pro với mức giá $2,499, thấp hơn đáng kể so với phiên bản đầu.",source:"TechCrunch",category:"technology",publishedAt:"2026-05-10T10:15:00Z",symbols:["AAPL"],sentiment:"bullish" },
  { id:"4",title:"Tesla triệu hồi 200,000 xe do lỗi phần mềm Autopilot",summary:"NHTSA yêu cầu Tesla triệu hồi một lượng lớn xe Model 3 và Model Y do lỗi trong hệ thống Autopilot.",source:"CNBC",category:"market",publishedAt:"2026-05-10T08:45:00Z",symbols:["TSLA"],sentiment:"bearish" },
  { id:"5",title:"Giá dầu giảm mạnh sau báo cáo tồn kho bất ngờ",summary:"Giá dầu WTI giảm 3.2% sau khi EIA báo cáo tồn kho dầu thô tăng vượt dự kiến.",source:"Reuters",category:"energy",publishedAt:"2026-05-09T16:30:00Z",symbols:["XOM"],sentiment:"bearish" },
  { id:"6",title:"JPMorgan nâng dự báo lợi nhuận năm 2026",summary:"CEO Jamie Dimon cho biết ngân hàng kỳ vọng lợi nhuận ròng tăng 15% trong năm nay nhờ hoạt động giao dịch mạnh.",source:"Financial Times",category:"banking",publishedAt:"2026-05-09T14:00:00Z",symbols:["JPM"],sentiment:"bullish" },
  { id:"7",title:"Microsoft đầu tư thêm $10B vào hạ tầng AI",summary:"Microsoft công bố kế hoạch mở rộng hạ tầng đám mây và AI trên toàn cầu với khoản đầu tư khổng lồ.",source:"The Verge",category:"technology",publishedAt:"2026-05-09T11:20:00Z",symbols:["MSFT"],sentiment:"bullish" },
  { id:"8",title:"Bitcoin vượt $100,000 lần đầu tiên",summary:"Bitcoin chính thức vượt mốc $100,000, đánh dấu cột mốc lịch sử cho thị trường tiền mã hóa.",source:"CoinDesk",category:"crypto",publishedAt:"2026-05-09T09:00:00Z",symbols:[],sentiment:"bullish" },
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
  return STOCKS.find((s) => s.symbol.toUpperCase() === symbol.toUpperCase());
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

export function getTrending(): StockQuote[] {
  return [STOCKS[2], STOCKS[6], STOCKS[0], STOCKS[4], STOCKS[1]]; // NVDA, TSLA, AAPL, AMZN, MSFT
}

export function getNewsForSymbol(symbol: string): NewsItem[] {
  return NEWS.filter((n) => n.symbols.includes(symbol));
}

export function getNewsById(id: string): NewsItem | undefined {
  return NEWS.find((n) => n.id === id);
}
