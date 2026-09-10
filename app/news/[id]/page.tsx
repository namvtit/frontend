import Link from "next/link";
import { notFound } from "next/navigation";
import { getArticle } from "@/lib/news/article";
import { publicWebUrl } from "@/lib/news/extract";
import SentimentBadge from "@/components/news/SentimentBadge";
import ArticleImage from "@/components/news/ArticleImage";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function NewsDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const news = await getArticle(id);
  if (!news) notFound();
  const { article } = news;
  const originalUrl = publicWebUrl(news.originalUrl);
  const imageUrl = publicWebUrl(article.imageUrl || news.imageUrl);

  return (
    <div className="min-h-screen bg-background fade-in">
      <article className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        <Link href="/news" className="text-sm text-primary hover:underline">← Tin tức</Link>
        <h1 className="text-2xl sm:text-3xl font-bold leading-tight text-foreground">{news.title}</h1>
        <div className="flex items-center gap-3 flex-wrap text-sm text-muted-foreground">
          <span className="font-medium text-primary">{news.source}</span>
          <time dateTime={news.publishedAt}>{new Date(news.publishedAt).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })} (GMT+7)</time>
          <SentimentBadge sentiment={news.sentiment} />
          {news.symbols.map((symbol) => <Link key={symbol} href={`/stocks/${symbol}`} className="badge badge-neutral text-xs font-mono">{symbol}</Link>)}
        </div>
        {originalUrl && <a href={originalUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary inline-flex">Đọc bài viết gốc / Read original article ↗</a>}
        {originalUrl && !article.resolved && <p className="text-xs text-muted-foreground">Liên kết nguồn qua Google News.</p>}
        {imageUrl && <ArticleImage src={imageUrl} />}
        <div className="card">
          {article.status === "extracted" && article.contentHtml ? (
            <div className="text-foreground leading-relaxed break-words [&_p]:my-4 [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:font-semibold [&_a]:text-primary [&_a]:underline [&_ul]:list-disc [&_ol]:list-decimal [&_li]:ml-6 [&_blockquote]:border-l-2 [&_blockquote]:border-primary [&_blockquote]:pl-4 [&_table]:block [&_table]:overflow-x-auto" dangerouslySetInnerHTML={{ __html: article.contentHtml }} />
          ) : (
            <>
              <p role="status" className="text-sm text-muted-foreground mb-4">Chỉ hiển thị tóm tắt. Nội dung đầy đủ có thể bị giới hạn truy cập hoặc chưa thể trích xuất. Vui lòng đọc tại nguồn gốc.</p>
              <p className="leading-relaxed text-foreground">{article.excerpt || news.summary || "Nguồn tin chưa cung cấp bản tóm tắt cho bài viết này."}</p>
            </>
          )}
          <div className="mt-6 pt-4 border-t border-border text-sm text-muted-foreground">
            Nguồn: {news.source}. {originalUrl && <a href={originalUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Read original article ↗</a>}
          </div>
        </div>
      </article>
    </div>
  );
}
