/**
 * Template Types for Carousel Editor
 * Story 5.7 - Editor de Templates de Carrossel
 *
 * TypeScript interfaces for template customization and management.
 */

// ============================================================
// Enums and Type Aliases
// ============================================================

/**
 * Type of template slide
 */
export type TemplateSlideType = 'cover' | 'content' | 'code' | 'cta';

/**
 * Position for branding display
 */
export type BrandingPosition = 'footer-left' | 'footer-center' | 'footer-right';

// ============================================================
// Theme Configuration Types
// ============================================================

/**
 * Color configuration for the theme
 */
export interface TemplateColors {
  /** Primary background color (--bg-primary) */
  bgPrimary: string;
  /** Secondary background color (--bg-secondary) */
  bgSecondary: string;
  /** Tertiary background color (--bg-tertiary) */
  bgTertiary: string;
  /** Primary text color (--text-primary) */
  textPrimary: string;
  /** Secondary text color (--text-secondary) */
  textSecondary: string;
  /** Muted text color (--text-muted) */
  textMuted: string;
  /** Primary accent color (--accent-primary) */
  accentPrimary: string;
  /** Secondary accent color (--accent-secondary) */
  accentSecondary: string;
}

/**
 * Font configuration for the theme
 */
export interface TemplateFonts {
  /** Sans-serif font family (--font-sans) */
  fontSans: string;
  /** Monospace font family (--font-mono) */
  fontMono: string;
  /** Base font size multiplier */
  fontSizeBase: number;
}

/**
 * Overlay configuration
 */
export interface TemplateOverlay {
  /** Overlay color (--overlay-color) */
  color: string;
  /** Overlay opacity (0-1) */
  opacity: number;
}

/**
 * Branding configuration
 */
export interface TemplateBranding {
  /** Handle text (@username) */
  handle: string;
  /** Optional logo URL */
  logoUrl?: string;
  /** Position of the branding element */
  position: BrandingPosition;
}

/**
 * Complete theme configuration
 */
export interface TemplateTheme {
  /** Color settings */
  colors: TemplateColors;
  /** Font settings */
  fonts: TemplateFonts;
  /** Overlay settings */
  overlay: TemplateOverlay;
  /** Branding settings */
  branding: TemplateBranding;
}

// ============================================================
// Template Types
// ============================================================

/**
 * Template metadata
 */
export interface TemplateMetadata {
  /** Template name */
  name: string;
  /** Optional description */
  description?: string;
  /** Author name */
  author?: string;
  /** Creation date */
  createdAt: Date;
  /** Last update date */
  updatedAt: Date;
}

/**
 * Complete template entity
 */
export interface Template {
  /** Unique identifier */
  id: string;
  /** Template name */
  name: string;
  /** Optional description */
  description?: string;
  /** Theme configuration */
  theme: TemplateTheme;
  /** Whether this is the default template */
  isDefault: boolean;
  /** Creation timestamp */
  createdAt: Date;
  /** Last update timestamp */
  updatedAt: Date;
}

/**
 * Template configuration (for create/update operations)
 */
export interface TemplateConfig {
  /** Template name */
  name: string;
  /** Optional description */
  description?: string;
  /** Theme configuration */
  theme: TemplateTheme;
}

// ============================================================
// Input Types
// ============================================================

/**
 * Input for creating a new template
 */
export interface CreateTemplateInput {
  /** Template name */
  name: string;
  /** Optional description */
  description?: string;
  /** Theme configuration */
  theme: TemplateTheme;
}

/**
 * Input for updating an existing template
 */
export interface UpdateTemplateInput {
  /** Optional new name */
  name?: string;
  /** Optional new description */
  description?: string;
  /** Optional theme updates (partial) */
  theme?: Partial<TemplateTheme>;
}

// ============================================================
// Export Types
// ============================================================

/**
 * Exported template format for JSON export/import
 */
export interface ExportedTemplate {
  /** Export format version */
  version: '1.0';
  /** Export timestamp */
  exportedAt: string;
  /** Template data (without id and system fields) */
  template: Omit<Template, 'id' | 'isDefault' | 'createdAt' | 'updatedAt'>;
}

// ============================================================
// API Response Types
// ============================================================

/**
 * Response for template list
 */
export interface TemplateListResponse {
  /** List of templates */
  templates: Template[];
  /** Total count */
  total: number;
}

/**
 * Response for template operations
 */
export interface TemplateResponse {
  /** Success status */
  success: boolean;
  /** Template data (if successful) */
  template?: Template;
  /** Error message (if failed) */
  error?: string;
}

// ============================================================
// Default Values
// ============================================================

/**
 * Default theme colors (dark theme)
 */
export const DEFAULT_TEMPLATE_COLORS: TemplateColors = {
  bgPrimary: '#0d1117',
  bgSecondary: '#161b22',
  bgTertiary: '#21262d',
  textPrimary: '#f0f6fc',
  textSecondary: '#8b949e',
  textMuted: '#6e7681',
  accentPrimary: '#58a6ff',
  accentSecondary: '#7ee787',
};

/**
 * Default font settings
 */
export const DEFAULT_TEMPLATE_FONTS: TemplateFonts = {
  fontSans: 'Inter',
  fontMono: 'JetBrains Mono',
  fontSizeBase: 1,
};

/**
 * Default overlay settings
 */
export const DEFAULT_TEMPLATE_OVERLAY: TemplateOverlay = {
  color: 'rgba(0, 0, 0, 0.6)',
  opacity: 0.6,
};

/**
 * Default branding settings
 */
export const DEFAULT_TEMPLATE_BRANDING: TemplateBranding = {
  handle: '@dev',
  position: 'footer-right',
};

/**
 * Default complete theme
 */
export const DEFAULT_TEMPLATE_THEME: TemplateTheme = {
  colors: DEFAULT_TEMPLATE_COLORS,
  fonts: DEFAULT_TEMPLATE_FONTS,
  overlay: DEFAULT_TEMPLATE_OVERLAY,
  branding: DEFAULT_TEMPLATE_BRANDING,
};

// ============================================================
// Font Options
// ============================================================

/**
 * Available sans-serif fonts
 */
export const SANS_FONTS = [
  { value: 'Inter', label: 'Inter' },
  { value: 'Roboto', label: 'Roboto' },
  { value: 'Open Sans', label: 'Open Sans' },
  { value: 'Montserrat', label: 'Montserrat' },
  { value: 'Poppins', label: 'Poppins' },
  { value: 'Nunito', label: 'Nunito' },
  { value: 'Lato', label: 'Lato' },
] as const;

/**
 * Available monospace fonts
 */
export const MONO_FONTS = [
  { value: 'JetBrains Mono', label: 'JetBrains Mono' },
  { value: 'Fira Code', label: 'Fira Code' },
  { value: 'Source Code Pro', label: 'Source Code Pro' },
  { value: 'IBM Plex Mono', label: 'IBM Plex Mono' },
  { value: 'Roboto Mono', label: 'Roboto Mono' },
] as const;

/**
 * Available slide types
 */
export const TEMPLATE_SLIDE_TYPES: TemplateSlideType[] = ['cover', 'content', 'code', 'cta'];

/**
 * Available branding positions
 */
export const BRANDING_POSITIONS: BrandingPosition[] = ['footer-left', 'footer-center', 'footer-right'];
