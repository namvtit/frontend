// ── Event Decision Card Component ──
// Displays individual decision events with choices

'use client';

import React, { useState } from 'react';
import { useReplay } from '@/lib/demo/replay';
import { cn } from '@/lib/utils';
import {
  Bot,
  TrendingUp,
  TrendingDown,
  Shield,
  Zap,
  Target,
  CircleAlert,
  CheckCircle2,
  ChevronRight,
  BarChart3,
} from 'lucide-react';
import type { DecisionCheckpoint } from '@/lib/demo/replay/types';

interface EventDecisionCardProps {
  decisionId?: string;
}

export function EventDecisionCard({ decisionId }: EventDecisionCardProps) {
  const { state, resolveDecision } = useReplay();
  const { decisions, currentDecisionIndex } = state;
  
  const decision = decisionId 
    ? decisions.find(d => d.id === decisionId)
    : decisions[currentDecisionIndex];
  
  if (!decision) return null;
  
  return <DecisionCard decision={decision} onResolve={(choiceId) => resolveDecision(decision.index - 1, choiceId)} />;
}

export function DecisionCard({ 
  decision, 
  onResolve 
}: { 
  decision: DecisionCheckpoint;
  onResolve: (choiceId: string) => void;
}) {
  const [showWhy, setShowWhy] = useState(false);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);

  const handleConfirm = () => {
    if (selectedChoice) {
      onResolve(selectedChoice);
    }
  };

  const getTypeIcon = () => {
    switch (decision.type) {
      case 'initial-allocation': return <Shield className="w-5 h-5" />;
      case 'take-profit': return <TrendingUp className="w-5 h-5" />;
      case 'sharp-decline': return <TrendingDown className="w-5 h-5" />;
      case 'grid-reentry': return <Target className="w-5 h-5" />;
      case 'forecast-rotation': return <Zap className="w-5 h-5" />;
      default: return <BarChart3 className="w-5 h-5" />;
    }
  };

  const getTypeColor = () => {
    switch (decision.type) {
      case 'initial-allocation': return 'text-blue-500 bg-blue-500/10';
      case 'take-profit': return 'text-emerald-500 bg-emerald-500/10';
      case 'sharp-decline': return 'text-red-500 bg-red-500/10';
      case 'grid-reentry': return 'text-amber-500 bg-amber-500/10';
      case 'forecast-rotation': return 'text-purple-500 bg-purple-500/10';
      default: return 'text-gray-500 bg-gray-500/10';
    }
  };

  return (
    <div className="bg-card/80 backdrop-blur-sm rounded-2xl border border-border p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn("p-2 rounded-xl", getTypeColor())}>
            {getTypeIcon()}
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{decision.title}</h3>
            <p className="text-xs text-muted-foreground">
              Ngày: {decision.date} • PISI confidence: {decision.confidence}%
            </p>
          </div>
        </div>
        <div className={cn("px-3 py-1 rounded-full text-xs font-semibold", getTypeColor())}>
          Quyết định {decision.index} / 5
        </div>
      </div>

      {/* Observations */}
      <div className="grid grid-cols-2 gap-2">
        {decision.observations.map((obs, i) => (
          <div key={i} className="bg-muted/40 rounded-lg p-2">
            <p className="text-[10px] text-muted-foreground">{obs.label}</p>
            <p className={cn(
              "text-sm font-semibold",
              obs.direction === 'positive' ? 'text-emerald-500' :
              obs.direction === 'negative' ? 'text-red-500' : 'text-foreground'
            )}>
              {obs.value}
            </p>
          </div>
        ))}
      </div>

      {/* Recommendation */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <Bot className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold text-primary">KHUYẾN NGHỊ PISI</span>
        </div>
        <p className="text-sm text-foreground leading-relaxed">
          {decision.recommendation.summary}
        </p>
        {decision.recommendation.suggestedPercent && (
          <p className="text-xs text-muted-foreground mt-2">
            Tỷ lệ: {decision.recommendation.suggestedPercent}% portfolio
          </p>
        )}
      </div>

      {/* Comparison Table (for rotation) */}
      {decision.recommendation.comparison && (
        <div className="bg-muted/30 rounded-xl p-3">
          <p className="text-xs font-semibold text-muted-foreground mb-2">SO SÁNH HAI LỰA CHỌN</p>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-muted-foreground">
                <th className="text-left py-1">Chỉ số</th>
                <th className="text-center py-1">Hiện tại</th>
                <th className="text-center py-1">Thay thế</th>
              </tr>
            </thead>
            <tbody>
              {decision.recommendation.comparison.map((comp, i) => (
                <tr key={i} className="border-t border-border">
                  <td className="py-1.5 text-muted-foreground">{comp.label}</td>
                  <td className="text-center py-1.5">{comp.current}</td>
                  <td className={cn(
                    "text-center py-1.5 font-semibold",
                    comp.direction === 'positive' ? 'text-emerald-500' : 'text-foreground'
                  )}>
                    {comp.replacement}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Why Now Button */}
      <button
        onClick={() => setShowWhy(!showWhy)}
        className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <CircleAlert className="w-4 h-4" />
        {showWhy ? 'Ẩn lý do' : 'Xem lý do PISI đề xuất'}
      </button>

      {/* Why Now Details */}
      {showWhy && (
        <div className="bg-muted/30 rounded-xl p-4 space-y-3 text-sm">
          <div>
            <p className="font-semibold text-foreground mb-1">Tại sao cần quyết định ngay:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              {decision.whyNow.map((reason, i) => (
                <li key={i}>{reason}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-semibold text-foreground mb-1">Đánh đổi:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              {decision.tradeoffs.map((tradeoff, i) => (
                <li key={i}>{tradeoff}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-semibold text-foreground mb-1">Rủi ro cần kiểm soát:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              {decision.riskGuards.map((guard, i) => (
                <li key={i}>{guard}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Choices */}
      <div className="space-y-2">
        {decision.choices.map((choice) => (
          <button
            key={choice.id}
            onClick={() => setSelectedChoice(choice.id)}
            className={cn(
              "w-full p-4 rounded-xl border-2 text-left transition-all",
              selectedChoice === choice.id
                ? choice.variant === 'primary'
                  ? 'border-primary bg-primary/10'
                  : choice.variant === 'destructive'
                  ? 'border-red-500 bg-red-500/10'
                  : 'border-purple-500 bg-purple-500/10'
                : 'border-border hover:border-muted-foreground/30'
            )}
          >
            <p className={cn(
              "font-semibold",
              selectedChoice === choice.id ? 'text-foreground' : 'text-muted-foreground'
            )}>
              {choice.label}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">{choice.description}</p>
          </button>
        ))}
      </div>

      {/* Confirm Button */}
      {selectedChoice && (
        <button
          onClick={handleConfirm}
          className="w-full py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors"
        >
          Xác nhận quyết định
        </button>
      )}
    </div>
  );
}
