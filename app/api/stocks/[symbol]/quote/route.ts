import { NextResponse } from "next/server";
import { getStockBySymbol } from "@/lib/market/mock-data";

export async function GET(_req: Request, { params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;
  const stock = getStockBySymbol(symbol);
  if (!stock) return NextResponse.json({ error: "Symbol not found" }, { status: 404 });

  return NextResponse.json({
    symbol: stock.symbol, name: stock.name, price: stock.price, change: stock.change,
    changePercent: stock.changePercent, exchange: stock.exchange, currency: stock.currency,
    marketCap: stock.marketCap, volume: stock.volume, peRatio: stock.peRatio, eps: stock.eps,
    dividendYield: stock.dividendYield, beta: stock.beta, high52w: stock.high52w, low52w: stock.low52w,
    sector: stock.sector, updatedAt: new Date().toISOString(),
  });
}
