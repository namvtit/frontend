import { NextResponse } from "next/server";
import { getNewsById } from "@/lib/market/mock-data";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const news = getNewsById(id);
  if (!news) return NextResponse.json({ error: "News not found" }, { status: 404 });
  return NextResponse.json(news);
}
