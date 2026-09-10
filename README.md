# FinPilot — AI-Powered Stock Trading Platform (Demo)

A Next.js 16 demo of a stock-market UI: live Yahoo Finance quotes (with mock fallback), a paper-trading demo portfolio, an AI Agent chat backed by TokenRouter (OpenAI-compatible, default model `MiniMax-M3`) or a deterministic mock, the quantitative **PISI Engine** simulator, and a Fear & Greed ticker banner. UI language is Vietnamese (`<html lang="vi">`).

> **Status:** Frontend-led demo with thin Next.js route handlers. Most business logic and state remain client-side.

The self-hosted foundation uses Next.js for both frontend and backend plus PostgreSQL (see §5). The existing unused Supabase scaffold and historical references below are legacy; they are not part of this setup. UI, market data, and mock behavior are unchanged.

---

## 1. Tech Stack (verified)

| Layer | Technology | Version (from `package.json`) | Role |
|---|---|---|---|
| Framework | Next.js | `16.2.6` | App Router, Turbopack dev, standalone build |
| Language | TypeScript | `^5` | Strict mode |
| UI runtime | React | `19.2.4` | Client + server components |
| Styling | Tailwind CSS | `^4` (via `@tailwindcss/postcss`) | Utility CSS + CSS variables |
| Charts | `lightweight-charts` | `^5.2.0` | Used only by `AIPredictionChart` (dynamic import) |
| Charts (stock detail) | TradingView embed script | loaded at runtime | External widget, not an npm dep |
| Icons | `lucide-react` | `^0.511.0` | |
| Theme | `next-themes` | `^0.4.6` | Dark/light |
| Backend SDK (scaffolded) | `@supabase/supabase-js` | `^2.49.0` | Loaded only in `lib/supabase/client.ts`; not used by any page |
| Tooling | `eslint` `^9`, `eslint-config-next` `16.2.6` | Lint |
| E2E (scaffolded) | `@playwright/test` `^1.59.1` | Single `promo.spec.ts` for marketing screenshots |

Path alias: `@/*` → repo root (`tsconfig.json`).

`tsconfig.json` excludes `node_modules` and `reference`.

> ⚠ **Workspace rule:** `AGENTS.md` warns this Next.js 16 release has breaking changes — read `node_modules/next/dist/docs/` before editing framework code.

---

## 2. Project Structure

```
fe_PISI/
├── app/                                # Next.js App Router
│   ├── layout.tsx                      # Root layout (Vietnamese, theme, providers, TopNav, NewsTicker, MobileNav)
│   ├── page.tsx                        # Home dashboard
│   ├── globals.css                     # Tailwind 4 + design tokens
│   ├── icon.svg                        # App icon (replaces deleted favicon.ico)
│   ├── markets/                        # Markets screener (tabs: Cổ phiếu/ETF/Crypto/Forex/Chỉ số — all show STOCKS)
│   ├── stocks/[symbol]/                # Stock detail (7 tabs: overview/chart/news/financials/technicals/forecast/ai)
│   ├── news/, news/[id]/               # News list + detail
│   ├── metrics/[metric]/               # Metric explainer (Market Cap, P/E, EPS, Beta, …)
│   ├── dashboard/                      # Auth-gated user dashboard
│   ├── ai-agent/                       # Conversational AI Agent page
│   ├── pisi/                           # PISI Engine simulator
│   ├── enterprise/                     # Static B2B / pricing-style page
│   ├── pricing/, login/, register/     # Marketing + auth (register is a no-op mock)
│   └── api/                            # Route handlers (see API table)
│
├── components/
│   ├── providers.tsx                   # ThemeProvider + AuthProvider + DemoProvider + ToastContainer
│   ├── layout/TopNav.tsx               # Nav, theme toggle, notifications dropdown, mobile nav, TickerBanner
│   ├── market/                         # Home/listing widgets (MarketTable, MarketOverviewCards, StockCard,
│   │                                   #   FearIndexBanner, TickerBanner, NewsTicker, MiniSparkline, …)
│   ├── stock/                          # Stock detail (TradingViewChart, AIPredictionChart, OrderPanel, AIChatPanel)
│   ├── pisi/                           # PisiDashboardPanel, PisiTickerDetail, PisiScoreBreakdown, PresetSelector
│   ├── dashboard/                      # RiskManagementCard, AiTradingSuggestions
│   ├── news/                           # NewsCard, SentimentBadge
│   └── ui/toast.tsx                    # Global toast queue
│
├── lib/
│   ├── pisi/                           # PISI Engine (engine, orderPlanner, presets, storage, types, usePisiDemo, data)
│   ├── ai/                             # Mock agent + types
│   ├── market/                         # mock-data, metrics-data, use-live-prices (flash animations)
│   ├── demo/                           # Demo state context (paper trading), seed, storage, recommendation
│   ├── auth/                           # Mock AuthProvider (localStorage)
│   ├── supabase/client.ts              # Conditional Supabase client (currently unused by the UI)
│   ├── api/market.ts                   # Frontend data-access layer (functions are unused at runtime — see Cleanup)
│   └── utils/index.ts                  # cn, formatCurrency, formatLargeNumber, formatPercent, formatNumber, sparkline PRNG
│
├── public/                             # (currently empty — default Next.js placeholder SVGs were removed; see Cleanup)
├── supabase/schema.sql                 # Future Supabase schema (not applied)
├── docs/                               # API_CONTRACT.md, COMPONENT_DATA_CONTRACT.md
├── reference/v0-stock-market-ui/       # Vendored v0 reference project (excluded from `tsconfig`) — see Cleanup
├── promo.spec.ts + playwright.config.ts
├── Dockerfile + docker-compose.yml
├── next.config.ts                      # `output: "standalone"`
├── eslint.config.mjs                   # next/core-web-vitals + next/typescript
├── postcss.config.mjs                  # @tailwindcss/postcss
├── AGENTS.md                           # Next.js 16 caveat (this is not the Next.js you know)
├── CLAUDE.md                           # `@AGENTS.md`
└── package.json                        # name: "stock-market-mvp"
```

### Cleanup-applied (2026-06-22)

The following items were deleted because they had no code/config references, and the corresponding generated-output folders are now ignored by `.gitignore`:

- `public/file.svg`, `public/globe.svg`, `public/next.svg`, `public/vercel.svg`, `public/window.svg` — default Next.js placeholder SVGs.
- `artifacts/` (Playwright marketing screenshots + `promo-video.webm`).
- `ads-output/` (PNG screenshots + `website-demo-ad.webm`).
- `test-results/` (Playwright runtime byproducts).
- `tsconfig.tsbuildinfo` (TypeScript incremental cache).

`.gitignore` now also includes `/artifacts/`, `/ads-output/`, `/test-results/`. The remaining cleanup candidates (unused API routes, `lib/api/market.ts`, `lib/supabase/client.ts`, `reference/`, etc.) are listed in §10 for follow-up review.

---

## 3. Prerequisites

- **Node.js 22+** (Dockerfile uses `node:22-alpine`; `npm` ≥ 10).
- **npm** (the repo ships `package-lock.json`; pnpm/yarn lockfiles are not present).
  - Use **`npm ci`** for clean / reproducible installs (fresh clone, CI, Docker-like setups). It installs exactly what `package-lock.json` pins, without mutating the lockfile.
  - Use **`npm install`** for normal development when you need to add or update dependencies.
- **Docker** (optional) — only needed for the containerized run.
- Network egress to:
  - `query1.finance.yahoo.com` — used by `/api/market/live-quotes`.
  - `production.dataviz.cnn.io` — used by `/api/market/fear-greed`.
  - `api.tokenrouter.com` — used by `/api/ai/chat` (only when `TOKENROUTER_API_KEY` is set; defaults to `https://api.tokenrouter.com/v1`).
  - `s3.tradingview.com` — used by `TradingViewChart` widget.

If the Yahoo/CNN/TokenRouter calls fail, the corresponding API routes fall back to mock data (see §6).

---

## 4. Run Locally on Windows (PowerShell)

```powershell
cd D:\PISI\fe_PISI

# 1. Install
#    Use `npm ci` for a clean, reproducible install (matches package-lock.json exactly).
#    Use `npm install` when adding or upgrading dependencies.
npm ci
# or: npm install

# 2. (Optional) copy env template and edit
copy .env.example .env.local

# 3. Dev server with Turbopack
npm run dev
# → http://localhost:3000

# 4. Production build + start
npm run build
npm start

# 5. Lint
npm run lint
```

> The `.env.example` already provides safe placeholders. Without `TOKENROUTER_API_KEY` the chat route returns a deterministic mock response (`isMock: true`).

---

## 5. Run with Docker

```bash
cd frontend # if starting from the workspace root
cp .env.example .env
# Edit .env, especially POSTGRES_PASSWORD, before deploying.
docker compose up --build
# → http://localhost:3000
curl -f http://localhost:3000/api/health
```

Compose runs exactly two services: `web` (the existing standalone Next.js app, as non-root `nextjs`) and `postgres` (PostgreSQL 17). PostgreSQL uses a named volume, with its host port bound only to localhost. Web waits for PostgreSQL readiness, runs migrations, and starts only if migrations succeed. Its healthcheck calls `/api/health`, which executes `SELECT 1` and returns uncached HTTP 200 on success or 503 on connection failure without exposing credentials or database errors.

For local Next.js development with PostgreSQL in Docker:

```bash
cp .env.example .env # once; edit as needed
npm ci
docker compose up -d postgres
npm run db:migrate
npm run dev
```

Next.js and the migration script load `.env` using Next.js environment conventions; `.env.local` takes precedence for host commands. Compose reads `.env` and overrides the web container's database host/port to `postgres:5432`. No database credentials are needed at build time.

### SQL migrations

`npm run db:migrate` bootstraps only the `schema_migrations` tracking table. There are deliberately no business tables or SQL migrations yet. Add future migrations as immutable, zero-padded files such as `migrations/0001_description.sql`. The runner applies pending files in filename order, tracks each successful filename, and wraps each file plus its tracking entry in a transaction. An advisory lock serializes concurrent runners. Do not include transaction control or statements that cannot run in a transaction. Correct an applied migration with a new file; there is no automatic rollback command.

Migrations run automatically on container startup, or manually with `docker compose exec web node scripts/migrate.mjs`. Use `docker compose down` to stop while retaining data. `docker compose down -v` deletes the database volume. Changing initialization credentials in `.env` does not change credentials in an existing volume.

---

## 6. Environment Variables (placeholders only)

Copy `.env.example` → `.env` for Compose and local development. Real values must never be committed.

| Variable | Required? | Purpose |
|---|---|---|
| `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD` | required for DB | Shared database configuration for the app, migrations, and PostgreSQL initialization. |
| `PGHOST` | required for host DB access | `127.0.0.1` locally; overridden to `postgres` inside Compose. |
| `PGPORT` | optional | Local database port, defaults to `5432`; container uses `5432`. |
| `PORT` | optional | Web host port, defaults to `3000`. |
| `TOKENROUTER_API_KEY` | optional | When present, `/api/ai/chat` calls TokenRouter's `MiniMax-M3` via the OpenAI SDK; otherwise it returns the deterministic mock. |
| `TOKENROUTER_BASE_URL` | optional | Override for the TokenRouter base URL. Defaults to `https://api.tokenrouter.com/v1`. |
| `TOKENROUTER_MODEL` | optional | Model name passed to the chat completion call. Defaults to `MiniMax-M3`. |

---

## 7. Build / Lint / Test

| Command | Effect |
|---|---|
| `npm run dev` | Next dev server with Turbopack |
| `npm run build` | Production build (`output: "standalone"`) |
| `npm start` | Run the built server |
| `npm run lint` | `eslint` (next/core-web-vitals + next/typescript) |
| `npx playwright test` | Runs `promo.spec.ts` — captures marketing screenshots to `artifacts/`. Requires the dev server to be running on `http://localhost:3000`. |
| `npx tsc --noEmit` | Type-check (no dedicated `typecheck` script). |

There is **no unit-test runner** (no Jest/Vitest) configured.

---

## 8. Application Flow

```
Request → app/layout.tsx (Providers)
  ├─ ThemeProvider (next-themes, defaultTheme="dark")
  │  └─ AuthProvider       (lib/auth/auth-context.tsx — mock localStorage auth)
  │     └─ DemoProvider    (lib/demo/context.tsx — paper-trading reducer)
  │        └─ App + ToastContainer
  │
  ├─ TopNav (theme, notifications, mobile nav, TickerBanner)
  ├─ <main>{page}</main>
  └─ Fixed bottom: NewsTicker + MobileNav
```

### Data sources used by the running UI

| Concern | Status | Source |
|---|---|---|
| Market indices & stock list | Implemented (mock baseline) | `lib/market/mock-data.ts` (15 US tickers, seeded sparkline PRNG) |
| Live price cache for those symbols | Implemented (HTTP polling) | `app/api/market/live-quotes/route.ts` → Yahoo Finance v8 chart endpoint, polled every 5s by `DemoProvider` while tab is visible. Falls back to per-symbol mock if Yahoo fails. |
| Fear & Greed index | Implemented (real fetch + fallback) | `app/api/market/fear-greed/route.ts` → CNN DataViz, cached 1h, returns mock if unreachable. |
| News | Demo only (Vietnamese copy) | `lib/market/mock-data.ts` (`NEWS`) |
| Economic calendar | Demo only | `lib/market/mock-data.ts` (`ECONOMIC_CALENDAR`) |
| AI Agent chat | Implemented (real + mock) | `app/api/ai/chat/route.ts` → TokenRouter (OpenAI-compatible SDK, default model `MiniMax-M3`, JSON-mode, system prompt for Vietnamese). Falls back to `lib/ai/mock-agent.ts` when `TOKENROUTER_API_KEY` is missing or the provider call fails. |
| AI prediction chart | Demo only (client-generated) | `components/stock/AIPredictionChart.tsx` synthesizes a 60-day historical + 60-day forecast path locally. The `/api/ai/prediction/[symbol]` route exists but is **not consumed** by the UI. |
| AI trading suggestions widget | Demo only | `components/market/ai-suggestions.tsx` and `components/dashboard/AiTradingSuggestions.tsx` use hard-coded arrays. `/api/ai/suggestions` exists but is **not consumed** by the UI. |
| Candlestick chart on stock page | Implemented (external) | `components/stock/TradingViewChart.tsx` injects the TradingView advanced-chart script. |
| Paper trading (buy/sell) | Implemented (client-only) | `lib/demo/context.tsx` reducer + `lib/demo/storage.ts` (sessionStorage) |
| PISI Engine simulator | Implemented (client-only) | `lib/pisi/pisiEngine.ts` + `orderPlanner.ts` + `presets.ts` + `data/marketForecasts.ts`; state persisted in `localStorage` (`pisi_state_v1`) by `pisiStorage.ts`. |
| Auth | Demo only | `lib/auth/auth-context.tsx` stores a fake user in `localStorage` (`pisi_auth`). `register` is a no-op timer. |
| Watchlist, saved news, recent symbols | Demo only (state in `useDemo` reducer; no persistence across browser sessions beyond the demo store) | `lib/demo` |
| Supabase | **Planned, not implemented** | `lib/supabase/client.ts` builds a client only if envs are set; no page or route handler calls it. `supabase/schema.sql` is a future DDL. |

### Top-level pages (verifiable routes)

| Route | File | Notes |
|---|---|---|
| `/` | `app/page.tsx` | Fear banner, market metrics, top gainers/losers, AI suggestions, economic calendar, news |
| `/markets` | `app/markets/page.tsx` | Tabs: Cổ phiếu/ETF/Crypto/Forex/Chỉ số — all render the same `MarketTable` from `STOCKS` |
| `/stocks/[symbol]` | `app/stocks/[symbol]/page.tsx` | 7-tab stock detail |
| `/news`, `/news/[id]` | `app/news/*` | List + detail with sentiment |
| `/metrics/[metric]` | `app/metrics/[metric]/page.tsx` | 14 metric explainers from `lib/market/metrics-data.ts` |
| `/dashboard` | `app/dashboard/page.tsx` | Auth-gated; uses `RiskManagementCard` + `AiTradingSuggestions` (both demo) |
| `/ai-agent` | `app/ai-agent/page.tsx` | Onboarding survey + chat, posts to `/api/ai/chat` |
| `/pisi` | `app/pisi/page.tsx` | Preset selector + 30+ parameter form, runs `usePisiDemo` |
| `/enterprise` | `app/enterprise/page.tsx` | Static B2B marketing page |
| `/pricing`, `/login`, `/register` | `app/{pricing,login,register}/page.tsx` | Marketing / auth mocks |

### API routes (verifiable)

| Endpoint | Method | Source | Consumed by UI? |
|---|---|---|---|
| `/api/market/overview` | GET | `app/api/market/overview/route.ts` | No (UI uses `mock-data`) |
| `/api/market/live-quotes` | GET | `app/api/market/live-quotes/route.ts` | **Yes** (Yahoo with mock fallback) |
| `/api/market/fear-greed` | GET | `app/api/market/fear-greed/route.ts` | **Yes** (`FearIndexBanner`) |
| `/api/markets` | GET | `app/api/markets/route.ts` | No |
| `/api/stocks/[symbol]/quote` | GET | `app/api/stocks/[symbol]/quote/route.ts` | No |
| `/api/stocks/[symbol]/news` | GET | `app/api/stocks/[symbol]/news/route.ts` | No |
| `/api/news` | GET | `app/api/news/route.ts` | No |
| `/api/news/[id]` | GET | `app/api/news/[id]/route.ts` | No |
| `/api/metrics/[metric]` | GET | `app/api/metrics/[metric]/route.ts` | No |
| `/api/ai/chat` | POST | `app/api/ai/chat/route.ts` | **Yes** (AI Agent page) |
| `/api/ai/suggestions` | GET | `app/api/ai/suggestions/route.ts` | No |
| `/api/ai/prediction/[symbol]` | GET | `app/api/ai/prediction/[symbol]/route.ts` | No (`AIPredictionChart` generates its own data) |
| `/api/risk/overview` | GET | `app/api/risk/overview/route.ts` | No (`RiskManagementCard` uses demo data) |
| `/api/user/recent-symbols` | GET/POST | `app/api/user/recent-symbols/route.ts` | No |
| `/api/user/recommendations` | GET | `app/api/user/recommendations/route.ts` | No |
| `/api/user/saved-news` | GET/POST | `app/api/user/saved-news/route.ts` | No |
| `/api/user/saved-news/[id]` | DELETE | `app/api/user/saved-news/[id]/route.ts` | No |
| `/api/user/watchlist` | GET/POST | `app/api/user/watchlist/route.ts` | No (UI uses `useDemo` watchlist) |
| `/api/user/watchlist/[symbol]` | DELETE | `app/api/user/watchlist/[symbol]/route.ts` | No |

---

## 9. Known Incomplete / Demo Areas

- **Auth:** `register` is a fake `setTimeout`; `AuthProvider` is fully client-side mock. The Supabase client is **not** called by any UI code.
- **API routes:** ~15 of 19 API routes are defined but not consumed (see table above). `lib/api/market.ts` documents the intended swap-to-`fetch()` migration.
- **Persistence:** Demo portfolio uses `sessionStorage` (`trading_demo_state`); watchlist/transactions reset on browser close. PISI state uses `localStorage` (`pisi_state_v1`). No server-side persistence.
- **Markets tabs:** "ETF / Crypto / Forex / Chỉ số" all render the same `STOCKS` list. There is no real ETF/Crypto/Forex data source.
- **AIPredictionChart** uses deterministic client-side synthesis. Its dedicated `/api/ai/prediction/[symbol]` route is unreferenced.
- **Fear & Greed banner** in the home `app/page.tsx` does not call `/api/market/fear-greed`; the live call lives in the dedicated `FearIndexBanner` widget imported in the same file.
- **No WebSocket / streaming:** Prices are polled every 5 s in `DemoProvider.fetchLivePrices` (`lib/demo/context.tsx`).
- **No unit tests.** Playwright is configured only for a marketing `promo.spec.ts` that screenshots fixed pages.
- **Pre-existing lint warnings/errors** (unrelated to the cleanup, do not block runtime): 7 React-hooks/purity errors in `app/ai-agent/page.tsx`, 1 `any` in `app/api/ai/chat/route.ts`, 1 `<a>`-instead-of-`<Link>` in `app/news/[id]/page.tsx`, and 4 unused-import warnings in `app/api/market/overview/route.ts` and `app/enterprise/page.tsx`. Run `npm run lint` to see current state.
- **Cleanup status:** 5 unused `public/*.svg` placeholders, 3 disposable output folders, and the TS build cache have been removed. See §10 for remaining items.

---

## 10. Cleanup Candidates

Search-based. Do **not** delete anything without verifying the latest state — this list is a starting point, not a manifest.

### Already cleaned up (2026-06-22)

| Path | Type | Why removed | Verified unreferenced? | Status |
|---|---|---|---|---|
| `public/file.svg` | asset | Default Next.js placeholder. | No (no `import` or path reference) | **Deleted** |
| `public/globe.svg` | asset | Default Next.js placeholder. | No | **Deleted** |
| `public/next.svg` | asset | Default Next.js branding placeholder. | No | **Deleted** |
| `public/vercel.svg` | asset | Default Next.js branding placeholder. | No | **Deleted** |
| `public/window.svg` | asset | Default Next.js placeholder. | No | **Deleted** |
| `artifacts/` | generated | Playwright `promo.spec.ts` writes PNG + `.webm` here at test time. | Only referenced as a write path | **Deleted** (folder + contents) |
| `ads-output/` | generated | Marketing screenshot folder. | No code references | **Deleted** (folder + contents) |
| `test-results/` | generated | Playwright runtime byproduct. | No | **Deleted** (folder + contents) |
| `tsconfig.tsbuildinfo` | generated | TypeScript incremental build cache. | No | **Deleted** |

### Still candidates (not yet removed)

| Path | Type | Why it appears unnecessary | Referenced? | Confidence | Risk / dependency |
|---|---|---|---|---|---|
| `reference/v0-stock-market-ui/**` | duplicate code | Vendored v0 reference project (own `package.json`, `pnpm-lock.yaml`, full `components/ui/*` shadcn set). Excluded from `tsconfig`. | No (no `import` from `reference/`) | safe to delete | None for the app; keep only if used for diffing. |
| `promo.spec.ts` + `playwright.config.ts` | test scaffolding | Generates marketing screenshots; the rest of the app has no other tests. | Internally only | review first | `package.json` still depends on `@playwright/test`. |
| `lib/api/market.ts` | unused code | Data-access layer explicitly marked "Currently returns mock data directly… swap to fetch()". No `import` of this module exists. | No | review first | Documents the intended backend migration. |
| `types/market.ts` | unused type | Only `MarketIndex` is exported and only imported by `lib/api/market.ts`. Since the file above is itself unused, this type is effectively dead. | Indirectly, via `lib/api/market.ts` | review first | Move into `lib/market/mock-data.ts` if kept. |
| `app/api/ai/prediction/[symbol]/route.ts` | unused endpoint | Provides `/api/ai/prediction/[symbol]` but no UI or script fetches it; the chart that displays the data (`components/stock/AIPredictionChart.tsx`) generates it locally. | No | review first | None — keep if you plan to wire a real model later. |
| `app/api/ai/suggestions/route.ts` | unused endpoint | Provides trading suggestions but no UI calls it; suggestions are hard-coded in `components/market/ai-suggestions.tsx` and `components/dashboard/AiTradingSuggestions.tsx`. | No | review first | None — keep as a backend hook. |
| `app/api/risk/overview/route.ts` | unused endpoint | Provides risk metrics but `components/dashboard/RiskManagementCard.tsx` does not call it (it computes its own). | No | review first | None. |
| `app/api/user/recent-symbols/route.ts` | unused endpoint | No UI consumer. | No | safe to delete | None currently. |
| `app/api/user/recommendations/route.ts` | unused endpoint | No UI consumer. | No | safe to delete | None currently. |
| `app/api/user/saved-news/route.ts` + `.../saved-news/[id]/route.ts` | unused endpoint | No UI consumer. | No | safe to delete | None currently. |
| `app/api/user/watchlist/route.ts` + `.../watchlist/[symbol]/route.ts` | unused endpoint | UI uses `useDemo` reducer for the watchlist; no fetch. | No | safe to delete | Required once Supabase persistence is wired. |
| `app/api/news/route.ts`, `app/api/news/[id]/route.ts` | unused endpoint | News pages read directly from `lib/market/mock-data.ts`. | No | safe to delete | Required once news moves to a backend. |
| `app/api/markets/route.ts` | unused endpoint | `MarketsPage` reads from `STOCKS` directly. | No | safe to delete | None currently. |
| `app/api/stocks/[symbol]/quote/route.ts`, `app/api/stocks/[symbol]/news/route.ts` | unused endpoint | Stock detail page reads from `mock-data` directly. | No | safe to delete | None currently. |
| `app/api/market/overview/route.ts` | unused endpoint | Home page computes everything client-side. | No | safe to delete | None currently. |
| `app/api/metrics/[metric]/route.ts` | unused endpoint | `app/metrics/[metric]/page.tsx` reads `getMetricBySlug` directly. | No | safe to delete | None currently. |
| `lib/supabase/client.ts` | unused code | Only loads Supabase when env vars are set; nothing imports it. | No | review first | Required once Supabase is wired. |
| `supabase/schema.sql` | obsolete config | Future schema, not applied. The app does not connect to Supabase. | No | keep | Required before any Supabase integration. |
| `docs/API_CONTRACT.md` | docs | Lists 13 endpoints, several of which (above) are unused. | No code | keep | The endpoint table will need updates as routes are wired/removed. |
| `docs/COMPONENT_DATA_CONTRACT.md` | docs | Long-form data contract for components. | No code | keep | Reference for future backend work. |
| `app/icon.svg` | asset | The new app icon (replaces deleted `favicon.ico`). | Auto-picked by Next.js App Router | keep | Required for the browser tab icon. |
| `AGENTS.md` / `CLAUDE.md` | docs | Workspace rules for AI agents; one explicitly warns that this Next.js 16 release differs from common knowledge. | No code | keep | Required by the AI workflow. |

### Items **kept** despite appearing unused

- **`PisiDashboardPanel.tsx` and `PisiTickerDetail.tsx`** — defined under `components/pisi/` but `app/pisi/page.tsx` only imports `PisiScoreBreakdown` and `PresetSelector`. The panels may be rendered conditionally or are staged for upcoming work. *Review first* before removing.
- **`pushNotification` / `markAsRead` / `markAllAsRead`** on the mock `AuthProvider` — exported but unused; they are harmless and document the intended notification surface.

---

## 11. Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Home page metrics are static, no flash | Yahoo Finance blocked the request and the cache is empty. | Wait 5 s for the next `useLivePrices` poll, or check outbound HTTPS to `query1.finance.yahoo.com`. |
| Fear & Greed banner shows fallback copy | `production.dataviz.cnn.io` is unreachable. | Either allow the request or accept the documented fallback (`fallback: true` in the API response). |
| AI chat always returns canned text | `TOKENROUTER_API_KEY` missing or invalid. | Set `TOKENROUTER_API_KEY` in `.env.local`; otherwise the route returns `isMock: true` deterministically. |
| `npm run build` fails in Docker | Build-arg values must be set before `next build` because they are inlined. | Pass them via `docker compose` (already wired) or `--build-arg`. |
| Playwright `promo.spec.ts` fails to find pages | Dev server isn't running. | Start `npm run dev` first; the spec hits `http://localhost:3000/`. |
| Prices reset when reopening the tab | Demo state is persisted in `sessionStorage`, not `localStorage`. | Expected behavior; use a real Supabase backend for durable state. |
| `pnpm` / `yarn` lockfile drift | Only `package-lock.json` is tracked. | Use `npm install` to stay in sync. |
| Next.js behavior differs from expectations | `AGENTS.md` notes that this Next.js 16 build has breaking changes. | Read `node_modules/next/dist/docs/` before editing framework code. |
| `npm run lint` reports React-hooks/purity errors | Pre-existing in `app/ai-agent/page.tsx` (uses `Date.now()` during render). | Unrelated to the demo flow; refactor to use `useState`/event handlers before shipping. |
| `artifacts/` or `test-results/` keeps reappearing | They are written by `promo.spec.ts` at test time. | Expected; both are now in `.gitignore` and won't be tracked. |
