export type PendingOrderDemo = {
  id: string;
  symbol: string;
  side: "BUY" | "SELL";
  quantity: number;
  limitPrice: number;
};

// PWA presentation-only placeholders. Replace this source with a future orders API.
export const PWA_PENDING_ORDER_DEMO: PendingOrderDemo[] = [
  { id: "pwa-demo-aapl", symbol: "AAPL", side: "BUY", quantity: 10, limitPrice: 228.5 },
  { id: "pwa-demo-nvda", symbol: "NVDA", side: "SELL", quantity: 5, limitPrice: 185 },
];

export const PWA_INSIGHT_DEMO = [
  {
    id: "market-status",
    title: "Thị trường Mỹ",
    detail: "Đang theo dõi phiên giao dịch",
    tone: "emerald",
  },
  {
    id: "volatility",
    title: "Cảnh báo biến động",
    detail: "Theo dõi VIX trước khi vào lệnh",
    tone: "amber",
  },
  {
    id: "pisi",
    title: "PISI insight",
    detail: "Tín hiệu AI chỉ mang tính tham khảo",
    tone: "violet",
  },
] as const;
