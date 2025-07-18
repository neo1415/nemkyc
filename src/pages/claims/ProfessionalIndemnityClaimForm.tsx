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
import { FileText, User, Shield, Signature, CalendarIcon, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
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
import { useAuth } from '@/contexts/AuthContext';
import { useAuthRequiredSubmit } from '@/hooks/useAuthRequiredSubmit';
import AuthRequiredSubmit from '@/components/common/AuthRequiredSubmit';
import SuccessModal from '@/components/common/SuccessModal';

const professionalIndemnitySchema = yup.object().shape({
  // Policy Details
  policyNumber: yup.string().required('Policy number is required'),
  coverageFromDate: yup.date().required('Coverage from date is required'),
  coverageToDate: yup.date().required('Coverage to date is required'),
  
  // Insured Details
  insuredName: yup.string().required('Name of insured is required'),
  companyName: yup.string(),
  title: yup.string().required('Title is required'),
  dateOfBirth: yup.date().required('Date of birth is required'),
  gender: yup.string().required('Gender is required'),
  address: yup.string().required('Address is required'),
  phone: yup.string().required('Phone number is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  
  // Claimant Details
  claimantName: yup.string().required('Claimant name is required'),
  claimantAddress: yup.string().required('Claimant address is required'),
  
  // Retainer Details
  retainerDetails: yup.string().required('Retainer details are required'),
  contractInWriting: yup.string().required('Please specify if contract was in writing'),
  contractDetails: yup.string().when('contractInWriting', {
    is: 'no',
    then: (schema) => schema.required('Contract details are required')
  }),
  workPerformedFrom: yup.date().required('Work performed from date is required'),
  workPerformedTo: yup.date().required('Work performed to date is required'),
  
  // Work Performer Details
  workPerformerName: yup.string().required('Work performer name is required'),
  workPerformerTitle: yup.string().required('Work performer title is required'),
  workPerformerDuties: yup.string().required('Work performer duties are required'),
  workPerformerContact: yup.string().required('Work performer contact is required'),
  
  // Claim Details
  claimNature: yup.string().required('Nature of claim is required'),
  firstAwareDate: yup.date().required('Date first became aware is required'),
  claimMadeDate: yup.date().required('Date claim was made is required'),
  intimationMode: yup.string().required('Please specify if intimation was oral or written'),
  oralDetails: yup.string().when('intimationMode', {
    is: 'oral',
    then: (schema) => schema.required('Oral details are required')
  }),
  amountClaimed: yup.number().required('Amount claimed is required'),
  
  // Response
  responseComments: yup.string().required('Response comments are required'),
  quantumComments: yup.string().required('Quantum comments are required'),
  estimatedLiability: yup.number().required('Estimated liability is required'),
  additionalInfo: yup.string().required('Please specify if you have additional information'),
  additionalDetails: yup.string().when('additionalInfo', {
    is: 'yes',
    then: (schema) => schema.required('Additional details are required')
  }),
  solicitorInstructed: yup.string().required('Please specify if solicitor was instructed'),
  solicitorName: yup.string().when('solicitorInstructed', {
    is: 'yes',
    then: (schema) => schema.required('Solicitor name is required')
  }),
  solicitorAddress: yup.string().when('solicitorInstructed', {
    is: 'yes',
    then: (schema) => schema.required('Solicitor address is required')
  }),
  solicitorCompany: yup.string().when('solicitorInstructed', {
    is: 'yes',
    then: (schema) => schema.required('Solicitor company is required')
  }),
  solicitorRates: yup.string().when('solicitorInstructed', {
    is: 'yes',
    then: (schema) => schema.required('Solicitor rates are required')
  }),
  
  // Declaration
  agreeToDataPrivacy: yup.boolean().oneOf([true], 'You must agree to data privacy'),
  declarationTrue: yup.boolean().oneOf([true], 'You must confirm the declaration is true'),
  declarationAdditionalInfo: yup.boolean().oneOf([true], 'You must agree to provide additional information'),
  declarationDocuments: yup.boolean().oneOf([true], 'You must agree to submit requested documents'),
  signature: yup.string().required('Signature is required'),
});

interface ProfessionalIndemnityClaimData {
  policyNumber: string;
  coverageFromDate: Date;
  coverageToDate: Date;
  insuredName: string;
  companyName?: string;
  title: string;
  dateOfBirth: Date;
  gender: string;
  address: string;
  phone: string;
  email: string;
  claimantName: string;
  claimantAddress: string;
  retainerDetails: string;
  contractInWriting: 'yes' | 'no';
  contractDetails?: string;
  workPerformedFrom: Date;
  workPerformedTo: Date;
  workPerformerName: string;
  workPerformerTitle: string;
  workPerformerDuties: string;
  workPerformerContact: string;
  claimNature: string;
  firstAwareDate: Date;
  claimMadeDate: Date;
  intimationMode: 'oral' | 'written';
  oralDetails?: string;
  amountClaimed: number;
  responseComments: string;
  quantumComments: string;
  estimatedLiability: number;
  additionalInfo: 'yes' | 'no';
  additionalDetails?: string;
  solicitorInstructed: 'yes' | 'no';
  solicitorName?: string;
  solicitorAddress?: string;
  solicitorCompany?: string;
  solicitorRates?: string;
  agreeToDataPrivacy: boolean;
  declarationTrue: boolean;
  declarationAdditionalInfo: boolean;
  declarationDocuments: boolean;
  signature: string;
}

const defaultValues: Partial<ProfessionalIndemnityClaimData> = {
  policyNumber: '',
  insuredName: '',
  companyName: '',
  title: '',
  gender: '',
  address: '',
  phone: '',
  email: '',
  claimantName: '',
  claimantAddress: '',
  retainerDetails: '',
  contractInWriting: 'no',
  contractDetails: '',
  workPerformerName: '',
  workPerformerTitle: '',
  workPerformerDuties: '',
  workPerformerContact: '',
  claimNature: '',
  intimationMode: 'oral',
  oralDetails: '',
  amountClaimed: 0,
  responseComments: '',
  quantumComments: '',
  estimatedLiability: 0,
  additionalInfo: 'no',
  additionalDetails: '',
  solicitorInstructed: 'no',
  solicitorName: '',
  solicitorAddress: '',
  solicitorCompany: '',
  solicitorRates: '',
  agreeToDataPrivacy: false,
  declarationTrue: false,
  declarationAdditionalInfo: false,
  declarationDocuments: false,
  signature: ''
};

const ProfessionalIndemnityClaimForm: React.FC = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [showSummary, setShowSummary] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPostAuthLoading, setShowPostAuthLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File>>({});
  const [editingField, setEditingField] = useState<string | null>(null);
  const { 
    handleSubmitWithAuth, 
    showAuthDialog, 
    showSuccess: authShowSuccess,
    setShowSuccess: setAuthShowSuccess,
    isSubmitting: authSubmitting,
    proceedToSignup,
    dismissAuthDialog,
    formType
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
    // resolver: yupResolver(professionalIndemnitySchema),
    defaultValues,
    mode: 'onChange'
  });

  const { saveDraft, clearDraft } = useFormDraft('professionalIndemnity', formMethods);
  const watchedValues = formMethods.watch();

  // Auto-save draft
  React.useEffect(() => {
    const subscription = formMethods.watch((data) => {
      saveDraft(data);
    });
    return () => subscription.unsubscribe();
  }, [formMethods, saveDraft]);

  const handleSubmit = async (data: ProfessionalIndemnityClaimData) => {
    setIsSubmitting(true);
    try {
      // Upload files to Firebase Storage
      const fileUploadPromises: Array<Promise<[string, string]>> = [];
      
      Object.entries(uploadedFiles).forEach(([key, file]) => {
        fileUploadPromises.push(
          uploadFile(file, 'professional-indemnity-claims').then(url => [key + 'Url', url])
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
        formType: 'professional-indemnity-claim'
      };
      
      // Submit to Firestore
      await addDoc(collection(db, 'professional-indemnity-claims'), {
        ...submissionData,
        timestamp: serverTimestamp(),
        createdAt: new Date().toLocaleDateString('en-GB')
      });

      // Email confirmation would be sent here
      console.log('Claim submitted for:', data.email);
      
      clearDraft();
      setShowSummary(false);
      setShowSuccess(true);
      toast({
        title: "Claim Submitted Successfully",
        description: "Your professional indemnity claim has been submitted and you'll receive a confirmation email shortly.",
      });
    } catch (error) {
      console.error('Error submitting claim:', error);
      toast({
        title: "Submission Error",
        description: "There was an error submitting your claim. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const onFinalSubmit = (data: ProfessionalIndemnityClaimData) => {
    if (user) {
      setShowSummary(true);
    } else {
      handleSubmitWithAuth(data, 'Professional Indemnity Claim', handleSubmit);
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
      id: 'policy',
      title: 'Policy Details',
      component: (
        <div className="space-y-4">
          <div>
            <Label htmlFor="policyNumber">Policy Number *</Label>
            <Input
              id="policyNumber"
              {...formMethods.register('policyNumber')}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <DatePickerField
                name="coverageFromDate"
                label="Period of Cover - From *"
              />
            </div>
            <div>
              <DatePickerField
                name="coverageToDate"
                label="Period of Cover - To *"
              />
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'insured',
      title: 'Insured Details',
      component: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="insuredName">Name of Insured *</Label>
              <Input
                id="insuredName"
                {...formMethods.register('insuredName')}
              />
            </div>
            <div>
              <Label htmlFor="companyName">Company Name (if applicable)</Label>
              <Input
                id="companyName"
                {...formMethods.register('companyName')}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Title *</Label>
              <Select
                value={watchedValues.title || ''}
                onValueChange={(value) => formMethods.setValue('title', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select title" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Mr">Mr</SelectItem>
                  <SelectItem value="Mrs">Mrs</SelectItem>
                  <SelectItem value="Chief">Chief</SelectItem>
                  <SelectItem value="Dr">Dr</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <DatePickerField
                name="dateOfBirth"
                label="Date of Birth *"
              />
            </div>
            <div>
              <Label>Gender *</Label>
              <Select
                value={watchedValues.gender || ''}
                onValueChange={(value) => formMethods.setValue('gender', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div>
            <Label htmlFor="address">Address *</Label>
            <Textarea
              id="address"
              {...formMethods.register('address')}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone">Phone *</Label>
              <Input
                id="phone"
                {...formMethods.register('phone')}
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
        </div>
      )
    },
    {
      id: 'claimant',
      title: 'Claimant Details',
      component: (
        <div className="space-y-4">
          <div>
            <Label htmlFor="claimantName">Full Name of Claimant *</Label>
            <Input
              id="claimantName"
              {...formMethods.register('claimantName')}
            />
          </div>
          
          <div>
            <Label htmlFor="claimantAddress">Address of Claimant *</Label>
            <Textarea
              id="claimantAddress"
              {...formMethods.register('claimantAddress')}
            />
          </div>
        </div>
      )
    },
    {
      id: 'retainer',
      title: 'Retainer/Contract Details',
      component: (
        <div className="space-y-4">
          <div>
            <Label htmlFor="retainerDetails">What were you retained/contracted to do? *</Label>
            <Textarea
              id="retainerDetails"
              {...formMethods.register('retainerDetails')}
              rows={4}
            />
          </div>
          
          <div>
            <Label>Was your contract evidenced in writing? *</Label>
            <Select
              value={watchedValues.contractInWriting || ''}
              onValueChange={(value) => formMethods.setValue('contractInWriting', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="no">No</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {watchedValues.contractInWriting === 'yes' && (
            <FileUpload
              label="Contract Document (PDF, max 3MB)"
              onFileSelect={(file) => setUploadedFiles(prev => ({ ...prev, contractDocument: file }))}
              currentFile={uploadedFiles.contractDocument}
              accept=".pdf"
              maxSize={3}
            />
          )}
          
          {watchedValues.contractInWriting === 'no' && (
            <div>
              <Label htmlFor="contractDetails">Details of contract and its terms *</Label>
              <Textarea
                id="contractDetails"
                {...formMethods.register('contractDetails')}
                rows={4}
              />
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <DatePickerField
                name="workPerformedFrom"
                label="When did you perform the work giving rise to the claim? From *"
              />
            </div>
            <div>
              <DatePickerField
                name="workPerformedTo"
                label="To *"
              />
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg space-y-4">
            <h3 className="font-medium">Who actually performed the work?</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="workPerformerName">Name *</Label>
                <Input
                  id="workPerformerName"
                  {...formMethods.register('workPerformerName')}
                />
              </div>
              <div>
                <Label htmlFor="workPerformerTitle">Title *</Label>
                <Input
                  id="workPerformerTitle"
                  {...formMethods.register('workPerformerTitle')}
                />
              </div>
              <div>
                <Label htmlFor="workPerformerDuties">Duties *</Label>
                <Input
                  id="workPerformerDuties"
                  {...formMethods.register('workPerformerDuties')}
                />
              </div>
              <div>
                <Label htmlFor="workPerformerContact">Contact *</Label>
                <Input
                  id="workPerformerContact"
                  {...formMethods.register('workPerformerContact')}
                />
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'claim',
      title: 'Claim Details',
      component: (
        <div className="space-y-4">
          <div>
            <Label htmlFor="claimNature">Nature of the claim or the circumstances *</Label>
            <Textarea
              id="claimNature"
              {...formMethods.register('claimNature')}
              rows={4}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <DatePickerField
                name="firstAwareDate"
                label="Date first became aware of the claim *"
              />
            </div>
            <div>
              <DatePickerField
                name="claimMadeDate"
                label="Date claim or intimation of claim made to you *"
              />
            </div>
          </div>
          
          <div>
            <Label>Was intimation oral or written? *</Label>
            <Select
              value={watchedValues.intimationMode || ''}
              onValueChange={(value) => formMethods.setValue('intimationMode', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="oral">Oral</SelectItem>
                <SelectItem value="written">Written</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {watchedValues.intimationMode === 'written' && (
            <FileUpload
              label="Written Intimation Document (PDF, max 3MB)"
              onFileSelect={(file) => setUploadedFiles(prev => ({ ...prev, writtenIntimation: file }))}
              currentFile={uploadedFiles.writtenIntimation}
              accept=".pdf"
              maxSize={3}
            />
          )}
          
          {watchedValues.intimationMode === 'oral' && (
            <div>
              <Label htmlFor="oralDetails">Details of oral intimation (first-person details) *</Label>
              <Textarea
                id="oralDetails"
                {...formMethods.register('oralDetails')}
                rows={3}
              />
            </div>
          )}
          
          <div>
            <Label htmlFor="amountClaimed">Amount claimed *</Label>
            <Input
              id="amountClaimed"
              type="number"
              {...formMethods.register('amountClaimed')}
            />
          </div>
        </div>
      )
    },
    {
      id: 'response',
      title: "Insured's Response",
      component: (
        <div className="space-y-4">
          <div>
            <Label htmlFor="responseComments">Comments in response to the claim *</Label>
            <Textarea
              id="responseComments"
              {...formMethods.register('responseComments')}
              rows={4}
            />
          </div>
          
          <div>
            <Label htmlFor="quantumComments">Comments on the quantum of the claim *</Label>
            <Textarea
              id="quantumComments"
              {...formMethods.register('quantumComments')}
              rows={4}
            />
          </div>
          
          <div>
            <Label htmlFor="estimatedLiability">Estimated monetary liability *</Label>
            <Input
              id="estimatedLiability"
              type="number"
              {...formMethods.register('estimatedLiability')}
            />
          </div>
          
          <div>
            <Label>Any other details or info that will help insurer? *</Label>
            <Select
              value={watchedValues.additionalInfo || ''}
              onValueChange={(value) => formMethods.setValue('additionalInfo', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="no">No</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {watchedValues.additionalInfo === 'yes' && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="additionalDetails">Additional details *</Label>
                <Textarea
                  id="additionalDetails"
                  {...formMethods.register('additionalDetails')}
                  rows={3}
                />
              </div>
              <FileUpload
                label="Additional Document (if needed)"
                onFileSelect={(file) => setUploadedFiles(prev => ({ ...prev, additionalDocument: file }))}
                currentFile={uploadedFiles.additionalDocument}
                accept=".pdf,.jpg,.png"
                maxSize={3}
              />
            </div>
          )}
          
          <div>
            <Label>Have you instructed a solicitor? *</Label>
            <Select
              value={watchedValues.solicitorInstructed || ''}
              onValueChange={(value) => formMethods.setValue('solicitorInstructed', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="no">No</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {watchedValues.solicitorInstructed === 'yes' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="solicitorName">Name *</Label>
                <Input
                  id="solicitorName"
                  {...formMethods.register('solicitorName')}
                />
              </div>
              <div>
                <Label htmlFor="solicitorCompany">Company *</Label>
                <Input
                  id="solicitorCompany"
                  {...formMethods.register('solicitorCompany')}
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="solicitorAddress">Address *</Label>
                <Textarea
                  id="solicitorAddress"
                  {...formMethods.register('solicitorAddress')}
                />
              </div>
              <div>
                <Label htmlFor="solicitorRates">Rates *</Label>
                <Input
                  id="solicitorRates"
                  {...formMethods.register('solicitorRates')}
                />
              </div>
            </div>
          )}
        </div>
      )
    },
    {
      id: 'privacy',
      title: 'Data Privacy',
      component: (
        <div className="space-y-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Data Privacy</h3>
            <div className="text-sm space-y-2">
              <p>i. Your data will solemnly be used for the purposes of this business contract and also to enable us reach you with the updates about our products and services.</p>
              <p>ii. Please note that your personal data will be treated with utmost respect and is well secured as required by Nigeria Data Protection Regulations 2019.</p>
              <p>iii. Your personal data shall not be shared with or sold to any third-party without your consent unless we are compelled by law or regulator.</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="agreeToDataPrivacy"
              checked={watchedValues.agreeToDataPrivacy || false}
              onCheckedChange={(checked) => formMethods.setValue('agreeToDataPrivacy', !!checked)}
            />
            <Label htmlFor="agreeToDataPrivacy">I agree to the data privacy terms *</Label>
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
          
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="declarationTrue"
                checked={watchedValues.declarationTrue || false}
                onCheckedChange={(checked) => formMethods.setValue('declarationTrue', !!checked)}
              />
              <Label htmlFor="declarationTrue">I agree that statements are true *</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="declarationAdditionalInfo"
                checked={watchedValues.declarationAdditionalInfo || false}
                onCheckedChange={(checked) => formMethods.setValue('declarationAdditionalInfo', !!checked)}
              />
              <Label htmlFor="declarationAdditionalInfo">I agree to provide more info *</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="declarationDocuments"
                checked={watchedValues.declarationDocuments || false}
                onCheckedChange={(checked) => formMethods.setValue('declarationDocuments', !!checked)}
              />
              <Label htmlFor="declarationDocuments">I agree on documents requested *</Label>
            </div>
          </div>
          
          <div>
            <Label htmlFor="signature">Signature of policyholder (digital signature) *</Label>
            <Input
              id="signature"
              {...formMethods.register('signature')}
              placeholder="Type your full name as signature"
            />
          </div>
          
          <div>
            <Label>Date</Label>
            <Input value={new Date().toISOString().split('T')[0]} disabled />
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Professional Indemnity Insurance Claim Form</h1>
          <p className="text-gray-600 mt-2">Submit your professional indemnity insurance claim with all required details</p>
        </div>

        <MultiStepForm
          steps={steps}
          onSubmit={onFinalSubmit}
          isSubmitting={isSubmitting}
          submitButtonText="Review & Submit Claim"
          formMethods={formMethods}
        />

        {/* Summary Dialog */}
        <Dialog open={showSummary} onOpenChange={setShowSummary}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Review Your Claim Submission</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><strong>Policy Number:</strong> {watchedValues.policyNumber}</div>
                <div><strong>Insured Name:</strong> {watchedValues.insuredName}</div>
                <div><strong>Claimant Name:</strong> {watchedValues.claimantName}</div>
                <div><strong>Amount Claimed:</strong> ₦{watchedValues.amountClaimed?.toLocaleString()}</div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowSummary(false)}>
                  Back to Edit
                </Button>
                <Button onClick={() => handleSubmit(formMethods.getValues())} disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Confirm & Submit'
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Auth Required Submit Dialog */}
        <AuthRequiredSubmit
          isOpen={showAuthDialog}
          onClose={dismissAuthDialog}
          onProceedToSignup={proceedToSignup}
          formType={formType}
        />

        {/* Success Modal from Auth Flow */}
        <div className="relative">
          <SuccessModal
            isOpen={authShowSuccess}
            onClose={() => setAuthShowSuccess()}
            title="Professional Indemnity Claim Submitted Successfully!"
            message="Your professional indemnity claim has been submitted and you'll receive a confirmation email shortly."
            formType="professional-indemnity-claim"
            isLoading={authSubmitting}
            loadingMessage="Your professional indemnity claim is being processed and submitted..."
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
                  Thank you for signing in! Your professional indemnity claim is now being submitted...
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfessionalIndemnityClaimForm;