import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar as ReactCalendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import MultiStepForm from '@/components/common/MultiStepForm';
import { useFormDraft } from '@/hooks/useFormDraft';
import FileUpload from '@/components/common/FileUpload';
import { uploadFile } from '@/services/fileService';
import { db } from '@/firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { sendEmail } from '@/services/emailService';

const individualCDDSchema = yup.object().shape({
  // Personal Info
  title: yup.string().required("Title is required"),
  firstName: yup.string().required("First name is required"),
  lastName: yup.string().required("Last name is required"),
  contactAddress: yup.string().required("Contact address is required"),
  gender: yup.string().required("Gender is required"),
  residenceCountry: yup.string().required("Residence country is required"),
  dateOfBirth: yup.date().required("Date of birth is required"),
  placeOfBirth: yup.string().required("Place of birth is required"),
  email: yup.string().email("Valid email is required").required("Email is required"),
  mobileNumber: yup.string().required("Mobile number is required"),
  residentialAddress: yup.string().required("Residential address is required"),
  nationality: yup.string().required("Nationality is required"),
  occupation: yup.string().required("Occupation is required"),
  position: yup.string(),
  
  // Additional Info
  businessType: yup.string().required("Business type is required"),
  businessTypeOther: yup.string(),
  employerEmail: yup.string().email("Valid email is required").required("Employer email is required"),
  employerName: yup.string(),
  employerTelephone: yup.string(),
  employerAddress: yup.string(),
  taxId: yup.string(),
  bvn: yup.string().min(11, "BVN must be 11 digits").max(11, "BVN must be 11 digits").required("BVN is required"),
  idType: yup.string().required("ID type is required"),
  identificationNumber: yup.string().required("Identification number is required"),
  issuingCountry: yup.string().required("Issuing country is required"),
  issuedDate: yup.date().required("Issued date is required"),
  expiryDate: yup.date(),
  
  // Account Details
  annualIncomeRange: yup.string().required("Annual income range is required"),
  premiumPaymentSource: yup.string().required("Premium payment source is required"),
  premiumPaymentSourceOther: yup.string(),
  
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
  residenceCountry: '',
  dateOfBirth: '',
  placeOfBirth: '',
  email: '',
  mobileNumber: '',
  residentialAddress: '',
  nationality: '',
  occupation: '',
  position: '',
  businessType: '',
  businessTypeOther: '',
  employerEmail: '',
  employerName: '',
  employerTelephone: '',
  employerAddress: '',
  taxId: '',
  bvn: '',
  idType: '',
  identificationNumber: '',
  issuingCountry: '',
  issuedDate: '',
  expiryDate: '',
  annualIncomeRange: '',
  premiumPaymentSource: '',
  premiumPaymentSourceOther: '',
  agreeToDataPrivacy: false,
  signature: ''
};

const IndividualCDD: React.FC = () => {
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File>>({});

  const formMethods = useForm<any>({
    resolver: yupResolver(individualCDDSchema),
    defaultValues,
    mode: 'onChange'
  });

  const { saveDraft, clearDraft } = useFormDraft('individual-cdd', formMethods);
  const watchedValues = formMethods.watch();

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
          uploadFile(file, 'individual-cdd').then(url => [key + 'Url', url])
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
        formType: 'individual-cdd'
      };
      
      // Submit to Firestore
      await addDoc(collection(db, 'cdd-forms'), {
        ...submissionData,
        timestamp: serverTimestamp(),
        createdAt: new Date().toLocaleDateString('en-GB')
      });
      
      // Send confirmation email
      try {
        await sendEmail({
          to: data.email,
          subject: 'Individual CDD Form Submission Confirmation',
          html: `
            <h2>Individual CDD Form Submitted Successfully</h2>
            <p>Dear ${data.firstName} ${data.lastName},</p>
            <p>Your Individual CDD form has been successfully submitted and is being processed.</p>
            <p>You will be contacted if any additional information is required.</p>
            <p>Thank you for your submission.</p>
          `
        });
      } catch (emailError) {
        console.error('Email sending failed:', emailError);
      }
      
      clearDraft();
      setShowSuccess(true);
      toast({ title: "Individual CDD form submitted successfully!" });
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
      title: 'Personal Info',
      component: (
        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              {...formMethods.register('title')}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                {...formMethods.register('firstName')}
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
              <Label>Gender *</Label>
              <Select
                value={watchedValues.gender || ''}
                onValueChange={(value) => formMethods.setValue('gender', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="residenceCountry">Residence Country *</Label>
              <Input
                id="residenceCountry"
                {...formMethods.register('residenceCountry')}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <DatePickerField
                name="dateOfBirth"
                label="Date Of Birth *"
              />
            </div>
            <div>
              <Label htmlFor="placeOfBirth">Place of Birth *</Label>
              <Input
                id="placeOfBirth"
                {...formMethods.register('placeOfBirth')}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                {...formMethods.register('email')}
              />
            </div>
            <div>
              <Label htmlFor="mobileNumber">Mobile Number *</Label>
              <Input
                id="mobileNumber"
                {...formMethods.register('mobileNumber')}
              />
            </div>
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
              <Label htmlFor="nationality">Nationality *</Label>
              <Input
                id="nationality"
                {...formMethods.register('nationality')}
              />
            </div>
            <div>
              <Label htmlFor="occupation">Occupation *</Label>
              <Input
                id="occupation"
                {...formMethods.register('occupation')}
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="position">Position</Label>
            <Input
              id="position"
              {...formMethods.register('position')}
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
          <div>
            <Label>Business Type *</Label>
            <Select
              value={watchedValues.businessType || ''}
              onValueChange={(value) => formMethods.setValue('businessType', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose Company Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="soleProprietor">Sole Proprietor</SelectItem>
                <SelectItem value="limitedLiability">Limited Liability Company</SelectItem>
                <SelectItem value="publicLimited">Public Limited Company</SelectItem>
                <SelectItem value="jointVenture">Joint Venture</SelectItem>
                <SelectItem value="other">Other (please specify)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {watchedValues.businessType === 'other' && (
            <div>
              <Label htmlFor="businessTypeOther">Please specify business type *</Label>
              <Input
                id="businessTypeOther"
                {...formMethods.register('businessTypeOther')}
              />
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="employerEmail">Employer's Email *</Label>
              <Input
                id="employerEmail"
                type="email"
                {...formMethods.register('employerEmail')}
              />
            </div>
            <div>
              <Label htmlFor="employerName">Employer's Name</Label>
              <Input
                id="employerName"
                {...formMethods.register('employerName')}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="employerTelephone">Employer's Telephone Number</Label>
              <Input
                id="employerTelephone"
                {...formMethods.register('employerTelephone')}
              />
            </div>
            <div>
              <Label htmlFor="taxId">Tax Identification Number</Label>
              <Input
                id="taxId"
                {...formMethods.register('taxId')}
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="employerAddress">Employer's Address</Label>
            <Textarea
              id="employerAddress"
              {...formMethods.register('employerAddress')}
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
          
          <div>
            <Label>ID Type *</Label>
            <Select
              value={watchedValues.idType || ''}
              onValueChange={(value) => formMethods.setValue('idType', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose ID Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="passport">International Passport</SelectItem>
                <SelectItem value="nimc">NIMC</SelectItem>
                <SelectItem value="driversLicense">Drivers Licence</SelectItem>
                <SelectItem value="votersCard">Voters Card</SelectItem>
                <SelectItem value="nin">NIN</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <div>
              <DatePickerField
                name="issuedDate"
                label="Issued Date *"
              />
            </div>
          </div>
          
          <div>
            <DatePickerField
              name="expiryDate"
              label="Expiry Date"
            />
          </div>
        </div>
      )
    },
    {
      id: 'account',
      title: 'Account Details & Uploads',
      component: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Annual Income Range *</Label>
              <Select
                value={watchedValues.annualIncomeRange || ''}
                onValueChange={(value) => formMethods.setValue('annualIncomeRange', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Annual Income Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lessThan1M">Less Than 1 Million</SelectItem>
                  <SelectItem value="1M-4M">1 Million - 4 Million</SelectItem>
                  <SelectItem value="4.1M-10M">4.1 Million - 10 Million</SelectItem>
                  <SelectItem value="moreThan10M">More Than 10 Million</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Premium Payment Source *</Label>
              <Select
                value={watchedValues.premiumPaymentSource || ''}
                onValueChange={(value) => formMethods.setValue('premiumPaymentSource', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose Income Source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="salary">Salary or Business Income</SelectItem>
                  <SelectItem value="investments">Investments or Dividends</SelectItem>
                  <SelectItem value="other">Other (please specify)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {watchedValues.premiumPaymentSource === 'other' && (
            <div>
              <Label htmlFor="premiumPaymentSourceOther">Please specify payment source *</Label>
              <Input
                id="premiumPaymentSourceOther"
                {...formMethods.register('premiumPaymentSourceOther')}
              />
            </div>
          )}
          
          <div>
            <Label>Upload Means of Identification *</Label>
            <FileUpload
              accept="application/pdf,image/*"
              maxSize={3 * 1024 * 1024}
              onFileSelect={(file) => {
                setUploadedFiles(prev => ({ ...prev, identificationDocument: file }));
                toast({ title: "File selected for upload" });
              }}
              currentFile={uploadedFiles.identificationDocument}
              onFileRemove={() => {
                setUploadedFiles(prev => {
                  const { identificationDocument, ...rest } = prev;
                  return rest;
                });
              }}
            />
          </div>
          
          <div>
            <Label htmlFor="signature">Digital Signature *</Label>
            <Textarea
              id="signature"
              placeholder="Type your full name as signature"
              {...formMethods.register('signature')}
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
          
          <div className="text-center pt-4">
            <p className="text-sm text-muted-foreground mb-2">Date: {new Date().toLocaleDateString()}</p>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Individual CDD Form</h1>
          <p className="text-gray-600">Customer Due Diligence form for Individual</p>
        </div>

        <MultiStepForm
          steps={steps}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          submitButtonText="Submit CDD Form"
          formMethods={formMethods}
        />

        {/* Success Dialog */}
        <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>CDD Form Submitted Successfully!</DialogTitle>
            </DialogHeader>
            <div className="text-center space-y-4">
              <div className="text-green-600 text-6xl">✓</div>
              <p>Your Individual CDD form has been submitted successfully.</p>
              <p className="text-sm text-muted-foreground">
                You will receive a confirmation email shortly. For inquiries about your submission status, please contact our customer service team.
              </p>
              <Button onClick={() => setShowSuccess(false)}>
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default IndividualCDD;