// ── Seed data for the demo account ──
import type { DemoState } from './types';

export function createSeedState(): DemoState {
  const now = new Date().toISOString();
  return {
    cashBalance: 100_000,
    holdings: {},
    transactions: [],
    watchlist: ['AAPL', 'MSFT', 'NVDA', 'TSLA', 'AMZN', 'GOOGL', 'META', 'SPY'],
    notifications: [
      {
        id: 'seed_n1',
        title: 'Chào mừng bạn!',
        message: 'Tài khoản đã được khởi tạo với $100,000 USD tiền mặt. Bạn có thể bắt đầu thực hiện các giao dịch.',
        type: 'info',
        icon: '👋',
        time: 'Vừa xong',
        read: false,
      },
      {
        id: 'seed_al1',
        title: 'Cảnh báo AI: NVDA quá mua ngắn hạn',
        message: 'Chỉ số RSI của NVDA đạt mức 82.4, vùng quá mua cực hạn trên khung H1.',
        type: 'warning',
        icon: '⚠️',
        time: 'Vừa xong',
        read: false,
      },
    ],
    chatHistory: [],
    aiProfile: {},
    marketCache: {},
    lastUpdatedAt: now,
  };
}
