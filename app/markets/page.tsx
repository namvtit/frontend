"use client";
import { useState, useMemo } from "react";
import { STOCKS, ETFS, CRYPTOS, FOREX, INDICES_STOCKS } from "@/lib/market/mock-data";
import MarketTable from "@/components/market/MarketTable";

const TABS = ["Cổ phiếu", "ETF", "Crypto", "Forex", "Chỉ số"];

export default function MarketsPage() {
  const [tab, setTab] = useState(0);
  const [priceFilter, setPriceFilter] = useState("all");
  const [changeFilter, setChangeFilter] = useState("all");
  const [marketCapFilter, setMarketCapFilter] = useState("all");
  const [exchangeFilter, setExchangeFilter] = useState("all");

  const currentStocks = useMemo(() => {
    switch (tab) {
      case 1:
        return ETFS;
      case 2:
        return CRYPTOS;
      case 3:
        return FOREX;
      case 4:
        return INDICES_STOCKS;
      default:
        return STOCKS;
    }
  }, [tab]);

  const handleTabChange = (index: number) => {
    setTab(index);
    if (index !== 0) {
      setMarketCapFilter("all");
      setExchangeFilter("all");
      if (index === 3 || index === 4) {
        setPriceFilter("all");
      }
    }
  };

  const showPriceFilter = tab === 0 || tab === 1 || tab === 2;
  const showMarketCapFilter = tab === 0;
  const showExchangeFilter = tab === 0 || tab === 1;

  return (
    <div className="min-h-screen bg-background fade-in">
      {/* Header */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Bộ lọc thị trường</h1>
          <p className="text-sm text-muted-foreground">Sàng lọc và tìm kiếm cổ phiếu, ETF, crypto, forex, chỉ số với đầy đủ thông số tài chính</p>
        </div>
      </section>

      {/* Filters */}
      <section className="border-b border-border bg-card/50">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="tab-list mb-4">
            {TABS.map((t, i) => (
              <button key={t} className={`tab-item ${tab === i ? "active" : ""}`} onClick={() => handleTabChange(i)}>{t}</button>
            ))}
          </div>
          <div className="flex flex-wrap gap-3 mb-3">
            {showPriceFilter && (
              <select className="input max-w-[150px]" value={priceFilter} onChange={(event) => setPriceFilter(event.target.value)}>
                <option value="all">Giá: Tất cả</option>
                <option value="lt50">{'< $50'}</option>
                <option value="50to200">$50 - $200</option>
                <option value="gt200">{'> $200'}</option>
              </select>
            )}
            <select className="input max-w-[150px]" value={changeFilter} onChange={(event) => setChangeFilter(event.target.value)}>
              <option value="all">% Thay đổi: Tất cả</option>
              <option value="gt5">{'> 5%'}</option>
              <option value="gainers">{'> 0% (Tăng)'}</option>
              <option value="losers">{'< 0% (Giảm)'}</option>
              <option value="ltminus5">{'< -5%'}</option>
            </select>
            {showMarketCapFilter && (
              <select className="input max-w-[150px]" value={marketCapFilter} onChange={(event) => setMarketCapFilter(event.target.value)}>
                <option value="all">Vốn hóa: Tất cả</option>
                <option value="mega">Mega Cap (&gt; $200B)</option>
                <option value="large">Large Cap ($10B - $200B)</option>
                <option value="mid">Mid Cap ($2B - $10B)</option>
                <option value="small">Small Cap (&lt; $2B)</option>
              </select>
            )}
            {showExchangeFilter && (
              <select className="input max-w-[150px]" value={exchangeFilter} onChange={(event) => setExchangeFilter(event.target.value)}>
                <option value="all">Sàn: Tất cả</option>
                <option value="NASDAQ">NASDAQ</option>
                <option value="NYSE">NYSE</option>
                <option value="AMEX">AMEX</option>
              </select>
            )}
          </div>
        </div>
      </section>

      {/* Table */}
      <section>
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <MarketTable
            stocks={currentStocks}
            showFilters={true}
            priceFilter={priceFilter}
            changeFilter={changeFilter}
            marketCapFilter={marketCapFilter}
            exchangeFilter={exchangeFilter}
            isCustomList={tab !== 0}
          />
        </div>
      </section>
    </div>
  );
}
