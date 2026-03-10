import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';

export interface FormFieldProps {
  name: string;
  label: string;
  required?: boolean;
  type?: 'text' | 'email' | 'tel' | 'number';
  maxLength?: number;
  placeholder?: string;
  tooltip?: string;
  disabled?: boolean;
}

export const FormField: React.FC<FormFieldProps> = ({
  name,
  label,
  required = false,
  type = 'text',
  maxLength,
  placeholder,
  tooltip,
  disabled = false,
}) => {
  const {
    register,
    formState: { errors },
  } = useFormContext();

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
      <Input
        id={name}
        type={type}
        placeholder={placeholder}
        disabled={disabled}
        maxLength={maxLength}
        aria-invalid={!!error}
        aria-describedby={error ? `${name}-error` : undefined}
        aria-required={required}
        className={error ? 'border-red-500 focus-visible:ring-red-500' : ''}
        {...register(name)}
      />
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
