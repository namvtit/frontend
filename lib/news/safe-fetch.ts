import "server-only";
import { lookup } from "node:dns/promises";
import { request as httpRequest } from "node:http";
import { request as httpsRequest } from "node:https";
import { isIP } from "node:net";
import { createBrotliDecompress, createGunzip, createInflate } from "node:zlib";
import ipaddr from "ipaddr.js";

export const PUBLISHER_DOMAINS = ["reuters.com", "bloomberg.com", "cnbc.com", "ft.com", "wsj.com", "marketwatch.com", "finance.yahoo.com"];
export function isPublisher(url: URL): boolean {
  return PUBLISHER_DOMAINS.some((domain) => url.hostname === domain || url.hostname.endsWith(`.${domain}`));
}
export function isPublicAddress(address: string): boolean {
  try { return ipaddr.process(address).range() === "unicast"; } catch { return false; }
}
export function validateUrl(input: string): URL {
  const url = new URL(input);
  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password ||
      (url.port && url.port !== "80" && url.port !== "443") ||
      host === "localhost" || /\.(localhost|local|internal|lan|home|test|invalid)$/.test(host) ||
      (isIP(host) && !isPublicAddress(host))) throw new Error("Unsafe URL");
  return url;
}

// DNS is checked for every hop and the selected address is pinned to the socket.
// This avoids the check-then-fetch DNS rebinding gap. No proxy or browser is used.
export async function safeFetch(input: string, signal: AbortSignal, maxBytes = 3 * 1024 * 1024, googleRpcBody?: string): Promise<{ url: string; html: string }> {
  let url = validateUrl(input);
  if (googleRpcBody && (url.href !== "https://news.google.com/_/DotsSplashUi/data/batchexecute" || googleRpcBody.length > 16_000)) throw new Error("Invalid resolver request");
  for (let redirects = 0; redirects <= 5; redirects++) {
    signal.throwIfAborted();
    if (!isPublisher(url) && url.hostname !== "news.google.com") throw new Error("Unsupported publisher");
    const host = url.hostname.replace(/^\[|\]$/g, "");
    const addresses = await new Promise<Awaited<ReturnType<typeof lookup>>[]>((resolve, reject) => {
      const abort = () => reject(signal.reason);
      signal.addEventListener("abort", abort, { once: true });
      lookup(host, { all: true }).then(resolve, reject).finally(() => signal.removeEventListener("abort", abort));
    });
    signal.throwIfAborted();
    if (!addresses.length || addresses.some(({ address }) => !isPublicAddress(address))) throw new Error("Unsafe DNS target");
    const address = addresses[0];
    const result = await new Promise<{ location?: string; html: string }>((resolve, reject) => {
      const request = (url.protocol === "https:" ? httpsRequest : httpRequest)(url, {
        signal,
        method: googleRpcBody ? "POST" : "GET",
        agent: false,
        family: address.family,
        headers: { "User-Agent": "FinPilot-ArticleReader/1.0", Accept: "text/html,application/xhtml+xml", "Accept-Encoding": "gzip, deflate, br", ...(googleRpcBody ? { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" } : {}) },
        lookup: (_hostname, _options, callback) => callback(null, address.address, address.family),
      }, (response) => {
        const status = response.statusCode ?? 0;
        if ([301, 302, 303, 307, 308].includes(status)) {
          response.destroy();
          if (googleRpcBody) return reject(new Error("Resolver redirect rejected"));
          if (!response.headers.location) return reject(new Error("Missing redirect"));
          return resolve({ location: response.headers.location, html: "" });
        }
        if (status !== 200 || !(googleRpcBody ? /^(application\/json|text\/plain)(;|$)/i : /^(text\/html|application\/xhtml\+xml)(;|$)/i).test(response.headers["content-type"] ?? "")) {
          response.destroy();
          return reject(new Error(`Publisher response ${status}`));
        }
        if (Number(response.headers["content-length"]) > maxBytes) {
          response.destroy();
          return reject(new Error("Response too large"));
        }
        const encoding = response.headers["content-encoding"];
        const decoder = encoding === "gzip" ? createGunzip() : encoding === "br" ? createBrotliDecompress() : encoding === "deflate" ? createInflate() : undefined;
        if (encoding && encoding !== "identity" && !decoder) {
          response.destroy();
          return reject(new Error("Unsupported encoding"));
        }
        const stream = decoder ? response.pipe(decoder) : response;
        const chunks: Buffer[] = [];
        let size = 0;
        let wireSize = 0;
        response.on("data", (chunk: Buffer) => {
          wireSize += chunk.length;
          if (wireSize > maxBytes) { response.destroy(); stream.destroy(); reject(new Error("Response too large")); }
        });
        response.on("error", (error) => { stream.destroy(); reject(error); });
        stream.on("error", reject);
        stream.on("data", (chunk: Buffer) => {
          size += chunk.length;
          if (size > maxBytes) { response.destroy(); stream.destroy(); reject(new Error("Response too large")); }
          else chunks.push(chunk);
        });
        stream.on("end", () => resolve({ html: Buffer.concat(chunks).toString("utf8") }));
      });
      request.on("error", reject);
      request.end(googleRpcBody);
    });
    if (!result.location) return { url: url.href, html: result.html };
    url = validateUrl(new URL(result.location, url).href);
  }
  throw new Error("Too many redirects");
}
