// ── Market Replay Types ──

export type RiskProfile = 'conservative' | 'balanced' | 'growth';
export type ReplaySeed = 'golden' | 'resilience';
export type ReplayPhase =
  | 'onboarding-capital'
  | 'onboarding-risk'
  | 'onboarding-review'
  | 'replay-running'
  | 'replay-complete';

export type DecisionCheckpointType =
  | 'initial-allocation'
  | 'take-profit'
  | 'sharp-decline'
  | 'grid-reentry'
  | 'forecast-rotation';

export type ReplayAction = 'BUY' | 'SELL' | 'HOLD' | 'REBALANCE' | 'GRID';

export interface ReplayConfig {
  seed: ReplaySeed;
  events: 'default' | 'all';
  startDate: string;
  endDate: string;
  capital: number;
  riskProfile: RiskProfile;
}

export interface ProposedHolding {
  symbol: string;
  name: string;
  allocation: number;
  role: 'Core quality' | 'Growth' | 'Defensive' | 'Diversifier' | 'Cash-flow / value';
  riskLabel: 'Thấp' | 'Trung bình' | 'Cao';
  pisiConfidence: number;
  reason: string;
}

export interface PortfolioProposal {
  holdings: ProposedHolding[];
  cashReserve: number;
  riskScore: number;
  expectedVolatility: number;
  sectorConcentration: Record<string, number>;
}

export interface ReplayPrice {
  date: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
}

export interface HoldingSnapshot {
  symbol: string;
  quantity: number;
  avgPrice: number;
  currentPrice: number;
  marketValue: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
  allocationPercent: number;
}

export interface GridLevel {
  level: number;
  price: number;
  filled: boolean;
  fillDate?: string;
  quantity?: number;
}

export interface DecisionCheckpoint {
  id: string;
  index: number; // 1-5
  type: DecisionCheckpointType;
  title: string;
  date: string;
  dayNumber: number;
  trigger: string;
  ticker?: string;
  replacementTicker?: string;
  currentPrice?: number;
  avgPrice?: number;
  gridLevels?: GridLevel[];
  observations: Array<{
    label: string;
    value: string;
    direction?: 'positive' | 'negative' | 'neutral';
  }>;
  recommendation: {
    action: ReplayAction;
    summary: string;
    suggestedPercent?: number;
    comparison?: Array<{
      label: string;
      current: string;
      replacement: string;
      direction: 'positive' | 'negative' | 'neutral';
    }>;
  };
  whyNow: string[];
  tradeoffs: string[];
  downsideIfIgnored?: string[];
  riskGuards: string[];
  confidence: number;
  choices: Array<{
    id: string;
    label: string;
    description: string;
    variant: 'primary' | 'secondary' | 'destructive';
  }>;
  status: 'pending' | 'resolved';
  resolution?: {
    choiceId: string;
    choiceLabel: string;
    tradeExecuted?: {
      type: 'buy' | 'sell';
      symbol: string;
      quantity: number;
      price: number;
      pnl?: number;
      cashChange: number;
    };
    explanation: string;
    timestamp: string;
  };
}

export interface ReplaySnapshot {
  date: string;
  dayNumber: number;
  cashBalance: number;
  holdings: HoldingSnapshot[];
  totalMarketValue: number;
  totalAccountValue: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
  realizedPnL: number;
  riskScore: number;
  nav: number;
  navChange: number;
  navChangePercent: number;
}

export interface ReplayMetrics {
  initialCapital: number;
  finalNAV: number;
  totalPnL: number;
  returnPercent: number;
  realizedPnL: number;
  unrealizedPnL: number;
  maxDrawdown: number;
  maxDrawdownDate: string;
  riskScoreStart: number;
  riskScoreEnd: number;
  riskScoreTrend: 'improved' | 'stable' | 'worsened';
  decisionsCompleted: number;
  pisiRecommendationsAccepted: number;
  topContributor: { symbol: string; contribution: number; returnPercent: number };
  weakestContributor: { symbol: string; contribution: number; returnPercent: number };
  buyAndHoldReturn: number;
  pisiImpact: string;
}

export interface ReplayState {
  config: ReplayConfig;
  phase: ReplayPhase;

  // Portfolio state
  initialCapital: number;
  cashBalance: number;
  holdings: Record<string, {
    symbol: string;
    name: string;
    quantity: number;
    avgPrice: number;
    gridLevels: GridLevel[];
    realizedPnL: number;
  }>;

  // Proposal state
  proposal: PortfolioProposal | null;

  // Replay state
  currentDate: string;
  currentDay: number;
  currentPrice: Record<string, number>;
  prices: Record<string, ReplayPrice[]>;
  snapshots: ReplaySnapshot[];
  decisions: DecisionCheckpoint[];
  currentDecisionIndex: number;

  // Metrics
  maxDrawdown: number;
  maxDrawdownDate: string;
  realizedPnL: number;

  // Chat state
  messages: ReplayMessage[];

  // Status
  isComplete: boolean;
  metrics: ReplayMetrics | null;
}

export interface ReplayMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  chips?: { label: string; value: string }[];
  timestamp: string;
  isRevisionNotice?: boolean;
  revisedFromId?: string;
}

// ── Decision Revision Types ──

export interface DecisionRevision {
  id: string;
  decisionId: string;
  originalDecision: DecisionCheckpoint;
  revisedDecision: DecisionCheckpoint;
  userFeedback: string;
  aiRationale: string;
  timestamp: string;
}

export interface DecisionUpdate {
  action: ReplayAction | 'WATCH' | 'SKIP';
  ticker?: string;
  quantity?: number;
  targetAllocation?: number;
  entryPrice?: number;
  stopLoss?: number;
  takeProfit?: number;
  confidence: number;
  riskNote?: string;
  rationale: string;
  updateChoices?: boolean;
}

export interface DecisionRevisionRequest {
  feedback: string;
  decision: DecisionCheckpoint;
  portfolio: {
    cashBalance: number;
    holdings: Record<string, { symbol: string; quantity: number; avgPrice: number }>;
    initialCapital: number;
    riskProfile: RiskProfile;
  };
  currentPrices: Record<string, number>;
}
