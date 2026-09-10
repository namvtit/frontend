import { NextResponse } from "next/server";
import Parser from "rss-parser";
import type { NewsItem } from "@/lib/market/mock-data";

export const dynamic = "force-dynamic";

const CACHE_MS = 5 * 60 * 1000;
const DOMAINS = ["reuters.com", "bloomberg.com", "cnbc.com", "ft.com", "wsj.com", "marketwatch.com", "finance.yahoo.com"];
const PUBLISHERS: Record<string, string> = {
  reuters: "Reuters", "reuters.com": "Reuters",
  bloomberg: "Bloomberg", "bloomberg.com": "Bloomberg",
  cnbc: "CNBC", "financial times": "Financial Times",
  "the wall street journal": "WSJ", "wall street journal": "WSJ", wsj: "WSJ",
  marketwatch: "MarketWatch", "yahoo finance": "Yahoo Finance",
  "yahoo finance singapore": "Yahoo Finance", "yahoo finance uk": "Yahoo Finance",
  "yahoo! finance canada": "Yahoo Finance",
};
let cache: { data: NewsItem[]; expiresAt: number } | undefined;
let pending: Promise<NewsItem[]> | undefined;

interface RssFields {
  source?: string;
  thumbnail?: { $?: { url?: string } };
  media?: { $?: { url?: string; medium?: string; type?: string } };
}
const parser = new Parser<Record<string, never>, RssFields>({
  customFields: { item: ["source", ["media:thumbnail", "thumbnail"], ["media:content", "media"]] },
});

// RSS has no consistent categories; retain the existing topic filters.
function category(text: string): string {
  if (/\b(earnings|quarterly results|eps)\b/i.test(text)) return "earnings";
  if (/\b(crypto|bitcoin|ethereum|blockchain)\b/i.test(text)) return "crypto";
  if (/\b(federal reserve|fed|inflation|interest rates?|gdp|central bank|jobs report)\b/i.test(text)) return "macro";
  if (/\b(oil|gas|energy|opec)\b/i.test(text)) return "energy";
  if (/\b(bank|banks|banking)\b/i.test(text)) return "banking";
  if (/\b(technology|tech|ai|semiconductor|software)\b/i.test(text)) return "technology";
  return "market";
}

function httpUrl(value?: string): string {
  try {
    const url = new URL(value ?? "");
    return ["https:", "http:"].includes(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
}

async function fetchNews(): Promise<NewsItem[]> {
  const query = `(finance OR stock market OR economy OR earnings) (${DOMAINS.map((domain) => `site:${domain}`).join(" OR ")}) when:7d`;
  const params = new URLSearchParams({ q: query, hl: "en-US", gl: "US", ceid: "US:en" });
  const response = await fetch(`https://news.google.com/rss/search?${params}`, {
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error("News provider unavailable");
  const feed = await parser.parseString(await response.text());
  const data: NewsItem[] = [];
  const seen = new Set<string>();
  for (const item of feed.items) {
    const publisher = item.source?.trim() ?? "";
    const source = Object.hasOwn(PUBLISHERS, publisher.toLowerCase()) ? PUBLISHERS[publisher.toLowerCase()] : "";
    const originalUrl = httpUrl(item.link);
    const published = Date.parse(item.isoDate ?? item.pubDate ?? "");
    const id = item.guid || originalUrl;
    if (!source || !item.title || !originalUrl ||
        !Number.isFinite(published) || seen.has(id)) continue;
    seen.add(id);
    const suffix = ` - ${publisher}`;
    const title = (item.title.endsWith(suffix) ? item.title.slice(0, -suffix.length) : item.title).trim();
    const summary = item.contentSnippet?.trim() ?? "";
    const text = `${title} ${summary}`;
    const media = item.media?.$;
    const imageUrl = httpUrl(item.thumbnail?.$?.url) ||
      httpUrl(item.enclosure?.type?.startsWith("image/") ? item.enclosure.url : undefined) ||
      httpUrl(media?.medium === "image" || media?.type?.startsWith("image/") ? media.url : undefined);
    data.push({
      id, title, summary, source,
      publishedAt: new Date(published).toISOString(),
      imageUrl,
      // Google News supplies redirect links to the publisher, not direct article URLs.
      originalUrl,
      url: originalUrl, // Keep the existing frontend contract.
      symbols: [...new Set([...text.matchAll(/(?:\$|\b(?:NASDAQ|NYSE):\s*)([A-Z]{1,5})\b/g)].map((match) => match[1]))],
      sentiment: "neutral",
      category: category(text),
    });
  }
  data.sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));
  cache = { data, expiresAt: Date.now() + CACHE_MS };
  return data;
}

export async function GET() {
  const headers = { "Cache-Control": "no-store" };
  try {
    if (cache && cache.expiresAt > Date.now()) return NextResponse.json({ data: cache.data }, { headers });
    // Share an in-flight request across concurrent page loads.
    pending ??= fetchNews().finally(() => { pending = undefined; });
    return NextResponse.json({ data: await pending }, { headers });
  } catch {
    return NextResponse.json({ error: "News is temporarily unavailable." }, { status: 503, headers });
  }
}
