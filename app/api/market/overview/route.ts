import { NextResponse } from "next/server";
import { INDICES, STOCKS, NEWS, getGainers, getLosers, getTrending, getMostActive } from "@/lib/market/mock-data";

export async function GET() {
  return NextResponse.json({
    indices: INDICES,
    trending: getTrending().map((s) => ({ symbol: s.symbol, name: s.name, price: s.price, changePercent: s.day1 })),
    gainers: getGainers().map((s) => ({ symbol: s.symbol, name: s.name, price: s.price, changePercent: s.day1 })),
    losers: getLosers().map((s) => ({ symbol: s.symbol, name: s.name, price: s.price, changePercent: s.day1 })),
    marketTable: STOCKS,
    latestNews: NEWS.slice(0, 5),
  });
}
