"use client";
import { useState } from "react";
import { STOCKS } from "@/lib/market/mock-data";
import MarketTable from "@/components/market/MarketTable";

const TABS = ["Cổ phiếu", "ETF", "Crypto", "Forex", "Chỉ số"];

export default function MarketsPage() {
  const [tab, setTab] = useState(0);

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
            <select className="input max-w-[150px]"><option>Giá: Tất cả</option><option>{'< $50'}</option><option>$50 - $200</option><option>{'> $200'}</option></select>
            <select className="input max-w-[150px]"><option>% Thay đổi</option><option>{'> 5%'}</option><option>{'> 0%'}</option><option>{'< 0%'}</option><option>{'< -5%'}</option></select>
            <select className="input max-w-[150px]"><option>Vốn hóa</option><option>Mega Cap</option><option>Large Cap</option><option>Mid Cap</option><option>Small Cap</option></select>
            <select className="input max-w-[150px]"><option>Sàn: Tất cả</option><option>NASDAQ</option><option>NYSE</option><option>AMEX</option></select>
          </div>
        </div>
      </section>

      {/* Table */}
      <section>
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <MarketTable stocks={STOCKS} showFilters={true} />
        </div>
      </section>
    </div>
  );
}
