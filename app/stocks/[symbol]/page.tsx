"use client";
import { use, useState } from "react";
import { getStockBySymbol, getNewsForSymbol, STOCKS, NEWS } from "@/lib/market/mock-data";
import { formatCurrency, formatLargeNumber, formatPercent, formatNumber, getChangeColor } from "@/lib/utils";
import PriceChangeBadge from "@/components/market/PriceChangeBadge";
import WatchlistStar from "@/components/market/WatchlistStar";
import TradingViewChart from "@/components/stock/TradingViewChart";
import AIPredictionChart from "@/components/stock/AIPredictionChart";
import OrderPanel from "@/components/stock/OrderPanel";
import NewsCard from "@/components/news/NewsCard";
import { getMockAIResponse, STOCK_PROMPTS } from "@/lib/ai/mock-agent";
import type { AIMessage, AICard } from "@/lib/ai/types";
import { BarChart3, Layers } from "lucide-react";

export default function StockDetailPage({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = use(params);
  const stock = getStockBySymbol(symbol.toUpperCase());
  const [tab, setTab] = useState("overview");
  const [aiMessages, setAiMessages] = useState<AIMessage[]>([]);
  const [aiInput, setAiInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  if (!stock) {
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl font-bold mb-2">Không tìm thấy mã {symbol.toUpperCase()}</h1>
        <p className="text-muted-foreground">Mã cổ phiếu không tồn tại hoặc chưa được hỗ trợ</p>
        <a href="/" className="btn btn-primary mt-6">Về trang chủ</a>
      </div>
    );
  }

  const news = getNewsForSymbol(stock.symbol);
  const tabs = ["overview", "chart", "news", "financials", "technicals", "forecast", "ai"];
  const tabLabels: Record<string, string> = { overview: "Tổng quan", chart: "Biểu đồ", news: "Tin tức", financials: "Tài chính", technicals: "Kỹ thuật", forecast: "Dự báo", ai: "AI Q&A" };

  const sendAiMessage = async (msg: string) => {
    if (!msg.trim()) return;
    const userMsg: AIMessage = { id: Date.now().toString(), role: "user", content: msg, timestamp: new Date().toISOString() };
    setAiMessages((prev) => [...prev, userMsg]);
    setAiInput("");
    setAiLoading(true);
    const res = await getMockAIResponse(msg);
    const aiMsg: AIMessage = { id: (Date.now() + 1).toString(), role: "assistant", content: res.message, cards: res.cards, timestamp: new Date().toISOString() };
    setAiMessages((prev) => [...prev, aiMsg]);
    setAiLoading(false);
  };

  return (
    <div className="min-h-screen bg-background fade-in">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* Stock header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-3xl font-bold text-foreground">{stock.name}</h1>
            <span className="badge badge-neutral text-xs">{stock.exchange}</span>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-3xl font-mono font-bold">{formatCurrency(stock.price)}</span>
            <span className={`font-mono text-lg ${getChangeColor(stock.change)}`}>
              {stock.change >= 0 ? "+" : ""}{formatNumber(stock.change)} ({formatPercent(stock.changePercent)})
            </span>
            <PriceChangeBadge value={stock.day1} />
          </div>
          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
            <span>{stock.currency}</span>
            <span>•</span>
            <span>Thị trường đang mở</span>
            <span>•</span>
            <span className="badge badge-demo">Demo data</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <WatchlistStar symbol={stock.symbol} />
          <button className="btn btn-ai text-sm" onClick={() => setTab("ai")}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/></svg>
            Phân tích AI
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="tab-list">
        {tabs.map((t) => (
          <button key={t} className={`tab-item ${tab === t ? "active" : ""} ${t === "ai" ? "!text-purple-500" : ""}`} onClick={() => setTab(t)}>
            {tabLabels[t]}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 min-w-0 space-y-6">
          {/* Chart - always visible on overview and chart tabs */}
          {(tab === "overview" || tab === "chart") && <TradingViewChart symbol={stock.symbol} />}
          {(tab === "overview" || tab === "chart") && <AIPredictionChart symbol={stock.symbol} />}

          {tab === "overview" && <OverviewTab stock={stock} news={news} />}
          {tab === "news" && <NewsTab news={news} symbol={stock.symbol} />}
          {tab === "financials" && <FinancialsTab stock={stock} />}
          {tab === "technicals" && <TechnicalsTab />}
          {tab === "forecast" && <ForecastTab stock={stock} />}
          {tab === "ai" && (
            <AITab messages={aiMessages} input={aiInput} loading={aiLoading} onInputChange={setAiInput} onSend={sendAiMessage} symbol={stock.symbol} />
          )}
        </div>

        {/* Right sidebar */}
        <div className="w-full lg:w-80 space-y-4 shrink-0">
          {(tab === "overview" || tab === "chart") && (
            <OrderPanel symbol={stock.symbol} currentPrice={stock.price} currency={stock.currency} />
          )}
          <StatsCard stock={stock} />
          <RelatedStocks current={stock.symbol} />
        </div>
      </div>
      </div>
    </div>
  );
}

function StatsCard({ stock }: { stock: import("@/lib/market/mock-data").StockQuote }) {
  const stats = [
    { label: "Vốn hóa", value: formatLargeNumber(stock.marketCap), href: "/metrics/market-cap" },
    { label: "Khối lượng", value: formatLargeNumber(stock.volume), href: "/metrics/volume" },
    { label: "P/E", value: stock.peRatio > 0 ? stock.peRatio.toFixed(1) : "—", href: "/metrics/pe-ratio" },
    { label: "EPS", value: stock.eps > 0 ? `$${stock.eps.toFixed(2)}` : "—", href: "/metrics/eps" },
    { label: "Cổ tức", value: stock.dividendYield > 0 ? `${stock.dividendYield.toFixed(2)}%` : "—", href: "/metrics/dividend-yield" },
    { label: "Beta", value: stock.beta.toFixed(2), href: "/metrics/beta" },
    { label: "52W High", value: formatCurrency(stock.high52w), href: "/metrics/52-week-high" },
    { label: "52W Low", value: formatCurrency(stock.low52w), href: "/metrics/52-week-low" },
  ];

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <div className="flex items-center gap-2 border-b border-border bg-muted/30 px-4 py-3">
        <BarChart3 className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-bold text-foreground">Thống kê chính</h3>
      </div>
      <div className="p-4 space-y-2.5">
        {stats.map((s) => (
          <a key={s.label} href={s.href} className="flex items-center justify-between text-sm hover:text-primary transition-colors">
            <span className="text-muted-foreground">{s.label}</span>
            <span className="font-mono font-medium">{s.value}</span>
          </a>
        ))}
      </div>
    </div>
  );
}

function RelatedStocks({ current }: { current: string }) {
  const related = STOCKS.filter((s) => s.symbol !== current).slice(0, 4);
  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <div className="flex items-center gap-2 border-b border-border bg-muted/30 px-4 py-3">
        <Layers className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-bold text-foreground">Mã liên quan</h3>
      </div>
      <div className="p-4 space-y-2.5">
        {related.map((s) => (
          <a key={s.symbol} href={`/stocks/${s.symbol}`} className="flex items-center justify-between text-sm hover:text-primary transition-colors">
            <div>
              <span className="font-semibold text-primary">{s.symbol}</span>
              <span className="text-xs text-muted-foreground ml-1">{s.name.split(" ")[0]}</span>
            </div>
            <PriceChangeBadge value={s.day1} />
          </a>
        ))}
      </div>
    </div>
  );
}

function OverviewTab({ stock, news }: { stock: import("@/lib/market/mock-data").StockQuote; news: import("@/lib/market/mock-data").NewsItem[] }) {
  return (
    <div className="space-y-6">
      <div className="card">
        <h3 className="font-semibold mb-2">Về {stock.name}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {stock.name} ({stock.symbol}) là công ty thuộc ngành {stock.sector}, được niêm yết trên sàn {stock.exchange}.
          Cổ phiếu hiện đang giao dịch ở mức {formatCurrency(stock.price)} với vốn hóa thị trường {formatLargeNumber(stock.marketCap)}.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "1 Ngày", value: stock.day1 }, { label: "1 Tuần", value: stock.week1 },
          { label: "1 Tháng", value: stock.month1 }, { label: "YTD", value: stock.ytd },
        ].map((p) => (
          <div key={p.label} className="card text-center">
            <span className="text-xs text-muted-foreground">{p.label}</span>
            <div className="mt-1"><PriceChangeBadge value={p.value} /></div>
          </div>
        ))}
      </div>

      {news.length > 0 && (
        <div>
          <h3 className="font-semibold mb-3">Tin tức liên quan</h3>
          <div className="grid gap-3">{news.map((n) => <NewsCard key={n.id} news={n} />)}</div>
        </div>
      )}
    </div>
  );
}

function NewsTab({ news, symbol }: { news: import("@/lib/market/mock-data").NewsItem[]; symbol: string }) {
  if (news.length === 0) return (
    <div className="card text-center py-12">
      <p className="text-lg mb-2">Chưa có tin tức</p>
      <p className="text-sm text-muted-foreground">Chưa có tin tức nào liên quan đến {symbol}</p>
    </div>
  );
  return <div className="grid gap-3">{news.map((n) => <NewsCard key={n.id} news={n} />)}</div>;
}

function FinancialsTab({ stock }: { stock: import("@/lib/market/mock-data").StockQuote }) {
  const sections = [
    { title: "Doanh thu", items: [{ label: "Revenue TTM", value: formatLargeNumber(stock.marketCap / stock.peRatio * 2) }, { label: "Revenue Growth", value: "+12.5%" }] },
    { title: "Lợi nhuận", items: [{ label: "Net Income", value: formatLargeNumber(stock.eps * 1e9) }, { label: "EPS", value: `$${stock.eps.toFixed(2)}` }, { label: "P/E", value: stock.peRatio.toFixed(1) }] },
    { title: "Biên lợi nhuận", items: [{ label: "Gross Margin", value: "45.2%" }, { label: "Operating Margin", value: "32.1%" }, { label: "Net Margin", value: "24.8%" }] },
    { title: "Bảng cân đối", items: [{ label: "Debt/Equity", value: "0.85" }, { label: "Current Ratio", value: "1.24" }, { label: "ROE", value: "28.5%" }] },
  ];

  return (
    <div className="space-y-4">
      <span className="badge badge-demo text-xs">Demo data — Dữ liệu tài chính mô phỏng</span>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {sections.map((s) => (
          <div key={s.title} className="card">
            <h4 className="font-semibold text-sm mb-3">{s.title}</h4>
            <div className="space-y-2">
              {s.items.map((item) => (
                <div key={item.label} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="font-mono font-medium">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TechnicalsTab() {
  return (
    <div className="space-y-4">
      <div className="card text-center py-4">
        <div className="text-2xl font-bold text-emerald-500 mb-1">Mua</div>
        <div className="text-sm text-muted-foreground">Tín hiệu tổng hợp</div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card"><h4 className="font-semibold text-sm mb-2">Moving Averages</h4><div className="text-emerald-500 font-semibold">Mua (8/12)</div><p className="text-xs text-muted-foreground mt-1">MA5, MA10, MA20 đều cho tín hiệu tích cực</p></div>
        <div className="card"><h4 className="font-semibold text-sm mb-2">Oscillators</h4><div className="text-amber-500 font-semibold">Trung lập (5/10)</div><p className="text-xs text-muted-foreground mt-1">RSI: 62.5, MACD: Tích cực, Stoch: Trung lập</p></div>
        <div className="card"><h4 className="font-semibold text-sm mb-2">Hỗ trợ / Kháng cự</h4><div className="text-sm font-mono">S1: $208.50 | R1: $218.30</div><p className="text-xs text-muted-foreground mt-1">Pivot: $213.40</p></div>
      </div>
      <div className="card bg-amber-500/5 border-amber-500/20">
        <p className="text-xs text-amber-600">⚠️ Đây không phải là khuyến nghị đầu tư. Dữ liệu chỉ mang tính tham khảo. Hãy tự nghiên cứu trước khi quyết định đầu tư.</p>
      </div>
    </div>
  );
}

function ForecastTab({ stock }: { stock: import("@/lib/market/mock-data").StockQuote }) {
  return (
    <div className="space-y-4">
      <span className="badge badge-demo text-xs">Demo data — Dự báo mô phỏng</span>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card text-center"><div className="text-xs text-muted-foreground">Mục tiêu thấp</div><div className="font-mono text-lg font-semibold text-red-500">{formatCurrency(stock.price * 0.85)}</div></div>
        <div className="card text-center border-primary/30"><div className="text-xs text-muted-foreground">Trung bình</div><div className="font-mono text-lg font-semibold text-primary">{formatCurrency(stock.price * 1.12)}</div></div>
        <div className="card text-center"><div className="text-xs text-muted-foreground">Mục tiêu cao</div><div className="font-mono text-lg font-semibold text-emerald-500">{formatCurrency(stock.price * 1.25)}</div></div>
      </div>
      <div className="card">
        <h4 className="font-semibold text-sm mb-2">Đánh giá của chuyên gia</h4>
        <div className="flex gap-2">
          {["Mua mạnh", "Mua", "Giữ", "Bán", "Bán mạnh"].map((l, i) => (
            <div key={l} className={`flex-1 text-center py-2 rounded-xl text-xs font-medium ${i === 1 ? "bg-emerald-500/10 text-emerald-500 ring-1 ring-emerald-500/30" : "bg-secondary text-muted-foreground"}`}>{l}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AITab({ messages, input, loading, onInputChange, onSend, symbol }: {
  messages: AIMessage[]; input: string; loading: boolean; onInputChange: (v: string) => void; onSend: (m: string) => void; symbol: string;
}) {
  return (
    <div className="space-y-4">
      <div className="card bg-purple-500/5 border-purple-500/20">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/></svg>
          </div>
          <h3 className="font-semibold">AI Agent — {symbol}</h3>
          <span className="badge badge-ai text-xs">Phase 1 Demo</span>
        </div>

        {/* Suggested prompts */}
        {messages.length === 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {STOCK_PROMPTS.map((p) => (
              <button key={p} className="badge badge-ai text-xs cursor-pointer hover:opacity-80" onClick={() => onSend(p)}>{p}</button>
            ))}
          </div>
        )}

        {/* Messages */}
        <div className="space-y-4 max-h-96 overflow-y-auto mb-4">
          {messages.map((m) => (
            <div key={m.id} className={`${m.role === "user" ? "text-right" : ""}`}>
              <div className={`inline-block max-w-[80%] text-left ${m.role === "user" ? "bg-indigo-500 text-white rounded-2xl rounded-tr-md px-4 py-2" : ""}`}>
                {m.role === "assistant" && <p className="text-sm mb-2">{m.content}</p>}
                {m.role === "user" && <p className="text-sm">{m.content}</p>}
                {m.cards && (
                  <div className="grid gap-2 mt-2">
                    {m.cards.map((card, i) => (
                      <div key={i} className="card bg-[var(--bg-secondary)]">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-sm">{card.title}</span>
                          {card.sentiment && (
                            <span className={`badge text-xs ${card.sentiment === "bullish" ? "badge-bull" : card.sentiment === "bearish" ? "badge-bear" : "badge-neutral"}`}>
                              {card.sentiment === "bullish" ? "Tích cực" : card.sentiment === "bearish" ? "Tiêu cực" : "Trung lập"}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground whitespace-pre-line">{card.content}</p>
                        {card.data && (
                          <div className="grid grid-cols-2 gap-1 mt-2">
                            {Object.entries(card.data).map(([k, v]) => (
                              <div key={k} className="text-xs"><span className="text-muted-foreground">{k}: </span><span className="font-mono font-medium">{v}</span></div>
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
          {loading && <div className="skeleton h-20 w-3/4" />}
        </div>

        {/* Input */}
        <div className="flex gap-2">
          <input className="input flex-1" placeholder={`Hỏi về ${symbol}...`} value={input} onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") onSend(input); }} />
          <button className="btn btn-ai" onClick={() => onSend(input)} disabled={loading}>Gửi</button>
        </div>
      </div>
    </div>
  );
}
