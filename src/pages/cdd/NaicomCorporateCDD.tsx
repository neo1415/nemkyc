import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray, FormProvider, useFormContext } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { get } from 'lodash'; // CRITICAL for nested errors
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Trash2, Loader2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import MultiStepForm from '@/components/common/MultiStepForm';
import { useFormDraft } from '@/hooks/useFormDraft';
import FileUpload from '@/components/common/FileUpload';
import { uploadFile } from '@/services/fileService';
import { useEnhancedFormSubmit } from '@/hooks/useEnhancedFormSubmit';
import FormLoadingModal from '@/components/common/FormLoadingModal';
import FormSummaryDialog from '@/components/common/FormSummaryDialog';
import SuccessModal from '@/components/common/SuccessModal';
import DatePicker from '@/components/common/DatePicker';

// ========== FORM COMPONENTS (OUTSIDE Main Component) ==========
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



// ========== VALIDATION SCHEMA (OUTSIDE Component) ==========
const naicomCorporateCDDSchema = yup.object().shape({
  // Company Details
  companyName: yup.string()
    .required("Company name is required")
    .min(2, "Company name must be at least 2 characters")
    .max(100, "Company name cannot exceed 100 characters"),
  registeredCompanyAddress: yup.string()
    .required("Registered address is required")
    .min(10, "Address must be at least 10 characters")
    .max(200, "Address cannot exceed 200 characters"),
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
  natureOfBusiness: yup.string()
    .required("Nature of business is required")
    .min(5, "Nature of business must be at least 5 characters")
    .max(500, "Nature of business cannot exceed 500 characters"),
  companyLegalForm: yup.string().required("Company type is required"),
  companyLegalFormOther: yup.string().when('companyLegalForm', {
    is: 'Other',
    then: (schema) => schema.required("Please specify other company type"),
    otherwise: (schema) => schema.notRequired()
  }),
  emailAddress: yup.string()
    .required("Email is required")
    .email("Please enter a valid email")
    .typeError("Please enter a valid email"),
  website: yup.string()
    .required("Website is required")
    .url("Please enter a valid website URL"),
  taxIdentificationNumber: yup.string()
    .required("Tax ID is required")
    .min(6, "Tax ID must be at least 6 characters")
    .max(20, "Tax ID cannot exceed 20 characters"),
  telephoneNumber: yup.string()
    .required("Telephone number is required")
    .matches(/^[\d\s+\-()]+$/, "Invalid phone number format")
    .min(10, "Phone number must be at least 10 digits")
    .max(15, "Phone number cannot exceed 15 characters"),

  // Directors
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
        .max(50, "Place of birth cannot exceed 50 characters"),
      nationality: yup.string().required("Nationality is required"),
      country: yup.string().required("Country is required"),
      occupation: yup.string()
        .required("Occupation is required")
        .min(2, "Occupation must be at least 2 characters")
        .max(50, "Occupation cannot exceed 50 characters"),
      email: yup.string()
        .required("Email is required")
        .email("Please enter a valid email")
        .typeError("Please enter a valid email"),
      phoneNumber: yup.string()
        .required("Phone number is required")
        .matches(/^[\d\s+\-()]+$/, "Invalid phone number format")
        .min(10, "Phone number must be at least 10 digits")
        .max(15, "Phone number cannot exceed 15 characters"),
      BVNNumber: yup.string()
        .required("BVN is required")
        .matches(/^\d+$/, "BVN must contain only numbers")
        .length(11, "BVN must be exactly 11 digits"),
      NINNumber: yup.string()
        .required("NIN is required")
        .matches(/^\d+$/, "NIN must contain only numbers")
        .length(11, "NIN must be exactly 11 digits"),
      employersName: yup.string()
        .max(100, "Employer name cannot exceed 100 characters"),
      employersPhoneNumber: yup.string()
        .matches(/^[\d\s+\-()]*$/, "Invalid phone number format")
        .max(15, "Phone number cannot exceed 15 characters"),
      residentialAddress: yup.string()
        .required("Residential address is required")
        .min(10, "Address must be at least 10 characters")
        .max(200, "Address cannot exceed 200 characters"),
      taxIdNumber: yup.string()
        .max(20, "Tax ID cannot exceed 20 characters"),
      idType: yup.string().required("ID type is required"),
      idNumber: yup.string()
        .required("Identification number is required")
        .min(6, "ID number must be at least 6 characters")
        .max(30, "ID number cannot exceed 30 characters"),
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

  // Account Details
  bankName: yup.string()
    .required("Bank name is required")
    .min(2, "Bank name must be at least 2 characters")
    .max(100, "Bank name cannot exceed 100 characters"),
  accountNumber: yup.string()
    .required("Account number is required")
    .matches(/^\d+$/, "Account number must contain only numbers")
    .min(10, "Account number must be at least 10 digits")
    .max(10, "Account number must be exactly 10 digits"),
  bankBranch: yup.string()
    .required("Bank branch is required")
    .min(2, "Bank branch must be at least 2 characters")
    .max(100, "Bank branch cannot exceed 100 characters"),
  accountOpeningDate: yup.date()
    .required("Account opening date is required")
    .test('not-future', 'Date cannot be in the future', function(value) {
      if (!value) return false;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return value <= today;
    })
    .typeError('Please select a valid date'),

  // Foreign Account (optional)
  bankName2: yup.string()
    .max(100, "Bank name cannot exceed 100 characters"),
  accountNumber2: yup.string()
    .matches(/^[\d\s]*$/, "Account number must contain only numbers and spaces")
    .max(30, "Account number cannot exceed 30 characters"),
  bankBranch2: yup.string()
    .max(100, "Bank branch cannot exceed 100 characters"),
  accountOpeningDate2: yup.date()
    .test('not-future', 'Date cannot be in the future', function(value) {
      if (!value) return true; // Optional field
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return value <= today;
    })
    .typeError('Please select a valid date'),

  // File uploads - same as Corporate CDD plus NAICOM license
  cac: yup.mixed().required("CAC Certificate upload is required"),
  identification: yup.mixed().required("Identification document upload is required"),
  cacForm: yup.mixed().required("NAICOM License Certificate upload is required"),

  // Declaration
  agreeToDataPrivacy: yup.boolean().oneOf([true], "You must agree to data privacy"),
  signature: yup.string().required("Signature is required")
});

const NaicomCorporateCDD: React.FC = () => {
  const { toast } = useToast();
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File>>({});

  // CRITICAL: Include ALL fields with appropriate defaults
  const defaultValues = {
    // Company Details
    companyName: '',
    registeredCompanyAddress: '',
    incorporationNumber: '',
    incorporationState: '',
    dateOfIncorporationRegistration: undefined, // Date fields should be undefined
    natureOfBusiness: '',
    companyLegalForm: '',
    companyLegalFormOther: '',
    emailAddress: '',
    website: '',
    taxIdentificationNumber: '',
    telephoneNumber: '',
    
    // Directors (at least one empty object)
    directors: [{
      firstName: '',
      middleName: '',
      lastName: '',
      dob: undefined, // Date fields should be undefined
      placeOfBirth: '',
      nationality: '',
      country: '',
      occupation: '',
      email: '',
      phoneNumber: '',
      BVNNumber: '',
      NINNumber: '',
      employersName: '',
      employersPhoneNumber: '',
      residentialAddress: '',
      taxIdNumber: '',
      idType: '',
      idNumber: '',
      issuingBody: '',
      issuedDate: undefined, // Date fields should be undefined
      expiryDate: undefined, // Date fields should be undefined
      sourceOfIncome: '',
      sourceOfIncomeOther: ''
    }],
    
    // Account Details
    bankName: '',
    accountNumber: '',
    bankBranch: '',
    accountOpeningDate: undefined, // Date fields should be undefined
    
    // Foreign Account
    bankName2: '',
    accountNumber2: '',
    bankBranch2: '',
    accountOpeningDate2: undefined, // Date fields should be undefined
    
    // File fields
    cac: '',
    identification: '',
    cacForm: '',
    
    // Declaration
    agreeToDataPrivacy: false,
    signature: ''
  };

  const formMethods = useForm<any>({
    resolver: yupResolver(naicomCorporateCDDSchema),
    defaultValues,
    mode: 'onChange' // Real-time validation
  });

  // For dynamic arrays (directors)
  const { fields, append, remove } = useFieldArray({
    control: formMethods.control,
    name: 'directors'
  });

  const { saveDraft, clearDraft } = useFormDraft('naicomCorporateCDD', formMethods);
  const watchedValues = formMethods.watch();

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
    formType: 'NAICOM Corporate CDD',
    onSuccess: () => clearDraft()
  });

  // CRITICAL: Map exact field names to steps
  const stepFieldMappings = {
    0: ['companyName', 'registeredCompanyAddress', 'incorporationNumber', 'incorporationState', 'dateOfIncorporationRegistration', 'natureOfBusiness', 'companyLegalForm', 'companyLegalFormOther', 'emailAddress', 'website', 'taxIdentificationNumber', 'telephoneNumber'],
    1: ['directors'],
    2: ['bankName', 'accountNumber', 'bankBranch', 'accountOpeningDate', 'bankName2', 'accountNumber2', 'bankBranch2', 'accountOpeningDate2'],
    3: ['cac', 'identification', 'cacForm'],
    4: ['agreeToDataPrivacy', 'signature']
  };

  // Auto-save draft
  useEffect(() => {
    const subscription = formMethods.watch((data) => {
      saveDraft(data);
    });
    return () => subscription.unsubscribe();
  }, [formMethods, saveDraft]);

  // Data sanitization (remove undefined values)
  const sanitizeData = (data: any) => {
    const sanitized: any = {};
    Object.keys(data).forEach(key => {
      if (data[key] !== undefined && data[key] !== null) {
        if (data[key] instanceof Date) {
          sanitized[key] = data[key].toISOString();
        } else if (Array.isArray(data[key])) {
          sanitized[key] = data[key].map((item: any) => {
            if (typeof item === 'object' && item !== null) {
              const sanitizedItem: any = {};
              Object.keys(item).forEach(itemKey => {
                if (item[itemKey] !== undefined && item[itemKey] !== null) {
                  if (item[itemKey] instanceof Date) {
                    sanitizedItem[itemKey] = item[itemKey].toISOString();
                  } else {
                    sanitizedItem[itemKey] = item[itemKey];
                  }
                }
              });
              return sanitizedItem;
            }
            return item;
          });
        } else {
          sanitized[key] = data[key];
        }
      }
    });
    return sanitized;
  };

  const onFinalSubmit = async (data: any) => {
    try {
      console.log('🔵 NAICOM Corporate CDD onFinalSubmit called with data:', data);
      
      const sanitizedData = sanitizeData(data);
      console.log('🔵 Sanitized data:', sanitizedData);

      // Handle file uploads
      const fileUploadPromises: Array<Promise<[string, string]>> = [];
      
      for (const [key, file] of Object.entries(uploadedFiles)) {
        if (file) {
          fileUploadPromises.push(
            uploadFile(file, `naicom-corporate-cdd/${Date.now()}-${file.name}`).then(url => [key, url])
          );
        }
      }

      const fileResults = await Promise.all(fileUploadPromises);
      const fileUrls = Object.fromEntries(fileResults);

      const finalData = {
        ...sanitizedData,
        ...fileUrls,
        status: 'processing',
        formType: 'NAICOM Corporate CDD'
      };

      console.log('🔵 Calling handleEnhancedSubmit with finalData:', finalData);
      console.log('🔵 formType in finalData:', finalData.formType);
      
      await handleEnhancedSubmit(finalData);
      
      console.log('🔵 handleEnhancedSubmit completed');
    } catch (error) {
      console.error('🔴 Error in onFinalSubmit:', error);
      toast({ title: 'Error', description: error instanceof Error ? error.message : 'Submission failed', variant: 'destructive' });
    }
  };

  // Company type options
  const companyTypeOptions = [
    { value: 'Sole Proprietor', label: 'Sole Proprietor' },
    { value: 'Unlimited Liability Company', label: 'Unlimited Liability Company' },
    { value: 'Limited Liability Company', label: 'Limited Liability Company' },
    { value: 'Public Limited Company', label: 'Public Limited Company' },
    { value: 'Joint Venture', label: 'Joint Venture' },
    { value: 'Other', label: 'Other' }
  ];

  const nationalityOptions = [
    { value: 'Nigerian', label: 'Nigerian' },
    { value: 'Ghanaian', label: 'Ghanaian' },
    { value: 'American', label: 'American' },
    { value: 'British', label: 'British' },
    { value: 'Other', label: 'Other' }
  ];

  const countryOptions = [
    { value: 'Nigeria', label: 'Nigeria' },
    { value: 'Ghana', label: 'Ghana' },
    { value: 'United States', label: 'United States' },
    { value: 'United Kingdom', label: 'United Kingdom' },
    { value: 'Other', label: 'Other' }
  ];

  const idTypeOptions = [
    { value: 'National ID', label: 'National ID' },
    { value: 'International Passport', label: 'International Passport' },
    { value: 'Driver\'s License', label: 'Driver\'s License' },
    { value: 'Voter\'s Card', label: 'Voter\'s Card' }
  ];

  const incomeSourceOptions = [
    { value: 'Employment', label: 'Employment' },
    { value: 'Business', label: 'Business' },
    { value: 'Investment', label: 'Investment' },
    { value: 'Pension', label: 'Pension' },
    { value: 'Other', label: 'Other' }
  ];

  const steps = [
    {
      id: 'company',
      title: 'Company Details',
      component: (
        <div className="space-y-4">
          <FormField
            name="companyName"
            label="Company Name"
            required={true}
            maxLength={100}
          />
          
          <FormTextarea
            name="registeredCompanyAddress"
            label="Registered Company Address"
            required={true}
            maxLength={200}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              name="incorporationNumber"
              label="Incorporation Number"
              required={true}
              maxLength={20}
            />
            <FormField
              name="incorporationState"
              label="Incorporation State"
              required={true}
              maxLength={50}
            />
          </div>
          
          <DatePicker
            name="dateOfIncorporationRegistration"
            label="Date of Incorporation/Registration"
            required={true}
          />
          
          <FormTextarea
            name="natureOfBusiness"
            label="Nature of Business"
            required={true}
            maxLength={500}
          />
          
          <FormSelect
            name="companyLegalForm"
            label="Company Type"
            required={true}
            options={companyTypeOptions}
            placeholder="Choose Company Type"
          />

          {formMethods.watch('companyLegalForm') === 'Other' && (
            <FormField
              name="companyLegalFormOther"
              label="Please specify other company type"
              required={true}
              maxLength={50}
            />
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              name="emailAddress"
              label="Email Address"
              type="email"
              required={true}
              maxLength={100}
            />
            <FormField
              name="website"
              label="Website"
              type="url"
              required={true}
              maxLength={100}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              name="taxIdentificationNumber"
              label="Tax Identification Number"
              required={true}
              maxLength={20}
            />
            <FormField
              name="telephoneNumber"
              label="Telephone Number"
              required={true}
              maxLength={15}
            />
          </div>
        </div>
      )
    },
    {
      id: 'directors',
      title: 'Director Info',
      component: (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Directors</h3>
            <Button
              type="button"
              onClick={() => append({
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
                BVNNumber: '',
                NINNumber: '',
                employersName: '',
                employersPhoneNumber: '',
                residentialAddress: '',
                taxIdNumber: '',
                idType: '',
                idNumber: '',
                issuingBody: '',
                issuedDate: undefined,
                expiryDate: undefined,
                sourceOfIncome: '',
                sourceOfIncomeOther: ''
              })}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Director
            </Button>
          </div>
          
          {fields.map((field, index) => (
            <Card key={field.id} className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-medium">Director {index + 1}</h4>
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
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    name={`directors.${index}.firstName`}
                    label="First Name"
                    required={true}
                    maxLength={50}
                  />
                  <FormField
                    name={`directors.${index}.middleName`}
                    label="Middle Name"
                    maxLength={50}
                  />
                  <FormField
                    name={`directors.${index}.lastName`}
                    label="Last Name"
                    required={true}
                    maxLength={50}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <DatePicker 
                    name={`directors.${index}.dob`} 
                    label="Date of Birth" 
                    required={true}
                  />
                  <FormField
                    name={`directors.${index}.placeOfBirth`}
                    label="Place of Birth"
                    required={true}
                    maxLength={50}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormSelect
                    name={`directors.${index}.nationality`}
                    label="Nationality"
                    required={true}
                    options={nationalityOptions}
                  />
                  <FormSelect
                    name={`directors.${index}.country`}
                    label="Country"
                    required={true}
                    options={countryOptions}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    name={`directors.${index}.occupation`}
                    label="Occupation"
                    required={true}
                    maxLength={50}
                  />
                  <FormField
                    name={`directors.${index}.email`}
                    label="Email"
                    type="email"
                    required={true}
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
                  <FormField
                    name={`directors.${index}.BVNNumber`}
                    label="BVN"
                    required={true}
                    maxLength={11}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    name={`directors.${index}.NINNumber`}
                    label="NIN (National Identification Number)"
                    required={true}
                    maxLength={11}
                  />
                  <FormField
                    name={`directors.${index}.employersName`}
                    label="Employers Name"
                    maxLength={100}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    name={`directors.${index}.employersPhoneNumber`}
                    label="Employers Phone Number"
                    maxLength={15}
                  />
                </div>

                <FormTextarea
                  name={`directors.${index}.residentialAddress`}
                  label="Residential Address"
                  required={true}
                  maxLength={200}
                />

                <FormField
                  name={`directors.${index}.taxIdNumber`}
                  label="Tax ID Number"
                  maxLength={20}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormSelect
                    name={`directors.${index}.idType`}
                    label="ID Type"
                    required={true}
                    options={idTypeOptions}
                  />
                  <FormField
                    name={`directors.${index}.idNumber`}
                    label="Identification Number"
                    required={true}
                    maxLength={30}
                  />
                </div>

                <FormField
                  name={`directors.${index}.issuingBody`}
                  label="Issuing Body"
                  required={true}
                  maxLength={100}
                />

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

                <FormSelect
                  name={`directors.${index}.sourceOfIncome`}
                  label="Source of Income"
                  required={true}
                  options={incomeSourceOptions}
                />

                {formMethods.watch(`directors.${index}.sourceOfIncome`) === 'Other' && (
                  <FormField
                    name={`directors.${index}.sourceOfIncomeOther`}
                    label="Please specify other income source"
                    required={true}
                    maxLength={100}
                  />
                )}
              </div>
            </Card>
          ))}
        </div>
      )
    },
    {
      id: 'banking',
      title: 'Banking Details',
      component: (
        <div className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Primary Bank Account</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                name="bankName"
                label="Bank Name"
                required={true}
                maxLength={100}
              />
              <FormField
                name="accountNumber"
                label="Account Number"
                required={true}
                maxLength={10}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                name="bankBranch"
                label="Bank Branch"
                required={true}
                maxLength={100}
              />
              <DatePicker
                name="accountOpeningDate"
                label="Account Opening Date"
                required={true}
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Foreign Account (Optional)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                name="bankName2"
                label="Bank Name"
                maxLength={100}
              />
              <FormField
                name="accountNumber2"
                label="Account Number"
                maxLength={30}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                name="bankBranch2"
                label="Bank Branch"
                maxLength={100}
              />
              <DatePicker
                name="accountOpeningDate2"
                label="Account Opening Date"
              />
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'documents',
      title: 'Document Upload',
      component: (
        <div className="space-y-4">
          <div>
            <Label>Upload CAC Certificate <span className="required-asterisk">*</span></Label>
            <FileUpload
              accept=".png,.jpg,.jpeg,.pdf"
              onFileSelect={(file) => {
                setUploadedFiles(prev => ({
                  ...prev,
                  cac: file
                }));
                formMethods.setValue('cac', file);
                if (formMethods.formState.errors.cac) {
                  formMethods.clearErrors('cac');
                }
              }}
              maxSize={10}
            />
            {uploadedFiles.cac && (
              <div className="flex items-center gap-2 mt-2 text-sm text-green-600">
                <Check className="h-4 w-4" />
                {uploadedFiles.cac.name}
              </div>
            )}
            {formMethods.formState.errors.cac && (
              <p className="text-sm text-destructive">
                {formMethods.formState.errors.cac.message?.toString()}
              </p>
            )}
          </div>

          <div>
            <Label>Upload Means of Identification <span className="required-asterisk">*</span></Label>
            <FileUpload
              accept=".png,.jpg,.jpeg,.pdf"
              onFileSelect={(file) => {
                setUploadedFiles(prev => ({
                  ...prev,
                  identification: file
                }));
                formMethods.setValue('identification', file);
                if (formMethods.formState.errors.identification) {
                  formMethods.clearErrors('identification');
                }
              }}
              maxSize={10}
            />
            {uploadedFiles.identification && (
              <div className="flex items-center gap-2 mt-2 text-sm text-green-600">
                <Check className="h-4 w-4" />
                {uploadedFiles.identification.name}
              </div>
            )}
            {formMethods.formState.errors.identification && (
              <p className="text-sm text-destructive">
                {formMethods.formState.errors.identification.message?.toString()}
              </p>
            )}
          </div>

          <div>
            <Label>Upload NAICOM License Certificate <span className="required-asterisk">*</span></Label>
            <FileUpload
              accept=".png,.jpg,.jpeg,.pdf"
              onFileSelect={(file) => {
                setUploadedFiles(prev => ({
                  ...prev,
                  cacForm: file
                }));
                formMethods.setValue('cacForm', file);
                if (formMethods.formState.errors.cacForm) {
                  formMethods.clearErrors('cacForm');
                }
              }}
              maxSize={10}
            />
            {uploadedFiles.cacForm && (
              <div className="flex items-center gap-2 mt-2 text-sm text-green-600">
                <Check className="h-4 w-4" />
                {uploadedFiles.cacForm.name}
              </div>
            )}
            {formMethods.formState.errors.cacForm && (
              <p className="text-sm text-destructive">
                {formMethods.formState.errors.cacForm.message?.toString()}
              </p>
            )}
          </div>
        </div>
      )
    },
    {
      id: 'declaration',
      title: 'Declaration',
      component: (
        <div className="space-y-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-lg mb-3">Declaration and Privacy Statement</h3>
            <div className="text-sm space-y-2">
              <p><strong>I hereby declare that:</strong></p>
              <p>1. The information provided in this form is true, complete, and accurate to the best of my knowledge.</p>
              <p>2. I/We agree to provide additional information to NEM Insurance, if required.</p>
              <p>3. I/We agree to submit all required and requested documents and NEM Insurance shall not be held responsible for any delay in settlement of claim due to non-fulfillment of requirements.</p>
              <p>4. I understand that providing false information may result in the rejection of this application or cancellation of any insurance policy issued.</p>
              <p>5. I consent to NEM Insurance verifying the information provided through relevant authorities and databases.</p>
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
      <div className="container mx-auto px-4 py-8">
        {/* Loading overlay removed - showPostAuthLoading is not defined */}

        <Card className="max-w-6xl mx-auto">
          <CardHeader>
            <CardTitle>NAICOM Corporate CDD</CardTitle>
            <CardDescription>National Insurance Commission Corporate Customer Due Diligence</CardDescription>
          </CardHeader>
          <CardContent>
            <MultiStepForm
              steps={steps}
              onSubmit={onFinalSubmit}
              formMethods={formMethods}
              submitButtonText="Submit CDD Form"
              stepFieldMappings={stepFieldMappings}
            />
          </CardContent>
        </Card>

        <FormLoadingModal isOpen={showLoading} message={loadingMessage} />
        
        <FormSummaryDialog
          open={showSummary}
          onOpenChange={setShowSummary}
          formData={submissionData}
          formType="NAICOM Corporate CDD"
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
                      <p className="text-gray-900">{data.companyName || 'Not provided'}</p>
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
                      <span className="font-medium text-gray-600">Company Legal Form:</span>
                      <p className="text-gray-900">{data.companyLegalForm === 'Other' ? data.companyLegalFormOther : data.companyLegalForm || 'Not provided'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Nature of Business:</span>
                      <p className="text-gray-900">{data.natureOfBusiness || 'Not provided'}</p>
                    </div>
                    <div className="md:col-span-2">
                      <span className="font-medium text-gray-600">Registered Address:</span>
                      <p className="text-gray-900">{data.registeredCompanyAddress || 'Not provided'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Email:</span>
                      <p className="text-gray-900">{data.emailAddress || 'Not provided'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Telephone:</span>
                      <p className="text-gray-900">{data.telephoneNumber || 'Not provided'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Website:</span>
                      <p className="text-gray-900">{data.website || 'Not provided'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Tax ID:</span>
                      <p className="text-gray-900">{data.taxIdentificationNumber || 'Not provided'}</p>
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
                            <span className="font-medium text-gray-600">BVN:</span>
                            <p className="text-gray-900">{director.BVNNumber || 'Not provided'}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-600">NIN:</span>
                            <p className="text-gray-900">{director.NINNumber || 'Not provided'}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-600">ID Type:</span>
                            <p className="text-gray-900">{director.idType || 'Not provided'}</p>
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
                      <span className="font-medium text-gray-600">Bank Name:</span>
                      <p className="text-gray-900">{data.bankName || 'Not provided'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Account Number:</span>
                      <p className="text-gray-900">{data.accountNumber || 'Not provided'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Bank Branch:</span>
                      <p className="text-gray-900">{data.bankBranch || 'Not provided'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Account Opening Date:</span>
                      <p className="text-gray-900">{data.accountOpeningDate ? format(new Date(data.accountOpeningDate), 'dd/MM/yyyy') : 'Not provided'}</p>
                    </div>
                  </div>
                </div>

                {/* Documents */}
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold text-lg mb-3">Uploaded Documents</h3>
                  <div className="grid grid-cols-1 gap-2 text-sm">
                    <div>
                      <span className="font-medium text-gray-600">CAC Certificate:</span>
                      <p className="text-gray-900">{data.cac ? '✓ Uploaded' : 'Not uploaded'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Identification Document:</span>
                      <p className="text-gray-900">{data.identification ? '✓ Uploaded' : 'Not uploaded'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">CAC Form:</span>
                      <p className="text-gray-900">{data.cacForm ? '✓ Uploaded' : 'Not uploaded'}</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          }}
        />

        <SuccessModal
          isOpen={showSuccess}
          onClose={closeSuccess}
          title="NAICOM Corporate CDD Submitted Successfully!"
          message="Your NAICOM Corporate CDD form has been submitted successfully and is now being processed."
        />
      </div>
    </FormProvider>
  );
};

export default NaicomCorporateCDD;
