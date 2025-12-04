import React, { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { get } from 'lodash';
import { format } from 'date-fns';

interface DatePickerProps {
  name: string;
  label: string;
  required?: boolean;
}

/**
 * Enhanced DatePicker component that allows both typing and calendar selection
 * 
 * Features:
 * - Type dates directly in DD/MM/YYYY format
 * - Click calendar button to open picker with month/year dropdowns
 * - Full calendar view for date selection
 * - Auto-validates and formats dates
 * 
 * Usage:
 * <DatePicker name="dateOfBirth" label="Date of Birth" required />
 */
export const DatePicker: React.FC<DatePickerProps> = ({ name, label, required = false }) => {
  const { setValue, watch, formState: { errors }, clearErrors } = useFormContext();
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const value = watch(name);
  const error = get(errors, name);
  
  // Format date for display (DD/MM/YYYY)
  const formatDisplayDate = (date: any) => {
    if (!date) return '';
    try {
      const d = typeof date === 'string' ? new Date(date) : date;
      if (isNaN(d.getTime())) return '';
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return '';
    }
  };

  // Parse typed date (DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY)
  const parseTypedDate = (input: string) => {
    // Remove any non-digit characters
    const cleaned = input.replace(/[^\d]/g, '');
    
    // Try to parse if we have 8 digits
    if (cleaned.length === 8) {
      const day = parseInt(cleaned.substring(0, 2));
      const month = parseInt(cleaned.substring(2, 4)) - 1;
      const year = parseInt(cleaned.substring(4, 8));
      const date = new Date(year, month, day);
      
      // Validate the date
      if (!isNaN(date.getTime()) && 
          date.getDate() === day && 
          date.getMonth() === month &&
          date.getFullYear() === year) {
        return date;
      }
    }
    return null;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    setInputValue(input);
    
    // Try to parse the date
    const parsed = parseTypedDate(input);
    if (parsed) {
      setValue(name, parsed);
      if (error) clearErrors(name);
    }
  };

  const handleInputBlur = () => {
    // Format the input on blur if we have a valid date
    if (value) {
      setInputValue(formatDisplayDate(value));
    }
  };

  const handleCalendarSelect = (date: Date | undefined) => {
    if (date) {
      setValue(name, date);
      setInputValue(formatDisplayDate(date));
      if (error) clearErrors(name);
      setIsOpen(false);
    }
  };

  // Sync input value with form value
  React.useEffect(() => {
    if (value && !inputValue) {
      setInputValue(formatDisplayDate(value));
    }
  }, [value]);

  const displayValue = inputValue || formatDisplayDate(value);

  return (
    <div className="space-y-2">
      <Label htmlFor={name}>
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <div className="flex gap-2">
        <Input
          id={name}
          type="text"
          placeholder="DD/MM/YYYY"
          value={displayValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          className={cn("flex-1", error && "border-destructive")}
          maxLength={10}
        />
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className={cn(error && "border-destructive")}
            >
              <CalendarIcon className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={value ? (typeof value === 'string' ? new Date(value) : value) : undefined}
              onSelect={handleCalendarSelect}
              initialFocus
              defaultMonth={value ? (typeof value === 'string' ? new Date(value) : value) : undefined}
            />
          </PopoverContent>
        </Popover>
      </div>
      {error && (
        <p className="text-sm text-destructive">{error.message?.toString()}</p>
      )}
    </div>
  );
};

export default DatePicker;
