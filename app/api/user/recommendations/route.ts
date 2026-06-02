import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    data: [
      { symbol: "NVDA", reason: "Doanh thu kỷ lục, nhiều tin tích cực", type: "news" },
      { symbol: "AAPL", reason: "Gần 52-week high, sản phẩm mới", type: "technical" },
      { symbol: "TSLA", reason: "Biến động mạnh, volume cao", type: "volatility" },
      { symbol: "MSFT", reason: "Đầu tư AI lớn, triển vọng tốt", type: "fundamental" },
    ],
  });
}
