import { format } from 'date-fns';

export interface SummaryField {
  label: string;
  value: any;
  formatter?: (value: any) => string;
  condition?: (data: any) => boolean;
}

export interface SummarySection {
  title: string;
  fields: SummaryField[];
}

export interface GenerateSummaryOptions {
  formData: any;
  formType: string;
  schema?: any;
  customSections?: SummarySection[];
}

/**
 * Format a value based on its type
 */
const formatValue = (value: any): string => {
  if (value === null || value === undefined || value === '') {
    return 'Not provided';
  }

  // Handle dates
  if (value instanceof Date) {
    return format(value, 'dd/MM/yyyy');
  }

  // Handle date strings (ISO format)
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    try {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return format(date, 'dd/MM/yyyy');
      }
    } catch {
      // Not a valid date, continue
    }
  }

  // Handle booleans
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  // Handle arrays
  if (Array.isArray(value)) {
    if (value.length === 0) return 'None';
    return value.map(v => formatValue(v)).join(', ');
  }

  // Handle objects (like file uploads)
  if (typeof value === 'object') {
    if (value.name) return value.name; // File object
    if (value.fileName) return value.fileName; // Custom file object
    return JSON.stringify(value);
  }

  return String(value);
};

/**
 * Convert camelCase or snake_case to Title Case
 */
const toTitleCase = (str: string): string => {
  return str
    .replace(/([A-Z])/g, ' $1') // Add space before capital letters
    .replace(/_/g, ' ') // Replace underscores with spaces
    .replace(/^./, (s) => s.toUpperCase()) // Capitalize first letter
    .trim();
};

/**
 * Check if a value is empty (null, undefined, empty string, empty array)
 */
const isEmpty = (value: any): boolean => {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string' && value.trim() === '') return true;
  if (Array.isArray(value) && value.length === 0) return true;
  if (typeof value === 'object' && Object.keys(value).length === 0) return true;
  return false;
};

/**
 * Generate summary sections from form data
 * 
 * This utility automatically creates a structured summary from form data,
 * handling different data types, filtering empty values, and formatting
 * values appropriately.
 * 
 * Usage:
 * ```tsx
 * const sections = generateFormSummary({
 *   formData: { name: 'John', dob: '1990-01-01', hasInsurance: true },
 *   formType: 'Individual KYC'
 * });
 * ```
 */
export function generateFormSummary(
  options: GenerateSummaryOptions
): SummarySection[] {
  const { formData, customSections } = options;

  // Return empty array if no form data
  if (!formData || typeof formData !== 'object') {
    return [];
  }

  // If custom sections provided, use them
  if (customSections && customSections.length > 0) {
    return customSections.map(section => ({
      ...section,
      fields: section.fields
        .filter(field => {
          // Apply condition if provided
          if (field.condition && !field.condition(formData)) {
            return false;
          }
          // Filter out empty values
          const value = getNestedValue(formData, field.label);
          return !isEmpty(value);
        })
        .map(field => ({
          ...field,
          value: field.formatter
            ? field.formatter(getNestedValue(formData, field.label))
            : formatValue(getNestedValue(formData, field.label))
        }))
    })).filter(section => section.fields.length > 0);
  }

  // Auto-generate sections from form data
  const sections: SummarySection[] = [];
  const generalSection: SummarySection = {
    title: 'Form Details',
    fields: []
  };

  Object.entries(formData).forEach(([key, value]) => {
    // Skip empty values
    if (isEmpty(value)) return;

    // Skip internal fields
    if (key.startsWith('_') || key === 'idempotencyKey') return;

    // Handle nested objects
    if (typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
      const nestedSection: SummarySection = {
        title: toTitleCase(key),
        fields: []
      };

      Object.entries(value as Record<string, any>).forEach(([nestedKey, nestedValue]) => {
        if (!isEmpty(nestedValue)) {
          nestedSection.fields.push({
            label: toTitleCase(nestedKey),
            value: formatValue(nestedValue)
          });
        }
      });

      if (nestedSection.fields.length > 0) {
        sections.push(nestedSection);
      }
    } else {
      // Add to general section
      generalSection.fields.push({
        label: toTitleCase(key),
        value: formatValue(value)
      });
    }
  });

  // Add general section first if it has fields
  if (generalSection.fields.length > 0) {
    sections.unshift(generalSection);
  }

  return sections;
}

/**
 * Get nested value from object using dot notation or direct key
 */
const getNestedValue = (obj: any, path: string): any => {
  // Try direct key first
  if (obj.hasOwnProperty(path)) {
    return obj[path];
  }

  // Try dot notation
  return path.split('.').reduce((current, key) => current?.[key], obj);
};

/**
 * Create custom summary sections for specific form types
 */
export const createCustomSummary = (
  formType: string,
  formData: any
): SummarySection[] | null => {
  // This can be extended for specific form types
  // For now, return null to use auto-generation
  return null;
};
