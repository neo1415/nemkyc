import React, { useState, useEffect } from 'react';
import { useForm, FormProvider, useFormContext } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { get } from 'lodash';
import { useFormDraft } from '@/hooks/useFormDraft';
import { useToast } from '@/hooks/use-toast';
import { uploadFile } from '@/services/fileService';
import { useAuthRequiredSubmit } from '@/hooks/useAuthRequiredSubmit';
import SuccessModal from '@/components/common/SuccessModal';

import MultiStepForm from '@/components/common/MultiStepForm';
import FileUpload from '@/components/common/FileUpload';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Loader2, Home, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Calendar as ReactCalendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

const rentAssuranceSchema = yup.object({
  policyNumber: yup.string().required('Policy number is required'),
  periodOfCoverFrom: yup.date().required('Period of cover from is required'),
  periodOfCoverTo: yup.date().required('Period of cover to is required'),
  nameOfInsured: yup.string().required('Name of insured is required'),
  address: yup.string().required('Address is required'),
  age: yup
    .number()
    .required('Age is required')
    .min(1, 'Age must be valid'),
  email: yup.string().email('Invalid email').required('Email is required'),
  phone: yup.string().required('Phone number is required'),
  nameOfLandlord: yup.string().required('Name of landlord is required'),
  addressOfLandlord: yup.string().required('Address of landlord is required'),
  livingAtPremisesFrom: yup
    .date()
    .required('Living at premises from date is required'),
  livingAtPremisesTo: yup
    .date()
    .required('Living at premises to date is required'),
  periodOfDefaultFrom: yup
    .date()
    .required('Period of default from is required'),
  periodOfDefaultTo: yup
    .date()
    .required('Period of default to is required'),
  amountDefaulted: yup
    .number()
    .required('Amount defaulted is required')
    .min(0),
  rentDueDate: yup.date().required('Rent due date is required'),
  rentPaymentFrequency: yup
    .string()
    .required('Rent payment frequency is required'),
  rentPaymentFrequencyOther: yup.string().when('rentPaymentFrequency', {
    is: 'other',
    then: (schema) => schema.required('Please specify the frequency'),
    otherwise: (schema) => schema.notRequired(),
  }),
  causeOfInabilityToPay: yup
    .string()
    .required('Cause of inability to pay is required'),
  nameOfBeneficiary: yup
    .string()
    .required('Name of beneficiary is required'),
  beneficiaryAge: yup
    .number()
    .required('Beneficiary age is required')
    .min(1),
  beneficiaryAddress: yup
    .string()
    .required('Beneficiary address is required'),
  beneficiaryEmail: yup
    .string()
    .email('Invalid email')
    .required('Beneficiary email is required'),
  beneficiaryPhone: yup
    .string()
    .required('Beneficiary phone is required'),
  beneficiaryOccupation: yup
    .string()
    .required('Beneficiary occupation is required'),
  // Structured declaration fields
  declarationName: yup
    .string()
    .required('Declaration name is required'),
  declarationPlace: yup
    .string()
    .required('Declaration place is required'),
  declarationAmount: yup
    .number()
    .typeError('Declaration amount must be a number')
    .required('Declaration amount is required')
    .min(0, 'Amount must be valid'),
  declarationYear: yup
    .number()
    .typeError('Year must be a number')
    .required('Declaration year is required')
    .min(1900, 'Enter a valid year')
    .max(2100, 'Enter a valid year'),
  agreeToDataPrivacy: yup
    .boolean()
    .oneOf([true], 'You must agree to the data privacy policy'),
  signature: yup.string().required('Signature is required'),
});

interface RentAssuranceClaimData {
  policyNumber: string;
  periodOfCoverFrom: Date;
  periodOfCoverTo: Date;
  nameOfInsured: string;
  address: string;
  age: number;
  email: string;
  phone: string;
  nameOfLandlord: string;
  addressOfLandlord: string;
  livingAtPremisesFrom: Date;
  livingAtPremisesTo: Date;
  periodOfDefaultFrom: Date;
  periodOfDefaultTo: Date;
  amountDefaulted: number;
  rentDueDate: Date;
  rentPaymentFrequency: string;
  rentPaymentFrequencyOther?: string;
  causeOfInabilityToPay: string;
  nameOfBeneficiary: string;
  beneficiaryAge: number;
  beneficiaryAddress: string;
  beneficiaryEmail: string;
  beneficiaryPhone: string;
  beneficiaryOccupation: string;
  declarationName: string;
  declarationPlace: string;
  declarationAmount: number;
  declarationYear: number;
  declarationStatement?: string;
  agreeToDataPrivacy: boolean;
  signature: string;
}

// Form field components with validation (defined outside main component to prevent focus loss)
const FormField = ({ name, label, required = false, type = "text", placeholder, ...props }: any) => {
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
        placeholder={placeholder}
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

const FormTextarea = ({ name, label, required = false, placeholder, rows = 3, ...props }: any) => {
  const { register, formState: { errors }, clearErrors } = useFormContext();
  const error = get(errors, name);
  
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <Textarea
        id={name}
        placeholder={placeholder}
        rows={rows}
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
        <SelectTrigger className={error ? 'border-destructive' : ''}>
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

const RentAssuranceClaim = () => {
  const { toast } = useToast();
  const [showSummary, setShowSummary] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPostAuthLoading, setShowPostAuthLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File>>({});
  const [fileErrors, setFileErrors] = useState<Record<string, string>>({});
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
    resolver: yupResolver(rentAssuranceSchema),
    defaultValues: {
      policyNumber: '',
      nameOfInsured: '',
      address: '',
      age: 0,
      email: '',
      phone: '',
      nameOfLandlord: '',
      addressOfLandlord: '',
      amountDefaulted: 0,
      rentPaymentFrequency: '',
      rentPaymentFrequencyOther: '',
      causeOfInabilityToPay: '',
      nameOfBeneficiary: '',
      beneficiaryAge: 0,
      beneficiaryAddress: '',
      beneficiaryEmail: '',
      beneficiaryPhone: '',
      beneficiaryOccupation: '',
      declarationName: '',
      declarationPlace: '',
      declarationAmount: 0,
      declarationYear: 0,
      agreeToDataPrivacy: false,
      signature: '',
    },
    mode: 'onChange'
  });

  // Make toast available globally for MultiStepForm
  useEffect(() => {
    (window as any).toast = toast;
  }, [toast]);

  const { saveDraft, clearDraft } = useFormDraft('rentAssuranceClaim', formMethods);
  const watchedValues = formMethods.watch();

  useEffect(() => {
    const subscription = formMethods.watch((data) => {
      saveDraft(data);
    });
    return () => subscription.unsubscribe();
  }, [formMethods, saveDraft]);

  // Main submit handler that checks authentication
  const handleSubmit = async (data: RentAssuranceClaimData) => {
    // Prepare file upload data
    const fileUploadPromises: Array<Promise<[string, string]>> = [];
    
    for (const [key, file] of Object.entries(uploadedFiles)) {
      if (file) {
        fileUploadPromises.push(
          uploadFile(file, `rent-assurance-claims/${Date.now()}-${file.name}`).then(url => [key, url])
        );
      }
    }

    const fileResults = await Promise.all(fileUploadPromises);
    const fileUrls = Object.fromEntries(fileResults);

    const finalData = {
      ...data,
      ...fileUrls,
      declarationStatement: `I ${data.declarationName} of ${data.declarationPlace} do hereby warrant the truth of the answers and particulars given on this form, and that I have withheld no material information and I hereby claim for loss as set out in the Schedule hereto, amounting in all to N${data.declarationAmount}. Dated this Date of 20${data.declarationYear}`,
      status: 'processing',
      formType: 'Rent Assurance Claim'
    };

    await handleSubmitWithAuth(finalData, 'Rent Assurance Claim');
    clearDraft();
    setShowSummary(false);
  };

  const onFinalSubmit = (data: RentAssuranceClaimData) => {
    setShowSummary(true);
  };

  // Step field mappings for validation (by step id)
  const stepFieldMappings: Record<string, string[]> = {
    'policy-details': ['policyNumber', 'periodOfCoverFrom', 'periodOfCoverTo'],
    'insured-details': ['nameOfInsured', 'address', 'age', 'email', 'phone', 'nameOfLandlord', 'addressOfLandlord', 'livingAtPremisesFrom', 'livingAtPremisesTo'],
    'claim-information': ['periodOfDefaultFrom', 'periodOfDefaultTo', 'amountDefaulted', 'rentDueDate', 'rentPaymentFrequency', 'rentPaymentFrequencyOther', 'causeOfInabilityToPay'],
    'beneficiary-details': ['nameOfBeneficiary', 'beneficiaryAge', 'beneficiaryAddress', 'beneficiaryEmail', 'beneficiaryPhone', 'beneficiaryOccupation'],
    'documents': [], // handled via validateStep (rentAgreement required)
    'declaration': ['agreeToDataPrivacy', 'declarationName', 'declarationPlace', 'declarationAmount', 'declarationYear', 'signature'],
  };

  const DatePickerField = ({ name, label }: { name: string; label: string }) => {
    const { setValue, watch, formState: { errors }, clearErrors } = useFormContext();
    const value = watch(name);
    const error = get(errors, name);
    const required = label.includes('*');
    
    return (
      <TooltipProvider>
        <div className="space-y-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Label className="flex items-center gap-1">
                {label}
                {required && <span className="text-red-500">*</span>}
                <Info className="h-3 w-3" />
              </Label>
            </TooltipTrigger>
            <TooltipContent>
              <p>Select the {label.toLowerCase()}</p>
            </TooltipContent>
          </Tooltip>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !value && "text-muted-foreground",
                  error && "border-destructive"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {value ? format(new Date(value), "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <ReactCalendar
                mode="single"
                selected={value ? new Date(value as any) : undefined}
                onSelect={(date) => {
                  setValue(name as any, date);
                  if (error) {
                    clearErrors(name);
                  }
                }}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
          {error && (
            <p className="text-sm text-destructive">{error.message?.toString()}</p>
          )}
        </div>
      </TooltipProvider>
    );
  };

  const validateStep = async (stepId: string) => {
    // Validate mapped fields for this step first
    const fields = (stepFieldMappings as Record<string, string[]>)[stepId] || [];
    let fieldsValid = true;
    if (fields.length > 0) {
      fieldsValid = await formMethods.trigger(fields);
      if (!fieldsValid) {
        if (typeof window !== 'undefined' && (window as any).toast) {
          (window as any).toast({
            title: 'Validation Error',
            description: 'Please fill all required fields before proceeding',
            variant: 'destructive',
          });
        }
        return false;
      }
    }

    // Documents step requires Rent Agreement
    if (stepId === 'documents') {
      if (!uploadedFiles.rentAgreement) {
        setFileErrors(prev => ({ ...prev, rentAgreement: 'Rent agreement is required' }));
        if (typeof window !== 'undefined' && (window as any).toast) {
          (window as any).toast({
            title: 'Required Document',
            description: 'Please upload the rent agreement to proceed.',
            variant: 'destructive',
          });
        }
        return false;
      } else {
        setFileErrors(prev => ({ ...prev, rentAgreement: '' }));
      }
    }

    return true;
  };

  const steps = [
    {
      id: 'policy-details',
      title: 'Policy Details',
      component: (
        <FormProvider {...formMethods}>
          <TooltipProvider>
            <div className="space-y-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <FormField
                      name="policyNumber"
                      label="Policy Number"
                      required
                      placeholder="Enter policy number"
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Enter your rent assurance policy number</p>
                </TooltipContent>
              </Tooltip>
              
              <div>
                <Label>Period of Cover *</Label>
                <div className="grid md:grid-cols-2 gap-4 mt-2">
                  <DatePickerField
                    name="periodOfCoverFrom"
                    label="From *"
                  />
                  <DatePickerField
                    name="periodOfCoverTo"
                    label="To *"
                  />
                </div>
              </div>
            </div>
          </TooltipProvider>
        </FormProvider>
      )
    },
    {
      id: 'insured-details',
      title: 'Insured Details',
      component: (
        <FormProvider {...formMethods}>
          <TooltipProvider>
            <div className="space-y-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <FormField
                      name="nameOfInsured"
                      label="Name of Insured (Tenant)"
                      required
                      placeholder="Enter full name"
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Enter the tenant's full name</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <FormTextarea
                      name="address"
                      label="Address"
                      required
                      placeholder="Enter full address"
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Enter the tenant's full residential address</p>
                </TooltipContent>
              </Tooltip>
              
              <div className="grid md:grid-cols-3 gap-4">
                <FormField
                  name="age"
                  label="Age"
                  required
                  type="number"
                  placeholder="Enter age"
                  onChange={(e: any) => formMethods.setValue('age', Number(e.target.value))}
                />
                <FormField
                  name="email"
                  label="Email"
                  required
                  type="email"
                  placeholder="Enter email address"
                />
                <FormField
                  name="phone"
                  label="Phone"
                  required
                  placeholder="Enter phone number"
                />
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <FormField
                  name="nameOfLandlord"
                  label="Name of Landlord"
                  required
                  placeholder="Enter landlord's name"
                />
                <FormTextarea
                  name="addressOfLandlord"
                  label="Address of Landlord"
                  required
                  placeholder="Enter landlord's address"
                />
              </div>
              
              <div>
                <Label>How long has insured been living at premises *</Label>
                <div className="grid md:grid-cols-2 gap-4 mt-2">
                  <DatePickerField
                    name="livingAtPremisesFrom"
                    label="From *"
                  />
                  <DatePickerField
                    name="livingAtPremisesTo"
                    label="To *"
                  />
                </div>
              </div>
            </div>
          </TooltipProvider>
        </FormProvider>
      )
    },
    {
      id: 'claim-information',
      title: 'Claim Information',
      component: (
        <FormProvider {...formMethods}>
          <TooltipProvider>
            <div className="space-y-4">
              <div>
                <Label>Period of Default *</Label>
                <div className="grid md:grid-cols-2 gap-4 mt-2">
                  <DatePickerField
                    name="periodOfDefaultFrom"
                    label="From *"
                  />
                  <DatePickerField
                    name="periodOfDefaultTo"
                    label="To *"
                  />
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <FormField
                  name="amountDefaulted"
                  label="Amount Defaulted (₦)"
                  required
                  type="number"
                  placeholder="Enter amount"
                  onChange={(e: any) => formMethods.setValue('amountDefaulted', Number(e.target.value))}
                />
                <DatePickerField
                  name="rentDueDate"
                  label="Rent Due Date *"
                />
              </div>
              
              <FormSelect
                name="rentPaymentFrequency"
                label="Frequency of Rent Payment"
                required
                placeholder="Select payment frequency"
              >
                <SelectItem value="yearly">Yearly</SelectItem>
                <SelectItem value="half-yearly">Half-yearly</SelectItem>
                <SelectItem value="biannually">Biannually</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </FormSelect>
              
              {watchedValues.rentPaymentFrequency === 'other' && (
                <FormField
                  name="rentPaymentFrequencyOther"
                  label="Specify Other Frequency"
                  required
                  placeholder="Enter payment frequency"
                />
              )}
              
              <FormTextarea
                name="causeOfInabilityToPay"
                label="Cause of Inability to Pay"
                required
                placeholder="Explain the cause of inability to pay rent"
                rows={4}
              />
            </div>
          </TooltipProvider>
        </FormProvider>
      )
    },
    {
      id: 'beneficiary-details',
      title: 'Beneficiary Details',
      component: (
        <FormProvider {...formMethods}>
          <TooltipProvider>
            <div className="space-y-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <FormField
                      name="nameOfBeneficiary"
                      label="Name of Beneficiary (Landlord)"
                      required
                      placeholder="Enter beneficiary's name"
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Enter the landlord's name as beneficiary</p>
                </TooltipContent>
              </Tooltip>
              
              <div className="grid md:grid-cols-2 gap-4">
                <FormField
                  name="beneficiaryAge"
                  label="Age"
                  required
                  type="number"
                  placeholder="Enter age"
                  onChange={(e: any) => formMethods.setValue('beneficiaryAge', Number(e.target.value))}
                />
                <FormField
                  name="beneficiaryOccupation"
                  label="Occupation"
                  required
                  placeholder="Enter occupation"
                />
              </div>
              
              <FormTextarea
                name="beneficiaryAddress"
                label="Address"
                required
                placeholder="Enter full address"
              />
              
              <div className="grid md:grid-cols-2 gap-4">
                <FormField
                  name="beneficiaryEmail"
                  label="Email"
                  required
                  type="email"
                  placeholder="Enter email address"
                />
                <FormField
                  name="beneficiaryPhone"
                  label="Phone"
                  required
                  placeholder="Enter phone number"
                />
              </div>
            </div>
          </TooltipProvider>
        </FormProvider>
      )
    },
    {
      id: 'documents',
      title: 'File Uploads',
      component: (
        <div className="space-y-6">
          <FileUpload
            label="Rent Agreement"
            required
            error={fileErrors.rentAgreement}
            onFileSelect={(file) => {
              setUploadedFiles(prev => ({ ...prev, rentAgreement: file }));
              setFileErrors(prev => ({ ...prev, rentAgreement: '' }));
            }}
            onFileRemove={() => {
              setUploadedFiles(prev => {
                const copy = { ...prev };
                delete copy.rentAgreement;
                return copy;
              });
              setFileErrors(prev => ({ ...prev, rentAgreement: 'Rent agreement is required' }));
            }}
            currentFile={uploadedFiles.rentAgreement}
            accept=".pdf,.jpg,.jpeg,.png"
            maxSize={3}
          />
          
          <FileUpload
            label="Demand Note"
            onFileSelect={(file) => setUploadedFiles(prev => ({ ...prev, demandNote: file }))}
            currentFile={uploadedFiles.demandNote}
            accept=".pdf,.jpg,.jpeg,.png"
            maxSize={3}
          />
          
          <FileUpload
            label="Quit Notice"
            onFileSelect={(file) => setUploadedFiles(prev => ({ ...prev, quitNotice: file }))}
            currentFile={uploadedFiles.quitNotice}
            accept=".pdf,.jpg,.jpeg,.png"
            maxSize={3}
          />
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm font-medium text-blue-800">
              For claims status enquiries, call 01 448 9570
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'declaration',
      title: 'Privacy and Declaration',
      component: (
        <FormProvider {...formMethods}>
          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Data Privacy</h3>
              <div className="text-sm space-y-2">
                <p><strong>i.</strong> Your data will solemnly be used for the purposes of this business contract and also to enable us reach you with the updates about our products and services.</p>
                <p><strong>ii.</strong> Please note that your personal data will be treated with utmost respect and is well secured as required by Nigeria Data Protection Regulations 2019.</p>
                <p><strong>iii.</strong> Your personal data shall not be shared with or sold to any third-party without your consent unless we are compelled by law or regulator.</p>
              </div>
            </div>
            
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
                I agree to the data privacy policy <span className="text-red-500">*</span>
              </Label>
            </div>
            {formMethods.formState.errors.agreeToDataPrivacy && (
              <p className="text-sm text-destructive">
                {formMethods.formState.errors.agreeToDataPrivacy.message?.toString()}
              </p>
            )}
          </div>
          
          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Declaration</h3>
              <p className="text-sm leading-8">
                I
                <Input
                  {...formMethods.register('declarationName')}
                  placeholder="Declaration name"
                  className="mx-2 inline-block w-56 align-middle"
                />
                of
                <Input
                  {...formMethods.register('declarationPlace')}
                  placeholder="Place"
                  className="mx-2 inline-block w-56 align-middle"
                />
                do hereby warrant the truth of the answers and particulars given on this form, and that I have withheld no material information and I hereby claim for loss as set out in the Schedule hereto, amounting in all to N
                <Input
                  type="number"
                  {...formMethods.register('declarationAmount', { onChange: (e: any) => formMethods.setValue('declarationAmount', Number(e.target.value)) })}
                  placeholder="Amount"
                  className="mx-2 inline-block w-40 align-middle"
                />
                .
                <br />
                Dated this Date of 20
                <Input
                  type="number"
                  {...formMethods.register('declarationYear', { onChange: (e: any) => formMethods.setValue('declarationYear', Number(e.target.value)) })}
                  placeholder="Year"
                  className="mx-2 inline-block w-24 align-middle"
                />
              </p>
              <div className="grid md:grid-cols-2 gap-4 mt-2">
                {formMethods.formState.errors.declarationName && (
                  <p className="text-sm text-destructive">{String(formMethods.formState.errors.declarationName.message)}</p>
                )}
                {formMethods.formState.errors.declarationPlace && (
                  <p className="text-sm text-destructive">{String(formMethods.formState.errors.declarationPlace.message)}</p>
                )}
                {formMethods.formState.errors.declarationAmount && (
                  <p className="text-sm text-destructive">{String(formMethods.formState.errors.declarationAmount.message)}</p>
                )}
                {formMethods.formState.errors.declarationYear && (
                  <p className="text-sm text-destructive">{String(formMethods.formState.errors.declarationYear.message)}</p>
                )}
              </div>
            </div>

            <FormField
              name="signature"
              label="Digital Signature"
              required
              placeholder="Type your full name as digital signature"
            />

            <div className="text-sm text-muted-foreground">
              Date: {new Date().toLocaleDateString()}
            </div>
          </div>
        </FormProvider>
      )
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-3">
            <Home className="h-8 w-8 text-primary" />
            Rent Assurance Policy Claim Form
          </h1>
          <p className="text-gray-600">
            Please fill out all required fields accurately
          </p>
        </div>

        <FormProvider {...formMethods}>
          <MultiStepForm
            steps={steps}
            onSubmit={onFinalSubmit}
            formMethods={formMethods}
            submitButtonText="Submit Rent Assurance Claim"
            stepFieldMappings={stepFieldMappings}
            validateStep={validateStep}
          />
        </FormProvider>

        {/* Summary Dialog */}
        <Dialog open={showSummary} onOpenChange={setShowSummary}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Confirm Your Submission</DialogTitle>
              <h3 className="font-semibold text-yellow-800">Important Notice</h3>
                <p className="text-sm text-yellow-700 mt-1">
                  Please review all information carefully before submitting. Once submitted, you cannot modify your details.
                </p>
            </DialogHeader>
            

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowSummary(false)}>
                Review Again
              </Button>
              <Button 
                onClick={() => handleSubmit(watchedValues)}
                disabled={authSubmitting}
                className="min-w-[120px]"
              >
                {authSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Form'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Success Modal */}
        <SuccessModal
          isOpen={authShowSuccess}
          onClose={() => setAuthShowSuccess()}
          title="Form Submitted Successfully!"
          message="Your form has been received and is being processed. You will receive updates via email and SMS."
          formType="Custom Form"
        />
      </div>
    </div>
  );
};

export default RentAssuranceClaim;
