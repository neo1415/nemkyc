import React, { useState, useEffect, useCallback } from 'react';
import { useForm, useFieldArray, FormProvider, useFormContext } from 'react-hook-form';
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
import { Plus, Trash2, Check, FileText, Loader2, AlertCircle, Info, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { get } from 'lodash';
import MultiStepForm from '@/components/common/MultiStepForm';
import { useFormDraft } from '@/hooks/useFormDraft';
import FileUpload from '@/components/common/FileUpload';
import { uploadFile } from '@/services/fileService';
import { useEnhancedFormSubmit } from '@/hooks/useEnhancedFormSubmit';
import FormLoadingModal from '@/components/common/FormLoadingModal';
import FormSummaryDialog from '@/components/common/FormSummaryDialog';
import SuccessModal from '@/components/common/SuccessModal';
import { ErrorModal } from '@/components/common/ErrorModal';
import { VerificationMismatchModal } from '@/components/common/VerificationMismatchModal';
import DatePicker from '@/components/common/DatePicker';
import { useAuth } from '@/contexts/AuthContext';
import { validateCACFormat, FormatValidationResult } from '@/utils/identityFormatValidator';
import { useAutoFill } from '@/hooks/useAutoFill';
import { IdentifierType } from '@/types/autoFill';
import { auditService } from '@/services/auditService';
import { useRealtimeVerificationValidation } from '@/hooks/useRealtimeVerificationValidation';
import { CAC_FIELDS_CONFIG, normalizeDate, normalizeText } from '@/config/realtimeValidationConfig';
import { FieldValidationIndicator } from '@/components/validation/FieldValidationIndicator';
import { ValidationTooltip } from '@/components/validation/ValidationTooltip';
import { ValidationAnnouncer } from '@/components/validation/ValidationAnnouncer';
import { FieldValidationStatus } from '@/types/realtimeVerificationValidation';
import { DocumentUploadSection } from '@/components/gemini/DocumentUploadSection';

// Form validation schema
const corporateKYCSchema = yup.object().shape({
  // Company Info
  insured: yup.string().required("Insured field is required"),
  officeAddress: yup.string().required("Office address is required"),
  ownershipOfCompany: yup.string().required("Ownership of company is required"),
  contactPerson: yup.string().required("Contact person is required"),
  website: yup.string().notRequired(),
  incorporationState: yup.string().required("Incorporation state is required"),
  dateOfIncorporationRegistration: yup.date()
    .required("Date of incorporation is required")
    .test('not-future', 'Date cannot be in the future', function(value) {
      if (!value) return false;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return value <= today;
    })
    .typeError('Please select a valid date'),
  cacNumber: yup.string()
    .required("CAC/RC number is required")
    .matches(/^[A-Za-z0-9]+$/, "CAC/RC number must contain only letters and numbers"),
  contactPersonNo: yup.string()
    .required("Contact person mobile is required")
    .matches(/^[\d\s+\-()]+$/, "Invalid phone number format")
    .max(15, "Phone number cannot exceed 15 characters"),
  emailAddress: yup.string()
    .required("Email is required")
    .email("Please enter a valid email")
    .typeError("Please enter a valid email"),
  natureOfBusiness: yup.string().required("Business type is required"),
  estimatedTurnover: yup.string().required("Estimated turnover is required"),

  // Directors
  directors: yup.array().of(yup.object().shape({
    firstName: yup.string().required("First name is required"),
    middleName: yup.string(),
    lastName: yup.string().required("Last name is required"),
    dob: yup.date()
      .required("Date of birth is required")
      .test('age', 'Director must be at least 18 years old', function(value) {
        if (!value) return false;
        const today = new Date();
        const eighteenYearsAgo = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
        return value <= eighteenYearsAgo;
      })
      .typeError('Please select a valid date'),
    placeOfBirth: yup.string().required("Place of birth is required"),
    nationality: yup.string().required("Nationality is required"),
    country: yup.string().required("Country is required"),
    occupation: yup.string().required("Occupation is required"),
    email: yup.string()
      .required("Email is required")
      .email("Please enter a valid email")
      .typeError("Please enter a valid email"),
    phoneNumber: yup.string()
      .required("Phone number is required")
      .matches(/^[\d\s+\-()]+$/, "Invalid phone number format")
      .max(15, "Phone number cannot exceed 15 characters"),
    NINNumber: yup.string()
      .required("NIN is required")
      .matches(/^\d+$/, "NIN must contain only numbers")
      .length(11, "NIN must be exactly 11 digits"),
    idType: yup.string().required("ID type is required"),
    idNumber: yup.string().required("Identification number is required"),
    issuingBody: yup.string().required("Issuing body is required"),
    issuedDate: yup.date()
      .required("Issued date is required")
      .test('not-future', 'Issued date cannot be in the future', function(value) {
        if (!value) return false;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return value <= today;
      })
      .typeError('Please select a valid date'),
    expiryDate: yup.date()
      .test('not-past', 'Expiry date cannot be in the past or present', function(value) {
        if (!value) return true; // Optional field
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        return value > today;
      })
      .typeError('Please select a valid date'),
    sourceOfIncome: yup.string().required("Income source is required"),
    sourceOfIncomeOther: yup.string().when('sourceOfIncome', {
      is: 'Other',
      then: (schema) => schema.required('Please specify income source'),
      otherwise: (schema) => schema.notRequired()
    })
  })).min(1, "At least one director is required"),



  // Declaration
  agreeToDataPrivacy: yup.boolean().oneOf([true], "You must agree to data privacy"),
  signature: yup.string().required("Signature is required")
});

const defaultValues = {
  insured: '',
  officeAddress: '',
  ownershipOfCompany: '',
  contactPerson: '',
  website: '',
  incorporationState: '',
  dateOfIncorporationRegistration: undefined,
  cacNumber: '',
  contactPersonNo: '',
  emailAddress: '',
  natureOfBusiness: '',
  estimatedTurnover: '',
  directors: [{
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
    idType: '',
    idNumber: '',
    issuingBody: '',
    issuedDate: undefined,
    expiryDate: undefined,
    sourceOfIncome: '',
    sourceOfIncomeOther: ''
  }],
  agreeToDataPrivacy: false,
  signature: ''
};

// Reusable form components (moved outside component to prevent re-creation)
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

const FormSelect = ({ name, label, required = false, options, placeholder, ...props }: any) => {
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



const CorporateKYC: React.FC = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const isAuthenticated = user !== null && user !== undefined;
  const [currentStep, setCurrentStep] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File>>({});
  const [verificationResults, setVerificationResults] = useState<Record<string, any>>({});
  const [cacValidation, setCacValidation] = useState<FormatValidationResult | null>(null);
  const formRef = React.useRef<HTMLFormElement>(null);
  const cacInputRef = React.useRef<HTMLInputElement>(null);
  
  // Store refs for each director's NIN field
  const directorNinRefs = React.useRef<Map<number, HTMLInputElement>>(new Map());

  const formMethods = useForm<any>({
    resolver: yupResolver(corporateKYCSchema),
    defaultValues,
    mode: 'onChange'
  });

  const { saveDraft, clearDraft } = useFormDraft('corporateKYC', formMethods);
  const { fields, append, remove } = useFieldArray({
    control: formMethods.control,
    name: 'directors'
  });
  const watchedValues = formMethods.watch();

  // Initialize autofill with requireAuth=true for KYC form
  const autoFillState = useAutoFill({
    formElement: formRef.current,
    identifierType: IdentifierType.CAC,
    userId: user?.uid,
    formId: 'kyc-corporate',
    userName: user?.name || undefined,
    userEmail: user?.email || undefined,
    reactHookFormSetValue: formMethods.setValue,
    requireAuth: true // CRITICAL: Require authentication for autofill
  });

  // Initialize real-time verification validation
  const realtimeValidation = useRealtimeVerificationValidation({
    formType: 'Corporate KYC',
    identifierFieldName: 'cacNumber',
    identifierType: 'CAC',
    fieldsToValidate: CAC_FIELDS_CONFIG,
    formMethods,
    isAuthenticated
  });
  
  // Initialize NIN autofill and validation for directors
  // Only create hooks for directors that exist to avoid performance overhead
  const directorCount = fields.length;
  
  // Create hooks for director 0 (always exists)
  const director0AutoFill = useAutoFill({
    formElement: directorCount > 0 ? formRef.current : null, // Only initialize if director exists
    identifierType: IdentifierType.NIN,
    userId: user?.uid,
    formId: 'kyc-corporate-director-0',
    userName: user?.name || undefined,
    userEmail: user?.email || undefined,
    reactHookFormSetValue: formMethods.setValue,
    requireAuth: true,
    fieldPrefix: 'directors.0.'
  });
  
  const director0Validation = useRealtimeVerificationValidation({
    formType: 'Corporate KYC' as any,
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
    formId: 'kyc-corporate-director-1',
    userName: user?.name || undefined,
    userEmail: user?.email || undefined,
    reactHookFormSetValue: formMethods.setValue,
    requireAuth: true,
    fieldPrefix: 'directors.1.'
  });
  
  const director1Validation = useRealtimeVerificationValidation({
    formType: 'Corporate KYC' as any,
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
    formId: 'kyc-corporate-director-2',
    userName: user?.name || undefined,
    userEmail: user?.email || undefined,
    reactHookFormSetValue: formMethods.setValue,
    requireAuth: true,
    fieldPrefix: 'directors.2.'
  });
  
  const director2Validation = useRealtimeVerificationValidation({
    formType: 'Corporate KYC' as any,
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
    confirmSubmit,
    closeSuccess,
    formData: submissionData,
    isSubmitting,
    showVerificationMismatch,
    verificationMismatchData,
    closeVerificationMismatch,
    showError,
    errorMessage,
    closeError
  } = useEnhancedFormSubmit({
    formType: 'Corporate KYC',
    onSuccess: () => clearDraft(),
    verificationData: {
      identityNumber: formMethods.watch('cacNumber'),
      identityType: 'CAC',
      isVerified: autoFillState.state.status === 'success'
    }
  });

  // Log form view on mount
  useEffect(() => {
    auditService.logFormView({
      userId: user?.uid,
      userRole: user?.role,
      userEmail: user?.email,
      formType: 'kyc',
      formVariant: 'corporate'
    });
  }, []);

  // Restore saved step from pending submission
  useEffect(() => {
    // Remove this functionality as getSavedStep is not defined
    // If you need step restoration, implement it properly
  }, []);

  // Auto-save draft
  useEffect(() => {
    const subscription = formMethods.watch((data) => {
      saveDraft(data);
    });
    return () => subscription.unsubscribe();
  }, [formMethods, saveDraft]);

  // Attach autofill and real-time validation to CAC field when authenticated
  // Using a ref callback to ensure the element is mounted before attaching
  const cacRefCallback = useCallback((element: HTMLInputElement | null) => {
    console.log('[CorporateKYC] ===== CAC REF CALLBACK FIRED =====');
    console.log('[CorporateKYC] CAC input element:', element);
    console.log('[CorporateKYC] CAC input ID:', element?.id);
    console.log('[CorporateKYC] Is authenticated:', isAuthenticated);
    
    if (element && isAuthenticated) {
      // Store the ref
      cacInputRef.current = element;
      
      console.log('[CorporateKYC] Attaching handlers...');
      
      // Attach handlers - these add native DOM event listeners
      autoFillState.attachToField(element);
      realtimeValidation.attachToIdentifierField(element);
      
      console.log('[CorporateKYC] ✅ Handlers attached successfully');
    } else if (!element) {
      console.log('[CorporateKYC] CAC ref callback: element unmounted');
    } else {
      console.log('[CorporateKYC] ⚠️ Cannot attach handlers: not authenticated');
    }
  }, [isAuthenticated, autoFillState.attachToField, realtimeValidation.attachToIdentifierField]);

  // CAC change handler with format validation
  const handleCACChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const validation = validateCACFormat(value);
    setCacValidation(validation);
    // Don't call setValue here - let the input's natural onChange handle it
    if (validation.valid) {
      formMethods.clearErrors('cacNumber');
    }
  };

  // Authentication-based messaging for CAC field
  const cacMessage = isAuthenticated
    ? "Enter your CAC and press Tab to auto-fill"
    : "Your CAC will be verified when you submit";

  const onFinalSubmit = async (data: any) => {
    try {
      console.log('Form data before sanitization:', data);
      
      // Sanitize data to remove undefined values
      const sanitizedData = sanitizeData(data);
      console.log('Sanitized data:', sanitizedData);

      // Prepare file upload data
      const fileUploadPromises: Array<Promise<[string, string]>> = [];
      
      for (const [key, file] of Object.entries(uploadedFiles)) {
        if (file) {
          // Log document upload
          await auditService.logDocumentUpload({
            userId: user?.uid,
            userRole: user?.role,
            userEmail: user?.email,
            formType: 'kyc',
            documentType: key,
            fileName: file.name,
            fileSize: file.size
          });
          
          fileUploadPromises.push(
            uploadFile(file, `corporate-kyc/${Date.now()}-${file.name}`).then(url => [key, url])
          );
        }
      }

      const fileResults = await Promise.all(fileUploadPromises);
      const fileUrls = Object.fromEntries(fileResults);

      const finalData = {
        ...sanitizedData,
        ...fileUrls,
        status: 'processing',
        formType: 'Corporate KYC'
      };

      // Log form submission
      const submissionId = `kyc-corporate-${Date.now()}`;
      await auditService.logFormSubmission({
        userId: user?.uid,
        userRole: user?.role,
        userEmail: user?.email,
        formType: 'kyc',
        formVariant: 'corporate',
        submissionId,
        formData: sanitizedData
      });

      await handleEnhancedSubmit(finalData);
    } catch (error) {
      console.error('Error in onFinalSubmit:', error);
      toast({
        title: 'Submission Error',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive'
      });
    }
  };

  // Data sanitization function
  const sanitizeData = (data: any) => {
    const sanitized: any = {};
    Object.keys(data).forEach(key => {
      if (data[key] !== undefined) {
        sanitized[key] = data[key];
      }
    });
    return sanitized;
  };

  // Step field mappings - define which fields belong to each step
  const stepFieldMappings = {
    0: [
      'insured', 'officeAddress', 'ownershipOfCompany', 'contactPerson', 
      'website', 'incorporationState', 'dateOfIncorporationRegistration',
      'cacNumber', 'contactPersonNo', 'emailAddress', 'natureOfBusiness', 
      'estimatedTurnover'
    ],
    1: ['directors'],
    2: [],
    3: ['agreeToDataPrivacy', 'signature']
  };

  const steps = [
    {
      id: 'company',
      title: 'Company Information',
      isValid: realtimeValidation.canProceedToNextStep, // Block navigation if fields are mismatched
      component: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="insured">
                Insured
                <span className="required-asterisk">*</span>
              </Label>
              <Input
                id="insured"
                {...formMethods.register('insured', {
                  onChange: () => {
                    if (formMethods.formState.errors.insured) {
                      formMethods.clearErrors('insured');
                    }
                  }
                })}
                {...realtimeValidation.getFieldValidationProps('insured')}
                className={cn(
                  formMethods.formState.errors.insured && 'border-destructive',
                  realtimeValidation.getFieldValidationProps('insured').className
                )}
              />
              {formMethods.formState.errors.insured && (
                <p className="text-sm text-destructive">{formMethods.formState.errors.insured.message?.toString()}</p>
              )}
              <FieldValidationIndicator
                status={realtimeValidation.fieldValidationStates['insured']?.status || FieldValidationStatus.NOT_VERIFIED}
                errorMessage={realtimeValidation.fieldValidationStates['insured']?.errorMessage || null}
                fieldId="insured"
                fieldLabel="Company Name"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="officeAddress">
              Office Address
              <span className="required-asterisk">*</span>
            </Label>
            <Textarea
              id="officeAddress"
              {...formMethods.register('officeAddress', {
                onChange: () => {
                  if (formMethods.formState.errors.officeAddress) {
                    formMethods.clearErrors('officeAddress');
                  }
                }
              })}
              {...realtimeValidation.getFieldValidationProps('officeAddress')}
              className={cn(
                formMethods.formState.errors.officeAddress && 'border-destructive',
                realtimeValidation.getFieldValidationProps('officeAddress').className
              )}
            />
            {formMethods.formState.errors.officeAddress && (
              <p className="text-sm text-destructive">{formMethods.formState.errors.officeAddress.message?.toString()}</p>
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
            placeholder="Select Ownership Of Company"
            options={[
              { value: "Nigerian", label: "Nigerian" },
              { value: "Foreign", label: "Foreign" },
              { value: "Both", label: "Both" }
            ]}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              name="contactPerson"
              label="Name of Contact Person"
              required={true}
            />
            <FormField
              name="website"
              label="Website"
              required={false}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              name="incorporationState"
              label="Incorporation State"
              required={true}
            />
          </div>

          <div className="space-y-2">
            <DatePicker
              name="dateOfIncorporationRegistration"
              label="Date of Incorporation/Registration"
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

          <div className="space-y-2">
            <Label htmlFor="cacNumber">
              CAC/RC Number
              <span className="required-asterisk">*</span>
            </Label>
            <div className="relative">
              <Input
                id="cacNumber"
                {...(() => {
                  const { ref, ...rest } = formMethods.register('cacNumber', {
                    onChange: handleCACChange
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
                  formMethods.formState.errors.cacNumber && "border-destructive",
                  cacValidation && !cacValidation.valid && "border-destructive",
                  cacValidation && cacValidation.valid && "border-green-500",
                  autoFillState.state.status === 'loading' && "border-blue-500"
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
              {cacMessage}
            </p>
            {cacValidation && !cacValidation.valid && (
              <p className="text-sm text-destructive">{cacValidation.error}</p>
            )}
            {autoFillState.state.status === 'error' && autoFillState.state.error && (
              <p className="text-sm text-destructive">
                {typeof autoFillState.state.error === 'string' 
                  ? autoFillState.state.error 
                  : autoFillState.state.error.message || 'Verification failed'}
              </p>
            )}
            {formMethods.formState.errors.cacNumber && (
              <p className="text-sm text-destructive">{formMethods.formState.errors.cacNumber.message?.toString()}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              name="contactPersonNo"
              label="Contact Person Mobile Number"
              required={true}
              maxLength={15}
            />
            <FormField
              name="emailAddress"
              label="Email Address"
              required={true}
              type="email"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="natureOfBusiness">
              Business Type/Occupation
              <span className="required-asterisk">*</span>
            </Label>
            <Input
              id="natureOfBusiness"
              {...formMethods.register('natureOfBusiness', {
                onChange: () => {
                  if (formMethods.formState.errors.natureOfBusiness) {
                    formMethods.clearErrors('natureOfBusiness');
                  }
                }
              })}
              {...realtimeValidation.getFieldValidationProps('natureOfBusiness')}
              className={cn(
                formMethods.formState.errors.natureOfBusiness && 'border-destructive',
                realtimeValidation.getFieldValidationProps('natureOfBusiness').className
              )}
            />
            {formMethods.formState.errors.natureOfBusiness && (
              <p className="text-sm text-destructive">{formMethods.formState.errors.natureOfBusiness.message?.toString()}</p>
            )}
            <FieldValidationIndicator
              status={realtimeValidation.fieldValidationStates['natureOfBusiness']?.status || FieldValidationStatus.NOT_VERIFIED}
              errorMessage={realtimeValidation.fieldValidationStates['natureOfBusiness']?.errorMessage || null}
              fieldId="natureOfBusiness"
              fieldLabel="Business Type/Occupation"
            />
          </div>

          <FormSelect
            name="estimatedTurnover"
            label="Estimated Turnover"
            required={true}
            placeholder="Annual Income Range"
            options={[
              { value: "Less Than 10 Million", label: "Less Than 10 Million" },
              { value: "11 Million - 50 Million", label: "11 Million - 50 Million" },
              { value: "51 Million - 200 Million", label: "51 Million - 200 Million" },
              { value: "More Than 200 Million", label: "More Than 200 Million" }
            ]}
          />
        </div>
      )
    },
    {
      id: 'directors',
      title: 'Director Information',
      component: (
        <div className="space-y-6">
          {fields.map((field, index) => (
            <Card key={field.id} className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Director {index + 1}</h3>
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
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="space-y-2">
                  <FormField
                    name={`directors.${index}.firstName`}
                    label="First Name"
                    required={true}
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
                  required={false}
                />
                <div className="space-y-2">
                  <FormField
                    name={`directors.${index}.lastName`}
                    label="Last Name"
                    required={true}
                  />
                  <FieldValidationIndicator
                    status={getDirectorHooks(index)?.validation.fieldValidationStates[`directors.${index}.lastName`]?.status || FieldValidationStatus.NOT_VERIFIED}
                    errorMessage={getDirectorHooks(index)?.validation.fieldValidationStates[`directors.${index}.lastName`]?.errorMessage || null}
                    fieldId={`directors.${index}.lastName`}
                    fieldLabel="Last Name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                  <DatePicker
                    name={`directors.${index}.dob`}
                    label="Date of Birth"
                    required={true}
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
                  label="Place of Birth"
                  required={true}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <FormField
                  name={`directors.${index}.nationality`}
                  label="Nationality"
                  required={true}
                />
                <FormField
                  name={`directors.${index}.country`}
                  label="Country"
                  required={true}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <FormField
                  name={`directors.${index}.occupation`}
                  label="Occupation"
                  required={true}
                />
                <FormField
                  name={`directors.${index}.email`}
                  label="Email"
                  required={true}
                  type="email"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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
                              console.log(`[CorporateKYC] ===== DIRECTOR ${index} NIN REF CALLBACK FIRED =====`);
                              console.log(`[CorporateKYC] Director ${index} NIN input element:`, element);
                              console.log(`[CorporateKYC] Director ${index} NIN input ID:`, element?.id);
                              console.log('[CorporateKYC] Is authenticated:', isAuthenticated);
                              
                              if (element && isAuthenticated) {
                                console.log(`[CorporateKYC] Attaching handlers for director ${index}...`);
                                
                                // Get the hooks for this director
                                const hooks = getDirectorHooks(index);
                                if (hooks) {
                                  // Attach handlers - these add native DOM event listeners
                                  hooks.autoFill.attachToField(element);
                                  hooks.validation.attachToIdentifierField(element);
                                  
                                  console.log(`[CorporateKYC] ✅ Handlers attached successfully for director ${index}`);
                                } else {
                                  console.log(`[CorporateKYC] ⚠️ No hooks available for director ${index}`);
                                }
                              } else if (!element) {
                                console.log(`[CorporateKYC] Director ${index} NIN ref callback: element unmounted`);
                              } else {
                                console.log(`[CorporateKYC] ⚠️ Cannot attach handlers for director ${index}: not authenticated`);
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <FormSelect
                  name={`directors.${index}.idType`}
                  label="ID Type"
                  required={true}
                  placeholder="Select ID Type"
                  options={[
                    { value: "National ID", label: "National ID" },
                    { value: "Driver's License", label: "Driver's License" },
                    { value: "International Passport", label: "International Passport" },
                    { value: "Voters Card", label: "Voters Card" }
                  ]}
                />
                <FormField
                  name={`directors.${index}.idNumber`}
                  label="Identification Number"
                  required={true}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <FormField
                  name={`directors.${index}.issuingBody`}
                  label="Issuing Body"
                  required={true}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <DatePicker
                  name={`directors.${index}.issuedDate`}
                  label="Issued Date"
                  required={true}
                />
                <DatePicker
                  name={`directors.${index}.expiryDate`}
                  label="Expiry Date"
                  required={false}
                />
              </div>

              <FormSelect
                name={`directors.${index}.sourceOfIncome`}
                label="Source of Income"
                required={true}
                placeholder="Select Source of Income"
                options={[
                  { value: "Salary", label: "Salary" },
                  { value: "Business Income", label: "Business Income" },
                  { value: "Investment", label: "Investment" },
                  { value: "Other", label: "Other" }
                ]}
              />

              {formMethods.watch(`directors.${index}.sourceOfIncome`) === 'Other' && (
                <div className="mt-4">
                  <FormField
                    name={`directors.${index}.sourceOfIncomeOther`}
                    label="Please specify"
                    required={true}
                  />
                </div>
              )}
            </Card>
          ))}
          
          <Button
            type="button"
            variant="outline"
            onClick={() => append({
              firstName: '',
              middleName: '',
              lastName: '',
              dob: '',
              placeOfBirth: '',
              nationality: '',
              country: '',
              occupation: '',
              email: '',
              phoneNumber: '',
              BVNNumber: '',
              NINNumber: '',
              idType: '',
              idNumber: '',
              issuingBody: '',
              issuedDate: '',
              expiryDate: '',
              sourceOfIncome: '',
              sourceOfIncomeOther: ''
            })}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Another Director
          </Button>
        </div>
      )
    },
    {
      id: 'verification',
      title: 'Verification Upload',
      component: (
        <div className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">CAC Document Verification</h3>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900">Upload Your CAC Certificate</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    Please upload a clear photo or scan of your Certificate of Incorporation (CAC) or Company Registration Certificate. 
                    This document will be automatically verified against the company information you provided in the form.
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Document Verification with Gemini */}
          <DocumentUploadSection
            formId="kyc-corporate"
            documentType="cac"
            formData={{
              insured: formMethods.watch('insured'), // Company name - use 'insured' to match matcher expectations
              cacNumber: formMethods.watch('cacNumber'), // Use cacNumber instead of rcNumber
              incorporationDate: formMethods.watch('dateOfIncorporationRegistration'), // Use incorporationDate to match matcher
              officeAddress: formMethods.watch('officeAddress'),
              directors: formMethods.watch('directors')?.map(d => `${d.firstName} ${d.lastName}`) || []
            }}
            currentFile={uploadedFiles.cacDocument || null}
            verificationResult={verificationResults.cacDocument}
            onVerificationComplete={(result) => {
              console.log('CAC verification completed:', result);
              setVerificationResults(prev => ({
                ...prev,
                cacDocument: result
              }));
              // The DocumentUploadSection handles form submission blocking internally
            }}
            onStatusChange={(status) => {
              // Let DocumentUploadSection handle its own error display
              // No need for generic toast - detailed errors are shown in the component
            }}
            onFileSelect={(file) => {
              // Integrate with form state like additional documents
              setUploadedFiles(prev => ({
                ...prev,
                cacDocument: file
              }));
              formMethods.setValue('cacDocument', file);
              formMethods.trigger('cacDocument');
              
              // Log document upload
              auditService.logDocumentUpload({
                userId: user?.uid || 'anonymous',
                userRole: user?.role,
                userEmail: user?.email,
                formType: 'kyc',
                documentType: 'cac',
                fileName: file.name,
                fileSize: file.size
              });
            }}
            onFileRemove={() => {
              // Remove from form state
              setUploadedFiles(prev => ({
                ...prev,
                cacDocument: null
              }));
              setVerificationResults(prev => ({
                ...prev,
                cacDocument: undefined
              }));
              formMethods.setValue('cacDocument', null);
            }}
          />

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
              <p>ii. Please note that your personal data will be treated with utmost respect and is well secured as required by Nigeria Data Protection Regulations 2019.</p>
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
              checked={watchedValues.agreeToDataPrivacy}
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
            <p className="text-sm text-destructive">{formMethods.formState.errors.agreeToDataPrivacy.message?.toString()}</p>
          )}
          
          <FormField
            name="signature"
            label="Digital Signature"
            required={true}
            placeholder="Type your full name as signature"
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
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-6 w-6" />
              Corporate KYC Form
            </CardTitle>
            <CardDescription>
              KYC forms are for customer onboarding and verification. Complete these forms to establish a business relationship.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MultiStepForm
              steps={steps}
              onSubmit={onFinalSubmit}
              formMethods={formMethods}
              submitButtonText="Submit KYC Form"
              stepFieldMappings={stepFieldMappings}
              initialStep={currentStep}
              onStepChange={setCurrentStep}
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
                
                // Validate step fields using react-hook-form
                const currentStepFields = stepFieldMappings[stepId === 'company' ? 0 : stepId === 'directors' ? 1 : stepId === 'verification' ? 2 : 3] || [];
                if (currentStepFields.length > 0) {
                  const isValid = await formMethods.trigger(currentStepFields);
                  if (!isValid) {
                    toast({
                      title: 'Validation Error',
                      description: 'Please fill all required fields before proceeding',
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

      {/* Loading Modal */}
      <FormLoadingModal
        isOpen={showLoading}
        message={loadingMessage}
      />

      {/* Summary Dialog - Auto-generated */}
      <FormSummaryDialog
        open={showSummary}
        onOpenChange={setShowSummary}
        formData={submissionData}
        formType="Corporate KYC"
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
                    <span className="font-medium text-gray-600">Insured:</span>
                    <p className="text-gray-900">{data.insured || 'Not provided'}</p>
                  </div>
                  <div className="md:col-span-2">
                    <span className="font-medium text-gray-600">Office Address:</span>
                    <p className="text-gray-900">{data.officeAddress || 'Not provided'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Ownership:</span>
                    <p className="text-gray-900">{data.ownershipOfCompany || 'Not provided'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Name of Contact Person:</span>
                    <p className="text-gray-900">{data.contactPerson || 'Not provided'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Website:</span>
                    <p className="text-gray-900">{data.website || 'Not provided'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">CAC/Incorporation Number:</span>
                    <p className="text-gray-900">{data.cacNumber || data.incorporationNumber || 'Not provided'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Email:</span>
                    <p className="text-gray-900">{data.emailAddress || 'Not provided'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Contact Mobile:</span>
                    <p className="text-gray-900">{data.contactPersonNo || 'Not provided'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Nature of Business:</span>
                    <p className="text-gray-900">{data.natureOfBusiness || 'Not provided'}</p>
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
                          <span className="font-medium text-gray-600">Nationality:</span>
                          <p className="text-gray-900">{director.nationality || 'Not provided'}</p>
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
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Documents */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-3">Uploaded Documents</h3>
                <div className="space-y-3 text-sm">
                  {data.cacDocument && typeof data.cacDocument === 'string' && data.cacDocument.startsWith('http') ? (
                    <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <FileText className="w-5 h-5 text-green-600" />
                        <div>
                          <p className="font-medium text-green-800">CAC Certificate</p>
                          <p className="text-green-600 text-xs">Document uploaded and verified</p>
                        </div>
                      </div>
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                  ) : (
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                      <FileText className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-600">CAC Certificate</p>
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

      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccess}
        onClose={closeSuccess}
        title="KYC Form Submitted Successfully!"
        message="Your Corporate KYC form has been submitted successfully. You will receive a confirmation email shortly."
        formType="Corporate KYC"
      />

      {/* Verification Mismatch Modal */}
      <VerificationMismatchModal
        open={showVerificationMismatch}
        onClose={closeVerificationMismatch}
        mismatches={verificationMismatchData?.mismatches || []}
        warnings={verificationMismatchData?.warnings || []}
        identityType={verificationMismatchData?.identityType || 'CAC'}
      />
      
      {/* Error Modal */}
      <ErrorModal 
        isOpen={showError} 
        onClose={closeError} 
        message={errorMessage} 
      />
      </div>
      </form>
    </FormProvider>
  );
};

export default CorporateKYC;
