import { NextResponse } from "next/server";
import type { DecisionUpdate, DecisionRevisionRequest, DecisionCheckpoint, ReplayAction } from "@/lib/demo/replay/types";

// ── Decision Revision System ──
// Deterministic revision based on user feedback keywords
// Maps user feedback to specific decision modifications

type FeedbackKeyword =
  | "risk_conservative"
  | "risk_aggressive"
  | "cash_needed"
  | "timing_early"
  | "timing_late"
  | "avoid_ticker"
  | "prefer_ticker"
  | "reduce_position"
  | "increase_position"
  | "keep_position"
  | "watch_only"
  | "long_term_view"
  | "short_term_view";

function classifyFeedback(text: string): FeedbackKeyword[] {
  const lower = text.toLowerCase();
  const keywords: FeedbackKeyword[] = [];

  // Risk preferences
  if (lower.includes("an toàn") || lower.includes("bảo toàn") || lower.includes("thận trọng") || lower.includes("rủi ro thấp") || lower.includes("giảm rủi ro") || lower.includes("conservative")) {
    keywords.push("risk_conservative");
  }
  if (lower.includes("mạo hiểm") || lower.includes("tăng rủi ro") || lower.includes("aggressive") || lower.includes("chấp nhận rủi ro cao")) {
    keywords.push("risk_aggressive");
  }

  // Cash concerns
  if (lower.includes("tiền mặt") || lower.includes("cash") || lower.includes("cần tiền") || lower.includes("thanh khoản") || lower.includes("không đủ")) {
    keywords.push("cash_needed");
  }

  // Timing
  if (lower.includes("quá sớm") || lower.includes("chờ") || lower.includes("theo dõi") || lower.includes("đợi") || lower.includes("wait") || lower.includes("early")) {
    keywords.push("timing_early");
  }
  if (lower.includes("muộn") || lower.includes("trễ") || lower.includes("nên mua sớm hơn")) {
    keywords.push("timing_late");
  }

  // Ticker preferences
  if (lower.includes("không mua") || lower.includes("tránh") || lower.includes("bán hết") || lower.includes("loại bỏ") || lower.includes("avoid")) {
    keywords.push("avoid_ticker");
  }
  if (lower.includes("thích") || lower.includes("ưu tiên") || lower.includes("prefer")) {
    keywords.push("prefer_ticker");
  }

  // Position sizing
  if (lower.includes("giảm") || lower.includes("bớt") || lower.includes("ít hơn") || lower.includes("nhỏ hơn") || lower.includes("reduce") || lower.includes("lower")) {
    keywords.push("reduce_position");
  }
  if (lower.includes("tăng") || lower.includes("thêm") || lower.includes("nhiều hơn") || lower.includes("lớn hơn") || lower.includes("increase")) {
    keywords.push("increase_position");
  }

  // Position stance
  if (lower.includes("giữ nguyên") || lower.includes("không thay đổi") || lower.includes("keep") || lower.includes("ổn định")) {
    keywords.push("keep_position");
  }
  if (lower.includes("theo dõi") || lower.includes("watch") || lower.includes("quan sát")) {
    keywords.push("watch_only");
  }

  // Time horizon
  if (lower.includes("dài hạn") || lower.includes("long term") || lower.includes("hold lâu") || lower.includes("tích sản")) {
    keywords.push("long_term_view");
  }
  if (lower.includes("ngắn hạn") || lower.includes("short term") || lower.includes("giao dịch")) {
    keywords.push("short_term_view");
  }

  return keywords;
}

// Validate update against portfolio constraints
function validateUpdate(
  update: Partial<DecisionUpdate>,
  decision: DecisionCheckpoint,
  portfolio: DecisionRevisionRequest["portfolio"],
  currentPrices: Record<string, number>
): { valid: boolean; reason?: string } {
  const ticker = update.ticker || decision.ticker;
  if (!ticker) return { valid: true };

  const price = currentPrices[ticker] || decision.currentPrice || 0;
  if (price <= 0) return { valid: false, reason: "Không có giá hiện tại cho mã này" };

  const holding = portfolio.holdings[ticker];
  const currentAllocation = holding
    ? (holding.quantity * holding.avgPrice) / portfolio.initialCapital
    : 0;

  // Check if suggested allocation is reasonable
  if (update.targetAllocation !== undefined) {
    if (update.targetAllocation < 0) {
      return { valid: false, reason: "Tỷ trọng không thể âm" };
    }
    if (update.targetAllocation > 50) {
      return { valid: false, reason: "Tỷ trọng một mã không nên quá 50% danh mục" };
    }
  }

  // Check cash balance for buy actions
  if (update.action === "BUY" && update.targetAllocation !== undefined) {
    const cost = (portfolio.initialCapital * update.targetAllocation) / 100;
    if (cost > portfolio.cashBalance * 1.5) {
      return { valid: false, reason: "Không đủ tiền mặt cho giao dịch này" };
    }
  }

  // Check holdings for sell actions
  if (update.action === "SELL" && !holding) {
    return { valid: false, reason: "Không có vị thế để bán" };
  }

  // Validate stop-loss / take-profit
  if (update.stopLoss && update.takeProfit) {
    if (update.stopLoss >= update.takeProfit) {
      return { valid: false, reason: "Stop-loss phải thấp hơn take-profit" };
    }
  }

  return { valid: true };
}

// Apply feedback to create updated decision
function applyRevision(
  keywords: FeedbackKeyword[],
  decision: DecisionCheckpoint,
  portfolio: DecisionRevisionRequest["portfolio"],
  currentPrices: Record<string, number>
): DecisionUpdate {
  const baseConfidence = decision.confidence;
  let action: DecisionUpdate['action'] = decision.recommendation.action;
  let confidence = baseConfidence;
  let riskNote = "";
  let rationale = "";
  let updateChoices = false;

  // Build rationale based on keywords
  const reasons: string[] = [];

  // Risk adjustments
  if (keywords.includes("risk_conservative")) {
    if (action === "BUY") {
      action = "HOLD";
    }
    confidence = Math.max(30, baseConfidence - 15);
    reasons.push("Ưu tiên bảo toàn vốn theo yêu cầu của bạn");
    riskNote = "⚠️ Hồ sơ rủi ro thận trọng: giảm tỷ trọng cổ phiếu";
  } else if (keywords.includes("risk_aggressive")) {
    confidence = Math.min(95, baseConfidence + 10);
    reasons.push("Chấp nhận rủi ro cao hơn theo yêu cầu của bạn");
    riskNote = "⚡ Rủi ro cao hơn - chỉ khi bạn hiểu rủi ro";
  }

  // Cash concerns
  if (keywords.includes("cash_needed")) {
    if (action === "BUY") {
      action = "HOLD";
      reasons.push("Giữ tiền mặt theo yêu cầu của bạn");
    }
    confidence = Math.max(25, confidence - 10);
    riskNote = "⚠️ Ưu tiên thanh khoản - giảm tỷ trọng";
  }

  // Timing adjustments
  if (keywords.includes("timing_early")) {
    if (action === "BUY") {
      action = "HOLD";
      reasons.push("Chờ thời điểm tốt hơn để vào lệnh");
    }
    confidence = Math.max(35, confidence - 20);
    riskNote = "⏳ Chờ điểm vào tốt hơn";
  }
  if (keywords.includes("timing_late")) {
    reasons.push("Điểm vào có thể đã muộn - cẩn trọng hơn");
    confidence = Math.max(40, confidence - 15);
  }

  // Ticker preferences
  if (keywords.includes("avoid_ticker") && decision.ticker) {
    action = "WATCH";
    reasons.push(`Bạn yêu cầu tránh mã ${decision.ticker}`);
    confidence = Math.max(30, confidence - 25);
    riskNote = `⚠️ Tránh ${decision.ticker} theo yêu cầu - chuyển sang theo dõi`;
  }

  // Position sizing
  if (keywords.includes("reduce_position")) {
    if (action === "BUY") {
      action = "HOLD";
      reasons.push("Giảm quy mô vị thế theo yêu cầu");
    }
    confidence = Math.max(35, confidence - 10);
    riskNote = "📉 Giảm tỷ trọng - cẩn trọng hơn";
  }
  if (keywords.includes("increase_position")) {
    confidence = Math.min(90, confidence + 5);
    reasons.push("Tăng tỷ trọng theo yêu cầu");
    riskNote = "📈 Tăng tỷ trọng - phù hợp với khẩu vị rủi ro";
  }

  // Position stance
  if (keywords.includes("keep_position")) {
    action = "HOLD";
    reasons.push("Giữ nguyên vị thế theo yêu cầu của bạn");
    confidence = Math.max(50, confidence);
    riskNote = "✓ Giữ nguyên - không thay đổi";
  }
  if (keywords.includes("watch_only")) {
    if (action === "BUY") {
      action = "HOLD";
    }
    reasons.push("Theo dõi thêm trước khi hành động");
    confidence = Math.max(40, confidence - 15);
    riskNote = "👁️ Theo dõi - chưa vào lệnh";
  }

  // Time horizon
  if (keywords.includes("long_term_view")) {
    confidence = Math.min(85, confidence + 10);
    reasons.push("Đầu tư dài hạn - tăng confidence");
    riskNote = "📊 Tầm nhìn dài hạn - ổn định hơn";
  }
  if (keywords.includes("short_term_view")) {
    confidence = Math.max(40, confidence - 20);
    reasons.push("Ngắn hạn - giảm confidence");
    riskNote = "⚡ Ngắn hạn - biến động cao hơn";
  }

  // Default rationale if no specific keywords matched
  if (reasons.length === 0) {
    reasons.push("Đã điều chỉnh dựa trên phản hồi của bạn");
  }

  rationale = reasons.join(". ");

  return {
    action,
    confidence,
    riskNote,
    rationale,
    updateChoices: action !== decision.recommendation.action,
  };
}

// Build revised choices based on new action
function buildRevisedChoices(
  action: DecisionUpdate["action"],
  decision: DecisionCheckpoint
): DecisionCheckpoint["choices"] {
  const baseLabels: Record<string, { label: string; description: string; variant: "primary" | "secondary" | "destructive" }> = {
    BUY: { label: "Mua theo khuyến nghị", description: "Thực hiện mua với điều chỉnh", variant: "primary" },
    SELL: { label: "Bán theo khuyến nghị", description: "Thực hiện bán với điều chỉnh", variant: "destructive" },
    HOLD: { label: "Giữ nguyên vị thế", description: "Không thay đổi danh mục", variant: "secondary" },
    REBALANCE: { label: "Cân bằng lại danh mục", description: "Điều chỉnh tỷ trọng", variant: "primary" },
    GRID: { label: "Thực hiện Grid Buy", description: "Mua theo lưới giá", variant: "primary" },
    WATCH: { label: "Theo dõi thêm", description: "Chờ thêm thông tin trước khi hành động", variant: "secondary" },
    SKIP: { label: "Bỏ qua", description: "Không thực hiện thay đổi", variant: "secondary" },
  };

  const primary = baseLabels[action] || baseLabels.HOLD;

  return [
    { id: "confirm", label: primary.label, description: primary.description, variant: primary.variant },
    { id: "keep", label: "Giữ quyết định gốc", description: "Quay lại khuyến nghị ban đầu", variant: "secondary" },
  ];
}

export async function POST(req: Request) {
  try {
    const body: DecisionRevisionRequest = await req.json();
    const { feedback, decision, portfolio, currentPrices } = body;

    // Validate input
    if (!feedback || !decision) {
      return NextResponse.json(
        { error: "Thiếu thông tin cần thiết để điều chỉnh quyết định" },
        { status: 400 }
      );
    }

    // Only allow revision of pending decisions
    if (decision.status !== "pending") {
      return NextResponse.json(
        { error: "Chỉ có thể điều chỉnh quyết định đang chờ xác nhận" },
        { status: 400 }
      );
    }

    // Classify feedback
    const keywords = classifyFeedback(feedback);

    // Apply revision
    const update = applyRevision(keywords, decision, portfolio, currentPrices);

    // Validate against constraints
    const validation = validateUpdate(update, decision, portfolio, currentPrices);

    if (!validation.valid) {
      return NextResponse.json({
        update: null,
        valid: false,
        reason: validation.reason,
        message: `Không thể điều chỉnh: ${validation.reason}. Quyết định gốc được giữ nguyên.`,
      });
    }

    // Build revised decision - map extended actions back to ReplayAction
    const actionMap: Record<string, ReplayAction> = {
      'BUY': 'BUY',
      'SELL': 'SELL',
      'HOLD': 'HOLD',
      'REBALANCE': 'REBALANCE',
      'GRID': 'GRID',
      'WATCH': 'HOLD', // WATCH maps to HOLD
      'SKIP': 'HOLD', // SKIP maps to HOLD
    };
    const mappedAction = actionMap[update.action] || 'HOLD';

    const revisedDecision: DecisionCheckpoint = {
      ...decision,
      recommendation: {
        ...decision.recommendation,
        action: mappedAction,
        summary: update.riskNote || decision.recommendation.summary,
        suggestedPercent: update.targetAllocation ?? decision.recommendation.suggestedPercent,
      },
      confidence: update.confidence,
      choices: update.updateChoices !== false
        ? buildRevisedChoices(update.action, decision)
        : decision.choices,
    };

    return NextResponse.json({
      update: update,
      revisedDecision: revisedDecision,
      valid: true,
      message: "Quyết định đã được điều chỉnh dựa trên phản hồi của bạn.",
    });
  } catch (error: any) {
    console.error("Error in decision revision:", error);
    return NextResponse.json(
      { error: "Đã xảy ra lỗi khi điều chỉnh quyết định" },
      { status: 500 }
    );
  }
}
