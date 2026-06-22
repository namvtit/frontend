'use client';

import { useState, useEffect, useRef } from 'react';
import { useDemo } from '@/lib/demo';
import { generateRecommendation } from '@/lib/demo/recommendation';
import { pushToast } from '@/components/ui/toast';
import { formatCurrency } from '@/lib/utils';
import { getMockAIResponse, STOCK_PROMPTS } from '@/lib/ai/mock-agent';
import { Sparkles, Send, Bot, User, Bookmark, BookmarkCheck, ArrowRight, ShieldAlert, Check } from 'lucide-react';
import type { ChatMessage, RecommendationCard, AIProfile } from '@/lib/demo/types';

interface AIChatPanelProps {
  symbol: string;
  stockName: string;
  currentPrice: number;
  changePercent: number;
}

type FlowStep = 'idle' | 'q1_risk' | 'q2_horizon' | 'q3_allocation';

export default function AIChatPanel({ symbol, stockName, currentPrice, changePercent }: AIChatPanelProps) {
  const { state, portfolio, pushChat, clearChat, setAIProfile, executeBuy, toggleWatchlist, isInWatchlist } = useDemo();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [flowStep, setFlowStep] = useState<FlowStep>('idle');
  const [selectedRisk, setSelectedRisk] = useState<'conservative' | 'balanced' | 'growth' | null>(null);
  const [selectedHorizon, setSelectedHorizon] = useState<'short' | 'medium' | 'long' | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingRec, setPendingRec] = useState<RecommendationCard | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.chatHistory, loading]);

  const handleSendMessage = async (msg: string) => {
    if (!msg.trim()) return;

    // Push User message
    const userMsg: ChatMessage = {
      id: `chat_${Date.now()}`,
      role: 'user',
      content: msg,
      timestamp: new Date().toISOString(),
    };
    pushChat(userMsg);
    setInput('');

    // Check if user is asking for stock advice/recommendation
    const lowerMsg = msg.toLowerCase();
    const isAdviceQuery = /nên|phù hợp|mua|bán|should|buy|sell|advice|khuyến nghị|làm gì|đầu tư/i.test(lowerMsg);

    if (isAdviceQuery && flowStep === 'idle') {
      setLoading(true);
      // Wait a moment for premium AI feel
      await new Promise((resolve) => setTimeout(resolve, 800));
      setLoading(false);

      setFlowStep('q1_risk');
      const q1Msg: ChatMessage = {
        id: `chat_${Date.now() + 1}`,
        role: 'assistant',
        content: `Chào bạn! Tôi có thể giúp phân tích mức độ phù hợp của cổ phiếu ${symbol} đối với bạn. Để đưa ra khuyến nghị phân bổ chính xác nhất, trước tiên hãy chọn khẩu vị rủi ro ưa thích của bạn:`,
        chips: [
          { label: 'Thận trọng (Conservative)', value: 'conservative' },
          { label: 'Cân bằng (Balanced)', value: 'balanced' },
          { label: 'Tăng trưởng (Growth)', value: 'growth' },
        ],
        timestamp: new Date().toISOString(),
      };
      pushChat(q1Msg);
    } else {
      // General QA Flow
      setLoading(true);
      try {
        const response = await getMockAIResponse(msg, symbol);
        const aiMsg: ChatMessage = {
          id: `chat_${Date.now() + 1}`,
          role: 'assistant',
          content: response.message,
          timestamp: new Date().toISOString(),
        };
        
        // Convert mock agent cards to chat recommendation if needed or show text
        if (response.cards && response.cards.length > 0) {
          aiMsg.content += '\n\n' + response.cards.map(c => `**${c.title}**: ${c.content}`).join('\n\n');
        }

        pushChat(aiMsg);
      } catch (err) {
        pushToast({
          title: 'Lỗi kết nối AI',
          message: 'Không thể kết nối với dịch vụ trợ lý ảo lúc này.',
          type: 'alert',
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const handleChipClick = async (step: FlowStep, value: string, label: string) => {
    // 1. Push user's choice as a user message
    const userChoiceMsg: ChatMessage = {
      id: `chat_${Date.now()}`,
      role: 'user',
      content: label,
      timestamp: new Date().toISOString(),
    };
    pushChat(userChoiceMsg);
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    setLoading(false);

    if (step === 'q1_risk') {
      const risk = value as 'conservative' | 'balanced' | 'growth';
      setSelectedRisk(risk);
      setAIProfile({ riskTolerance: risk });
      setFlowStep('q2_horizon');

      const q2Msg: ChatMessage = {
        id: `chat_${Date.now() + 1}`,
        role: 'assistant',
        content: `Tuyệt vời. Bạn dự định nắm giữ cổ phiếu ${symbol} trong khoảng thời gian bao lâu?`,
        chips: [
          { label: 'Ngắn hạn (< 3 tháng)', value: 'short' },
          { label: 'Trung hạn (3 - 12 tháng)', value: 'medium' },
          { label: 'Dài hạn (> 1 năm)', value: 'long' },
        ],
        timestamp: new Date().toISOString(),
      };
      pushChat(q2Msg);
    } 
    else if (step === 'q2_horizon') {
      const horizon = value as 'short' | 'medium' | 'long';
      setSelectedHorizon(horizon);
      setAIProfile({ investmentHorizon: horizon });
      setFlowStep('q3_allocation');

      const q3Msg: ChatMessage = {
        id: `chat_${Date.now() + 1}`,
        role: 'assistant',
        content: `Cuối cùng, bạn muốn phân bổ tối đa bao nhiêu phần trăm tổng tài sản danh mục cho cơ hội này?`,
        chips: [
          { label: '5% danh mục', value: '5' },
          { label: '10% danh mục', value: '10' },
          { label: '15% danh mục', value: '15' },
        ],
        timestamp: new Date().toISOString(),
      };
      pushChat(q3Msg);
    } 
    else if (step === 'q3_allocation') {
      const alloc = parseInt(value) as 5 | 10 | 15;
      setAIProfile({ allocationTarget: alloc });
      setFlowStep('idle');

      // Generate recommendation
      const rec = generateRecommendation({
        symbol,
        price: currentPrice,
        riskTolerance: selectedRisk || 'balanced',
        investmentHorizon: selectedHorizon || 'medium',
        allocationTarget: alloc,
        cashBalance: state.cashBalance,
        totalAccountValue: portfolio.totalAccountValue,
        currentHolding: state.holdings[symbol],
        changePercent: changePercent,
      });

      const recMsg: ChatMessage = {
        id: `chat_${Date.now() + 1}`,
        role: 'assistant',
        content: `Phân tích hoàn tất! Dưới đây là gợi ý chiến lược đầu tư cho mã ${symbol} của bạn:`,
        recommendation: rec,
        timestamp: new Date().toISOString(),
      };
      pushChat(recMsg);
    }
  };

  const handleOpenConfirmModal = (rec: RecommendationCard) => {
    setPendingRec(rec);
    setShowConfirmModal(true);
  };

  const handleConfirmTrade = () => {
    if (!pendingRec) return;
    const { suggestedQty, price, symbol: recSym } = pendingRec;
    const gross = suggestedQty * price;
    const fee = gross * 0.0015;
    const total = gross + fee;

    const success = executeBuy(recSym, stockName, suggestedQty, price);

    if (success) {
      pushToast({
        title: `Đặt lệnh thành công`,
        message: `Đã mua ${suggestedQty} cổ phiếu ${recSym} @ $${price.toFixed(2)}`,
        type: 'success',
        icon: '✅',
      });

      // Calculate current allocation percent after trade
      const newHoldingQty = (state.holdings[recSym]?.quantity ?? 0) + suggestedQty;
      const newHoldingVal = newHoldingQty * price;
      const newAllocPercent = (newHoldingVal / portfolio.totalAccountValue) * 100;

      const successMsg: ChatMessage = {
        id: `chat_${Date.now() + 2}`,
        role: 'assistant',
        content: `Lệnh đã được ghi nhận thành công! Vị thế **${recSym}** của bạn hiện có tổng khối lượng là **${newHoldingQty} CP**, chiếm khoảng **${newAllocPercent.toFixed(1)}%** tổng tài sản danh mục và vẫn nằm trong giới hạn phân bổ **${pendingRec.targetAllocation}%** mà bạn đã thiết lập.`,
        timestamp: new Date().toISOString(),
      };
      pushChat(successMsg);
    } else {
      pushToast({
        title: 'Đặt lệnh thất bại',
        message: 'Số dư tiền mặt khả dụng của bạn không đủ.',
        type: 'alert',
        icon: '❌',
      });
    }

    setShowConfirmModal(false);
    setPendingRec(null);
  };

  const isLastMessage = (index: number) => index === state.chatHistory.length - 1;

  return (
    <div className="flex flex-col h-[550px] rounded-lg border border-border bg-card overflow-hidden">
      {/* Chat header */}
      <div className="flex items-center justify-between border-b border-border bg-muted/30 px-4 py-3 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white">
            <Sparkles className="h-4.5 w-4.5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">Trợ lý Phân tích AI</h3>
            <p className="text-[10px] text-muted-foreground">Tư vấn danh mục & đặt lệnh</p>
          </div>
        </div>
        <button
          onClick={clearChat}
          className="text-xs text-muted-foreground hover:text-foreground hover:underline transition-colors px-2 py-1"
        >
          Xóa lịch sử
        </button>
      </div>

      {/* Messages body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {state.chatHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary animate-bounce">
              <Bot className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Trợ lý AI đang sẵn sàng</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-[280px]">
                Hãy hỏi tôi về cách phân bổ hoặc quyết định mua bán cho cổ phiếu {symbol}.
              </p>
            </div>
            
            <div className="flex flex-col gap-2 w-full max-w-xs pt-4">
              <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider text-left pl-1">Câu hỏi gợi ý:</p>
              <button
                onClick={() => handleSendMessage(`Tôi nên làm gì với mã cổ phiếu ${symbol}?`)}
                className="text-left text-xs bg-muted/50 hover:bg-secondary p-3 rounded-lg border border-border text-foreground hover:border-primary/30 transition-all flex items-center justify-between group"
              >
                <span>Tôi nên làm gì với mã này?</span>
                <ArrowRight className="h-3 w-3 text-muted-foreground group-hover:text-primary transition-colors" />
              </button>
              <button
                onClick={() => handleSendMessage(`Cổ phiếu ${symbol} có phù hợp với tôi không?`)}
                className="text-left text-xs bg-muted/50 hover:bg-secondary p-3 rounded-lg border border-border text-foreground hover:border-primary/30 transition-all flex items-center justify-between group"
              >
                <span>Cổ phiếu này có phù hợp không?</span>
                <ArrowRight className="h-3 w-3 text-muted-foreground group-hover:text-primary transition-colors" />
              </button>
              <button
                onClick={() => handleSendMessage(`Hãy phân tích rủi ro của cổ phiếu ${symbol}.`)}
                className="text-left text-xs bg-muted/50 hover:bg-secondary p-3 rounded-lg border border-border text-foreground hover:border-primary/30 transition-all flex items-center justify-between group"
              >
                <span>Phân tích rủi ro của mã này</span>
                <ArrowRight className="h-3 w-3 text-muted-foreground group-hover:text-primary transition-colors" />
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {state.chatHistory.map((m, idx) => (
              <div key={m.id || idx} className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {m.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <Bot className="h-4 w-4" />
                  </div>
                )}
                
                <div className="space-y-2 max-w-[85%]">
                  <div className={`p-3 rounded-2xl text-sm leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-indigo-500 text-white rounded-tr-sm'
                      : 'bg-muted/80 border border-border text-foreground rounded-tl-sm'
                  }`}>
                    {m.content}
                  </div>

                  {/* Render recommendation card if available */}
                  {m.recommendation && (
                    <div className="card bg-card border border-purple-500/40 rounded-xl overflow-hidden shadow-lg max-w-sm">
                      {/* Header */}
                      <div className="flex items-center justify-between border-b border-border bg-purple-500/10 px-3 py-2 shrink-0">
                        <span className="font-bold text-xs text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5" />
                          Gợi Ý Giao Dịch AI
                        </span>
                        <span className="badge badge-ai text-[9px] font-semibold uppercase">AI Recommended</span>
                      </div>

                      {/* Content */}
                      <div className="p-4 space-y-4">
                        <div className="grid grid-cols-2 gap-3 bg-muted/30 p-3 rounded-lg border border-border">
                          <div>
                            <span className="text-[10px] text-muted-foreground block uppercase">Hồ sơ Rủi ro</span>
                            <span className="font-bold text-xs capitalize text-foreground">
                              {m.recommendation.riskProfile === 'conservative' ? 'Thận trọng' : m.recommendation.riskProfile === 'balanced' ? 'Cân bằng' : 'Tăng trưởng'}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-muted-foreground block uppercase">Thời gian nắm giữ</span>
                            <span className="font-bold text-xs capitalize text-foreground">
                              {m.recommendation.horizon === 'short' ? 'Ngắn hạn' : m.recommendation.horizon === 'medium' ? 'Trung hạn' : 'Dài hạn'}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-muted-foreground block uppercase">Phân bổ Mục tiêu</span>
                            <span className="font-bold text-xs text-foreground">{m.recommendation.targetAllocation}%</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-muted-foreground block uppercase">Giá hiện tại</span>
                            <span className="font-mono font-bold text-xs text-foreground">${m.recommendation.price.toFixed(2)}</span>
                          </div>
                        </div>

                        <div className="space-y-1.5 text-xs text-foreground">
                          <p className="font-semibold text-primary">Chi tiết khuyến nghị:</p>
                          <p className="text-muted-foreground bg-muted/10 p-2.5 rounded border border-border/50 italic leading-relaxed">
                            {m.recommendation.reasoning}
                          </p>
                        </div>

                        {m.recommendation.suggestedQty > 0 ? (
                          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-3 space-y-2">
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground">Khối lượng mua gợi ý:</span>
                              <span className="font-bold text-emerald-600 dark:text-emerald-400">{m.recommendation.suggestedQty} CP</span>
                            </div>
                            <div className="flex justify-between text-xs border-t border-border/40 pt-1.5 mt-1.5">
                              <span className="text-muted-foreground">Tổng chi phí ước tính:</span>
                              <span className="font-bold text-foreground">{formatCurrency(m.recommendation.estimatedCost)}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3">
                            <p className="text-xs text-amber-600 dark:text-amber-400 flex items-start gap-1.5 leading-relaxed">
                              <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
                              <span>Cổ phiếu hiện tại biến động mạnh hoặc vị thế của bạn đã vượt quá giới hạn phân bổ. Trợ lý AI khuyên bạn nên tiếp tục theo dõi thêm.</span>
                            </p>
                          </div>
                        )}

                        <div className="text-[9px] text-muted-foreground/60 leading-tight">
                          * Cảnh báo rủi ro: {m.recommendation.riskWarning}
                        </div>

                        {/* Recommendation actions */}
                        <div className="flex flex-col sm:flex-row gap-2 pt-2">
                          {m.recommendation.suggestedQty > 0 && (
                            <button
                              onClick={() => handleOpenConfirmModal(m.recommendation!)}
                              className="flex-1 btn btn-primary text-xs py-2 bg-gradient-to-r from-purple-500 to-indigo-600 border-0"
                            >
                              Mua ngay
                            </button>
                          )}
                          <button
                            onClick={() => toggleWatchlist(symbol)}
                            className="flex-1 btn btn-secondary text-xs py-2 flex items-center justify-center gap-1.5"
                          >
                            {isInWatchlist(symbol) ? (
                              <>
                                <BookmarkCheck className="h-3.5 w-3.5 text-emerald-500" />
                                <span>Đã lưu watchlist</span>
                              </>
                            ) : (
                              <>
                                <Bookmark className="h-3.5 w-3.5" />
                                <span>Lưu Watchlist</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Render interactive question chips */}
                  {m.role === 'assistant' && m.chips && isLastMessage(idx) && (
                    <div className="flex flex-col gap-1.5 pt-1.5 w-full">
                      {m.chips.map((chip) => (
                        <button
                          key={chip.value}
                          onClick={() => handleChipClick(flowStep, chip.value, chip.label)}
                          className="w-full text-left text-xs bg-purple-500/10 hover:bg-purple-500/20 p-2.5 rounded-lg border border-purple-500/25 text-purple-700 dark:text-purple-300 font-medium transition-all hover:-translate-y-0.5 hover:shadow-sm"
                        >
                          {chip.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                
                {m.role === 'user' && (
                  <div className="w-8 h-8 rounded-lg bg-indigo-500 text-white flex items-center justify-center shrink-0">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex gap-3 justify-start items-center">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="bg-muted/80 border border-border text-foreground px-4 py-2.5 rounded-2xl rounded-tl-sm text-sm">
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input bar */}
      <div className="p-3 border-t border-border bg-muted/10 shrink-0">
        <div className="flex gap-2">
          <input
            type="text"
            className="input flex-1 bg-background"
            placeholder={`Hỏi trợ lý AI về ${symbol}...`}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSendMessage(input);
            }}
            disabled={flowStep !== 'idle' || loading}
          />
          <button
            onClick={() => handleSendMessage(input)}
            className="btn btn-primary px-4"
            disabled={flowStep !== 'idle' || loading || !input.trim()}
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
        {flowStep !== 'idle' && (
          <p className="text-[10px] text-purple-600 dark:text-purple-400 mt-1.5 text-center font-medium animate-pulse">
            Vui lòng trả lời câu hỏi của Trợ lý AI ở phía trên để tiếp tục...
          </p>
        )}
      </div>

      {/* Inline Trade Confirmation Modal Overlay */}
      {showConfirmModal && pendingRec && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-2xl slide-up">
            <h3 className="text-base font-bold text-foreground mb-3 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-purple-500 animate-ping" />
              Đặt lệnh mua từ AI
            </h3>
            
            <p className="text-xs text-muted-foreground mb-4">
              Xác nhận thực hiện lệnh mua cổ phiếu theo khối lượng do AI gợi ý bên dưới:
            </p>

            <div className="space-y-2.5 mb-5 bg-muted/40 p-3 rounded-lg border border-border/50 font-mono text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Mã cổ phiếu:</span>
                <span className="font-bold text-foreground">{pendingRec.symbol}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Khối lượng:</span>
                <span className="font-bold text-foreground">{pendingRec.suggestedQty} CP</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Giá khớp:</span>
                <span className="font-bold text-foreground">${pendingRec.price.toFixed(2)} USD</span>
              </div>
              <div className="flex justify-between border-t border-border/40 pt-2 mt-2">
                <span className="text-muted-foreground">Giá trị giao dịch:</span>
                <span className="font-bold text-foreground">${(pendingRec.suggestedQty * pendingRec.price).toFixed(2)} USD</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Phí giao dịch (0.15%):</span>
                <span className="font-bold text-foreground">${(pendingRec.suggestedQty * pendingRec.price * 0.0015).toFixed(2)} USD</span>
              </div>
              <div className="flex justify-between border-t border-border/40 pt-2 mt-2 font-bold text-sm text-purple-600 dark:text-purple-400">
                <span>Tổng chi phí:</span>
                <span>${pendingRec.estimatedCost.toFixed(2)} USD</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setPendingRec(null);
                }}
                className="flex-1 py-2.5 rounded-lg border border-border text-foreground hover:bg-secondary text-xs font-semibold transition-colors"
              >
                Quay lại
              </button>
              <button
                onClick={handleConfirmTrade}
                className="flex-1 py-2.5 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-600 text-white text-xs font-semibold hover:opacity-95 transition-opacity"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
