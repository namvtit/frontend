import { NextResponse } from "next/server";
import { getArticle } from "@/lib/news/article";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const headers = { "Cache-Control": "no-store" };
  try {
    const { id } = await params;
    const news = await getArticle(id);
    if (!news) return NextResponse.json({ error: "News not found" }, { status: 404, headers });
    return NextResponse.json(news, { headers });
  } catch {
    return NextResponse.json({ error: "News is temporarily unavailable." }, { status: 503, headers });
  }
}
