import type { AIAgentResponse, DecisionRevision, DecisionChip } from "./types";
import { delay } from "@/lib/utils";
import { getStockBySymbol, STOCKS } from "@/lib/market/mock-data";
import type { AgentResponse, AgentContext } from "./agent/types";

const SCOPE_REDIRECT = "Câu hỏi này không thuộc mục tiêu phân tích tài chính và quản trị rủi ro của FinPilot. Bạn có thể hỏi tôi về danh mục, mức drawdown, phân bổ vốn, luận điểm đầu tư hoặc kết quả Historical Challenge.";

function isObviouslyUnrelated(message: string): boolean {
  return /bài thơ|thơ tình|công thức nấu|viết truyện|dịch (?:sang|giúp)|lập trình|viết code|bóng đá|du lịch/i.test(message);
}

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
      { type: "news", title: "Tin nổi bật", content: "NVDA: Siêu chip Blackwell cháy hàng đến 2027, vốn hóa đạt $5.15T\nAAPL: Ra mắt Apple Intelligence thế hệ mới\nTSLA: Ký hợp đồng 100k chip cho Robotaxi" },
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
  if (isObviouslyUnrelated(message)) return { message: SCOPE_REDIRECT, cards: [] };

  if (symbol.toUpperCase() === "NVDA") {
    const lower = message.toLowerCase();
    
    // Why it is up/down / reasons / catalysts
    if (lower.includes("vì sao") || lower.includes("tăng") || lower.includes("hôm nay") || lower.includes("lý do") || lower.includes("động lực") || lower.includes("why")) {
      return {
        message: "NVIDIA (NVDA) hôm nay tăng mạnh +2.95% lên mức kỷ lục $210.69/cổ phiếu nhờ sự cộng hưởng của các siêu hợp đồng AI và sự hậu thuẫn quyết liệt từ Phố Wall:",
        cards: [
          {
            type: "summary",
            title: "Siêu chip Blackwell GB200 & B200 cháy hàng",
            content: "Big Tech (Microsoft, Alphabet, Meta, Amazon) ồ ạt đặt cọc thêm hơn 50 tỷ USD cho siêu chip Blackwell GB200 NVL72. Toàn bộ dây chuyền sản xuất đã kín chỗ đến hết năm 2027.",
            sentiment: "bullish",
            data: { "Đơn đặt cọc mới": "+$50 Tỷ USD", "Trạng thái sản xuất": "Kín chỗ đến hết 2027", "Nhu cầu thị trường": "Vượt cung 3.5 lần" }
          },
          {
            type: "news",
            title: "Hợp đồng Tesla Robotaxi & 12 Siêu cường Sovereign AI",
            content: "Tesla vừa chốt siêu hợp đồng bổ sung 100.000 cụm chip NVIDIA B200 và H200 cho trung tâm huấn luyện xe tự hành Robotaxi. Đồng thời liên minh 12 quốc gia đã ký kết gói đầu tư Siêu trung tâm tính toán AI chủ quyền.",
            sentiment: "bullish",
            data: { "Tesla Order": "100.000 cụm GPU", "Sovereign AI": "12 quốc gia tham gia", "Doanh thu dự kiến": "+$20 Tỷ USD" }
          },
          {
            type: "sentiment",
            title: "Phố Wall nâng mục tiêu giá lên $280",
            content: "Morgan Stanley và Goldman Sachs đồng loạt nâng Target Price lên $280 (+32.9% từ mức hiện tại), nhấn mạnh biên lợi nhuận gộp 75.8% là vô đối trong ngành công nghệ bán dẫn.",
            sentiment: "bullish",
            data: { "Target Price": "$280.00", "Khuyến nghị": "Mua mạnh (Strong Buy)", "Đồng thuận 48 CTCK": "36 Mua mạnh, 8 Mua" }
          }
        ]
      };
    }

    // Risks
    if (lower.includes("rủi ro") || lower.includes("risk") || lower.includes("thách thức") || lower.includes("nguy cơ")) {
      return {
        message: "Dù triển vọng tăng trưởng của NVIDIA đang ở mức cực kỳ xuất sắc với biên lợi nhuận kỷ lục, nhà đầu tư vẫn nên lưu ý 3 điểm trọng yếu sau:",
        cards: [
          {
            type: "risk",
            title: "Nút thắt đóng gói chip CoWoS",
            content: "Nhu cầu vượt xa năng lực cung ứng đóng gói CoWoS tiên tiến của TSMC. Bất kỳ sự chậm trễ nào trong chuỗi cung ứng đều có thể làm chậm tốc độ bàn giao siêu máy chủ Blackwell.",
            sentiment: "neutral",
            data: { "Đối tác gia công": "TSMC CoWoS", "Thời gian khắc phục": "Q3-Q4/2026", "Tác động": "Trung bình" }
          },
          {
            type: "risk",
            title: "Rào cản xuất khẩu địa chính trị",
            content: "Các biện pháp kiểm soát xuất khẩu chip AI sang thị trường Trung Quốc vẫn tiếp diễn. Tuy nhiên, doanh thu Sovereign AI từ Trung Đông, Nhật Bản và Tây Âu đang bù đắp vượt kỳ vọng.",
            sentiment: "neutral",
            data: { "Thị trường ảnh hưởng": "Trung Quốc", "Bù đắp tăng trưởng": "Sovereign AI (+140%)" }
          },
          {
            type: "summary",
            title: "Sức khỏe tài chính & Đệm an toàn",
            content: "Nợ dài hạn chỉ $8.46 tỷ so với $34.8 tỷ tiền mặt (Debt/Equity chỉ 0.14). Tỷ số thanh toán hiện hành 4.15 giúp NVDA sở hữu cấu trúc vốn gần như không có rủi ro thanh khoản.",
            sentiment: "bullish",
            data: { "Tiền mặt dự trữ": "$34.80 Tỷ", "Debt / Equity": "0.14", "Xếp hạng tín nhiệm": "AAA (Thượng hạng)" }
          }
        ]
      };
    }

    // Orders
    const type = detectResponseType(message);
    if (type === "order") {
      const isSell = lower.includes("bán") || lower.includes("sell");
      if (isSell) {
        return {
          message: "Lưu ý: NVDA đang nằm trong xu hướng TĂNG MẠNH (Strong Bullish) với hỗ trợ cứng tại $202.50 và kháng cự kế tiếp tại $218.00. Nếu bạn muốn chốt lời một phần hoặc tái cơ cấu danh mục, dưới đây là lệnh BÁN nháp:",
          cards: [
            {
              type: "order",
              title: "Lệnh BÁN Chốt lời (AI Risk Management)",
              content: "Khuyến nghị: Chỉ nên chốt lời từng phần (1/3 hoặc 1/2 vị thế) và giữ phần còn lại bám theo xu hướng với Trailing Stop tại $198.50.",
              data: {
                "Mã cổ phiếu": "NVDA",
                "Hành động": "BÁN MỘT PHẦN",
                "Khối lượng": 50,
                "Giá khớp dự kiến": "$210.69",
                "Tổng giá trị": "$10,534.50",
                "Ngưỡng hỗ trợ": "$202.50",
              },
              sentiment: "neutral"
            }
          ]
        };
      } else {
        return {
          message: "Tín hiệu kỹ thuật và cơ bản của NVIDIA hiện tại đạt mức MUA MẠNH (Strong Buy). Dưới đây là lệnh MUA nháp được tối ưu theo giá thị trường hiện tại:",
          cards: [
            {
              type: "order",
              title: "Xác nhận Lệnh MUA NVDA (AI Suggested)",
              content: "Hệ thống khuyến nghị MUA TÍCH LŨY với mục tiêu ngắn hạn $245.00 (+16.3%) và kịch bản tăng trưởng $280.00 (+32.9%). Cắt lỗ (Stop Loss) khuyến nghị tại $198.50 (dưới MA20).",
              data: {
                "Mã cổ phiếu": "NVDA",
                "Hành động": "MUA MẠNH",
                "Khối lượng": 100,
                "Giá khớp hiện tại": "$210.69",
                "Tổng giá trị": "$21,069.00",
                "Mục tiêu 1 (Consensus)": "$245.00 (+16.3%)",
                "Mục tiêu 2 (Bull Case)": "$280.00 (+32.9%)",
                "Stop Loss": "$198.50",
              },
              sentiment: "bullish"
            }
          ]
        };
      }
    }

    // Default overview/analysis for NVDA
    return {
      message: "Báo cáo phân tích toàn diện cho NVIDIA Corporation (NVDA) — Cập nhật phiên giao dịch mới nhất:",
      cards: [
        {
          type: "summary",
          title: "Vị thế dẫn đầu & Luận điểm đầu tư",
          content: "NVDA là vị vua tuyệt đối của kỷ nguyên trí tuệ nhân tạo toàn cầu với hơn 85% thị phần chip AI. Kiến trúc Blackwell B200/GB200 vừa ra mắt củng cố con hào kinh tế độc tôn, dự kiến mang về trên 100 tỷ USD doanh thu Data Center riêng trong năm tài chính này.",
          sentiment: "bullish",
          data: { "Vị thế thị trường": "Độc tôn >85% AI Training", "Vốn hóa": "$5.15 Nghìn tỷ USD", "Xếp hạng AI": "Dẫn đầu tuyệt đối" }
        },
        {
          type: "technical",
          title: "Chỉ báo kỹ thuật & Động lượng",
          content: "Tín hiệu MUA MẠNH (Strong Buy) trên toàn bộ khung thời gian. Đường giá nằm vững chắc trên MA20 ($198.50), MA50 ($182.20) và MA200 ($145.60). RSI(14) ở mức 66.8 điểm cho thấy đà mua áp đảo từ khối tổ chức (Smart Money).",
          sentiment: "bullish",
          data: { "RSI (14)": "66.8 (Đà tăng mạnh)", "MACD": "+4.250 (Phân kỳ dương)", "Hỗ trợ S1": "$202.50", "Kháng cự R1": "$218.00" }
        },
        {
          type: "sentiment",
          title: "Tâm lý thị trường & Dòng tin tức",
          content: "Tâm lý thị trường cực kỳ lạc quan (100% tin tức gần nhất mang sắc thái Tích cực - Bullish). 48 chuyên gia Phố Wall dự báo mức giá bình quân $245.00 và kịch bản tăng trưởng đạt $280.00.",
          sentiment: "bullish",
          data: { "Tâm lý chung": "Cực kỳ tích cực (Bullish)", "Mục tiêu trung bình": "$245.00 (+16.3%)", "Mục tiêu cao nhất": "$280.00 (+32.9%)" }
        },
        {
          type: "risk",
          title: "Định giá & Tỷ lệ PEG",
          content: "P/E 54.5x nhưng PEG chỉ 0.78x — mức định giá cực kỳ hấp dẫn so với tốc độ tăng trưởng lợi nhuận ròng +152% YoY và biên lợi nhuận gộp kỷ lục 75.8%.",
          sentiment: "bullish",
          data: { "P/E TTM": "54.5x", "Forward P/E": "32.8x", "PEG Ratio": "0.78x (Rất hấp dẫn)", "Biên LN Gộp": "75.8%" }
        }
      ]
    };
  }

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
  "Danh mục của tôi đang chịu rủi ro gì?",
  "Mức drawdown này có phù hợp với hồ sơ của tôi không?",
  "FinPilot Guardrails đã thay đổi kết quả Historical Challenge thế nào?",
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
  if (/drawdown|giảm\s*\d+%|sụt giảm|lỗ/i.test(lower)) {
    return {
      message: "Drawdown cần được đánh giá theo giới hạn chịu lỗ, thời hạn đầu tư và mức tập trung danh mục. Với mức giảm đã nêu, hãy kiểm tra nguyên nhân đến từ thị trường chung hay một vị thế riêng lẻ, tránh tăng tỷ trọng vội và xác định trước ngưỡng giảm rủi ro phù hợp.",
      detectedIntent: 'unknown',
    };
  }
  if (/phân bổ|đa dạng|tỷ trọng|allocation/i.test(lower)) {
    return {
      message: "Với hồ sơ cân bằng, nên phân bổ theo nhiều nhóm tài sản và giới hạn tỷ trọng từng vị thế để một mã không chi phối kết quả. Giữ một phần tiền mặt, ưu tiên tài sản cốt lõi đa dạng hóa và chỉ dành tỷ trọng nhỏ hơn cho các vị thế biến động cao.",
      detectedIntent: 'unknown',
    };
  }
  if (/luận điểm|historical challenge|historical replay|danh mục|rủi ro/i.test(lower)) {
    return {
      message: "Hãy đánh giá mục tiêu, thời hạn, mức tập trung và kịch bản thua lỗ của danh mục trước khi điều chỉnh. Một luận điểm đầu tư tốt cần có giả định kiểm chứng được, rủi ro làm luận điểm mất hiệu lực và quy tắc giảm vị thế rõ ràng.",
      detectedIntent: 'unknown',
    };
  }
  return {
    message: "Hãy cung cấp mục tiêu, thời hạn, mức drawdown có thể chấp nhận và tỷ trọng hiện tại để FinPilot phân tích rủi ro cụ thể hơn.",
    detectedIntent: 'unknown',
  };
}

// Public: structured mock response for the unified agent endpoint
export async function getMockAgentResponse(
  userMessage: string,
  ctx: AgentContext
): Promise<AgentResponse> {
  await delay(300 + Math.random() * 300);
  if (isObviouslyUnrelated(userMessage)) {
    return { message: SCOPE_REDIRECT, detectedIntent: 'unknown' };
  }

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
