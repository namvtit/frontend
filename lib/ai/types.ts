// AI Agent types

// ── Primitive enums (must be defined before types that reference them) ──

export type DecisionStatus = "pending" | "accepted" | "rejected" | "skipped";
export type DecisionType =
  | "volatility_spike"
  | "portfolio_drawdown"
  | "take_profit"
  | "rebalance"
  | "risk_breach"
  | "new_opportunity";

export interface DecisionChip {
  label: string;
  value: string;
}

// ── Message & Card types ──

export interface AIMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  cards?: AICard[];
  timestamp: string;
  chips?: DecisionChip[];

  surveyRecommendation?: {
    symbol: string;
    title: string;
    content: string;
    data: Record<string, string>;
  };
}

export interface AICard {
  type: "summary" | "risk" | "sentiment" | "technical" | "compare" | "watchlist" | "news" | "order";
  title: string;
  content: string;
  data?: Record<string, string | number>;
  sentiment?: "bullish" | "bearish" | "neutral";
}

// ── Decision Feedback types ──

export interface DecisionFeedback {
  id: string;
  decisionId: string;
  content: string;
  timestamp: string;
}

export interface DecisionRevision {
  id: string;
  decisionId: string;
  originalAdvice: string;
  revisedAdvice: string;
  originalChip?: string;
  originalChipLabel?: string;
  revisedChip?: string;
  revisedChipLabel?: string;
  confidenceAdjustment?: number; // -1 to +1
  riskNote?: string;
  rationale: string;
  timestamp: string;
}

export interface DecisionHistoryEntry {
  id: string;
  decisionId: string;
  type: DecisionType;
  title: string;
  description: string;
  selectedChipValue?: string;
  selectedChipLabel?: string;
  status: DecisionStatus;
  resolvedAt?: string;
  feedback: DecisionFeedback[];
  revisions: DecisionRevision[];
  aiAdviceSnapshot: string; // frozen at decision creation time
}

// ── Simulation Decision ──

export interface SimulationDecision {
  id: string;
  type: DecisionType;
  title: string;
  description: string;
  aiAdvice: string;
  chips?: DecisionChip[];
  status: DecisionStatus;
  resolvedAt?: string;
  // Feedback tracking (ephemeral, persisted separately)
  feedbackCount?: number;
  lastFeedback?: string;
  pendingChipValue?: string; // user selected but not yet confirmed
}

// ── AI Agent request / response ──

export interface AIAgentRequest {
  message: string;
  symbol?: string;
  context?: {
    watchlist?: string[];
    recentSymbols?: string[];
  };
}

export interface AIAgentResponse {
  message: string;
  cards: AICard[];
}
