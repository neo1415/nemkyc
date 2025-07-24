import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
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
import { FormField, PhoneField, NumericField, FormTextarea, FormSelect, DateField } from '@/components/form/FormFieldControllers';

import { subYears } from 'date-fns';

// Form validation schema
const individualKYCSchema = yup.object().shape({
  officeLocation: yup.string().min(2, "Minimum 2 characters").max(100, "Maximum 100 characters").required("Office location is required"),
  title: yup.string().min(2, "Minimum 2 characters").max(100, "Maximum 100 characters").required("Title is required"),
  firstName: yup.string().min(2, "Minimum 2 characters").max(100, "Maximum 100 characters").required("First name is required"),
  middleName: yup.string().min(2, "Minimum 2 characters").max(100, "Maximum 100 characters").required("Middle name is required"),
  lastName: yup.string().min(2, "Minimum 2 characters").max(100, "Maximum 100 characters").required("Last name is required"),
  contactAddress: yup.string().min(3, "Minimum 3 characters").max(2500, "Maximum 2500 characters").required("Contact address is required"),
  occupation: yup.string().min(2, "Minimum 2 characters").max(100, "Maximum 100 characters").required("Occupation is required"),
  gender: yup.string().required("Gender is required"),
  dateOfBirth: yup.date().max(subYears(new Date(), 18), "Must be at least 18 years old").required("Date of birth is required"),
  mothersMaidenName: yup.string().min(2, "Minimum 2 characters").max(100, "Maximum 100 characters").required("Mother's maiden name is required"),
  employersName: yup.string().nullable().transform((value) => value || null),
  employersTelephoneNumber: yup.string().nullable().transform((value) => value || null).when('employersName', {
    is: (value: string | null) => value && value.length > 0,
    then: (schema) => schema.matches(/^[\d\+\-\(\)\s]+$/, "Invalid phone number format").max(15, "Maximum 15 characters"),
    otherwise: (schema) => schema.nullable()
  }),
  employersAddress: yup.string().nullable().transform((value) => value || null).when('employersName', {
    is: (value: string | null) => value && value.length > 0,
    then: (schema) => schema.min(3, "Minimum 3 characters").max(2500, "Maximum 2500 characters"),
    otherwise: (schema) => schema.nullable()
  }),
  city: yup.string().min(2, "Minimum 2 characters").max(100, "Maximum 100 characters").required("City is required"),
  state: yup.string().min(2, "Minimum 2 characters").max(100, "Maximum 100 characters").required("State is required"),
  country: yup.string().min(2, "Minimum 2 characters").max(100, "Maximum 100 characters").required("Country is required"),
  nationality: yup.string().required("Nationality is required"),
  residentialAddress: yup.string().min(3, "Minimum 3 characters").max(2500, "Maximum 2500 characters").required("Residential address is required"),
  GSMNo: yup.string().matches(/^[\d\+\-\(\)\s]+$/, "Invalid phone number format").max(15, "Maximum 15 characters").required("Mobile number is required"),
  email: yup.string().email("Valid email is required").max(100, "Maximum 100 characters").required("Email is required"),
  taxIDNo: yup.string().nullable().transform((value) => value || null),
  BVN: yup.string().matches(/^\d{11}$/, "BVN must be exactly 11 digits").required("BVN is required"),
  identificationType: yup.string().required("ID type is required"),
  idNumber: yup.string().min(2, "Minimum 2 characters").max(100, "Maximum 100 characters").required("Identification number is required"),
  issuingCountry: yup.string().min(2, "Minimum 2 characters").max(100, "Maximum 100 characters").required("Issuing country is required"),
  issuedDate: yup.date().max(new Date(), "Date must be in the past").required("Issued date is required"),
  expiryDate: yup.date().nullable().transform((value) => value || null).when('identificationType', {
    is: (value: string) => value && value !== 'NIN',
    then: (schema) => schema.min(new Date(), "Expiry date must be in the future"),
    otherwise: (schema) => schema.nullable()
  }),
  sourceOfIncome: yup.string().required("Income source is required"),
  sourceOfIncomeOther: yup.string().when('sourceOfIncome', {
    is: 'Other',
    then: (schema) => schema.min(2, "Minimum 2 characters").max(100, "Maximum 100 characters").required("Please specify other income source"),
    otherwise: (schema) => schema.notRequired()
  }),
  annualIncomeRange: yup.string().required("Annual income range is required"),
  premiumPaymentSource: yup.string().required("Premium payment source is required"),
  premiumPaymentSourceOther: yup.string().when('premiumPaymentSource', {
    is: 'Other',
    then: (schema) => schema.min(2, "Minimum 2 characters").max(100, "Maximum 100 characters").required("Please specify other payment source"),
    otherwise: (schema) => schema.notRequired()
  }),
  localBankName: yup.string().min(2, "Minimum 2 characters").max(100, "Maximum 100 characters").required("Bank name is required"),
  localAccountNumber: yup.string().matches(/^\d{1,10}$/, "Account number must be 1-10 digits only").required("Account number is required"),
  localBankBranch: yup.string().min(2, "Minimum 2 characters").max(100, "Maximum 100 characters").required("Bank branch is required"),
  localAccountOpeningDate: yup.date().max(new Date(), "Date must be in the past").required("Account opening date is required"),
  foreignBankName: yup.string().nullable().transform((value) => value || null),
  foreignAccountNumber: yup.string().nullable().transform((value) => value || null).when('foreignBankName', {
    is: (value: string | null) => value && value.length > 0,
    then: (schema) => schema.matches(/^\d{1,10}$/, "Account number must be 1-10 digits only"),
    otherwise: (schema) => schema.nullable()
  }),
  foreignBankBranch: yup.string().nullable().transform((value) => value || null).when('foreignBankName', {
    is: (value: string | null) => value && value.length > 0,
    then: (schema) => schema.min(2, "Minimum 2 characters").max(100, "Maximum 100 characters"),
    otherwise: (schema) => schema.nullable()
  }),
  foreignAccountOpeningDate: yup.date().nullable().transform((value) => value || null).when('foreignBankName', {
    is: (value: string | null) => value && value.length > 0,
    then: (schema) => schema.max(new Date(), "Date must be in the past"),
    otherwise: (schema) => schema.nullable()
  }),
  agreeToDataPrivacy: yup.boolean().oneOf([true], "You must agree to data privacy"),
  signature: yup.string().min(2, "Minimum 2 characters").required("Signature is required"),
  identification: yup.mixed().required("Identification document is required")
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
  agreeToDataPrivacy: false,
  signature: ''
};

const IndividualKYC: React.FC = () => {
  const { toast } = useToast();
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

  // Step validation function
  const validateCurrentStep = async (stepId: string): Promise<boolean> => {
    const stepFields = getStepFields(stepId);
    const result = await formMethods.trigger(stepFields);
    return result;
  };

  // Get fields for each step
  const getStepFields = (stepId: string): string[] => {
    switch (stepId) {
      case 'personal':
        return ['officeLocation', 'title', 'firstName', 'middleName', 'lastName', 'contactAddress', 
                'occupation', 'gender', 'dateOfBirth', 'mothersMaidenName', 'city', 'state', 'country', 
                'nationality', 'residentialAddress', 'GSMNo', 'email', 'BVN', 
                'identificationType', 'idNumber', 'issuingCountry', 'issuedDate', 'expiryDate', 
                'sourceOfIncome', 'sourceOfIncomeOther', 'annualIncomeRange', 'premiumPaymentSource', 
                'premiumPaymentSourceOther'];
      case 'accounts':
        return ['localBankName', 'localAccountNumber', 'localBankBranch', 'localAccountOpeningDate'];
      case 'upload':
        return ['identification'];
      case 'declaration':
        return ['agreeToDataPrivacy', 'signature'];
      default:
        return [];
    }
  };

  // Enhanced form methods with validation
  const enhancedFormMethods = {
    ...formMethods,
    validateCurrentStep
  };

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
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField 
              name="officeLocation" 
              label="Office Location" 
              required 
              placeholder="Enter office location"
            />
            <FormField 
              name="title" 
              label="Title" 
              required 
              placeholder="Enter title"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField 
              name="firstName" 
              label="First Name" 
              required 
              placeholder="Enter first name"
            />
            <FormField 
              name="middleName" 
              label="Middle Name" 
              required 
              placeholder="Enter middle name"
            />
            <FormField 
              name="lastName" 
              label="Last Name" 
              required 
              placeholder="Enter last name"
            />
          </div>

          <FormTextarea
            name="contactAddress"
            label="Contact Address"
            required
            placeholder="Enter contact address"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField 
              name="occupation" 
              label="Occupation" 
              required 
              placeholder="Enter occupation"
            />
            <FormSelect
              name="gender"
              label="Gender"
              required
              placeholder="Select Gender"
              options={[
                { value: "Male", label: "Male" },
                { value: "Female", label: "Female" }
              ]}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DateField
              name="dateOfBirth"
              label="Date of Birth"
              required
              minAge={18}
            />
            <FormField 
              name="mothersMaidenName" 
              label="Mother's Maiden Name" 
              required 
              placeholder="Enter mother's maiden name"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField 
              name="employersName" 
              label="Employer's Name" 
              placeholder="Enter employer's name (optional)"
            />
            <PhoneField 
              name="employersTelephoneNumber" 
              label="Employer's Telephone" 
              placeholder="Enter employer's phone number"
            />
          </div>

          <FormTextarea
            name="employersAddress"
            label="Employer's Address"
            placeholder="Enter employer's address (optional)"
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField 
              name="city" 
              label="City" 
              required 
              placeholder="Enter city"
            />
            <FormField 
              name="state" 
              label="State" 
              required 
              placeholder="Enter state"
            />
            <FormField 
              name="country" 
              label="Country" 
              required 
              placeholder="Enter country"
            />
          </div>

          <FormSelect
            name="nationality"
            label="Nationality"
            required
            placeholder="Select Nationality"
            options={[
              { value: "Nigerian", label: "Nigerian" },
              { value: "Foreign", label: "Foreign" },
              { value: "Both", label: "Both" }
            ]}
          />

          <FormTextarea
            name="residentialAddress"
            label="Residential Address"
            required
            placeholder="Enter residential address"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <PhoneField 
              name="GSMNo" 
              label="Mobile Number" 
              required 
              placeholder="Enter mobile number"
            />
            <FormField 
              name="email" 
              label="Email" 
              required 
              type="email"
              placeholder="Enter email address"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField 
              name="taxIDNo" 
              label="Tax Identification Number" 
              placeholder="Enter tax ID (optional)"
            />
            <NumericField 
              name="BVN" 
              label="BVN" 
              required 
              maxLength={11}
              placeholder="Enter 11-digit BVN"
            />
          </div>

          <FormSelect
            name="identificationType"
            label="ID Type"
            required
            placeholder="Choose ID Type"
            options={[
              { value: "International Passport", label: "International Passport" },
              { value: "NIMC", label: "NIMC" },
              { value: "Drivers Licence", label: "Drivers Licence" },
              { value: "Voters Card", label: "Voters Card" },
              { value: "NIN", label: "NIN" }
            ]}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField 
              name="idNumber" 
              label="Identification Number" 
              required 
              placeholder="Enter identification number"
            />
            <FormField 
              name="issuingCountry" 
              label="Issuing Country" 
              required 
              placeholder="Enter issuing country"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DateField
              name="issuedDate"
              label="Issued Date"
              required
              disableFuture
            />
            <DateField
              name="expiryDate"
              label="Expiry Date"
              disablePast
            />
          </div>

          <FormSelect
            name="sourceOfIncome"
            label="Source of Income"
            required
            placeholder="Choose Income Source"
            options={[
              { value: "Salary or Business Income", label: "Salary or Business Income" },
              { value: "Investments or Dividends", label: "Investments or Dividends" },
              { value: "Other", label: "Other (please specify)" }
            ]}
          />

          {formMethods.watch('sourceOfIncome') === 'Other' && (
            <FormField 
              name="sourceOfIncomeOther" 
              label="Please specify other income source" 
              required 
              placeholder="Specify other income source"
            />
          )}

          <FormSelect
            name="annualIncomeRange"
            label="Annual Income Range"
            required
            placeholder="Annual Income Range"
            options={[
              { value: "Less Than 1 Million", label: "Less Than 1 Million" },
              { value: "1 Million - 4 Million", label: "1 Million - 4 Million" },
              { value: "4.1 Million - 10 Million", label: "4.1 Million - 10 Million" },
              { value: "More Than 10 Million", label: "More Than 10 Million" }
            ]}
          />

          <FormSelect
            name="premiumPaymentSource"
            label="Premium Payment Source"
            required
            placeholder="Choose Payment Source"
            options={[
              { value: "Salary or Business Income", label: "Salary or Business Income" },
              { value: "Investments or Dividends", label: "Investments or Dividends" },
              { value: "Other", label: "Other (please specify)" }
            ]}
          />

          {formMethods.watch('premiumPaymentSource') === 'Other' && (
            <FormField 
              name="premiumPaymentSourceOther" 
              label="Please specify other payment source" 
              required 
              placeholder="Specify other payment source"
            />
          )}
        </div>
      )
    },
    {
      id: 'accounts',
      title: 'Account Details',
      component: (
        <div className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Local Account Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField 
                name="localBankName" 
                label="Bank Name" 
                required 
                placeholder="Enter bank name"
              />
              <NumericField 
                name="localAccountNumber" 
                label="Account Number" 
                required 
                maxLength={10}
                placeholder="Enter 10-digit account number"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField 
                name="localBankBranch" 
                label="Bank Branch" 
                required 
                placeholder="Enter bank branch"
              />
              <DateField
                name="localAccountOpeningDate"
                label="Account Opening Date"
                required
                disableFuture
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Foreign Account Details (Optional)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField 
                name="foreignBankName" 
                label="Bank Name" 
                placeholder="Enter foreign bank name (optional)"
              />
              <NumericField 
                name="foreignAccountNumber" 
                label="Account Number" 
                maxLength={10}
                placeholder="Enter account number (optional)"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField 
                name="foreignBankBranch" 
                label="Bank Branch" 
                placeholder="Enter bank branch (optional)"
              />
              <DateField
                name="foreignAccountOpeningDate"
                label="Account Opening Date"
                disableFuture
              />
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'upload',
      title: 'Upload Documents',
      component: (
        <div className="space-y-4">
          <div>
            <Label>Upload Means of Identification <span className="text-red-500">*</span></Label>
            <FileUpload
              accept=".jpg,.jpeg,.png,.pdf"
              onFileSelect={(file) => {
                setUploadedFiles(prev => ({
                  ...prev,
                  identification: file
                }));
                formMethods.setValue('identification', file);
                formMethods.clearErrors('identification');
              }}
              maxSize={3}
            />
            {uploadedFiles.identification && (
              <div className="flex items-center gap-2 mt-2 text-sm text-green-600">
                <Check className="h-4 w-4" />
                {uploadedFiles.identification.name}
              </div>
            )}
            {formMethods.formState.errors.identification && (
              <p className="text-sm text-red-500 mt-1">
                {formMethods.formState.errors.identification.message as string}
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
                  onCheckedChange={(checked) => formMethods.setValue('agreeToDataPrivacy', checked)}
                />
                <Label htmlFor="agreeToDataPrivacy" className="text-sm">
                  I agree to the data privacy policy and declaration above <span className="text-red-500">*</span>
                </Label>
              </div>
              {formMethods.formState.errors.agreeToDataPrivacy && (
                <p className="text-sm text-red-500">
                  {formMethods.formState.errors.agreeToDataPrivacy.message as string}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="signature">Digital Signature <span className="text-red-500">*</span></Label>
              <Textarea
                id="signature"
                placeholder="Type your full name as digital signature"
                {...formMethods.register('signature')}
                className={formMethods.formState.errors.signature ? "border-red-500" : ""}
              />
              {formMethods.formState.errors.signature && (
                <p className="text-sm text-red-500">
                  {formMethods.formState.errors.signature.message as string}
                </p>
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
      )
    }
  ];

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
            formMethods={enhancedFormMethods}
            submitButtonText="Submit KYC Form"
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
