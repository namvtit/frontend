// ── PISI Engine Types ──
// All TypeScript interfaces, enums, and constants for the
// Forecast-Informed, Risk-Constrained Trading & Portfolio Engine.
// Spec Sections 2–9.

// ═══════════════════════════════════════════════════════════════
// Enums & Constants
// ═══════════════════════════════════════════════════════════════

/** Section 7.1 — action bucket codes */
export const ActionBucket = {
  NO_ACTION: 0,
  BUY: 1,
  SELL: 2,
} as const;
export type ActionBucket = (typeof ActionBucket)[keyof typeof ActionBucket];

export const ActionLabel: Record<ActionBucket, string> = {
  [ActionBucket.NO_ACTION]: 'NO_ACTION',
  [ActionBucket.BUY]: 'BUY',
  [ActionBucket.SELL]: 'SELL',
};

/** Section 8 — execution mode codes */
export const ExecutionMode = {
  NONE: 0,
  MARKET: 1,
  LIMIT: 2,
  DCA: 3,
  GRID: 4,
  REMOTE_CONDITIONAL: 5,
} as const;
export type ExecutionMode = (typeof ExecutionMode)[keyof typeof ExecutionMode];

export const ExecutionModeLabel: Record<ExecutionMode, string> = {
  [ExecutionMode.NONE]: 'NONE',
  [ExecutionMode.MARKET]: 'MARKET',
  [ExecutionMode.LIMIT]: 'LIMIT',
  [ExecutionMode.DCA]: 'DCA',
  [ExecutionMode.GRID]: 'GRID',
  [ExecutionMode.REMOTE_CONDITIONAL]: 'REMOTE_CONDITIONAL',
};

/** Section 9.6 — block codes */
export const BlockCode = {
  NONE: 0,
  INVALID_FORECAST: 901,
  CASH_CONSTRAINT: 902,
  PORTFOLIO_DD_GUARD: 903,
  STOCK_DD_LIMIT: 904,
  VOLATILITY_LIMIT: 905,
  RETURN_BELOW_THRESHOLD: 906,
  RISK_REWARD_BELOW_THRESHOLD: 907,
  SECTOR_CAP: 908,
  POSITION_CAP: 909,
  COOLDOWN_ACTIVE: 910,
  REBALANCE_BAND: 911,
  GRID_NOT_SUITABLE: 912,
} as const;
export type BlockCode = (typeof BlockCode)[keyof typeof BlockCode];

export const BlockCodeLabel: Record<number, string> = {
  0: 'NONE',
  901: 'INVALID_FORECAST',
  902: 'CASH_CONSTRAINT',
  903: 'PORTFOLIO_DD_GUARD',
  904: 'STOCK_DD_LIMIT',
  905: 'VOLATILITY_LIMIT',
  906: 'RETURN_BELOW_THRESHOLD',
  907: 'RISK_REWARD_BELOW_THRESHOLD',
  908: 'SECTOR_CAP',
  909: 'POSITION_CAP',
  910: 'COOLDOWN_ACTIVE',
  911: 'REBALANCE_BAND',
  912: 'GRID_NOT_SUITABLE',
};

/** Section 8.4 — remote trigger codes */
export const TriggerTypeCode = {
  PRICE_BELOW: 1,
  PRICE_ABOVE: 2,
  TIME_AFTER: 3,
  SCORE_ABOVE: 4,
  SCORE_BELOW: 5,
  PORTFOLIO_DD_ABOVE: 6,
} as const;
export type TriggerTypeCode = (typeof TriggerTypeCode)[keyof typeof TriggerTypeCode];

/** Section 8.4 — remote action codes */
export const RemoteActionCode = {
  BUY_LIMIT: 1,
  SELL_LIMIT: 2,
  SELL_MARKET_PROTECTIVE: 3,
  CANCEL_PENDING_BUYS: 4,
  REBALANCE_TO_TARGET: 5,
} as const;
export type RemoteActionCode = (typeof RemoteActionCode)[keyof typeof RemoteActionCode];

/** Section 2.0.2 — preset codes */
export const PresetCode = {
  ECO: 1,
  STAND: 2,
  SPEED: 3,
  WAVE: 4,
  GUARD: 5,
} as const;
export type PresetCode = (typeof PresetCode)[keyof typeof PresetCode];

export const PresetLabel: Record<PresetCode, string> = {
  [PresetCode.ECO]: 'ECO',
  [PresetCode.STAND]: 'STAND',
  [PresetCode.SPEED]: 'SPEED',
  [PresetCode.WAVE]: 'WAVE',
  [PresetCode.GUARD]: 'GUARD',
};

export const PresetFullName: Record<PresetCode, string> = {
  [PresetCode.ECO]: 'Efficient Capital Optimizer',
  [PresetCode.STAND]: 'Standard Balance Engine',
  [PresetCode.SPEED]: 'Signal Pulse Execution Drive',
  [PresetCode.WAVE]: 'Volatility-Aware Range Engine',
  [PresetCode.GUARD]: 'Downside Guard Protocol',
};

/** Grid type */
export const GridType = { ARITHMETIC: 1, GEOMETRIC: 2 } as const;
export type GridType = (typeof GridType)[keyof typeof GridType];

// ═══════════════════════════════════════════════════════════════
// Input Interfaces
// ═══════════════════════════════════════════════════════════════

/** Section 2.1 — system-level config */
export interface PisiSystemConfig {
  run_id: string;
  preset_code: PresetCode;
  preset_version: number;
  custom_override_count: number;
  as_of_ts: number;
  currency_code: number;
  forecast_days_available: number;
  horizon_days: number;
  rebalance_interval_days: number;
  trading_days_per_year: number;
  fee_pct: number;
  slippage_pct: number;
  price_tick: number;
  lot_size: number;
  min_order_notional: number;
}

/** Section 2.2 — portfolio / account input */
export interface PisiPortfolioInput {
  nav: number;
  cash: number;
  peak_nav: number;
  reserved_cash_pct: number;
  current_portfolio_dd: number; // derived: max(0, 1 - nav / peak_nav)
  max_portfolio_dd_pct: number;
  max_holdings: number;
  max_sector_pct: number;
  max_position_pct: number;
  max_gross_exposure_pct: number;
}

/** Section 2.3 — risk profile */
export interface PisiRiskProfile {
  min_net_return_pct: number;
  target_net_return_pct: number;
  max_stock_drawdown_pct: number;
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
}

/** Section 2.4 — score weights (must sum to 1.0) */
export interface PisiScoreWeights {
  w_return: number;
  w_risk_reward: number;
  w_trend: number;
  w_drawdown: number;
  w_volatility: number;
  w_preference: number;
}

/** Section 2.5 — per-ticker input */
export interface PisiTickerInput {
  ticker: string;
  sector_id: number;
  p0: number;
  forecast_price: number[]; // F[0..600]; F[0] = p0
  holding_qty: number;
  avg_cost: number;
  highest_price_since_entry: number;
  favorite_score: number; // [-1, 1]
  exclude_flag: 0 | 1;
  model_quality_score: number; // (0, 1]
  days_since_last_sell: number;
  liquidity_score: number; // [0, 1]
}

/** Section 2.6 — DCA config */
export interface PisiDcaConfig {
  dca_enabled: 0 | 1;
  dca_min_horizon_days: number;
  dca_budget_pct_of_target: number;
  dca_tranche_count: number;
  dca_interval_days: number;
  dca_first_trigger_discount_pct: number;
  dca_trigger_step_pct: number;
  dca_dip_weight: number;
  dca_order_expiry_days: number;
}

/** Section 2.7 — GRID config */
export interface PisiGridConfig {
  grid_enabled: 0 | 1;
  grid_type: GridType;
  grid_count: number;
  grid_budget_pct_of_target: number;
  grid_lower_cap_pct: number;
  grid_upper_cap_pct: number;
  grid_min_volatility_pct: number;
  grid_max_abs_net_return_pct: number;
  grid_max_path_efficiency: number;
  grid_order_expiry_days: number;
}

/** Section 2.8 — LIMIT & remote config */
export interface PisiLimitRemoteConfig {
  limit_enabled: 0 | 1;
  max_entry_discount_pct: number;
  limit_order_expiry_days: number;
  remote_enabled: 0 | 1;
  remote_order_max_days: number;
  remote_reprice_band_pct: number;
  remote_score_recheck_threshold: number;
}

/** Fully resolved config after preset + overrides */
export interface PisiResolvedConfig
  extends PisiSystemConfig,
    PisiPortfolioInput,
    PisiRiskProfile,
    PisiScoreWeights,
    PisiDcaConfig,
    PisiGridConfig,
    PisiLimitRemoteConfig {}

// ═══════════════════════════════════════════════════════════════
// Derived Metrics — Section 3
// ═══════════════════════════════════════════════════════════════

export interface PisiDerivedMetrics {
  forecast_return_pct: number;
  net_return_pct: number;
  forecast_volatility_pct: number;
  annualized_forecast_volatility_pct: number;
  forecast_max_drawdown_pct: number;
  forecast_peak_price: number;
  forecast_trough_price: number;
  forecast_peak_day: number;
  forecast_trough_day: number;
  upside_pct: number;
  downside_pct: number;
  risk_reward: number;
  positive_day_ratio: number;
  trend_score_raw: number;
  path_efficiency: number;
  path_amplitude_pct: number;
  // Existing position metrics
  current_position_value: number;
  current_weight_pct: number;
  unrealized_pnl_value: number;
  unrealized_pnl_pct: number;
  forecast_position_pnl_value: number;
  forecast_position_pnl_pct: number;
}

// ═══════════════════════════════════════════════════════════════
// Output Interfaces — Section 9
// ═══════════════════════════════════════════════════════════════

/** Section 9.3 — DCA tranche output */
export interface PisiDcaTranche {
  tranche_index: number;
  trigger_price: number;
  latest_execution_day: number;
  budget_value: number;
  qty: number;
  expiry_ts: number;
  status: 'PLANNED' | 'EXECUTED' | 'CANCELLED';
}

/** Section 9.4 — GRID level output */
export interface PisiGridLevel {
  grid_index: number;
  side: 1 | 2; // 1=BUY, 2=SELL
  side_label: 'BUY' | 'SELL';
  grid_price: number;
  qty: number;
  notional: number;
  expiry_ts: number;
  status: 'PLANNED' | 'EXECUTED' | 'CANCELLED';
}

/** Section 9.5 — remote conditional order output */
export interface PisiRemoteOrder {
  remote_order_id: string;
  oco_group_id: string;
  trigger_type_code: TriggerTypeCode;
  trigger_price: number;
  trigger_value: number;
  remote_action_code: RemoteActionCode;
  order_type_code: number;
  order_type_label: string;
  side_code: 1 | 2; // 1=BUY, 2=SELL
  side_label: 'BUY' | 'SELL';
  qty: number;
  limit_price: number;
  expiry_ts: number;
  cancel_if_score_below: number;
  status: 'PLANNED' | 'ACTIVE' | 'TRIGGERED' | 'CANCELLED';
}

/** Section 9.2 — per-ticker output */
export interface PisiTickerOutput {
  ticker: string;
  sector_id: number;

  // Decision
  action_bucket: ActionBucket;
  action_label: string;
  execution_mode: ExecutionMode;
  execution_mode_label: string;
  rank: number;
  preset_code: PresetCode;
  preset_label: string;
  custom_override_count: number;

  // Gates
  valid_forecast: 0 | 1;
  buy_eligible: 0 | 1;
  dca_eligible: 0 | 1;
  grid_eligible: 0 | 1;
  portfolio_risk_guard: 0 | 1;
  stop_triggered: 0 | 1;
  forecast_exit_trigger: 0 | 1;

  // Prices
  current_price: number;
  avg_cost: number;
  forecast_end_price: number;
  forecast_peak_price: number;
  forecast_peak_day: number;
  forecast_trough_price: number;
  forecast_trough_day: number;

  // Metrics
  forecast_return_pct: number;
  net_return_pct: number;
  forecast_volatility_pct: number;
  annualized_forecast_volatility_pct: number;
  forecast_max_drawdown_pct: number;
  upside_pct: number;
  downside_pct: number;
  risk_reward: number;
  positive_day_ratio: number;
  trend_score_raw: number;
  path_efficiency: number;
  path_amplitude_pct: number;

  // Scores
  signal_score: number;
  decision_strength: number;
  model_quality_score: number;
  favorite_score: number;

  // Position sizing
  holding_qty: number;
  current_position_value: number;
  current_weight_pct: number;
  target_weight_pct: number;
  target_value: number;
  target_qty: number;
  qty_by_risk: number;
  delta_qty: number;
  final_buy_qty: number;
  final_sell_qty: number;
  estimated_order_notional: number;
  estimated_fee_value: number;
  estimated_slippage_value: number;

  // Stops & limits
  base_stop_price: number;
  trailing_stop_price: number;
  active_stop_price: number;
  limit_buy_price: number;
  limit_sell_price: number;
  take_profit_price: number;

  // PnL
  unrealized_pnl_value: number;
  unrealized_pnl_pct: number;
  forecast_position_pnl_value: number;
  forecast_position_pnl_pct: number;

  // Trace
  block_code: BlockCode;
  reason_codes: string[];
  rule_trace: string[];
  warnings: string[];

  // Plans
  dca_plan: PisiDcaTranche[];
  grid_plan: PisiGridLevel[];
  remote_orders: PisiRemoteOrder[];
}

/** Section 9.1 — portfolio-level output */
export interface PisiPortfolioOutput {
  run_id: string;
  as_of_ts: number;
  preset_code: PresetCode;
  preset_label: string;
  preset_version: number;
  custom_override_count: number;
  horizon_days: number;
  nav: number;
  cash_before: number;
  reserved_cash_value: number;
  available_cash_for_buys: number;
  peak_nav: number;
  current_portfolio_dd_pct: number;
  portfolio_risk_guard: 0 | 1;
  investable_weight: number;
  gross_exposure_before_pct: number;
  gross_exposure_target_pct: number;
  expected_fee_value: number;
  expected_slippage_value: number;
  expected_cash_after: number;
  buy_count: number;
  sell_count: number;
  no_action_count: number;
  blocked_count: number;
  warnings: string[];
  resolved_config: Partial<PisiResolvedConfig>;
  rule_trace: string[];
  ticker_outputs: PisiTickerOutput[];
}

/** Market forecast data entry for one asset */
export interface MarketForecastEntry {
  ticker: string;
  name: string;
  currentPrice: number;
  sectorId: number;
  forecastAdjClose600: number[];
}
