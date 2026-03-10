import React from 'react';
import { useFormContext } from 'react-hook-form';
import { FormConfig, FieldConfig } from '@/types/formConfig';
import { FormField } from './FormField';
import { FormSelect } from './FormSelect';
import { FormDatePicker } from './FormDatePicker';
import { FormTextarea } from './FormTextarea';
import { FormFileUpload } from './FormFileUpload';

export interface FormRendererProps {
  config: FormConfig;
  onFileSelect?: (fieldName: string, file: File) => void;
  onFileRemove?: (fieldName: string) => void;
  uploadedFiles?: Record<string, File>;
}

export const FormRenderer: React.FC<FormRendererProps> = ({
  config,
  onFileSelect,
  onFileRemove,
  uploadedFiles = {},
}) => {
  const { watch } = useFormContext();

  const renderField = (field: FieldConfig) => {
    // Check conditional rendering
    if (field.conditional) {
      const conditionalValue = watch(field.conditional.field);
      if (conditionalValue !== field.conditional.value) {
        return null;
      }
    }

    const commonProps = {
      key: field.name,
      name: field.name,
      label: field.label,
      required: field.required,
      tooltip: field.tooltip,
    };

    switch (field.type) {
      case 'text':
      case 'email':
      case 'tel':
      case 'number':
        return (
          <FormField
            {...commonProps}
            type={field.type}
            maxLength={field.maxLength}
            placeholder={field.placeholder}
          />
        );

      case 'select':
        return (
          <FormSelect
            {...commonProps}
            options={field.options || []}
            placeholder={field.placeholder}
          />
        );

      case 'date':
        return (
          <FormDatePicker
            {...commonProps}
            minDate={field.minDate}
            maxDate={field.maxDate}
          />
        );

      case 'textarea':
        return (
          <FormTextarea
            {...commonProps}
            maxLength={field.maxLength}
            placeholder={field.placeholder}
            rows={field.rows}
          />
        );

      case 'file':
        return (
          <FormFileUpload
            {...commonProps}
            accept={field.accept || '.pdf,.jpg,.jpeg,.png'}
            maxSize={field.maxSize || 3}
            onFileSelect={(file) => onFileSelect?.(field.name, file)}
            onFileRemove={() => onFileRemove?.(field.name)}
            currentFile={uploadedFiles[field.name]}
          />
        );

      default:
        console.warn(`Unknown field type: ${field.type}`);
        return null;
    }
  };

  // Only show section titles if there are multiple sections or if explicitly rendering a full section
  // When rendering individual fields (single section with few fields), skip the section title
  const shouldShowSectionTitles = config.sections.length > 1 || 
    (config.sections.length === 1 && config.sections[0].fields.length > 3);

  return (
    <div className="space-y-8">
      {config.sections.map((section) => (
        <div key={section.id} className="space-y-4">
          {shouldShowSectionTitles && (
            <div>
              <h3 className="text-lg font-semibold">{section.title}</h3>
              {section.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {section.description}
                </p>
              )}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {section.fields.map((field) => renderField(field))}
          </div>
        </div>
      ))}
    </div>
  );
};
