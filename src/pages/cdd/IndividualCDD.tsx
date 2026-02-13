import React, { useState, useEffect } from 'react';
import { useForm, useFormContext, FormProvider } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { get } from 'lodash';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Check } from 'lucide-react';
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
import { format } from 'date-fns';
import { formatDate } from '@/utils/dateFormatter';

// FORM COMPONENTS DEFINED OUTSIDE TO PREVENT FOCUS LOSS
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



// VALIDATION SCHEMA OUTSIDE COMPONENT
const individualCDDSchema = yup.object().shape({
  // Personal Info with proper validation
  title: yup.string().required("Title is required"),
  firstName: yup.string().required("First name is required"),
  lastName: yup.string().required("Last name is required"),
  contactAddress: yup.string().required("Contact address is required"),
  gender: yup.string().required("Gender is required"),
  country: yup.string().required("Residence country is required"),
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
  emailAddress: yup.string()
    .required("Email is required")
    .email("Please enter a valid email")
    .typeError("Please enter a valid email"),
  GSMno: yup.string()
    .required("Mobile number is required")
    .matches(/^[\d\s+\-()]+$/, "Invalid phone number format")
    .max(15, "Phone number cannot exceed 15 characters"),
  residentialAddress: yup.string().required("Residential address is required"),
  nationality: yup.string().required("Nationality is required"),
  occupation: yup.string().required("Occupation is required"),
  position: yup.string(),
  
  // Additional Info
  businessType: yup.string().required("Business type is required"),
  businessTypeOther: yup.string().when('businessType', {
    is: 'other',
    then: (schema) => schema.required('Please specify business type'),
    otherwise: (schema) => schema.notRequired()
  }),
  employersEmail: yup.string()
    .required("Employer email is required")
    .email("Please enter a valid email")
    .typeError("Please enter a valid email"),
  employersName: yup.string(),
  employersTelephoneNumber: yup.string(),
  employersAddress: yup.string(),
  taxidentificationNumber: yup.string(),
  BVNNumber: yup.string()
    .required("BVN is required")
    .matches(/^\d+$/, "BVN must contain only numbers")
    .length(11, "BVN must be exactly 11 digits"),
  NINNumber: yup.string()
    .required("NIN is required")
    .matches(/^\d+$/, "NIN must contain only numbers")
    .length(11, "NIN must be exactly 11 digits"),
  identificationType: yup.string().required("ID type is required"),
  identificationNumber: yup.string().required("Identification number is required"),
  issuingCountry: yup.string().required("Issuing country is required"),
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
      if (!value) return true;
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      return value > today;
    })
    .typeError('Please select a valid date'),
  
  // Account Details
  annualIncomeRange: yup.string().required("Annual income range is required"),
  premiumPaymentSource: yup.string().required("Premium payment source is required"),
  premiumPaymentSourceOther: yup.string().when('premiumPaymentSource', {
    is: 'other',
    then: (schema) => schema.required('Please specify payment source'),
    otherwise: (schema) => schema.notRequired()
  }),
  
  // File validation
  identification: yup.mixed().required("Valid means of identification is required"),
  
  // Declaration
  agreeToDataPrivacy: yup.boolean().oneOf([true], "You must agree to data privacy"),
  signature: yup.string().required("Digital signature is required")
});

const defaultValues = {
  title: '',
  firstName: '',
  lastName: '',
  contactAddress: '',
  gender: '',
  country: '',
  dateOfBirth: undefined,
  placeOfBirth: '',
  emailAddress: '',
  GSMno: '',
  residentialAddress: '',
  nationality: '',
  occupation: '',
  position: '',
  businessType: '',
  businessTypeOther: '',
  employersEmail: '',
  employersName: '',
  employersTelephoneNumber: '',
  employersAddress: '',
  taxidentificationNumber: '',
  BVNNumber: '',
  NINNumber: '',
  identificationType: '',
  identificationNumber: '',
  issuingCountry: '',
  issuedDate: undefined,
  expiryDate: undefined,
  annualIncomeRange: '',
  premiumPaymentSource: '',
  premiumPaymentSourceOther: '',
  identification: '',
  agreeToDataPrivacy: false,
  signature: ''
};

const IndividualCDD: React.FC = () => {
  const { toast } = useToast();
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File>>({});
  
  const formMethods = useForm<any>({
    resolver: yupResolver(individualCDDSchema),
    defaultValues,
    mode: 'onChange'
  });

  const { saveDraft, clearDraft } = useFormDraft('individual-cdd', formMethods);

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
    formType: 'Individual CDD',
    onSuccess: () => clearDraft()
  });

  // Watch form values for conditional rendering
  const watchedValues = formMethods.watch();

  // Auto-save draft
  useEffect(() => {
    const subscription = formMethods.watch((data) => {
      saveDraft(data);
    });
    return () => subscription.unsubscribe();
  }, [formMethods, saveDraft]);

  // Data sanitization
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
      console.log('Form data before sanitization:', data);
      
      const sanitizedData = sanitizeData(data);
      console.log('Sanitized data:', sanitizedData);

      // Handle file uploads
      const fileUploadPromises: Array<Promise<[string, string]>> = [];
      
      for (const [key, file] of Object.entries(uploadedFiles)) {
        if (file) {
          fileUploadPromises.push(
            uploadFile(file, `individual-cdd/${Date.now()}-${file.name}`).then(url => [key + 'Url', url])
          );
        }
      }

      const fileResults = await Promise.all(fileUploadPromises);
      const fileUrls = Object.fromEntries(fileResults);

      const finalData = {
        ...sanitizedData,
        ...fileUrls,
        status: 'processing',
        formType: 'Individual CDD'
      };

      await handleEnhancedSubmit(finalData);
    } catch (error) {
      console.error('Error:', error);
      toast({ title: 'Error', description: error instanceof Error ? error.message : 'Submission failed', variant: 'destructive' });
    }
  };

  // Step field mappings for validation
  const stepFieldMappings = {
    0: ['title', 'firstName', 'lastName', 'contactAddress', 'gender', 'country', 'dateOfBirth', 'placeOfBirth', 'emailAddress', 'GSMno', 'residentialAddress', 'nationality', 'occupation', 'position'],
    1: ['businessType', 'businessTypeOther', 'employersEmail', 'employersName', 'employersTelephoneNumber', 'employersAddress', 'taxidentificationNumber', 'BVNNumber', 'NINNumber', 'identificationType', 'identificationNumber', 'issuingCountry', 'issuedDate', 'expiryDate'],
    2: ['annualIncomeRange', 'premiumPaymentSource', 'premiumPaymentSourceOther', 'identification'],
    3: ['agreeToDataPrivacy', 'signature']
  };

  const steps = [
    {
      id: 'personal',
      title: 'Personal Information',
      component: (
        <div className="space-y-4">
          <FormField name="title" label="Title" required={true} />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField name="firstName" label="First Name" required={true} />
            <FormField name="lastName" label="Last Name" required={true} />
          </div>
          
          <FormTextarea name="contactAddress" label="Contact Address" required={true} />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormSelect
              name="gender"
              label="Gender"
              required={true}
              options={[
                { value: 'male', label: 'Male' },
                { value: 'female', label: 'Female' }
              ]}
              placeholder="Select Gender"
            />
            <FormField name="country" label="Residence Country" required={true} />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DatePicker name="dateOfBirth" label="Date Of Birth" required={true} />
            <FormField name="placeOfBirth" label="Place of Birth" required={true} />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField name="emailAddress" label="Email" type="email" required={true} />
            <FormField name="GSMno" label="Mobile Number" required={true} maxLength={15} />
          </div>
          
          <FormTextarea name="residentialAddress" label="Residential Address" required={true} />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField name="nationality" label="Nationality" required={true} />
            <FormField name="occupation" label="Occupation" required={true} />
          </div>
          
          <FormField name="position" label="Position" />
        </div>
      )
    },
    {
      id: 'additional',
      title: 'Additional Information',
      component: (
        <div className="space-y-4">
          <FormSelect
            name="businessType"
            label="Business Type"
            required={true}
            options={[
              { value: 'soleProprietor', label: 'Sole Proprietor' },
              { value: 'limitedLiability', label: 'Limited Liability Company' },
              { value: 'publicLimited', label: 'Public Limited Company' },
              { value: 'jointVenture', label: 'Joint Venture' },
              { value: 'other', label: 'Other (please specify)' }
            ]}
            placeholder="Choose Company Type"
          />
          
          {watchedValues.businessType === 'other' && (
            <FormField name="businessTypeOther" label="Please specify business type" required={true} />
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField name="employersEmail" label="Employer's Email" type="email" required={true} />
            <FormField name="employersName" label="Employer's Name" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField name="employersTelephoneNumber" label="Employer's Telephone Number" />
            <FormField name="taxidentificationNumber" label="Tax Identification Number" />
          </div>
          
          <FormTextarea name="employersAddress" label="Employer's Address" />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField name="BVNNumber" label="BVN" required={true} maxLength={11} />
            <FormField name="NINNumber" label="NIN (National Identification Number)" required={true} maxLength={11} />
          </div>
          
          <FormSelect
            name="identificationType"
            label="ID Type"
            required={true}
            options={[
              { value: 'passport', label: 'International Passport' },
              { value: 'nimc', label: 'NIMC' },
              { value: 'driversLicense', label: 'Drivers Licence' },
              { value: 'votersCard', label: 'Voters Card' },
              { value: 'nin', label: 'NIN' }
            ]}
            placeholder="Choose ID Type"
          />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField name="identificationNumber" label="Identification Number" required={true} />
            <FormField name="issuingCountry" label="Issuing Country" required={true} />
            <DatePicker name="issuedDate" label="Issued Date" required={true} />
          </div>
          
          <DatePicker name="expiryDate" label="Expiry Date" />
        </div>
      )
    },
    {
      id: 'account',
      title: 'Account Details & Files',
      component: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormSelect
              name="annualIncomeRange"
              label="Annual Income Range"
              required={true}
              options={[
                { value: 'lessThan1M', label: 'Less Than 1 Million' },
                { value: '1M-4M', label: '1 Million - 4 Million' },
                { value: '4.1M-10M', label: '4.1 Million - 10 Million' },
                { value: 'moreThan10M', label: 'More Than 10 Million' }
              ]}
              placeholder="Annual Income Range"
            />
            
            <FormSelect
              name="premiumPaymentSource"
              label="Premium Payment Source"
              required={true}
              options={[
                { value: 'salary', label: 'Salary or Business Income' },
                { value: 'investments', label: 'Investments or Dividends' },
                { value: 'other', label: 'Other (please specify)' }
              ]}
              placeholder="Choose Income Source"
            />
          </div>
          
          {watchedValues.premiumPaymentSource === 'other' && (
            <FormField name="premiumPaymentSourceOther" label="Please specify payment source" required={true} />
          )}
          
          <div>
            <Label>Valid Means of Identification <span className="required-asterisk">*</span></Label>
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
          formType="Individual CDD"
          onConfirm={confirmSubmit}
          isSubmitting={isSubmitting}
          renderSummary={(data) => {
            if (!data) return <div className="text-center py-8 text-gray-500">No data to display</div>;
            
            return (
              <div className="space-y-6">
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold text-lg mb-3">Personal Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-600">Name:</span>
                      <p className="text-gray-900">{`${data.title || ''} ${data.firstName || ''} ${data.middleName || ''} ${data.lastName || ''}`.trim() || 'Not provided'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Date of Birth:</span>
                      <p className="text-gray-900">{data.dateOfBirth ? format(new Date(data.dateOfBirth), 'dd/MM/yyyy') : 'Not provided'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Email:</span>
                      <p className="text-gray-900">{data.emailAddress || 'Not provided'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Mobile:</span>
                      <p className="text-gray-900">{data.GSMno || 'Not provided'}</p>
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
                      <span className="font-medium text-gray-600">Nationality:</span>
                      <p className="text-gray-900">{data.nationality || 'Not provided'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Occupation:</span>
                      <p className="text-gray-900">{data.occupation || 'Not provided'}</p>
                    </div>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold text-lg mb-3">Uploaded Documents</h3>
                  <div className="grid grid-cols-1 gap-2 text-sm">
                    <div>
                      <span className="font-medium text-gray-600">Identification:</span>
                      <p className="text-gray-900">{data.identification ? '✓ Uploaded' : 'Not uploaded'}</p>
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
          title="Individual CDD Submitted Successfully!"
          message="Your Individual Customer Due Diligence form has been submitted and is being processed. You will receive a confirmation email shortly."
        />

        {/* Old Dialog - Remove */}
        <Dialog open={false} onOpenChange={() => {}}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Review Your Individual CDD Form</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              {/* Personal Information */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-4">Personal Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><strong>Title:</strong> {watchedValues.title}</div>
                  <div><strong>Name:</strong> {watchedValues.firstName} {watchedValues.lastName}</div>
                  <div><strong>Email:</strong> {watchedValues.emailAddress}</div>
                  <div><strong>Mobile:</strong> {watchedValues.GSMno}</div>
                  <div><strong>Gender:</strong> {watchedValues.gender}</div>
                  <div><strong>Nationality:</strong> {watchedValues.nationality}</div>
                  <div><strong>Occupation:</strong> {watchedValues.occupation}</div>
                  <div><strong>BVN:</strong> {watchedValues.BVNNumber}</div>
                  <div><strong>Date of Birth:</strong> {watchedValues.dateOfBirth ? formatDate(new Date(watchedValues.dateOfBirth)) : 'Not set'}</div>
                  <div><strong>Place of Birth:</strong> {watchedValues.placeOfBirth}</div>
                  <div><strong>ID Type:</strong> {watchedValues.identificationType}</div>
                  <div><strong>ID Number:</strong> {watchedValues.identificationNumber}</div>
                  <div className="col-span-2"><strong>Contact Address:</strong> {watchedValues.contactAddress}</div>
                  <div className="col-span-2"><strong>Residential Address:</strong> {watchedValues.residentialAddress}</div>
                </div>
              </div>

              {/* Additional Information */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-4">Additional Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><strong>Business Type:</strong> {watchedValues.businessType}</div>
                  <div><strong>Employer Email:</strong> {watchedValues.employersEmail}</div>
                  <div><strong>Employer Name:</strong> {watchedValues.employersName}</div>
                  <div><strong>Annual Income:</strong> {watchedValues.annualIncomeRange}</div>
                  <div><strong>Payment Source:</strong> {watchedValues.premiumPaymentSource}</div>
                  <div className="col-span-2"><strong>Employer Address:</strong> {watchedValues.employersAddress}</div>
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
                  onClick={confirmSubmit}
                  disabled={isSubmitting}
                  className="bg-primary text-primary-foreground"
                >
                  {isSubmitting ? 'Submitting...' : 'Confirm & Submit'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default IndividualCDD;