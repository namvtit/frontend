'use client';

import React from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  TrendingDown,
  AlertOctagon,
  HelpCircle,
  ArrowRight,
  ShieldAlert,
  Info,
  DollarSign,
  Briefcase,
  PieChart,
} from 'lucide-react';
import type { PisiPortfolioOutput, PisiTickerOutput } from '@/lib/pisi/types/pisi';
import { ActionBucket, ExecutionModeLabel, BlockCodeLabel } from '@/lib/pisi/types/pisi';

interface PisiDashboardPanelProps {
  portfolioOutput: PisiPortfolioOutput | null;
  isReady: boolean;
}

export function PisiDashboardPanel({ portfolioOutput, isReady }: PisiDashboardPanelProps) {
  if (!isReady || !portfolioOutput) {
    return (
      <div className="flex flex-col items-center justify-center p-12 rounded-xl border border-border/80 bg-card/60 backdrop-blur-md text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary mb-4" />
        <p className="text-sm font-semibold text-foreground">Đang tính toán ma trận định lượng PISI...</p>
        <p className="text-xs text-muted-foreground mt-1">Quá trình này phân tích 9,000 điểm giá dự báo trên toàn danh mục.</p>
      </div>
    );
  }

  const {
    preset_label,
    nav,
    cash_before,
    reserved_cash_value,
    available_cash_for_buys,
    current_portfolio_dd_pct,
    portfolio_risk_guard,
    gross_exposure_before_pct,
    gross_exposure_target_pct,
    expected_fee_value,
    expected_slippage_value,
    expected_cash_after,
    buy_count,
    sell_count,
    no_action_count,
    blocked_count,
    warnings,
    ticker_outputs,
  } = portfolioOutput;

  // Sort tickers: BUYs first (sorted by rank/score), then SELLs, then NO_ACTIONs
  const sortedTickers = [...ticker_outputs].sort((a, b) => {
    if (a.action_bucket !== b.action_bucket) {
      // 1=BUY, 2=SELL, 0=NO_ACTION
      // We want: BUY (1) first, then SELL (2), then NO_ACTION (0)
      const aVal = a.action_bucket === 1 ? 3 : a.action_bucket === 2 ? 2 : 1;
      const bVal = b.action_bucket === 1 ? 3 : b.action_bucket === 2 ? 2 : 1;
      return bVal - aVal;
    }
    // Secondary sort: signal score desc
    return b.signal_score - a.signal_score;
  });

  return (
    <div className="space-y-6">
      {/* Simulation Banner */}
      <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 px-4 py-3 text-xs text-amber-500 flex items-start gap-2.5">
        <Info className="h-4.5 w-4.5 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-bold uppercase tracking-wider mr-1">CHỈ DÙNG MÔ PHỎNG:</span> 
          Quyết định giao dịch dựa trên đường giá dự báo giả định 600 ngày. Logic định lượng PISI dùng để thử nghiệm tham số quản trị rủi ro; không cam kết lợi nhuận và không phải lời khuyên tài chính thực tế.
        </div>
      </div>

      {/* Portfolio Risk Guard Circuit Breaker */}
      {portfolio_risk_guard === 1 && (
        <div className="rounded-lg bg-rose-500/15 border border-rose-500/30 p-4 text-xs text-rose-500 dark:text-rose-400 flex items-start gap-3 animate-pulse">
          <ShieldAlert className="h-5 w-5 shrink-0" />
          <div className="leading-relaxed">
            <span className="font-bold uppercase tracking-widest block mb-0.5 text-sm">PORTFOLIO RISK GUARD ĐÃ KÍCH HOẠT!</span>
            Mức sụt giảm tài sản hiện tại ({(current_portfolio_dd_pct * 100).toFixed(2)}%) đã vượt ngưỡng giới hạn tối đa cho phép. Toàn bộ lệnh mua mới (BUY/DCA/GRID) đã bị block triệt để để bảo toàn vốn. Danh mục chuyển sang chế độ phòng vệ: hạ tỷ trọng tối đa về {(gross_exposure_target_pct * 100).toFixed(0)}%.
          </div>
        </div>
      )}

      {/* Grid of Portfolio Metrics */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {/* NAV & Drawdown */}
        <div className="rounded-xl border border-border/80 bg-card/65 p-4 shadow-sm">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">Tài Sản & Drawdown</span>
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-extrabold text-foreground">${nav.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div className="flex items-center gap-1.5 mt-1.5 text-xs">
            <span className="text-muted-foreground">Sụt giảm:</span>
            <span className={`font-bold ${current_portfolio_dd_pct > 0.05 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {(current_portfolio_dd_pct * 100).toFixed(2)}%
            </span>
          </div>
        </div>

        {/* Cash Allocation */}
        <div className="rounded-xl border border-border/80 bg-card/65 p-4 shadow-sm">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">Cân đối tiền mặt</span>
          <div className="text-lg font-extrabold text-foreground">${cash_before.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          <div className="text-[10px] text-muted-foreground mt-2 leading-none flex items-center justify-between">
            <span>Dự phòng: ${reserved_cash_value.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
            <span>Khả dụng: ${available_cash_for_buys.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
          </div>
        </div>

        {/* Exposure Targets */}
        <div className="rounded-xl border border-border/80 bg-card/65 p-4 shadow-sm">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">Tỷ trọng Exposure</span>
          <div className="flex items-center gap-2">
            <span className="text-lg font-extrabold text-foreground">{(gross_exposure_before_pct * 100).toFixed(0)}%</span>
            <ArrowRight className="h-3 w-3 text-muted-foreground" />
            <span className="text-lg font-extrabold text-primary">{(gross_exposure_target_pct * 100).toFixed(0)}%</span>
          </div>
          <div className="w-full bg-border/40 h-1.5 rounded-full mt-2 relative overflow-hidden">
            <div className="bg-muted-foreground h-full absolute left-0" style={{ width: `${gross_exposure_before_pct * 100}%` }} />
            <div className="bg-primary h-full absolute left-0 opacity-70" style={{ width: `${gross_exposure_target_pct * 100}%` }} />
          </div>
        </div>

        {/* Stats and Fees */}
        <div className="rounded-xl border border-border/80 bg-card/65 p-4 shadow-sm">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">Lệnh & Chi phí dự kiến</span>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-emerald-400">+{buy_count} Mua</span>
            <span className="text-muted-foreground text-xs">•</span>
            <span className="text-xs font-bold text-rose-400">-{sell_count} Bán</span>
            {blocked_count > 0 && (
              <>
                <span className="text-muted-foreground text-xs">•</span>
                <span className="text-xs font-bold text-amber-500">{blocked_count} Block</span>
              </>
            )}
          </div>
          <div className="text-[9px] text-muted-foreground mt-2 leading-none">
            Phí + Trượt giá: ${(expected_fee_value + expected_slippage_value).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} USD
          </div>
        </div>
      </div>

      {/* Warnings List */}
      {warnings.length > 0 && (
        <div className="space-y-1 bg-rose-500/5 border border-rose-500/10 rounded-lg p-3 text-[11px] text-rose-400">
          <span className="font-bold flex items-center gap-1 mb-1">
            <AlertOctagon className="h-3.5 w-3.5" />
            Cảnh báo rủi ro hệ thống:
          </span>
          {warnings.map((warn, i) => (
            <p key={i} className="leading-tight">• {warn}</p>
          ))}
        </div>
      )}

      {/* Ranked Recommendations List */}
      <div className="rounded-xl border border-border/80 bg-card/60 backdrop-blur-md p-5 shadow-lg">
        <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
          <PieChart className="h-4.5 w-4.5 text-primary" />
          Bảng xếp hạng khuyến nghị theo điểm tín hiệu (PISI Rank)
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border/70 text-muted-foreground font-bold text-[10px] uppercase tracking-wider">
                <th className="py-2.5 pl-2">Mã / Ngành</th>
                <th className="py-2.5">Khuyến nghị</th>
                <th className="py-2.5 text-center">Score / Strength</th>
                <th className="py-2.5 text-right">Khối lượng</th>
                <th className="py-2.5 text-right">Giá trị order</th>
                <th className="py-2.5 text-right">Thực thi</th>
                <th className="py-2.5 text-right pr-2">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-y-border/40">
              {sortedTickers.map((ticker, index) => {
                let actionBadgeColor = 'bg-slate-500/10 border-slate-500/20 text-slate-400';
                if (ticker.action_bucket === ActionBucket.BUY) {
                  actionBadgeColor = 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400';
                } else if (ticker.action_bucket === ActionBucket.SELL) {
                  actionBadgeColor = 'bg-rose-500/10 border-rose-500/20 text-rose-400';
                }

                const isBlocked = ticker.block_code !== 0;

                return (
                  <tr key={ticker.ticker} className="hover:bg-secondary/20 transition-colors group">
                    <td className="py-3 pl-2">
                      <div className="font-black text-foreground">{ticker.ticker}</div>
                      <div className="text-[9px] text-muted-foreground mt-0.5">
                        {ticker.sector_id === 1 ? 'Technology' : 
                         ticker.sector_id === 2 ? 'Consumer Cyclical' :
                         ticker.sector_id === 3 ? 'Financials' :
                         ticker.sector_id === 4 ? 'Healthcare' :
                         ticker.sector_id === 5 ? 'Energy' :
                         ticker.sector_id === 6 ? 'ETF' : 'Communication'}
                      </div>
                    </td>
                    <td className="py-3">
                      {isBlocked ? (
                        <div className="space-y-0.5">
                          <span className="inline-flex rounded border border-amber-500/20 bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-bold text-amber-500">
                            BLOCKED
                          </span>
                          <span className="block text-[8px] text-muted-foreground font-semibold leading-none">
                            {BlockCodeLabel[ticker.block_code] || 'UNKNOWN_LIMIT'}
                          </span>
                        </div>
                      ) : (
                        <span className={`inline-flex rounded border px-1.5 py-0.5 text-[9px] font-extrabold ${actionBadgeColor}`}>
                          {ticker.action_label}
                        </span>
                      )}
                    </td>
                    <td className="py-3 text-center">
                      <div className="font-bold text-foreground">{ticker.signal_score.toFixed(0)}</div>
                      <div className="text-[9px] text-muted-foreground">DS: {ticker.decision_strength.toFixed(0)}%</div>
                    </td>
                    <td className="py-3 text-right">
                      {ticker.action_bucket === ActionBucket.BUY ? (
                        <span className="text-emerald-400 font-bold">+{ticker.final_buy_qty}</span>
                      ) : ticker.action_bucket === ActionBucket.SELL && ticker.final_sell_qty > 0 ? (
                        <span className="text-rose-400 font-bold">-{ticker.final_sell_qty}</span>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                      <div className="text-[9px] text-muted-foreground">Sở hữu: {ticker.holding_qty}</div>
                    </td>
                    <td className="py-3 text-right font-semibold">
                      ${ticker.estimated_order_notional.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </td>
                    <td className="py-3 text-right font-medium text-foreground">
                      {ticker.execution_mode !== 0 ? (
                        <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                          {ticker.execution_mode_label}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="py-3 text-right pr-2">
                      <Link
                        href={`/stocks/${ticker.ticker.toLowerCase()}?tab=pisi`}
                        className="inline-flex items-center gap-0.5 text-xs text-primary font-bold hover:text-primary/80 transition-colors cursor-pointer"
                      >
                        Chi tiết
                        <ArrowRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-0.5" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
