// ── Demo state types ──
// All types for the paper-trading / demo state layer

export interface Holding {
  symbol: string;
  name: string;
  quantity: number;
  avgPrice: number;
}

export interface TradeTransaction {
  id: string;
  type: 'buy' | 'sell';
  symbol: string;
  name: string;
  quantity: number;
  price: number;
  gross: number;
  fee: number;
  total: number;
  timestamp: string;
  avgPrice?: number;
  pnl?: number;
}

export interface DemoNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'alert';
  icon: string;
  time: string;
  read: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  /** For AI questions with selectable chips */
  chips?: { label: string; value: string }[];
  /** For recommendation cards */
  recommendation?: RecommendationCard;
  /** For trade result messages */
  tradeResult?: TradeTransaction;
  timestamp: string;
}

export interface RecommendationCard {
  symbol: string;
  price: number;
  riskProfile: 'conservative' | 'balanced' | 'growth';
  horizon: 'short' | 'medium' | 'long';
  targetAllocation: 5 | 10 | 15;
  suggestedQty: number;
  estimatedCost: number;
  reasoning: string;
  riskWarning: string;
  action: 'buy' | 'watch';
}

export interface AIProfile {
  riskTolerance?: 'conservative' | 'balanced' | 'growth';
  investmentHorizon?: 'short' | 'medium' | 'long';
  allocationTarget?: 5 | 10 | 15;
}

export interface MarketSnapshot {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  updatedAt: string;
}

export interface DemoState {
  cashBalance: number;
  holdings: Record<string, Holding>;
  transactions: TradeTransaction[];
  watchlist: string[];
  notifications: DemoNotification[];
  chatHistory: ChatMessage[];
  aiProfile: AIProfile;
  marketCache: Record<string, MarketSnapshot>;
  lastUpdatedAt: string;
  // Dynamic parameters
  feeRate?: number;
  maxDrawdownThreshold?: number;
  maxPositionSizeLimit?: number;
  autoRebalance?: boolean;
  dataFeedSpeed?: 'realtime-premium' | 'realtime-standard' | 'delayed';
  preferredAiModel?: 'gemini-flash' | 'gemini-pro' | 'gpt-4o' | 'claude-sonnet';
}

export const FEE_RATE = 0.0015; // 0.15%
