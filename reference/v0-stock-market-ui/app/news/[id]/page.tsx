'use client';

import { Navbar } from '@/components/navbar';
import { mockNews } from '@/lib/mock-data';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, Share2, Bookmark } from 'lucide-react';

export default function NewsDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const article = mockNews.find((a) => a.id === id);

  if (!article) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8 text-center">
          <h1 className="text-2xl font-bold text-foreground">Article not found</h1>
        </div>
      </div>
    );
  }

  const timeAgo = getTimeAgo(new Date(article.timestamp));

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Article Header */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors mb-6"
          >
            <ChevronLeft className="h-5 w-5" />
            Back
          </button>

          <div className="mb-6">
            <span className="inline-block px-3 py-1 rounded-lg text-xs font-medium bg-primary/10 text-primary capitalize mb-4">
              {article.category === 'market-news'
                ? 'Market News'
                : article.category.charAt(0).toUpperCase() +
                  article.category.slice(1)}
            </span>
            <h1 className="text-4xl font-bold text-foreground mb-4">
              {article.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
              <span>{article.source}</span>
              <span>•</span>
              <span>{timeAgo}</span>
              <span>•</span>
              <span>5 min read</span>
            </div>
          </div>

          {/* Image Placeholder */}
          <div className="rounded-lg border border-border bg-muted/20 h-96 overflow-hidden mb-8">
            <img
              src={article.image}
              alt={article.title}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mb-8">
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-foreground hover:bg-secondary transition-colors">
              <Share2 className="h-4 w-4" />
              Share
            </button>
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-foreground hover:bg-secondary transition-colors">
              <Bookmark className="h-4 w-4" />
              Save
            </button>
          </div>
        </div>
      </section>

      {/* Article Content */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="prose prose-invert max-w-none">
            <p className="text-lg leading-relaxed text-foreground mb-6">
              {article.description}
            </p>

            <p className="text-base leading-relaxed text-foreground mb-6">
              {article.content}
            </p>

            <p className="text-base leading-relaxed text-foreground mb-6">
              Market analysts suggest that this development could have significant
              implications for the sector. Investors should carefully consider the
              potential impact on their portfolios and investment strategies.
            </p>

            <p className="text-base leading-relaxed text-foreground">
              As the situation develops, more information will become available to
              market participants. It&apos;s advisable to stay informed through reliable
              market news sources and financial analysis platforms.
            </p>
          </div>
        </div>
      </section>

      {/* Related Articles */}
      <section>
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-foreground mb-6">Related Articles</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {mockNews
              .filter((a) => a.id !== article.id)
              .slice(0, 2)
              .map((relatedArticle) => (
                <div
                  key={relatedArticle.id}
                  onClick={() => router.push(`/news/${relatedArticle.id}`)}
                  className="group cursor-pointer rounded-lg border border-border bg-card p-4 transition-all hover:border-primary hover:shadow-lg"
                >
                  <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-primary/10 text-primary capitalize mb-2">
                    {relatedArticle.category}
                  </span>
                  <h3 className="font-semibold text-card-foreground line-clamp-2">
                    {relatedArticle.title}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                    {relatedArticle.description}
                  </p>
                </div>
              ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'just now';
}
