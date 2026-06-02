import { AIAgentResponse, AICard } from "./types";
import { delay } from "@/lib/utils";

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
  if (lower.includes("so sánh") || lower.includes("compare")) return "compare";
  if (lower.includes("watchlist") || lower.includes("tín hiệu")) return "watchlist";
  if (lower.includes("phân tích") || lower.includes("tóm tắt") || lower.includes("tình hình")) return "analysis";
  return "default";
}

export async function getMockAIResponse(message: string): Promise<AIAgentResponse> {
  await delay(500 + Math.random() * 500);
  const type = detectResponseType(message);
  return MOCK_RESPONSES[type] || MOCK_RESPONSES.default;
}

export const SUGGESTED_PROMPTS = [
  "Phân tích AAPL hôm nay",
  "Tóm tắt tin mới nhất của NVDA",
  "So sánh TSLA và BYD",
  "Cổ phiếu nào trong watchlist đang có tín hiệu mạnh?",
  "Giải thích chỉ số P/E của MSFT",
  "Tạo watchlist AI cho ngành công nghệ",
];

export const STOCK_PROMPTS = [
  "Tóm tắt tình hình mã này",
  "Vì sao cổ phiếu này tăng/giảm hôm nay?",
  "Tóm tắt tin mới nhất",
  "So sánh mã này với đối thủ",
  "Giải thích rủi ro chính",
];
