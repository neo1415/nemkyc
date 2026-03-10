import * as yup from 'yup';
import { FormConfig, FieldConfig } from '@/types/formConfig';

/**
 * Generates a Yup validation schema from a FormConfig
 */
export const generateValidationSchema = (config: FormConfig): yup.ObjectSchema<any> => {
  const schemaFields: Record<string, yup.Schema> = {};

  config.sections.forEach((section) => {
    section.fields.forEach((field) => {
      schemaFields[field.name] = createFieldValidation(field);
    });
  });

  return yup.object().shape(schemaFields);
};

/**
 * Creates validation for a single field based on its configuration
 */
const createFieldValidation = (field: FieldConfig): yup.Schema => {
  // If custom validation is provided, use it
  if (field.validation) {
    return field.validation;
  }

  // Otherwise, create validation based on field type
  let schema: any;

  switch (field.type) {
    case 'email':
      schema = yup.string().email('Invalid email address');
      break;

    case 'tel':
      schema = yup.string().matches(
        /^[0-9+\-\s()]*$/,
        'Invalid phone number format'
      );
      break;

    case 'number':
      schema = yup.number().typeError('Must be a number');
      break;

    case 'date':
      schema = yup.date().typeError('Invalid date');
      if (field.minDate) {
        schema = schema.min(field.minDate, `Date must be after ${field.minDate.toLocaleDateString()}`);
      }
      if (field.maxDate) {
        schema = schema.max(field.maxDate, `Date must be before ${field.maxDate.toLocaleDateString()}`);
      }
      break;

    case 'file':
      schema = yup.mixed();
      break;

    case 'select':
      schema = yup.string().trim(); // Trim whitespace for select fields
      if (field.options && field.options.length > 0) {
        const validValues = field.options.map(opt => opt.value);
        // For optional select fields, allow empty string in addition to valid values
        if (!field.required) {
          schema = schema.oneOf([...validValues, ''], 'Please select a valid option');
        } else {
          schema = schema.oneOf(validValues, 'Please select a valid option');
        }
      }
      break;

    case 'text':
    case 'textarea':
    default:
      schema = yup.string();
      if (field.maxLength) {
        schema = schema.max(field.maxLength, `Maximum ${field.maxLength} characters allowed`);
      }
      break;
  }

  // Add required validation
  if (field.required) {
    if (field.type === 'file') {
      schema = schema.required(`${field.label} is required`);
    } else {
      schema = schema.required(`${field.label} is required`);
    }
  } else {
    schema = schema.nullable().optional();
  }

  return schema;
};

/**
 * Gets default values for a form based on its configuration
 */
export const getDefaultValues = (config: FormConfig): Record<string, any> => {
  const defaults: Record<string, any> = {};

  config.sections.forEach((section) => {
    section.fields.forEach((field) => {
      switch (field.type) {
        case 'select':
          defaults[field.name] = '';
          break;
        case 'date':
          defaults[field.name] = null;
          break;
        case 'file':
          defaults[field.name] = null;
          break;
        case 'number':
          defaults[field.name] = '';
          break;
        default:
          defaults[field.name] = '';
      }
    });
  });

  return defaults;
};
