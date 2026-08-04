"use client";
import { useState } from "react";
import { STOCKS } from "@/lib/market/mock-data";
import MarketTable from "@/components/market/MarketTable";

const TABS = ["Cổ phiếu", "ETF", "Crypto", "Forex", "Chỉ số"];

export default function MarketsPage() {
  const [tab, setTab] = useState(0);
  const [priceFilter, setPriceFilter] = useState("all");
  const [changeFilter, setChangeFilter] = useState("all");
  const [marketCapFilter, setMarketCapFilter] = useState("all");
  const [exchangeFilter, setExchangeFilter] = useState("all");

  // For MVP, all tabs show stocks data
  return (
    <div className="min-h-screen bg-background fade-in">
      {/* Header */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Bộ lọc thị trường</h1>
          <p className="text-sm text-muted-foreground">Sàng lọc và tìm kiếm cổ phiếu, ETF, crypto, forex theo nhiều tiêu chí</p>
        </div>
      </section>

      {/* Filters */}
      <section className="border-b border-border bg-card/50">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="tab-list mb-4">
            {TABS.map((t, i) => (
              <button key={t} className={`tab-item ${tab === i ? "active" : ""}`} onClick={() => setTab(i)}>{t}</button>
            ))}
          </div>
          <div className="flex flex-wrap gap-3 mb-3">
            <select className="input max-w-[150px]" value={priceFilter} onChange={(event) => setPriceFilter(event.target.value)}><option value="all">Giá: Tất cả</option><option value="lt50">{'< $50'}</option><option value="50to200">$50 - $200</option><option value="gt200">{'> $200'}</option></select>
            <select className="input max-w-[150px]" value={changeFilter} onChange={(event) => setChangeFilter(event.target.value)}><option value="all">% Thay đổi</option><option value="gt5">{'> 5%'}</option><option value="gainers">{'> 0%'}</option><option value="losers">{'< 0%'}</option><option value="ltminus5">{'< -5%'}</option></select>
            <select className="input max-w-[150px]" value={marketCapFilter} onChange={(event) => setMarketCapFilter(event.target.value)}><option value="all">Vốn hóa</option><option value="mega">Mega Cap</option><option value="large">Large Cap</option><option value="mid">Mid Cap</option><option value="small">Small Cap</option></select>
            <select className="input max-w-[150px]" value={exchangeFilter} onChange={(event) => setExchangeFilter(event.target.value)}><option value="all">Sàn: Tất cả</option><option value="NASDAQ">NASDAQ</option><option value="NYSE">NYSE</option><option value="AMEX">AMEX</option></select>
          </div>
        </div>
      </section>

      {/* Table */}
      <section>
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <MarketTable
            stocks={STOCKS}
            showFilters={true}
            priceFilter={priceFilter}
            changeFilter={changeFilter}
            marketCapFilter={marketCapFilter}
            exchangeFilter={exchangeFilter}
          />
        </div>
      </section>
    </div>
  );
}
