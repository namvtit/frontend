# Internal news reader

Google News RSS remains the discovery source. `/api/news` keeps its `{ data }` shape and existing IDs, fields, publisher allowlist, categories, and newest-first order. It adds `detailId` (SHA-256 of the RSS ID) for short internal links. Feed `url` and `originalUrl` retain the discovery URL for backward compatibility; the detail response's `originalUrl` becomes the publisher URL when resolution succeeds. Resolution/extraction happens on demand, so feed refreshes do not scrape every publisher. Card/detail prefetch is disabled.

## Routes

- Existing `/news/[id]`: now a server-rendered live article reader with source, time, image, sentiment, sanitized content or summary, and visible original links. Includes loading, retry, and not-found states. Legacy demo IDs retain their real mock summaries; fabricated article paragraphs and fabricated AI summaries have been removed.
- Existing `GET /api/news/[id]`: returns the news fields plus `article: { originalUrl, resolved, status, reason?, contentHtml?, excerpt?, imageUrl? }`. `status` is `extracted` or `fallback`; fallback is a successful 200 response. Unknown IDs return 404, feed failures 503. This is ID-based, not an arbitrary URL scraping endpoint.
- No new public route paths or database tables.

## Extraction and security

1. Resolve Google links using embedded legacy URLs, safe redirects, explicit publisher links, or Google's undocumented `Fbv4je` URL resolver. Only data is parsed; no publisher/Google scripts run. The resolver is best effort and may change or rate-limit. Protocol reference: [google-news-url-decoder](https://github.com/SSujitX/google-news-url-decoder/blob/main/googlenewsdecoder/new_decoderv3.py).
2. Fetch publisher HTML using Node HTTP(S), allowing only the seven feed publisher domains/subdomains and `news.google.com`. Validate each redirect, reject credentials/nonstandard ports and non-public IP ranges, check every DNS result, and pin the chosen address to the socket to prevent DNS rebinding. Five redirects maximum; the resolver POST cannot redirect. A shared 15-second deadline includes resolution, DNS, and HTML transfer. Cap compressed and decompressed HTML at 3 MiB each; resolver responses at 256 KiB.
3. Parse with JSDOM's scripts and resource loading disabled, then [Mozilla Readability](https://github.com/mozilla/readability). Remove navigation, footer, ads, forms, embedded media, hidden elements, and common unrelated widgets. Reject paywall metadata/markers, access challenge pages, restrictive snippet/archive metadata, short/non-readable bodies, more than 20,000 DOM elements, and extracted HTML over 250,000 characters.
4. Apply [sanitize-html](https://github.com/apostrophecms/sanitize-html) with a narrow tag/attribute allowlist. Scripts, event handlers, inline CSS, iframes, SVG, forms, and embedded images are not rendered in the body. Article links allow HTTP(S) only and receive safe external-link attributes. A separate validated cover image is loaded directly with no referrer; image failures hide it. No Next image-proxy scraping or iframe reader.

If extraction is unavailable/unsuitable, show the available metadata excerpt or RSS summary as plain text, explicitly labeled as a summary; if absent, show a missing-summary message. Restricted pages use the RSS summary. Never bypass login, subscription, or anti-bot gates. Keep source/time/sentiment and the publisher link; when unresolved, retain the Google News external link and label it accordingly.

## Cache

All caches are bounded, process-local memory, shared by page/API bundles through `globalThis`, consistent with the existing in-memory feed architecture. No database is used for news.

- Feed: five minutes, deduplicated in-flight refresh; client still polls every five minutes.
- Feed metadata for detail lookup: 24 hours, at most 2,000 entries; refresh extends retained entries. Cold starts rebuild from the current RSS feed.
- Extraction (including resolution), keyed by discovery URL: six hours for readable content, ten minutes for fallbacks, at most 100 entries. Concurrent requests for the same URL share work. At most eight extractions run concurrently per process; excess work immediately returns the summary fallback.
- Page/API HTTP responses are dynamic; JSON uses `Cache-Control: no-store`. Cache TTLs are applied server-side.

## Validation

Run `npm run build`, `npx tsc --noEmit`, and:

```sh
npx eslint lib/news app/api/news app/news components/news scripts/test-news.mjs lib/market/mock-data.ts
node scripts/test-news.mjs
node scripts/test-news.mjs --live
```

The standalone Node tests follow the project's existing TypeScript-transpile pattern; no test framework was added. Coverage includes public/private IP variants, DNS pinning and mixed private DNS results, redirect SSRF and limit, response/decompression caps, cancellation, HTML sanitization, paywalls/challenges, missing/short content, and concurrent negative caching. `--live` validates newest-first RSS and samples four distinct publishers. Extra HTTPS arguments test direct publisher URLs.

Live checks on 2026-09-10:

| Publisher/article | Result |
| --- | --- |
| [Yahoo Finance — Stock Market News for Sep 10](https://finance.yahoo.com/markets/stocks/articles/stock-market-news-sep-10-132200642.html) | Google URL resolved; 2,779 characters of sanitized article HTML |
| [Yahoo Finance — Stock Market News for Sep 9](https://finance.yahoo.com/markets/stocks/articles/stock-market-news-sep-9-111100502.html) | Direct extraction; 3,221 characters of sanitized HTML |
| [CNBC — Jim Cramer's top 10](https://www.cnbc.com/2026/09/10/jim-cramers-top-10-things-to-watch-in-the-stock-market-thursday.html) | Google URL resolved; restricted-content fallback |
| [Reuters — EU watchdog](https://www.reuters.com/legal/government/eu-watchdog-flags-risk-abrupt-market-correction-2026-09-10/) | Google URL resolved; fetch unavailable, summary fallback |
| [WSJ — Bond yields](https://www.wsj.com/finance/investing/what-are-bond-yields-saying-about-stocks-c6b04ddb) | Google URL resolved; fetch unavailable, summary fallback |

Playwright browser smoke checks also verified card → internal detail navigation, visible attribution link, detail API, direct refresh, unknown-ID 404, and the existing dark styling.

## Limitations

Extraction is heuristic, not a guarantee of complete or authorized publisher syndication. Login/subscription-only, script-rendered, oversized, and blocked pages fall back. The Google resolver is undocumented. Cache contents disappear on restart and are not shared across instances; old deep links may expire when absent from both retained metadata and the current feed. Duplicate Google IDs for the same publisher URL can occupy separate extraction entries. The RSS summary can be only a headline. Existing feed sentiment remains neutral because RSS supplies no sentiment. Demo cards without external URLs have no original link. JSDOM 30 requires Node 22.22.2+, compatible with the tested runtime and the project's Node 22 Docker image when current.
