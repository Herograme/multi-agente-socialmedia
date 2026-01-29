/**
 * ExecutionControls Component
 * Story 5.3: Dashboard Principal com Metricas
 *
 * Controls for starting, monitoring, and canceling pipeline executions.
 */

import { useState } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Checkbox } from '../ui/checkbox';
import { Play, Square, Loader2 } from 'lucide-react';
import { usePipeline } from '../../hooks/usePipeline';
import type { PipelineStatus } from '@social-content/shared';

export interface ExecutionControlsProps {
  /** Current pipeline status */
  status: PipelineStatus;
}

interface ExecutionConfig {
  numPosts: number;
  platforms: string[];
  includeVisual: boolean;
}

/**
 * Provides controls for starting and managing pipeline executions.
 * Includes a configuration dialog and status indicator.
 */
export function ExecutionControls({ status }: ExecutionControlsProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [config, setConfig] = useState<ExecutionConfig>({
    numPosts: 3,
    platforms: ['instagram', 'linkedin'],
    includeVisual: true,
  });

  const { startPipeline, cancelPipeline, isStarting, isCancelling } = usePipeline();

  const handleStart = async () => {
    startPipeline({
      limit: config.numPosts,
    });
    setDialogOpen(false);
  };

  const handleCancel = async () => {
    cancelPipeline();
  };

  const handlePlatformChange = (platform: string, checked: boolean) => {
    const platforms = checked
      ? [...config.platforms, platform]
      : config.platforms.filter((p) => p !== platform);
    setConfig({ ...config, platforms });
  };

  const isRunning = status === 'running';

  return (
    <div className="flex items-center gap-4">
      {/* Status Badge */}
      <Badge variant={isRunning ? 'default' : 'secondary'} className="gap-1">
        {isRunning ? (
          <>
            <Loader2 className="h-3 w-3 animate-spin" />
            Executando...
          </>
        ) : (
          'Ocioso'
        )}
      </Badge>

      {/* Action Button */}
      {isRunning ? (
        <Button
          variant="destructive"
          onClick={handleCancel}
          disabled={isCancelling}
        >
          {isCancelling ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Square className="h-4 w-4 mr-2" />
          )}
          Cancelar
        </Button>
      ) : (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 gap-2">
            <Play className="h-4 w-4" />
            Nova Execucao
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Iniciar Nova Execucao</DialogTitle>
              <DialogDescription>
                Configure os parametros para gerar novos posts.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="numPosts">Numero de Posts</Label>
                <Input
                  id="numPosts"
                  type="number"
                  min={1}
                  max={10}
                  value={config.numPosts}
                  onChange={(e) =>
                    setConfig({ ...config, numPosts: parseInt(e.target.value) || 1 })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Plataformas</Label>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="instagram"
                      checked={config.platforms.includes('instagram')}
                      onCheckedChange={(checked) =>
                        handlePlatformChange('instagram', !!checked)
                      }
                    />
                    <Label htmlFor="instagram" className="font-normal cursor-pointer">
                      Instagram
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="linkedin"
                      checked={config.platforms.includes('linkedin')}
                      onCheckedChange={(checked) =>
                        handlePlatformChange('linkedin', !!checked)
                      }
                    />
                    <Label htmlFor="linkedin" className="font-normal cursor-pointer">
                      LinkedIn
                    </Label>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="includeVisual"
                  checked={config.includeVisual}
                  onCheckedChange={(checked) =>
                    setConfig({ ...config, includeVisual: !!checked })
                  }
                />
                <Label htmlFor="includeVisual" className="font-normal cursor-pointer">
                  Incluir assets visuais (carrossel, PDF)
                </Label>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleStart} disabled={isStarting || config.platforms.length === 0}>
                {isStarting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Play className="h-4 w-4 mr-2" />
                )}
                Iniciar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
