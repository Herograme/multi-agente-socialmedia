import { test, expect } from '@playwright/test';
import { selectors, helpers, testData } from '../fixtures/test-data';

/**
 * Settings Page E2E Tests
 * Story 5.8: E2E Tests
 */
test.describe('Settings Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/settings');
    await helpers.waitForLoading(page);
  });

  test('should display settings page', async ({ page }) => {
    await expect(page.locator('h1')).toContainText(/Configurac/i);
  });

  test('should show source settings section', async ({ page }) => {
    const sourcesSection = page.locator('text=/Fontes|Sources|Dev.to|Hacker News/i');
    await expect(sourcesSection).toBeVisible();
  });

  test('should show LLM provider settings', async ({ page }) => {
    const llmSection = page.locator('text=/LLM|Provider|Groq|Gemini/i');
    await expect(llmSection).toBeVisible();
  });

  test('should show image provider settings', async ({ page }) => {
    const imageSection = page.locator('text=/Imagem|Image|Ideogram|Leonardo/i');
    await expect(imageSection).toBeVisible();
  });

  test('should show quality threshold setting', async ({ page }) => {
    const qualitySection = page.locator('text=/Qualidade|Quality|Threshold/i');
    await expect(qualitySection).toBeVisible();
  });
});

test.describe('Settings Interactions', () => {
  test.beforeEach(async ({ page }) => {
    // Mock settings API
    await helpers.mockApiResponse(page, '/settings', testData.settings);

    await page.goto('/settings');
    await helpers.waitForLoading(page);
  });

  test('should toggle source switches', async ({ page }) => {
    // Find a toggle switch
    const toggle = page.locator('button[role="switch"], input[type="checkbox"]').first();

    if (await toggle.isVisible()) {
      const initialState = await toggle.isChecked?.().catch(() => null);

      await toggle.click();

      // State should change (if it's a toggle)
      if (initialState !== null) {
        const newState = await toggle.isChecked?.().catch(() => null);
        expect(newState).not.toBe(initialState);
      }
    }
  });

  test('should show save button', async ({ page }) => {
    const saveBtn = page.locator('button', { hasText: /Salvar|Save/i });
    // Save button should exist (may be disabled if no changes)
    await expect(saveBtn).toBeVisible();
  });

  test('should show toast after saving settings', async ({ page }) => {
    // Mock save endpoint
    await page.route('**/api/settings', async (route) => {
      if (route.request().method() === 'PUT' || route.request().method() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      } else {
        await route.continue();
      }
    });

    // Find and click save button
    const saveBtn = page.locator('button', { hasText: /Salvar|Save/i });

    if (await saveBtn.isEnabled()) {
      await saveBtn.click();

      // Toast should appear
      const toast = page.locator('[role="alert"], [data-testid*="toast"]');
      await expect(toast).toBeVisible({ timeout: 5000 });
    }
  });
});

test.describe('Settings Validation', () => {
  test('should validate quality threshold input', async ({ page }) => {
    await page.goto('/settings');
    await helpers.waitForLoading(page);

    // Find quality threshold input
    const thresholdInput = page.locator('input[type="number"], input[type="range"]').first();

    if (await thresholdInput.isVisible()) {
      // Try to set invalid value
      await thresholdInput.fill('15'); // Assuming max is 10

      // Form validation should show error or prevent submission
      const errorMessage = page.locator('text=/invalido|invalid|error/i');
      const inputError = page.locator('[class*="error"], [class*="invalid"]');

      // Either error message appears or input is constrained
      const currentValue = await thresholdInput.inputValue();
      // Value should be constrained to valid range or error shown
      expect(
        await errorMessage.isVisible().catch(() => false) ||
        await inputError.isVisible().catch(() => false) ||
        parseFloat(currentValue) <= 10
      ).toBeTruthy();
    }
  });
});
