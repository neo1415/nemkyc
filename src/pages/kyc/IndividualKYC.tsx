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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Calendar as ReactCalendar } from '@/components/ui/calendar';
import { CalendarIcon, Check, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import MultiStepForm from '@/components/common/MultiStepForm';
import { useFormDraft } from '@/hooks/useFormDraft';
import FileUpload from '@/components/common/FileUpload';
import { uploadFile } from '@/services/fileService';
import { useAuthRequiredSubmit } from '@/hooks/useAuthRequiredSubmit';
import SuccessModal from '@/components/common/SuccessModal';

// Form validation schema
const individualKYCSchema = yup.object().shape({
  officeLocation: yup.string().required("Office location is required"),
  title: yup.string().required("Title is required"),
  firstName: yup.string().required("First name is required"),
  middleName: yup.string().required("Middle name is required"),
  lastName: yup.string().required("Last name is required"),
  contactAddress: yup.string().required("Contact address is required"),
  occupation: yup.string().required("Occupation is required"),
  gender: yup.string().required("Gender is required"),
  dateOfBirth: yup.date().typeError("Please enter a valid date").required("Date of birth is required"),
  mothersMaidenName: yup.string().required("Mother's maiden name is required"),
  city: yup.string().required("City is required"),
  state: yup.string().required("State is required"),
  country: yup.string().required("Country is required"),
  nationality: yup.string().required("Nationality is required"),
  residentialAddress: yup.string().required("Residential address is required"),
  GSMNo: yup.string().required("Mobile number is required"),
  email: yup.string().email("Please enter a valid email address").required("Email is required"),
  BVN: yup.string().min(11, "BVN must be 11 digits").max(11, "BVN must be 11 digits").required("BVN is required"),
  identificationType: yup.string().required("ID type is required"),
  idNumber: yup.string().required("Identification number is required"),
  issuingCountry: yup.string().required("Issuing country is required"),
  issuedDate: yup.date().typeError("Please enter a valid date").required("Issue date is required"),
  expiryDate: yup.date().nullable().typeError("Please enter a valid date"),
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
  localBankName: yup.string().required("Bank name is required"),
  localAccountNumber: yup.string().required("Account number is required"),
  localBankBranch: yup.string().required("Bank branch is required"),
  localAccountOpeningDate: yup.date().typeError("Please enter a valid date").required("Account opening date is required"),
  foreignBankName: yup.string().nullable(),
  foreignAccountNumber: yup.string().nullable(),
  foreignBankBranch: yup.string().nullable(),
  foreignAccountOpeningDate: yup.date().nullable().typeError("Please enter a valid date").transform((value, originalValue) => {
    // Handle empty string case for optional date field
    if (originalValue === '' || originalValue === null || originalValue === undefined) {
      return null;
    }
    return value;
  }),
  // File validation
  identificationFile: yup.mixed().required("Identification document is required").test(
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
  GSMNo: '',
  email: '',
  taxIDNo: '',
  BVN: '',
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
  localBankName: '',
  localAccountNumber: '',
  localBankBranch: '',
  localAccountOpeningDate: '',
  foreignBankName: '',
  foreignAccountNumber: '',
  foreignBankBranch: '',
  foreignAccountOpeningDate: '',
  identificationFile: null,
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

const FormDatePicker = ({ name, label, required = false }: any) => {
  const { setValue, watch, formState: { errors }, register, clearErrors } = useFormContext();
  const value = watch(name);
  const error = errors[name];
  
  return (
    <div className="space-y-2">
      <Label>
        {label}
        {required && <span className="required-asterisk">*</span>}
      </Label>
      <div className="flex gap-2">
        <Input
          type="date"
          {...register(name, {
            onChange: () => {
              if (error) {
                clearErrors(name);
              }
            }
          })}
          className={cn("flex-1", error && "border-destructive")}
        />
        <Popover>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className={cn(error && "border-destructive")}
            >
              <CalendarIcon className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <ReactCalendar
              mode="single"
              selected={value ? new Date(value) : undefined}
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
      </div>
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
  const [showSummary, setShowSummary] = useState(false);
  const [showPostAuthLoading, setShowPostAuthLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File>>({});
  const { 
    handleSubmitWithAuth, 
    showSuccess: authShowSuccess, 
    setShowSuccess: setAuthShowSuccess,
    isSubmitting: authSubmitting
  } = useAuthRequiredSubmit();

  const formMethods = useForm<any>({
    resolver: yupResolver(individualKYCSchema),
    defaultValues,
    mode: 'onChange'
  });

  const { saveDraft, clearDraft } = useFormDraft('individualKYC', formMethods);

  // Check for pending submission when component mounts
  useEffect(() => {
    const checkPendingSubmission = () => {
      const hasPending = sessionStorage.getItem('pendingSubmission');
      if (hasPending) {
        setShowPostAuthLoading(true);
        setTimeout(() => setShowPostAuthLoading(false), 5000);
      }
    };
    checkPendingSubmission();
  }, []);

  // Hide post-auth loading when success modal shows
  useEffect(() => {
    if (authShowSuccess) {
      setShowPostAuthLoading(false);
    }
  }, [authShowSuccess]);

  // Auto-save draft
  useEffect(() => {
    const subscription = formMethods.watch((data) => {
      saveDraft(data);
    });
    return () => subscription.unsubscribe();
  }, [formMethods, saveDraft]);

  const handleSubmit = async (data: any) => {
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

    await handleSubmitWithAuth(finalData, 'Individual KYC');
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
        <FormProvider {...formMethods}>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField name="officeLocation" label="Office Location" required />
              <FormField name="title" label="Title" required />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField name="firstName" label="First Name" required />
              <FormField name="middleName" label="Middle Name" required />
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
              <FormDatePicker name="dateOfBirth" label="Date of Birth" required />
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
              <FormField name="GSMNo" label="Mobile Number" required />
              <FormField name="email" label="Email" type="email" required />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField name="taxIDNo" label="Tax Identification Number" />
              <FormField name="BVN" label="BVN" required maxLength={11} />
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
              <FormDatePicker name="issuedDate" label="Issued Date" required />
              <FormDatePicker name="expiryDate" label="Expiry Date" />
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
                <FormField name="localBankName" label="Bank Name" required />
                <FormField name="localAccountNumber" label="Account Number" required />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField name="localBankBranch" label="Bank Branch" required />
                <FormDatePicker name="localAccountOpeningDate" label="Account Opening Date" required />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Foreign Account Details (Optional)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField name="foreignBankName" label="Bank Name" />
                <FormField name="foreignAccountNumber" label="Account Number" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField name="foreignBankBranch" label="Bank Branch" />
                <FormDatePicker name="foreignAccountOpeningDate" label="Account Opening Date" />
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
                  formMethods.setValue('identificationFile', file);
                  formMethods.trigger('identificationFile');
                }}
                onFileRemove={() => {
                  setUploadedFiles(prev => ({
                    ...prev,
                    identification: null
                  }));
                  formMethods.setValue('identificationFile', null);
                  formMethods.trigger('identificationFile');
                }}
                currentFile={uploadedFiles.identification}
                maxSize={3}
                error={formMethods.formState.errors.identificationFile?.message?.toString()}
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
    0: ['officeLocation', 'title', 'firstName', 'middleName', 'lastName', 'contactAddress', 'occupation', 'gender', 'dateOfBirth', 'mothersMaidenName', 'city', 'state', 'country', 'nationality', 'residentialAddress', 'GSMNo', 'email', 'BVN', 'identificationType', 'idNumber', 'issuingCountry', 'issuedDate', 'sourceOfIncome', 'sourceOfIncomeOther', 'annualIncomeRange', 'premiumPaymentSource', 'premiumPaymentSourceOther'],
    1: ['localBankName', 'localAccountNumber', 'localBankBranch', 'localAccountOpeningDate'],
    2: ['identificationFile'], // File upload validation
    3: ['agreeToDataPrivacy', 'signature']
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Post-auth loading overlay */}
      {showPostAuthLoading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 flex flex-col items-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-lg font-semibold">Completing your submission...</p>
            <p className="text-sm text-muted-foreground">Please wait while we process your KYC form.</p>
          </div>
        </div>
      )}

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

      {/* Summary Dialog */}
      <Dialog open={showSummary} onOpenChange={setShowSummary}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Individual KYC Form Summary</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><strong>Name:</strong> {formMethods.watch('firstName')} {formMethods.watch('lastName')}</div>
              <div><strong>Email:</strong> {formMethods.watch('email')}</div>
              <div><strong>Phone:</strong> {formMethods.watch('mobileNumber')}</div>
              <div><strong>BVN:</strong> {formMethods.watch('bvn')}</div>
              <div><strong>Occupation:</strong> {formMethods.watch('occupation')}</div>
              <div><strong>Nationality:</strong> {formMethods.watch('nationality')}</div>
            </div>
            <div>
              <strong>Contact Address:</strong>
              <p className="text-sm mt-1">{formMethods.watch('contactAddress')}</p>
            </div>
            <div>
              <strong>Residential Address:</strong>
              <p className="text-sm mt-1">{formMethods.watch('residentialAddress')}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSummary(false)}>
              Edit Form
            </Button>
            <Button 
              onClick={() => handleSubmit(formMethods.getValues())}
              disabled={authSubmitting}
            >
              {authSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit KYC Form'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SuccessModal
        isOpen={authShowSuccess}
        onClose={() => setAuthShowSuccess()}
        title="KYC Form Submitted Successfully!"
        message="Your Individual KYC form has been submitted successfully. You will receive a confirmation email shortly."
        formType="Individual KYC"
      />
    </div>
  );
};

export default IndividualKYC;
