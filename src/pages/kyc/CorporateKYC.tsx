import React, { useState, useEffect } from 'react';
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
import { Plus, Trash2, Check, FileText } from 'lucide-react';
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
import DatePicker from '@/components/common/DatePicker';

// Form validation schema
const corporateKYCSchema = yup.object().shape({
  // Company Info
  branchOffice: yup.string().required("Branch Office is required"),
  insured: yup.string().required("Insured field is required"),
  officeAddress: yup.string().required("Office address is required"),
  ownershipOfCompany: yup.string().required("Ownership of company is required"),
  contactPerson: yup.string().required("Contact person is required"),
  website: yup.string().required("Website is required"),
  incorporationNumber: yup.string().required("Incorporation number is required"),
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
  BVNNumber: yup.string()
    .required("BVN is required")
    .matches(/^\d+$/, "BVN must contain only numbers")
    .length(11, "BVN must be exactly 11 digits"),
  NINNumber: yup.string()
    .required("NIN is required")
    .matches(/^\d+$/, "NIN must contain only numbers")
    .length(11, "NIN must be exactly 11 digits"),
  contactPersonNo: yup.string()
    .required("Contact person mobile is required")
    .matches(/^[\d\s+\-()]+$/, "Invalid phone number format")
    .max(15, "Phone number cannot exceed 15 characters"),
  taxIDNo: yup.string()
    .matches(/^\d*$/, "Tax ID must contain only numbers")
    .max(10, "Tax ID cannot exceed 10 digits"),
  emailAddress: yup.string()
    .required("Email is required")
    .email("Please enter a valid email")
    .typeError("Please enter a valid email"),
  natureOfBusiness: yup.string().required("Business type is required"),
  estimatedTurnover: yup.string().required("Estimated turnover is required"),
  premiumPaymentSource: yup.string().required("Premium payment source is required"),
  premiumPaymentSourceOther: yup.string().when('premiumPaymentSource', {
    is: 'Other',
    then: (schema) => schema.required('Please specify other income source'),
    otherwise: (schema) => schema.notRequired()
  }),

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
    BVNNumber: yup.string()
      .required("BVN is required")
      .matches(/^\d+$/, "BVN must contain only numbers")
      .length(11, "BVN must be exactly 11 digits"),
    NINNumber: yup.string()
      .required("NIN is required")
      .matches(/^\d+$/, "NIN must contain only numbers")
      .length(11, "NIN must be exactly 11 digits"),
    employersName: yup.string(),
    employersPhoneNumber: yup.string()
      .matches(/^[\d\s+\-()]*$/, "Invalid phone number format")
      .max(15, "Phone number cannot exceed 15 characters"),
    residentialAddress: yup.string().required("Residential address is required"),
    taxIDNumber: yup.string()
      .matches(/^\d*$/, "Tax ID must contain only numbers")
      .max(10, "Tax ID cannot exceed 10 digits"),
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

  // Account Details
  localBankName: yup.string()
    .required("Bank name is required")
    .min(2, "Bank name must be at least 2 characters")
    .max(100, "Bank name cannot exceed 100 characters"),
  localAccountNumber: yup.string()
    .required("Account number is required")
    .matches(/^\d+$/, "Account number must contain only numbers")
    .min(10, "Account number must be at least 10 digits")
    .max(10, "Account number must be exactly 10 digits"),
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

  // Verification
  companyNameVerificationDoc: yup.string().required("Verification document type is required"),
  verificationDoc: yup.mixed().required("Verification document upload is required"),

  // Declaration
  agreeToDataPrivacy: yup.boolean().oneOf([true], "You must agree to data privacy"),
  signature: yup.string().required("Signature is required")
});

const defaultValues = {
  branchOffice: '',
  insured: '',
  officeAddress: '',
  ownershipOfCompany: '',
  contactPerson: '',
  website: '',
  incorporationNumber: '',
  incorporationState: '',
  dateOfIncorporationRegistration: undefined,
  BVNNumber: '',
  NINNumber: '',
  contactPersonNo: '',
  taxIDNo: '',
  emailAddress: '',
  natureOfBusiness: '',
  estimatedTurnover: '',
  premiumPaymentSource: '',
  premiumPaymentSourceOther: '',
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
    BVNNumber: '',
    NINNumber: '',
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
  }],
  localBankName: '',
  localAccountNumber: '',
  localBankBranch: '',
  localAccountOpeningDate: undefined,
  foreignBankName: '',
  foreignAccountNumber: '',
  foreignBankBranch: '',
  foreignAccountOpeningDate: undefined,
  companyNameVerificationDoc: '',
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
  const [currentStep, setCurrentStep] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File>>({});
  
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
    formType: 'Corporate KYC',
    onSuccess: () => clearDraft()
  });

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
      'branchOffice', 'insured', 'officeAddress', 'ownershipOfCompany', 'contactPerson', 
      'website', 'incorporationNumber', 'incorporationState', 'dateOfIncorporationRegistration',
      'BVNNumber', 'NINNumber', 'contactPersonNo', 'taxIDNo', 'emailAddress', 'natureOfBusiness', 
      'estimatedTurnover', 'premiumPaymentSource', 'premiumPaymentSourceOther'
    ],
    1: ['directors'],
    2: [
      'localBankName', 'localAccountNumber', 'localBankBranch', 'localAccountOpeningDate',
      'foreignBankName', 'foreignAccountNumber', 'foreignBankBranch', 'foreignAccountOpeningDate',
      'companyNameVerificationDoc', 'verificationDoc'
    ],
    3: ['agreeToDataPrivacy', 'signature']
  };

  const steps = [
    {
      id: 'company',
      title: 'Company Information',
      component: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              name="branchOffice"
              label="NEM Branch Office"
              required={true}
            />
            <FormField
              name="insured"
              label="Insured"
              required={true}
            />
          </div>

          <FormTextarea
            name="officeAddress"
            label="Office Address"
            required={true}
          />

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
              label="Contact Person"
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
              name="incorporationNumber"
              label="Incorporation Number"
              required={true}
            />
            <FormField
              name="incorporationState"
              label="Incorporation State"
              required={true}
            />
          </div>

          <DatePicker
            name="dateOfIncorporationRegistration"
            label="Date of Incorporation/Registration"
            required={true}
          />

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
              name="contactPersonNo"
              label="Contact Person Mobile Number"
              required={true}
              maxLength={15}
            />
            <FormField
              name="taxIDNo"
              label="Tax Identification Number"
              required={false}
              maxLength={10}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              name="emailAddress"
              label="Email Address"
              required={true}
              type="email"
            />
          </div>

          <FormField
            name="natureOfBusiness"
            label="Business Type/Occupation"
            required={true}
          />

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

          <FormSelect
            name="premiumPaymentSource"
            label="Premium Payment Source"
            required={true}
            placeholder="Choose Income Source"
            options={[
              { value: "Salary or Business Income", label: "Salary or Business Income" },
              { value: "Investments or Dividends", label: "Investments or Dividends" },
              { value: "Other", label: "Other (please specify)" }
            ]}
          />

          {formMethods.watch('premiumPaymentSource') === 'Other' && (
            <FormField
              name="premiumPaymentSourceOther"
              label="Please specify other income source"
              required={true}
            />
          )}
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
                <FormField
                  name={`directors.${index}.firstName`}
                  label="First Name"
                  required={true}
                />
                <FormField
                  name={`directors.${index}.middleName`}
                  label="Middle Name"
                  required={false}
                />
                <FormField
                  name={`directors.${index}.lastName`}
                  label="Last Name"
                  required={true}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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
                <FormField
                  name={`directors.${index}.BVNNumber`}
                  label="BVN"
                  required={true}
                  maxLength={11}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <FormField
                  name={`directors.${index}.NINNumber`}
                  label="NIN (National Identification Number)"
                  required={true}
                  maxLength={11}
                />
                <FormField
                  name={`directors.${index}.employersName`}
                  label="Employers Name"
                  required={false}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <FormField
                  name={`directors.${index}.employersPhoneNumber`}
                  label="Employers Phone Number"
                  required={false}
                  maxLength={15}
                />
              </div>

              <FormTextarea
                name={`directors.${index}.residentialAddress`}
                label="Residential Address"
                required={true}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <FormField
                  name={`directors.${index}.taxIDNumber`}
                  label="Tax ID Number"
                  required={false}
                  maxLength={10}
                />
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
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <FormField
                  name={`directors.${index}.idNumber`}
                  label="Identification Number"
                  required={true}
                />
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
              employersName: '',
              employersPhoneNumber: '',
              residentialAddress: '',
              taxIDNumber: '',
              idType: '',
              idNumber: '',
              issuingBody: '',
              issuedDate: '',
              expiryDate: '',
              sourcOfIncome: '',
              sourcOfIncomeOther: ''
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
      title: 'Account Details & Verification Upload',
      component: (
        <div className="space-y-6">
          {/* Local Account Details */}
          <div>
            <h3 className="text-lg font-medium mb-4">Local Account Details</h3>
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

          {/* Foreign Account Details (Optional) */}
          <div>
            <h3 className="text-lg font-medium mb-4">Foreign Account Details (Optional)</h3>
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

          {/* Verification Document */}
          <div className="pt-6 border-t">
            <h3 className="text-lg font-medium mb-4">Verification Document</h3>
            <FormSelect
              name="companyNameVerificationDoc"
              label="Company Name Verification Document"
              required={true}
              placeholder="Verification Document"
              options={[
                { value: "Certificate of Incorporation or Business Registration", label: "Certificate of Incorporation or Business Registration" },
                { value: "CAC Status Report", label: "CAC Status Report" },
                { value: "Board Resolution", label: "Board Resolution" },
                { value: "Power of Attorney", label: "Power of Attorney" }
              ]}
            />

            <div className="mt-4">
              <Label>Upload Your Verification Document <span className="required-asterisk">*</span></Label>
              <FileUpload
                accept=".png,.jpg,.jpeg,.pdf"
                onFileSelect={(file) => {
                  setUploadedFiles(prev => ({
                    ...prev,
                    verificationDoc: file
                  }));
                  formMethods.setValue('verificationDoc', file);
                  if (formMethods.formState.errors.verificationDoc) {
                    formMethods.clearErrors('verificationDoc');
                  }
                }}
                maxSize={3 * 1024 * 1024}
              />
              {uploadedFiles.verificationDoc && (
                <div className="flex items-center gap-2 mt-2 text-sm text-green-600">
                  <Check className="h-4 w-4" />
                  {uploadedFiles.verificationDoc.name}
                </div>
              )}
              {formMethods.formState.errors.verificationDoc && (
                <p className="text-sm text-destructive">{formMethods.formState.errors.verificationDoc.message?.toString()}</p>
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
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-6xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-6 w-6" />
              Corporate KYC Form
            </CardTitle>
            <CardDescription>
              Know Your Customer - Please provide accurate information for regulatory compliance
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
                    <span className="font-medium text-gray-600">Branch Office:</span>
                    <p className="text-gray-900">{data.branchOffice || 'Not provided'}</p>
                  </div>
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
                    <span className="font-medium text-gray-600">Contact Person:</span>
                    <p className="text-gray-900">{data.contactPerson || 'Not provided'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Website:</span>
                    <p className="text-gray-900">{data.website || 'Not provided'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Incorporation Number:</span>
                    <p className="text-gray-900">{data.incorporationNumber || 'Not provided'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">BVN:</span>
                    <p className="text-gray-900">{data.BVNNumber || 'Not provided'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">NIN:</span>
                    <p className="text-gray-900">{data.NINNumber || 'Not provided'}</p>
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
                          <span className="font-medium text-gray-600">BVN:</span>
                          <p className="text-gray-900">{director.BVNNumber || 'Not provided'}</p>
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

              {/* Bank Details */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-3">Bank Details</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-800 mb-2">Local Account</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-600">Bank Name:</span>
                        <p className="text-gray-900">{data.localBankName || 'Not provided'}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Account Number:</span>
                        <p className="text-gray-900">{data.localAccountNumber || 'Not provided'}</p>
                      </div>
                    </div>
                  </div>
                  {data.foreignBankName && (
                    <div className="border-t pt-4">
                      <h4 className="font-medium text-gray-800 mb-2">Foreign Account</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-600">Bank Name:</span>
                          <p className="text-gray-900">{data.foreignBankName || 'Not provided'}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">Account Number:</span>
                          <p className="text-gray-900">{data.foreignAccountNumber || 'Not provided'}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Documents */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-3">Uploaded Documents</h3>
                <div className="grid grid-cols-1 gap-2 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">Verification Document:</span>
                    <p className="text-gray-900">{data.verificationDoc ? '✓ Uploaded' : 'Not uploaded'}</p>
                  </div>
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
      </div>
    </FormProvider>
  );
};

export default CorporateKYC;
