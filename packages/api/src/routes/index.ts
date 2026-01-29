export { healthRoutes } from './health';
export { researcherRoutes, curadorRoutes } from './agents';
export { pipelineRoutes } from './pipeline';
export { devTemplatesRoutes } from './dev';
export { postsRoutes } from './posts';
export { approvalRoutes } from './posts/approval';

// Quality Gate routes (Story 4.6)
export { thresholdRoutes } from './config';
export { qualityMetricsRoutes } from './metrics';

// Dashboard Metrics routes (Story 5.3)
export { dashboardMetricsRoutes } from './metrics';

// Execution History routes (Story 4.8)
export { executionsRoutes } from './executions';

// Template Editor routes (Story 5.7)
export { templatesRoutes } from './templates';
