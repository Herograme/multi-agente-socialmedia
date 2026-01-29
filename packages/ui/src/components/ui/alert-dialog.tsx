import * as React from 'react';
import { cn } from '../../lib/utils';
import { Button } from './button';

interface AlertDialogContextType {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AlertDialogContext = React.createContext<AlertDialogContextType | undefined>(undefined);

function useAlertDialogContext() {
  const context = React.useContext(AlertDialogContext);
  if (!context) {
    throw new Error('AlertDialog components must be used within an AlertDialog');
  }
  return context;
}

export interface AlertDialogProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
}

const AlertDialog: React.FC<AlertDialogProps> = ({
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  children,
}) => {
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;

  const handleOpenChange = React.useCallback(
    (newOpen: boolean) => {
      if (controlledOpen === undefined) {
        setInternalOpen(newOpen);
      }
      onOpenChange?.(newOpen);
    },
    [controlledOpen, onOpenChange]
  );

  return (
    <AlertDialogContext.Provider value={{ open, onOpenChange: handleOpenChange }}>
      {children}
    </AlertDialogContext.Provider>
  );
};
AlertDialog.displayName = 'AlertDialog';

export interface AlertDialogTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
}

const AlertDialogTrigger = React.forwardRef<HTMLButtonElement, AlertDialogTriggerProps>(
  ({ onClick, children, ...props }, ref) => {
    const { onOpenChange } = useAlertDialogContext();

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      onClick?.(event);
      onOpenChange(true);
    };

    return (
      <button ref={ref} type="button" onClick={handleClick} {...props}>
        {children}
      </button>
    );
  }
);
AlertDialogTrigger.displayName = 'AlertDialogTrigger';

export interface AlertDialogPortalProps {
  children?: React.ReactNode;
}

const AlertDialogPortal: React.FC<AlertDialogPortalProps> = ({ children }) => {
  return <>{children}</>;
};
AlertDialogPortal.displayName = 'AlertDialogPortal';

export interface AlertDialogOverlayProps extends React.HTMLAttributes<HTMLDivElement> {}

const AlertDialogOverlay = React.forwardRef<HTMLDivElement, AlertDialogOverlayProps>(
  ({ className, ...props }, ref) => {
    const { open } = useAlertDialogContext();

    if (!open) return null;

    return (
      <div
        ref={ref}
        className={cn(
          'fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
          className
        )}
        data-state={open ? 'open' : 'closed'}
        {...props}
      />
    );
  }
);
AlertDialogOverlay.displayName = 'AlertDialogOverlay';

export interface AlertDialogContentProps extends React.HTMLAttributes<HTMLDivElement> {}

const AlertDialogContent = React.forwardRef<HTMLDivElement, AlertDialogContentProps>(
  ({ className, children, ...props }, ref) => {
    const { open } = useAlertDialogContext();

    if (!open) return null;

    return (
      <>
        <AlertDialogOverlay />
        <div
          ref={ref}
          className={cn(
            'fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg',
            className
          )}
          data-state={open ? 'open' : 'closed'}
          {...props}
        >
          {children}
        </div>
      </>
    );
  }
);
AlertDialogContent.displayName = 'AlertDialogContent';

export interface AlertDialogHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

const AlertDialogHeader: React.FC<AlertDialogHeaderProps> = ({ className, ...props }) => (
  <div className={cn('flex flex-col space-y-2 text-center sm:text-left', className)} {...props} />
);
AlertDialogHeader.displayName = 'AlertDialogHeader';

export interface AlertDialogFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

const AlertDialogFooter: React.FC<AlertDialogFooterProps> = ({ className, ...props }) => (
  <div
    className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2', className)}
    {...props}
  />
);
AlertDialogFooter.displayName = 'AlertDialogFooter';

export interface AlertDialogTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}

const AlertDialogTitle = React.forwardRef<HTMLHeadingElement, AlertDialogTitleProps>(
  ({ className, ...props }, ref) => (
    <h2 ref={ref} className={cn('text-lg font-semibold', className)} {...props} />
  )
);
AlertDialogTitle.displayName = 'AlertDialogTitle';

export interface AlertDialogDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

const AlertDialogDescription = React.forwardRef<HTMLParagraphElement, AlertDialogDescriptionProps>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props} />
  )
);
AlertDialogDescription.displayName = 'AlertDialogDescription';

export interface AlertDialogActionProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

const AlertDialogAction = React.forwardRef<HTMLButtonElement, AlertDialogActionProps>(
  ({ className, onClick, ...props }, ref) => {
    const { onOpenChange } = useAlertDialogContext();

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      onClick?.(event);
      onOpenChange(false);
    };

    return <Button ref={ref} className={className} onClick={handleClick} {...props} />;
  }
);
AlertDialogAction.displayName = 'AlertDialogAction';

export interface AlertDialogCancelProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

const AlertDialogCancel = React.forwardRef<HTMLButtonElement, AlertDialogCancelProps>(
  ({ className, onClick, ...props }, ref) => {
    const { onOpenChange } = useAlertDialogContext();

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      onClick?.(event);
      onOpenChange(false);
    };

    return <Button ref={ref} variant="outline" className={cn('mt-2 sm:mt-0', className)} onClick={handleClick} {...props} />;
  }
);
AlertDialogCancel.displayName = 'AlertDialogCancel';

export {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
};
