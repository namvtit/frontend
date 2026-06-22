// ── Market Replay Context ──
// Manages all replay state with localStorage persistence and time-based simulation

'use client';

import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  useMemo,
  useState,
  useRef,
  type ReactNode,
} from 'react';
import type {
  ReplayState,
  ReplayConfig,
  ReplayMessage,
  ReplayPrice,
  DecisionCheckpoint,
} from './types';
import {
  generateReplayHistory,
  getTradingDays,
} from './historical-data';
import {
  buildPortfolio,
  generateDecisionCheckpoints,
  calculateFinalMetrics,
  resolveDecision,
} from './engine';
import { getStockBySymbol } from '@/lib/market/mock-data';

// ── Constants ──

const STORAGE_KEY = 'pisi_investment_replay_v2';
const SIMULATION_DURATION_MS = 20_000;
const SIMULATION_DAYS = 365;
const FAST_FORWARD_MS = 1500; // Smooth transition time to next event

// ── Storage ──

interface PersistedState {
  phase: ReplayState['phase'];
  config: ReplayConfig;
  initialCapital: number;
  cashBalance: number;
  holdings: Record<string, { symbol: string; name: string; quantity: number; avgPrice: number; gridLevels: unknown[]; realizedPnL: number }>;
  proposal: ReplayState['proposal'];
  currentDate: string;
  currentDay: number;
  prices: Record<string, ReplayPrice[]>;
  decisions: DecisionCheckpoint[];
  currentDecisionIndex: number;
  realizedPnL: number;
  messages: ReplayMessage[];
  isComplete: boolean;
  pausedAtProgress: number | null;
}

function loadReplayState(): PersistedState | null {
  if (typeof window === 'undefined') return null;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

function saveReplayState(state: PersistedState) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

function clearReplayState() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

function createDefaultConfig(seed: 'golden' | 'resilience' = 'golden'): ReplayConfig {
  return { seed, events: 'default', startDate: '2025-01-01', endDate: '2025-12-31', capital: 0, riskProfile: 'balanced' };
}

function createInitialState(config: ReplayConfig): ReplayState {
  return {
    config,
    phase: 'onboarding-capital',
    initialCapital: 0,
    cashBalance: 0,
    holdings: {},
    proposal: null,
    currentDate: config.startDate,
    currentDay: 0,
    currentPrice: {},
    prices: {},
    snapshots: [],
    decisions: [],
    currentDecisionIndex: 0,
    maxDrawdown: 0,
    maxDrawdownDate: '',
    realizedPnL: 0,
    messages: [{
      id: 'init_1',
      role: 'assistant',
      content: 'Chào mừng bạn đến với **PISI Investment Replay** — mô phỏng đầu tư 365 ngày.\n\nBạn dự định đầu tư bao nhiêu?',
      chips: [
        { label: '25 triệu VNĐ', value: '25000000' },
        { label: '50 triệu VNĐ', value: '50000000' },
        { label: '100 triệu VNĐ', value: '100000000' },
        { label: '250 triệu VNĐ', value: '250000000' },
      ],
      timestamp: 'SERVER_INIT_TIMESTAMP', // Will be replaced on client
    }],
    isComplete: false,
    metrics: null,
  };
}

// ── Actions ──

type Action =
  | { type: 'HYDRATE'; state: ReplayState; pausedAtProgress: number | null }
  | { type: 'RESET' }
  // Setup: chip buttons
  | { type: 'SET_CAPITAL'; capital: number }
  | { type: 'SET_RISK_PROFILE'; profile: 'conservative' | 'balanced' | 'growth' }
  | { type: 'ACCEPT_PROPOSAL' }
  | { type: 'REJECT_PROPOSAL' }
  | { type: 'START_REPLAY' }
  | { type: 'AUTO_START' }
  // Replay: decision resolution
  | { type: 'RESOLVE_DECISION'; decisionIndex: number; choiceId: string }
  | { type: 'UPDATE_PROGRESS'; progress: number; dayFloat: number }
  | { type: 'COMPLETE_REPLAY' }
  // Setup: free-text chat (capital via text, or any other setup text)
  | { type: 'SETUP_CHAT_INPUT'; content: string }
  // Replay: free-text chat during active decision
  | { type: 'RECEIVE_AI_REVISION'; decisionIndex: number; revisedDecision: DecisionCheckpoint; message: string }
  | { type: 'REVISION_ERROR'; message: string };

// ── Reducer ──

// Helper: make assistant message
function assistantMsg(content: string, chips?: ReplayMessage['chips']): ReplayMessage {
  return { id: `a_${Date.now()}`, role: 'assistant', content, chips, timestamp: new Date().toISOString() };
}

// Helper: make user message
function userMsg(content: string): ReplayMessage {
  return { id: `u_${Date.now()}`, role: 'user', content, timestamp: new Date().toISOString() };
}

// Parse a capital amount from user text.
// Returns a positive integer (in VNĐ) if the text looks like a capital amount, else null.
function parseCapitalFromText(text: string): number | null {
  const lower = text.toLowerCase().trim();

  // Handle "50 triệu", "50tr", "50 triệu vnđ", etc.
  const millionMatch = lower.match(/^(\d+(?:[.,]\d+)?)\s*(?:tr|một)?(?:triệu|tr\s*$)/);
  if (millionMatch) {
    const val = parseFloat(millionMatch[1].replace(',', '.'));
    return Math.round(val * 1_000_000);
  }

  // Handle "10000000" (plain number)
  if (/^\d{6,}$/.test(lower)) {
    const n = parseInt(lower);
    if (n >= 1_000_000) return n;
  }

  // Handle "100 triệu vnđ", "250tr VNĐ"
  const withUnit = lower.match(/^(\d+(?:[.,]\d+)?)\s*(?:tr|triệu)\s*(?:vnđ|vnd)?$/);
  if (withUnit) {
    const val = parseFloat(withUnit[1].replace(',', '.'));
    return Math.round(val * 1_000_000);
  }

  return null;
}

// Parse risk profile from text.
function parseRiskProfile(text: string): 'conservative' | 'balanced' | 'growth' | null {
  const lower = text.toLowerCase();
  if (lower.includes('an toàn') || lower.includes('bảo toàn') || lower.includes('conservative')) return 'conservative';
  if (lower.includes('cân bằng') || lower.includes('balanced')) return 'balanced';
  if (lower.includes('tăng trưởng') || lower.includes('growth')) return 'growth';
  return null;
}

// Phase guard: returns true if the action is valid for the current phase.
function isValidPhase(phase: ReplayState['phase'], action: Action): boolean {
  switch (action.type) {
    case 'HYDRATE':
    case 'RESET':
    case 'UPDATE_PROGRESS':
      return true;
    case 'SET_CAPITAL':
      return phase === 'onboarding-capital';
    case 'SET_RISK_PROFILE':
      return phase === 'onboarding-risk';
    case 'ACCEPT_PROPOSAL':
    case 'REJECT_PROPOSAL':
      return phase === 'onboarding-review';
    case 'START_REPLAY':
    case 'AUTO_START':
      return phase === 'replay-running' || phase === 'onboarding-review';
    case 'RESOLVE_DECISION':
      return phase === 'replay-running';
    case 'COMPLETE_REPLAY':
      return phase === 'replay-running';
    case 'SETUP_CHAT_INPUT':
      // Valid in any onboarding phase
      return phase.startsWith('onboarding');
    case 'RECEIVE_AI_REVISION':
    case 'REVISION_ERROR':
      return phase === 'replay-running';
    default:
      return false;
  }
}

function reducer(state: ReplayState, action: Action): ReplayState {
  // Phase guard: reject invalid actions silently by returning state unchanged
  if (!isValidPhase(state.phase, action)) {
    return state;
  }

  switch (action.type) {
    case 'HYDRATE':
      return action.state;

    case 'RESET':
      return createInitialState(state.config);

    // ── Onboarding: Capital ──────────────────────────────────────────────
    case 'SET_CAPITAL': {
      const { capital } = action;
      const userMsgObj = userMsg(`Tôi muốn đầu tư ${capital.toLocaleString('vi-VN')} VNĐ`);
      return {
        ...state,
        initialCapital: capital,
        cashBalance: capital,
        phase: 'onboarding-risk',
        messages: [
          ...state.messages,
          userMsgObj,
          assistantMsg(
            'Vốn đã được ghi nhận. Bạn muốn ưu tiên điều gì?',
            [
              { label: 'An toàn / Bảo toàn vốn', value: 'conservative' },
              { label: 'Cân bằng rủi ro & tăng trưởng', value: 'balanced' },
              { label: 'Tăng trưởng mạnh', value: 'growth' },
            ]
          ),
        ],
      };
    }

    // ── Onboarding: Risk Profile ─────────────────────────────────────────
    case 'SET_RISK_PROFILE': {
      const { profile } = action;
      const label = profile === 'conservative' ? 'An toàn' : profile === 'balanced' ? 'Cân bằng' : 'Tăng trưởng';
      const proposal = buildPortfolio({ riskProfile: profile, capital: state.initialCapital });
      const holdingsList = proposal.holdings.map((h, i) => `${i + 1}. **${h.symbol}** (${h.allocation}%)`).join('\n');

      return {
        ...state,
        config: { ...state.config, riskProfile: profile },
        phase: 'onboarding-review',
        proposal,
        messages: [
          ...state.messages,
          userMsg(`Hồ sơ rủi ro: ${label}`),
          assistantMsg(
            `Dựa trên hồ sơ **${label}**, đây là danh mục:\n\n${holdingsList}\n\nChấp nhận?`,
            [
              { label: 'Chấp nhận', value: 'accept' },
              { label: 'Thay đổi', value: 'modify' },
            ]
          ),
        ],
      };
    }

    // ── Onboarding: Review ───────────────────────────────────────────────
    case 'ACCEPT_PROPOSAL': {
      if (!state.proposal) return state;
      const symbols = state.proposal.holdings.map(h => h.symbol);
      const prices = generateReplayHistory(symbols, state.config.seed, state.config.startDate, state.config.endDate);
      const tradingDays = getTradingDays(state.config.startDate, state.config.endDate);

      const holdings: ReplayState['holdings'] = {};
      const currentPrice: Record<string, number> = {};

      for (const h of state.proposal.holdings) {
        const price = prices[h.symbol]?.[0]?.price || ((getStockBySymbol(h.symbol)?.price || 100) * 25000);
        const quantity = Math.floor((state.initialCapital * (h.allocation / 100)) / price);
        currentPrice[h.symbol] = price;
        holdings[h.symbol] = { symbol: h.symbol, name: h.name, quantity, avgPrice: price, gridLevels: [], realizedPnL: 0 };
      }

      const decisions = generateDecisionCheckpoints(state.config, holdings, prices, tradingDays);

      return {
        ...state,
        phase: 'replay-running',
        holdings,
        currentPrice,
        prices,
        decisions,
        currentDecisionIndex: 0,
        messages: [
          ...state.messages,
          userMsg('Tôi chấp nhận'),
          assistantMsg('Danh mục đã khởi tạo. Nhấn **"Bắt đầu"** để xem quyết định đầu tiên.'),
        ],
      };
    }

    case 'REJECT_PROPOSAL':
      return {
        ...state,
        phase: 'onboarding-risk',
        proposal: null,
        messages: [
          ...state.messages,
          userMsg('Tôi muốn thay đổi'),
          assistantMsg(
            'Bạn muốn thay đổi gì?',
            [
              { label: 'An toàn', value: 'conservative' },
              { label: 'Cân bằng', value: 'balanced' },
              { label: 'Tăng trưởng', value: 'growth' },
            ]
          ),
        ],
      };

    // ── Replay: Start ────────────────────────────────────────────────────
    case 'START_REPLAY': {
      if (state.decisions.length === 0) {
        // Build from existing holdings (edge case: was reset mid-replay)
        const symbols = state.proposal?.holdings.map(h => h.symbol) || Object.keys(state.holdings);
        const prices = generateReplayHistory(symbols, state.config.seed, state.config.startDate, state.config.endDate);
        const tradingDays = getTradingDays(state.config.startDate, state.config.endDate);

        const holdings: ReplayState['holdings'] = {};
        const currentPrice: Record<string, number> = {};

        for (const h of Object.values(state.holdings)) {
          const price = prices[h.symbol]?.[0]?.price || h.avgPrice;
          currentPrice[h.symbol] = price;
          holdings[h.symbol] = h;
        }

        const decisions = generateDecisionCheckpoints(state.config, holdings, prices, tradingDays);
        const firstDecision = decisions[0];

        return {
          ...state,
          phase: 'replay-running',
          holdings,
          currentPrice,
          prices,
          decisions,
          currentDecisionIndex: 0,
          currentDate: firstDecision?.date || state.config.startDate,
          currentDay: firstDecision?.dayNumber || 1,
          messages: [
            ...state.messages,
            assistantMsg(
              firstDecision
                ? `**Quyết định 1/5**\n\n${firstDecision.title}\n\n${firstDecision.trigger}`
                : 'Mô phỏng bắt đầu.'
            ),
          ],
        };
      }

      const firstDecision = state.decisions[0];
      return {
        ...state,
        phase: 'replay-running',
        currentDate: firstDecision?.date || state.config.startDate,
        currentDay: firstDecision?.dayNumber || 1,
      };
    }

    case 'AUTO_START':
      return state;

    // ── Replay: Progress ────────────────────────────────────────────────
    case 'UPDATE_PROGRESS': {
      const dayFloat = action.dayFloat;
      const dayIndex = Math.min(Math.floor(dayFloat), 364);
      const fraction = dayFloat - dayIndex;
      const tradingDays = getTradingDays(state.config.startDate, state.config.endDate);
      const currentDate = tradingDays[Math.min(dayIndex, tradingDays.length - 1)] || state.config.startDate;

      const newPrices: Record<string, number> = {};
      for (const symbol of Object.keys(state.holdings)) {
        const priceData = state.prices[symbol];
        if (priceData && priceData.length > 0) {
          const idx = Math.min(dayIndex, priceData.length - 1);
          const nextIdx = Math.min(idx + 1, priceData.length - 1);
          const base = priceData[idx]?.price || 0;
          const next = priceData[nextIdx]?.price || base;
          newPrices[symbol] = base + (next - base) * fraction;
        } else {
          newPrices[symbol] = state.currentPrice[symbol] || 0;
        }
      }

      return {
        ...state,
        currentDay: Math.floor(dayFloat) + 1,
        currentDate,
        currentPrice: newPrices,
      };
    }

    // ── Replay: Resolve Decision ─────────────────────────────────────────
    case 'RESOLVE_DECISION': {
      const newState = resolveDecision({ decisionIndex: action.decisionIndex, choiceId: action.choiceId, state });
      const isLast = action.decisionIndex === state.decisions.length - 1;

      if (isLast) {
        return {
          ...newState,
          phase: 'replay-complete',
          isComplete: true,
          metrics: calculateFinalMetrics(newState),
          messages: [
            ...newState.messages,
            assistantMsg('**Replay hoàn thành!**'),
          ],
        };
      }

      const nextIdx = action.decisionIndex + 1;
      const nextDecision = newState.decisions[nextIdx];
      const nextMessage = nextDecision
        ? `**Quyết định ${nextIdx + 1}/5**\n\n${nextDecision.title}\n\n${nextDecision.trigger}`
        : 'Tiếp tục...';

      return {
        ...newState,
        currentDate: nextDecision?.date || state.currentDate,
        currentDay: nextDecision?.dayNumber || state.currentDay,
        currentDecisionIndex: nextIdx,
        messages: [...newState.messages, assistantMsg(nextMessage)],
      };
    }

    case 'COMPLETE_REPLAY':
      return {
        ...state,
        phase: 'replay-complete',
        isComplete: true,
        metrics: calculateFinalMetrics(state),
        messages: [
          ...state.messages,
          assistantMsg('**Replay hoàn thành!**'),
        ],
      };

    // ── Setup: Free-text chat ─────────────────────────────────────────────
    // Routes to the appropriate setup step based on current phase.
    case 'SETUP_CHAT_INPUT': {
      const { content } = action;
      const userMsgObj = userMsg(content);
      const trimmed = content.trim();

      // ── Phase: onboarding-capital ──
      if (state.phase === 'onboarding-capital') {
        const capital = parseCapitalFromText(trimmed);
        if (capital !== null) {
          return reducer(
            { ...state, messages: [...state.messages, userMsgObj] },
            { type: 'SET_CAPITAL', capital }
          );
        }
        // Unrecognised → ask to pick a preset
        return {
          ...state,
          messages: [
            ...state.messages,
            userMsgObj,
            assistantMsg(
              'Mình không hiểu số tiền bạn nhập. Bạn có thể chọn một trong các mức dưới đây nhé:',
              [
                { label: '25 triệu VNĐ', value: '25000000' },
                { label: '50 triệu VNĐ', value: '50000000' },
                { label: '100 triệu VNĐ', value: '100000000' },
                { label: '250 triệu VNĐ', value: '250000000' },
              ]
            ),
          ],
        };
      }

      // ── Phase: onboarding-risk ──
      if (state.phase === 'onboarding-risk') {
        const profile = parseRiskProfile(trimmed);
        if (profile !== null) {
          return reducer(
            { ...state, messages: [...state.messages, userMsgObj] },
            { type: 'SET_RISK_PROFILE', profile }
          );
        }
        // Unrecognised → show presets
        return {
          ...state,
          messages: [
            ...state.messages,
            userMsgObj,
            assistantMsg(
              'Mình không hiểu lựa chọn của bạn. Bạn muốn ưu tiên điều gì?',
              [
                { label: 'An toàn / Bảo toàn vốn', value: 'conservative' },
                { label: 'Cân bằng rủi ro & tăng trưởng', value: 'balanced' },
                { label: 'Tăng trưởng mạnh', value: 'growth' },
              ]
            ),
          ],
        };
      }

      // ── Phase: onboarding-review ──
      if (state.phase === 'onboarding-review') {
        const lower = trimmed.toLowerCase();
        if (lower.includes('chấp nhận') || lower.includes('đồng ý') || lower.includes('ok') || lower.includes('accept') || lower.includes('đồng ý')) {
          return reducer(
            { ...state, messages: [...state.messages, userMsgObj] },
            { type: 'ACCEPT_PROPOSAL' }
          );
        }
        if (lower.includes('thay đổi') || lower.includes('modify') || lower.includes('bắt đầu lại') || lower.includes('đặt lại')) {
          return reducer(
            { ...state, messages: [...state.messages, userMsgObj] },
            { type: 'REJECT_PROPOSAL' }
          );
        }
        // Unrecognised → prompt with buttons
        return {
          ...state,
          messages: [
            ...state.messages,
            userMsgObj,
            assistantMsg(
              'Bạn có muốn chấp nhận danh mục này không?',
              [
                { label: 'Chấp nhận', value: 'accept' },
                { label: 'Thay đổi', value: 'modify' },
              ]
            ),
          ],
        };
      }

      // Fallback for any other phase: do nothing (never reached in practice)
      return state;
    }

    // ── Replay: AI Decision Revision ────────────────────────────────────
    case 'RECEIVE_AI_REVISION': {
      const { decisionIndex, revisedDecision, message } = action;
      const newDecisions = [...state.decisions];
      const originalDecision = newDecisions[decisionIndex];

      // Replace in-place; keep original ID so no duplicate card
      newDecisions[decisionIndex] = {
        ...revisedDecision,
        id: originalDecision.id,
        index: originalDecision.index,
        status: 'pending', // stays pending until confirmed
        revised: true,
        revisionCount: (originalDecision.revisionCount ?? 0) + 1,
      };

      return {
        ...state,
        decisions: newDecisions,
        messages: [
          ...state.messages,
          assistantMsg(message, undefined),
        ],
      };
    }

    // AI revision failed (network, invalid, etc.)
    case 'REVISION_ERROR': {
      return {
        ...state,
        messages: [
          ...state.messages,
          assistantMsg(action.message),
        ],
      };
    }

    default:
      return state;
  }
}

// ── Context ──

interface ReplayContextType {
  state: ReplayState;
  dispatch: React.ActionDispatch<[action: Action]>;
  currentDecision: DecisionCheckpoint | null;
  resolvedDecisions: DecisionCheckpoint[];
  totalDecisions: number;
  isPlaying: boolean;
  isAdvancing: boolean;
  currentProgress: number;
  currentDay: number;
  revisionLoading: boolean;
  resolveDecision: (decisionIndex: number, choiceId: string) => void;
  resetReplay: () => void;
  sendChat: (content: string) => void;
  togglePlay: () => void;
  setSpeed: (speed: number) => void;
  requestDecisionRevision: (feedback: string) => Promise<void>;
}

const ReplayContext = createContext<ReplayContextType | null>(null);

export function ReplayProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, null, () => createInitialState(createDefaultConfig()));
  const [mounted, setMounted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAdvancing, setIsAdvancing] = useState(false);
  const [revisionLoading, setRevisionLoading] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [pausedAtProgress, setPausedAtProgress] = useState<number | null>(null);

  // Animation state refs (not cause re-renders)
  const animState = useRef({
    animationId: null as number | null,
    startTime: null as number | null,
    pausedAt: null as number | null,
    advanceStartAt: null as number | null,
    advanceStartDay: 0,
    advanceTargetDay: 0,
  });
  const isPlayingRef = useRef(isPlaying);
  const stateRef = useRef(state);
  const isAdvancingRef = useRef(false);

  // Sync refs
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Simple animation loop with absolute time tracking
  useEffect(() => {
    if (state.phase !== 'replay-running') {
      if (animState.current.animationId) {
        cancelAnimationFrame(animState.current.animationId);
        animState.current.animationId = null;
      }
      return;
    }

    // Initialize timing on first start
    if (animState.current.startTime === null) {
      animState.current.startTime = performance.now();
      animState.current.pausedAt = 0;
    }

    const loop = () => {
      const now = performance.now();
      
      // Handle smooth advancing animation
      if (isAdvancingRef.current) {
        const { advanceStartAt, advanceStartDay, advanceTargetDay } = animState.current;
        if (advanceStartAt !== null) {
          const elapsed = now - advanceStartAt;
          const t = Math.min(elapsed / FAST_FORWARD_MS, 1);
          // Ease out cubic
          const eased = 1 - Math.pow(1 - t, 3);
          const currentDay = Math.round(advanceStartDay + (advanceTargetDay - advanceStartDay) * eased);
          
          // Calculate progress and update prices
          const progress = currentDay / SIMULATION_DAYS;
          const dayFloat = currentDay;
          const dayIndex = Math.min(Math.floor(dayFloat), 364);
          const fraction = dayFloat - dayIndex;
          
          const newPrices: Record<string, number> = {};
          for (const symbol of Object.keys(stateRef.current.holdings)) {
            const priceData = stateRef.current.prices[symbol];
            if (priceData && priceData.length > 0) {
              const idx = Math.min(dayIndex, priceData.length - 1);
              const nextIdx = Math.min(idx + 1, priceData.length - 1);
              const base = priceData[idx]?.price || 0;
              const next = priceData[nextIdx]?.price || base;
              newPrices[symbol] = base + (next - base) * fraction;
            } else {
              newPrices[symbol] = stateRef.current.currentPrice[symbol] || 0;
            }
          }
          
          const tradingDays = getTradingDays(stateRef.current.config.startDate, stateRef.current.config.endDate);
          const currentDate = tradingDays[Math.min(dayIndex, tradingDays.length - 1)] || stateRef.current.config.startDate;
          
          // Dispatch progress update
          dispatch({ type: 'UPDATE_PROGRESS', progress, dayFloat });
          
          // Update current day/date/price in state
          stateRef.current = {
            ...stateRef.current,
            currentDay: currentDay,
            currentDate,
            currentPrice: newPrices,
          };
          
          if (t >= 1) {
            // Done advancing
            isAdvancingRef.current = false;
            setIsAdvancing(false);
            setIsPlaying(true);
            animState.current.startTime = performance.now();
            animState.current.pausedAt = (advanceTargetDay / SIMULATION_DAYS) * SIMULATION_DURATION_MS;
            setCurrentProgress(advanceTargetDay / SIMULATION_DAYS);
          } else {
            animState.current.animationId = requestAnimationFrame(loop);
          }
          return;
        }
      }
      
      if (!isPlayingRef.current) return;

      // Calculate absolute elapsed time
      const absoluteElapsed = animState.current.pausedAt! + (now - animState.current.startTime!);
      const progress = Math.min(absoluteElapsed / SIMULATION_DURATION_MS, 1);
      const dayFloat = progress * SIMULATION_DAYS;
      const dayIndex = Math.floor(dayFloat);

      // Check decision points
      const nextPending = stateRef.current.decisions.find((d, i) => i >= stateRef.current.currentDecisionIndex && d.status === 'pending');
      const nextDay = nextPending?.dayNumber;

      if (nextDay !== undefined && dayIndex >= nextDay - 1) {
        // Pause at decision - save absolute elapsed time
        animState.current.pausedAt = absoluteElapsed;
        setPausedAtProgress(progress);
        setCurrentProgress(progress);
        setIsPlaying(false);
        animState.current.animationId = null;
        return;
      }

      if (progress >= 1) {
        setIsPlaying(false);
        setCurrentProgress(1);
        dispatch({ type: 'COMPLETE_REPLAY' });
        animState.current.animationId = null;
        return;
      }

      setCurrentProgress(progress);
      dispatch({ type: 'UPDATE_PROGRESS', progress, dayFloat });
      animState.current.animationId = requestAnimationFrame(loop);
    };

    animState.current.animationId = requestAnimationFrame(loop);

    return () => {
      if (animState.current.animationId) {
        cancelAnimationFrame(animState.current.animationId);
        animState.current.animationId = null;
      }
    };
  }, [isPlaying, isAdvancing, state.phase, speed, dispatch]);

  // Load state
  useEffect(() => {
    const saved = loadReplayState();
    const urlParams = new URLSearchParams(window.location.search);
    const seed = (urlParams.get('seed') as 'golden' | 'resilience') || 'golden';

    if (saved && (saved.phase === 'replay-running' || saved.phase === 'replay-complete')) {
      const config = createDefaultConfig(seed);
      const restored: ReplayState = {
        ...createInitialState(config),
        ...(saved as unknown as Partial<ReplayState>),
        config: { ...config, capital: saved.config?.capital ?? 0 },
      };
      dispatch({ type: 'HYDRATE', state: restored, pausedAtProgress: saved.pausedAtProgress });
      if (saved.pausedAtProgress !== null) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setCurrentProgress(saved.pausedAtProgress);
        setPausedAtProgress(saved.pausedAtProgress);
      }
    }
    setMounted(true);
  }, []);

  // Persist state
  useEffect(() => {
    if (!mounted) return;
    const persistable: PersistedState = {
      phase: state.phase,
      config: state.config,
      initialCapital: state.initialCapital,
      cashBalance: state.cashBalance,
      holdings: state.holdings,
      proposal: state.proposal,
      currentDate: state.currentDate,
      currentDay: state.currentDay,
      prices: state.prices,
      decisions: state.decisions,
      currentDecisionIndex: state.currentDecisionIndex,
      realizedPnL: state.realizedPnL,
      messages: state.messages,
      isComplete: state.isComplete,
      pausedAtProgress,
    };
    saveReplayState(persistable);
  }, [state, mounted, pausedAtProgress]);

  // Computed
  const currentDecision = state.decisions[state.currentDecisionIndex] || null;
  const resolvedDecisions = state.decisions.filter(d => d.status === 'resolved');
  const totalDecisions = state.decisions.length;

  // Actions
  const resolveDecision = useCallback((decisionIndex: number, choiceId: string) => {
    // Get the current state before resolving
    const currentState = stateRef.current;
    const isLast = decisionIndex === currentState.decisions.length - 1;
    
    // Dispatch the resolution
    dispatch({ type: 'RESOLVE_DECISION', decisionIndex, choiceId });
    
    if (isLast) {
      // Last decision - directly complete, no need to advance
      // The RESOLVE_DECISION action already sets phase to replay-complete
      setIsPlaying(false);
    } else {
      // Find next decision day and advance
      const nextDecision = currentState.decisions[decisionIndex + 1];
      const nextDay = nextDecision?.dayNumber || currentState.currentDay + 30;
      
      // Fast-forward to next decision
      setIsAdvancing(true);
      isAdvancingRef.current = true;
      animState.current.advanceStartAt = performance.now();
      animState.current.advanceStartDay = currentState.currentDay;
      animState.current.advanceTargetDay = nextDay;
    }
  }, [dispatch]);

  const resetReplay = useCallback(() => {
    if (animState.current.animationId) {
      cancelAnimationFrame(animState.current.animationId);
    }
    animState.current = { animationId: null, startTime: null, pausedAt: null, advanceStartAt: null, advanceStartDay: 0, advanceTargetDay: 0 };
    setIsPlaying(false);
    setIsAdvancing(false);
    setCurrentProgress(0);
    setPausedAtProgress(null);
    isAdvancingRef.current = false;
    clearReplayState();
    dispatch({ type: 'RESET' });
  }, []);

  const sendChat = useCallback((content: string) => {
    // Route by phase
    if (state.phase.startsWith('onboarding')) {
      dispatch({ type: 'SETUP_CHAT_INPUT', content });
    }
    // In replay phases, chat input is handled by requestDecisionRevision directly
  }, [state.phase, dispatch]);

  const togglePlay = useCallback(() => {
    if (state.phase !== 'replay-running') return;
    setIsPlaying(prev => {
      if (!prev) {
        // Resume: reset startTime to now, keep pausedAt for accumulated time
        animState.current.startTime = performance.now();
        // pausedAt stays as is (it's already the accumulated time)
      }
      return !prev;
    });
  }, [state.phase]);

  const setSpeedFn = useCallback((newSpeed: number) => {
    setSpeed(newSpeed);
  }, []);

  const requestDecisionRevision = useCallback(async (feedback: string) => {
    const currentState = stateRef.current;
    const currentDecision = currentState.decisions[currentState.currentDecisionIndex];

    // Only allow revision of pending decisions
    if (!currentDecision || currentDecision.status !== 'pending') {
      return;
    }

    setRevisionLoading(true);

    try {
      const response = await fetch('/api/replay/revise-decision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feedback,
          decision: currentDecision,
          portfolio: {
            cashBalance: currentState.cashBalance,
            holdings: currentState.holdings,
            initialCapital: currentState.initialCapital,
            riskProfile: currentState.config.riskProfile,
          },
          currentPrices: currentState.currentPrice,
        }),
      });

      if (!response.ok) {
        dispatch({ type: 'REVISION_ERROR', message: 'Máy chủ không phản hồi. Vui lòng thử lại.' });
        return;
      }

      const result = await response.json();

      if (result.valid && result.revisedDecision) {
        dispatch({
          type: 'RECEIVE_AI_REVISION',
          decisionIndex: currentState.currentDecisionIndex,
          revisedDecision: result.revisedDecision,
          message: result.message,
        });
      } else {
        dispatch({
          type: 'REVISION_ERROR',
          message: result.message || 'Không thể điều chỉnh quyết định. Vui lòng thử lại.',
        });
      }
    } catch (error) {
      console.error('Error requesting decision revision:', error);
      dispatch({ type: 'REVISION_ERROR', message: 'Đã xảy ra lỗi khi kết nối. Vui lòng thử lại.' });
    } finally {
      setRevisionLoading(false);
    }
  }, [dispatch]);

  const ctx = useMemo<ReplayContextType>(() => ({
    state,
    dispatch,
    currentDecision,
    resolvedDecisions,
    totalDecisions,
    isPlaying: isPlaying && state.phase === 'replay-running',
    isAdvancing,
    currentProgress,
    currentDay: Math.floor(currentProgress * SIMULATION_DAYS) + 1,
    revisionLoading,
    resolveDecision,
    resetReplay,
    sendChat,
    togglePlay,
    setSpeed: setSpeedFn,
    requestDecisionRevision,
  }), [state, currentDecision, resolvedDecisions, totalDecisions, isPlaying, isAdvancing, currentProgress, revisionLoading, resolveDecision, resetReplay, sendChat, togglePlay, setSpeedFn, requestDecisionRevision]);

  return <ReplayContext.Provider value={ctx}>{children}</ReplayContext.Provider>;
}

export function useReplay() {
  const ctx = useContext(ReplayContext);
  if (!ctx) throw new Error('useReplay must be used within ReplayProvider');
  return ctx;
}
