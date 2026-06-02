"use client";
import { useState } from "react";
import { getMockAIResponse, SUGGESTED_PROMPTS } from "@/lib/ai/mock-agent";
import { STOCKS } from "@/lib/market/mock-data";
import { formatCurrency } from "@/lib/utils";
import PriceChangeBadge from "@/components/market/PriceChangeBadge";
import type { AIMessage } from "@/lib/ai/types";

const WATCHLIST = ["AAPL", "NVDA", "MSFT", "TSLA", "SPY"];
const RECENT = ["GOOGL", "META"];

export default function AIAgentPage() {
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async (msg: string) => {
    if (!msg.trim() || loading) return;
    const userMsg: AIMessage = { id: Date.now().toString(), role: "user", content: msg, timestamp: new Date().toISOString() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    const res = await getMockAIResponse(msg);
    const aiMsg: AIMessage = { id: (Date.now() + 1).toString(), role: "assistant", content: res.message, cards: res.cards, timestamp: new Date().toISOString() };
    setMessages((prev) => [...prev, aiMsg]);
    setLoading(false);
  };

  const watchlistStocks = STOCKS.filter((s) => WATCHLIST.includes(s.symbol));
  const recentStocks = STOCKS.filter((s) => RECENT.includes(s.symbol));

  return (
    <div className="min-h-screen bg-background fade-in">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col lg:flex-row gap-6" style={{ minHeight: "calc(100vh - 12rem)" }}>
        {/* Left sidebar */}
        <div className="w-full lg:w-64 shrink-0 space-y-4 hidden lg:block">
          <div className="card">
            <h3 className="font-semibold text-sm mb-3">Watchlist</h3>
            <div className="space-y-2">
              {watchlistStocks.map((s) => (
                <button key={s.symbol} className="flex items-center justify-between w-full text-sm hover:text-primary transition-colors"
                  onClick={() => sendMessage(`Phân tích ${s.symbol} hôm nay`)}>
                  <span className="font-mono font-medium">{s.symbol}</span>
                  <PriceChangeBadge value={s.day1} />
                </button>
              ))}
            </div>
          </div>
          <div className="card">
            <h3 className="font-semibold text-sm mb-3">Đã xem gần đây</h3>
            <div className="space-y-2">
              {recentStocks.map((s) => (
                <button key={s.symbol} className="flex items-center justify-between w-full text-sm hover:text-primary"
                  onClick={() => sendMessage(`Phân tích ${s.symbol} hôm nay`)}>
                  <span className="font-mono">{s.symbol}</span>
                  <PriceChangeBadge value={s.day1} />
                </button>
              ))}
            </div>
          </div>
          <div className="card">
            <h3 className="font-semibold text-sm mb-3">Workflows gợi ý</h3>
            <div className="space-y-2">
              {["Phân tích nhanh", "So sánh mã", "Tóm tắt tin tức", "Tạo watchlist AI"].map((w) => (
                <button key={w} className="text-sm text-muted-foreground hover:text-primary block">{w}</button>
              ))}
            </div>
          </div>
        </div>

        {/* Center chat */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2M20 14h2M15 13v2M9 13v2"/></svg>
            </div>
            <div>
              <h1 className="text-xl font-bold">AI Agent</h1>
              <p className="text-xs text-muted-foreground">Trợ lý tài chính thông minh • Phase 1 Demo</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 mb-4" style={{ maxHeight: "calc(100vh - 20rem)" }}>
            {messages.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 flex items-center justify-center mx-auto mb-4">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-ai-purple)" strokeWidth="2"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2M20 14h2M15 13v2M9 13v2"/></svg>
                </div>
                <h2 className="text-lg font-semibold mb-2">Hỏi tôi bất kỳ điều gì về thị trường</h2>
                <p className="text-sm text-muted-foreground mb-6">Phân tích cổ phiếu, so sánh mã, tóm tắt tin tức, tạo watchlist AI</p>
                <div className="flex flex-wrap justify-center gap-2 max-w-xl mx-auto">
                  {SUGGESTED_PROMPTS.map((p) => (
                    <button key={p} className="badge badge-ai text-xs cursor-pointer hover:opacity-80 transition-opacity" onClick={() => sendMessage(p)}>{p}</button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m) => (
              <div key={m.id} className={`${m.role === "user" ? "flex justify-end" : "flex justify-start"}`}>
                <div className={`max-w-[85%] ${m.role === "user" ? "bg-indigo-500 text-white rounded-2xl rounded-tr-md px-4 py-3" : ""}`}>
                  <p className="text-sm">{m.role === "user" ? m.content : m.content}</p>
                  {m.cards && (
                    <div className="grid gap-3 mt-3">
                      {m.cards.map((card, i) => (
                        <div key={i} className="card">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold text-sm">{card.title}</span>
                            {card.sentiment && (
                              <span className={`badge text-xs ${card.sentiment === "bullish" ? "badge-bull" : card.sentiment === "bearish" ? "badge-bear" : "badge-neutral"}`}>
                                {card.sentiment === "bullish" ? "Tích cực" : card.sentiment === "bearish" ? "Tiêu cực" : "Trung lập"}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground whitespace-pre-line">{card.content}</p>
                          {card.data && (
                            <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-border">
                              {Object.entries(card.data).map(([k, v]) => (
                                <div key={k} className="text-xs">
                                  <span className="text-muted-foreground">{k}</span>
                                  <div className="font-mono font-medium">{v}</div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && <div className="flex justify-start"><div className="skeleton h-24 w-3/4 rounded-2xl" /></div>}
          </div>

          {/* Input */}
          <div className="flex gap-2 mt-auto">
            <input className="input flex-1 py-3" placeholder="Hỏi về thị trường, cổ phiếu, tin tức..." value={input} onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") sendMessage(input); }} id="ai-chat-input" />
            <button className="btn btn-ai px-6" onClick={() => sendMessage(input)} disabled={loading}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m22 2-7 20-4-9-9-4z"/><path d="M22 2 11 13"/></svg>
            </button>
          </div>
        </div>

        {/* Right panel */}
        <div className="w-full lg:w-72 shrink-0 space-y-4 hidden lg:block">
          <div className="card">
            <h3 className="font-semibold text-sm mb-3">AI Output</h3>
            <p className="text-xs text-muted-foreground">Kết quả phân tích sẽ hiển thị ở đây khi bạn gửi câu hỏi.</p>
          </div>
          <div className="card">
            <h3 className="font-semibold text-sm mb-3">Nguồn tham khảo</h3>
            <div className="space-y-2">
              {["Bloomberg", "Reuters", "CNBC", "TechCrunch"].map((s) => (
                <div key={s} className="text-xs text-muted-foreground">{s}</div>
              ))}
            </div>
          </div>
          <div className="card">
            <h3 className="font-semibold text-sm mb-3">Gợi ý Watchlist</h3>
            <div className="space-y-2">
              {STOCKS.slice(0, 3).map((s) => (
                <div key={s.symbol} className="flex items-center justify-between text-xs">
                  <span className="font-mono text-primary">{s.symbol}</span>
                  <span className="font-mono">{formatCurrency(s.price)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
