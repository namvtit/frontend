// ── Market Replay Page ──
// Full-screen immersive demo with stable layout

'use client';

import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import Link from 'next/link';
import { ReplayProvider, useReplay } from '@/lib/demo/replay';
import { FinalReplayReport, CompletionModal } from '@/components/replay';
import { cn } from '@/lib/utils';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  CheckCircle2,
  ChevronRight,
  ChevronDown,
  Bot,
  ArrowLeft,
  RefreshCw,
  BarChart3,
  Shield,
  Zap,
  Target,
  CircleAlert,
  Send,
  Info,
  Play,
  Pause,
  Clock,
  Award,
} from 'lucide-react';

// ── Constants ──

const SIMULATION_DAYS = 365;

// ── Format currency ──

function formatCurrency(value: number, short = false): string {
  if (short) {
    if (Math.abs(value) >= 1e9) return `${(value / 1e9).toFixed(1)}B`;
    if (Math.abs(value) >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
    if (Math.abs(value) >= 1e3) return `${(value / 1e3).toFixed(0)}K`;
  }
  return value.toLocaleString('vi-VN');
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

// ── Bold Text Renderer (safe, no HTML injection) ──

function renderBoldText(text: string): React.ReactNode[] {
  // Split by **...** pattern, preserving non-bold text
  const parts: React.ReactNode[] = [];
  const regex = /\*\*([^*]+)\*\*/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    // Add bold text
    parts.push(<strong key={match.index}>{match[1]}</strong>);
    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}

// ── Chat Message with Bold Text ──

const CalendarIcon = memo(function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
      <line x1="16" x2="16" y1="2" y2="6" />
      <line x1="8" x2="8" y1="2" y2="6" />
      <line x1="3" x2="21" y1="10" y2="10" />
    </svg>
  );
});

// ── Progress Bar ──

const ReplayProgressBar = memo(function ReplayProgressBar() {
  const { state, resetReplay, togglePlay, isPlaying, isAdvancing, currentProgress, currentDay } = useReplay();
  const { currentDate, phase, decisions, currentDecisionIndex } = state;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const progress = currentProgress * 100;
  const isRunning = phase === 'replay-running';
  const isComplete = phase === 'replay-complete';

  const currentDecision = decisions[currentDecisionIndex];
  const isAtDecision = currentDecision && currentDecision.status === 'pending';

  return (
    <div className="shrink-0 bg-card/95 backdrop-blur-sm border-b border-border px-3 py-2 z-50">
      <div className="flex items-center gap-2 max-w-full">
        <Link href="/" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors shrink-0">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Dashboard</span>
        </Link>

        <div className="flex items-center gap-1.5 min-w-0 shrink-0">
          <CalendarIcon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <span className="text-xs font-medium truncate">{formatDate(currentDate)}</span>
          <span className="text-[10px] text-muted-foreground shrink-0">{currentDay}/{SIMULATION_DAYS}</span>
        </div>

        <div className="flex-1 min-w-[60px] h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all duration-300", isComplete ? "bg-emerald-500" : progress >= 50 ? "bg-emerald-500" : "bg-primary")}
            style={{ width: `${progress}%` }}
          />
        </div>

        {(isRunning || isComplete) && (
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1">
              {isComplete ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              )}
              <span className="text-[10px]">{decisions.filter(d => d.status === 'resolved').length}/5</span>
            </div>
            {isComplete ? (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600">
                Hoàn thành
              </span>
            ) : isAdvancing ? (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-600 animate-pulse">
                Đang chạy...
              </span>
            ) : isAtDecision ? (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-600 animate-pulse">
                Chờ QĐ
              </span>
            ) : null}
          </div>
        )}

        {isRunning && !isComplete && (
          <button onClick={togglePlay} type="button" className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors shrink-0" title={isPlaying ? "Tạm dừng" : "Tiếp tục"}>
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>
        )}

        {(isRunning || isComplete) && (
          <button onClick={resetReplay} type="button" className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors shrink-0" title="Bắt đầu lại">
            <RefreshCw className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        )}
      </div>
    </div>
  );
});

// ── Decision Card ──

interface DecisionData {
  id: string;
  index: number;
  type: string;
  title: string;
  date: string;
  dayNumber: number;
  trigger: string;
  observations: Array<{ label: string; value: string; direction?: string }>;
  recommendation: {
    action: string;
    summary: string;
    suggestedPercent?: number;
  };
  whyNow: string[];
  confidence: number;
  choices: Array<{ id: string; label: string; description: string; variant: string }>;
  /** Set when AI revision changed the recommendation */
  revised?: boolean;
  /** Tracks how many times AI has revised this decision */
  revisionCount?: number;
}

const DecisionCard = memo(function DecisionCard({ decision, onResolve }: { decision: DecisionData; onResolve: (choiceId: string) => void }) {
  const [showWhy, setShowWhy] = useState(false);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);

  const getTypeIcon = () => {
    switch (decision.type) {
      case 'initial-allocation': return <Shield className="w-4 h-4" />;
      case 'take-profit': return <TrendingUp className="w-4 h-4" />;
      case 'sharp-decline': return <TrendingDown className="w-4 h-4" />;
      case 'grid-reentry': return <Target className="w-4 h-4" />;
      case 'forecast-rotation': return <Zap className="w-4 h-4" />;
      default: return <BarChart3 className="w-4 h-4" />;
    }
  };

  const getTypeColor = () => {
    switch (decision.type) {
      case 'initial-allocation': return 'text-blue-500 bg-blue-500/10 border-blue-500';
      case 'take-profit': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500';
      case 'sharp-decline': return 'text-red-500 bg-red-500/10 border-red-500';
      case 'grid-reentry': return 'text-amber-500 bg-amber-500/10 border-amber-500';
      case 'forecast-rotation': return 'text-purple-500 bg-purple-500/10 border-purple-500';
      default: return 'text-gray-500 bg-gray-500/10 border-gray-500';
    }
  };

  return (
    <div className="bg-card/90 backdrop-blur rounded-xl border border-border p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={cn("p-1.5 rounded-lg border", getTypeColor())}>{getTypeIcon()}</div>
          <div>
            <h3 className="font-semibold text-sm text-foreground">{decision.title}</h3>
            <p className="text-[10px] text-muted-foreground">{formatDate(decision.date)}</p>
          </div>
        </div>
        <div className={cn("px-2 py-0.5 rounded-full text-[10px] font-semibold border", getTypeColor())}>
          QĐ {decision.index}/5
        </div>
        {decision.revised && (
          <div className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-600 border border-amber-500/20">
            Đã điều chỉnh
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        {decision.observations.map((obs, i) => (
          <div key={i} className="bg-muted/40 rounded-lg p-2">
            <p className="text-[9px] text-muted-foreground">{obs.label}</p>
            <p className={cn("text-xs font-semibold", obs.direction === 'positive' ? 'text-emerald-500' : obs.direction === 'negative' ? 'text-red-500' : 'text-foreground')}>
              {obs.value}
            </p>
          </div>
        ))}
      </div>

      <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
        <div className="flex items-center gap-1.5 mb-1.5">
          <Bot className="w-3.5 h-3.5 text-primary" />
          <span className="text-[10px] font-bold text-primary">KHUYẾN NGHỊ</span>
          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/20 text-primary ml-auto">{decision.confidence}%</span>
        </div>
        <p className="text-xs text-foreground leading-relaxed">{renderBoldText(decision.recommendation.summary)}</p>
        {decision.recommendation.suggestedPercent && (
          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(decision.recommendation.suggestedPercent * 2, 100)}%` }} />
            </div>
            <span className="text-[10px] font-medium text-primary">{decision.recommendation.suggestedPercent}%</span>
          </div>
        )}
      </div>

      <button type="button" onClick={() => setShowWhy(!showWhy)} className={cn("flex items-center gap-1.5 text-[10px] w-full", showWhy ? 'text-foreground' : 'text-muted-foreground')}>
        <CircleAlert className="w-3.5 h-3.5" />
        {showWhy ? 'Ẩn lý do' : 'Xem lý do PISI đề xuất'}
        <ChevronRight className={cn("w-3 h-3 ml-auto transition-transform", showWhy && "rotate-90")} />
      </button>

      {showWhy && (
        <div className="bg-muted/30 rounded-lg p-3 space-y-2 text-[10px]">
          <p className="font-semibold text-foreground">Tại sao cần quyết định ngay:</p>
          <ul className="space-y-1 text-muted-foreground">
            {decision.whyNow.map((r, i) => <li key={i} className="flex items-start gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-500 mt-0.5 shrink-0" />{r}</li>)}
          </ul>
        </div>
      )}

      <div className="space-y-2">
        {decision.choices.map((choice) => (
          <button
            key={choice.id}
            type="button"
            onClick={() => setSelectedChoice(choice.id)}
            className={cn(
              "w-full p-3 rounded-lg border-2 text-left text-xs transition-colors",
              selectedChoice === choice.id
                ? choice.variant === 'primary' ? "border-primary bg-primary/10"
                : choice.variant === 'destructive' ? "border-red-500 bg-red-500/10"
                : "border-purple-500 bg-purple-500/10"
                : "border-border hover:border-primary/50"
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold">{choice.label}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{choice.description}</p>
              </div>
              {selectedChoice === choice.id && <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />}
            </div>
          </button>
        ))}
      </div>

      {selectedChoice && (
        <button
          type="button"
          onClick={() => { onResolve(selectedChoice); setSelectedChoice(null); }}
          className="w-full py-2.5 bg-primary text-white rounded-lg font-semibold text-sm hover:bg-primary/90 flex items-center justify-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4" /> Xác nhận
        </button>
      )}
    </div>
  );
});

// ── Chat Message ──

const ChatMessage = memo(function ChatMessage({ message, onChipSelect, isLatest }: { message: { id: string; role: string; content: string; chips?: { label: string; value: string }[] }; onChipSelect?: (value: string) => void; isLatest?: boolean }) {
  const isUser = message.role === 'user';

  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div className={cn("max-w-[85%] rounded-2xl px-3 py-2 text-xs", isUser ? "bg-indigo-500 text-white rounded-tr-sm" : "bg-muted/50 border border-border rounded-tl-sm")}>
        <p className="whitespace-pre-line">{renderBoldText(message.content)}</p>
        {message.chips && isLatest && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {message.chips.map((chip, idx) => (
              <button key={idx} type="button" onClick={() => onChipSelect?.(chip.value)}
                className={cn("px-2.5 py-1 rounded-full text-[10px] font-semibold cursor-pointer", isUser ? "bg-white/20 text-white" : "border border-purple-500/30 bg-purple-500/10 text-purple-600")}>
                {chip.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

// ── Chat Input ──

const ChatInput = memo(function ChatInput() {
  const { sendChat, requestDecisionRevision, revisionLoading, state, currentDecision } = useReplay();
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const { phase } = state;

  const hasActiveDecision = phase === 'replay-running' && currentDecision?.status === 'pending';
  const isOnboarding = phase.startsWith('onboarding');

  const handleSubmit = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed) return;

    if (hasActiveDecision) {
      // Replay: AI revision mode
      requestDecisionRevision(trimmed);
    } else {
      // Onboarding: deterministic text routing
      sendChat(trimmed);
    }
    setInput('');
  }, [input, hasActiveDecision, requestDecisionRevision, sendChat]);

  return (
    <div className="flex gap-2">
      {hasActiveDecision && (
        <div className="flex items-center gap-1 shrink-0">
          <Bot className="w-4 h-4 text-primary" />
          <span className="text-[10px] text-primary hidden sm:inline">AI điều chỉnh</span>
        </div>
      )}
      {isOnboarding && (
        <div className="flex items-center gap-1 shrink-0">
          <Bot className="w-4 h-4 text-purple-500" />
        </div>
      )}
      <input ref={inputRef} type="text" className="input flex-1 py-2 px-3 text-sm" 
        placeholder={
          hasActiveDecision
            ? "Gửi phản hồi để điều chỉnh quyết định..."
            : isOnboarding
            ? "Nhắn tin hoặc nhấn chip để tiếp tục..."
            : "Nhắn tin cho AI..."
        }
        value={input} onChange={e => setInput(e.target.value)} 
        onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSubmit())} 
        disabled={revisionLoading} />
      <button type="button" className="btn btn-ai px-4" onClick={handleSubmit} disabled={revisionLoading}>
        {revisionLoading ? (
          <RefreshCw className="w-4 h-4 animate-spin" />
        ) : (
          <Send className="w-4 h-4" />
        )}
      </button>
    </div>
  );
});

// ── Chat Feed ──

const ChatFeed = memo(function ChatFeed() {
  const { state, dispatch, resolveDecision, togglePlay, isPlaying, isAdvancing, revisionLoading } = useReplay();
  const { messages, phase, decisions, currentDecisionIndex } = state;
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevLenRef = useRef(messages.length);
  const prevPhaseRef = useRef(phase);
  const hasAutoStartedRef = useRef(false);

  // Auto-start when replay-running phase is reached
  useEffect(() => {
    if (prevPhaseRef.current !== 'replay-running' && phase === 'replay-running') {
      // Small delay to let the UI render first
      const timer = setTimeout(() => {
        if (!hasAutoStartedRef.current) {
          hasAutoStartedRef.current = true;
          togglePlay();
        }
      }, 500);
      return () => clearTimeout(timer);
    }
    prevPhaseRef.current = phase;
  }, [phase, togglePlay]);

  useEffect(() => {
    if (messages.length > prevLenRef.current && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollTop + 100;
    }
    prevLenRef.current = messages.length;
  }, [messages.length]);

  const handleChip = useCallback((value: string) => {
    if (phase === 'onboarding-capital') dispatch({ type: 'SET_CAPITAL', capital: parseInt(value) });
    else if (phase === 'onboarding-risk') dispatch({ type: 'SET_RISK_PROFILE', profile: value as 'conservative' | 'balanced' | 'growth' });
    else if (phase === 'onboarding-review') {
      if (value === 'accept') {
        hasAutoStartedRef.current = false; // Reset for new replay
        dispatch({ type: 'ACCEPT_PROPOSAL' });
      }
      else if (value === 'modify') dispatch({ type: 'REJECT_PROPOSAL' });
      else if (value === 'reset') dispatch({ type: 'RESET' });
    }
  }, [phase, dispatch]);

  const chatMessages = messages.filter(m => m.role === 'user' || m.role === 'assistant');
  const currentDecision = decisions[currentDecisionIndex];

  return (
    <div className="flex flex-col h-full min-h-0">
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3">
        {chatMessages.map((msg, idx) => (
          <div key={msg.id}>
            <ChatMessage message={msg} onChipSelect={handleChip} isLatest={idx === chatMessages.length - 1} />
            {idx === chatMessages.length - 1 && currentDecision?.status === 'pending' && !isAdvancing && !revisionLoading && (
              <div className="mt-3" key={`dc_${currentDecision.id}_${currentDecision.recommendation.action}_${currentDecision.confidence}`}>
                <DecisionCard decision={currentDecision} onResolve={choiceId => resolveDecision(currentDecisionIndex, choiceId)} />
              </div>
            )}
          </div>
        ))}
        
        {/* Revision loading indicator */}
        {revisionLoading && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 rounded-full px-4 py-2 w-fit">
            <RefreshCw className="w-3 h-3 animate-spin" />
            <span>AI đang điều chỉnh quyết định...</span>
          </div>
        )}
        
        {/* Advancing indicator in chat area */}
        {isAdvancing && (
          <div className="flex items-center justify-center py-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 rounded-full px-4 py-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              <span>Đang chạy đến sự kiện tiếp theo...</span>
            </div>
          </div>
        )}
        
        {phase === 'replay-complete' && (
          <div className="mt-3 p-4 bg-muted/30 rounded-xl border border-border">
            <div className="flex items-center gap-2 mb-2">
              <Award className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">1-Year Simulation Complete</span>
            </div>
            <FinalReplayReport />
          </div>
        )}
      </div>
      <div className="shrink-0 p-3 border-t border-border">
        <ChatInput />
      </div>
    </div>
  );
});

// ── Decision History Item (compact) ──

const DecisionHistoryItem = memo(function DecisionHistoryItem({ decision }: { decision: { id: string; index: number; type: string; title: string; date: string; resolution?: { choiceLabel: string; explanation?: string; tradeExecuted?: { type: string; symbol: string; quantity: number; pnl?: number } } } }) {
  const [expanded, setExpanded] = useState(false);

  const colorClass = decision.type === 'take-profit' ? 'border-l-emerald-500' : decision.type === 'sharp-decline' ? 'border-l-red-500' : 'border-l-primary';

  return (
    <div className={cn("bg-muted/30 rounded-lg border border-border border-l-4 overflow-hidden", colorClass)}>
      <button type="button" className="w-full p-2 flex items-center justify-between" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          <span className="text-xs font-medium text-foreground truncate">{decision.title}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] text-muted-foreground">{formatDate(decision.date)}</span>
          <ChevronDown className={cn("w-3 h-3 text-muted-foreground transition-transform", expanded && "rotate-180")} />
        </div>
      </button>
      {expanded && (
        <div className="px-3 pb-3 pt-1 space-y-2 text-[10px]">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Quyết định:</span>
            <span className="font-semibold text-emerald-500">{decision.resolution?.choiceLabel || 'Skip'}</span>
          </div>
          {decision.resolution?.tradeExecuted && (
            <div className="bg-background/50 rounded p-1.5 space-y-1">
              <div className="flex justify-between">
                <span>{decision.resolution.tradeExecuted.type === 'buy' ? 'Mua' : 'Bán'} {decision.resolution.tradeExecuted.symbol}</span>
                <span className="font-mono">{decision.resolution.tradeExecuted.quantity} cp</span>
              </div>
              {decision.resolution.tradeExecuted.pnl !== undefined && (
                <div className={cn("font-semibold", decision.resolution.tradeExecuted.pnl >= 0 ? "text-emerald-500" : "text-red-500")}>
                  {decision.resolution.tradeExecuted.pnl >= 0 ? '+' : ''}{formatCurrency(decision.resolution.tradeExecuted.pnl)}
                </div>
              )}
            </div>
          )}
          {decision.resolution?.explanation && (
            <p className="text-muted-foreground">{renderBoldText(decision.resolution.explanation)}</p>
          )}
        </div>
      )}
    </div>
  );
});

// ── Portfolio Summary ──

const PortfolioSummary = memo(function PortfolioSummary() {
  const { state, resolvedDecisions } = useReplay();
  const { holdings, cashBalance, currentPrice, initialCapital } = state;
  const [showHistory, setShowHistory] = useState(false);

  const totalValue = cashBalance + Object.values(holdings).reduce((acc, h) => acc + (currentPrice[h.symbol] || h.avgPrice) * h.quantity, 0);
  const pnlPercent = initialCapital > 0 ? ((totalValue - initialCapital) / initialCapital) * 100 : 0;
  const holdingsList = Object.values(holdings).map(h => ({ ...h, price: currentPrice[h.symbol] || h.avgPrice }));

  if (holdingsList.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Wallet className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Chưa có danh mục</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wallet className="w-4 h-4 text-primary" />
          <span className="font-semibold text-sm">Danh Mục</span>
        </div>
        <span className={cn("text-xs font-semibold px-2 py-0.5 rounded", pnlPercent >= 0 ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600")}>
          {pnlPercent >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}%
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="bg-muted/40 rounded-lg p-2">
          <p className="text-[9px] text-muted-foreground">Tiền mặt</p>
          <p className="text-sm font-bold font-mono">{formatCurrency(cashBalance, true)}</p>
        </div>
        <div className="bg-muted/40 rounded-lg p-2">
          <p className="text-[9px] text-muted-foreground">NAV</p>
          <p className="text-sm font-bold font-mono">{formatCurrency(totalValue, true)}</p>
        </div>
      </div>

      <div className="space-y-1.5">
        <p className="text-[9px] text-muted-foreground uppercase">Vị thế</p>
        {holdingsList.map(h => (
          <div key={h.symbol} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded bg-primary/10 flex items-center justify-center">
                <span className="text-[10px] font-bold text-primary">{h.symbol[0]}</span>
              </div>
              <span className="text-xs font-semibold">{h.symbol}</span>
            </div>
            <span className={cn("text-xs font-mono", (h.price - h.avgPrice) / h.avgPrice >= 0 ? "text-emerald-500" : "text-red-500")}>
              {((h.price - h.avgPrice) / h.avgPrice * 100).toFixed(1)}%
            </span>
          </div>
        ))}
      </div>

      {/* Decision History Accordion */}
      {resolvedDecisions.length > 0 && (
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center justify-between w-full text-[10px] font-semibold text-muted-foreground uppercase hover:text-foreground"
          >
            <span>Lịch sử quyết định ({resolvedDecisions.length})</span>
            <ChevronRight className={cn("w-3 h-3 transition-transform", showHistory && "rotate-90")} />
          </button>
          {showHistory && (
            <div className="space-y-1.5 max-h-64 overflow-y-auto">
              {resolvedDecisions.map(d => (
                <DecisionHistoryItem key={d.id} decision={d} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
});

// ── Welcome Panel ──

const WelcomePanel = memo(function WelcomePanel() {
  const { resetReplay, state } = useReplay();
  const { proposal } = state;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="p-4 space-y-4">
        <div className="bg-gradient-to-r from-primary/10 to-indigo-500/10 rounded-xl border border-primary/20 p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-foreground">PISI Investment Replay</h2>
              <p className="text-[10px] text-muted-foreground">Mô phỏng đầu tư 2025</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="bg-gradient-to-r from-primary/10 to-indigo-500/10 rounded-xl border border-primary/20 p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-foreground">PISI Investment Replay</h2>
            <p className="text-[10px] text-muted-foreground">Mô phỏng đầu tư 2025</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="w-3.5 h-3.5" />
          <span><strong>365 ngày</strong> mô phỏng (20 giây thực)</span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <Info className="w-3.5 h-3.5" />
          <span>Dữ liệu mô phỏng, không phải lời khuyên.</span>
        </div>
      </div>

      {proposal && (
        <div className="bg-card rounded-xl border border-border p-3">
          <h3 className="font-semibold text-sm mb-2">Danh mục đề xuất</h3>
          <div className="space-y-1.5">
            {proposal.holdings.map(h => (
              <div key={h.symbol} className="flex items-center justify-between p-1.5 bg-muted/30 rounded-lg text-xs">
                <span className="font-semibold">{h.symbol}</span>
                <span className="text-muted-foreground">{h.allocation}%</span>
              </div>
            ))}
            <div className="pt-1.5 border-t flex justify-between text-xs">
              <span className="text-muted-foreground">Tiền mặt</span>
              <span className="font-semibold">{proposal.cashReserve}%</span>
            </div>
          </div>
        </div>
      )}

      <button type="button" onClick={resetReplay} className="w-full py-2 text-xs text-muted-foreground hover:text-foreground">
        Bắt đầu lại
      </button>
    </div>
  );
});

// ── Main Page ──

export default function MarketReplayPage() {
  return (
    <ReplayProvider>
      <MarketReplayContent />
      <CompletionModalWrapper />
    </ReplayProvider>
  );
}

function CompletionModalWrapper() {
  const { state } = useReplay();
  const { phase } = state;
  const [showCompletion, setShowCompletion] = useState(false);

  useEffect(() => {
    if (phase === 'replay-complete') {
      setShowCompletion(true);
    }
  }, [phase]);

  if (!showCompletion) return null;

  return <CompletionModal onPlayAgain={() => setShowCompletion(false)} />;
}

function MarketReplayContent() {
  const { state, isAdvancing } = useReplay();
  const { phase } = state;
  const isRunning = phase === 'replay-running' || phase === 'replay-complete';
  const isComplete = phase === 'replay-complete';

  return (
    <div className="h-[100dvh] overflow-hidden flex flex-col bg-background">
      <ReplayProgressBar />

      {/* Advancing status banner - only show when advancing AND not complete */}
      {isAdvancing && !isComplete && (
        <div className="shrink-0 bg-blue-500/10 border-b border-blue-500/20 px-3 py-1.5 text-center">
          <span className="text-xs text-blue-600 font-medium animate-pulse">Đang chạy đến sự kiện tiếp theo...</span>
        </div>
      )}

      {/* Mobile: chat takes full remaining viewport, balance scrolls below */}
      {/* Desktop: side-by-side layout */}
      <div className="flex-1 min-h-0 flex flex-col lg:grid lg:grid-cols-[minmax(0,2fr)_minmax(240px,1fr)] overflow-hidden">
        {/* Chat - FULL height on mobile (fixed viewport), LEFT side on desktop */}
        <div className="flex-1 h-[calc(100dvh-3rem)] sm:h-auto sm:min-h-0 lg:min-h-0 lg:max-h-none flex flex-col border-b lg:border-b-0 lg:border-r border-border order-1 lg:order-none">
          <ChatFeed />
        </div>

        {/* Balance/Portfolio - BELOW chat on mobile (scroll to see), RIGHT side on desktop */}
        <div className="lg:shrink-0 max-h-[40dvh] lg:max-h-none overflow-y-auto bg-muted/10 order-2 lg:order-none">
          {isRunning || isComplete ? (
            <div className="p-3 lg:p-4">
              <PortfolioSummary />
            </div>
          ) : (
            <WelcomePanel />
          )}
        </div>
      </div>
    </div>
  );
}
