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
import { useEnhancedFormSubmit } from '@/hooks/useEnhancedFormSubmit';
import FormLoadingModal from '@/components/common/FormLoadingModal';
import FormSummaryDialog from '@/components/common/FormSummaryDialog';
import SuccessModal from '@/components/common/SuccessModal';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import DatePicker from '@/components/common/DatePicker';

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
  sourceOfIncome: yup.string().required("Other source of income is required"),
  sourceOfIncomeOther: yup.string().when('sourceOfIncome', {
    is: 'other',
    then: (schema) => schema.required('Please specify income source'),
    otherwise: (schema) => schema.notRequired()
  }),
  nationality: yup.string().required("Nationality is required"),
  GSMno: yup.string()
    .required("Phone number is required")
    .matches(/^[\d\s+\-()]+$/, "Invalid phone number format")
    .max(15, "Phone number cannot exceed 15 characters"),
  BVNNumber: yup.string()
    .required("BVN is required")
    .matches(/^\d+$/, "BVN must contain only numbers")
    .length(11, "BVN must be exactly 11 digits"),
  NINNumber: yup.string()
    .required("NIN is required")
    .matches(/^\d+$/, "NIN must contain only numbers")
    .length(11, "NIN must be exactly 11 digits"),
  taxIDNumber: yup.string(),
  occupation: yup.string().required("Occupation is required"),
  emailAddress: yup.string()
    .required("Email is required")
    .email("Please enter a valid email")
    .typeError("Please enter a valid email"),
  idType: yup.string().required("Valid means of ID is required"),
  idNumber: yup.string().required("Identification number is required"),
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
  agentsName: yup.string().required("Agent name is required"),
  agentsAddress: yup.string().required("Agents office address is required"),
  naicomNo: yup.string().required("NAICOM license number is required"),
  lisenceIssuedDate: yup.date()
    .required("License issued date is required")
    .test('not-future', 'Date cannot be in the future', function(value) {
      if (!value) return false;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return value <= today;
    })
    .typeError('Please select a valid date'),
  lisenceExpiryDate: yup.date()
    .required("License expiry date is required")
    .test('not-past', 'Expiry date cannot be in the past', function(value) {
      if (!value) return false;
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      return value > today;
    })
    .typeError('Please select a valid date'),
  agentsEmail: yup.string()
    .required("Email address is required")
    .email("Please enter a valid email")
    .typeError("Please enter a valid email"),
  website: yup.string().required("Website is required"),
  mobileNo: yup.string()
    .required("Mobile number is required")
    .matches(/^[\d\s+\-()]+$/, "Invalid phone number format")
    .max(15, "Phone number cannot exceed 15 characters"),
  taxIDNo: yup.string(),
  arian: yup.string().required("ARIAN membership number is required"),
  listOfAgents: yup.string().required("List of agents approved principals is required"),
  
  // Financial Info
  accountNumber: yup.string()
    .required("Account number is required")
    .matches(/^\d+$/, "Account number must contain only numbers")
    .max(10, "Account number cannot exceed 10 digits"),
  bankName: yup.string().required("Bank name is required"),
  bankBranch: yup.string().required("Bank branch is required"),
  accountOpeningDate: yup.date()
    .required("Account opening date is required")
    .test('not-future', 'Date cannot be in the future', function(value) {
      if (!value) return false;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return value <= today;
    })
    .typeError('Please select a valid date'),
  accountNumber2: yup.string(),
  bankName2: yup.string(),
  bankBranch2: yup.string(),
  accountOpeningDate2: yup.date()
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
  sourceOfIncome: '',
  sourceOfIncomeOther: '',
  nationality: '',
  GSMno: '',
  BVNNumber: '',
  NINNumber: '',
  taxIDNumber: '',
  occupation: '',
  emailAddress: '',
  idType: '',
  idNumber: '',
  issuedDate: undefined,
  expiryDate: undefined,
  issuingBody: '',
  agentsName: '',
  agentsAddress: '',
  naicomNo: '',
  lisenceIssuedDate: undefined,
  lisenceExpiryDate: undefined,
  agentsEmail: '',
  website: '',
  mobileNo: '',
  taxIDNo: '',
  arian: '',
  listOfAgents: '',
  accountNumber: '',
  bankName: '',
  bankBranch: '',
  accountOpeningDate: undefined,
  accountNumber2: '',
  bankName2: '',
  bankBranch2: '',
  accountOpeningDate2: undefined,
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



const AgentsCDD: React.FC = () => {
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File>>({});
  const formMethods = useForm<any>({
    resolver: yupResolver(agentsCDDSchema),
    defaultValues,
    mode: 'onChange'
  });

  const { saveDraft, clearDraft } = useFormDraft('agents-cdd', formMethods);
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
    formType: 'Agents CDD',
    onSuccess: () => clearDraft()
  });

  // Step field mappings for validation
  const stepFieldMappings = {
    0: ['firstName', 'lastName', 'residentialAddress', 'gender', 'position', 'dateOfBirth', 'placeOfBirth', 'sourceOfIncome', 'nationality', 'GSMno', 'BVNNumber', 'NINNumber', 'occupation', 'emailAddress', 'idType', 'idNumber', 'issuedDate', 'issuingBody'],
    1: ['agentsName', 'agentsAddress', 'naicomNo', 'lisenceIssuedDate', 'lisenceExpiryDate', 'agentsEmail', 'website', 'mobileNo', 'arian', 'listOfAgents'],
    2: ['accountNumber', 'bankName', 'bankBranch', 'accountOpeningDate', 'agentId', 'naicomCertificate'],
    3: ['agreeToDataPrivacy', 'signature']
  };

  // Auto-save draft on form changes
  useEffect(() => {
    const subscription = formMethods.watch((data) => {
      saveDraft(data);
    });
    return () => subscription.unsubscribe();
  }, [formMethods, saveDraft]);


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

  const onFinalSubmit = async (data: any) => {
    try {
      const sanitizedData = sanitizeData(data);
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
        formType: 'Agents CDD'
      };

      await handleEnhancedSubmit(finalData);
    } catch (error) {
      console.error('Error:', error);
      toast({ title: 'Error', description: error instanceof Error ? error.message : 'Submission failed', variant: 'destructive' });
    }
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
            <DatePicker name="dateOfBirth" label="Date of Birth" required={true} />
            <FormField
              name="placeOfBirth"
              label="Place of Birth"
              required={true}
            />
          </div>
          
          <FormSelect
            name="sourceOfIncome"
            label="Other Source of Income"
            required={true}
            options={[
              { value: 'salary', label: 'Salary Or Business Income' },
              { value: 'investments', label: 'Investments Or Dividends' },
              { value: 'other', label: 'Other(please specify)' }
            ]}
          />
          
          {watchedValues.sourceOfIncome === 'other' && (
            <FormField
              name="sourceOfIncomeOther"
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
              name="GSMno"
              label="Phone Number"
              required={true}
              maxLength={15}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              name="BVNNumber"
              label="BVN"
              required={true}
              maxLength={11}
            />
            <FormField
              name="NINNumber"
              label="NIN (National Identification Number)"
              required={true}
              maxLength={11}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              name="taxIDNumber"
              label="Tax ID Number"
            />
            <FormField
              name="occupation"
              label="Occupation"
              required={true}
            />
          </div>
          
          <FormField
            name="emailAddress"
            label="Email"
            type="email"
            required={true}
          />
          
          <FormSelect
            name="idType"
            label="Valid means of ID"
            required={true}
            options={[
              { value: 'passport', label: 'International passport' },
              { value: 'nimc', label: 'NIMC' },
              { value: 'driversLicense', label: 'Drivers licence' },
              { value: 'votersCard', label: 'Voters Card' }
            ]}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <FormField
              name="idNumber"
              label="Identification Number"
              required={true}
            />
            <DatePicker name="issuedDate" label="Issued Date" required={true} />
            <DatePicker name="expiryDate" label="Expiry Date" />
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
              name="agentsName"
              label="Agent Name"
              required={true}
            />
            <FormField
              name="naicomNo"
              label="Naicom Lisence Number (RIA)"
              required={true}
            />
          </div>
          
          <FormTextarea
            name="agentsAddress"
            label="Agents Office Address"
            required={true}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DatePicker name="lisenceIssuedDate" label="Lisence Issued Date" required={true} />
            <DatePicker name="lisenceExpiryDate" label="Lisence Expiry Date" required={true} />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              name="agentsEmail"
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
              name="mobileNo"
              label="Mobile Number"
              required={true}
              maxLength={15}
            />
            <FormField
              name="taxIDNo"
              label="Tax Identification Number"
            />
            <FormField
              name="arian"
              label="ARIAN Membership Number"
              required={true}
            />
          </div>
          
          <FormTextarea
            name="listOfAgents"
            label="List of Agents Approved Principals (Insurers)"
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
          <h3 className="text-lg font-semibold">Local Account Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              name="accountNumber"
              label="Account Number"
              required={true}
              maxLength={10}
            />
            <FormField
              name="bankName"
              label="Bank Name"
              required={true}
            />
            <FormField
              name="bankBranch"
              label="Bank Branch"
              required={true}
            />
          </div>
          
          <DatePicker name="accountOpeningDate" label="Account Opening Date" required={true} />
          
          <h3 className="text-lg font-semibold mt-6">Foreign Account Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              name="accountNumber2"
              label="Account Number"
            />
            <FormField
              name="bankName2"
              label="Bank Name"
            />
            <FormField
              name="bankBranch2"
              label="Bank Branch"
            />
          </div>
          
          <DatePicker name="accountOpeningDate2" label="Account Opening Date" />

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="container mx-auto px-4 py-8">
        <FormProvider {...formMethods}>
          <MultiStepForm
            steps={steps}
            onSubmit={onFinalSubmit}
            stepFieldMappings={stepFieldMappings}
            formMethods={formMethods}
          />
        </FormProvider>

        <FormLoadingModal isOpen={showLoading} message={loadingMessage} />
        
        <FormSummaryDialog
          open={showSummary}
          onOpenChange={setShowSummary}
          formData={submissionData}
          formType="Agents CDD"
          onConfirm={confirmSubmit}
          isSubmitting={isSubmitting}
          renderSummary={(data) => {
            if (!data) return null;
            
            const formatDate = (date: any) => {
              if (!date) return 'Not provided';
              try {
                return format(new Date(date), 'dd/MM/yyyy');
              } catch {
                return 'Invalid date';
              }
            };

            return (
              <>
                {/* Personal Information */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
                  <div className="space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-2">
                      <div className="text-sm font-medium text-gray-600">Full Name:</div>
                      <div className="sm:col-span-2 text-sm text-gray-900">
                        {[data.firstName, data.middleName, data.lastName].filter(Boolean).join(' ')}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-2">
                      <div className="text-sm font-medium text-gray-600">Residential Address:</div>
                      <div className="sm:col-span-2 text-sm text-gray-900">{data.residentialAddress}</div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-2">
                      <div className="text-sm font-medium text-gray-600">Gender:</div>
                      <div className="sm:col-span-2 text-sm text-gray-900 capitalize">{data.gender}</div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-2">
                      <div className="text-sm font-medium text-gray-600">Position/Role:</div>
                      <div className="sm:col-span-2 text-sm text-gray-900">{data.position}</div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-2">
                      <div className="text-sm font-medium text-gray-600">Date of Birth:</div>
                      <div className="sm:col-span-2 text-sm text-gray-900">{formatDate(data.dateOfBirth)}</div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-2">
                      <div className="text-sm font-medium text-gray-600">Place of Birth:</div>
                      <div className="sm:col-span-2 text-sm text-gray-900">{data.placeOfBirth}</div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-2">
                      <div className="text-sm font-medium text-gray-600">Nationality:</div>
                      <div className="sm:col-span-2 text-sm text-gray-900">{data.nationality}</div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-2">
                      <div className="text-sm font-medium text-gray-600">Occupation:</div>
                      <div className="sm:col-span-2 text-sm text-gray-900">{data.occupation}</div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-2">
                      <div className="text-sm font-medium text-gray-600">Source of Income:</div>
                      <div className="sm:col-span-2 text-sm text-gray-900">
                        {data.sourceOfIncome === 'other' && data.sourceOfIncomeOther 
                          ? data.sourceOfIncomeOther 
                          : data.sourceOfIncome}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t my-4" />

                {/* Contact Information */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-gray-900">Contact Information</h3>
                  <div className="space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-2">
                      <div className="text-sm font-medium text-gray-600">Email:</div>
                      <div className="sm:col-span-2 text-sm text-gray-900">{data.emailAddress}</div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-2">
                      <div className="text-sm font-medium text-gray-600">Phone Number:</div>
                      <div className="sm:col-span-2 text-sm text-gray-900">{data.GSMno}</div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-2">
                      <div className="text-sm font-medium text-gray-600">BVN:</div>
                      <div className="sm:col-span-2 text-sm text-gray-900">{data.BVNNumber}</div>
                    </div>
                    {data.taxIDNumber && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-2">
                        <div className="text-sm font-medium text-gray-600">Tax ID:</div>
                        <div className="sm:col-span-2 text-sm text-gray-900">{data.taxIDNumber}</div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-t my-4" />

                {/* Identification */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-gray-900">Identification</h3>
                  <div className="space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-2">
                      <div className="text-sm font-medium text-gray-600">ID Type:</div>
                      <div className="sm:col-span-2 text-sm text-gray-900">{data.idType}</div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-2">
                      <div className="text-sm font-medium text-gray-600">ID Number:</div>
                      <div className="sm:col-span-2 text-sm text-gray-900">{data.idNumber}</div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-2">
                      <div className="text-sm font-medium text-gray-600">Issuing Body:</div>
                      <div className="sm:col-span-2 text-sm text-gray-900">{data.issuingBody}</div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-2">
                      <div className="text-sm font-medium text-gray-600">Issued Date:</div>
                      <div className="sm:col-span-2 text-sm text-gray-900">{formatDate(data.issuedDate)}</div>
                    </div>
                    {data.expiryDate && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-2">
                        <div className="text-sm font-medium text-gray-600">Expiry Date:</div>
                        <div className="sm:col-span-2 text-sm text-gray-900">{formatDate(data.expiryDate)}</div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-t my-4" />

                {/* Agent Information */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-gray-900">Agent Information</h3>
                  <div className="space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-2">
                      <div className="text-sm font-medium text-gray-600">Agent Name:</div>
                      <div className="sm:col-span-2 text-sm text-gray-900">{data.agentsName}</div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-2">
                      <div className="text-sm font-medium text-gray-600">Office Address:</div>
                      <div className="sm:col-span-2 text-sm text-gray-900">{data.agentsAddress}</div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-2">
                      <div className="text-sm font-medium text-gray-600">NAICOM License No:</div>
                      <div className="sm:col-span-2 text-sm text-gray-900">{data.naicomNo}</div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-2">
                      <div className="text-sm font-medium text-gray-600">License Issued:</div>
                      <div className="sm:col-span-2 text-sm text-gray-900">{formatDate(data.lisenceIssuedDate)}</div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-2">
                      <div className="text-sm font-medium text-gray-600">License Expiry:</div>
                      <div className="sm:col-span-2 text-sm text-gray-900">{formatDate(data.lisenceExpiryDate)}</div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-2">
                      <div className="text-sm font-medium text-gray-600">Email:</div>
                      <div className="sm:col-span-2 text-sm text-gray-900">{data.agentsEmail}</div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-2">
                      <div className="text-sm font-medium text-gray-600">Website:</div>
                      <div className="sm:col-span-2 text-sm text-gray-900">{data.website}</div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-2">
                      <div className="text-sm font-medium text-gray-600">Mobile:</div>
                      <div className="sm:col-span-2 text-sm text-gray-900">{data.mobileNo}</div>
                    </div>
                    {data.taxIDNo && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-2">
                        <div className="text-sm font-medium text-gray-600">Tax ID:</div>
                        <div className="sm:col-span-2 text-sm text-gray-900">{data.taxIDNo}</div>
                      </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-2">
                      <div className="text-sm font-medium text-gray-600">ARIAN Membership:</div>
                      <div className="sm:col-span-2 text-sm text-gray-900">{data.arian}</div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-2">
                      <div className="text-sm font-medium text-gray-600">Approved Principals:</div>
                      <div className="sm:col-span-2 text-sm text-gray-900">{data.listOfAgents}</div>
                    </div>
                  </div>
                </div>

                <div className="border-t my-4" />

                {/* Financial Information */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-gray-900">Financial Information</h3>
                  <div className="space-y-2">
                    <h4 className="text-md font-medium text-gray-800 mt-2">Local Account</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-2">
                      <div className="text-sm font-medium text-gray-600">Account Number:</div>
                      <div className="sm:col-span-2 text-sm text-gray-900">{data.accountNumber}</div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-2">
                      <div className="text-sm font-medium text-gray-600">Bank Name:</div>
                      <div className="sm:col-span-2 text-sm text-gray-900">{data.bankName}</div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-2">
                      <div className="text-sm font-medium text-gray-600">Branch:</div>
                      <div className="sm:col-span-2 text-sm text-gray-900">{data.bankBranch}</div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-2">
                      <div className="text-sm font-medium text-gray-600">Opening Date:</div>
                      <div className="sm:col-span-2 text-sm text-gray-900">{formatDate(data.accountOpeningDate)}</div>
                    </div>

                    {data.accountNumber2 && (
                      <>
                        <h4 className="text-md font-medium text-gray-800 mt-4">Foreign Account</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-2">
                          <div className="text-sm font-medium text-gray-600">Account Number:</div>
                          <div className="sm:col-span-2 text-sm text-gray-900">{data.accountNumber2}</div>
                        </div>
                        {data.bankName2 && (
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-2">
                            <div className="text-sm font-medium text-gray-600">Bank Name:</div>
                            <div className="sm:col-span-2 text-sm text-gray-900">{data.bankName2}</div>
                          </div>
                        )}
                        {data.bankBranch2 && (
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-2">
                            <div className="text-sm font-medium text-gray-600">Branch:</div>
                            <div className="sm:col-span-2 text-sm text-gray-900">{data.bankBranch2}</div>
                          </div>
                        )}
                        {data.accountOpeningDate2 && (
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-2">
                            <div className="text-sm font-medium text-gray-600">Opening Date:</div>
                            <div className="sm:col-span-2 text-sm text-gray-900">{formatDate(data.accountOpeningDate2)}</div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                <div className="border-t my-4" />

                {/* Documents */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-gray-900">Documents</h3>
                  <div className="space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-2">
                      <div className="text-sm font-medium text-gray-600">Agent ID:</div>
                      <div className="sm:col-span-2 text-sm text-gray-900">
                        {typeof data.agentId === 'string' ? 'Uploaded' : data.agentId?.name || 'Uploaded'}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-2">
                      <div className="text-sm font-medium text-gray-600">NAICOM Certificate:</div>
                      <div className="sm:col-span-2 text-sm text-gray-900">
                        {typeof data.naicomCertificate === 'string' ? 'Uploaded' : data.naicomCertificate?.name || 'Uploaded'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t my-4" />

                {/* Declaration */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-gray-900">Declaration</h3>
                  <div className="space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-2">
                      <div className="text-sm font-medium text-gray-600">Data Privacy Agreement:</div>
                      <div className="sm:col-span-2 text-sm text-gray-900">
                        {data.agreeToDataPrivacy ? 'Agreed' : 'Not Agreed'}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-2">
                      <div className="text-sm font-medium text-gray-600">Digital Signature:</div>
                      <div className="sm:col-span-2 text-sm text-gray-900 font-signature italic">
                        {data.signature}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            );
          }}
        />

        <SuccessModal
          isOpen={showSuccess}
          onClose={closeSuccess}
          title="Agents CDD Submitted Successfully!"
          message="Your Agents Customer Due Diligence form has been submitted successfully."
        />
      </div>
    </div>
  );
};

export default AgentsCDD;

