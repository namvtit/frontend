'use client';

import { useState, useMemo } from 'react';
import { Navbar } from '@/components/navbar';
import { NewsCard } from '@/components/card-components';
import { mockNews } from '@/lib/mock-data';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';

const CATEGORIES = [
  'all',
  'earnings',
  'market-news',
  'analysis',
  'news',
];

export default function NewsPage() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredNews = useMemo(() => {
    return mockNews.filter((article) => {
      const matchesCategory =
        selectedCategory === 'all' || article.category === selectedCategory;
      const matchesSearch =
        article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        article.description.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchTerm]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Header */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Market News</h1>
          <p className="text-muted-foreground">
            Latest news, analysis, and market insights
          </p>
        </div>
      </section>

      {/* Filters */}
      <section className="border-b border-border bg-card/50">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search news..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            {/* Category Tabs */}
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                    selectedCategory === category
                      ? 'bg-primary text-primary-foreground'
                      : 'border border-border text-foreground hover:bg-secondary'
                  }`}
                >
                  {category === 'market-news'
                    ? 'Market News'
                    : category.charAt(0).toUpperCase() + category.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* News Grid */}
      <section>
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {filteredNews.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredNews.map((article) => (
                <NewsCard
                  key={article.id}
                  title={article.title}
                  description={article.description}
                  category={article.category}
                  timestamp={article.timestamp}
                  onClick={() => router.push(`/news/${article.id}`)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                No articles found matching your search.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
