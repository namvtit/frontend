'use client';

import React from 'react';
import type { PisiTickerOutput, PisiResolvedConfig } from '@/lib/pisi/types/pisi';

interface PisiScoreBreakdownProps {
  tickerOutput: PisiTickerOutput;
  config: PisiResolvedConfig;
}

function clip(x: number, a: number, b: number): number {
  return Math.min(Math.max(x, a), b);
}

function safeDenom(x: number, minVal = 0.001): number {
  return Math.max(x, minVal);
}

export function PisiScoreBreakdown({ tickerOutput, config }: PisiScoreBreakdownProps) {
  // Re-calculate the normalized components on the fly
  const return_component = clip(
    tickerOutput.net_return_pct / safeDenom(config.target_net_return_pct),
    -1,
    1
  );
  const rr_component = clip(
    (tickerOutput.risk_reward - 1) / safeDenom(config.min_risk_reward),
    -1,
    1
  );
  const trend_component = clip(tickerOutput.trend_score_raw, -1, 1);
  const drawdown_component = 1 - clip(
    tickerOutput.forecast_max_drawdown_pct / safeDenom(config.max_stock_drawdown_pct),
    0,
    1
  );
  const volatility_component = 1 - clip(
    tickerOutput.forecast_volatility_pct / safeDenom(config.max_forecast_volatility_pct),
    0,
    1
  );
  const preference_component = clip(tickerOutput.favorite_score, -1, 1);

  const components = [
    {
      name: 'Lợi nhuận ròng',
      codeName: 'w_return',
      val: return_component,
      weight: config.w_return,
      color: 'bg-emerald-500',
      textColor: 'text-emerald-400',
      description: 'Lợi nhuận kỳ vọng sau khi khấu trừ phí & trượt giá.',
    },
    {
      name: 'Risk/Reward',
      codeName: 'w_risk_reward',
      val: rr_component,
      weight: config.w_risk_reward,
      color: 'bg-teal-500',
      textColor: 'text-teal-400',
      description: 'Tương quan giữa biên tăng giá cao nhất và giảm giá thấp nhất.',
    },
    {
      name: 'Xu hướng đường giá',
      codeName: 'w_trend',
      val: trend_component,
      weight: config.w_trend,
      color: 'bg-cyan-500',
      textColor: 'text-cyan-400',
      description: 'Tỷ lệ số ngày tăng điểm trên chuỗi dự báo.',
    },
    {
      name: 'Hạn chế sụt giảm',
      codeName: 'w_drawdown',
      val: drawdown_component,
      weight: config.w_drawdown,
      color: 'bg-amber-500',
      textColor: 'text-amber-400',
      description: 'Khả năng giữ giá ổn định, tránh lỗ sâu trên đường đi.',
    },
    {
      name: 'Kiểm soát biến động',
      codeName: 'w_volatility',
      val: volatility_component,
      weight: config.w_volatility,
      color: 'bg-indigo-500',
      textColor: 'text-indigo-400',
      description: 'Mức biến động dao động của đường giá so với giới hạn.',
    },
    {
      name: 'Mã ưa thích',
      codeName: 'w_preference',
      val: preference_component,
      weight: config.w_preference,
      color: 'bg-fuchsia-500',
      textColor: 'text-fuchsia-400',
      description: 'Điểm cộng/trừ ưu tiên thủ công cho ticker này.',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-foreground">Điểm tín hiệu (Signal Score)</span>
        <span className="text-xl font-black text-primary bg-primary/10 px-2 py-0.5 rounded">
          {tickerOutput.signal_score.toFixed(1)} / 100
        </span>
      </div>

      <div className="space-y-3.5">
        {components.map((c) => {
          const weightedVal = c.val * c.weight * 100;
          const displayVal = c.val >= 0 ? `+${c.val.toFixed(2)}` : c.val.toFixed(2);
          const percentWeight = (c.weight * 100).toFixed(0);

          // Calculate visual width and offsets for range [-1, 1]
          // If val is negative, it goes left. If positive, it goes right.
          // Center is 50%.
          const widthPct = Math.abs(c.val) * 50; // max 50%
          const leftPct = c.val < 0 ? 50 - widthPct : 50;

          return (
            <div key={c.name} className="group relative rounded-lg border border-border/40 bg-card/35 p-3 hover:border-border transition-colors">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-foreground">{c.name}</span>
                  <span className="text-[10px] text-muted-foreground">({percentWeight}%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-muted-foreground">{displayVal}</span>
                  <span className={`font-mono font-bold ${weightedVal >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                    {weightedVal >= 0 ? '+' : ''}{weightedVal.toFixed(1)}
                  </span>
                </div>
              </div>

              {/* Bidirectional progress bar */}
              <div className="relative h-2 w-full rounded-full bg-border/20 overflow-hidden">
                {/* Center marker line */}
                <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-border/70 z-10" />
                
                {/* The colored bar */}
                <div
                  className={`absolute h-full rounded-full transition-all duration-500 ${c.color}`}
                  style={{
                    left: `${leftPct}%`,
                    width: `${widthPct}%`,
                  }}
                />
              </div>

              <div className="mt-1 text-[10px] text-muted-foreground leading-normal max-h-0 overflow-hidden group-hover:max-h-12 transition-all duration-300 ease-in-out">
                {c.description}
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-[10px] text-muted-foreground border-t border-border/40 pt-2 flex items-center justify-between">
        <span>Chất lượng mô hình (Model Quality): {(tickerOutput.model_quality_score * 100).toFixed(0)}%</span>
        <span>Decision Strength: {tickerOutput.decision_strength.toFixed(1)}%</span>
      </div>
    </div>
  );
}
