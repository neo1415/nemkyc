import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { emailService } from '@/services/emailService';
import { useFormDraft } from '@/hooks/useFormDraft';
import { useToast } from '@/hooks/use-toast';
import { uploadFile } from '@/services/fileService';
import { useAuthRequiredSubmit } from '@/hooks/useAuthRequiredSubmit';
import SuccessModal from '@/components/common/SuccessModal';

import MultiStepForm from '@/components/common/MultiStepForm';
import FileUpload from '@/components/common/FileUpload';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Loader2, Home, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Calendar as ReactCalendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

const rentAssuranceSchema = yup.object({
  policyNumber: yup.string().required('Policy number is required'),
  periodOfCoverFrom: yup.date().required('Period of cover from is required'),
  periodOfCoverTo: yup.date().required('Period of cover to is required'),
  nameOfInsured: yup.string().required('Name of insured is required'),
  address: yup.string().required('Address is required'),
  age: yup.number().required('Age is required').min(1, 'Age must be valid'),
  email: yup.string().email('Invalid email').required('Email is required'),
  phone: yup.string().required('Phone number is required'),
  nameOfLandlord: yup.string().required('Name of landlord is required'),
  addressOfLandlord: yup.string().required('Address of landlord is required'),
  livingAtPremisesFrom: yup.date().required('Living at premises from date is required'),
  livingAtPremisesTo: yup.date().required('Living at premises to date is required'),
  periodOfDefaultFrom: yup.date().required('Period of default from is required'),
  periodOfDefaultTo: yup.date().required('Period of default to is required'),
  amountDefaulted: yup.number().required('Amount defaulted is required').min(0),
  rentDueDate: yup.date().required('Rent due date is required'),
  rentPaymentFrequency: yup.string().required('Rent payment frequency is required'),
  rentPaymentFrequencyOther: yup.string().when('rentPaymentFrequency', {
    is: 'other',
    then: (schema) => schema.required('Please specify the frequency'),
    otherwise: (schema) => schema.notRequired()
  }),
  causeOfInabilityToPay: yup.string().required('Cause of inability to pay is required'),
  nameOfBeneficiary: yup.string().required('Name of beneficiary is required'),
  beneficiaryAge: yup.number().required('Beneficiary age is required').min(1),
  beneficiaryAddress: yup.string().required('Beneficiary address is required'),
  beneficiaryEmail: yup.string().email('Invalid email').required('Beneficiary email is required'),
  beneficiaryPhone: yup.string().required('Beneficiary phone is required'),
  beneficiaryOccupation: yup.string().required('Beneficiary occupation is required'),
  writtenDeclaration: yup.string().required('Written declaration is required'),
  agreeToDataPrivacy: yup.boolean().oneOf([true], 'You must agree to the data privacy policy'),
  signature: yup.string().required('Signature is required'),
});

interface RentAssuranceClaimData {
  policyNumber: string;
  periodOfCoverFrom: Date;
  periodOfCoverTo: Date;
  nameOfInsured: string;
  address: string;
  age: number;
  email: string;
  phone: string;
  nameOfLandlord: string;
  addressOfLandlord: string;
  livingAtPremisesFrom: Date;
  livingAtPremisesTo: Date;
  periodOfDefaultFrom: Date;
  periodOfDefaultTo: Date;
  amountDefaulted: number;
  rentDueDate: Date;
  rentPaymentFrequency: string;
  rentPaymentFrequencyOther?: string;
  causeOfInabilityToPay: string;
  nameOfBeneficiary: string;
  beneficiaryAge: number;
  beneficiaryAddress: string;
  beneficiaryEmail: string;
  beneficiaryPhone: string;
  beneficiaryOccupation: string;
  writtenDeclaration: string;
  agreeToDataPrivacy: boolean;
  signature: string;
}

const RentAssuranceClaim = () => {
  const { toast } = useToast();
  const [showSummary, setShowSummary] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPostAuthLoading, setShowPostAuthLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File>>({});
  const { 
    handleSubmitWithAuth, 
    showSuccess: authShowSuccess, 
    setShowSuccess: setAuthShowSuccess,
    isSubmitting: authSubmitting
  } = useAuthRequiredSubmit();

  // Check for pending submission when component mounts
  useEffect(() => {
    const checkPendingSubmission = () => {
      const hasPending = sessionStorage.getItem('pendingSubmission');
      if (hasPending) {
        setShowPostAuthLoading(true);
        // Hide loading after 5 seconds max (in case something goes wrong)
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

  const formMethods = useForm<any>({
    // resolver: yupResolver(rentAssuranceSchema) as any,
    defaultValues: {
      policyNumber: '',
      nameOfInsured: '',
      address: '',
      age: 0,
      email: '',
      phone: '',
      nameOfLandlord: '',
      addressOfLandlord: '',
      amountDefaulted: 0,
      rentPaymentFrequency: '',
      rentPaymentFrequencyOther: '',
      causeOfInabilityToPay: '',
      nameOfBeneficiary: '',
      beneficiaryAge: 0,
      beneficiaryAddress: '',
      beneficiaryEmail: '',
      beneficiaryPhone: '',
      beneficiaryOccupation: '',
      writtenDeclaration: '',
      agreeToDataPrivacy: false,
      signature: '',
    }
  });

  const { saveDraft, clearDraft } = useFormDraft('rentAssuranceClaim', formMethods);
  const watchedValues = formMethods.watch();

  useEffect(() => {
    const subscription = formMethods.watch((data) => {
      saveDraft(data);
    });
    return () => subscription.unsubscribe();
  }, [formMethods, saveDraft]);

  // Main submit handler that checks authentication
  const handleSubmit = async (data: RentAssuranceClaimData) => {
    // Prepare file upload data
    const fileUploadPromises: Array<Promise<[string, string]>> = [];
    
    for (const [key, file] of Object.entries(uploadedFiles)) {
      if (file) {
        fileUploadPromises.push(
          uploadFile(file, `rent-assurance-claims/${Date.now()}-${file.name}`).then(url => [key, url])
        );
      }
    }

    const fileResults = await Promise.all(fileUploadPromises);
    const fileUrls = Object.fromEntries(fileResults);

    const finalData = {
      ...data,
      ...fileUrls,
      status: 'processing',
      formType: 'Rent Assurance Claim'
    };

    await handleSubmitWithAuth(finalData, 'Rent Assurance Claim');
    clearDraft();
    setShowSummary(false);
  };

  const onFinalSubmit = (data: RentAssuranceClaimData) => {
    setShowSummary(true);
  };

  const DatePickerField = ({ name, label }: { name: string; label: string }) => {
    const value = formMethods.watch(name as any);
    return (
      <TooltipProvider>
        <div className="space-y-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Label className="flex items-center gap-1">
                {label}
                <Info className="h-3 w-3" />
              </Label>
            </TooltipTrigger>
            <TooltipContent>
              <p>Select the {label.toLowerCase()}</p>
            </TooltipContent>
          </Tooltip>
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
                selected={value ? new Date(value as any) : undefined}
                onSelect={(date) => formMethods.setValue(name as any, date)}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>
      </TooltipProvider>
    );
  };

  const steps = [
    {
      id: 'policy-details',
      title: 'Policy Details',
      component: (
        <TooltipProvider>
          <div className="space-y-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <Label htmlFor="policyNumber" className="flex items-center gap-1">
                    Policy Number *
                    <Info className="h-3 w-3" />
                  </Label>
                  <Input
                    id="policyNumber"
                    {...formMethods.register('policyNumber')}
                    placeholder="Enter policy number"
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Enter your rent assurance policy number</p>
              </TooltipContent>
            </Tooltip>
            
            <div>
              <Label>Period of Cover *</Label>
              <div className="grid md:grid-cols-2 gap-4 mt-2">
                <DatePickerField
                  name="periodOfCoverFrom"
                  label="From"
                />
                <DatePickerField
                  name="periodOfCoverTo"
                  label="To"
                />
              </div>
            </div>
          </div>
        </TooltipProvider>
      )
    },
    {
      id: 'insured-details',
      title: 'Insured Details',
      component: (
        <TooltipProvider>
          <div className="space-y-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <Label htmlFor="nameOfInsured" className="flex items-center gap-1">
                    Name of Insured (Tenant) *
                    <Info className="h-3 w-3" />
                  </Label>
                  <Input
                    id="nameOfInsured"
                    {...formMethods.register('nameOfInsured')}
                    placeholder="Enter full name"
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Enter the tenant's full name</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <Label htmlFor="address" className="flex items-center gap-1">
                    Address *
                    <Info className="h-3 w-3" />
                  </Label>
                  <Textarea
                    id="address"
                    {...formMethods.register('address')}
                    placeholder="Enter full address"
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Enter the tenant's full residential address</p>
              </TooltipContent>
            </Tooltip>
            
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="age">Age *</Label>
                <Input
                  id="age"
                  type="number"
                  {...formMethods.register('age')}
                  placeholder="Enter age"
                  onChange={(e) => formMethods.setValue('age', Number(e.target.value))}
                />
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  {...formMethods.register('email')}
                  placeholder="Enter email address"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone *</Label>
                <Input
                  id="phone"
                  {...formMethods.register('phone')}
                  placeholder="Enter phone number"
                />
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nameOfLandlord">Name of Landlord *</Label>
                <Input
                  id="nameOfLandlord"
                  {...formMethods.register('nameOfLandlord')}
                  placeholder="Enter landlord's name"
                />
              </div>
              <div>
                <Label htmlFor="addressOfLandlord">Address of Landlord *</Label>
                <Textarea
                  id="addressOfLandlord"
                  {...formMethods.register('addressOfLandlord')}
                  placeholder="Enter landlord's address"
                />
              </div>
            </div>
            
            <div>
              <Label>How long living at premises *</Label>
              <div className="grid md:grid-cols-2 gap-4 mt-2">
                <DatePickerField
                  name="livingAtPremisesFrom"
                  label="From"
                />
                <DatePickerField
                  name="livingAtPremisesTo"
                  label="To"
                />
              </div>
            </div>
          </div>
        </TooltipProvider>
      )
    },
    {
      id: 'claim-information',
      title: 'Claim Information',
      component: (
        <TooltipProvider>
          <div className="space-y-4">
            <div>
              <Label>Period of Default *</Label>
              <div className="grid md:grid-cols-2 gap-4 mt-2">
                <DatePickerField
                  name="periodOfDefaultFrom"
                  label="From"
                />
                <DatePickerField
                  name="periodOfDefaultTo"
                  label="To"
                />
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="amountDefaulted">Amount Defaulted  (₦) *</Label>
                <Input
                  id="amountDefaulted"
                  type="number"
                  {...formMethods.register('amountDefaulted')}
                  placeholder="Enter amount"
                  onChange={(e) => formMethods.setValue('amountDefaulted', Number(e.target.value))}
                />
              </div>
              <DatePickerField
                name="rentDueDate"
                label="Rent Due Date *"
              />
            </div>
            
            <div>
              <Label>Frequency of Rent Payment *</Label>
              <Select
                value={watchedValues.rentPaymentFrequency || ''}
                onValueChange={(value) => formMethods.setValue('rentPaymentFrequency', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select payment frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yearly">Yearly</SelectItem>
                  <SelectItem value="half-yearly">Half-yearly</SelectItem>
                  <SelectItem value="biannually">Biannually</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {watchedValues.rentPaymentFrequency === 'other' && (
              <div>
                <Label htmlFor="rentPaymentFrequencyOther">Specify Other Frequency *</Label>
                <Input
                  id="rentPaymentFrequencyOther"
                  {...formMethods.register('rentPaymentFrequencyOther')}
                  placeholder="Enter payment frequency"
                />
              </div>
            )}
            
            <div>
              <Label htmlFor="causeOfInabilityToPay">Cause of Inability to Pay *</Label>
              <Textarea
                id="causeOfInabilityToPay"
                {...formMethods.register('causeOfInabilityToPay')}
                placeholder="Explain the cause of inability to pay rent"
                rows={4}
              />
            </div>
          </div>
        </TooltipProvider>
      )
    },
    {
      id: 'beneficiary-details',
      title: 'Beneficiary Details',
      component: (
        <TooltipProvider>
          <div className="space-y-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <Label htmlFor="nameOfBeneficiary" className="flex items-center gap-1">
                    Name of Beneficiary (Landlord) *
                    <Info className="h-3 w-3" />
                  </Label>
                  <Input
                    id="nameOfBeneficiary"
                    {...formMethods.register('nameOfBeneficiary')}
                    placeholder="Enter beneficiary's name"
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Enter the landlord's name as beneficiary</p>
              </TooltipContent>
            </Tooltip>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="beneficiaryAge">Age *</Label>
                <Input
                  id="beneficiaryAge"
                  type="number"
                  {...formMethods.register('beneficiaryAge')}
                  placeholder="Enter age"
                  onChange={(e) => formMethods.setValue('beneficiaryAge', Number(e.target.value))}
                />
              </div>
              <div>
                <Label htmlFor="beneficiaryOccupation">Occupation *</Label>
                <Input
                  id="beneficiaryOccupation"
                  {...formMethods.register('beneficiaryOccupation')}
                  placeholder="Enter occupation"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="beneficiaryAddress">Address *</Label>
              <Textarea
                id="beneficiaryAddress"
                {...formMethods.register('beneficiaryAddress')}
                placeholder="Enter full address"
              />
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="beneficiaryEmail">Email *</Label>
                <Input
                  id="beneficiaryEmail"
                  type="email"
                  {...formMethods.register('beneficiaryEmail')}
                  placeholder="Enter email address"
                />
              </div>
              <div>
                <Label htmlFor="beneficiaryPhone">Phone *</Label>
                <Input
                  id="beneficiaryPhone"
                  {...formMethods.register('beneficiaryPhone')}
                  placeholder="Enter phone number"
                />
              </div>
            </div>
          </div>
        </TooltipProvider>
      )
    },
    {
      id: 'documents',
      title: 'File Uploads',
      component: (
        <div className="space-y-6">
          <FileUpload
            label="Rent Agreement"
            onFileSelect={(file) => setUploadedFiles(prev => ({ ...prev, rentAgreement: file }))}
            currentFile={uploadedFiles.rentAgreement}
            accept=".pdf,.jpg,.jpeg,.png"
            maxSize={3}
          />
          
          <FileUpload
            label="Demand Note"
            onFileSelect={(file) => setUploadedFiles(prev => ({ ...prev, demandNote: file }))}
            currentFile={uploadedFiles.demandNote}
            accept=".pdf,.jpg,.jpeg,.png"
            maxSize={3}
          />
          
          <FileUpload
            label="Quit Notice"
            onFileSelect={(file) => setUploadedFiles(prev => ({ ...prev, quitNotice: file }))}
            currentFile={uploadedFiles.quitNotice}
            accept=".pdf,.jpg,.jpeg,.png"
            maxSize={3}
          />
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm font-medium text-blue-800">
              For claims status enquiries, call 01 448 9570
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'data-privacy',
      title: 'Data Privacy',
      component: (
        <div className="space-y-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Data Privacy</h3>
            <div className="text-sm space-y-2">
              <p><strong>i.</strong> Your data will solemnly be used for the purposes of this business contract and also to enable us reach you with the updates about our products and services.</p>
              <p><strong>ii.</strong> Please note that your personal data will be treated with utmost respect and is well secured as required by Nigeria Data Protection Regulations 2019.</p>
              <p><strong>iii.</strong> Your personal data shall not be shared with or sold to any third-party without your consent unless we are compelled by law or regulator.</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="agreeToDataPrivacy"
              checked={watchedValues.agreeToDataPrivacy || false}
              onCheckedChange={(checked) => formMethods.setValue('agreeToDataPrivacy', !!checked)}
            />
            <Label htmlFor="agreeToDataPrivacy">
              I agree to the data privacy policy *
            </Label>
          </div>
        </div>
      )
    },
    {
      id: 'declaration',
      title: 'Declaration & Signature',
      component: (
        <div className="space-y-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Declaration</h3>
            <div className="text-sm space-y-2">
              <p>1. I/We declare to the best of my/our knowledge and belief that the information given on this form is true in every respect and agree that if I/we have made any false or fraudulent statement, be it suppression or concealment, the policy shall be cancelled and the claim shall be forfeited.</p>
              <p>2. I/We agree to provide additional information to NEM Insurance, if required.</p>
              <p>3. I/We agree to submit all required and requested for documents and NEM Insurance shall not be held responsible for any delay in settlement of claim due to non-fulfillment of requirements.</p>
            </div>
          </div>
          
          <div>
            <Label htmlFor="writtenDeclaration">Written Declaration *</Label>
            <Textarea
              id="writtenDeclaration"
              {...formMethods.register('writtenDeclaration')}
              placeholder="I, [name], of [address], do hereby warrant that the particulars and statements contained in this claim are true and that I have not suppressed any material facts... amounting in all to..."
              rows={4}
            />
          </div>
          
          <div>
            <Label htmlFor="signature">Digital Signature *</Label>
            <Input
              id="signature"
              {...formMethods.register('signature')}
              placeholder="Type your full name as digital signature"
            />
          </div>
          
          <div className="text-sm text-muted-foreground">
            Date: {new Date().toLocaleDateString()}
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-3">
            <Home className="h-8 w-8 text-primary" />
            Rent Assurance Policy Claim Form
          </h1>
          <p className="text-gray-600">
            Please fill out all required fields accurately
          </p>
        </div>

        <MultiStepForm
          steps={steps}
          onSubmit={onFinalSubmit}
          formMethods={formMethods}
        />

        {/* Summary Dialog */}
        <Dialog open={showSummary} onOpenChange={setShowSummary}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Claim Summary</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Policy Information</h4>
                  <p className="text-sm">Policy Number: {watchedValues.policyNumber}</p>
                  <p className="text-sm">Insured Name: {watchedValues.nameOfInsured}</p>
                  <p className="text-sm">Email: {watchedValues.email}</p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Claim Details</h4>
                  <p className="text-sm">Amount Defaulted: ₦{watchedValues.amountDefaulted?.toLocaleString()}</p>
                  <p className="text-sm">Beneficiary: {watchedValues.nameOfBeneficiary}</p>
                </div>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-blue-800">
                  For claims status enquiries, call 01 448 9570
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowSummary(false)}>
                Edit Information
              </Button>
              <Button onClick={() => handleSubmit(watchedValues)} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Claim'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Success Modal */}
        <SuccessModal
          isOpen={showSuccess || authShowSuccess || authSubmitting}
          onClose={() => {
            setShowSuccess(false);
            setAuthShowSuccess();
          }}
          title="Rent Assurance Claim Submitted!"
          formType="Rent Assurance Claim"
          isLoading={authSubmitting}
          loadingMessage="Your rent assurance claim is being processed and submitted..."
        />
      </div>

      {/* Post-Authentication Loading Overlay */}
      {showPostAuthLoading && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-card p-8 rounded-lg shadow-lg animate-scale-in max-w-md mx-4">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
              <h3 className="text-xl font-semibold text-primary">Processing Your Submission</h3>
              <p className="text-muted-foreground">
                Thank you for signing in! Your rent assurance claim is now being submitted...
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RentAssuranceClaim;
