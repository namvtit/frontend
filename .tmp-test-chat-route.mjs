// Minimal Node test for /api/ai/chat route — covers mock fallback (no key)
// and live-call error path (bogus key). Uses tsx loader via the installed `openai` types only.
import { register } from "node:module";
import { pathToFileURL } from "node:url";

// Use Next's own SWC register to compile TS on the fly.
register("next/dist/build/swc/index.js", pathToFileURL("./"));

const routePath = "./app/api/ai/chat/route.ts";

async function run() {
  const mod = await import(routePath);
  const { POST } = mod;

  function makeRequest(body) {
    return new Request("http://localhost/api/ai/chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  const results = [];

  // ── Case 1: No API key → mock fallback (isMock: true)
  const r1 = await POST(makeRequest({ message: "Phân tích AAPL hôm nay", history: [] }));
  const j1 = await r1.json();
  results.push({ case: "no-key", status: r1.status, isMock: j1.isMock, hasMessage: typeof j1.message === "string", hasCards: Array.isArray(j1.cards) });

  // ── Case 2: Bogus API key → live call attempted, error path returns 500 with Vietnamese error
  process.env.TOKENROUTER_API_KEY = "sk-fake-test-key";
  process.env.TOKENROUTER_BASE_URL = "https://127.0.0.1:1/v1"; // unreachable on purpose
  process.env.TOKENROUTER_MODEL = "MiniMax-M3";
  // bust module cache so the route re-reads env on construction
  delete require.cache?.[require.resolve?.(routePath)];
  const mod2 = await import(routePath + "?t=" + Date.now());
  const r2 = await mod2.POST(makeRequest({ message: "Hello", history: [] }));
  const j2 = await r2.json();
  results.push({ case: "bogus-key", status: r2.status, body: j2 });

  // ── Case 3: Valid history is passed through and the route still responds
  const r3 = await mod2.POST(makeRequest({
    message: "Tóm tắt tình hình mã này",
    history: [
      { role: "user", content: "Giới thiệu NVDA" },
      { role: "assistant", content: "NVDA là nhà sản xuất GPU hàng đầu." },
    ],
  }));
  const j3 = await r3.json();
  results.push({ case: "history-bogus-key", status: r3.status, hasError: typeof j3.error === "string" });

  console.log(JSON.stringify(results, null, 2));
}

run().catch((e) => { console.error("TEST_FAILED", e); process.exit(1); });
