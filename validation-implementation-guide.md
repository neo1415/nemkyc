# Form Validation Implementation Guide
*Step-by-step guide to implement Individual KYC-style validation on any form*

## 🎯 Pre-Implementation Checklist

### Required Dependencies
- [ ] `react-hook-form` installed
- [ ] `yup` validation library installed  
- [ ] `@hookform/resolvers` installed
- [ ] Toast system available (`useToast` hook)

### Files You'll Need to Modify
- [ ] Target form file (e.g., `CorporateKYC.tsx`)
- [ ] `src/index.css` (for red asterisk styling)
- [ ] `src/components/common/MultiStepForm.tsx` (if not already updated)

---

## 📝 Step 1: Add Red Asterisk CSS (if not exists)

**File**: `src/index.css`

```css
.required-asterisk {
  color: hsl(var(--destructive));
  margin-left: 2px;
}
```

---

## 📝 Step 2: Create Form Component Structure

### A. Import Required Dependencies

**Copy this exact import block:**
```typescript
import React, { useMemo } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useToast } from '@/hooks/use-toast';
import { useAuthRequiredSubmit } from '@/hooks/useAuthRequiredSubmit';
import MultiStepForm from '@/components/common/MultiStepForm';
// ... other imports
```

### B. Move Validation Schema Outside Component

**Template Pattern:**
```typescript
// OUTSIDE the component - prevents re-renders
const [FORM_NAME]Schema = yup.object().shape({
  // Step 1 fields
  fieldName: yup.string()
    .required('This field is required')
    .min(2, 'Must be at least 2 characters')
    .max(100, 'Must be less than 100 characters'),
  
  // Email pattern
  email: yup.string()
    .required('Email is required')
    .email('Please enter a valid email')
    .typeError('Please enter a valid email'),
  
  // Phone pattern
  phone: yup.string()
    .required('Phone number is required')
    .matches(/^[\\d\\s+\\-()]+$/, 'Invalid phone number format')
    .max(15, 'Phone number too long'),
  
  // Date of birth pattern (18+ years)
  dateOfBirth: yup.date()
    .required('Date of birth is required')
    .test('age', 'You must be at least 18 years old', function(value) {
      if (!value) return false;
      const today = new Date();
      const eighteenYearsAgo = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
      return value <= eighteenYearsAgo;
    })
    .typeError('Please select a valid date'),
  
  // Optional date pattern (for fields like foreign account date)
  optionalDate: yup.date()
    .transform((value, originalValue) => {
      return originalValue === '' ? undefined : value;
    })
    .typeError('Please select a valid date')
    .nullable()
    .notRequired(),
  
  // File upload pattern
  identificationFile: yup.mixed()
    .required('This document is required')
    .test('fileType', 'Please upload a PNG, JPG, JPEG, or PDF file', (value) => {
      if (!value || !value[0]) return false;
      const allowedTypes = ['image/png', 'image/jpg', 'image/jpeg', 'application/pdf'];
      return allowedTypes.includes(value[0].type);
    })
    .test('fileSize', 'File size must be less than 3MB', (value) => {
      if (!value || !value[0]) return false;
      return value[0].size <= 3 * 1024 * 1024;
    }),
  
  // Checkbox pattern
  agreement: yup.boolean()
    .required('You must agree to continue')
    .oneOf([true], 'You must agree to continue'),
  
  // Conditional "Other" field pattern
  occupation: yup.string().required('Occupation is required'),
  occupationOther: yup.string().when('occupation', {
    is: 'Other',
    then: (schema) => schema.required('Please specify your occupation'),
    otherwise: (schema) => schema.notRequired()
  })
});
```

---

## 📝 Step 3: Create Reusable Form Field Components

**Copy these exact component patterns into your form:**

```typescript
// Text Input Component
const FormField = ({ name, label, required = false, type = "text", ...props }) => {
  const { register, formState: { errors } } = useFormContext();
  
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="required-asterisk">*</span>}
      </label>
      <input
        type={type}
        {...register(name)}
        className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 ${
          errors[name] ? 'border-red-500' : 'border-gray-300'
        }`}
        {...props}
      />
      {errors[name] && (
        <p className="text-sm text-red-600">{errors[name]?.message}</p>
      )}
    </div>
  );
};

// Textarea Component
const FormTextarea = ({ name, label, required = false, maxLength = 2500, ...props }) => {
  const { register, watch, formState: { errors } } = useFormContext();
  const currentValue = watch(name) || '';
  
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="required-asterisk">*</span>}
      </label>
      <textarea
        {...register(name)}
        className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 ${
          errors[name] ? 'border-red-500' : 'border-gray-300'
        }`}
        {...props}
      />
      <div className="flex justify-between">
        {errors[name] && (
          <p className="text-sm text-red-600">{errors[name]?.message}</p>
        )}
        <span className="text-sm text-gray-500 ml-auto">
          {currentValue.length}/{maxLength}
        </span>
      </div>
    </div>
  );
};

// Select Component
const FormSelect = ({ name, label, required = false, options, ...props }) => {
  const { register, formState: { errors } } = useFormContext();
  
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="required-asterisk">*</span>}
      </label>
      <select
        {...register(name)}
        className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 ${
          errors[name] ? 'border-red-500' : 'border-gray-300'
        }`}
        {...props}
      >
        <option value="">Select {label}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {errors[name] && (
        <p className="text-sm text-red-600">{errors[name]?.message}</p>
      )}
    </div>
  );
};

// Date Picker Component
const FormDatePicker = ({ name, label, required = false, ...props }) => {
  const { register, formState: { errors } } = useFormContext();
  
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="required-asterisk">*</span>}
      </label>
      <input
        type="date"
        {...register(name)}
        className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 ${
          errors[name] ? 'border-red-500' : 'border-gray-300'
        }`}
        {...props}
      />
      {errors[name] && (
        <p className="text-sm text-red-600">{errors[name]?.message}</p>
      )}
    </div>
  );
};
```

---

## 📝 Step 4: Setup Form Hook and Default Values

```typescript
const [FormName] = () => {
  const { toast } = useToast();
  
  // Default values - include ALL form fields with appropriate defaults
  const defaultValues = useMemo(() => ({
    // Text fields
    firstName: '',
    lastName: '',
    email: '',
    
    // Optional fields that might be undefined
    foreignAccountOpeningDate: undefined,
    
    // File fields
    identificationFile: null,
    
    // Checkboxes
    privacyAgreement: false,
    
    // Add all your fields here with appropriate defaults
  }), []);

  const formMethods = useForm({
    resolver: yupResolver([FORM_NAME]Schema),
    defaultValues,
    mode: 'onChange', // Real-time validation
  });
};
```

---

## 📝 Step 5: Create Step Field Mappings

**Critical: Map each step to its exact field names**

```typescript
// Define which fields belong to each step (use exact field names from your form)
const stepFieldMappings = {
  0: ['field1', 'field2', 'field3'], // Step 1 fields
  1: ['field4', 'field5'],           // Step 2 fields
  2: ['field6', 'field7', 'field8'], // Step 3 fields
  3: ['identificationFile'],         // File upload step
  4: ['privacyAgreement', 'terms']   // Final step
};

// Validation functions for MultiStepForm
const validateCurrentStep = async (stepIndex, formMethods) => {
  const fieldsToValidate = stepFieldMappings[stepIndex] || [];
  if (fieldsToValidate.length === 0) return true;
  
  const result = await formMethods.trigger(fieldsToValidate);
  
  if (!result) {
    const errors = formMethods.formState.errors;
    console.log(`Validation failed for step "${stepIndex}". Errors:`, JSON.stringify(errors, null, 2));
  }
  
  return result;
};

const getStepFields = (stepIndex) => {
  return stepFieldMappings[stepIndex] || [];
};
```

---

## 📝 Step 6: Data Sanitization Function

```typescript
// Remove undefined values before Firebase submission
const sanitizeData = (data) => {
  const sanitized = {};
  Object.keys(data).forEach(key => {
    if (data[key] !== undefined) {
      sanitized[key] = data[key];
    }
  });
  return sanitized;
};
```

---

## 📝 Step 7: Submit Handler

```typescript
const { handleSubmitWithAuth } = useAuthRequiredSubmit();

const handleSubmit = async (data) => {
  try {
    console.log('Form data before sanitization:', data);
    
    // Sanitize data to remove undefined values
    const sanitizedData = sanitizeData(data);
    console.log('Sanitized data:', sanitizedData);
    
    await handleSubmitWithAuth(async () => {
      // Your Firebase submission logic here
      await submitFormWithNotifications(
        sanitizedData,
        'your-collection-name',
        'Form submitted successfully!',
        'Error submitting form:'
      );
    });
  } catch (error) {
    console.error('Error submitting form:', error);
    toast({
      title: "Error",
      description: "Failed to submit form. Please try again.",
      variant: "destructive",
    });
  }
};
```

---

## 📝 Step 8: Form JSX Structure

```typescript
return (
  <div className="min-h-screen bg-gray-50 py-8">
    <div className="max-w-4xl mx-auto px-4">
      <FormProvider {...formMethods}>
        <MultiStepForm
          steps={steps}
          onSubmit={handleSubmit}
          isSubmitting={false}
          submitButtonText="Submit Form"
          formMethods={formMethods}
          stepFieldMappings={stepFieldMappings}
          validateCurrentStep={validateCurrentStep}
          getStepFields={getStepFields}
        />
      </FormProvider>
    </div>
  </div>
);
```

---

## 📝 Step 9: Replace Form Fields

**Find and replace patterns:**

```typescript
// OLD: Basic input
<input 
  type="text" 
  name="firstName"
  className="..."
/>

// NEW: FormField component
<FormField 
  name="firstName"
  label="First Name"
  required={true}
/>

// OLD: Basic select
<select name="gender">
  <option value="">Select Gender</option>
  <option value="male">Male</option>
  <option value="female">Female</option>
</select>

// NEW: FormSelect component
<FormSelect 
  name="gender"
  label="Gender"
  required={true}
  options={[
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' }
  ]}
/>
```

---

## 🔍 Step 10: Testing Checklist

**Test each step systematically:**

- [ ] **Red Asterisks**: All required fields show red asterisk
- [ ] **Field Validation**: Error messages appear below each field
- [ ] **Step Progression**: Cannot proceed with invalid fields in current step
- [ ] **Toast Notifications**: Red toast appears when validation fails
- [ ] **File Upload**: Only accepts PNG/JPG/JPEG/PDF, max 3MB
- [ ] **Date Fields**: Manual input and validation works
- [ ] **Optional Fields**: Don't block progression when empty
- [ ] **Conditional Fields**: "Other" specifications work correctly
- [ ] **Final Submission**: Data sanitization prevents Firebase errors

---

## 🚨 Common Gotchas to Avoid

1. **Field Name Mismatches**: Ensure schema field names exactly match form field names
2. **Step Mapping Errors**: Double-check stepFieldMappings contains correct field names
3. **Default Values**: Include ALL fields in defaultValues, even optional ones
4. **Schema Outside Component**: Move validation schema outside to prevent re-renders
5. **Optional Date Handling**: Use transform function for optional date fields
6. **File Validation**: Don't forget file type and size restrictions
7. **Conditional Validation**: Handle "Other" option fields properly

---

## 📋 Final Implementation Checklist

- [ ] All form fields replaced with FormField components
- [ ] Validation schema created and moved outside component
- [ ] Step field mappings defined correctly
- [ ] Default values include all fields
- [ ] Data sanitization function implemented
- [ ] FormProvider wraps the form
- [ ] MultiStepForm receives all required props
- [ ] Toast notifications working
- [ ] File upload validation implemented
- [ ] Testing completed for all scenarios

---

## 📝 Step 8: Add Real-Time Error Clearing

**Problem**: Form errors remain visible even after user starts typing/fixing the field until they click "Next" again.

**Solution**: Add `clearErrors` to form field components for immediate error removal when user interacts with fields.

### 8.1 Update FormField Component

```typescript
const FormField = ({ name, label, required = false, type = "text", ...props }: any) => {
  const { register, formState: { errors }, clearErrors } = useFormContext();
  const error = errors[name];
  
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>
        {label}
        {required && <span className="required-asterisk">*</span>}
      </Label>
      <Input
        id={name}
        type={type}
        {...register(name, {
          onChange: () => {
            if (error) {
              clearErrors(name);
            }
          }
        })}
        className={cn(error && "border-destructive")}
        {...props}
      />
      {error && (
        <p className="text-sm text-destructive">{error.message?.toString()}</p>
      )}
    </div>
  );
};
```

### 8.2 Update FormTextarea Component

```typescript
const FormTextarea = ({ name, label, required = false, ...props }: any) => {
  const { register, formState: { errors }, clearErrors } = useFormContext();
  const error = errors[name];
  
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>
        {label}
        {required && <span className="required-asterisk">*</span>}
      </Label>
      <Textarea
        id={name}
        {...register(name, {
          onChange: () => {
            if (error) {
              clearErrors(name);
            }
          }
        })}
        className={cn(error && "border-destructive")}
        {...props}
      />
      {error && (
        <p className="text-sm text-destructive">{error.message?.toString()}</p>
      )}
    </div>
  );
};
```

### 8.3 Update FormSelect Component

```typescript
const FormSelect = ({ name, label, required = false, placeholder, children, ...props }: any) => {
  const { setValue, watch, formState: { errors }, clearErrors } = useFormContext();
  const value = watch(name);
  const error = errors[name];
  
  return (
    <div className="space-y-2">
      <Label>
        {label}
        {required && <span className="required-asterisk">*</span>}
      </Label>
      <Select
        value={value}
        onValueChange={(val) => {
          setValue(name, val);
          if (error) {
            clearErrors(name);
          }
        }}
        {...props}
      >
        <SelectTrigger className={cn(error && "border-destructive")}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {children}
        </SelectContent>
      </Select>
      {error && (
        <p className="text-sm text-destructive">{error.message?.toString()}</p>
      )}
    </div>
  );
};
```

### 8.4 Update FormDatePicker Component

```typescript
const FormDatePicker = ({ name, label, required = false }: any) => {
  const { setValue, watch, formState: { errors }, register, clearErrors } = useFormContext();
  const value = watch(name);
  const error = errors[name];
  
  return (
    <div className="space-y-2">
      <Label>
        {label}
        {required && <span className="required-asterisk">*</span>}
      </Label>
      <div className="flex gap-2">
        <Input
          type="date"
          {...register(name, {
            onChange: () => {
              if (error) {
                clearErrors(name);
              }
            }
          })}
          className={cn("flex-1", error && "border-destructive")}
        />
        <Popover>
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
          <PopoverContent className="w-auto p-0">
            <ReactCalendar
              mode="single"
              selected={value ? new Date(value) : undefined}
              onSelect={(date) => {
                setValue(name, date);
                if (error) {
                  clearErrors(name);
                }
              }}
              initialFocus
              className="pointer-events-auto"
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
```

### 8.5 Update Checkbox Fields

For checkbox fields like privacy agreement:

```typescript
<Checkbox
  id="agreeToDataPrivacy"
  checked={formMethods.watch('agreeToDataPrivacy')}
  onCheckedChange={(checked) => {
    formMethods.setValue('agreeToDataPrivacy', checked);
    if (formMethods.formState.errors.agreeToDataPrivacy) {
      formMethods.clearErrors('agreeToDataPrivacy');
    }
  }}
  className={cn(formMethods.formState.errors.agreeToDataPrivacy && "border-destructive")}
/>
```

### 8.6 Update Direct Register Fields

For fields using direct register (like digital signature):

```typescript
<Textarea
  id="signature"
  placeholder="Type your full name as digital signature"
  {...formMethods.register('signature', {
    onChange: () => {
      if (formMethods.formState.errors.signature) {
        formMethods.clearErrors('signature');
      }
    }
  })}
  className={cn(formMethods.formState.errors.signature && "border-destructive")}
/>
```

### Performance Considerations

✅ **Optimized**: Only calls `clearErrors` when there's actually an error present
✅ **Efficient**: Uses react-hook-form's built-in `clearErrors` function
✅ **Fast**: Avoids re-triggering full form validation, just removes specific errors
✅ **No Memory Issues**: No additional watchers or subscriptions that could cause performance problems

### Result

- Errors disappear immediately when users start fixing fields
- No performance degradation or memory leaks
- Instant visual feedback improves user experience
- Maintains all existing validation functionality

---

## 📝 Step 9: Replace Form Fields

**Find and replace patterns:**

```typescript
// OLD: Basic input
<input 
  type="text" 
  name="firstName"
  className="..."
/>

// NEW: FormField component
<FormField 
  name="firstName"
  label="First Name"
  required={true}
/>

// OLD: Basic select
<select name="gender">
  <option value="">Select Gender</option>
  <option value="male">Male</option>
  <option value="female">Female</option>
</select>

// NEW: FormSelect component
<FormSelect 
  name="gender"
  label="Gender"
  required={true}
  options={[
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' }
  ]}
/>
```

---

## 🔍 Step 10: Testing Checklist
