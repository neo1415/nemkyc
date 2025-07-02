
import { parsePhoneNumber, isValidPhoneNumber, CountryCode } from 'libphonenumber-js';

export interface PhoneValidationResult {
  isValid: boolean;
  formatted?: string;
  country?: string;
  error?: string;
}

export const validateAndFormatPhone = (phoneNumber: string, defaultCountry: CountryCode = 'NG'): PhoneValidationResult => {
  if (!phoneNumber) {
    return { isValid: false, error: 'Phone number is required' };
  }
  
  try {
    // Check if it's already a valid international format
    if (isValidPhoneNumber(phoneNumber)) {
      const parsed = parsePhoneNumber(phoneNumber);
      return {
        isValid: true,
        formatted: parsed.formatInternational(),
        country: parsed.country
      };
    }
    
    // Try parsing with default country
    const parsed = parsePhoneNumber(phoneNumber, defaultCountry);
    if (parsed && parsed.isValid()) {
      return {
        isValid: true,
        formatted: parsed.formatInternational(),
        country: parsed.country
      };
    }
    
    return { isValid: false, error: 'Invalid phone number format' };
  } catch (error) {
    return { isValid: false, error: 'Invalid phone number' };
  }
};

export const formatPhoneForDisplay = (phoneNumber: string): string => {
  const result = validateAndFormatPhone(phoneNumber);
  return result.formatted || phoneNumber;
};

export const extractCountryFromPhone = (phoneNumber: string): string | null => {
  try {
    const parsed = parsePhoneNumber(phoneNumber);
    return parsed?.country || null;
  } catch {
    return null;
  }
};
