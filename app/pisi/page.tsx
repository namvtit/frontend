'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import {
  SlidersHorizontal,
  Briefcase,
  Play,
  RotateCcw,
  ArrowLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Info,
  ShieldAlert,
  ShieldCheck,
  Activity,
  Layers,
  Grid,
  FileSpreadsheet,
  ListCollapse,
  AlertTriangle,
  Badge,
} from 'lucide-react';
import { MARKET_FORECASTS } from '@/lib/pisi/data/marketForecasts';
import { resolvePreset } from '@/lib/pisi/presets';
import { runPisiEngine } from '@/lib/pisi/pisiEngine';
import type { PresetCode } from '@/lib/pisi/types/pisi';
import { PresetCode as PC, ActionBucket, ExecutionModeLabel, BlockCodeLabel, ExecutionMode } from '@/lib/pisi/types/pisi';
import { PisiScoreBreakdown } from '@/components/pisi/PisiScoreBreakdown';
import { PresetSelector } from '@/components/pisi/PresetSelector';

// Form inputs state type covering all editable quantitative parameters
interface QuantitativeConfigForm {
  horizon_days: number;
  rebalance_interval_days: number;
  reserved_cash_pct: number;
  max_gross_exposure_pct: number;
  max_holdings: number;
  max_position_pct: number;
  max_sector_pct: number;
  min_net_return_pct: number;
  target_net_return_pct: number;
  max_stock_drawdown_pct: number;
  max_portfolio_dd_pct: number;
  max_forecast_volatility_pct: number;
  min_risk_reward: number;
  risk_per_trade_pct: number;
  base_stop_loss_pct: number;
  trailing_stop_pct: number;
  take_profit_floor_pct: number;
  take_profit_cap_pct: number;
  rebalance_band_pct: number;
  cooldown_days_after_sell: number;
  portfolio_defense_multiplier: number;
  
  // Scores weights
  w_return: number;
  w_risk_reward: number;
  w_trend: number;
  w_drawdown: number;
  w_volatility: number;
  w_preference: number;

  // DCA
  dca_enabled: 0 | 1;
  dca_min_horizon_days: number;
  dca_budget_pct_of_target: number;
  dca_tranche_count: number;
  dca_interval_days: number;
  dca_first_trigger_discount_pct: number;
  dca_trigger_step_pct: number;
  dca_dip_weight: number;
  dca_order_expiry_days: number;

  // GRID
  grid_enabled: 0 | 1;
  grid_type: 1 | 2;
  grid_count: number;
  grid_budget_pct_of_target: number;
  grid_lower_cap_pct: number;
  grid_upper_cap_pct: number;
  grid_min_volatility_pct: number;
  grid_max_abs_net_return_pct: number;
  grid_max_path_efficiency: number;
  grid_order_expiry_days: number;

  // LIMIT / Remote
  limit_enabled: 0 | 1;
  max_entry_discount_pct: number;
  limit_order_expiry_days: number;
  remote_enabled: 0 | 1;
  remote_order_max_days: number;
  remote_reprice_band_pct: number;
  remote_score_recheck_threshold: number;
}

export default function PisiSimulatorPage() {
  const [selectedPreset, setSelectedPreset] = useState<PresetCode>(PC.STAND);
  const [selectedTicker, setSelectedTicker] = useState<string>('AAPL');
  const [formConfig, setFormConfig] = useState<QuantitativeConfigForm>(() => {
    const resolved = resolvePreset(PC.STAND, {});
    return resolved as unknown as QuantitativeConfigForm;
  });

  // Mock Portfolio Sandbox Data
  const [simNav, setSimNav] = useState<number>(100000);
  const [simCash, setSimCash] = useState<number>(80000);
  const [simPeakNav, setSimPeakNav] = useState<number>(100000);

  // Mock Position Sandbox Data for selected symbol
  const [simHoldingQty, setSimHoldingQty] = useState<number>(0);
  const [simAvgCost, setSimAvgCost] = useState<number>(0);
  const [simHighestPrice, setSimHighestPrice] = useState<number>(0);
  const [activePositionPreset, setActivePositionPreset] = useState<'none' | 'profitable' | 'loss' | 'stop_loss'>('none');

  // Get active forecast details
  const activeForecast = useMemo(() => {
    return MARKET_FORECASTS.find((f) => f.ticker === selectedTicker)!;
  }, [selectedTicker]);

  const applyPositionState = (type: 'none' | 'profitable' | 'loss' | 'stop_loss') => {
    setActivePositionPreset(type);
    const p0 = activeForecast.currentPrice;
    if (type === 'none') {
      setSimHoldingQty(0);
      setSimAvgCost(0);
      setSimHighestPrice(0);
    } else if (type === 'profitable') {
      setSimHoldingQty(100);
      setSimAvgCost(Number((p0 * 0.85).toFixed(2)));
      setSimHighestPrice(Number((p0 * 1.05).toFixed(2)));
    } else if (type === 'loss') {
      setSimHoldingQty(100);
      setSimAvgCost(Number((p0 * 1.12).toFixed(2)));
      setSimHighestPrice(Number((p0 * 1.12).toFixed(2)));
    } else if (type === 'stop_loss') {
      setSimHoldingQty(100);
      setSimAvgCost(Number((p0 * 1.25).toFixed(2)));
      setSimHighestPrice(Number((p0 * 1.25).toFixed(2)));
    }
  };

  useEffect(() => {
    if (activePositionPreset !== 'none') {
      const p0 = activeForecast.currentPrice;
      if (activePositionPreset === 'profitable') {
        setSimAvgCost(Number((p0 * 0.85).toFixed(2)));
        setSimHighestPrice(Number((p0 * 1.05).toFixed(2)));
      } else if (activePositionPreset === 'loss') {
        setSimAvgCost(Number((p0 * 1.12).toFixed(2)));
        setSimHighestPrice(Number((p0 * 1.12).toFixed(2)));
      } else if (activePositionPreset === 'stop_loss') {
        setSimAvgCost(Number((p0 * 1.25).toFixed(2)));
        setSimHighestPrice(Number((p0 * 1.25).toFixed(2)));
      }
    }
  }, [selectedTicker, activePositionPreset, activeForecast.currentPrice]);
  
  // Custom Ticker flags
  const [simFavoriteScore, setSimFavoriteScore] = useState<number>(0);
  const [simExcludeFlag, setSimExcludeFlag] = useState<0 | 1>(0);
  const [simModelQuality, setSimModelQuality] = useState<number>(1.0);

  // Re-load parameters whenever user clicks a preset mode button
  const handlePresetChange = (code: PresetCode) => {
    setSelectedPreset(code);
    const resolved = resolvePreset(code, {});
    setFormConfig(resolved as unknown as QuantitativeConfigForm);
  };

  const handleResetOverrides = () => {
    handlePresetChange(selectedPreset);
  };

  const handleInputChange = (field: keyof QuantitativeConfigForm, value: number) => {
    setFormConfig((prev) => ({
      ...prev,
      [field]: value,
    }));
  };


  // Compute total signal weight to print warnings if not exactly equal to 1.0
  const weightsSum = useMemo(() => {
    return (
      formConfig.w_return +
      formConfig.w_risk_reward +
      formConfig.w_trend +
      formConfig.w_drawdown +
      formConfig.w_volatility +
      formConfig.w_preference
    );
  }, [
    formConfig.w_return,
    formConfig.w_risk_reward,
    formConfig.w_trend,
    formConfig.w_drawdown,
    formConfig.w_volatility,
    formConfig.w_preference,
  ]);

  // Run the PISI Engine simulation in real-time
  const simulationResult = useMemo(() => {
    // Construct ResolvedConfig payload matching engine spec
    const currentDd = simPeakNav > 0 ? Math.max(0, 1 - simNav / simPeakNav) : 0;
    const fullConfig = {
      ...formConfig,
      run_id: `sim_${Date.now()}`,
      preset_code: selectedPreset,
      preset_version: 1,
      custom_override_count: 0,
      as_of_ts: Date.now(),
      currency_code: 704, // VND
      forecast_days_available: 600,
      trading_days_per_year: 252,
      fee_pct: 0.0015, // 0.15% standard
      slippage_pct: 0.001, // 0.1% slippage
      price_tick: 0.1,
      lot_size: 1,
      min_order_notional: 10,
      nav: simNav,
      cash: simCash,
      peak_nav: simPeakNav,
      current_portfolio_dd: currentDd,
    };

    const tickerInput = {
      ticker: activeForecast.ticker,
      sector_id: activeForecast.sectorId,
      p0: activeForecast.currentPrice,
      forecast_price: activeForecast.forecastAdjClose600,
      holding_qty: simHoldingQty,
      avg_cost: simAvgCost,
      highest_price_since_entry: simHoldingQty > 0 ? (simHighestPrice || activeForecast.currentPrice) : 0,
      favorite_score: simFavoriteScore,
      exclude_flag: simExcludeFlag,
      model_quality_score: simModelQuality,
      days_since_last_sell: 999,
      liquidity_score: 1.0,
    };

    try {
      const output = runPisiEngine(fullConfig as any, [tickerInput]);
      const tickerOutput = output.ticker_outputs[0];
      return {
        tickerOutput,
        portfolioOutput: output,
        error: null,
      };
    } catch (err: any) {
      return {
        tickerOutput: null,
        portfolioOutput: null,
        error: err?.message || 'Simulation error',
      };
    }
  }, [
    formConfig,
    selectedPreset,
    activeForecast,
    simNav,
    simCash,
    simPeakNav,
    simHoldingQty,
    simAvgCost,
    simHighestPrice,
    simFavoriteScore,
    simExcludeFlag,
    simModelQuality,
  ]);

  const output = simulationResult.tickerOutput;
  const error = simulationResult.error;

  return (
    <div className="min-h-screen bg-background text-foreground fade-in">
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-12 items-start">
          
          {/* LEFT SIDE: CONTROL PANEL AND CONFIG FORMS */}
          <div className="lg:col-span-5 space-y-6">
            <div className="rounded-xl border border-border/80 bg-card/60 backdrop-blur-md p-5 shadow-lg space-y-5">
              
              {/* Asset Select dropdown */}
              <div>
                <label className="text-[10px] font-bold text-muted-foreground block mb-2 uppercase tracking-widest">
                  1. Chọn tài sản phân tích
                </label>
                <select
                  value={selectedTicker}
                  onChange={(e) => setSelectedTicker(e.target.value)}
                  className="input w-full bg-background border-border text-foreground font-semibold"
                >
                  {MARKET_FORECASTS.map((f) => (
                    <option key={f.ticker} value={f.ticker}>
                      {f.ticker} — {f.name} (Giá P0: ${f.currentPrice})
                    </option>
                  ))}
                </select>
              </div>

              {/* Preset buttons select */}
              <div>
                <label className="text-[10px] font-bold text-muted-foreground block mb-2.5 uppercase tracking-widest">
                  2. Chọn cấu hình preset
                </label>
                <PresetSelector
                  selectedPreset={selectedPreset}
                  onChange={handlePresetChange}
                  customOverrides={{}}
                  onResetOverrides={handleResetOverrides}
                />
              </div>

              {/* Editable Quantitative Form fields */}
              <div className="border-t border-border/60 pt-4 space-y-4 max-h-[50vh] overflow-y-auto pr-1">
                <span className="text-[10px] font-black text-primary uppercase block tracking-wider mb-2">
                  3. Tùy chỉnh thông số đầu vào
                </span>

                {/* Section Sandbox: Portfolio & Position Simulation Data */}
                <div className="space-y-4 bg-primary/5 border border-primary/10 rounded-lg p-3">
                  <div className="flex flex-col gap-2 border-b border-primary/20 pb-2">
                    <span className="text-[9px] font-black text-primary uppercase tracking-widest block">
                      GIẢ LẬP DANH MỤC & VỊ THẾ
                    </span>
                    
                    {/* Quick Position presets */}
                    <div className="space-y-1 mt-1">
                      <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-wider block">
                        Chọn vị thế nhanh:
                      </span>
                      <div className="grid grid-cols-2 gap-1">
                        <button
                          type="button"
                          onClick={() => applyPositionState('none')}
                          className={`py-1 px-1.5 rounded text-[10px] font-black border transition-all cursor-pointer text-center ${
                            activePositionPreset === 'none'
                              ? 'bg-slate-500/10 text-slate-400 border-slate-500/50 ring-1 ring-slate-500/25'
                              : 'bg-background/80 text-muted-foreground border-border/50 hover:bg-secondary'
                          }`}
                        >
                          ❌ Chưa sở hữu (No shares)
                        </button>
                        <button
                          type="button"
                          onClick={() => applyPositionState('profitable')}
                          className={`py-1 px-1.5 rounded text-[10px] font-black border transition-all cursor-pointer text-center ${
                            activePositionPreset === 'profitable'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/50 ring-1 ring-emerald-500/25'
                              : 'bg-background/80 text-muted-foreground border-border/50 hover:bg-secondary'
                          }`}
                        >
                          📈 Có sẵn (Đang Lãi)
                        </button>
                        <button
                          type="button"
                          onClick={() => applyPositionState('loss')}
                          className={`py-1 px-1.5 rounded text-[10px] font-black border transition-all cursor-pointer text-center ${
                            activePositionPreset === 'loss'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/50 ring-1 ring-amber-500/25'
                              : 'bg-background/80 text-muted-foreground border-border/50 hover:bg-secondary'
                          }`}
                        >
                          📉 Có sẵn (Đang Lỗ)
                        </button>
                        <button
                          type="button"
                          onClick={() => applyPositionState('stop_loss')}
                          className={`py-1 px-1.5 rounded text-[10px] font-black border transition-all cursor-pointer text-center ${
                            activePositionPreset === 'stop_loss'
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/50 ring-1 ring-rose-500/25'
                              : 'bg-background/80 text-muted-foreground border-border/50 hover:bg-secondary'
                          }`}
                        >
                          ⚠️ Cắt lỗ (SL Trigger)
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="block text-muted-foreground mb-1 text-[10px]">Tài sản NAV ($)</label>
                      <input
                        type="number"
                        min="0"
                        value={simNav}
                        onChange={(e) => setSimNav(parseFloat(e.target.value) || 0)}
                        className="input w-full text-foreground bg-background py-1 px-2 font-mono text-xs border-border/40"
                      />
                    </div>
                    <div>
                      <label className="block text-muted-foreground mb-1 text-[10px]">Số dư Cash ($)</label>
                      <input
                        type="number"
                        min="0"
                        value={simCash}
                        onChange={(e) => setSimCash(parseFloat(e.target.value) || 0)}
                        className="input w-full text-foreground bg-background py-1 px-2 font-mono text-xs border-border/40"
                      />
                    </div>
                    <div>
                      <label className="block text-muted-foreground mb-1 text-[10px]">Đỉnh NAV lịch sử ($)</label>
                      <input
                        type="number"
                        min="0"
                        value={simPeakNav}
                        onChange={(e) => setSimPeakNav(parseFloat(e.target.value) || 0)}
                        className="input w-full text-foreground bg-background py-1 px-2 font-mono text-xs border-border/40"
                      />
                    </div>
                    <div>
                      <label className="block text-muted-foreground mb-1 text-[10px]">Số lượng CP nắm giữ</label>
                      <input
                        type="number"
                        min="0"
                        value={simHoldingQty}
                        onChange={(e) => {
                          setSimHoldingQty(parseInt(e.target.value) || 0);
                          setActivePositionPreset('none');
                        }}
                        className="input w-full text-foreground bg-background py-1 px-2 font-mono text-xs border-border/40"
                      />
                    </div>
                    <div>
                      <label className="block text-muted-foreground mb-1 text-[10px]">Giá vốn TB ($)</label>
                      <input
                        type="number"
                        min="0"
                        value={simAvgCost}
                        onChange={(e) => {
                          setSimAvgCost(parseFloat(e.target.value) || 0);
                          setActivePositionPreset('none');
                        }}
                        className="input w-full text-foreground bg-background py-1 px-2 font-mono text-xs border-border/40"
                      />
                    </div>
                    <div>
                      <label className="block text-muted-foreground mb-1 text-[10px]">Giá cao nhất mua ($)</label>
                      <input
                        type="number"
                        min="0"
                        value={simHighestPrice}
                        onChange={(e) => {
                          setSimHighestPrice(parseFloat(e.target.value) || 0);
                          setActivePositionPreset('none');
                        }}
                        className="input w-full text-foreground bg-background py-1 px-2 font-mono text-xs border-border/40"
                      />
                    </div>
                    <div>
                      <label className="block text-muted-foreground mb-1 text-[10px]">Model Quality (0..1) <span className="text-primary font-bold">[S5]</span></label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="1"
                        value={simModelQuality}
                        onChange={(e) => setSimModelQuality(parseFloat(e.target.value) || 1.0)}
                        className="input w-full text-foreground bg-background py-1 px-2 font-mono text-xs border-border/40"
                      />
                    </div>
                    <div>
                      <label className="block text-muted-foreground mb-1 text-[10px]">Mã loại trừ (Exclude)</label>
                      <select
                        value={simExcludeFlag}
                        onChange={(e) => setSimExcludeFlag(parseInt(e.target.value) as 0 | 1)}
                        className="input w-full bg-background py-1 px-2 text-xs border-border/40"
                      >
                        <option value={0}>Không loại trừ</option>
                        <option value={1}>Loại trừ (Exclude)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Section A: Core parameters */}
                <div className="space-y-3">
                  <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block border-b border-border/30 pb-1">
                    CƠ BẢN & PHÂN BỔ (CORE)
                  </span>
                  
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-muted-foreground mb-1">Horizon (ngày H)</label>
                      <input
                        type="number"
                        min="1"
                        max="600"
                        value={formConfig.horizon_days}
                        onChange={(e) => handleInputChange('horizon_days', parseInt(e.target.value) || 90)}
                        className="input w-full text-foreground bg-background py-1.5 px-2.5 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-muted-foreground mb-1">Tần suất rebalance (ngày)</label>
                      <input
                        type="number"
                        min="1"
                        value={formConfig.rebalance_interval_days}
                        onChange={(e) => handleInputChange('rebalance_interval_days', parseInt(e.target.value) || 5)}
                        className="input w-full text-foreground bg-background py-1.5 px-2.5 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-muted-foreground mb-1">Dự phòng mặt (reserved %) <span className="text-primary font-bold">[S1]</span></label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="1"
                        value={formConfig.reserved_cash_pct}
                        onChange={(e) => handleInputChange('reserved_cash_pct', parseFloat(e.target.value) || 0)}
                        className="input w-full text-foreground bg-background py-1.5 px-2.5 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-muted-foreground mb-1">Exposure tối đa (cap %) <span className="text-primary font-bold">[S1]</span></label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="1.5"
                        value={formConfig.max_gross_exposure_pct}
                        onChange={(e) => handleInputChange('max_gross_exposure_pct', parseFloat(e.target.value) || 0.9)}
                        className="input w-full text-foreground bg-background py-1.5 px-2.5 font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Section B: Risk constraints */}
                <div className="space-y-3 pt-2">
                  <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block border-b border-border/30 pb-1">
                    HẠN CHẾ RỦI RO (RISK GATES)
                  </span>
                  
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-muted-foreground mb-1">Return ròng tối thiểu (%) <span className="text-primary font-bold">[S1]/[S2]</span></label>
                      <input
                        type="number"
                        step="0.005"
                        value={formConfig.min_net_return_pct}
                        onChange={(e) => handleInputChange('min_net_return_pct', parseFloat(e.target.value) || 0.04)}
                        className="input w-full text-foreground bg-background py-1.5 px-2.5 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-muted-foreground mb-1">Lợi nhuận mục tiêu (%) <span className="text-primary font-bold">[S1]</span></label>
                      <input
                        type="number"
                        step="0.01"
                        value={formConfig.target_net_return_pct}
                        onChange={(e) => handleInputChange('target_net_return_pct', parseFloat(e.target.value) || 0.08)}
                        className="input w-full text-foreground bg-background py-1.5 px-2.5 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-muted-foreground mb-1">MDD tối đa mã (%) <span className="text-primary font-bold">[S2]</span></label>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        max="1"
                        value={formConfig.max_stock_drawdown_pct}
                        onChange={(e) => handleInputChange('max_stock_drawdown_pct', parseFloat(e.target.value) || 0.12)}
                        className="input w-full text-foreground bg-background py-1.5 px-2.5 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-muted-foreground mb-1">Biến động tối đa (%) <span className="text-primary font-bold">[S2]</span></label>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={formConfig.max_forecast_volatility_pct}
                        onChange={(e) => handleInputChange('max_forecast_volatility_pct', parseFloat(e.target.value) || 0.18)}
                        className="input w-full text-foreground bg-background py-1.5 px-2.5 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-muted-foreground mb-1">Dừng lỗ cơ bản (SL %) <span className="text-primary font-bold">[S2]</span></label>
                      <input
                        type="number"
                        step="0.005"
                        min="0"
                        max="0.5"
                        value={formConfig.base_stop_loss_pct}
                        onChange={(e) => handleInputChange('base_stop_loss_pct', parseFloat(e.target.value) || 0.07)}
                        className="input w-full text-foreground bg-background py-1.5 px-2.5 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-muted-foreground mb-1">Tỷ lệ rủi ro/lệnh (%) <span className="text-primary font-bold">[S4]</span></label>
                      <input
                        type="number"
                        step="0.001"
                        min="0"
                        max="0.05"
                        value={formConfig.risk_per_trade_pct}
                        onChange={(e) => handleInputChange('risk_per_trade_pct', parseFloat(e.target.value) || 0.01)}
                        className="input w-full text-foreground bg-background py-1.5 px-2.5 font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Section C: Score weights */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between border-b border-border/30 pb-1">
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block">
                      TRỌNG SỐ TÍN HIỆU (SCORE WEIGHTS) <span className="text-primary font-bold">[S5]</span>
                    </span>
                    <span className={`text-[9px] font-bold ${Math.abs(weightsSum - 1.0) < 1e-6 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      Tổng: {weightsSum.toFixed(2)} (phải = 1.0)
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-muted-foreground mb-1">w_return</label>
                      <input
                        type="number"
                        step="0.05"
                        min="0"
                        max="1"
                        value={formConfig.w_return}
                        onChange={(e) => handleInputChange('w_return', parseFloat(e.target.value) || 0)}
                        className="input w-full text-foreground bg-background py-1.5 px-2.5 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-muted-foreground mb-1">w_risk_reward</label>
                      <input
                        type="number"
                        step="0.05"
                        min="0"
                        max="1"
                        value={formConfig.w_risk_reward}
                        onChange={(e) => handleInputChange('w_risk_reward', parseFloat(e.target.value) || 0)}
                        className="input w-full text-foreground bg-background py-1.5 px-2.5 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-muted-foreground mb-1">w_trend</label>
                      <input
                        type="number"
                        step="0.05"
                        min="0"
                        max="1"
                        value={formConfig.w_trend}
                        onChange={(e) => handleInputChange('w_trend', parseFloat(e.target.value) || 0)}
                        className="input w-full text-foreground bg-background py-1.5 px-2.5 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-muted-foreground mb-1">w_drawdown</label>
                      <input
                        type="number"
                        step="0.05"
                        min="0"
                        max="1"
                        value={formConfig.w_drawdown}
                        onChange={(e) => handleInputChange('w_drawdown', parseFloat(e.target.value) || 0)}
                        className="input w-full text-foreground bg-background py-1.5 px-2.5 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-muted-foreground mb-1">w_volatility</label>
                      <input
                        type="number"
                        step="0.05"
                        min="0"
                        max="1"
                        value={formConfig.w_volatility}
                        onChange={(e) => handleInputChange('w_volatility', parseFloat(e.target.value) || 0)}
                        className="input w-full text-foreground bg-background py-1.5 px-2.5 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-muted-foreground mb-1">w_preference</label>
                      <input
                        type="number"
                        step="0.05"
                        min="0"
                        max="1"
                        value={formConfig.w_preference}
                        onChange={(e) => handleInputChange('w_preference', parseFloat(e.target.value) || 0)}
                        className="input w-full text-foreground bg-background py-1.5 px-2.5 font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Section D: DCA strategy configuration */}
                <div className="space-y-3 pt-2">
                  <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block border-b border-border/30 pb-1">
                    KẾ HOẠCH DỰ PHÒNG DCA <span className="text-primary font-bold">[S3]</span>
                  </span>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-muted-foreground mb-1">Kích hoạt DCA</label>
                      <select
                        value={formConfig.dca_enabled}
                        onChange={(e) => handleInputChange('dca_enabled', parseInt(e.target.value) as 0 | 1)}
                        className="input w-full bg-background"
                      >
                        <option value={1}>BẬT (ON)</option>
                        <option value={0}>TẮT (OFF)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-muted-foreground mb-1">Số đợt (Tranche count)</label>
                      <input
                        type="number"
                        min="2"
                        value={formConfig.dca_tranche_count}
                        onChange={(e) => handleInputChange('dca_tranche_count', parseInt(e.target.value) || 4)}
                        className="input w-full text-foreground bg-background py-1.5 px-2.5 font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Section E: GRID strategy configuration */}
                <div className="space-y-3 pt-2">
                  <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block border-b border-border/30 pb-1">
                    CHIẾN LƯỢC DAO ĐỘNG GRID <span className="text-primary font-bold">[S3]</span>
                  </span>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-muted-foreground mb-1">Kích hoạt GRID</label>
                      <select
                        value={formConfig.grid_enabled}
                        onChange={(e) => handleInputChange('grid_enabled', parseInt(e.target.value) as 0 | 1)}
                        className="input w-full bg-background"
                      >
                        <option value={1}>BẬT (ON)</option>
                        <option value={0}>TẮT (OFF)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-muted-foreground mb-1">Loại lưới (Grid Type)</label>
                      <select
                        value={formConfig.grid_type}
                        onChange={(e) => handleInputChange('grid_type', parseInt(e.target.value) as 1 | 2)}
                        className="input w-full bg-background"
                      >
                        <option value={1}>Arithmetic (Cộng)</option>
                        <option value={2}>Geometric (Nhân)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-muted-foreground mb-1">Số lưới (Levels count)</label>
                      <input
                        type="number"
                        min="2"
                        value={formConfig.grid_count}
                        onChange={(e) => handleInputChange('grid_count', parseInt(e.target.value) || 6)}
                        className="input w-full text-foreground bg-background py-1.5 px-2.5 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-muted-foreground mb-1">Lower Cap (%)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formConfig.grid_lower_cap_pct}
                        onChange={(e) => handleInputChange('grid_lower_cap_pct', parseFloat(e.target.value) || 0.1)}
                        className="input w-full text-foreground bg-background py-1.5 px-2.5 font-mono"
                      />
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* RIGHT SIDE: REAL-TIME RESPONSE MATRIX */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Display validation or system failures */}
            {error && (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-5 text-rose-500 flex items-start gap-3">
                <AlertTriangle className="h-6 w-6 shrink-0" />
                <div>
                  <h4 className="font-bold text-sm">Lỗi cấu hình toán học:</h4>
                  <p className="text-xs leading-relaxed mt-1 font-mono">{error}</p>
                </div>
              </div>
            )}

            {output && (
              <div className="space-y-6">
                
                {/* 1. Main Action Bucket and Execution Mode */}
                <div className="rounded-xl border border-border bg-card p-5 shadow-lg">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-0.5">
                        Tín hiệu đề xuất
                      </span>
                      <div className="flex items-center gap-2">
                        {output.action_bucket === ActionBucket.BUY ? (
                          <span className="rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 px-3 py-1 text-md font-black tracking-wider">
                            BUY (MUA)
                          </span>
                        ) : output.action_bucket === ActionBucket.SELL ? (
                          <span className="rounded bg-rose-500/15 border border-rose-500/30 text-rose-400 px-3 py-1 text-md font-black tracking-wider">
                            SELL (BÁN)
                          </span>
                        ) : (
                          <span className="rounded bg-slate-500/15 border border-slate-500/30 text-slate-400 px-3 py-1 text-md font-black tracking-wider">
                            NO ACTION
                          </span>
                        )}
                        <span className="text-muted-foreground">/</span>
                        <span className="rounded bg-primary/15 border border-primary/30 text-primary px-3 py-1 text-md font-extrabold tracking-wider">
                          {output.execution_mode_label}
                        </span>
                      </div>
                    </div>

                    <div className="sm:text-right">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-0.5">
                        Target Sizing
                      </span>
                      <div className="text-lg font-black text-foreground">
                        {output.final_buy_qty > 0 ? `+${output.final_buy_qty} cổ phiếu` : 
                         output.final_sell_qty > 0 ? `-${output.final_sell_qty} cổ phiếu` : 'Không mở vị thế'}
                      </div>
                      <div className="text-[10px] text-muted-foreground font-semibold mt-0.5">
                        Tỷ trọng: {(output.target_weight_pct * 100).toFixed(1)}% (Notional: ${output.estimated_order_notional.toFixed(0)})
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Derived metrics and core statistics */}
                <div className="rounded-xl border border-border bg-card p-5 shadow-lg">
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-1.5">
                    <FileSpreadsheet className="h-4 w-4 text-primary" />
                    Chỉ số Derived Path Metrics (Section 3) <span className="text-primary font-bold">[S2]</span>
                  </h3>
                  
                  <div className="grid gap-3 grid-cols-2 sm:grid-cols-4 text-xs">
                    <div className="rounded-lg border border-border/40 bg-card/25 p-3">
                      <span className="text-[9px] font-bold text-muted-foreground block mb-0.5">Lợi nhuận ròng <span className="text-primary font-bold">[S1]</span></span>
                      <span className="text-sm font-extrabold text-foreground">{(output.net_return_pct * 100).toFixed(2)}%</span>
                      <span className="block text-[8px] text-muted-foreground mt-0.5 font-mono">Net return</span>
                    </div>
                    <div className="rounded-lg border border-border/40 bg-card/25 p-3">
                      <span className="text-[9px] font-bold text-muted-foreground block mb-0.5">Risk / Reward <span className="text-primary font-bold">[S4]</span></span>
                      <span className="text-sm font-extrabold text-primary">{output.risk_reward.toFixed(2)}</span>
                      <span className="block text-[8px] text-muted-foreground mt-0.5 font-mono">Upside / Downside</span>
                    </div>
                    <div className="rounded-lg border border-border/40 bg-card/25 p-3">
                      <span className="text-[9px] font-bold text-muted-foreground block mb-0.5">Sụt giảm dự báo (MDD) <span className="text-primary font-bold">[S2]</span></span>
                      <span className="text-sm font-extrabold text-foreground">{(output.forecast_max_drawdown_pct * 100).toFixed(2)}%</span>
                      <span className="block text-[8px] text-muted-foreground mt-0.5 font-mono">Max path drawdown</span>
                    </div>
                    <div className="rounded-lg border border-border/40 bg-card/25 p-3">
                      <span className="text-[9px] font-bold text-muted-foreground block mb-0.5">Biến động (Volatility) <span className="text-primary font-bold">[S2]</span></span>
                      <span className="text-sm font-extrabold text-foreground">{(output.forecast_volatility_pct * 100).toFixed(1)}%</span>
                      <span className="block text-[8px] text-muted-foreground mt-0.5 font-mono">Annualized: {(output.annualized_forecast_volatility_pct * 100).toFixed(0)}%</span>
                    </div>
                  </div>

                  <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 text-xs mt-3">
                    <div className="rounded-lg border border-border/40 bg-card/25 p-3">
                      <span className="text-[9px] font-bold text-muted-foreground block mb-0.5">Forecast Peak</span>
                      <span className="text-sm font-bold text-foreground">${output.forecast_peak_price.toFixed(2)}</span>
                      <span className="block text-[8px] text-muted-foreground mt-0.5 font-mono">Ngày đỉnh: {output.forecast_peak_day}</span>
                    </div>
                    <div className="rounded-lg border border-border/40 bg-card/25 p-3">
                      <span className="text-[9px] font-bold text-muted-foreground block mb-0.5">Forecast Trough</span>
                      <span className="text-sm font-bold text-foreground">${output.forecast_trough_price.toFixed(2)}</span>
                      <span className="block text-[8px] text-muted-foreground mt-0.5 font-mono">Ngày đáy: {output.forecast_trough_day}</span>
                    </div>
                    <div className="rounded-lg border border-border/40 bg-card/25 p-3">
                      <span className="text-[9px] font-bold text-muted-foreground block mb-0.5">Path Efficiency</span>
                      <span className="text-sm font-bold text-foreground">{output.path_efficiency.toFixed(2)}</span>
                      <span className="block text-[8px] text-muted-foreground mt-0.5 font-mono">Amplitude: {(output.path_amplitude_pct * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                </div>

                {/* 3. Signal Score widget */}
                <div className="rounded-xl border border-border bg-card p-5 shadow-lg">
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-1.5">
                    <Activity className="h-4 w-4 text-primary" />
                    Biểu đồ thành phần tín hiệu
                  </h3>
                  <PisiScoreBreakdown tickerOutput={output} config={formConfig as any} />
                </div>

                {/* 4. DCA Schedules tables */}
                {output.execution_mode === ExecutionMode.DCA && output.dca_plan.length > 0 && (
                  <div className="rounded-xl border border-border bg-card p-5 shadow-lg space-y-3">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                      <Layers className="h-4 w-4 text-emerald-400" />
                      Kế hoạch giải ngân DCA <span className="text-primary font-bold">[S3]</span>
                    </h3>
                    <div className="overflow-x-auto rounded-lg border border-border/30 bg-card/10">
                      <table className="w-full text-left text-[11px] border-collapse">
                        <thead>
                          <tr className="bg-secondary/40 text-muted-foreground font-bold">
                            <th className="py-2.5 pl-3">Đợt</th>
                            <th className="py-2.5">Giá Trigger</th>
                            <th className="py-2.5 text-right">Khối lượng</th>
                            <th className="py-2.5 text-right">Ngân sách</th>
                            <th className="py-2.5 text-right pr-3">Hạn tối đa</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/20">
                          {output.dca_plan.map((t) => (
                            <tr key={t.tranche_index} className="hover:bg-secondary/15 transition-colors">
                              <td className="py-2.5 pl-3 font-bold text-foreground">#{t.tranche_index}</td>
                              <td className="py-2.5 font-mono font-bold text-primary">${t.trigger_price.toFixed(2)}</td>
                              <td className="py-2.5 text-right font-mono font-semibold">{t.qty} CP</td>
                              <td className="py-2.5 text-right font-mono">${t.budget_value.toFixed(0)}</td>
                              <td className="py-2.5 text-right pr-3">Ngày {t.latest_execution_day}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* 5. GRID Schedules tables */}
                {output.execution_mode === ExecutionMode.GRID && output.grid_plan.length > 0 && (
                  <div className="rounded-xl border border-border bg-card p-5 shadow-lg space-y-3">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                      <Grid className="h-4 w-4 text-cyan-400" />
                      Lưới dao động GRID <span className="text-primary font-bold">[S3]</span>
                    </h3>
                    <div className="overflow-x-auto rounded-lg border border-border/30 bg-card/10">
                      <table className="w-full text-left text-[11px] border-collapse">
                        <thead>
                          <tr className="bg-secondary/40 text-muted-foreground font-bold">
                            <th className="py-2.5 pl-3">Mốc</th>
                            <th className="py-2.5">Loại lệnh</th>
                            <th className="py-2.5">Giá lưới</th>
                            <th className="py-2.5 text-right">Khối lượng</th>
                            <th className="py-2.5 text-right pr-3">Trạng thái</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/20">
                          {output.grid_plan.map((g) => (
                            <tr key={g.grid_index} className="hover:bg-secondary/15 transition-colors">
                              <td className="py-2.5 pl-3 font-bold text-foreground">Level {g.grid_index}</td>
                              <td className="py-2.5 font-bold">
                                <span className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-extrabold ${g.side === 1 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                                  {g.side_label}
                                </span>
                              </td>
                              <td className="py-2.5 font-mono font-bold text-primary">${g.grid_price.toFixed(2)}</td>
                              <td className="py-2.5 text-right font-mono font-semibold">{g.qty} CP</td>
                              <td className="py-2.5 text-right pr-3 font-bold text-cyan-400">{g.status}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* 6. Remote Safeguard Orders list */}
                {output.remote_orders.length > 0 && (
                  <div className="rounded-xl border border-border bg-card p-5 shadow-lg space-y-3">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                      <ShieldCheck className="h-4 w-4 text-rose-400" />
                      Lệnh điều kiện bảo vệ từ xa (Remote Conditional Orders) <span className="text-primary font-bold">[S2]/[S3]</span>
                    </h3>
                    <div className="overflow-x-auto rounded-lg border border-border/30 bg-card/10">
                      <table className="w-full text-left text-[11px] border-collapse">
                        <thead>
                          <tr className="bg-secondary/40 text-muted-foreground font-bold">
                            <th className="py-2.5 pl-3">ID lệnh</th>
                            <th className="py-2.5">Điều kiện Trigger</th>
                            <th className="py-2.5">Hành động</th>
                            <th className="py-2.5 text-right pr-3">Khối lượng</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/20">
                          {output.remote_orders.map((r) => {
                            let triggerDesc = '';
                            if (r.trigger_type_code === 1) triggerDesc = `Giá <= $${r.trigger_price.toFixed(2)}`;
                            else if (r.trigger_type_code === 2) triggerDesc = `Giá >= $${r.trigger_price.toFixed(2)}`;
                            else if (r.trigger_type_code === 6) triggerDesc = `Portfolio DD >= ${(r.trigger_value * 100).toFixed(0)}%`;
                            else triggerDesc = `Condition ${r.trigger_type_code}`;

                            let actionLabel = '';
                            if (r.remote_action_code === 3) actionLabel = 'SELL MARKET PROTECTIVE';
                            else if (r.remote_action_code === 2) actionLabel = 'SELL LIMIT TP';
                            else if (r.remote_action_code === 1) actionLabel = 'BUY LIMIT DISCOUNT';
                            else if (r.remote_action_code === 4) actionLabel = 'CANCEL PENDING BUYS';
                            else actionLabel = `Action code ${r.remote_action_code}`;

                            return (
                              <tr key={r.remote_order_id} className="hover:bg-secondary/15 transition-colors">
                                <td className="py-2.5 pl-3 font-semibold text-foreground font-mono">{r.remote_order_id.replace('ro_', '')}</td>
                                <td className="py-2.5 font-medium">{triggerDesc}</td>
                                <td className="py-2.5 font-bold text-foreground">{actionLabel}</td>
                                <td className="py-2.5 text-right pr-3 font-mono">{r.qty > 0 ? `${r.qty} CP` : '—'}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* 7. Rule Audit and traces */}
                <div className="rounded-xl border border-border bg-card p-5 shadow-lg space-y-3">
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                    <ListCollapse className="h-4 w-4 text-primary" />
                    Nhật ký Quantitative Rules Audit Log <span className="text-primary font-bold">[S1]-[S5]</span>
                  </h3>
                  <div className="rounded-lg border border-border/30 bg-card/25 p-4 font-mono text-[10px] space-y-2 leading-relaxed max-h-48 overflow-y-auto">
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      <span className="font-semibold text-muted-foreground">Reason Codes:</span>
                      {output.reason_codes.map((code) => (
                        <span key={code} className="inline-block bg-primary/10 text-primary border border-primary/20 rounded px-1.5 py-0.5 text-[9px] font-bold">
                          {code}
                        </span>
                      ))}
                    </div>
                    <div className="space-y-1">
                      <div className="font-semibold text-muted-foreground border-b border-border/20 pb-0.5 mb-1.5">Rule Trace logs:</div>
                      {output.rule_trace.map((trace, i) => (
                        <div key={i} className="text-foreground/90 pl-2 border-l border-primary/30">
                          [{i + 1}] {trace}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

              </div>
            )}

          </div>

        </div>

        {/* SECTION: ACADEMIC REFERENCE BIBLIOGRAPHY */}
        <section className="mt-12 border-t border-border/80 bg-card/25 rounded-2xl p-6 md:p-8 space-y-6">
          <div className="space-y-2">
            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <Info className="h-4.5 w-4.5 text-primary" />
              Nguồn gốc Công thức & Mô hình Lý thuyết (Engine Methodology)
            </h2>
            <p className="text-xs text-muted-foreground max-w-3xl leading-relaxed">
              Các chỉ số định lượng, quy tắc giải ngân và hạn mức rủi ro trong FinPilot Engine được nghiên cứu và thiết lập dựa trên các công trình tài chính học thuật kinh kinh điển:
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {/* S1 */}
            <div className="rounded-xl border border-border/60 bg-card/40 p-4 space-y-2.5 flex flex-col justify-between hover:border-primary/30 transition-colors">
              <div className="space-y-2">
                <span className="inline-flex items-center rounded bg-blue-500/10 px-2 py-0.5 text-[9px] font-black text-blue-400 border border-blue-500/20">
                  [S1] Markowitz (1952)
                </span>
                <h4 className="text-xs font-bold text-foreground">Lý thuyết Danh mục Hiện đại (MPT)</h4>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Thiết lập nền tảng cho việc cân đối tỷ trọng vốn tối ưu (Target Weight), tỷ lệ dự phòng tiền mặt (Reserved Cash) và giới hạn tỷ trọng vị thế tối đa (Exposure Limit).
                </p>
              </div>
              <div className="text-[10px] text-primary/70 font-semibold border-t border-border/40 pt-2 font-mono">
                Applied: Core Allocation
              </div>
            </div>

            {/* S2 */}
            <div className="rounded-xl border border-border/60 bg-card/40 p-4 space-y-2.5 flex flex-col justify-between hover:border-primary/30 transition-colors">
              <div className="space-y-2">
                <span className="inline-flex items-center rounded bg-emerald-500/10 px-2 py-0.5 text-[9px] font-black text-emerald-400 border border-emerald-500/20">
                  [S2] Rockafellar & Uryasev (2000)
                </span>
                <h4 className="text-xs font-bold text-foreground">Tối ưu hóa Downside Risk</h4>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Cơ sở toán học cho việc tính toán sụt giảm tối đa (Max Path Drawdown), các chốt chặn rủi ro (Risk Gates) và lệnh bán bảo vệ (Remote Stop Loss) tự động.
                </p>
              </div>
              <div className="text-[10px] text-emerald-400/70 font-semibold border-t border-border/40 pt-2 font-mono">
                Applied: Risk Constraints
              </div>
            </div>

            {/* S3 */}
            <div className="rounded-xl border border-border/60 bg-card/40 p-4 space-y-2.5 flex flex-col justify-between hover:border-primary/30 transition-colors">
              <div className="space-y-2">
                <span className="inline-flex items-center rounded bg-amber-500/10 px-2 py-0.5 text-[9px] font-black text-amber-400 border border-amber-500/20">
                  [S3] Almgren & Chriss (2000)
                </span>
                <h4 className="text-xs font-bold text-foreground">Thực thi Giao dịch Tối ưu</h4>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Mô hình tính toán chi phí trượt giá (Slippage) và phí giao dịch, phân tách khối lượng giải ngân thành các mức giá kích hoạt DCA hoặc lưới GRID tối ưu.
                </p>
              </div>
              <div className="text-[10px] text-amber-400/70 font-semibold border-t border-border/40 pt-2 font-mono">
                Applied: DCA & GRID Plans
              </div>
            </div>

            {/* S4 */}
            <div className="rounded-xl border border-border/60 bg-card/40 p-4 space-y-2.5 flex flex-col justify-between hover:border-primary/30 transition-colors">
              <div className="space-y-2">
                <span className="inline-flex items-center rounded bg-purple-500/10 px-2 py-0.5 text-[9px] font-black text-purple-400 border border-purple-500/20">
                  [S4] Kelly (1956)
                </span>
                <h4 className="text-xs font-bold text-foreground">Tiêu chuẩn Kelly (Kelly Criterion)</h4>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Xác định quy mô vị thế mua tối đa dựa trên tỷ lệ lợi nhuận/rủi ro kỳ vọng (Risk/Reward) và giới hạn tỷ lệ thua lỗ trên mỗi lệnh (Risk per Trade).
                </p>
              </div>
              <div className="text-[10px] text-purple-400/70 font-semibold border-t border-border/40 pt-2 font-mono">
                Applied: Position Sizing
              </div>
            </div>

            {/* S5 */}
            <div className="rounded-xl border border-border/60 bg-card/40 p-4 space-y-2.5 flex flex-col justify-between hover:border-primary/30 transition-colors">
              <div className="space-y-2">
                <span className="inline-flex items-center rounded bg-cyan-500/10 px-2 py-0.5 text-[9px] font-black text-cyan-400 border border-cyan-500/20">
                  [S5] Bailey et al. (2015)
                </span>
                <h4 className="text-xs font-bold text-foreground">Kiểm định Walk-Forward chéo</h4>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Thiết lập cơ chế kiểm định chất lượng mô hình dự báo (Model Quality Score), từ đó điều chỉnh trọng số tín hiệu hoặc loại trừ hoàn toàn mã khỏi rebalance.
                </p>
              </div>
              <div className="text-[10px] text-cyan-400/70 font-semibold border-t border-border/40 pt-2 font-mono">
                Applied: Model Validation
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
