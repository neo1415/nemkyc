import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray, FormProvider, useFormContext } from 'react-hook-form';
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
import { Calendar, CalendarIcon, Plus, Trash2, Upload, Edit2, Check, Loader2 } from 'lucide-react';
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

const brokersCDDSchema = yup.object().shape({
  // Company Info
  companyName: yup.string().required("Company name is required"),
  companyAddress: yup.string().required("Company address is required"),
  city: yup.string().required("City is required"),
  state: yup.string().required("State is required"),
  country: yup.string().required("Country is required"),
  emailAddress: yup.string()
    .required("Email is required")
    .email("Please enter a valid email")
    .typeError("Please enter a valid email"),
  website: yup.string().required("Website is required"),
  incorporationNumber: yup.string().required("Incorporation number is required"),
  registrationNumber: yup.string().required("Registration number is required"),
  incorporationState: yup.string().required("Incorporation state is required"),
  companyLegalForm: yup.string().required("Company legal form is required"),
  companyLegalFormOther: yup.string().when('companyLegalForm', {
    is: 'other',
    then: (schema) => schema.required('Please specify company type'),
    otherwise: (schema) => schema.notRequired()
  }),
  dateOfIncorporationRegistration: yup.date()
    .required("Date of incorporation/registration is required")
    .test('not-future', 'Date cannot be in the future', function(value) {
      if (!value) return false;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return value <= today;
    })
    .typeError('Please select a valid date'),
  natureOfBusiness: yup.string().required("Nature of business is required"),
  taxIdentificationNumber: yup.string().required("Tax identification number is required"),
  telephoneNumber: yup.string()
    .required("Telephone number is required")
    .matches(/^[\d\s+\-()]+$/, "Invalid phone number format")
    .max(15, "Phone number cannot exceed 15 characters"),
  
  // Directors
  directors: yup.array().of(yup.object().shape({
    title: yup.string().required("Title is required"),
    gender: yup.string().required("Gender is required"),
    firstName: yup.string().required("First name is required"),
    middleName: yup.string(),
    lastName: yup.string().required("Last name is required"),
    dob: yup.date()
      .required("Date of birth is required")
      .test('age', 'Must be at least 18 years old', function(value) {
        if (!value) return false;
        const today = new Date();
        const eighteenYearsAgo = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
        return value <= eighteenYearsAgo;
      })
      .typeError('Please select a valid date'),
    placeOfBirth: yup.string().required("Place of birth is required"),
    nationality: yup.string().required("Nationality is required"),
    residenceCountry: yup.string().required("Residence country is required"),
    occupation: yup.string().required("Occupation is required"),
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
    NINNumber: yup.string()
      .required("NIN is required")
      .matches(/^\d+$/, "NIN must contain only numbers")
      .length(11, "NIN must be exactly 11 digits"),
    employersName: yup.string().required("Employer's name is required"),
    address: yup.string().required("Address is required"),
    taxIDNumber: yup.string(),
    intPassNo: yup.string(),
    passIssuedCountry: yup.string(),
    idType: yup.string().required("ID type is required"),
    idNumber: yup.string().required("Identification number is required"),
    issuedBy: yup.string().required("Issued by is required"),
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
      .nullable()
      .transform((value, originalValue) => {
        // Handle empty string or null
        if (originalValue === '' || originalValue === null || originalValue === undefined) {
          return null;
        }
        return value;
      })
      .test('not-past', 'Expiry date cannot be in the past', function(value) {
        if (!value) return true; // Optional field
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        return value > today;
      })
      .typeError('Please select a valid date'),
    sourceOfIncome: yup.string().required("Source of income is required"),
    sourceOfIncomeOther: yup.string().when('sourceOfIncome', {
      is: 'other',
      then: (schema) => schema.required('Please specify income source'),
      otherwise: (schema) => schema.notRequired()
    })
  })).min(1, "At least one director is required"),
  
  // Account Details
  localBankName: yup.string().required("Local bank name is required"),
  bankBranch: yup.string().required("Bank branch is required"),
  currentAccountNumber: yup.string()
    .required("Current account number is required")
    .matches(/^\d+$/, "Account number must contain only numbers")
    .max(10, "Account number cannot exceed 10 digits"),
  accountOpeningDate: yup.date()
    .required("Account opening date is required")
    .test('not-future', 'Date cannot be in the future', function(value) {
      if (!value) return false;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return value <= today;
    })
    .typeError('Please select a valid date'),
  domAccountNumber2: yup.string(),
  foreignBankName2: yup.string(),
  bankBranchName2: yup.string(),
  currency: yup.string(),
  accountOpeningDate2: yup.date()
    .test('not-future', 'Date cannot be in the future', function(value) {
      if (!value) return true; // Optional field
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return value <= today;
    })
    .typeError('Please select a valid date'),
  
  // File uploads
  Incorporation: yup.mixed().required("Certificate of incorporation is required"),
  identification: yup.mixed().required("Director 1 identification is required"),
  identification2: yup.mixed(), // Not required
  NAICOMForm: yup.mixed(), // Not required
  
  // Declaration
  agreeToDataPrivacy: yup.boolean().oneOf([true], "You must agree to data privacy"),
  signature: yup.string().required("Signature is required")
});

const defaultValues = {
  companyName: '',
  companyAddress: '',
  city: '',
  state: '',
  country: '',
  emailAddress: '',
  website: '',
  incorporationNumber: '',
  registrationNumber: '',
  incorporationState: '',
  companyLegalForm: '',
  companyLegalFormOther: '',
  dateOfIncorporationRegistration: undefined,
  natureOfBusiness: '',
  taxIdentificationNumber: '',
  telephoneNumber: '',
  directors: [{
    title: '',
    gender: '',
    firstName: '',
    middleName: '',
    lastName: '',
    dob: undefined,
    placeOfBirth: '',
    nationality: '',
    residenceCountry: '',
    occupation: '',
    email: '',
    phoneNumber: '',
    BVNNumber: '',
    NINNumber: '',
    employersName: '',
    address: '',
    taxIDNumber: '',
    intPassNo: '',
    passIssuedCountry: '',
    idType: '',
    idNumber: '',
    issuedBy: '',
    issuedDate: undefined,
    expiryDate: undefined,
    sourceOfIncome: '',
    sourceOfIncomeOther: ''
  }],
  localBankName: '',
  bankBranch: '',
  currentAccountNumber: '',
  accountOpeningDate: undefined,
  domAccountNumber2: '',
  foreignBankName2: '',
  bankBranchName2: '',
  currency: '',
  accountOpeningDate2: undefined,
  Incorporation: '',
  identification: '',
  identification2: '',
  NAICOMForm: '',
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



const BrokersCDD: React.FC = () => {
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File>>({});
  const formMethods = useForm<any>({
    resolver: yupResolver(brokersCDDSchema),
    defaultValues,
    mode: 'onChange'
  });

  const { saveDraft, clearDraft } = useFormDraft('brokers-cdd', formMethods);
  const { fields, append, remove } = useFieldArray({
    control: formMethods.control,
    name: 'directors'
  });
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
    formType: 'Brokers CDD',
    onSuccess: () => clearDraft()
  });

  // Step field mappings for validation
  const stepFieldMappings = {
    0: ['companyName', 'companyAddress', 'city', 'state', 'country', 'emailAddress', 'website', 'incorporationNumber', 'registrationNumber', 'incorporationState', 'companyLegalForm', 'dateOfIncorporationRegistration', 'natureOfBusiness', 'taxIdentificationNumber', 'telephoneNumber'],
    1: fields.flatMap((_, index) => [
      `directors.${index}.title`,
      `directors.${index}.gender`,
      `directors.${index}.firstName`,
      `directors.${index}.middleName`,
      `directors.${index}.lastName`,
      `directors.${index}.dob`,
      `directors.${index}.placeOfBirth`,
      `directors.${index}.nationality`,
      `directors.${index}.residenceCountry`,
      `directors.${index}.occupation`,
      `directors.${index}.email`,
      `directors.${index}.phoneNumber`,
      `directors.${index}.BVNNumber`,
      `directors.${index}.NINNumber`,
      `directors.${index}.employersName`,
      `directors.${index}.address`,
      `directors.${index}.idType`,
      `directors.${index}.idNumber`,
      `directors.${index}.issuedBy`,
      `directors.${index}.issuedDate`,
      `directors.${index}.expiryDate`,
      `directors.${index}.sourceOfIncome`
    ]),
    2: ['localBankName', 'bankBranch', 'currentAccountNumber', 'accountOpeningDate', 'Incorporation', 'identification'],
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
        } else if (Array.isArray(data[key])) {
          // Handle arrays (like directors)
          sanitized[key] = data[key].map((item: any) => {
            if (typeof item === 'object' && item !== null) {
              const sanitizedItem: any = {};
              Object.keys(item).forEach(itemKey => {
                if (item[itemKey] !== undefined) {
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
      const sanitizedData = sanitizeData(data);
      const fileUploadPromises: Array<Promise<[string, string]>> = [];
      
      for (const [key, file] of Object.entries(uploadedFiles)) {
        if (file) {
          fileUploadPromises.push(
            uploadFile(file, `brokers-cdd/${Date.now()}-${file.name}`).then(url => [key, url])
          );
        }
      }

      const fileResults = await Promise.all(fileUploadPromises);
      const fileUrls = Object.fromEntries(fileResults);

      const finalData = {
        ...sanitizedData,
        ...fileUrls,
        status: 'processing',
        formType: 'Brokers CDD'
      };

      await handleEnhancedSubmit(finalData);
    } catch (error) {
      console.error('Error:', error);
      toast({ title: 'Error', description: error instanceof Error ? error.message : 'Submission failed', variant: 'destructive' });
    }
  };

  const steps = [
    {
      id: 'company',
      title: 'Company Information',
      component: (
        <div className="space-y-4">
          <FormField
            name="companyName"
            label="Company Name"
            required={true}
          />
          
          <FormTextarea
            name="companyAddress"
            label="Company Address"
            required={true}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              name="city"
              label="City"
              required={true}
            />
            <FormField
              name="state"
              label="State"
              required={true}
            />
            <FormField
              name="country"
              label="Country"
              required={true}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              name="incorporationNumber"
              label="Incorporation/RC Number"
              required={true}
            />
            <FormField
              name="registrationNumber"
              label="Registration Number"
              required={true}
            />
            <FormField
              name="incorporationState"
              label="Incorporation State"
              required={true}
            />
          </div>

          <FormSelect
            name="companyLegalForm"
            label="Company Type"
            required={true}
            options={[
              { value: 'sole-proprietor', label: 'Sole Proprietor' },
              { value: 'unlimited-liability', label: 'Unlimited Liability Company' },
              { value: 'limited-liability', label: 'Limited Liability Company' },
              { value: 'public-limited', label: 'Public Limited Company' },
              { value: 'joint-venture', label: 'Joint Venture' },
              { value: 'other', label: 'Other(please specify)' }
            ]}
            placeholder="Choose Company Type"
          />
          
          {watchedValues.companyLegalForm === 'other' && (
            <FormField
              name="companyLegalFormOther"
              label="Please specify company type"
              required={true}
            />
          )}
          
          <DatePicker
            name="dateOfIncorporationRegistration"
            label="Date Of Incorporation/Registration"
            required={true}
          />
          
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
          
          <FormTextarea
            name="natureOfBusiness"
            label="Business Type/Occupation"
            required={true}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              name="taxIdentificationNumber"
              label="Tax Number"
              required={true}
            />
            <FormField
              name="telephoneNumber"
              label="Telephone Number"
              maxLength={15}
              required={true}
            />
          </div>
        </div>
      )
    },
    {
      id: 'directors',
      title: 'Directors Information',
      component: (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Directors</h3>
            <Button
              type="button"
              onClick={() => append({
                title: '',
                gender: '',
                firstName: '',
                middleName: '',
                lastName: '',
                dob: '',
                placeOfBirth: '',
                nationality: '',
                residenceCountry: '',
                occupation: '',
                email: '',
                phoneNumber: '',
                BVNNumber: '',
                employersName: '',
                address: '',
                taxIDNumber: '',
                intPassNo: '',
                passIssuedCountry: '',
                idType: '',
                idNumber: '',
                issuedBy: '',
                issuedDate: '',
                expiryDate: '',
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
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => remove(index)}
                  disabled={fields.length === 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormSelect
                    name={`directors.${index}.title`}
                    label="Title"
                    required={true}
                    options={[
                      { value: 'Mr', label: 'Mr' },
                      { value: 'Mrs', label: 'Mrs' },
                      { value: 'Chief', label: 'Chief' },
                      { value: 'Dr', label: 'Dr' },
                      { value: 'Other', label: 'Other' }
                    ]}
                    placeholder="Select title"
                  />
                  
                  <FormSelect
                    name={`directors.${index}.gender`}
                    label="Gender"
                    required={true}
                    options={[
                      { value: 'male', label: 'Male' },
                      { value: 'female', label: 'Female' }
                    ]}
                    placeholder="Select gender"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    name={`directors.${index}.firstName`}
                    label="First Name"
                    required={true}
                  />
                  <FormField
                    name={`directors.${index}.middleName`}
                    label="Middle Name"
                  />
                  <FormField
                    name={`directors.${index}.lastName`}
                    label="Last Name"
                    required={true}
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
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    name={`directors.${index}.nationality`}
                    label="Nationality"
                    required={true}
                  />
                  <FormField
                    name={`directors.${index}.residenceCountry`}
                    label="Residence Country"
                    required={true}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    name={`directors.${index}.occupation`}
                    label="Occupation"
                    required={true}
                  />
                  <FormField
                    name={`directors.${index}.email`}
                    label="Email"
                    type="email"
                    required={true}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    name={`directors.${index}.phoneNumber`}
                    label="Phone Number"
                    maxLength={15}
                    required={true}
                  />
                  <FormField
                    name={`directors.${index}.BVNNumber`}
                    label="BVN"
                    maxLength={11}
                    required={true}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    name={`directors.${index}.NINNumber`}
                    label="NIN (National Identification Number)"
                    maxLength={11}
                    required={true}
                  />
                  <FormField
                    name={`directors.${index}.employersName`}
                    label="Employer's Name"
                    required={true}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    name={`directors.${index}.taxIDNumber`}
                    label="Tax ID Number"
                  />
                  <FormField
                    name={`directors.${index}.intPassNo`}
                    label="International Passport Number"
                  />
                </div>
                
                <FormField
                  name={`directors.${index}.passIssuedCountry`}
                  label="Passport Issued Country"
                />
                
                <FormTextarea
                  name={`directors.${index}.address`}
                  label="Address"
                  required={true}
                />
                
                <FormSelect
                  name={`directors.${index}.idType`}
                  label="ID Type"
                  required={true}
                  options={[
                    { value: 'passport', label: 'International passport' },
                    { value: 'nimc', label: 'NIMC' },
                    { value: 'driversLicense', label: 'Drivers licence' },
                    { value: 'votersCard', label: 'Voters Card' }
                  ]}
                  placeholder="Choose Identification Type"
                />
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    name={`directors.${index}.idNumber`}
                    label="Identification Number"
                    required={true}
                  />
                  <FormField
                    name={`directors.${index}.issuedBy`}
                    label="Issued By (Issuing Country)"
                    required={true}
                  />
                  <DatePicker
                    name={`directors.${index}.issuedDate`}
                    label="Issued Date"
                    required={true}
                  />
                </div>
                
                <DatePicker
                  name={`directors.${index}.expiryDate`}
                  label="Expiry Date"
                />
                
                <FormSelect
                  name={`directors.${index}.sourceOfIncome`}
                  label="Source of Income"
                  required={true}
                  options={[
                    { value: 'salary', label: 'Salary Or Business Income' },
                    { value: 'investments', label: 'Investments Or Dividends' },
                    { value: 'other', label: 'Other(please specify)' }
                  ]}
                  placeholder="Choose Income Source"
                />
                
                {((formMethods.watch('directors') as any[]) || [])[index]?.sourceOfIncome === 'other' && (
                  <FormField
                    name={`directors.${index}.sourceOfIncomeOther`}
                    label="Please specify income source"
                    required={true}
                  />
                )}
              </div>
            </Card>
          ))}
        </div>
      )
    },
    {
      id: 'account',
      title: 'Account Details & Files',
      component: (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-4">Local Account Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                name="localBankName"
                label="Local Bank Name"
                required={true}
              />
              <FormField
                name="bankBranch"
                label="Bank Branch"
                required={true}
              />
              <FormField
                name="currentAccountNumber"
                label="Current Account Number"
                required={true}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mt-4">
              <DatePicker
                name="accountOpeningDate"
                label="Account Opening Date"
                required={true}
              />
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-4">Domicilliary Account Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <FormField
                name="domAccountNumber2"
                label="Domicilliary Account Number"
              />
              <FormField
                name="foreignBankName2"
                label="Foreign Bank Name"
              />
              <FormField
                name="bankBranchName2"
                label="Bank Branch Name"
              />
              <FormField
                name="currency"
                label="Currency"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mt-4">
              <DatePicker
                name="accountOpeningDate2"
                label="Account Opening Date"
              />
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <Label>Certificate of Incorporation <span className="required-asterisk">*</span></Label>
              <FileUpload
                accept=".png,.jpg,.jpeg,.pdf"
                onFileSelect={(file) => {
                  setUploadedFiles(prev => ({
                    ...prev,
                    Incorporation: file
                  }));
                  formMethods.setValue('Incorporation', file);
                  if (formMethods.formState.errors.Incorporation) {
                    formMethods.clearErrors('Incorporation');
                  }
                }}
                maxSize={3 * 1024 * 1024}
              />
              {uploadedFiles.Incorporation && (
                <div className="flex items-center gap-2 mt-2 text-sm text-green-600">
                  <Check className="h-4 w-4" />
                  {uploadedFiles.Incorporation.name}
                </div>
              )}
              {formMethods.formState.errors.Incorporation && (
                <p className="text-sm text-destructive">
                  {formMethods.formState.errors.Incorporation.message?.toString()}
                </p>
              )}
            </div>
            
            <div>
              <Label>Identification Means for Director 1 <span className="required-asterisk">*</span></Label>
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
            
            <div>
              <Label>Identification Means for Director 2 (Optional)</Label>
              <FileUpload
                accept=".png,.jpg,.jpeg,.pdf"
                onFileSelect={(file) => {
                  setUploadedFiles(prev => ({
                    ...prev,
                    identification2: file
                  }));
                  formMethods.setValue('identification2', file);
                  if (formMethods.formState.errors.identification2) {
                    formMethods.clearErrors('identification2');
                  }
                }}
                maxSize={3 * 1024 * 1024}
              />
              {uploadedFiles.identification2 && (
                <div className="flex items-center gap-2 mt-2 text-sm text-green-600">
                  <Check className="h-4 w-4" />
                  {uploadedFiles.identification2.name}
                </div>
              )}
            </div>
            
            <div>
              <Label>NAICOM License Certificate</Label>
              <FileUpload
                accept=".png,.jpg,.jpeg,.pdf"
                onFileSelect={(file) => {
                  setUploadedFiles(prev => ({
                    ...prev,
                    NAICOMForm: file
                  }));
                  formMethods.setValue('NAICOMForm', file);
                }}
                maxSize={3 * 1024 * 1024}
              />
              {uploadedFiles.NAICOMForm && (
                <div className="flex items-center gap-2 mt-2 text-sm text-green-600">
                  <Check className="h-4 w-4" />
                  {uploadedFiles.NAICOMForm.name}
                </div>
              )}
            </div>
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
            placeholder="Type your full name as signature"
            required={true}
          />
        </div>
      )
    }
  ];

  const handleFormSubmit = (data: any) => {
    setShowSummary(true);
  };

  return (
    <FormProvider {...formMethods}>
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-6xl mx-auto">
          <CardHeader>
            <CardTitle>Brokers Customer Due Diligence (CDD)</CardTitle>
            <CardDescription>
              Please provide accurate information for all required fields
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MultiStepForm
              steps={steps}
              onSubmit={onFinalSubmit}
              formMethods={formMethods}
              submitButtonText="Submit Brokers CDD"
              stepFieldMappings={stepFieldMappings}
            />
          </CardContent>
        </Card>

      <FormLoadingModal isOpen={showLoading} message={loadingMessage} />
      
      <FormSummaryDialog
        open={showSummary}
        onOpenChange={setShowSummary}
        formData={submissionData}
        formType="Brokers CDD"
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
              {/* Company Information */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-900">Company Information</h3>
                <div className="space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-2">
                    <div className="text-sm font-medium text-gray-600">Company Name:</div>
                    <div className="sm:col-span-2 text-sm text-gray-900">{data.companyName}</div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-2">
                    <div className="text-sm font-medium text-gray-600">Address:</div>
                    <div className="sm:col-span-2 text-sm text-gray-900">{data.companyAddress}</div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-2">
                    <div className="text-sm font-medium text-gray-600">City:</div>
                    <div className="sm:col-span-2 text-sm text-gray-900">{data.city}</div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-2">
                    <div className="text-sm font-medium text-gray-600">State:</div>
                    <div className="sm:col-span-2 text-sm text-gray-900">{data.state}</div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-2">
                    <div className="text-sm font-medium text-gray-600">Country:</div>
                    <div className="sm:col-span-2 text-sm text-gray-900">{data.country}</div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-2">
                    <div className="text-sm font-medium text-gray-600">Email:</div>
                    <div className="sm:col-span-2 text-sm text-gray-900">{data.emailAddress}</div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-2">
                    <div className="text-sm font-medium text-gray-600">Website:</div>
                    <div className="sm:col-span-2 text-sm text-gray-900">{data.website}</div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-2">
                    <div className="text-sm font-medium text-gray-600">Phone:</div>
                    <div className="sm:col-span-2 text-sm text-gray-900">{data.telephoneNumber}</div>
                  </div>
                </div>
              </div>

              <div className="border-t my-4" />

              {/* Registration Details */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-900">Registration Details</h3>
                <div className="space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-2">
                    <div className="text-sm font-medium text-gray-600">Incorporation Number:</div>
                    <div className="sm:col-span-2 text-sm text-gray-900">{data.incorporationNumber}</div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-2">
                    <div className="text-sm font-medium text-gray-600">Registration Number:</div>
                    <div className="sm:col-span-2 text-sm text-gray-900">{data.registrationNumber}</div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-2">
                    <div className="text-sm font-medium text-gray-600">Incorporation State:</div>
                    <div className="sm:col-span-2 text-sm text-gray-900">{data.incorporationState}</div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-2">
                    <div className="text-sm font-medium text-gray-600">Company Legal Form:</div>
                    <div className="sm:col-span-2 text-sm text-gray-900">
                      {data.companyLegalForm === 'other' && data.companyLegalFormOther 
                        ? data.companyLegalFormOther 
                        : data.companyLegalForm}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-2">
                    <div className="text-sm font-medium text-gray-600">Date of Incorporation:</div>
                    <div className="sm:col-span-2 text-sm text-gray-900">{formatDate(data.dateOfIncorporationRegistration)}</div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-2">
                    <div className="text-sm font-medium text-gray-600">Nature of Business:</div>
                    <div className="sm:col-span-2 text-sm text-gray-900">{data.natureOfBusiness}</div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-2">
                    <div className="text-sm font-medium text-gray-600">Tax ID:</div>
                    <div className="sm:col-span-2 text-sm text-gray-900">{data.taxIdentificationNumber}</div>
                  </div>
                </div>
              </div>

              <div className="border-t my-4" />

              {/* Directors */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-900">Directors</h3>
                {data.directors && data.directors.map((director: any, index: number) => (
                  <div key={index} className="space-y-2 p-3 bg-gray-50 rounded-lg">
                    <h4 className="text-md font-medium text-gray-800">Director {index + 1}</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-2">
                      <div className="text-sm font-medium text-gray-600">Full Name:</div>
                      <div className="sm:col-span-2 text-sm text-gray-900">
                        {[director.title, director.firstName, director.middleName, director.lastName].filter(Boolean).join(' ')}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-2">
                      <div className="text-sm font-medium text-gray-600">Gender:</div>
                      <div className="sm:col-span-2 text-sm text-gray-900 capitalize">{director.gender}</div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-2">
                      <div className="text-sm font-medium text-gray-600">Date of Birth:</div>
                      <div className="sm:col-span-2 text-sm text-gray-900">{formatDate(director.dob)}</div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-2">
                      <div className="text-sm font-medium text-gray-600">Place of Birth:</div>
                      <div className="sm:col-span-2 text-sm text-gray-900">{director.placeOfBirth}</div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-2">
                      <div className="text-sm font-medium text-gray-600">Nationality:</div>
                      <div className="sm:col-span-2 text-sm text-gray-900">{director.nationality}</div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-2">
                      <div className="text-sm font-medium text-gray-600">Residence Country:</div>
                      <div className="sm:col-span-2 text-sm text-gray-900">{director.residenceCountry}</div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-2">
                      <div className="text-sm font-medium text-gray-600">Occupation:</div>
                      <div className="sm:col-span-2 text-sm text-gray-900">{director.occupation}</div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-2">
                      <div className="text-sm font-medium text-gray-600">Email:</div>
                      <div className="sm:col-span-2 text-sm text-gray-900">{director.email}</div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-2">
                      <div className="text-sm font-medium text-gray-600">Phone:</div>
                      <div className="sm:col-span-2 text-sm text-gray-900">{director.phoneNumber}</div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-2">
                      <div className="text-sm font-medium text-gray-600">BVN:</div>
                      <div className="sm:col-span-2 text-sm text-gray-900">{director.BVNNumber}</div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-2">
                      <div className="text-sm font-medium text-gray-600">Employer:</div>
                      <div className="sm:col-span-2 text-sm text-gray-900">{director.employersName}</div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-2">
                      <div className="text-sm font-medium text-gray-600">Address:</div>
                      <div className="sm:col-span-2 text-sm text-gray-900">{director.address}</div>
                    </div>
                    {director.taxIDNumber && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-2">
                        <div className="text-sm font-medium text-gray-600">Tax ID:</div>
                        <div className="sm:col-span-2 text-sm text-gray-900">{director.taxIDNumber}</div>
                      </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-2">
                      <div className="text-sm font-medium text-gray-600">ID Type:</div>
                      <div className="sm:col-span-2 text-sm text-gray-900">{director.idType}</div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-2">
                      <div className="text-sm font-medium text-gray-600">ID Number:</div>
                      <div className="sm:col-span-2 text-sm text-gray-900">{director.idNumber}</div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-2">
                      <div className="text-sm font-medium text-gray-600">Issued By:</div>
                      <div className="sm:col-span-2 text-sm text-gray-900">{director.issuedBy}</div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-2">
                      <div className="text-sm font-medium text-gray-600">Issued Date:</div>
                      <div className="sm:col-span-2 text-sm text-gray-900">{formatDate(director.issuedDate)}</div>
                    </div>
                    {director.expiryDate && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-2">
                        <div className="text-sm font-medium text-gray-600">Expiry Date:</div>
                        <div className="sm:col-span-2 text-sm text-gray-900">{formatDate(director.expiryDate)}</div>
                      </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-2">
                      <div className="text-sm font-medium text-gray-600">Source of Income:</div>
                      <div className="sm:col-span-2 text-sm text-gray-900">
                        {director.sourceOfIncome === 'other' && director.sourceOfIncomeOther 
                          ? director.sourceOfIncomeOther 
                          : director.sourceOfIncome}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t my-4" />

              {/* Account Details */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-900">Account Details</h3>
                <div className="space-y-2">
                  <h4 className="text-md font-medium text-gray-800 mt-2">Local Account</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-2">
                    <div className="text-sm font-medium text-gray-600">Bank Name:</div>
                    <div className="sm:col-span-2 text-sm text-gray-900">{data.localBankName}</div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-2">
                    <div className="text-sm font-medium text-gray-600">Branch:</div>
                    <div className="sm:col-span-2 text-sm text-gray-900">{data.bankBranch}</div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-2">
                    <div className="text-sm font-medium text-gray-600">Account Number:</div>
                    <div className="sm:col-span-2 text-sm text-gray-900">{data.currentAccountNumber}</div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-2">
                    <div className="text-sm font-medium text-gray-600">Opening Date:</div>
                    <div className="sm:col-span-2 text-sm text-gray-900">{formatDate(data.accountOpeningDate)}</div>
                  </div>

                  {data.domAccountNumber2 && (
                    <>
                      <h4 className="text-md font-medium text-gray-800 mt-4">Foreign Account</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-2">
                        <div className="text-sm font-medium text-gray-600">Account Number:</div>
                        <div className="sm:col-span-2 text-sm text-gray-900">{data.domAccountNumber2}</div>
                      </div>
                      {data.foreignBankName2 && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-2">
                          <div className="text-sm font-medium text-gray-600">Bank Name:</div>
                          <div className="sm:col-span-2 text-sm text-gray-900">{data.foreignBankName2}</div>
                        </div>
                      )}
                      {data.bankBranchName2 && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-2">
                          <div className="text-sm font-medium text-gray-600">Branch:</div>
                          <div className="sm:col-span-2 text-sm text-gray-900">{data.bankBranchName2}</div>
                        </div>
                      )}
                      {data.currency && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-2">
                          <div className="text-sm font-medium text-gray-600">Currency:</div>
                          <div className="sm:col-span-2 text-sm text-gray-900">{data.currency}</div>
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
                    <div className="text-sm font-medium text-gray-600">Certificate of Incorporation:</div>
                    <div className="sm:col-span-2 text-sm text-gray-900">
                      {typeof data.Incorporation === 'string' ? 'Uploaded' : data.Incorporation?.name || 'Uploaded'}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-2">
                    <div className="text-sm font-medium text-gray-600">Director 1 ID:</div>
                    <div className="sm:col-span-2 text-sm text-gray-900">
                      {typeof data.identification === 'string' ? 'Uploaded' : data.identification?.name || 'Uploaded'}
                    </div>
                  </div>
                  {data.identification2 && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-2">
                      <div className="text-sm font-medium text-gray-600">Director 2 ID:</div>
                      <div className="sm:col-span-2 text-sm text-gray-900">
                        {typeof data.identification2 === 'string' ? 'Uploaded' : data.identification2?.name || 'Uploaded'}
                      </div>
                    </div>
                  )}
                  {data.NAICOMForm && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-2">
                      <div className="text-sm font-medium text-gray-600">NAICOM Form:</div>
                      <div className="sm:col-span-2 text-sm text-gray-900">
                        {typeof data.NAICOMForm === 'string' ? 'Uploaded' : data.NAICOMForm?.name || 'Uploaded'}
                      </div>
                    </div>
                  )}
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
        title="Brokers CDD Submitted Successfully!"
        message="Your Brokers Customer Due Diligence form has been submitted successfully."
      />

      </div>
    </FormProvider>
  );
};

export default BrokersCDD;

