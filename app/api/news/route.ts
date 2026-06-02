import { NextResponse } from "next/server";
import { NEWS } from "@/lib/market/mock-data";

export async function GET() {
  return NextResponse.json({ data: NEWS });
}
