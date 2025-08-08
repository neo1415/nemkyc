import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray, FormProvider, useFormContext } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { get } from 'lodash';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { CheckCircle2, Loader2, Trash2, Plus, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import MultiStepForm from '@/components/common/MultiStepForm';
import { useFormDraft } from '@/hooks/useFormDraft';
import FileUpload from '@/components/common/FileUpload';
import { uploadFile } from '@/services/fileService';
import { useAuthRequiredSubmit } from '@/hooks/useAuthRequiredSubmit';
import SuccessModal from '@/components/common/SuccessModal';

// Fire and Special Perils Claim Schema
const fireSpecialPerilsSchema = yup.object().shape({
  // Policy Details
  policyNumber: yup.string().required('Policy number is required'),
  periodOfCoverFrom: yup.date().required('Period of cover start date is required'),
  periodOfCoverTo: yup.date().required('Period of cover end date is required'),
  
  // Insured Details
  name: yup.string().required('Name is required'),
  companyName: yup.string(),
  title: yup.string().required('Title is required'),
  dateOfBirth: yup.date().required('Date of birth is required'),
  gender: yup.string().required('Gender is required'),
  address: yup.string().required('Address is required'),
  phone: yup.string().required('Phone number is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  
  // Loss Details
  premisesAddress: yup.string().required('Premises address is required'),
  premisesPhone: yup.string().required('Premises phone is required'),
  dateOfOccurrence: yup.date().required('Date of occurrence is required'),
  timeOfOccurrence: yup.string().required('Time of occurrence is required'),
  incidentDescription: yup.string().required('Incident description is required'),
  causeOfFire: yup.string().required('Cause of fire is required'),
  
  // Premises Use
  premisesUsedAsPerPolicy: yup.boolean(),
  premisesUsageDetails: yup.string().when('premisesUsedAsPerPolicy', {
    is: false,
    then: (schema) => schema.required('Please specify how premises was used'),
    otherwise: (schema) => schema.notRequired()
  }),
  purposeOfPremises: yup.string().required('Purpose of premises is required'),
  unallowedRiskIntroduced: yup.boolean(),
  unallowedRiskDetails: yup.string().when('unallowedRiskIntroduced', {
    is: true,
    then: (schema) => schema.required('Please specify the unallowed risk'),
    otherwise: (schema) => schema.notRequired()
  }),
  measuresWhenFireDiscovered: yup.string().required('Measures taken when fire was discovered is required'),
  
  // Property Ownership
  soleOwner: yup.boolean(),
  otherOwnersName: yup.string().when('soleOwner', {
    is: false,
    then: (schema) => schema.required('Other owner name is required'),
    otherwise: (schema) => schema.notRequired()
  }),
  otherOwnersAddress: yup.string().when('soleOwner', {
    is: false,
    then: (schema) => schema.required('Other owner address is required'),
    otherwise: (schema) => schema.notRequired()
  }),
  
  // Other Insurance
  hasOtherInsurance: yup.boolean(),
  otherInsuranceName: yup.string().when('hasOtherInsurance', {
    is: true,
    then: (schema) => schema.required('Other insurance company name is required'),
    otherwise: (schema) => schema.notRequired()
  }),
  otherInsuranceAddress: yup.string().when('hasOtherInsurance', {
    is: true,
    then: (schema) => schema.required('Other insurance company address is required'),
    otherwise: (schema) => schema.notRequired()
  }),
  
  // Valuation
  premisesContentsValue: yup.number().min(0, 'Value must be positive').required('Premises contents value is required'),
  hasPreviousClaim: yup.boolean(),
  previousClaimDate: yup.date().when('hasPreviousClaim', {
    is: true,
    then: (schema) => schema.required('Previous claim date is required'),
    otherwise: (schema) => schema.notRequired()
  }),
  previousClaimAmount: yup.number().min(0, 'Amount must be positive').when('hasPreviousClaim', {
    is: true,
    then: (schema) => schema.required('Previous claim amount is required'),
    otherwise: (schema) => schema.notRequired()
  }),
  
  // Items Lost/Damaged
  itemsLost: yup.array().of(
    yup.object().shape({
      sn: yup.number(),
      description: yup.string().required('Description is required'),
      costPrice: yup.number().min(0, 'Cost price must be positive').required('Cost price is required'),
      dateOfPurchase: yup.date().required('Date of purchase is required'),
      estimatedValueAtOccurrence: yup.number().min(0, 'Estimated value must be positive').required('Estimated value is required'),
      valueOfSalvage: yup.number().min(0, 'Salvage value must be positive'),
      netAmountClaimed: yup.number().min(0, 'Net amount must be positive'),
    })
  ).min(1, 'At least one item must be added'),
  
  // File Uploads
  picturesOfLoss: yup.mixed().required('Pictures of loss are required'),
  additionalDocuments: yup.mixed(),
  
  // Declaration
  agreeToDataPrivacy: yup.boolean().oneOf([true], 'You must agree to data privacy'),
  declarationTrue: yup.boolean().oneOf([true], 'You must confirm the declaration is true'),
  signature: yup.string().required('Signature is required'),
});

interface FireSpecialPerilsClaimData {
  // Policy Details
  policyNumber: string;
  periodOfCoverFrom: Date;
  periodOfCoverTo: Date;
  
  // Insured Details
  name: string;
  companyName: string;
  title: string;
  dateOfBirth: Date;
  gender: string;
  address: string;
  phone: string;
  email: string;
  
  // Loss Details
  premisesAddress: string;
  premisesPhone: string;
  dateOfOccurrence: Date;
  timeOfOccurrence: string;
  incidentDescription: string;
  causeOfFire: string;
  
  // Premises Use
  premisesUsedAsPerPolicy: boolean;
  premisesUsageDetails: string;
  purposeOfPremises: string;
  unallowedRiskIntroduced: boolean;
  unallowedRiskDetails: string;
  measuresWhenFireDiscovered: string;
  
  // Property Ownership
  soleOwner: boolean;
  otherOwnersName: string;
  otherOwnersAddress: string;
  
  // Other Insurance
  hasOtherInsurance: boolean;
  otherInsuranceName: string;
  otherInsuranceAddress: string;
  
  // Valuation
  premisesContentsValue: number;
  hasPreviousClaim: boolean;
  previousClaimDate: Date;
  previousClaimAmount: number;
  
  // Items Lost/Damaged
  itemsLost: Array<{
    sn: number;
    description: string;
    costPrice: number;
    dateOfPurchase: Date;
    estimatedValueAtOccurrence: number;
    valueOfSalvage: number;
    netAmountClaimed: number;
  }>;
  
  // File Uploads
  picturesOfLoss: File[];
  additionalDocuments: File[];
  
  // Declaration
  agreeToDataPrivacy: boolean;
  declarationTrue: boolean;
  signature: string;
}

// Form field components with validation (defined outside main component to prevent focus loss)
const FormField = ({ name, label, required = false, type = "text", maxLength, ...props }: any) => {
  const { register, formState: { errors }, clearErrors } = useFormContext();
  const error = get(errors, name);
  
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

const FormTextarea = ({ name, label, required = false, maxLength = 2500, ...props }: any) => {
  const { register, watch, formState: { errors }, clearErrors } = useFormContext();
  const currentValue = watch(name) || '';
  const error = get(errors, name);
  
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

const FormSelect = ({ name, label, required = false, options, placeholder, children, ...props }: any) => {
  const { setValue, watch, formState: { errors }, clearErrors } = useFormContext();
  const value = watch(name);
  const error = get(errors, name);
  
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
          {children}
        </SelectContent>
      </Select>
      {error && (
        <p className="text-sm text-destructive">{error.message?.toString()}</p>
      )}
    </div>
  );
};

const FormDatePicker = ({ name, label, required = false }: any) => {
  const { setValue, watch, formState: { errors }, clearErrors } = useFormContext();
  const value = watch(name);
  const error = get(errors, name);
  
  return (
    <div className="space-y-2">
      <Label>
        {label}
        {required && <span className="required-asterisk">*</span>}
      </Label>
      <Input
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

const defaultValues: Partial<FireSpecialPerilsClaimData> = {
  policyNumber: '',
  name: '',
  companyName: '',
  title: '',
  gender: '',
  address: '',
  phone: '',
  email: '',
  premisesAddress: '',
  premisesPhone: '',
  timeOfOccurrence: '',
  incidentDescription: '',
  causeOfFire: '',
  premisesUsedAsPerPolicy: true,
  premisesUsageDetails: '',
  purposeOfPremises: '',
  unallowedRiskIntroduced: false,
  unallowedRiskDetails: '',
  measuresWhenFireDiscovered: '',
  soleOwner: true,
  otherOwnersName: '',
  otherOwnersAddress: '',
  hasOtherInsurance: false,
  otherInsuranceName: '',
  otherInsuranceAddress: '',
  premisesContentsValue: 0,
  hasPreviousClaim: false,
  previousClaimAmount: 0,
  itemsLost: [{
    sn: 1,
    description: '',
    costPrice: 0,
    dateOfPurchase: undefined,
    estimatedValueAtOccurrence: 0,
    valueOfSalvage: 0,
    netAmountClaimed: 0
  }],
  agreeToDataPrivacy: false,
  declarationTrue: false,
  signature: ''
};

const FireSpecialPerilsClaim: React.FC = () => {
  const { toast } = useToast();
  const [showSummary, setShowSummary] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPostAuthLoading, setShowPostAuthLoading] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File>>({});
  const { 
    handleSubmitWithAuth, 
    showSuccess: authShowSuccess, 
    setShowSuccess: setAuthShowSuccess,
    isSubmitting: authSubmitting
  } = useAuthRequiredSubmit();

  // Check for pending submission when component mounts
  useEffect(() => {
    const checkPendingSubmission = () => {
      const hasPending = sessionStorage.getItem('pendingSubmission');
      if (hasPending) {
        setShowPostAuthLoading(true);
        setTimeout(() => setShowPostAuthLoading(false), 5000);
      }
    };
    checkPendingSubmission();
  }, []);

  // Hide post-auth loading when success modal shows
  useEffect(() => {
    if (authShowSuccess) {
      setShowPostAuthLoading(false);
    }
  }, [authShowSuccess]);

  const formMethods = useForm<any>({
    resolver: yupResolver(fireSpecialPerilsSchema),
    defaultValues,
    mode: 'onChange'
  });

  const { fields: itemFields, append: addItem, remove: removeItem } = useFieldArray({
    control: formMethods.control,
    name: 'itemsLost'
  });

  const { saveDraft, loadDraft, clearDraft } = useFormDraft('fireSpecialPerilsClaim', formMethods);
  const watchedValues = formMethods.watch();

  useEffect(() => {
    loadDraft();
  }, [loadDraft]);

  // Auto-save draft
  useEffect(() => {
    const subscription = formMethods.watch((data) => {
      saveDraft(data);
    });
    return () => subscription.unsubscribe();
  }, [formMethods, saveDraft]);

  // Calculate net amount claimed for each item in real-time
  useEffect(() => {
    const items = formMethods.getValues('itemsLost') || [];
    let hasChanges = false;
    
    items.forEach((item: any, index: number) => {
      const netAmount = (item.estimatedValueAtOccurrence || 0) - (item.valueOfSalvage || 0);
      if (netAmount !== item.netAmountClaimed) {
        formMethods.setValue(`itemsLost.${index}.netAmountClaimed`, netAmount, { shouldValidate: false });
        hasChanges = true;
      }
    });
    
    if (hasChanges) {
      formMethods.trigger();
    }
  }, [
    watchedValues.itemsLost?.map((item: any) => `${item.estimatedValueAtOccurrence}-${item.valueOfSalvage}`).join(','),
    formMethods
  ]);

  // Main submit handler that checks authentication
  const handleSubmit = async (data: FireSpecialPerilsClaimData) => {
    // Prepare file upload data
    const fileUploadPromises: Array<Promise<[string, string]>> = [];
    
    for (const [key, file] of Object.entries(uploadedFiles)) {
      if (file) {
        fileUploadPromises.push(
          uploadFile(file, `fire-special-perils-claims/${Date.now()}-${file.name}`).then(url => [key, url])
        );
      }
    }

    const fileResults = await Promise.all(fileUploadPromises);
    const fileUrls = Object.fromEntries(fileResults);

    const finalData = {
      ...data,
      ...fileUrls,
      status: 'processing',
      formType: 'Fire Special Perils Claim'
    };

    await handleSubmitWithAuth(finalData, 'Fire Special Perils Claim');
    clearDraft();
    setShowSummary(false);
  };

  const onFinalSubmit = (data: FireSpecialPerilsClaimData) => {
    setShowSummary(true);
  };

  // Step field mappings for validation
  const stepFieldMappings = {
    0: ['policyNumber', 'periodOfCoverFrom', 'periodOfCoverTo'],
    1: ['name', 'companyName', 'title', 'dateOfBirth', 'gender', 'address', 'phone', 'email'],
    2: ['premisesAddress', 'premisesPhone', 'dateOfOccurrence', 'timeOfOccurrence', 'incidentDescription', 'causeOfFire'],
    3: ['premisesUsedAsPerPolicy', 'premisesUsageDetails', 'purposeOfPremises', 'unallowedRiskIntroduced', 'unallowedRiskDetails', 'measuresWhenFireDiscovered'],
    4: ['soleOwner', 'otherOwnersName', 'otherOwnersAddress'],
    5: ['hasOtherInsurance', 'otherInsuranceName', 'otherInsuranceAddress'],
    6: ['premisesContentsValue', 'hasPreviousClaim', 'previousClaimDate', 'previousClaimAmount'],
    7: ['itemsLost'],
    8: ['picturesOfLoss', 'additionalDocuments'],
    9: ['agreeToDataPrivacy', 'declarationTrue', 'signature']
  };

  const steps = [
    {
      id: 'policy',
      title: 'Policy Details',
      component: (
        <FormProvider {...formMethods}>
          <div className="space-y-4">
            <FormField name="policyNumber" label="Policy Number" required />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormDatePicker name="periodOfCoverFrom" label="Period of Cover From" required />
              <FormDatePicker name="periodOfCoverTo" label="Period of Cover To" required />
            </div>
          </div>
        </FormProvider>
      )
    },
    {
      id: 'insured',
      title: 'Insured Details',
      component: (
        <FormProvider {...formMethods}>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField name="name" label="Full Name" required />
              <FormField name="companyName" label="Company Name" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormSelect name="title" label="Title" required>
                <SelectItem value="Mr">Mr</SelectItem>
                <SelectItem value="Mrs">Mrs</SelectItem>
                <SelectItem value="Ms">Ms</SelectItem>
                <SelectItem value="Dr">Dr</SelectItem>
                <SelectItem value="Chief">Chief</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </FormSelect>
              <FormDatePicker name="dateOfBirth" label="Date of Birth" required />
              <FormSelect name="gender" label="Gender" required>
                <SelectItem value="Male">Male</SelectItem>
                <SelectItem value="Female">Female</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </FormSelect>
            </div>

            <FormTextarea name="address" label="Address" required rows={3} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField name="phone" label="Phone Number" required />
              <FormField name="email" label="Email Address" required type="email" />
            </div>
          </div>
        </FormProvider>
      )
    },
    {
      id: 'loss-details',
      title: 'Loss Details',
      component: (
        <FormProvider {...formMethods}>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormTextarea name="premisesAddress" label="Premises Address" required rows={3} />
              <FormField name="premisesPhone" label="Premises Phone" required />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormDatePicker name="dateOfOccurrence" label="Date of Occurrence" required />
              <FormField name="timeOfOccurrence" label="Time of Occurrence" required type="time" />
            </div>

            <FormTextarea name="incidentDescription" label="Description of Incident" required />
            <FormTextarea name="causeOfFire" label="Cause of Fire" required />
          </div>
        </FormProvider>
      )
    },
    {
      id: 'premises-use',
      title: 'Premises Use',
      component: (
        <FormProvider {...formMethods}>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="premisesUsedAsPerPolicy"
                checked={formMethods.watch('premisesUsedAsPerPolicy')}
                onCheckedChange={(checked) => {
                  formMethods.setValue('premisesUsedAsPerPolicy', checked === true);
                  const error = get(formMethods.formState.errors, 'premisesUsedAsPerPolicy');
                  if (error) {
                    formMethods.clearErrors('premisesUsedAsPerPolicy');
                  }
                }}
              />
              <Label htmlFor="premisesUsedAsPerPolicy">
                Were the premises being used strictly as per policy?
              </Label>
            </div>

            {!formMethods.watch('premisesUsedAsPerPolicy') && (
              <FormTextarea name="premisesUsageDetails" label="How were the premises being used?" required />
            )}

            <FormTextarea name="purposeOfPremises" label="Purpose of Premises" required />

            <div className="flex items-center space-x-2">
              <Checkbox
                id="unallowedRiskIntroduced"
                checked={formMethods.watch('unallowedRiskIntroduced')}
                onCheckedChange={(checked) => {
                  formMethods.setValue('unallowedRiskIntroduced', checked === true);
                  const error = get(formMethods.formState.errors, 'unallowedRiskIntroduced');
                  if (error) {
                    formMethods.clearErrors('unallowedRiskIntroduced');
                  }
                }}
              />
              <Label htmlFor="unallowedRiskIntroduced">
                Was any unallowed risk introduced?
              </Label>
            </div>

            {formMethods.watch('unallowedRiskIntroduced') && (
              <FormTextarea name="unallowedRiskDetails" label="Specify the unallowed risk" required />
            )}

            <FormTextarea name="measuresWhenFireDiscovered" label="Measures taken when fire was discovered" required />
          </div>
        </FormProvider>
      )
    },
    {
      id: 'ownership',
      title: 'Property Ownership',
      component: (
        <FormProvider {...formMethods}>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="soleOwner"
                checked={formMethods.watch('soleOwner')}
                onCheckedChange={(checked) => {
                  formMethods.setValue('soleOwner', checked === true);
                  const error = get(formMethods.formState.errors, 'soleOwner');
                  if (error) {
                    formMethods.clearErrors('soleOwner');
                  }
                }}
              />
              <Label htmlFor="soleOwner">
                Are you the sole owner of the property?
              </Label>
            </div>

            {!formMethods.watch('soleOwner') && (
              <div className="space-y-4">
                <FormField name="otherOwnersName" label="Other Owner's Name" required />
                <FormTextarea name="otherOwnersAddress" label="Other Owner's Address" required />
              </div>
            )}
          </div>
        </FormProvider>
      )
    },
    {
      id: 'other-insurance',
      title: 'Other Insurance',
      component: (
        <FormProvider {...formMethods}>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="hasOtherInsurance"
                checked={formMethods.watch('hasOtherInsurance')}
                onCheckedChange={(checked) => {
                  formMethods.setValue('hasOtherInsurance', checked === true);
                  const error = get(formMethods.formState.errors, 'hasOtherInsurance');
                  if (error) {
                    formMethods.clearErrors('hasOtherInsurance');
                  }
                }}
              />
              <Label htmlFor="hasOtherInsurance">
                Do you have other insurance covering this property?
              </Label>
            </div>

            {formMethods.watch('hasOtherInsurance') && (
              <div className="space-y-4">
                <FormField name="otherInsuranceName" label="Other Insurance Company Name" required />
                <FormTextarea name="otherInsuranceAddress" label="Other Insurance Company Address" required />
              </div>
            )}
          </div>
        </FormProvider>
      )
    },
    {
      id: 'valuation',
      title: 'Valuation & Previous Claims',
      component: (
        <FormProvider {...formMethods}>
          <div className="space-y-4">
            <FormField name="premisesContentsValue" label="Total Value of Premises & Contents" required type="number" />

            <div className="flex items-center space-x-2">
              <Checkbox
                id="hasPreviousClaim"
                checked={formMethods.watch('hasPreviousClaim')}
                onCheckedChange={(checked) => {
                  formMethods.setValue('hasPreviousClaim', checked === true);
                  const error = get(formMethods.formState.errors, 'hasPreviousClaim');
                  if (error) {
                    formMethods.clearErrors('hasPreviousClaim');
                  }
                }}
              />
              <Label htmlFor="hasPreviousClaim">
                Have you made any previous claims?
              </Label>
            </div>

            {formMethods.watch('hasPreviousClaim') && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormDatePicker name="previousClaimDate" label="Previous Claim Date" required />
                <FormField name="previousClaimAmount" label="Previous Claim Amount" required type="number" />
              </div>
            )}
          </div>
        </FormProvider>
      )
    },
    {
      id: 'items-lost',
      title: 'Items Lost/Damaged',
      component: (
        <FormProvider {...formMethods}>
          <div className="space-y-4">
            {itemFields.map((item, index) => (
              <Card key={item.id} className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">Item {index + 1}</h3>
                  {itemFields.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeItem(index)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Remove
                    </Button>
                  )}
                </div>
                
                <div className="space-y-4">
                  <FormTextarea name={`itemsLost.${index}.description`} label="Description" required />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField name={`itemsLost.${index}.costPrice`} label="Cost Price" required type="number" />
                    <FormDatePicker name={`itemsLost.${index}.dateOfPurchase`} label="Date of Purchase" required />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField name={`itemsLost.${index}.estimatedValueAtOccurrence`} label="Estimated Value at Occurrence" required type="number" />
                    <FormField name={`itemsLost.${index}.valueOfSalvage`} label="Value of Salvage" type="number" />
                    <FormField name={`itemsLost.${index}.netAmountClaimed`} label="Net Amount Claimed" type="number" disabled />
                  </div>
                </div>
              </Card>
            ))}
            
            <Button
              type="button"
              variant="outline"
              onClick={() => addItem({
                sn: itemFields.length + 1,
                description: '',
                costPrice: 0,
                dateOfPurchase: undefined,
                estimatedValueAtOccurrence: 0,
                valueOfSalvage: 0,
                netAmountClaimed: 0
              })}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Another Item
            </Button>
          </div>
        </FormProvider>
      )
    },
    {
      id: 'documents',
      title: 'Supporting Documents',
      component: (
        <FormProvider {...formMethods}>
          <div className="space-y-6">
            <div>
              <Label>Pictures of Loss <span className="required-asterisk">*</span></Label>
              <FileUpload
                accept=".png,.jpg,.jpeg,.pdf"
                onFileSelect={(file) => {
                  setUploadedFiles(prev => ({
                    ...prev,
                    picturesOfLoss: file
                  }));
                  formMethods.setValue('picturesOfLoss', file);
                  if (formMethods.formState.errors.picturesOfLoss) {
                    formMethods.clearErrors('picturesOfLoss');
                  }
                }}
                maxSize={5 * 1024 * 1024}
              />
              {uploadedFiles.picturesOfLoss && (
                <div className="flex items-center gap-2 mt-2 text-sm text-green-600">
                  <Check className="h-4 w-4" />
                  {uploadedFiles.picturesOfLoss.name}
                </div>
              )}
              {formMethods.formState.errors.picturesOfLoss && (
                <p className="text-sm text-destructive">
                  {formMethods.formState.errors.picturesOfLoss.message?.toString()}
                </p>
              )}
            </div>

            <div>
              <Label>Additional Documents</Label>
              <FileUpload
                accept=".png,.jpg,.jpeg,.pdf"
                onFileSelect={(file) => {
                  setUploadedFiles(prev => ({
                    ...prev,
                    additionalDocuments: file
                  }));
                  formMethods.setValue('additionalDocuments', file);
                }}
                maxSize={5 * 1024 * 1024}
              />
              {uploadedFiles.additionalDocuments && (
                <div className="flex items-center gap-2 mt-2 text-sm text-green-600">
                  <Check className="h-4 w-4" />
                  {uploadedFiles.additionalDocuments.name}
                </div>
              )}
            </div>
          </div>
        </FormProvider>
      )
    },
    {
      id: 'declaration',
      title: 'Declaration & Signature',
      component: (
        <FormProvider {...formMethods}>
          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Data Privacy</h3>
              <div className="text-sm space-y-2">
                <p>i. Your data will solemnly be used for the purposes of this business contract and also to enable us reach you with the updates about our products and services.</p>
                <p>ii. Please note that your personal data will be treated with utmost respect and is well secured as required by Nigeria Data Protection Regulations 2019.</p>
                <p>iii. Your personal data shall not be shared with or sold to any third-party without your consent unless we are compelled by law or regulator.</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="agreeToDataPrivacy"
                checked={watchedValues.agreeToDataPrivacy || false}
                onCheckedChange={(checked) => formMethods.setValue('agreeToDataPrivacy', !!checked)}
              />
              <Label htmlFor="agreeToDataPrivacy">I agree to the data privacy terms *</Label>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Declaration</h3>
              <div className="text-sm space-y-2">
                <p>1. I/We declare to the best of my/our knowledge and belief that the information given on this form is true in every respect and agree that if I/we have made any false or fraudulent statement, be it suppression or concealment, the policy shall be cancelled and the claim shall be forfeited.</p>
                <p>2. I/We agree to provide additional information to NEM Insurance, if required.</p>
                <p>3. I/We agree to submit all required and requested for documents and NEM Insurance shall not be held responsible for any delay in settlement of claim due to non-fulfillment of requirements.</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="declarationTrue"
                checked={watchedValues.declarationTrue || false}
                onCheckedChange={(checked) => formMethods.setValue('declarationTrue', !!checked)}
              />
              <Label htmlFor="declarationTrue">I agree that statements are true *</Label>
            </div>
            
            <div>
              <Label htmlFor="signature">Signature of policyholder (digital signature) *</Label>
              <Input
                id="signature"
                {...formMethods.register('signature')}
                placeholder="Type your full name as signature"
              />
            </div>
            
            <div>
              <Label>Date</Label>
              <Input value={new Date().toISOString().split('T')[0]} disabled />
            </div>
          </div>
        </FormProvider>
      )
    }
  ];

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-6">
            <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Claim Submitted Successfully!</h2>
            <p className="text-gray-600 mb-6">
              Your fire and special perils claim has been received and is being processed.
            </p>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm font-medium text-blue-800">
                For claims status enquiries, call 01 448 9570
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Fire and Special Perils Claim Form
          </h1>
          <p className="text-muted-foreground">
            Please fill out all required information to submit your claim
          </p>
        </div>

        {/* Instructions Modal */}
        <Dialog open={showInstructions} onOpenChange={setShowInstructions}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-center mb-4">
                Please Read Carefully Before Filling the Form
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6 text-sm">
              <div>
                <h3 className="font-bold text-lg mb-3 text-center">INSTRUCTIONS TO BE OBSERVED IN COMPLETING THIS FORM</h3>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">ADVICE OF FIRE</h4>
                  <p>Information of any incident must be given to NEM Insurance, and pending our instructions, the salvage should be protected by the Insured from further deterioration. Any/all debris and evidence of fire MUST NOT be tampered with till a representative has an opportunity of inspecting them.</p>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">DOCUMENTS TO BE SUBMITTED</h4>
                  <p>should include, but not limited to, Fire Brigade Report, Pictures of Loss, Police Report etc</p>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">CAUSE OF FIRE</h4>
                  <p>should be explicitly stated and where the cause is not discovered, any suspicions should be clearly stated.</p>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">BUILDINGS:</h4>
                  <p>If the Claim is in respect of a Building, the Claim must be accompanied by 2 Builders' Estimates obtained at the Insured's own expense of the cost of putting the Building into the same state it was in prior to the occurrence – no contemplated improvements may be included in such estimate.</p>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">CONTENTS:</h4>
                  <p>If the Claims are for contents i.e. Goods, Merchandise, Furniture etc., a full list of the Articles destroyed or damaged must be given and against each item must be declared:</p>
                  <ol className="list-decimal ml-6 mt-2 space-y-1">
                    <li>Their original Cost Price</li>
                    <li>Their value immediately before the Occurrence (after making due allowance for "wear and tear")</li>
                    <li>Their value (if any) after the occurrence or "Value of Salvage"</li>
                    <li>The difference between 2 and 3, which will be the net amount of loss sustained.</li>
                  </ol>
                  <p className="mt-3">In the case of Claims for STOCK-IN-TRADE, COST PRICES (after deduction of all Discounts and Trade Allowances for Cash Payments) are alone recognized in estimating sound values.</p>
                </div>
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button 
                onClick={() => setShowInstructions(false)}
                className="w-full"
              >
                Continue
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <MultiStepForm
          steps={steps}
          onSubmit={onFinalSubmit}
          formMethods={formMethods}
          stepFieldMappings={stepFieldMappings}
        />

        {/* Summary Dialog */}
        <Dialog open={showSummary} onOpenChange={setShowSummary}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Review Your Fire and Special Perils Claim Submission</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><strong>Policy Number:</strong> {watchedValues.policyNumber}</div>
                <div><strong>Name:</strong> {watchedValues.name}</div>
                <div><strong>Email:</strong> {watchedValues.email}</div>
                <div><strong>Premises Contents Value:</strong> ₦{watchedValues.premisesContentsValue?.toLocaleString()}</div>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-blue-800">
                  For claims status enquiries, call 01 448 9570
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowSummary(false)}>
                Back to Edit
              </Button>
              <Button onClick={() => handleSubmit(formMethods.getValues())} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Claim'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Success Modal */}
        <SuccessModal
          isOpen={showSuccess || authShowSuccess || authSubmitting}
          onClose={() => {
            setShowSuccess(false);
            setAuthShowSuccess();
          }}
          title="Fire Special Perils Claim Submitted!"
          formType="Fire Special Perils Claim"
          isLoading={authSubmitting}
          loadingMessage="Your fire special perils claim is being processed and submitted..."
        />
      </div>

      {/* Post-Authentication Loading Overlay */}
      {showPostAuthLoading && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-card p-8 rounded-lg shadow-lg animate-scale-in max-w-md mx-4">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
              <h3 className="text-xl font-semibold text-primary">Processing Your Submission</h3>
              <p className="text-muted-foreground">
                Thank you for signing in! Your fire special perils claim is now being submitted...
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FireSpecialPerilsClaim;
