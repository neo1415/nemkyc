import React, { useState, useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Calendar as ReactCalendar } from '@/components/ui/calendar';
import { FileText, User, Shield, Signature, CalendarIcon, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import MultiStepForm from '@/components/common/MultiStepForm';
import { useFormDraft } from '@/hooks/useFormDraft';
import FileUpload from '@/components/common/FileUpload';
import { uploadFile } from '@/services/fileService';
import { db } from '@/firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { sendEmail } from '@/services/emailService';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthRequiredSubmit } from '@/hooks/useAuthRequiredSubmit';
import AuthRequiredSubmit from '@/components/common/AuthRequiredSubmit';
import SuccessModal from '@/components/common/SuccessModal';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import _ from 'lodash';

const professionalIndemnitySchema = yup.object().shape({
  // Policy Details
  policyNumber: yup.string().required('Policy number is required'),
  coverageFromDate: yup.date().required('Coverage from date is required'),
  coverageToDate: yup.date().required('Coverage to date is required'),
  
  // Insured Details
  insuredName: yup.string().required('Name of insured is required'),
  companyName: yup.string(),
  title: yup.string().required('Title is required'),
  dateOfBirth: yup.date().required('Date of birth is required'),
  gender: yup.string().required('Gender is required'),
  address: yup.string().required('Address is required'),
  phone: yup.string().required('Phone number is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  
  // Claimant Details
  claimantName: yup.string().required('Claimant name is required'),
  claimantAddress: yup.string().required('Claimant address is required'),
  
  // Retainer Details
  retainerDetails: yup.string().required('Retainer details are required'),
  contractInWriting: yup.string().required('Please specify if contract was in writing'),
  contractDetails: yup.string().when('contractInWriting', {
    is: 'no',
    then: (schema) => schema.required('Contract details are required')
  }),
  workPerformedFrom: yup.date().required('Work performed from date is required'),
  workPerformedTo: yup.date().required('Work performed to date is required'),
  
  // Work Performer Details
  workPerformerName: yup.string().required('Work performer name is required'),
  workPerformerTitle: yup.string().required('Work performer title is required'),
  workPerformerDuties: yup.string().required('Work performer duties are required'),
  workPerformerContact: yup.string().required('Work performer contact is required'),
  
  // Claim Details
  claimNature: yup.string().required('Nature of claim is required'),
  firstAwareDate: yup.date().required('Date first became aware is required'),
  claimMadeDate: yup.date().required('Date claim was made is required'),
  intimationMode: yup.string().required('Please specify if intimation was oral or written'),
  oralDetails: yup.string().when('intimationMode', {
    is: 'oral',
    then: (schema) => schema.required('Oral details are required')
  }),
  amountClaimed: yup.number().required('Amount claimed is required'),
  
  // Response
  responseComments: yup.string().required('Response comments are required'),
  quantumComments: yup.string().required('Quantum comments are required'),
  estimatedLiability: yup.number().required('Estimated liability is required'),
  additionalInfo: yup.string().required('Please specify if you have additional information'),
  additionalDetails: yup.string().when('additionalInfo', {
    is: 'yes',
    then: (schema) => schema.required('Additional details are required')
  }),
  solicitorInstructed: yup.string().required('Please specify if solicitor was instructed'),
  solicitorName: yup.string().when('solicitorInstructed', {
    is: 'yes',
    then: (schema) => schema.required('Solicitor name is required')
  }),
  solicitorAddress: yup.string().when('solicitorInstructed', {
    is: 'yes',
    then: (schema) => schema.required('Solicitor address is required')
  }),
  solicitorCompany: yup.string().when('solicitorInstructed', {
    is: 'yes',
    then: (schema) => schema.required('Solicitor company is required')
  }),
  solicitorRates: yup.string().when('solicitorInstructed', {
    is: 'yes',
    then: (schema) => schema.required('Solicitor rates are required')
  }),
  
  // Declaration
  agreeToDataPrivacy: yup.boolean().oneOf([true], 'You must agree to data privacy'),
  declarationTrue: yup.boolean().oneOf([true], 'You must confirm the declaration is true'),
  signature: yup.string().required('Signature is required'),
});

interface ProfessionalIndemnityClaimData {
  policyNumber: string;
  coverageFromDate: Date;
  coverageToDate: Date;
  insuredName: string;
  companyName?: string;
  title: string;
  dateOfBirth: Date;
  gender: string;
  address: string;
  phone: string;
  email: string;
  claimantName: string;
  claimantAddress: string;
  retainerDetails: string;
  contractInWriting: 'yes' | 'no';
  contractDetails?: string;
  workPerformedFrom: Date;
  workPerformedTo: Date;
  workPerformerName: string;
  workPerformerTitle: string;
  workPerformerDuties: string;
  workPerformerContact: string;
  claimNature: string;
  firstAwareDate: Date;
  claimMadeDate: Date;
  intimationMode: 'oral' | 'written';
  oralDetails?: string;
  amountClaimed: number;
  responseComments: string;
  quantumComments: string;
  estimatedLiability: number;
  additionalInfo: 'yes' | 'no';
  additionalDetails?: string;
  solicitorInstructed: 'yes' | 'no';
  solicitorName?: string;
  solicitorAddress?: string;
  solicitorCompany?: string;
  solicitorRates?: string;
  agreeToDataPrivacy: boolean;
  declarationTrue: boolean;
  signature: string;
}

const defaultValues: Partial<ProfessionalIndemnityClaimData> = {
  policyNumber: '',
  insuredName: '',
  companyName: '',
  title: '',
  gender: '',
  address: '',
  phone: '',
  email: '',
  claimantName: '',
  claimantAddress: '',
  retainerDetails: '',
  contractInWriting: 'no',
  contractDetails: '',
  workPerformerName: '',
  workPerformerTitle: '',
  workPerformerDuties: '',
  workPerformerContact: '',
  claimNature: '',
  intimationMode: 'oral',
  oralDetails: '',
  amountClaimed: 0,
  responseComments: '',
  quantumComments: '',
  estimatedLiability: 0,
  additionalInfo: 'no',
  additionalDetails: '',
  solicitorInstructed: 'no',
  solicitorName: '',
  solicitorAddress: '',
  solicitorCompany: '',
  solicitorRates: '',
  agreeToDataPrivacy: false,
  declarationTrue: false,
  signature: ''
};

const ProfessionalIndemnityClaimForm: React.FC = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [showSummary, setShowSummary] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPostAuthLoading, setShowPostAuthLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File>>({});
  const [editingField, setEditingField] = useState<string | null>(null);
  const { 
    handleSubmitWithAuth, 
    showAuthDialog, 
    showSuccess: authShowSuccess,
    setShowSuccess: setAuthShowSuccess,
    isSubmitting: authSubmitting,
    proceedToSignup,
    dismissAuthDialog,
    formType
  } = useAuthRequiredSubmit();

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

  const formMethods = useForm<any>({
    resolver: yupResolver(professionalIndemnitySchema),
    defaultValues,
    mode: 'onChange'
  });

  // Step validation function
  const validateStep = async (stepId: string): Promise<boolean> => {
    const fieldsToValidate = stepFieldMappings[stepId as keyof typeof stepFieldMappings] || [];
    
    // Get current form values
    const currentValues = formMethods.getValues();
    
    let hasErrors = false;
    const errors: string[] = [];
    
    // Validate each field for this step
    for (const fieldName of fieldsToValidate) {
      try {
        await professionalIndemnitySchema.validateAt(fieldName, currentValues);
      } catch (error: any) {
        hasErrors = true;
        errors.push(error.message);
        formMethods.setError(fieldName, { 
          type: 'manual', 
          message: error.message 
        });
      }
    }
    
    // Handle conditional fields
    if (stepId === 'retainer') {
      if (currentValues.contractInWriting === 'no' && !currentValues.contractDetails?.trim()) {
        hasErrors = true;
        errors.push('Contract details are required when contract is not in writing');
        formMethods.setError('contractDetails', { 
          type: 'manual', 
          message: 'Contract details are required when contract is not in writing' 
        });
      }
    }
    
    if (stepId === 'claim') {
      if (currentValues.intimationMode === 'oral' && !currentValues.oralDetails?.trim()) {
        hasErrors = true;
        errors.push('Oral details are required when intimation was oral');
        formMethods.setError('oralDetails', { 
          type: 'manual', 
          message: 'Oral details are required when intimation was oral' 
        });
      }
    }
    
    if (stepId === 'response') {
      if (currentValues.additionalInfo === 'yes' && !currentValues.additionalDetails?.trim()) {
        hasErrors = true;
        errors.push('Additional details are required');
        formMethods.setError('additionalDetails', { 
          type: 'manual', 
          message: 'Additional details are required' 
        });
      }
      
      if (currentValues.solicitorInstructed === 'yes') {
        const solicitorFields = ['solicitorName', 'solicitorAddress', 'solicitorCompany', 'solicitorRates'];
        for (const field of solicitorFields) {
          if (!currentValues[field]?.trim()) {
            hasErrors = true;
            const fieldLabel = field.replace('solicitor', 'Solicitor ').replace(/([A-Z])/g, ' $1').toLowerCase();
            errors.push(`${fieldLabel} is required when solicitor is instructed`);
            formMethods.setError(field, { 
              type: 'manual', 
              message: `${fieldLabel} is required when solicitor is instructed` 
            });
          }
        }
      }
    }
    
    if (hasErrors) {
      toast({
        title: "Validation Error",
        description: `Please fill in all required fields before proceeding. ${errors.length} error(s) found.`,
        variant: "destructive",
      });
      
      // Focus on first error field
      const firstErrorField = fieldsToValidate.find(field => formMethods.formState.errors[field]);
      if (firstErrorField) {
        const element = document.querySelector(`[name="${firstErrorField}"]`) as HTMLElement;
        if (element) {
          element.focus();
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
      
      return false;
    }
    
    return true;
  };

  const { saveDraft, clearDraft } = useFormDraft('professionalIndemnity', formMethods);
  const watchedValues = formMethods.watch();

  // Auto-save draft
  React.useEffect(() => {
    const subscription = formMethods.watch((data) => {
      saveDraft(data);
    });
    return () => subscription.unsubscribe();
  }, [formMethods, saveDraft]);

  // Main submit handler that checks authentication
  const handleSubmit = async (data: ProfessionalIndemnityClaimData) => {
    // Prepare file upload data
    const fileUploadPromises: Array<Promise<[string, string]>> = [];
    
    for (const [key, file] of Object.entries(uploadedFiles)) {
      if (file) {
        fileUploadPromises.push(
          uploadFile(file, `professional-indemnity-claims/${Date.now()}-${file.name}`).then(url => [key, url])
        );
      }
    }

    const fileResults = await Promise.all(fileUploadPromises);
    const fileUrls = Object.fromEntries(fileResults);

    const finalData = {
      ...data,
      ...fileUrls,
      status: 'processing',
      formType: 'Professional Indemnity Claim'
    };

    await handleSubmitWithAuth(finalData, 'Professional Indemnity Claim');
    clearDraft();
    setShowSummary(false);
  };

  const onFinalSubmit = (data: ProfessionalIndemnityClaimData) => {
    setShowSummary(true);
  };

  // Form Components with Validation
  const FormFieldWrapper = ({ name, label, required = true, children }: { 
    name: string; 
    label: string; 
    required?: boolean; 
    children: React.ReactNode;
  }) => {
    const error = formMethods.formState.errors[name];
    const hasError = !!error;
    
    return (
      <div className="space-y-1">
        <Label className={cn(hasError && "text-destructive")}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
        <div className={cn(hasError && "has-error")}>
          {children}
        </div>
        {hasError && (
          <p className="text-sm text-destructive mt-1">
            {error?.message?.toString()}
          </p>
        )}
      </div>
    );
  };

  const FormInput = ({ name, label, type = "text", placeholder, required = true }: {
    name: string;
    label: string;
    type?: string;
    placeholder?: string;
    required?: boolean;
  }) => {
    const error = formMethods.formState.errors[name];
    const hasError = !!error;
    
    return (
      <FormFieldWrapper name={name} label={label} required={required}>
        <Input
          {...formMethods.register(name)}
          type={type}
          placeholder={placeholder}
          className={cn(hasError && "border-red-500 focus:border-red-500")}
        />
      </FormFieldWrapper>
    );
  };

  const FormTextarea = ({ name, label, placeholder, rows = 3, required = true }: {
    name: string;
    label: string;
    placeholder?: string;
    rows?: number;
    required?: boolean;
  }) => {
    const error = formMethods.formState.errors[name];
    const hasError = !!error;
    
    return (
      <FormFieldWrapper name={name} label={label} required={required}>
        <Textarea
          {...formMethods.register(name)}
          placeholder={placeholder}
          rows={rows}
          className={cn(hasError && "border-red-500 focus:border-red-500")}
        />
      </FormFieldWrapper>
    );
  };

  const FormSelect = ({ name, label, placeholder, children, required = true }: {
    name: string;
    label: string;
    placeholder?: string;
    children: React.ReactNode;
    required?: boolean;
  }) => {
    const error = formMethods.formState.errors[name];
    const hasError = !!error;
    const value = formMethods.watch(name);
    
    return (
      <FormFieldWrapper name={name} label={label} required={required}>
        <Select
          value={value || ''}
          onValueChange={(selectedValue) => {
            formMethods.setValue(name, selectedValue);
            if (hasError) {
              formMethods.clearErrors(name);
            }
          }}
        >
          <SelectTrigger className={cn(hasError && "border-red-500 focus:border-red-500")}>
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {children}
          </SelectContent>
        </Select>
      </FormFieldWrapper>
    );
  };

  const FormDatePicker = ({ name, label, required = true }: {
    name: string;
    label: string;
    required?: boolean;
  }) => {
    const error = formMethods.formState.errors[name];
    const hasError = !!error;
    const value = formMethods.watch(name);
    
    return (
      <FormFieldWrapper name={name} label={label} required={required}>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !value && "text-muted-foreground",
                hasError && "border-red-500"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {value ? format(new Date(value), "PPP") : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <ReactCalendar
              mode="single"
              selected={value ? new Date(value) : undefined}
              onSelect={(date) => {
                formMethods.setValue(name, date);
                if (hasError) {
                  formMethods.clearErrors(name);
                }
              }}
              initialFocus
              className="pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      </FormFieldWrapper>
    );
  };

  const FormCheckbox = ({ name, label, required = true }: {
    name: string;
    label: string;
    required?: boolean;
  }) => {
    const error = formMethods.formState.errors[name];
    const hasError = !!error;
    const value = formMethods.watch(name);
    
    return (
      <div className="space-y-1">
        <div className="flex items-center space-x-2">
          <Checkbox
            id={name}
            checked={value || false}
            onCheckedChange={(checked) => {
              formMethods.setValue(name, !!checked);
              if (hasError) {
                formMethods.clearErrors(name);
              }
            }}
            className={cn(hasError && "border-red-500")}
          />
          <Label 
            htmlFor={name}
            className={cn(hasError && "text-destructive", "text-sm")}
          >
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </Label>
        </div>
        {hasError && (
          <p className="text-sm text-destructive mt-1">
            {error?.message?.toString()}
          </p>
        )}
      </div>
    );
  };

  // Step field mappings for validation
  const stepFieldMappings = {
    policy: ['policyNumber', 'coverageFromDate', 'coverageToDate'],
    insured: ['insuredName', 'title', 'dateOfBirth', 'gender', 'address', 'phone', 'email'],
    claimant: ['claimantName', 'claimantAddress'],
    retainer: ['retainerDetails', 'contractInWriting', 'workPerformedFrom', 'workPerformedTo', 'workPerformerName', 'workPerformerTitle', 'workPerformerDuties', 'workPerformerContact'],
    claim: ['claimNature', 'firstAwareDate', 'claimMadeDate', 'intimationMode', 'amountClaimed'],
    response: ['responseComments', 'quantumComments', 'estimatedLiability', 'additionalInfo', 'solicitorInstructed'],
    declaration: ['agreeToDataPrivacy', 'declarationTrue', 'signature']
  };

  const steps = [
    {
      id: 'policy',
      title: 'Policy Details',
      component: (
        <div className="space-y-4">
          <FormInput
            name="policyNumber"
            label="Policy Number"
            placeholder="Enter policy number"
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormDatePicker
              name="coverageFromDate"
              label="Period of Cover - From"
            />
            <FormDatePicker
              name="coverageToDate"
              label="Period of Cover - To"
            />
          </div>
        </div>
      )
    },
    {
      id: 'insured',
      title: 'Insured Details',
      component: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput
              name="insuredName"
              label="Name of Insured"
              placeholder="Enter name of insured"
            />
            <FormInput
              name="companyName"
              label="Company Name"
              placeholder="Enter company name (if applicable)"
              required={false}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormSelect
              name="title"
              label="Title"
              placeholder="Select title"
            >
              <SelectItem value="Mr">Mr</SelectItem>
              <SelectItem value="Mrs">Mrs</SelectItem>
              <SelectItem value="Chief">Chief</SelectItem>
              <SelectItem value="Dr">Dr</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </FormSelect>
            <FormDatePicker
              name="dateOfBirth"
              label="Date of Birth"
            />
            <FormSelect
              name="gender"
              label="Gender"
              placeholder="Select gender"
            >
              <SelectItem value="Male">Male</SelectItem>
              <SelectItem value="Female">Female</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </FormSelect>
          </div>
          
          <FormTextarea
            name="address"
            label="Address"
            placeholder="Enter full address"
            rows={3}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput
              name="phone"
              label="Phone"
              placeholder="Enter phone number"
            />
            <FormInput
              name="email"
              label="Email"
              type="email"
              placeholder="Enter email address"
            />
          </div>
        </div>
      )
    },
    {
      id: 'claimant',
      title: 'Claimant Details',
      component: (
        <div className="space-y-4">
          <FormInput
            name="claimantName"
            label="Full Name of Claimant"
            placeholder="Enter claimant's full name"
          />
          
          <FormTextarea
            name="claimantAddress"
            label="Address of Claimant"
            placeholder="Enter claimant's full address"
            rows={3}
          />
        </div>
      )
    },
    {
      id: 'retainer',
      title: 'Retainer/Contract Details',
      component: (
        <div className="space-y-4">
          <FormTextarea
            name="retainerDetails"
            label="What were you retained/contracted to do?"
            placeholder="Describe the nature of your professional engagement"
            rows={4}
          />
          
          <FormSelect
            name="contractInWriting"
            label="Was your contract evidenced in writing?"
            placeholder="Select option"
          >
            <SelectItem value="yes">Yes</SelectItem>
            <SelectItem value="no">No</SelectItem>
          </FormSelect>
          
          {watchedValues.contractInWriting === 'yes' && (
            <FileUpload
              label="Contract Document (PDF, max 3MB)"
              onFileSelect={(file) => setUploadedFiles(prev => ({ ...prev, contractDocument: file }))}
              currentFile={uploadedFiles.contractDocument}
              accept=".pdf"
              maxSize={3}
            />
          )}
          
          {watchedValues.contractInWriting === 'no' && (
            <FormTextarea
              name="contractDetails"
              label="Details of contract and its terms"
              placeholder="Describe the contract details and terms"
              rows={4}
            />
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormDatePicker
              name="workPerformedFrom"
              label="When did you perform the work giving rise to the claim? From"
            />
            <FormDatePicker
              name="workPerformedTo"
              label="To"
            />
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg space-y-4">
            <h3 className="font-medium">Who actually performed the work?</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput
                name="workPerformerName"
                label="Name"
                placeholder="Enter name"
              />
              <FormInput
                name="workPerformerTitle"
                label="Title"
                placeholder="Enter title"
              />
              <FormInput
                name="workPerformerDuties"
                label="Duties"
                placeholder="Enter duties"
              />
              <FormInput
                name="workPerformerContact"
                label="Contact"
                placeholder="Enter contact information"
              />
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'claim',
      title: 'Claim Details',
      component: (
        <div className="space-y-4">
          <FormTextarea
            name="claimNature"
            label="Nature of the claim or the circumstances"
            placeholder="Describe the nature of the claim in detail"
            rows={4}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormDatePicker
              name="firstAwareDate"
              label="Date first became aware of the claim"
            />
            <FormDatePicker
              name="claimMadeDate"
              label="Date claim or intimation of claim made to you"
            />
          </div>
          
          <FormSelect
            name="intimationMode"
            label="Was intimation oral or written?"
            placeholder="Select option"
          >
            <SelectItem value="oral">Oral</SelectItem>
            <SelectItem value="written">Written</SelectItem>
          </FormSelect>
          
          {watchedValues.intimationMode === 'written' && (
            <FileUpload
              label="Written Intimation Document (PDF, max 3MB)"
              onFileSelect={(file) => setUploadedFiles(prev => ({ ...prev, writtenIntimation: file }))}
              currentFile={uploadedFiles.writtenIntimation}
              accept=".pdf"
              maxSize={3}
            />
          )}
          
          {watchedValues.intimationMode === 'oral' && (
            <FormTextarea
              name="oralDetails"
              label="Details of oral intimation (first-person details)"
              placeholder="Provide details of the oral intimation"
              rows={3}
            />
          )}
          
          <FormInput
            name="amountClaimed"
            label="Amount claimed"
            type="number"
            placeholder="Enter amount claimed"
          />
        </div>
      )
    },
    {
      id: 'response',
      title: "Insured's Response",
      component: (
        <div className="space-y-4">
          <FormTextarea
            name="responseComments"
            label="Comments in response to the claim"
            placeholder="Provide your response to the claim"
            rows={4}
          />
          
          <FormTextarea
            name="quantumComments"
            label="Comments on the quantum of the claim"
            placeholder="Provide comments on the amount claimed"
            rows={4}
          />
          
          <FormInput
            name="estimatedLiability"
            label="Estimated monetary liability"
            type="number"
            placeholder="Enter estimated liability amount"
          />
          
          <FormSelect
            name="additionalInfo"
            label="Any other details or info that will help insurer?"
            placeholder="Select option"
          >
            <SelectItem value="yes">Yes</SelectItem>
            <SelectItem value="no">No</SelectItem>
          </FormSelect>
          
          {watchedValues.additionalInfo === 'yes' && (
            <div className="space-y-4">
              <FormTextarea
                name="additionalDetails"
                label="Additional details"
                placeholder="Provide additional details"
                rows={3}
              />
              <FileUpload
                label="Additional Document (if needed)"
                onFileSelect={(file) => setUploadedFiles(prev => ({ ...prev, additionalDocument: file }))}
                currentFile={uploadedFiles.additionalDocument}
                accept=".pdf,.jpg,.png"
                maxSize={3}
              />
            </div>
          )}
          
          <FormSelect
            name="solicitorInstructed"
            label="Have you instructed a solicitor?"
            placeholder="Select option"
          >
            <SelectItem value="yes">Yes</SelectItem>
            <SelectItem value="no">No</SelectItem>
          </FormSelect>
          
          {watchedValues.solicitorInstructed === 'yes' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput
                name="solicitorName"
                label="Name"
                placeholder="Enter solicitor name"
              />
              <FormInput
                name="solicitorCompany"
                label="Company"
                placeholder="Enter solicitor company"
              />
              <div className="md:col-span-2">
                <FormTextarea
                  name="solicitorAddress"
                  label="Address"
                  placeholder="Enter solicitor address"
                  rows={2}
                />
              </div>
              <FormInput
                name="solicitorRates"
                label="Rates"
                placeholder="Enter solicitor rates"
              />
            </div>
          )}
        </div>
      )
    },
    {
      id: 'declaration',
      title: 'Declaration & Signature',
      component: (
        <div className="space-y-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Data Privacy</h3>
            <div className="text-sm space-y-2">
              <p>i. Your data will solemnly be used for the purposes of this business contract and also to enable us reach you with the updates about our products and services.</p>
              <p>ii. Please note that your personal data will be treated with utmost respect and is well secured as required by Nigeria Data Protection Regulations 2019.</p>
              <p>iii. Your personal data shall not be shared with or sold to any third-party without your consent unless we are compelled by law or regulator.</p>
            </div>
          </div>
          
          <FormCheckbox
            name="agreeToDataPrivacy"
            label="I agree to the data privacy terms"
          />
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Declaration</h3>
            <div className="text-sm space-y-2">
              <p>1. I/We declare to the best of my/our knowledge and belief that the information given on this form is true in every respect and agree that if I/we have made any false or fraudulent statement, be it suppression or concealment, the policy shall be cancelled and the claim shall be forfeited.</p>
              <p>2. I/We agree to provide additional information to NEM Insurance, if required.</p>
              <p>3. I/We agree to submit all required and requested for documents and NEM Insurance shall not be held responsible for any delay in settlement of claim due to non-fulfillment of requirements.</p>
            </div>
          </div>
          
          <FormCheckbox
            name="declarationTrue"
            label="I agree that statements are true"
          />
          
          <FormInput
            name="signature"
            label="Signature of policyholder (digital signature)"
            placeholder="Type your full name as signature"
          />
          
          <div>
            <Label>Date</Label>
            <Input value={new Date().toISOString().split('T')[0]} disabled />
          </div>
        </div>
      )
    }
  ];

  return (
    <FormProvider {...formMethods}>
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="container mx-auto py-8 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
                <FileText className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight mb-2">Professional Indemnity Claim Form</h1>
              <p className="text-muted-foreground">
                Submit your professional indemnity insurance claim with all required details
              </p>
            </div>

            <MultiStepForm
              steps={steps}
              onSubmit={onFinalSubmit}
              formMethods={formMethods}
              stepFieldMappings={stepFieldMappings}
              validateStep={validateStep}
            />

            {/* Summary Dialog */}
            <Dialog open={showSummary} onOpenChange={setShowSummary}>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Claim Summary</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium">Policy Details</h4>
                    <p className="text-sm text-muted-foreground">Policy: {watchedValues.policyNumber}</p>
                  </div>
                  <div>
                    <h4 className="font-medium">Insured</h4>
                    <p className="text-sm text-muted-foreground">
                      {watchedValues.insuredName} - {watchedValues.email}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium">Claimant</h4>
                    <p className="text-sm text-muted-foreground">
                      {watchedValues.claimantName}
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowSummary(false)}>
                    Back to Edit
                  </Button>
                  <Button onClick={() => handleSubmit(watchedValues)} disabled={isSubmitting}>
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
            
            {/* Auth Required Dialog */}
            <AuthRequiredSubmit
              isOpen={showAuthDialog}
              onClose={dismissAuthDialog}
              onProceedToSignup={proceedToSignup}
              formType={formType}
            />
            
            {/* Success Modal */}
            <SuccessModal
              isOpen={showSuccess || authShowSuccess || authSubmitting}
              onClose={() => {
                setShowSuccess(false);
                setAuthShowSuccess();
              }}
              title="Professional Indemnity Claim Submitted!"
              formType="Professional Indemnity Claim"
              isLoading={authSubmitting}
              loadingMessage="Your professional indemnity claim is being processed and submitted..."
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
                    Thank you for signing in! Your professional indemnity claim is now being submitted...
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </FormProvider>
  );
};

export default ProfessionalIndemnityClaimForm;