# API Contract — PISI Markets

## Overview

All API routes return JSON. Frontend data access functions are in `lib/api/market.ts`.

Currently, the frontend uses **mock data** directly. API routes exist but are not yet consumed by the UI. When the backend is ready, swap the mock imports in `lib/api/market.ts` to `fetch()` calls.

---

## Endpoints

### Market

| Method | Path | Description | Response |
|--------|------|-------------|----------|
| GET | `/api/market/overview` | Market indices + summary | `{ indices: MarketIndex[], stocks: StockQuote[] }` |
| GET | `/api/markets?sort=...&order=...&search=...` | All stocks with filters | `StockQuote[]` |

### Stocks

| Method | Path | Description | Response |
|--------|------|-------------|----------|
| GET | `/api/stocks/[symbol]/quote` | Single stock quote | `StockQuote` |
| GET | `/api/stocks/[symbol]/news` | News for a stock | `NewsItem[]` |

### News

| Method | Path | Description | Response |
|--------|------|-------------|----------|
| GET | `/api/news` | All news articles | `NewsItem[]` |
| GET | `/api/news/[id]` | Single news article | `NewsItem` |

### Metrics

| Method | Path | Description | Response |
|--------|------|-------------|----------|
| GET | `/api/metrics/[metric]` | Metric explainer data | `MetricData` |

### User (Auth Required)

| Method | Path | Description | Response |
|--------|------|-------------|----------|
| GET | `/api/user/watchlist` | Get user's watchlist | `string[]` |
| POST | `/api/user/watchlist` | Add to watchlist | `{ success: boolean }` |
| DELETE | `/api/user/watchlist/[symbol]` | Remove from watchlist | `{ success: boolean }` |
| GET | `/api/user/saved-news` | Get saved news | `NewsItem[]` |
| POST | `/api/user/saved-news` | Save a news article | `{ success: boolean }` |
| DELETE | `/api/user/saved-news/[id]` | Remove saved news | `{ success: boolean }` |
| GET | `/api/user/recommendations` | AI recommendations | `Recommendation[]` |
| GET | `/api/user/recent-symbols` | Recently viewed | `string[]` |
| POST | `/api/user/recent-symbols` | Track view | `{ success: boolean }` |

---

## Shared Types

See `types/market.ts` for full TypeScript definitions.

```typescript
interface MarketSymbol {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  marketCap: string;
  volume: string;
  high52Week: number;
  low52Week: number;
  pe: number;
  dividend: number;
  exchange: string;
  sector: string;
}

interface MarketNewsItem {
  id: string;
  title: string;
  description: string;
  content: string;
  source: string;
  timestamp: string;
  category: string;
}
```

---

## Notes

- All user endpoints require Supabase auth (JWT in cookies)
- Mock data is in `lib/market/mock-data.ts`
- Frontend data access layer is in `lib/api/market.ts`
- No real money movement is implemented yet
- All financial data shown is simulated
