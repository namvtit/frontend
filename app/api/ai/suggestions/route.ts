import { NextResponse } from "next/server";

/**
 * GET /api/ai/suggestions
 * GET /api/ai/suggestions?signal=BUY
 *
 * Trả về danh sách gợi ý giao dịch từ AI.
 * Query param `signal` (optional): lọc theo tín hiệu BUY/SELL/HOLD/WAIT.
 * Hiện tại dùng mock data. Khi kết nối backend thật, thay bằng fetch từ AI service.
 */

const MOCK_SUGGESTIONS = [
  {
    id: "s1",
    symbol: "BTCUSDT",
    signal: "BUY",
    confidence: 78,
    riskLevel: "medium",
    entryZone: "$101,200 – $102,500",
    stopLoss: "$98,800",
    takeProfit: "$108,500",
    riskReward: "1:2.4",
    reason: "BTC đang tích lũy trên vùng hỗ trợ mạnh $100K, RSI divergence tăng trên khung H4, volume mua tăng dần.",
    warning: "Biến động cao quanh vùng $100K. Có thể xảy ra false breakout.",
    timeframe: "H4 – D1",
  },
  {
    id: "s2",
    symbol: "ETHUSDT",
    signal: "WAIT",
    confidence: 45,
    riskLevel: "high",
    entryZone: "$3,850 – $3,920",
    stopLoss: "$3,700",
    takeProfit: "$4,200",
    riskReward: "1:1.8",
    reason: "ETH đang sideways, chưa có tín hiệu breakout rõ ràng. MACD ngang, volume giảm dần.",
    warning: "Tín hiệu chưa rõ ràng, chờ xác nhận từ BTC. Không nên vào lệnh lúc này.",
    timeframe: "H4",
  },
  {
    id: "s3",
    symbol: "XAUUSD",
    signal: "SELL",
    confidence: 72,
    riskLevel: "medium",
    entryZone: "$2,385 – $2,395",
    stopLoss: "$2,415",
    takeProfit: "$2,340",
    riskReward: "1:2.2",
    reason: "Vàng đang ở vùng kháng cự mạnh, hình thành double top trên D1. DXY có dấu hiệu hồi phục.",
    warning: "Tin tức CPI sắp công bố có thể gây biến động mạnh bất ngờ.",
    timeframe: "D1",
  },
  {
    id: "s4",
    symbol: "NVDA",
    signal: "BUY",
    confidence: 85,
    riskLevel: "low",
    entryZone: "$132.00 – $136.00",
    stopLoss: "$127.50",
    takeProfit: "$152.00",
    riskReward: "1:3.1",
    reason: "Báo cáo doanh thu kỷ lục, trend tăng mạnh. AI demand tiếp tục tăng. Cup & handle pattern trên weekly.",
    warning: "PE ratio cao. Có thể xảy ra profit-taking ngắn hạn sau earnings.",
    timeframe: "W1",
  },
  {
    id: "s5",
    symbol: "AAPL",
    signal: "HOLD",
    confidence: 60,
    riskLevel: "low",
    entryZone: "$210.00 – $215.00",
    stopLoss: "$205.00",
    takeProfit: "$230.00",
    riskReward: "1:2.5",
    reason: "AAPL đang trong uptrend nhẹ. Vision Pro 2 là catalyst tích cực. Giữ vị thế hiện tại.",
    warning: "Cạnh tranh mạnh từ Samsung và Meta trong mảng XR.",
    timeframe: "D1 – W1",
  },
];

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const signal = searchParams.get("signal")?.toUpperCase();

  const filtered = signal && signal !== "ALL"
    ? MOCK_SUGGESTIONS.filter((s) => s.signal === signal)
    : MOCK_SUGGESTIONS;

  return NextResponse.json({
    suggestions: filtered,
    total: MOCK_SUGGESTIONS.length,
    filtered: filtered.length,
    updatedAt: new Date().toISOString(),
  });
}
