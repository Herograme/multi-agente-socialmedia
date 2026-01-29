import { useState } from 'react';
import { Wifi, WifiOff, RefreshCw, Radio } from 'lucide-react';
import { useWebSocketContext } from '../../providers/WebSocketProvider';
import { Button } from '../ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { cn } from '../../lib/utils';

export interface ConnectionStatusProps {
  className?: string;
  showLabel?: boolean;
}

export function ConnectionStatus({ className, showLabel = false }: ConnectionStatusProps) {
  const {
    isConnected,
    isReconnecting,
    reconnectAttempts,
    lastError,
    isFallbackMode,
    reconnect,
  } = useWebSocketContext();

  const [showReconnectButton, setShowReconnectButton] = useState(false);

  const getStatusColor = () => {
    if (isConnected) return 'text-green-500';
    if (isReconnecting) return 'text-yellow-500';
    if (isFallbackMode) return 'text-orange-500';
    return 'text-red-500';
  };

  const getStatusBgColor = () => {
    if (isConnected) return 'bg-green-500/20';
    if (isReconnecting) return 'bg-yellow-500/20';
    if (isFallbackMode) return 'bg-orange-500/20';
    return 'bg-red-500/20';
  };

  const getStatusText = () => {
    if (isConnected) return 'Conectado';
    if (isReconnecting) return `Reconectando (${reconnectAttempts}/10)...`;
    if (isFallbackMode) return 'Modo Polling';
    return 'Desconectado';
  };

  const getStatusIcon = () => {
    if (isConnected) return Wifi;
    if (isReconnecting) return RefreshCw;
    if (isFallbackMode) return Radio;
    return WifiOff;
  };

  const Icon = getStatusIcon();

  const handleClick = () => {
    if (!isConnected && !isReconnecting) {
      reconnect();
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <div
            className={cn(
              'flex items-center gap-2 cursor-pointer rounded-full px-2 py-1 transition-colors',
              getStatusBgColor(),
              className
            )}
            onMouseEnter={() => setShowReconnectButton(true)}
            onMouseLeave={() => setShowReconnectButton(false)}
            onClick={handleClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                handleClick();
              }
            }}
            aria-label={getStatusText()}
          >
            <Icon
              className={cn(
                'h-4 w-4 transition-colors',
                getStatusColor(),
                isReconnecting && 'animate-spin'
              )}
            />
            {showLabel && (
              <span className={cn('text-xs font-medium', getStatusColor())}>
                {getStatusText()}
              </span>
            )}
            {!isConnected && showReconnectButton && !showLabel && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  reconnect();
                }}
                className="h-5 px-2 text-xs"
              >
                Reconectar
              </Button>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>{getStatusText()}</p>
          {lastError && (
            <p className="text-xs text-muted-foreground">Erro: {lastError}</p>
          )}
          {!isConnected && !isReconnecting && (
            <p className="text-xs text-muted-foreground">Clique para reconectar</p>
          )}
          {isFallbackMode && (
            <p className="text-xs text-muted-foreground">WebSocket indisponivel, usando polling</p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
