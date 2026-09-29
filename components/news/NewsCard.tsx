"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { NewsItem } from "@/lib/market/mock-data";
import SentimentBadge from "./SentimentBadge";

export default function NewsCard({ news }: { news: NewsItem }) {
  const [ago, setAgo] = useState<string>("");

  useEffect(() => {
    setAgo(getTimeAgo(new Date(news.publishedAt)));
  }, [news.publishedAt]);

  const fallbackDate = news.publishedAt.slice(0, 10);

  const categoryLabel: Record<string, string> = {
    technology: "Công nghệ & AI",
    earnings: "Báo cáo Q3 / SEC",
    market: "Thị trường",
    macro: "Vĩ mô & Chính sách",
    crypto: "Crypto",
    energy: "Năng lượng",
    banking: "Ngân hàng",
  };

  return (
    <Link
      href={`/news/${encodeURIComponent(news.detailId ?? news.id)}`}
      prefetch={false}
      className="card block hover:border-primary/50 hover:bg-card/90 transition-all duration-200 group p-4"
    >
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <span className="text-xs font-bold text-primary">{news.source}</span>
        <span className="text-xs text-muted-foreground">•</span>
        <time dateTime={news.publishedAt} title={news.publishedAt} suppressHydrationWarning className="text-xs text-muted-foreground">
          {ago || fallbackDate}
        </time>
        {news.category && (
          <span className="text-[10px] px-2 py-0.5 rounded bg-muted/60 text-muted-foreground font-medium">
            {categoryLabel[news.category] || news.category}
          </span>
        )}
        <div className="ml-auto">
          <SentimentBadge sentiment={news.sentiment} />
        </div>
      </div>
      <h3 className="font-semibold text-sm leading-snug mb-2 group-hover:text-primary transition-colors text-foreground">
        {news.title}
      </h3>
      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
        {news.summary}
      </p>
      {news.symbols && news.symbols.length > 0 && (
        <div className="flex items-center gap-1.5 mt-3">
          {news.symbols.map((s) => (
            <span key={s} className="badge badge-neutral text-xs font-mono font-medium">
              ${s}
            </span>
          ))}
          <span className="text-[11px] text-primary/70 ml-auto opacity-0 group-hover:opacity-100 transition-opacity font-medium">
            Đọc bài viết đầy đủ →
          </span>
        </div>
      )}
    </Link>
  );
}

function getTimeAgo(date: Date): string {
  const diff = Math.max(0, (Date.now() - date.getTime()) / 1000);
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  return `${Math.floor(diff / 86400)} ngày trước`;
}
