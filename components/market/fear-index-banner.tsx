'use client';

import { useEffect, useState } from 'react';
import { AlertCircle } from 'lucide-react';

interface FearIndexData {
  value: number;
  rating: string;
  description: string;
  change: number;
}

const DEFAULT_FEAR_INDEX: FearIndexData = {
  value: 32,
  rating: 'fear',
  description: 'Thị trường đang có dấu hiệu thận trọng trong bối cảnh bất ổn kinh tế. Các nhà đầu tư nên cân nhắc phân bổ tài sản phòng thủ.',
  change: -8.5,
};

function getColor(value: number) {
  if (value <= 25) return '#ef4444';
  if (value <= 45) return '#f97316';
  if (value <= 55) return '#eab308';
  if (value <= 75) return '#84cc16';
  return '#22c55e';
}

function getLabel(rating: string, value: number) {
  const normalized = rating.toLowerCase();
  if (normalized === 'extreme fear') return 'Cực kỳ Sợ hãi';
  if (normalized === 'fear') return 'Sợ hãi';
  if (normalized === 'neutral') return 'Trung lập';
  if (normalized === 'greed') return 'Tham lam';
  if (normalized === 'extreme greed') return 'Cực kỳ Tham lam';
  
  if (value <= 25) return 'Cực kỳ Sợ hãi';
  if (value <= 45) return 'Sợ hãi';
  if (value <= 55) return 'Trung lập';
  if (value <= 75) return 'Tham lam';
  return 'Cực kỳ Tham lam';
}

export function FearIndexBanner() {
  const [data, setData] = useState<FearIndexData>(DEFAULT_FEAR_INDEX);

  useEffect(() => {
    fetch('/api/market/fear-greed')
      .then((res) => {
        if (!res.ok) throw new Error('API response error');
        return res.json();
      })
      .then((fetched) => {
        setData({
          value: fetched.value,
          rating: fetched.rating,
          description: fetched.description,
          change: fetched.change,
        });
      })
      .catch((err) => {
        console.warn('Could not load real Fear & Greed index:', err);
      });
  }, []);

  const { value, rating, description, change } = data;
  const color = getColor(value);
  const label = getLabel(rating, value);

  // SVG donut chart parameters
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="w-full border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          {/* SVG Donut Chart */}
          <div className="flex flex-col items-center gap-3 flex-shrink-0">
            <div className="relative w-[140px] h-[140px]">
              <svg width="140" height="140" viewBox="0 0 140 140" className="transform -rotate-90">
                {/* Background ring */}
                <circle cx="70" cy="70" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="16" className="dark:stroke-zinc-700" />
                {/* Value ring */}
                <circle
                  cx="70" cy="70" r={radius} fill="none"
                  stroke={color} strokeWidth="16"
                  strokeDasharray={circumference}
                  strokeDashoffset={offset}
                  strokeLinecap="round"
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-2xl font-bold text-foreground">{value}</div>
                <div className="text-[10px] text-muted-foreground text-center">{label}</div>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="h-5 w-5 flex-shrink-0" style={{ color }} />
              <h3 className="font-bold text-foreground text-lg">Market Sentiment</h3>
            </div>
            <p className="text-sm text-foreground mb-3 leading-relaxed">
              {description}
            </p>
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">24h Change: </span>
                <span className={`font-semibold ${change > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                  {change > 0 ? '+' : ''}{change}%
                </span>
              </div>
              <div className="text-xs text-muted-foreground">
                Last updated: Today
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground/60 mt-2 italic">
              Nguồn: CNN Fear &amp; Greed Index, AAII Sentiment Survey
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
