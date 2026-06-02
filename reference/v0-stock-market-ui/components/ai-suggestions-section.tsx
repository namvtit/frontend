'use client';

import { mockAISuggestions } from '@/lib/mock-data';
import { Lightbulb, TrendingUp, TrendingDown, Pause } from 'lucide-react';

export function AISuggestionsSection() {
  const getActionColor = (action: string) => {
    switch (action) {
      case 'buy':
        return 'bg-emerald-600/10 border-emerald-600/30 text-emerald-700 dark:text-emerald-400';
      case 'sell':
        return 'bg-red-600/10 border-red-600/30 text-red-700 dark:text-red-400';
      case 'hold':
        return 'bg-slate-600/10 border-slate-600/30 text-slate-700 dark:text-slate-400';
      default:
        return 'bg-slate-600/10 border-slate-600/30';
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'buy':
        return <TrendingUp className="h-4 w-4" />;
      case 'sell':
        return <TrendingDown className="h-4 w-4" />;
      case 'hold':
        return <Pause className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getActionLabel = (action: string) => {
    return action.charAt(0).toUpperCase() + action.slice(1);
  };

  return (
    <div className="border-b border-border">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center gap-2">
          <Lightbulb className="h-6 w-6 text-amber-500" />
          <div>
            <h2 className="text-2xl font-bold text-foreground">AI Market Insights</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Real-time AI analysis and investment recommendations
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {mockAISuggestions.map((suggestion) => (
            <div
              key={suggestion.id}
              className="group rounded-lg border border-border bg-card p-6 hover:border-primary/50 transition-all hover:shadow-lg cursor-pointer"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                  {suggestion.title}
                </h3>
              </div>

              {/* Action Badge */}
              <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold ${getActionColor(suggestion.action)} mb-3`}>
                {getActionIcon(suggestion.action)}
                {getActionLabel(suggestion.action)}
              </div>

              {/* Description */}
              <p className="text-sm text-muted-foreground mb-3">
                {suggestion.description}
              </p>

              {/* Stocks */}
              <div className="mb-3 flex flex-wrap gap-2">
                {suggestion.stocks.map((stock) => (
                  <span
                    key={stock}
                    className="inline-block px-2 py-1 rounded bg-secondary text-xs font-medium text-foreground"
                  >
                    {stock}
                  </span>
                ))}
              </div>

              {/* Confidence */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-muted-foreground">
                    Confidence
                  </span>
                  <span className="text-xs font-semibold text-foreground">
                    {suggestion.confidence}%
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-secondary overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      suggestion.confidence >= 85
                        ? 'bg-emerald-500'
                        : suggestion.confidence >= 70
                        ? 'bg-amber-500'
                        : 'bg-red-500'
                    }`}
                    style={{ width: `${suggestion.confidence}%` }}
                  />
                </div>
              </div>

              {/* Reasoning */}
              <p className="text-xs text-muted-foreground italic">
                {suggestion.reasoning}
              </p>

              {/* View Details Link */}
              <div className="mt-4 pt-4 border-t border-border/50">
                <a
                  href="/ai-agent"
                  className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
                >
                  View Analysis →
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
