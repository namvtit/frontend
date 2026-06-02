// Shared types for market data — used by both frontend components and API layer

export interface MarketSymbol {
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
  exchange: string;
  sector: string;
}

export interface MarketNewsItem {
  id: string;
  title: string;
  description: string;
  content: string;
  source: string;
  timestamp: string;
  category: string;
  image?: string;
}

export interface MarketIndex {
  symbol: string;
  name: string;
  value: number;
  change: number;
  changePercent: number;
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

export interface UserPortfolio {
  totalValue: number;
  dayChange: number;
  dayChangePercent: number;
  holdings: MarketSymbol[];
  watchlist: MarketSymbol[];
}

export interface Transaction {
  id: string;
  amount: number;
  currency: 'VND' | 'USD';
  status: 'pending' | 'processing' | 'succeeded' | 'failed' | 'reversed';
  createdAt: string;
  counterpartyName: string;
  description?: string;
}
