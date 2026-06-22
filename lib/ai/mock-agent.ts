import { AIAgentResponse, AICard } from "./types";
import { delay } from "@/lib/utils";
import { getStockBySymbol } from "@/lib/market/mock-data";
import type { DecisionRevision } from "./types";

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
