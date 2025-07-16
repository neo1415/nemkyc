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
  const [showSummary, setShowSummary] = useState(false);
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
      
      clearDraft();
      setShowSummary(false);
      setShowSuccess(true);
      toast({ title: "CDD form submitted successfully!" });
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
      title: 'Additional Information',
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
      title: 'Account Details & Files',
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
          
          <div className="space-y-4">
            <div>
              <Label>Valid Means of Identification *</Label>
              <FileUpload
                accept="application/pdf,image/*"
                maxSize={3 * 1024 * 1024}
                onFileSelect={(file) => {
                  setUploadedFiles(prev => ({ ...prev, validMeansOfId: file }));
                  toast({ title: "File selected for upload" });
                }}
                currentFile={uploadedFiles.validMeansOfId}
                onFileRemove={() => {
                  setUploadedFiles(prev => {
                    const { validMeansOfId, ...rest } = prev;
                    return rest;
                  });
                }}
              />
            </div>
            
            <div>
              <Label>Utility Bill *</Label>
              <FileUpload
                accept="application/pdf,image/*"
                maxSize={3 * 1024 * 1024}
                onFileSelect={(file) => {
                  setUploadedFiles(prev => ({ ...prev, utilityBill: file }));
                  toast({ title: "File selected for upload" });
                }}
                currentFile={uploadedFiles.utilityBill}
                onFileRemove={() => {
                  setUploadedFiles(prev => {
                    const { utilityBill, ...rest } = prev;
                    return rest;
                  });
                }}
              />
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
          <div className="border rounded-lg p-6 bg-muted/50">
            <h3 className="text-lg font-semibold mb-4">Data Privacy and Consent</h3>
            <p className="text-sm text-muted-foreground mb-4">
              I hereby agree to the processing of my personal data by NEM Insurance in accordance with the Data Protection Act. 
              I understand that my information will be used for the purpose of customer due diligence and policy administration.
            </p>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="agreeToDataPrivacy"
                checked={watchedValues.agreeToDataPrivacy || false}
                onCheckedChange={(checked) => formMethods.setValue('agreeToDataPrivacy', checked as boolean)}
              />
              <label
                htmlFor="agreeToDataPrivacy"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                I agree to the data privacy policy *
              </label>
            </div>
          </div>
          
          <div>
            <Label htmlFor="signature">Digital Signature *</Label>
            <Input
              id="signature"
              placeholder="Type your full name as signature"
              {...formMethods.register('signature')}
            />
          </div>
          
          <div className="text-center pt-4">
            <Button
              type="button"
              onClick={() => {
                const isValid = formMethods.trigger();
                if (isValid) setShowSummary(true);
              }}
            >
              Review & Submit
            </Button>
          </div>
        </div>
      )
    }
  ];

  const handleFormSubmit = (data: any) => {
    setShowSummary(true);
  };

  return (
    <div className="container mx-auto py-8 px-4">
        <MultiStepForm
          steps={steps}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          submitButtonText="Submit CDD Form"
          formMethods={formMethods}
        />

      {/* Summary Dialog */}
      <Dialog open={showSummary} onOpenChange={setShowSummary}>
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
                <div><strong>Email:</strong> {watchedValues.email}</div>
                <div><strong>Mobile:</strong> {watchedValues.mobileNumber}</div>
                <div><strong>Gender:</strong> {watchedValues.gender}</div>
                <div><strong>Nationality:</strong> {watchedValues.nationality}</div>
                <div><strong>Occupation:</strong> {watchedValues.occupation}</div>
                <div><strong>BVN:</strong> {watchedValues.bvn}</div>
                <div><strong>Date of Birth:</strong> {watchedValues.dateOfBirth ? new Date(watchedValues.dateOfBirth).toLocaleDateString() : 'Not set'}</div>
                <div><strong>Place of Birth:</strong> {watchedValues.placeOfBirth}</div>
                <div><strong>ID Type:</strong> {watchedValues.idType}</div>
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
                <div><strong>Employer Email:</strong> {watchedValues.employerEmail}</div>
                <div><strong>Employer Name:</strong> {watchedValues.employerName}</div>
                <div><strong>Annual Income:</strong> {watchedValues.annualIncomeRange}</div>
                <div><strong>Payment Source:</strong> {watchedValues.premiumPaymentSource}</div>
                <div className="col-span-2"><strong>Employer Address:</strong> {watchedValues.employerAddress}</div>
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
              You will receive a confirmation email shortly.
            </p>
            <Button onClick={() => setShowSuccess(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default IndividualCDD;
