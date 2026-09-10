import { NextResponse } from "next/server";
import { getNews } from "@/lib/news/feed";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const headers = { "Cache-Control": "no-store" };
  try {
    return NextResponse.json({ data: await getNews() }, { headers });
  } catch {
    return NextResponse.json({ error: "News is temporarily unavailable." }, { status: 503, headers });
  }
}
