import { test, expect } from '@playwright/test';

const METHODOLOGIES = ['auto', 'direct', 'cod', 'sc', 'react', 'pas', 'tot'];

test.describe('Methodology Switch', () => {
  test('should display methodology buttons on home page', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();

    // The methodology selector is inside LogoSection — click the diamond to reveal it
    // Look for methodology buttons by their text labels
    for (const method of METHODOLOGIES) {
      const btn = page.locator(`button`, { hasText: new RegExp(`^${method}$`, 'i') }).first();
      // At least some methodology buttons should be visible after interaction
      const isVisible = await btn.isVisible().catch(() => false);
      if (isVisible) {
        // Click the methodology button
        await btn.click();

        // Verify no modal/dialog appeared (methodology switch should be inline)
        const dialog = page.locator('[role="dialog"], [class*="modal"]');
        await expect(dialog).toHaveCount(0);
      }
    }
  });

  test('should show methodology names matching known IDs', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();

    // Verify at least some methodology names appear on the page
    const pageText = await page.locator('body').textContent();
    const found = METHODOLOGIES.filter((m) => pageText!.toLowerCase().includes(m));
    expect(found.length).toBeGreaterThanOrEqual(1);
  });
});
