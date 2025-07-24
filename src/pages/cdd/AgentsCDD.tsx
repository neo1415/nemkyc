import React, { useState, useEffect } from 'react';
import { FormField, PhoneField, NumericField, FormTextarea, FormSelect, DateField } from '@/components/form/FormFieldControllers';
import { useForm, FormProvider } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar as ReactCalendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { format, subYears } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import MultiStepForm from '@/components/common/MultiStepForm';
import { useFormDraft } from '@/hooks/useFormDraft';
import FileUpload from '@/components/common/FileUpload';
import { uploadFile } from '@/services/fileService';
import { useAuthRequiredSubmit } from '@/hooks/useAuthRequiredSubmit';
import SuccessModal from '@/components/common/SuccessModal';
import LoadingSpinner from '@/components/common/LoadingSpinner';

const agentsCDDSchema = yup.object().shape({
  // Personal Info
  firstName: yup.string().min(2, "Minimum 2 characters").max(100, "Maximum 100 characters").required("First name is required"),
  middleName: yup.string().nullable().transform((value) => value || null),
  lastName: yup.string().min(2, "Minimum 2 characters").max(100, "Maximum 100 characters").required("Last name is required"),
  residentialAddress: yup.string().min(3, "Minimum 3 characters").max(2500, "Maximum 2500 characters").required("Residential address is required"),
  gender: yup.string().required("Gender is required"),
  position: yup.string().min(2, "Minimum 2 characters").max(100, "Maximum 100 characters").required("Position/Role is required"),
  dateOfBirth: yup.date().max(subYears(new Date(), 18), "Must be at least 18 years old").required("Date of birth is required"),
  placeOfBirth: yup.string().min(2, "Minimum 2 characters").max(100, "Maximum 100 characters").required("Place of birth is required"),
  otherSourceOfIncome: yup.string().required("Other source of income is required"),
  otherSourceOfIncomeOther: yup.string().when('otherSourceOfIncome', {
    is: 'other',
    then: (schema) => schema.min(2, "Minimum 2 characters").max(100, "Maximum 100 characters").required("Please specify other income source"),
    otherwise: (schema) => schema.notRequired()
  }),
  nationality: yup.string().min(2, "Minimum 2 characters").max(100, "Maximum 100 characters").required("Nationality is required"),
  phoneNumber: yup.string().matches(/^[\d\+\-\(\)\s]+$/, "Invalid phone number format").max(15, "Maximum 15 characters").required("Phone number is required"),
  bvn: yup.string().matches(/^\d{11}$/, "BVN must be exactly 11 digits").required("BVN is required"),
  taxIdNumber: yup.string().nullable().transform((value) => value || null),
  occupation: yup.string().min(2, "Minimum 2 characters").max(100, "Maximum 100 characters").required("Occupation is required"),
  email: yup.string().email("Valid email is required").max(100, "Maximum 100 characters").required("Email is required"),
  validMeansOfId: yup.string().required("Valid means of ID is required"),
  identificationNumber: yup.string().min(2, "Minimum 2 characters").max(100, "Maximum 100 characters").required("Identification number is required"),
  issuedDate: yup.date().max(new Date(), "Date must be in the past").required("Issued date is required"),
  expiryDate: yup.date().nullable().transform((value) => value || null).when('validMeansOfId', {
    is: (value: string) => value && value !== 'nimc',
    then: (schema) => schema.min(new Date(), "Expiry date must be in the future"),
    otherwise: (schema) => schema.nullable()
  }),
  issuingBody: yup.string().min(2, "Minimum 2 characters").max(100, "Maximum 100 characters").required("Issuing body is required"),
  
  // Additional Info
  agentName: yup.string().min(2, "Minimum 2 characters").max(100, "Maximum 100 characters").required("Agent name is required"),
  agentsOfficeAddress: yup.string().min(3, "Minimum 3 characters").max(2500, "Maximum 2500 characters").required("Agents office address is required"),
  naicomLicenseNumber: yup.string().min(2, "Minimum 2 characters").max(100, "Maximum 100 characters").required("NAICOM license number is required"),
  licenseIssuedDate: yup.date().max(new Date(), "Date must be in the past").required("License issued date is required"),
  licenseExpiryDate: yup.date().min(new Date(), "Expiry date must be in the future").required("License expiry date is required"),
  emailAddress: yup.string().email("Valid email is required").max(100, "Maximum 100 characters").required("Email address is required"),
  website: yup.string().url("Please enter a valid URL").min(2, "Minimum 2 characters").max(100, "Maximum 100 characters").required("Website is required"),
  mobileNumber: yup.string().matches(/^[\d\+\-\(\)\s]+$/, "Invalid phone number format").max(15, "Maximum 15 characters").required("Mobile number is required"),
  taxIdentificationNumber: yup.string().nullable().transform((value) => value || null),
  arianMembershipNumber: yup.string().min(2, "Minimum 2 characters").max(100, "Maximum 100 characters").required("ARIAN membership number is required"),
  listOfAgentsApprovedPrincipals: yup.string().min(3, "Minimum 3 characters").max(2500, "Maximum 2500 characters").required("List of agents approved principals is required"),
  
  // Financial Info
  localAccountNumber: yup.string().matches(/^\d+$/, "Account number must contain only numbers").max(10, "Maximum 10 digits").required("Account number is required"),
  localBankName: yup.string().min(2, "Minimum 2 characters").max(100, "Maximum 100 characters").required("Bank name is required"),
  localBankBranch: yup.string().min(2, "Minimum 2 characters").max(100, "Maximum 100 characters").required("Bank branch is required"),
  localAccountOpeningDate: yup.date().max(new Date(), "Date must be in the past").required("Account opening date is required"),
  foreignAccountNumber: yup.string().nullable().transform((value) => value || null).when(['foreignBankName', 'foreignBankBranch'], {
    is: (bankName: string, bankBranch: string) => (bankName && bankName.length > 0) || (bankBranch && bankBranch.length > 0),
    then: (schema) => schema.matches(/^\d+$/, "Account number must contain only numbers").max(10, "Maximum 10 digits"),
    otherwise: (schema) => schema.nullable()
  }),
  foreignBankName: yup.string().nullable().transform((value) => value || null),
  foreignBankBranch: yup.string().nullable().transform((value) => value || null),
  foreignAccountOpeningDate: yup.date().nullable().transform((value) => value || null).when(['foreignAccountNumber', 'foreignBankName', 'foreignBankBranch'], {
    is: (accountNumber: string, bankName: string, bankBranch: string) => 
      (accountNumber && accountNumber.length > 0) || (bankName && bankName.length > 0) || (bankBranch && bankBranch.length > 0),
    then: (schema) => schema.max(new Date(), "Date must be in the past"),
    otherwise: (schema) => schema.nullable()
  }),
  
  // Declaration
  agreeToDataPrivacy: yup.boolean().oneOf([true], "You must agree to data privacy"),
  signature: yup.string().min(2, "Minimum 2 characters").required("Digital signature is required")
});

const defaultValues = {
  firstName: '',
  middleName: '',
  lastName: '',
  residentialAddress: '',
  gender: '',
  position: '',
  dateOfBirth: '',
  placeOfBirth: '',
  otherSourceOfIncome: '',
  otherSourceOfIncomeOther: '',
  nationality: '',
  phoneNumber: '',
  bvn: '',
  taxIdNumber: '',
  occupation: '',
  email: '',
  validMeansOfId: '',
  identificationNumber: '',
  issuedDate: '',
  expiryDate: '',
  issuingBody: '',
  agentName: '',
  agentsOfficeAddress: '',
  naicomLicenseNumber: '',
  licenseIssuedDate: '',
  licenseExpiryDate: '',
  emailAddress: '',
  website: '',
  mobileNumber: '',
  taxIdentificationNumber: '',
  arianMembershipNumber: '',
  listOfAgentsApprovedPrincipals: '',
  localAccountNumber: '',
  localBankName: '',
  localBankBranch: '',
  localAccountOpeningDate: '',
  foreignAccountNumber: '',
  foreignBankName: '',
  foreignBankBranch: '',
  foreignAccountOpeningDate: '',
  agreeToDataPrivacy: false,
  signature: ''
};

const AgentsCDD: React.FC = () => {
  const [showSummary, setShowSummary] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File>>({});
  
  const { toast } = useToast();
  
  const {
    handleSubmitWithAuth,
    showSuccess,
    setShowSuccess,
    isSubmitting
  } = useAuthRequiredSubmit();

  const formMethods = useForm<any>({
    resolver: yupResolver(agentsCDDSchema),
    defaultValues,
    mode: 'onChange'
  });

  const { saveDraft, clearDraft } = useFormDraft('agents-cdd', formMethods);
  const watchedValues = formMethods.watch();

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

  const handleReview = async (data: any) => {
    console.log('✅ handleReview was called! Starting validation...');
    
    try {
      // Validate the entire form using the schema
      await agentsCDDSchema.validate(data, { abortEarly: false });
      
      // If validation passes, show the summary
      console.log('✅ Validation passed! Showing summary.');
      console.log('Form Data:', data);
      setShowSummary(true);
      
    } catch (validationError) {
      // If validation fails, show errors
      console.log('❌ Validation failed:', validationError);
      
      if (validationError.inner) {
        // Set field-specific errors
        validationError.inner.forEach((error) => {
          if (error.path) {
            formMethods.setError(error.path, {
              type: 'validation',
              message: error.message
            });
          }
        });
      }
      
      // Show a toast notification about validation errors
      toast({
        title: "Form Validation Failed",
        description: "Please check and fix the errors in the form before submitting.",
        variant: "destructive"
      });
    }
  };
  const handleSubmit = async (data: any) => {
    // Upload files to Firebase Storage first
    const fileUploadPromises: Array<Promise<[string, string]>> = [];
    
    Object.entries(uploadedFiles).forEach(([key, file]) => {
      fileUploadPromises.push(
        uploadFile(file, 'agents-cdd').then(url => [key + 'Url', url])
      );
    });
    
    const fileResults = await Promise.all(fileUploadPromises);
    const fileUrls = Object.fromEntries(fileResults);
    
    // Sanitize data - remove undefined values to prevent Firebase errors
    const sanitizeData = (obj: any): any => {
      const cleaned: any = {};
      for (const [key, value] of Object.entries(obj)) {
        if (value !== undefined) {
          // Keep non-undefined values
          cleaned[key] = value;
        }
        // Skip undefined values entirely - Firebase doesn't accept them
      }
      return cleaned;
    };

    const finalData = sanitizeData({
      ...data,
      ...fileUrls,
      status: 'processing',
      formType: 'Agents-CDD'
    });

    console.log('Sanitized final data:', finalData);
    await handleSubmitWithAuth(finalData, 'Agents-CDD');
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
      title: 'Personal Info',
      component: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              name="firstName"
              label="First Name"
              required
            />
            <FormField
              name="middleName"
              label="Middle Name"
            />
            <FormField
              name="lastName"
              label="Last Name"
              required
            />
          </div>
          
          <FormTextarea
            name="residentialAddress"
            label="Residential Address"
            required
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormSelect
              name="gender"
              label="Gender"
              required
              options={[
                { value: "male", label: "Male" },
                { value: "female", label: "Female" }
              ]}
            />
            <FormField
              name="position"
              label="Position/Role"
              required
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
              name="placeOfBirth"
              label="Place of Birth"
              required
            />
          </div>
          
          <FormSelect
            name="otherSourceOfIncome"
            label="Other Source of Income"
            required
            options={[
              { value: "salary", label: "Salary or Business Income" },
              { value: "investments", label: "Investments or Dividends" },
              { value: "other", label: "Other (please specify)" }
            ]}
          />
          
          {watchedValues.otherSourceOfIncome === 'other' && (
            <FormField
              name="otherSourceOfIncomeOther"
              label="Please specify income source"
              required
            />
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              name="nationality"
              label="Nationality"
              required
            />
            <PhoneField
              name="phoneNumber"
              label="Phone Number"
              required
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <NumericField
              name="bvn"
              label="BVN"
              required
              maxLength={11}
            />
            <FormField
              name="taxIdNumber"
              label="Tax ID Number"
            />
            <FormField
              name="occupation"
              label="Occupation"
              required
            />
          </div>
          
          <FormField
            name="email"
            label="Email"
            type="email"
            required
          />
          
          <FormSelect
            name="validMeansOfId"
            label="Valid Means of ID"
            required
            options={[
              { value: "passport", label: "International Passport" },
              { value: "nimc", label: "NIMC" },
              { value: "driversLicense", label: "Drivers Licence" },
              { value: "votersCard", label: "Voters Card" }
            ]}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <FormField
              name="identificationNumber"
              label="Identification Number"
              required
            />
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
            <FormField
              name="issuingBody"
              label="Issuing Body"
              required
            />
          </div>
        </div>
      )
    },
    {
      id: 'additional',
      title: 'Additional Info',
      component: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              name="agentName"
              label="Agent Name"
              required
            />
            <FormField
              name="naicomLicenseNumber"
              label="NAICOM License Number (RIA)"
              required
            />
          </div>
          
          <FormTextarea
            name="agentsOfficeAddress"
            label="Agents Office Address"
            required
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DateField
              name="licenseIssuedDate"
              label="License Issued Date"
              required
              disableFuture
            />
            <DateField
              name="licenseExpiryDate"
              label="License Expiry Date"
              required
              disablePast
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              name="emailAddress"
              label="Email Address"
              type="email"
              required
            />
            <FormField
              name="website"
              label="Website"
              required
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <PhoneField
              name="mobileNumber"
              label="Mobile Number"
              required
            />
            <FormField
              name="taxIdentificationNumber"
              label="Tax Identification Number"
            />
            <FormField
              name="arianMembershipNumber"
              label="ARIAN Membership Number"
              required
            />
          </div>
          
          <FormTextarea
            name="listOfAgentsApprovedPrincipals"
            label="List of Agents Approved Principals (Insurers)"
            required
          />
        </div>
      )
    },
    {
      id: 'financial',
      title: 'Financial Info',
      component: (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-4">Local Account Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <NumericField
                name="localAccountNumber"
                label="Account Number"
                required
                maxLength={10}
              />
              <FormField
                name="localBankName"
                label="Bank Name"
                required
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <FormField
                name="localBankBranch"
                label="Bank Branch"
                required
              />
              <DateField
                name="localAccountOpeningDate"
                label="Account Opening Date"
                required
                disableFuture
              />
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-4">Foreign Account Details (Optional)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <NumericField
                name="foreignAccountNumber"
                label="Account Number"
                maxLength={10}
              />
              <FormField
                name="foreignBankName"
                label="Bank Name"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <FormField
                name="foreignBankBranch"
                label="Bank Branch"
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
      id: 'uploads',
      title: 'File Uploads',
      component: (
        <div className="space-y-6">
          <h3 className="text-lg font-medium mb-4">Required Documents</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FileUpload
              label="Valid Means of Identification"
              required
              onFileSelect={(file) => setUploadedFiles(prev => ({ ...prev, validIdFile: file }))}
              onFileRemove={() => setUploadedFiles(prev => { const updated = { ...prev }; delete updated.validIdFile; return updated; })}
              currentFile={uploadedFiles.validIdFile}
              accept="image/jpeg,image/png,application/pdf"
              maxSize={3 * 1024 * 1024}
            />
            
            <FileUpload
              label="Passport Photograph"
              required
              onFileSelect={(file) => setUploadedFiles(prev => ({ ...prev, passportFile: file }))}
              onFileRemove={() => setUploadedFiles(prev => { const updated = { ...prev }; delete updated.passportFile; return updated; })}
              currentFile={uploadedFiles.passportFile}
              accept="image/jpeg,image/png"
              maxSize={3 * 1024 * 1024}
            />
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
              onCheckedChange={(checked) => formMethods.setValue('agreeToDataPrivacy', checked === true)}
            />
            <Label htmlFor="agreeToDataPrivacy" className="text-sm">
              I agree to the data privacy terms and declaration and confirm that all information provided is true and accurate to the best of my knowledge *
            </Label>
          </div>
          
          <FormField
            name="signature"
            label="Digital Signature"
            placeholder="Type your full name as signature"
            required
          />
        </div>
      )
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Agents CDD Form</h1>
          <p className="text-gray-600">Customer Due Diligence form for Agents</p>
        </div>

        <FormProvider {...formMethods}>
          <MultiStepForm
            steps={steps}
            onSubmit={handleReview} 
            isSubmitting={isSubmitting}
            submitButtonText="Submit CDD Form"
            formMethods={formMethods}
          />
        </FormProvider>
        {/* Summary Dialog */}
        <Dialog open={showSummary} onOpenChange={setShowSummary}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Review Your Agents CDD Form</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              {/* Personal Information */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-4">Personal Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><strong>Name:</strong> {watchedValues.firstName} {watchedValues.middleName} {watchedValues.lastName}</div>
                  <div><strong>Email:</strong> {watchedValues.email}</div>
                  <div><strong>Phone:</strong> {watchedValues.phoneNumber}</div>
                  <div><strong>Gender:</strong> {watchedValues.gender}</div>
                  <div><strong>Position:</strong> {watchedValues.position}</div>
                  <div><strong>Nationality:</strong> {watchedValues.nationality}</div>
                  <div><strong>Occupation:</strong> {watchedValues.occupation}</div>
                  <div><strong>BVN:</strong> {watchedValues.bvn}</div>
                  <div><strong>Date of Birth:</strong> {watchedValues.dateOfBirth ? new Date(watchedValues.dateOfBirth).toLocaleDateString() : 'Not set'}</div>
                  <div><strong>Place of Birth:</strong> {watchedValues.placeOfBirth}</div>
                  <div><strong>ID Type:</strong> {watchedValues.validMeansOfId}</div>
                  <div><strong>ID Number:</strong> {watchedValues.identificationNumber}</div>
                  <div className="col-span-2"><strong>Address:</strong> {watchedValues.residentialAddress}</div>
                </div>
              </div>

              {/* Agent Information */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-4">Agent Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><strong>Agent Name:</strong> {watchedValues.agentName}</div>
                  <div><strong>NAICOM License:</strong> {watchedValues.naicomLicenseNumber}</div>
                  <div><strong>Email Address:</strong> {watchedValues.emailAddress}</div>
                  <div><strong>Website:</strong> {watchedValues.website}</div>
                  <div><strong>Mobile:</strong> {watchedValues.mobileNumber}</div>
                  <div><strong>ARIAN Number:</strong> {watchedValues.arianMembershipNumber}</div>
                  <div className="col-span-2"><strong>Office Address:</strong> {watchedValues.agentsOfficeAddress}</div>
                  <div className="col-span-2"><strong>Approved Principals:</strong> {watchedValues.listOfAgentsApprovedPrincipals}</div>
                </div>
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
          title="Form Submitted Successfully!"
          message="Your Agents CDD form has been submitted and is being processed."
          isLoading={isSubmitting}
          loadingMessage="Submitting your form..."
        />
      </div>
    </div>
  );
};

export default AgentsCDD;
