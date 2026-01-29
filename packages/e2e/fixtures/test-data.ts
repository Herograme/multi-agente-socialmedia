/**
 * Test data fixtures for E2E tests
 * Story 5.8: E2E Tests
 */

export const testData = {
  // Sample post data
  post: {
    id: 'test-post-001',
    textInstagram: 'Texto de teste para Instagram #tech #dev',
    textLinkedin: 'Texto profissional de teste para LinkedIn sobre tecnologia.',
    status: 'pending' as const,
    score: {
      overallScore: 85,
      criteriaBreakdown: [
        { name: 'Relevancia', score: 90 },
        { name: 'Clareza', score: 85 },
        { name: 'Engajamento', score: 80 },
      ],
      feedback: 'Post de alta qualidade com bom potencial de engajamento.',
    },
  },

  // Sample execution data
  execution: {
    id: 'test-exec-001',
    status: 'completed' as const,
    duration: 120000,
    postsGenerated: 3,
    averageScore: 82,
  },

  // Sample settings
  settings: {
    qualityThreshold: 7.0,
    sources: {
      devto: true,
      hackernews: true,
      reddit: true,
    },
    llmProvider: 'groq',
    imageProvider: 'ideogram',
  },

  // Sample trend data
  trend: {
    id: 'test-trend-001',
    title: 'Como usar React Server Components',
    source: 'devto' as const,
    url: 'https://dev.to/article/react-server-components',
  },
};

/**
 * Test selectors for common elements
 */
export const selectors = {
  // Navigation
  sidebar: '[data-testid="sidebar"]',
  header: '[data-testid="header"]',
  navLink: (name: string) => `a[href="/${name}"]`,

  // Dashboard
  metricsCards: '[data-testid="metrics-cards"]',
  postsToday: '[data-testid="posts-today"]',
  avgScore: '[data-testid="avg-score"]',
  pipelineStatus: '[data-testid="pipeline-status"]',
  executePipelineBtn: '[data-testid="execute-pipeline-btn"]',
  pipelineRunning: '[data-testid="pipeline-running"]',

  // Posts
  postsGrid: '[data-testid="posts-grid"]',
  postCard: '[data-testid="post-card"]',
  approveBtn: '[data-testid="approve-btn"]',
  rejectBtn: '[data-testid="reject-btn"]',
  postDetail: '[data-testid="post-detail"]',
  downloadCarouselBtn: '[data-testid="download-carousel-btn"]',
  filterApproved: '[data-testid="filter-approved"]',

  // History
  executionList: '[data-testid="execution-list"]',
  executionItem: '[data-testid="execution-item"]',
  executionDetail: '[data-testid="execution-detail"]',
  periodFilter: '[data-testid="period-filter"]',
  statusFilter: '[data-testid="status-filter"]',
  exportCsvBtn: '[data-testid="export-csv-btn"]',

  // Settings
  qualityThresholdInput: '[data-testid="quality-threshold-input"]',
  sourceToggle: (source: string) => `[data-testid="source-${source}-toggle"]`,
  saveSettingsBtn: '[data-testid="save-settings-btn"]',
  resetDefaultsBtn: '[data-testid="reset-defaults-btn"]',
  confirmDialog: '[data-testid="confirm-dialog"]',
  confirmBtn: '[data-testid="confirm-btn"]',

  // Toasts
  toastSuccess: '[data-testid="toast-success"]',
  toastError: '[data-testid="toast-error"]',

  // Loading states
  skeleton: '[class*="skeleton"]',
  emptyState: '[data-testid="empty-state"]',
  errorFallback: '[data-testid="error-fallback"]',
};

/**
 * Helper functions for E2E tests
 */
export const helpers = {
  /**
   * Generate a unique ID for test data
   */
  generateId: () => `test-${Date.now()}-${Math.random().toString(36).slice(2)}`,

  /**
   * Wait for loading to complete
   */
  waitForLoading: async (page: import('@playwright/test').Page) => {
    await page.waitForSelector(selectors.skeleton, { state: 'detached', timeout: 10000 }).catch(() => {});
  },

  /**
   * Mock API response
   */
  mockApiResponse: async (
    page: import('@playwright/test').Page,
    endpoint: string,
    response: object
  ) => {
    await page.route(`**/api${endpoint}`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(response),
      });
    });
  },
};
