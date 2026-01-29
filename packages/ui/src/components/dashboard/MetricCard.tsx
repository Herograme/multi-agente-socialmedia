/**
 * MetricCard Component
 * Story 5.3: Dashboard Principal com Metricas
 *
 * Card displaying a single metric with value, change indicator, and variant styling.
 */

import { ReactNode } from 'react';
import { Card, CardContent } from '../ui/card';
import { cn } from '../../lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export interface MetricCardProps {
  /** Card title/label */
  title: string;
  /** Main metric value */
  value: string | number;
  /** Percentage change (optional) */
  change?: number;
  /** Label for the change indicator (default: "vs ontem") */
  changeLabel?: string;
  /** Icon to display */
  icon: ReactNode;
  /** Visual variant */
  variant?: 'default' | 'success' | 'warning' | 'danger';
  /** Show skeleton loading state */
  loading?: boolean;
}

const variantStyles = {
  default: 'text-foreground',
  success: 'text-green-500',
  warning: 'text-yellow-500',
  danger: 'text-red-500',
};

/**
 * Displays a single metric in a card format.
 * Supports loading states, change indicators, and color variants.
 */
export function MetricCard({
  title,
  value,
  change,
  changeLabel = 'vs ontem',
  icon,
  variant = 'default',
  loading = false,
}: MetricCardProps) {
  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-muted rounded w-1/2" />
            <div className="h-8 bg-muted rounded w-3/4" />
            <div className="h-3 bg-muted rounded w-1/3" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const getTrendIcon = () => {
    if (change === undefined || change === 0) {
      return <Minus className="h-3 w-3" />;
    }
    return change > 0 ? (
      <TrendingUp className="h-3 w-3 text-green-500" />
    ) : (
      <TrendingDown className="h-3 w-3 text-red-500" />
    );
  };

  const getTrendColor = () => {
    if (change === undefined || change === 0) return 'text-muted-foreground';
    return change > 0 ? 'text-green-500' : 'text-red-500';
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className={cn('p-2 rounded-full bg-muted', variantStyles[variant])}>
            {icon}
          </div>
        </div>
        <div className="mt-2">
          <p className={cn('text-2xl font-bold', variantStyles[variant])}>
            {value}
          </p>
          {change !== undefined && (
            <div className={cn('flex items-center gap-1 mt-1 text-xs', getTrendColor())}>
              {getTrendIcon()}
              <span>
                {change > 0 ? '+' : ''}{change}% {changeLabel}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
