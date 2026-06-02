"use client";
import { useState } from "react";
import { NEWS } from "@/lib/market/mock-data";
import NewsCard from "@/components/news/NewsCard";

const CATEGORIES = ["Tất cả", "Thị trường", "Earnings", "Công nghệ", "Macro", "Crypto", "Năng lượng", "Ngân hàng"];
const CAT_MAP: Record<string, string> = { "Thị trường": "market", "Earnings": "earnings", "Công nghệ": "technology", "Macro": "macro", "Crypto": "crypto", "Năng lượng": "energy", "Ngân hàng": "banking" };

export default function NewsPage() {
  const [cat, setCat] = useState("Tất cả");
  const [search, setSearch] = useState("");

  const filtered = NEWS.filter((n) => {
    if (cat !== "Tất cả" && n.category !== CAT_MAP[cat]) return false;
    if (search && !n.title.toLowerCase().includes(search.toLowerCase())) return false;
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
              {filtered.length === 0 && (
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
                    <span key={t} className="badge badge-neutral text-xs cursor-pointer hover:opacity-80">{t}</span>
                  ))}
                </div>
              </div>
              <div className="rounded-lg border border-border bg-card p-5">
                <h3 className="font-semibold text-sm mb-3 text-foreground">Đọc nhiều nhất</h3>
                <div className="space-y-3">
                  {NEWS.slice(0, 4).map((n) => (
                    <a key={n.id} href={`/news/${n.id}`} className="block text-sm text-foreground hover:text-primary transition-colors leading-snug">{n.title}</a>
                  ))}
                </div>
              </div>
              <div className="rounded-lg border border-border bg-card p-5">
                <h3 className="font-semibold text-sm mb-3 text-foreground">Tâm lý thị trường</h3>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-3 rounded-full bg-secondary overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: "65%" }} />
                  </div>
                  <span className="text-xs font-mono text-emerald-500">65% Tích cực</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
