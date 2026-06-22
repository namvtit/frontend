// Mock market data for MVP
// Base prices updated June 2026 to match real market values
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
  { symbol: "SPX", name: "S&P 500", value: 7500.58, change: 80.48, changePercent: 1.08 },
  { symbol: "IXIC", name: "Nasdaq", value: 26517.93, change: 496.28, changePercent: 1.91 },
  { symbol: "DJI", name: "Dow Jones", value: 51564.70, change: 72.15, changePercent: 0.14 },
  { symbol: "VIX", name: "VIX", value: 16.40, change: -0.01, changePercent: -0.06 },
];

export const STOCKS: StockQuote[] = [
  { symbol:"AAPL",name:"Apple Inc.",price:298.01,change:2.06,changePercent:0.70,exchange:"NASDAQ",currency:"USD",marketCap:4.50e12,volume:76700000,peRatio:33.2,eps:8.98,dividendYield:0.34,beta:1.24,high52w:317.40,low52w:196.86,sector:"Technology",sparkline:spark(20,"up"),day1:0.70,week1:2.1,month1:5.3,ytd:12.4 },
  { symbol:"MSFT",name:"Microsoft Corp.",price:379.40,change:0.49,changePercent:0.13,exchange:"NASDAQ",currency:"USD",marketCap:2.82e12,volume:58400000,peRatio:28.5,eps:13.31,dividendYield:0.88,beta:0.89,high52w:555.45,low52w:356.28,sector:"Technology",sparkline:spark(20,"up"),day1:0.13,week1:1.9,month1:4.7,ytd:-7.2 },
  { symbol:"NVDA",name:"NVIDIA Corp.",price:210.69,change:6.04,changePercent:2.95,exchange:"NASDAQ",currency:"USD",marketCap:5.15e12,volume:312000000,peRatio:54.5,eps:3.87,dividendYield:0.01,beta:1.68,high52w:220.00,low52w:90.69,sector:"Technology",sparkline:spark(20,"up"),day1:2.95,week1:12.3,month1:28.5,ytd:56.2 },
  { symbol:"GOOGL",name:"Alphabet Inc.",price:368.03,change:4.24,changePercent:1.17,exchange:"NASDAQ",currency:"USD",marketCap:2.25e12,volume:24300000,peRatio:22.1,eps:16.65,dividendYield:0.22,beta:1.06,high52w:370.00,low52w:163.59,sector:"Technology",sparkline:spark(20,"up"),day1:1.17,week1:3.2,month1:8.1,ytd:47.5 },
  { symbol:"AMZN",name:"Amazon.com Inc.",price:244.39,change:6.89,changePercent:2.90,exchange:"NASDAQ",currency:"USD",marketCap:2.58e12,volume:41200000,peRatio:38.3,eps:6.38,dividendYield:0,beta:1.15,high52w:245.00,low52w:175.01,sector:"Consumer Cyclical",sparkline:spark(20,"up"),day1:2.90,week1:3.1,month1:8.2,ytd:15.6 },
  { symbol:"META",name:"Meta Platforms Inc.",price:577.22,change:9.64,changePercent:1.70,exchange:"NASDAQ",currency:"USD",marketCap:1.47e12,volume:16800000,peRatio:23.7,eps:24.37,dividendYield:0.35,beta:1.22,high52w:581.00,low52w:467.56,sector:"Technology",sparkline:spark(20,"up"),day1:1.70,week1:2.1,month1:5.4,ytd:6.3 },
  { symbol:"TSLA",name:"Tesla Inc.",price:400.49,change:4.11,changePercent:1.04,exchange:"NASDAQ",currency:"USD",marketCap:1.29e12,volume:98700000,peRatio:132.1,eps:3.03,dividendYield:0,beta:2.05,high52w:465.00,low52w:198.05,sector:"Consumer Cyclical",sparkline:spark(20,"up"),day1:1.04,week1:8.9,month1:15.3,ytd:42.1 },
  { symbol:"BRK.B",name:"Berkshire Hathaway",price:489.46,change:-1.82,changePercent:-0.37,exchange:"NYSE",currency:"USD",marketCap:1.10e12,volume:3200000,peRatio:10.2,eps:48.00,dividendYield:0,beta:0.56,high52w:539.20,low52w:393.97,sector:"Financials",sparkline:spark(20,"flat"),day1:-0.37,week1:0.8,month1:2.1,ytd:15.4 },
  { symbol:"JPM",name:"JPMorgan Chase",price:325.22,change:-8.24,changePercent:-2.47,exchange:"NYSE",currency:"USD",marketCap:930e9,volume:8900000,peRatio:14.8,eps:21.97,dividendYield:1.65,beta:1.08,high52w:340.00,low52w:203.23,sector:"Financials",sparkline:spark(20,"down"),day1:-2.47,week1:-1.3,month1:5.8,ytd:24.2 },
  { symbol:"V",name:"Visa Inc.",price:327.24,change:-3.14,changePercent:-0.95,exchange:"NYSE",currency:"USD",marketCap:660e9,volume:6200000,peRatio:31.5,eps:10.39,dividendYield:0.73,beta:0.94,high52w:337.00,low52w:266.88,sector:"Financials",sparkline:spark(20,"down"),day1:-0.95,week1:1.1,month1:3.2,ytd:8.7 },
  { symbol:"UNH",name:"UnitedHealth Group",price:400.96,change:1.43,changePercent:0.36,exchange:"NYSE",currency:"USD",marketCap:369e9,volume:4100000,peRatio:19.9,eps:20.15,dividendYield:1.85,beta:0.72,high52w:630.73,low52w:349.00,sector:"Healthcare",sparkline:spark(20,"down"),day1:0.36,week1:-3.2,month1:-8.5,ytd:-25.3 },
  { symbol:"XOM",name:"Exxon Mobil Corp.",price:137.81,change:-2.93,changePercent:-2.08,exchange:"NYSE",currency:"USD",marketCap:580e9,volume:14300000,peRatio:14.5,eps:9.50,dividendYield:2.8,beta:0.82,high52w:147.00,low52w:105.08,sector:"Energy",sparkline:spark(20,"down"),day1:-2.08,week1:-1.5,month1:-4.2,ytd:4.8 },
  { symbol:"SPY",name:"SPDR S&P 500 ETF",price:746.74,change:7.68,changePercent:1.04,exchange:"AMEX",currency:"USD",marketCap:640e9,volume:67800000,peRatio:0,eps:0,dividendYield:1.15,beta:1.0,high52w:760.00,low52w:563.65,sector:"ETF",sparkline:spark(20,"up"),day1:1.04,week1:1.5,month1:4.1,ytd:11.3 },
  { symbol:"QQQ",name:"Invesco QQQ Trust",price:740.62,change:18.11,changePercent:2.51,exchange:"NASDAQ",currency:"USD",marketCap:330e9,volume:42100000,peRatio:0,eps:0,dividendYield:0.45,beta:1.14,high52w:748.00,low52w:464.21,sector:"ETF",sparkline:spark(20,"up"),day1:2.51,week1:2.3,month1:6.1,ytd:14.7 },
  { symbol:"DIS",name:"Walt Disney Co.",price:103.89,change:3.03,changePercent:3.00,exchange:"NYSE",currency:"USD",marketCap:189e9,volume:9800000,peRatio:35.2,eps:2.95,dividendYield:0.77,beta:1.32,high52w:124.00,low52w:83.91,sector:"Communication",sparkline:spark(20,"up"),day1:3.00,week1:2.8,month1:7.5,ytd:18.3 },
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
