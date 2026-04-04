import { test, expect } from '@playwright/test';

test.describe('Query Flow', () => {
  test('should submit a query and display a response', async ({ page }) => {
    await page.goto('/');

    // Wait for page to load
    await expect(page.locator('body')).toBeVisible();

    // Find the textarea input
    const textarea = page.locator('textarea').first();
    await expect(textarea).toBeVisible({ timeout: 10_000 });

    // Type a query
    await textarea.fill('What is 2 + 2?');

    // Click the TRANSMIT button
    const submitBtn = page.locator('#submit-button');
    await submitBtn.click();

    // Wait for response to appear (look for a response container)
    const response = page
      .locator('[class*="response"], [class*="message"], [class*="answer"]')
      .first();
    await expect(response).toBeVisible({ timeout: 30_000 });

    // Verify response contains text (not empty)
    const responseText = await response.textContent();
    expect(responseText).toBeTruthy();
    expect(responseText!.length).toBeGreaterThan(0);

    // Verify methodology badge shows in header
    const methodBadge = page
      .locator('header')
      .locator('text=/direct|auto|cod|sc|react|pas|tot/i')
      .first();
    await expect(methodBadge).toBeVisible({ timeout: 5_000 });
  });
});
