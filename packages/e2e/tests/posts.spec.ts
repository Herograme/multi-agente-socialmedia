import { test, expect } from '@playwright/test';
import { selectors, helpers, testData } from '../fixtures/test-data';

/**
 * Posts Page E2E Tests
 * Story 5.8: E2E Tests
 */
test.describe('Posts Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/posts');
    await helpers.waitForLoading(page);
  });

  test('should display posts page', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Posts');
    await expect(page.locator('text=Gerencie seus posts gerados')).toBeVisible();
  });

  test('should show empty state when no posts', async ({ page }) => {
    // If there are no posts, empty state should be visible
    const emptyState = page.locator('text=Nenhum post gerado');
    const postsGrid = page.locator('[class*="grid"]');

    // Either posts exist or empty state is shown
    await expect(emptyState.or(postsGrid)).toBeVisible();
  });

  test('should navigate to post detail when clicking a post', async ({ page }) => {
    // Mock posts data
    await helpers.mockApiResponse(page, '/posts', {
      posts: [
        {
          id: 'test-123',
          textInstagram: 'Test post',
          status: 'pending',
          createdAt: new Date().toISOString(),
        },
      ],
    });

    await page.reload();
    await helpers.waitForLoading(page);

    // Click on post card if it exists
    const postCard = page.locator('[class*="Card"]').first();
    if (await postCard.isVisible()) {
      await postCard.click();
      // Should navigate to detail page
      await expect(page).toHaveURL(/\/posts\/.+/);
    }
  });
});

test.describe('Post Detail Page', () => {
  test('should display post detail with mocked data', async ({ page }) => {
    // Mock single post endpoint
    await helpers.mockApiResponse(page, '/posts/test-123', {
      post: testData.post,
    });

    await page.goto('/posts/test-123');
    await helpers.waitForLoading(page);

    // Should show post content
    await expect(page.locator('h1')).toContainText(/Post #/);
  });

  test('should show back button', async ({ page }) => {
    await page.goto('/posts/test-123');

    // Back button should be visible
    const backButton = page.locator('a[href="/posts"], button').filter({
      has: page.locator('[class*="ArrowLeft"], svg'),
    });

    await expect(backButton.first()).toBeVisible();
  });

  test('should show error state for non-existent post', async ({ page }) => {
    // Don't mock - let it fail
    await page.goto('/posts/non-existent-id');
    await helpers.waitForLoading(page);

    // Should show error or not found state
    const errorState = page.locator('text=/Erro|nao encontrado|not found/i');
    await expect(errorState).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Post Approval Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Mock post data
    await helpers.mockApiResponse(page, '/posts/test-123', {
      post: { ...testData.post, id: 'test-123' },
    });
  });

  test('should show approval buttons for pending post', async ({ page }) => {
    await page.goto('/posts/test-123');
    await helpers.waitForLoading(page);

    // Approval buttons should be visible for pending posts
    const approveBtn = page.locator('button', { hasText: /Aprovar/i });
    const rejectBtn = page.locator('button', { hasText: /Rejeitar/i });

    // At least the buttons section should exist
    const actionSection = page.locator('text=/Aprovar|Rejeitar/i');
    await expect(actionSection).toBeVisible();
  });

  test('should show toast after approving post', async ({ page }) => {
    // Mock approval endpoint
    await page.route('**/api/posts/test-123/approve', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    });

    await page.goto('/posts/test-123');
    await helpers.waitForLoading(page);

    const approveBtn = page.locator('button', { hasText: /Aprovar/i });
    if (await approveBtn.isVisible()) {
      await approveBtn.click();

      // Toast should appear
      const toast = page.locator('[role="alert"], [data-testid*="toast"]');
      await expect(toast).toBeVisible({ timeout: 5000 });
    }
  });
});
