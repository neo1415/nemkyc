# Enterprise Refactoring Strategy

## Problem Files Identified

| File | Lines | Size | Issue |
|------|-------|------|-------|
| formMappings.ts | 2,219 | 118KB | Massive config file |
| GoodsInTransitClaim.tsx | 2,046 | 85KB | Monolithic form |
| NaicomPartnersCDD.tsx | 1,452 | 59KB | Monolithic form |
| BrokersCDD.tsx | 1,413 | 61KB | Monolithic form |
| PartnersCDD.tsx | 1,319 | 54KB | Monolithic form |
| NaicomCorporateCDD.tsx | 1,252 | 51KB | Monolithic form |
| DynamicPDFGenerator.tsx | 1,234 | 51KB | Complex logic |
| CombinedGPAEmployersLiabilityClaim.tsx | 1,217 | 52KB | Monolithic form |
| FireSpecialPerilsClaim.tsx | 1,175 | 55KB | Monolithic form |

**Total:** 9 files with 13,327 lines that need refactoring

---

## Modern React Architecture Patterns

### 1. Composition Over Monoliths

**Current (Bad):**
```typescript
// 2000+ line file
const GoodsInTransitClaim = () => {
  // 100+ state variables
  // 50+ functions
  // 500+ lines of JSX
  return <form>...</form>
}
```

**Modern (Good):**
```typescript
// Main file: 200 lines
const GoodsInTransitClaim = () => {
  return (
    <FormProvider>
      <ClaimantInformation />
      <PolicyDetails />
      <GoodsDetails />
      <TransportDetails />
      <LossDetails />
      <DocumentUpload />
      <Declaration />
    </FormProvider>
  )
}

// Each section: 100-200 lines
const ClaimantInformation = () => {
  // Only claimant-related logic
}
```

### 2. Custom Hooks for Logic Separation

**Extract business logic:**
```typescript
// hooks/useGoodsInTransitForm.ts
export const useGoodsInTransitForm = () => {
  const [formData, setFormData] = useState({});
  const [uploadedFiles, setUploadedFiles] = useState({});
  
  const handleSubmit = async (data) => {
    // Submission logic
  };
  
  return { formData, uploadedFiles, handleSubmit };
};

// Component becomes simple
const GoodsInTransitClaim = () => {
  const { formData, uploadedFiles, handleSubmit } = useGoodsInTransitForm();
  
  return <FormUI onSubmit={handleSubmit} />;
};
```

### 3. Shared Form Components

**Create reusable form sections:**
```typescript
// components/forms/sections/PersonalInfo.tsx
export const PersonalInfoSection = ({ prefix = '' }) => {
  return (
    <>
      <FormField name={`${prefix}firstName`} label="First Name" required />
      <FormField name={`${prefix}lastName`} label="Last Name" required />
      <FormField name={`${prefix}email`} label="Email" required />
      <FormField name={`${prefix}phone`} label="Phone" required />
    </>
  );
};

// Use in multiple forms
<PersonalInfoSection prefix="claimant" />
<PersonalInfoSection prefix="insured" />
```

### 4. Form Field Arrays (React Hook Form)

**For repeating sections:**
```typescript
import { useFieldArray } from 'react-hook-form';

const GoodsItemsList = () => {
  const { fields, append, remove } = useFieldArray({
    name: 'goodsItems'
  });
  
  return (
    <>
      {fields.map((field, index) => (
        <GoodsItemRow key={field.id} index={index} onRemove={remove} />
      ))}
      <Button onClick={() => append({})}>Add Item</Button>
    </>
  );
};
```

### 5. Context for Form State

**Share state without prop drilling:**
```typescript
// contexts/FormContext.tsx
const FormContext = createContext();

export const FormProvider = ({ children }) => {
  const [uploadedFiles, setUploadedFiles] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  return (
    <FormContext.Provider value={{ uploadedFiles, setUploadedFiles, isSubmitting }}>
      {children}
    </FormContext.Provider>
  );
};

// Use anywhere in form
const DocumentUpload = () => {
  const { uploadedFiles, setUploadedFiles } = useContext(FormContext);
};
```

---

## Refactoring Plan

### Phase 1: Extract Form Sections (Week 1)

#### Target: GoodsInTransitClaim.tsx (2,046 lines → 200 lines)

**New Structure:**
```
src/
  components/
    forms/
      goods-in-transit/
        GoodsInTransitClaim.tsx (200 lines) - Main orchestrator
        sections/
          ClaimantSection.tsx (150 lines)
          PolicySection.tsx (120 lines)
          GoodsSection.tsx (200 lines)
          TransportSection.tsx (180 lines)
          LossSection.tsx (150 lines)
          DocumentSection.tsx (100 lines)
          DeclarationSection.tsx (80 lines)
        hooks/
          useGoodsInTransitForm.ts (150 lines)
          useGoodsValidation.ts (100 lines)
        types/
          goods-in-transit.types.ts (50 lines)
```

**Benefits:**
- Each file < 200 lines
- Easy to test
- Easy to maintain
- Reusable sections

#### Implementation:

**Step 1: Create Section Components**
```typescript
// sections/ClaimantSection.tsx
import { FormField, FormSelect } from '@/components/common/FormFields';

export const ClaimantSection = () => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Claimant Information</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField name="claimantName" label="Full Name" required />
        <FormField name="claimantEmail" label="Email" type="email" required />
        <FormField name="claimantPhone" label="Phone" required />
        <FormField name="claimantAddress" label="Address" required />
      </div>
    </div>
  );
};
```

**Step 2: Extract Business Logic**
```typescript
// hooks/useGoodsInTransitForm.ts
export const useGoodsInTransitForm = () => {
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File>>({});
  const { toast } = useToast();
  const { handleSubmit: handleEnhancedSubmit } = useEnhancedFormSubmit({
    formType: 'Goods In Transit Claim',
    onSuccess: () => toast({ title: 'Success!' })
  });

  const onSubmit = async (data: any) => {
    // File upload logic
    const fileUploadPromises = Object.entries(uploadedFiles).map(
      async ([key, file]) => {
        const url = await uploadFile(file, `goods-in-transit-claims/${Date.now()}-${file.name}`);
        return [key, url];
      }
    );

    const fileUrls = Object.fromEntries(await Promise.all(fileUploadPromises));
    
    await handleEnhancedSubmit({
      ...data,
      ...fileUrls,
      status: 'processing',
      formType: 'Goods In Transit Claim'
    });
  };

  return { uploadedFiles, setUploadedFiles, onSubmit };
};
```

**Step 3: Simplified Main Component**
```typescript
// GoodsInTransitClaim.tsx (now only 200 lines!)
import { FormProvider } from 'react-hook-form';
import { ClaimantSection } from './sections/ClaimantSection';
import { PolicySection } from './sections/PolicySection';
// ... other sections
import { useGoodsInTransitForm } from './hooks/useGoodsInTransitForm';

const GoodsInTransitClaim = () => {
  const { uploadedFiles, setUploadedFiles, onSubmit } = useGoodsInTransitForm();
  const formMethods = useForm({ resolver: yupResolver(schema) });

  return (
    <FormProvider {...formMethods}>
      <Card>
        <CardHeader>
          <CardTitle>Goods In Transit Claim</CardTitle>
        </CardHeader>
        <CardContent>
          <MultiStepForm
            steps={[
              { id: 'claimant', title: 'Claimant', component: <ClaimantSection /> },
              { id: 'policy', title: 'Policy', component: <PolicySection /> },
              { id: 'goods', title: 'Goods', component: <GoodsSection /> },
              { id: 'transport', title: 'Transport', component: <TransportSection /> },
              { id: 'loss', title: 'Loss Details', component: <LossSection /> },
              { id: 'documents', title: 'Documents', component: <DocumentSection uploadedFiles={uploadedFiles} setUploadedFiles={setUploadedFiles} /> },
              { id: 'declaration', title: 'Declaration', component: <DeclarationSection /> }
            ]}
            onSubmit={onSubmit}
            formMethods={formMethods}
          />
        </CardContent>
      </Card>
    </FormProvider>
  );
};
```

---

### Phase 2: Shared Components Library (Week 2)

**Create reusable form components:**

```
src/
  components/
    forms/
      shared/
        PersonalInfoSection.tsx
        AddressSection.tsx
        ContactSection.tsx
        PolicyDetailsSection.tsx
        DocumentUploadSection.tsx
        DeclarationSection.tsx
        WitnessSection.tsx
        BankDetailsSection.tsx
```

**Example:**
```typescript
// shared/PersonalInfoSection.tsx
interface PersonalInfoProps {
  prefix?: string;
  title?: string;
  required?: boolean;
}

export const PersonalInfoSection = ({ 
  prefix = '', 
  title = 'Personal Information',
  required = true 
}: PersonalInfoProps) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">{title}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField name={`${prefix}firstName`} label="First Name" required={required} />
        <FormField name={`${prefix}lastName`} label="Last Name" required={required} />
        <FormField name={`${prefix}email`} label="Email" type="email" required={required} />
        <FormField name={`${prefix}phone`} label="Phone" required={required} />
      </div>
    </div>
  );
};

// Use in multiple forms
<PersonalInfoSection prefix="claimant" title="Claimant Information" />
<PersonalInfoSection prefix="insured" title="Insured Person" />
<PersonalInfoSection prefix="witness" title="Witness Details" required={false} />
```

---

### Phase 3: Config File Refactoring (Week 3)

#### Target: formMappings.ts (2,219 lines → 300 lines)

**Current Problem:**
- One massive file with all form configs
- Hard to find specific forms
- Slow to load

**Solution: Split by form type**

```
src/
  config/
    formMappings/
      index.ts (100 lines) - Exports all
      kyc/
        individual-kyc.mapping.ts
        corporate-kyc.mapping.ts
      cdd/
        individual-cdd.mapping.ts
        corporate-cdd.mapping.ts
        naicom-cdd.mapping.ts
      claims/
        motor-claims.mapping.ts
        fire-claims.mapping.ts
        goods-transit.mapping.ts
        // ... etc
```

**Implementation:**
```typescript
// kyc/individual-kyc.mapping.ts
export const individualKYCMapping = {
  collectionName: 'Individual-kyc-form',
  displayName: 'Individual KYC',
  fields: [
    { key: 'firstName', label: 'First Name', type: 'text' },
    { key: 'lastName', label: 'Last Name', type: 'text' },
    // ... only Individual KYC fields
  ]
};

// index.ts
export * from './kyc/individual-kyc.mapping';
export * from './kyc/corporate-kyc.mapping';
// ... etc

// Aggregate
export const FORM_MAPPINGS = {
  'Individual-kyc-form': individualKYCMapping,
  'corporate-kyc': corporateKYCMapping,
  // ... etc
};
```

---

## Modern React Packages to Use

### 1. React Hook Form (Already Using ✓)
**Best for:** Form state management
**Why:** Performant, minimal re-renders

### 2. Zod or Yup (Using Yup ✓)
**Best for:** Schema validation
**Why:** Type-safe, composable

### 3. TanStack Query (React Query)
**Best for:** Server state management
**Why:** Caching, automatic refetching

```bash
npm install @tanstack/react-query
```

```typescript
// hooks/useFormData.ts
import { useQuery } from '@tanstack/react-query';

export const useFormData = (collection: string, id: string) => {
  return useQuery({
    queryKey: ['form', collection, id],
    queryFn: () => fetchFormData(collection, id),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Component
const FormViewer = ({ collection, id }) => {
  const { data, isLoading, error } = useFormData(collection, id);
  
  if (isLoading) return <Spinner />;
  if (error) return <Error />;
  
  return <FormDisplay data={data} />;
};
```

### 4. Zustand (State Management)
**Best for:** Global state (lighter than Redux)
**Why:** Simple, no boilerplate

```bash
npm install zustand
```

```typescript
// stores/formStore.ts
import create from 'zustand';

export const useFormStore = create((set) => ({
  uploadedFiles: {},
  setUploadedFiles: (files) => set({ uploadedFiles: files }),
  clearFiles: () => set({ uploadedFiles: {} }),
}));

// Use in any component
const { uploadedFiles, setUploadedFiles } = useFormStore();
```

### 5. React Window (Virtualization)
**Best for:** Large lists
**Why:** Only renders visible items

```bash
npm install react-window
```

```typescript
import { FixedSizeList } from 'react-window';

const LargeList = ({ items }) => (
  <FixedSizeList
    height={600}
    itemCount={items.length}
    itemSize={50}
    width="100%"
  >
    {({ index, style }) => (
      <div style={style}>{items[index].name}</div>
    )}
  </FixedSizeList>
);
```

---

## Implementation Timeline

### Week 1: Refactor Largest Form
- Day 1-2: GoodsInTransitClaim.tsx (2,046 → 200 lines)
- Day 3-4: Test thoroughly
- Day 5: Deploy and monitor

### Week 2: Refactor 3 More Forms
- Day 1: NaicomPartnersCDD.tsx
- Day 2: BrokersCDD.tsx
- Day 3: PartnersCDD.tsx
- Day 4-5: Test and deploy

### Week 3: Create Shared Components
- Day 1-2: Extract common sections
- Day 3: Refactor formMappings.ts
- Day 4-5: Update all forms to use shared components

### Week 4: Polish & Optimize
- Day 1-2: Add React Query
- Day 3: Add lazy loading
- Day 4-5: Performance testing

---

## Success Metrics

### Code Quality
- ✅ No file > 300 lines
- ✅ Each component has single responsibility
- ✅ 80%+ code reuse for common sections
- ✅ Type-safe with TypeScript

### Performance
- ✅ 70% smaller bundle size
- ✅ 50% faster form loads
- ✅ Better Lighthouse scores

### Maintainability
- ✅ Easy to find code
- ✅ Easy to add new forms
- ✅ Easy to fix bugs
- ✅ Easy to test

---

## Next Steps

1. **Install Firebase CLI** (for indexes)
2. **Choose starting point:**
   - Option A: Start with GoodsInTransitClaim refactor
   - Option B: Start with shared components first
   - Option C: Start with lazy loading (quickest win)

Which would you like to tackle first?
