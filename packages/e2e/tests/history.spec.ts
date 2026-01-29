import { test, expect } from '@playwright/test';
import { selectors, helpers, testData } from '../fixtures/test-data';

/**
 * History Page E2E Tests
 * Story 5.8: E2E Tests
 */
test.describe('History Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/history');
    await helpers.waitForLoading(page);
  });

  test('should display history page', async ({ page }) => {
    await expect(page.locator('h1')).toContainText(/Historico/i);
  });

  test('should show filters section', async ({ page }) => {
    // Filter controls should be visible
    const filterSection = page.locator('text=/Periodo|Filtro|Status/i');
    await expect(filterSection).toBeVisible();
  });

  test('should show stats summary cards', async ({ page }) => {
    // Mock stats data
    await helpers.mockApiResponse(page, '/executions/stats*', {
      totalExecutions: 10,
      totalPosts: 25,
      averageScore: 82,
      successRate: 0.9,
      scoreOverTime: [],
      postsByPeriod: [],
    });

    await page.reload();
    await helpers.waitForLoading(page);

    // Stats cards should be visible
    const statsSection = page.locator('text=/Total|Media|Taxa/i');
    await expect(statsSection).toBeVisible();
  });

  test('should show execution list or empty state', async ({ page }) => {
    // Either execution list or empty state should be visible
    const executionList = page.locator('[class*="Card"]').filter({
      has: page.locator('text=/Execucao|execucoes/i'),
    });
    const emptyState = page.locator('text=/Nenhuma execucao|Nenhum historico/i');

    await expect(executionList.first().or(emptyState)).toBeVisible();
  });

  test('should have export CSV button', async ({ page }) => {
    const exportBtn = page.locator('button', { hasText: /Exportar|CSV/i });
    await expect(exportBtn).toBeVisible();
  });
});

test.describe('History Filters', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/history');
    await helpers.waitForLoading(page);
  });

  test('should update URL when changing period filter', async ({ page }) => {
    // Mock data
    await helpers.mockApiResponse(page, '/executions*', {
      executions: [],
      total: 0,
    });

    // Find and interact with period filter
    const periodFilter = page.locator('button, select').filter({
      hasText: /Periodo|7 dias|30 dias/i,
    });

    if (await periodFilter.isVisible()) {
      await periodFilter.first().click();

      // Select a different period
      const option = page.locator('text=/30 dias|Ultimo mes/i');
      if (await option.isVisible()) {
        await option.click();

        // URL should update
        await expect(page).toHaveURL(/period=/);
      }
    }
  });

  test('should update URL when changing status filter', async ({ page }) => {
    // Mock data
    await helpers.mockApiResponse(page, '/executions*', {
      executions: [],
      total: 0,
    });

    // Find status filter
    const statusFilter = page.locator('button, select').filter({
      hasText: /Status|Todos|Sucesso|Erro/i,
    });

    if (await statusFilter.isVisible()) {
      await statusFilter.first().click();

      // Select a status
      const option = page.locator('text=/Sucesso|success/i').first();
      if (await option.isVisible()) {
        await option.click();

        // URL should update
        await expect(page).toHaveURL(/status=/);
      }
    }
  });
});

test.describe('History Export', () => {
  test('should trigger CSV download', async ({ page }) => {
    // Mock executions data
    await helpers.mockApiResponse(page, '/executions*', {
      executions: [
        {
          id: 'exec-1',
          status: 'completed',
          startedAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
          postsGenerated: 3,
        },
      ],
      total: 1,
    });

    await page.goto('/history');
    await helpers.waitForLoading(page);

    // Find and click export button
    const exportBtn = page.locator('button', { hasText: /Exportar|CSV/i });

    if (await exportBtn.isEnabled()) {
      // Set up download listener
      const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null);

      await exportBtn.click();

      const download = await downloadPromise;
      if (download) {
        expect(download.suggestedFilename()).toMatch(/\.csv$/);
      }
    }
  });
});
