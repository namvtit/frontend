import { NextResponse } from "next/server";
import { getMetricBySlug } from "@/lib/market/metrics-data";

export async function GET(_req: Request, { params }: { params: Promise<{ metric: string }> }) {
  const { metric } = await params;
  const data = getMetricBySlug(metric);
  if (!data) return NextResponse.json({ error: "Metric not found" }, { status: 404 });
  return NextResponse.json(data);
}
