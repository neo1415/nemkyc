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
  employersName: yup.string().when('employersName', {
    is: (value: string) => value && value.length > 0,
    then: (schema) => schema.min(2, "Minimum 2 characters").max(100, "Maximum 100 characters"),
    otherwise: (schema) => schema
  }),
  employersTelephoneNumber: yup.string().when('employersTelephoneNumber', {
    is: (value: string) => value && value.length > 0,
    then: (schema) => schema.matches(/^[\d\+\-\(\)\s]+$/, "Invalid phone number format").max(15, "Maximum 15 characters"),
    otherwise: (schema) => schema
  }),
  employersAddress: yup.string().when('employersAddress', {
    is: (value: string) => value && value.length > 0,
    then: (schema) => schema.min(3, "Minimum 3 characters").max(2500, "Maximum 2500 characters"),
    otherwise: (schema) => schema
  }),
  city: yup.string().min(2, "Minimum 2 characters").max(100, "Maximum 100 characters").required("City is required"),
  state: yup.string().min(2, "Minimum 2 characters").max(100, "Maximum 100 characters").required("State is required"),
  country: yup.string().min(2, "Minimum 2 characters").max(100, "Maximum 100 characters").required("Country is required"),
  nationality: yup.string().required("Nationality is required"),
  residentialAddress: yup.string().min(3, "Minimum 3 characters").max(2500, "Maximum 2500 characters").required("Residential address is required"),
  GSMNo: yup.string().matches(/^[\d\+\-\(\)\s]+$/, "Invalid phone number format").max(15, "Maximum 15 characters").required("Mobile number is required"),
  email: yup.string().email("Valid email is required").max(100, "Maximum 100 characters").required("Email is required"),
  taxIDNo: yup.string().when('taxIDNo', {
    is: (value: string) => value && value.length > 0,
    then: (schema) => schema.min(2, "Minimum 2 characters").max(100, "Maximum 100 characters"),
    otherwise: (schema) => schema
  }),
  BVN: yup.string().matches(/^\d{11}$/, "BVN must be exactly 11 digits").required("BVN is required"),
  identificationType: yup.string().required("ID type is required"),
  idNumber: yup.string().min(2, "Minimum 2 characters").max(100, "Maximum 100 characters").required("Identification number is required"),
  issuingCountry: yup.string().min(2, "Minimum 2 characters").max(100, "Maximum 100 characters").required("Issuing country is required"),
  issuedDate: yup.date().max(new Date(), "Date must be in the past").required("Issued date is required"),
  expiryDate: yup.date().when('expiryDate', {
    is: (value: Date) => value,
    then: (schema) => schema.min(new Date(), "Expiry date must be in the future"),
    otherwise: (schema) => schema
  }),
  sourceOfIncome: yup.string().required("Income source is required"),
  sourceOfIncomeOther: yup.string().when('sourceOfIncome', {
    is: 'Other',
    then: (schema) => schema.min(2, "Minimum 2 characters").max(100, "Maximum 100 characters").required("Please specify other income source"),
    otherwise: (schema) => schema
  }),
  annualIncomeRange: yup.string().required("Annual income range is required"),
  premiumPaymentSource: yup.string().required("Premium payment source is required"),
  premiumPaymentSourceOther: yup.string().when('premiumPaymentSource', {
    is: 'Other',
    then: (schema) => schema.min(2, "Minimum 2 characters").max(100, "Maximum 100 characters").required("Please specify other payment source"),
    otherwise: (schema) => schema
  }),
  localBankName: yup.string().min(2, "Minimum 2 characters").max(100, "Maximum 100 characters").required("Bank name is required"),
  localAccountNumber: yup.string().matches(/^\d{1,10}$/, "Account number must be 1-10 digits only").required("Account number is required"),
  localBankBranch: yup.string().min(2, "Minimum 2 characters").max(100, "Maximum 100 characters").required("Bank branch is required"),
  localAccountOpeningDate: yup.date().max(new Date(), "Date must be in the past").required("Account opening date is required"),
  foreignBankName: yup.string().when('foreignBankName', {
    is: (value: string) => value && value.length > 0,
    then: (schema) => schema.min(2, "Minimum 2 characters").max(100, "Maximum 100 characters"),
    otherwise: (schema) => schema
  }),
  foreignAccountNumber: yup.string().when('foreignAccountNumber', {
    is: (value: string) => value && value.length > 0,
    then: (schema) => schema.matches(/^\d{1,10}$/, "Account number must be 1-10 digits only"),
    otherwise: (schema) => schema
  }),
  foreignBankBranch: yup.string().when('foreignBankBranch', {
    is: (value: string) => value && value.length > 0,
    then: (schema) => schema.min(2, "Minimum 2 characters").max(100, "Maximum 100 characters"),
    otherwise: (schema) => schema
  }),
  foreignAccountOpeningDate: yup.date().when('foreignAccountOpeningDate', {
    is: (value: Date) => value,
    then: (schema) => schema.max(new Date(), "Date must be in the past"),
    otherwise: (schema) => schema
  }),
  agreeToDataPrivacy: yup.boolean().oneOf([true], "You must agree to data privacy"),
  signature: yup.string().min(2, "Minimum 2 characters").required("Signature is required")
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
                'occupation', 'gender', 'dateOfBirth', 'mothersMaidenName', 'employersName', 
                'employersTelephoneNumber', 'employersAddress', 'city', 'state', 'country', 
                'nationality', 'residentialAddress', 'GSMNo', 'email', 'taxIDNo', 'BVN', 
                'identificationType', 'idNumber', 'issuingCountry', 'issuedDate', 'expiryDate', 
                'sourceOfIncome', 'sourceOfIncomeOther', 'annualIncomeRange', 'premiumPaymentSource', 
                'premiumPaymentSourceOther'];
      case 'accounts':
        return ['localBankName', 'localAccountNumber', 'localBankBranch', 'localAccountOpeningDate',
                'foreignBankName', 'foreignAccountNumber', 'foreignBankBranch', 'foreignAccountOpeningDate'];
      case 'upload':
        return [];
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
            <div>
              <Label htmlFor="officeLocation">Office Location *</Label>
              <Input
                id="officeLocation"
                {...formMethods.register('officeLocation')}
              />
            </div>
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                {...formMethods.register('title')}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                {...formMethods.register('firstName')}
              />
            </div>
            <div>
              <Label htmlFor="middleName">Middle Name *</Label>
              <Input
                id="middleName"
                {...formMethods.register('middleName')}
              />
            </div>
            <div>
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                {...formMethods.register('lastName')}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="contactAddress">Contact Address *</Label>
            <Textarea
              id="contactAddress"
              {...formMethods.register('contactAddress')}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="occupation">Occupation *</Label>
              <Input
                id="occupation"
                {...formMethods.register('occupation')}
              />
            </div>
            <div>
              <Label>Gender *</Label>
              <Select
                value={formMethods.watch('gender')}
                onValueChange={(value) => formMethods.setValue('gender', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DatePickerField
              name="dateOfBirth"
              label="Date of Birth *"
            />
            <div>
              <Label htmlFor="mothersMaidenName">Mother's Maiden Name *</Label>
              <Input
                id="mothersMaidenName"
                {...formMethods.register('mothersMaidenName')}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="employersName">Employer's Name</Label>
              <Input
                id="employersName"
                {...formMethods.register('employersName')}
              />
            </div>
            <div>
              <Label htmlFor="employersTelephoneNumber">Employer's Telephone</Label>
              <Input
                id="employersTelephoneNumber"
                {...formMethods.register('employersTelephoneNumber')}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="employersAddress">Employer's Address</Label>
            <Textarea
              id="employersAddress"
              {...formMethods.register('employersAddress')}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="city">City *</Label>
              <Input
                id="city"
                {...formMethods.register('city')}
              />
            </div>
            <div>
              <Label htmlFor="state">State *</Label>
              <Input
                id="state"
                {...formMethods.register('state')}
              />
            </div>
            <div>
              <Label htmlFor="country">Country *</Label>
              <Input
                id="country"
                {...formMethods.register('country')}
              />
            </div>
          </div>

          <div>
            <Label>Nationality *</Label>
            <Select
              value={formMethods.watch('nationality')}
              onValueChange={(value) => formMethods.setValue('nationality', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Nationality" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Nigerian">Nigerian</SelectItem>
                <SelectItem value="Foreign">Foreign</SelectItem>
                <SelectItem value="Both">Both</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="residentialAddress">Residential Address *</Label>
            <Textarea
              id="residentialAddress"
              {...formMethods.register('residentialAddress')}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="GSMNo">Mobile Number *</Label>
              <Input
                id="GSMNo"
                {...formMethods.register('GSMNo')}
              />
            </div>
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                {...formMethods.register('email')}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="taxIDNo">Tax Identification Number</Label>
              <Input
                id="taxIDNo"
                {...formMethods.register('taxIDNo')}
              />
            </div>
            <div>
              <Label htmlFor="BVN">BVN *</Label>
              <Input
                id="BVN"
                maxLength={11}
                {...formMethods.register('BVN')}
              />
            </div>
          </div>

          <div>
            <Label>ID Type *</Label>
            <Select
              value={formMethods.watch('identificationType')}
              onValueChange={(value) => formMethods.setValue('identificationType', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose ID Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="International Passport">International Passport</SelectItem>
                <SelectItem value="NIMC">NIMC</SelectItem>
                <SelectItem value="Drivers Licence">Drivers Licence</SelectItem>
                <SelectItem value="Voters Card">Voters Card</SelectItem>
                <SelectItem value="NIN">NIN</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="idNumber">Identification Number *</Label>
              <Input
                id="idNumber"
                {...formMethods.register('idNumber')}
              />
            </div>
            <div>
              <Label htmlFor="issuingCountry">Issuing Country *</Label>
              <Input
                id="issuingCountry"
                {...formMethods.register('issuingCountry')}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DatePickerField
              name="issuedDate"
              label="Issued Date *"
            />
            <DatePickerField
              name="expiryDate"
              label="Expiry Date"
            />
          </div>

          <div>
            <Label>Source of Income *</Label>
            <Select
              value={formMethods.watch('sourceOfIncome')}
              onValueChange={(value) => formMethods.setValue('sourceOfIncome', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose Income Source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Salary or Business Income">Salary or Business Income</SelectItem>
                <SelectItem value="Investments or Dividends">Investments or Dividends</SelectItem>
                <SelectItem value="Other">Other (please specify)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formMethods.watch('sourceOfIncome') === 'Other' && (
            <div>
              <Label htmlFor="sourceOfIncomeOther">Please specify other income source *</Label>
              <Input
                id="sourceOfIncomeOther"
                {...formMethods.register('sourceOfIncomeOther')}
              />
            </div>
          )}

          <div>
            <Label>Annual Income Range *</Label>
            <Select
              value={formMethods.watch('annualIncomeRange')}
              onValueChange={(value) => formMethods.setValue('annualIncomeRange', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Annual Income Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Less Than 1 Million">Less Than 1 Million</SelectItem>
                <SelectItem value="1 Million - 4 Million">1 Million - 4 Million</SelectItem>
                <SelectItem value="4.1 Million - 10 Million">4.1 Million - 10 Million</SelectItem>
                <SelectItem value="More Than 10 Million">More Than 10 Million</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Premium Payment Source *</Label>
            <Select
              value={formMethods.watch('premiumPaymentSource')}
              onValueChange={(value) => formMethods.setValue('premiumPaymentSource', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose Income Source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Salary or Business Income">Salary or Business Income</SelectItem>
                <SelectItem value="Investments or Dividends">Investments or Dividends</SelectItem>
                <SelectItem value="Other">Other (please specify)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formMethods.watch('premiumPaymentSource') === 'Other' && (
            <div>
              <Label htmlFor="premiumPaymentSourceOther">Please specify other payment source *</Label>
              <Input
                id="premiumPaymentSourceOther"
                {...formMethods.register('premiumPaymentSourceOther')}
              />
            </div>
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
              <div>
                <Label htmlFor="localBankName">Bank Name *</Label>
                <Input
                  id="localBankName"
                  {...formMethods.register('localBankName')}
                />
              </div>
              <div>
                <Label htmlFor="localAccountNumber">Account Number *</Label>
                <Input
                  id="localAccountNumber"
                  {...formMethods.register('localAccountNumber')}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="localBankBranch">Bank Branch *</Label>
                <Input
                  id="localBankBranch"
                  {...formMethods.register('localBankBranch')}
                />
              </div>
              <DatePickerField
                name="localAccountOpeningDate"
                label="Account Opening Date *"
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Foreign Account Details (Optional)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="foreignBankName">Bank Name</Label>
                <Input
                  id="foreignBankName"
                  {...formMethods.register('foreignBankName')}
                />
              </div>
              <div>
                <Label htmlFor="foreignAccountNumber">Account Number</Label>
                <Input
                  id="foreignAccountNumber"
                  {...formMethods.register('foreignAccountNumber')}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="foreignBankBranch">Bank Branch</Label>
                <Input
                  id="foreignBankBranch"
                  {...formMethods.register('foreignBankBranch')}
                />
              </div>
              <DatePickerField
                name="foreignAccountOpeningDate"
                label="Account Opening Date"
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
            <Label>Upload Means of Identification *</Label>
            <FileUpload
              accept="image/*,.pdf"
              onFileSelect={(file) => {
                setUploadedFiles(prev => ({
                  ...prev,
                  identification: file
                }));
              }}
              maxSize={3}
            />
            {uploadedFiles.identification && (
              <div className="flex items-center gap-2 mt-2 text-sm text-green-600">
                <Check className="h-4 w-4" />
                {uploadedFiles.identification.name}
              </div>
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
            <div className="flex items-center space-x-2">
              <Checkbox
                id="agreeToDataPrivacy"
                checked={formMethods.watch('agreeToDataPrivacy')}
                onCheckedChange={(checked) => formMethods.setValue('agreeToDataPrivacy', checked)}
              />
              <Label htmlFor="agreeToDataPrivacy" className="text-sm">
                I agree to the data privacy policy and declaration above *
              </Label>
            </div>

            <div>
              <Label htmlFor="signature">Digital Signature *</Label>
              <Textarea
                id="signature"
                placeholder="Type your full name as digital signature"
                {...formMethods.register('signature')}
              />
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

          {formMethods.watch('agreeToDataPrivacy') && (
            <Button
              type="button"
              onClick={() => setShowSummary(true)}
              className="w-full"
            >
              Submit Individual KYC Form
            </Button>
          )}
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
