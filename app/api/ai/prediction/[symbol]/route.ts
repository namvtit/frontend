import { NextResponse } from "next/server";

/**
 * GET /api/ai/prediction/[symbol]
 *
 * Trả về dữ liệu dự đoán giá cho biểu đồ AI Prediction Chart.
 * Bao gồm: giá lịch sử 60 ngày + dự đoán 14 ngày + confidence bands.
 * Hiện tại dùng mock data generator. Khi kết nối backend thật, thay bằng model AI thực.
 */

function generateMockPrediction(symbol: string) {
  const seed = symbol.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const rng = (i: number) => Math.sin(seed * 9301 + i * 49297) * 0.5 + 0.5;

  const basePrice = 150 + (seed % 100);
  const today = new Date();

  const historical: { time: string; value: number }[] = [];
  const prediction: { time: string; value: number }[] = [];
  const upperBand: { time: string; value: number }[] = [];
  const lowerBand: { time: string; value: number }[] = [];

  // 60 ngày lịch sử
  let price = basePrice;
  for (let i = 59; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    if (d.getDay() === 0 || d.getDay() === 6) continue;
    const change = (rng(i * 3 + seed) - 0.48) * 4;
    price += change;
    price = Math.max(price * 0.95, Math.min(price * 1.05, price));
    historical.push({
      time: d.toISOString().split("T")[0],
      value: Math.round(price * 100) / 100,
    });
  }

  const lastPrice = historical[historical.length - 1].value;
  const lastDate = new Date(historical[historical.length - 1].time);

  // Điểm nối
  prediction.push({ time: historical[historical.length - 1].time, value: lastPrice });
  upperBand.push({ time: historical[historical.length - 1].time, value: lastPrice });
  lowerBand.push({ time: historical[historical.length - 1].time, value: lastPrice });

  // 60 ngày dự đoán
  let predPrice = lastPrice;
  const trend = rng(seed * 7) > 0.45 ? 1 : -1;
  for (let i = 1; i <= 60; i++) {
    const d = new Date(lastDate);
    d.setDate(d.getDate() + i);
    if (d.getDay() === 0 || d.getDay() === 6) continue;
    const drift = trend * 0.3 + (rng(i * 7 + seed * 3) - 0.5) * 2;
    predPrice += drift;
    const dateStr = d.toISOString().split("T")[0];
    const spread = 1.5 + i * 0.6;

    prediction.push({ time: dateStr, value: Math.round(predPrice * 100) / 100 });
    upperBand.push({ time: dateStr, value: Math.round((predPrice + spread) * 100) / 100 });
    lowerBand.push({ time: dateStr, value: Math.round((predPrice - spread) * 100) / 100 });
  }

  const predChange = prediction[prediction.length - 1].value - lastPrice;
  const predChangePercent = (predChange / lastPrice) * 100;

  return {
    symbol: symbol.toUpperCase(),
    historical,
    prediction,
    upperBand,
    lowerBand,
    lastPrice,
    predChange: Math.round(predChange * 100) / 100,
    predChangePercent: Math.round(predChangePercent * 100) / 100,
    trend: predChange >= 0 ? "bullish" : "bearish",
    predictionDays: 60,
    historicalDays: 60,
  };
}

export async function GET(_req: Request, { params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;

  if (!symbol) {
    return NextResponse.json({ error: "Symbol is required" }, { status: 400 });
  }

  const data = generateMockPrediction(symbol);

  return NextResponse.json({
    ...data,
    updatedAt: new Date().toISOString(),
  });
}
