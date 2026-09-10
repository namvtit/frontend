import "server-only";
import { createHash } from "node:crypto";
import { PUBLISHER_DOMAINS } from "./safe-fetch";
import Parser from "rss-parser";
import type { NewsItem } from "@/lib/market/mock-data";



const CACHE_MS = 5 * 60 * 1000;
const DOMAINS = PUBLISHER_DOMAINS;
const PUBLISHERS: Record<string, string> = {
  reuters: "Reuters", "reuters.com": "Reuters",
  bloomberg: "Bloomberg", "bloomberg.com": "Bloomberg",
  cnbc: "CNBC", "financial times": "Financial Times",
  "the wall street journal": "WSJ", "wall street journal": "WSJ", wsj: "WSJ",
  marketwatch: "MarketWatch", "yahoo finance": "Yahoo Finance",
  "yahoo finance singapore": "Yahoo Finance", "yahoo finance uk": "Yahoo Finance",
  "yahoo! finance canada": "Yahoo Finance",
};
// Shared across route bundles in the same Node process, including development reloads.
const state = (globalThis as typeof globalThis & { finpilotNewsFeed?: {
  cache?: { data: NewsItem[]; expiresAt: number };
  pending?: Promise<NewsItem[]>;
  articles: Map<string, { item: NewsItem; expiresAt: number }>;
} }).finpilotNewsFeed ??= { articles: new Map<string, { item: NewsItem; expiresAt: number }>(), cache: undefined, pending: undefined };

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
      id, detailId: createHash("sha256").update(id).digest("hex"), title, summary, source,
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
  state.cache = { data, expiresAt: Date.now() + CACHE_MS };
  for (const [key, entry] of state.articles) if (entry.expiresAt <= Date.now()) state.articles.delete(key);
  for (const item of data) state.articles.set(item.detailId!, { item, expiresAt: Date.now() + 24 * 60 * 60 * 1000 });
  while (state.articles.size > 2000) state.articles.delete(state.articles.keys().next().value!);
  return data;
}

export async function getNews(): Promise<NewsItem[]> {
  if (state.cache && state.cache.expiresAt > Date.now()) return state.cache.data;
  state.pending ??= fetchNews().finally(() => { state.pending = undefined; });
  return state.pending;
}

export async function findNews(id: string): Promise<NewsItem | undefined> {
  const retained = state.articles.get(id);
  if (retained && retained.expiresAt > Date.now()) return retained.item;
  return (await getNews()).find((item) => item.detailId === id || item.id === id);
}
