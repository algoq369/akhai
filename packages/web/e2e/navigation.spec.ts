import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('should navigate to /mindmap and load', async ({ page }) => {
    await page.goto('/mindmap');
    await expect(page).toHaveURL(/mindmap/);
    await expect(page.locator('body')).toBeVisible();
    // Page should have content (not blank)
    const bodyText = await page.locator('body').textContent();
    expect(bodyText!.length).toBeGreaterThan(0);
  });

  test('should navigate to /philosophy and load', async ({ page }) => {
    await page.goto('/philosophy');
    await expect(page).toHaveURL(/philosophy/);
    await expect(page.locator('body')).toBeVisible();
    const bodyText = await page.locator('body').textContent();
    expect(bodyText!.length).toBeGreaterThan(0);
  });

  test('should navigate to /living-tree and load', async ({ page }) => {
    await page.goto('/living-tree');
    await expect(page).toHaveURL(/living-tree/);
    await expect(page.locator('body')).toBeVisible();
    const bodyText = await page.locator('body').textContent();
    expect(bodyText!.length).toBeGreaterThan(0);
  });

  test('should navigate back correctly', async ({ page }) => {
    await page.goto('/');
    await page.goto('/mindmap');
    await expect(page).toHaveURL(/mindmap/);

    await page.goBack();
    await expect(page).toHaveURL('/');
  });
});
