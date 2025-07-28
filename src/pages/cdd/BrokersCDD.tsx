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
import { useAuthRequiredSubmit } from '@/hooks/useAuthRequiredSubmit';
import SuccessModal from '@/components/common/SuccessModal';
import LoadingSpinner from '@/components/common/LoadingSpinner';

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

const FormDatePicker = ({ name, label, required = false }: any) => {
  const { setValue, watch, formState: { errors }, clearErrors, trigger } = useFormContext();
  const value = watch(name);
  const error = get(errors, name);
  
  const formatDateForInput = (date: any) => {
    if (!date) return '';
    if (typeof date === 'string') {
      // If it's already a string, try to parse it and format
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
    // Trigger validation for this field
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

const BrokersCDD: React.FC = () => {
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
      `directors.${index}.employersName`,
      `directors.${index}.address`,
      `directors.${index}.idType`,
      `directors.${index}.idNumber`,
      `directors.${index}.issuedBy`,
      `directors.${index}.issuedDate`,
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

  const handleSubmit = async (data: any) => {
    console.log('Form data before sanitization:', data);
    
    const sanitizedData = sanitizeData(data);
    console.log('Sanitized data:', sanitizedData);

    // Handle file uploads
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
      formType: 'Brokers-CDD'
    };

    await handleSubmitWithAuth(finalData, 'Brokers-CDD');
    clearDraft();
    setShowSummary(false);
  };

  const onFinalSubmit = (data: any) => {
    setShowSummary(true);
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
          
          <FormDatePicker
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
                  <FormDatePicker
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
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    name={`directors.${index}.employersName`}
                    label="Employer's Name"
                    required={true}
                  />
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
                  <FormDatePicker
                    name={`directors.${index}.issuedDate`}
                    label="Issued Date"
                    required={true}
                  />
                </div>
                
                <FormDatePicker
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
              <FormDatePicker
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
              <FormDatePicker
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
              <Label>Identification Means for Director 2 <span className="required-asterisk">*</span></Label>
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
              {formMethods.formState.errors.identification2 && (
                <p className="text-sm text-destructive">
                  {formMethods.formState.errors.identification2.message?.toString()}
                </p>
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

      {/* Summary Dialog */}
      <Dialog open={showSummary} onOpenChange={setShowSummary}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Review Your Brokers CDD Form</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {/* Company Information */}
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold text-lg mb-4">Company Information</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><strong>Company Name:</strong> {watchedValues.companyName}</div>
                <div><strong>Email:</strong> {watchedValues.email}</div>
                <div><strong>Website:</strong> {watchedValues.website}</div>
                <div><strong>Contact Person:</strong> {watchedValues.contactPersonName}</div>
                <div><strong>Contact Number:</strong> {watchedValues.contactPersonNumber}</div>
                <div><strong>Tax ID:</strong> {watchedValues.taxId}</div>
                <div><strong>VAT Number:</strong> {watchedValues.vatRegistrationNumber}</div>
                <div><strong>RC Number:</strong> {watchedValues.incorporationNumber}</div>
                <div><strong>Incorporation State:</strong> {watchedValues.incorporationState}</div>
                <div><strong>BVN:</strong> {watchedValues.bvn}</div>
                <div className="col-span-2"><strong>Address:</strong> {watchedValues.registeredAddress}</div>
                <div className="col-span-2"><strong>Business Nature:</strong> {watchedValues.businessNature}</div>
                <div><strong>Incorporation Date:</strong> {watchedValues.incorporationDate ? new Date(watchedValues.incorporationDate).toLocaleDateString() : 'Not set'}</div>
              </div>
            </div>

            {/* Directors */}
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold text-lg mb-4">Directors ({watchedValues.directors?.length || 0})</h3>
              {watchedValues.directors?.map((director: any, index: number) => (
                <div key={index} className="border rounded p-3 mb-3 bg-gray-50">
                  <h4 className="font-medium mb-2">Director {index + 1}</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><strong>Title:</strong> {director.title}</div>
                    <div><strong>Gender:</strong> {director.gender}</div>
                    <div><strong>Full Name:</strong> {director.firstName} {director.middleName} {director.lastName}</div>
                    <div><strong>Email:</strong> {director.email}</div>
                    <div><strong>Phone:</strong> {director.phoneNumber}</div>
                    <div><strong>Nationality:</strong> {director.nationality}</div>
                    <div><strong>Occupation:</strong> {director.occupation}</div>
                    <div><strong>BVN:</strong> {director.bvn}</div>
                    <div><strong>Date of Birth:</strong> {director.dateOfBirth}</div>
                    <div><strong>Place of Birth:</strong> {director.placeOfBirth}</div>
                    <div><strong>ID Type:</strong> {director.idType}</div>
                    <div><strong>ID Number:</strong> {director.identificationNumber}</div>
                    <div><strong>Issuing Body:</strong> {director.issuingBody}</div>
                    <div><strong>Income Source:</strong> {director.incomeSource}</div>
                    <div className="col-span-2"><strong>Address:</strong> {director.residentialAddress}</div>
                    {director.incomeSource === 'other' && director.incomeSourceOther && (
                      <div className="col-span-2"><strong>Other Income Source:</strong> {director.incomeSourceOther}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Account Details */}
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold text-lg mb-4">Account Details</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Local Account</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><strong>Account Number:</strong> {watchedValues.localAccountNumber}</div>
                    <div><strong>Bank Name:</strong> {watchedValues.localBankName}</div>
                    <div><strong>Bank Branch:</strong> {watchedValues.localBankBranch}</div>
                    <div><strong>Opening Date:</strong> {watchedValues.localAccountOpeningDate ? new Date(watchedValues.localAccountOpeningDate).toLocaleDateString() : 'Not set'}</div>
                  </div>
                </div>
                {(watchedValues.foreignAccountNumber || watchedValues.foreignBankName) && (
                  <div>
                    <h4 className="font-medium mb-2">Foreign Account</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div><strong>Account Number:</strong> {watchedValues.foreignAccountNumber}</div>
                      <div><strong>Bank Name:</strong> {watchedValues.foreignBankName}</div>
                      <div><strong>Bank Branch:</strong> {watchedValues.foreignBankBranch}</div>
                      <div><strong>Opening Date:</strong> {watchedValues.foreignAccountOpeningDate ? new Date(watchedValues.foreignAccountOpeningDate).toLocaleDateString() : 'Not set'}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Uploaded Documents */}
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold text-lg mb-4">Uploaded Documents</h3>
              <div className="grid grid-cols-1 gap-2 text-sm">
                {Object.entries(uploadedFiles).map(([key, file]) => (
                  <div key={key} className="flex justify-between items-center py-2 border-b">
                    <span className="font-medium">
                      {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:
                    </span>
                    <span className="text-green-600">
                      {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  </div>
                ))}
                {Object.keys(uploadedFiles).length === 0 && (
                  <p className="text-muted-foreground">No documents uploaded yet</p>
                )}
              </div>
            </div>

            {/* Declaration */}
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold text-lg mb-4">Declaration</h3>
              <div className="text-sm">
                <div><strong>Data Privacy Agreement:</strong> {watchedValues.agreeToDataPrivacy ? 'Agreed' : 'Not agreed'}</div>
                <div><strong>Digital Signature:</strong> {watchedValues.signature}</div>
              </div>
            </div>
            
            <div className="flex gap-4 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setShowSummary(false)}
              >
                Edit Details
              </Button>
              <Button
                onClick={() => {
                  const formData = formMethods.getValues();
                  handleSubmit(formData);
                }}
                disabled={isSubmitting}
                className="bg-primary text-primary-foreground"
              >
                {isSubmitting ? 'Submitting...' : 'Confirm & Submit'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

        {/* Success Modal */}
        <SuccessModal
          isOpen={showSuccess}
          onClose={() => setShowSuccess()}
          title="Brokers CDD Form Submitted Successfully!"
          message="Your Brokers CDD form has been submitted successfully. We will review your information and get back to you soon."
          formType="Brokers-CDD"
        />
      </div>
    </FormProvider>
  );
};

export default BrokersCDD;
