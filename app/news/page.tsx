"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { NewsItem } from "@/lib/market/mock-data";
import NewsCard from "@/components/news/NewsCard";

const CATEGORIES = ["Tất cả", "Thị trường", "Earnings", "Công nghệ", "Macro", "Crypto", "Năng lượng", "Ngân hàng"];
const CAT_MAP: Record<string, string> = { "Thị trường": "market", "Earnings": "earnings", "Công nghệ": "technology", "Macro": "macro", "Crypto": "crypto", "Năng lượng": "energy", "Ngân hàng": "banking" };

export default function NewsPage() {
  const [cat, setCat] = useState("Tất cả");
  const [search, setSearch] = useState("");
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    async function refresh() {
      try {
        const response = await fetch("/api/news", { cache: "no-store", signal: controller.signal });
        if (!response.ok) throw new Error("News unavailable");
        const payload = await response.json();
        if (!Array.isArray(payload.data)) throw new Error("Invalid news response");
        if (!controller.signal.aborted) {
          setNews(payload.data);
          setError(false);
        }
      } catch {
        if (!controller.signal.aborted) {
          setNews([]);
          setError(true);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void refresh();
    const interval = setInterval(() => void refresh(), 5 * 60 * 1000);
    return () => { controller.abort(); clearInterval(interval); };
  }, []);

  const bullishCount = news.filter((n) => n.sentiment === "bullish").length;
  const neutralCount = news.filter((n) => n.sentiment === "neutral").length;
  const totalNews = news.length;
  const positivePercent = totalNews ? Math.round((bullishCount / totalNews) * 100) : 0;
  const neutralPercent = totalNews ? Math.round((neutralCount / totalNews) * 100) : 0;
  const negativePercent = totalNews ? Math.max(0, 100 - positivePercent - neutralPercent) : 0;
  const filtered = news.filter((n) => {
    if (cat !== "Tất cả" && n.category !== CAT_MAP[cat]) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!n.title.toLowerCase().includes(q) &&
          !n.summary.toLowerCase().includes(q) &&
          !n.source.toLowerCase().includes(q) &&
          !n.symbols.some((s) => s.toLowerCase().includes(q)) &&
          !n.category.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-background fade-in">
      {/* Header */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Tin tức thị trường</h1>
          <p className="text-sm text-muted-foreground">Cập nhật tin tức tài chính mới nhất</p>
        </div>
      </section>

      {/* Filters */}
      <section className="border-b border-border bg-card/50">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <input className="input max-w-sm" placeholder="Tìm kiếm tin tức..." value={search} onChange={(e) => setSearch(e.target.value)} id="news-search" />
          </div>
          <div className="tab-list">
            {CATEGORIES.map((c) => (
              <button key={c} className={`tab-item ${cat === c ? "active" : ""}`} onClick={() => setCat(c)}>{c}</button>
            ))}
          </div>
        </div>
      </section>

      {/* Content */}
      <section>
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex-1 grid gap-4">
              {filtered.map((n) => <NewsCard key={n.id} news={n} />)}
              {(loading || error) && (
                <p role={error ? "alert" : "status"} className="text-sm text-muted-foreground py-12 text-center">
                  {loading ? "Đang tải tin tức..." : "Không thể tải tin tức. Vui lòng thử lại sau."}
                </p>
              )}
              {!loading && !error && filtered.length === 0 && (
                <div className="rounded-lg border border-border bg-card text-center py-12 px-6">
                  <p className="text-lg mb-2 text-foreground">Không tìm thấy tin tức</p>
                  <p className="text-sm text-muted-foreground">Thử thay đổi bộ lọc hoặc từ khóa</p>
                </div>
              )}
            </div>

            <div className="w-full lg:w-72 space-y-4 shrink-0">
              <div className="rounded-lg border border-border bg-card p-5">
                <h3 className="font-semibold text-sm mb-3 text-foreground">Chủ đề nổi bật</h3>
                <div className="flex flex-wrap gap-2">
                  {["AI", "Fed", "Lãi suất", "NVDA", "Tesla", "Bitcoin", "Dầu", "GDP"].map((t) => (
                    <button key={t} onClick={() => setSearch(t)} className="badge badge-neutral text-xs cursor-pointer hover:opacity-80">{t}</button>
                  ))}
                </div>
              </div>
              <div className="rounded-lg border border-border bg-card p-5">
                <h3 className="font-semibold text-sm mb-3 text-foreground">Tin mới nhất</h3>
                <div className="space-y-3">
                  {news.slice(0, 4).map((n) => (
                    <Link key={n.id} href={`/news/${encodeURIComponent(n.detailId ?? n.id)}`} prefetch={false} className="block text-sm text-foreground hover:text-primary transition-colors leading-snug">{n.title}</Link>
                  ))}
                </div>
              </div>
              <div className="rounded-lg border border-border bg-card p-5">
                <h3 className="font-semibold text-sm mb-3 text-foreground">Tâm lý tin tức</h3>
                <div className="flex h-2.5 w-full rounded-full bg-secondary overflow-hidden mb-3">
                  <div className="bg-emerald-500 transition-all" style={{ width: `${positivePercent}%` }} title={`Tích cực: ${positivePercent}%`} />
                  <div className="bg-slate-400 dark:bg-slate-500 transition-all" style={{ width: `${neutralPercent}%` }} title={`Trung lập: ${neutralPercent}%`} />
                  <div className="bg-red-500 transition-all" style={{ width: `${negativePercent}%` }} title={`Tiêu cực: ${negativePercent}%`} />
                </div>
                <div className="grid grid-cols-3 gap-1.5 text-center text-xs">
                  <div className="rounded bg-emerald-500/10 py-1.5 px-1">
                    <div className="font-bold text-emerald-600 dark:text-emerald-400">{positivePercent}%</div>
                    <div className="text-[10px] text-muted-foreground">Tích cực</div>
                  </div>
                  <div className="rounded bg-secondary py-1.5 px-1">
                    <div className="font-bold text-foreground">{neutralPercent}%</div>
                    <div className="text-[10px] text-muted-foreground">Trung lập</div>
                  </div>
                  <div className="rounded bg-red-500/10 py-1.5 px-1">
                    <div className="font-bold text-red-600 dark:text-red-400">{negativePercent}%</div>
                    <div className="text-[10px] text-muted-foreground">Tiêu cực</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
