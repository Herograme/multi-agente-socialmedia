/**
 * Agent Configuration for Pipeline Flow
 * Defines the 8 agents with their visual configuration
 */

import {
  Search,
  Lightbulb,
  BookOpen,
  Pencil,
  Image,
  LayoutGrid,
  FileText,
  CheckCircle,
  type LucideIcon,
} from 'lucide-react';
import type { AgentId } from '@social-content/shared';

export interface AgentConfig {
  id: AgentId;
  name: string;
  icon: LucideIcon;
  description: string;
}

export const AGENTS: readonly AgentConfig[] = [
  {
    id: 'researcher',
    name: 'Pesquisador',
    icon: Search,
    description: 'Busca tendencias em fontes tech',
  },
  {
    id: 'topic-generator',
    name: 'Gerador de Topicos',
    icon: Lightbulb,
    description: 'Seleciona topicos relevantes',
  },
  {
    id: 'curator',
    name: 'Curador',
    icon: BookOpen,
    description: 'Busca referencias e exemplos',
  },
  {
    id: 'writer',
    name: 'Redator',
    icon: Pencil,
    description: 'Gera textos para posts',
  },
  {
    id: 'image-designer',
    name: 'Designer',
    icon: Image,
    description: 'Gera imagens de fundo',
  },
  {
    id: 'carousel-builder',
    name: 'Carousel Builder',
    icon: LayoutGrid,
    description: 'Cria slides do carrossel',
  },
  {
    id: 'pdf-maker',
    name: 'PDF Maker',
    icon: FileText,
    description: 'Gera PDFs para LinkedIn',
  },
  {
    id: 'qa-analyst',
    name: 'QA Analyst',
    icon: CheckCircle,
    description: 'Avalia qualidade do output',
  },
] as const;

/**
 * Get agent name by ID
 */
export function getAgentName(agentId: AgentId | string): string {
  const agent = AGENTS.find((a) => a.id === agentId);
  return agent?.name || agentId;
}

/**
 * Get agent config by ID
 */
export function getAgentConfig(agentId: AgentId | string): AgentConfig | undefined {
  return AGENTS.find((a) => a.id === agentId);
}
