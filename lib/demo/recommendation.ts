// ── Deterministic AI recommendation generator ──
import type { RecommendationCard, DemoState, Holding } from './types';
import { FEE_RATE } from './types';

interface RecommendationInput {
  symbol: string;
  price: number;
  riskTolerance: 'conservative' | 'balanced' | 'growth';
  investmentHorizon: 'short' | 'medium' | 'long';
  allocationTarget: 5 | 10 | 15;
  cashBalance: number;
  totalAccountValue: number;
  currentHolding?: Holding;
  changePercent: number;
}

export function generateRecommendation(input: RecommendationInput): RecommendationCard {
  const {
    symbol,
    price,
    riskTolerance,
    investmentHorizon,
    allocationTarget,
    cashBalance,
    totalAccountValue,
    currentHolding,
    changePercent,
  } = input;

  // Calculate target allocation amount
  const targetValue = (allocationTarget / 100) * totalAccountValue;
  const currentHoldingValue = currentHolding ? currentHolding.quantity * price : 0;
  const remainingTarget = Math.max(0, targetValue - currentHoldingValue);

  // Determine available for purchase
  const available = Math.min(remainingTarget, cashBalance);
  let suggestedQty = Math.floor(available / price);

  // Apply risk-based guardrails
  const absChange = Math.abs(changePercent);

  if (riskTolerance === 'conservative') {
    // Conservative: reduce allocation by ~30%, avoid volatile stocks
    suggestedQty = Math.floor(suggestedQty * 0.7);
    if (absChange > 4) {
      // High volatility — suggest watching instead
      suggestedQty = 0;
    }
  } else if (riskTolerance === 'balanced') {
    // Balanced: moderate reduction ~15%
    suggestedQty = Math.floor(suggestedQty * 0.85);
  }
  // Growth: use full calculated quantity

  // Min/max guardrails for demo
  if (suggestedQty > 500) suggestedQty = 500;
  if (suggestedQty < 0) suggestedQty = 0;

  const estimatedCost = suggestedQty > 0
    ? suggestedQty * price * (1 + FEE_RATE)
    : 0;

  const action: 'buy' | 'watch' = suggestedQty > 0 ? 'buy' : 'watch';

  // Generate reasoning
  const reasoning = buildReasoning({
    symbol,
    riskTolerance,
    investmentHorizon,
    allocationTarget,
    suggestedQty,
    currentHolding,
    changePercent,
    price,
  });

  // Risk warning
  const riskWarning = buildRiskWarning(riskTolerance, changePercent);

  return {
    symbol,
    price,
    riskProfile: riskTolerance,
    horizon: investmentHorizon,
    targetAllocation: allocationTarget,
    suggestedQty,
    estimatedCost,
    reasoning,
    riskWarning,
    action,
  };
}

function buildReasoning(params: {
  symbol: string;
  riskTolerance: string;
  investmentHorizon: string;
  allocationTarget: number;
  suggestedQty: number;
  currentHolding?: Holding;
  changePercent: number;
  price: number;
}): string {
  const { symbol, riskTolerance, investmentHorizon, allocationTarget, suggestedQty, currentHolding, changePercent } = params;

  if (suggestedQty <= 0) {
    if (currentHolding) {
      return `Vị thế ${symbol} hiện tại đã gần mức phân bổ mục tiêu ${allocationTarget}%. Khuyến nghị theo dõi và chờ cơ hội tốt hơn.`;
    }
    if (Math.abs(changePercent) > 4) {
      return `${symbol} đang biến động mạnh (${changePercent > 0 ? '+' : ''}${changePercent.toFixed(1)}%). Với hồ sơ rủi ro ${riskTolerance === 'conservative' ? 'thận trọng' : 'cân bằng'}, nên thêm vào Watchlist và chờ ổn định.`;
    }
    return `Chưa đủ điều kiện mua thêm ${symbol} ở mức phân bổ hiện tại. Thêm vào Watchlist để theo dõi.`;
  }

  const horizonText = investmentHorizon === 'short' ? 'ngắn hạn' : investmentHorizon === 'medium' ? 'trung hạn' : 'dài hạn';
  const riskText = riskTolerance === 'conservative' ? 'thận trọng' : riskTolerance === 'balanced' ? 'cân bằng' : 'tăng trưởng';

  let reason = `Dựa trên hồ sơ ${riskText} và kỳ vọng ${horizonText}, `;

  if (currentHolding) {
    reason += `vị thế ${symbol} hiện có ${currentHolding.quantity} CP. Gợi ý mua thêm ${suggestedQty} CP để đạt mức phân bổ ~${allocationTarget}% danh mục.`;
  } else {
    reason += `gợi ý mở vị thế ${suggestedQty} CP ${symbol} ở mức phân bổ ~${allocationTarget}% danh mục.`;
  }

  return reason;
}

function buildRiskWarning(riskTolerance: string, changePercent: number): string {
  const warnings: string[] = [
    'Khuyến nghị được phân tích tự động dựa trên hồ sơ rủi ro và các chỉ báo kỹ thuật.',
  ];

  if (Math.abs(changePercent) > 3) {
    warnings.push(`Giá đang biến động ${Math.abs(changePercent).toFixed(1)}% trong phiên.`);
  }

  if (riskTolerance === 'growth') {
    warnings.push('Hồ sơ tăng trưởng chấp nhận rủi ro cao hơn.');
  }

  return warnings.join(' ');
}
