
import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
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
import { FileText, User, Shield, Users, Plus, Trash2 } from 'lucide-react';

const publicLiabilitySchema = Yup.object({
  policyNumber: Yup.string().required('Policy number is required'),
  coverageFromDate: Yup.string().required('Coverage from date is required'),
  coverageToDate: Yup.string().required('Coverage to date is required'),
  companyName: Yup.string(),
  address: Yup.string().required('Address is required'),
  phone: Yup.string().required('Phone number is required'),
  email: Yup.string().email('Invalid email').required('Email is required'),
  accidentDate: Yup.string().required('Accident date is required'),
  accidentTime: Yup.string().required('Accident time is required'),
  accidentPlace: Yup.string().required('Place of accident is required'),
  accidentDetails: Yup.string().required('Accident details are required'),
  employeeActivity: Yup.string().required('Employee activity details are required'),
  responsiblePersonName: Yup.string().required('Responsible person name is required'),
  responsiblePersonAddress: Yup.string().required('Responsible person address is required'),
  policeInvolved: Yup.string().required('Please specify if police were involved'),
  otherInsurance: Yup.string().required('Please specify if you have other insurance'),
  claimantName: Yup.string().required('Claimant name is required'),
  claimantAddress: Yup.string().required('Claimant address is required'),
  injuryNature: Yup.string().required('Nature of injury is required'),
  claimNoticeReceived: Yup.string().required('Please specify if claim notice was received'),
  declarationAgreed: Yup.boolean().oneOf([true], 'You must agree to the declaration'),
  signature: Yup.string().required('Signature is required'),
});

interface Witness {
  name: string;
  address: string;
  isEmployee: 'employee' | 'independent';
}

interface PublicLiabilityClaimData {
  policyNumber: string;
  coverageFromDate: string;
  coverageToDate: string;
  companyName?: string;
  address: string;
  phone: string;
  email: string;
  accidentDate: string;
  accidentTime: string;
  accidentPlace: string;
  accidentDetails: string;
  witnesses: Witness[];
  employeeActivity: string;
  responsiblePersonName: string;
  responsiblePersonAddress: string;
  responsibleEmployer?: string;
  policeInvolved: 'yes' | 'no';
  policeStation?: string;
  officerNumber?: string;
  otherInsurance: 'yes' | 'no';
  otherInsuranceDetails?: string;
  claimantName: string;
  claimantAddress: string;
  injuryNature: string;
  claimNoticeReceived: 'yes' | 'no';
  noticeFrom?: string;
  noticeWhen?: string;
  noticeForm?: string;
  noticeDocument?: File;
  declarationAgreed: boolean;
  signature: string;
}

const PublicLiabilityClaimForm: React.FC = () => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const { register, handleSubmit, formState: { errors }, setValue, watch, control } = useForm<PublicLiabilityClaimData>({
    resolver: yupResolver(publicLiabilitySchema) as any,
    defaultValues: {
      email: user?.email || '',
      witnesses: [{ name: '', address: '', isEmployee: 'independent' }]
    }
  });

  const { fields: witnessFields, append: addWitness, remove: removeWitness } = useFieldArray({
    control,
    name: 'witnesses'
  });

  const { saveDraft } = useFormDraft('public-liability-claim', { setValue });
  const watchedValues = watch();

  useEffect(() => {
    const subscription = watch((value) => {
      saveDraft(value);
    });
    return () => subscription.unsubscribe();
  }, [watch, saveDraft]);

  const onSubmit = async (data: PublicLiabilityClaimData) => {
    setShowSummary(true);
  };

  const handleFinalSubmit = async () => {
    if (!user) return;
    
    setIsSubmitting(true);
    try {
      const submissionId = `claim_public_liability_${Date.now()}`;
      
      await setDoc(doc(db, 'submissions', submissionId), {
        id: submissionId,
        userId: user.uid,
        formType: 'public-liability-claim',
        claimType: 'public-liability',
        data: watchedValues,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      setShowSummary(false);
      setShowSuccess(true);
      
      toast({
        title: "Claim Submitted Successfully",
        description: "Your public liability claim has been submitted.",
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
          <Label htmlFor="companyName">Company Name</Label>
          <Input {...register('companyName')} />
        </div>
        <div></div>
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

  const LossDetailsStep = () => (
    <FormSection title="Details of Loss" icon={<FileText className="h-5 w-5" />}>
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="accidentDate">Date of Accident *</Label>
            <Input type="date" {...register('accidentDate')} />
            {errors.accidentDate && <p className="text-sm text-red-600">{errors.accidentDate.message}</p>}
          </div>
          <div>
            <Label htmlFor="accidentTime">Time of Accident *</Label>
            <Input type="time" {...register('accidentTime')} />
            {errors.accidentTime && <p className="text-sm text-red-600">{errors.accidentTime.message}</p>}
          </div>
        </div>
        
        <div>
          <Label htmlFor="accidentPlace">Place where accident occurred *</Label>
          <Input {...register('accidentPlace')} />
          {errors.accidentPlace && <p className="text-sm text-red-600">{errors.accidentPlace.message}</p>}
        </div>

        <div>
          <Label htmlFor="accidentDetails">Full details of how accident occurred *</Label>
          <Textarea {...register('accidentDetails')} rows={4} />
          {errors.accidentDetails && <p className="text-sm text-red-600">{errors.accidentDetails.message}</p>}
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <Label>Witnesses</Label>
            <Button
              type="button"
              onClick={() => addWitness({ name: '', address: '', isEmployee: 'independent' })}
              className="flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Add Witness</span>
            </Button>
          </div>
          
          {witnessFields.map((field, index) => (
            <div key={field.id} className="border p-4 rounded-lg space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Witness {index + 1}</h4>
                {witnessFields.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeWitness(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor={`witnesses.${index}.name`}>Name</Label>
                  <Input {...register(`witnesses.${index}.name` as const)} />
                </div>
                <div>
                  <Label htmlFor={`witnesses.${index}.isEmployee`}>Status</Label>
                  <Select
                    value={watchedValues.witnesses?.[index]?.isEmployee}
                    onValueChange={(value) => setValue(`witnesses.${index}.isEmployee` as const, value as 'employee' | 'independent')}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="employee">Employee</SelectItem>
                      <SelectItem value="independent">Independent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor={`witnesses.${index}.address`}>Address</Label>
                  <Textarea {...register(`witnesses.${index}.address` as const)} />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div>
          <Label htmlFor="employeeActivity">What were you or your employees doing? *</Label>
          <Textarea {...register('employeeActivity')} rows={3} />
          {errors.employeeActivity && <p className="text-sm text-red-600">{errors.employeeActivity.message}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="responsiblePersonName">Name of person who caused accident *</Label>
            <Input {...register('responsiblePersonName')} />
            {errors.responsiblePersonName && <p className="text-sm text-red-600">{errors.responsiblePersonName.message}</p>}
          </div>
          <div>
            <Label htmlFor="responsiblePersonAddress">Address of person who caused accident *</Label>
            <Textarea {...register('responsiblePersonAddress')} />
            {errors.responsiblePersonAddress && <p className="text-sm text-red-600">{errors.responsiblePersonAddress.message}</p>}
          </div>
        </div>

        <div>
          <Label htmlFor="responsibleEmployer">Name/address of that person's employer (if other than insured)</Label>
          <Textarea {...register('responsibleEmployer')} />
        </div>
      </div>
    </FormSection>
  );

  const PoliceInsuranceStep = () => (
    <FormSection title="Police and Other Insurances" icon={<Shield className="h-5 w-5" />}>
      <div className="space-y-4">
        <div>
          <Label>Were particulars taken by police? *</Label>
          <Select value={watchedValues.policeInvolved} onValueChange={(value) => setValue('policeInvolved', value as 'yes' | 'no')}>
            <SelectTrigger>
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="yes">Yes</SelectItem>
              <SelectItem value="no">No</SelectItem>
            </SelectContent>
          </Select>
          {errors.policeInvolved && <p className="text-sm text-red-600">{errors.policeInvolved.message}</p>}
        </div>

        {watchedValues.policeInvolved === 'yes' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="policeStation">Police Station</Label>
              <Input {...register('policeStation')} />
            </div>
            <div>
              <Label htmlFor="officerNumber">Officer Number</Label>
              <Input {...register('officerNumber')} />
            </div>
          </div>
        )}

        <div>
          <Label>Do you hold other policies covering this accident? *</Label>
          <Select value={watchedValues.otherInsurance} onValueChange={(value) => setValue('otherInsurance', value as 'yes' | 'no')}>
            <SelectTrigger>
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="yes">Yes</SelectItem>
              <SelectItem value="no">No</SelectItem>
            </SelectContent>
          </Select>
          {errors.otherInsurance && <p className="text-sm text-red-600">{errors.otherInsurance.message}</p>}
        </div>

        {watchedValues.otherInsurance === 'yes' && (
          <div>
            <Label htmlFor="otherInsuranceDetails">Other insurance details</Label>
            <Textarea {...register('otherInsuranceDetails')} rows={3} />
          </div>
        )}
      </div>
    </FormSection>
  );

  const ClaimantStep = () => (
    <FormSection title="Claimant" icon={<User className="h-5 w-5" />}>
      <div className="space-y-4">
        <div>
          <Label htmlFor="claimantName">Name *</Label>
          <Input {...register('claimantName')} />
          {errors.claimantName && <p className="text-sm text-red-600">{errors.claimantName.message}</p>}
        </div>
        
        <div>
          <Label htmlFor="claimantAddress">Address *</Label>
          <Textarea {...register('claimantAddress')} />
          {errors.claimantAddress && <p className="text-sm text-red-600">{errors.claimantAddress.message}</p>}
        </div>

        <div>
          <Label htmlFor="injuryNature">Nature of injury or damage *</Label>
          <Textarea {...register('injuryNature')} rows={3} />
          {errors.injuryNature && <p className="text-sm text-red-600">{errors.injuryNature.message}</p>}
        </div>

        <div>
          <Label>Have you received claim notice? *</Label>
          <Select value={watchedValues.claimNoticeReceived} onValueChange={(value) => setValue('claimNoticeReceived', value as 'yes' | 'no')}>
            <SelectTrigger>
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="yes">Yes</SelectItem>
              <SelectItem value="no">No</SelectItem>
            </SelectContent>
          </Select>
          {errors.claimNoticeReceived && <p className="text-sm text-red-600">{errors.claimNoticeReceived.message}</p>}
        </div>

        {watchedValues.claimNoticeReceived === 'yes' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="noticeFrom">From whom</Label>
                <Input {...register('noticeFrom')} />
              </div>
              <div>
                <Label htmlFor="noticeWhen">When</Label>
                <Input type="date" {...register('noticeWhen')} />
              </div>
            </div>
            <div>
              <Label htmlFor="noticeForm">In what form</Label>
              <Input {...register('noticeForm')} />
            </div>
            <FileUpload
              label="Notice Document (if written)"
              onFileSelect={(file) => setValue('noticeDocument', file)}
              currentFile={watchedValues.noticeDocument}
              accept=".pdf,.jpg,.png"
            />
          </div>
        )}
      </div>
    </FormSection>
  );

  const DeclarationStep = () => (
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
      isValid: !errors.address && !errors.phone && !errors.email
    },
    {
      id: 'loss',
      title: 'Details of Loss',
      component: <LossDetailsStep />,
      isValid: !errors.accidentDate && !errors.accidentTime && !errors.accidentPlace && !errors.accidentDetails
    },
    {
      id: 'police',
      title: 'Police and Other Insurances',
      component: <PoliceInsuranceStep />,
      isValid: !errors.policeInvolved && !errors.otherInsurance
    },
    {
      id: 'claimant',
      title: 'Claimant',
      component: <ClaimantStep />,
      isValid: !errors.claimantName && !errors.claimantAddress && !errors.injuryNature && !errors.claimNoticeReceived
    },
    {
      id: 'declaration',
      title: 'Data Privacy & Declaration',
      component: <DeclarationStep />,
      isValid: !errors.declarationAgreed && !errors.signature && watchedValues.declarationAgreed
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Public Liability Insurance Claim Form</h1>
          <p className="text-gray-600 mt-2">Submit your public liability insurance claim with all required details</p>
        </div>

        <MultiStepForm
          steps={steps}
          onSubmit={handleSubmit(onSubmit)}
          isSubmitting={isSubmitting}
          submitButtonText="Review & Submit Claim"
          formMethods={{ register, handleSubmit, formState: { errors }, setValue, watch, control }}
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
                <div><strong>Accident Date:</strong> {watchedValues.accidentDate}</div>
                <div><strong>Claimant Name:</strong> {watchedValues.claimantName}</div>
                <div><strong>Number of Witnesses:</strong> {watchedValues.witnesses?.length || 0}</div>
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
              <p>Your public liability claim has been submitted successfully.</p>
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

export default PublicLiabilityClaimForm;
