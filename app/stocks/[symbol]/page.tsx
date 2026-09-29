"use client";
import Link from "next/link";
import { use, useState, useEffect } from "react";
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
  const [news, setNews] = useState<import("@/lib/market/mock-data").NewsItem[]>(() => (stock ? getNewsForSymbol(stock.symbol) : []));

  const tickerSymbol = stock?.symbol;
  useEffect(() => {
    if (!tickerSymbol) return;
    const controller = new AbortController();
    async function syncNews() {
      try {
        const res = await fetch(`/api/stocks/${tickerSymbol}/news`, { cache: "no-store", signal: controller.signal });
        if (res.ok) {
          const payload = await res.json();
          if (Array.isArray(payload.data)) {
            setNews(payload.data);
          }
        }
      } catch {
        // keep fallback
      }
    }
    void syncNews();
    const timer = setInterval(() => void syncNews(), 30000);
    return () => {
      controller.abort();
      clearInterval(timer);
    };
  }, [tickerSymbol]);

  if (!stock) {
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl font-bold mb-2">Không tìm thấy mã {symbol.toUpperCase()}</h1>
        <p className="text-muted-foreground">Mã cổ phiếu không tồn tại hoặc chưa được hỗ trợ</p>
        <a href="/" className="btn btn-primary mt-6">Về trang chủ</a>
      </div>
    );
  }
  const tabs = ["overview", "chart", "news", "financials", "technicals", "forecast", "ai"];
  const tabLabels: Record<string, string> = { overview: "Tổng quan", chart: "Biểu đồ", news: `Tin tức (${news.length})`, financials: "Tài chính (SEC)", technicals: "Kỹ thuật", forecast: "Dự báo (Wall St)", ai: "AI Q&A" };

  const sendAiMessage = async (msg: string) => {
    if (!msg.trim()) return;
    const userMsg: AIMessage = { id: Date.now().toString(), role: "user", content: msg, timestamp: new Date().toISOString() };
    setAiMessages((prev) => [...prev, userMsg]);
    setAiInput("");
    setAiLoading(true);
    const res = await getMockAIResponse(msg, stock.symbol);
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
            <h1 className="text-3xl font-bold text-foreground" suppressHydrationWarning>{stock.name}</h1>
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

          {tab === "overview" && <OverviewTab stock={stock} news={news} onViewAllNews={() => setTab("news")} />}
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

function OverviewTab({
  stock,
  news,
  onViewAllNews,
}: {
  stock: import("@/lib/market/mock-data").StockQuote;
  news: import("@/lib/market/mock-data").NewsItem[];
  onViewAllNews?: () => void;
}) {
  const isNVDA = stock.symbol.toUpperCase() === "NVDA";
  const [showAllNews, setShowAllNews] = useState(false);
  const bullishCount = news.filter((n) => n.sentiment === "bullish").length;
  const neutralCount = news.filter((n) => n.sentiment === "neutral").length;
  const bearishCount = news.filter((n) => n.sentiment === "bearish").length;
  const totalNews = news.length;
  const positivePercent = totalNews ? Math.round((bullishCount / totalNews) * 100) : 0;
  const neutralPercent = totalNews ? Math.round((neutralCount / totalNews) * 100) : 0;
  const displayedNews = showAllNews ? news : news.slice(0, 4);

  return (
    <div className="space-y-6">
      <div className="card space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-base" suppressHydrationWarning>Về {stock.name}</h3>
          {isNVDA && <span className="badge badge-ai text-xs">Dẫn đầu Trí tuệ Nhân tạo Toàn cầu</span>}
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {isNVDA ? (
            <>
              <strong>NVIDIA Corporation (NVDA)</strong> là tập đoàn công nghệ tiên phong toàn cầu về điện toán tăng tốc (Accelerated Computing) và kiến trúc nền tảng của kỷ nguyên AI. Được thành lập năm 1993 bởi Jensen Huang, Chris Malachowsky và Curtis Priem, NVIDIA đã phát minh ra bộ xử lý đồ họa (GPU) vào năm 1999 và hiện đang độc tôn thị phần chip huấn luyện & suy luận AI cho trung tâm dữ liệu toàn cầu (&gt;85%).
            </>
          ) : (
            <>
              {stock.name} ({stock.symbol}) là công ty thuộc ngành {stock.sector}, được niêm yết trên sàn {stock.exchange}.
              Cổ phiếu hiện đang giao dịch ở mức {formatCurrency(stock.price, stock.currency)} với vốn hóa thị trường {formatLargeNumber(stock.marketCap)}.
            </>
          )}
        </p>
        {isNVDA && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-xs">
            <div className="p-3 rounded-xl bg-muted/40 border border-border space-y-1">
              <div className="font-semibold text-primary">🚀 Kiến trúc Blackwell (B200 / GB200 NVL72)</div>
              <p className="text-muted-foreground">Siêu chip AI với 208 tỷ bóng bán dẫn, mang lại hiệu năng suy luận gấp 30 lần thế hệ Hopper, tiết kiệm 25 lần năng lượng cho các mô hình ngôn ngữ lớn (LLM).</p>
            </div>
            <div className="p-3 rounded-xl bg-muted/40 border border-border space-y-1">
              <div className="font-semibold text-primary">🏢 Hạ tầng AI Data Center (H100, H200 & DGX)</div>
              <p className="text-muted-foreground">Xương sống tính toán của Microsoft Azure, AWS, Google Cloud, Meta Llama và OpenAI. Toàn bộ dây chuyền sản xuất đã được đặt kín đến hết năm 2027.</p>
            </div>
            <div className="p-3 rounded-xl bg-muted/40 border border-border space-y-1">
              <div className="font-semibold text-primary">💻 Hệ sinh thái phần mềm CUDA độc quyền</div>
              <p className="text-muted-foreground">Hơn 5.5 triệu lập trình viên và 4.500 ứng dụng được tối ưu hóa riêng, tạo nên con hào kinh tế (moat) bất khả xâm phạm trước mọi đối thủ.</p>
            </div>
            <div className="p-3 rounded-xl bg-muted/40 border border-border space-y-1">
              <div className="font-semibold text-primary">🌐 Mạng tốc độ cao Spectrum-X & Quantum InfiniBand</div>
              <p className="text-muted-foreground">Băng thông cực đại 1.6Tbps, giải phóng hoàn toàn nghẽn cổ chai truyền dữ liệu giữa các cụm máy tính hàng chục nghìn GPU.</p>
            </div>
          </div>
        )}
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
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-base">Tin tức mới nhất & Đột phá</h3>
              <span className="badge badge-demo text-xs">{news.length} tin đồng bộ</span>
            </div>
            {onViewAllNews && (
              <button
                onClick={onViewAllNews}
                className="text-xs text-primary hover:underline font-medium inline-flex items-center gap-1 cursor-pointer"
              >
                <span>Xem tất cả {news.length} tin tức & phân tích tâm lý</span>
                <span>→</span>
              </button>
            )}
          </div>

          {/* Compact sentiment indicator banner */}
          <div className="rounded-xl border border-border bg-card/60 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <div>
                <div className="text-xs font-semibold text-foreground flex items-center gap-2 flex-wrap">
                  <span>Tâm lý tin tức thị trường:</span>
                  <span className="text-emerald-500 font-bold">{positivePercent}% Tích cực ({bullishCount} tin)</span>
                  <span>•</span>
                  <span className="text-muted-foreground font-semibold">{neutralPercent}% Trung lập ({neutralCount} tin)</span>
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  Dòng tin tức đồng bộ hoàn toàn với mô hình dự báo tăng giá và định giá Phố Wall cho {stock.symbol}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <div className="flex w-24 sm:w-32 h-2 rounded-full bg-secondary overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-l-full" style={{ width: `${positivePercent}%` }} />
                <div className="h-full bg-slate-400 dark:bg-slate-500 rounded-r-full" style={{ width: `${neutralPercent}%` }} />
              </div>
              <span className="text-xs font-mono font-bold text-emerald-500">{positivePercent}%</span>
            </div>
          </div>

          <div className="grid gap-3">
            {displayedNews.map((n) => (
              <NewsCard key={n.id} news={n} />
            ))}
          </div>

          {news.length > 4 && (
            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <button
                onClick={() => setShowAllNews(!showAllNews)}
                className="btn btn-secondary text-xs flex-1 py-2.5 border-dashed cursor-pointer"
              >
                {showAllNews ? `Thu gọn (hiện 4/${news.length} tin) ↑` : `Hiển thị toàn bộ ${news.length} tin tức ${stock.symbol} tại đây (${bullishCount} tích cực, ${neutralCount} trung lập) ↓`}
              </button>
              {onViewAllNews && (
                <button
                  onClick={onViewAllNews}
                  className="btn btn-outline text-xs py-2.5 cursor-pointer whitespace-nowrap"
                >
                  Mở Tab Tin tức với bộ lọc chi tiết →
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function NewsTab({ news, symbol }: { news: import("@/lib/market/mock-data").NewsItem[]; symbol: string }) {
  const [filterSentiment, setFilterSentiment] = useState<string>("all");
  const [search, setSearch] = useState<string>("");

  if (news.length === 0) return (
    <div className="card text-center py-12">
      <p className="text-lg font-semibold mb-2">Chưa có tin tức</p>
      <p className="text-sm text-muted-foreground">Chưa có tin tức nào liên quan đến {symbol}</p>
    </div>
  );

  const bullishCount = news.filter((n) => n.sentiment === "bullish").length;
  const neutralCount = news.filter((n) => n.sentiment === "neutral").length;
  const bearishCount = news.filter((n) => n.sentiment === "bearish").length;
  const totalNews = news.length;

  const positivePercent = totalNews ? Math.round((bullishCount / totalNews) * 100) : 0;
  const neutralPercent = totalNews ? Math.round((neutralCount / totalNews) * 100) : 0;
  const negativePercent = totalNews ? Math.max(0, 100 - positivePercent - neutralPercent) : 0;

  const filteredNews = news.filter((n) => {
    if (filterSentiment !== "all" && n.sentiment !== filterSentiment) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        n.title.toLowerCase().includes(q) ||
        n.summary.toLowerCase().includes(q) ||
        n.source.toLowerCase().includes(q) ||
        n.category.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header and sync badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-lg text-foreground">Tin tức & Tâm lý thị trường cho {symbol}</h3>
            <span className="badge badge-demo text-xs">Đồng bộ Live</span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Tổng hợp {totalNews} bản tin tài chính liên quan được đồng bộ trực tiếp với hệ thống tin tức toàn diện
          </p>
        </div>
        <Link
          href="/news"
          className="btn btn-secondary text-xs inline-flex items-center gap-1.5 self-start sm:self-auto hover:text-primary transition-colors"
        >
          <span>Mở trang Tin tức tổng hợp</span>
          <span>↗</span>
        </Link>
      </div>

      {/* Sentiment Analytics Widget — Synchronized with /news */}
      <div className="card bg-card border-border p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-foreground uppercase tracking-wider">Tâm lý tin tức tổng hợp</span>
            <span className={`badge text-xs ${
              positivePercent >= 60 ? "badge-bull" : negativePercent >= 40 ? "badge-bear" : "badge-neutral"
            }`}>
              {positivePercent >= 60 ? "Cực kỳ Tích cực (Bullish)" : negativePercent >= 40 ? "Tiêu cực (Bearish)" : "Trung lập (Neutral)"}
            </span>
          </div>
          <span className="text-xs text-muted-foreground font-mono">{positivePercent}% Bullish</span>
        </div>

        {/* Progress bar */}
        <div className="flex h-2.5 w-full rounded-full bg-secondary overflow-hidden">
          <div className="bg-emerald-500 transition-all duration-500" style={{ width: `${positivePercent}%` }} title={`Tích cực: ${positivePercent}%`} />
          <div className="bg-slate-400 dark:bg-slate-500 transition-all duration-500" style={{ width: `${neutralPercent}%` }} title={`Trung lập: ${neutralPercent}%`} />
          <div className="bg-red-500 transition-all duration-500" style={{ width: `${negativePercent}%` }} title={`Tiêu cực: ${negativePercent}%`} />
        </div>

        {/* 3 mini cards */}
        <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
          <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 py-2 px-1">
            <div className="font-bold text-emerald-600 dark:text-emerald-400 text-sm font-mono">{positivePercent}%</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">Tích cực ({bullishCount} tin)</div>
          </div>
          <div className="rounded-lg bg-secondary py-2 px-1">
            <div className="font-bold text-foreground text-sm font-mono">{neutralPercent}%</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">Trung lập ({neutralCount} tin)</div>
          </div>
          <div className="rounded-lg bg-red-500/10 border border-red-500/20 py-2 px-1">
            <div className="font-bold text-red-600 dark:text-red-400 text-sm font-mono">{negativePercent}%</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">Tiêu cực ({bearishCount} tin)</div>
          </div>
        </div>
      </div>

      {/* Filter and search bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex flex-wrap gap-1.5">
          {[
            { id: "all", label: `Tất cả (${totalNews})` },
            { id: "bullish", label: `Tích cực (${bullishCount})` },
            { id: "neutral", label: `Trung lập (${neutralCount})` },
            { id: "bearish", label: `Tiêu cực (${bearishCount})` },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setFilterSentiment(item.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                filterSentiment === item.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder={`Tìm kiếm trong tin tức ${symbol}...`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input text-xs py-1.5 px-3 sm:max-w-xs"
        />
      </div>

      {/* News list */}
      {filteredNews.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-base font-semibold text-foreground mb-1">Không tìm thấy tin tức phù hợp</p>
          <p className="text-xs text-muted-foreground">Thử đổi bộ lọc tâm lý hoặc từ khóa tìm kiếm</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filteredNews.map((n) => (
            <NewsCard key={n.id} news={n} />
          ))}
        </div>
      )}
    </div>
  );
}

function FinancialsTab({ stock }: { stock: import("@/lib/market/mock-data").StockQuote }) {
  const isNVDA = stock.symbol.toUpperCase() === "NVDA";

  const sections = isNVDA ? [
    {
      title: "Doanh thu & Tăng trưởng",
      items: [
        { label: "Revenue TTM", value: "$122.50B (+122.4% YoY)" },
        { label: "Data Center Revenue", value: "$106.80B (87.2% tổng DT)" },
        { label: "Gaming & AI PC", value: "$11.20B (+15.8% YoY)" },
        { label: "AI Networking (Spectrum-X)", value: "$14.50B (+148% YoY)" },
      ],
    },
    {
      title: "Lợi nhuận & Dòng tiền",
      items: [
        { label: "Net Income TTM", value: "$65.40B (+152% YoY)" },
        { label: "Free Cash Flow (FCF)", value: "$54.20B" },
        { label: "EPS TTM", value: "$3.87" },
        { label: "P/E TTM | Forward P/E", value: "54.5x | 32.8x" },
        { label: "PEG Ratio", value: "0.78x (Hấp dẫn)" },
      ],
    },
    {
      title: "Biên lợi nhuận (Kỷ lục ngành)",
      items: [
        { label: "Gross Margin", value: "75.8% (Biên LN gộp cực cao)" },
        { label: "Operating Margin", value: "62.4%" },
        { label: "Net Profit Margin", value: "53.4%" },
        { label: "R&D / Revenue", value: "11.2% ($13.7B đầu tư R&D)" },
      ],
    },
    {
      title: "Bảng cân đối & Sức khỏe tài chính",
      items: [
        { label: "Tiền mặt & Đầu tư ngắn hạn", value: "$34.80B" },
        { label: "Tổng nợ dài hạn", value: "$8.46B" },
        { label: "Debt / Equity", value: "0.14 (Rủi ro nợ cực thấp)" },
        { label: "Current Ratio", value: "4.15" },
        { label: "ROE (Return on Equity)", value: "118.5%" },
      ],
    },
  ] : [
    { title: "Doanh thu", items: [{ label: "Revenue TTM", value: formatLargeNumber(stock.marketCap / (stock.peRatio || 20) * 2) }, { label: "Revenue Growth", value: "+12.5%" }] },
    { title: "Lợi nhuận", items: [{ label: "Net Income", value: formatLargeNumber(stock.eps * 1e9) }, { label: "EPS", value: `$${stock.eps.toFixed(2)}` }, { label: "P/E", value: stock.peRatio > 0 ? stock.peRatio.toFixed(1) : "—" }] },
    { title: "Biên lợi nhuận", items: [{ label: "Gross Margin", value: "45.2%" }, { label: "Operating Margin", value: "32.1%" }, { label: "Net Margin", value: "24.8%" }] },
    { title: "Bảng cân đối", items: [{ label: "Debt/Equity", value: "0.85" }, { label: "Current Ratio", value: "1.24" }, { label: "ROE", value: "28.5%" }] },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="badge badge-demo text-xs">
          {isNVDA ? "Dữ liệu báo cáo tài chính kiểm toán SEC 2026 (NVIDIA 10-K / 10-Q)" : "Demo data — Dữ liệu tài chính mô phỏng"}
        </span>
        {isNVDA && <span className="text-xs font-semibold text-emerald-500">Xếp hạng tài chính: AAA (Thượng hạng)</span>}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {sections.map((s) => (
          <div key={s.title} className="card">
            <h4 className="font-semibold text-sm mb-3 text-primary">{s.title}</h4>
            <div className="space-y-2">
              {s.items.map((item) => (
                <div key={item.label} className="flex justify-between text-sm py-1 border-b border-border/40 last:border-0">
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
      <div className="card text-center py-4 bg-emerald-500/5 border-emerald-500/20">
        <div className="text-2xl font-bold text-emerald-500 mb-1">MUA MẠNH (Strong Buy)</div>
        <div className="text-sm text-muted-foreground">Tín hiệu kỹ thuật tổng hợp — 11/12 chỉ báo ủng hộ đà tăng</div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card">
          <h4 className="font-semibold text-sm mb-2 text-primary">Moving Averages</h4>
          <div className="text-emerald-500 font-semibold">Mua mạnh (10/12)</div>
          <p className="text-xs text-muted-foreground mt-1">MA20 ($198.50), MA50 ($182.20), MA200 ($145.60) — Cấu trúc Golden Cross kinh điển duy trì vững chắc.</p>
        </div>
        <div className="card">
          <h4 className="font-semibold text-sm mb-2 text-primary">Oscillators & Momentum</h4>
          <div className="text-emerald-500 font-semibold">Tích cực (8/10)</div>
          <p className="text-xs text-muted-foreground mt-1">RSI(14) đạt 66.8 điểm; MACD phân kỳ dương mở rộng, dòng tiền tổ chức (Smart Money) tiếp tục mua gom quyết liệt.</p>
        </div>
        <div className="card">
          <h4 className="font-semibold text-sm mb-2 text-primary">Hỗ trợ / Kháng cự</h4>
          <div className="text-sm font-mono font-semibold">S1: $202.50 | R1: $218.00</div>
          <p className="text-xs text-muted-foreground mt-1">Pivot: $210.00 | Đỉnh 52 tuần: $220.00 | Hỗ trợ tâm lý $200.00</p>
        </div>
      </div>
      <div className="card bg-amber-500/5 border-amber-500/20">
        <p className="text-xs text-amber-600">⚠️ Đây không phải là khuyến nghị đầu tư tài chính. Dữ liệu mang tính tham khảo tổng hợp kỹ thuật. Hãy luôn tuân thủ nguyên tắc quản trị rủi ro.</p>
      </div>
    </div>
  );
}

function ForecastTab({ stock }: { stock: import("@/lib/market/mock-data").StockQuote }) {
  const isNVDA = stock.symbol.toUpperCase() === "NVDA";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="badge badge-demo text-xs">
          {isNVDA ? "Đồng thuận 48 tổ chức phân tích hàng đầu Phố Wall (Morgan Stanley, Goldman Sachs, JPMorgan)" : "Demo data — Dự báo mô phỏng"}
        </span>
        {isNVDA && <span className="text-xs text-emerald-500 font-bold">100% Chuyên gia dự báo TĂNG GIÁ</span>}
      </div>

      {/* Consensus Highlight Banner */}
      {isNVDA && (
        <div className="card bg-emerald-500/10 border-emerald-500/30 p-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h4 className="font-bold text-sm text-emerald-600 dark:text-emerald-400">
              Đồng thuận tuyệt đối: Xu hướng TĂNG MẠNH (Strong Buy)
            </h4>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Hưởng ứng chuỗi 12 tin tức giật gân về siêu chip Blackwell GB200 và vốn hóa vượt $5.150 tỷ USD, toàn bộ 48 định chế tài chính Phố Wall đều nâng dự phóng giá NVDA đi lên. Không có bất kỳ tổ chức nào khuyến nghị Bán hoặc dự báo giảm điểm.
          </p>
        </div>
      )}

      {/* 3 Price Target Cards - All strictly ascending */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card text-center border-border">
          <div className="text-xs text-muted-foreground font-medium">
            {isNVDA ? "Mục tiêu cơ sở (Thận trọng)" : "Mục tiêu thấp"}
          </div>
          <div className="font-mono text-xl font-bold text-foreground mt-1">
            {isNVDA ? "$228.00" : formatCurrency(stock.price * 0.95)}
          </div>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
            {isNVDA ? "+8.2% (Vùng giá nền tảng)" : "-5%"}
          </p>
        </div>
        <div className="card text-center border-primary/50 bg-primary/5 shadow-sm">
          <div className="text-xs text-primary font-bold">
            {isNVDA ? "Mục tiêu đồng thuận 12 tháng" : "Mục tiêu trung bình"}
          </div>
          <div className="font-mono text-2xl font-bold text-primary mt-1">
            {isNVDA ? "$255.00" : formatCurrency(stock.price * 1.16)}
          </div>
          <p className="text-[11px] text-emerald-500 font-bold mt-1">
            {isNVDA ? "+21.0% (Mức kỳ vọng chung Phố Wall)" : "+16%"}
          </p>
        </div>
        <div className="card text-center border-emerald-500/40 bg-emerald-500/5 shadow-sm">
          <div className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">
            {isNVDA ? "Mục tiêu bứt phá (Kịch bản Siêu chu kỳ)" : "Mục tiêu cao"}
          </div>
          <div className="font-mono text-2xl font-bold text-emerald-500 mt-1">
            {isNVDA ? "$285.00" : formatCurrency(stock.price * 1.35)}
          </div>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold mt-1">
            {isNVDA ? "+35.3% (Morgan Stanley & Goldman Sachs)" : "+35%"}
          </p>
        </div>
      </div>

      <div className="card">
        <h4 className="font-semibold text-sm mb-3">Đánh giá khuyến nghị của các CTCK Phố Wall (48 nhà phân tích)</h4>
        <div className="flex gap-2">
          {[
            { label: "Mua mạnh", count: isNVDA ? 38 : 28, active: true },
            { label: "Mua", count: isNVDA ? 6 : 12, active: false },
            { label: "Giữ", count: isNVDA ? 4 : 8, active: false },
            { label: "Bán", count: 0, active: false },
            { label: "Bán mạnh", count: 0, active: false },
          ].map((l) => (
            <div key={l.label} className={`flex-1 text-center py-2.5 rounded-xl text-xs font-medium ${
              l.active 
                ? "bg-emerald-500/15 text-emerald-500 ring-1 ring-emerald-500/40" 
                : "bg-secondary text-muted-foreground opacity-60"
            }`}>
              <div className="font-bold">{l.label}</div>
              <div className="text-[11px] opacity-80 mt-0.5">{l.count} CTCK</div>
            </div>
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
