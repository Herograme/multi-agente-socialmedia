import * as React from 'react';
import { cn } from '../../lib/utils';

export interface SliderProps {
  value?: number[];
  onValueChange?: (value: number[]) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  className?: string;
  id?: string;
}

const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  (
    { className, value = [0], onValueChange, min = 0, max = 100, step = 1, disabled, id },
    ref
  ) => {
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = parseFloat(event.target.value);
      onValueChange?.([newValue]);
    };

    const currentValue = value[0] ?? 0;
    const percentage = ((currentValue - min) / (max - min)) * 100;

    return (
      <div className={cn('relative flex w-full touch-none select-none items-center', className)}>
        <div className="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary">
          <div
            className="absolute h-full bg-primary"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <input
          type="range"
          ref={ref}
          min={min}
          max={max}
          step={step}
          value={currentValue}
          onChange={handleChange}
          disabled={disabled}
          className={cn(
            'absolute h-2 w-full cursor-pointer appearance-none bg-transparent',
            '[&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-primary [&::-webkit-slider-thumb]:bg-background [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:transition-colors [&::-webkit-slider-thumb]:focus-visible:outline-none [&::-webkit-slider-thumb]:focus-visible:ring-2 [&::-webkit-slider-thumb]:focus-visible:ring-ring [&::-webkit-slider-thumb]:focus-visible:ring-offset-2 [&::-webkit-slider-thumb]:disabled:pointer-events-none [&::-webkit-slider-thumb]:disabled:opacity-50',
            '[&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-primary [&::-moz-range-thumb]:bg-background',
            disabled && 'cursor-not-allowed opacity-50'
          )}
          id={id}
        />
      </div>
    );
  }
);
Slider.displayName = 'Slider';

export { Slider };
