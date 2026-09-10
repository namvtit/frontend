"use client";
import Link from "next/link";
import type { NewsItem } from "@/lib/market/mock-data";
import SentimentBadge from "./SentimentBadge";

export default function NewsCard({ news }: { news: NewsItem }) {
  const date = new Date(news.publishedAt);
  const ago = getTimeAgo(date);

  return (
    <Link href={`/news/${encodeURIComponent(news.detailId ?? news.id)}`} prefetch={false} className="card block hover:border-primary/50 transition-all group">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-medium text-primary">{news.source}</span>
        <span className="text-xs text-muted-foreground">•</span>
        <time dateTime={news.publishedAt} title={date.toLocaleString("vi-VN")} className="text-xs text-muted-foreground">{ago}</time>
        <div className="ml-auto"><SentimentBadge sentiment={news.sentiment} /></div>
      </div>
      <h3 className="font-semibold text-sm leading-snug mb-2 group-hover:text-primary transition-colors">{news.title}</h3>
      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{news.summary}</p>
      {news.symbols.length > 0 && (
        <div className="flex items-center gap-1.5 mt-3">
          {news.symbols.map((s) => (
            <span key={s} className="badge badge-neutral text-xs font-mono">{s}</span>
          ))}
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
