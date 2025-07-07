
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Checkbox } from '../../components/ui/checkbox';
import { toast } from '../../components/ui/use-toast';
import MultiStepForm from '../../components/common/MultiStepForm';
import FormSection from '../../components/common/FormSection';
import FileUpload from '../../components/common/FileUpload';
import PhoneInput from '../../components/common/PhoneInput';
import { useAuth } from '../../contexts/AuthContext';
import { useFormDraft } from '../../hooks/useFormDraft';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { FileText, User, Shield, Signature } from 'lucide-react';

const professionalIndemnitySchema = Yup.object({
  // Policy Details
  policyNumber: Yup.string().required('Policy number is required'),
  coverageFromDate: Yup.string().required('Coverage from date is required'),
  coverageToDate: Yup.string().required('Coverage to date is required'),
  
  // Insured Details
  insuredName: Yup.string().required('Name of insured is required'),
  companyName: Yup.string(),
  title: Yup.string().required('Title is required'),
  dateOfBirth: Yup.string().required('Date of birth is required'),
  gender: Yup.string().required('Gender is required'),
  address: Yup.string().required('Address is required'),
  phone: Yup.string().required('Phone number is required'),
  email: Yup.string().email('Invalid email').required('Email is required'),
  
  // Claimant Details
  claimantName: Yup.string().required('Claimant name is required'),
  claimantAddress: Yup.string().required('Claimant address is required'),
  
  // Retainer Details
  retainerDetails: Yup.string().required('Retainer details are required'),
  contractInWriting: Yup.string().required('Please specify if contract was in writing'),
  contractDetails: Yup.string().when('contractInWriting', {
    is: 'no',
    then: (schema) => schema.required('Contract details are required')
  }),
  workPerformedFrom: Yup.string().required('Work performed from date is required'),
  workPerformedTo: Yup.string().required('Work performed to date is required'),
  
  // Claim Details
  claimNature: Yup.string().required('Nature of claim is required'),
  firstAwareDate: Yup.string().required('Date first became aware is required'),
  claimMadeDate: Yup.string().required('Date claim was made is required'),
  intimationMode: Yup.string().required('Please specify if intimation was oral or written'),
  amountClaimed: Yup.number().required('Amount claimed is required'),
  
  // Response
  responseComments: Yup.string().required('Response comments are required'),
  quantumComments: Yup.string().required('Quantum comments are required'),
  estimatedLiability: Yup.number().required('Estimated liability is required'),
  additionalInfo: Yup.string().required('Please specify if you have additional information'),
  solicitorInstructed: Yup.string().required('Please specify if solicitor was instructed'),
  
  // Declaration
  declarationAgreed: Yup.boolean().oneOf([true], 'You must agree to the declaration'),
  signature: Yup.string().required('Signature is required'),
});

interface ProfessionalIndemnityClaimData {
  policyNumber: string;
  coverageFromDate: string;
  coverageToDate: string;
  insuredName: string;
  companyName?: string;
  title: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  phone: string;
  email: string;
  claimantName: string;
  claimantAddress: string;
  retainerDetails: string;
  contractInWriting: 'yes' | 'no';
  contractDocument?: File;
  contractDetails?: string;
  workPerformedFrom: string;
  workPerformedTo: string;
  claimNature: string;
  firstAwareDate: string;
  claimMadeDate: string;
  intimationMode: 'oral' | 'written';
  writtenIntimation?: File;
  oralDetails?: string;
  amountClaimed: number;
  responseComments: string;
  quantumComments: string;
  estimatedLiability: number;
  additionalInfo: 'yes' | 'no';
  additionalDetails?: string;
  additionalDocument?: File;
  solicitorInstructed: 'yes' | 'no';
  solicitorName?: string;
  solicitorAddress?: string;
  solicitorCompany?: string;
  solicitorRates?: string;
  declarationAgreed: boolean;
  signature: string;
}

const ProfessionalIndemnityClaimForm: React.FC = () => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<ProfessionalIndemnityClaimData>({
    resolver: yupResolver(professionalIndemnitySchema) as any,
    defaultValues: {
      email: user?.email || '',
    }
  });

  const { saveDraft } = useFormDraft('professional-indemnity-claim', { setValue });
  const watchedValues = watch();

  // Auto-save to localStorage
  useEffect(() => {
    const subscription = watch((value) => {
      saveDraft(value);
    });
    return () => subscription.unsubscribe();
  }, [watch, saveDraft]);

  const onSubmit = async (data: ProfessionalIndemnityClaimData) => {
    setShowSummary(true);
  };

  const handleFinalSubmit = async () => {
    if (!user) return;
    
    setIsSubmitting(true);
    try {
      const submissionId = `claim_professional_indemnity_${Date.now()}`;
      
      await setDoc(doc(db, 'submissions', submissionId), {
        id: submissionId,
        userId: user.uid,
        formType: 'professional-indemnity-claim',
        claimType: 'professional-indemnity',
        data: watchedValues,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      setShowSummary(false);
      setShowSuccess(true);
      
      toast({
        title: "Claim Submitted Successfully",
        description: "Your professional indemnity claim has been submitted.",
      });
      
    } catch (error) {
      console.error('Error submitting claim:', error);
      toast({
        title: "Submission Error",
        description: "Failed to submit claim. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const PolicyDetailsStep = () => (
    <FormSection title="Policy Details" icon={<FileText className="h-5 w-5" />}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="policyNumber">Policy Number *</Label>
          <Input {...register('policyNumber')} />
          {errors.policyNumber && <p className="text-sm text-red-600">{errors.policyNumber.message}</p>}
        </div>
        <div></div>
        <div>
          <Label htmlFor="coverageFromDate">Period of Cover - From *</Label>
          <Input type="date" {...register('coverageFromDate')} />
          {errors.coverageFromDate && <p className="text-sm text-red-600">{errors.coverageFromDate.message}</p>}
        </div>
        <div>
          <Label htmlFor="coverageToDate">Period of Cover - To *</Label>
          <Input type="date" {...register('coverageToDate')} />
          {errors.coverageToDate && <p className="text-sm text-red-600">{errors.coverageToDate.message}</p>}
        </div>
      </div>
    </FormSection>
  );

  const InsuredDetailsStep = () => (
    <FormSection title="Insured Details" icon={<User className="h-5 w-5" />}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="insuredName">Name of Insured *</Label>
          <Input {...register('insuredName')} />
          {errors.insuredName && <p className="text-sm text-red-600">{errors.insuredName.message}</p>}
        </div>
        <div>
          <Label htmlFor="companyName">Company Name</Label>
          <Input {...register('companyName')} />
        </div>
        <div>
          <Label htmlFor="title">Title *</Label>
          <Select value={watchedValues.title} onValueChange={(value) => setValue('title', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select title" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mr">Mr</SelectItem>
              <SelectItem value="mrs">Mrs</SelectItem>
              <SelectItem value="chief">Chief</SelectItem>
              <SelectItem value="dr">Dr</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
          {errors.title && <p className="text-sm text-red-600">{errors.title.message}</p>}
        </div>
        <div>
          <Label htmlFor="dateOfBirth">Date of Birth *</Label>
          <Input type="date" {...register('dateOfBirth')} />
          {errors.dateOfBirth && <p className="text-sm text-red-600">{errors.dateOfBirth.message}</p>}
        </div>
        <div>
          <Label htmlFor="gender">Gender *</Label>
          <Select value={watchedValues.gender} onValueChange={(value) => setValue('gender', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
          {errors.gender && <p className="text-sm text-red-600">{errors.gender.message}</p>}
        </div>
        <div className="md:col-span-2">
          <Label htmlFor="address">Address *</Label>
          <Textarea {...register('address')} />
          {errors.address && <p className="text-sm text-red-600">{errors.address.message}</p>}
        </div>
        <div>
          <PhoneInput
            label="Phone Number"
            required
            value={watchedValues.phone || ''}
            onChange={(value) => setValue('phone', value)}
            error={errors.phone?.message}
          />
        </div>
        <div>
          <Label htmlFor="email">Email *</Label>
          <Input type="email" {...register('email')} />
          {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
        </div>
      </div>
    </FormSection>
  );

  const ClaimantDetailsStep = () => (
    <FormSection title="Claimant Details" icon={<User className="h-5 w-5" />}>
      <div className="grid grid-cols-1 gap-4">
        <div>
          <Label htmlFor="claimantName">Full Name of Claimant *</Label>
          <Input {...register('claimantName')} />
          {errors.claimantName && <p className="text-sm text-red-600">{errors.claimantName.message}</p>}
        </div>
        <div>
          <Label htmlFor="claimantAddress">Address of Claimant *</Label>
          <Textarea {...register('claimantAddress')} />
          {errors.claimantAddress && <p className="text-sm text-red-600">{errors.claimantAddress.message}</p>}
        </div>
      </div>
    </FormSection>
  );

  const RetainerDetailsStep = () => (
    <FormSection title="Retainer/Contract Details" icon={<FileText className="h-5 w-5" />}>
      <div className="space-y-4">
        <div>
          <Label htmlFor="retainerDetails">What were you retained/contracted to do? *</Label>
          <Textarea {...register('retainerDetails')} rows={4} />
          {errors.retainerDetails && <p className="text-sm text-red-600">{errors.retainerDetails.message}</p>}
        </div>
        
        <div>
          <Label>Was your contract evidenced in writing? *</Label>
          <Select value={watchedValues.contractInWriting} onValueChange={(value) => setValue('contractInWriting', value as 'yes' | 'no')}>
            <SelectTrigger>
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="yes">Yes</SelectItem>
              <SelectItem value="no">No</SelectItem>
            </SelectContent>
          </Select>
          {errors.contractInWriting && <p className="text-sm text-red-600">{errors.contractInWriting.message}</p>}
        </div>

        {watchedValues.contractInWriting === 'yes' && (
          <FileUpload
            label="Contract Document"
            onFileSelect={(file) => setValue('contractDocument', file)}
            currentFile={watchedValues.contractDocument}
            accept=".pdf,.jpg,.png"
          />
        )}

        {watchedValues.contractInWriting === 'no' && (
          <div>
            <Label htmlFor="contractDetails">Details of contract and its terms *</Label>
            <Textarea {...register('contractDetails')} rows={4} />
            {errors.contractDetails && <p className="text-sm text-red-600">{errors.contractDetails.message}</p>}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="workPerformedFrom">Work performed from *</Label>
            <Input type="date" {...register('workPerformedFrom')} />
            {errors.workPerformedFrom && <p className="text-sm text-red-600">{errors.workPerformedFrom.message}</p>}
          </div>
          <div>
            <Label htmlFor="workPerformedTo">Work performed to *</Label>
            <Input type="date" {...register('workPerformedTo')} />
            {errors.workPerformedTo && <p className="text-sm text-red-600">{errors.workPerformedTo.message}</p>}
          </div>
        </div>
      </div>
    </FormSection>
  );

  const ClaimDetailsStep = () => (
    <FormSection title="Claim Details" icon={<FileText className="h-5 w-5" />}>
      <div className="space-y-4">
        <div>
          <Label htmlFor="claimNature">Nature of the claim or the circumstances *</Label>
          <Textarea {...register('claimNature')} rows={4} />
          {errors.claimNature && <p className="text-sm text-red-600">{errors.claimNature.message}</p>}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="firstAwareDate">Date first became aware of the claim *</Label>
            <Input type="date" {...register('firstAwareDate')} />
            {errors.firstAwareDate && <p className="text-sm text-red-600">{errors.firstAwareDate.message}</p>}
          </div>
          <div>
            <Label htmlFor="claimMadeDate">Date claim was made to you *</Label>
            <Input type="date" {...register('claimMadeDate')} />
            {errors.claimMadeDate && <p className="text-sm text-red-600">{errors.claimMadeDate.message}</p>}
          </div>
        </div>

        <div>
          <Label>Was intimation oral or written? *</Label>
          <Select value={watchedValues.intimationMode} onValueChange={(value) => setValue('intimationMode', value as 'oral' | 'written')}>
            <SelectTrigger>
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="oral">Oral</SelectItem>
              <SelectItem value="written">Written</SelectItem>
            </SelectContent>
          </Select>
          {errors.intimationMode && <p className="text-sm text-red-600">{errors.intimationMode.message}</p>}
        </div>

        {watchedValues.intimationMode === 'written' && (
          <FileUpload
            label="Written Intimation Document"
            onFileSelect={(file) => setValue('writtenIntimation', file)}
            currentFile={watchedValues.writtenIntimation}
            accept=".pdf,.jpg,.png"
          />
        )}

        {watchedValues.intimationMode === 'oral' && (
          <div>
            <Label htmlFor="oralDetails">Details of oral intimation *</Label>
            <Textarea {...register('oralDetails')} rows={3} />
          </div>
        )}

        <div>
          <Label htmlFor="amountClaimed">Amount claimed *</Label>
          <Input type="number" {...register('amountClaimed')} />
          {errors.amountClaimed && <p className="text-sm text-red-600">{errors.amountClaimed.message}</p>}
        </div>
      </div>
    </FormSection>
  );

  const ResponseStep = () => (
    <FormSection title="Insured's Response" icon={<FileText className="h-5 w-5" />}>
      <div className="space-y-4">
        <div>
          <Label htmlFor="responseComments">Comments in response to the claim *</Label>
          <Textarea {...register('responseComments')} rows={4} />
          {errors.responseComments && <p className="text-sm text-red-600">{errors.responseComments.message}</p>}
        </div>
        
        <div>
          <Label htmlFor="quantumComments">Comments on the quantum of the claim *</Label>
          <Textarea {...register('quantumComments')} rows={4} />
          {errors.quantumComments && <p className="text-sm text-red-600">{errors.quantumComments.message}</p>}
        </div>

        <div>
          <Label htmlFor="estimatedLiability">Estimated monetary liability *</Label>
          <Input type="number" {...register('estimatedLiability')} />
          {errors.estimatedLiability && <p className="text-sm text-red-600">{errors.estimatedLiability.message}</p>}
        </div>

        <div>
          <Label>Any other details that will help insurer? *</Label>
          <Select value={watchedValues.additionalInfo} onValueChange={(value) => setValue('additionalInfo', value as 'yes' | 'no')}>
            <SelectTrigger>
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="yes">Yes</SelectItem>
              <SelectItem value="no">No</SelectItem>
            </SelectContent>
          </Select>
          {errors.additionalInfo && <p className="text-sm text-red-600">{errors.additionalInfo.message}</p>}
        </div>

        {watchedValues.additionalInfo === 'yes' && (
          <>
            <div>
              <Label htmlFor="additionalDetails">Additional details</Label>
              <Textarea {...register('additionalDetails')} rows={3} />
            </div>
            <FileUpload
              label="Additional Document"
              onFileSelect={(file) => setValue('additionalDocument', file)}
              currentFile={watchedValues.additionalDocument}
              accept=".pdf,.jpg,.png"
            />
          </>
        )}

        <div>
          <Label>Have you instructed a solicitor? *</Label>
          <Select value={watchedValues.solicitorInstructed} onValueChange={(value) => setValue('solicitorInstructed', value as 'yes' | 'no')}>
            <SelectTrigger>
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="yes">Yes</SelectItem>
              <SelectItem value="no">No</SelectItem>
            </SelectContent>
          </Select>
          {errors.solicitorInstructed && <p className="text-sm text-red-600">{errors.solicitorInstructed.message}</p>}
        </div>

        {watchedValues.solicitorInstructed === 'yes' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="solicitorName">Solicitor Name</Label>
              <Input {...register('solicitorName')} />
            </div>
            <div>
              <Label htmlFor="solicitorCompany">Solicitor Company</Label>
              <Input {...register('solicitorCompany')} />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="solicitorAddress">Solicitor Address</Label>
              <Textarea {...register('solicitorAddress')} />
            </div>
            <div>
              <Label htmlFor="solicitorRates">Rates</Label>
              <Input {...register('solicitorRates')} />
            </div>
          </div>
        )}
      </div>
    </FormSection>
  );

  const DataPrivacyStep = () => (
    <FormSection title="Data Privacy & Declaration" icon={<Shield className="h-5 w-5" />}>
      <div className="space-y-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Data Privacy</h3>
          <div className="text-sm space-y-2">
            <p>i. Your data will solemnly be used for the purposes of this business contract and also to enable us reach you with the updates about our products and services.</p>
            <p>ii. Please note that your personal data will be treated with utmost respect and is well secured as required by Nigeria Data Protection Regulations 2019.</p>
            <p>iii. Your personal data shall not be shared with or sold to any third-party without your consent unless we are compelled by law or regulator.</p>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Declaration</h3>
          <div className="text-sm space-y-2">
            <p>1. I/We declare to the best of my/our knowledge and belief that the information given on this form is true in every respect and agree that if I/we have made any false or fraudulent statement, be it suppression or concealment, the policy shall be cancelled and the claim shall be forfeited.</p>
            <p>2. I/We agree to provide additional information to NEM Insurance, if required.</p>
            <p>3. I/We agree to submit all required and requested for documents and NEM Insurance shall not be held responsible for any delay in settlement of claim due to non-fulfillment of requirements.</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox 
            id="declaration"
            checked={watchedValues.declarationAgreed}
            onCheckedChange={(checked) => setValue('declarationAgreed', !!checked)}
          />
          <Label htmlFor="declaration">I agree to the above declaration *</Label>
        </div>
        {errors.declarationAgreed && <p className="text-sm text-red-600">{errors.declarationAgreed.message}</p>}

        <div>
          <Label htmlFor="signature">Digital Signature *</Label>
          <Input {...register('signature')} placeholder="Type your full name as signature" />
          {errors.signature && <p className="text-sm text-red-600">{errors.signature.message}</p>}
        </div>

        <div>
          <Label>Date</Label>
          <Input value={new Date().toISOString().split('T')[0]} disabled />
        </div>
      </div>
    </FormSection>
  );

  const steps = [
    {
      id: 'policy',
      title: 'Policy Details',
      component: <PolicyDetailsStep />,
      isValid: !errors.policyNumber && !errors.coverageFromDate && !errors.coverageToDate
    },
    {
      id: 'insured',
      title: 'Insured Details',
      component: <InsuredDetailsStep />,
      isValid: !errors.insuredName && !errors.title && !errors.dateOfBirth && !errors.gender && !errors.address && !errors.phone && !errors.email
    },
    {
      id: 'claimant',
      title: 'Claimant Details',
      component: <ClaimantDetailsStep />,
      isValid: !errors.claimantName && !errors.claimantAddress
    },
    {
      id: 'retainer',
      title: 'Retainer/Contract Details',
      component: <RetainerDetailsStep />,
      isValid: !errors.retainerDetails && !errors.contractInWriting && !errors.workPerformedFrom && !errors.workPerformedTo
    },
    {
      id: 'claim',
      title: 'Claim Details',
      component: <ClaimDetailsStep />,
      isValid: !errors.claimNature && !errors.firstAwareDate && !errors.claimMadeDate && !errors.intimationMode && !errors.amountClaimed
    },
    {
      id: 'response',
      title: "Insured's Response",
      component: <ResponseStep />,
      isValid: !errors.responseComments && !errors.quantumComments && !errors.estimatedLiability && !errors.additionalInfo && !errors.solicitorInstructed
    },
    {
      id: 'declaration',
      title: 'Data Privacy & Declaration',
      component: <DataPrivacyStep />,
      isValid: !errors.declarationAgreed && !errors.signature && watchedValues.declarationAgreed
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
          onSubmit={handleSubmit(onSubmit)}
          isSubmitting={isSubmitting}
          submitButtonText="Review & Submit Claim"
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
                <Button onClick={handleFinalSubmit} disabled={isSubmitting}>
                  {isSubmitting ? 'Submitting...' : 'Submit Claim'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Success Dialog */}
        <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Claim Submitted Successfully!</DialogTitle>
            </DialogHeader>
            <div className="text-center space-y-4">
              <div className="text-green-600 text-6xl">✓</div>
              <p>Your professional indemnity claim has been submitted successfully.</p>
              <p className="text-sm text-gray-600">
                For claims status enquiries, call 01 448 9570
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

export default ProfessionalIndemnityClaimForm;
