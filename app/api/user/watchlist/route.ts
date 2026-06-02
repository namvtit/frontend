import { NextResponse } from "next/server";

// Mock watchlist data for MVP
const mockWatchlist = [
  { id: "1", symbol: "AAPL", name: "Apple Inc.", asset_type: "stock", exchange: "NASDAQ" },
  { id: "2", symbol: "NVDA", name: "NVIDIA Corp.", asset_type: "stock", exchange: "NASDAQ" },
  { id: "3", symbol: "MSFT", name: "Microsoft Corp.", asset_type: "stock", exchange: "NASDAQ" },
  { id: "4", symbol: "TSLA", name: "Tesla Inc.", asset_type: "stock", exchange: "NASDAQ" },
  { id: "5", symbol: "SPY", name: "SPDR S&P 500 ETF", asset_type: "etf", exchange: "AMEX" },
];

export async function GET() {
  return NextResponse.json({ data: mockWatchlist });
}

export async function POST(req: Request) {
  const body = await req.json();
  return NextResponse.json({ data: { id: Date.now().toString(), ...body }, message: "Added to watchlist" });
}
