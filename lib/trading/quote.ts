import "server-only";

// Separate from the UI quote endpoint: execution must never use its mock fallback.
export async function executionPrice(symbol: string): Promise<string> {
  const response = await fetch(
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`,
    {
      cache: "no-store",
      headers: { "User-Agent": "Mozilla/5.0", Accept: "application/json" },
      signal: AbortSignal.timeout(8000),
    },
  );
  if (!response.ok) throw new Error("Quote request failed.");
  const data = await response.json();
  const meta = data?.chart?.result?.[0]?.meta;
  if (data?.chart?.error || meta?.symbol !== symbol || meta?.currency !== "USD" ||
      !["EQUITY", "ETF"].includes(meta?.instrumentType) ||
      typeof meta?.regularMarketPrice !== "number" ||
      !Number.isFinite(meta.regularMarketPrice) || meta.regularMarketPrice <= 0) {
    throw new Error("Invalid USD stock quote.");
  }
  return String(meta.regularMarketPrice);
}
