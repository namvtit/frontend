import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:3000';

function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function run() {
  console.log('=== FinPilot End-to-End Browser Flow Validation ===\n');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const testEmail = `user_${Date.now()}@example.com`;
  const testPassword = 'Password123!';

  // ----------------------------------------------------
  // Flow 11: Try invalid login
  // ----------------------------------------------------
  console.log('▶ [Flow 11] Try invalid login');
  await page.goto(`${BASE_URL}/login`);
  await page.waitForSelector('#login-email');
  await page.fill('#login-email', 'wrong@example.com');
  await page.fill('#login-password', 'wrongPassword!');
  await page.click('#login-submit');
  await page.waitForTimeout(1000);
  const loginErrorMsg = await page.locator('.text-red-500').first().textContent();
  console.log(`  Displayed error: "${loginErrorMsg?.trim()}"`);
  assert(loginErrorMsg && loginErrorMsg.includes('không chính xác'), 'Error message should be user-friendly Vietnamese');
  console.log('  ✔ Invalid login flow passed cleanly.\n');

  // ----------------------------------------------------
  // Flow 1: Register
  // ----------------------------------------------------
  console.log(`▶ [Flow 1] Register new user (${testEmail})`);
  await page.goto(`${BASE_URL}/register`);
  await page.waitForSelector('#register-email');
  await page.fill('#register-email', testEmail);
  await page.fill('#register-password', testPassword);
  await page.click('#register-submit');
  await page.waitForURL('**/dashboard', { timeout: 10000 });
  console.log(`  Redirected to: ${page.url()}`);
  await page.waitForSelector('h1');
  const welcomeText = await page.locator('h1').textContent();
  console.log(`  Dashboard heading: "${welcomeText?.trim()}"`);
  assert(welcomeText?.includes('Welcome back'), 'Dashboard should show welcome back greeting');
  console.log('  ✔ Register flow passed cleanly.\n');

  // ----------------------------------------------------
  // Flow 5: View portfolio (initial state)
  // ----------------------------------------------------
  console.log('▶ [Flow 5] View portfolio (initial state)');
  await page.waitForSelector('text=Total Value');
  const initialValueCard = await page.locator('text=Total Value').locator('..').textContent();
  console.log(`  Total Value: ${initialValueCard?.replace(/\s+/g, ' ')}`);
  const initialCash = await page.locator('text=Cash:').textContent();
  console.log(`  ${initialCash?.trim()}`);
  assert(initialCash?.includes('$100,000.00'), 'Initial cash must be $100,000.00');

  const emptyHoldingsText = await page.locator('text=Bạn chưa có vị thế nào').textContent().catch(() => null);
  console.log(`  Empty holdings state: "${emptyHoldingsText?.trim()}"`);
  assert(emptyHoldingsText !== null, 'Empty holdings state should be displayed for new user');
  console.log('  ✔ Initial portfolio view passed cleanly.\n');

  // ----------------------------------------------------
  // Flow 4: Refresh and stay logged in
  // ----------------------------------------------------
  console.log('▶ [Flow 4] Refresh and stay logged in');
  await page.reload();
  await page.waitForSelector('h1');
  assert(page.url().includes('/dashboard'), 'Should stay on /dashboard after reload');
  const userMenuExists = await page.locator('#user-menu-btn').isVisible();
  assert(userMenuExists, 'User menu should be visible after reload');
  console.log('  ✔ Refresh and stay logged in passed cleanly.\n');

  // ----------------------------------------------------
  // Flow 6: BUY a stock
  // ----------------------------------------------------
  console.log('▶ [Flow 6] BUY a stock (2 shares of AAPL)');
  await page.goto(`${BASE_URL}/stocks/AAPL`);
  await page.waitForSelector('button:has-text("MUA AAPL")');

  // Set quantity to 2
  const qtyInput = page.locator('input[type="number"]').first();
  await qtyInput.fill('2');
  await page.waitForTimeout(500);

  const buyButton = page.locator('button:has-text("MUA AAPL")');
  console.log(`  Order button text: "${(await buyButton.textContent())?.trim()}"`);
  await buyButton.click();
  await page.waitForTimeout(500);

  // Confirmation modal
  const confirmBtn = page.locator('button:has-text("Xác nhận đặt lệnh")');
  assert(await confirmBtn.isVisible(), 'Confirmation modal should open');
  await confirmBtn.click();
  await page.waitForTimeout(3000);
  console.log('  ✔ BUY order placed successfully.\n');

  // ----------------------------------------------------
  // Flow 7: Verify cash/position updates
  // ----------------------------------------------------
  console.log('▶ [Flow 7] Verify cash and position updates on Dashboard');
  await page.goto(`${BASE_URL}/dashboard`);
  await page.waitForSelector('button:has-text("Holdings")');
  await page.waitForTimeout(1000);

  const holdingsTabBtn = page.locator('button:has-text("Holdings")');
  const holdingsTabText = await holdingsTabBtn.textContent();
  console.log(`  Holdings tab: "${holdingsTabText?.trim()}"`);
  assert(holdingsTabText?.includes('(1)'), 'Holdings tab should show 1 holding');

  const aaplHolding = await page.locator('text=AAPL').first().isVisible();
  assert(aaplHolding, 'AAPL should be listed in holdings');

  const updatedCashText = await page.locator('text=Cash:').textContent();
  console.log(`  Updated Cash: ${updatedCashText?.trim()}`);
  assert(!updatedCashText?.includes('$100,000.00'), 'Cash must decrease after buying');
  console.log('  ✔ Cash and position updates verified.\n');

  // ----------------------------------------------------
  // Flow 8: SELL a stock
  // ----------------------------------------------------
  console.log('▶ [Flow 8] SELL 1 share of AAPL');
  await page.goto(`${BASE_URL}/stocks/AAPL`);
  await page.waitForSelector('button:has-text("BÁN")');

  // Switch to SELL
  await page.click('button:has-text("BÁN")');
  await page.waitForTimeout(500);
  await qtyInput.fill('1');
  await page.waitForTimeout(500);

  const sellButton = page.locator('button:has-text("BÁN AAPL")');
  console.log(`  Order button text: "${(await sellButton.textContent())?.trim()}"`);
  await sellButton.click();
  await page.waitForTimeout(500);

  const confirmSellBtn = page.locator('button:has-text("Xác nhận đặt lệnh")');
  assert(await confirmSellBtn.isVisible(), 'Confirmation modal should open for SELL');
  await confirmSellBtn.click();
  await page.waitForTimeout(3000);
  console.log('  ✔ SELL order placed successfully.\n');

  // ----------------------------------------------------
  // Flow 9: Verify trade history
  // ----------------------------------------------------
  console.log('▶ [Flow 9] Verify trade history in Orders tab');
  await page.goto(`${BASE_URL}/dashboard`);
  await page.waitForSelector('#orders-tab');
  await page.waitForTimeout(1000);

  await page.click('#orders-tab');
  await page.waitForTimeout(1000);

  const ordersCountText = await page.locator('#orders-tab').textContent();
  console.log(`  Orders tab text: "${ordersCountText?.trim()}"`);
  assert(ordersCountText?.includes('(2)'), 'Orders tab should show 2 completed orders');

  const buyOrderVisible = await page.locator('span.text-emerald-500:has-text("BUY")').first().isVisible();
  const sellOrderVisible = await page.locator('span.text-red-500:has-text("SELL")').first().isVisible();
  assert(buyOrderVisible && sellOrderVisible, 'Both BUY and SELL orders must be in history');
  console.log('  ✔ Trade history verified with BUY and SELL records.\n');

  // ----------------------------------------------------
  // Flow 10: Refresh and verify data persists
  // ----------------------------------------------------
  console.log('▶ [Flow 10] Refresh and verify data persists from PostgreSQL');
  await page.reload();
  await page.waitForSelector('button:has-text("Holdings")');
  await page.waitForTimeout(1000);

  const holdingsAfterPersist = await page.locator('button:has-text("Holdings")').textContent();
  assert(holdingsAfterPersist?.includes('(1)'), 'Holdings must persist after page refresh');
  console.log(`  Holdings after reload: "${holdingsAfterPersist?.trim()}"`);

  await page.click('#orders-tab');
  await page.waitForTimeout(500);
  const ordersAfterPersist = await page.locator('#orders-tab').textContent();
  assert(ordersAfterPersist?.includes('(2)'), 'Orders must persist after page refresh');
  console.log(`  Orders after reload: "${ordersAfterPersist?.trim()}"`);
  console.log('  ✔ Data persistence verified cleanly.\n');

  // ----------------------------------------------------
  // Flow 12: Try insufficient cash / insufficient shares
  // ----------------------------------------------------
  console.log('▶ [Flow 12] Try insufficient cash and insufficient shares');
  await page.goto(`${BASE_URL}/stocks/AAPL`);
  await page.waitForSelector('button:has-text("MUA")');

  // Buy with huge quantity
  await page.click('button:has-text("MUA")');
  await qtyInput.fill('999999');
  await page.waitForTimeout(500);
  const buyDisabledText = await page.locator('button:has-text("Không đủ số dư")').textContent().catch(() => null);
  console.log(`  Insufficient cash button: "${buyDisabledText?.trim()}"`);
  assert(buyDisabledText !== null, 'Buy button must indicate insufficient cash');

  // Sell with more shares than owned (owned is 1)
  await page.click('button:has-text("BÁN")');
  await qtyInput.fill('99');
  await page.waitForTimeout(500);
  const sellDisabledText = await page.locator('button:has-text("Vượt quá số lượng")').textContent().catch(() => null);
  console.log(`  Insufficient shares button: "${sellDisabledText?.trim()}"`);
  assert(sellDisabledText !== null, 'Sell button must indicate exceeding owned shares');
  console.log('  ✔ Insufficient cash and shares validation passed.\n');

  // ----------------------------------------------------
  // Flow 3: Logout
  // ----------------------------------------------------
  console.log('▶ [Flow 3] Logout');
  await page.goto(`${BASE_URL}/dashboard`);
  await page.waitForSelector('button:has-text("Logout")');
  await page.click('button:has-text("Logout")');
  await page.waitForTimeout(2000);
  console.log(`  After logout URL: ${page.url()}`);
  assert(page.url().includes('/login'), 'Should redirect to /login after logout');

  const signInBtn = await page.locator('#login-btn').isVisible();
  assert(signInBtn, 'Sign In button should be visible in TopNav after logout');
  console.log('  ✔ Logout flow passed cleanly.\n');

  // ----------------------------------------------------
  // Flow 2: Login with registered account
  // ----------------------------------------------------
  console.log(`▶ [Flow 2] Login with registered account (${testEmail})`);
  await page.goto(`${BASE_URL}/login`);
  await page.waitForSelector('#login-email');
  await page.fill('#login-email', testEmail);
  await page.fill('#login-password', testPassword);
  await page.click('#login-submit');
  await page.waitForURL('**/dashboard', { timeout: 10000 });
  await page.waitForSelector('h1');
  const loggedInGreeting = await page.locator('h1').textContent();
  console.log(`  Welcome greeting: "${loggedInGreeting?.trim()}"`);
  assert(loggedInGreeting?.includes('Welcome back'), 'Should be logged in back on dashboard');

  // Verify positions are still there
  const recheckHoldings = await page.locator('button:has-text("Holdings")').textContent();
  console.log(`  Holdings after login: "${recheckHoldings?.trim()}"`);
  assert(recheckHoldings?.includes('(1)'), 'Holdings must still be 1 after logging back in');
  console.log('  ✔ Login flow verified successfully.\n');

  // Extra: Unauthenticated OrderPanel check
  console.log('▶ [Extra UX Check] Unauthenticated OrderPanel behavior');
  await page.click('button:has-text("Logout")');
  await page.waitForTimeout(1500);
  await page.goto(`${BASE_URL}/stocks/AAPL`);
  await page.waitForSelector('button:has-text("Đăng nhập để giao dịch")');
  const unauthBtn = await page.locator('button:has-text("Đăng nhập để giao dịch")').isVisible();
  console.log(`  Unauthenticated button visible: ${unauthBtn}`);
  assert(unauthBtn, 'Unauthenticated user should see "Đăng nhập để giao dịch"');
  await page.click('button:has-text("Đăng nhập để giao dịch")');
  await page.waitForURL('**/login', { timeout: 5000 });
  console.log(`  Clicking button redirects to: ${page.url()}`);
  assert(page.url().includes('/login'), 'Should redirect to login');
  console.log('  ✔ Unauthenticated UX check passed cleanly.\n');

  console.log('========================================================');
  console.log('🎉 ALL 12 MVP FLOWS VALIDATED AND PASSED END-TO-END! 🎉');
  console.log('========================================================');

  await browser.close();
}

run().catch(err => {
  console.error('\n❌ TEST FAILED:', err);
  process.exit(1);
});