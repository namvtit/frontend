import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const headers = { "Cache-Control": "no-store" };
  try {
    await getDatabase().query("SELECT 1");
    return NextResponse.json({ status: "ok", database: "connected" }, { headers });
  } catch {
    return NextResponse.json(
      { status: "unavailable", database: "disconnected" },
      { status: 503, headers },
    );
  }
}
