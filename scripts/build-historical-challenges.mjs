import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const manifestPath = path.join(ROOT, 'data/historical-challenge/scenario-manifest.json');
const outputPath = path.join(ROOT, 'data/historical-challenge/generated-scenarios.json');
const cacheDir = path.join(ROOT, '.next/cache/historical-challenge');
const refresh = process.argv.includes('--refresh');
const defensiveSymbol = 'SHY';
const symbols = ['^GSPC', '^IXIC', '^DJI', defensiveSymbol];
const priceSource = 'Yahoo Finance chart v8';
let networkRequests = 0, cacheHits = 0;

const fail = (message) => { throw new Error(`[historical-challenge] ${message}`); };
const iso = (d) => new Date(d).toISOString().slice(0, 10);
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
if (manifest.length !== 30) fail(`Expected 30 manifest scenarios, found ${manifest.length}.`);
const ids = new Set();
for (const item of manifest) {
  if (ids.has(item.id)) fail(`Duplicate scenario id: ${item.id}`); ids.add(item.id);
  if (!item.sourceUrl || !/^https:\/\//.test(item.sourceUrl)) fail(`Missing source URL: ${item.id}`);
  if (!Array.isArray(item.warningSignals) || item.warningSignals.length !== 3) fail(`Expected 3 warning signals: ${item.id}`);
}
for (const market of ['sp500','nasdaq','dow']) {
  const count = manifest.filter((x) => x.market === market).length;
  if (count !== 10) fail(`Expected 10 ${market} scenarios, found ${count}.`);
}
const dates = manifest.map((x) => new Date(x.decisionDate).getTime());
const period1 = Math.floor((Math.min(...dates) - 1000 * 60 * 60 * 24 * 60) / 1000);
const period2 = Math.floor((Math.max(...dates) + 1000 * 60 * 60 * 24 * 140) / 1000);
await mkdir(cacheDir, { recursive: true });

async function loadSymbol(symbol) {
  const cachePath = path.join(cacheDir, `${encodeURIComponent(symbol)}.json`);
  if (!refresh && existsSync(cachePath)) { cacheHits++; return JSON.parse(await readFile(cachePath, 'utf8')); }
  const encoded = encodeURIComponent(symbol);
  const hosts = ['query1.finance.yahoo.com', 'query2.finance.yahoo.com'];
  let lastError;
  for (const host of hosts) {
    networkRequests++;
    try {
      const url = `https://${host}/v8/finance/chart/${encoded}?period1=${period1}&period2=${period2}&interval=1d&events=history`;
      const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 FinPilot historical education build' } });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const json = await response.json();
      if (json?.chart?.error || !json?.chart?.result?.[0]) throw new Error(json?.chart?.error?.description || 'empty chart');
      await writeFile(cachePath, JSON.stringify(json));
      return json;
    } catch (error) { lastError = error; }
  }
  fail(`Price fetch failed for ${symbol}: ${lastError?.message || lastError}`);
}

function normalize(json, symbol) {
  const result = json.chart.result[0];
  const timestamps = result.timestamp || [];
  const quote = result.indicators?.quote?.[0]?.close || [];
  const adjusted = result.indicators?.adjclose?.[0]?.adjclose || [];
  const map = new Map();
  timestamps.forEach((stamp, i) => {
    const value = adjusted[i] ?? quote[i];
    if (Number.isFinite(value) && value > 0) map.set(iso(stamp * 1000), value);
  });
  if (!map.size) fail(`No valid prices for ${symbol}.`);
  return map;
}

const raw = await Promise.all(symbols.map(loadSymbol));
const series = Object.fromEntries(symbols.map((s, i) => [s, normalize(raw[i], s)]));
let invalid = 0;
const generatedAt = new Date().toISOString();
const generated = manifest.map((item) => {
  try {
    const index = series[item.indexSymbol], defensive = series[defensiveSymbol];
    const common = [...index.keys()].filter((date) => defensive.has(date)).sort();
    const t0 = common.indexOf(item.decisionDate);
    if (t0 < 20) fail(`${item.id}: T0 missing or lacks 20 prior common sessions (${item.decisionDate}).`);
    if (t0 + 60 >= common.length) fail(`${item.id}: lacks 60 future common sessions.`);
    const selected = common.slice(t0 - 20, t0 + 61);
    const sessions = selected.map((date, i) => ({ relativeDay: i - 20, date, indexClose: index.get(date), defensiveClose: defensive.get(date) }));
    if (sessions.length !== 81) fail(`${item.id}: expected 81 sessions.`);
    sessions.forEach((s, i) => {
      if (s.relativeDay !== i - 20 || !Number.isFinite(s.indexClose) || s.indexClose <= 0 || !Number.isFinite(s.defensiveClose) || s.defensiveClose <= 0) fail(`${item.id}: invalid session ${i}.`);
      if (i && s.date <= sessions[i - 1].date) fail(`${item.id}: dates are not increasing.`);
    });
    if (!sessions.some((s) => s.relativeDay === 0 && s.date === item.decisionDate)) fail(`${item.id}: T0 is missing.`);
    let shock = null;
    for (let i = 21; i < sessions.length; i++) {
      const daily = sessions[i].indexClose / sessions[i - 1].indexClose - 1;
      if (!shock || daily < shock.indexDailyReturn) shock = { relativeDay: sessions[i].relativeDay, date: sessions[i].date, indexDailyReturn: daily, label: 'Ngày giảm mạnh nhất sau quyết định' };
    }
    if (!shock || shock.relativeDay < 1 || shock.relativeDay > 60) fail(`${item.id}: invalid shock day.`);
    return { ...item, defensiveSymbol, cashReturnAssumption: 0, priceSource, generatedAt, sessions, shock };
  } catch (error) { invalid++; throw error; }
});
await writeFile(outputPath, JSON.stringify(generated, null, 2) + '\n');
console.log(JSON.stringify({ scenarios: generated.length, perMarket: Object.fromEntries(['sp500','nasdaq','dow'].map(m => [m, generated.filter(x => x.market === m).length])), instruments: symbols, networkRequests, cacheHits, generatedFile: path.relative(ROOT, outputPath), invalidScenarios: invalid }, null, 2));
