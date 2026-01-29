/**
 * AgentConnector Component
 * Visual connector between agent nodes in the pipeline flow
 */

import { cn } from '../../lib/utils';
import { ChevronRight, ChevronDown } from 'lucide-react';
import type { AgentNodeStatus } from '@social-content/shared';

interface AgentConnectorProps {
  fromStatus?: AgentNodeStatus;
  toStatus?: AgentNodeStatus;
  vertical?: boolean;
}

export function AgentConnector({ fromStatus, vertical = false }: AgentConnectorProps) {
  const isActive = fromStatus === 'done' || fromStatus === 'running';
  const Icon = vertical ? ChevronDown : ChevronRight;

  return (
    <div className={cn('flex items-center justify-center', vertical ? 'h-4' : 'w-8')}>
      <Icon
        className={cn(
          'h-4 w-4 transition-colors',
          isActive ? 'text-primary' : 'text-muted-foreground'
        )}
      />
    </div>
  );
}
