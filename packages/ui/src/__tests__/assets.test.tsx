import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CarouselGallery } from '../components/assets/CarouselGallery';
import { DownloadButton } from '../components/assets/DownloadButton';
import { GenerateVisualButton } from '../components/assets/GenerateVisualButton';
import {
  GallerySkeleton,
  PDFSkeleton,
  PostAssetsSkeleton,
} from '../components/assets/AssetSkeleton';
import { AssetType, type Asset } from '@social-content/shared';

// Mock formatFileSize
vi.mock('../lib/fileSize', () => ({
  formatFileSize: (bytes: number) => {
    if (bytes === 0) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  },
}));

const mockSlides: Asset[] = [
  {
    id: 'asset-1',
    postId: 'post-1',
    type: AssetType.CAROUSEL_SLIDE,
    path: '/slide-1.png',
    sizeBytes: 102400,
    createdAt: new Date('2026-01-28T10:00:00Z'),
  },
  {
    id: 'asset-2',
    postId: 'post-1',
    type: AssetType.CAROUSEL_SLIDE,
    path: '/slide-2.png',
    sizeBytes: 98304,
    createdAt: new Date('2026-01-28T10:00:00Z'),
  },
  {
    id: 'asset-3',
    postId: 'post-1',
    type: AssetType.CAROUSEL_SLIDE,
    path: '/slide-3.png',
    sizeBytes: 110592,
    createdAt: new Date('2026-01-28T10:00:00Z'),
  },
];

describe('CarouselGallery', () => {
  it('should render slide indicator showing 1 of total', () => {
    render(<CarouselGallery slides={mockSlides} postId="test-post" />);

    expect(screen.getByText('1 / 3')).toBeInTheDocument();
  });

  it('should render all thumbnails', () => {
    render(<CarouselGallery slides={mockSlides} postId="test-post" />);

    const thumbnails = screen.getAllByRole('tab');
    expect(thumbnails).toHaveLength(mockSlides.length);
  });

  it('should navigate to next slide on next button click', () => {
    render(<CarouselGallery slides={mockSlides} postId="test-post" />);

    // Find next button by aria-label
    const nextButton = screen.getByLabelText('Proximo slide');
    fireEvent.click(nextButton);

    expect(screen.getByText('2 / 3')).toBeInTheDocument();
  });

  it('should navigate to previous slide on prev button click', () => {
    render(<CarouselGallery slides={mockSlides} postId="test-post" />);

    // Go to slide 2 first
    const nextButton = screen.getByLabelText('Proximo slide');
    fireEvent.click(nextButton);
    expect(screen.getByText('2 / 3')).toBeInTheDocument();

    // Go back to slide 1
    const prevButton = screen.getByLabelText('Slide anterior');
    fireEvent.click(prevButton);
    expect(screen.getByText('1 / 3')).toBeInTheDocument();
  });

  it('should wrap around when navigating past last slide', () => {
    render(<CarouselGallery slides={mockSlides} postId="test-post" />);

    const nextButton = screen.getByLabelText('Proximo slide');

    // Click next 3 times to go past the last slide
    fireEvent.click(nextButton);
    fireEvent.click(nextButton);
    fireEvent.click(nextButton);

    // Should wrap back to first slide
    expect(screen.getByText('1 / 3')).toBeInTheDocument();
  });

  it('should wrap around when navigating before first slide', () => {
    render(<CarouselGallery slides={mockSlides} postId="test-post" />);

    const prevButton = screen.getByLabelText('Slide anterior');
    fireEvent.click(prevButton);

    // Should wrap to last slide
    expect(screen.getByText('3 / 3')).toBeInTheDocument();
  });

  it('should navigate using keyboard arrows', () => {
    render(<CarouselGallery slides={mockSlides} postId="test-post" />);

    // Press right arrow
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(screen.getByText('2 / 3')).toBeInTheDocument();

    // Press left arrow
    fireEvent.keyDown(window, { key: 'ArrowLeft' });
    expect(screen.getByText('1 / 3')).toBeInTheDocument();
  });

  it('should change slide when clicking thumbnail', () => {
    render(<CarouselGallery slides={mockSlides} postId="test-post" />);

    const thumbnails = screen.getAllByRole('tab');
    const thirdThumbnail = thumbnails[2];
    if (thirdThumbnail) {
      fireEvent.click(thirdThumbnail); // Click third thumbnail
    }

    expect(screen.getByText('3 / 3')).toBeInTheDocument();
  });

  it('should render empty state when no slides', () => {
    render(<CarouselGallery slides={[]} postId="test-post" />);

    expect(screen.getByText('Nenhum slide disponivel')).toBeInTheDocument();
  });

  it('should render download buttons', () => {
    render(<CarouselGallery slides={mockSlides} postId="test-post" />);

    expect(screen.getByText('Baixar Slide')).toBeInTheDocument();
    expect(screen.getByText('Baixar Carrossel (ZIP)')).toBeInTheDocument();
  });

  it('should not render ZIP button for single slide', () => {
    const singleSlide = mockSlides[0];
    if (!singleSlide) throw new Error('No slide available');
    render(<CarouselGallery slides={[singleSlide]} postId="test-post" />);

    expect(screen.getByText('Baixar Slide')).toBeInTheDocument();
    expect(screen.queryByText('Baixar Carrossel (ZIP)')).not.toBeInTheDocument();
  });
});

describe('DownloadButton', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should display label', () => {
    render(
      <DownloadButton
        url="/test.png"
        filename="test.png"
        label="Baixar Arquivo"
      />
    );

    expect(screen.getByText('Baixar Arquivo')).toBeInTheDocument();
  });

  it('should display size when provided', () => {
    render(
      <DownloadButton
        url="/test.png"
        filename="test.png"
        size={102400}
        label="Baixar"
      />
    );

    expect(screen.getByText('(100.0 KB)')).toBeInTheDocument();
  });

  it('should show loading state during download', async () => {
    // Mock fetch to return a slow response
    const mockFetch = vi.fn().mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              ok: true,
              headers: { get: () => '1024' },
              body: {
                getReader: () => ({
                  read: vi
                    .fn()
                    .mockResolvedValueOnce({
                      done: false,
                      value: new Uint8Array(1024),
                    })
                    .mockResolvedValueOnce({ done: true }),
                }),
              },
            });
          }, 100);
        })
    );
    global.fetch = mockFetch;

    render(
      <DownloadButton url="/test.png" filename="test.png" label="Baixar" />
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    // Should show loading state
    await waitFor(() => {
      expect(screen.getByText(/Baixando/)).toBeInTheDocument();
    });
  });

  it('should call onComplete callback after successful download', async () => {
    // Mock URL.createObjectURL and URL.revokeObjectURL
    const mockCreateObjectURL = vi.fn().mockReturnValue('blob:test');
    const mockRevokeObjectURL = vi.fn();
    global.URL.createObjectURL = mockCreateObjectURL;
    global.URL.revokeObjectURL = mockRevokeObjectURL;

    // Mock fetch
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: { get: () => '1024' },
      body: {
        getReader: () => ({
          read: vi
            .fn()
            .mockResolvedValueOnce({
              done: false,
              value: new Uint8Array(1024),
            })
            .mockResolvedValueOnce({ done: true }),
        }),
      },
    });
    global.fetch = mockFetch;

    const onComplete = vi.fn();
    render(
      <DownloadButton
        url="/test.png"
        filename="test.png"
        label="Baixar"
        onComplete={onComplete}
      />
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalledTimes(1);
    });
  });

  it('should call onError callback when download fails', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      statusText: 'Not Found',
    });
    global.fetch = mockFetch;

    const onError = vi.fn();
    render(
      <DownloadButton
        url="/test.png"
        filename="test.png"
        label="Baixar"
        onError={onError}
      />
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});

describe('GenerateVisualButton', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render empty state initially', () => {
    render(
      <GenerateVisualButton postId="test-post" onComplete={() => {}} />
    );

    expect(screen.getByText('Sem Assets Visuais')).toBeInTheDocument();
    expect(screen.getByText(/nao possui carrossel ou PDF/)).toBeInTheDocument();
  });

  it('should show generate button', () => {
    render(
      <GenerateVisualButton postId="test-post" onComplete={() => {}} />
    );

    expect(screen.getByRole('button', { name: /gerar visual/i })).toBeInTheDocument();
  });

  it('should start generation when button clicked', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ executionId: 'exec-123' }),
    });
    global.fetch = mockFetch;

    render(
      <GenerateVisualButton postId="test-post" onComplete={() => {}} />
    );

    const button = screen.getByRole('button', { name: /gerar visual/i });
    fireEvent.click(button);

    // Wait for the initial POST request to be made
    await waitFor(
      () => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/pipeline/visual',
          expect.objectContaining({
            method: 'POST',
          })
        );
      },
      { timeout: 2000 }
    );
  });

  it('should show error state when generation fails', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      statusText: 'Internal Server Error',
      json: () => Promise.resolve({ error: 'Generation failed' }),
    });
    global.fetch = mockFetch;

    const onError = vi.fn();
    render(
      <GenerateVisualButton
        postId="test-post"
        onComplete={() => {}}
        onError={onError}
      />
    );

    const button = screen.getByRole('button', { name: /gerar visual/i });
    fireEvent.click(button);

    await waitFor(
      () => {
        expect(screen.getByText('Erro na Geracao')).toBeInTheDocument();
      },
      { timeout: 2000 }
    );

    expect(onError).toHaveBeenCalled();
  });
});

describe('Asset Skeletons', () => {
  it('should render GallerySkeleton with default thumbnails', () => {
    const { container } = render(<GallerySkeleton />);

    // Check for animate-pulse class
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();

    // Default 5 thumbnails
    const thumbnails = container.querySelectorAll('.w-16.h-16');
    expect(thumbnails).toHaveLength(5);
  });

  it('should render GallerySkeleton with custom thumbnail count', () => {
    const { container } = render(<GallerySkeleton thumbnailCount={3} />);

    const thumbnails = container.querySelectorAll('.w-16.h-16');
    expect(thumbnails).toHaveLength(3);
  });

  it('should render PDFSkeleton', () => {
    const { container } = render(<PDFSkeleton />);

    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
    expect(container.querySelector('.h-\\[600px\\]')).toBeInTheDocument();
  });

  it('should render PostAssetsSkeleton', () => {
    const { container } = render(<PostAssetsSkeleton />);

    // Should have grid layout
    expect(container.querySelector('.grid')).toBeInTheDocument();
  });
});
