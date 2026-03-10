import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';

export interface FormSelectProps {
  name: string;
  label: string;
  required?: boolean;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
  tooltip?: string;
  disabled?: boolean;
}

export const FormSelect: React.FC<FormSelectProps> = ({
  name,
  label,
  required = false,
  options,
  placeholder = 'Select an option',
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
      <Select
        value={value}
        onValueChange={(newValue) => setValue(name, newValue, { shouldValidate: true })}
        disabled={disabled}
      >
        <SelectTrigger
          id={name}
          aria-invalid={!!error}
          aria-describedby={error ? `${name}-error` : undefined}
          aria-required={required}
          className={error ? 'border-red-500 focus:ring-red-500' : ''}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
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
