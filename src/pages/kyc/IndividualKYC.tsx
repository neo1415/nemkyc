import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
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
import { CalendarIcon, Check } from 'lucide-react';
import { format } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import MultiStepForm from '@/components/common/MultiStepForm';
import { useFormDraft } from '@/hooks/useFormDraft';
import FileUpload from '@/components/common/FileUpload';
import { uploadFile } from '@/services/fileService';
import { db } from '@/firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { notifySubmission } from '@/services/notificationService';
import { useAuth } from '@/contexts/AuthContext';

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
  dateOfBirth: yup.date().required("Date of birth is required"),
  mothersMaidenName: yup.string().required("Mother's maiden name is required"),
  city: yup.string().required("City is required"),
  state: yup.string().required("State is required"),
  country: yup.string().required("Country is required"),
  nationality: yup.string().required("Nationality is required"),
  residentialAddress: yup.string().required("Residential address is required"),
  mobileNumber: yup.string().required("Mobile number is required"),
  email: yup.string().email("Valid email is required").required("Email is required"),
  bvn: yup.string().min(11, "BVN must be 11 digits").max(11, "BVN must be 11 digits").required("BVN is required"),
  idType: yup.string().required("ID type is required"),
  identificationNumber: yup.string().required("Identification number is required"),
  issuingCountry: yup.string().required("Issuing country is required"),
  issuedDate: yup.date().required("Issued date is required"),
  incomeSource: yup.string().required("Income source is required"),
  annualIncomeRange: yup.string().required("Annual income range is required"),
  premiumPaymentSource: yup.string().required("Premium payment source is required"),
  localBankName: yup.string().required("Bank name is required"),
  localAccountNumber: yup.string().required("Account number is required"),
  localBankBranch: yup.string().required("Bank branch is required"),
  localAccountOpeningDate: yup.date().required("Account opening date is required"),
  agreeToDataPrivacy: yup.boolean().oneOf([true], "You must agree to data privacy"),
  signature: yup.string().required("Signature is required")
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
  employersTelephone: '',
  employersAddress: '',
  city: '',
  state: '',
  country: '',
  nationality: '',
  residentialAddress: '',
  mobileNumber: '',
  email: '',
  taxId: '',
  bvn: '',
  idType: '',
  identificationNumber: '',
  issuingCountry: '',
  issuedDate: '',
  expiryDate: '',
  incomeSource: '',
  incomeSourceOther: '',
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
  const { user } = useAuth();
  const [showSummary, setShowSummary] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File>>({});

  const formMethods = useForm<any>({
    resolver: yupResolver(individualKYCSchema),
    defaultValues,
    mode: 'onChange'
  });

  const { saveDraft, clearDraft } = useFormDraft('individualKYC', formMethods);

  // Auto-save draft
  React.useEffect(() => {
    const subscription = formMethods.watch((data) => {
      saveDraft(data);
    });
    return () => subscription.unsubscribe();
  }, [formMethods, saveDraft]);

  const handleSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      // Upload files to Firebase Storage
      const fileUploadPromises: Array<Promise<[string, string]>> = [];
      
      Object.entries(uploadedFiles).forEach(([key, file]) => {
        fileUploadPromises.push(
          uploadFile(file, 'individual-kyc').then(url => [key + 'Url', url])
        );
      });
      
      const uploadedUrls = await Promise.all(fileUploadPromises);
      const fileUrls = Object.fromEntries(uploadedUrls);
      
      // Prepare form data with file URLs
      const submissionData = {
        ...data,
        ...fileUrls,
        status: 'processing',
        submittedAt: new Date().toISOString(),
        formType: 'individual-kyc',
        userId: user?.uid || 'anonymous',
        userEmail: user?.email || data.email
      };
      
      // Submit to Firestore
      await addDoc(collection(db, 'individual-kyc-forms'), {
        ...submissionData,
        timestamp: serverTimestamp(),
        createdAt: new Date().toLocaleDateString('en-GB')
      });
      
      // Send notification email
      if (user) {
        await notifySubmission(user, 'Individual KYC');
      }
      
      clearDraft();
      setShowSummary(false);
      setShowSuccess(true);
      toast({ title: "Individual KYC form submitted successfully!" });
    } catch (error) {
      console.error('Submission error:', error);
      toast({ title: "Submission failed", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
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
              <Label htmlFor="employersTelephone">Employer's Telephone</Label>
              <Input
                id="employersTelephone"
                {...formMethods.register('employersTelephone')}
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
              <Label htmlFor="mobileNumber">Mobile Number *</Label>
              <Input
                id="mobileNumber"
                {...formMethods.register('mobileNumber')}
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
              <Label htmlFor="taxId">Tax Identification Number</Label>
              <Input
                id="taxId"
                {...formMethods.register('taxId')}
              />
            </div>
            <div>
              <Label htmlFor="bvn">BVN *</Label>
              <Input
                id="bvn"
                maxLength={11}
                {...formMethods.register('bvn')}
              />
            </div>
          </div>

          <div>
            <Label>ID Type *</Label>
            <Select
              value={formMethods.watch('idType')}
              onValueChange={(value) => formMethods.setValue('idType', value)}
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
              <Label htmlFor="identificationNumber">Identification Number *</Label>
              <Input
                id="identificationNumber"
                {...formMethods.register('identificationNumber')}
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
              value={formMethods.watch('incomeSource')}
              onValueChange={(value) => formMethods.setValue('incomeSource', value)}
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

          {formMethods.watch('incomeSource') === 'Other' && (
            <div>
              <Label htmlFor="incomeSourceOther">Please specify other income source *</Label>
              <Input
                id="incomeSourceOther"
                {...formMethods.register('incomeSourceOther')}
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
                  identificationDocument: file
                }));
              }}
              maxSize={3}
            />
            {uploadedFiles.identificationDocument && (
              <div className="flex items-center gap-2 mt-2 text-sm text-green-600">
                <Check className="h-4 w-4" />
                {uploadedFiles.identificationDocument.name}
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
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Individual KYC Form</CardTitle>
          <CardDescription>
            Please fill out all required information for individual KYC verification
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MultiStepForm
            steps={steps}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            formMethods={formMethods}
          />
        </CardContent>
      </Card>

      {/* Summary Dialog */}
      <Dialog open={showSummary} onOpenChange={setShowSummary}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Review Your Individual KYC Form</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><strong>Name:</strong> {formMethods.watch('firstName')} {formMethods.watch('lastName')}</div>
              <div><strong>Email:</strong> {formMethods.watch('email')}</div>
              <div><strong>Mobile:</strong> {formMethods.watch('mobileNumber')}</div>
              <div><strong>BVN:</strong> {formMethods.watch('bvn')}</div>
              <div><strong>Occupation:</strong> {formMethods.watch('occupation')}</div>
              <div><strong>Office Location:</strong> {formMethods.watch('officeLocation')}</div>
            </div>
            
            <div className="flex gap-4 justify-end">
              <Button variant="outline" onClick={() => setShowSummary(false)}>
                Edit Form
              </Button>
              <Button onClick={() => handleSubmit(formMethods.getValues())} disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Confirm & Submit'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-green-600">Form Submitted Successfully!</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>Your Individual KYC form has been submitted successfully. We will review your information and contact you if additional details are needed.</p>
            <p className="text-sm text-gray-600">
              For any inquiries about your submission, please contact our customer service team.
            </p>
            <Button onClick={() => setShowSuccess(false)} className="w-full">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default IndividualKYC;