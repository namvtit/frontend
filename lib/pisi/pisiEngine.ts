// ── PISI Core Engine ──
// Sections 3–7 & 10: Metrics, Risk Gates, Signal Scores, Allocation, Decision
// All formulae run client-side. Pure functions, no side effects.

import type {
  PisiResolvedConfig,
  PisiTickerInput,
  PisiPortfolioOutput,
  PisiTickerOutput,
  PisiDerivedMetrics,
  ActionBucket as ActionBucketType,
  ExecutionMode as ExecutionModeType,
  BlockCode as BlockCodeType,
} from './types/pisi';
import {
  ActionBucket,
  ActionLabel,
  ExecutionMode,
  ExecutionModeLabel,
  BlockCode,
  PresetLabel,
} from './types/pisi';
import {
  selectExecutionMode,
  buildDcaPlan,
  buildGridPlan,
  buildRemoteOrders,
  computeLimitPrices,
} from './orderPlanner';

// ═══════════════════════════════════════════════════════════════
// Utility helpers
// ═══════════════════════════════════════════════════════════════

function clip(x: number, a: number, b: number): number {
  return Math.min(Math.max(x, a), b);
}

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

function safeDiv(a: number, b: number, fallback = 0): number {
  return b !== 0 ? a / b : fallback;
}

function safeDenom(x: number, minVal = 0.001): number {
  return Math.max(x, minVal);
}

// ═══════════════════════════════════════════════════════════════
// Section 3 — Derived Metrics from forecast path
// ═══════════════════════════════════════════════════════════════

/** 3.1: Daily returns from forecast slice [0..H] */
function computeDailyReturns(forecastSlice: number[]): number[] {
  const returns: number[] = [];
  for (let t = 1; t < forecastSlice.length; t++) {
    returns.push(forecastSlice[t] / forecastSlice[t - 1] - 1);
  }
  return returns;
}

/** 3.2: Forecast return & net return */
function computeReturns(F0: number, FH: number, feePct: number, slippagePct: number) {
  const forecast_return_pct = FH / F0 - 1;
  const net_return_pct = forecast_return_pct - 2 * (feePct + slippagePct);
  return { forecast_return_pct, net_return_pct };
}

/** 3.3: Forecast volatility */
function computeVolatility(returns: number[], H: number, tradingDaysPerYear: number) {
  if (returns.length === 0) return { forecast_volatility_pct: 0, annualized_forecast_volatility_pct: 0 };
  const mean = returns.reduce((s, r) => s + r, 0) / returns.length;
  const variance = returns.reduce((s, r) => s + (r - mean) ** 2, 0) / returns.length;
  const std = Math.sqrt(variance);
  return {
    forecast_volatility_pct: std * Math.sqrt(H),
    annualized_forecast_volatility_pct: std * Math.sqrt(tradingDaysPerYear),
  };
}

/** 3.4: Forecast max drawdown (path-based) */
function computeMDD(forecastSlice: number[]): number {
  let runningPeak = forecastSlice[0];
  let maxDD = 0;
  for (let t = 1; t < forecastSlice.length; t++) {
    runningPeak = Math.max(runningPeak, forecastSlice[t]);
    const dd = 1 - forecastSlice[t] / runningPeak;
    maxDD = Math.max(maxDD, dd);
  }
  return maxDD;
}

/** 3.5: Upside, downside, risk/reward */
function computeUpsideDownside(forecastSlice: number[], F0: number) {
  let peakPrice = forecastSlice[1] ?? F0;
  let troughPrice = forecastSlice[1] ?? F0;
  let peakDay = 1;
  let troughDay = 1;

  for (let t = 1; t < forecastSlice.length; t++) {
    if (forecastSlice[t] > peakPrice) {
      peakPrice = forecastSlice[t];
      peakDay = t;
    }
    if (forecastSlice[t] < troughPrice) {
      troughPrice = forecastSlice[t];
      troughDay = t;
    }
  }

  const upside_pct = Math.max(0, peakPrice / F0 - 1);
  const downside_pct = Math.max(0, 1 - troughPrice / F0);
  const risk_reward = upside_pct / safeDenom(downside_pct);

  return {
    forecast_peak_price: peakPrice,
    forecast_trough_price: troughPrice,
    forecast_peak_day: peakDay,
    forecast_trough_day: troughDay,
    upside_pct,
    downside_pct,
    risk_reward,
  };
}

/** 3.6: Trend, path efficiency, path amplitude */
function computePathMetrics(forecastSlice: number[], F0: number, returns: number[]) {
  // Trend
  const positiveCount = returns.filter(r => r > 0).length;
  const positive_day_ratio = returns.length > 0 ? positiveCount / returns.length : 0.5;
  const trend_score_raw = 2 * positive_day_ratio - 1;

  // Path efficiency
  let pathTotalMove = 0;
  for (let t = 1; t < forecastSlice.length; t++) {
    pathTotalMove += Math.abs(forecastSlice[t] - forecastSlice[t - 1]);
  }
  const FH = forecastSlice[forecastSlice.length - 1];
  const path_efficiency = Math.abs(FH - F0) / safeDenom(pathTotalMove);

  // Path amplitude
  let peak = forecastSlice[0];
  let trough = forecastSlice[0];
  for (let t = 1; t < forecastSlice.length; t++) {
    peak = Math.max(peak, forecastSlice[t]);
    trough = Math.min(trough, forecastSlice[t]);
  }
  const path_amplitude_pct = (peak - trough) / F0;

  return { positive_day_ratio, trend_score_raw, path_efficiency, path_amplitude_pct };
}

/** 3.7: Existing-position metrics */
function computePositionMetrics(holdingQty: number, p0: number, avgCost: number, FH: number, nav: number) {
  const current_position_value = holdingQty * p0;
  const current_weight_pct = safeDiv(current_position_value, nav);
  const unrealized_pnl_value = holdingQty * (p0 - avgCost);
  const unrealized_pnl_pct = safeDiv(p0, safeDenom(avgCost)) - 1;
  const forecast_position_pnl_value = holdingQty * (FH - p0);
  const forecast_position_pnl_pct = FH / p0 - 1;

  return {
    current_position_value,
    current_weight_pct,
    unrealized_pnl_value,
    unrealized_pnl_pct,
    forecast_position_pnl_value,
    forecast_position_pnl_pct,
  };
}

/** Compute all derived metrics for one ticker */
function computeAllMetrics(
  ticker: PisiTickerInput,
  cfg: PisiResolvedConfig,
): PisiDerivedMetrics {
  const H = cfg.horizon_days;
  const forecastSlice = ticker.forecast_price.slice(0, H + 1); // [0..H]
  const F0 = ticker.p0;
  const FH = forecastSlice[H] ?? F0;

  const returns = computeDailyReturns(forecastSlice);
  const { forecast_return_pct, net_return_pct } = computeReturns(F0, FH, cfg.fee_pct, cfg.slippage_pct);
  const { forecast_volatility_pct, annualized_forecast_volatility_pct } = computeVolatility(returns, H, cfg.trading_days_per_year);
  const forecast_max_drawdown_pct = computeMDD(forecastSlice);
  const upDown = computeUpsideDownside(forecastSlice, F0);
  const pathMetrics = computePathMetrics(forecastSlice, F0, returns);
  const posMetrics = computePositionMetrics(ticker.holding_qty, F0, ticker.avg_cost, FH, cfg.nav);

  return {
    forecast_return_pct,
    net_return_pct,
    forecast_volatility_pct,
    annualized_forecast_volatility_pct,
    forecast_max_drawdown_pct,
    ...upDown,
    ...pathMetrics,
    ...posMetrics,
  };
}

// ═══════════════════════════════════════════════════════════════
// Section 4 — Risk Gates
// ═══════════════════════════════════════════════════════════════

/** 4.1: Data validity gate */
function checkDataValidity(forecastPrice: number[], H: number, p0: number): boolean {
  if (forecastPrice.length < H + 1) return false;
  if (p0 <= 0) return false;
  for (let t = 0; t <= H; t++) {
    if (forecastPrice[t] <= 0) return false;
  }
  return true;
}

/** 4.2: Portfolio risk guard */
function checkPortfolioRiskGuard(currentDD: number, maxDD: number): boolean {
  return currentDD > maxDD;
}

/** 4.3: Buy eligibility gate — returns [eligible, failReasons] */
function checkBuyEligibility(
  validForecast: boolean,
  ticker: PisiTickerInput,
  metrics: PisiDerivedMetrics,
  cfg: PisiResolvedConfig,
  portfolioRiskGuard: boolean,
): { eligible: boolean; reasons: string[]; blockCode: BlockCodeType } {
  const reasons: string[] = [];
  let blockCode: BlockCodeType = BlockCode.NONE;

  if (!validForecast) {
    reasons.push('INVALID_FORECAST');
    return { eligible: false, reasons, blockCode: BlockCode.INVALID_FORECAST };
  }
  if (ticker.exclude_flag === 1) {
    reasons.push('EXCLUDED');
    return { eligible: false, reasons, blockCode: BlockCode.NONE };
  }
  if (ticker.days_since_last_sell < cfg.cooldown_days_after_sell) {
    reasons.push('COOLDOWN_ACTIVE');
    blockCode = BlockCode.COOLDOWN_ACTIVE;
  }
  if (metrics.net_return_pct < cfg.min_net_return_pct) {
    reasons.push('RETURN_BELOW_THRESHOLD');
    if (blockCode === BlockCode.NONE) blockCode = BlockCode.RETURN_BELOW_THRESHOLD;
  }
  if (metrics.risk_reward < cfg.min_risk_reward) {
    reasons.push('RISK_REWARD_BELOW_THRESHOLD');
    if (blockCode === BlockCode.NONE) blockCode = BlockCode.RISK_REWARD_BELOW_THRESHOLD;
  }
  if (metrics.forecast_max_drawdown_pct > cfg.max_stock_drawdown_pct) {
    reasons.push('STOCK_DD_LIMIT');
    if (blockCode === BlockCode.NONE) blockCode = BlockCode.STOCK_DD_LIMIT;
  }
  if (metrics.forecast_volatility_pct > cfg.max_forecast_volatility_pct) {
    reasons.push('VOLATILITY_LIMIT');
    if (blockCode === BlockCode.NONE) blockCode = BlockCode.VOLATILITY_LIMIT;
  }
  if (portfolioRiskGuard) {
    reasons.push('PORTFOLIO_DD_GUARD');
    if (blockCode === BlockCode.NONE) blockCode = BlockCode.PORTFOLIO_DD_GUARD;
  }

  const eligible = reasons.length === 0;
  return { eligible, reasons, blockCode };
}

/** 4.4: Protective exit gate */
function checkProtectiveExit(
  ticker: PisiTickerInput,
  metrics: PisiDerivedMetrics,
  cfg: PisiResolvedConfig,
) {
  const baseStopPrice = ticker.avg_cost * (1 - cfg.base_stop_loss_pct);
  const trailingStopPrice = cfg.trailing_stop_pct > 0
    ? ticker.highest_price_since_entry * (1 - cfg.trailing_stop_pct)
    : 0;

  const activeStopPrice = cfg.trailing_stop_pct > 0
    ? Math.max(baseStopPrice, trailingStopPrice)
    : baseStopPrice;

  const stopTriggered = ticker.holding_qty > 0 && ticker.p0 <= activeStopPrice && ticker.avg_cost > 0;

  const forecastExitTrigger = ticker.holding_qty > 0 && (
    metrics.net_return_pct < 0 ||
    metrics.forecast_max_drawdown_pct > cfg.max_stock_drawdown_pct
  );

  return {
    base_stop_price: baseStopPrice,
    trailing_stop_price: trailingStopPrice,
    active_stop_price: activeStopPrice,
    stop_triggered: stopTriggered,
    forecast_exit_trigger: forecastExitTrigger,
  };
}

// ═══════════════════════════════════════════════════════════════
// Section 5 — Signal Score & Decision Strength
// ═══════════════════════════════════════════════════════════════

function computeSignalScore(
  metrics: PisiDerivedMetrics,
  ticker: PisiTickerInput,
  cfg: PisiResolvedConfig,
) {
  // 5.1: Normalize components
  const return_component = clip(
    metrics.net_return_pct / safeDenom(cfg.target_net_return_pct), -1, 1
  );
  const rr_component = clip(
    (metrics.risk_reward - 1) / safeDenom(cfg.min_risk_reward), -1, 1
  );
  const trend_component = metrics.trend_score_raw;
  const drawdown_component = 1 - clip(
    metrics.forecast_max_drawdown_pct / safeDenom(cfg.max_stock_drawdown_pct), 0, 1
  );
  const volatility_component = 1 - clip(
    metrics.forecast_volatility_pct / safeDenom(cfg.max_forecast_volatility_pct), 0, 1
  );
  const preference_component = ticker.favorite_score;

  // 5.2: Weighted sum
  const raw = 100 * (
    cfg.w_return * return_component +
    cfg.w_risk_reward * rr_component +
    cfg.w_trend * trend_component +
    cfg.w_drawdown * drawdown_component +
    cfg.w_volatility * volatility_component +
    cfg.w_preference * preference_component
  );

  let signal_score = raw * ticker.model_quality_score;
  signal_score = clip(signal_score, -100, 100);

  // 5.3: Decision strength
  const margin_return = metrics.net_return_pct / safeDenom(cfg.min_net_return_pct) - 1;
  const margin_rr = metrics.risk_reward / safeDenom(cfg.min_risk_reward) - 1;
  const margin_dd = cfg.max_stock_drawdown_pct / safeDenom(metrics.forecast_max_drawdown_pct) - 1;
  const margin_vol = cfg.max_forecast_volatility_pct / safeDenom(metrics.forecast_volatility_pct) - 1;

  const rule_margin = Math.min(margin_return, margin_rr, margin_dd, margin_vol);
  const decision_strength = 100 * clip(
    (signal_score / 100) * sigmoid(rule_margin), 0, 1
  );

  return {
    signal_score: Math.round(signal_score * 100) / 100,
    decision_strength: Math.round(decision_strength * 100) / 100,
  };
}

// ═══════════════════════════════════════════════════════════════
// Section 6 — Allocation, Position Sizing, Target Quantity
// ═══════════════════════════════════════════════════════════════

/** 6.1: Risk budget qty */
function computeRiskBudgetQty(cfg: PisiResolvedConfig, p0: number): number {
  const riskBudgetValue = cfg.nav * cfg.risk_per_trade_pct;
  const estimatedLossPerShare = p0 * (cfg.base_stop_loss_pct + cfg.fee_pct + cfg.slippage_pct);
  return Math.floor(riskBudgetValue / safeDenom(estimatedLossPerShare) / cfg.lot_size) * cfg.lot_size;
}

/** 6.2: Position weight cap */
function computePositionWeightCap(
  cfg: PisiResolvedConfig,
  ticker: PisiTickerInput,
  currentSectorWeight: number,
): number {
  const weightCapByStop = cfg.risk_per_trade_pct / safeDenom(cfg.base_stop_loss_pct);
  const sectorRemaining = Math.max(0, cfg.max_sector_pct - currentSectorWeight);
  return Math.min(
    cfg.max_position_pct,
    weightCapByStop,
    sectorRemaining,
    ticker.liquidity_score * cfg.max_position_pct,
  );
}

/** 6.4: Target quantity and delta */
function computeTargetQty(targetWeight: number, nav: number, p0: number, feePct: number, slippagePct: number, lotSize: number) {
  const targetValue = nav * targetWeight;
  const entryPriceForSizing = p0 * (1 + feePct + slippagePct);
  const targetQty = Math.floor(targetValue / entryPriceForSizing / lotSize) * lotSize;
  return { target_value: targetValue, target_qty: targetQty };
}

// ═══════════════════════════════════════════════════════════════
// Section 10 — Main Engine Orchestrator
// ═══════════════════════════════════════════════════════════════

interface TickerWorkItem {
  input: PisiTickerInput;
  metrics: PisiDerivedMetrics;
  validForecast: boolean;
  buyEligible: boolean;
  buyBlockCode: BlockCodeType;
  buyReasons: string[];
  exitInfo: ReturnType<typeof checkProtectiveExit>;
  scores: { signal_score: number; decision_strength: number };
}

export function runPisiEngine(
  cfg: PisiResolvedConfig,
  tickerInputs: PisiTickerInput[],
): PisiPortfolioOutput {
  const warnings: string[] = [];
  const ruleTrace: string[] = [];

  // Step 2: Portfolio drawdown
  const currentDD = Math.max(0, 1 - cfg.nav / safeDenom(cfg.peak_nav, 1));
  cfg.current_portfolio_dd = currentDD;
  const portfolioRiskGuard = checkPortfolioRiskGuard(currentDD, cfg.max_portfolio_dd_pct);

  if (portfolioRiskGuard) {
    ruleTrace.push(`PORTFOLIO_RISK_GUARD: DD ${(currentDD * 100).toFixed(2)}% > max ${(cfg.max_portfolio_dd_pct * 100).toFixed(2)}%`);
    warnings.push('PORTFOLIO_DD_GUARD_ACTIVE');
  }

  // Step 3: Compute metrics for all tickers
  const workItems: TickerWorkItem[] = tickerInputs.map(input => {
    const validForecast = checkDataValidity(input.forecast_price, cfg.horizon_days, input.p0);

    // Compute metrics even if invalid (will be zeroed)
    const metrics = validForecast
      ? computeAllMetrics(input, cfg)
      : createZeroMetrics();

    const { eligible, reasons, blockCode } = checkBuyEligibility(
      validForecast, input, metrics, cfg, portfolioRiskGuard,
    );

    const exitInfo = checkProtectiveExit(input, metrics, cfg);
    const scores = validForecast
      ? computeSignalScore(metrics, input, cfg)
      : { signal_score: 0, decision_strength: 0 };

    return {
      input, metrics, validForecast,
      buyEligible: eligible,
      buyBlockCode: blockCode,
      buyReasons: reasons,
      exitInfo, scores,
    };
  });

  // Step 4 & 5: Build eligible universe and allocate
  const investableWeight = Math.min(cfg.max_gross_exposure_pct, 1 - cfg.reserved_cash_pct);

  // If portfolio guard is active, reduce exposure
  const effectiveInvestableWeight = portfolioRiskGuard
    ? Math.max(0, cfg.max_gross_exposure_pct * cfg.portfolio_defense_multiplier)
    : investableWeight;

  // Get eligible BUY tickers sorted by signal_score desc
  const eligibleBuys = workItems
    .filter(w => w.buyEligible && w.scores.signal_score > 0)
    .sort((a, b) => b.scores.signal_score - a.scores.signal_score)
    .slice(0, cfg.max_holdings);

  // Compute sector weights for existing holdings
  const sectorWeights = new Map<number, number>();
  for (const w of workItems) {
    const weight = w.metrics.current_weight_pct;
    if (weight > 0) {
      const prev = sectorWeights.get(w.input.sector_id) ?? 0;
      sectorWeights.set(w.input.sector_id, prev + weight);
    }
  }

  // Section 6.3: Allocate target weights
  const totalPositiveScore = eligibleBuys.reduce((s, w) => s + w.scores.signal_score, 0);

  const targetWeights = new Map<string, number>();
  const positionCaps = new Map<string, number>();

  for (const w of eligibleBuys) {
    const sectorWeight = sectorWeights.get(w.input.sector_id) ?? 0;
    const cap = computePositionWeightCap(cfg, w.input, sectorWeight);
    positionCaps.set(w.input.ticker, cap);

    const rawWeight = effectiveInvestableWeight * w.scores.signal_score / safeDenom(totalPositiveScore);
    const cappedWeight = Math.min(rawWeight, cap);
    targetWeights.set(w.input.ticker, cappedWeight);
  }

  // Cash feasibility — Section 6.5
  const reservedCashValue = cfg.nav * cfg.reserved_cash_pct;
  let sellProceeds = 0;

  // First pass: identify sells
  const sellItems: { ticker: string; qty: number; price: number }[] = [];
  for (const w of workItems) {
    if (w.input.holding_qty > 0) {
      const tWeight = targetWeights.get(w.input.ticker) ?? 0;
      const { target_qty } = computeTargetQty(tWeight, cfg.nav, w.input.p0, cfg.fee_pct, cfg.slippage_pct, cfg.lot_size);
      const delta = target_qty - w.input.holding_qty;
      if (delta < 0 || w.exitInfo.stop_triggered || w.exitInfo.forecast_exit_trigger) {
        const sellQty = w.exitInfo.stop_triggered
          ? w.input.holding_qty
          : Math.min(w.input.holding_qty, Math.abs(delta));
        sellProceeds += sellQty * w.input.p0 * (1 - cfg.fee_pct - cfg.slippage_pct);
        sellItems.push({ ticker: w.input.ticker, qty: sellQty, price: w.input.p0 });
      }
    }
  }

  let availableCash = cfg.cash + sellProceeds - reservedCashValue;

  // Build final outputs
  const tickerOutputs: PisiTickerOutput[] = [];
  let buyCount = 0, sellCount = 0, noActionCount = 0, blockedCount = 0;
  let totalFee = 0, totalSlippage = 0;

  // Sort work items: sells first (by priority), then buys (by score desc), then no-action
  const sortedItems = [...workItems].sort((a, b) => {
    // Sells first
    const aIsSell = a.exitInfo.stop_triggered || a.exitInfo.forecast_exit_trigger || (a.input.holding_qty > 0 && !a.buyEligible);
    const bIsSell = b.exitInfo.stop_triggered || b.exitInfo.forecast_exit_trigger || (b.input.holding_qty > 0 && !b.buyEligible);
    if (aIsSell && !bIsSell) return -1;
    if (!aIsSell && bIsSell) return 1;
    // Then by score
    return b.scores.signal_score - a.scores.signal_score;
  });

  let rank = 1;

  for (const w of sortedItems) {
    const { input, metrics, validForecast, buyEligible, exitInfo, scores, buyBlockCode, buyReasons } = w;
    const H = cfg.horizon_days;
    const FH = input.forecast_price[H] ?? input.p0;

    // Initialize output
    const out: PisiTickerOutput = {
      ticker: input.ticker,
      sector_id: input.sector_id,
      action_bucket: ActionBucket.NO_ACTION,
      action_label: 'NO_ACTION',
      execution_mode: ExecutionMode.NONE,
      execution_mode_label: 'NONE',
      rank: 0,
      preset_code: cfg.preset_code,
      preset_label: PresetLabel[cfg.preset_code],
      custom_override_count: cfg.custom_override_count,

      valid_forecast: validForecast ? 1 : 0,
      buy_eligible: buyEligible ? 1 : 0,
      dca_eligible: 0,
      grid_eligible: 0,
      portfolio_risk_guard: portfolioRiskGuard ? 1 : 0,
      stop_triggered: exitInfo.stop_triggered ? 1 : 0,
      forecast_exit_trigger: exitInfo.forecast_exit_trigger ? 1 : 0,

      current_price: input.p0,
      avg_cost: input.avg_cost,
      forecast_end_price: FH,
      forecast_peak_price: metrics.forecast_peak_price,
      forecast_peak_day: metrics.forecast_peak_day,
      forecast_trough_price: metrics.forecast_trough_price,
      forecast_trough_day: metrics.forecast_trough_day,

      forecast_return_pct: metrics.forecast_return_pct,
      net_return_pct: metrics.net_return_pct,
      forecast_volatility_pct: metrics.forecast_volatility_pct,
      annualized_forecast_volatility_pct: metrics.annualized_forecast_volatility_pct,
      forecast_max_drawdown_pct: metrics.forecast_max_drawdown_pct,
      upside_pct: metrics.upside_pct,
      downside_pct: metrics.downside_pct,
      risk_reward: metrics.risk_reward,
      positive_day_ratio: metrics.positive_day_ratio,
      trend_score_raw: metrics.trend_score_raw,
      path_efficiency: metrics.path_efficiency,
      path_amplitude_pct: metrics.path_amplitude_pct,

      signal_score: scores.signal_score,
      decision_strength: scores.decision_strength,
      model_quality_score: input.model_quality_score,
      favorite_score: input.favorite_score,

      holding_qty: input.holding_qty,
      current_position_value: metrics.current_position_value,
      current_weight_pct: metrics.current_weight_pct,
      target_weight_pct: 0,
      target_value: 0,
      target_qty: 0,
      qty_by_risk: 0,
      delta_qty: 0,
      final_buy_qty: 0,
      final_sell_qty: 0,
      estimated_order_notional: 0,
      estimated_fee_value: 0,
      estimated_slippage_value: 0,

      base_stop_price: exitInfo.base_stop_price,
      trailing_stop_price: exitInfo.trailing_stop_price,
      active_stop_price: exitInfo.active_stop_price,
      limit_buy_price: 0,
      limit_sell_price: 0,
      take_profit_price: 0,

      unrealized_pnl_value: metrics.unrealized_pnl_value,
      unrealized_pnl_pct: metrics.unrealized_pnl_pct,
      forecast_position_pnl_value: metrics.forecast_position_pnl_value,
      forecast_position_pnl_pct: metrics.forecast_position_pnl_pct,

      block_code: BlockCode.NONE,
      reason_codes: [],
      rule_trace: [],
      warnings: ['FORECAST_PATH_IS_NOT_A_PROBABILITY'],

      dca_plan: [],
      grid_plan: [],
      remote_orders: [],
    };

    // ── Decision logic ──

    // Invalid forecast
    if (!validForecast) {
      out.action_bucket = ActionBucket.NO_ACTION;
      out.execution_mode = ExecutionMode.NONE;
      out.block_code = BlockCode.INVALID_FORECAST;
      out.reason_codes = ['INVALID_FORECAST'];
      blockedCount++;
      tickerOutputs.push(out);
      continue;
    }

    // SELL decisions (highest priority after invalid)
    if (exitInfo.stop_triggered) {
      out.action_bucket = ActionBucket.SELL;
      out.action_label = 'SELL';
      out.execution_mode = ExecutionMode.MARKET;
      out.execution_mode_label = 'MARKET';
      out.final_sell_qty = input.holding_qty;
      out.reason_codes = ['STOP_TRIGGERED'];
      out.rule_trace.push(`p0 ${input.p0} <= active_stop ${exitInfo.active_stop_price.toFixed(2)}`);
      sellCount++;
    } else if (exitInfo.forecast_exit_trigger && input.holding_qty > 0) {
      out.action_bucket = ActionBucket.SELL;
      out.action_label = 'SELL';
      out.execution_mode = ExecutionMode.LIMIT;
      out.execution_mode_label = 'LIMIT';
      out.final_sell_qty = input.holding_qty;
      out.reason_codes = ['FORECAST_EXIT_TRIGGER'];
      if (metrics.net_return_pct < 0) out.rule_trace.push('net_return_pct < 0');
      if (metrics.forecast_max_drawdown_pct > cfg.max_stock_drawdown_pct) {
        out.rule_trace.push(`MDD ${(metrics.forecast_max_drawdown_pct * 100).toFixed(2)}% > max ${(cfg.max_stock_drawdown_pct * 100).toFixed(2)}%`);
      }
      sellCount++;
    } else if (buyEligible) {
      // BUY logic
      const tWeight = targetWeights.get(input.ticker) ?? 0;
      const qtyByRisk = computeRiskBudgetQty(cfg, input.p0);
      const { target_value, target_qty } = computeTargetQty(tWeight, cfg.nav, input.p0, cfg.fee_pct, cfg.slippage_pct, cfg.lot_size);
      const deltaQty = target_qty - input.holding_qty;

      out.target_weight_pct = tWeight;
      out.target_value = target_value;
      out.target_qty = target_qty;
      out.qty_by_risk = qtyByRisk;
      out.delta_qty = deltaQty;

      if (deltaQty > 0) {
        // Cash feasibility
        const maxBuyQtyByCash = Math.floor(
          Math.max(0, availableCash) / (input.p0 * (1 + cfg.fee_pct + cfg.slippage_pct)) / cfg.lot_size
        ) * cfg.lot_size;

        const finalBuyQty = Math.min(deltaQty, qtyByRisk, maxBuyQtyByCash);

        if (finalBuyQty > 0) {
          const notional = finalBuyQty * input.p0;
          const tradeNotionalAbs = notional;
          const rebalanceNeeded = tradeNotionalAbs >= cfg.nav * cfg.rebalance_band_pct &&
                                   tradeNotionalAbs >= cfg.min_order_notional;

          if (rebalanceNeeded) {
            out.action_bucket = ActionBucket.BUY;
            out.action_label = 'BUY';
            out.final_buy_qty = finalBuyQty;
            out.estimated_order_notional = notional;
            out.estimated_fee_value = notional * cfg.fee_pct;
            out.estimated_slippage_value = notional * cfg.slippage_pct;
            out.rank = rank++;

            // Deduct from available cash
            availableCash -= notional * (1 + cfg.fee_pct + cfg.slippage_pct);
            totalFee += out.estimated_fee_value;
            totalSlippage += out.estimated_slippage_value;

            // Compute limit prices
            const limits = computeLimitPrices(input.p0, metrics, cfg);
            out.limit_buy_price = limits.limit_buy_price;
            out.limit_sell_price = limits.limit_sell_price;
            out.take_profit_price = limits.limit_sell_price;

            // Select execution mode
            const execResult = selectExecutionMode(out, metrics, cfg);
            out.execution_mode = execResult.mode;
            out.execution_mode_label = ExecutionModeLabel[execResult.mode];
            out.dca_eligible = execResult.dcaEligible ? 1 : 0;
            out.grid_eligible = execResult.gridEligible ? 1 : 0;

            // Build plans based on execution mode
            if (out.execution_mode === ExecutionMode.DCA) {
              out.dca_plan = buildDcaPlan(out, cfg);
            }
            if (out.execution_mode === ExecutionMode.GRID) {
              out.grid_plan = buildGridPlan(out, metrics, cfg);
            }

            // Build remote orders for protection
            if (cfg.remote_enabled) {
              out.remote_orders = buildRemoteOrders(out, cfg);
            }

            out.reason_codes = [
              'RETURN_PASS', 'RISK_REWARD_PASS', 'DRAWDOWN_PASS',
              'VOLATILITY_PASS', 'CASH_PASS',
              `${out.execution_mode_label}_SELECTED`,
            ];
            out.rule_trace = [
              `net_return_pct ${(metrics.net_return_pct * 100).toFixed(2)}% >= min ${(cfg.min_net_return_pct * 100).toFixed(2)}%`,
              `risk_reward ${metrics.risk_reward.toFixed(2)} >= min ${cfg.min_risk_reward.toFixed(2)}`,
              `MDD ${(metrics.forecast_max_drawdown_pct * 100).toFixed(2)}% <= max ${(cfg.max_stock_drawdown_pct * 100).toFixed(2)}%`,
              `target_qty ${target_qty} > holding_qty ${input.holding_qty}`,
            ];

            buyCount++;
          } else {
            out.block_code = BlockCode.REBALANCE_BAND;
            out.reason_codes = ['REBALANCE_BAND'];
            noActionCount++;
          }
        } else {
          out.block_code = maxBuyQtyByCash === 0 ? BlockCode.CASH_CONSTRAINT : BlockCode.NONE;
          out.reason_codes = maxBuyQtyByCash === 0 ? ['CASH_CONSTRAINT'] : ['NO_QTY_AVAILABLE'];
          blockedCount++;
        }
      } else {
        // delta_qty <= 0, already at or above target
        out.reason_codes = ['AT_OR_ABOVE_TARGET'];
        noActionCount++;
      }
    } else {
      // Not buy eligible, not selling
      out.block_code = buyBlockCode;
      out.reason_codes = buyReasons.length > 0 ? buyReasons : ['NO_SIGNAL'];

      // For held positions that failed buy gates, check if it's a reduce
      if (input.holding_qty > 0) {
        const tWeight = targetWeights.get(input.ticker) ?? 0;
        const { target_qty } = computeTargetQty(tWeight, cfg.nav, input.p0, cfg.fee_pct, cfg.slippage_pct, cfg.lot_size);
        if (target_qty < input.holding_qty) {
          out.action_bucket = ActionBucket.SELL;
          out.action_label = 'SELL';
          out.execution_mode = ExecutionMode.LIMIT;
          out.execution_mode_label = 'LIMIT';
          out.final_sell_qty = Math.min(input.holding_qty, input.holding_qty - target_qty);
          sellCount++;
        } else {
          noActionCount++;
        }
      } else {
        noActionCount++;
      }
    }

    // Compute sell estimates
    if (out.final_sell_qty > 0 && out.action_bucket === ActionBucket.SELL) {
      const sellNotional = out.final_sell_qty * input.p0;
      out.estimated_order_notional = sellNotional;
      out.estimated_fee_value = sellNotional * cfg.fee_pct;
      out.estimated_slippage_value = sellNotional * cfg.slippage_pct;
      totalFee += out.estimated_fee_value;
      totalSlippage += out.estimated_slippage_value;

      // Limit sell price
      const limits = computeLimitPrices(input.p0, metrics, cfg);
      out.limit_sell_price = limits.limit_sell_price;
      out.take_profit_price = limits.limit_sell_price;

      // Build remote protective orders for held positions
      if (cfg.remote_enabled && input.holding_qty > out.final_sell_qty) {
        out.remote_orders = buildRemoteOrders(out, cfg);
      }
    }

    tickerOutputs.push(out);
  }

  // Compute gross exposure
  let grossExposureBefore = 0;
  let grossExposureTarget = 0;
  for (const t of tickerOutputs) {
    grossExposureBefore += t.current_weight_pct;
    grossExposureTarget += t.target_weight_pct;
  }

  const cashAfter = cfg.cash + sellProceeds
    - tickerOutputs.reduce((s, t) => s + (t.action_bucket === ActionBucket.BUY ? t.estimated_order_notional * (1 + cfg.fee_pct + cfg.slippage_pct) : 0), 0)
    + tickerOutputs.reduce((s, t) => s + (t.action_bucket === ActionBucket.SELL ? t.estimated_order_notional * (1 - cfg.fee_pct - cfg.slippage_pct) : 0), 0);

  return {
    run_id: cfg.run_id || `pisi_${Date.now()}`,
    as_of_ts: cfg.as_of_ts,
    preset_code: cfg.preset_code,
    preset_label: PresetLabel[cfg.preset_code],
    preset_version: cfg.preset_version,
    custom_override_count: cfg.custom_override_count,
    horizon_days: cfg.horizon_days,
    nav: cfg.nav,
    cash_before: cfg.cash,
    reserved_cash_value: reservedCashValue,
    available_cash_for_buys: Math.max(0, availableCash),
    peak_nav: cfg.peak_nav,
    current_portfolio_dd_pct: currentDD,
    portfolio_risk_guard: portfolioRiskGuard ? 1 : 0,
    investable_weight: effectiveInvestableWeight,
    gross_exposure_before_pct: grossExposureBefore,
    gross_exposure_target_pct: grossExposureTarget,
    expected_fee_value: totalFee,
    expected_slippage_value: totalSlippage,
    expected_cash_after: cashAfter,
    buy_count: buyCount,
    sell_count: sellCount,
    no_action_count: noActionCount,
    blocked_count: blockedCount,
    warnings,
    resolved_config: {
      min_net_return_pct: cfg.min_net_return_pct,
      max_stock_drawdown_pct: cfg.max_stock_drawdown_pct,
      risk_per_trade_pct: cfg.risk_per_trade_pct,
      base_stop_loss_pct: cfg.base_stop_loss_pct,
      max_position_pct: cfg.max_position_pct,
      horizon_days: cfg.horizon_days,
      reserved_cash_pct: cfg.reserved_cash_pct,
    },
    rule_trace: ruleTrace,
    ticker_outputs: tickerOutputs,
  };
}

/** Create zero-valued metrics for invalid forecasts */
function createZeroMetrics(): PisiDerivedMetrics {
  return {
    forecast_return_pct: 0, net_return_pct: 0,
    forecast_volatility_pct: 0, annualized_forecast_volatility_pct: 0,
    forecast_max_drawdown_pct: 0,
    forecast_peak_price: 0, forecast_trough_price: 0,
    forecast_peak_day: 0, forecast_trough_day: 0,
    upside_pct: 0, downside_pct: 0, risk_reward: 0,
    positive_day_ratio: 0, trend_score_raw: 0,
    path_efficiency: 0, path_amplitude_pct: 0,
    current_position_value: 0, current_weight_pct: 0,
    unrealized_pnl_value: 0, unrealized_pnl_pct: 0,
    forecast_position_pnl_value: 0, forecast_position_pnl_pct: 0,
  };
}
