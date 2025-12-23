import React, { useState, useEffect } from 'react';
import { useForm, FormProvider, useFormContext } from 'react-hook-form';
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
import { Check, Info } from 'lucide-react';
import { format } from 'date-fns';
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


// Form validation schema
const individualKYCSchema = yup.object().shape({
  officeLocation: yup.string().required("Office location is required"),
  title: yup.string().required("Title is required"),
  firstName: yup.string().required("First name is required"),
  middleName: yup.string(),
  lastName: yup.string().required("Last name is required"),
  contactAddress: yup.string().required("Contact address is required"),
  occupation: yup.string().required("Occupation is required"),
  gender: yup.string().required("Gender is required"),
  dateOfBirth: yup.date()
    .typeError("Please enter a valid date")
    .required("Date of birth is required")
    .max(new Date(new Date().setFullYear(new Date().getFullYear() - 18)), "You must be at least 18 years old"),
  mothersMaidenName: yup.string().required("Mother's maiden name is required"),
  city: yup.string().required("City is required"),
  state: yup.string().required("State is required"),
  country: yup.string().required("Country is required"),
  nationality: yup.string().required("Nationality is required"),
  residentialAddress: yup.string().required("Residential address is required"),
  GSMno: yup.string()
    .required("Mobile number is required")
    .matches(/^[0-9+\-()]+$/, "Phone number can only contain numbers and +, -, (, ) characters")
    .max(15, "Phone number cannot exceed 15 characters"),
  emailAddress: yup.string().email("Please enter a valid email address").required("Email is required"),
  BVN: yup.string()
    .required("BVN is required")
    .matches(/^[0-9]+$/, "BVN can only contain numbers")
    .length(11, "BVN must be exactly 11 digits"),
  NIN: yup.string()
    .required("NIN is required")
    .matches(/^[0-9]+$/, "NIN can only contain numbers")
    .length(11, "NIN must be exactly 11 digits"),
  identificationType: yup.string().required("ID type is required"),
  idNumber: yup.string().required("Identification number is required"),
  issuingCountry: yup.string().required("Issuing country is required"),
  issuedDate: yup.date()
    .typeError("Please enter a valid date")
    .required("Issue date is required")
    .max(new Date(), "Issue date cannot be in the future"),
  expiryDate: yup.date()
    .nullable()
    .transform((value, originalValue) => {
      // Handle empty string case for optional date field
      if (originalValue === '' || originalValue === null || originalValue === undefined) {
        return null;
      }
      return value;
    })
    .typeError("Please enter a valid date")
    .test('future-date', 'Expiry date cannot be in the past', function(value) {
      // Only validate if a value is provided
      if (!value) return true;
      return value >= new Date();
    }),
  sourceOfIncome: yup.string().required("Income source is required"),
  sourceOfIncomeOther: yup.string().when('sourceOfIncome', {
    is: 'Other',
    then: (schema) => schema.required("Please specify income source"),
    otherwise: (schema) => schema.nullable()
  }),
  annualIncomeRange: yup.string().required("Annual income range is required"),
  premiumPaymentSource: yup.string().required("Premium payment source is required"),
  premiumPaymentSourceOther: yup.string().when('premiumPaymentSource', {
    is: 'Other',
    then: (schema) => schema.required("Please specify payment source"),
    otherwise: (schema) => schema.nullable()
  }),
  bankName: yup.string().required("Bank name is required"),
  accountNumber: yup.string()
    .required("Account number is required")
    .matches(/^[0-9]+$/, "Account number can only contain numbers")
    .max(10, "Account number cannot exceed 10 digits"),
  bankBranch: yup.string().required("Bank branch is required"),
  accountOpeningDate: yup.date()
    .typeError("Please enter a valid date")
    .required("Account opening date is required")
    .max(new Date(), "Account opening date cannot be in the future"),
  bankName2: yup.string().nullable(),
  accountNumber2: yup.string().nullable(),
  bankBranch2: yup.string().nullable(),
  accountOpeningDate2: yup.date().nullable().typeError("Please enter a valid date").transform((value, originalValue) => {
    // Handle empty string case for optional date field
    if (originalValue === '' || originalValue === null || originalValue === undefined) {
      return null;
    }
    return value;
  }).max(new Date(), "Account opening date cannot be in the future"),
  // File validation
  identification: yup.mixed().required("Identification document is required").test(
    'fileType',
    'Only PNG, JPG, JPEG, or PDF files are allowed',
    (value: any) => {
      if (!value) return false;
      const allowedTypes = ['image/png', 'image/jpg', 'image/jpeg', 'application/pdf'];
      return allowedTypes.includes(value?.type);
    }
  ),
  agreeToDataPrivacy: yup.boolean().oneOf([true], "You must agree to the data privacy policy and declaration"),
  signature: yup.string().required("Digital signature is required")
});

const defaultValues = {
  officeLocation: '',
  title: '',
  firstName: '',
  middleName: '',
  lastName: '',
  contactAddress: '',
  occupation: '',
  gender: '',
  dateOfBirth: '',
  mothersMaidenName: '',
  employersName: '',
  employersTelephoneNumber: '',
  employersAddress: '',
  city: '',
  state: '',
  country: '',
  nationality: '',
  residentialAddress: '',
  GSMno: '',
  emailAddress: '',
  taxIDNo: '',
  BVN: '',
  NIN: '',
  identificationType: '',
  idNumber: '',
  issuingCountry: '',
  issuedDate: '',
  expiryDate: '',
  sourceOfIncome: '',
  sourceOfIncomeOther: '',
  annualIncomeRange: '',
  premiumPaymentSource: '',
  premiumPaymentSourceOther: '',
  bankName: '',
  accountNumber: '',
  bankBranch: '',
  accountOpeningDate: '',
  bankName2: '',
  accountNumber2: '',
  bankBranch2: '',
  accountOpeningDate2: '',
  identification: null,
  agreeToDataPrivacy: false,
  signature: ''
};

// Form field components with validation
const FormField = ({ name, label, required = false, type = "text", ...props }: any) => {
  const { register, formState: { errors }, clearErrors } = useFormContext();
  const error = errors[name];
  
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>
        {label}
        {required && <span className="required-asterisk">*</span>}
      </Label>
      <Input
        id={name}
        type={type}
        {...register(name, {
          onChange: () => {
            if (error) {
              clearErrors(name);
            }
          }
        })}
        className={cn(error && "border-destructive")}
        {...props}
      />
      {error && (
        <p className="text-sm text-destructive">{error.message?.toString()}</p>
      )}
    </div>
  );
};

const FormTextarea = ({ name, label, required = false, ...props }: any) => {
  const { register, formState: { errors }, clearErrors } = useFormContext();
  const error = errors[name];
  
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
        className={cn(error && "border-destructive")}
        {...props}
      />
      {error && (
        <p className="text-sm text-destructive">{error.message?.toString()}</p>
      )}
    </div>
  );
};

const FormSelect = ({ name, label, required = false, placeholder, children, ...props }: any) => {
  const { setValue, watch, formState: { errors }, clearErrors } = useFormContext();
  const value = watch(name);
  const error = errors[name];
  
  return (
    <div className="space-y-2">
      <Label>
        {label}
        {required && <span className="required-asterisk">*</span>}
      </Label>
      <Select
        value={value}
        onValueChange={(val) => {
          setValue(name, val);
          if (error) {
            clearErrors(name);
          }
        }}
        {...props}
      >
        <SelectTrigger className={cn(error && "border-destructive")}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {children}
        </SelectContent>
      </Select>
      {error && (
        <p className="text-sm text-destructive">{error.message?.toString()}</p>
      )}
    </div>
  );
};

const IndividualKYC: React.FC = () => {
  const { toast } = useToast();
  
  // Make toast available globally for MultiStepForm
  useEffect(() => {
    (window as any).toast = toast;
  }, [toast]);
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File>>({});
  
  const formMethods = useForm<any>({
    resolver: yupResolver(individualKYCSchema),
    defaultValues,
    mode: 'onChange'
  });

  const { saveDraft, clearDraft } = useFormDraft('individualKYC', formMethods);

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
    formType: 'Individual KYC',
    onSuccess: () => clearDraft()
  });

  // Auto-save draft
  useEffect(() => {
    const subscription = formMethods.watch((data) => {
      saveDraft(data);
    });
    return () => subscription.unsubscribe();
  }, [formMethods, saveDraft]);

  const onFinalSubmit = async (data: any) => {
    try {
      console.log('Individual KYC onFinalSubmit called with data:', data);
      
      // Prepare file upload data
      const fileUploadPromises: Array<Promise<[string, string]>> = [];
      
      for (const [key, file] of Object.entries(uploadedFiles)) {
        if (file) {
          fileUploadPromises.push(
            uploadFile(file, `individual-kyc/${Date.now()}-${file.name}`).then(url => [key, url])
          );
        }
      }

      const fileResults = await Promise.all(fileUploadPromises);
      const fileUrls = Object.fromEntries(fileResults);

      const finalData = {
        ...data,
        ...fileUrls,
        status: 'processing',
        formType: 'Individual KYC'
      };

      console.log('Calling handleEnhancedSubmit with finalData:', finalData);
      
      // Use enhanced submit which will show loading immediately
      await handleEnhancedSubmit(finalData);
    } catch (error) {
      console.error('Error in onFinalSubmit:', error);
      toast({
        title: 'Submission Error',
        description: error instanceof Error ? error.message : 'An error occurred during submission',
        variant: 'destructive'
      });
    }
  };

  const steps = [
    {
      id: 'personal',
      title: 'Personal Information',
      component: (
        <FormProvider {...formMethods}>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField name="officeLocation" label="Office Location" required />
              <FormField name="title" label="Title" required />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField name="firstName" label="First Name" required />
              <FormField name="middleName" label="Middle Name" />
              <FormField name="lastName" label="Last Name" required />
            </div>

            <FormTextarea name="contactAddress" label="Contact Address" required />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField name="occupation" label="Occupation" required />
              <FormSelect name="gender" label="Gender" required placeholder="Select Gender">
                <SelectItem value="Male">Male</SelectItem>
                <SelectItem value="Female">Female</SelectItem>
              </FormSelect>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DatePicker name="dateOfBirth" label="Date of Birth" required />
              <FormField name="mothersMaidenName" label="Mother's Maiden Name" required />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField name="employersName" label="Employer's Name" />
              <FormField name="employersTelephoneNumber" label="Employer's Telephone" />
            </div>

            <FormTextarea name="employersAddress" label="Employer's Address" />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField name="city" label="City" required />
              <FormField name="state" label="State" required />
              <FormField name="country" label="Country" required />
            </div>

            <FormSelect name="nationality" label="Nationality" required placeholder="Select Nationality">
              <SelectItem value="Nigerian">Nigerian</SelectItem>
              <SelectItem value="Foreign">Foreign</SelectItem>
              <SelectItem value="Both">Both</SelectItem>
            </FormSelect>

            <FormTextarea name="residentialAddress" label="Residential Address" required />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField name="GSMno" label="Mobile Number" required />
              <FormField name="emailAddress" label="Email" type="email" required />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField name="taxIDNo" label="Tax Identification Number" />
              <FormField name="BVN" label="BVN" required maxLength={11} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField name="NIN" label="NIN (National Identification Number)" required maxLength={11} />
            </div>

            <FormSelect name="identificationType" label="ID Type" required placeholder="Choose ID Type">
              <SelectItem value="International Passport">International Passport</SelectItem>
              <SelectItem value="NIMC">NIMC</SelectItem>
              <SelectItem value="Drivers Licence">Drivers Licence</SelectItem>
              <SelectItem value="Voters Card">Voters Card</SelectItem>
              <SelectItem value="NIN">NIN</SelectItem>
            </FormSelect>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField name="idNumber" label="Identification Number" required />
              <FormField name="issuingCountry" label="Issuing Country" required />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DatePicker name="issuedDate" label="Issued Date" required />
              <DatePicker name="expiryDate" label="Expiry Date" />
            </div>

            <FormSelect name="sourceOfIncome" label="Source of Income" required placeholder="Choose Income Source">
              <SelectItem value="Salary or Business Income">Salary or Business Income</SelectItem>
              <SelectItem value="Investments or Dividends">Investments or Dividends</SelectItem>
              <SelectItem value="Other">Other (please specify)</SelectItem>
            </FormSelect>

            {formMethods.watch('sourceOfIncome') === 'Other' && (
              <FormField name="sourceOfIncomeOther" label="Please specify other income source" required />
            )}

            <FormSelect name="annualIncomeRange" label="Annual Income Range" required placeholder="Select Income Range">
              <SelectItem value="Less Than 1 Million">Less Than 1 Million</SelectItem>
              <SelectItem value="1 Million - 4 Million">1 Million - 4 Million</SelectItem>
              <SelectItem value="4.1 Million - 10 Million">4.1 Million - 10 Million</SelectItem>
              <SelectItem value="More Than 10 Million">More Than 10 Million</SelectItem>
            </FormSelect>

            <FormSelect name="premiumPaymentSource" label="Premium Payment Source" required placeholder="Choose Payment Source">
              <SelectItem value="Salary or Business Income">Salary or Business Income</SelectItem>
              <SelectItem value="Investments or Dividends">Investments or Dividends</SelectItem>
              <SelectItem value="Other">Other (please specify)</SelectItem>
            </FormSelect>

            {formMethods.watch('premiumPaymentSource') === 'Other' && (
              <FormField name="premiumPaymentSourceOther" label="Please specify other payment source" required />
            )}
          </div>
        </FormProvider>
      )
    },
    {
      id: 'accounts',
      title: 'Account Details',
      component: (
        <FormProvider {...formMethods}>
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Local Account Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField name="bankName" label="Bank Name" required />
                <FormField name="accountNumber" label="Account Number" required />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField name="bankBranch" label="Bank Branch" required />
                <DatePicker name="accountOpeningDate" label="Account Opening Date" required />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Foreign Account Details (Optional)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField name="bankName2" label="Bank Name" />
                <FormField name="accountNumber2" label="Account Number" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField name="bankBranch2" label="Bank Branch" />
                <DatePicker name="accountOpeningDate2" label="Account Opening Date" />
              </div>
            </div>
          </div>
        </FormProvider>
      )
    },
    {
      id: 'upload',
      title: 'Upload Documents',
      component: (
        <FormProvider {...formMethods}>
          <div className="space-y-4">
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
                  formMethods.trigger('identification');
                }}
                onFileRemove={() => {
                  setUploadedFiles(prev => ({
                    ...prev,
                    identification: null
                  }));
                  formMethods.setValue('identification', null);
                  formMethods.trigger('identification');
                }}
                currentFile={uploadedFiles.identification}
                maxSize={3}
                error={formMethods.formState.errors.identification?.message?.toString()}
              />
              {uploadedFiles.identification && (
                <div className="flex items-center gap-2 mt-2 text-sm text-green-600">
                  <Check className="h-4 w-4" />
                  {uploadedFiles.identification.name}
                </div>
              )}
            </div>
          </div>
        </FormProvider>
      )
    },
    {
      id: 'declaration',
      title: 'Data Privacy & Declaration',
      component: (
        <FormProvider {...formMethods}>
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Data Privacy</h3>
              <div className="space-y-2 text-sm">
                <p>i. Your data will solemnly be used for the purposes of this business contract and also to enable us reach you with the updates about our products and services.</p>
                <p>ii. Please note that your personal data will be treated with utmost respect and is well secured as required by Nigeria Data Protection Regulations 2019.</p>
                <p>iii. Your personal data shall not be shared with or sold to any third-party without your consent unless we are compelled by law or regulator.</p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Declaration</h3>
              <div className="space-y-2 text-sm">
                <p>1. I/We declare to the best of my/our knowledge and belief that the information given on this form is true in every respect and agree that if I/we have made any false or fraudulent statement, be it suppression or concealment, the policy shall be cancelled and the claim shall be forfeited.</p>
                <p>2. I/We agree to provide additional information to NEM Insurance, if required.</p>
                <p>3. I/We agree to submit all required and requested for documents and NEM Insurance shall not be held responsible for any delay in settlement of claim due to non-fulfillment of requirements.</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="agreeToDataPrivacy"
                    checked={formMethods.watch('agreeToDataPrivacy')}
                    onCheckedChange={(checked) => {
                      formMethods.setValue('agreeToDataPrivacy', checked);
                      if (formMethods.formState.errors.agreeToDataPrivacy) {
                        formMethods.clearErrors('agreeToDataPrivacy');
                      }
                    }}
                    className={cn(formMethods.formState.errors.agreeToDataPrivacy && "border-destructive")}
                  />
                  <Label htmlFor="agreeToDataPrivacy" className="text-sm">
                    I agree to the data privacy policy and declaration above <span className="required-asterisk">*</span>
                  </Label>
                </div>
                {formMethods.formState.errors.agreeToDataPrivacy && (
                  <p className="text-sm text-destructive">{formMethods.formState.errors.agreeToDataPrivacy.message?.toString()}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="signature">
                  Digital Signature <span className="required-asterisk">*</span>
                </Label>
                <Textarea
                  id="signature"
                  placeholder="Type your full name as digital signature"
                  {...formMethods.register('signature', {
                    onChange: () => {
                      if (formMethods.formState.errors.signature) {
                        formMethods.clearErrors('signature');
                      }
                    }
                  })}
                  className={cn(formMethods.formState.errors.signature && "border-destructive")}
                />
                {formMethods.formState.errors.signature && (
                  <p className="text-sm text-destructive">{formMethods.formState.errors.signature.message?.toString()}</p>
                )}
              </div>

              <div>
                <Label>Date</Label>
                <Input
                  value={new Date().toLocaleDateString()}
                  disabled
                  className="bg-gray-50"
                />
              </div>
            </div>
          </div>
        </FormProvider>
      )
    }
  ];

  // Define field mappings for each step
  const stepFieldMappings = {
    0: ['officeLocation', 'title', 'firstName', 'middleName', 'lastName', 'contactAddress', 'occupation', 'gender', 'dateOfBirth', 'mothersMaidenName', 'city', 'state', 'country', 'nationality', 'residentialAddress', 'GSMno', 'emailAddress', 'BVN', 'NIN', 'identificationType', 'idNumber', 'issuingCountry', 'issuedDate', 'sourceOfIncome', 'sourceOfIncomeOther', 'annualIncomeRange', 'premiumPaymentSource', 'premiumPaymentSourceOther'],
    1: ['bankName', 'accountNumber', 'bankBranch', 'accountOpeningDate'],
    2: ['identification'], // File upload validation
    3: ['agreeToDataPrivacy', 'signature']
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Individual KYC Form
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
          />
        </CardContent>
      </Card>

      {/* Loading Modal */}
      <FormLoadingModal
        isOpen={showLoading}
        message={loadingMessage}
      />

      {/* Summary Dialog - Custom organized summary matching Motor Claims standard */}
      <FormSummaryDialog
        open={showSummary}
        onOpenChange={setShowSummary}
        formData={submissionData}
        formType="Individual KYC"
        onConfirm={confirmSubmit}
        isSubmitting={isSubmitting}
        renderSummary={(data) => {
          if (!data) return <div className="text-center py-8 text-gray-500">No data to display</div>;
          
          return (
            <div className="space-y-6">
              {/* Section 1: Personal Information */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-3">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">Title:</span>
                    <p className="text-gray-900">{data.title || 'Not provided'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">First Name:</span>
                    <p className="text-gray-900">{data.firstName || 'Not provided'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Middle Name:</span>
                    <p className="text-gray-900">{data.middleName || 'Not provided'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Last Name:</span>
                    <p className="text-gray-900">{data.lastName || 'Not provided'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Gender:</span>
                    <p className="text-gray-900 capitalize">{data.gender || 'Not provided'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Date of Birth:</span>
                    <p className="text-gray-900">{data.dateOfBirth ? format(new Date(data.dateOfBirth), 'dd/MM/yyyy') : 'Not provided'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Mother's Maiden Name:</span>
                    <p className="text-gray-900">{data.mothersMaidenName || 'Not provided'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Nationality:</span>
                    <p className="text-gray-900">{data.nationality || 'Not provided'}</p>
                  </div>
                </div>
              </div>

              {/* Section 2: Contact Information */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-3">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">Mobile Number:</span>
                    <p className="text-gray-900">{data.GSMno || 'Not provided'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Email Address:</span>
                    <p className="text-gray-900">{data.emailAddress || 'Not provided'}</p>
                  </div>
                  <div className="md:col-span-2">
                    <span className="font-medium text-gray-600">Contact Address:</span>
                    <p className="text-gray-900">{data.contactAddress || 'Not provided'}</p>
                  </div>
                  <div className="md:col-span-2">
                    <span className="font-medium text-gray-600">Residential Address:</span>
                    <p className="text-gray-900">{data.residentialAddress || 'Not provided'}</p>
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
                    <span className="font-medium text-gray-600">Occupation:</span>
                    <p className="text-gray-900">{data.occupation || 'Not provided'}</p>
                  </div>
                </div>
              </div>

              {/* Section 3: Identification */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-3">Identification</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">BVN:</span>
                    <p className="text-gray-900">{data.BVN || 'Not provided'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">ID Type:</span>
                    <p className="text-gray-900">{data.identificationType || 'Not provided'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">ID Number:</span>
                    <p className="text-gray-900">{data.idNumber || 'Not provided'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Issuing Country:</span>
                    <p className="text-gray-900">{data.issuingCountry || 'Not provided'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Issue Date:</span>
                    <p className="text-gray-900">{data.issuedDate ? format(new Date(data.issuedDate), 'dd/MM/yyyy') : 'Not provided'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Expiry Date:</span>
                    <p className="text-gray-900">{data.expiryDate ? format(new Date(data.expiryDate), 'dd/MM/yyyy') : 'Not provided'}</p>
                  </div>
                </div>
              </div>

              {/* Section 4: Financial Information */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-3">Financial Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">Source of Income:</span>
                    <p className="text-gray-900">{data.sourceOfIncome === 'Other' ? data.sourceOfIncomeOther : data.sourceOfIncome || 'Not provided'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Annual Income Range:</span>
                    <p className="text-gray-900">{data.annualIncomeRange || 'Not provided'}</p>
                  </div>
                  <div className="md:col-span-2">
                    <span className="font-medium text-gray-600">Premium Payment Source:</span>
                    <p className="text-gray-900">{data.premiumPaymentSource === 'Other' ? data.premiumPaymentSourceOther : data.premiumPaymentSource || 'Not provided'}</p>
                  </div>
                </div>
              </div>

              {/* Section 5: Bank Details */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-3">Bank Details</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-800 mb-2">Primary Bank Account</h4>
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
                        <span className="font-medium text-gray-600">Branch:</span>
                        <p className="text-gray-900">{data.bankBranch || 'Not provided'}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Account Opening Date:</span>
                        <p className="text-gray-900">{data.accountOpeningDate ? format(new Date(data.accountOpeningDate), 'dd/MM/yyyy') : 'Not provided'}</p>
                      </div>
                    </div>
                  </div>

                  {data.bankName2 && (
                    <div className="border-t pt-4">
                      <h4 className="font-medium text-gray-800 mb-2">Secondary Bank Account</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-600">Bank Name:</span>
                          <p className="text-gray-900">{data.bankName2 || 'Not provided'}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">Account Number:</span>
                          <p className="text-gray-900">{data.accountNumber2 || 'Not provided'}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">Branch:</span>
                          <p className="text-gray-900">{data.bankBranch2 || 'Not provided'}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">Account Opening Date:</span>
                          <p className="text-gray-900">{data.accountOpeningDate2 ? format(new Date(data.accountOpeningDate2), 'dd/MM/yyyy') : 'Not provided'}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Section 6: Office Location */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-3">Office Location</h3>
                <div className="text-sm">
                  <span className="font-medium text-gray-600">Preferred Office:</span>
                  <p className="text-gray-900">{data.officeLocation || 'Not provided'}</p>
                </div>
              </div>

              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start space-x-3">
                  <Info className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-yellow-800">Important Notice</h3>
                    <p className="text-sm text-yellow-700 mt-1">
                      Please review all information carefully before submitting. Once submitted, you cannot modify your KYC details.
                    </p>
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
        message="Your Individual KYC form has been submitted successfully. You will receive a confirmation email shortly."
        formType="Individual KYC"
      />
    </div>
  );
};

export default IndividualKYC;
