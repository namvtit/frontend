import { NextResponse } from "next/server";
import { STOCKS, INDICES } from "@/lib/market/mock-data";

// Yahoo Finance v8 chart API – still publicly accessible (v7 quote API is blocked)
async function fetchChartPrice(symbol: string): Promise<{
  symbol: string;
  regularMarketPrice: number;
  regularMarketChange: number;
  regularMarketChangePercent: number;
  longName?: string;
} | null> {
  try {
    // URL-encode the symbol (needed for ^GSPC, ^IXIC, etc.)
    const encoded = encodeURIComponent(symbol);
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encoded}?interval=1d&range=1d`;
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) return null;

    const data = await res.json();
    const meta = data?.chart?.result?.[0]?.meta;
    if (!meta) return null;

    const price = meta.regularMarketPrice;
    const prevClose = meta.chartPreviousClose ?? meta.previousClose ?? price;
    const change = price - prevClose;
    const changePct = prevClose > 0 ? (change / prevClose) * 100 : 0;

    return {
      symbol,
      regularMarketPrice: Math.round(price * 100) / 100,
      regularMarketChange: Math.round(change * 100) / 100,
      regularMarketChangePercent: Math.round(changePct * 100) / 100,
      longName: meta.longName ?? meta.shortName,
    };
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const symbolsStr =
    searchParams.get("symbols") ||
    "AAPL,MSFT,NVDA,TSLA,AMZN,GOOGL,META,JPM,V,DIS,SPY,QQQ,BRK-B,UNH,XOM,^GSPC,^IXIC,^DJI,^VIX";
  const symbols = symbolsStr.split(",").map((s) => s.trim());

  // Fetch all symbols in parallel via v8 chart API
  const promises = symbols.map((sym) => fetchChartPrice(sym));
  const results = await Promise.all(promises);

  // Count how many succeeded from Yahoo
  const yahooResults = results.filter((r) => r !== null);

  if (yahooResults.length > 0) {
    // We got at least some real data — fill in any failed ones with mock fallback
    const finalResults = symbols.map((sym, i) => {
      if (results[i] !== null) return results[i];
      // Fallback for failed individual symbols
      return getMockQuote(sym);
    });

    return NextResponse.json({
      quoteResponse: { result: finalResults },
    });
  }

  // Complete failure — all Yahoo requests failed, use mock data
  console.warn("All Yahoo Finance v8 requests failed, using mock fallback");
  const mockResults = symbols.map((sym) => getMockQuote(sym));
  return NextResponse.json({
    quoteResponse: { result: mockResults },
  });
}

// ── Mock fallback for individual symbols ──
function getMockQuote(sym: string) {
  const target = sym.trim().toUpperCase();

  // Index symbols
  const indexSymbolMap: Record<string, string> = {
    "^GSPC": "SPX",
    "^IXIC": "IXIC",
    "^DJI": "DJI",
    "^VIX": "VIX",
  };
  const indexKey = indexSymbolMap[target];
  if (indexKey) {
    const idx = INDICES.find((i) => i.symbol === indexKey);
    if (idx) {
      const fluctuation = (Math.random() - 0.5) * 0.3;
      const finalValue = Math.max(1, idx.value * (1 + fluctuation / 100));
      return {
        symbol: target,
        regularMarketPrice: Math.round(finalValue * 100) / 100,
        regularMarketChange: Math.round(idx.change * 100) / 100,
        regularMarketChangePercent:
          Math.round((idx.changePercent + fluctuation) * 100) / 100,
      };
    }
  }

  // Stock symbols
  const stockSymbolMap: Record<string, string> = { "BRK-B": "BRK.B" };
  const mapped = stockSymbolMap[target] ?? target;
  const stock = STOCKS.find((s) => s.symbol === mapped);
  if (stock) {
    const fluctuation = (Math.random() - 0.5) * 0.4;
    const finalPrice = Math.max(1, stock.price * (1 + fluctuation / 100));
    const finalChange = stock.change + (finalPrice - stock.price);
    const finalPct = (finalChange / (finalPrice - finalChange)) * 100;
    return {
      symbol: target,
      regularMarketPrice: Math.round(finalPrice * 100) / 100,
      regularMarketChange: Math.round(finalChange * 100) / 100,
      regularMarketChangePercent: Math.round(finalPct * 100) / 100,
    };
  }

  return {
    symbol: target,
    regularMarketPrice: 150,
    regularMarketChange: 0,
    regularMarketChangePercent: 0,
  };
}
