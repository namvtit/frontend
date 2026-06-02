import { NextRequest, NextResponse } from "next/server";
import { STOCKS } from "@/lib/market/mock-data";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const sector = searchParams.get("sector") || "";
  const sort = searchParams.get("sort") || "marketCap";
  const dir = searchParams.get("dir") || "desc";

  let filtered = STOCKS;
  if (search) filtered = filtered.filter((s) => s.symbol.toLowerCase().includes(search.toLowerCase()) || s.name.toLowerCase().includes(search.toLowerCase()));
  if (sector) filtered = filtered.filter((s) => s.sector === sector);

  const key = sort as keyof typeof filtered[0];
  filtered = [...filtered].sort((a, b) => {
    const av = a[key] as number;
    const bv = b[key] as number;
    return dir === "asc" ? av - bv : bv - av;
  });

  return NextResponse.json({ data: filtered, total: filtered.length });
}
