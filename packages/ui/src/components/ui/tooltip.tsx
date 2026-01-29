import * as React from 'react';
import { cn } from '../../lib/utils';

interface TooltipContextType {
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLElement>;
}

const TooltipContext = React.createContext<TooltipContextType | undefined>(undefined);

function useTooltipContext() {
  const context = React.useContext(TooltipContext);
  if (!context) {
    throw new Error('Tooltip components must be used within a Tooltip');
  }
  return context;
}

export interface TooltipProviderProps {
  children?: React.ReactNode;
  delayDuration?: number;
}

const TooltipProvider: React.FC<TooltipProviderProps> = ({ children }) => {
  return <>{children}</>;
};
TooltipProvider.displayName = 'TooltipProvider';

export interface TooltipProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
}

const Tooltip: React.FC<TooltipProps> = ({
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  children,
}) => {
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen);
  const triggerRef = React.useRef<HTMLElement>(null);

  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;

  const setOpen = React.useCallback(
    (newOpen: boolean) => {
      if (controlledOpen === undefined) {
        setInternalOpen(newOpen);
      }
      onOpenChange?.(newOpen);
    },
    [controlledOpen, onOpenChange]
  );

  return (
    <TooltipContext.Provider value={{ open, setOpen, triggerRef }}>
      {children}
    </TooltipContext.Provider>
  );
};
Tooltip.displayName = 'Tooltip';

export interface TooltipTriggerProps extends React.HTMLAttributes<HTMLSpanElement> {
  asChild?: boolean;
}

const TooltipTrigger = React.forwardRef<HTMLSpanElement, TooltipTriggerProps>(
  ({ onMouseEnter, onMouseLeave, onFocus, onBlur, children, ...props }, ref) => {
    const { setOpen, triggerRef } = useTooltipContext();

    const combinedRef = React.useCallback(
      (node: HTMLSpanElement) => {
        if (typeof ref === 'function') {
          ref(node);
        } else if (ref) {
          ref.current = node;
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (triggerRef as any).current = node;
      },
      [ref, triggerRef]
    );

    return (
      <span
        ref={combinedRef}
        onMouseEnter={(e) => {
          setOpen(true);
          onMouseEnter?.(e);
        }}
        onMouseLeave={(e) => {
          setOpen(false);
          onMouseLeave?.(e);
        }}
        onFocus={(e) => {
          setOpen(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setOpen(false);
          onBlur?.(e);
        }}
        {...props}
      >
        {children}
      </span>
    );
  }
);
TooltipTrigger.displayName = 'TooltipTrigger';

export interface TooltipContentProps extends React.HTMLAttributes<HTMLDivElement> {
  side?: 'top' | 'right' | 'bottom' | 'left';
  sideOffset?: number;
}

const TooltipContent = React.forwardRef<HTMLDivElement, TooltipContentProps>(
  ({ className, side = 'top', sideOffset: _sideOffset = 4, children, ...props }, ref) => {
    const { open } = useTooltipContext();

    if (!open) return null;

    return (
      <div
        ref={ref}
        className={cn(
          'z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
          side === 'bottom' && 'slide-in-from-top-2',
          side === 'left' && 'slide-in-from-right-2',
          side === 'right' && 'slide-in-from-left-2',
          side === 'top' && 'slide-in-from-bottom-2',
          className
        )}
        data-state={open ? 'open' : 'closed'}
        {...props}
      >
        {children}
      </div>
    );
  }
);
TooltipContent.displayName = 'TooltipContent';

export { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent };
