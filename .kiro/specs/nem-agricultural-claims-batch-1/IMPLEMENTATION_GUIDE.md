# Implementation Guide

## Quick Start

This guide provides step-by-step instructions for implementing the two NEM agricultural claim forms.

## Prerequisites

- Familiarity with React and TypeScript
- Understanding of react-hook-form and yup validation
- Access to the codebase with Smart Protection forms as reference
- Firebase project configured

## Reference Implementation

The Smart Protection claim forms serve as the EXACT pattern to follow:
- `src/pages/claims/NEMHomeProtectionClaim.tsx`
- `src/pages/claims/SmartMotoristProtectionClaim.tsx`

## Key Patterns to Follow

### 1. Form Submission Hook

```typescript
import { useEnhancedFormSubmit } from '@/hooks/useEnhancedFormSubmit';

const {
  handleSubmit: handleEnhancedSubmit,
  showSummary,
  setShowSummary,
  showLoading,
  loadingMessage,
  showSuccess,
  confirmSubmit,
  closeSuccess,
  formData: submissionData,
  isSubmitting
} = useEnhancedFormSubmit({
  formType: 'Farm Property and Produce Insurance Claim',
  onSuccess: () => clearDraft()
});
```

### 2. Form Methods Setup

```typescript
const formMethods = useForm<any>({
  resolver: yupResolver(farmPropertyProduceSchema),
  defaultValues,
  mode: 'onChange'
});
```

### 3. Auto-Save Draft

```typescript
const { saveDraft, clearDraft } = useFormDraft('farmPropertyProduceClaim', formMethods);

useEffect(() => {
  const subscription = formMethods.watch((data) => {
    saveDraft(data);
  });
  return () => subscription.unsubscribe();
}, [formMethods, saveDraft]);
```

### 4. Array Fields

```typescript
const { fields, append, remove } = useFieldArray({
  control: formMethods.control,
  name: 'damagedItems'
});

// Add button
<Button onClick={() => append({ itemDescription: '', numberOrQuantity: '', valueBeforeLoss: '', salvageValue: '' })}>
  <Plus className="h-4 w-4 mr-2" />
  Add Item
</Button>

// Remove button
<Button onClick={() => remove(index)}>
  <Trash2 className="h-4 w-4" />
</Button>
```

### 5. Conditional Fields

```typescript
{formMethods.watch('causeOfLoss') === 'outbreak-pest-disease' && (
  <FormField name="pestDiseaseSpecification" label="Please specify the pest or disease" required />
)}
```

### 6. DatePicker Component

```typescript
import DatePicker from '@/components/common/DatePicker';

<DatePicker
  name="dateOfLoss"
  label="Date of Loss"
  required
/>
```

### 7. Declaration Section

```typescript
<div className="flex items-center space-x-2">
  <Checkbox 
    id="agreeToDataPrivacy"
    checked={formMethods.watch('agreeToDataPrivacy') || false}
    onCheckedChange={(checked) => {
      formMethods.setValue('agreeToDataPrivacy', !!checked);
      if (formMethods.formState.errors.agreeToDataPrivacy) {
        formMethods.clearErrors('agreeToDataPrivacy');
      }
    }}
    className={cn(formMethods.formState.errors.agreeToDataPrivacy && "border-destructive")}
  />
  <Label htmlFor="agreeToDataPrivacy">
    I agree to the data privacy terms <span className="required-asterisk">*</span>
  </Label>
</div>
```

### 8. Signature Field (NOT File Upload)

```typescript
<FormField name="signature" label="Full Name (Digital Signature)" required />
```

### 9. File Upload Fields

```typescript
// Single required file
<FormField 
  name="signatureUpload" 
  label="Signature Upload" 
  type="file" 
  required 
  accept=".pdf,.jpg,.jpeg,.png"
/>

// Multiple optional files
<FormField 
  name="receiptsAndInvoices" 
  label="Receipts and Invoices" 
  type="file" 
  multiple
  accept=".pdf,.jpg,.jpeg,.png"
/>
```

### 10. Summary Dialog

```typescript
<FormSummaryDialog
  open={showSummary}
  onOpenChange={setShowSummary}
  onConfirm={confirmSubmit}
  formData={submissionData}
  formType="Farm Property and Produce Insurance Claim"
  isSubmitting={isSubmitting}
  renderSummary={(data) => {
    if (!data) return <div>No data to display</div>;
    
    return (
      <div className="space-y-6">
        {/* Section 1 */}
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold text-lg mb-3">Policy & Insured Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-600">Policy Number:</span>
              <p className="text-gray-900">{data.policyNumber || 'Not provided'}</p>
            </div>
            {/* More fields... */}
          </div>
        </div>
        {/* More sections... */}
      </div>
    );
  }}
/>
```

### 11. Step Field Mappings

```typescript
const stepFieldMappings = {
  0: ['policyNumber', 'periodOfCoverFrom', 'periodOfCoverTo', 'insuredName', 'address', 'phone'],
  1: ['dateOfLoss', 'timeOfLoss', 'causeOfLoss', 'lossDescription'],
  2: ['damagedItems'],
  3: ['agreeToDataPrivacy', 'declarationTrue', 'signature']
};
```

### 12. MultiStepForm Component

```typescript
<MultiStepForm
  steps={steps}
  onSubmit={formMethods.handleSubmit(onFinalSubmit)}
  formMethods={formMethods}
  stepFieldMappings={stepFieldMappings}
  isSubmitting={isSubmitting}
/>
```

## Common Pitfalls to Avoid

### ❌ DON'T: Use file upload for signature field

```typescript
// WRONG
<FormField name="signature" type="file" />
```

### ✅ DO: Use text input for signature, separate file upload

```typescript
// CORRECT
<FormField name="signature" label="Full Name (Digital Signature)" required />
<FormField name="signatureUpload" type="file" required />
```

### ❌ DON'T: Duplicate DatePicker labels/errors

```typescript
// WRONG
<Label>Date of Loss</Label>
<DatePicker name="dateOfLoss" />
{error && <p>{error.message}</p>}
```

### ✅ DO: Let DatePicker handle its own label and errors

```typescript
// CORRECT
<DatePicker name="dateOfLoss" label="Date of Loss" required />
```

### ❌ DON'T: Forget to clear errors on checkbox change

```typescript
// WRONG
<Checkbox 
  checked={formMethods.watch('agreeToDataPrivacy')}
  onCheckedChange={(checked) => formMethods.setValue('agreeToDataPrivacy', checked)}
/>
```

### ✅ DO: Clear errors when checkbox changes

```typescript
// CORRECT
<Checkbox 
  checked={formMethods.watch('agreeToDataPrivacy') || false}
  onCheckedChange={(checked) => {
    formMethods.setValue('agreeToDataPrivacy', !!checked);
    if (formMethods.formState.errors.agreeToDataPrivacy) {
      formMethods.clearErrors('agreeToDataPrivacy');
    }
  }}
/>
```

### ❌ DON'T: Use useAuthRequiredSubmit hook

```typescript
// WRONG - This is the OLD pattern
import { useAuthRequiredSubmit } from '@/hooks/useAuthRequiredSubmit';
```

### ✅ DO: Use useEnhancedFormSubmit hook

```typescript
// CORRECT - This is the CURRENT pattern
import { useEnhancedFormSubmit } from '@/hooks/useEnhancedFormSubmit';
```

## Admin Table Implementation

### Basic Structure

```typescript
import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/config';

export const AdminFarmPropertyProduceClaimsTable: React.FC = () => {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchClaims();
  }, [statusFilter]);

  const fetchClaims = async () => {
    setLoading(true);
    try {
      let q = query(
        collection(db, 'formSubmissions'),
        where('formType', '==', 'Farm Property and Produce Insurance Claim'),
        orderBy('submittedAt', 'desc')
      );

      if (statusFilter !== 'all') {
        q = query(q, where('status', '==', statusFilter));
      }

      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setClaims(data);
    } catch (error) {
      console.error('Error fetching claims:', error);
    } finally {
      setLoading(false);
    }
  };

  // Table rendering...
};
```

## Form Viewer Implementation

### Basic Structure

```typescript
import React from 'react';
import { format } from 'date-fns';

interface FarmPropertyProduceFormViewerProps {
  data: any;
}

export const FarmPropertyProduceFormViewer: React.FC<FarmPropertyProduceFormViewerProps> = ({ data }) => {
  return (
    <div className="space-y-6">
      {/* Section 1: Policy & Insured Details */}
      <div className="border rounded-lg p-4">
        <h3 className="font-semibold text-lg mb-3">Policy & Insured Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-600">Policy Number:</span>
            <p className="text-gray-900">{data.policyNumber || 'Not provided'}</p>
          </div>
          <div>
            <span className="font-medium text-gray-600">Period of Cover From:</span>
            <p className="text-gray-900">
              {data.periodOfCoverFrom ? format(new Date(data.periodOfCoverFrom), 'dd/MM/yyyy') : 'Not provided'}
            </p>
          </div>
          {/* More fields... */}
        </div>
      </div>

      {/* Section 2: Cause of Loss */}
      <div className="border rounded-lg p-4">
        <h3 className="font-semibold text-lg mb-3">Cause of Loss</h3>
        {/* Fields... */}
        
        {/* Conditional field */}
        {data.causeOfLoss === 'outbreak-pest-disease' && data.pestDiseaseSpecification && (
          <div>
            <span className="font-medium text-gray-600">Pest/Disease Specification:</span>
            <p className="text-gray-900">{data.pestDiseaseSpecification}</p>
          </div>
        )}
      </div>

      {/* Section 3: Property Lost or Damaged */}
      {data.damagedItems && data.damagedItems.length > 0 && (
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold text-lg mb-3">Property Lost or Damaged</h3>
          {data.damagedItems.map((item: any, index: number) => (
            <div key={index} className="border-l-4 border-blue-200 pl-4 mb-4">
              <h4 className="font-medium text-gray-800 mb-2">Item {index + 1}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-600">Description:</span>
                  <p className="text-gray-900">{item.itemDescription}</p>
                </div>
                {/* More item fields... */}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Section 4: Declaration & Signature */}
      <div className="border rounded-lg p-4">
        <h3 className="font-semibold text-lg mb-3">Declaration & Signature</h3>
        {/* Fields... */}
      </div>
    </div>
  );
};
```

## Testing Checklist

### Form Testing

- [ ] All required fields show validation errors when empty
- [ ] Conditional fields show/hide correctly
- [ ] Array fields allow add/remove operations
- [ ] File uploads validate type and size
- [ ] Date fields use DatePicker component
- [ ] Summary dialog displays all data correctly
- [ ] Form submits successfully
- [ ] Draft auto-save works
- [ ] Success modal displays after submission

### Admin Table Testing

- [ ] Table loads data from Firestore
- [ ] Status filter works correctly
- [ ] Search functionality works
- [ ] Row click opens form viewer
- [ ] Status updates persist
- [ ] Pagination works (if implemented)
- [ ] Loading state displays
- [ ] Error handling works

### Integration Testing

- [ ] Form submission creates Firestore document
- [ ] Ticket ID generates correctly
- [ ] Files upload to correct Storage paths
- [ ] Admin can view submitted forms
- [ ] PDF generation works
- [ ] Navigation works from all entry points

## Deployment Steps

1. **Code Review**
   - Review all components against reference implementations
   - Verify all patterns match Smart Protection forms
   - Check for common pitfalls

2. **Testing**
   - Run unit tests
   - Run integration tests
   - Manual testing of complete flow

3. **Configuration**
   - Update Firestore security rules
   - Update Storage security rules
   - Verify form mappings

4. **Staging Deployment**
   - Deploy to staging environment
   - Test end-to-end
   - Verify file uploads
   - Test admin workflows

5. **Production Deployment**
   - Deploy to production
   - Monitor for errors
   - Verify functionality
   - Test with real data

## Support and Resources

- **Reference Forms**: `src/pages/claims/NEMHomeProtectionClaim.tsx`, `src/pages/claims/SmartMotoristProtectionClaim.tsx`
- **Hooks**: `src/hooks/useEnhancedFormSubmit.ts`, `src/hooks/useFormDraft.ts`
- **Components**: `src/components/common/MultiStepForm.tsx`, `src/components/common/DatePicker.tsx`
- **Schemas**: See `FORM_SCHEMAS.md` for complete field definitions
- **Design**: See `design.md` for architecture and component designs
- **Requirements**: See `requirements.md` for acceptance criteria
