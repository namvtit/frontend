export interface Stock {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  marketCap: string;
  volume: string;
  high52Week: number;
  low52Week: number;
  pe: number;
  dividend: number;
  image: string;
}

export interface NewsArticle {
  id: string;
  title: string;
  description: string;
  content: string;
  image: string;
  source: string;
  timestamp: string;
  category: string;
}

export interface UserPortfolio {
  totalValue: number;
  dayChange: number;
  dayChangePercent: number;
  holdings: Stock[];
  watchlist: Stock[];
}

export interface Metric {
  id: string;
  name: string;
  value: string;
  change: number;
  description: string;
}

export interface FearIndex {
  value: number;
  level: 'extreme-fear' | 'fear' | 'neutral' | 'greed' | 'extreme-greed';
  description: string;
  change: number;
}

export interface AISuggestion {
  id: string;
  title: string;
  description: string;
  action: 'buy' | 'sell' | 'hold';
  confidence: number;
  stocks: string[];
  reasoning: string;
}

export const mockStocks: Stock[] = [
  {
    id: '1',
    symbol: 'AAPL',
    name: 'Apple Inc.',
    price: 182.45,
    change: 2.15,
    changePercent: 1.19,
    marketCap: '$2.85T',
    volume: '52.3M',
    high52Week: 199.62,
    low52Week: 164.08,
    pe: 28.5,
    dividend: 0.24,
    image: '/stocks/aapl.png',
  },
  {
    id: '2',
    symbol: 'MSFT',
    name: 'Microsoft Corporation',
    price: 415.78,
    change: 3.22,
    changePercent: 0.78,
    marketCap: '$3.09T',
    volume: '18.2M',
    high52Week: 468.92,
    low52Week: 335.76,
    pe: 35.2,
    dividend: 0.68,
    image: '/stocks/msft.png',
  },
  {
    id: '3',
    symbol: 'GOOGL',
    name: 'Alphabet Inc.',
    price: 172.34,
    change: -1.45,
    changePercent: -0.83,
    marketCap: '$2.14T',
    volume: '23.1M',
    high52Week: 191.45,
    low52Week: 140.23,
    pe: 24.1,
    dividend: 0,
    image: '/stocks/googl.png',
  },
  {
    id: '4',
    symbol: 'AMZN',
    name: 'Amazon.com Inc.',
    price: 189.52,
    change: 4.28,
    changePercent: 2.31,
    marketCap: '$1.98T',
    volume: '54.7M',
    high52Week: 201.48,
    low52Week: 144.86,
    pe: 62.3,
    dividend: 0,
    image: '/stocks/amzn.png',
  },
  {
    id: '5',
    symbol: 'NVDA',
    name: 'NVIDIA Corporation',
    price: 925.14,
    change: 12.33,
    changePercent: 1.35,
    marketCap: '$2.29T',
    volume: '31.2M',
    high52Week: 974.18,
    low52Week: 316.23,
    pe: 68.2,
    dividend: 0.04,
    image: '/stocks/nvda.png',
  },
  {
    id: '6',
    symbol: 'TSLA',
    name: 'Tesla Inc.',
    price: 242.84,
    change: -5.16,
    changePercent: -2.08,
    marketCap: '$768B',
    volume: '142.3M',
    high52Week: 299.29,
    low52Week: 159.45,
    pe: 65.4,
    dividend: 0,
    image: '/stocks/tsla.png',
  },
  {
    id: '7',
    symbol: 'META',
    name: 'Meta Platforms Inc.',
    price: 538.97,
    change: 8.54,
    changePercent: 1.61,
    marketCap: '$1.72T',
    volume: '12.8M',
    high52Week: 601.12,
    low52Week: 284.03,
    pe: 28.9,
    dividend: 0,
    image: '/stocks/meta.png',
  },
  {
    id: '8',
    symbol: 'BRK.B',
    name: 'Berkshire Hathaway Inc.',
    price: 412.35,
    change: 1.89,
    changePercent: 0.46,
    marketCap: '$913B',
    volume: '2.1M',
    high52Week: 445.23,
    low52Week: 338.12,
    pe: 23.1,
    dividend: 0,
    image: '/stocks/brk.png',
  },
];

export const mockNews: NewsArticle[] = [
  {
    id: '1',
    title: 'AAPL Hits All-Time High on Strong Q4 Earnings',
    description: 'Apple exceeds expectations with record iPhone sales and services growth',
    content:
      'Apple Inc. reported better-than-expected fourth quarter earnings today, with revenue reaching $123.5 billion, a 12% increase year-over-year. The strong performance was driven by robust iPhone sales and exceptional growth in services. CEO Tim Cook highlighted the success of the new iPhone 16 Pro line and continued momentum in emerging markets.',
    image: '/news/aapl-earnings.jpg',
    source: 'MarketWatch',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    category: 'earnings',
  },
  {
    id: '2',
    title: 'Tech Stocks Rally on AI Optimism',
    description: 'Major tech companies surge as investors bet on artificial intelligence growth',
    content:
      'Technology stocks led market gains today, with the Nasdaq 100 rising 2.3% on renewed optimism about artificial intelligence and its potential impact on corporate productivity. Major AI-focused companies including NVIDIA, Microsoft, and Google saw significant gains as investors rotated into high-growth technology sectors.',
    image: '/news/tech-rally.jpg',
    source: 'Bloomberg',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    category: 'market-news',
  },
  {
    id: '3',
    title: 'MSFT Announces New Cloud Services Partnership',
    description: 'Microsoft partners with enterprise leaders to expand cloud computing reach',
    content:
      'Microsoft announced today a major partnership with leading enterprise software companies to expand its Azure cloud services. The strategic alliance aims to provide enhanced solutions for digital transformation across industries including finance, healthcare, and manufacturing.',
    image: '/news/msft-partnership.jpg',
    source: 'Reuters',
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    category: 'news',
  },
  {
    id: '4',
    title: 'Market Volatility Increases Amid Economic Data',
    description: 'S&P 500 experiences increased volatility following disappointing employment report',
    content:
      'Markets showed heightened volatility today following the release of employment data that came in below expectations. The reports sparked renewed discussions about Federal Reserve policy and potential economic slowdown. Bond yields moved lower as investors sought defensive positions.',
    image: '/news/market-volatility.jpg',
    source: 'CNBC',
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    category: 'analysis',
  },
  {
    id: '5',
    title: 'NVDA Posts Record Profit on GPU Demand',
    description: 'NVIDIA exceeds estimates as data center GPU shipments surge',
    content:
      'NVIDIA reported record quarterly profits driven by exceptional demand for its data center GPUs used in AI training and inference. Revenue in the data center segment grew 255% year-over-year, driven by strong adoption from major cloud providers and tech companies.',
    image: '/news/nvda-profit.jpg',
    source: 'Financial Times',
    timestamp: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
    category: 'earnings',
  },
];

export const mockMetrics: Metric[] = [
  {
    id: '1',
    name: 'S&P 500 Index',
    value: '5,487.23',
    change: 1.24,
    description: 'US Large Cap',
  },
  {
    id: '2',
    name: 'Nasdaq-100 Index',
    value: '19,234.56',
    change: 2.31,
    description: 'US Tech Heavy',
  },
  {
    id: '3',
    name: 'Dow Jones Industrial',
    value: '44,012.89',
    change: 0.82,
    description: 'US Bluechip',
  },
  {
    id: '4',
    name: 'Russell 2000',
    value: '2,245.67',
    change: -0.45,
    description: 'US Small Cap',
  },
  {
    id: '5',
    name: 'VIX Volatility Index',
    value: '14.23',
    change: -5.23,
    description: 'Market Fear Gauge',
  },
  {
    id: '6',
    name: 'US Treasury 10Y',
    value: '4.12%',
    change: 0.08,
    description: 'Benchmark Rate',
  },
];

export const mockUserPortfolio: UserPortfolio = {
  totalValue: 487234.56,
  dayChange: 8923.45,
  dayChangePercent: 1.87,
  holdings: mockStocks.slice(0, 5),
  watchlist: mockStocks.slice(3, 8),
};

export const mockFearIndex: FearIndex = {
  value: 32,
  level: 'fear',
  description: 'Market showing signs of caution amid economic uncertainty',
  change: -8.5,
};

export const mockAISuggestions: AISuggestion[] = [
  {
    id: '1',
    title: 'Tech Giant Opportunity',
    description: 'Strong accumulation signals detected in cloud computing leaders',
    action: 'buy',
    confidence: 87,
    stocks: ['MSFT', 'GOOGL'],
    reasoning: 'Technical analysis shows breakout pattern with high trading volume. AI sentiment analysis indicates institutional buying.',
  },
  {
    id: '2',
    title: 'AI Semiconductor Momentum',
    description: 'GPU demand remains strong despite recent volatility',
    action: 'hold',
    confidence: 92,
    stocks: ['NVDA'],
    reasoning: 'Strong fundamentals and earnings growth support current valuations. Wait for pullback before increasing position.',
  },
  {
    id: '3',
    title: 'EV Market Correction',
    description: 'Electric vehicle sector showing weakness relative to market',
    action: 'sell',
    confidence: 78,
    stocks: ['TSLA'],
    reasoning: 'Bearish divergence on daily chart. Production concerns and competitive pressures mounting.',
  },
];
