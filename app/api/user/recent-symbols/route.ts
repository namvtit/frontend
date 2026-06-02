import { NextResponse } from "next/server";

const mockRecent = [
  { symbol: "GOOGL", name: "Alphabet Inc.", viewed_at: new Date().toISOString() },
  { symbol: "META", name: "Meta Platforms Inc.", viewed_at: new Date().toISOString() },
  { symbol: "AMZN", name: "Amazon.com Inc.", viewed_at: new Date().toISOString() },
];

export async function GET() {
  return NextResponse.json({ data: mockRecent });
}

export async function POST(req: Request) {
  const body = await req.json();
  return NextResponse.json({ data: body, message: "Symbol recorded" });
}
