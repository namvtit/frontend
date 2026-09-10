// Run against a disposable, migrated database and a running Next.js server.
// No API mocks: registrations and market orders create real test records.
// FINPILOT_TEST_URL=http://localhost:3004 node scripts/test-ui-backend.mjs
import assert from 'node:assert/strict';
import { chromium, expect } from '@playwright/test';

const baseURL = process.env.FINPILOT_TEST_URL || 'http://localhost:3000';
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ baseURL, viewport: { width: 1440, height: 1000 } });
const page = await context.newPage();
page.setDefaultTimeout(30000);
const email = `task4-${Date.now()}@example.com`;
const password = 'Task4-test-password';
const money = (value) => Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const account = async () => (await (await context.request.get('/api/portfolio')).json()).portfolio;
const history = async () => (await (await context.request.get('/api/trades')).json()).trades;
const errors = [];
page.on('pageerror', error => errors.push(error.message));

async function login(value = password) {
  await page.locator('#login-email').fill(email);
  await page.locator('#login-password').fill(value);
  await page.locator('#login-submit').click();
}
async function order(side) {
  await page.goto('/stocks/AAPL', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('button', { name: 'MUA AAPL', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: side === 'BUY' ? 'MUA' : 'BÁN', exact: true }).click();
  await page.locator('input[type="number"]').first().fill('1');
  await page.getByRole('button', { name: side === 'BUY' ? 'MUA AAPL' : 'BÁN AAPL', exact: true }).click();
  const response = page.waitForResponse(r => r.url().endsWith('/api/trades') && r.request().method() === 'POST');
  await page.getByRole('button', { name: 'Xác nhận đặt lệnh', exact: true }).click();
  const result = await response;
  const data = await result.json();
  assert.equal(result.status(), 201, JSON.stringify(data));
  await expect(page.getByRole('button', { name: 'Xác nhận đặt lệnh', exact: true })).toHaveCount(0);
  return data.trade;
}
try {
  await page.goto('/register');
  await page.locator('#register-email').fill(email);
  await page.locator('#register-password').fill(password);
  await page.locator('#register-submit').click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByText('Welcome back,', { exact: false })).toBeVisible();
  const initial = await account();
  assert.equal(Number(initial.cash), 100000);
  await expect(page.getByText(`Cash: $${money(initial.cash)}`, { exact: true }).first()).toBeVisible();
  console.log('PASS UI registration and backend portfolio');

  const buy = await order('BUY');
  const afterBuy = await account();
  assert.equal(Number(afterBuy.positions[0].quantity), 1);
  assert.equal(Number(afterBuy.cash), Number(initial.cash) - Number(buy.total));
  assert.equal((await history()).length, 1);
  await page.goto('/dashboard');
  await expect(page.getByText(`Cash: $${money(afterBuy.cash)}`, { exact: true }).first()).toBeVisible();
  await page.reload();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByText(`Cash: $${money(afterBuy.cash)}`, { exact: true }).first()).toBeVisible();
  await expect(page.getByText(`1 shares @ $${Number(buy.price).toFixed(2)}`, { exact: true })).toBeVisible();
  assert.deepEqual(await account(), afterBuy);
  const stored = await page.evaluate(() => ({ auth: localStorage.getItem('pisi_auth'), accounts: localStorage.getItem('pisi_accounts'), demo: JSON.parse(sessionStorage.getItem('trading_demo_state')) }));
  assert.equal(stored.auth, null);
  assert.equal(stored.accounts, null);
  assert.equal(stored.demo.cashBalance, undefined);
  assert.equal(stored.demo.holdings, undefined);
  assert.equal(stored.demo.transactions, undefined);
  console.log('PASS UI BUY, refresh, cookie session, backend balance/holdings, no browser account storage');

  const sell = await order('SELL');
  const afterSell = await account();
  assert.equal(afterSell.positions.length, 0);
  assert.ok(Math.abs(Number(afterSell.cash) - Number(afterBuy.cash) - Number(sell.total)) < 0.000001);
  assert.equal((await history()).length, 2);
  await page.goto('/dashboard');
  await expect(page.getByText(`Cash: $${money(afterSell.cash)}`, { exact: true }).first()).toBeVisible();
  await page.reload();
  await expect(page.getByText(`Cash: $${money(afterSell.cash)}`, { exact: true }).first()).toBeVisible();
  await page.locator('#orders-tab').click();
  await expect(page.getByText('BUY', { exact: true })).toBeVisible();
  await expect(page.getByText('SELL', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Orders (2)', exact: true })).toBeVisible();
  console.log('PASS UI SELL and persisted portfolio/history');

  await page.getByRole('button', { name: 'Logout', exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
  assert.equal((await context.request.get('/api/auth/me')).status(), 401);
  assert.equal((await context.request.get('/api/portfolio')).status(), 401);
  await login('wrong-password');
  await expect(page.getByText('Invalid email or password.', { exact: true })).toBeVisible();
  await login();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByText(`Cash: $${money(afterSell.cash)}`, { exact: true }).first()).toBeVisible();
  assert.deepEqual(await account(), afterSell);
  console.log('PASS UI logout, rejected invalid login, login restores same account');
  await page.getByRole('button', { name: 'Logout', exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.goto('/register');
  await page.locator('#register-email').fill(email);
  await page.locator('#register-password').fill(password);
  await page.locator('#register-submit').click();
  await expect(page.locator('form').getByRole('alert')).toContainText('already');
  await page.locator('#register-email').fill(`second-${email}`);
  await page.locator('#register-submit').click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByText('Cash: $100,000.00', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Orders (0)', exact: true })).toBeVisible();
  assert.equal((await account()).positions.length, 0);
  assert.equal((await history()).length, 0);
  console.log('PASS duplicate registration error and account isolation');
  assert.deepEqual(errors, []);
} finally {
  await browser.close();
}
