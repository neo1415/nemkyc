import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';

export interface FormTextareaProps {
  name: string;
  label: string;
  required?: boolean;
  maxLength?: number;
  placeholder?: string;
  tooltip?: string;
  disabled?: boolean;
  rows?: number;
}

export const FormTextarea: React.FC<FormTextareaProps> = ({
  name,
  label,
  required = false,
  maxLength,
  placeholder,
  tooltip,
  disabled = false,
  rows = 4,
}) => {
  const {
    register,
    watch,
    formState: { errors },
  } = useFormContext();

  const value = watch(name) || '';
  const error = errors[name];
  const errorMessage = error?.message as string | undefined;
  const currentLength = value.length;

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
      <Textarea
        id={name}
        placeholder={placeholder}
        disabled={disabled}
        maxLength={maxLength}
        rows={rows}
        aria-invalid={!!error}
        aria-describedby={error ? `${name}-error` : undefined}
        aria-required={required}
        className={error ? 'border-red-500 focus-visible:ring-red-500' : ''}
        {...register(name)}
      />
      <div className="flex justify-between items-center">
        {errorMessage && (
          <p
            id={`${name}-error`}
            className="text-sm text-red-500"
            role="alert"
          >
            {errorMessage}
          </p>
        )}
        {maxLength && (
          <p className="text-xs text-muted-foreground ml-auto">
            {currentLength} / {maxLength}
          </p>
        )}
      </div>
    </div>
  );
};
