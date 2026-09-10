import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:3000';
const OUT_DIR = '/home/nam/finpilot/frontend/screenshots';

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

async function capture() {
  const browser = await chromium.launch();
  
  // Desktop
  const desktopContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const dPage = await desktopContext.newPage();

  // Mobile
  const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const mPage = await mobileContext.newPage();

  // 1. Login
  await dPage.goto(`${BASE_URL}/login`);
  await dPage.waitForSelector('#login-email');
  await dPage.screenshot({ path: path.join(OUT_DIR, 'desktop-login.png'), fullPage: true });

  await mPage.goto(`${BASE_URL}/login`);
  await mPage.waitForSelector('#login-email');
  await mPage.screenshot({ path: path.join(OUT_DIR, 'mobile-login.png'), fullPage: true });

  // 2. Register
  await dPage.goto(`${BASE_URL}/register`);
  await dPage.waitForSelector('#register-email');
  await dPage.screenshot({ path: path.join(OUT_DIR, 'desktop-register.png'), fullPage: true });

  await mPage.goto(`${BASE_URL}/register`);
  await mPage.waitForSelector('#register-email');
  await mPage.screenshot({ path: path.join(OUT_DIR, 'mobile-register.png'), fullPage: true });

  // Register an account to see logged-in dashboard and stock page
  const email = `ui_${Date.now()}@example.com`;
  const pass = 'Password123!';
  await dPage.fill('#register-email', email);
  await dPage.fill('#register-password', pass);
  await dPage.click('#register-submit');
  await dPage.waitForURL('**/dashboard');
  await dPage.waitForSelector('h1');
  await dPage.waitForTimeout(1000);
  await dPage.screenshot({ path: path.join(OUT_DIR, 'desktop-dashboard-empty.png'), fullPage: true });

  // Also buy 2 AAPL to have holding & orders
  await dPage.goto(`${BASE_URL}/stocks/AAPL`);
  await dPage.waitForSelector('button:has-text("MUA AAPL")');
  await dPage.screenshot({ path: path.join(OUT_DIR, 'desktop-stock-aapl.png') });
  await dPage.locator('input[type="number"]').first().fill('2');
  await dPage.click('button:has-text("MUA AAPL")');
  await dPage.waitForSelector('button:has-text("Xác nhận đặt lệnh")');
  await dPage.screenshot({ path: path.join(OUT_DIR, 'desktop-confirm-modal.png') });
  await dPage.click('button:has-text("Xác nhận đặt lệnh")');
  await dPage.waitForTimeout(2500);

  // Dashboard with data
  await dPage.goto(`${BASE_URL}/dashboard`);
  await dPage.waitForSelector('button:has-text("Holdings (1)")');
  await dPage.screenshot({ path: path.join(OUT_DIR, 'desktop-dashboard-with-data.png'), fullPage: true });

  // Switch to orders tab
  await dPage.click('#orders-tab');
  await dPage.waitForTimeout(500);
  await dPage.screenshot({ path: path.join(OUT_DIR, 'desktop-dashboard-orders.png'), fullPage: true });

  // Mobile with logged in state (cookies copied)
  const cookies = await desktopContext.cookies();
  await mobileContext.addCookies(cookies);

  await mPage.goto(`${BASE_URL}/dashboard`);
  await mPage.waitForSelector('button:has-text("Holdings (1)")');
  await mPage.screenshot({ path: path.join(OUT_DIR, 'mobile-dashboard-holdings.png'), fullPage: true });

  await mPage.click('#orders-tab');
  await mPage.waitForTimeout(500);
  await mPage.screenshot({ path: path.join(OUT_DIR, 'mobile-dashboard-orders.png'), fullPage: true });

  await mPage.goto(`${BASE_URL}/stocks/AAPL`);
  await mPage.waitForSelector('button:has-text("MUA AAPL")');
  await mPage.screenshot({ path: path.join(OUT_DIR, 'mobile-stock-aapl.png'), fullPage: true });

  console.log('Screenshots captured successfully in', OUT_DIR);
  await browser.close();
}

capture().catch(err => {
  console.error('Capture error:', err);
  process.exit(1);
});