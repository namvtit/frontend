// ── Replay Engine — Pure deterministic state management ──
// All prices, trades, P&L, drawdown, allocation, and adherence scores are deterministic

import type {
  ReplayState,
  ReplayConfig,
  ReplayMessage,
  ReplayPrice,
  DecisionCheckpoint,
  ReplaySnapshot,
  ReplayMetrics,
  PortfolioProposal,
  RiskProfile,
  ReplayAction,
  HoldingSnapshot,
  GridLevel,
} from './types';
import {
  generateReplayHistory,
  getPriceAtDate,
  getTradingDays,
  calculateBuyAndHoldReturn,
} from './historical-data';
import { getCompanyBySymbol, type SP100Company } from './sp100Universe';
import { getEventsForReplay } from './events';
import { getStockBySymbol } from '@/lib/market/mock-data';

// Currency conversion (USD to VND)
const USD_TO_VND = 25000;

// Trading fee (0.15%)
const TRADING_FEE = 0.0015;

// ── Seeded PRNG (mulberry32) for deterministic data ──

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── Portfolio Builder ──

export interface BuildPortfolioOptions {
  riskProfile: RiskProfile;
  capital: number;
  excludedTickers?: string[];
  preferredSectors?: string[];
}

export function buildPortfolio(options: BuildPortfolioOptions): PortfolioProposal {
  const { riskProfile, capital, excludedTickers = [], preferredSectors = [] } = options;

  // Define stock universe with replay support
  const stocks: Array<{
    symbol: string;
    name: string;
    sector: string;
    volatility: number;
    role: 'Core quality' | 'Growth' | 'Defensive' | 'Diversifier' | 'Cash-flow / value';
    confidence: number;
  }> = [
    { symbol: 'AAPL', name: 'Apple Inc.', sector: 'Technology', volatility: 1.2, role: 'Core quality', confidence: 78 },
    { symbol: 'MSFT', name: 'Microsoft Corp.', sector: 'Technology', volatility: 0.9, role: 'Core quality', confidence: 82 },
    { symbol: 'NVDA', name: 'NVIDIA Corp.', sector: 'Technology', volatility: 1.7, role: 'Growth', confidence: 85 },
    { symbol: 'JPM', name: 'JPMorgan Chase', sector: 'Financials', volatility: 1.1, role: 'Cash-flow / value', confidence: 70 },
    { symbol: 'V', name: 'Visa Inc.', sector: 'Financials', volatility: 0.95, role: 'Core quality', confidence: 75 },
    { symbol: 'JNJ', name: 'Johnson & Johnson', sector: 'Healthcare', volatility: 0.85, role: 'Defensive', confidence: 72 },
    { symbol: 'KO', name: 'Coca-Cola Co.', sector: 'Consumer', volatility: 0.8, role: 'Defensive', confidence: 68 },
    { symbol: 'PG', name: 'Procter & Gamble', sector: 'Consumer', volatility: 0.75, role: 'Defensive', confidence: 70 },
    { symbol: 'SPY', name: 'SPDR S&P 500 ETF', sector: 'Defensives', volatility: 1.0, role: 'Diversifier', confidence: 80 },
    { symbol: 'LLY', name: 'Eli Lilly', sector: 'Healthcare', volatility: 1.3, role: 'Growth', confidence: 74 },
  ];

  // Filter out excluded tickers
  let available = stocks.filter(s => !excludedTickers.includes(s.symbol));

  // Prioritize preferred sectors
  if (preferredSectors.length > 0) {
    available = [
      ...available.filter(s => preferredSectors.includes(s.sector)),
      ...available.filter(s => !preferredSectors.includes(s.sector)),
    ];
  }

  // Select stocks based on risk profile
  let selected: typeof stocks;
  let cashReserve: number;

  switch (riskProfile) {
    case 'conservative':
      selected = available.slice(0, 4); // Lower volatility
      cashReserve = 20;
      break;
    case 'balanced':
      selected = available.slice(0, 4);
      cashReserve = 15;
      break;
    case 'growth':
      selected = available.slice(0, 4);
      cashReserve = 10;
      break;
  }

  // Calculate allocations
  const equityPercent = 100 - cashReserve;
  const numStocks = Math.min(selected.length, 4);
  const baseAllocation = Math.floor(equityPercent / numStocks);
  const remainder = equityPercent - baseAllocation * numStocks;

  const holdings = selected.slice(0, numStocks).map((stock, i) => {
    const allocation = baseAllocation + (i === 0 ? remainder : 0);
    return {
      symbol: stock.symbol,
      name: stock.name,
      allocation,
      role: stock.role,
      riskLabel: (stock.volatility > 1.3 ? 'Cao' : stock.volatility > 1.0 ? 'Trung bình' : 'Thấp') as 'Thấp' | 'Trung bình' | 'Cao',
      pisiConfidence: stock.confidence,
      reason: stock.role === 'Core quality'
        ? 'Doanh nghiệp ổn định với vị thế cạnh tranh mạnh.'
        : stock.role === 'Growth'
        ? 'Tiềm năng tăng trưởng cao từ xu hướng thị trường.'
        : 'Dòng tiền ổn định, phù hợp với danh mục đa dạng.',
    };
  });

  const riskScore = riskProfile === 'growth' ? 65 : riskProfile === 'balanced' ? 50 : 35;
  const sectorConcentration: Record<string, number> = {};
  for (const h of holdings) {
    const stock = stocks.find(s => s.symbol === h.symbol);
    if (stock) {
      sectorConcentration[stock.sector] = (sectorConcentration[stock.sector] || 0) + h.allocation;
    }
  }

  return {
    holdings,
    cashReserve,
    riskScore,
    expectedVolatility: holdings.reduce((acc, h) => {
      const stock = stocks.find(s => s.symbol === h.symbol);
      return acc + (stock?.volatility || 1) * (h.allocation / 100);
    }, 0),
    sectorConcentration,
  };
}

// ── Calculate Shares from Allocation ──

export function calculateSharesForAllocation(
  symbol: string,
  allocationPercent: number,
  capital: number,
  prices: Record<string, ReplayPrice[]>,
  tradingDays: string[]
): { quantity: number; avgPrice: number; totalCost: number } {
  const priceData = prices[symbol];
  const firstTradingDay = tradingDays[0] || '2025-01-02';
  const price = priceData?.[0]?.price || (getStockBySymbol(symbol)?.price || 100) * USD_TO_VND;

  const allocationAmount = (capital * allocationPercent) / 100;
  const quantity = Math.floor(allocationAmount / price);
  const totalCost = price * quantity;
  const fee = totalCost * TRADING_FEE;
  const totalWithFee = totalCost + fee;

  return {
    quantity,
    avgPrice: price,
    totalCost: totalWithFee,
  };
}

// ── Compute Portfolio Metrics ──

export function computePortfolioMetrics(
  holdings: Record<string, { symbol: string; name: string; quantity: number; avgPrice: number; realizedPnL: number }>,
  currentPrices: Record<string, number>,
  cashBalance: number,
  initialCapital: number
): {
  totalValue: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
  holdingsList: HoldingSnapshot[];
} {
  let totalValue = cashBalance;
  let totalCost = 0;
  const holdingsList: HoldingSnapshot[] = [];

  for (const [symbol, holding] of Object.entries(holdings)) {
    const currentPrice = currentPrices[symbol] || holding.avgPrice;
    const marketValue = currentPrice * holding.quantity;
    const cost = holding.avgPrice * holding.quantity;
    const unrealizedPnL = marketValue - cost;

    totalValue += marketValue;
    totalCost += cost;

    holdingsList.push({
      symbol: holding.symbol,
      quantity: holding.quantity,
      avgPrice: holding.avgPrice,
      currentPrice,
      marketValue,
      unrealizedPnL,
      unrealizedPnLPercent: cost > 0 ? (unrealizedPnL / cost) * 100 : 0,
      allocationPercent: 0,
    });
  }

  // Calculate allocation percentages
  for (const h of holdingsList) {
    h.allocationPercent = totalValue > 0 ? (h.marketValue / totalValue) * 100 : 0;
  }

  const unrealizedPnL = totalValue - cashBalance - totalCost;
  const unrealizedPnLPercent = initialCapital > 0 ? (unrealizedPnL / initialCapital) * 100 : 0;

  return {
    totalValue,
    unrealizedPnL,
    unrealizedPnLPercent,
    holdingsList,
  };
}

// ── Compute Drawdown ──

export function computeDrawdown(snapshots: ReplaySnapshot[]): { maxDrawdown: number; maxDrawdownDate: string } {
  let maxValue = 0;
  let maxDrawdown = 0;
  let maxDrawdownDate = '';

  for (const snapshot of snapshots) {
    if (snapshot.totalAccountValue > maxValue) {
      maxValue = snapshot.totalAccountValue;
    }
    const drawdown = maxValue > 0 ? ((maxValue - snapshot.totalAccountValue) / maxValue) * 100 : 0;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
      maxDrawdownDate = snapshot.date;
    }
  }

  return { maxDrawdown, maxDrawdownDate };
}

// ── Apply Trade ──

export interface TradeResult {
  success: boolean;
  newCashBalance: number;
  newHoldings: Record<string, HoldingData>;
  realizedPnLChange: number;
  message: string;
}

export interface HoldingData {
  symbol: string;
  name: string;
  quantity: number;
  avgPrice: number;
  gridLevels: GridLevel[];
  realizedPnL: number;
}

export function applyTrade(
  action: 'buy' | 'sell',
  symbol: string,
  quantity: number,
  price: number,
  holdings: Record<string, HoldingData>,
  cashBalance: number
): TradeResult {
  const holding = holdings[symbol];
  const stockInfo = getStockBySymbol(symbol);

  if (action === 'sell') {
    if (!holding || holding.quantity < quantity) {
      return {
        success: false,
        newCashBalance: cashBalance,
        newHoldings: holdings,
        realizedPnLChange: 0,
        message: `Không đủ cổ phiếu ${symbol} để bán.`,
      };
    }

    const gross = price * quantity;
    const fee = gross * TRADING_FEE;
    const net = gross - fee;
    const pnl = (price - holding.avgPrice) * quantity;

    const newQuantity = holding.quantity - quantity;
    const newHoldings = { ...holdings };

    if (newQuantity <= 0) {
      delete newHoldings[symbol];
    } else {
      newHoldings[symbol] = { ...holding, quantity: newQuantity };
    }

    return {
      success: true,
      newCashBalance: cashBalance + net,
      newHoldings,
      realizedPnLChange: pnl,
      message: `Đã bán ${quantity} cổ phiếu ${symbol} @ ${price.toLocaleString('vi-VN')} VNĐ. Lãi/lỗ: ${pnl >= 0 ? '+' : ''}${pnl.toLocaleString('vi-VN')} VNĐ.`,
    };
  }

  // Buy
  const cost = price * quantity;
  const fee = cost * TRADING_FEE;
  const totalCost = cost + fee;

  if (totalCost > cashBalance) {
    const maxQuantity = Math.floor((cashBalance * (1 - TRADING_FEE)) / price);
    if (maxQuantity <= 0) {
      return {
        success: false,
        newCashBalance: cashBalance,
        newHoldings: holdings,
        realizedPnLChange: 0,
        message: `Không đủ tiền để mua ${symbol}.`,
      };
    }
    return applyTrade('buy', symbol, maxQuantity, price, holdings, cashBalance);
  }

  const newHoldings = { ...holdings };

  if (holding) {
    const newQuantity = holding.quantity + quantity;
    const newAvgPrice = (holding.avgPrice * holding.quantity + cost) / newQuantity;
    newHoldings[symbol] = {
      ...holding,
      quantity: newQuantity,
      avgPrice: newAvgPrice,
    };
  } else {
    newHoldings[symbol] = {
      symbol,
      name: stockInfo?.name || symbol,
      quantity,
      avgPrice: price,
      gridLevels: [],
      realizedPnL: 0,
    };
  }

  return {
    success: true,
    newCashBalance: cashBalance - totalCost,
    newHoldings,
    realizedPnLChange: 0,
    message: `Đã mua ${quantity} cổ phiếu ${symbol} @ ${price.toLocaleString('vi-VN')} VNĐ.`,
  };
}

// ── Resolve Decision ──

export interface ResolveDecisionOptions {
  decisionIndex: number;
  choiceId: string;
  state: ReplayState;
}

export function resolveDecision(options: ResolveDecisionOptions): ReplayState {
  const { decisionIndex, choiceId, state } = options;
  const decision = state.decisions[decisionIndex];

  if (!decision) return state;

  const choice = decision.choices.find(c => c.id === choiceId);
  if (!choice) return state;

  let newState = { ...state };
  let cashBalance = state.cashBalance;
  let holdings = { ...state.holdings };
  let realizedPnL = state.realizedPnL;
  const messages = [...state.messages];

  // Add user choice message
  messages.push({
    id: `user_${Date.now()}`,
    role: 'user',
    content: choice.label,
    timestamp: new Date().toISOString(),
  });

  // Execute trade based on choice
  if (decision.ticker && decision.recommendation.suggestedPercent) {
    const price = state.currentPrice[decision.ticker] || 0;
    const holding = holdings[decision.ticker];

    if (holding && price > 0) {
      const percentToTrade = decision.recommendation.suggestedPercent;
      const quantity = Math.floor(holding.quantity * (percentToTrade / 100));

      if (quantity > 0) {
        // Determine action based on choice
        const isSellChoice = choiceId === 'takeprofit' || choiceId === 'adjust' || choiceId === 'sell' || choiceId === 'rotate';
        const isBuyChoice = choiceId === 'buy' || choiceId === 'grid';

        if (isSellChoice) {
          const result = applyTrade('sell', decision.ticker, quantity, price, holdings, cashBalance);
          if (result.success) {
            cashBalance = result.newCashBalance;
            holdings = result.newHoldings;
            realizedPnL += result.realizedPnLChange;

            // If rotating, buy replacement
            if (choiceId === 'rotate' && decision.replacementTicker) {
              const replacementPrice = state.currentPrice[decision.replacementTicker] || 0;
              if (replacementPrice > 0) {
                const repResult = applyTrade('buy', decision.replacementTicker, quantity, replacementPrice, holdings, cashBalance);
                if (repResult.success) {
                  cashBalance = repResult.newCashBalance;
                  holdings = repResult.newHoldings;
                }
              }
            }
          }
        } else if (isBuyChoice) {
          const allocationAmount = (state.initialCapital * percentToTrade) / 100;
          const buyQuantity = Math.floor(allocationAmount / price);
          if (buyQuantity > 0) {
            const result = applyTrade('buy', decision.ticker, buyQuantity, price, holdings, cashBalance);
            if (result.success) {
              cashBalance = result.newCashBalance;
              holdings = result.newHoldings;
            }
          }
        }
      }
    }
  }

  // Mark decision as resolved
  const newDecisions = state.decisions.map((d, i) => {
    if (i !== decisionIndex) return d;

    const tradeExecuted = decision.ticker ? {
      type: (choiceId.includes('buy') || choiceId === 'grid') ? 'buy' as const : 'sell' as const,
      symbol: decision.ticker,
      quantity: Math.floor((holdings[decision.ticker]?.quantity || 0) * ((decision.recommendation.suggestedPercent || 0) / 100)),
      price: state.currentPrice[decision.ticker] || 0,
      cashChange: cashBalance - state.cashBalance,
    } : undefined;

    return {
      ...d,
      status: 'resolved' as const,
      resolution: {
        choiceId,
        choiceLabel: choice.label,
        tradeExecuted,
        explanation: choiceId === 'keep' || choiceId === 'skip'
          ? 'Đã chọn giữ nguyên danh mục theo khuyến nghị.'
          : `Đã thực hiện: ${choice.label}. ${decision.recommendation.summary}`,
        timestamp: new Date().toISOString(),
      },
    };
  });

  // Add outcome message
  messages.push({
    id: `ai_${Date.now()}`,
    role: 'assistant',
    content: choiceId === 'keep' || choiceId === 'skip'
      ? 'Đã ghi nhận quyết định của bạn. Danh mục được giữ nguyên.'
      : `Đã thực hiện giao dịch. ${decision.ticker}: ${choice.label}.`,
    timestamp: new Date().toISOString(),
  });

  // Calculate model adherence score
  const isAccepted = !choiceId.includes('keep') && !choiceId.includes('skip');
  const adherenceScore = isAccepted ? 100 : 50;

  newState = {
    ...newState,
    cashBalance,
    holdings,
    realizedPnL,
    decisions: newDecisions,
    currentDecisionIndex: decisionIndex + 1,
    messages,
  };

  return newState;
}

// ── Calculate Model Adherence Score ──

export function calculateModelAdherence(
  decisions: DecisionCheckpoint[],
  initialCapital: number
): {
  score: number;
  accepted: number;
  modified: number;
  rejected: number;
  explanation: string;
} {
  let accepted = 0;
  let modified = 0;
  let rejected = 0;

  for (const d of decisions) {
    if (d.status !== 'resolved') continue;

    const choiceId = d.resolution?.choiceId || '';
    const isPrimary = d.choices[0]?.id === choiceId;

    if (choiceId.includes('keep') || choiceId.includes('skip')) {
      rejected++;
    } else if (isPrimary) {
      accepted++;
    } else {
      modified++;
    }
  }

  const total = accepted + modified + rejected;
  const score = total > 0 ? Math.round(((accepted + modified * 0.5) / total) * 100) : 0;

  let explanation = '';
  if (score >= 80) {
    explanation = 'Bạn đã tuân thủ cao khuyến nghị của PISI. Điều này cho thấy bạn tin tưởng vào chiến lược được đề xuất.';
  } else if (score >= 50) {
    explanation = 'Bạn đã điều chỉnh một số quyết định theo ý riêng. Đây là sự cân bằng tốt giữa tin tưởng vào hệ thống và kiểm soát cá nhân.';
  } else {
    explanation = 'Bạn đã chủ động đưa ra nhiều quyết định khác với khuyến nghị. Điều này cho thấy bạn có chiến lược riêng và tự tin với phân tích của mình.';
  }

  return { score, accepted, modified, rejected, explanation };
}

// ── Generate Decision Checkpoints ──

export function generateDecisionCheckpoints(
  config: ReplayConfig,
  holdings: Record<string, { symbol: string; name: string; quantity: number; avgPrice: number }>,
  prices: Record<string, ReplayPrice[]>,
  tradingDays: string[]
): DecisionCheckpoint[] {
  const symbols = Object.keys(holdings);
  const isGolden = config.seed === 'golden';

  const primarySymbol = symbols[0] || 'AAPL';
  const secondarySymbol = symbols[1] || 'MSFT';

  // Day indices for checkpoints spread across full year
  // Decision 1: ~day 45, Decision 2: ~day 115, Decision 3: ~day 190
  // Decision 4: ~day 275, Decision 5: ~day 355 (near end)
  const checkpointDays = [45, 115, 190, 275, 355];
  const checkpointDates = checkpointDays.map(d => {
    const idx = Math.min(d, tradingDays.length - 1);
    return tradingDays[idx] || tradingDays[0];
  });

  const getPriceAtDay = (symbol: string, day: number): number => {
    const priceData = prices[symbol];
    if (!priceData || day >= priceData.length) {
      return (getStockBySymbol(symbol)?.price || 100) * USD_TO_VND;
    }
    return priceData[day].price;
  };

  const baseConfidence = isGolden ? 75 : 65;

  // Price indices based on checkpoint days
  const p1 = getPriceAtDay(primarySymbol, 44); // Day 45
  const avgP1 = holdings[primarySymbol]?.avgPrice || p1;
  const gain1 = ((p1 - avgP1) / avgP1) * 100;

  const p2 = getPriceAtDay(secondarySymbol, 114); // Day 115
  const avgP2 = holdings[secondarySymbol]?.avgPrice || p2;
  const gain2 = ((p2 - avgP2) / avgP2) * 100;

  const p3 = getPriceAtDay(primarySymbol, 189); // Day 190
  const loss3 = ((avgP1 - p3) / avgP1) * 100;

  const p4 = getPriceAtDay(primarySymbol, 274); // Day 275
  const gridPrice = p4 * 0.95;

  const p5 = getPriceAtDay(primarySymbol, 354); // Day 355

  const decisions: DecisionCheckpoint[] = [
    // Checkpoint A: Price Volatility #1 (late January)
    {
      id: `ckpt_a_${Date.now()}`,
      index: 1,
      type: 'initial-allocation',
      title: 'Biến động thị trường đầu năm',
      date: checkpointDates[0],
      dayNumber: checkpointDays[0],
      trigger: isGolden
        ? `${primarySymbol} đã tăng ${gain1 >= 0 ? '+' : ''}${gain1.toFixed(1)}% trong tuần đầu tiên. PISI đánh giá tỷ trọng cổ phiếu growth có thể cao hơn mức tối ưu.`
        : `${primarySymbol} đã giảm ${Math.abs(loss3).toFixed(1)}% ngay tuần đầu. PISI cân nhắc tăng tiền mặt dự phòng để giảm rủi ro.`,
      ticker: primarySymbol,
      currentPrice: p1,
      avgPrice: avgP1,
      observations: [
        { label: 'Biến động tuần 1', value: `${gain1 >= 0 ? '+' : ''}${gain1.toFixed(1)}%`, direction: gain1 >= 0 ? 'positive' : 'negative' },
        { label: 'Tỷ lệ cổ phiếu', value: '85%', direction: 'negative' },
        { label: 'Tiền mặt dự phòng', value: isGolden ? '15%' : '10%', direction: 'neutral' },
        { label: 'Risk Score', value: `${isGolden ? 52 : 68}`, direction: 'neutral' },
      ],
      recommendation: {
        action: 'REBALANCE',
        summary: isGolden
          ? `Giảm 5% tỷ trọng ${primarySymbol} và chuyển sang tiền mặt dự phòng để chuẩn bị cho biến động tiếp theo.`
          : `Tăng tiền mặt dự phòng thêm 10%, giảm tỷ trọng cổ phiếu volatility cao.`,
        suggestedPercent: 5,
      },
      whyNow: [
        'Thị trường tuần đầu cho thấy xu hướng rõ ràng.',
        isGolden ? 'Cần giữ reserve cho cơ hội tái vào.' : 'Biến động sớm cảnh báo cần thận trọng hơn.',
        'PISI confidence cho portfolio role vẫn ổn định.',
      ],
      tradeoffs: [
        'Bán sớm có thể bỏ lỡ lợi nhuận nếu xu hướng tiếp tục.',
        'Giữ nguyên có thể tăng concentration risk.',
      ],
      downsideIfIgnored: [
        'Nếu thị trường điều chỉnh, danh mục không có reserve để DCA.',
      ],
      riskGuards: [
        `Giới hạn bán: tối đa 5% vị thế.`,
        'Đảm bảo tiền mặt không dưới 10%.',
      ],
      confidence: baseConfidence + 5,
      choices: [
        { id: 'adjust', label: 'Điều chỉnh theo PISI', description: 'Giảm 5% vị thế sang tiền mặt', variant: 'primary' },
        { id: 'keep', label: 'Giữ danh mục', description: 'Không thay đổi allocation', variant: 'secondary' },
      ],
      status: 'pending',
    },

    // Checkpoint B: News #1 (DeepSeek-related)
    {
      id: `ckpt_b_${Date.now()}`,
      index: 2,
      type: 'take-profit',
      title: 'Tin tức thị trường: DeepSeek',
      date: checkpointDates[1],
      dayNumber: checkpointDays[1],
      trigger: `Thị trường chứng khoán biến động sau tin tức về mô hình AI mới từ DeepSeek. Tin tức này làm dấy lên lo ngại về chi phí phát triển trí tuệ nhân tạo. ${secondarySymbol} đã tăng ${gain2 >= 0 ? '+' : ''}${gain2.toFixed(1)}% trong 3 tuần qua.`,
      ticker: secondarySymbol,
      currentPrice: p2,
      avgPrice: avgP2,
      observations: [
        { label: 'Lợi nhuận hiện tại', value: `${gain2 >= 0 ? '+' : ''}${gain2.toFixed(1)}%`, direction: 'positive' },
        { label: 'Tỷ trọng trong danh mục', value: '25%', direction: 'neutral' },
        { label: 'Tin tức thị trường', value: 'Biến động cao', direction: 'negative' },
        { label: 'Khuyến nghị chốt', value: '15%', direction: 'positive' },
      ],
      recommendation: {
        action: 'SELL',
        summary: `Chốt lời 15% vị thế ${secondarySymbol} để bảo toàn lợi nhuận và giảm rủi ro từ biến động tin tức. **Lưu ý:** Tin tức không phải là tín hiệu mua/bán tự động. PISI khuyến nghị cân nhắc kỹ trước khi hành động.`,
        suggestedPercent: 15,
      },
      whyNow: [
        `${secondarySymbol} đã vượt ngưỡng tăng trưởng mục tiêu.`,
        'Biến động tin tức có thể gây áp lực ngắn hạn.',
        'Cần cash reserve cho các cơ hội tốt hơn sắp tới.',
      ],
      tradeoffs: [
        'Bán có thể bỏ lỡ lợi nhuận tiếp theo nếu giá tiếp tục tăng.',
        'Giữ nguyên tăng concentration risk.',
      ],
      downsideIfIgnored: [
        'Nếu tin xấu tiếp tục, lợi nhuận có thể giảm.',
      ],
      riskGuards: [
        `Bán 15% - giữ 85% vị thế.`,
        'Không bán hoảng loạn vì tin tức ngắn hạn.',
      ],
      confidence: baseConfidence + 8,
      choices: [
        { id: 'takeprofit', label: 'Chốt lời theo PISI', description: 'Bán 15% vị thế', variant: 'primary' },
        { id: 'keep', label: 'Giữ toàn bộ', description: 'Không thực hiện thay đổi', variant: 'secondary' },
      ],
      status: 'pending',
    },

    // Checkpoint C: Price Volatility #2 (mid-drawdown)
    {
      id: `ckpt_c_${Date.now()}`,
      index: 3,
      type: 'sharp-decline',
      title: 'Cổ phiếu điều chỉnh mạnh',
      date: checkpointDates[2],
      dayNumber: checkpointDays[2],
      trigger: `${primarySymbol} đã giảm ${Math.abs(loss3).toFixed(1)}% trong 2 tuần. Không có tin xấu cơ bản. PISI đang phân tích signals — đây có thể là cơ hội mua thêm cho người có tầm nhìn dài hạn.`,
      ticker: primarySymbol,
      currentPrice: p3,
      avgPrice: avgP1,
      observations: [
        { label: 'Mức lỗ hiện tại', value: `-${Math.abs(loss3).toFixed(1)}%`, direction: 'negative' },
        { label: 'Volume', value: 'Bình thường', direction: 'neutral' },
        { label: 'Tin cơ bản', value: 'Không thay đổi', direction: 'positive' },
        { label: 'PISI Confidence', value: `${baseConfidence - 5}%`, direction: 'negative' },
      ],
      recommendation: {
        action: config.riskProfile === 'conservative' ? 'SELL' : 'BUY',
        summary: config.riskProfile === 'conservative'
          ? `Cắt giảm 20% vị thế để bảo toàn vốn theo hồ sơ rủi ro thận trọng.`
          : `Mua thêm có kiểm soát 10% vị thế khi các gate đều pass — đây là cơ hội DCA cho người có tầm nhìn dài hạn.`,
        suggestedPercent: config.riskProfile === 'conservative' ? 20 : 10,
      },
      whyNow: [
        `Drawdown ${Math.abs(loss3).toFixed(1)}% đang tiệm cận ngưỡng rủi ro.`,
        config.riskProfile === 'conservative' ? 'Hồ sơ thận trọng: bảo toàn vốn là ưu tiên.' : 'DIP có thể là cơ hội DCA.',
        'Chờ thêm signals trong 48 giờ tới.',
      ],
      tradeoffs: [
        config.riskProfile === 'conservative'
          ? 'Bán có thể khóa lỗ không cần thiết nếu giá phục hồi.'
          : 'Mua thêm tăng exposure trong thị trường giảm.',
      ],
      downsideIfIgnored: [
        'Nếu downtrend tiếp tục, drawdown sẽ tăng.',
      ],
      riskGuards: [
        config.riskProfile === 'conservative' ? 'Max sell: 20% vị thế.' : 'Max DCA: 10% portfolio.',
        'Không tăng tổng equity exposure quá 80%.',
      ],
      confidence: baseConfidence - 5,
      choices: [
        { id: 'buy', label: 'Mua thêm có kiểm soát', description: 'DCA theo PISI', variant: config.riskProfile === 'conservative' ? 'destructive' : 'primary' },
        { id: 'hold', label: 'Giữ nguyên', description: 'Theo dõi thêm', variant: 'secondary' },
        { id: 'sell', label: 'Cắt giảm sớm', description: 'Bán 20% vị thế', variant: 'destructive' },
      ],
      status: 'pending',
    },

    // Checkpoint D: News #2 (tariff-pause relief)
    {
      id: `ckpt_d_${Date.now()}`,
      index: 4,
      type: 'grid-reentry',
      title: 'Tin tức thị trường: Đàm phán thuế quan',
      date: checkpointDates[3],
      dayNumber: checkpointDays[3],
      trigger: `Tin tức tích cực về đàm phán thuế quan làm thị trường phục hồi. ${primarySymbol} đang ở mức giá hấp dẫn để grid mua lại sau đợt điều chỉnh trước đó.`,
      ticker: primarySymbol,
      currentPrice: p4,
      gridLevels: [
        { level: 1, price: gridPrice, filled: false },
        { level: 2, price: gridPrice * 0.97, filled: false },
        { level: 3, price: gridPrice * 0.94, filled: false },
      ],
      observations: [
        { label: 'Giá hiện tại', value: `${(p4 / 1000).toFixed(0)}K`, direction: 'neutral' },
        { label: 'Grid Level 1', value: `${(gridPrice / 1000).toFixed(0)}K`, direction: 'positive' },
        { label: 'Tin tức', value: 'Tích cực ngắn hạn', direction: 'positive' },
        { label: 'Tiền mặt available', value: '15M', direction: 'positive' },
      ],
      recommendation: {
        action: 'GRID',
        summary: `Kích hoạt Grid Level 1 - mua 5% portfolio tại ${(gridPrice / 1000).toFixed(0)}K. Sẵn sàng cho Level 2 và 3 nếu giá tiếp tục giảm. **Lưu ý:** Đây là chiến lược có kế hoạch, không phản ứng với tin tức.`,
        suggestedPercent: 5,
      },
      whyNow: [
        'Giá đã về vùng hỗ trợ kỹ thuật.',
        'Grid buy order đã set sẵn từ chiến lược trước.',
        'Risk/reward ratio hấp dẫn: upside 20%, downside 10%.',
      ],
      tradeoffs: [
        'Nếu giá tiếp tục giảm, grid sẽ tự động mua thêm.',
        'Nếu giá bounce, vẫn có position để hưởng lợi.',
      ],
      riskGuards: [
        'Max allocation cho cổ phiếu này: 25% portfolio.',
        'Dừng grid nếu giá phá vỡ hỗ trợ quan trọng.',
      ],
      confidence: baseConfidence,
      choices: [
        { id: 'grid', label: 'Thực hiện theo PISI', description: 'Kích hoạt grid mua', variant: 'primary' },
        { id: 'skip', label: 'Bỏ qua', description: 'Giữ tiền mặt', variant: 'secondary' },
      ],
      status: 'pending',
    },

    // Checkpoint E: Price Volatility #3 (recovery/take-profit)
    {
      id: `ckpt_e_${Date.now()}`,
      index: 5,
      type: 'forecast-rotation',
      title: 'Cơ hội tái cân bằng cuối kỳ',
      date: checkpointDates[4],
      dayNumber: checkpointDays[4],
      trigger: `PISI phân tích: ${primarySymbol} đã sideways 6 tuần - không có alpha. ${secondarySymbol} có signals tích cực hơn với tin tức thuế quan. Đây là thời điểm tốt để đánh giá lại danh mục.`,
      ticker: primarySymbol,
      replacementTicker: secondarySymbol,
      currentPrice: p4,
      avgPrice: p4,
      observations: [
        { label: `${primarySymbol} Trend`, value: 'Sideways +/- 5%', direction: 'neutral' },
        { label: `${secondarySymbol} Trend`, value: 'Tăng 8-12%', direction: 'positive' },
        { label: 'Confidence hiện tại', value: `${baseConfidence - 10}%`, direction: 'negative' },
        { label: 'Confidence thay thế', value: `${baseConfidence + 5}%`, direction: 'positive' },
      ],
      recommendation: {
        action: 'REBALANCE',
        summary: `Hoán đổi 10% từ ${primarySymbol} sang ${secondarySymbol} để cải thiện expected return của portfolio.`,
        suggestedPercent: 10,
        comparison: [
          { label: 'Expected Return', current: '5%', replacement: '12%', direction: 'positive' },
          { label: 'Volatility', current: 'Cao', replacement: 'Trung bình', direction: 'positive' },
          { label: 'Portfolio Role', current: 'Growth', replacement: 'Core Quality', direction: 'neutral' },
        ],
      },
      whyNow: [
        `${primarySymbol} đã sideways 6 tuần - không có alpha.`,
        `${secondarySymbol} có momentum tốt hơn từ tin tức.`,
        'Portfolio đang overweight ở một sector.',
      ],
      tradeoffs: [
        'Rotation có phí giao dịch nhỏ.',
        'Có thể bỏ lỡ breakout nếu ${primarySymbol} bất ngờ tăng.',
      ],
      downsideIfIgnored: [
        'Opportunity cost nếu ${secondarySymbol} tăng mà không có position.',
      ],
      riskGuards: [
        'Không thay đổi quá 15% portfolio trong 1 lần.',
        'Giữ diversification - không all-in một cổ phiếu.',
      ],
      confidence: baseConfidence + 10,
      choices: [
        { id: 'rotate', label: 'Tái cân bằng theo PISI', description: 'Hoán đổi sang cổ phiếu tốt hơn', variant: 'primary' },
        { id: 'keep', label: 'Giữ danh mục', description: 'Không thay đổi', variant: 'secondary' },
        { id: 'compare', label: 'So sánh hai lựa chọn', description: 'Xem chi tiết phân tích', variant: 'secondary' },
      ],
      status: 'pending',
    },
  ];

  return decisions;
}

// ── Calculate Final Metrics ──

export function calculateFinalMetrics(state: ReplayState): ReplayMetrics {
  const { snapshots, holdings, initialCapital, realizedPnL, decisions, config } = state;

  const lastSnapshot = snapshots[snapshots.length - 1];
  const finalNAV = lastSnapshot?.totalAccountValue || initialCapital;
  const totalPnL = finalNAV - initialCapital;
  const returnPercent = (totalPnL / initialCapital) * 100;

  const unrealizedPnL = lastSnapshot?.unrealizedPnL || 0;

  // Count decisions
  const decisionsCompleted = decisions.filter(d => d.status === 'resolved').length;
  const pisiRecommendationsAccepted = decisions.filter(
    d => d.status === 'resolved' && !d.resolution?.choiceId.includes('keep') && !d.resolution?.choiceId.includes('skip')
  ).length;

  // Top/weakest contributor
  const contributors = Object.entries(holdings).map(([symbol, h]) => {
    const startPrice = state.prices[symbol]?.[0]?.price || h.avgPrice;
    const currentPrice = state.currentPrice[symbol] || h.avgPrice;
    const returnPct = ((currentPrice - startPrice) / startPrice) * 100;
    return {
      symbol,
      contribution: returnPct * (h.avgPrice * h.quantity / initialCapital),
      returnPercent: returnPct,
    };
  });

  contributors.sort((a, b) => b.contribution - a.contribution);
  const topContributor = contributors[0] || { symbol: 'N/A', contribution: 0, returnPercent: 0 };
  const weakestContributor = contributors[contributors.length - 1] || { symbol: 'N/A', contribution: 0, returnPercent: 0 };

  // Buy & Hold return
  const symbols = Object.keys(holdings);
  const buyAndHoldReturn = calculateBuyAndHoldReturn(state.prices, symbols, config.startDate, config.endDate);

  // PISI Impact
  const acceptRate = decisionsCompleted > 0 ? pisiRecommendationsAccepted / decisionsCompleted : 0;
  let pisiImpact = '';
  if (acceptRate >= 0.8) {
    pisiImpact = `PISI đã giúp cải thiện kết quả đáng kể. ${pisiRecommendationsAccepted}/${decisionsCompleted} quyết định được thực hiện theo khuyến nghị.`;
  } else if (acceptRate >= 0.5) {
    pisiImpact = `PISI đã đưa ra ${pisiRecommendationsAccepted} khuyến nghị được chấp nhận, giúp cải thiện kết quả.`;
  } else {
    pisiImpact = `Kết quả phản ánh chiến lược độc lập. Tuân thủ PISI có thể cải thiện hiệu suất.`;
  }

  // Calculate max drawdown
  const { maxDrawdown } = computeDrawdown(snapshots);

  return {
    initialCapital,
    finalNAV,
    totalPnL,
    returnPercent,
    realizedPnL,
    unrealizedPnL,
    maxDrawdown,
    maxDrawdownDate: state.maxDrawdownDate,
    riskScoreStart: 50,
    riskScoreEnd: 50,
    riskScoreTrend: 'stable',
    decisionsCompleted,
    pisiRecommendationsAccepted,
    topContributor,
    weakestContributor,
    buyAndHoldReturn,
    pisiImpact,
  };
}

// ── Advance Simulation Day ──

export function advanceSimulationDay(state: ReplayState, targetDay: number): ReplayState {
  const tradingDays = getTradingDays(state.config.startDate, state.config.endDate);
  const dayIndex = Math.min(targetDay - 1, tradingDays.length - 1);
  const targetDate = tradingDays[dayIndex] || tradingDays[0];

  // Update prices
  const newPrices: Record<string, number> = {};
  for (const symbol of Object.keys(state.holdings)) {
    const priceData = state.prices[symbol];
    if (priceData && dayIndex < priceData.length) {
      newPrices[symbol] = priceData[dayIndex].price;
    } else {
      newPrices[symbol] = state.currentPrice[symbol];
    }
  }

  // Calculate snapshot
  const { totalValue, unrealizedPnL, unrealizedPnLPercent, holdingsList } = computePortfolioMetrics(
    state.holdings,
    newPrices,
    state.cashBalance,
    state.initialCapital
  );

  const snapshot: ReplaySnapshot = {
    date: targetDate,
    dayNumber: targetDay,
    cashBalance: state.cashBalance,
    holdings: holdingsList,
    totalMarketValue: totalValue - state.cashBalance,
    totalAccountValue: totalValue,
    unrealizedPnL,
    unrealizedPnLPercent,
    realizedPnL: state.realizedPnL,
    riskScore: 50,
    nav: totalValue,
    navChange: totalValue - state.initialCapital,
    navChangePercent: (totalValue - state.initialCapital) / state.initialCapital * 100,
  };

  // Update max drawdown
  let maxDrawdown = state.maxDrawdown;
  let maxDrawdownDate = state.maxDrawdownDate;

  if (state.snapshots.length > 0) {
    const { maxDrawdown: md, maxDrawdownDate: mdd } = computeDrawdown([...state.snapshots, snapshot]);
    maxDrawdown = md;
    maxDrawdownDate = mdd;
  }

  return {
    ...state,
    currentDate: targetDate,
    currentDay: targetDay,
    currentPrice: newPrices,
    snapshots: [...state.snapshots, snapshot],
    maxDrawdown,
    maxDrawdownDate,
  };
}
