import "server-only";
import { getNewsById } from "@/lib/market/mock-data";
import { findNews } from "./feed";
import { extractArticle, type ArticleContent } from "./extract";

const state = (globalThis as typeof globalThis & { finpilotArticleCache?: {
  cache: Map<string, { value: ArticleContent; expiresAt: number }>;
  pending: Map<string, Promise<ArticleContent>>;
} }).finpilotArticleCache ??= { cache: new Map(), pending: new Map() };

export async function cachedArticle(url: string): Promise<ArticleContent> {
  const cached = state.cache.get(url);
  if (cached && cached.expiresAt > Date.now()) return cached.value;
  const pending = state.pending.get(url);
  if (pending) return pending;
  // Bound both retained HTML and concurrent outbound work in each process.
  if (state.pending.size >= 8) return { originalUrl: url, resolved: false, status: "fallback", reason: "unavailable" };
  const work = extractArticle(url).then((value) => {
    for (const [key, entry] of state.cache) if (entry.expiresAt <= Date.now()) state.cache.delete(key);
    state.cache.set(url, { value, expiresAt: Date.now() + (value.status === "extracted" ? 6 * 60 * 60_000 : 10 * 60_000) });
    while (state.cache.size > 100) state.cache.delete(state.cache.keys().next().value!);
    return value;
  }).finally(() => { state.pending.delete(url); });
  state.pending.set(url, work);
  return work;
}

export async function getArticle(id: string) {
  // Existing demo cards still resolve to their actual summary, with no invented body.
  const mock = getNewsById(id);
  if (!mock && !/^[a-f0-9]{64}$/.test(id) && !id.startsWith("https://news.google.com/")) return undefined;
  const news = mock ?? await findNews(id);
  if (!news) return undefined;
  const url = news.originalUrl || news.url;
  const article = !mock && url ? await cachedArticle(url) : {
    originalUrl: url ?? "", resolved: false, status: "fallback" as const, reason: "unavailable" as const,
  };
  return { ...news, originalUrl: article.originalUrl, article };
}
