'use client';

import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  ShieldAlert,
  ListCollapse,
  Activity,
  Layers,
  Grid,
  FileSpreadsheet,
  AlertTriangle,
} from 'lucide-react';
import type { PisiTickerOutput, PisiResolvedConfig } from '@/lib/pisi/types/pisi';
import { ActionBucket, ExecutionMode } from '@/lib/pisi/types/pisi';
import { PisiScoreBreakdown } from './PisiScoreBreakdown';

interface PisiTickerDetailProps {
  tickerOutput: PisiTickerOutput | undefined;
  config: PisiResolvedConfig | null;
}

export function PisiTickerDetail({ tickerOutput, config }: PisiTickerDetailProps) {
  if (!tickerOutput || !config) {
    return (
      <div className="flex flex-col items-center justify-center p-12 rounded-xl border border-border/80 bg-card/60 backdrop-blur-md text-center">
        <p className="text-sm font-semibold text-foreground">Không có dữ liệu định lượng PISI cho mã này.</p>
        <p className="text-xs text-muted-foreground mt-1">Đảm bảo mã này nằm trong danh sách vũ trụ 15 cổ phiếu demo.</p>
      </div>
    );
  }

  // Formatting helper functions
  const toPct = (val: number) => `${(val * 100).toFixed(2)}%`;
  const toDec = (val: number) => val.toFixed(2);
  const toCurr = (val: number) => `$${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const derivedMetrics = [
    { label: 'Lợi nhuận dự báo', val: toPct(tickerOutput.forecast_return_pct), help: 'F_H / F_0 - 1' },
    { label: 'Lợi nhuận ròng', val: toPct(tickerOutput.net_return_pct), highlight: true, help: 'Forecast return trừ phí & trượt' },
    { label: 'Biến động dự báo', val: `${toPct(tickerOutput.forecast_volatility_pct)} (Năm: ${toPct(tickerOutput.annualized_forecast_volatility_pct)})`, help: 'Độ lệch chuẩn lợi nhuận forecast nhân căn H' },
    { label: 'Sụt giảm tối đa (MDD)', val: toPct(tickerOutput.forecast_max_drawdown_pct), help: 'Mức giảm lớn nhất từ đỉnh trên forecast path' },
    { label: 'Giá cao nhất (Peak)', val: `${toCurr(tickerOutput.forecast_peak_price)} (Ngày ${tickerOutput.forecast_peak_day})`, help: 'Đỉnh cao nhất trên chuỗi forecast' },
    { label: 'Giá thấp nhất (Trough)', val: `${toCurr(tickerOutput.forecast_trough_price)} (Ngày ${tickerOutput.forecast_trough_day})`, help: 'Đáy sâu nhất trên chuỗi forecast' },
    { label: 'Upside / Downside', val: `${toPct(tickerOutput.upside_pct)} / ${toPct(tickerOutput.downside_pct)}`, help: 'Tỷ lệ tăng tối đa / giảm tối đa so với p0' },
    { label: 'Tỷ số Risk/Reward', val: toDec(tickerOutput.risk_reward), highlight: true, help: 'Upside_pct / max(downside_pct, 0.001)' },
    { label: 'Ngày tăng / Hiệu suất đi', val: `${(tickerOutput.positive_day_ratio * 100).toFixed(0)}% / ${toDec(tickerOutput.path_efficiency)}`, help: 'Tỷ lệ ngày xanh / tỷ số dịch chuyển ròng trên tổng dịch chuyển' },
    { label: 'Biên độ dao động', val: toPct(tickerOutput.path_amplitude_pct), help: '(Peak - Trough) / F_0' },
  ];

  return (
    <div className="space-y-6">
      {/* Simulation Warning */}
      <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2.5 text-[11px] text-amber-500 flex items-start gap-2">
        <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold uppercase mr-1">Lưu ý mô phỏng:</span>
          Tất cả số liệu dưới đây được phân tích từ chuỗi giá đóng cửa điều chỉnh dự báo 600 ngày.
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column: Score breakdown & Risk Gates */}
        <div className="lg:col-span-1 space-y-6">
          {/* Signal Score Card */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-lg">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-1.5">
              <Activity className="h-4 w-4 text-primary" />
              Điểm tín hiệu PISI
            </h3>
            <PisiScoreBreakdown tickerOutput={tickerOutput} config={config} />
          </div>

          {/* Risk Gates Card */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-lg">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3.5 flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Risk Gates (Điều kiện cứng)
            </h3>
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between border-b border-border/30 pb-1.5">
                <span className="text-muted-foreground">Forecast hợp lệ</span>
                <span className={`font-bold ${tickerOutput.valid_forecast === 1 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {tickerOutput.valid_forecast === 1 ? 'HỢP LỆ' : 'KHÔNG HỢP LỆ'}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-border/30 pb-1.5">
                <span className="text-muted-foreground">Đủ điều kiện mua</span>
                <span className={`font-bold ${tickerOutput.buy_eligible === 1 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {tickerOutput.buy_eligible === 1 ? 'ĐẠT (PASS)' : 'K.ĐỦ ĐIỀU KIỆN'}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-border/30 pb-1.5">
                <span className="text-muted-foreground">Portfolio DD Guard</span>
                <span className={`font-bold ${tickerOutput.portfolio_risk_guard === 1 ? 'text-rose-400 animate-pulse' : 'text-muted-foreground'}`}>
                  {tickerOutput.portfolio_risk_guard === 1 ? 'ON (BLOCKED)' : 'OFF (AN TOÀN)'}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-border/30 pb-1.5">
                <span className="text-muted-foreground">Chạm dừng lỗ (Stop Loss)</span>
                <span className={`font-bold ${tickerOutput.stop_triggered === 1 ? 'text-rose-400 animate-pulse' : 'text-muted-foreground'}`}>
                  {tickerOutput.stop_triggered === 1 ? 'KÍCH HOẠT (SELL)' : 'OFF'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Exit theo forecast</span>
                <span className={`font-bold ${tickerOutput.forecast_exit_trigger === 1 ? 'text-rose-400' : 'text-muted-foreground'}`}>
                  {tickerOutput.forecast_exit_trigger === 1 ? 'KÍCH HOẠT (SELL)' : 'OFF'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right columns: Derived Metrics & Order Plan */}
        <div className="lg:col-span-2 space-y-6">
          {/* Derived Metrics Grid */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-lg">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-1.5">
              <FileSpreadsheet className="h-4 w-4 text-primary" />
              Chỉ số dự báo (Horizon: {config.horizon_days} ngày)
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {derivedMetrics.map((m) => (
                <div key={m.label} className="rounded-lg border border-border/40 bg-card/25 p-3 hover:bg-card/45 transition-colors group relative">
                  <span className="text-[10px] font-bold text-muted-foreground block mb-0.5">{m.label}</span>
                  <span className={`text-sm font-extrabold ${m.highlight ? 'text-primary' : 'text-foreground'}`}>
                    {m.val}
                  </span>
                  <div className="text-[9px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity absolute right-2 bottom-1 italic">
                    {m.help}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Execution Plan details */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                <Layers className="h-4 w-4 text-primary" />
                Kế hoạch thực thi ({tickerOutput.execution_mode_label})
              </h3>
              {tickerOutput.action_bucket !== ActionBucket.NO_ACTION && (
                <div className="text-xs font-semibold text-foreground">
                  Phân bổ mục tiêu:{' '}
                  <span className="font-extrabold text-primary">{(tickerOutput.target_weight_pct * 100).toFixed(1)}%</span>{' '}
                  (~${tickerOutput.target_value.toLocaleString(undefined, { maximumFractionDigits: 0 })})
                </div>
              )}
            </div>

            {/* Limit Prices summary */}
            <div className="grid gap-3 grid-cols-3 rounded-lg bg-secondary/35 border border-border/40 p-3 text-xs">
              <div>
                <span className="text-[9px] font-bold text-muted-foreground block mb-0.5">MUA GIỚI HẠN (LIMIT BUY)</span>
                <span className="font-extrabold text-foreground">{tickerOutput.limit_buy_price > 0 ? toCurr(tickerOutput.limit_buy_price) : '—'}</span>
              </div>
              <div>
                <span className="text-[9px] font-bold text-muted-foreground block mb-0.5">BÁN CHỐT LỜI (LIMIT SELL)</span>
                <span className="font-extrabold text-foreground">{tickerOutput.limit_sell_price > 0 ? toCurr(tickerOutput.limit_sell_price) : '—'}</span>
              </div>
              <div>
                <span className="text-[9px] font-bold text-rose-400 block mb-0.5">GIÁ DỪNG LỖ ACTIVE (STOP SL)</span>
                <span className="font-extrabold text-rose-400">{tickerOutput.active_stop_price > 0 ? toCurr(tickerOutput.active_stop_price) : '—'}</span>
              </div>
            </div>

            {/* DCA Plan Table */}
            {tickerOutput.execution_mode === ExecutionMode.DCA && tickerOutput.dca_plan.length > 0 && (
              <div className="space-y-2 border-t border-border/40 pt-3">
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider block flex items-center gap-1">
                  <Layers className="h-3.5 w-3.5 text-emerald-400" />
                  DCA Tranche Plan (Kế hoạch tích lũy)
                </span>
                <div className="overflow-x-auto rounded-lg border border-border/30 bg-card/10">
                  <table className="w-full text-left text-[11px] border-collapse">
                    <thead>
                      <tr className="bg-secondary/40 text-muted-foreground font-bold">
                        <th className="py-2 pl-2">Đợt (Tranche)</th>
                        <th className="py-2">Giá Trigger</th>
                        <th className="py-2 text-right">Khối lượng</th>
                        <th className="py-2 text-right">Ngân sách</th>
                        <th className="py-2 text-right">Hạn ngày tối đa</th>
                        <th className="py-2 text-right pr-2">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/20">
                      {tickerOutput.dca_plan.map((t) => (
                        <tr key={t.tranche_index} className="hover:bg-secondary/15 transition-colors">
                          <td className="py-2 pl-2 font-bold text-foreground">#{t.tranche_index}</td>
                          <td className="py-2 font-mono font-bold text-primary">{toCurr(t.trigger_price)}</td>
                          <td className="py-2 text-right font-mono font-semibold">{t.qty} CP</td>
                          <td className="py-2 text-right font-mono">${t.budget_value.toFixed(0)}</td>
                          <td className="py-2 text-right">Ngày {t.latest_execution_day}</td>
                          <td className="py-2 text-right pr-2 font-bold text-emerald-400">{t.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* GRID Plan Table */}
            {tickerOutput.execution_mode === ExecutionMode.GRID && tickerOutput.grid_plan.length > 0 && (
              <div className="space-y-2 border-t border-border/40 pt-3">
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider block flex items-center gap-1">
                  <Grid className="h-3.5 w-3.5 text-cyan-400" />
                  GRID Level Plan (Kế hoạch dao động lưới)
                </span>
                <div className="overflow-x-auto rounded-lg border border-border/30 bg-card/10">
                  <table className="w-full text-left text-[11px] border-collapse">
                    <thead>
                      <tr className="bg-secondary/40 text-muted-foreground font-bold">
                        <th className="py-2 pl-2">Mốc (Level)</th>
                        <th className="py-2">Hướng đi</th>
                        <th className="py-2">Giá lưới</th>
                        <th className="py-2 text-right">Khối lượng</th>
                        <th className="py-2 text-right">Giá trị notional</th>
                        <th className="py-2 text-right pr-2">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/20">
                      {tickerOutput.grid_plan.map((g) => (
                        <tr key={g.grid_index} className="hover:bg-secondary/15 transition-colors">
                          <td className="py-2 pl-2 font-bold text-foreground">Lưới {g.grid_index}</td>
                          <td className="py-2 font-bold">
                            <span className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-extrabold ${g.side === 1 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                              {g.side_label}
                            </span>
                          </td>
                          <td className="py-2 font-mono font-bold text-primary">{toCurr(g.grid_price)}</td>
                          <td className="py-2 text-right font-mono font-semibold">{g.qty} CP</td>
                          <td className="py-2 text-right font-mono">${g.notional.toFixed(0)}</td>
                          <td className="py-2 text-right pr-2 font-bold text-cyan-400">{g.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Remote Conditional Orders */}
            {tickerOutput.remote_orders.length > 0 && (
              <div className="space-y-2 border-t border-border/40 pt-3">
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider block flex items-center gap-1">
                  <ShieldAlert className="h-3.5 w-3.5 text-rose-400" />
                  Remote Conditional Order Plans (Lệnh tự động bảo vệ từ xa)
                </span>
                <div className="overflow-x-auto rounded-lg border border-border/30 bg-card/10">
                  <table className="w-full text-left text-[11px] border-collapse">
                    <thead>
                      <tr className="bg-secondary/40 text-muted-foreground font-bold">
                        <th className="py-2 pl-2">Mã lệnh</th>
                        <th className="py-2">Điều kiện Trigger</th>
                        <th className="py-2">Hành động</th>
                        <th className="py-2 text-right">Khối lượng</th>
                        <th className="py-2 text-right">Giá trần</th>
                        <th className="py-2 text-right pr-2">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/20">
                      {tickerOutput.remote_orders.map((r) => {
                        let triggerDesc = '';
                        if (r.trigger_type_code === 1) triggerDesc = `Giá <= $${r.trigger_price.toFixed(2)}`;
                        else if (r.trigger_type_code === 2) triggerDesc = `Giá >= $${r.trigger_price.toFixed(2)}`;
                        else if (r.trigger_type_code === 6) triggerDesc = `Portfolio DD >= ${(r.trigger_value * 100).toFixed(0)}%`;
                        else triggerDesc = `Condition type ${r.trigger_type_code}`;

                        let actionLabel = '';
                        if (r.remote_action_code === 3) actionLabel = 'BÁN THỊ TRƯỜNG SL';
                        else if (r.remote_action_code === 2) actionLabel = 'BÁN GIỚI HẠN TP';
                        else if (r.remote_action_code === 1) actionLabel = 'MUA GIỚI HẠN DISCOUNT';
                        else if (r.remote_action_code === 4) actionLabel = 'CANCEL PENDING BUYS';
                        else actionLabel = `Action code ${r.remote_action_code}`;

                        return (
                          <tr key={r.remote_order_id} className="hover:bg-secondary/15 transition-colors">
                            <td className="py-2 pl-2 font-semibold text-foreground truncate max-w-[90px]" title={r.remote_order_id}>
                              {r.remote_order_id.replace('ro_', '')}
                            </td>
                            <td className="py-2 font-medium">{triggerDesc}</td>
                            <td className="py-2 font-bold text-foreground">{actionLabel}</td>
                            <td className="py-2 text-right font-mono">{r.qty > 0 ? `${r.qty} CP` : '—'}</td>
                            <td className="py-2 text-right font-mono">{r.limit_price > 0 ? `$${r.limit_price.toFixed(2)}` : '—'}</td>
                            <td className="py-2 text-right pr-2 font-bold text-rose-400">{r.status}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Rule Audit / Rule Trace and reason codes */}
            <div className="space-y-2 border-t border-border/40 pt-3">
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider block flex items-center gap-1">
                <ListCollapse className="h-3.5 w-3.5 text-primary" />
                Nhật ký kiểm tra luật định lượng (Quantitative Audit)
              </span>
              <div className="rounded-lg border border-border/30 bg-card/25 p-3 font-mono text-[10px] space-y-1.5 leading-normal max-h-48 overflow-y-auto">
                <div className="flex flex-wrap gap-1 mb-2">
                  <span className="font-semibold text-muted-foreground">Reason Codes:</span>
                  {tickerOutput.reason_codes.map((code) => (
                    <span key={code} className="inline-block bg-primary/10 text-primary border border-primary/20 rounded px-1 text-[9px] font-bold">
                      {code}
                    </span>
                  ))}
                </div>
                <div className="space-y-1">
                  <div className="font-semibold text-muted-foreground border-b border-border/20 pb-0.5 mb-1.5">Rule Trace:</div>
                  {tickerOutput.rule_trace.map((trace, i) => (
                    <div key={i} className="text-foreground/90 pl-2 border-l border-primary/30">
                      [{i + 1}] {trace}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
