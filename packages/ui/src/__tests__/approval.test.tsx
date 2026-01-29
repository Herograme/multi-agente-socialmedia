/**
 * Approval Components Tests
 * Story 5.5 - Fluxo de Aprovacao de Posts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { ToastProvider } from '../components/ui/toast';
import { TooltipProvider } from '../components/ui/tooltip';
import { ApprovalButtons } from '../components/posts/ApprovalButtons';
import { RejectDialog } from '../components/posts/RejectDialog';
import { RegenerateButton } from '../components/posts/RegenerateButton';
import { StatusFilter } from '../components/posts/StatusFilter';
import { BulkActions } from '../components/posts/BulkActions';
import { PostStatusBadge } from '../components/posts/PostStatusBadge';
import { PendingBadge } from '../components/layout/PendingBadge';
import { PostStatus } from '@social-content/shared';

// Helper constants for test readability
const PENDING = PostStatus.PENDING;
const APPROVED = PostStatus.APPROVED;
const REJECTED = PostStatus.REJECTED;

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Create test wrapper
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ToastProvider>
          <TooltipProvider>{children}</TooltipProvider>
        </ToastProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
  Wrapper.displayName = 'TestWrapper';
  return Wrapper;
}

describe('ApprovalButtons', () => {
  beforeEach(() => {
    mockFetch.mockClear();
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });
  });

  it('should render approve and reject buttons for pending posts', () => {
    const onRejectClick = vi.fn();
    render(
      <ApprovalButtons
        postId="1"
        status={PENDING}
        onRejectClick={onRejectClick}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByRole('button', { name: /aprovar/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /rejeitar/i })).toBeInTheDocument();
  });

  it('should not render buttons for approved posts', () => {
    render(
      <ApprovalButtons
        postId="1"
        status={APPROVED}
        onRejectClick={vi.fn()}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('should not render buttons for rejected posts', () => {
    render(
      <ApprovalButtons
        postId="1"
        status={REJECTED}
        onRejectClick={vi.fn()}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('should call onRejectClick when reject button is clicked', () => {
    const onRejectClick = vi.fn();
    render(
      <ApprovalButtons
        postId="1"
        status={PENDING}
        onRejectClick={onRejectClick}
      />,
      { wrapper: createWrapper() }
    );

    fireEvent.click(screen.getByRole('button', { name: /rejeitar/i }));
    expect(onRejectClick).toHaveBeenCalled();
  });

  it('should call API when approve button is clicked', async () => {
    const onRejectClick = vi.fn();
    render(
      <ApprovalButtons
        postId="test-id"
        status={PENDING}
        onRejectClick={onRejectClick}
      />,
      { wrapper: createWrapper() }
    );

    fireEvent.click(screen.getByRole('button', { name: /aprovar/i }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/posts/test-id/approve'),
        expect.any(Object)
      );
    });
  });
});

describe('RejectDialog', () => {
  beforeEach(() => {
    mockFetch.mockClear();
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });
  });

  it('should render dialog when open', () => {
    render(
      <RejectDialog
        open={true}
        onOpenChange={vi.fn()}
        postId="1"
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('Rejeitar Post')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/texto muito generico/i)).toBeInTheDocument();
  });

  it('should not render dialog when closed', () => {
    render(
      <RejectDialog
        open={false}
        onOpenChange={vi.fn()}
        postId="1"
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.queryByText('Rejeitar Post')).not.toBeInTheDocument();
  });

  it('should allow entering rejection reason', () => {
    render(
      <RejectDialog
        open={true}
        onOpenChange={vi.fn()}
        postId="1"
      />,
      { wrapper: createWrapper() }
    );

    const textarea = screen.getByPlaceholderText(/texto muito generico/i);
    fireEvent.change(textarea, { target: { value: 'Motivo de teste' } });

    expect(textarea).toHaveValue('Motivo de teste');
  });

  it('should call API when reject button is clicked', async () => {
    render(
      <RejectDialog
        open={true}
        onOpenChange={vi.fn()}
        postId="test-id"
      />,
      { wrapper: createWrapper() }
    );

    // Enter a reason
    const textarea = screen.getByPlaceholderText(/texto muito generico/i);
    fireEvent.change(textarea, { target: { value: 'Test reason' } });

    // Click reject
    fireEvent.click(screen.getByRole('button', { name: /^rejeitar$/i }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/posts/test-id/reject'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ reason: 'Test reason' }),
        })
      );
    });
  });
});

describe('RegenerateButton', () => {
  beforeEach(() => {
    mockFetch.mockClear();
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });
  });

  it('should render button for rejected posts', () => {
    render(
      <RegenerateButton postId="1" status={REJECTED} />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByRole('button', { name: /regenerar/i })).toBeInTheDocument();
  });

  it('should not render button for pending posts', () => {
    render(
      <RegenerateButton postId="1" status={PENDING} />,
      { wrapper: createWrapper() }
    );

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('should not render button for approved posts', () => {
    render(
      <RegenerateButton postId="1" status={APPROVED} />,
      { wrapper: createWrapper() }
    );

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('should call API when clicked', async () => {
    render(
      <RegenerateButton postId="test-id" status={REJECTED} />,
      { wrapper: createWrapper() }
    );

    fireEvent.click(screen.getByRole('button', { name: /regenerar/i }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/posts/test-id/regenerate'),
        expect.any(Object)
      );
    });
  });
});

describe('StatusFilter', () => {
  const mockCounts = {
    all: 10,
    pending: 5,
    approved: 3,
    rejected: 2,
  };

  it('should render all filter tabs', () => {
    render(<StatusFilter counts={mockCounts} />, { wrapper: createWrapper() });

    expect(screen.getByText('Todos')).toBeInTheDocument();
    expect(screen.getByText('Pendentes')).toBeInTheDocument();
    expect(screen.getByText('Aprovados')).toBeInTheDocument();
    expect(screen.getByText('Rejeitados')).toBeInTheDocument();
  });

  it('should display counts in badges', () => {
    render(<StatusFilter counts={mockCounts} />, { wrapper: createWrapper() });

    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('should call onChange when tab is clicked', () => {
    const onChange = vi.fn();
    render(
      <StatusFilter counts={mockCounts} value="all" onChange={onChange} />,
      { wrapper: createWrapper() }
    );

    fireEvent.click(screen.getByText('Pendentes'));
    expect(onChange).toHaveBeenCalledWith('pending');
  });
});

describe('BulkActions', () => {
  beforeEach(() => {
    mockFetch.mockClear();
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, updated: 3, failed: 0 }),
    });
  });

  it('should render select all checkbox', () => {
    render(
      <BulkActions
        selectedIds={[]}
        totalCount={10}
        onSelectAll={vi.fn()}
        allSelected={false}
        onClearSelection={vi.fn()}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByRole('checkbox')).toBeInTheDocument();
    expect(screen.getByText(/selecionar todos/i)).toBeInTheDocument();
  });

  it('should show action buttons when items are selected', () => {
    render(
      <BulkActions
        selectedIds={['1', '2', '3']}
        totalCount={10}
        onSelectAll={vi.fn()}
        allSelected={false}
        onClearSelection={vi.fn()}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('3 de 10 selecionado(s)')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /aprovar selecionados/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /rejeitar selecionados/i })).toBeInTheDocument();
  });

  it('should not show action buttons when no items are selected', () => {
    render(
      <BulkActions
        selectedIds={[]}
        totalCount={10}
        onSelectAll={vi.fn()}
        allSelected={false}
        onClearSelection={vi.fn()}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.queryByRole('button', { name: /aprovar selecionados/i })).not.toBeInTheDocument();
  });

  it('should call onSelectAll when checkbox is clicked', () => {
    const onSelectAll = vi.fn();
    render(
      <BulkActions
        selectedIds={[]}
        totalCount={10}
        onSelectAll={onSelectAll}
        allSelected={false}
        onClearSelection={vi.fn()}
      />,
      { wrapper: createWrapper() }
    );

    fireEvent.click(screen.getByRole('checkbox'));
    expect(onSelectAll).toHaveBeenCalledWith(true);
  });
});

describe('PostStatusBadge', () => {
  it('should render pending status correctly', () => {
    render(<PostStatusBadge status={PENDING} />, { wrapper: createWrapper() });
    expect(screen.getByText('Pendente')).toBeInTheDocument();
  });

  it('should render approved status correctly', () => {
    render(<PostStatusBadge status={APPROVED} />, { wrapper: createWrapper() });
    expect(screen.getByText('Aprovado')).toBeInTheDocument();
  });

  it('should render rejected status correctly', () => {
    render(<PostStatusBadge status={REJECTED} />, { wrapper: createWrapper() });
    expect(screen.getByText('Rejeitado')).toBeInTheDocument();
  });
});

describe('PendingBadge', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  it('should not render when count is 0', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ count: 0 }),
    });

    const { container } = render(<PendingBadge />, { wrapper: createWrapper() });

    // Wait for query to resolve
    await waitFor(() => {
      expect(container.firstChild).toBeNull();
    });
  });

  it('should render count when greater than 0', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ count: 5 }),
    });

    render(<PendingBadge />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('5')).toBeInTheDocument();
    });
  });

  it('should render 99+ for counts over 99', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ count: 150 }),
    });

    render(<PendingBadge />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('99+')).toBeInTheDocument();
    });
  });
});
