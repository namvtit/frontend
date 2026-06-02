# PISI Markets — Stock Market MVP

A premium fintech stock market web application built with Next.js, TypeScript, Tailwind CSS, and Supabase. Features market overview, stock screening, news feed, AI Agent, and personalized dashboard.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Auth & Database**: Supabase (PostgreSQL + Auth)
- **Charts**: TradingView Widget (MVP)
- **Icons**: Lucide React
- **State**: React hooks (client-side)

## Features

- 📊 Market overview with indices, gainers, losers, trending
- 🔍 Sortable, filterable market table with search
- 📈 Stock detail pages with TradingView charts
- 📰 News feed with categories, sentiment, and detail pages
- 🤖 AI Agent with mock responses (Phase 1)
- 👤 User dashboard with watchlist, recommendations, alerts
- 🌓 Light/dark mode
- 📱 Responsive mobile layout with bottom nav
- 📐 14 metric detail pages with Vietnamese explanations

## Local Setup

```bash
npm install
copy .env.example .env.local
# Fill in your Supabase credentials
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

Create `.env.local` with:

```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-anon-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_TRADINGVIEW_ENABLED=true
```

`SUPABASE_SECRET_KEY` is optional and NOT required for MVP.

## Supabase Setup

1. Create a project at [supabase.com](https://supabase.com)
2. Get Project URL and Publishable key from Settings → API
3. Run `supabase/schema.sql` in the SQL Editor
4. **Turn off email confirmation**: Authentication → Providers → Email → Confirm Email → OFF
   - If the dashboard UI changes, search for "Confirm Email" in Supabase Auth settings.

## TradingView Note

- MVP uses TradingView's embedded widget for charts
- Chart data comes directly from TradingView
- All other data (stats, news, watchlist, AI) uses the app's own API/mock backend
- The chart component (`components/stock/TradingViewChart.tsx`) is abstracted for future replacement with custom datafeed or Lightweight Charts

## Known Limitations

- ⚠️ **Not financial advice** — This is a demo/MVP application
- Data is mock/demo and may not reflect real market conditions
- AI Agent uses mock responses (Phase 1) — no real LLM integration
- Auth pages use mock login for demo (Supabase integration ready)
- Some filters are visual-only in MVP

## Roadmap

- [ ] Real market data provider integration (Alpha Vantage, Polygon.io)
- [ ] Advanced screener with real filters
- [ ] Real AI Agent backend (OpenAI/Anthropic)
- [ ] Portfolio analytics
- [ ] Real-time alerts (WebSocket)
- [ ] Supabase Auth full integration
- [ ] Custom chart with Lightweight Charts
- [ ] Social features and sharing
