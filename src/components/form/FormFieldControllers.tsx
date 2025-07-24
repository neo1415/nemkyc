import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface FormFieldProps {
  name: string;
  label: string;
  required?: boolean;
  placeholder?: string;
  type?: string;
  className?: string;
}

interface FormSelectProps extends FormFieldProps {
  options: { value: string; label: string }[];
}

interface FormTextareaProps extends FormFieldProps {
  rows?: number;
}

export const FormField: React.FC<FormFieldProps> = ({ 
  name, 
  label, 
  required = false, 
  placeholder, 
  type = "text",
  className = ""
}) => {
  const { register, formState: { errors, touchedFields } } = useFormContext();
  const error = errors[name];
  const isTouched = touchedFields[name];

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={name}>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <Input
        id={name}
        type={type}
        placeholder={placeholder}
        {...register(name)}
        className={error ? "border-red-500" : ""}
      />
      {error && isTouched && (
        <p className="text-sm text-red-500">{error.message as string}</p>
      )}
    </div>
  );
};

export const PhoneField: React.FC<FormFieldProps> = ({ 
  name, 
  label, 
  required = false, 
  placeholder = "Enter phone number",
  className = ""
}) => {
  const { register, formState: { errors, touchedFields }, setValue, watch } = useFormContext();
  const error = errors[name];
  const isTouched = touchedFields[name];
  const value = watch(name);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    // Only allow numbers, +, -, (, ), and spaces
    const filtered = input.replace(/[^0-9+\-() ]/g, '');
    // Limit to 15 characters
    const limited = filtered.slice(0, 15);
    setValue(name, limited);
  };

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={name}>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <Input
        id={name}
        type="tel"
        placeholder={placeholder}
        value={value || ''}
        onChange={handlePhoneChange}
        className={error ? "border-red-500" : ""}
        maxLength={15}
      />
      {error && isTouched && (
        <p className="text-sm text-red-500">{error.message as string}</p>
      )}
    </div>
  );
};

export const NumericField: React.FC<FormFieldProps & { maxLength?: number }> = ({ 
  name, 
  label, 
  required = false, 
  placeholder,
  className = "",
  maxLength
}) => {
  const { register, formState: { errors, touchedFields }, setValue, watch } = useFormContext();
  const error = errors[name];
  const isTouched = touchedFields[name];
  const value = watch(name);

  const handleNumericChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    // Only allow numbers
    const filtered = input.replace(/[^0-9]/g, '');
    // Apply max length if specified
    const limited = maxLength ? filtered.slice(0, maxLength) : filtered;
    setValue(name, limited);
  };

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={name}>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <Input
        id={name}
        type="text"
        placeholder={placeholder}
        value={value || ''}
        onChange={handleNumericChange}
        className={error ? "border-red-500" : ""}
        maxLength={maxLength}
      />
      {error && isTouched && (
        <p className="text-sm text-red-500">{error.message as string}</p>
      )}
    </div>
  );
};

export const FormTextarea: React.FC<FormTextareaProps> = ({ 
  name, 
  label, 
  required = false, 
  placeholder,
  rows = 3,
  className = ""
}) => {
  const { register, formState: { errors, touchedFields }, setValue, watch } = useFormContext();
  const error = errors[name];
  const isTouched = touchedFields[name];
  const value = watch(name);

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const input = e.target.value;
    // Limit to 2500 characters for textareas
    const limited = input.slice(0, 2500);
    setValue(name, limited);
  };

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={name}>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <Textarea
        id={name}
        placeholder={placeholder}
        rows={rows}
        value={value || ''}
        onChange={handleTextareaChange}
        className={error ? "border-red-500" : ""}
        maxLength={2500}
      />
      <div className="text-xs text-gray-500">
        {(value || '').length}/2500 characters
      </div>
      {error && isTouched && (
        <p className="text-sm text-red-500">{error.message as string}</p>
      )}
    </div>
  );
};

export const FormSelect: React.FC<FormSelectProps> = ({ 
  name, 
  label, 
  required = false, 
  placeholder = "Select an option",
  options,
  className = ""
}) => {
  const { formState: { errors, touchedFields }, setValue, watch } = useFormContext();
  const error = errors[name];
  const isTouched = touchedFields[name];
  const value = watch(name);

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={name}>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <Select value={value || ""} onValueChange={(value) => setValue(name, value)}>
        <SelectTrigger className={error ? "border-red-500" : ""}>
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
      {error && isTouched && (
        <p className="text-sm text-red-500">{error.message as string}</p>
      )}
    </div>
  );
};

export const DateField: React.FC<FormFieldProps & { 
  disableFuture?: boolean;
  disablePast?: boolean;
  minAge?: number;
}> = ({ 
  name, 
  label, 
  required = false, 
  className = "",
  disableFuture = false,
  disablePast = false,
  minAge
}) => {
  const { formState: { errors, touchedFields }, setValue, watch } = useFormContext();
  const error = errors[name];
  const isTouched = touchedFields[name];
  const value = watch(name);

  const handleDateSelect = (date: Date | undefined) => {
    setValue(name, date);
  };

  const handleDateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    if (inputValue) {
      const date = new Date(inputValue);
      if (!isNaN(date.getTime())) {
        setValue(name, date);
      }
    } else {
      setValue(name, undefined);
    }
  };

  const isDateDisabled = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (disableFuture && date > today) return true;
    if (disablePast && date < today) return true;
    if (minAge) {
      const minDate = new Date();
      minDate.setFullYear(minDate.getFullYear() - minAge);
      if (date > minDate) return true;
    }
    
    return false;
  };

  const formatDateForInput = (date: Date | undefined): string => {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={name}>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <div className="flex gap-2">
        <Input
          id={name}
          type="date"
          value={formatDateForInput(value)}
          onChange={handleDateInputChange}
          className={cn("flex-1", error ? "border-red-500" : "")}
        />
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "justify-start text-left font-normal w-10 p-2",
                !value && "text-muted-foreground",
                error && "border-red-500"
              )}
            >
              <CalendarIcon className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={value ? new Date(value) : undefined}
              onSelect={handleDateSelect}
              disabled={isDateDisabled}
              initialFocus
              className="pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      </div>
      {error && isTouched && (
        <p className="text-sm text-red-500">{error.message as string}</p>
      )}
    </div>
  );
};