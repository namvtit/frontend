import { test, expect } from '@playwright/test';

test('promotional video', async ({ page }) => {
  // Set viewport to 1080x1920
  await page.setViewportSize({ width: 1080, height: 1920 });

  // Navigate to the homepage
  await page.goto('http://localhost:3000/');
  
  // Wait for the page to fully load
  await page.waitForTimeout(2000);
  
  // Take a screenshot of the hero section
  await page.screenshot({ path: 'artifacts/screenshot-hero.png' });

  // Scroll to the main benefits section
  // Replace '.benefits-section' with the actual selector
  await page.evaluate(() => {
    window.scrollBy({ top: 800, behavior: 'smooth' });
  });
  await page.waitForTimeout(2000);
  
  // Take a screenshot of the benefits section
  await page.screenshot({ path: 'artifacts/screenshot-benefits.png' });

  // Click the primary CTA
  // Replace '.cta-button' with the actual selector
  // await page.click('.cta-button');
  await page.waitForTimeout(2000);

  // Take a screenshot after CTA click
  await page.screenshot({ path: 'artifacts/screenshot-cta.png' });

  // Scroll to pricing/features
  // Replace '.pricing-section' with the actual selector
  await page.evaluate(() => {
    window.scrollBy({ top: 800, behavior: 'smooth' });
  });
  await page.waitForTimeout(2000);
  
  // Take a screenshot of the pricing/features
  await page.screenshot({ path: 'artifacts/screenshot-pricing.png' });

  // Navigate to signup/contact page
  await page.goto('http://localhost:3000/register');
  await page.waitForTimeout(2000);

  // Take a screenshot of the signup page
  await page.screenshot({ path: 'artifacts/screenshot-signup.png' });
});
