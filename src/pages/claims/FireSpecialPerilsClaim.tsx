import React, { useState, useEffect } from 'react';
import { useForm, FormProvider, useFormContext } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { get } from 'lodash';
import MultiStepForm from '@/components/common/MultiStepForm';
import FormSection from '@/components/common/FormSection';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { CheckCircle2, Loader2, Trash2, Plus } from 'lucide-react';
import FileUpload from '@/components/common/FileUpload';
import { useFormDraft } from '@/hooks/useFormDraft';
import { uploadFile } from '@/services/fileService';
import { useAuthRequiredSubmit } from '@/hooks/useAuthRequiredSubmit';
import SuccessModal from '@/components/common/SuccessModal';
import { cn } from '@/lib/utils';

interface FireSpecialPerilsClaimData {
  // Policy Details
  policyNumber: string;
  periodOfCoverFrom: string;
  periodOfCoverTo: string;
  
  // Insured Details
  name: string;
  companyName: string;
  title: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  phone: string;
  email: string;
  
  // Loss Details
  premisesAddress: string;
  premisesPhone: string;
  dateOfOccurrence: string;
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
  previousClaimDate: string;
  previousClaimAmount: number;
  
  // Items Lost/Damaged
  itemsLost: Array<{
    sn: number;
    description: string;
    costPrice: number;
    dateOfPurchase: string;
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

const schema = yup.object().shape({
  policyNumber: yup.string().required('Policy number is required'),
  periodOfCoverFrom: yup.string().required('Period of cover start date is required'),
  periodOfCoverTo: yup.string().required('Period of cover end date is required'),
  name: yup.string().required('Name is required'),
  companyName: yup.string(),
  title: yup.string().required('Title is required'),
  dateOfBirth: yup.string().required('Date of birth is required'),
  gender: yup.string().required('Gender is required'),
  address: yup.string().required('Address is required'),
  phone: yup.string().required('Phone number is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  premisesAddress: yup.string().required('Premises address is required'),
  premisesPhone: yup.string().required('Premises phone is required'),
  dateOfOccurrence: yup.string().required('Date of occurrence is required'),
  timeOfOccurrence: yup.string().required('Time of occurrence is required'),
  incidentDescription: yup.string().required('Incident description is required'),
  causeOfFire: yup.string().required('Cause of fire is required'),
  premisesUsedAsPerPolicy: yup.boolean(),
  premisesUsageDetails: yup.string().when('premisesUsedAsPerPolicy', {
    is: false,
    then: (schema) => schema.required('Details required when premises not used as per policy'),
    otherwise: (schema) => schema.notRequired()
  }),
  purposeOfPremises: yup.string().required('Purpose of premises is required'),
  unallowedRiskIntroduced: yup.boolean(),
  unallowedRiskDetails: yup.string().when('unallowedRiskIntroduced', {
    is: true,
    then: (schema) => schema.required('Details required when unallowed risk introduced'),
    otherwise: (schema) => schema.notRequired()
  }),
  measuresWhenFireDiscovered: yup.string().required('Measures taken when fire was discovered is required'),
  soleOwner: yup.boolean(),
  otherOwnersName: yup.string().when('soleOwner', {
    is: false,
    then: (schema) => schema.required('Other owners name required'),
    otherwise: (schema) => schema.notRequired()
  }),
  otherOwnersAddress: yup.string().when('soleOwner', {
    is: false,
    then: (schema) => schema.required('Other owners address required'),
    otherwise: (schema) => schema.notRequired()
  }),
  hasOtherInsurance: yup.boolean(),
  otherInsuranceName: yup.string().when('hasOtherInsurance', {
    is: true,
    then: (schema) => schema.required('Other insurance name required'),
    otherwise: (schema) => schema.notRequired()
  }),
  otherInsuranceAddress: yup.string().when('hasOtherInsurance', {
    is: true,
    then: (schema) => schema.required('Other insurance address required'),
    otherwise: (schema) => schema.notRequired()
  }),
  premisesContentsValue: yup.number().min(0, 'Value must be positive').required('Premises contents value is required'),
  hasPreviousClaim: yup.boolean(),
  previousClaimDate: yup.string().when('hasPreviousClaim', {
    is: true,
    then: (schema) => schema.required('Previous claim date required'),
    otherwise: (schema) => schema.notRequired()
  }),
  previousClaimAmount: yup.number().when('hasPreviousClaim', {
    is: true,
    then: (schema) => schema.min(0, 'Amount must be positive').required('Previous claim amount required'),
    otherwise: (schema) => schema.notRequired()
  }),
  itemsLost: yup.array().of(
    yup.object().shape({
      sn: yup.number(),
      description: yup.string().required('Description is required'),
      costPrice: yup.number().min(0, 'Cost price must be positive').required('Cost price is required'),
      dateOfPurchase: yup.string().required('Date of purchase is required'),
      estimatedValueAtOccurrence: yup.number().min(0, 'Estimated value must be positive').required('Estimated value is required'),
      valueOfSalvage: yup.number().min(0, 'Salvage value must be positive'),
      netAmountClaimed: yup.number().min(0, 'Net amount must be positive'),
    })
  ).min(1, 'At least one item must be added'),
  agreeToDataPrivacy: yup.boolean().oneOf([true], 'You must agree to data privacy'),
  declarationTrue: yup.boolean().oneOf([true], 'You must confirm the declaration is true'),
  signature: yup.string().required('Signature is required'),
});

// Form field components with validation (defined outside main component to prevent focus loss)
const FormField = ({ name, label, required = false, type = "text", maxLength, placeholder, ...props }: any) => {
  const { register, formState: { errors }, clearErrors } = useFormContext();
  const error = get(errors, name);
  
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <Input
        id={name}
        type={type}
        maxLength={maxLength}
        placeholder={placeholder}
        {...register(name, {
          onChange: () => {
            if (error) {
              clearErrors(name);
            }
          }
        })}
        className={cn(error ? 'border-destructive' : '')}
        {...props}
      />
      {error && (
        <p className="text-sm text-destructive">{error.message?.toString()}</p>
      )}
    </div>
  );
};

const FormTextarea = ({ name, label, required = false, maxLength = 2500, placeholder, rows = 3, ...props }: any) => {
  const { register, watch, formState: { errors }, clearErrors } = useFormContext();
  const currentValue = watch(name) || '';
  const error = get(errors, name);
  
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <Textarea
        id={name}
        rows={rows}
        placeholder={placeholder}
        {...register(name, {
          onChange: () => {
            if (error) {
              clearErrors(name);
            }
          }
        })}
        className={cn(error ? 'border-destructive' : '')}
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

const FormSelect = ({ name, label, required = false, placeholder, children, ...props }: any) => {
  const { setValue, watch, formState: { errors }, clearErrors } = useFormContext();
  const value = watch(name);
  const error = get(errors, name);
  
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
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
        <SelectTrigger className={cn(error ? 'border-destructive' : '')}>
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

const FormNumber = ({ name, label, required = false, placeholder, step = "0.01", ...props }: any) => {
  const { register, formState: { errors }, clearErrors } = useFormContext();
  const error = get(errors, name);
  
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <Input
        id={name}
        type="number"
        step={step}
        placeholder={placeholder}
        {...register(name, { 
          valueAsNumber: true,
          onChange: () => {
            if (error) {
              clearErrors(name);
            }
          }
        })}
        className={cn(error ? 'border-destructive' : '')}
        {...props}
      />
      {error && (
        <p className="text-sm text-destructive">{error.message?.toString()}</p>
      )}
    </div>
  );
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

  const formMethods = useForm<FireSpecialPerilsClaimData>({
    resolver: yupResolver(schema as any),
    defaultValues: {
      policyNumber: '',
      periodOfCoverFrom: '',
      periodOfCoverTo: '',
      name: '',
      companyName: '',
      title: '',
      dateOfBirth: '',
      gender: '',
      address: '',
      phone: '',
      email: '',
      premisesAddress: '',
      premisesPhone: '',
      dateOfOccurrence: '',
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
      previousClaimDate: '',
      previousClaimAmount: 0,
      itemsLost: [{ 
        sn: 1, 
        description: '', 
        costPrice: 0, 
        dateOfPurchase: '', 
        estimatedValueAtOccurrence: 0, 
        valueOfSalvage: 0, 
        netAmountClaimed: 0 
      }],
      picturesOfLoss: [],
      additionalDocuments: [],
      agreeToDataPrivacy: false,
      declarationTrue: false,
      signature: ''
    },
    mode: 'onChange'
  });

  const watchedValues = formMethods.watch();
  const { saveDraft, loadDraft, clearDraft } = useFormDraft('fireSpecialPerilsClaim', formMethods);

  // Make toast available globally for MultiStepForm
  useEffect(() => {
    (window as any).toast = toast;
  }, [toast]);

  // Check for pending submission when component mounts
  useEffect(() => {
    const checkPendingSubmission = () => {
      const hasPending = sessionStorage.getItem('pendingSubmission');
      if (hasPending) {
        setShowPostAuthLoading(true);
        // Hide loading after 5 seconds max (in case something goes wrong)
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
    const items = formMethods.getValues('itemsLost');
    let hasChanges = false;
    
    items.forEach((item, index) => {
      const netAmount = (item.estimatedValueAtOccurrence || 0) - (item.valueOfSalvage || 0);
      if (netAmount !== item.netAmountClaimed) {
        formMethods.setValue(`itemsLost.${index}.netAmountClaimed`, netAmount, { shouldValidate: false });
        hasChanges = true;
      }
    });
    
    // Force re-render to show updated values
    if (hasChanges) {
      formMethods.trigger();
    }
  }, [
    watchedValues.itemsLost?.map(item => `${item.estimatedValueAtOccurrence}-${item.valueOfSalvage}`).join(','),
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
    // Check data privacy agreement and signature before showing summary
    if (!data.agreeToDataPrivacy) {
      toast({
        title: "Agreement Required",
        description: "You must agree to the data privacy notice and declaration.",
        variant: "destructive",
      });
      return;
    }

    if (!data.signature || data.signature.trim() === '') {
      toast({
        title: "Signature Required",
        description: "Please provide your digital signature.",
        variant: "destructive",
      });
      return;
    }

    setShowSummary(true);
  };

  const addItem = () => {
    const currentItems = formMethods.getValues('itemsLost');
    const newItem = {
      sn: currentItems.length + 1,
      description: '',
      costPrice: 0,
      dateOfPurchase: '',
      estimatedValueAtOccurrence: 0,
      valueOfSalvage: 0,
      netAmountClaimed: 0
    };
    formMethods.setValue('itemsLost', [...currentItems, newItem]);
  };

  const removeItem = (index: number) => {
    const currentItems = formMethods.getValues('itemsLost');
    if (currentItems.length > 1) {
      const updatedItems = currentItems.filter((_, i) => i !== index);
      // Renumber items
      updatedItems.forEach((item, i) => {
        item.sn = i + 1;
      });
      formMethods.setValue('itemsLost', updatedItems);
    }
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
    8: [], // File uploads
    9: ['agreeToDataPrivacy', 'declarationTrue', 'signature']
  };

  const steps = [
    {
      id: "policy-details",
      title: "Policy Details",
      component: (
        <FormProvider {...formMethods}>
          <FormSection title="Policy Information" description="Enter your policy details">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField name="policyNumber" label="Policy Number" required placeholder="Enter policy number" />
              <div className="grid grid-cols-2 gap-2">
                <FormField name="periodOfCoverFrom" label="Period of Cover From" type="date" required />
                <FormField name="periodOfCoverTo" label="To" type="date" required />
              </div>
            </div>
          </FormSection>
        </FormProvider>
      ),
    },
    {
      id: "insured-details",
      title: "Insured Details",
      component: (
        <FormProvider {...formMethods}>
          <FormSection title="Insured Information" description="Enter your personal/company details">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField name="name" label="Name" required placeholder="Enter full name" />
                <FormField name="companyName" label="Company Name (If applicable)" placeholder="Enter company name (optional)" />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormSelect name="title" label="Title" required placeholder="Select title">
                  <SelectItem value="Mr">Mr</SelectItem>
                  <SelectItem value="Mrs">Mrs</SelectItem>
                  <SelectItem value="Ms">Ms</SelectItem>
                  <SelectItem value="Dr">Dr</SelectItem>
                  <SelectItem value="Chief">Chief</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </FormSelect>
                <FormField name="dateOfBirth" label="Date of Birth" type="date" required />
                <FormSelect name="gender" label="Gender" required placeholder="Select gender">
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </FormSelect>
              </div>

              <FormTextarea name="address" label="Address" required placeholder="Enter full address" rows={3} />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField name="phone" label="Phone Number" required placeholder="Enter phone number" />
                <FormField name="email" label="Email Address" type="email" required placeholder="Enter email address" />
              </div>
            </div>
          </FormSection>
        </FormProvider>
      ),
    },
    {
      id: "loss-details",
      title: "Loss Details",
      component: (
        <FormProvider {...formMethods}>
          <FormSection title="Loss Information" description="Provide details about the incident">
            <div className="space-y-4">
              <FormTextarea name="premisesAddress" label="Full Address of Premises Involved" required placeholder="Enter complete address of affected premises" rows={3} />

              <FormField name="premisesPhone" label="Premises Telephone" required placeholder="Enter premises phone number" />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField name="dateOfOccurrence" label="Date of Occurrence" type="date" required />
                <FormField name="timeOfOccurrence" label="Time of Occurrence" type="time" required />
              </div>

              <FormTextarea name="incidentDescription" label="Incident Description" required placeholder="Describe what happened and the resultant damage" rows={4} />

              <FormTextarea name="causeOfFire" label="Cause of Fire" required placeholder="Describe the cause of fire. Include any suspicious circumstances if cause is undiscovered" rows={3} />
            </div>
          </FormSection>
        </FormProvider>
      ),
    },
    {
      id: "premises-use",
      title: "Premises Use",
      component: (
        <FormProvider {...formMethods}>
          <FormSection title="Premises Usage Information" description="Details about how the premises were being used">
            <div className="space-y-4">
              <div>
                <Label>Was the premises used as per policy? <span className="text-red-500">*</span></Label>
                <div className="flex items-center space-x-4 mt-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="premisesUsedYes"
                      checked={watchedValues.premisesUsedAsPerPolicy === true}
                      onCheckedChange={(checked) => formMethods.setValue('premisesUsedAsPerPolicy', !!checked)}
                    />
                    <Label htmlFor="premisesUsedYes">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="premisesUsedNo"
                      checked={watchedValues.premisesUsedAsPerPolicy === false}
                      onCheckedChange={(checked) => formMethods.setValue('premisesUsedAsPerPolicy', !checked)}
                    />
                    <Label htmlFor="premisesUsedNo">No</Label>
                  </div>
                </div>
              </div>

              {watchedValues.premisesUsedAsPerPolicy === false && (
                <FormTextarea name="premisesUsageDetails" label="If No, Please Provide Details" required placeholder="Explain how the premises was being used differently from the policy" rows={3} />
              )}

              <FormTextarea name="purposeOfPremises" label="Purpose Premises Was Being Used For" required placeholder="Describe the purpose for which the premises was being used" rows={3} />

              <div>
                <Label>Any) Had any element of risk been introduced which was not allowed in the Policy ?</Label>
                <div className="flex items-center space-x-4 mt-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="unallowedRiskYes"
                      checked={watchedValues.unallowedRiskIntroduced === true}
                      onCheckedChange={(checked) => formMethods.setValue('unallowedRiskIntroduced', !!checked)}
                    />
                    <Label htmlFor="unallowedRiskYes">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="unallowedRiskNo"
                      checked={watchedValues.unallowedRiskIntroduced === false}
                      onCheckedChange={(checked) => formMethods.setValue('unallowedRiskIntroduced', !checked)}
                    />
                    <Label htmlFor="unallowedRiskNo">No</Label>
                  </div>
                </div>
              </div>

              {watchedValues.unallowedRiskIntroduced === true && (
                <FormTextarea name="unallowedRiskDetails" label="Please Explain" required placeholder="Describe the unallowed risk element" rows={3} />
              )}

              <FormTextarea name="measuresWhenFireDiscovered" label="Measures Taken When Fire Was Discovered" required placeholder="Describe what actions were taken when the fire was discovered" rows={3} />
            </div>
          </FormSection>
        </FormProvider>
      ),
    },
    {
      id: "property-ownership",
      title: "Property Ownership",
      component: (
        <FormProvider {...formMethods}>
          <FormSection title="Property Ownership Details" description="Information about property ownership">
            <div className="space-y-4">
              <div>
                <Label>Are you the sole owner of the property damaged or destroyed ? <span className="text-red-500">*</span></Label>
                <div className="flex items-center space-x-4 mt-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="soleOwnerYes"
                      checked={watchedValues.soleOwner === true}
                      onCheckedChange={(checked) => formMethods.setValue('soleOwner', !!checked)}
                    />
                    <Label htmlFor="soleOwnerYes">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="soleOwnerNo"
                      checked={watchedValues.soleOwner === false}
                      onCheckedChange={(checked) => formMethods.setValue('soleOwner', !checked)}
                    />
                    <Label htmlFor="soleOwnerNo">No</Label>
                  </div>
                </div>
              </div>

              {watchedValues.soleOwner === false && (
                <div className="space-y-4">
                  <FormField name="otherOwnersName" label="Name of Other Owners" required placeholder="Enter names of other owners" />
                  <FormTextarea name="otherOwnersAddress" label="Address of Other Owners" required placeholder="Enter address of other owners" rows={3} />
                </div>
              )}
            </div>
          </FormSection>
        </FormProvider>
      ),
    },
    {
      id: "other-insurance",
      title: "Other Insurance",
      component: (
        <FormProvider {...formMethods}>
          <FormSection title="Other Insurance Information" description="Details about any other insurance policies">
            <div className="space-y-4">
              <div>
                <Label>At the time of occurrence, were there any other existing insurance covers on the said Property with any other Insurer, whether effected by the Claimant or by any other person ? <span className="text-red-500">*</span></Label>
                <div className="flex items-center space-x-4 mt-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="hasOtherInsuranceYes"
                      checked={watchedValues.hasOtherInsurance === true}
                      onCheckedChange={(checked) => formMethods.setValue('hasOtherInsurance', !!checked)}
                    />
                    <Label htmlFor="hasOtherInsuranceYes">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="hasOtherInsuranceNo"
                      checked={watchedValues.hasOtherInsurance === false}
                      onCheckedChange={(checked) => formMethods.setValue('hasOtherInsurance', !checked)}
                    />
                    <Label htmlFor="hasOtherInsuranceNo">No</Label>
                  </div>
                </div>
              </div>

              {watchedValues.hasOtherInsurance === true && (
                <div className="space-y-4">
                  <FormField name="otherInsuranceName" label="Name of Other Insurer" required placeholder="Enter name of other insurance company" />
                  <FormTextarea name="otherInsuranceAddress" label="Address of Other Insurer" required placeholder="Enter address of other insurance company" rows={3} />
                </div>
              )}
            </div>
          </FormSection>
        </FormProvider>
      ),
    },
    {
      id: "valuation",
      title: "Valuation",
      component: (
        <FormProvider {...formMethods}>
          <FormSection title="Valuation Information" description="Property valuation and previous claim details">
            <div className="space-y-4">
              <FormNumber name="premisesContentsValue" label="At the time of Occurrence, what amount would you value the total contents of the Premises? (₦)" required placeholder="0.00" />

              <div>
                <Label>Have you previously claimed against any insurer in respect of risks covered by this policy? <span className="text-red-500">*</span></Label>
                <div className="flex items-center space-x-4 mt-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="hasPreviousClaimYes"
                      checked={watchedValues.hasPreviousClaim === true}
                      onCheckedChange={(checked) => formMethods.setValue('hasPreviousClaim', !!checked)}
                    />
                    <Label htmlFor="hasPreviousClaimYes">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="hasPreviousClaimNo"
                      checked={watchedValues.hasPreviousClaim === false}
                      onCheckedChange={(checked) => formMethods.setValue('hasPreviousClaim', !checked)}
                    />
                    <Label htmlFor="hasPreviousClaimNo">No</Label>
                  </div>
                </div>
              </div>

              {watchedValues.hasPreviousClaim === true && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField name="previousClaimDate" label="Date of Loss" type="date" required />
                  <FormNumber name="previousClaimAmount" label="Amount of Loss (₦)" required placeholder="0.00" />
                </div>
              )}
            </div>
          </FormSection>
        </FormProvider>
      ),
    },
    {
      id: "items-lost",
      title: "Items Lost or Damaged",
      component: (
        <FormProvider {...formMethods}>
          <FormSection title="Itemized List of Lost/Damaged Property" description="List all items that were lost or damaged">
            <div className="space-y-4">
              {watchedValues.itemsLost?.map((item, index) => (
                <Card key={`item-${index}`} className="p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-medium">Item {index + 1}</h4>
                    {watchedValues.itemsLost.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeItem(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  
                  <div className="space-y-4">
                    <FormTextarea name={`itemsLost.${index}.description`} label="Description" required placeholder="Describe the item" rows={2} />
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormNumber name={`itemsLost.${index}.costPrice`} label="Cost Price (₦)" required placeholder="0.00" />
                      <FormField name={`itemsLost.${index}.dateOfPurchase`} label="Date of Purchase" type="date" required />
                      <FormNumber name={`itemsLost.${index}.estimatedValueAtOccurrence`} label="Estimated Value at Occurrence (₦)" required placeholder="0.00" />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormNumber name={`itemsLost.${index}.valueOfSalvage`} label="Value of Salvage (₦)" placeholder="0.00" />
                      <div className="space-y-2">
                        <Label>Net Amount Claimed (₦)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={item.netAmountClaimed || 0}
                          readOnly
                          className="bg-gray-50"
                        />
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
              
              <Button type="button" variant="outline" onClick={addItem} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Another Item
              </Button>
            </div>
          </FormSection>
        </FormProvider>
      ),
    },
    {
      id: 'file-uploads',
      title: 'File Uploads',
      component: (
        <FormSection title="Required Documents" description="Upload the required supporting documents">
          <div className="space-y-6">
            <FileUpload
              label="Fire Brigade Report *"
              onFileSelect={(file) => setUploadedFiles(prev => ({ ...prev, fireBrigadeReport: file }))}
              currentFile={uploadedFiles.fireBrigadeReport}
              accept=".pdf,.jpg,.jpeg,.png"
              maxSize={5}
            />
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">Pictures of Loss *</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const currentPictures = watchedValues.picturesOfLoss || [];
                    formMethods.setValue('picturesOfLoss', [...currentPictures, null]);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add More Pictures
                </Button>
              </div>
              
              {(watchedValues.picturesOfLoss?.length > 0 ? watchedValues.picturesOfLoss : [null]).map((_, index) => (
                <div key={`picture-${index}`} className="flex items-start gap-4">
                  <div className="flex-1">
                    <FileUpload
                      label={`Picture ${index + 1}`}
                      onFileSelect={(file) => setUploadedFiles(prev => ({ ...prev, [`pictureOfLoss${index + 1}`]: file }))}
                      currentFile={uploadedFiles[`pictureOfLoss${index + 1}`]}
                      accept=".jpg,.jpeg,.png"
                      maxSize={5}
                    />
                  </div>
                  {(watchedValues.picturesOfLoss?.length > 1) && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const currentPictures = watchedValues.picturesOfLoss || [];
                        const updatedPictures = currentPictures.filter((_, i) => i !== index);
                        formMethods.setValue('picturesOfLoss', updatedPictures);
                        
                        // Remove from uploaded files
                        setUploadedFiles(prev => {
                          const updated = { ...prev };
                          delete updated[`pictureOfLoss${index + 1}`];
                          return updated;
                        });
                      }}
                      className="mt-8"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            
            <FileUpload
              label="Police Report *"
              onFileSelect={(file) => setUploadedFiles(prev => ({ ...prev, policeReport: file }))}
              currentFile={uploadedFiles.policeReport}
              accept=".pdf,.jpg,.jpeg,.png"
              maxSize={5}
            />
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">Additional Documents</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const currentDocs = watchedValues.additionalDocuments || [];
                    formMethods.setValue('additionalDocuments', [...currentDocs, null]);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Document
                </Button>
              </div>
              
              {(watchedValues.additionalDocuments?.length > 0) && 
                watchedValues.additionalDocuments.map((_, index) => (
                  <div key={`additional-${index}`} className="flex items-start gap-4">
                    <div className="flex-1">
                      <FileUpload
                        label={`Additional Document ${index + 1}`}
                        onFileSelect={(file) => setUploadedFiles(prev => ({ ...prev, [`additionalDocument${index + 1}`]: file }))}
                        currentFile={uploadedFiles[`additionalDocument${index + 1}`]}
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                        maxSize={5}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const currentDocs = watchedValues.additionalDocuments || [];
                        const updatedDocs = currentDocs.filter((_, i) => i !== index);
                        formMethods.setValue('additionalDocuments', updatedDocs);
                        
                        // Remove from uploaded files
                        setUploadedFiles(prev => {
                          const updated = { ...prev };
                          delete updated[`additionalDocument${index + 1}`];
                          return updated;
                        });
                      }}
                      className="mt-8"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              }
            </div>
            
          </div>
        </FormSection>
      ),
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
                onCheckedChange={(checked) => {
                  formMethods.setValue('declarationTrue', !!checked);
                  if (formMethods.formState.errors.declarationTrue) {
                    formMethods.clearErrors('declarationTrue');
                  }
                }}
                className={cn(formMethods.formState.errors.declarationTrue && "border-destructive")}
              />
              <Label htmlFor="declarationTrue">I agree that statements are true <span className="text-red-500">*</span></Label>
            </div>
            {formMethods.formState.errors.declarationTrue && (
              <p className="text-sm text-destructive">
                {formMethods.formState.errors.declarationTrue.message?.toString()}
              </p>
            )}
            
            <FormField name="signature" label="Signature of policyholder (digital signature)" required placeholder="Type your full name as signature" />
            
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
    <FormProvider {...formMethods}>
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
              <DialogTitle>Confirm Your Submission</DialogTitle>
              <h3 className="font-semibold text-yellow-800">Important Notice</h3>
                <p className="text-sm text-yellow-700 mt-1">
                  Please review all information carefully before submitting. Once submitted, you cannot modify your details.
                </p>
            </DialogHeader>
             
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowSummary(false)}>
                  Back to Edit
                </Button>
                <Button onClick={() => handleSubmit(formMethods.getValues())} disabled={authSubmitting}>
                  {authSubmitting ? (
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
    </FormProvider>
  );
};

export default FireSpecialPerilsClaim;
