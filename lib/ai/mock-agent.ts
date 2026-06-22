import type { AIAgentResponse, DecisionRevision, DecisionChip } from "./types";
import { delay } from "@/lib/utils";
import { getStockBySymbol, STOCKS } from "@/lib/market/mock-data";
import type { AgentResponse, AgentContext } from "./agent/types";

const MOCK_RESPONSES: Record<string, AIAgentResponse> = {
  default: {
    message: "Đây là phân tích tổng quan dựa trên dữ liệu mới nhất.",
    cards: [
      { type: "summary", title: "Tóm tắt", content: "Thị trường đang trong xu hướng tăng ngắn hạn. Các chỉ số chính đều tích cực.", sentiment: "bullish" },
      { type: "risk", title: "Rủi ro chính", content: "Lãi suất cao kéo dài có thể ảnh hưởng đến định giá cổ phiếu công nghệ.", data: { "Mức rủi ro": "Trung bình", "Thời gian": "3-6 tháng" } },
    ],
  },
  analysis: {
    message: "Phân tích chi tiết cho mã cổ phiếu được yêu cầu.",
    cards: [
      { type: "summary", title: "Tổng quan", content: "Cổ phiếu đang giao dịch gần vùng kháng cự. Volume tăng mạnh trong phiên gần nhất.", sentiment: "bullish" },
      { type: "technical", title: "Tín hiệu kỹ thuật", content: "RSI: 62.5 (Trung lập)\nMACD: Tín hiệu mua\nMA(50): Trên đường trung bình", data: { RSI: 62.5, MACD: "Mua", "MA50": "Bullish" } },
      { type: "sentiment", title: "Sentiment tin tức", content: "Sentiment chung tích cực. 7/10 tin gần nhất là tích cực.", sentiment: "bullish", data: { "Tích cực": "70%", "Tiêu cực": "20%", "Trung lập": "10%" } },
      { type: "risk", title: "Rủi ro", content: "Định giá P/E cao hơn trung bình ngành. Cần theo dõi kết quả quý tiếp theo.", data: { "P/E vs Ngành": "+15%", "Beta": "1.24" } },
    ],
  },
  compare: {
    message: "So sánh giữa các mã cổ phiếu được yêu cầu.",
    cards: [
      { type: "compare", title: "So sánh", content: "Cả hai mã đều có tiềm năng tăng trưởng tốt, nhưng khác nhau về mức rủi ro.", data: { "P/E (A)": "33.2", "P/E (B)": "64.5", "Beta (A)": "1.24", "Beta (B)": "1.68" } },
      { type: "summary", title: "Kết luận", content: "Mã A phù hợp cho nhà đầu tư ổn định. Mã B phù hợp cho nhà đầu tư chấp nhận rủi ro cao hơn.", sentiment: "neutral" },
    ],
  },
  watchlist: {
    message: "Phân tích watchlist của bạn.",
    cards: [
      { type: "watchlist", title: "Tín hiệu Watchlist", content: "3/5 mã trong watchlist đang có tín hiệu tích cực.", data: { "Tín hiệu mua": "NVDA, AAPL", "Theo dõi": "MSFT", "Tín hiệu bán": "Không có" } },
      { type: "news", title: "Tin nổi bật", content: "NVDA: Doanh thu kỷ lục Q1\nAAPL: Ra mắt sản phẩm mới\nTSLA: Biến động giá mạnh" },
    ],
  },
};

function detectResponseType(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("mua") || lower.includes("bán") || lower.includes("đặt lệnh") || lower.includes("order") || lower.includes("giao dịch") || lower.includes("buy") || lower.includes("sell")) {
    return "order";
  }
  if (lower.includes("so sánh") || lower.includes("compare")) return "compare";
  if (lower.includes("watchlist") || lower.includes("tín hiệu")) return "watchlist";
  if (lower.includes("phân tích") || lower.includes("tóm tắt") || lower.includes("tình hình")) return "analysis";
  return "default";
}

export async function getMockAIResponse(message: string, symbol: string = "AAPL"): Promise<AIAgentResponse> {
  await delay(600 + Math.random() * 400);
  const type = detectResponseType(message);

  if (type === "order") {
    const isSell = message.toLowerCase().includes("bán") || message.toLowerCase().includes("sell");
    const action = isSell ? "BÁN" : "MUA";
    const stock = getStockBySymbol(symbol.toUpperCase());
    const price = stock ? stock.price : 150;
    const qty = 100;
    const total = price * qty;

    return {
      message: `Tôi đã chuẩn bị sẵn lệnh nháp ${action} cho mã ${symbol.toUpperCase()}. Bạn có muốn thực hiện lệnh đặt này không?`,
      cards: [
        {
          type: "order",
          title: "Xác nhận Lệnh giao dịch (AI Suggested)",
          content: `Hệ thống gợi ý đặt lệnh ${action} dựa trên phân tích kỹ thuật hiện tại của ${symbol.toUpperCase()}.`,
          data: {
            "Mã cổ phiếu": symbol.toUpperCase(),
            "Hành động": action,
            "Khối lượng": qty,
            "Giá khớp dự kiến": `$${price.toFixed(2)}`,
            "Tổng giá trị": `$${total.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            "Loại lệnh": "LO (Limit Order)",
          },
          sentiment: isSell ? "bearish" : "bullish",
        },
      ],
    };
  }

  const baseRes = MOCK_RESPONSES[type] || MOCK_RESPONSES.default;
  return baseRes;
}

export const SUGGESTED_PROMPTS = [
  "Phân tích AAPL hôm nay",
  "Tóm tắt tin mới nhất của NVDA",
  "So sánh TSLA và BYD",
  "Cổ phiếu nào trong watchlist đang có tín hiệu mạnh?",
  "Giải thích chỉ số P/E của MSFT",
  "Tạo lệnh mua cổ phiếu AAPL",
];

export const STOCK_PROMPTS = [
  "Tóm tắt tình hình mã này",
  "Vì sao cổ phiếu này tăng/giảm hôm nay?",
  "Đặt lệnh mua cổ phiếu này",
  "Đặt lệnh bán cổ phiếu này",
  "Giải thích rủi ro chính",
];

// ── Decision Feedback mock engine ──

interface FeedbackContext {
  decisionTitle: string;
  decisionDescription: string;
  aiAdvice: string;
  selectedChipValue?: string;
  selectedChipLabel?: string;
  symbol?: string;
  portfolioRisk?: string;
  cashBalance?: number;
  priorFeedback?: string[];
}

/** Keyword → transformation hint */
type FeedbackKeyword = "risk" | "cash" | "short_term" | "growth" | "long_term" | "higher_risk" | "avoid_sector" | "entry_price" | "wait" | "reduce" | "keep_position";

function classifyFeedback(text: string): FeedbackKeyword[] {
  const lower = text.toLowerCase();
  const keywords: FeedbackKeyword[] = [];
  if (lower.includes("rủi ro") || lower.includes("giảm rủi ro") || lower.includes("an toàn") || lower.includes("thận trọng") || lower.includes("bảo toàn")) keywords.push("risk");
  if (lower.includes("tiền mặt") || lower.includes("cash") || lower.includes("số dư") || lower.includes("cần tiền") || lower.includes("không đủ")) keywords.push("cash");
  if (lower.includes("ngắn hạn") || lower.includes("tháng tới") || lower.includes("sớm cần") || lower.includes("tương lai gần") || lower.includes("gần")) keywords.push("short_term");
  if (lower.includes("tăng trưởng") || lower.includes("dài hạn") || lower.includes("giữ lâu") || lower.includes("hold long") || lower.includes("dài hạn")) keywords.push("long_term");
  if (lower.includes("chấp nhận rủi ro") || lower.includes("mạo hiểm") || lower.includes("higher risk") || lower.includes("tăng rủi ro")) keywords.push("higher_risk");
  if (lower.includes("không mua") || lower.includes("tránh") || lower.includes("không đụng") || lower.includes("cấm") || lower.includes("loại")) keywords.push("avoid_sector");
  if (lower.includes("giá vào") || lower.includes("chờ giá") || lower.includes("entry price") || lower.includes("mua thấp hơn") || lower.includes("bán cao hơn")) keywords.push("entry_price");
  if (lower.includes("chờ") || lower.includes("theo dõi") || lower.includes("đợi") || lower.includes("wait")) keywords.push("wait");
  if (lower.includes("giảm") || lower.includes("bớt") || lower.includes("ít hơn") || lower.includes("lower") || lower.includes("giảm bớt")) keywords.push("reduce");
  if (lower.includes("giữ nguyên") || lower.includes("giữ vị thế") || lower.includes("không bán") || lower.includes("keep")) keywords.push("keep_position");
  return keywords;
}

function buildRevisionMessage(keywords: FeedbackKeyword[], ctx: FeedbackContext): DecisionRevision {
  const timestamp = new Date().toISOString();

  // Default: no change
  let revisedAdvice = ctx.aiAdvice;
  let revisedChip = ctx.selectedChipValue;
  let revisedChipLabel = ctx.selectedChipLabel;
  let confidenceAdjustment = 0;
  let riskNote: string | undefined;
  let rationale = "Phản hồi của bạn đã được ghi nhận. Khuyến nghị giữ nguyên quyết định.";

  if (keywords.includes("risk") || keywords.includes("cash") || keywords.includes("short_term")) {
    // Reduce allocation / tighten risk
    if (ctx.selectedChipValue?.startsWith("buy") || ctx.selectedChipValue === "buy_more" || ctx.selectedChipValue === "buy_small") {
      revisedChip = "hold";
      revisedChipLabel = "Giữ nguyên / Quan sát";
      rationale = "Dựa trên phản hồi của bạn về sự thận trọng / cần tiền sớm / giảm rủi ro, tôi chuyển khuyến nghị sang GIỮ NGAY ĐỂ QUAN SÁT. Không mua thêm vào lúc này.";
      riskNote = "⚠️ Hạn chế: phản hồi ngắn hạn / cần thanh khoản — giảm vị thế mua.";
    } else if (ctx.selectedChipValue?.startsWith("rebalance") || ctx.selectedChipValue === "rebalance_yes") {
      revisedChip = "rebalance_skip";
      revisedChipLabel = "Bỏ qua cân bằng lần này";
      rationale = "Không cân bằng danh mục ngay lúc này. Giữ cấu trúc hiện tại.";
      riskNote = "⚠️ Ưu tiên thanh khoản / an toàn — trì hoãn cân bằng.";
    } else if (!ctx.selectedChipValue) {
      rationale = "Khuyến nghị HOLD/WATCH cho đến khi thị trường ổn định hơn.";
      riskNote = "⚠️ Ưu tiên bảo toàn vốn.";
    }
    confidenceAdjustment = -0.3;
  } else if (keywords.includes("avoid_sector")) {
    // Remove / reduce sector exposure
    if (ctx.selectedChipValue?.startsWith("buy")) {
      revisedChip = "watch";
      revisedChipLabel = "Theo dõi thêm";
      rationale = "Bạn yêu cầu tránh ngành này. Chuyển sang chế độ THEO DÕI — không mua vào lúc này.";
      riskNote = "⚠️ Phản hồi: tránh ngành — đã chuyển sang quan sát.";
    }
    confidenceAdjustment = -0.2;
  } else if (keywords.includes("entry_price") || keywords.includes("wait")) {
    // Change Buy to Watch / Hold
    if (ctx.selectedChipValue?.startsWith("buy")) {
      revisedChip = "watch";
      revisedChipLabel = "Theo dõi chờ giá tốt hơn";
      rationale = `Bạn muốn chờ giá tốt hơn trước khi vào lệnh. Ghi nhận — chuyển sang CHỜ THEO DÕI. Tôi sẽ thông báo khi có điểm vào phù hợp hơn.`;
      riskNote = "⏳ Chờ điểm vào — không mua ngay.";
    } else {
      rationale = "Đã ghi nhận yêu cầu chờ giá. Khuyến nghị tiếp tục theo dõi.";
    }
    confidenceAdjustment = -0.1;
  } else if (keywords.includes("long_term") || keywords.includes("growth")) {
    // Allow higher allocation if portfolio permits
    if (ctx.selectedChipValue?.startsWith("buy_small") || ctx.selectedChipValue === "buy_small") {
      revisedChip = "buy_more";
      revisedChipLabel = "Mua thêm khi giảm";
      rationale = "Với khung thời gian dài hạn và mục tiêu tăng trưởng, bạn có thể tăng tỷ trọng nếu giá giảm thêm. Chuẩn bị sẵn kế hoạch trung bình giá (DCA).";
      riskNote = "📈 Đầu tư dài hạn — tăng tỷ trọng khi giá thấp hơn.";
    } else if (!ctx.selectedChipValue) {
      rationale = "Khuyến nghị đầu tư dài hạn. Cân nhắc tích sản với chiến lược trung bình giá.";
    }
    confidenceAdjustment = 0.2;
  } else if (keywords.includes("higher_risk")) {
    if (ctx.selectedChipValue?.startsWith("hold") || ctx.selectedChipValue === "hold" || ctx.selectedChipValue === "wait") {
      revisedChip = "buy_more";
      revisedChipLabel = "Mua thêm khi giảm";
      rationale = "Với khẩu vị rủi ro cao hơn, bạn có thể tận dụng biến động để gia tăng vị thế khi giá giảm.";
      riskNote = "⚡ Rủi ro cao — chỉ nếu bạn hiểu rủi ro danh mục.";
    }
    confidenceAdjustment = 0.15;
  } else if (keywords.includes("reduce")) {
    if (ctx.selectedChipValue?.startsWith("buy")) {
      revisedChip = "watch";
      revisedChipLabel = "Giảm quy mô / Theodõi";
      rationale = "Ghi nhận yêu cầu giảm quy mô. Chuyển sang chế độ theo dõi với khối lượng nhỏ hơn.";
      riskNote = "📉 Giảm quy mô — theo dõi trước.";
    }
    confidenceAdjustment = -0.2;
  } else if (keywords.includes("keep_position")) {
    rationale = "Đã ghi nhận. Giữ nguyên vị thế hiện tại theo yêu cầu của bạn.";
    confidenceAdjustment = 0;
  }

  return {
    id: `rev_${Date.now()}`,
    decisionId: ctx.decisionTitle,
    originalAdvice: ctx.aiAdvice,
    revisedAdvice,
    originalChip: ctx.selectedChipValue,
    originalChipLabel: ctx.selectedChipLabel,
    revisedChip: revisedChip ?? undefined,
    revisedChipLabel: revisedChipLabel ?? undefined,
    confidenceAdjustment,
    riskNote,
    rationale,
    timestamp,
  };
}

export async function getMockDecisionFeedback(
  feedback: string,
  ctx: FeedbackContext
): Promise<{ message: string; revision: DecisionRevision }> {
  await delay(400 + Math.random() * 300);

  const keywords = classifyFeedback(feedback);
  const revision = buildRevisionMessage(keywords, ctx);

  const hasChanged = revision.originalChip !== revision.revisedChip;
  const changeNote = hasChanged
    ? `\n\n🡆 **Thay đổi khuyến nghị:**`
    : "";

  const message =
    `Tôi đã phân tích phản hồi của bạn: *"${feedback}"*\n\n` +
    `${revision.rationale}` +
    (revision.riskNote ? `\n\n${revision.riskNote}` : "") +
    changeNote +
    (hasChanged
      ? `\n- **Trước đó:** ${revision.originalChipLabel ?? revision.originalChip ?? "—"}\n- **Sau phản hồi:** ${revision.revisedChipLabel ?? revision.revisedChip ?? "—"}\n\nNhấn **"Xác nhận"** để lưu quyết định hoặc gửi phản hồi thêm để điều chỉnh tiếp.`
      : `\n\nNhấn **"Xác nhận"** để lưu quyết định hoặc gửi phản hồi thêm.`);

  return { message, revision };
}

// ── Structured Agent Response (new unified interface) ──

// Context shape used by the structured mock parser
interface StructuredContext {
  activeDecision?: {
    id: string;
    title: string;
    description: string;
    ticker?: string;
    recommendedAction?: string;
    chips?: DecisionChip[];
    pendingChipValue?: string;
    pendingChipLabel?: string;
  };
  cashBalance?: number;
  holdings?: Array<{ symbol: string; quantity: number; avgPrice: number }>;
}

// Ticker extraction from user message
function extractTickers(text: string): string[] {
  const upper = text.toUpperCase();
  return STOCKS
    .filter((s) => upper.includes(s.symbol) || upper.includes(s.name.toUpperCase()))
    .map((s) => s.symbol);
}

// Parse feedback into structured intent + decision patch
function parseFeedbackToAgentResponse(
  feedback: string,
  ctx: StructuredContext
): AgentResponse {
  const lower = feedback.toLowerCase();
  const tickers = extractTickers(feedback);

  // Direct ticker action: "Tôi muốn mua AAPL" / "Mua thêm NVDA"
  const isBuy = /mua|buy/i.test(lower);
  const isSell = /bán|sell/i.test(lower);
  const isHold = /giữ\s*nguyên|giữ\s*vị\s*thế|hold/i.test(lower);
  const isWatch = /theo\s*dõi|watch|quan\s*sát/i.test(lower);

  // Sentiment modifiers
  const wantsLowerRisk = /giảm\s*rủi\s*ro|rủi\s*ro\s*thấp|an\s*toàn|thận\s*trọng/i.test(lower);
  const wantsHigherRisk = /tăng\s*rủi\s*ro|rủi\s*ro\s*cao|mạo\s*hiểm/i.test(lower);
  const wantsLess = /giảm|bớt|ít\s*hơn|lower/i.test(lower);
  const wantsMore = /tăng|thêm|nhiều\s*hơn/i.test(lower);
  const wantsCash = /cần\s*tiền|tạm\s*dừng|dài\s*hạn|tầm\s*nhìn/i.test(lower);

  // "Tôi muốn mua AAPL" — direct request
  if ((isBuy || isSell) && tickers.length > 0) {
    const ticker = tickers[0];
    const stock = getStockBySymbol(ticker);
    const price = stock?.price ?? 100;
    const holding = ctx.holdings?.find((h) => h.symbol === ticker);

    // Determine allocation
    const cash = ctx.cashBalance ?? 100_000;
    const suggestedPct = wantsLowerRisk ? 5 : wantsHigherRisk ? 15 : 10;
    const maxPct = 25;
    const allocationPct = Math.min(suggestedPct, maxPct);
    const amount = (allocationPct / 100) * (ctx.cashBalance ?? 100_000);
    const quantity = Math.floor(amount / price);

    const action = isBuy ? 'Buy' : 'Sell';
    const actualQty = isSell && holding ? Math.min(quantity > 0 ? quantity : holding.quantity, holding.quantity) : quantity;

    return {
      message: wantsLowerRisk
        ? `Tôi hiểu bạn muốn ${action === 'Buy' ? 'mua' : 'bán'} ${ticker} với mức cẩn trọng cao hơn. Điều chỉnh khuyến nghị: giảm tỷ trọng vào vùng an toàn.`
        : `Đã ghi nhận yêu cầu ${action === 'Buy' ? 'mua' : 'bán'} ${ticker}. Tôi chuẩn bị khuyến nghị ${action === 'Buy' ? 'mua' : 'bán'} ${actualQty} cổ phiếu ${ticker} @ $${price.toFixed(2)}.`,
      detectedIntent: isBuy ? 'buy' : 'sell',
      requestedTicker: ticker,
      requestedAction: action,
      requestedQuantity: actualQty,
      decisionPatch: {
        action,
        ticker,
        quantity: actualQty,
        allocationPct,
        confidence: 75,
        riskNote: wantsLowerRisk ? 'Giảm rủi ro: ưu tiên bảo toàn vốn.' : undefined,
        rationale: `${action} ${actualQty} ${ticker} @ $${price.toFixed(2)} — ~${allocationPct}% portfolio.`,
      },
    };
  }

  // "Đổi AAPL sang MSFT" — replace ticker
  if (/đổi|thay\s*thế|replace|chuyển\s*sang/i.test(lower) && tickers.length >= 1) {
    const fromTicker = tickers[0];
    const toTicker = tickers.length > 1 ? tickers[1] : undefined;

    return {
      message: toTicker
        ? `Đã ghi nhận yêu cầu thay thế ${fromTicker} bằng ${toTicker}. Chuẩn bị kế hoạch hoán đổi có kiểm soát — bán ${fromTicker} và mua ${toTicker} với cùng giá trị.`
        : `Đã ghi nhận yêu cầu thay thế. Bạn muốn thay bằng mã cổ phiếu nào?`,
      detectedIntent: 'replace',
      requestedTicker: toTicker ?? null,
      requestedAction: 'Rebalance',
      decisionPatch: toTicker ? {
        action: 'Rebalance',
        replaceTicker: fromTicker,
        ticker: toTicker,
        confidence: 80,
        rationale: `Hoán đổi ${fromTicker} → ${toTicker} có kiểm soát.`,
      } : undefined,
    };
  }

  // "Bán một nửa TSLA" — sell partial
  if (isSell && /nửa|một\s*phần|half|partial/i.test(lower)) {
    const ticker = tickers[0];
    const holding = ctx.holdings?.find((h) => h.symbol === ticker);
    if (!ticker || !holding) {
      return { message: `Bạn muốn bán một phần vị thế nào? Vui lòng cho biết mã cổ phiếu.`, detectedIntent: 'sell' };
    }
    const halfQty = Math.floor(holding.quantity / 2);
    return {
      message: `Đã ghi nhận: bán một nửa (${halfQty} cổ phiếu) ${ticker}. Khuyến nghị: bán ${halfQty} CP ${ticker} để chốt lời một phần.`,
      detectedIntent: 'sell',
      requestedTicker: ticker,
      requestedAction: 'Sell',
      requestedQuantity: halfQty,
      decisionPatch: {
        action: 'Sell',
        ticker,
        quantity: halfQty,
        confidence: 85,
        rationale: `Bán một nửa vị thế ${ticker}: ${halfQty} cổ phiếu.`,
      },
    };
  }

  // "Tôi không muốn giữ META nữa" — watch/don't buy
  if (/không\s*muốn\s*giữ|drop|remove|xoá/i.test(lower) && tickers.length > 0) {
    const ticker = tickers[0];
    return {
      message: `Đã ghi nhận: loại bỏ ${ticker} khỏi danh mục. Chuyển sang chế độ theo dõi.`,
      detectedIntent: 'watch',
      requestedTicker: ticker,
      requestedAction: 'Watch',
      decisionPatch: {
        action: 'Watch',
        ticker,
        confidence: 70,
        rationale: `Loại bỏ ${ticker} khỏi khuyến nghị mua. Chuyển sang theo dõi.`,
      },
    };
  }

  // "Tôi cần tiền trong 2 tháng" — cash need
  if (/cần\s*tiền|tạm\s*dừng|rút\s*vốn/i.test(lower)) {
    return {
      message: `Đã ghi nhận: bạn cần thanh khoản trong ngắn hạn. Điều chỉnh chiến lược: giảm tỷ trọng cổ phiếu, ưu tiên tiền mặt.`,
      detectedIntent: 'cash_need',
      requestedAction: 'Hold',
      decisionPatch: {
        action: 'Hold',
        confidence: 60,
        riskNote: 'Ưu tiên thanh khoản: giảm position size, không mua thêm.',
        rationale: 'Cash need ngắn hạn — giảm exposure, tăng reserve.',
      },
    };
  }

  // "Giảm rủi ro" — during active decision
  if (wantsLowerRisk && ctx.activeDecision) {
    const { activeDecision } = ctx;
    const pendingChipValue = activeDecision.pendingChipValue;
    const chip = pendingChipValue
      ? activeDecision.chips?.find((c: DecisionChip) => c.value === pendingChipValue)
      : null;

    // If current chip is buy-related, switch to hold/watch
    const isBuyChip = chip?.value?.startsWith('buy');

    return {
      message: `Đã hiểu: bạn muốn giảm rủi ro. Điều chỉnh quyết định từ "${chip?.label ?? 'khuyến nghị hiện tại'}" sang "**Giữ nguyên / Quan sát**" — không mua thêm vào lúc này. Thị trường đang biến động, ưu tiên bảo toàn vốn.`,
      detectedIntent: 'reduce_risk',
      requestedAction: 'Hold',
      decisionPatch: {
        action: 'Hold',
        ticker: activeDecision.ticker,
        confidence: 65,
        riskNote: '⚠️ Ưu tiên giảm rủi ro: giữ nguyên vị thế, không mua thêm.',
        rationale: `Phản hồi: giảm rủi ro — chuyển từ ${chip?.label ?? 'mua'} sang giữ quan sát.`,
      },
    };
  }

  // "Tăng rủi ro" / "tăng trưởng"
  if (wantsHigherRisk && ctx.activeDecision) {
    return {
      message: `Đã ghi nhận: bạn muốn tăng rủi ro / tăng trưởng. Có thể tăng tỷ trọng nếu thị trường cho phép.`,
      detectedIntent: 'increase_risk',
      requestedAction: 'Buy',
      decisionPatch: {
        action: 'Buy',
        confidence: 80,
        riskNote: '⚡ Chấp nhận rủi ro cao hơn — tăng exposure khi có cơ hội.',
        rationale: 'Tăng khẩu vị rủi ro — ưu tiên tăng trưởng.',
      },
    };
  }

  // Default: return acknowledgment with unknown intent
  return {
    message: `Đã ghi nhận phản hồi của bạn. Để tôi điều chỉnh khuyến nghị cho phù hợp.`,
    detectedIntent: 'unknown',
  };
}

// Public: structured mock response for the unified agent endpoint
export async function getMockAgentResponse(
  userMessage: string,
  ctx: AgentContext
): Promise<AgentResponse> {
  await delay(300 + Math.random() * 300);

  const structuredCtx: StructuredContext = {
    activeDecision: ctx.activeDecision
      ? {
          id: ctx.activeDecision.id,
          title: ctx.activeDecision.title,
          description: ctx.activeDecision.description,
          ticker: ctx.activeDecision.ticker,
          recommendedAction: ctx.activeDecision.recommendedAction,
          chips: ctx.activeDecision.chips as DecisionChip[],
          pendingChipValue: ctx.activeDecision.pendingChipValue,
          pendingChipLabel: ctx.activeDecision.pendingChipLabel,
        }
      : undefined,
    cashBalance: ctx.cashBalance,
    holdings: ctx.holdings,
  };

  return parseFeedbackToAgentResponse(userMessage, structuredCtx);
}
