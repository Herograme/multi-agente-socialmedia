/**
 * Onboarding Checklist Component
 * Task #16 - Guia de primeiros passos para novos usuarios
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  Circle,
  Key,
  Play,
  FileCheck,
  ThumbsUp,
  ChevronDown,
  ChevronUp,
  Sparkles,
  X,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { cn } from '../../lib/utils';

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  route?: string;
  externalLink?: string;
  isComplete: boolean;
}

interface OnboardingChecklistProps {
  className?: string;
  onDismiss?: () => void;
}

const STORAGE_KEY = 'onboarding_checklist_state';

const DEFAULT_ITEMS: Omit<ChecklistItem, 'isComplete'>[] = [
  {
    id: 'api-keys',
    title: 'Configurar chaves de API',
    description: 'Configure as credenciais para acessar as fontes de conteudo',
    icon: Key,
    route: '/settings',
  },
  {
    id: 'first-pipeline',
    title: 'Executar primeiro pipeline',
    description: 'Pesquise tendencias e gere conteudo automaticamente',
    icon: Play,
    route: '/pipeline',
  },
  {
    id: 'review-content',
    title: 'Revisar conteudo curado',
    description: 'Veja o conteudo gerado pelo agente curador',
    icon: FileCheck,
    route: '/curated',
  },
  {
    id: 'approve-post',
    title: 'Aprovar primeiro post',
    description: 'Revise e aprove um post para publicacao',
    icon: ThumbsUp,
    route: '/posts',
  },
];

function loadChecklistState(): Record<string, boolean> {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
}

function saveChecklistState(state: Record<string, boolean>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage errors
  }
}

export function OnboardingChecklist({ className, onDismiss }: OnboardingChecklistProps) {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(true);
  const [completedItems, setCompletedItems] = useState<Record<string, boolean>>(loadChecklistState);
  const [isDismissed, setIsDismissed] = useState(() => {
    try {
      return localStorage.getItem('onboarding_dismissed') === 'true';
    } catch {
      return false;
    }
  });

  const items: ChecklistItem[] = DEFAULT_ITEMS.map((item) => ({
    ...item,
    isComplete: completedItems[item.id] || false,
  }));

  const completedCount = items.filter((item) => item.isComplete).length;
  const progress = (completedCount / items.length) * 100;
  const isAllComplete = completedCount === items.length;

  useEffect(() => {
    saveChecklistState(completedItems);
  }, [completedItems]);

  const handleItemClick = (item: ChecklistItem) => {
    if (item.route) {
      navigate(item.route);
    } else if (item.externalLink) {
      window.open(item.externalLink, '_blank');
    }
  };

  const handleToggleComplete = (itemId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCompletedItems((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    try {
      localStorage.setItem('onboarding_dismissed', 'true');
    } catch {
      // Ignore storage errors
    }
    onDismiss?.();
  };

  if (isDismissed) {
    return null;
  }

  return (
    <Card className={cn('border-primary/20 bg-primary/5', className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Primeiros Passos</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8 w-8 p-0"
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-3 mt-2">
          <Progress value={progress} className="flex-1 h-2" />
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            {completedCount}/{items.length}
          </span>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-2">
          {isAllComplete ? (
            <div className="text-center py-4">
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-2" />
              <p className="font-medium text-green-600 dark:text-green-400">
                Parabens! Voce completou todos os passos.
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Voce ja esta pronto para usar o sistema.
              </p>
              <Button variant="outline" size="sm" className="mt-3" onClick={handleDismiss}>
                Fechar guia
              </Button>
            </div>
          ) : (
            <ul className="space-y-2">
              {items.map((item) => (
                <li
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors',
                    item.isComplete
                      ? 'bg-green-50 dark:bg-green-950/30'
                      : 'hover:bg-muted/50'
                  )}
                >
                  <button
                    onClick={(e) => handleToggleComplete(item.id, e)}
                    className="flex-shrink-0"
                  >
                    {item.isComplete ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <item.icon
                        className={cn(
                          'h-4 w-4 flex-shrink-0',
                          item.isComplete ? 'text-green-500' : 'text-muted-foreground'
                        )}
                      />
                      <span
                        className={cn(
                          'font-medium text-sm',
                          item.isComplete && 'line-through text-muted-foreground'
                        )}
                      >
                        {item.title}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {item.description}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      )}
    </Card>
  );
}
