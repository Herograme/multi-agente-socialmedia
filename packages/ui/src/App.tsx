import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Layout } from './components/layout/Layout';
import { ToastProvider } from './components/ui/toast-provider';
import { ErrorBoundary } from './components/error/ErrorBoundary';
import { WebSocketProvider } from './providers/WebSocketProvider';
import {
  DashboardSkeleton,
  PostsPageSkeleton,
  PostDetailSkeleton,
  HistoryPageSkeleton,
  SettingsSkeleton,
  TrendsPageSkeleton,
  CuratedPageSkeleton,
  PipelineSkeleton,
} from './components/ui/skeleton-patterns';

// ============================================
// Lazy-loaded route components
// Story 5.8: Lazy Loading
// ============================================

// Dashboard is loaded eagerly as it's the landing page
import { Dashboard } from './routes/Dashboard';

// Other routes are lazy-loaded for better initial bundle size
const Trends = lazy(() => import('./routes/Trends').then(m => ({ default: m.Trends })));
const Curated = lazy(() => import('./routes/Curated').then(m => ({ default: m.Curated })));
const Pipeline = lazy(() => import('./routes/Pipeline').then(m => ({ default: m.Pipeline })));
const Execution = lazy(() => import('./routes/Execution').then(m => ({ default: m.Execution })));
const Posts = lazy(() => import('./routes/Posts').then(m => ({ default: m.Posts })));
const PostDetail = lazy(() => import('./routes/PostDetail').then(m => ({ default: m.PostDetail })));
const History = lazy(() => import('./routes/History').then(m => ({ default: m.History })));
const Settings = lazy(() => import('./routes/Settings').then(m => ({ default: m.Settings })));

// Template Editor routes (Story 5.7)
const Templates = lazy(() => import('./routes/settings/Templates').then(m => ({ default: m.Templates })));
const TemplateEditor = lazy(() => import('./routes/settings/TemplateEditor').then(m => ({ default: m.TemplateEditor })));

// Create a client with default options
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

/**
 * Route wrapper with Suspense and appropriate skeleton fallback
 */
function SuspenseRoute({
  children,
  fallback,
}: {
  children: React.ReactNode;
  fallback: React.ReactNode;
}) {
  return (
    <ErrorBoundary>
      <Suspense fallback={fallback}>{children}</Suspense>
    </ErrorBoundary>
  );
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WebSocketProvider>
        <ToastProvider>
          <ErrorBoundary>
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Layout />}>
                  {/* Dashboard - loaded eagerly */}
                  <Route index element={<Dashboard />} />

                  {/* Lazy-loaded routes with Suspense */}
                  <Route
                    path="trends"
                    element={
                      <SuspenseRoute fallback={<TrendsPageSkeleton />}>
                        <Trends />
                      </SuspenseRoute>
                    }
                  />
                  <Route
                    path="curated"
                    element={
                      <SuspenseRoute fallback={<CuratedPageSkeleton />}>
                        <Curated />
                      </SuspenseRoute>
                    }
                  />
                  <Route
                    path="pipeline"
                    element={
                      <SuspenseRoute fallback={<PipelineSkeleton />}>
                        <Pipeline />
                      </SuspenseRoute>
                    }
                  />
                  <Route
                    path="execution"
                    element={
                      <SuspenseRoute fallback={<PipelineSkeleton />}>
                        <Execution />
                      </SuspenseRoute>
                    }
                  />
                  <Route
                    path="posts"
                    element={
                      <SuspenseRoute fallback={<PostsPageSkeleton />}>
                        <Posts />
                      </SuspenseRoute>
                    }
                  />
                  <Route
                    path="posts/:id"
                    element={
                      <SuspenseRoute fallback={<PostDetailSkeleton />}>
                        <PostDetail />
                      </SuspenseRoute>
                    }
                  />
                  <Route
                    path="history"
                    element={
                      <SuspenseRoute fallback={<HistoryPageSkeleton />}>
                        <History />
                      </SuspenseRoute>
                    }
                  />
                  <Route
                    path="settings"
                    element={
                      <SuspenseRoute fallback={<SettingsSkeleton />}>
                        <Settings />
                      </SuspenseRoute>
                    }
                  />
                  {/* Template Editor routes (Story 5.7) */}
                  <Route
                    path="settings/templates"
                    element={
                      <SuspenseRoute fallback={<SettingsSkeleton />}>
                        <Templates />
                      </SuspenseRoute>
                    }
                  />
                  <Route
                    path="settings/templates/:id/edit"
                    element={
                      <SuspenseRoute fallback={<SettingsSkeleton />}>
                        <TemplateEditor />
                      </SuspenseRoute>
                    }
                  />
                  <Route
                    path="settings/templates/new"
                    element={
                      <SuspenseRoute fallback={<SettingsSkeleton />}>
                        <TemplateEditor />
                      </SuspenseRoute>
                    }
                  />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Route>
              </Routes>
            </BrowserRouter>
          </ErrorBoundary>
        </ToastProvider>
      </WebSocketProvider>
    </QueryClientProvider>
  );
}
