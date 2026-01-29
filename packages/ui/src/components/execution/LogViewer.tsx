/**
 * LogViewer Component
 * Terminal-style log display with auto-scroll and color-coded messages
 */

import { useEffect, useRef, useState } from 'react';
import { Button } from '../ui/button';
import { Pause, Play } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { ExecutionLogEntry } from '@social-content/shared';

interface LogViewerProps {
  logs: ExecutionLogEntry[];
  maxHeight?: number;
}

const levelColors: Record<ExecutionLogEntry['level'], string> = {
  info: 'text-foreground',
  success: 'text-green-400',
  warning: 'text-yellow-400',
  error: 'text-red-400',
};

function formatTimestamp(date: Date): string {
  const d = new Date(date);
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  const seconds = d.getSeconds().toString().padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

export function LogViewer({ logs, maxHeight = 400 }: LogViewerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    const isAtBottom = target.scrollHeight - target.scrollTop - target.clientHeight < 50;
    if (!isAtBottom && autoScroll) {
      setAutoScroll(false);
    }
  };

  return (
    <div className="relative">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="bg-zinc-950 rounded-lg p-4 font-mono text-sm overflow-auto"
        style={{ maxHeight }}
      >
        {logs.length === 0 ? (
          <p className="text-muted-foreground">Aguardando eventos...</p>
        ) : (
          <div className="space-y-1">
            {logs.map((log) => (
              <div key={log.id} className="flex gap-2">
                <span className="text-muted-foreground shrink-0">
                  [{formatTimestamp(log.timestamp)}]
                </span>
                {log.agentId && (
                  <span className="text-blue-400 shrink-0">[{log.agentId}]</span>
                )}
                <span className={cn(levelColors[log.level])}>{log.message}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Auto-scroll toggle */}
      <Button
        variant="ghost"
        size="sm"
        className="absolute bottom-2 right-2"
        onClick={() => setAutoScroll(!autoScroll)}
        title={autoScroll ? 'Pausar auto-scroll' : 'Retomar auto-scroll'}
      >
        {autoScroll ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
      </Button>
    </div>
  );
}
