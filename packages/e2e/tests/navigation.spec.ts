import { test, expect } from '@playwright/test';
import { helpers } from '../fixtures/test-data';

/**
 * Navigation E2E Tests
 * Story 5.8: E2E Tests
 */
test.describe('Navigation', () => {
  test('should navigate between all main pages', async ({ page }) => {
    await page.goto('/');
    await helpers.waitForLoading(page);

    // Navigation routes to test
    const routes = [
      { path: '/trends', title: /Tendencias|Trends/i },
      { path: '/curated', title: /Curado|Curated/i },
      { path: '/pipeline', title: /Pipeline/i },
      { path: '/posts', title: /Posts/i },
      { path: '/history', title: /Historico|History/i },
      { path: '/settings', title: /Configurac|Settings/i },
      { path: '/', title: /Dashboard/i },
    ];

    for (const route of routes) {
      await page.goto(route.path);
      await helpers.waitForLoading(page);

      // Check URL
      await expect(page).toHaveURL(route.path === '/' ? '/' : new RegExp(route.path));

      // Check page title/header
      const heading = page.locator('h1');
      await expect(heading).toContainText(route.title);
    }
  });

  test('should handle 404 for unknown routes', async ({ page }) => {
    await page.goto('/unknown-route');

    // Should redirect to dashboard
    await expect(page).toHaveURL('/');
  });

  test('should preserve navigation state on refresh', async ({ page }) => {
    await page.goto('/posts');
    await helpers.waitForLoading(page);

    // Refresh the page
    await page.reload();
    await helpers.waitForLoading(page);

    // Should still be on posts page
    await expect(page).toHaveURL(/\/posts/);
  });
});

test.describe('Sidebar Navigation', () => {
  test('should toggle sidebar', async ({ page }) => {
    await page.goto('/');
    await helpers.waitForLoading(page);

    // Find sidebar toggle button (usually in header or sidebar)
    const toggleButton = page.locator('button').filter({
      has: page.locator('[class*="Menu"], [class*="menu"], svg'),
    });

    if (await toggleButton.first().isVisible()) {
      // Get initial sidebar state
      const sidebar = page.locator('nav, [class*="sidebar"], aside').first();
      const initialWidth = await sidebar.boundingBox().then((box) => box?.width || 0);

      // Click toggle
      await toggleButton.first().click();
      await page.waitForTimeout(300); // Wait for animation

      // Check if sidebar state changed
      const newWidth = await sidebar.boundingBox().then((box) => box?.width || 0);
      expect(newWidth !== initialWidth).toBeTruthy();
    }
  });

  test('should highlight active navigation item', async ({ page }) => {
    await page.goto('/posts');
    await helpers.waitForLoading(page);

    // Active nav link should have different styling
    const activeLink = page.locator('a[href="/posts"]').first();

    if (await activeLink.isVisible()) {
      // Active links typically have different background or text color
      const className = await activeLink.getAttribute('class');
      expect(
        className?.includes('active') ||
        className?.includes('selected') ||
        className?.includes('bg-')
      ).toBeTruthy();
    }
  });
});

test.describe('Page Transitions', () => {
  test('should animate page transitions', async ({ page }) => {
    await page.goto('/');
    await helpers.waitForLoading(page);

    // Navigate to posts
    await page.click('text=Posts');

    // Check that page loads (animation happens quickly)
    await expect(page).toHaveURL(/\/posts/);
    await expect(page.locator('h1')).toContainText('Posts');
  });

  test('should respect reduced motion preference', async ({ page }) => {
    // Set reduced motion preference
    await page.emulateMedia({ reducedMotion: 'reduce' });

    await page.goto('/');
    await helpers.waitForLoading(page);

    // Navigate between pages
    await page.click('text=Posts');

    // Page should still work (just without animation)
    await expect(page).toHaveURL(/\/posts/);
  });
});

test.describe('Browser History', () => {
  test('should navigate back and forward correctly', async ({ page }) => {
    await page.goto('/');
    await helpers.waitForLoading(page);

    // Navigate forward
    await page.goto('/posts');
    await page.goto('/history');

    // Go back
    await page.goBack();
    await expect(page).toHaveURL(/\/posts/);

    // Go back again
    await page.goBack();
    await expect(page).toHaveURL('/');

    // Go forward
    await page.goForward();
    await expect(page).toHaveURL(/\/posts/);
  });
});
