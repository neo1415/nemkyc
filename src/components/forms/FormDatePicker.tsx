import React from 'react';
import { useFormContext } from 'react-hook-form';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Info } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export interface FormDatePickerProps {
  name: string;
  label: string;
  required?: boolean;
  minDate?: Date;
  maxDate?: Date;
  tooltip?: string;
  disabled?: boolean;
}

export const FormDatePicker: React.FC<FormDatePickerProps> = ({
  name,
  label,
  required = false,
  minDate,
  maxDate,
  tooltip,
  disabled = false,
}) => {
  const {
    setValue,
    watch,
    formState: { errors },
  } = useFormContext();

  const value = watch(name);
  const error = errors[name];
  const errorMessage = error?.message as string | undefined;

  const selectedDate = value ? new Date(value) : undefined;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Label htmlFor={name} className="text-sm font-medium">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
        {tooltip && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">{tooltip}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id={name}
            variant="outline"
            disabled={disabled}
            aria-invalid={!!error}
            aria-describedby={error ? `${name}-error` : undefined}
            aria-required={required}
            className={cn(
              'w-full justify-start text-left font-normal',
              !selectedDate && 'text-muted-foreground',
              error && 'border-red-500 focus:ring-red-500'
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {selectedDate ? format(selectedDate, 'PPP') : <span>Pick a date</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => setValue(name, date, { shouldValidate: true })}
            disabled={(date) => {
              if (minDate && date < minDate) return true;
              if (maxDate && date > maxDate) return true;
              return false;
            }}
            initialFocus
          />
        </PopoverContent>
      </Popover>
      {errorMessage && (
        <p
          id={`${name}-error`}
          className="text-sm text-red-500"
          role="alert"
        >
          {errorMessage}
        </p>
      )}
    </div>
  );
};
