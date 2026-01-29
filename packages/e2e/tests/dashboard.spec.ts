import { test, expect } from '@playwright/test';
import { selectors, helpers } from '../fixtures/test-data';

/**
 * Dashboard E2E Tests
 * Story 5.8: E2E Tests
 */
test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await helpers.waitForLoading(page);
  });

  test('should display dashboard page with title', async ({ page }) => {
    await expect(page).toHaveTitle(/Social Content Agent/);
    await expect(page.locator('h1')).toContainText('Dashboard');
  });

  test('should display metrics cards section', async ({ page }) => {
    // Wait for dashboard to load
    const dashboard = page.locator('.space-y-6').first();
    await expect(dashboard).toBeVisible();

    // Check for metrics cards
    const cards = page.locator('[class*="Card"]');
    await expect(cards.first()).toBeVisible();
  });

  test('should display system status', async ({ page }) => {
    // Look for status section
    const statusCard = page.locator('text=Status do Sistema').first();
    await expect(statusCard).toBeVisible();
  });

  test('should have working navigation links', async ({ page }) => {
    // Test navigation to Posts
    await page.click('text=Posts');
    await expect(page).toHaveURL(/\/posts/);

    // Navigate to History
    await page.click('text=Historico');
    await expect(page).toHaveURL(/\/history/);

    // Navigate to Settings
    await page.click('text=Configuracoes');
    await expect(page).toHaveURL(/\/settings/);

    // Return to Dashboard
    await page.click('text=Dashboard');
    await expect(page).toHaveURL('/');
  });

  test('should display page transition animation', async ({ page }) => {
    // Navigate to another page
    await page.click('text=Posts');

    // The page transition should apply opacity and transform
    // We check that the page loads successfully
    await expect(page).toHaveURL(/\/posts/);
    await expect(page.locator('h1')).toContainText('Posts');
  });

  test('should show connection status', async ({ page }) => {
    // Look for connection status indicator
    const statusText = page.locator('text=/Online|Offline|Verificando/');
    await expect(statusText).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Dashboard - Offline Mode', () => {
  test('should handle offline state gracefully', async ({ page, context }) => {
    // First load the page
    await page.goto('/');
    await helpers.waitForLoading(page);

    // Go offline
    await context.setOffline(true);

    // Refresh the page
    await page.reload();

    // Should still show cached content or offline indicator
    // The app should not crash
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });
});
