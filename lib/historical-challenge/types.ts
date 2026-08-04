export type MarketId = "sp500" | "nasdaq" | "dow";
export type IndexSymbol = "^GSPC" | "^IXIC" | "^DJI";
export type RiskLevel = "low" | "medium" | "high";
export type RiskProfile = "defensive" | "balanced" | "aggressive";
export type Horizon = 5 | 20 | 60;
export type SessionStage = "start" | "challenge" | "round-result" | "final";
export type TradeAction = "buy" | "hold" | "sell";
export type OrderSize = 10 | 20 | 30 | 40 | 50;
export type DrawdownLimit = 5 | 10 | 20 | 30;
export type RoundIndex = 0 | 1 | 2;

export interface ScenarioManifestItem {
  id: string; market: MarketId; indexSymbol: IndexSymbol; headline: string;
  sourceName: string; sourceUrl: string; eventDate: string; decisionDate: string;
  category: string; difficulty: "Dễ" | "Trung bình" | "Khó";
  preEventContext: string; warningSignals: [string, string, string];
  riskLevel: RiskLevel; educationalFocus: string;
}
export interface ScenarioSession { relativeDay: number; date: string; indexClose: number; defensiveClose: number; }
export interface GeneratedScenario extends ScenarioManifestItem {
  defensiveSymbol: string; cashReturnAssumption: 0; priceSource: string; generatedAt: string;
  sessions: ScenarioSession[];
  shock: { relativeDay: number; date: string; indexDailyReturn: number; label: string };
}
export interface Allocation { index: number; defensive: number; cash: number; }
export interface ChallengeSession {
  id: string; scenarioIds: [string, string, string]; currentRound: RoundIndex;
  startingCapital: number; playerCapital: number; guardrailCapital: number; finPilotCapital: number;
}
export interface RoundInputs {
  riskProfile: RiskProfile; action: TradeAction; orderSize: OrderSize;
  maxDrawdown: DrawdownLimit; horizon: Horizon;
}
export interface StrategyPoint { relativeDay: number; date: string; value: number; drawdown: number; }
export interface StrategyMetrics {
  startingValue: number; valueAt5: number; valueAt20: number; valueAt60: number;
  selectedValue: number; selectedProfitLoss: number; selectedReturn: number;
  maxDrawdownSelected: number; maxDrawdown60: number; shockDayValue: number;
}
export interface StrategyResult {
  id: "player" | "guardrails" | "finpilot"; label: "Bạn" | "Guardrails" | "FinPilot";
  allocation: Allocation; points: StrategyPoint[]; metrics: StrategyMetrics;
}
export interface RoundExplanations { player: string; finpilot: string; result: string; }
export interface RoundComparisonResult {
  scenarioId: string; roundIndex: RoundIndex; selectedHorizon: Horizon; shockDay: number;
  inputs: RoundInputs; player: StrategyResult; guardrails: StrategyResult; finpilot: StrategyResult;
  explanations: RoundExplanations;
}
export interface SessionCheckpoint { label: "Start" | "Thử thách 1" | "Thử thách 2" | "Thử thách 3"; player: number; guardrails: number; finpilot: number; }
