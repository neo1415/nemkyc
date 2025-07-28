import React, { useState, useEffect } from 'react';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Calendar as ReactCalendar } from '@/components/ui/calendar';
import { Calendar, CalendarIcon, Plus, Trash2, Edit2, Loader2, Check } from 'lucide-react';
import { format } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import MultiStepForm from '@/components/common/MultiStepForm';
import { useFormDraft } from '@/hooks/useFormDraft';
import FileUpload from '@/components/common/FileUpload';
import { uploadFile } from '@/services/fileService';
import { useAuthRequiredSubmit } from '@/hooks/useAuthRequiredSubmit';
import SuccessModal from '@/components/common/SuccessModal';

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

const FormDatePicker = ({ name, label, required = false }: any) => {
  const { setValue, watch, formState: { errors }, clearErrors } = useFormContext();
  const value = watch(name);
  const error = get(errors, name); // CRITICAL: Use lodash.get for nested errors
  
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>
        {label}
        {required && <span className="required-asterisk">*</span>}
      </Label>
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
            {value ? format(typeof value === 'string' ? new Date(value) : value, "PPP") : <span>Pick a date</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <ReactCalendar
            mode="single"
            selected={value ? (typeof value === 'string' ? new Date(value) : value) : undefined}
            onSelect={(date) => {
              setValue(name, date);
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
  );
};

// Corporate CDD Schema with enhanced validation
const corporateCDDSchema = yup.object().shape({
  // Company Info
  companyName: yup.string()
    .required("Company name is required")
    .min(2, "Company name must be at least 2 characters")
    .max(100, "Company name cannot exceed 100 characters"),
  registeredCompanyAddress: yup.string()
    .required("Registered address is required")
    .min(10, "Address must be at least 10 characters")
    .max(500, "Address cannot exceed 500 characters"),
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
    .min(10, "Nature of business must be at least 10 characters")
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
    .matches(/^[\d\-]+$/, "Tax ID must contain only numbers and dashes")
    .max(20, "Tax ID cannot exceed 20 characters"),
  telephoneNumber: yup.string()
    .required("Telephone number is required")
    .matches(/^[\d\s+\-()]+$/, "Invalid phone number format")
    .max(15, "Phone number cannot exceed 15 characters"),

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
      country: yup.string().required("Country is required"),
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
        .matches(/^[\d\s+\-()]+$/, "Invalid phone number format")
        .max(15, "Phone number cannot exceed 15 characters"),
      BVNNumber: yup.string()
        .required("BVN is required")
        .matches(/^\d+$/, "BVN must contain only numbers")
        .length(11, "BVN must be exactly 11 digits"),
      employersName: yup.string()
        .max(100, "Employer name cannot exceed 100 characters"),
      employersPhoneNumber: yup.string()
        .matches(/^[\d\s+\-()]*$/, "Invalid phone number format")
        .max(15, "Phone number cannot exceed 15 characters"),
      residentialAddress: yup.string()
        .required("Residential address is required")
        .min(10, "Address must be at least 10 characters")
        .max(500, "Address cannot exceed 500 characters"),
      taxIDNumber: yup.string()
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
    .matches(/^[\d\-]*$/, "Account number must contain only numbers and dashes")
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

  // File uploads
  cac: yup.mixed().required("CAC Certificate upload is required"),
  identification: yup.mixed().required("Identification document upload is required"),

  // Declaration
  agreeToDataPrivacy: yup.boolean().oneOf([true], "You must agree to data privacy"),
  signature: yup.string()
    .required("Digital signature is required")
    .min(3, "Signature must be at least 3 characters")
    .max(100, "Signature cannot exceed 100 characters")
});

const CorporateCDD: React.FC = () => {
  const [showSummary, setShowSummary] = useState(false);
  const [showPostAuthLoading, setShowPostAuthLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File>>({});
  const [editingField, setEditingField] = useState<string | null>(null);
  const { 
    handleSubmitWithAuth, 
    showSuccess, 
    setShowSuccess,
    isSubmitting
  } = useAuthRequiredSubmit();

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
    BVNNumber: '',
    employersName: '',
    employersPhoneNumber: '',
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
    resolver: yupResolver(corporateCDDSchema),
    defaultValues: {
      companyName: '',
      registeredCompanyAddress: '',
      incorporationNumber: '',
      incorporationState: '',
      dateOfIncorporationRegistration: undefined,
      natureOfBusiness: '',
      companyLegalForm: '',
      companyLegalFormOther: '',
      emailAddress: '',
      website: '',
      taxIdentificationNumber: '',
      telephoneNumber: '',
      directors: [defaultDirector],
      bankName: '',
      accountNumber: '',
      bankBranch: '',
      accountOpeningDate: undefined,
      bankName2: '',
      accountNumber2: '',
      bankBranch2: '',
      accountOpeningDate2: undefined,
      cac: '',
      identification: '',
      agreeToDataPrivacy: false,
      signature: ''
    },
    mode: 'onChange'
  });

  const { fields: directorFields, append: addDirector, remove: removeDirector } = useFieldArray({
    control: formMethods.control,
    name: 'directors'
  });

  const { saveDraft, clearDraft } = useFormDraft('corporateCDD', formMethods);
  const watchedValues = formMethods.watch();

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
    if (showSuccess) {
      setShowPostAuthLoading(false);
    }
  }, [showSuccess]);

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

  // Main submit handler that checks authentication
  const handleSubmit = async (data: any) => {
    console.log('Form data before sanitization:', data);
    
    const sanitizedData = sanitizeData(data);
    console.log('Sanitized data:', sanitizedData);

    // Prepare file upload data
    const fileUploadPromises: Array<Promise<[string, string]>> = [];
    
    for (const [key, file] of Object.entries(uploadedFiles)) {
      if (file) {
        fileUploadPromises.push(
          uploadFile(file, `corporate-cdd/${Date.now()}-${file.name}`).then(url => [key, url])
        );
      }
    }

    const fileResults = await Promise.all(fileUploadPromises);
    const fileUrls = Object.fromEntries(fileResults);

    const finalData = {
      ...sanitizedData,
      ...fileUrls,
      status: 'processing',
      formType: 'Corporate-CDD'
    };

    await handleSubmitWithAuth(finalData, 'Corporate-CDD');
    clearDraft();
    setShowSummary(false);
  };

  const onFinalSubmit = (data: any) => {
    setShowSummary(true);
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

  // Step field mappings for validation
  const stepFieldMappings = {
    0: ['companyName', 'registeredCompanyAddress', 'incorporationNumber', 'incorporationState', 'dateOfIncorporationRegistration', 'natureOfBusiness', 'companyLegalForm', 'companyLegalFormOther', 'emailAddress', 'website', 'taxIdentificationNumber', 'telephoneNumber'],
    1: ['directors'],
    2: ['bankName', 'accountNumber', 'bankBranch', 'accountOpeningDate', 'bankName2', 'accountNumber2', 'bankBranch2', 'accountOpeningDate2'],
    3: ['cac', 'identification'],
    4: ['agreeToDataPrivacy', 'signature']
  };

  const steps = [
    {
      id: 'company',
      title: 'Company Info',
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
            maxLength={500}
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
          
          <FormDatePicker
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

          {watchedValues.companyLegalForm === 'Other' && (
            <FormField
              name="companyLegalFormOther"
              label="Please specify"
              required={true}
              maxLength={100}
            />
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              name="emailAddress"
              label="Email Address"
              required={true}
              type="email"
              maxLength={100}
            />
            <FormField
              name="website"
              label="Website"
              required={true}
              maxLength={200}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              name="taxIdentificationNumber"
              label="Tax Identification Number"
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
                  <FormDatePicker 
                    name={`directors.${index}.dob`} 
                    label="Date of Birth" 
                    required={true}
                  />
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
                    required={true}
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
                  <FormField
                    name={`directors.${index}.BVNNumber`}
                    label="BVN"
                    required={true}
                    maxLength={11}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    name={`directors.${index}.employersName`}
                    label="Employers Name"
                    maxLength={100}
                  />
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
                  <FormDatePicker 
                    name={`directors.${index}.issuedDate`} 
                    label="Issued Date" 
                    required={true}
                  />
                  <FormDatePicker 
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
            <h3 className="text-lg font-medium mb-4">Local Account Details</h3>
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <FormField
                name="bankBranch"
                label="Bank Branch"
                required={true}
                maxLength={100}
              />
              <FormDatePicker
                name="accountOpeningDate"
                label="Account Opening Date"
                required={true}
              />
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-4">Foreign Account Details (Optional)</h3>
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <FormField
                name="bankBranch2"
                label="Bank Branch"
                maxLength={100}
              />
              <FormDatePicker
                name="accountOpeningDate2"
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
            <Label>Upload Your CAC Certificate <span className="required-asterisk">*</span></Label>
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
              maxSize={3 * 1024 * 1024}
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
              maxSize={3 * 1024 * 1024}
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
            <CardTitle>Corporate CDD Form</CardTitle>
            <CardDescription>Customer Due Diligence form for Corporate Entities</CardDescription>
          </CardHeader>
          <CardContent>
            <MultiStepForm
              steps={steps}
              onSubmit={onFinalSubmit}
              formMethods={formMethods}
              submitButtonText="Submit Corporate CDD"
              stepFieldMappings={stepFieldMappings}
            />
          </CardContent>
        </Card>

        {/* Summary Dialog */}
        <Dialog open={showSummary} onOpenChange={setShowSummary}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Review Your Corporate CDD Submission</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><strong>Company Name:</strong> {watchedValues.companyName}</div>
                <div><strong>Incorporation Number:</strong> {watchedValues.incorporationNumber}</div>
                <div><strong>Email:</strong> {watchedValues.emailAddress}</div>
                <div><strong>Phone:</strong> {watchedValues.telephoneNumber}</div>
                <div><strong>Company Type:</strong> {watchedValues.companyLegalForm}</div>
                <div><strong>Nature of Business:</strong> {watchedValues.natureOfBusiness}</div>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-blue-800">
                  Please review all information carefully before final submission
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowSummary(false)}>
                Back to Edit
              </Button>
              <Button
                onClick={() => {
                  const formData = formMethods.getValues();
                  handleSubmit(formData);
                }}
                disabled={isSubmitting}
                className="bg-primary text-primary-foreground"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Confirm & Submit'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Success Modal */}
        <SuccessModal
          isOpen={showSuccess}
          onClose={() => setShowSuccess()}
          title="Corporate CDD Submitted Successfully!"
          message="Your Corporate CDD form has been submitted successfully."
          formType="Corporate CDD"
        />
      </div>
    </FormProvider>
  );
};

export default CorporateCDD;
