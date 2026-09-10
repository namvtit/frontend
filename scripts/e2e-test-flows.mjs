import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:3000';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error') console.log('PAGE LOG ERROR:', msg.text());
  });
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  console.log('--- Starting Flow Validation ---');
  
  // 11. Try invalid login
  console.log('--- Step 11: Testing Invalid Login ---');
  await page.goto(BASE_URL + '/login');
  await page.fill('#login-email', 'nonexistent@example.com');
  await page.fill('#login-password', 'wrongpassword123');
  await page.click('#login-submit');
  await page.waitForTimeout(1500);
  const loginError = await page.locator('.text-red-500').first().textContent().catch(() => null);
  console.log('Invalid login error displayed:', loginError);

  // 1. Register new user
  console.log('--- Step 1: Testing Register ---');
  const testEmail = `test_${Date.now()}@example.com`;
  const testPassword = 'password123!';
  await page.goto(BASE_URL + '/register');
  await page.fill('#register-email', testEmail);
  await page.fill('#register-password', testPassword);
  await page.click('#register-submit');
  await page.waitForURL('**/dashboard', { timeout: 10000 });
  console.log('Registered and redirected to dashboard. URL:', page.url());

  // 4. Refresh and stay logged in
  console.log('--- Step 4: Refresh and stay logged in ---');
  await page.reload();
  await page.waitForTimeout(2000);
  console.log('After reload URL:', page.url());
  const welcomeText = await page.locator('h1').textContent();
  console.log('Dashboard heading:', welcomeText);

  // 5. View portfolio
  console.log('--- Step 5: View portfolio ---');
  const totalValueText = await page.locator('text=Total Value').locator('..').textContent();
  console.log('Portfolio Total Value Card:', totalValueText?.replace(/\s+/g, ' '));
  const holdingsTab = await page.locator('text=Holdings').first().textContent();
  console.log('Holdings Tab:', holdingsTab);

  // 6. BUY a stock (e.g. AAPL)
  console.log('--- Step 6: BUY a stock (AAPL) ---');
  await page.goto(BASE_URL + '/stocks/AAPL');
  await page.waitForTimeout(2000);
  console.log('On AAPL page:', page.url());

  // Check OrderPanel
  // Side should default to buy, quantity default 100
  // Let's set quantity to 2
  const qtyInput = page.locator('input[type="number"]').nth(0);
  await qtyInput.fill('2');
  await page.waitForTimeout(500);

  // Click submit order button
  const buyBtn = page.locator('button:has-text("MUA AAPL")');
  console.log('Buy button text:', await buyBtn.textContent());
  await buyBtn.click();
  await page.waitForTimeout(500);

  // Modal should open
  const confirmBtn = page.locator('button:has-text("Xác nhận đặt lệnh")');
  console.log('Confirm button visible:', await confirmBtn.isVisible());
  await confirmBtn.click();
  await page.waitForTimeout(3000);

  // 7. Verify cash/position updates
  console.log('--- Step 7: Verify cash/position updates ---');
  await page.goto(BASE_URL + '/dashboard');
  await page.waitForTimeout(2000);
  const holdingsCount = await page.locator('button:has-text("Holdings")').textContent();
  console.log('Holdings tab text:', holdingsCount);
  const holdingItem = await page.locator('text=AAPL').first().isVisible();
  console.log('AAPL in holdings:', holdingItem);
  const updatedValue = await page.locator('text=Total Value').locator('..').textContent();
  console.log('Updated Total Value Card:', updatedValue?.replace(/\s+/g, ' '));

  // 9. Verify trade history
  console.log('--- Step 9: Verify trade history ---');
  await page.click('#orders-tab');
  await page.waitForTimeout(1000);
  const orderRow = await page.locator('text=AAPL').first().isVisible();
  console.log('AAPL in orders:', orderRow);

  // 8. SELL a stock
  console.log('--- Step 8: SELL a stock (AAPL) ---');
  await page.goto(BASE_URL + '/stocks/AAPL');
  await page.waitForTimeout(2000);
  // Click BAN button
  await page.click('button:has-text("BÁN")');
  await page.waitForTimeout(500);
  await qtyInput.fill('1');
  const sellBtn = page.locator('button:has-text("BÁN AAPL")');
  console.log('Sell button text:', await sellBtn.textContent());
  await sellBtn.click();
  await page.waitForTimeout(500);
  const confirmSellBtn = page.locator('button:has-text("Xác nhận đặt lệnh")');
  await confirmSellBtn.click();
  await page.waitForTimeout(3000);

  // Verify dashboard after sell
  await page.goto(BASE_URL + '/dashboard');
  await page.waitForTimeout(2000);
  await page.click('#orders-tab');
  await page.waitForTimeout(1000);
  const ordersText = await page.locator('button:has-text("Orders")').textContent();
  console.log('Orders tab after sell:', ordersText);

  // 10. Refresh and verify data persists
  console.log('--- Step 10: Refresh and verify data persists ---');
  await page.reload();
  await page.waitForTimeout(2000);
  const holdingsAfterReload = await page.locator('button:has-text("Holdings")').textContent();
  console.log('Holdings after reload:', holdingsAfterReload);
  const ordersAfterReload = await page.locator('button:has-text("Orders")').textContent();
  console.log('Orders after reload:', ordersAfterReload);

  // 12. Try insufficient cash / insufficient shares
  console.log('--- Step 12: Try insufficient cash / insufficient shares ---');
  await page.goto(BASE_URL + '/stocks/AAPL');
  await page.waitForTimeout(2000);
  // Buy with huge quantity
  await page.click('button:has-text("MUA")');
  await qtyInput.fill('999999');
  await page.waitForTimeout(500);
  const insufficientCashBtnText = await page.locator('button:has-text("Không đủ số dư")').textContent().catch(() => null);
  console.log('Buy button state with 999999 qty:', insufficientCashBtnText);

  // Sell with more than owned
  await page.click('button:has-text("BÁN")');
  await qtyInput.fill('999');
  await page.waitForTimeout(500);
  const insufficientSharesBtnText = await page.locator('button:has-text("Vượt quá số lượng")').textContent().catch(() => null);
  console.log('Sell button state with 999 qty:', insufficientSharesBtnText);

  // 3. Logout
  console.log('--- Step 3: Logout ---');
  await page.goto(BASE_URL + '/dashboard');
  await page.waitForTimeout(1000);
  await page.click('button:has-text("Logout")');
  await page.waitForTimeout(2000);
  console.log('After logout URL:', page.url());
  const signInVisible = await page.locator('#login-btn').isVisible().catch(() => false);
  console.log('Sign In visible in TopNav:', signInVisible);

  // 2. Login
  console.log('--- Step 2: Login ---');
  await page.goto(BASE_URL + '/login');
  await page.fill('#login-email', testEmail);
  await page.fill('#login-password', testPassword);
  await page.click('#login-submit');
  await page.waitForURL('**/dashboard', { timeout: 10000 });
  console.log('Logged back in. URL:', page.url());

  console.log('--- Flow Test Completed Successfully! ---');
  await browser.close();
}

run().catch(err => {
  console.error('Test script error:', err);
  process.exit(1);
});