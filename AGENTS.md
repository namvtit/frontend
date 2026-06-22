<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Project-Specific Rules — FinPilot

> Frontend-only Next.js 16 demo. Most of what looks like "real" (auth, watchlist persistence, news feed, etc.) is **mock data** that runs in the browser. Read `README.md` §8 ("Application Flow") and §9 ("Known Incomplete / Demo Areas") before adding features.

## Stack (verified — do not claim features that don't exist)

- **Next.js `16.2.6`** (App Router + Turbopack dev + `output: "standalone"` build).
- **React `19.2.4`**, **TypeScript `^5` (strict)**, **Tailwind `^4`** via `@tailwindcss/postcss`.
- **Charts:** `lightweight-charts` (`^5.2.0`) is used **only** by `components/stock/AIPredictionChart.tsx` (dynamic import). The stock-detail candlestick chart is the **TradingView** external embed script — there is no `lightweight-charts` candlestick.
- **State:** React Context + `useReducer` + `useState` only. No Redux/Zustand/Jotai.
- **Backend SDK:** `@supabase/supabase-js` is installed but `lib/supabase/client.ts` is the **only** file that touches it, and no page or route handler imports it. Treat Supabase as **planned, not implemented**.

## Demo / data sources (verified)

| Concern | Real? | Where |
|---|---|---|
| Market indices & stock list | No — seeded mock | `lib/market/mock-data.ts` (15 US tickers) |
| Live prices | **Yes (polled)** | `/api/market/live-quotes` → Yahoo Finance v8 chart, polled every 5s by `DemoProvider`; mock fallback per symbol |
| Fear & Greed | **Yes** | `/api/market/fear-greed` → CNN DataViz, 1h cache, mock fallback |
| News | No — Vietnamese copy | `lib/market/mock-data.ts` (`NEWS`) |
| Economic calendar | No | `lib/market/mock-data.ts` (`ECONOMIC_CALENDAR`) |
| AI chat | **Yes (with key)** | `/api/ai/chat` → TokenRouter (OpenAI-compatible, default model `MiniMax-M3`); deterministic `lib/ai/mock-agent.ts` fallback |
| AI prediction chart | No — client-synthesized | `components/stock/AIPredictionChart.tsx` builds its own 60d history + 60d forecast |
| AI trading suggestions | No — hard-coded | `components/market/ai-suggestions.tsx`, `components/dashboard/AiTradingSuggestions.tsx` |
| Auth | No — localStorage fake | `lib/auth/auth-context.tsx`; `register` is `setTimeout` |
| Paper trading | Yes (client) | `lib/demo/context.tsx` reducer + `sessionStorage` |

## Wiring rules

- **Do not** route the UI through `lib/api/market.ts` — those functions are stubs awaiting backend wiring; the UI reads from `lib/market/mock-data.ts` directly. Confirm with a `Grep` for the function name before touching it.
- **Do not** introduce a `lightweight-charts` candlestick chart on the stock-detail page — the existing `TradingViewChart` is intentionally an external embed.
- **Do not** add a WebSocket / SSE price stream. `DemoProvider.fetchLivePrices` polls every 5s; that is the only mechanism.
- **Do not** call the Supabase client from pages or route handlers. It is loaded by `lib/supabase/client.ts` only.
- **Do not** add Jest/Vitest. The only test is `promo.spec.ts` (Playwright marketing screenshots).

## API-route consumption status

Only **3 of 19** API routes are called by the running UI:

- `GET /api/market/live-quotes` — used by `DemoProvider`
- `GET /api/market/fear-greed` — used by `FearIndexBanner`
- `POST /api/ai/chat` — used by `app/ai-agent/page.tsx`

The other 16 routes are defined but not consumed. If you change them, verify with a `Grep` that the change is reachable from a page or hook.

## Path alias and tsconfig

- `@/*` → repo root.
- `tsconfig.json` excludes `node_modules` and `reference/`. Code under `reference/v0-stock-market-ui/` is **not** compiled and is a vendored reference tree, not a dependency.

## Generated / disposable output (already in `.gitignore`)

`/artifacts/`, `/ads-output/`, `/test-results/`, `*.tsbuildinfo`, `.next/`, `node_modules/`. Do not commit them; do not edit them.

## Pre-existing lint findings (do not regress)

`npm run lint` currently reports (these are not introduced by the README/cleanup work):

- 5 `react-hooks/purity` errors in `app/ai-agent/page.tsx` (`Date.now()` during render).
- 1 `@typescript-eslint/no-explicit-any` in `app/api/ai/chat/route.ts`.
- 1 `@next/next/no-html-link-for-pages` in `app/news/[id]/page.tsx`.
- 4 `@typescript-eslint/no-unused-vars` warnings in `app/api/market/overview/route.ts` and `app/enterprise/page.tsx`.

Fix them only as part of a focused task on those files; do not "clean up" by suppressing rules globally.

## Cleanup status (2026-06-22)

Already removed (unreferenced):

- `public/{file,globe,next,vercel,window}.svg`
- `artifacts/`, `ads-output/`, `test-results/`
- `tsconfig.tsbuildinfo`

`README.md` §10 lists the remaining cleanup candidates and their review status.
