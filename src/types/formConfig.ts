import * as yup from 'yup';

export type FieldType = 'text' | 'email' | 'tel' | 'select' | 'date' | 'textarea' | 'file' | 'number';

export interface FieldConfig {
  name: string;
  label: string;
  type: FieldType;
  required: boolean;
  validation?: yup.Schema;
  options?: Array<{ value: string; label: string }>;
  tooltip?: string;
  placeholder?: string;
  maxLength?: number;
  accept?: string; // For file uploads
  maxSize?: number; // For file uploads (in MB)
  minDate?: Date; // For date pickers
  maxDate?: Date; // For date pickers
  rows?: number; // For textareas
  conditional?: {
    field: string;
    value: any;
  };
}

export interface FormSection {
  id: string;
  title: string;
  description?: string;
  fields: FieldConfig[];
}

export type FormType = 'nfiu-individual' | 'nfiu-corporate' | 'kyc-individual' | 'kyc-corporate';

export interface FormConfig {
  formType: FormType;
  title: string;
  description: string;
  sections: FormSection[];
}

export interface FormData {
  [key: string]: any;
}
