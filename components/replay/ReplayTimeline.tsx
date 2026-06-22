// ── Replay Timeline ──
// Compact timeline showing price history and events

'use client';

import React from 'react';
import { useReplay } from '@/lib/demo/replay';
import { cn } from '@/lib/utils';
import { 
  TrendingUp, TrendingDown, Calendar
} from 'lucide-react';

interface ReplayTimelineProps {
  className?: string;
}

export function ReplayTimeline({ className }: ReplayTimelineProps) {
  const { state } = useReplay();
  const { snapshots, decisions, currentDay, phase } = state;

  if (snapshots.length < 2) {
    return null;
  }

  // Get latest and earliest snapshots
  const firstSnapshot = snapshots[0];
  const lastSnapshot = snapshots[snapshots.length - 1];
  
  // Calculate overall return
  const overallReturn = firstSnapshot.totalAccountValue > 0
    ? ((lastSnapshot.totalAccountValue - firstSnapshot.totalAccountValue) / firstSnapshot.totalAccountValue) * 100
    : 0;

  // Get decision markers
  const decisionMarkers = decisions.map(d => ({
    day: d.dayNumber,
    type: d.type,
    resolved: d.status === 'resolved',
  }));

  // Generate sparkline points
  const getSparklinePoints = () => {
    if (snapshots.length < 2) return '';
    
    const values = snapshots.map(s => s.totalAccountValue);
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const range = maxVal - minVal || 1;
    
    const width = 200;
    const height = 40;
    const padding = 2;
    
    return values.map((v, i) => {
      const x = (i / (values.length - 1)) * (width - padding * 2) + padding;
      const y = height - padding - ((v - minVal) / range) * (height - padding * 2);
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
  };

  const getMarkerColor = (type: string, resolved: boolean) => {
    if (!resolved) return '#f59e0b'; // amber for pending
    switch (type) {
      case 'take-profit': return '#10b981';
      case 'sharp-decline': return '#ef4444';
      case 'initial-allocation': return '#3b82f6';
      case 'grid-reentry': return '#f59e0b';
      case 'forecast-rotation': return '#a855f7';
      default: return '#6b7280';
    }
  };

  return (
    <div className={cn("bg-card/50 rounded-xl border border-border p-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">NAV Timeline</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn(
            "text-xs font-semibold",
            overallReturn >= 0 ? "text-emerald-500" : "text-red-500"
          )}>
            {overallReturn >= 0 ? '+' : ''}{overallReturn.toFixed(2)}%
          </span>
        </div>
      </div>

      {/* Sparkline Chart */}
      <div className="relative h-12 mb-3">
        <svg 
          width="100%" 
          height="48" 
          viewBox="0 0 200 48" 
          preserveAspectRatio="none"
          className="text-primary"
        >
          {/* Grid lines */}
          <line x1="0" y1="24" x2="200" y2="24" stroke="currentColor" strokeOpacity="0.1" strokeDasharray="2,2" />
          
          {/* Area fill */}
          <path
            d={`${getSparklinePoints()} L200,48 L0,48 Z`}
            fill="currentColor"
            fillOpacity="0.1"
          />
          
          {/* Line */}
          <path
            d={getSparklinePoints()}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Current position marker */}
          <circle
            cx="200"
            cy="24"
            r="4"
            fill="currentColor"
          />
          
          {/* Decision markers */}
          {decisionMarkers.map((marker, i) => {
            const x = (marker.day / currentDay) * 200;
            if (x <= 0 || x >= 200) return null;
            
            return (
              <g key={i} transform={`translate(${x}, 0)`}>
                <circle
                  cy="8"
                  r="3"
                  fill={getMarkerColor(marker.type, marker.resolved)}
                />
                {marker.resolved && (
                  <line
                    y1="12"
                    y2="48"
                    stroke={getMarkerColor(marker.type, marker.resolved)}
                    strokeOpacity="0.3"
                    strokeDasharray="2,2"
                  />
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
        <span>{firstSnapshot.date}</span>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Chốt lời</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <span>Xử lý giảm</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            <span>Đang chờ</span>
          </div>
        </div>
        <span>{lastSnapshot.date}</span>
      </div>

      {/* Quick Stats */}
      <div className="mt-3 pt-3 border-t border-border grid grid-cols-3 gap-2">
        <div className="text-center">
          <p className="text-[10px] text-muted-foreground">Giá cao nhất</p>
          <p className="text-xs font-bold text-emerald-500">
            {Math.max(...snapshots.map(s => s.totalAccountValue)).toLocaleString('vi-VN')}đ
          </p>
        </div>
        <div className="text-center">
          <p className="text-[10px] text-muted-foreground">Giá thấp nhất</p>
          <p className="text-xs font-bold text-red-500">
            {Math.min(...snapshots.map(s => s.totalAccountValue)).toLocaleString('vi-VN')}đ
          </p>
        </div>
        <div className="text-center">
          <p className="text-[10px] text-muted-foreground">Quyết định</p>
          <p className="text-xs font-bold text-foreground">
            {decisions.filter(d => d.status === 'resolved').length} / 5
          </p>
        </div>
      </div>
    </div>
  );
}
