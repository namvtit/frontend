import { NextResponse } from "next/server";
import { getNewsForSymbol } from "@/lib/market/mock-data";

export async function GET(_req: Request, { params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;
  return NextResponse.json({ data: getNewsForSymbol(symbol) });
}
