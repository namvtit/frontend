import { NextResponse } from "next/server";
import { NEWS } from "@/lib/market/mock-data";

export async function GET() {
  return NextResponse.json({ data: NEWS.slice(0, 3).map((n) => ({ ...n, saved_at: new Date().toISOString() })) });
}

export async function POST(req: Request) {
  const body = await req.json();
  return NextResponse.json({ data: { id: Date.now().toString(), ...body }, message: "News saved" });
}
