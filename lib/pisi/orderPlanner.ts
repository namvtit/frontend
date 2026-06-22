// ── PISI Order Planner ──
// Section 8: Execution mode formulas, DCA tranche planners, GRID level planners,
// and Remote Conditional Order builders.

import type {
  PisiTickerOutput,
  PisiResolvedConfig,
  PisiDerivedMetrics,
  PisiDcaTranche,
  PisiGridLevel,
  PisiRemoteOrder,
} from './types/pisi';
import {
  ExecutionMode,
  TriggerTypeCode,
  RemoteActionCode,
  ActionBucket,
  PresetCode,
} from './types/pisi';

// ═══════════════════════════════════════════════════════════════
// Tick Rounding Helpers — Section 8.1
// ═══════════════════════════════════════════════════════════════

export function roundDownToTick(x: number, tick: number): number {
  if (tick <= 0) return x;
  return Math.floor(x / tick) * tick;
}

export function roundUpToTick(x: number, tick: number): number {
  if (tick <= 0) return x;
  return Math.ceil(x / tick) * tick;
}

function roundToTick(x: number, tick: number): number {
  if (tick <= 0) return x;
  return Math.round(x / tick) * tick;
}

// ═══════════════════════════════════════════════════════════════
// LIMIT Price Formula — Section 8.1
// ═══════════════════════════════════════════════════════════════

export function computeLimitPrices(
  p0: number,
  metrics: PisiDerivedMetrics,
  cfg: PisiResolvedConfig
): { limit_buy_price: number; limit_sell_price: number } {
  const limit_buy_price_raw = Math.max(
    metrics.forecast_trough_price,
    p0 * (1 - cfg.max_entry_discount_pct)
  );
  const limit_buy_price = roundDownToTick(limit_buy_price_raw, cfg.price_tick);

  const limit_sell_price_raw = Math.min(
    metrics.forecast_peak_price,
    p0 * (1 + cfg.take_profit_cap_pct)
  );
  // Ensure limit sell price is at least take_profit_floor_pct above p0
  const limit_sell_price = roundUpToTick(
    Math.max(limit_sell_price_raw, p0 * (1 + cfg.take_profit_floor_pct)),
    cfg.price_tick
  );

  return { limit_buy_price, limit_sell_price };
}

// ═══════════════════════════════════════════════════════════════
// Execution Mode Selector — Section 8.0 & 8.2 & 8.3
// ═══════════════════════════════════════════════════════════════

export function selectExecutionMode(
  out: PisiTickerOutput,
  metrics: PisiDerivedMetrics,
  cfg: PisiResolvedConfig
): { mode: ExecutionMode; dcaEligible: boolean; gridEligible: boolean } {
  // DCA Eligibility - Section 8.2
  const dcaEligible =
    out.action_bucket === ActionBucket.BUY &&
    cfg.dca_enabled === 1 &&
    cfg.horizon_days >= cfg.dca_min_horizon_days &&
    metrics.forecast_return_pct > 0 &&
    metrics.forecast_max_drawdown_pct <= cfg.max_stock_drawdown_pct;

  // Grid Range validation - Section 8.3
  const grid_lower_price = Math.max(
    metrics.forecast_trough_price,
    out.current_price * (1 - cfg.grid_lower_cap_pct)
  );
  const grid_upper_price = Math.min(
    metrics.forecast_peak_price,
    out.current_price * (1 + cfg.grid_upper_cap_pct)
  );
  const gridRangeValid =
    grid_lower_price < out.current_price && out.current_price < grid_upper_price;

  // GRID Eligibility - Section 8.3
  const gridEligible =
    (out.action_bucket === ActionBucket.BUY ||
      out.action_bucket === ActionBucket.NO_ACTION) &&
    cfg.grid_enabled === 1 &&
    Math.abs(metrics.net_return_pct) <= cfg.grid_max_abs_net_return_pct &&
    metrics.forecast_volatility_pct >= cfg.grid_min_volatility_pct &&
    metrics.path_efficiency <= cfg.grid_max_path_efficiency &&
    metrics.forecast_max_drawdown_pct <= cfg.max_stock_drawdown_pct &&
    out.portfolio_risk_guard === 0 &&
    gridRangeValid;

  // Execution Mode Selection logic
  let mode: ExecutionMode = ExecutionMode.NONE;

  if (out.action_bucket === ActionBucket.SELL) {
    // Immediate market order for urgent exits or portfolio defense rebalance
    if (out.stop_triggered === 1 || out.portfolio_risk_guard === 1) {
      mode = ExecutionMode.MARKET;
    } else {
      mode = ExecutionMode.LIMIT;
    }
  } else if (out.action_bucket === ActionBucket.BUY) {
    if (cfg.preset_code === PresetCode.WAVE && gridEligible) {
      mode = ExecutionMode.GRID;
    } else if (dcaEligible) {
      mode = ExecutionMode.DCA;
    } else if (cfg.limit_enabled === 1) {
      mode = ExecutionMode.LIMIT;
    } else {
      mode = ExecutionMode.MARKET;
    }
  } else if (out.action_bucket === ActionBucket.NO_ACTION) {
    if (cfg.preset_code === PresetCode.WAVE && gridEligible) {
      mode = ExecutionMode.GRID;
    }
  }

  return { mode, dcaEligible, gridEligible: !!gridEligible };
}

// ═══════════════════════════════════════════════════════════════
// DCA Plan Builder — Section 8.2
// ═══════════════════════════════════════════════════════════════

export function buildDcaPlan(
  out: PisiTickerOutput,
  cfg: PisiResolvedConfig
): PisiDcaTranche[] {
  const N = cfg.dca_tranche_count;
  if (N <= 0) return [];

  const dca_budget_value =
    out.final_buy_qty * out.current_price * cfg.dca_budget_pct_of_target;

  // Compute raw weights
  let sumRawWeights = 0;
  const rawWeights: number[] = [];
  for (let k = 1; k <= N; k++) {
    const raw_w = 1 + cfg.dca_dip_weight * (k - 1) / Math.max(N - 1, 1);
    rawWeights.push(raw_w);
    sumRawWeights += raw_w;
  }

  const plan: PisiDcaTranche[] = [];
  for (let k = 1; k <= N; k++) {
    const dca_weight_k = rawWeights[k - 1] / Math.max(sumRawWeights, 0.001);
    const dca_trigger_price_k = roundDownToTick(
      out.current_price *
        (1 -
          cfg.dca_first_trigger_discount_pct -
          (k - 1) * cfg.dca_trigger_step_pct),
      cfg.price_tick
    );
    const dca_budget_k = dca_budget_value * dca_weight_k;
    const costPerShare =
      dca_trigger_price_k * (1 + cfg.fee_pct + cfg.slippage_pct);
    const dca_qty_k =
      Math.floor(dca_budget_k / Math.max(costPerShare, 0.001) / cfg.lot_size) *
      cfg.lot_size;
    const dca_latest_execution_day_k = Math.min(
      cfg.horizon_days,
      k * cfg.dca_interval_days
    );

    plan.push({
      tranche_index: k,
      trigger_price: dca_trigger_price_k,
      latest_execution_day: dca_latest_execution_day_k,
      budget_value: dca_budget_k,
      qty: dca_qty_k,
      expiry_ts: cfg.as_of_ts + cfg.dca_order_expiry_days * 86400 * 1000,
      status: 'PLANNED',
    });
  }

  return plan;
}

// ═══════════════════════════════════════════════════════════════
// GRID Plan Builder — Section 8.3
// ═══════════════════════════════════════════════════════════════

export function buildGridPlan(
  out: PisiTickerOutput,
  metrics: PisiDerivedMetrics,
  cfg: PisiResolvedConfig
): PisiGridLevel[] {
  const grid_count = cfg.grid_count;
  if (grid_count <= 0) return [];

  const grid_lower_price = Math.max(
    metrics.forecast_trough_price,
    out.current_price * (1 - cfg.grid_lower_cap_pct)
  );
  const grid_upper_price = Math.min(
    metrics.forecast_peak_price,
    out.current_price * (1 + cfg.grid_upper_cap_pct)
  );

  const grid_budget_value = out.target_value * cfg.grid_budget_pct_of_target;
  const grid_order_value = grid_budget_value / grid_count;

  const levels: PisiGridLevel[] = [];
  for (let j = 0; j <= grid_count; j++) {
    let grid_price_j = 0;
    if (cfg.grid_type === 1) {
      // Arithmetic Grid
      const grid_step = (grid_upper_price - grid_lower_price) / grid_count;
      grid_price_j = roundToTick(grid_lower_price + j * grid_step, cfg.price_tick);
    } else {
      // Geometric Grid
      const grid_ratio = Math.pow(
        grid_upper_price / Math.max(grid_lower_price, 0.001),
        1 / grid_count
      );
      grid_price_j = roundToTick(
        grid_lower_price * Math.pow(grid_ratio, j),
        cfg.price_tick
      );
    }

    const isBuy = grid_price_j < out.current_price;
    const side = isBuy ? 1 : 2;
    const side_label = isBuy ? 'BUY' : 'SELL';

    const costPerShare =
      grid_price_j * (1 + cfg.fee_pct + cfg.slippage_pct);
    const qty =
      Math.floor(grid_order_value / Math.max(costPerShare, 0.001) / cfg.lot_size) *
      cfg.lot_size;

    levels.push({
      grid_index: j,
      side,
      side_label,
      grid_price: grid_price_j,
      qty,
      notional: qty * grid_price_j,
      expiry_ts: cfg.as_of_ts + cfg.grid_order_expiry_days * 86400 * 1000,
      status: 'PLANNED',
    });
  }

  return levels;
}

// ═══════════════════════════════════════════════════════════════
// REMOTE Conditional Order Builder — Section 8.4
// ═══════════════════════════════════════════════════════════════

export function buildRemoteOrders(
  out: PisiTickerOutput,
  cfg: PisiResolvedConfig
): PisiRemoteOrder[] {
  const orders: PisiRemoteOrder[] = [];
  const ocoGroupId = `oco_${out.ticker}_tp_sl_${cfg.as_of_ts}`;

  const totalHoldingQty = out.holding_qty + out.final_buy_qty;

  // 1. Protective Stop Order (only if holding exists or is planned)
  if (totalHoldingQty > 0 && out.active_stop_price > 0) {
    orders.push({
      remote_order_id: `ro_${out.ticker}_stop_${cfg.as_of_ts}`,
      oco_group_id: ocoGroupId,
      trigger_type_code: TriggerTypeCode.PRICE_BELOW,
      trigger_price: out.active_stop_price,
      trigger_value: 0,
      remote_action_code: RemoteActionCode.SELL_MARKET_PROTECTIVE,
      order_type_code: 1, // MARKET
      order_type_label: 'MARKET',
      side_code: 2, // SELL
      side_label: 'SELL',
      qty: totalHoldingQty,
      limit_price: 0,
      expiry_ts: cfg.as_of_ts + cfg.remote_order_max_days * 86400 * 1000,
      cancel_if_score_below: cfg.remote_score_recheck_threshold,
      status: 'PLANNED',
    });
  }

  // 2. Take-Profit Limit Order (only if holding exists or is planned and limit sell is set)
  if (totalHoldingQty > 0 && out.limit_sell_price > 0) {
    orders.push({
      remote_order_id: `ro_${out.ticker}_tp_${cfg.as_of_ts}`,
      oco_group_id: ocoGroupId,
      trigger_type_code: TriggerTypeCode.PRICE_ABOVE,
      trigger_price: out.limit_sell_price,
      trigger_value: 0,
      remote_action_code: RemoteActionCode.SELL_LIMIT,
      order_type_code: 2, // LIMIT
      order_type_label: 'LIMIT',
      side_code: 2, // SELL
      side_label: 'SELL',
      qty: totalHoldingQty,
      limit_price: out.limit_sell_price,
      expiry_ts:
        cfg.as_of_ts +
        Math.min(cfg.horizon_days, cfg.remote_order_max_days) * 86400 * 1000,
      cancel_if_score_below: cfg.remote_score_recheck_threshold,
      status: 'PLANNED',
    });
  }

  // 3. Discount Entry Limit Order (only if buying)
  if (out.final_buy_qty > 0 && out.limit_buy_price > 0) {
    orders.push({
      remote_order_id: `ro_${out.ticker}_entry_${cfg.as_of_ts}`,
      oco_group_id: '',
      trigger_type_code: TriggerTypeCode.PRICE_BELOW,
      trigger_price: out.limit_buy_price,
      trigger_value: 0,
      remote_action_code: RemoteActionCode.BUY_LIMIT,
      order_type_code: 2, // LIMIT
      order_type_label: 'LIMIT',
      side_code: 1, // BUY
      side_label: 'BUY',
      qty: out.final_buy_qty,
      limit_price: out.limit_buy_price,
      expiry_ts:
        cfg.as_of_ts +
        Math.min(cfg.horizon_days, cfg.limit_order_expiry_days) * 86400 * 1000,
      cancel_if_score_below: cfg.remote_score_recheck_threshold,
      status: 'PLANNED',
    });
  }

  // 4. Portfolio Circuit Breaker Order
  orders.push({
    remote_order_id: `ro_${out.ticker}_breaker_${cfg.as_of_ts}`,
    oco_group_id: '',
    trigger_type_code: TriggerTypeCode.PORTFOLIO_DD_ABOVE,
    trigger_price: 0,
    trigger_value: cfg.max_portfolio_dd_pct,
    remote_action_code: RemoteActionCode.CANCEL_PENDING_BUYS,
    order_type_code: 0, // NONE/CANCEL
    order_type_label: 'NONE',
    side_code: 2, // SELL/CANCEL
    side_label: 'SELL',
    qty: 0,
    limit_price: 0,
    expiry_ts: cfg.as_of_ts + cfg.remote_order_max_days * 86400 * 1000,
    cancel_if_score_below: 0,
    status: 'PLANNED',
  });

  return orders;
}
