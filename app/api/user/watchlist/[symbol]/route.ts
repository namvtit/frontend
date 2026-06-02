import { NextResponse } from "next/server";

export async function DELETE(_req: Request, { params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;
  return NextResponse.json({ message: `Removed ${symbol} from watchlist` });
}
