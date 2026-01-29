import * as React from 'react';
import { Check } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, checked = false, onCheckedChange, disabled, id, ...props }, ref) => {
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      onCheckedChange?.(event.target.checked);
    };

    return (
      <div className="relative inline-flex items-center">
        <input
          type="checkbox"
          id={id}
          ref={ref}
          checked={checked}
          onChange={handleChange}
          disabled={disabled}
          className="sr-only peer"
          {...props}
        />
        <label
          htmlFor={id}
          className={cn(
            'peer h-4 w-4 shrink-0 cursor-pointer rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
            checked ? 'bg-primary text-primary-foreground' : 'bg-background',
            disabled && 'cursor-not-allowed opacity-50',
            className
          )}
        >
          {checked && <Check className="h-3 w-3 mx-auto text-primary-foreground" />}
        </label>
      </div>
    );
  }
);
Checkbox.displayName = 'Checkbox';

export { Checkbox };
