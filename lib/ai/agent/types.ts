// ── Shared Agent Types ──
// Used by: /ai-agent, /demo/market-replay, /demo/pitch
// Frontend is the source of truth for all numeric state (cash, holdings, P&L, etc.)

import type { RiskProfile } from '@/lib/demo/replay/types';

// ── Agent Phases ──

export type AgentPhase =
  | 'setup_capital'
  | 'setup_risk'
  | 'setup_horizon'
  | 'setup_tickers'
  | 'setup_confirm'
  | 'replay_playing'
  | 'decision_active'
  | 'replay_completed';

// ── Intent Detection ──

export type DetectedIntent =
  | 'buy'
  | 'sell'
  | 'add'
  | 'reduce'
  | 'replace'
  | 'hold'
  | 'watch'
  | 'rebalance'
  | 'reduce_risk'
  | 'increase_risk'
  | 'cash_need'
  | 'unknown';

// ── Structured Agent Response (source of truth for UI updates) ──

export interface AgentResponse {
  // Human-readable message
  message: string;

  // Intent classification
  detectedIntent?: DetectedIntent;

  // If a specific ticker is requested
  requestedTicker?: string | null;

  // Proposed action
  requestedAction?: 'Buy' | 'Sell' | 'Hold' | 'Watch' | 'Rebalance' | null;

  // Proposed amount (in USD for paper trading)
  requestedAmount?: number | null;

  // Proposed quantity (shares)
  requestedQuantity?: number | null;

  // Profile patch (validated and applied by frontend)
  profilePatch?: ProfilePatch | null;

  // Decision patch (validated and applied by frontend)
  decisionPatch?: DecisionPatch | null;

  // If LLM needs more info, ask exactly one question
  nextQuestion?: string | null;

  // True if this response came from fallback/mock (not real LLM)
  isMock?: boolean;
}

// ── Profile Patch ──

export interface ProfilePatch {
  riskLevel?: 'low' | 'medium' | 'high';
  investmentHorizonMonths?: number;
  cashNeedSoon?: boolean;
  sectorRestrictions?: string[];
  tickerRestrictions?: string[];
  targetReturn?: number;
  maxDrawdown?: number;
}

// ── Decision Patch ──
// Applied to the currently active unconfirmed decision card

export interface DecisionPatch {
  // Core action
  action?: 'Buy' | 'Sell' | 'Hold' | 'Watch' | 'Rebalance';

  // Target ticker
  ticker?: string;

  // How many shares / what allocation %
  quantity?: number;
  allocationPct?: number;

  // Entry/exit targets
  entryTarget?: number;
  stopLoss?: number;
  takeProfit?: number;

  // Confidence and rationale
  confidence?: number; // 0-100
  riskNote?: string;
  rationale?: string;

  // Replace an existing position with a new ticker
  replaceTicker?: string;
}

// ── Runtime validation ──

export function isAgentResponse(val: unknown): val is AgentResponse {
  if (typeof val !== 'object' || val === null) return false;
  const r = val as Record<string, unknown>;
  return typeof r.message === 'string';
}

export function validateAgentResponse(raw: unknown, fallbackMessage = 'Không nhận được phản hồi từ AI.'): AgentResponse {
  if (!isAgentResponse(raw)) {
    return { message: fallbackMessage };
  }
  // Ensure required fields
  return {
    message: raw.message ?? fallbackMessage,
    detectedIntent: raw.detectedIntent,
    requestedTicker: raw.requestedTicker ?? null,
    requestedAction: raw.requestedAction ?? null,
    requestedAmount: typeof raw.requestedAmount === 'number' ? raw.requestedAmount : null,
    requestedQuantity: typeof raw.requestedQuantity === 'number' ? raw.requestedQuantity : null,
    profilePatch: raw.profilePatch ?? null,
    decisionPatch: raw.decisionPatch ?? null,
    nextQuestion: raw.nextQuestion ?? null,
    isMock: raw.isMock ?? false,
  };
}

// ── Build context passed to the LLM ──

export interface AgentContext {
  phase: AgentPhase;

  // Portfolio snapshot
  cashBalance: number;
  holdings: Array<{
    symbol: string;
    name: string;
    quantity: number;
    avgPrice: number;
    currentPrice: number;
    unrealizedPnL: number;
    unrealizedPnLPct: number;
  }>;
  totalAccountValue: number;

  // Active decision (if any)
  activeDecision?: {
    id: string;
    title: string;
    description: string;
    ticker?: string;
    currentPrice?: number;
    recommendedAction?: string;
    chips: Array<{ label: string; value: string }>;
    pendingChipValue?: string;
    pendingChipLabel?: string;
  };

  // Prior feedback for this decision
  priorFeedback?: string[];

  // User profile
  profile?: {
    riskLevel?: string;
    investmentHorizonMonths?: number;
    cashNeedSoon?: boolean;
  };

  // Available market tickers
  availableTickers: string[];

  // Phase-specific setup answers
  setupAnswers?: Record<string, string>;
}

// ── API Request payload ──

export interface AgentChatRequest {
  message: string;
  context: AgentContext;
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
}
