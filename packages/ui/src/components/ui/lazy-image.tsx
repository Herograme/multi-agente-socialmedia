import { useState, useRef, useEffect, ImgHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';
import { Skeleton } from './skeleton';

interface LazyImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'onLoad' | 'onError'> {
  /** Image source URL */
  src: string;
  /** Alt text for accessibility */
  alt: string;
  /** Additional CSS classes */
  className?: string;
  /** Low-quality placeholder image (e.g., base64 blur) */
  placeholder?: string;
  /** Explicit width */
  width?: number;
  /** Explicit height */
  height?: number;
  /** Threshold for intersection observer (0-1) */
  threshold?: number;
  /** Root margin for intersection observer */
  rootMargin?: string;
  /** Callback when image loads successfully */
  onLoadSuccess?: () => void;
  /** Callback when image fails to load */
  onLoadError?: (error: Error) => void;
  /** Fallback element when image fails to load */
  fallback?: React.ReactNode;
  /** Object fit mode */
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
}

/**
 * LazyImage component
 * Loads images only when they enter the viewport using IntersectionObserver.
 * Shows a skeleton placeholder while loading.
 *
 * Story 5.8: Lazy Loading
 *
 * @example
 * <LazyImage
 *   src="/images/post.jpg"
 *   alt="Post image"
 *   className="w-full h-64"
 * />
 *
 * // With blur placeholder
 * <LazyImage
 *   src="/images/post.jpg"
 *   alt="Post image"
 *   placeholder={lowQualityBase64}
 * />
 */
export function LazyImage({
  src,
  alt,
  className,
  placeholder,
  width,
  height,
  threshold = 0.1,
  rootMargin = '50px',
  onLoadSuccess,
  onLoadError,
  fallback,
  objectFit = 'cover',
  ...props
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Set up intersection observer
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry && entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin,
        threshold,
      }
    );

    observer.observe(container);

    return () => observer.disconnect();
  }, [rootMargin, threshold]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoadSuccess?.();
  };

  const handleError = () => {
    setHasError(true);
    onLoadError?.(new Error(`Failed to load image: ${src}`));
  };

  // Error state with fallback
  if (hasError) {
    return (
      <div
        ref={containerRef}
        className={cn('relative overflow-hidden bg-muted', className)}
        style={{ width, height }}
      >
        {fallback || (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <svg
                className="h-8 w-8 mx-auto mb-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span className="text-xs">Erro ao carregar</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn('relative overflow-hidden', className)}
      style={{ width, height }}
    >
      {/* Skeleton Placeholder */}
      {!isLoaded && <Skeleton className="absolute inset-0 w-full h-full" />}

      {/* Blur Placeholder */}
      {placeholder && !isLoaded && (
        <img
          src={placeholder}
          alt=""
          className="absolute inset-0 w-full h-full object-cover blur-lg scale-110"
          aria-hidden="true"
        />
      )}

      {/* Actual Image */}
      {isInView && (
        <img
          src={src}
          alt={alt}
          className={cn(
            'w-full h-full transition-opacity duration-300',
            isLoaded ? 'opacity-100' : 'opacity-0'
          )}
          style={{ objectFit }}
          onLoad={handleLoad}
          onError={handleError}
          loading="lazy"
          decoding="async"
          {...props}
        />
      )}
    </div>
  );
}

/**
 * LazyBackgroundImage component
 * Similar to LazyImage but renders as a background image.
 */
interface LazyBackgroundImageProps {
  src: string;
  className?: string;
  children?: React.ReactNode;
  threshold?: number;
  rootMargin?: string;
}

export function LazyBackgroundImage({
  src,
  className,
  children,
  threshold = 0.1,
  rootMargin = '50px',
}: LazyBackgroundImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry && entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin, threshold }
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, [rootMargin, threshold]);

  // Preload image when in view
  useEffect(() => {
    if (!isInView) return;

    const img = new Image();
    img.src = src;
    img.onload = () => setIsLoaded(true);
  }, [isInView, src]);

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative overflow-hidden transition-opacity duration-300',
        isLoaded ? 'opacity-100' : 'opacity-0',
        className
      )}
      style={{
        backgroundImage: isInView ? `url(${src})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {!isLoaded && <Skeleton className="absolute inset-0" />}
      {children}
    </div>
  );
}

/**
 * Progressive image component with low-quality to high-quality transition
 */
interface ProgressiveImageProps extends LazyImageProps {
  lowQualitySrc: string;
}

export function ProgressiveImage({
  src,
  lowQualitySrc,
  alt,
  className,
  ...props
}: ProgressiveImageProps) {
  const [currentSrc, setCurrentSrc] = useState(lowQualitySrc);
  const [isHighQualityLoaded, setIsHighQualityLoaded] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.src = src;
    img.onload = () => {
      setCurrentSrc(src);
      setIsHighQualityLoaded(true);
    };
  }, [src]);

  return (
    <img
      src={currentSrc}
      alt={alt}
      className={cn(
        'transition-all duration-500',
        !isHighQualityLoaded && 'blur-sm scale-105',
        className
      )}
      {...props}
    />
  );
}
