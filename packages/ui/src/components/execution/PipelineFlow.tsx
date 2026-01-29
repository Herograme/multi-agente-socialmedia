/**
 * PipelineFlow Component
 * Displays the pipeline as a connected flow of agents
 * Supports horizontal (desktop) and vertical (mobile) layouts
 */

import { AgentNode } from './AgentNode';
import { AgentConnector } from './AgentConnector';
import { AGENTS } from './agentConfig';
import type { AgentNodeState, AgentId } from '@social-content/shared';

interface PipelineFlowProps {
  agents: Record<AgentId, AgentNodeState>;
}

export function PipelineFlow({ agents }: PipelineFlowProps) {
  // Create a default agent state for missing agents
  const getAgentState = (agentId: AgentId): AgentNodeState => {
    return agents[agentId] || { id: agentId, name: agentId, status: 'waiting' as const };
  };

  return (
    <div className="relative">
      {/* Desktop: Horizontal Flow */}
      <div className="hidden lg:flex items-center justify-between overflow-x-auto py-4 gap-1">
        {AGENTS.map((agentConfig, index) => (
          <div key={agentConfig.id} className="flex items-center">
            <AgentNode config={agentConfig} state={getAgentState(agentConfig.id)} />
            {index < AGENTS.length - 1 && (
              <AgentConnector
                fromStatus={getAgentState(agentConfig.id).status}
                toStatus={getAgentState(AGENTS[index + 1].id).status}
              />
            )}
          </div>
        ))}
      </div>

      {/* Mobile/Tablet: Vertical Flow */}
      <div className="lg:hidden flex flex-col items-center space-y-2 py-4">
        {AGENTS.map((agentConfig, index) => (
          <div key={agentConfig.id} className="flex flex-col items-center w-full max-w-sm">
            <AgentNode config={agentConfig} state={getAgentState(agentConfig.id)} compact />
            {index < AGENTS.length - 1 && (
              <AgentConnector
                fromStatus={getAgentState(agentConfig.id).status}
                toStatus={getAgentState(AGENTS[index + 1].id).status}
                vertical
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
