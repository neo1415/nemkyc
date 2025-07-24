# COMPREHENSIVE Form Validation Implementation Guide
*Complete step-by-step guide to implement Individual KYC-style validation on any form*

## 🎯 CRITICAL MISTAKES TO AVOID (Based on Corporate KYC Issues)

### ❌ FOCUS LOSS PROBLEM
**NEVER define form components inside the main component** - causes re-creation on every render
```typescript
// ❌ WRONG - Components defined inside main component
const MyForm = () => {
  const FormField = ({ name, label }) => { ... } // BAD - recreated every render
  return <FormField name="test" />
}

// ✅ CORRECT - Components defined outside main component  
const FormField = ({ name, label }) => { ... } // GOOD - stable reference
const MyForm = () => {
  return <FormField name="test" />
}
```

### ❌ NESTED VALIDATION ERRORS
**ALWAYS use lodash.get for nested field errors** (directors, arrays, etc.)
```typescript
// ❌ WRONG - Direct error access fails for nested fields
const error = errors[name]; // Fails for directors.0.firstName

// ✅ CORRECT - Use lodash.get for all field errors
import { get } from 'lodash';
const error = get(errors, name); // Works for all field paths
```

### ❌ CHECKBOX ERROR CLEARING
**ALWAYS add clearErrors to checkbox onChange**
```typescript
// ❌ WRONG - Error stays after checking
<Checkbox
  checked={value}
  onCheckedChange={(checked) => setValue(name, checked)}
/>

// ✅ CORRECT - Error clears immediately when checked  
<Checkbox
  checked={value}
  onCheckedChange={(checked) => {
    setValue(name, checked);
    if (error) clearErrors(name);
  }}
/>
```

### ❌ FILE UPLOAD VALIDATION MISSING
**ALWAYS add file upload to validation schema AND form handling**
```typescript
// ❌ WRONG - Missing file validation in schema
companyNameVerificationDoc: yup.string().required("Document type required"),

// ✅ CORRECT - Include file validation
companyNameVerificationDoc: yup.string().required("Document type required"),
verificationDocument: yup.mixed().required("Document upload required"),
```

### ❌ DUPLICATE SUBMIT BUTTONS
**NEVER add extra submit buttons** - MultiStepForm handles submission
```typescript
// ❌ WRONG - Extra submit button in step
{someCondition && (
  <Button onClick={() => setShowSummary(true)}>
    Submit Form
  </Button>
)}

// ✅ CORRECT - Let MultiStepForm handle submission
// No extra buttons needed
```

---

## 📝 STEP 1: Setup Dependencies & Imports

### Required Dependencies
```bash
npm install react-hook-form yup @hookform/resolvers lodash
npm install --save-dev @types/lodash
```

### Essential Imports Template
```typescript
import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray, FormProvider, useFormContext } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { get } from 'lodash'; // CRITICAL for nested errors
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import MultiStepForm from '@/components/common/MultiStepForm';
import { useFormDraft } from '@/hooks/useFormDraft';
import FileUpload from '@/components/common/FileUpload';
import { uploadFile } from '@/services/fileService';
import { useAuthRequiredSubmit } from '@/hooks/useAuthRequiredSubmit';
import SuccessModal from '@/components/common/SuccessModal';
// UI components...
```

---

## 📝 STEP 2: CSS for Red Asterisks

**File**: `src/index.css`
```css
.required-asterisk {
  color: hsl(var(--destructive));
  margin-left: 2px;
}
```

---

## 📝 STEP 3: Form Components (OUTSIDE Main Component)

**CRITICAL: Define these OUTSIDE your main form component to prevent focus loss**

```typescript
// ========== BASIC FORM FIELD ==========
const FormField = ({ name, label, required = false, type = "text", maxLength, ...props }: any) => {
  const { register, formState: { errors }, clearErrors } = useFormContext();
  const error = get(errors, name); // CRITICAL: Use lodash.get
  
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>
        {label}
        {required && <span className="required-asterisk">*</span>}
      </Label>
      <Input
        id={name}
        type={type}
        maxLength={maxLength}
        {...register(name, {
          onChange: () => {
            if (error) {
              clearErrors(name);
            }
          }
        })}
        className={error ? 'border-destructive' : ''}
        {...props}
      />
      {error && (
        <p className="text-sm text-destructive">{error.message?.toString()}</p>
      )}
    </div>
  );
};

// ========== TEXTAREA FIELD ==========
const FormTextarea = ({ name, label, required = false, maxLength = 2500, ...props }: any) => {
  const { register, watch, formState: { errors }, clearErrors } = useFormContext();
  const currentValue = watch(name) || '';
  const error = get(errors, name); // CRITICAL: Use lodash.get
  
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
        className={error ? 'border-destructive' : ''}
        {...props}
      />
      <div className="flex justify-between">
        {error && (
          <p className="text-sm text-destructive">{error.message?.toString()}</p>
        )}
        <span className="text-sm text-muted-foreground ml-auto">
          {currentValue.length}/{maxLength}
        </span>
      </div>
    </div>
  );
};

// ========== SELECT FIELD ==========
const FormSelect = ({ name, label, required = false, options, placeholder, ...props }: any) => {
  const { setValue, watch, formState: { errors }, clearErrors } = useFormContext();
  const value = watch(name);
  const error = get(errors, name); // CRITICAL: Use lodash.get
  
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>
        {label}
        {required && <span className="required-asterisk">*</span>}
      </Label>
      <Select
        value={value}
        onValueChange={(newValue) => {
          setValue(name, newValue);
          if (error) {
            clearErrors(name);
          }
        }}
        {...props}
      >
        <SelectTrigger className={error ? 'border-destructive' : ''}>
          <SelectValue placeholder={placeholder || `Select ${label}`} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option: any) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && (
        <p className="text-sm text-destructive">{error.message?.toString()}</p>
      )}
    </div>
  );
};

// ========== DATE PICKER FIELD ==========
const FormDatePicker = ({ name, label, required = false }: any) => {
  const { setValue, watch, formState: { errors }, clearErrors } = useFormContext();
  const value = watch(name);
  const error = get(errors, name); // CRITICAL: Use lodash.get
  
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>
        {label}
        {required && <span className="required-asterisk">*</span>}
      </Label>
      <Input
        id={name}
        type="date"
        value={value ? (typeof value === 'string' ? value : value.toISOString().split('T')[0]) : ''}
        onChange={(e) => {
          const dateValue = e.target.value ? new Date(e.target.value) : undefined;
          setValue(name, dateValue);
          if (error) {
            clearErrors(name);
          }
        }}
        className={error ? 'border-destructive' : ''}
      />
      {error && (
        <p className="text-sm text-destructive">{error.message?.toString()}</p>
      )}
    </div>
  );
};
```

---

## 📝 STEP 4: Validation Schema Patterns

**CRITICAL: Define schema OUTSIDE component to prevent re-renders**

```typescript
// Common validation patterns
const formSchema = yup.object().shape({
  // ========== BASIC REQUIRED TEXT ==========
  firstName: yup.string().required("First name is required"),
  
  // ========== EMAIL VALIDATION ==========
  email: yup.string()
    .required("Email is required")
    .email("Please enter a valid email")
    .typeError("Please enter a valid email"),
  
  // ========== PHONE VALIDATION ==========
  phoneNumber: yup.string()
    .required("Phone number is required")
    .matches(/^[\d\s+\-()]+$/, "Invalid phone number format")
    .max(15, "Phone number cannot exceed 15 characters"),
  
  // ========== BVN VALIDATION ==========
  BVNNumber: yup.string()
    .required("BVN is required")
    .matches(/^\d+$/, "BVN must contain only numbers")
    .length(11, "BVN must be exactly 11 digits"),
  
  // ========== DATE VALIDATION (18+ years) ==========
  dateOfBirth: yup.date()
    .required("Date of birth is required")
    .test('age', 'Must be at least 18 years old', function(value) {
      if (!value) return false;
      const today = new Date();
      const eighteenYearsAgo = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
      return value <= eighteenYearsAgo;
    })
    .typeError('Please select a valid date'),
  
  // ========== DATE VALIDATION (Not Future) ==========
  issuedDate: yup.date()
    .required("Issued date is required")
    .test('not-future', 'Date cannot be in the future', function(value) {
      if (!value) return false;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return value <= today;
    })
    .typeError('Please select a valid date'),
  
  // ========== DATE VALIDATION (Not Past) ==========
  expiryDate: yup.date()
    .test('not-past', 'Expiry date cannot be in the past', function(value) {
      if (!value) return true; // Optional field
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      return value > today;
    })
    .typeError('Please select a valid date'),
  
  // ========== CONDITIONAL "OTHER" FIELD ==========
  sourceOfIncome: yup.string().required("Income source is required"),
  sourceOfIncomeOther: yup.string().when('sourceOfIncome', {
    is: 'Other',
    then: (schema) => schema.required('Please specify income source'),
    otherwise: (schema) => schema.notRequired()
  }),
  
  // ========== ARRAY VALIDATION (Directors) ==========
  directors: yup.array().of(yup.object().shape({
    firstName: yup.string().required("First name is required"),
    lastName: yup.string().required("Last name is required"),
    // ... other director fields
  })).min(1, "At least one director is required"),
  
  // ========== FILE UPLOAD VALIDATION ==========
  verificationDocument: yup.mixed().required("Document upload is required"),
  
  // ========== CHECKBOX VALIDATION ==========
  agreeToDataPrivacy: yup.boolean().oneOf([true], "You must agree to data privacy"),
});
```

---

## 📝 STEP 5: Form Setup & State Management

```typescript
const MyForm: React.FC = () => {
  const { toast } = useToast();
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File>>({});
  const [showSummary, setShowSummary] = useState(false);
  const [showPostAuthLoading, setShowPostAuthLoading] = useState(false);
  
  const { 
    handleSubmitWithAuth, 
    showSuccess: authShowSuccess, 
    setShowSuccess: setAuthShowSuccess,
    isSubmitting: authSubmitting
  } = useAuthRequiredSubmit();

  // CRITICAL: Include ALL fields with appropriate defaults
  const defaultValues = {
    // Text fields
    firstName: '',
    lastName: '',
    email: '',
    
    // Date fields (undefined for date inputs)
    dateOfBirth: undefined,
    issuedDate: undefined,
    expiryDate: undefined,
    
    // Arrays (at least one empty object)
    directors: [{
      firstName: '',
      lastName: '',
      // ... all director fields
    }],
    
    // File fields
    verificationDocument: '',
    
    // Checkboxes
    agreeToDataPrivacy: false,
  };

  const formMethods = useForm<any>({
    resolver: yupResolver(formSchema),
    defaultValues,
    mode: 'onChange' // Real-time validation
  });

  // For dynamic arrays (directors, etc.)
  const { fields, append, remove } = useFieldArray({
    control: formMethods.control,
    name: 'directors'
  });

  const { saveDraft, clearDraft } = useFormDraft('formName', formMethods);
```

---

## 📝 STEP 6: Step Field Mappings & Submission

```typescript
  // CRITICAL: Map exact field names to steps
  const stepFieldMappings = {
    0: ['firstName', 'lastName', 'email'], // Step 1 fields
    1: ['directors'], // Step 2 fields (array)
    2: ['verificationDocument'], // Step 3 fields
    3: ['agreeToDataPrivacy', 'signature'] // Final step
  };

  // Data sanitization (remove undefined values)
  const sanitizeData = (data: any) => {
    const sanitized: any = {};
    Object.keys(data).forEach(key => {
      if (data[key] !== undefined) {
        sanitized[key] = data[key];
      }
    });
    return sanitized;
  };

  const handleSubmit = async (data: any) => {
    console.log('Form data before sanitization:', data);
    
    const sanitizedData = sanitizeData(data);
    console.log('Sanitized data:', sanitizedData);

    // Handle file uploads
    const fileUploadPromises: Array<Promise<[string, string]>> = [];
    
    for (const [key, file] of Object.entries(uploadedFiles)) {
      if (file) {
        fileUploadPromises.push(
          uploadFile(file, `form-name/${Date.now()}-${file.name}`).then(url => [key, url])
        );
      }
    }

    const fileResults = await Promise.all(fileUploadPromises);
    const fileUrls = Object.fromEntries(fileResults);

    const finalData = {
      ...sanitizedData,
      ...fileUrls,
      status: 'processing',
      formType: 'Form Name'
    };

    await handleSubmitWithAuth(finalData, 'Form Name');
    clearDraft();
    setShowSummary(false);
  };

  const onFinalSubmit = (data: any) => {
    setShowSummary(true);
  };
```

---

## 📝 STEP 7: File Upload Implementation

```typescript
// CRITICAL: Include file validation in schema AND form handling
<div>
  <Label>Upload Document <span className="required-asterisk">*</span></Label>
  <FileUpload
    accept=".png,.jpg,.jpeg,.pdf"
    onFileSelect={(file) => {
      setUploadedFiles(prev => ({
        ...prev,
        verificationDocument: file
      }));
      formMethods.setValue('verificationDocument', file);
      if (formMethods.formState.errors.verificationDocument) {
        formMethods.clearErrors('verificationDocument');
      }
    }}
    maxSize={3 * 1024 * 1024}
  />
  {uploadedFiles.verificationDocument && (
    <div className="flex items-center gap-2 mt-2 text-sm text-green-600">
      <Check className="h-4 w-4" />
      {uploadedFiles.verificationDocument.name}
    </div>
  )}
  {formMethods.formState.errors.verificationDocument && (
    <p className="text-sm text-destructive">
      {formMethods.formState.errors.verificationDocument.message?.toString()}
    </p>
  )}
</div>
```

---

## 📝 STEP 8: Checkbox with Error Clearing

```typescript
// CRITICAL: Add clearErrors to checkbox
<div className="flex items-start space-x-2">
  <Checkbox
    id="agreeToDataPrivacy"
    checked={formMethods.watch('agreeToDataPrivacy')}
    onCheckedChange={(checked) => {
      formMethods.setValue('agreeToDataPrivacy', checked === true);
      if (formMethods.formState.errors.agreeToDataPrivacy) {
        formMethods.clearErrors('agreeToDataPrivacy');
      }
    }}
    className={cn(formMethods.formState.errors.agreeToDataPrivacy && "border-destructive")}
  />
  <Label htmlFor="agreeToDataPrivacy" className="text-sm">
    I agree to terms <span className="required-asterisk">*</span>
  </Label>
</div>
{formMethods.formState.errors.agreeToDataPrivacy && (
  <p className="text-sm text-destructive">
    {formMethods.formState.errors.agreeToDataPrivacy.message?.toString()}
  </p>
)}
```

---

## 📝 STEP 9: Dynamic Arrays (Directors, etc.)

```typescript
// For each director
{fields.map((director, index) => (
  <Card key={director.id} className="p-4">
    <div className="flex justify-between items-center mb-4">
      <h3 className="text-lg font-medium">Director {index + 1}</h3>
      {fields.length > 1 && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => remove(index)}
        >
          <Trash2 className="h-4 w-4 mr-1" />
          Remove
        </Button>
      )}
    </div>
    
    {/* Use nested field names */}
    <FormField
      name={`directors.${index}.firstName`}
      label="First Name"
      required={true}
    />
    <FormField
      name={`directors.${index}.lastName`}
      label="Last Name"
      required={true}
    />
    {/* ... other director fields */}
  </Card>
))}

{/* Add another director button */}
<Button
  type="button"
  variant="outline"
  onClick={() => append({
    firstName: '',
    lastName: '',
    // ... all director fields with empty defaults
  })}
  className="w-full"
>
  <Plus className="h-4 w-4 mr-2" />
  Add Another Director
</Button>
```

---

## 📝 STEP 10: Final Form Structure

```typescript
return (
  <FormProvider {...formMethods}>
    <div className="container mx-auto px-4 py-8">
      {/* Loading overlay */}
      {showPostAuthLoading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 flex flex-col items-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-lg font-semibold">Completing your submission...</p>
          </div>
        </div>
      )}

      <Card className="max-w-6xl mx-auto">
        <CardHeader>
          <CardTitle>Form Title</CardTitle>
          <CardDescription>Form description</CardDescription>
        </CardHeader>
        <CardContent>
          <MultiStepForm
            steps={steps}
            onSubmit={onFinalSubmit}
            formMethods={formMethods}
            submitButtonText="Submit Form"
            stepFieldMappings={stepFieldMappings}
          />
        </CardContent>
      </Card>

      {/* Summary Dialog */}
      <Dialog open={showSummary} onOpenChange={setShowSummary}>
        {/* ... summary content */}
      </Dialog>

      {/* Success Modal */}
      <SuccessModal
        isOpen={authShowSuccess}
        onClose={() => setAuthShowSuccess()}
        title="Form Submitted Successfully!"
        message="Your form has been submitted successfully."
        formType="Form Name"
      />
    </div>
  </FormProvider>
);
```

---

## 🔍 CRITICAL TESTING CHECKLIST

### ✅ Field Validation
- [ ] All required fields show red asterisks
- [ ] Error messages appear below each field
- [ ] Errors clear immediately when user starts typing/selecting
- [ ] Nested fields (directors) show errors correctly

### ✅ Focus & Interaction
- [ ] No focus loss when typing in any field
- [ ] Date pickers work without focus issues
- [ ] Dropdowns work without focus issues
- [ ] Checkboxes work without focus issues

### ✅ File Upload
- [ ] File upload validation prevents form submission if missing
- [ ] File errors display below upload component
- [ ] File errors clear when file is selected

### ✅ Step Navigation
- [ ] Cannot proceed with validation errors
- [ ] Step field mappings include all necessary fields
- [ ] Arrays (directors) validate correctly

### ✅ Final Submission
- [ ] No duplicate submit buttons
- [ ] Data sanitization removes undefined values
- [ ] File uploads work correctly
- [ ] Success modal appears after submission

---

## 🚨 FINAL REMINDERS

1. **ALWAYS define form components OUTSIDE main component**
2. **ALWAYS use lodash.get for error access**  
3. **ALWAYS add clearErrors to all interactive elements**
4. **ALWAYS include file uploads in validation schema**
5. **NEVER add extra submit buttons - let MultiStepForm handle it**
6. **ALWAYS test nested field validation (directors, arrays)**
7. **ALWAYS include all fields in defaultValues**
8. **ALWAYS sanitize data before submission**

Following this guide exactly will ensure forms work perfectly like Individual KYC without the issues found in Corporate KYC.
