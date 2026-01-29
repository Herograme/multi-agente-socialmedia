import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';

interface AccordionContextType {
  value: string[];
  onValueChange: (value: string[]) => void;
  type: 'single' | 'multiple';
}

const AccordionContext = React.createContext<AccordionContextType | undefined>(undefined);

function useAccordionContext() {
  const context = React.useContext(AccordionContext);
  if (!context) {
    throw new Error('Accordion components must be used within an Accordion');
  }
  return context;
}

interface AccordionItemContextType {
  value: string;
  isOpen: boolean;
}

const AccordionItemContext = React.createContext<AccordionItemContextType | undefined>(undefined);

function useAccordionItemContext() {
  const context = React.useContext(AccordionItemContext);
  if (!context) {
    throw new Error('AccordionItem components must be used within an AccordionItem');
  }
  return context;
}

export interface AccordionProps {
  type: 'single' | 'multiple';
  value?: string | string[];
  defaultValue?: string | string[];
  onValueChange?: (value: string[]) => void;
  className?: string;
  children?: React.ReactNode;
}

const Accordion = React.forwardRef<HTMLDivElement, AccordionProps>(
  ({ type, value, defaultValue, onValueChange, className, children, ...props }, ref) => {
    const [internalValue, setInternalValue] = React.useState<string[]>(() => {
      if (value !== undefined) {
        return Array.isArray(value) ? value : [value];
      }
      if (defaultValue !== undefined) {
        return Array.isArray(defaultValue) ? defaultValue : [defaultValue];
      }
      return [];
    });

    const controlledValue = value !== undefined ? (Array.isArray(value) ? value : [value]) : internalValue;

    const handleValueChange = React.useCallback(
      (newValue: string[]) => {
        if (value === undefined) {
          setInternalValue(newValue);
        }
        onValueChange?.(newValue);
      },
      [onValueChange, value]
    );

    return (
      <AccordionContext.Provider value={{ value: controlledValue, onValueChange: handleValueChange, type }}>
        <div ref={ref} className={cn('', className)} {...props}>
          {children}
        </div>
      </AccordionContext.Provider>
    );
  }
);
Accordion.displayName = 'Accordion';

export interface AccordionItemProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}

const AccordionItem = React.forwardRef<HTMLDivElement, AccordionItemProps>(
  ({ className, value, children, ...props }, ref) => {
    const { value: accordionValue } = useAccordionContext();
    const isOpen = accordionValue.includes(value);

    return (
      <AccordionItemContext.Provider value={{ value, isOpen }}>
        <div ref={ref} className={cn('', className)} data-state={isOpen ? 'open' : 'closed'} {...props}>
          {children}
        </div>
      </AccordionItemContext.Provider>
    );
  }
);
AccordionItem.displayName = 'AccordionItem';

export interface AccordionTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

const AccordionTrigger = React.forwardRef<HTMLButtonElement, AccordionTriggerProps>(
  ({ className, children, ...props }, ref) => {
    const { value: accordionValue, onValueChange, type } = useAccordionContext();
    const { value, isOpen } = useAccordionItemContext();

    const handleClick = () => {
      if (type === 'single') {
        onValueChange(isOpen ? [] : [value]);
      } else {
        onValueChange(isOpen ? accordionValue.filter((v) => v !== value) : [...accordionValue, value]);
      }
    };

    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          'flex flex-1 items-center justify-between py-4 font-medium transition-all [&[data-state=open]>svg]:rotate-180',
          className
        )}
        data-state={isOpen ? 'open' : 'closed'}
        onClick={handleClick}
        {...props}
      >
        {children}
        <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
      </button>
    );
  }
);
AccordionTrigger.displayName = 'AccordionTrigger';

export interface AccordionContentProps extends React.HTMLAttributes<HTMLDivElement> {}

const AccordionContent = React.forwardRef<HTMLDivElement, AccordionContentProps>(
  ({ className, children, ...props }, ref) => {
    const { isOpen } = useAccordionItemContext();
    const contentRef = React.useRef<HTMLDivElement>(null);

    if (!isOpen) {
      return null;
    }

    return (
      <div
        ref={ref}
        className={cn('overflow-hidden text-sm transition-all', className)}
        data-state={isOpen ? 'open' : 'closed'}
        {...props}
      >
        <div ref={contentRef} className="pb-4 pt-0">
          {children}
        </div>
      </div>
    );
  }
);
AccordionContent.displayName = 'AccordionContent';

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
