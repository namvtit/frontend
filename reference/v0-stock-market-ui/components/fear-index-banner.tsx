'use client';

import { mockFearIndex } from '@/lib/mock-data';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { AlertCircle, TrendingUp } from 'lucide-react';

export function FearIndexBanner() {
  const getColor = () => {
    const value = mockFearIndex.value;
    if (value <= 25) return '#ef4444';
    if (value <= 45) return '#f97316';
    if (value <= 55) return '#eab308';
    if (value <= 75) return '#84cc16';
    return '#22c55e';
  };

  const getLabel = () => {
    const value = mockFearIndex.value;
    if (value <= 25) return 'Extreme Fear';
    if (value <= 45) return 'Fear';
    if (value <= 55) return 'Neutral';
    if (value <= 75) return 'Greed';
    return 'Extreme Greed';
  };

  const data = [
    { name: 'Greed Index', value: mockFearIndex.value },
    { name: 'Remaining', value: 100 - mockFearIndex.value },
  ];

  const chartColor = getColor();

  return (
    <div className="sticky top-9 z-30 w-full border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          {/* Circular Chart */}
          <div className="flex flex-col items-center gap-3 flex-shrink-0">
            <div className="relative w-[140px] h-[140px]">
              <ResponsiveContainer width={140} height={140}>
                <PieChart>
                  <Pie
                    data={data}
                    cx={70}
                    cy={70}
                    innerRadius={45}
                    outerRadius={65}
                    startAngle={90}
                    endAngle={-270}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    <Cell fill={chartColor} />
                    <Cell fill="#e5e7eb" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-2xl font-bold text-foreground">{mockFearIndex.value}</div>
                <div className="text-[10px] text-muted-foreground text-center">Greed</div>
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm font-semibold text-foreground">{getLabel()}</div>
            </div>
          </div>

          {/* Details and Description */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="h-5 w-5 flex-shrink-0" style={{ color: chartColor }} />
              <h3 className="font-bold text-foreground text-lg">Market Sentiment</h3>
            </div>
            <p className="text-sm text-foreground mb-3 leading-relaxed">
              {mockFearIndex.description}
            </p>
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">24h Change: </span>
                <span className={`font-semibold ${mockFearIndex.change > 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {mockFearIndex.change > 0 ? '+' : ''}{mockFearIndex.change}%
                </span>
              </div>
              <div className="text-xs text-muted-foreground">
                Last updated: Today
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
