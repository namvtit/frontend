# 📋 Component Data Contract — Hướng dẫn kết nối Backend

> File này ghi lại **tất cả mock data, props, state, và cấu trúc dữ liệu** của các component UI đã tạo.
> Khi kết nối backend thật, chỉ cần thay mock data bằng API response theo đúng format dưới đây.

---

## Mục lục

1. [AIPredictionChart](#1-aipredictionchart) — Biểu đồ dự đoán AI (VIP locked)
2. [RiskManagementCard](#2-riskmanagementcard) — Quản trị rủi ro
3. [AiTradingSuggestions](#3-aitradingsuggestions) — Gợi ý giao dịch từ AI
4. [Mock API Endpoints (mới)](#4-mock-api-endpoints-đang-hoạt-động) — 3 endpoint AI/Risk
5. [Hướng dẫn kết nối Backend](#5-hướng-dẫn-kết-nối-backend-thật)
6. [Tất cả API Endpoints có sẵn](#6-tất-cả-api-endpoints-có-sẵn) — 13 endpoint gốc
7. [Mock Data Source Files](#7-mock-data-source-files) — Interfaces & data gốc

---

## 1. AIPredictionChart

**File:** `components/stock/AIPredictionChart.tsx`
**Hiển thị tại:** Trang chi tiết cổ phiếu `/stocks/[symbol]` (tab Overview & Chart)
**Thư viện:** `lightweight-charts@5.2.0`
**Trạng thái hiện tại:** 🔒 Bị khóa bởi overlay VIP

### Props

| Prop     | Type     | Default | Mô tả                          |
|----------|----------|---------|----------------------------------|
| `symbol` | `string` | —       | Mã cổ phiếu (VD: `"NVDA"`)     |
| `height` | `number` | `280`   | Chiều cao biểu đồ (px)          |

### State nội bộ

| State     | Type      | Default | Mô tả                                    |
|-----------|-----------|---------|---------------------------------------------|
| `mounted` | `boolean` | `false` | Đảm bảo chỉ render chart sau khi client mount |

### Cấu trúc Mock Data — `generateMockData(symbol)`

Hàm này trả về object với cấu trúc sau. **Khi kết nối backend, API cần trả về data đúng format này:**

```typescript
interface PredictionChartData {
  // Mảng giá lịch sử (60 ngày gần nhất, bỏ weekend)
  historical: Array<{
    time: string;   // Format: "YYYY-MM-DD" (VD: "2026-06-01")
    value: number;  // Giá đóng cửa (VD: 182.45)
  }>;

  // Mảng giá dự đoán AI (14 ngày tới, bỏ weekend)
  // ⚠️ Phần tử đầu tiên PHẢI trùng với phần tử cuối của historical (điểm nối)
  prediction: Array<{
    time: string;   // Format: "YYYY-MM-DD"
    value: number;  // Giá dự đoán
  }>;

  // Biên trên của khoảng tin cậy (confidence interval)
  // ⚠️ Phần tử đầu tiên PHẢI trùng với phần tử cuối của historical
  upperBand: Array<{
    time: string;
    value: number;  // prediction.value + spread (spread tăng dần theo ngày)
  }>;

  // Biên dưới của khoảng tin cậy
  lowerBand: Array<{
    time: string;
    value: number;  // prediction.value - spread
  }>;

  // Thông số tổng hợp hiển thị ở footer
  lastPrice: number;          // Giá hiện tại (VD: 182.45)
  predChange: number;         // Chênh lệch dự đoán so với hiện tại (VD: +5.32 hoặc -3.21)
  predChangePercent: number;  // Phần trăm thay đổi (VD: 2.92 hoặc -1.76)
}
```

### Tham số biểu đồ Lightweight Charts

| Tham số                  | Giá trị                                |
|--------------------------|----------------------------------------|
| Chart height             | `280px` (mặc định)                     |
| Historical line color    | Light: `#7c3aed` / Dark: `#a78bfa`     |
| Historical line width    | `2`                                    |
| Historical line type     | `LineType.Curved`                      |
| Prediction line style    | `LineStyle.Dashed`                     |
| Prediction line width    | `2`                                    |
| Prediction color (tăng)  | Light: `#10b981` / Dark: `#34d399`     |
| Prediction color (giảm)  | Light: `#ef4444` / Dark: `#f87171`     |
| Confidence band style    | `LineStyle.Dotted`, width `1`          |
| Confidence band opacity  | `0.12` (light) / `0.15` (dark)         |
| Marker "Hôm nay"        | `shape: "circle"`, `position: "aboveBar"` |
| Grid lines               | Opacity `0.04`                         |
| Font                     | `'Inter', system-ui, sans-serif`, `11px` |

### VIP Lock Overlay

| Thuộc tính         | Giá trị                                    |
|--------------------|--------------------------------------------|
| Blur nội dung      | `blur-[6px]` trên chart + footer           |
| Overlay background | `bg-background/60` (light) / `bg-background/70` (dark) |
| Lock icon          | Gradient `amber-400 → amber-600`, `64x64px` |
| Crown badge        | Gradient `amber-300 → amber-500`, `28x28px` |
| CTA button         | Gradient `amber-500 → amber-600`           |
| Giá tham khảo      | `99.000đ/tháng`                            |

> **Để mở khóa:** Thêm prop `isVip: boolean` hoặc đọc từ auth context. Khi `isVip === true`, bỏ div overlay và bỏ `blur` + `pointer-events-none` trên nội dung.

---

## 2. RiskManagementCard

**File:** `components/dashboard/RiskManagementCard.tsx`
**Hiển thị tại:** Trang Dashboard `/dashboard`

### Props

> Component hiện **không nhận props**. Toàn bộ data đọc từ mock constant.
> Khi kết nối backend, nên chuyển sang nhận props hoặc fetch từ API.

### State nội bộ

| State        | Type      | Default | Mô tả                          |
|--------------|-----------|---------|----------------------------------|
| `showAlerts` | `boolean` | `true`  | Hiển thị/ẩn danh sách cảnh báo |

### Cấu trúc Mock Data — `MOCK_RISK_DATA`

```typescript
interface RiskData {
  totalCapital: number;      // Tổng vốn (VD: 487234.56)
  pnl: number;               // PnL tạm tính (VD: 12845.32, âm nếu lỗ)
  pnlPercent: number;        // PnL phần trăm (VD: 2.64)
  riskScore: number;         // Điểm rủi ro 0-100 (hiển thị trên donut gauge)
                             //   0-33: "Thấp" (màu #10b981 emerald)
                             //   34-66: "Trung bình" (màu #f97316 orange)
                             //   67-100: "Cao" (màu #ef4444 red)
  currentDrawdown: number;   // Drawdown hiện tại % (VD: 4.8)
  maxDrawdown: number;       // Ngưỡng drawdown tối đa % (VD: 15)
  openRiskTotal: number;     // Tổng rủi ro đang mở bằng tiền (VD: 24361.73)
  openRiskPercent: number;   // Tổng rủi ro đang mở % tổng vốn (VD: 5.0)
}
```

### Giá trị mock hiện tại

```json
{
  "totalCapital": 487234.56,
  "pnl": 12845.32,
  "pnlPercent": 2.64,
  "riskScore": 62,
  "currentDrawdown": 4.8,
  "maxDrawdown": 15,
  "openRiskTotal": 24361.73,
  "openRiskPercent": 5.0
}
```

### Cấu trúc Mock Data — `MOCK_ALERTS`

```typescript
interface RiskAlert {
  id: string;                          // ID duy nhất (VD: "a1")
  type: 'warning' | 'danger' | 'info'; // Mức độ cảnh báo
                                        //   danger → icon đỏ (text-red-500)
                                        //   warning → icon cam (text-orange-500)
                                        //   info → icon xám (text-muted-foreground)
  title: string;                        // Tiêu đề cảnh báo
  description: string;                  // Mô tả chi tiết
}
```

### Giá trị mock hiện tại

```json
[
  { "id": "a1", "type": "warning", "title": "Rủi ro mỗi lệnh đang cao", "description": "Lệnh NVDA chiếm 8.2% tổng vốn, vượt ngưỡng 5% khuyến nghị." },
  { "id": "a2", "type": "danger",  "title": "Drawdown vượt ngưỡng", "description": "Drawdown hiện tại 4.8% đang tiến gần ngưỡng cảnh báo 5%." },
  { "id": "a3", "type": "warning", "title": "Đòn bẩy cao", "description": "Tổng đòn bẩy danh mục đang ở mức 2.3x, vượt mức an toàn 2x." },
  { "id": "a4", "type": "info",    "title": "Risk/Reward chưa tốt", "description": "3/5 lệnh đang mở có tỷ lệ R:R dưới 1:2. Nên cân nhắc điều chỉnh SL/TP." }
]
```

### Tham số giao diện Donut Gauge

| Tham số         | Giá trị      |
|-----------------|--------------|
| SVG size        | `140x140px`  |
| Radius          | `52`         |
| Stroke width    | `16`         |
| Background ring | `#e5e7eb` (light) / `zinc-700` (dark) |
| Animation       | `transition-all duration-1000` |

---

## 3. AiTradingSuggestions

**File:** `components/dashboard/AiTradingSuggestions.tsx`
**Hiển thị tại:** Trang Dashboard `/dashboard`

### Props

> Component hiện **không nhận props**. Toàn bộ data đọc từ mock constant.

### State nội bộ

| State                | Type                                        | Default | Mô tả                        |
|----------------------|---------------------------------------------|---------|-------------------------------|
| `selectedSuggestion` | `AiSuggestion \| null`                      | `null`  | Gợi ý đang xem chi tiết (modal) |
| `filter`             | `'all' \| 'BUY' \| 'SELL' \| 'HOLD' \| 'WAIT'` | `'all'` | Bộ lọc tín hiệu              |

### Cấu trúc Mock Data — `MOCK_SUGGESTIONS`

```typescript
interface AiSuggestion {
  id: string;                              // ID duy nhất (VD: "s1")
  symbol: string;                          // Mã tài sản (VD: "BTCUSDT", "NVDA")
  signal: 'BUY' | 'SELL' | 'HOLD' | 'WAIT'; // Tín hiệu giao dịch
  confidence: number;                      // Độ tin cậy 0-100%
                                           //   >= 85: progress bar màu emerald
                                           //   >= 70: progress bar màu amber
                                           //   < 70: progress bar màu red
  riskLevel: 'low' | 'medium' | 'high';   // Mức rủi ro
                                           //   low → "Thấp" (emerald)
                                           //   medium → "Trung bình" (orange)
                                           //   high → "Cao" (red)
  entryZone: string;                       // Vùng giá vào lệnh (VD: "$101,200 – $102,500")
  stopLoss: string;                        // Giá dừng lỗ (VD: "$98,800")
  takeProfit: string;                      // Giá chốt lời (VD: "$108,500")
  riskReward: string;                      // Tỷ lệ Risk:Reward (VD: "1:2.4")
  reason: string;                          // Lý do phân tích chi tiết
  warning: string;                         // Cảnh báo rủi ro
  timeframe: string;                       // Khung thời gian (VD: "H4 – D1")
}
```

### Giá trị mock hiện tại

| # | symbol   | signal | confidence | risk   | entry                  | SL        | TP        | R:R   | timeframe |
|---|----------|--------|------------|--------|------------------------|-----------|-----------|-------|-----------|
| 1 | BTCUSDT  | BUY    | 78%        | medium | $101,200 – $102,500    | $98,800   | $108,500  | 1:2.4 | H4 – D1   |
| 2 | ETHUSDT  | WAIT   | 45%        | high   | $3,850 – $3,920        | $3,700    | $4,200    | 1:1.8 | H4        |
| 3 | XAUUSD   | SELL   | 72%        | medium | $2,385 – $2,395        | $2,415    | $2,340    | 1:2.2 | D1        |
| 4 | NVDA     | BUY    | 85%        | low    | $132.00 – $136.00      | $127.50   | $152.00   | 1:3.1 | W1        |
| 5 | AAPL     | HOLD   | 60%        | low    | $210.00 – $215.00      | $205.00   | $230.00   | 1:2.5 | D1 – W1   |

### Màu sắc Action Badge

| Signal | Background             | Border                 | Text                     |
|--------|------------------------|------------------------|--------------------------|
| BUY    | `emerald-600/10`       | `emerald-600/30`       | `emerald-700` / `emerald-400` (dark) |
| SELL   | `red-600/10`           | `red-600/30`           | `red-700` / `red-400` (dark)       |
| HOLD   | `slate-600/10`         | `slate-600/30`         | `slate-700` / `slate-400` (dark)   |
| WAIT   | `orange-600/10`        | `orange-600/30`        | `orange-700` / `orange-400` (dark) |

---

## 4. Mock API Endpoints (Đang hoạt động)

Tất cả mock data đã được serve qua API route của Next.js. Khi dev server chạy (`npm run dev`), bạn có thể gọi trực tiếp các endpoint này.

### Bảng tổng hợp Endpoints

| # | Endpoint                           | Method | File route                                        | Dùng cho component      |
|---|------------------------------------|--------|---------------------------------------------------|-------------------------|
| 1 | `/api/risk/overview`               | GET    | `app/api/risk/overview/route.ts`                  | RiskManagementCard      |
| 2 | `/api/ai/suggestions`              | GET    | `app/api/ai/suggestions/route.ts`                 | AiTradingSuggestions    |
| 3 | `/api/ai/prediction/{symbol}`      | GET    | `app/api/ai/prediction/[symbol]/route.ts`         | AIPredictionChart       |

---

### Endpoint 1: Risk Overview

```
GET /api/risk/overview
```

**Tham số:** Không có

**Response:**
```json
{
  "metrics": {
    "totalCapital": 487234.56,
    "pnl": 12845.32,
    "pnlPercent": 2.64,
    "riskScore": 62,
    "currentDrawdown": 4.8,
    "maxDrawdown": 15,
    "openRiskTotal": 24361.73,
    "openRiskPercent": 5.0
  },
  "alerts": [
    {
      "id": "a1",
      "type": "warning",
      "title": "Rủi ro mỗi lệnh đang cao",
      "description": "Lệnh NVDA chiếm 8.2% tổng vốn, vượt ngưỡng 5% khuyến nghị."
    },
    {
      "id": "a2",
      "type": "danger",
      "title": "Drawdown vượt ngưỡng",
      "description": "Drawdown hiện tại 4.8% đang tiến gần ngưỡng cảnh báo 5%."
    },
    {
      "id": "a3",
      "type": "warning",
      "title": "Đòn bẩy cao",
      "description": "Tổng đòn bẩy danh mục đang ở mức 2.3x, vượt mức an toàn 2x."
    },
    {
      "id": "a4",
      "type": "info",
      "title": "Risk/Reward chưa tốt",
      "description": "3/5 lệnh đang mở có tỷ lệ R:R dưới 1:2. Nên cân nhắc điều chỉnh SL/TP."
    }
  ],
  "updatedAt": "2026-06-03T07:00:00.000Z"
}
```

---

### Endpoint 2: AI Suggestions

```
GET /api/ai/suggestions
GET /api/ai/suggestions?signal=BUY
```

**Query Parameters:**

| Param    | Type   | Bắt buộc | Mô tả                                         |
|----------|--------|----------|------------------------------------------------|
| `signal` | string | Không    | Lọc theo tín hiệu: `BUY`, `SELL`, `HOLD`, `WAIT`. Bỏ trống = tất cả |

**Response:**
```json
{
  "suggestions": [
    {
      "id": "s1",
      "symbol": "BTCUSDT",
      "signal": "BUY",
      "confidence": 78,
      "riskLevel": "medium",
      "entryZone": "$101,200 – $102,500",
      "stopLoss": "$98,800",
      "takeProfit": "$108,500",
      "riskReward": "1:2.4",
      "reason": "BTC đang tích lũy trên vùng hỗ trợ mạnh...",
      "warning": "Biến động cao quanh vùng $100K...",
      "timeframe": "H4 – D1"
    }
  ],
  "total": 5,
  "filtered": 2,
  "updatedAt": "2026-06-03T07:00:00.000Z"
}
```

---

### Endpoint 3: AI Prediction

```
GET /api/ai/prediction/{symbol}
```

**Path Parameters:**

| Param    | Type   | Mô tả                              |
|----------|--------|--------------------------------------|
| `symbol` | string | Mã cổ phiếu (VD: `NVDA`, `AAPL`)   |

**Response:**
```json
{
  "symbol": "NVDA",
  "historical": [
    { "time": "2026-04-01", "value": 178.23 },
    { "time": "2026-04-02", "value": 180.15 }
  ],
  "prediction": [
    { "time": "2026-06-03", "value": 195.50 },
    { "time": "2026-06-04", "value": 196.12 }
  ],
  "upperBand": [
    { "time": "2026-06-03", "value": 195.50 },
    { "time": "2026-06-04", "value": 197.72 }
  ],
  "lowerBand": [
    { "time": "2026-06-03", "value": 195.50 },
    { "time": "2026-06-04", "value": 194.52 }
  ],
  "lastPrice": 195.50,
  "predChange": 3.87,
  "predChangePercent": 2.02,
  "trend": "bullish",
  "predictionDays": 14,
  "historicalDays": 60,
  "updatedAt": "2026-06-03T07:00:00.000Z"
}
```

> **Lưu ý:** Phần tử đầu tiên của `prediction`, `upperBand`, `lowerBand` luôn trùng với phần tử cuối của `historical` (điểm nối giữa lịch sử và dự đoán).

---

## 5. Hướng dẫn kết nối Backend thật

### Bước 1: Test mock endpoint trước

```bash
# Chạy dev server
npm run dev

# Test bằng curl hoặc browser
curl http://localhost:3000/api/risk/overview
curl http://localhost:3000/api/ai/suggestions
curl http://localhost:3000/api/ai/suggestions?signal=BUY
curl http://localhost:3000/api/ai/prediction/NVDA
```

### Bước 2: Khi backend thật sẵn sàng

**Cách 1 — Thay nội dung route file (đơn giản nhất):**

Mở file route (VD: `app/api/risk/overview/route.ts`), thay mock data bằng fetch từ backend:

```typescript
// Trước (mock)
export async function GET() {
  return NextResponse.json({ metrics: MOCK_RISK_DATA, alerts: MOCK_ALERTS });
}

// Sau (backend thật)
export async function GET() {
  const res = await fetch(`${process.env.BACKEND_URL}/risk/overview`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  const data = await res.json();
  return NextResponse.json(data);
}
```

**Cách 2 — Component fetch trực tiếp từ backend:**

Bỏ qua Next.js API route, cho component gọi thẳng backend:

```typescript
// Thêm vào .env.local
NEXT_PUBLIC_API_BASE_URL=https://your-backend.com/api

// Trong component
const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/risk/overview`);
const data = await res.json();
```

### Bước 3: Cập nhật component nhận data từ API

```tsx
// Trước: component tự đọc mock constant
export function RiskManagementCard() {
  const data = MOCK_RISK_DATA;
}

// Sau: component nhận props từ API response
export function RiskManagementCard({ data, alerts }: {
  data: RiskData;
  alerts: RiskAlert[];
}) {
  // ...
}
```

### Biến môi trường

```env
# .env.local
NEXT_PUBLIC_API_BASE_URL=https://your-backend.com/api
BACKEND_URL=https://your-backend.com/api  # Server-side only
```

---

## 6. Tất cả API Endpoints có sẵn

Ngoài 3 endpoint mới ở section 4, dự án còn **13 endpoint gốc** đã hoạt động:

### Bảng tổng hợp (13 endpoints gốc)

| # | Endpoint | Method | Mô tả |
|---|----------|--------|--------|
| 1 | `/api/market/overview` | GET | Tổng quan thị trường (indices, trending, gainers, losers) |
| 2 | `/api/markets` | GET | Stock screener (search, filter, sort) |
| 3 | `/api/metrics/{metric}` | GET | Chi tiết chỉ số tài chính (P/E, EPS...) |
| 4 | `/api/news` | GET | Danh sách tin tức |
| 5 | `/api/news/{id}` | GET | Chi tiết một tin tức |
| 6 | `/api/stocks/{symbol}/quote` | GET | Báo giá cổ phiếu |
| 7 | `/api/stocks/{symbol}/news` | GET | Tin tức theo mã cổ phiếu |
| 8 | `/api/user/recent-symbols` | GET, POST | Mã xem gần đây |
| 9 | `/api/user/recommendations` | GET | Gợi ý cổ phiếu |
| 10 | `/api/user/saved-news` | GET, POST | Tin đã lưu |
| 11 | `/api/user/saved-news/{id}` | DELETE | Xóa tin đã lưu |
| 12 | `/api/user/watchlist` | GET, POST | Danh sách theo dõi |
| 13 | `/api/user/watchlist/{symbol}` | DELETE | Xóa khỏi watchlist |

---

### 6.1 Market Overview
```
GET /api/market/overview
```
**Response:** `{ indices: MarketIndex[], trending, gainers, losers, marketTable: StockQuote[], latestNews: NewsItem[] }`
**Mock source:** `lib/market/mock-data.ts` → `INDICES`, `STOCKS`, `NEWS`, `getGainers()`, `getLosers()`, `getTrending()`

---

### 6.2 Markets (Stock Screener)
```
GET /api/markets?search=NVDA&sector=Technology&sort=marketCap&dir=desc
```
**Query params:** `search` (string), `sector` (string), `sort` (field name, default `marketCap`), `dir` (`asc`|`desc`)
**Response:** `{ data: StockQuote[], total: number }`
**Mock source:** `lib/market/mock-data.ts` → `STOCKS`

---

### 6.3 Metric Detail
```
GET /api/metrics/{metric}
```
**Path param:** `metric` — slug (VD: `pe-ratio`, `market-cap`, `eps`, `dividend-yield`, `beta`, `52-week-high`, `52-week-low`, `volume`)
**Response:** `{ slug, name, nameVi, description, formula?, whyItMatters, relatedMetrics: string[] }`
**Mock source:** `lib/market/metrics-data.ts` → `getMetricBySlug()`

---

### 6.4 News List
```
GET /api/news
```
**Response:** `{ data: NewsItem[] }`
**Mock source:** `lib/market/mock-data.ts` → `NEWS`

---

### 6.5 News Detail
```
GET /api/news/{id}
```
**Path param:** `id` — news ID
**Response:** Single `NewsItem` object
**Mock source:** `lib/market/mock-data.ts` → `getNewsById()`

---

### 6.6 Stock Quote
```
GET /api/stocks/{symbol}/quote
```
**Path param:** `symbol` — mã cổ phiếu (VD: `AAPL`)
**Response:**
```json
{
  "symbol": "AAPL", "name": "Apple Inc.", "price": 213.25,
  "change": 3.12, "changePercent": 1.48, "exchange": "NASDAQ",
  "currency": "USD", "marketCap": 3280000000000, "volume": 54200000,
  "peRatio": 33.2, "eps": 6.42, "dividendYield": 0.44, "beta": 1.24,
  "high52w": 237.23, "low52w": 164.08, "sector": "Technology",
  "updatedAt": "2026-06-03T07:06:00.000Z"
}
```
**Mock source:** `lib/market/mock-data.ts` → `getStockBySymbol()`

---

### 6.7 Stock News
```
GET /api/stocks/{symbol}/news
```
**Path param:** `symbol`
**Response:** `{ data: NewsItem[] }` — lọc theo `symbols` chứa `symbol`
**Mock source:** `lib/market/mock-data.ts` → `getNewsForSymbol()`

---

### 6.8 User Recent Symbols
```
GET /api/user/recent-symbols
POST /api/user/recent-symbols  →  body: { symbol, name }
```
**GET Response:** `{ data: [{ symbol, name, viewed_at }] }`
**POST Response:** `{ data: <body>, message: "Symbol recorded" }`
**Mock source:** Inline array (GOOGL, META, AMZN)

---

### 6.9 User Recommendations
```
GET /api/user/recommendations
```
**Response:**
```json
{
  "data": [
    { "symbol": "NVDA", "reason": "Doanh thu kỷ lục, nhiều tin tích cực", "type": "news" },
    { "symbol": "AAPL", "reason": "Gần 52-week high, sản phẩm mới", "type": "technical" },
    { "symbol": "TSLA", "reason": "Biến động mạnh, volume cao", "type": "volatility" },
    { "symbol": "MSFT", "reason": "Đầu tư AI lớn, triển vọng tốt", "type": "fundamental" }
  ]
}
```
**Mock source:** Inline array trong route file

---

### 6.10 User Saved News
```
GET /api/user/saved-news
POST /api/user/saved-news  →  body: { newsId, ... }
```
**GET Response:** `{ data: NewsItem[] }` — 3 tin đầu kèm `saved_at`
**POST Response:** `{ data: { id, ...body }, message: "News saved" }`
**Mock source:** `lib/market/mock-data.ts` → `NEWS.slice(0,3)`

---

### 6.11 Delete Saved News
```
DELETE /api/user/saved-news/{id}
```
**Response:** `{ message: "Removed saved news {id}" }`

---

### 6.12 User Watchlist
```
GET /api/user/watchlist
POST /api/user/watchlist  →  body: { symbol, name, ... }
```
**GET Response:**
```json
{
  "data": [
    { "id": "1", "symbol": "AAPL", "name": "Apple Inc.", "asset_type": "stock", "exchange": "NASDAQ" },
    { "id": "2", "symbol": "NVDA", "name": "NVIDIA Corp.", "asset_type": "stock", "exchange": "NASDAQ" }
  ]
}
```
**POST Response:** `{ data: { id, ...body }, message: "Added to watchlist" }`
**Mock source:** Inline `mockWatchlist` array (AAPL, NVDA, MSFT, TSLA, SPY)

---

### 6.13 Remove from Watchlist
```
DELETE /api/user/watchlist/{symbol}
```
**Response:** `{ message: "Removed {symbol} from watchlist" }`

---

## 7. Mock Data Source Files

Tất cả mock data đều nằm trong thư mục `lib/`. Khi kết nối backend, thay thế các file này hoặc bỏ qua chúng.

### 7.1 `lib/market/mock-data.ts`

Chứa 4 interface chính và tất cả dữ liệu mock:

```typescript
interface StockQuote {
  symbol: string; name: string; price: number; change: number; changePercent: number;
  exchange: string; currency: string; marketCap: number; volume: number;
  peRatio: number; eps: number; dividendYield: number; beta: number;
  high52w: number; low52w: number; sector: string; sparkline: number[];
  day1: number; week1: number; month1: number; ytd: number;
}

interface NewsItem {
  id: string; title: string; summary: string; source: string; category: string;
  publishedAt: string; symbols: string[]; sentiment: "bullish" | "bearish" | "neutral";
  imageUrl?: string; content?: string;
}

interface MarketIndex {
  symbol: string; name: string; value: number; change: number; changePercent: number;
}

interface EconomicEvent {
  id: string; time: string; currency: string; impact: 'high' | 'medium' | 'low';
  event: string; actual?: string; forecast: string; previous: string;
}
```

**Exported constants:** `STOCKS` (15 cổ phiếu), `INDICES` (4 chỉ số), `NEWS` (5 tin), `ECONOMIC_CALENDAR` (5 sự kiện)
**Exported functions:** `getStockBySymbol()`, `getGainers()`, `getLosers()`, `getMostActive()`, `getTrending()`, `getNewsForSymbol()`, `getNewsById()`

### 7.2 `lib/market/metrics-data.ts`

Chứa dữ liệu giải thích các chỉ số tài chính (P/E, EPS, Market Cap, v.v.)
**Exported:** `METRICS` array, `getMetricBySlug(slug)`

### 7.3 `lib/ai/mock-agent.ts`

Mock AI chatbot cho tab AI Q&A trong trang chi tiết cổ phiếu.
**Exported:** `getMockAIResponse()`, `STOCK_PROMPTS`

### 7.4 `lib/ai/types.ts`

TypeScript types cho AI chat messages.
**Exported:** `AIMessage`, `AICard`

---

> **Lần cập nhật cuối:** 2026-06-03
> **Document này bao gồm:** 3 component UI mới + 16 API endpoints (3 mới + 13 gốc) + 4 mock data source files
