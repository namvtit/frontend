// ── Deterministic Decision Explanation Generator ──
// Creates detailed explanations for replay events before any LLM wording is used

import type {
  ReplayAction,
  RiskProfile,
  GridLevel,
} from './types';

// Generate unique ID
export function generateEventId(): string {
  return `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// Generate event trigger message
export function generateEventTitle(type: string): string {
  switch (type) {
    case 'take-profit':
      return 'Cơ hội Chốt Lời';
    case 'sharp-decline':
      return 'Cổ Phiếu Điều Chỉnh Mạnh';
    case 'rotation':
      return 'Cơ Hội Tái Cân Bằng';
    case 'context-event':
      return 'Tin Tức Thị Trường';
    case 'initial-allocation':
      return 'Đánh Giá Danh Mục';
    case 'grid-reentry':
      return 'Grid Mua Lại';
    default:
      return 'Quyết Định Quan Trọng';
  }
}

// Calculate take-profit thresholds
export function calculateTakeProfit(
  avgPrice: number,
  riskProfile: RiskProfile
): { threshold: number; targetPercent: number } {
  switch (riskProfile) {
    case 'conservative':
      return { threshold: 8, targetPercent: 10 };
    case 'balanced':
      return { threshold: 12, targetPercent: 15 };
    case 'growth':
      return { threshold: 15, targetPercent: 20 };
  }
}

// Calculate sharp decline thresholds
export function calculateSharpDecline(
  avgPrice: number,
  riskProfile: RiskProfile
): { threshold: number; action: ReplayAction } {
  switch (riskProfile) {
    case 'conservative':
      return { threshold: -8, action: 'SELL' };
    case 'balanced':
      return { threshold: -10, action: 'BUY' };
    case 'growth':
      return { threshold: -15, action: 'HOLD' };
  }
}

// Generate rotation analysis
export function analyzeRotation(
  currentSymbol: string,
  replacementSymbol: string,
  currentConfidence: number,
  replacementConfidence: number
): {
  shouldRotate: boolean;
  confidenceDelta: number;
  reasoning: string;
} {
  const delta = replacementConfidence - currentConfidence;
  
  return {
    shouldRotate: delta > 5,
    confidenceDelta: delta,
    reasoning: delta > 10 
      ? 'Phân tích cho thấy sự thay thế có expected return cao hơn rõ rệt.'
      : delta > 5 
      ? 'Confidence của candidate tốt hơn, có thể cân nhắc rotation.'
      : 'Chưa có đủ signals để thay đổi.',
  };
}

// Generate grid levels
export function generateGridLevels(
  currentPrice: number,
  levels: number = 3,
  spacing: number = 0.05
): GridLevel[] {
  return Array.from({ length: levels }, (_, i) => ({
    level: i + 1,
    price: currentPrice * (1 - spacing * (i + 1)),
    filled: false,
  }));
}

// Calculate risk score
export function calculateRiskScore(
  holdings: Record<string, { allocation: number }>,
  volatility: Record<string, number>,
  cashReserve: number
): number {
  let weightedVol = 0;
  let totalAllocation = 0;
  
  for (const [symbol, holding] of Object.entries(holdings)) {
    const vol = volatility[symbol] || 1.0;
    const alloc = holding.allocation / 100;
    weightedVol += vol * alloc;
    totalAllocation += alloc;
  }
  
  const equityWeight = totalAllocation / 100;
  const baseScore = weightedVol * 100 * equityWeight;
  const cashBonus = cashReserve * 0.5;
  
  return Math.min(100, Math.max(0, Math.round(baseScore - cashBonus)));
}

// Generate summary statistics
export function generateSummaryStats(
  snapshots: Array<{
    unrealizedPnL: number;
    realizedPnL: number;
    nav: number;
  }>
): {
  totalPnL: number;
  bestDay: number;
  worstDay: number;
  volatility: number;
} {
  if (snapshots.length === 0) {
    return { totalPnL: 0, bestDay: 0, worstDay: 0, volatility: 0 };
  }
  
  const pnls = snapshots.map(s => s.unrealizedPnL);
  const totalPnL = pnls[pnls.length - 1] || 0;
  const bestDay = Math.max(...pnls);
  const worstDay = Math.min(...pnls);
  
  const returns = pnls.map((p, i) => i > 0 ? p - pnls[i - 1] : 0);
  const avg = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((a, r) => a + Math.pow(r - avg, 2), 0) / returns.length;
  const volatility = Math.sqrt(variance);
  
  return { totalPnL, bestDay, worstDay, volatility };
}
