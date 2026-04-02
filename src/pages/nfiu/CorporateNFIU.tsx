import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useForm, useFieldArray, FormProvider, useFormContext } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { get } from 'lodash'; // CRITICAL for nested errors
import { toast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Check, Info, Loader2, AlertCircle, FileText, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import MultiStepForm from '@/components/common/MultiStepForm';
import { useFormDraft } from '@/hooks/useFormDraft';
import { DocumentUploadSection } from '@/components/gemini/DocumentUploadSection';
import { uploadFile } from '@/services/fileService';
import { useEnhancedFormSubmit } from '@/hooks/useEnhancedFormSubmit';
import FormLoadingModal from '@/components/common/FormLoadingModal';
import FormSummaryDialog from '@/components/common/FormSummaryDialog';
import SuccessModal from '@/components/common/SuccessModal';
import { ErrorModal } from '@/components/common/ErrorModal';
import { VerificationMismatchModal } from '@/components/common/VerificationMismatchModal';
import DatePicker from '@/components/common/DatePicker';
import { useAuth } from '@/contexts/AuthContext';
import { auditService } from '@/services/auditService';
import { useAutoFill } from '@/hooks/useAutoFill';
import { IdentifierType } from '@/types/autoFill';
import { useRealtimeVerificationValidation } from '@/hooks/useRealtimeVerificationValidation';
import { CORPORATE_NFIU_CAC_FIELDS_CONFIG, normalizeDate, normalizeText } from '@/config/realtimeValidationConfig';
import { FieldValidationIndicator } from '@/components/validation/FieldValidationIndicator';
import { ValidationTooltip } from '@/components/validation/ValidationTooltip';
import { ValidationAnnouncer } from '@/components/validation/ValidationAnnouncer';
import { FieldValidationStatus } from '@/types/realtimeVerificationValidation';

// CRITICAL: Define form components OUTSIDE main component to prevent focus loss
const FormField = ({ name, label, required = false, type = "text", maxLength, ...props }: any) => {
  const { register, formState: { errors }, clearErrors } = useFormContext();
  const error = get(errors, name); // CRITICAL: Use lodash.get for nested errors
  
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
  const error = get(errors, name); // CRITICAL: Use lodash.get for nested errors
  
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

const FormSelect = ({ name, label, required = false, options, placeholder, ...props }: any) => {
  const { setValue, watch, formState: { errors }, clearErrors } = useFormContext();
  const value = watch(name);
  const error = get(errors, name); // CRITICAL: Use lodash.get for nested errors
  
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

// Corporate NFIU Schema with comprehensive validation
const corporateNFIUSchema = yup.object().shape({
  // Company Info
  insured: yup.string()
    .required("Company name is required")
    .min(2, "Company name must be at least 2 characters")
    .max(100, "Company name cannot exceed 100 characters"),
  officeAddress: yup.string()
    .required("Office address is required")
    .min(10, "Address must be at least 10 characters")
    .max(500, "Address cannot exceed 500 characters"),
  ownershipOfCompany: yup.string().required("Ownership of company is required"),
  website: yup.string()
    .notRequired()
    .test('valid-url', 'Please enter a valid website URL', function(value) {
      if (!value || value.trim() === '') return true; // Allow empty
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    })
    .max(200, "Website cannot exceed 200 characters"),
  incorporationNumber: yup.string()
    .required("Incorporation number is required")
    .min(6, "Incorporation number must be at least 6 characters")
    .max(20, "Incorporation number cannot exceed 20 characters"),
  incorporationState: yup.string()
    .required("Incorporation state is required")
    .min(2, "State must be at least 2 characters")
    .max(50, "State cannot exceed 50 characters"),
  dateOfIncorporationRegistration: yup.date()
    .required("Date of incorporation is required")
    .test('not-future', 'Date cannot be in the future', function(value) {
      if (!value) return false;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return value <= today;
    })
    .typeError('Please select a valid date'),
  contactPersonNo: yup.string()
    .required("Contact number is required")
    .matches(/^\d+$/, "Phone number must contain only digits")
    .max(15, "Phone number cannot exceed 15 digits"),
  businessTypeOccupation: yup.string()
    .required("Business type is required")
    .min(2, "Business type must be at least 2 characters")
    .max(100, "Business type cannot exceed 100 characters"),
  taxIDNo: yup.string()
    .required("Tax ID is required")
    .matches(/^[\d\-]+$/, "Tax ID must contain only numbers and dashes")
    .max(20, "Tax ID cannot exceed 20 characters"),
  emailAddress: yup.string()
    .required("Email is required")
    .email("Please enter a valid email")
    .typeError("Please enter a valid email"),
  premiumPaymentSource: yup.string().required("Premium payment source is required"),
  premiumPaymentSourceOther: yup.string().when('premiumPaymentSource', {
    is: 'Other',
    then: (schema) => schema.required("Please specify other payment source"),
    otherwise: (schema) => schema.notRequired()
  }),

  // Directors with enhanced validation
  directors: yup.array().of(
    yup.object().shape({
      firstName: yup.string()
        .required("First name is required")
        .min(2, "First name must be at least 2 characters")
        .max(50, "First name cannot exceed 50 characters"),
      middleName: yup.string()
        .max(50, "Middle name cannot exceed 50 characters"),
      lastName: yup.string()
        .required("Last name is required")
        .min(2, "Last name must be at least 2 characters")
        .max(50, "Last name cannot exceed 50 characters"),
      dob: yup.date()
        .required("Date of birth is required")
        .test('age', 'Must be at least 18 years old', function(value) {
          if (!value) return false;
          const today = new Date();
          const eighteenYearsAgo = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
          return value <= eighteenYearsAgo;
        })
        .typeError('Please select a valid date'),
      placeOfBirth: yup.string()
        .required("Place of birth is required")
        .min(2, "Place of birth must be at least 2 characters")
        .max(100, "Place of birth cannot exceed 100 characters"),
      nationality: yup.string().required("Nationality is required"),
      country: yup.string()
        .max(50, "Country cannot exceed 50 characters"),
      occupation: yup.string()
        .required("Occupation is required")
        .min(2, "Occupation must be at least 2 characters")
        .max(100, "Occupation cannot exceed 100 characters"),
      email: yup.string()
        .required("Email is required")
        .email("Please enter a valid email")
        .typeError("Please enter a valid email"),
      phoneNumber: yup.string()
        .required("Phone number is required")
        .matches(/^\d+$/, "Phone number must contain only digits")
        .max(15, "Phone number cannot exceed 15 digits"),

      NINNumber: yup.string()
        .required("NIN is required")
        .matches(/^\d+$/, "NIN must contain only digits")
        .length(11, "NIN must be exactly 11 digits"),
      residentialAddress: yup.string()
        .required("Residential address is required")
        .min(10, "Address must be at least 10 characters")
        .max(500, "Address cannot exceed 500 characters"),
      taxIDNumber: yup.string()
        .matches(/^[\d\-]*$/, "Tax ID must contain only numbers and dashes")
        .max(20, "Tax ID cannot exceed 20 characters"),
      idType: yup.string().required("ID type is required"),
      idNumber: yup.string()
        .required("Identification number is required")
        .min(1, "Identification number is required")
        .max(50, "Identification number cannot exceed 50 characters"),
      issuingBody: yup.string()
        .required("Issuing body is required")
        .min(2, "Issuing body must be at least 2 characters")
        .max(100, "Issuing body cannot exceed 100 characters"),
      issuedDate: yup.date()
        .required("Issued date is required")
        .test('not-future', 'Date cannot be in the future', function(value) {
          if (!value) return false;
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          return value <= today;
        })
        .typeError('Please select a valid date'),
      expiryDate: yup.date()
        .test('not-past', 'Expiry date cannot be in the past', function(value) {
          if (!value) return true; // Optional field
          const today = new Date();
          today.setHours(23, 59, 59, 999);
          return value > today;
        })
        .typeError('Please select a valid date'),
      sourceOfIncome: yup.string().required("Source of income is required"),
      sourceOfIncomeOther: yup.string().when('sourceOfIncome', {
        is: 'Other',
        then: (schema) => schema.required("Please specify other income source"),
        otherwise: (schema) => schema.notRequired()
      })
    })
  ).min(1, "At least one director is required"),

  // Account Details - Local (Naira) Account
  localBankName: yup.string()
    .required("Bank name is required")
    .min(2, "Bank name must be at least 2 characters")
    .max(100, "Bank name cannot exceed 100 characters"),
  localAccountNumber: yup.string()
    .required("Account number is required")
    .matches(/^\d+$/, "Account number must contain only digits")
    .length(10, "Account number must be exactly 10 digits"),
  localBankBranch: yup.string()
    .required("Bank branch is required")
    .min(2, "Bank branch must be at least 2 characters")
    .max(100, "Bank branch cannot exceed 100 characters"),
  localAccountOpeningDate: yup.date()
    .required("Account opening date is required")
    .test('not-future', 'Date cannot be in the future', function(value) {
      if (!value) return false;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return value <= today;
    })
    .typeError('Please select a valid date'),

  // Foreign Account (optional)
  foreignBankName: yup.string()
    .max(100, "Bank name cannot exceed 100 characters"),
  foreignAccountNumber: yup.string()
    .matches(/^[\d\-]*$/, "Account number must contain only numbers and dashes")
    .max(30, "Account number cannot exceed 30 characters"),
  foreignBankBranch: yup.string()
    .max(100, "Bank branch cannot exceed 100 characters"),
  foreignAccountOpeningDate: yup.date()
    .test('not-future', 'Date cannot be in the future', function(value) {
      if (!value) return true; // Optional field
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return value <= today;
    })
    .typeError('Please select a valid date'),

  // File uploads
  verificationDocUrl: yup.mixed()
    .required("CAC verification document upload is required")
    .test('fileRequired', 'CAC verification document upload is required', function(value) {
      return value instanceof File || (typeof value === 'string' && value.length > 0);
    }),

  // Declaration
  agreeToDataPrivacy: yup.boolean().oneOf([true], "You must agree to data privacy"),
  signature: yup.string()
    .required("Digital signature is required")
    .min(3, "Signature must be at least 3 characters")
    .max(100, "Signature cannot exceed 100 characters")
});

const CorporateNFIU: React.FC = () => {
  const { user } = useAuth();
  const isAuthenticated = user !== null && user !== undefined;
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File>>({});
  const [verificationResults, setVerificationResults] = useState<Record<string, any>>({});
  const formRef = useRef<HTMLFormElement>(null);
  const cacInputRef = useRef<HTMLInputElement>(null);
  
  // Store refs for each director's NIN field
  const directorNinRefs = useRef<Map<number, HTMLInputElement>>(new Map());

  const defaultDirector = {
    firstName: '',
    middleName: '',
    lastName: '',
    dob: undefined,
    placeOfBirth: '',
    nationality: '',
    country: '',
    occupation: '',
    email: '',
    phoneNumber: '',
    NINNumber: '',
    residentialAddress: '',
    taxIDNumber: '',
    idType: '',
    idNumber: '',
    issuingBody: '',
    issuedDate: undefined,
    expiryDate: undefined,
    sourceOfIncome: '',
    sourceOfIncomeOther: ''
  };

  const formMethods = useForm<any>({
    resolver: yupResolver(corporateNFIUSchema),
    defaultValues: {
      insured: '',
      officeAddress: '',
      ownershipOfCompany: '',
      website: '',
      incorporationNumber: '',
      incorporationState: '',
      dateOfIncorporationRegistration: undefined,
      contactPersonNo: '',
      businessTypeOccupation: '',
      taxIDNo: '',
      emailAddress: '',
      premiumPaymentSource: '',
      premiumPaymentSourceOther: '',
      directors: [defaultDirector],
      localBankName: '',
      localAccountNumber: '',
      localBankBranch: '',
      localAccountOpeningDate: undefined,
      foreignBankName: '',
      foreignAccountNumber: '',
      foreignBankBranch: '',
      foreignAccountOpeningDate: undefined,
      verificationDocUrl: '',
      agreeToDataPrivacy: false,
      signature: ''
    },
    mode: 'onChange'
  });

  const { fields: directorFields, append: addDirector, remove: removeDirector } = useFieldArray({
    control: formMethods.control,
    name: 'directors'
  });

  const { saveDraft, clearDraft } = useFormDraft('corporateNFIU', formMethods);
  const watchedValues = formMethods.watch();

  // Initialize autofill for CAC - only for authenticated users
  const autoFillState = useAutoFill({
    formElement: formRef.current,
    identifierType: IdentifierType.CAC,
    userId: user?.uid,
    formId: 'nfiu-corporate',
    userName: user?.name || undefined,
    userEmail: user?.email || undefined,
    reactHookFormSetValue: formMethods.setValue,
    requireAuth: true // CRITICAL: Require authentication for autofill
  });

  // Initialize real-time verification validation
  const realtimeValidation = useRealtimeVerificationValidation({
    formType: 'Corporate NFIU',
    identifierFieldName: 'incorporationNumber',
    identifierType: 'CAC',
    fieldsToValidate: CORPORATE_NFIU_CAC_FIELDS_CONFIG,
    formMethods,
    isAuthenticated
  });
  
  // Initialize NIN autofill and validation for directors
  // Only create hooks for directors that exist to avoid performance overhead
  const directorCount = directorFields.length;
  
  // Create hooks for director 0 (always exists)
  const director0AutoFill = useAutoFill({
    formElement: directorCount > 0 ? formRef.current : null, // Only initialize if director exists
    identifierType: IdentifierType.NIN,
    userId: user?.uid,
    formId: 'nfiu-corporate-director-0',
    userName: user?.name || undefined,
    userEmail: user?.email || undefined,
    reactHookFormSetValue: formMethods.setValue,
    requireAuth: true,
    fieldPrefix: 'directors.0.'
  });
  
  const director0Validation = useRealtimeVerificationValidation({
    formType: 'Corporate NFIU' as any,
    identifierFieldName: 'directors.0.NINNumber',
    identifierType: 'NIN',
    fieldsToValidate: [
      { fieldName: 'directors.0.firstName', fieldLabel: 'First Name', verificationKey: 'firstName', normalizer: normalizeText },
      { fieldName: 'directors.0.lastName', fieldLabel: 'Last Name', verificationKey: 'lastName', normalizer: normalizeText },
      { fieldName: 'directors.0.dob', fieldLabel: 'Date of Birth', verificationKey: 'birthdate', normalizer: normalizeDate }
    ],
    formMethods,
    isAuthenticated
  });
  
  // Create hooks for director 1 (only if exists)
  const director1AutoFill = useAutoFill({
    formElement: directorCount > 1 ? formRef.current : null, // Only initialize if director exists
    identifierType: IdentifierType.NIN,
    userId: user?.uid,
    formId: 'nfiu-corporate-director-1',
    userName: user?.name || undefined,
    userEmail: user?.email || undefined,
    reactHookFormSetValue: formMethods.setValue,
    requireAuth: true,
    fieldPrefix: 'directors.1.'
  });
  
  const director1Validation = useRealtimeVerificationValidation({
    formType: 'Corporate NFIU' as any,
    identifierFieldName: 'directors.1.NINNumber',
    identifierType: 'NIN',
    fieldsToValidate: [
      { fieldName: 'directors.1.firstName', fieldLabel: 'First Name', verificationKey: 'firstName', normalizer: normalizeText },
      { fieldName: 'directors.1.lastName', fieldLabel: 'Last Name', verificationKey: 'lastName', normalizer: normalizeText },
      { fieldName: 'directors.1.dob', fieldLabel: 'Date of Birth', verificationKey: 'birthdate', normalizer: normalizeDate }
    ],
    formMethods,
    isAuthenticated
  });
  
  // Create hooks for director 2 (only if exists)
  const director2AutoFill = useAutoFill({
    formElement: directorCount > 2 ? formRef.current : null, // Only initialize if director exists
    identifierType: IdentifierType.NIN,
    userId: user?.uid,
    formId: 'nfiu-corporate-director-2',
    userName: user?.name || undefined,
    userEmail: user?.email || undefined,
    reactHookFormSetValue: formMethods.setValue,
    requireAuth: true,
    fieldPrefix: 'directors.2.'
  });
  
  const director2Validation = useRealtimeVerificationValidation({
    formType: 'Corporate NFIU' as any,
    identifierFieldName: 'directors.2.NINNumber',
    identifierType: 'NIN',
    fieldsToValidate: [
      { fieldName: 'directors.2.firstName', fieldLabel: 'First Name', verificationKey: 'firstName', normalizer: normalizeText },
      { fieldName: 'directors.2.lastName', fieldLabel: 'Last Name', verificationKey: 'lastName', normalizer: normalizeText },
      { fieldName: 'directors.2.dob', fieldLabel: 'Date of Birth', verificationKey: 'birthdate', normalizer: normalizeDate }
    ],
    formMethods,
    isAuthenticated
  });
  
  // Map director index to hooks
  const getDirectorHooks = (index: number) => {
    if (index === 0) return { autoFill: director0AutoFill, validation: director0Validation };
    if (index === 1) return { autoFill: director1AutoFill, validation: director1Validation };
    if (index === 2) return { autoFill: director2AutoFill, validation: director2Validation };
    return null; // For directors beyond index 2, no autofill/validation
  };

  const {
    handleSubmit: handleEnhancedSubmit,
    showSummary,
    setShowSummary,
    showLoading,
    loadingMessage,
    showSuccess,
    showError,
    errorMessage,
    confirmSubmit,
    closeSuccess,
    closeError,
    formData: submissionData,
    isSubmitting,
    showVerificationMismatch,
    verificationMismatchData,
    closeVerificationMismatch
  } = useEnhancedFormSubmit({
    formType: 'Corporate NFIU',
    onSuccess: () => clearDraft(),
    verificationData: {
      identityNumber: formMethods.watch('incorporationNumber'),
      identityType: 'CAC',
      isVerified: autoFillState.state.status === 'success' // Verified if autofill succeeded
    }
  });

  // Watch incorporationNumber to update verificationData
  const incorporationNumber = formMethods.watch('incorporationNumber');

  // Log form view on mount
  useEffect(() => {
    auditService.logFormView({
      userId: user?.uid,
      userRole: user?.role,
      userEmail: user?.email,
      formType: 'nfiu',
      formVariant: 'corporate'
    });
  }, []);

  // Auto-save draft
  useEffect(() => {
    const subscription = formMethods.watch((data) => {
      saveDraft(data);
    });
    return () => subscription.unsubscribe();
  }, [formMethods, saveDraft]);

  // Attach autofill to CAC field when authenticated
  // Attach autofill and real-time validation to CAC field when authenticated
  // Using a ref callback to ensure the element is mounted before attaching
  const cacRefCallback = useCallback((element: HTMLInputElement | null) => {
    if (element && isAuthenticated) {
      console.log('[CorporateNFIU] ===== CAC REF CALLBACK FIRED =====');
      console.log('[CorporateNFIU] CAC input element:', element);
      console.log('[CorporateNFIU] CAC input ID:', element.id);
      console.log('[CorporateNFIU] Is authenticated:', isAuthenticated);
      
      // Store the ref
      cacInputRef.current = element;
      
      // Attach handlers
      autoFillState.attachToField(element);
      realtimeValidation.attachToIdentifierField(element);
      
      console.log('[CorporateNFIU] ✅ Handlers attached successfully');
    } else if (!element) {
      console.log('[CorporateNFIU] CAC ref callback: element unmounted');
    } else {
      console.log('[CorporateNFIU] ⚠️ Cannot attach handlers: not authenticated');
    }
  }, [isAuthenticated, autoFillState.attachToField, realtimeValidation.attachToIdentifierField]);

  // Make toast available globally for MultiStepForm
  useEffect(() => {
    (window as any).toast = toast;
  }, []);

  // Data sanitization (remove undefined values)
  const sanitizeData = (data: any) => {
    const sanitized: any = {};
    
    // Helper function to serialize dates properly
    const serializeValue = (value: any): any => {
      if (value instanceof Date) {
        return value.toISOString();
      }
      if (Array.isArray(value)) {
        return value.map(serializeValue);
      }
      if (value && typeof value === 'object') {
        const serializedObj: any = {};
        Object.keys(value).forEach(key => {
          const serializedValue = serializeValue(value[key]);
          if (serializedValue !== undefined) {
            serializedObj[key] = serializedValue;
          }
        });
        return serializedObj;
      }
      return value;
    };

    Object.keys(data).forEach(key => {
      const serializedValue = serializeValue(data[key]);
      if (serializedValue !== undefined) {
        sanitized[key] = serializedValue;
      }
    });
    
    return sanitized;
  };

  // Main submit handler
  const onFinalSubmit = async (data: any) => {
    try {
      console.log('Form data before sanitization:', data);
      
      const sanitizedData = sanitizeData(data);
      console.log('Sanitized data:', sanitizedData);

      // Prepare file upload data
      const fileUploadPromises: Array<Promise<[string, string]>> = [];
      
      for (const [key, file] of Object.entries(uploadedFiles)) {
        if (file) {
          fileUploadPromises.push(
            uploadFile(file, `corporate-nfiu/${Date.now()}-${file.name}`).then(url => [key, url])
          );
        }
      }

      const fileResults = await Promise.all(fileUploadPromises);
      const fileUrls = Object.fromEntries(fileResults);

      const finalData = {
        ...sanitizedData,
        ...fileUrls,
        status: 'processing',
        formType: 'Corporate NFIU'
      };

      await handleEnhancedSubmit(finalData);
    } catch (error) {
      console.error('Error:', error);
      toast({ title: 'Error', description: error instanceof Error ? error.message : 'Submission failed', variant: 'destructive' });
    }
  };

  // Ownership options
  const ownershipOptions = [
    { value: 'Nigerian', label: 'Nigerian' },
    { value: 'Foreign', label: 'Foreign' },
    { value: 'Both', label: 'Both' }
  ];

  // ID type options
  const idTypeOptions = [
    { value: 'International Passport', label: 'International Passport' },
    { value: 'NIMC', label: 'NIMC' },
    { value: "Driver's Licence", label: "Driver's Licence" },
    { value: 'Voters Card', label: 'Voters Card' }
  ];

  // Income source options
  const incomeSourceOptions = [
    { value: 'Salary or Business Income', label: 'Salary or Business Income' },
    { value: 'Investments or Dividends', label: 'Investments or Dividends' },
    { value: 'Other', label: 'Other' }
  ];

  // Step validation function
  const validateStep = async (stepId: string): Promise<boolean> => {
    if (stepId === 'uploads') {
      // Validate that the CAC verification document is uploaded
      if (!uploadedFiles.verificationDocUrl) {
        toast({
          title: 'Document Required',
          description: 'Please upload the CAC verification document before proceeding.',
          variant: 'destructive'
        });
        return false;
      }
    }
    return true;
  };

  // Step field mappings for validation
  const stepFieldMappings = {
    0: ['insured', 'officeAddress', 'ownershipOfCompany', 'website', 'incorporationNumber', 'incorporationState', 'dateOfIncorporationRegistration', 'contactPersonNo', 'businessTypeOccupation', 'taxIDNo', 'emailAddress', 'premiumPaymentSource', 'premiumPaymentSourceOther'],
    1: ['directors'],
    2: ['localBankName', 'localAccountNumber', 'localBankBranch', 'localAccountOpeningDate', 'foreignBankName', 'foreignAccountNumber', 'foreignBankBranch', 'foreignAccountOpeningDate'],
    3: ['verificationDocUrl'],
    4: ['agreeToDataPrivacy', 'signature']
  };

  const steps = [
    {
      id: 'company',
      title: 'Company Info',
      isValid: realtimeValidation.canProceedToNextStep, // Block navigation if fields are mismatched
      component: (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="insured">
              Insured
              <span className="required-asterisk">*</span>
            </Label>
            <Input
              id="insured"
              maxLength={100}
              {...formMethods.register('insured', {
                onChange: () => {
                  const error = get(formMethods.formState.errors, 'insured');
                  if (error) {
                    formMethods.clearErrors('insured');
                  }
                }
              })}
              {...realtimeValidation.getFieldValidationProps('insured')}
              className={cn(
                get(formMethods.formState.errors, 'insured') && 'border-destructive',
                realtimeValidation.getFieldValidationProps('insured').className
              )}
            />
            {get(formMethods.formState.errors, 'insured') && (
              <p className="text-sm text-destructive">
                {get(formMethods.formState.errors, 'insured')?.message?.toString()}
              </p>
            )}
            <FieldValidationIndicator
              status={realtimeValidation.fieldValidationStates['insured']?.status || FieldValidationStatus.NOT_VERIFIED}
              errorMessage={realtimeValidation.fieldValidationStates['insured']?.errorMessage || null}
              fieldId="insured"
              fieldLabel="Company Name"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="officeAddress">
              Office Address
              <span className="required-asterisk">*</span>
            </Label>
            <Textarea
              id="officeAddress"
              maxLength={500}
              {...formMethods.register('officeAddress', {
                onChange: () => {
                  const error = get(formMethods.formState.errors, 'officeAddress');
                  if (error) {
                    formMethods.clearErrors('officeAddress');
                  }
                }
              })}
              {...realtimeValidation.getFieldValidationProps('officeAddress')}
              className={cn(
                get(formMethods.formState.errors, 'officeAddress') && 'border-destructive',
                realtimeValidation.getFieldValidationProps('officeAddress').className
              )}
            />
            {get(formMethods.formState.errors, 'officeAddress') && (
              <p className="text-sm text-destructive">
                {get(formMethods.formState.errors, 'officeAddress')?.message?.toString()}
              </p>
            )}
            <FieldValidationIndicator
              status={realtimeValidation.fieldValidationStates['officeAddress']?.status || FieldValidationStatus.NOT_VERIFIED}
              errorMessage={realtimeValidation.fieldValidationStates['officeAddress']?.errorMessage || null}
              fieldId="officeAddress"
              fieldLabel="Office Address"
            />
          </div>
          
          <FormSelect
            name="ownershipOfCompany"
            label="Ownership of Company"
            required={true}
            options={ownershipOptions}
            placeholder="Select Ownership"
          />

          <FormField
            name="website"
            label="Website"
            maxLength={200}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="incorporationNumber">
                CAC/Incorporation Number
                <span className="required-asterisk">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="incorporationNumber"
                  maxLength={20}
                  {...(() => {
                    const { ref, ...rest } = formMethods.register('incorporationNumber', {
                      onChange: () => {
                        const error = get(formMethods.formState.errors, 'incorporationNumber');
                        if (error) {
                          formMethods.clearErrors('incorporationNumber');
                        }
                      }
                    });
                    return {
                      ...rest,
                      ref: (e: HTMLInputElement | null) => {
                        // Call both refs
                        ref(e);
                        cacRefCallback(e);
                      }
                    };
                  })()}
                  className={cn(
                    get(formMethods.formState.errors, 'incorporationNumber') && 'border-destructive',
                    autoFillState.state.status === 'loading' && 'border-blue-500'
                  )}
                />
                {autoFillState.state.status === 'loading' && (
                  <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-blue-500" />
                )}
                {autoFillState.state.status === 'success' && (
                  <Check className="absolute right-3 top-3 h-4 w-4 text-green-500" />
                )}
                {autoFillState.state.status === 'error' && (
                  <AlertCircle className="absolute right-3 top-3 h-4 w-4 text-destructive" />
                )}
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Info className="h-3 w-3" />
                {isAuthenticated 
                  ? "Enter CAC number and press Tab to auto-fill" 
                  : "CAC will be verified when you submit"}
              </p>
              {autoFillState.state.status === 'success' && (
                <p className="text-sm text-green-600 flex items-center gap-1">
                  <Check className="h-4 w-4" />
                  {autoFillState.state.populatedFieldCount} fields auto-filled
                  {autoFillState.state.cached && ' (from cache)'}
                </p>
              )}
              {autoFillState.state.status === 'error' && autoFillState.state.error && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {autoFillState.state.error.message}
                </p>
              )}
              {get(formMethods.formState.errors, 'incorporationNumber') && (
                <p className="text-sm text-destructive">
                  {get(formMethods.formState.errors, 'incorporationNumber')?.message?.toString()}
                </p>
              )}
            </div>
            <FormField
              name="incorporationState"
              label="State of Incorporation"
              required={true}
              maxLength={50}
            />
          </div>
          
          <div className="space-y-2">
            <DatePicker
              name="dateOfIncorporationRegistration"
              label="Date of Incorporation"
              required={true}
              {...realtimeValidation.getFieldValidationProps('dateOfIncorporationRegistration')}
            />
            <FieldValidationIndicator
              status={realtimeValidation.fieldValidationStates['dateOfIncorporationRegistration']?.status || FieldValidationStatus.NOT_VERIFIED}
              errorMessage={realtimeValidation.fieldValidationStates['dateOfIncorporationRegistration']?.errorMessage || null}
              fieldId="dateOfIncorporationRegistration"
              fieldLabel="Incorporation Date"
            />
          </div>
          
          <FormField
            name="contactPersonNo"
            label="Company Contact Number"
            required={true}
            maxLength={15}
          />
          
          <div className="space-y-2">
            <Label htmlFor="businessTypeOccupation">
              Business Type/Occupation
              <span className="required-asterisk">*</span>
            </Label>
            <Input
              id="businessTypeOccupation"
              maxLength={100}
              {...formMethods.register('businessTypeOccupation', {
                onChange: () => {
                  if (formMethods.formState.errors.businessTypeOccupation) {
                    formMethods.clearErrors('businessTypeOccupation');
                  }
                }
              })}
              {...realtimeValidation.getFieldValidationProps('businessTypeOccupation')}
              className={cn(
                formMethods.formState.errors.businessTypeOccupation && 'border-destructive',
                realtimeValidation.getFieldValidationProps('businessTypeOccupation').className
              )}
            />
            {formMethods.formState.errors.businessTypeOccupation && (
              <p className="text-sm text-destructive">{formMethods.formState.errors.businessTypeOccupation.message?.toString()}</p>
            )}
            <FieldValidationIndicator
              status={realtimeValidation.fieldValidationStates['businessTypeOccupation']?.status || FieldValidationStatus.NOT_VERIFIED}
              errorMessage={realtimeValidation.fieldValidationStates['businessTypeOccupation']?.errorMessage || null}
              fieldId="businessTypeOccupation"
              fieldLabel="Business Type/Occupation"
            />
          </div>
          
          <FormField
            name="taxIDNo"
            label="Tax Identification Number"
            required={true}
            maxLength={20}
          />
          
          <FormField
            name="emailAddress"
            label="Email Address of the Company"
            required={true}
            type="email"
            maxLength={100}
          />
          
          <FormSelect
            name="premiumPaymentSource"
            label="Premium Payment Source"
            required={true}
            options={incomeSourceOptions}
            placeholder="Choose Payment Source"
          />

          {watchedValues.premiumPaymentSource === 'Other' && (
            <FormField
              name="premiumPaymentSourceOther"
              label="Please specify other payment source"
              required={true}
              maxLength={100}
            />
          )}
        </div>
      )
    },
    {
      id: 'directors',
      title: 'Directors Info',
      component: (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Directors</h3>
            <Button
              type="button"
              onClick={() => addDirector(defaultDirector)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Director
            </Button>
          </div>
          
          {directorFields.map((field, index) => (
            <Card key={field.id} className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-medium">Director {index + 1}</h4>
                {directorFields.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeDirector(index)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Remove
                  </Button>
                )}
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <FormField
                      name={`directors.${index}.firstName`}
                      label="First Name"
                      required={true}
                      maxLength={50}
                    />
                    <FieldValidationIndicator
                      status={getDirectorHooks(index)?.validation.fieldValidationStates[`directors.${index}.firstName`]?.status || FieldValidationStatus.NOT_VERIFIED}
                      errorMessage={getDirectorHooks(index)?.validation.fieldValidationStates[`directors.${index}.firstName`]?.errorMessage || null}
                      fieldId={`directors.${index}.firstName`}
                      fieldLabel="First Name"
                    />
                  </div>
                  <FormField
                    name={`directors.${index}.middleName`}
                    label="Middle Name"
                    maxLength={50}
                  />
                  <div className="space-y-2">
                    <FormField
                      name={`directors.${index}.lastName`}
                      label="Last Name"
                      required={true}
                      maxLength={50}
                    />
                    <FieldValidationIndicator
                      status={getDirectorHooks(index)?.validation.fieldValidationStates[`directors.${index}.lastName`]?.status || FieldValidationStatus.NOT_VERIFIED}
                      errorMessage={getDirectorHooks(index)?.validation.fieldValidationStates[`directors.${index}.lastName`]?.errorMessage || null}
                      fieldId={`directors.${index}.lastName`}
                      fieldLabel="Last Name"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <DatePicker 
                      name={`directors.${index}.dob`} 
                      label="Date of Birth" 
                      required={true}
                      {...getDirectorHooks(index)?.validation.getFieldValidationProps(`directors.${index}.dob`)}
                    />
                    <FieldValidationIndicator
                      status={getDirectorHooks(index)?.validation.fieldValidationStates[`directors.${index}.dob`]?.status || FieldValidationStatus.NOT_VERIFIED}
                      errorMessage={getDirectorHooks(index)?.validation.fieldValidationStates[`directors.${index}.dob`]?.errorMessage || null}
                      fieldId={`directors.${index}.dob`}
                      fieldLabel="Date of Birth"
                    />
                  </div>
                  <FormField
                    name={`directors.${index}.placeOfBirth`}
                    label="Place Of Birth"
                    required={true}
                    maxLength={100}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    name={`directors.${index}.nationality`}
                    label="Nationality"
                    required={true}
                    maxLength={50}
                  />
                  <FormField
                    name={`directors.${index}.country`}
                    label="Country"
                    maxLength={50}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    name={`directors.${index}.occupation`}
                    label="Occupation"
                    required={true}
                    maxLength={100}
                  />
                  <FormField
                    name={`directors.${index}.email`}
                    label="Email"
                    required={true}
                    type="email"
                    maxLength={100}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    name={`directors.${index}.phoneNumber`}
                    label="Phone Number"
                    required={true}
                    maxLength={15}
                  />
                  <div className="space-y-2">
                    <Label htmlFor={`directors.${index}.NINNumber`}>
                      NIN (National Identification Number)
                      <span className="required-asterisk">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id={`directors.${index}.NINNumber`}
                        maxLength={11}
                        {...(() => {
                          const { ref, ...rest } = formMethods.register(`directors.${index}.NINNumber`, {
                            onChange: () => {
                              const error = get(formMethods.formState.errors, `directors.${index}.NINNumber`);
                              if (error) {
                                formMethods.clearErrors(`directors.${index}.NINNumber`);
                              }
                            }
                          });
                          return {
                            ...rest,
                            ref: (e: HTMLInputElement | null) => {
                              // Call both refs
                              ref(e);
                              // Create and call the ref callback for this director
                              const directorNinRefCallback = (element: HTMLInputElement | null) => {
                                console.log(`[CorporateNFIU] ===== DIRECTOR ${index} NIN REF CALLBACK FIRED =====`);
                                console.log(`[CorporateNFIU] Director ${index} NIN input element:`, element);
                                console.log(`[CorporateNFIU] Director ${index} NIN input ID:`, element?.id);
                                console.log('[CorporateNFIU] Is authenticated:', isAuthenticated);
                                
                                if (element && isAuthenticated) {
                                  console.log(`[CorporateNFIU] Attaching handlers for director ${index}...`);
                                  
                                  // Get the hooks for this director
                                  const hooks = getDirectorHooks(index);
                                  if (hooks) {
                                    // Attach handlers - these add native DOM event listeners
                                    hooks.autoFill.attachToField(element);
                                    hooks.validation.attachToIdentifierField(element);
                                    
                                    console.log(`[CorporateNFIU] ✅ Handlers attached successfully for director ${index}`);
                                  } else {
                                    console.log(`[CorporateNFIU] ⚠️ No hooks available for director ${index}`);
                                  }
                                } else if (!element) {
                                  console.log(`[CorporateNFIU] Director ${index} NIN ref callback: element unmounted`);
                                } else {
                                  console.log(`[CorporateNFIU] ⚠️ Cannot attach handlers for director ${index}: not authenticated`);
                                }
                              };
                              directorNinRefCallback(e);
                            }
                          };
                        })()}
                        className={cn(
                          get(formMethods.formState.errors, `directors.${index}.NINNumber`) && "border-destructive"
                        )}
                      />
                      {(() => {
                        const hooks = getDirectorHooks(index);
                        if (!hooks) return null;
                        return (
                          <>
                            {hooks.autoFill.state.status === 'loading' && (
                              <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-blue-500" />
                            )}
                            {hooks.autoFill.state.status === 'success' && (
                              <Check className="absolute right-3 top-3 h-4 w-4 text-green-500" />
                            )}
                            {hooks.autoFill.state.status === 'error' && (
                              <AlertCircle className="absolute right-3 top-3 h-4 w-4 text-destructive" />
                            )}
                          </>
                        );
                      })()}
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Info className="h-3 w-3" />
                      {isAuthenticated 
                        ? "Enter NIN and press Tab to auto-fill" 
                        : "NIN will be verified when you submit"}
                    </p>
                    {(() => {
                      const hooks = getDirectorHooks(index);
                      if (!hooks) return null;
                      return (
                        <>
                          {hooks.autoFill.state.status === 'success' && (
                            <p className="text-sm text-green-600 flex items-center gap-1">
                              <Check className="h-4 w-4" />
                              {hooks.autoFill.state.populatedFieldCount} fields auto-filled
                              {hooks.autoFill.state.cached && ' (from cache)'}
                            </p>
                          )}
                          {hooks.autoFill.state.status === 'error' && hooks.autoFill.state.error && (
                            <p className="text-sm text-destructive flex items-center gap-1">
                              <AlertCircle className="h-4 w-4" />
                              {hooks.autoFill.state.error.message}
                            </p>
                          )}
                        </>
                      );
                    })()}
                    {get(formMethods.formState.errors, `directors.${index}.NINNumber`) && (
                      <p className="text-sm text-destructive">
                        {get(formMethods.formState.errors, `directors.${index}.NINNumber`)?.message?.toString()}
                      </p>
                    )}
                  </div>
                </div>

                <FormTextarea
                  name={`directors.${index}.residentialAddress`}
                  label="Residential Address"
                  required={true}
                  maxLength={500}
                />

                <FormField
                  name={`directors.${index}.taxIDNumber`}
                  label="Tax ID Number"
                  maxLength={20}
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormSelect
                    name={`directors.${index}.idType`}
                    label="ID Type"
                    required={true}
                    options={idTypeOptions}
                    placeholder="Choose Identification Type"
                  />
                  <FormField
                    name={`directors.${index}.idNumber`}
                    label="Identification Number"
                    required={true}
                    maxLength={50}
                  />
                  <FormField
                    name={`directors.${index}.issuingBody`}
                    label="Issuing Body"
                    required={true}
                    maxLength={100}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <DatePicker 
                    name={`directors.${index}.issuedDate`} 
                    label="Issued Date" 
                    required={true}
                  />
                  <DatePicker 
                    name={`directors.${index}.expiryDate`} 
                    label="Expiry Date"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormSelect
                    name={`directors.${index}.sourceOfIncome`}
                    label="Source of Income"
                    required={true}
                    options={incomeSourceOptions}
                    placeholder="Choose Income Source"
                  />
                  
                  {((formMethods.watch('directors') as any[]) || [])[index]?.sourceOfIncome === 'Other' && (
                    <FormField
                      name={`directors.${index}.sourceOfIncomeOther`}
                      label="Please specify"
                      required={true}
                      maxLength={100}
                    />
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )
    },
    {
      id: 'accounts',
      title: 'Account Details',
      component: (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-4">Naira Account Details (Required)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                name="localBankName"
                label="Bank Name"
                required={true}
                maxLength={100}
              />
              <FormField
                name="localAccountNumber"
                label="Account Number"
                required={true}
                maxLength={10}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <FormField
                name="localBankBranch"
                label="Bank Branch"
                required={true}
                maxLength={100}
              />
              <DatePicker
                name="localAccountOpeningDate"
                label="Account Opening Date"
                required={true}
              />
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-4">Domiciliary Account Details (Optional)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                name="foreignBankName"
                label="Bank Name"
                maxLength={100}
              />
              <FormField
                name="foreignAccountNumber"
                label="Account Number"
                maxLength={30}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <FormField
                name="foreignBankBranch"
                label="Bank Branch"
                maxLength={100}
              />
              <DatePicker
                name="foreignAccountOpeningDate"
                label="Account Opening Date"
              />
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'uploads',
      title: 'Document Uploads',
      component: (
        <div className="space-y-6">
          <div>
            <Label>Upload CAC Verification Document <span className="required-asterisk">*</span></Label>
            <DocumentUploadSection
              formId="corporate-nfiu"
              documentType="cac"
              formData={watchedValues}
              onVerificationComplete={(result) => {
                setVerificationResults(prev => ({
                  ...prev,
                  verificationDocUrl: result
                }));
              }}
              onFileSelect={(file) => {
                setUploadedFiles(prev => ({
                  ...prev,
                  verificationDocUrl: file
                }));
                formMethods.setValue('verificationDocUrl', file);
                if (formMethods.formState.errors.verificationDocUrl) {
                  formMethods.clearErrors('verificationDocUrl');
                }
              }}
              onFileRemove={() => {
                setUploadedFiles(prev => ({
                  ...prev,
                  verificationDocUrl: undefined
                }));
                setVerificationResults(prev => ({
                  ...prev,
                  verificationDocUrl: undefined
                }));
                formMethods.setValue('verificationDocUrl', '');
                formMethods.trigger('verificationDocUrl');
              }}
              currentFile={uploadedFiles.verificationDocUrl}
              verificationResult={verificationResults.verificationDocUrl}
              disabled={isSubmitting}
            />
            {formMethods.formState.errors.verificationDocUrl && (
              <p className="text-sm text-destructive">
                {formMethods.formState.errors.verificationDocUrl.message?.toString()}
              </p>
            )}
          </div>
        </div>
      )
    },
    {
      id: 'declaration',
      title: 'Data Privacy & Declaration',
      component: (
        <div className="space-y-6">
          <div className="p-4 bg-muted rounded-lg">
            <h3 className="font-medium mb-2">Data Privacy</h3>
            <div className="text-sm text-muted-foreground space-y-2">
              <p>i. Your data will solemnly be used for the purposes of this business contract and also to enable us reach you with the updates about our products and services.</p>
              <p>ii. Please note that your personal data will be treated with utmost respect and is well secured as required by Nigeria Data Protection Act 2023.</p>
              <p>iii. Your personal data shall not be shared with or sold to any third-party without your consent unless we are compelled by law or regulator.</p>
            </div>
            
            <h3 className="font-medium mb-2 mt-4">Declaration</h3>
            <div className="text-sm text-muted-foreground space-y-2">
              <p>1. I/We declare to the best of my/our knowledge and belief that the information given on this form is true in every respect and agree that if I/we have made any false or fraudulent statement, be it suppression or concealment, the policy shall be cancelled and the claim shall be forfeited.</p>
              <p>2. I/We agree to provide additional information to NEM Insurance, if required.</p>
              <p>3. I/We agree to submit all required and requested for documents and NEM Insurance shall not be held responsible for any delay in settlement of claim due to non-fulfillment of requirements.</p>
            </div>
          </div>
          
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
              I agree to the data privacy terms and declaration and confirm that all information provided is true and accurate to the best of my knowledge <span className="required-asterisk">*</span>
            </Label>
          </div>
          {formMethods.formState.errors.agreeToDataPrivacy && (
            <p className="text-sm text-destructive">
              {formMethods.formState.errors.agreeToDataPrivacy.message?.toString()}
            </p>
          )}
          
          <FormField
            name="signature"
            label="Digital Signature"
            required={true}
            placeholder="Type your full name as signature"
            maxLength={100}
          />
        </div>
      )
    }
  ];

  return (
    <FormProvider {...formMethods}>
      <form ref={formRef}>
        {/* Accessibility: Screen reader announcements for validation state changes */}
        <ValidationAnnouncer
          fieldValidationStates={realtimeValidation.fieldValidationStates}
          fieldLabels={realtimeValidation.fieldLabels}
        />
        
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-6xl mx-auto">
            <CardHeader>
              <CardTitle>Corporate NFIU Form</CardTitle>
              <CardDescription>NFIU forms are for regulatory reporting to the Nigerian Financial Intelligence Unit</CardDescription>
            </CardHeader>
            <CardContent>
              <MultiStepForm
                steps={steps}
                onSubmit={onFinalSubmit}
                formMethods={formMethods}
                submitButtonText="Submit Corporate NFIU"
                stepFieldMappings={stepFieldMappings}
                validateStep={async (stepId) => {
                  // For company information step, check real-time validation
                  if (stepId === 'company') {
                    if (!realtimeValidation.canProceedToNextStep) {
                      // Show toast with mismatched fields
                      toast({
                        title: 'Please correct highlighted fields',
                        description: `The following fields need correction: ${realtimeValidation.mismatchedFieldLabels.join(', ')}`,
                        variant: 'destructive'
                      });
                      return false;
                    }
                  }
                  
                  // For uploads step, validate that the CAC verification document is uploaded
                  if (stepId === 'uploads') {
                    if (!uploadedFiles.verificationDocUrl) {
                      toast({
                        title: 'Document Required',
                        description: 'Please upload the CAC verification document before proceeding.',
                        variant: 'destructive'
                      });
                      return false;
                    }
                  }
                  
                  return true;
                }}
              />
            </CardContent>
          </Card>

        <FormLoadingModal isOpen={showLoading} message={loadingMessage} />
        
        <FormSummaryDialog
          open={showSummary}
          onOpenChange={setShowSummary}
          formData={submissionData}
          formType="Corporate NFIU"
          onConfirm={confirmSubmit}
          isSubmitting={isSubmitting}
          renderSummary={(data) => {
            if (!data) return <div className="text-center py-8 text-gray-500">No data to display</div>;
            
            return (
              <div className="space-y-6">
                {/* Company Information */}
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold text-lg mb-3">Company Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-600">Company Name:</span>
                      <p className="text-gray-900">{data.insured || 'Not provided'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Incorporation Number:</span>
                      <p className="text-gray-900">{data.incorporationNumber || 'Not provided'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Incorporation State:</span>
                      <p className="text-gray-900">{data.incorporationState || 'Not provided'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Date of Incorporation:</span>
                      <p className="text-gray-900">{data.dateOfIncorporationRegistration ? format(new Date(data.dateOfIncorporationRegistration), 'dd/MM/yyyy') : 'Not provided'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Ownership:</span>
                      <p className="text-gray-900">{data.ownershipOfCompany || 'Not provided'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Business Type:</span>
                      <p className="text-gray-900">{data.businessTypeOccupation || 'Not provided'}</p>
                    </div>
                    <div className="md:col-span-2">
                      <span className="font-medium text-gray-600">Office Address:</span>
                      <p className="text-gray-900">{data.officeAddress || 'Not provided'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Email:</span>
                      <p className="text-gray-900">{data.emailAddress || 'Not provided'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Contact Number:</span>
                      <p className="text-gray-900">{data.contactPersonNo || 'Not provided'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Website:</span>
                      <p className="text-gray-900">{data.website || 'Not provided'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Tax ID:</span>
                      <p className="text-gray-900">{data.taxIDNo || 'Not provided'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Payment Source:</span>
                      <p className="text-gray-900">{data.premiumPaymentSource === 'Other' ? data.premiumPaymentSourceOther : data.premiumPaymentSource || 'Not provided'}</p>
                    </div>
                  </div>
                </div>

                {/* Directors Information */}
                {data.directors && Array.isArray(data.directors) && data.directors.length > 0 && (
                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold text-lg mb-3">Directors Information</h3>
                    {data.directors.map((director: any, index: number) => (
                      <div key={index} className={index > 0 ? 'mt-4 pt-4 border-t' : ''}>
                        <h4 className="font-medium text-gray-800 mb-2">Director {index + 1}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium text-gray-600">Name:</span>
                            <p className="text-gray-900">{`${director.firstName || ''} ${director.middleName || ''} ${director.lastName || ''}`.trim() || 'Not provided'}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-600">Date of Birth:</span>
                            <p className="text-gray-900">{director.dob ? format(new Date(director.dob), 'dd/MM/yyyy') : 'Not provided'}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-600">Place of Birth:</span>
                            <p className="text-gray-900">{director.placeOfBirth || 'Not provided'}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-600">Nationality:</span>
                            <p className="text-gray-900">{director.nationality || 'Not provided'}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-600">Country:</span>
                            <p className="text-gray-900">{director.country || 'Not provided'}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-600">Occupation:</span>
                            <p className="text-gray-900">{director.occupation || 'Not provided'}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-600">Email:</span>
                            <p className="text-gray-900">{director.email || 'Not provided'}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-600">Phone:</span>
                            <p className="text-gray-900">{director.phoneNumber || 'Not provided'}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-600">NIN:</span>
                            <p className="text-gray-900">{director.NINNumber || 'Not provided'}</p>
                          </div>
                          <div className="md:col-span-2">
                            <span className="font-medium text-gray-600">Residential Address:</span>
                            <p className="text-gray-900">{director.residentialAddress || 'Not provided'}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-600">Tax ID:</span>
                            <p className="text-gray-900">{director.taxIDNumber || 'Not provided'}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-600">ID Type:</span>
                            <p className="text-gray-900">{director.idType || 'Not provided'}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-600">ID Number:</span>
                            <p className="text-gray-900">{director.idNumber || 'Not provided'}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-600">Issuing Body:</span>
                            <p className="text-gray-900">{director.issuingBody || 'Not provided'}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-600">Issued Date:</span>
                            <p className="text-gray-900">{director.issuedDate ? format(new Date(director.issuedDate), 'dd/MM/yyyy') : 'Not provided'}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-600">Expiry Date:</span>
                            <p className="text-gray-900">{director.expiryDate ? format(new Date(director.expiryDate), 'dd/MM/yyyy') : 'Not provided'}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-600">Source of Income:</span>
                            <p className="text-gray-900">{director.sourceOfIncome === 'Other' ? director.sourceOfIncomeOther : director.sourceOfIncome || 'Not provided'}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Bank Details */}
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold text-lg mb-3">Bank Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-600">Bank Name (Naira):</span>
                      <p className="text-gray-900">{data.localBankName || 'Not provided'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Account Number (Naira):</span>
                      <p className="text-gray-900">{data.localAccountNumber || 'Not provided'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Bank Branch (Naira):</span>
                      <p className="text-gray-900">{data.localBankBranch || 'Not provided'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Account Opening Date (Naira):</span>
                      <p className="text-gray-900">{data.localAccountOpeningDate ? format(new Date(data.localAccountOpeningDate), 'dd/MM/yyyy') : 'Not provided'}</p>
                    </div>
                    {data.foreignBankName && (
                      <>
                        <div>
                          <span className="font-medium text-gray-600">Bank Name (Foreign):</span>
                          <p className="text-gray-900">{data.foreignBankName}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">Account Number (Foreign):</span>
                          <p className="text-gray-900">{data.foreignAccountNumber || 'Not provided'}</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Documents */}
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold text-lg mb-3">Uploaded Documents</h3>
                  <div className="space-y-3 text-sm">
                    {data.verificationDocUrl && typeof data.verificationDocUrl === 'string' && data.verificationDocUrl.startsWith('http') ? (
                      <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <FileText className="w-5 h-5 text-green-600" />
                          <div>
                            <p className="font-medium text-green-800">CAC Verification Document</p>
                            <p className="text-green-600 text-xs">Document uploaded successfully</p>
                          </div>
                        </div>
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      </div>
                    ) : (
                      <div className="flex items-center space-x-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                        <FileText className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="font-medium text-gray-600">CAC Verification Document</p>
                          <p className="text-gray-500 text-xs">No document uploaded</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          }}
        />

        <SuccessModal
          isOpen={showSuccess}
          onClose={closeSuccess}
          title="Corporate NFIU Submitted Successfully!"
          message="Your Corporate NFIU form has been submitted successfully."
        />

        <ErrorModal
          isOpen={showError}
          onClose={closeError}
          title="Submission Failed"
          message={errorMessage}
        />

        <VerificationMismatchModal
          open={showVerificationMismatch}
          onClose={closeVerificationMismatch}
          mismatches={verificationMismatchData?.mismatches || []}
          warnings={verificationMismatchData?.warnings || []}
          identityType={verificationMismatchData?.identityType || 'CAC'}
        />
        </div>
      </form>
    </FormProvider>
  );
};

export default CorporateNFIU;
