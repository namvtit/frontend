import { apiRequest } from './client';
import type { Holding, TradeTransaction } from '@/lib/demo/types';
import { getStockBySymbol } from '@/lib/market/mock-data';

// Keep the UI's share-class spelling while the API uses Yahoo symbols.
const uiSymbol = (symbol: string) => symbol === 'BRK-B' ? 'BRK.B' : symbol;
export interface BackendTrade {
  id: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  quantity: string;
  price: string;
  total: string;
  executed_at: string;
}

export async function loadTradingAccount() {
  const [account, history] = await Promise.all([
    apiRequest<{ portfolio: { cash: string; positions: { symbol: string; quantity: string; average_cost: string }[] } }>('/api/portfolio'),
    apiRequest<{ trades: BackendTrade[] }>('/api/trades'),
  ]);
  const holdings: Record<string, Holding> = {};
  for (const position of account.portfolio.positions) {
    const symbol = uiSymbol(position.symbol);
    holdings[symbol] = { symbol, name: getStockBySymbol(symbol)?.name || symbol,
      quantity: Number(position.quantity), avgPrice: Number(position.average_cost) };
  }
  const transactions: TradeTransaction[] = history.trades.map((trade) => {
    const symbol = uiSymbol(trade.symbol);
    return { id: trade.id, symbol, name: getStockBySymbol(symbol)?.name || symbol,
      type: trade.side === 'BUY' ? 'buy' : 'sell', quantity: Number(trade.quantity),
      price: Number(trade.price), gross: Number(trade.total), total: Number(trade.total),
      fee: 0, timestamp: trade.executed_at };
  });
  return { cashBalance: Number(account.portfolio.cash), holdings, transactions };
}
