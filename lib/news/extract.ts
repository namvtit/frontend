import "server-only";
import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";
import sanitizeHtml from "sanitize-html";
import { isPublisher, safeFetch, validateUrl } from "./safe-fetch";

export interface ArticleContent {
  originalUrl: string;
  resolved: boolean;
  status: "extracted" | "fallback";
  reason?: "unresolved" | "restricted" | "unreadable" | "unavailable";
  contentHtml?: string;
  excerpt?: string;
  imageUrl?: string;
}

export function publicWebUrl(input: string | null | undefined, base?: string): string | undefined {
  if (!input) return undefined;
  try { return validateUrl(new URL(input, base).href).href; } catch { return undefined; }
}

export function sanitizeArticle(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: ["p", "br", "h2", "h3", "h4", "ul", "ol", "li", "blockquote", "strong", "em", "b", "i", "a", "figure", "figcaption", "table", "thead", "tbody", "tr", "th", "td", "hr"],
    allowedAttributes: { a: ["href", "rel", "target"] },
    allowedSchemes: ["http", "https"],
    allowProtocolRelative: false,
    transformTags: {
      a: (_tagName, attributes) => ({ tagName: "a", attribs: {
        ...(publicWebUrl(attributes.href) ? { href: publicWebUrl(attributes.href)! } : {}),
        target: "_blank", rel: "noopener noreferrer nofollow",
      } }),
    },
  });
}

export function parseArticle(html: string, url: string): ArticleContent {
  const result: ArticleContent = { originalUrl: url, resolved: true, status: "fallback", reason: "unreadable" };
  // JSDOM defaults deliberately retained: no script execution or resource loading.
  const dom = new JSDOM(html, { url });
  try {
    const doc = dom.window.document;
    if (doc.getElementsByTagName("*").length > 20_000) return result;
    const directives = [...doc.querySelectorAll('meta[name="robots"], meta[name="googlebot"]')].map((node) => node.getAttribute("content") ?? "").join(",");
    const restricted = /nosnippet|noarchive|max-snippet\s*:\s*0/i.test(directives) ||
      [...doc.querySelectorAll('script[type="application/ld+json"]')].some((node) => /"isAccessibleForFree"\s*:\s*(false|"false")/i.test(node.textContent ?? "")) ||
      !!doc.querySelector('[itemprop="isAccessibleForFree"][content="false"], [class*="paywall"], [id*="paywall"]');
    const challenge = /access denied|verify (you are|you're) human|just a moment|robot or human|pardon our interruption/i.test(doc.title);
    if (restricted || challenge) return { ...result, reason: "restricted" };
    const excerpt = doc.querySelector('meta[name="description"]')?.getAttribute("content") || doc.querySelector('meta[property="og:description"]')?.getAttribute("content");
    result.excerpt = excerpt?.trim().slice(0, 600) || undefined;
    result.imageUrl = publicWebUrl(doc.querySelector('meta[property="og:image"]')?.getAttribute("content"), url);
    // Remove non-editorial UI before Readability scores the remaining document.
    doc.querySelectorAll('script, style, noscript, iframe, object, embed, form, nav, footer, aside, [role="navigation"], [role="banner"], [hidden], [aria-hidden="true"], [class*="advert"], [id*="advert"], [class*="newsletter"], [class*="related"], [class*="social-share"]').forEach((node) => node.remove());
    const article = new Readability(doc, { maxElemsToParse: 20_000, charThreshold: 500 }).parse();
    if (!article?.content) return result;
    const contentHtml = sanitizeArticle(article.content);
    const text = sanitizeHtml(contentHtml, { allowedTags: [], allowedAttributes: {} }).trim();
    if (contentHtml.length > 250_000 || text.length < 500 || !/<p[ >]/.test(contentHtml) || /subscribe to (continue|read)|sign in to (continue|read)|enable javascript and cookies/i.test(text)) return result;
    return { ...result, status: "extracted", reason: undefined, contentHtml };
  } finally { dom.window.close(); }
}

export async function extractArticle(input: string): Promise<ArticleContent> {
  let originalUrl = input;
  let resolved = false;
  try {
    const signal = AbortSignal.timeout(15_000);
    let url = validateUrl(input);
    resolved = isPublisher(url);
    // Older Google News tokens contain a literal publisher URL. New opaque tokens
    // use redirects, landing-page links, or Google's best-effort URL resolver.
    if (url.hostname === "news.google.com") {
      const token = url.pathname.split("/").pop() ?? "";
      const embedded = Buffer.from(token, "base64url").toString("latin1").match(/https?:\/\/[^\s\x00-\x20\x7f-\xff]+/)?.[0];
      if (embedded) {
        const candidate = validateUrl(embedded);
        if (isPublisher(candidate)) url = candidate;
      }
    }
    if (isPublisher(url)) { originalUrl = url.href; resolved = true; }
    let page = await safeFetch(url.href, signal);
    if (new URL(page.url).hostname === "news.google.com") {
      const dom = new JSDOM(page.html, { url: page.url });
      let target: string | undefined;
      let signature: string | null | undefined;
      let timestamp: string | null | undefined;
      try {
        const data = dom.window.document.querySelector("[data-n-a-sg][data-n-a-ts]");
        signature = data?.getAttribute("data-n-a-sg");
        timestamp = data?.getAttribute("data-n-a-ts");
        // Only explicit canonical / main article links; never guess from arbitrary widgets.
        for (const node of dom.window.document.querySelectorAll('link[rel="canonical"], a[rel="canonical"], c-wiz a[href]')) {
          const candidate = publicWebUrl(node.getAttribute("href"), page.url);
          if (candidate && isPublisher(new URL(candidate))) { target = candidate; break; }
        }
      } finally { dom.window.close(); }
      if (!target && signature && timestamp && /^\d+$/.test(timestamp)) {
        // Best effort: Google's undocumented URL resolver may change or rate-limit.
        // The response is data only, never evaluated as JavaScript.
        const token = url.pathname.split("/").pop();
        const context = [["X", "X", ["X", "X"], null, null, 1, 1, "US:en", null, 1, null, null, null, null, null, 0, 1], "X", "X", 1, [1, 1, 1], 1, 1, null, 0, 0, null, 0];
        const payload = [[ ["Fbv4je", JSON.stringify(["garturlreq", context, token, Number(timestamp), signature])] ]];
        const body = new URLSearchParams({ "f.req": JSON.stringify(payload) }).toString();
        const response = await safeFetch("https://news.google.com/_/DotsSplashUi/data/batchexecute", signal, 256 * 1024, body);
        for (const line of response.html.split("\n")) {
          if (!line.startsWith("[[")) continue;
          try {
            const rows: unknown = JSON.parse(line);
            if (!Array.isArray(rows)) continue;
            for (const row of rows) {
              if (!Array.isArray(row) || row[1] !== "Fbv4je" || typeof row[2] !== "string") continue;
              const decoded: unknown = JSON.parse(row[2]);
              if (!Array.isArray(decoded) || decoded[0] !== "garturlres" || typeof decoded[1] !== "string") continue;
              const candidate = publicWebUrl(decoded[1]);
              if (candidate && isPublisher(new URL(candidate))) target = candidate;
            }
          } catch { /* Unsupported resolver response: use the feed summary. */ }
        }
      }
      if (!target) return { originalUrl, resolved, status: "fallback", reason: "unresolved" };
      originalUrl = target;
      resolved = true;
      page = await safeFetch(target, signal);
    }
    originalUrl = page.url;
    resolved = isPublisher(new URL(page.url));
    if (!resolved) return { originalUrl: input, resolved: false, status: "fallback", reason: "unresolved" };
    return parseArticle(page.html, originalUrl);
  } catch {
    return { originalUrl, resolved, status: "fallback", reason: "unavailable" };
  }
}
