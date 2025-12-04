import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray, FormProvider, useFormContext } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { get } from 'lodash';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Calendar, CalendarIcon, Plus, Trash2, Upload, Edit2, Loader2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import MultiStepForm from '@/components/common/MultiStepForm';
import { NaicomPartnersCDDData, Director } from '@/types';
import { useFormDraft } from '@/hooks/useFormDraft';
import FileUpload from '@/components/common/FileUpload';
import { uploadFile } from '@/services/fileService';
import { useEnhancedFormSubmit } from '@/hooks/useEnhancedFormSubmit';
import FormLoadingModal from '@/components/common/FormLoadingModal';
import FormSummaryDialog from '@/components/common/FormSummaryDialog';
import SuccessModal from '@/components/common/SuccessModal';
import DatePicker from '@/components/common/DatePicker';

// CRITICAL: Define form components OUTSIDE main component to prevent focus loss
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

// Enhanced validation schema
const naicomPartnersCDDSchema = yup.object().shape({
  // Company Info
  companyName: yup.string().required("Company name is required"),
  registeredAddress: yup.string().required("Registered address is required"),
  city: yup.string().required("City is required"),
  state: yup.string().required("State is required"),
  country: yup.string().required("Country is required"),
  
  email: yup.string()
    .required("Email is required")
    .email("Please enter a valid email")
    .typeError("Please enter a valid email"),
    
  website: yup.string().required("Website is required"),
  contactPersonName: yup.string().required("Contact person name is required"),
  
  contactPersonNumber: yup.string()
    .required("Contact person number is required")
    .matches(/^[\d\s+\-()]+$/, "Invalid phone number format")
    .max(15, "Phone number cannot exceed 15 characters"),
    
  taxId: yup.string().required("Tax ID is required"),
  vatRegistrationNumber: yup.string().required("VAT registration number is required"),
  incorporationNumber: yup.string().required("Incorporation number is required"),
  
  incorporationDate: yup.date()
    .required("Incorporation date is required")
    .test('not-future', 'Date cannot be in the future', function(value) {
      if (!value) return false;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return value <= today;
    })
    .typeError('Please select a valid date'),
    
  incorporationState: yup.string().required("Incorporation state is required"),
  businessNature: yup.string().required("Business nature is required"),
  
  bvn: yup.string()
    .required("BVN is required")
    .matches(/^\d+$/, "BVN must contain only numbers")
    .length(11, "BVN must be exactly 11 digits"),
  nin: yup.string()
    .required("NIN is required")
    .matches(/^\d+$/, "NIN must contain only numbers")
    .length(11, "NIN must be exactly 11 digits"),
    
  naicomLicenseIssuingDate: yup.date()
    .required("NAICOM license issuing date is required")
    .test('not-future', 'Date cannot be in the future', function(value) {
      if (!value) return false;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return value <= today;
    })
    .typeError('Please select a valid date'),
    
  naicomLicenseExpiryDate: yup.date()
    .required("NAICOM license expiry date is required")
    .test('not-past', 'Expiry date cannot be in the past', function(value) {
      if (!value) return false;
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      return value > today;
    })
    .typeError('Please select a valid date'),
  
  // Directors validation
  directors: yup.array().of(yup.object().shape({
    title: yup.string().required("Title is required"),
    gender: yup.string().required("Gender is required"),
    firstName: yup.string().required("First name is required"),
    middleName: yup.string(),
    lastName: yup.string().required("Last name is required"),
    
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
      
    bvn: yup.string()
      .required("BVN is required")
      .matches(/^\d+$/, "BVN must contain only numbers")
      .length(11, "BVN must be exactly 11 digits"),
    nin: yup.string()
      .required("NIN is required")
      .matches(/^\d+$/, "NIN must contain only numbers")
      .length(11, "NIN must be exactly 11 digits"),
      
    employerName: yup.string(),
    employerPhone: yup.string(),
    residentialAddress: yup.string().required("Residential address is required"),
    taxIdNumber: yup.string(),
    idType: yup.string().required("ID type is required"),
    identificationNumber: yup.string().required("Identification number is required"),
    issuingBody: yup.string().required("Issuing body is required"),
    
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
      
    incomeSource: yup.string().required("Income source is required"),
    incomeSourceOther: yup.string().when('incomeSource', {
      is: 'Other',
      then: (schema) => schema.required('Please specify income source'),
      otherwise: (schema) => schema.notRequired()
    }),
  })).min(1, "At least one director is required"),
  
  // Account Details
  localAccountNumber: yup.string().required("Account number is required"),
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
  
  // File uploads validation
  certificateOfIncorporation: yup.mixed().required("Certificate of Incorporation is required"),
  directorId1: yup.mixed().required("Director 1 ID is required"),
  directorId2: yup.mixed(),
  cacStatusReport: yup.mixed().required("CAC Status Report is required"),
  vatRegistrationLicense: yup.mixed(),
  taxClearanceCertificate: yup.mixed(),
  naicomLicenseCertificate: yup.mixed().required("NAICOM License Certificate is required"),
  
  // Declaration
  agreeToDataPrivacy: yup.boolean().oneOf([true], "You must agree to data privacy"),
  signature: yup.string().required("Signature is required")
});

// Default values with proper types
const defaultValues = {
  companyName: '',
  registeredAddress: '',
  city: '',
  state: '',
  country: '',
  email: '',
  website: '',
  contactPersonName: '',
  contactPersonNumber: '',
  taxId: '',
  vatRegistrationNumber: '',
  incorporationNumber: '',
  incorporationDate: undefined,
  incorporationState: '',
  businessNature: '',
  bvn: '',
  nin: '',
  naicomLicenseIssuingDate: undefined,
  naicomLicenseExpiryDate: undefined,
  directors: [{
    title: '',
    gender: '',
    firstName: '',
    middleName: '',
    lastName: '',
    dateOfBirth: undefined,
    placeOfBirth: '',
    nationality: '',
    country: '',
    occupation: '',
    email: '',
    phoneNumber: '',
    bvn: '',
    nin: '',
    employerName: '',
    employerPhone: '',
    residentialAddress: '',
    taxIdNumber: '',
    idType: '',
    identificationNumber: '',
    issuingBody: '',
    issuedDate: undefined,
    expiryDate: undefined,
    incomeSource: '',
    incomeSourceOther: ''
  }],
  localAccountNumber: '',
  localBankName: '',
  localBankBranch: '',
  localAccountOpeningDate: undefined,
  foreignAccountNumber: '',
  foreignBankName: '',
  foreignBankBranch: '',
  foreignAccountOpeningDate: undefined,
  agreeToDataPrivacy: false,
  signature: '',
  // File upload fields
  certificateOfIncorporation: undefined,
  directorId1: undefined,
  directorId2: undefined,
  cacStatusReport: undefined,
  vatRegistrationLicense: undefined,
  taxClearanceCertificate: undefined,
  naicomLicenseCertificate: undefined
};

const NaicomPartnersCDD: React.FC = () => {
  const { toast } = useToast();
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File>>({});

  const formMethods = useForm<any>({
    resolver: yupResolver(naicomPartnersCDDSchema),
    defaultValues,
    mode: 'onChange'
  });

  const { fields, append, remove } = useFieldArray({
    control: formMethods.control,
    name: 'directors'
  });

  const { saveDraft, clearDraft } = useFormDraft('naicomPartnersCDD', formMethods);
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
    formType: 'NAICOM Partners CDD',
    onSuccess: () => clearDraft()
  });

  // Auto-save draft
  useEffect(() => {
    const subscription = formMethods.watch((data) => {
      saveDraft(data);
    });
    return () => subscription.unsubscribe();
  }, [formMethods, saveDraft]);

  // Step field mappings
  const stepFieldMappings = {
    0: [
      'companyName', 'registeredAddress', 'city', 'state', 'country', 
      'email', 'website', 'contactPersonName', 'contactPersonNumber',
      'taxId', 'vatRegistrationNumber', 'incorporationNumber', 'incorporationDate',
      'incorporationState', 'businessNature', 'bvn', 'nin', 'naicomLicenseIssuingDate',
      'naicomLicenseExpiryDate'
    ],
    1: ['directors'],
    2: [
      'localAccountNumber', 'localBankName', 'localBankBranch', 'localAccountOpeningDate',
      'foreignAccountNumber', 'foreignBankName', 'foreignBankBranch', 'foreignAccountOpeningDate'
    ],
    3: [
      'certificateOfIncorporation', 'directorId1', 'directorId2', 'cacStatusReport', 
      'vatRegistrationLicense', 'taxClearanceCertificate', 'naicomLicenseCertificate'
    ],
    4: ['agreeToDataPrivacy', 'signature']
  };

  // Data sanitization
  const sanitizeData = (data: any) => {
    const sanitized: any = {};
    Object.keys(data).forEach(key => {
      if (data[key] !== undefined) {
        sanitized[key] = data[key];
      }
    });
    return sanitized;
  };

  const onFinalSubmit = async (data: any) => {
    try {
      console.log('Form data before sanitization:', data);
      
      const sanitizedData = sanitizeData(data);
      console.log('Sanitized data:', sanitizedData);

      // Handle file uploads
      const fileUploadPromises: Array<Promise<[string, string]>> = [];
      
      for (const [key, file] of Object.entries(uploadedFiles)) {
        if (file) {
          fileUploadPromises.push(
            uploadFile(file, `naicom-partners-cdd/${Date.now()}-${file.name}`).then(url => [key, url])
          );
        }
      }

      const fileResults = await Promise.all(fileUploadPromises);
      const fileUrls = Object.fromEntries(fileResults);

      const finalData = {
        ...sanitizedData,
        ...fileUrls,
        status: 'processing',
        formType: 'NAICOM Partners CDD'
      };

      await handleEnhancedSubmit(finalData);
    } catch (error) {
      console.error('Error:', error);
      toast({ title: 'Error', description: error instanceof Error ? error.message : 'Submission failed', variant: 'destructive' });
    }
  };

  // Options for select fields
  const titleOptions = [
    { value: 'Mr', label: 'Mr' },
    { value: 'Mrs', label: 'Mrs' },
    { value: 'Ms', label: 'Ms' },
    { value: 'Dr', label: 'Dr' },
    { value: 'Prof', label: 'Prof' },
    { value: 'Chief', label: 'Chief' },
    { value: 'Alhaji', label: 'Alhaji' },
    { value: 'Alhaja', label: 'Alhaja' }
  ];

  const genderOptions = [
    { value: 'Male', label: 'Male' },
    { value: 'Female', label: 'Female' }
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
    { value: 'Inheritance', label: 'Inheritance' },
    { value: 'Gift', label: 'Gift' },
    { value: 'Other', label: 'Other' }
  ];

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
            name="registeredAddress"
            label="Registered Company Address"
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              name="email"
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              name="contactPersonName"
              label="Contact Person Name"
              required={true}
            />
            <FormField
              name="contactPersonNumber"
              label="Contact Person Number"
              required={true}
              maxLength={15}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              name="taxId"
              label="Tax Identification Number"
              required={true}
            />
            <FormField
              name="vatRegistrationNumber"
              label="VAT Registration Number"
              required={true}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              name="incorporationNumber"
              label="Incorporation/RC Number"
              required={true}
            />
            <DatePicker
              name="incorporationDate"
              label="Date of Incorporation"
              required={true}
            />
            <FormField
              name="incorporationState"
              label="Incorporation State"
              required={true}
            />
          </div>
          
          <FormTextarea
            name="businessNature"
            label="Nature of Business"
            required={true}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              name="bvn"
              label="BVN"
              required={true}
              maxLength={11}
            />
            <FormField
              name="nin"
              label="NIN (National Identification Number)"
              required={true}
              maxLength={11}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DatePicker
              name="naicomLicenseIssuingDate"
              label="NAICOM License Issuing Date"
              required={true}
            />
            <DatePicker
              name="naicomLicenseExpiryDate"
              label="NAICOM License Expiry Date"
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
          {fields.map((director, index) => (
            <Card key={director.id} className="p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Director {index + 1}</h3>
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormSelect
                    name={`directors.${index}.title`}
                    label="Title"
                    required={true}
                    options={titleOptions}
                  />
                  <FormSelect
                    name={`directors.${index}.gender`}
                    label="Gender"
                    required={true}
                    options={genderOptions}
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
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <DatePicker
                    name={`directors.${index}.dateOfBirth`}
                    label="Date of Birth"
                    required={true}
                  />
                  <FormField
                    name={`directors.${index}.placeOfBirth`}
                    label="Place of Birth"
                    required={true}
                  />
                  <FormField
                    name={`directors.${index}.nationality`}
                    label="Nationality"
                    required={true}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    name={`directors.${index}.country`}
                    label="Country"
                    required={true}
                  />
                  <FormField
                    name={`directors.${index}.occupation`}
                    label="Occupation"
                    required={true}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    name={`directors.${index}.email`}
                    label="Email"
                    type="email"
                    required={true}
                  />
                  <FormField
                    name={`directors.${index}.phoneNumber`}
                    label="Phone Number"
                    required={true}
                    maxLength={15}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    name={`directors.${index}.bvn`}
                    label="BVN"
                    required={true}
                    maxLength={11}
                  />
                  <FormField
                    name={`directors.${index}.nin`}
                    label="NIN (National Identification Number)"
                    required={true}
                    maxLength={11}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    name={`directors.${index}.employerName`}
                    label="Employer Name"
                  />
                  <FormField
                    name={`directors.${index}.employerPhone`}
                    label="Employer Phone"
                  />
                </div>
                
                <FormTextarea
                  name={`directors.${index}.residentialAddress`}
                  label="Residential Address"
                  required={true}
                />
                
                <FormField
                  name={`directors.${index}.taxIdNumber`}
                  label="Tax ID Number"
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormSelect
                    name={`directors.${index}.idType`}
                    label="ID Type"
                    required={true}
                    options={idTypeOptions}
                  />
                  <FormField
                    name={`directors.${index}.identificationNumber`}
                    label="Identification Number"
                    required={true}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    name={`directors.${index}.issuingBody`}
                    label="Issuing Body"
                    required={true}
                  />
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
                    name={`directors.${index}.incomeSource`}
                    label="Source of Income"
                    required={true}
                    options={incomeSourceOptions}
                  />
                  {formMethods.watch(`directors.${index}.incomeSource`) === 'Other' && (
                    <FormField
                      name={`directors.${index}.incomeSourceOther`}
                      label="Please Specify"
                      required={true}
                    />
                  )}
                </div>
              </div>
            </Card>
          ))}
          
          <Button
            type="button"
            variant="outline"
            onClick={() => append({
              title: '',
              gender: '',
              firstName: '',
              middleName: '',
              lastName: '',
              dateOfBirth: undefined,
              placeOfBirth: '',
              nationality: '',
              country: '',
              occupation: '',
              email: '',
              phoneNumber: '',
              bvn: '',
              nin: '',
              employerName: '',
              employerPhone: '',
              residentialAddress: '',
              taxIdNumber: '',
              idType: '',
              identificationNumber: '',
              issuingBody: '',
              issuedDate: undefined,
              expiryDate: undefined,
              incomeSource: '',
              incomeSourceOther: ''
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
      id: 'accounts',
      title: 'Account Details',
      component: (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Local Account Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              name="localAccountNumber"
              label="Account Number"
              required={true}
            />
            <FormField
              name="localBankName"
              label="Bank Name"
              required={true}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              name="localBankBranch"
              label="Bank Branch"
              required={true}
            />
            <DatePicker
              name="localAccountOpeningDate"
              label="Account Opening Date"
              required={true}
            />
          </div>
          
          <h3 className="text-lg font-medium mt-6">Foreign Account Information (Optional)</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              name="foreignAccountNumber"
              label="Account Number"
            />
            <FormField
              name="foreignBankName"
              label="Bank Name"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              name="foreignBankBranch"
              label="Bank Branch"
            />
            <DatePicker
              name="foreignAccountOpeningDate"
              label="Account Opening Date"
            />
          </div>
        </div>
      )
    },
    {
      id: 'documents',
      title: 'Document Uploads',
      component: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label>Certificate of Incorporation <span className="required-asterisk">*</span></Label>
              <FileUpload
                accept=".png,.jpg,.jpeg,.pdf"
                onFileSelect={(file) => {
                  setUploadedFiles(prev => ({
                    ...prev,
                    certificateOfIncorporation: file
                  }));
                  formMethods.setValue('certificateOfIncorporation', file);
                  if (formMethods.formState.errors.certificateOfIncorporation) {
                    formMethods.clearErrors('certificateOfIncorporation');
                  }
                }}
                maxSize={3 * 1024 * 1024}
              />
              {uploadedFiles.certificateOfIncorporation && (
                <div className="flex items-center gap-2 mt-2 text-sm text-green-600">
                  <Check className="h-4 w-4" />
                  {uploadedFiles.certificateOfIncorporation.name}
                </div>
              )}
              {formMethods.formState.errors.certificateOfIncorporation && (
                <p className="text-sm text-destructive">
                  {formMethods.formState.errors.certificateOfIncorporation.message?.toString()}
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
                    directorId1: file
                  }));
                  formMethods.setValue('directorId1', file);
                  if (formMethods.formState.errors.directorId1) {
                    formMethods.clearErrors('directorId1');
                  }
                }}
                maxSize={3 * 1024 * 1024}
              />
              {uploadedFiles.directorId1 && (
                <div className="flex items-center gap-2 mt-2 text-sm text-green-600">
                  <Check className="h-4 w-4" />
                  {uploadedFiles.directorId1.name}
                </div>
              )}
              {formMethods.formState.errors.directorId1 && (
                <p className="text-sm text-destructive">
                  {formMethods.formState.errors.directorId1.message?.toString()}
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
                    directorId2: file
                  }));
                  formMethods.setValue('directorId2', file);
                  if (formMethods.formState.errors.directorId2) {
                    formMethods.clearErrors('directorId2');
                  }
                }}
                maxSize={3 * 1024 * 1024}
              />
              {uploadedFiles.directorId2 && (
                <div className="flex items-center gap-2 mt-2 text-sm text-green-600">
                  <Check className="h-4 w-4" />
                  {uploadedFiles.directorId2.name}
                </div>
              )}
              {formMethods.formState.errors.directorId2 && (
                <p className="text-sm text-destructive">
                  {formMethods.formState.errors.directorId2.message?.toString()}
                </p>
              )}
            </div>
            
            <div>
              <Label>CAC Status Report <span className="required-asterisk">*</span></Label>
              <FileUpload
                accept=".png,.jpg,.jpeg,.pdf"
                onFileSelect={(file) => {
                  setUploadedFiles(prev => ({
                    ...prev,
                    cacStatusReport: file
                  }));
                  formMethods.setValue('cacStatusReport', file);
                  if (formMethods.formState.errors.cacStatusReport) {
                    formMethods.clearErrors('cacStatusReport');
                  }
                }}
                maxSize={3 * 1024 * 1024}
              />
              {uploadedFiles.cacStatusReport && (
                <div className="flex items-center gap-2 mt-2 text-sm text-green-600">
                  <Check className="h-4 w-4" />
                  {uploadedFiles.cacStatusReport.name}
                </div>
              )}
              {formMethods.formState.errors.cacStatusReport && (
                <p className="text-sm text-destructive">
                  {formMethods.formState.errors.cacStatusReport.message?.toString()}
                </p>
              )}
            </div>
            
            <div>
              <Label>VAT Registration License (Optional)</Label>
              <FileUpload
                accept=".png,.jpg,.jpeg,.pdf"
                onFileSelect={(file) => {
                  setUploadedFiles(prev => ({
                    ...prev,
                    vatRegistrationLicense: file
                  }));
                  formMethods.setValue('vatRegistrationLicense', file);
                  if (formMethods.formState.errors.vatRegistrationLicense) {
                    formMethods.clearErrors('vatRegistrationLicense');
                  }
                }}
                maxSize={3 * 1024 * 1024}
              />
              {uploadedFiles.vatRegistrationLicense && (
                <div className="flex items-center gap-2 mt-2 text-sm text-green-600">
                  <Check className="h-4 w-4" />
                  {uploadedFiles.vatRegistrationLicense.name}
                </div>
              )}
              {formMethods.formState.errors.vatRegistrationLicense && (
                <p className="text-sm text-destructive">
                  {formMethods.formState.errors.vatRegistrationLicense.message?.toString()}
                </p>
              )}
            </div>
            
            <div>
              <Label>Tax Clearance Certificate (Optional)</Label>
              <FileUpload
                accept=".png,.jpg,.jpeg,.pdf"
                onFileSelect={(file) => {
                  setUploadedFiles(prev => ({
                    ...prev,
                    taxClearanceCertificate: file
                  }));
                  formMethods.setValue('taxClearanceCertificate', file);
                  if (formMethods.formState.errors.taxClearanceCertificate) {
                    formMethods.clearErrors('taxClearanceCertificate');
                  }
                }}
                maxSize={3 * 1024 * 1024}
              />
              {uploadedFiles.taxClearanceCertificate && (
                <div className="flex items-center gap-2 mt-2 text-sm text-green-600">
                  <Check className="h-4 w-4" />
                  {uploadedFiles.taxClearanceCertificate.name}
                </div>
              )}
              {formMethods.formState.errors.taxClearanceCertificate && (
                <p className="text-sm text-destructive">
                  {formMethods.formState.errors.taxClearanceCertificate.message?.toString()}
                </p>
              )}
            </div>
            
            <div>
              <Label>NAICOM License Certificate <span className="required-asterisk">*</span></Label>
              <FileUpload
                accept=".png,.jpg,.jpeg,.pdf"
                onFileSelect={(file) => {
                  setUploadedFiles(prev => ({
                    ...prev,
                    naicomLicenseCertificate: file
                  }));
                  formMethods.setValue('naicomLicenseCertificate', file);
                  if (formMethods.formState.errors.naicomLicenseCertificate) {
                    formMethods.clearErrors('naicomLicenseCertificate');
                  }
                }}
                maxSize={3 * 1024 * 1024}
              />
              {uploadedFiles.naicomLicenseCertificate && (
                <div className="flex items-center gap-2 mt-2 text-sm text-green-600">
                  <Check className="h-4 w-4" />
                  {uploadedFiles.naicomLicenseCertificate.name}
                </div>
              )}
              {formMethods.formState.errors.naicomLicenseCertificate && (
                <p className="text-sm text-destructive">
                  {formMethods.formState.errors.naicomLicenseCertificate.message?.toString()}
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
          
          <FormField
            name="signature"
            label="Electronic Signature"
            required={true}
            placeholder="Type your full name as signature"
          />
          
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
              I hereby declare that the information provided above is true and accurate to the best of my knowledge. I understand that any false information may result in the rejection of this application. I also agree to the data privacy policy.
              <span className="required-asterisk">*</span>
            </Label>
          </div>
          {formMethods.formState.errors.agreeToDataPrivacy && (
            <p className="text-sm text-destructive">
              {formMethods.formState.errors.agreeToDataPrivacy.message?.toString()}
            </p>
          )}
        </div>
      )
    }
  ];

  return (
    <FormProvider {...formMethods}>
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-6xl mx-auto">
          <CardHeader>
            <CardTitle>NAICOM Partners Customer Due Diligence (CDD)</CardTitle>
            <CardDescription>
              Complete this form for NAICOM Partners customer due diligence requirements
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MultiStepForm
              steps={steps}
              onSubmit={onFinalSubmit}
              formMethods={formMethods}
              submitButtonText="Submit NAICOM Partners CDD"
              stepFieldMappings={stepFieldMappings}
            />
          </CardContent>
        </Card>

        <FormLoadingModal isOpen={showLoading} message={loadingMessage} />
        
        <FormSummaryDialog
          open={showSummary}
          onOpenChange={setShowSummary}
          formData={submissionData}
          formType="NAICOM Partners CDD"
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
                      <span className="font-medium text-gray-600">Incorporation Date:</span>
                      <p className="text-gray-900">{data.incorporationDate ? format(new Date(data.incorporationDate), 'dd/MM/yyyy') : 'Not provided'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Incorporation State:</span>
                      <p className="text-gray-900">{data.incorporationState || 'Not provided'}</p>
                    </div>
                    <div className="md:col-span-2">
                      <span className="font-medium text-gray-600">Registered Address:</span>
                      <p className="text-gray-900">{data.registeredAddress || 'Not provided'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">City:</span>
                      <p className="text-gray-900">{data.city || 'Not provided'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">State:</span>
                      <p className="text-gray-900">{data.state || 'Not provided'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Country:</span>
                      <p className="text-gray-900">{data.country || 'Not provided'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Email:</span>
                      <p className="text-gray-900">{data.email || 'Not provided'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Website:</span>
                      <p className="text-gray-900">{data.website || 'Not provided'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Contact Person:</span>
                      <p className="text-gray-900">{data.contactPersonName || 'Not provided'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Contact Number:</span>
                      <p className="text-gray-900">{data.contactPersonNumber || 'Not provided'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Tax ID:</span>
                      <p className="text-gray-900">{data.taxId || 'Not provided'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">VAT Registration:</span>
                      <p className="text-gray-900">{data.vatRegistrationNumber || 'Not provided'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">BVN:</span>
                      <p className="text-gray-900">{data.bvn || 'Not provided'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">NIN:</span>
                      <p className="text-gray-900">{data.nin || 'Not provided'}</p>
                    </div>
                    <div className="md:col-span-2">
                      <span className="font-medium text-gray-600">Nature of Business:</span>
                      <p className="text-gray-900">{data.businessNature || 'Not provided'}</p>
                    </div>
                  </div>
                </div>

                {/* NAICOM License Information */}
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold text-lg mb-3">NAICOM License Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-600">License Number:</span>
                      <p className="text-gray-900">{data.naicomLicenseNumber || 'Not provided'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">License Issuing Date:</span>
                      <p className="text-gray-900">{data.naicomLicenseIssuingDate ? format(new Date(data.naicomLicenseIssuingDate), 'dd/MM/yyyy') : 'Not provided'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">License Expiry Date:</span>
                      <p className="text-gray-900">{data.naicomLicenseExpiryDate ? format(new Date(data.naicomLicenseExpiryDate), 'dd/MM/yyyy') : 'Not provided'}</p>
                    </div>
                  </div>
                </div>

                {/* Directors Information */}
                {data.directors && Array.isArray(data.directors) && data.directors.length > 0 && (
                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold text-lg mb-3">Directors/Partners Information</h3>
                    {data.directors.map((director: any, index: number) => (
                      <div key={index} className={index > 0 ? 'mt-4 pt-4 border-t' : ''}>
                        <h4 className="font-medium text-gray-800 mb-2">Director/Partner {index + 1}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium text-gray-600">Name:</span>
                            <p className="text-gray-900">{`${director.title || ''} ${director.firstName || ''} ${director.middleName || ''} ${director.lastName || ''}`.trim() || 'Not provided'}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-600">Gender:</span>
                            <p className="text-gray-900">{director.gender || 'Not provided'}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-600">Date of Birth:</span>
                            <p className="text-gray-900">{director.dateOfBirth ? format(new Date(director.dateOfBirth), 'dd/MM/yyyy') : 'Not provided'}</p>
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
                            <span className="font-medium text-gray-600">BVN:</span>
                            <p className="text-gray-900">{director.bvn || 'Not provided'}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-600">NIN:</span>
                            <p className="text-gray-900">{director.nin || 'Not provided'}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-600">ID Type:</span>
                            <p className="text-gray-900">{director.idType || 'Not provided'}</p>
                          </div>
                          <div className="md:col-span-2">
                            <span className="font-medium text-gray-600">Residential Address:</span>
                            <p className="text-gray-900">{director.residentialAddress || 'Not provided'}</p>
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
                      <p className="text-gray-900">{data.localBankName || 'Not provided'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Account Number:</span>
                      <p className="text-gray-900">{data.localAccountNumber || 'Not provided'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Bank Branch:</span>
                      <p className="text-gray-900">{data.localBankBranch || 'Not provided'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Account Opening Date:</span>
                      <p className="text-gray-900">{data.localAccountOpeningDate ? format(new Date(data.localAccountOpeningDate), 'dd/MM/yyyy') : 'Not provided'}</p>
                    </div>
                  </div>
                </div>

                {/* Documents */}
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold text-lg mb-3">Uploaded Documents</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="font-medium text-gray-600">Certificate of Incorporation:</span>
                      <p className="text-gray-900">{data.certificateOfIncorporation ? '✓ Uploaded' : 'Not uploaded'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Director 1 ID:</span>
                      <p className="text-gray-900">{data.directorId1 ? '✓ Uploaded' : 'Not uploaded'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Director 2 ID:</span>
                      <p className="text-gray-900">{data.directorId2 ? '✓ Uploaded' : 'Not uploaded'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">CAC Status Report:</span>
                      <p className="text-gray-900">{data.cacStatusReport ? '✓ Uploaded' : 'Not uploaded'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">VAT Registration License:</span>
                      <p className="text-gray-900">{data.vatRegistrationLicense ? '✓ Uploaded' : 'Not uploaded'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Tax Clearance Certificate:</span>
                      <p className="text-gray-900">{data.taxClearanceCertificate ? '✓ Uploaded' : 'Not uploaded'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">NAICOM License Certificate:</span>
                      <p className="text-gray-900">{data.naicomLicenseCertificate ? '✓ Uploaded' : 'Not uploaded'}</p>
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
          title="NAICOM Partners CDD Submitted Successfully!"
          message="Your NAICOM Partners CDD form has been submitted successfully. You will receive a confirmation email shortly."
        />
      </div>
    </FormProvider>
  );
};

export default NaicomPartnersCDD;

