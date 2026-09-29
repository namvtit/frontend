"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Bot,
  BriefcaseBusiness,
  ChartNoAxesCombined,
  CircleDollarSign,
  Landmark,
  Radio,
  Sparkles,
} from "lucide-react";
import { useMemo } from "react";
import { useDemo } from "@/lib/demo";
import { INDICES, getStockBySymbol } from "@/lib/market/mock-data";
import { useLivePrice } from "@/lib/market/use-live-prices";
import { formatCurrency, formatPercent } from "@/lib/utils";

function chartPath(values: number[], width = 240, height = 58) {
  const low = Math.min(...values);
  const high = Math.max(...values);
  const range = high - low || 1;
  return values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * width;
      const y = height - ((value - low) / range) * (height - 7) - 3.5;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

function MiniChart({ values, positive }: { values: number[]; positive: boolean }) {
  const points = useMemo(() => chartPath(values), [values]);
  const color = positive ? "#34d399" : "#fb7185";

  return (
    <svg viewBox="0 0 240 58" preserveAspectRatio="none" className="pwa-assistant-mini-chart" role="img" aria-label="Biểu đồ biến động giá thu gọn">
      <defs>
        <linearGradient id={positive ? "assistant-positive" : "assistant-negative"} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`M0,58 L${points} L240,58 Z`} fill={`url(#${positive ? "assistant-positive" : "assistant-negative"})`} />
      <polyline points={points} fill="none" stroke={color} strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function AssistantAvatar() {
  return <span className="pwa-assistant-avatar" aria-hidden="true"><Sparkles className="h-3.5 w-3.5" /></span>;
}

function MarketSummaryCard() {
  const { state } = useDemo();
  const spx = state.marketCache.SPX;
  const nasdaq = state.marketCache.IXIC;
  const spxFallback = INDICES.find((index) => index.symbol === "SPX")!;
  const nasdaqFallback = INDICES.find((index) => index.symbol === "IXIC")!;
  const spxValue = spx?.price ?? spxFallback.value;
  const spxChange = spx?.changePercent ?? spxFallback.changePercent;
  const nasdaqValue = nasdaq?.price ?? nasdaqFallback.value;
  const nasdaqChange = nasdaq?.changePercent ?? nasdaqFallback.changePercent;

  return (
    <section className="pwa-assistant-finance-card pwa-assistant-market-card" aria-label="Tóm tắt thị trường">
      <div className="pwa-assistant-card-heading">
        <div><span className="pwa-assistant-eyebrow"><ChartNoAxesCombined className="h-3.5 w-3.5" /> Market snapshot</span><h2>Thị trường Mỹ</h2></div>
        <span className="pwa-assistant-market-status open"><Radio className="h-2.5 w-2.5" />Theo dõi phiên</span>
      </div>
      <div className="pwa-assistant-index-grid">
        <div><span>S&amp;P 500</span><strong>{spxValue.toLocaleString("en-US", { maximumFractionDigits: 2 })}</strong><em className={spxChange >= 0 ? "positive" : "negative"}>{formatPercent(spxChange)}</em></div>
        <div><span>Nasdaq</span><strong>{nasdaqValue.toLocaleString("en-US", { maximumFractionDigits: 2 })}</strong><em className={nasdaqChange >= 0 ? "positive" : "negative"}>{formatPercent(nasdaqChange)}</em></div>
      </div>
      <MiniChart values={[48, 51, 50, 55, 54, 58, 56, 61, 64, 62, 68, 71]} positive={spxChange >= 0} />
      <p className="pwa-assistant-card-note">Dữ liệu thị trường FinPilot cập nhật theo phiên.</p>
    </section>
  );
}

function AaplCard() {
  const fallback = getStockBySymbol("AAPL");
  const { price, changePercent, isLive } = useLivePrice("AAPL", fallback);
  const values = useMemo(() => (fallback?.sparkline ?? [1, 2]).map((point) => (point / (fallback?.sparkline.at(-1) ?? 1)) * price), [fallback?.sparkline, price]);

  return (
    <section className="pwa-assistant-finance-card pwa-assistant-stock-card" aria-label="Thông tin AAPL">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5"><span className="pwa-assistant-ticker">A</span><div><h2>AAPL</h2><p>Apple Inc. · NASDAQ</p></div></div>
        <span className="pwa-assistant-live-label"><span />{isLive ? "Live" : "Market data"}</span>
      </div>
      <div className="mt-4 flex items-end justify-between gap-3"><div><strong className="pwa-assistant-price">{formatCurrency(price)}</strong><em className={changePercent >= 0 ? "positive" : "negative"}>{formatPercent(changePercent)} hôm nay</em></div><span className="pwa-assistant-status-pill">Theo dõi</span></div>
      <div className="mt-2"><MiniChart values={values} positive={changePercent >= 0} /></div>
    </section>
  );
}

function PortfolioCard() {
  const { portfolio } = useDemo();
  const todayPnl = portfolio.unrealizedPnL;

  return (
    <section className="pwa-assistant-finance-card pwa-assistant-portfolio-card" aria-label="Portfolio Insight">
      <div className="pwa-assistant-card-heading"><div><span className="pwa-assistant-eyebrow"><BriefcaseBusiness className="h-3.5 w-3.5" /> Portfolio Insight</span><h2>Danh mục của bạn</h2></div><span className="pwa-assistant-portfolio-icon"><Landmark className="h-4 w-4" /></span></div>
      <div className="pwa-assistant-portfolio-value"><span>Portfolio value</span><strong>{formatCurrency(portfolio.totalAccountValue)}</strong></div>
      <div className="pwa-assistant-portfolio-grid"><div><span>Cash</span><strong>{formatCurrency(portfolio.cashBalance)}</strong></div><div><span>Today&apos;s P/L</span><strong className={todayPnl >= 0 ? "positive" : "negative"}>{formatPercent(portfolio.unrealizedPnLPercent)}</strong></div><div><span>Positions</span><strong>{portfolio.holdingDetails.length}</strong></div></div>
    </section>
  );
}

export function PwaAssistant() {
  return (
    <div className="pwa-screen pwa-assistant-screen">
      <main className="pwa-content pwa-assistant-content">
        <header className="pwa-assistant-header">
          <Link href="/pwa" className="pwa-assistant-back" aria-label="Quay về trang chủ FinPilot"><ArrowLeft className="h-5 w-5" /></Link>
          <div className="pwa-assistant-title"><span className="pwa-assistant-logo"><Bot className="h-4 w-4" /></span><div><h1>FinPilot AI</h1><p><span />AI Assistant</p></div></div>
          <Link href="/pwa" className="pwa-assistant-home" aria-label="Trang chủ FinPilot"><CircleDollarSign className="h-5 w-5" /></Link>
        </header>

        <section className="pwa-assistant-thread" aria-label="Cuộc trò chuyện với FinPilot AI">
          <div className="pwa-assistant-user-message">Thị trường hôm nay đang như thế nào?</div>
          <div className="pwa-assistant-response"><AssistantAvatar /><div><p className="pwa-assistant-bubble">Thị trường đang duy trì trạng thái tích cực. Một số nhóm công nghệ đang có động lực tốt, trong khi biến động vẫn ở mức cần theo dõi.</p><MarketSummaryCard /></div></div>

          <div className="pwa-assistant-user-message">Phân tích nhanh AAPL cho tôi</div>
          <div className="pwa-assistant-response"><AssistantAvatar /><div><p className="pwa-assistant-bubble">AAPL đang duy trì xu hướng tích cực trong phiên. Giá hiện tại và biến động được cập nhật theo dữ liệu thị trường của FinPilot. Với vị thế hiện tại, bạn nên theo dõi vùng giá và biến động trước khi đưa ra quyết định.</p><AaplCard /></div></div>

          <PortfolioCard />
          <div className="pwa-assistant-response pwa-assistant-final"><AssistantAvatar /><div><p className="pwa-assistant-bubble">Bạn có thể tiếp tục theo dõi biến động thị trường, danh mục và các cổ phiếu quan tâm ngay trên FinPilot.</p><div className="pwa-assistant-chips" aria-label="Gợi ý thao tác"><span>Xem thị trường</span><span>Xem danh mục</span><span>Phân tích cổ phiếu</span></div></div></div>
        </section>
      </main>
    </div>
  );
}
