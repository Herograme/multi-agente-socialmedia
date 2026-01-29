/**
 * Posts Components
 * Story 5.5 - Fluxo de Aprovacao de Posts
 *
 * Barrel export for post-related components.
 */

// Approval workflow components
export { ApprovalButtons } from './ApprovalButtons';
export type { ApprovalButtonsProps } from './ApprovalButtons';

export { RejectDialog } from './RejectDialog';
export type { RejectDialogProps } from './RejectDialog';

export { RegenerateButton } from './RegenerateButton';
export type { RegenerateButtonProps } from './RegenerateButton';

export { StatusFilter } from './StatusFilter';
export type { StatusFilterProps, FilterValue } from './StatusFilter';

export { BulkActions } from './BulkActions';
export type { BulkActionsProps } from './BulkActions';

export { PostStatusBadge } from './PostStatusBadge';
export type { PostStatusBadgeProps } from './PostStatusBadge';

// Quality gate badge (from Story 4.6)
export { ApprovalBadge, ApprovalIndicator, ScoreBadge, PostApprovalStatus } from './ApprovalBadge';
