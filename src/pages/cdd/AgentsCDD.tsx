import React, { useState, useEffect } from 'react';
import { useForm, FormProvider, useFormContext } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { get } from 'lodash';
import { toast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar as ReactCalendar } from '@/components/ui/calendar';
import { Calendar, CalendarIcon, Upload, Check, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import MultiStepForm from '@/components/common/MultiStepForm';
import { useFormDraft } from '@/hooks/useFormDraft';
import FileUpload from '@/components/common/FileUpload';
import { uploadFile } from '@/services/fileService';
import { useAuthRequiredSubmit } from '@/hooks/useAuthRequiredSubmit';
import SuccessModal from '@/components/common/SuccessModal';
import LoadingSpinner from '@/components/common/LoadingSpinner';

const agentsCDDSchema = yup.object().shape({
  // Personal Info
  firstName: yup.string().required("First name is required"),
  middleName: yup.string(),
  lastName: yup.string().required("Last name is required"),
  residentialAddress: yup.string().required("Residential address is required"),
  gender: yup.string().required("Gender is required"),
  position: yup.string().required("Position/Role is required"),
  dateOfBirth: yup.date()
    .required("Date of birth is required")
    .test('age', 'Must be at least 18 years old', function(value) {
      if (!value) return false;
      const today = new Date();
      const eighteenYearsAgo = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
      return value <= eighteenYearsAgo;
    })
    .typeError('Please select a valid date'),
  placeOfBirth: yup.string().required("Place of birth is required"),
  otherSourceOfIncome: yup.string().required("Other source of income is required"),
  otherSourceOfIncomeOther: yup.string().when('otherSourceOfIncome', {
    is: 'other',
    then: (schema) => schema.required('Please specify income source'),
    otherwise: (schema) => schema.notRequired()
  }),
  nationality: yup.string().required("Nationality is required"),
  phoneNumber: yup.string()
    .required("Phone number is required")
    .matches(/^[\d\s+\-()]+$/, "Invalid phone number format")
    .max(15, "Phone number cannot exceed 15 characters"),
  bvn: yup.string()
    .required("BVN is required")
    .matches(/^\d+$/, "BVN must contain only numbers")
    .length(11, "BVN must be exactly 11 digits"),
  taxIdNumber: yup.string(),
  occupation: yup.string().required("Occupation is required"),
  email: yup.string()
    .required("Email is required")
    .email("Please enter a valid email")
    .typeError("Please enter a valid email"),
  validMeansOfId: yup.string().required("Valid means of ID is required"),
  identificationNumber: yup.string().required("Identification number is required"),
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
  issuingBody: yup.string().required("Issuing body is required"),
  
  // Additional Info
  agentName: yup.string().required("Agent name is required"),
  agentsOfficeAddress: yup.string().required("Agents office address is required"),
  naicomLicenseNumber: yup.string().required("NAICOM license number is required"),
  licenseIssuedDate: yup.date()
    .required("License issued date is required")
    .test('not-future', 'Date cannot be in the future', function(value) {
      if (!value) return false;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return value <= today;
    })
    .typeError('Please select a valid date'),
  licenseExpiryDate: yup.date()
    .required("License expiry date is required")
    .test('not-past', 'Expiry date cannot be in the past', function(value) {
      if (!value) return false;
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      return value > today;
    })
    .typeError('Please select a valid date'),
  emailAddress: yup.string()
    .required("Email address is required")
    .email("Please enter a valid email")
    .typeError("Please enter a valid email"),
  website: yup.string().required("Website is required"),
  mobileNumber: yup.string()
    .required("Mobile number is required")
    .matches(/^[\d\s+\-()]+$/, "Invalid phone number format")
    .max(15, "Phone number cannot exceed 15 characters"),
  taxIdentificationNumber: yup.string(),
  arianMembershipNumber: yup.string().required("ARIAN membership number is required"),
  listOfAgentsApprovedPrincipals: yup.string().required("List of agents approved principals is required"),
  
  // Financial Info
  localAccountNumber: yup.string()
    .required("Account number is required")
    .matches(/^\d+$/, "Account number must contain only numbers")
    .max(10, "Account number cannot exceed 10 digits"),
  localBankName: yup.string().required("Bank name is required"),
  localBankBranch: yup.string().required("Bank branch is required"),
  localAccountOpeningDate: yup.date()
    .required("Account opening date is required")
    .test('not-future', 'Date cannot be in the future', function(value) {
      if (!value) return false;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return value <= today;
    })
    .typeError('Please select a valid date'),
  foreignAccountNumber: yup.string(),
  foreignBankName: yup.string(),
  foreignBankBranch: yup.string(),
  foreignAccountOpeningDate: yup.date()
    .test('not-future', 'Date cannot be in the future', function(value) {
      if (!value) return true; // Optional field
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return value <= today;
    })
    .typeError('Please select a valid date'),
  
  // File uploads
  agentId: yup.mixed().required("Agent ID is required"),
  naicomCertificate: yup.mixed().required("NAICOM certificate is required"),
  
  // Declaration
  agreeToDataPrivacy: yup.boolean().oneOf([true], "You must agree to data privacy"),
  signature: yup.string().required("Signature is required")
});

const defaultValues = {
  firstName: '',
  middleName: '',
  lastName: '',
  residentialAddress: '',
  gender: '',
  position: '',
  dateOfBirth: undefined,
  placeOfBirth: '',
  otherSourceOfIncome: '',
  otherSourceOfIncomeOther: '',
  nationality: '',
  phoneNumber: '',
  bvn: '',
  taxIdNumber: '',
  occupation: '',
  email: '',
  validMeansOfId: '',
  identificationNumber: '',
  issuedDate: undefined,
  expiryDate: undefined,
  issuingBody: '',
  agentName: '',
  agentsOfficeAddress: '',
  naicomLicenseNumber: '',
  licenseIssuedDate: undefined,
  licenseExpiryDate: undefined,
  emailAddress: '',
  website: '',
  mobileNumber: '',
  taxIdentificationNumber: '',
  arianMembershipNumber: '',
  listOfAgentsApprovedPrincipals: '',
  localAccountNumber: '',
  localBankName: '',
  localBankBranch: '',
  localAccountOpeningDate: undefined,
  foreignAccountNumber: '',
  foreignBankName: '',
  foreignBankBranch: '',
  foreignAccountOpeningDate: undefined,
  agentId: '',
  naicomCertificate: '',
  agreeToDataPrivacy: false,
  signature: ''
};

// ========== FORM COMPONENTS (OUTSIDE MAIN COMPONENT) ==========
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

const FormDatePicker = ({ name, label, required = false }: any) => {
  const { setValue, watch, formState: { errors }, clearErrors, trigger } = useFormContext();
  const value = watch(name);
  const error = get(errors, name);
  
  const formatDateForInput = (date: any) => {
    if (!date) return '';
    if (typeof date === 'string') {
      const parsedDate = new Date(date);
      return !isNaN(parsedDate.getTime()) ? parsedDate.toISOString().split('T')[0] : '';
    }
    if (date instanceof Date && !isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
    return '';
  };
  
  const handleDateChange = async (dateValue: Date | undefined) => {
    setValue(name, dateValue, { shouldValidate: true });
    if (error) {
      clearErrors(name);
    }
    await trigger(name);
  };
  
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>
        {label}
        {required && <span className="required-asterisk">*</span>}
      </Label>
      <div className="relative">
        <Input
          id={name}
          type="date"
          value={formatDateForInput(value)}
          onChange={async (e) => {
            const dateValue = e.target.value ? new Date(e.target.value + 'T00:00:00') : undefined;
            await handleDateChange(dateValue);
          }}
          className={error ? 'border-destructive' : ''}
        />
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
              type="button"
            >
              <CalendarIcon className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <ReactCalendar
              mode="single"
              selected={value ? new Date(value) : undefined}
              onSelect={handleDateChange}
              initialFocus
              className="pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      </div>
      {error && (
        <p className="text-sm text-destructive">{error.message?.toString()}</p>
      )}
    </div>
  );
};

const AgentsCDD: React.FC = () => {
  const [showSummary, setShowSummary] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File>>({});
  const [showPostAuthLoading, setShowPostAuthLoading] = useState(false);
  
  const {
    handleSubmitWithAuth,
    showSuccess,
    setShowSuccess,
    isSubmitting
  } = useAuthRequiredSubmit();

  const formMethods = useForm<any>({
    resolver: yupResolver(agentsCDDSchema),
    defaultValues,
    mode: 'onChange'
  });

  const { saveDraft, clearDraft } = useFormDraft('agents-cdd', formMethods);
  const watchedValues = formMethods.watch();

  // Step field mappings for validation
  const stepFieldMappings = {
    0: ['firstName', 'lastName', 'residentialAddress', 'gender', 'position', 'dateOfBirth', 'placeOfBirth', 'otherSourceOfIncome', 'nationality', 'phoneNumber', 'bvn', 'occupation', 'email', 'validMeansOfId', 'identificationNumber', 'issuedDate', 'issuingBody'],
    1: ['agentName', 'agentsOfficeAddress', 'naicomLicenseNumber', 'licenseIssuedDate', 'licenseExpiryDate', 'emailAddress', 'website', 'mobileNumber', 'arianMembershipNumber', 'listOfAgentsApprovedPrincipals'],
    2: ['localAccountNumber', 'localBankName', 'localBankBranch', 'localAccountOpeningDate', 'agentId', 'naicomCertificate'],
    3: ['agreeToDataPrivacy', 'signature']
  };

  // Auto-save draft
  React.useEffect(() => {
    const subscription = formMethods.watch((data) => {
      saveDraft(data);
    });
    return () => subscription.unsubscribe();
  }, [formMethods, saveDraft]);

  // Post-auth loading effect
  useEffect(() => {
    const submissionInProgress = sessionStorage.getItem('submissionInProgress');
    if (submissionInProgress) {
      setShowSummary(false);
    }
  }, []);


  // Data sanitization (remove undefined values and serialize dates)
  const sanitizeData = (data: any) => {
    const sanitized: any = {};
    Object.keys(data).forEach(key => {
      if (data[key] !== undefined) {
        // Convert Date objects to ISO strings for serialization
        if (data[key] instanceof Date) {
          sanitized[key] = data[key].toISOString();
        } else {
          sanitized[key] = data[key];
        }
      }
    });
    return sanitized;
  };

  const handleSubmit = async (data: any) => {
    console.log('Form data before sanitization:', data);
    
    const sanitizedData = sanitizeData(data);
    console.log('Sanitized data:', sanitizedData);

    // Handle file uploads
    const fileUploadPromises: Array<Promise<[string, string]>> = [];
    
    for (const [key, file] of Object.entries(uploadedFiles)) {
      if (file) {
        fileUploadPromises.push(
          uploadFile(file, `agents-cdd/${Date.now()}-${file.name}`).then(url => [key, url])
        );
      }
    }

    const fileResults = await Promise.all(fileUploadPromises);
    const fileUrls = Object.fromEntries(fileResults);

    const finalData = {
      ...sanitizedData,
      ...fileUrls,
      status: 'processing',
      formType: 'Agents-CDD'
    };

    await handleSubmitWithAuth(finalData, 'Agents-CDD');
    clearDraft();
    setShowSummary(false);
  };

  const onFinalSubmit = (data: any) => {
    setShowSummary(true);
  };

  const DatePickerField = ({ name, label }: { name: string; label: string }) => {
    const value = formMethods.watch(name);
    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !value && "text-muted-foreground"
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
              onSelect={(date) => formMethods.setValue(name, date)}
              initialFocus
              className="pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      </div>
    );
  };

  const steps = [
    {
      id: 'personal',
      title: 'Personal Information',
      component: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              name="firstName"
              label="First Name"
              required={true}
            />
            <FormField
              name="middleName"
              label="Middle Name"
            />
            <FormField
              name="lastName"
              label="Last Name"
              required={true}
            />
          </div>
          
          <FormTextarea
            name="residentialAddress"
            label="Residential Address"
            required={true}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormSelect
              name="gender"
              label="Gender"
              required={true}
              options={[
                { value: 'male', label: 'Male' },
                { value: 'female', label: 'Female' }
              ]}
            />
            <FormField
              name="position"
              label="Position/Role"
              required={true}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormDatePicker name="dateOfBirth" label="Date of Birth" required={true} />
            <FormField
              name="placeOfBirth"
              label="Place of Birth"
              required={true}
            />
          </div>
          
          <FormSelect
            name="otherSourceOfIncome"
            label="Other Source of Income"
            required={true}
            options={[
              { value: 'salary', label: 'Salary or Business Income' },
              { value: 'investments', label: 'Investments or Dividends' },
              { value: 'other', label: 'Other (please specify)' }
            ]}
          />
          
          {watchedValues.otherSourceOfIncome === 'other' && (
            <FormField
              name="otherSourceOfIncomeOther"
              label="Please specify income source"
              required={true}
            />
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              name="nationality"
              label="Nationality"
              required={true}
            />
            <FormField
              name="phoneNumber"
              label="Phone Number"
              required={true}
              maxLength={15}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              name="bvn"
              label="BVN"
              required={true}
              maxLength={11}
            />
            <FormField
              name="taxIdNumber"
              label="Tax ID Number"
            />
            <FormField
              name="occupation"
              label="Occupation"
              required={true}
            />
          </div>
          
          <FormField
            name="email"
            label="Email"
            type="email"
            required={true}
          />
          
          <FormSelect
            name="validMeansOfId"
            label="Valid Means of ID"
            required={true}
            options={[
              { value: 'passport', label: 'International Passport' },
              { value: 'nimc', label: 'NIMC' },
              { value: 'driversLicense', label: 'Drivers Licence' },
              { value: 'votersCard', label: 'Voters Card' }
            ]}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <FormField
              name="identificationNumber"
              label="Identification Number"
              required={true}
            />
            <FormDatePicker name="issuedDate" label="Issued Date" required={true} />
            <FormDatePicker name="expiryDate" label="Expiry Date" />
            <FormField
              name="issuingBody"
              label="Issuing Body"
              required={true}
            />
          </div>
        </div>
      )
    },
    {
      id: 'additional',
      title: 'Additional Information',
      component: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              name="agentName"
              label="Agent Name"
              required={true}
            />
            <FormField
              name="naicomLicenseNumber"
              label="NAICOM License Number (RIA)"
              required={true}
            />
          </div>
          
          <FormTextarea
            name="agentsOfficeAddress"
            label="Agents Office Address"
            required={true}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormDatePicker name="licenseIssuedDate" label="License Issued Date" required={true} />
            <FormDatePicker name="licenseExpiryDate" label="License Expiry Date" required={true} />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              name="emailAddress"
              label="Email Address"
              type="email"
              required={true}
            />
            <FormField
              name="website"
              label="Website"
              required={true}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              name="mobileNumber"
              label="Mobile Number"
              required={true}
              maxLength={15}
            />
            <FormField
              name="taxIdentificationNumber"
              label="Tax Identification Number"
            />
            <FormField
              name="arianMembershipNumber"
              label="ARIAN Membership Number"
              required={true}
            />
          </div>
          
          <FormTextarea
            name="listOfAgentsApprovedPrincipals"
            label="List of Agents Approved Principals"
            required={true}
          />
        </div>
      )
    },
    {
      id: 'financial',
      title: 'Financial Information',
      component: (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Local Bank Account Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              name="localAccountNumber"
              label="Account Number"
              required={true}
              maxLength={10}
            />
            <FormField
              name="localBankName"
              label="Bank Name"
              required={true}
            />
            <FormField
              name="localBankBranch"
              label="Bank Branch"
              required={true}
            />
          </div>
          
          <FormDatePicker name="localAccountOpeningDate" label="Account Opening Date" required={true} />
          
          <h3 className="text-lg font-semibold mt-6">Foreign Bank Account Details (Optional)</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              name="foreignAccountNumber"
              label="Account Number"
            />
            <FormField
              name="foreignBankName"
              label="Bank Name"
            />
            <FormField
              name="foreignBankBranch"
              label="Bank Branch"
            />
          </div>
          
          <FormDatePicker name="foreignAccountOpeningDate" label="Account Opening Date" />

          <h3 className="text-lg font-semibold mt-6">Required Documents</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Upload Agent ID <span className="required-asterisk">*</span></Label>
              <FileUpload
                accept=".png,.jpg,.jpeg,.pdf"
                onFileSelect={(file) => {
                  setUploadedFiles(prev => ({
                    ...prev,
                    agentId: file
                  }));
                  formMethods.setValue('agentId', file);
                  if (formMethods.formState.errors.agentId) {
                    formMethods.clearErrors('agentId');
                  }
                }}
                maxSize={3 * 1024 * 1024}
              />
              {uploadedFiles.agentId && (
                <div className="flex items-center gap-2 mt-2 text-sm text-green-600">
                  <Check className="h-4 w-4" />
                  {uploadedFiles.agentId.name}
                </div>
              )}
              {formMethods.formState.errors.agentId && (
                <p className="text-sm text-destructive">
                  {formMethods.formState.errors.agentId.message?.toString()}
                </p>
              )}
            </div>

            <div>
              <Label>Upload NAICOM Certificate <span className="required-asterisk">*</span></Label>
              <FileUpload
                accept=".png,.jpg,.jpeg,.pdf"
                onFileSelect={(file) => {
                  setUploadedFiles(prev => ({
                    ...prev,
                    naicomCertificate: file
                  }));
                  formMethods.setValue('naicomCertificate', file);
                  if (formMethods.formState.errors.naicomCertificate) {
                    formMethods.clearErrors('naicomCertificate');
                  }
                }}
                maxSize={3 * 1024 * 1024}
              />
              {uploadedFiles.naicomCertificate && (
                <div className="flex items-center gap-2 mt-2 text-sm text-green-600">
                  <Check className="h-4 w-4" />
                  {uploadedFiles.naicomCertificate.name}
                </div>
              )}
              {formMethods.formState.errors.naicomCertificate && (
                <p className="text-sm text-destructive">
                  {formMethods.formState.errors.naicomCertificate.message?.toString()}
                </p>
              )}
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'declaration',
      title: 'Declaration',
      component: (
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-start space-x-2">
              <Checkbox
                id="agreeToDataPrivacy"
                checked={watchedValues.agreeToDataPrivacy || false}
                onCheckedChange={(checked) => {
                  formMethods.setValue('agreeToDataPrivacy', checked);
                  if (formMethods.formState.errors.agreeToDataPrivacy) {
                    formMethods.clearErrors('agreeToDataPrivacy');
                  }
                }}
                className={formMethods.formState.errors.agreeToDataPrivacy ? 'border-destructive' : ''}
              />
              <div className="grid gap-1.5 leading-none">
                <Label
                  htmlFor="agreeToDataPrivacy"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  I agree to the data privacy policy <span className="required-asterisk">*</span>
                </Label>
                <p className="text-xs text-muted-foreground">
                  By checking this box, you consent to the collection and processing of your personal data.
                </p>
              </div>
            </div>
            {formMethods.formState.errors.agreeToDataPrivacy && (
              <p className="text-sm text-destructive">
                {formMethods.formState.errors.agreeToDataPrivacy.message?.toString()}
              </p>
            )}
          </div>

          <FormField
            name="signature"
            label="Digital Signature"
            required={true}
            placeholder="Type your full name as digital signature"
          />
        </div>
      )
    }
  ];

  if (showSuccess) {
    return (
      <SuccessModal
        isOpen={showSuccess}
        onClose={() => setShowSuccess(false)}
        title="Agents CDD Submitted Successfully!"
        message="Your Agents Customer Due Diligence form has been submitted and is being processed. You will receive a confirmation email shortly."
      />
    );
  }

  if (showPostAuthLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="container mx-auto px-4 py-8">
        <FormProvider {...formMethods}>
          <MultiStepForm
            steps={steps}
            onSubmit={onFinalSubmit}
            stepFieldMappings={stepFieldMappings}
            formTitle="Agents Customer Due Diligence (CDD)"
            formDescription="Please fill out this form completely and accurately. All required fields must be completed."
          />
        </FormProvider>

        <Dialog open={showSummary} onOpenChange={setShowSummary}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Review Your Submission</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p><strong>Name:</strong> {watchedValues.firstName} {watchedValues.middleName} {watchedValues.lastName}</p>
                  <p><strong>Address:</strong> {watchedValues.residentialAddress}</p>
                  <p><strong>Gender:</strong> {watchedValues.gender}</p>
                  <p><strong>Position:</strong> {watchedValues.position}</p>
                  <p><strong>Date of Birth:</strong> {watchedValues.dateOfBirth ? format(new Date(watchedValues.dateOfBirth), 'PPP') : ''}</p>
                  <p><strong>Place of Birth:</strong> {watchedValues.placeOfBirth}</p>
                  <p><strong>Nationality:</strong> {watchedValues.nationality}</p>
                  <p><strong>Phone:</strong> {watchedValues.phoneNumber}</p>
                  <p><strong>Email:</strong> {watchedValues.email}</p>
                  <p><strong>BVN:</strong> {watchedValues.bvn}</p>
                  <p><strong>Occupation:</strong> {watchedValues.occupation}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Additional Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p><strong>Agent Name:</strong> {watchedValues.agentName}</p>
                  <p><strong>Office Address:</strong> {watchedValues.agentsOfficeAddress}</p>
                  <p><strong>NAICOM License:</strong> {watchedValues.naicomLicenseNumber}</p>
                  <p><strong>Email Address:</strong> {watchedValues.emailAddress}</p>
                  <p><strong>Website:</strong> {watchedValues.website}</p>
                  <p><strong>Mobile:</strong> {watchedValues.mobileNumber}</p>
                  <p><strong>ARIAN Membership:</strong> {watchedValues.arianMembershipNumber}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Financial Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p><strong>Account Number:</strong> {watchedValues.localAccountNumber}</p>
                  <p><strong>Bank Name:</strong> {watchedValues.localBankName}</p>
                  <p><strong>Bank Branch:</strong> {watchedValues.localBankBranch}</p>
                </CardContent>
              </Card>

              <div className="flex gap-4 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowSummary(false)}
                  className="flex-1"
                >
                  Back to Edit
                </Button>
                <Button
                  onClick={() => formMethods.handleSubmit(handleSubmit)()}
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Form'
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AgentsCDD;
