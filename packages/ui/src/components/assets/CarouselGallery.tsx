import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../ui/button';
import { DownloadButton } from './DownloadButton';
import { cn } from '../../lib/utils';
import type { Asset } from '@social-content/shared';

export interface CarouselGalleryProps {
  /** Array of carousel slide assets */
  slides: Asset[];
  /** Post ID for downloading ZIP */
  postId: string;
  /** API base URL (optional, defaults to environment variable) */
  apiBaseUrl?: string;
  /** Callback when download completes */
  onDownloadComplete?: () => void;
}

export function CarouselGallery({
  slides,
  postId,
  apiBaseUrl = '',
  onDownloadComplete,
}: CarouselGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  const handlePrev = useCallback(() => {
    setActiveIndex((prev) => (prev > 0 ? prev - 1 : slides.length - 1));
  }, [slides.length]);

  const handleNext = useCallback(() => {
    setActiveIndex((prev) => (prev < slides.length - 1 ? prev + 1 : 0));
  }, [slides.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if no input/textarea is focused
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePrev, handleNext]);

  const activeSlide = slides[activeIndex];

  if (slides.length === 0 || !activeSlide) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        <p>Nenhum slide disponivel</p>
      </div>
    );
  }

  const getAssetUrl = (assetId: string) => `${apiBaseUrl}/api/assets/${assetId}`;
  const getThumbnailUrl = (assetId: string) =>
    `${apiBaseUrl}/api/assets/${assetId}/thumbnail`;
  const getZipUrl = () => `${apiBaseUrl}/api/posts/${postId}/carousel/zip`;

  return (
    <div className="space-y-4">
      {/* Main Preview */}
      <div className="relative aspect-square bg-muted rounded-lg overflow-hidden">
        <img
          src={getAssetUrl(activeSlide.id)}
          alt={`Slide ${activeIndex + 1} de ${slides.length}`}
          className="w-full h-full object-contain"
        />

        {/* Navigation Arrows */}
        {slides.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white"
              onClick={handlePrev}
              aria-label="Slide anterior"
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white"
              onClick={handleNext}
              aria-label="Proximo slide"
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          </>
        )}

        {/* Slide Indicator */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 px-3 py-1 rounded-full text-sm text-white">
          {activeIndex + 1} / {slides.length}
        </div>
      </div>

      {/* Thumbnails */}
      {slides.length > 1 && (
        <div
          className="flex gap-2 overflow-x-auto pb-2"
          role="tablist"
          aria-label="Thumbnails do carrossel"
        >
          {slides.map((slide, index) => (
            <button
              key={slide.id}
              onClick={() => setActiveIndex(index)}
              role="tab"
              aria-selected={index === activeIndex}
              aria-label={`Ir para slide ${index + 1}`}
              className={cn(
                'flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 transition-colors',
                index === activeIndex
                  ? 'border-primary ring-2 ring-primary/30'
                  : 'border-transparent hover:border-muted-foreground/50'
              )}
            >
              <img
                src={getThumbnailUrl(slide.id)}
                alt={`Thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Download Actions */}
      <div className="flex flex-wrap gap-2">
        <DownloadButton
          url={getAssetUrl(activeSlide.id)}
          filename={`slide-${activeIndex + 1}.png`}
          size={activeSlide.sizeBytes}
          label="Baixar Slide"
          onComplete={onDownloadComplete}
        />
        {slides.length > 1 && (
          <DownloadButton
            url={getZipUrl()}
            filename={`carousel-${postId}.zip`}
            label="Baixar Carrossel (ZIP)"
            variant="secondary"
            onComplete={onDownloadComplete}
          />
        )}
      </div>
    </div>
  );
}
