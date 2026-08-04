'use client';

import React from 'react';
import {
  Leaf,
  Scale,
  Zap,
  Waves,
  Shield,
  SlidersHorizontal,
  RotateCcw,
} from 'lucide-react';
import type { PresetCode } from '@/lib/pisi/types/pisi';
import { PresetCode as PC } from '@/lib/pisi/types/pisi';
import {
  getPresetDescription,
  getPresetExecutionHint,
} from '@/lib/pisi/presets';

interface PresetSelectorProps {
  selectedPreset: PresetCode;
  onChange: (code: PresetCode) => void;
  customOverrides: Record<string, number>;
  onResetOverrides?: () => void;
}

const PRESET_INFOS = [
  {
    code: PC.ECO,
    name: 'ECO',
    fullName: 'Efficient Capital Optimizer',
    icon: Leaf,
    colorClass: 'text-emerald-400 border-emerald-500/25 bg-emerald-500/5',
    activeClass: 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-500/10 text-emerald-400',
  },
  {
    code: PC.STAND,
    name: 'STAND',
    fullName: 'Standard Balance Engine',
    icon: Scale,
    colorClass: 'text-blue-400 border-blue-500/25 bg-blue-500/5',
    activeClass: 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-500/10 text-blue-400',
  },
  {
    code: PC.SPEED,
    name: 'SPEED',
    fullName: 'Signal Pulse Execution Drive',
    icon: Zap,
    colorClass: 'text-amber-400 border-amber-500/25 bg-amber-500/5',
    activeClass: 'border-amber-500 ring-2 ring-amber-500/20 bg-amber-500/10 text-amber-400',
  },
  {
    code: PC.WAVE,
    name: 'WAVE',
    fullName: 'Volatility-Aware Range Engine',
    icon: Waves,
    colorClass: 'text-cyan-400 border-cyan-500/25 bg-cyan-500/5',
    activeClass: 'border-cyan-500 ring-2 ring-cyan-500/20 bg-cyan-500/10 text-cyan-400',
  },
  {
    code: PC.GUARD,
    name: 'GUARD',
    fullName: 'Downside Guard Protocol',
    icon: Shield,
    colorClass: 'text-rose-400 border-rose-500/25 bg-rose-500/5',
    activeClass: 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-500/10 text-rose-400',
  },
];

export function PresetSelector({
  selectedPreset,
  onChange,
  customOverrides,
  onResetOverrides,
}: PresetSelectorProps) {
  const overrideCount = Object.keys(customOverrides).length;

  return (
    <div className="rounded-xl border border-border/80 bg-card/60 backdrop-blur-md p-5 shadow-lg">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div>
          <h3 className="text-md font-bold text-foreground flex items-center gap-2">
            <SlidersHorizontal className="h-4.5 w-4.5 text-primary" />
            Cấu hình Chiến lược FinPilot
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Chọn một preset cấu hình định lượng hoặc tinh chỉnh tham số riêng của bạn.
          </p>
        </div>

        {overrideCount > 0 && (
          <div className="flex items-center gap-2 self-start md:self-auto">
            <span className="inline-flex items-center rounded-full bg-primary/15 px-2 py-0.5 text-xs font-semibold text-primary">
              {overrideCount} tùy chỉnh thủ công
            </span>
            {onResetOverrides && (
              <button
                onClick={onResetOverrides}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                title="Khôi phục về mặc định của Preset"
              >
                <RotateCcw className="h-3 w-3" />
                Reset mặc định
              </button>
            )}
          </div>
        )}
      </div>

      <div className="grid gap-3 grid-cols-2 md:grid-cols-5">
        {PRESET_INFOS.map((preset) => {
          const isActive = selectedPreset === preset.code;
          const Icon = preset.icon;

          return (
            <button
              key={preset.code}
              type="button"
              onClick={() => onChange(preset.code)}
              className={`flex flex-col items-center justify-between text-center rounded-xl border p-3.5 transition-all duration-300 cursor-pointer ${
                isActive ? preset.activeClass : 'border-border bg-card/40 hover:bg-card/90 hover:border-border-hover'
              }`}
            >
              <div className="flex flex-col items-center">
                <div className={`p-2 rounded-lg mb-2.5 ${isActive ? 'bg-primary/5' : 'bg-secondary/40'}`}>
                  <Icon className={`h-5 w-5 ${isActive ? '' : 'text-muted-foreground'}`} />
                </div>
                <span className="text-xs font-black tracking-wider">{preset.name}</span>
                <span className="text-[9px] text-muted-foreground line-clamp-1 mt-0.5 font-semibold">
                  {preset.fullName}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Preset Details panel */}
      {(() => {
        const activeInfo = PRESET_INFOS.find((p) => p.code === selectedPreset);
        if (!activeInfo) return null;
        return (
          <div className="mt-4 rounded-lg bg-secondary/30 border border-border/40 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Mô tả Preset</span>
              <p className="text-xs text-foreground font-medium leading-relaxed">
                {getPresetDescription(selectedPreset)}
              </p>
            </div>
            <div className="shrink-0 space-y-0.5">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Thực thi ưu tiên</span>
              <span className="inline-flex rounded bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary border border-primary/20">
                {getPresetExecutionHint(selectedPreset)}
              </span>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
