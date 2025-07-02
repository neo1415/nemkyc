
import React, { useState, useEffect } from 'react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { validateAndFormatPhone } from '../../utils/phoneController';

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  required?: boolean;
  error?: string;
  placeholder?: string;
}

const PhoneInput: React.FC<PhoneInputProps> = ({
  value,
  onChange,
  label,
  required = false,
  error,
  placeholder = "Enter phone number"
}) => {
  const [inputValue, setInputValue] = useState(value);
  const [isValid, setIsValid] = useState(true);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    
    if (newValue) {
      const validation = validateAndFormatPhone(newValue);
      setIsValid(validation.isValid);
      if (validation.isValid && validation.formatted) {
        onChange(validation.formatted);
      } else {
        onChange(newValue);
      }
    } else {
      setIsValid(true);
      onChange('');
    }
  };

  return (
    <div className="space-y-2">
      {label && (
        <Label>
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
      )}
      <Input
        type="tel"
        value={inputValue}
        onChange={handleChange}
        placeholder={placeholder}
        className={!isValid || error ? 'border-red-500' : ''}
      />
      {!isValid && (
        <p className="text-sm text-red-600">Please enter a valid phone number</p>
      )}
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

export default PhoneInput;
