"use client";
import { use } from "react";
import { getNewsById, NEWS } from "@/lib/market/mock-data";
import SentimentBadge from "@/components/news/SentimentBadge";
import NewsCard from "@/components/news/NewsCard";

export default function NewsDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const news = getNewsById(id);

  if (!news) {
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl font-bold mb-2">Không tìm thấy tin tức</h1>
        <a href="/news" className="btn btn-primary mt-4">Xem tất cả tin tức</a>
      </div>
    );
  }

  const related = NEWS.filter((n) => n.id !== news.id).slice(0, 3);
  const date = new Date(news.publishedAt);

  return (
    <div className="min-h-screen bg-background fade-in">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      <div className="flex items-center gap-2 text-sm">
        <a href="/news" className="text-primary hover:underline">← Tin tức</a>
        <span className="text-muted-foreground">•</span>
        <span className="text-muted-foreground">{news.source}</span>
        <span className="text-muted-foreground">•</span>
        <span className="text-muted-foreground">{date.toLocaleDateString("vi-VN")}</span>
      </div>

      <h1 className="text-2xl sm:text-3xl font-bold leading-tight text-foreground">{news.title}</h1>

      <div className="flex items-center gap-3 flex-wrap">
        <SentimentBadge sentiment={news.sentiment} />
        {news.symbols.map((s) => (
          <a key={s} href={`/stocks/${s}`} className="badge badge-neutral text-xs font-mono hover:text-primary">{s}</a>
        ))}
        <span className="badge badge-demo text-xs">Demo content</span>
      </div>

      <div className="card">
        <p className="text-sm leading-relaxed text-muted-foreground mb-4">{news.summary}</p>
        <div className="prose prose-sm max-w-none text-foreground">
          <p>Đây là nội dung mô phỏng cho bài viết. Trong phiên bản chính thức, nội dung sẽ được lấy từ nguồn tin chính thức hoặc được tạo bởi AI.</p>
          <p>{news.summary} Các chuyên gia nhận định rằng xu hướng này sẽ tiếp tục trong thời gian tới, với nhiều yếu tố hỗ trợ từ cả nền kinh tế vĩ mô lẫn vi mô.</p>
          <p>Nhà đầu tư được khuyến cáo nên theo dõi sát diễn biến thị trường và đa dạng hóa danh mục đầu tư để giảm thiểu rủi ro.</p>
        </div>
        <div className="mt-6 pt-4 border-t border-border">
          <button className="btn btn-secondary text-sm">Đọc bản gốc ↗</button>
        </div>
      </div>

      {/* AI summary */}
      <div className="card bg-purple-500/5 border-purple-500/20">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/></svg>
          </div>
          <span className="font-semibold text-sm">Tóm tắt AI</span>
          <span className="badge badge-ai text-xs">Demo</span>
        </div>
        <p className="text-sm text-muted-foreground">{news.summary}</p>
      </div>

      {/* Related */}
      {related.length > 0 && (
        <div>
          <h2 className="font-semibold mb-4">Tin tức liên quan</h2>
          <div className="grid gap-4">{related.map((n) => <NewsCard key={n.id} news={n} />)}</div>
        </div>
      )}
      </div>
    </div>
  );
}
