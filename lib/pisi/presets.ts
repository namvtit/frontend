// ── PISI Preset Profiles ──
// Section 2.0: ECO / STAND / SPEED / WAVE / GUARD
// Each preset is a frozen numeric configuration object.

import type {
  PisiResolvedConfig,
  PisiScoreWeights,
  PresetCode,
} from './types/pisi';
import { PresetCode as PC } from './types/pisi';

// ═══════════════════════════════════════════════════════════════
// Section 2.0.3 — Parameter defaults per preset
// ═══════════════════════════════════════════════════════════════

interface PresetParams {
  // Core
  horizon_days: number;
  rebalance_interval_days: number;
  reserved_cash_pct: number;
  max_gross_exposure_pct: number;
  max_holdings: number;
  max_position_pct: number;
  max_sector_pct: number;
  // Risk
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
  // Score weights
  weights: PisiScoreWeights;
  // Execution — LIMIT
  limit_enabled: 0 | 1;
  max_entry_discount_pct: number;
  limit_order_expiry_days: number;
  // Execution — DCA
  dca_enabled: 0 | 1;
  dca_min_horizon_days: number;
  dca_budget_pct_of_target: number;
  dca_tranche_count: number;
  dca_interval_days: number;
  dca_first_trigger_discount_pct: number;
  dca_trigger_step_pct: number;
  dca_dip_weight: number;
  // Execution — GRID
  grid_enabled: 0 | 1;
  grid_type: 1 | 2;
  grid_count: number;
  grid_budget_pct_of_target: number;
  grid_lower_cap_pct: number;
  grid_upper_cap_pct: number;
  grid_min_volatility_pct: number;
  grid_max_abs_net_return_pct: number;
  grid_max_path_efficiency: number;
  // Execution — Remote
  remote_enabled: 0 | 1;
  remote_order_max_days: number;
  remote_reprice_band_pct: number;
  remote_score_recheck_threshold: number;
}

const ECO: PresetParams = {
  horizon_days: 180, rebalance_interval_days: 20,
  reserved_cash_pct: 0.20, max_gross_exposure_pct: 0.80,
  max_holdings: 10, max_position_pct: 0.10, max_sector_pct: 0.25,
  min_net_return_pct: 0.06, target_net_return_pct: 0.12,
  max_stock_drawdown_pct: 0.10, max_portfolio_dd_pct: 0.12,
  max_forecast_volatility_pct: 0.14, min_risk_reward: 1.80,
  risk_per_trade_pct: 0.0075, base_stop_loss_pct: 0.06,
  trailing_stop_pct: 0.08, take_profit_floor_pct: 0.08,
  take_profit_cap_pct: 0.20, rebalance_band_pct: 0.020,
  cooldown_days_after_sell: 10, portfolio_defense_multiplier: 0.50,
  weights: { w_return: 0.40, w_risk_reward: 0.20, w_trend: 0.10, w_drawdown: 0.15, w_volatility: 0.10, w_preference: 0.05 },
  limit_enabled: 1, max_entry_discount_pct: 0.04, limit_order_expiry_days: 30,
  dca_enabled: 1, dca_min_horizon_days: 60, dca_budget_pct_of_target: 0.60,
  dca_tranche_count: 6, dca_interval_days: 20, dca_first_trigger_discount_pct: 0.015, dca_trigger_step_pct: 0.020, dca_dip_weight: 0.50,
  grid_enabled: 0, grid_type: 1, grid_count: 0, grid_budget_pct_of_target: 0,
  grid_lower_cap_pct: 0, grid_upper_cap_pct: 0, grid_min_volatility_pct: 0, grid_max_abs_net_return_pct: 0, grid_max_path_efficiency: 0,
  remote_enabled: 1, remote_order_max_days: 180, remote_reprice_band_pct: 0.12, remote_score_recheck_threshold: 25,
};

const STAND: PresetParams = {
  horizon_days: 90, rebalance_interval_days: 5,
  reserved_cash_pct: 0.10, max_gross_exposure_pct: 0.90,
  max_holdings: 12, max_position_pct: 0.12, max_sector_pct: 0.30,
  min_net_return_pct: 0.04, target_net_return_pct: 0.08,
  max_stock_drawdown_pct: 0.12, max_portfolio_dd_pct: 0.15,
  max_forecast_volatility_pct: 0.18, min_risk_reward: 1.50,
  risk_per_trade_pct: 0.0100, base_stop_loss_pct: 0.07,
  trailing_stop_pct: 0.10, take_profit_floor_pct: 0.06,
  take_profit_cap_pct: 0.18, rebalance_band_pct: 0.010,
  cooldown_days_after_sell: 5, portfolio_defense_multiplier: 0.50,
  weights: { w_return: 0.40, w_risk_reward: 0.18, w_trend: 0.12, w_drawdown: 0.15, w_volatility: 0.10, w_preference: 0.05 },
  limit_enabled: 1, max_entry_discount_pct: 0.03, limit_order_expiry_days: 15,
  dca_enabled: 1, dca_min_horizon_days: 45, dca_budget_pct_of_target: 0.50,
  dca_tranche_count: 4, dca_interval_days: 15, dca_first_trigger_discount_pct: 0.010, dca_trigger_step_pct: 0.015, dca_dip_weight: 0.30,
  grid_enabled: 0, grid_type: 1, grid_count: 0, grid_budget_pct_of_target: 0,
  grid_lower_cap_pct: 0, grid_upper_cap_pct: 0, grid_min_volatility_pct: 0, grid_max_abs_net_return_pct: 0, grid_max_path_efficiency: 0,
  remote_enabled: 1, remote_order_max_days: 90, remote_reprice_band_pct: 0.08, remote_score_recheck_threshold: 20,
};

const SPEED: PresetParams = {
  horizon_days: 20, rebalance_interval_days: 1,
  reserved_cash_pct: 0.15, max_gross_exposure_pct: 0.85,
  max_holdings: 6, max_position_pct: 0.08, max_sector_pct: 0.20,
  min_net_return_pct: 0.025, target_net_return_pct: 0.05,
  max_stock_drawdown_pct: 0.06, max_portfolio_dd_pct: 0.08,
  max_forecast_volatility_pct: 0.10, min_risk_reward: 1.70,
  risk_per_trade_pct: 0.0050, base_stop_loss_pct: 0.035,
  trailing_stop_pct: 0.045, take_profit_floor_pct: 0.03,
  take_profit_cap_pct: 0.08, rebalance_band_pct: 0.005,
  cooldown_days_after_sell: 3, portfolio_defense_multiplier: 0.35,
  weights: { w_return: 0.33, w_risk_reward: 0.22, w_trend: 0.22, w_drawdown: 0.13, w_volatility: 0.08, w_preference: 0.02 },
  limit_enabled: 1, max_entry_discount_pct: 0.015, limit_order_expiry_days: 5,
  dca_enabled: 0, dca_min_horizon_days: 999, dca_budget_pct_of_target: 0,
  dca_tranche_count: 0, dca_interval_days: 0, dca_first_trigger_discount_pct: 0, dca_trigger_step_pct: 0, dca_dip_weight: 0,
  grid_enabled: 0, grid_type: 1, grid_count: 0, grid_budget_pct_of_target: 0,
  grid_lower_cap_pct: 0, grid_upper_cap_pct: 0, grid_min_volatility_pct: 0, grid_max_abs_net_return_pct: 0, grid_max_path_efficiency: 0,
  remote_enabled: 1, remote_order_max_days: 20, remote_reprice_band_pct: 0.04, remote_score_recheck_threshold: 35,
};

const WAVE: PresetParams = {
  horizon_days: 45, rebalance_interval_days: 1,
  reserved_cash_pct: 0.20, max_gross_exposure_pct: 0.75,
  max_holdings: 8, max_position_pct: 0.09, max_sector_pct: 0.25,
  min_net_return_pct: 0.010, target_net_return_pct: 0.03,
  max_stock_drawdown_pct: 0.09, max_portfolio_dd_pct: 0.10,
  max_forecast_volatility_pct: 0.18, min_risk_reward: 1.10,
  risk_per_trade_pct: 0.0075, base_stop_loss_pct: 0.06,
  trailing_stop_pct: 0.08, take_profit_floor_pct: 0.04,
  take_profit_cap_pct: 0.12, rebalance_band_pct: 0.010,
  cooldown_days_after_sell: 5, portfolio_defense_multiplier: 0.45,
  weights: { w_return: 0.20, w_risk_reward: 0.10, w_trend: 0.15, w_drawdown: 0.25, w_volatility: 0.25, w_preference: 0.05 },
  limit_enabled: 1, max_entry_discount_pct: 0.03, limit_order_expiry_days: 10,
  dca_enabled: 0, dca_min_horizon_days: 999, dca_budget_pct_of_target: 0,
  dca_tranche_count: 0, dca_interval_days: 0, dca_first_trigger_discount_pct: 0, dca_trigger_step_pct: 0, dca_dip_weight: 0,
  grid_enabled: 1, grid_type: 2, grid_count: 6, grid_budget_pct_of_target: 0.60,
  grid_lower_cap_pct: 0.10, grid_upper_cap_pct: 0.10, grid_min_volatility_pct: 0.08, grid_max_abs_net_return_pct: 0.04, grid_max_path_efficiency: 0.45,
  remote_enabled: 1, remote_order_max_days: 45, remote_reprice_band_pct: 0.08, remote_score_recheck_threshold: 20,
};

const GUARD: PresetParams = {
  horizon_days: 180, rebalance_interval_days: 5,
  reserved_cash_pct: 0.35, max_gross_exposure_pct: 0.65,
  max_holdings: 8, max_position_pct: 0.08, max_sector_pct: 0.20,
  min_net_return_pct: 0.05, target_net_return_pct: 0.10,
  max_stock_drawdown_pct: 0.07, max_portfolio_dd_pct: 0.08,
  max_forecast_volatility_pct: 0.10, min_risk_reward: 2.00,
  risk_per_trade_pct: 0.0050, base_stop_loss_pct: 0.04,
  trailing_stop_pct: 0.05, take_profit_floor_pct: 0.07,
  take_profit_cap_pct: 0.15, rebalance_band_pct: 0.020,
  cooldown_days_after_sell: 10, portfolio_defense_multiplier: 0.30,
  weights: { w_return: 0.30, w_risk_reward: 0.25, w_trend: 0.05, w_drawdown: 0.25, w_volatility: 0.10, w_preference: 0.05 },
  limit_enabled: 1, max_entry_discount_pct: 0.04, limit_order_expiry_days: 20,
  dca_enabled: 0, dca_min_horizon_days: 999, dca_budget_pct_of_target: 0,
  dca_tranche_count: 0, dca_interval_days: 0, dca_first_trigger_discount_pct: 0, dca_trigger_step_pct: 0, dca_dip_weight: 0,
  grid_enabled: 0, grid_type: 1, grid_count: 0, grid_budget_pct_of_target: 0,
  grid_lower_cap_pct: 0, grid_upper_cap_pct: 0, grid_min_volatility_pct: 0, grid_max_abs_net_return_pct: 0, grid_max_path_efficiency: 0,
  remote_enabled: 1, remote_order_max_days: 180, remote_reprice_band_pct: 0.06, remote_score_recheck_threshold: 30,
};

const PRESET_MAP: Record<PresetCode, PresetParams> = {
  [PC.ECO]: ECO,
  [PC.STAND]: STAND,
  [PC.SPEED]: SPEED,
  [PC.WAVE]: WAVE,
  [PC.GUARD]: GUARD,
};

// ═══════════════════════════════════════════════════════════════
// Preset Resolver — Section 2.0.6
// ═══════════════════════════════════════════════════════════════

/** System defaults that don't vary by preset */
const SYSTEM_DEFAULTS = {
  forecast_days_available: 600,
  trading_days_per_year: 252,
  fee_pct: 0.0015,       // 0.15%
  slippage_pct: 0.001,   // 0.10%
  price_tick: 0.01,
  lot_size: 1,
  min_order_notional: 10,
  currency_code: 840,    // USD
  dca_order_expiry_days: 30,
  grid_order_expiry_days: 30,
} as const;

export interface PresetOverrides {
  [key: string]: number;
}

/**
 * Resolve a preset code + optional numeric overrides into a full PisiResolvedConfig.
 * Section 2.0.6 steps:
 * 1. Load preset by code
 * 2. Apply system defaults
 * 3. Apply user numeric overrides (if profile_locked = 0)
 * 4. Validate
 */
export function resolvePreset(
  presetCode: PresetCode,
  overrides?: PresetOverrides,
  profileLocked = false,
): PisiResolvedConfig {
  const preset = PRESET_MAP[presetCode];
  if (!preset) throw new Error(`Unknown preset_code: ${presetCode}`);

  const base: PisiResolvedConfig = {
    // System (will be filled by caller or defaults)
    run_id: '',
    preset_code: presetCode,
    preset_version: 1,
    custom_override_count: 0,
    as_of_ts: Date.now(),
    currency_code: SYSTEM_DEFAULTS.currency_code,
    forecast_days_available: SYSTEM_DEFAULTS.forecast_days_available,
    horizon_days: preset.horizon_days,
    rebalance_interval_days: preset.rebalance_interval_days,
    trading_days_per_year: SYSTEM_DEFAULTS.trading_days_per_year,
    fee_pct: SYSTEM_DEFAULTS.fee_pct,
    slippage_pct: SYSTEM_DEFAULTS.slippage_pct,
    price_tick: SYSTEM_DEFAULTS.price_tick,
    lot_size: SYSTEM_DEFAULTS.lot_size,
    min_order_notional: SYSTEM_DEFAULTS.min_order_notional,

    // Portfolio
    nav: 0,
    cash: 0,
    peak_nav: 0,
    reserved_cash_pct: preset.reserved_cash_pct,
    current_portfolio_dd: 0,
    max_portfolio_dd_pct: preset.max_portfolio_dd_pct,
    max_holdings: preset.max_holdings,
    max_sector_pct: preset.max_sector_pct,
    max_position_pct: preset.max_position_pct,
    max_gross_exposure_pct: preset.max_gross_exposure_pct,

    // Risk
    min_net_return_pct: preset.min_net_return_pct,
    target_net_return_pct: preset.target_net_return_pct,
    max_stock_drawdown_pct: preset.max_stock_drawdown_pct,
    max_forecast_volatility_pct: preset.max_forecast_volatility_pct,
    min_risk_reward: preset.min_risk_reward,
    risk_per_trade_pct: preset.risk_per_trade_pct,
    base_stop_loss_pct: preset.base_stop_loss_pct,
    trailing_stop_pct: preset.trailing_stop_pct,
    take_profit_floor_pct: preset.take_profit_floor_pct,
    take_profit_cap_pct: preset.take_profit_cap_pct,
    rebalance_band_pct: preset.rebalance_band_pct,
    cooldown_days_after_sell: preset.cooldown_days_after_sell,
    portfolio_defense_multiplier: preset.portfolio_defense_multiplier,

    // Weights
    ...preset.weights,

    // DCA
    dca_enabled: preset.dca_enabled,
    dca_min_horizon_days: preset.dca_min_horizon_days,
    dca_budget_pct_of_target: preset.dca_budget_pct_of_target,
    dca_tranche_count: preset.dca_tranche_count,
    dca_interval_days: preset.dca_interval_days,
    dca_first_trigger_discount_pct: preset.dca_first_trigger_discount_pct,
    dca_trigger_step_pct: preset.dca_trigger_step_pct,
    dca_dip_weight: preset.dca_dip_weight,
    dca_order_expiry_days: SYSTEM_DEFAULTS.dca_order_expiry_days,

    // GRID
    grid_enabled: preset.grid_enabled,
    grid_type: preset.grid_type,
    grid_count: preset.grid_count,
    grid_budget_pct_of_target: preset.grid_budget_pct_of_target,
    grid_lower_cap_pct: preset.grid_lower_cap_pct,
    grid_upper_cap_pct: preset.grid_upper_cap_pct,
    grid_min_volatility_pct: preset.grid_min_volatility_pct,
    grid_max_abs_net_return_pct: preset.grid_max_abs_net_return_pct,
    grid_max_path_efficiency: preset.grid_max_path_efficiency,
    grid_order_expiry_days: SYSTEM_DEFAULTS.grid_order_expiry_days,

    // LIMIT & Remote
    limit_enabled: preset.limit_enabled,
    max_entry_discount_pct: preset.max_entry_discount_pct,
    limit_order_expiry_days: preset.limit_order_expiry_days,
    remote_enabled: preset.remote_enabled,
    remote_order_max_days: preset.remote_order_max_days,
    remote_reprice_band_pct: preset.remote_reprice_band_pct,
    remote_score_recheck_threshold: preset.remote_score_recheck_threshold,
  };

  // Step 3: Apply user overrides
  let overrideCount = 0;
  if (overrides && !profileLocked) {
    for (const [key, val] of Object.entries(overrides)) {
      if (key in base && typeof val === 'number' && !isNaN(val)) {
        // Skip readonly system fields
        if (['run_id', 'preset_code', 'preset_version', 'as_of_ts'].includes(key)) continue;
        (base as any)[key] = val;
        overrideCount++;
      }
    }
  }
  base.custom_override_count = overrideCount;

  // Step 4: Validate
  validateResolvedConfig(base);

  return base;
}

/** Validate resolved config */
function validateResolvedConfig(cfg: PisiResolvedConfig): void {
  // Score weights must sum to 1.0
  const wSum = cfg.w_return + cfg.w_risk_reward + cfg.w_trend + cfg.w_drawdown + cfg.w_volatility + cfg.w_preference;
  if (Math.abs(wSum - 1.0) > 0.001) {
    throw new Error(`Score weights sum to ${wSum}, must be 1.0`);
  }

  // Horizon within forecast range
  if (cfg.horizon_days < 1 || cfg.horizon_days > cfg.forecast_days_available) {
    throw new Error(`horizon_days ${cfg.horizon_days} out of range [1, ${cfg.forecast_days_available}]`);
  }

  // Normalize disabled strategies
  if (cfg.dca_enabled === 0) {
    cfg.dca_budget_pct_of_target = 0;
    cfg.dca_tranche_count = 0;
    cfg.dca_interval_days = 0;
  }
  if (cfg.grid_enabled === 0) {
    cfg.grid_count = 0;
    cfg.grid_budget_pct_of_target = 0;
  }
}

/** Get the preset's UI description */
export function getPresetDescription(code: PresetCode): string {
  const descs: Record<PresetCode, string> = {
    [PC.ECO]: 'Ít giao dịch, giữ cash cao, ưu tiên entry tốt và tiết kiệm chi phí. Hợp với horizon dài.',
    [PC.STAND]: 'Cấu hình cân bằng: return, risk và turnover ở mức vừa.',
    [PC.SPEED]: 'Phản ứng nhanh với forecast ngắn hạn; stop chặt, tập trung ít mã.',
    [PC.WAVE]: 'Phù hợp forecast sideway/dao động; dùng grid khi path đủ range-bound.',
    [PC.GUARD]: 'Phòng thủ: giữ cash cao, giới hạn rủi ro, ưu tiên bảo toàn vốn.',
  };
  return descs[code];
}

/** Get the preset's preferred execution modes */
export function getPresetExecutionHint(code: PresetCode): string {
  const hints: Record<PresetCode, string> = {
    [PC.ECO]: 'LIMIT + DCA + Remote protection',
    [PC.STAND]: 'LIMIT, có thể DCA',
    [PC.SPEED]: 'MARKET/LIMIT ngắn hạn + Remote stop',
    [PC.WAVE]: 'GRID + LIMIT',
    [PC.GUARD]: 'LIMIT, Remote stop, ít mở vị thế',
  };
  return hints[code];
}

export { PRESET_MAP, SYSTEM_DEFAULTS };
