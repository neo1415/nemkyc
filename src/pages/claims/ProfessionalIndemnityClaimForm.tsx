import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useFormDraft } from '../../hooks/useFormDraft';
import { useToast } from '../../hooks/use-toast';

import MultiStepForm from '../../components/common/MultiStepForm';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Checkbox } from '../../components/ui/checkbox';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Badge } from '../../components/ui/badge';
import { Loader2 } from 'lucide-react';
import { Label } from '../../components/ui/label';

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
  contractDetails?: string;
  workPerformedFrom: string;
  workPerformedTo: string;
  workPerformerName: string;
  workPerformerTitle: string;
  workPerformerDuties: string;
  workPerformerContact: string;
  claimNature: string;
  firstAwareDate: string;
  claimMadeDate: string;
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
  signature: string;
}

const defaultValues: Partial<ProfessionalIndemnityClaimData> = {
  policyNumber: '',
  coverageFromDate: '',
  coverageToDate: '',
  insuredName: '',
  companyName: '',
  title: '',
  dateOfBirth: '',
  gender: '',
  address: '',
  phone: '',
  email: '',
  claimantName: '',
  claimantAddress: '',
  retainerDetails: '',
  contractInWriting: 'no',
  contractDetails: '',
  workPerformedFrom: '',
  workPerformedTo: '',
  workPerformerName: '',
  workPerformerTitle: '',
  workPerformerDuties: '',
  workPerformerContact: '',
  claimNature: '',
  firstAwareDate: '',
  claimMadeDate: '',
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
  signature: ''
};

const ProfessionalIndemnityClaimForm: React.FC = () => {
  const { toast } = useToast();
  const [showSummary, setShowSummary] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formMethods = useForm<ProfessionalIndemnityClaimData>({
    defaultValues,
    mode: 'onChange'
  });

  const { saveDraft, loadDraft, clearDraft } = useFormDraft('professional-indemnity-claim', formMethods);

  const watchedValues = formMethods.watch();

  useEffect(() => {
    const draft = loadDraft();
    if (draft) {
      Object.keys(draft).forEach((key) => {
        formMethods.setValue(key as keyof ProfessionalIndemnityClaimData, draft[key]);
      });
    }
  }, [formMethods, loadDraft]);

  useEffect(() => {
    const subscription = formMethods.watch((data) => {
      saveDraft(data);
    });
    return () => subscription.unsubscribe();
  }, [formMethods, saveDraft]);

  const handleSubmit = async (data: ProfessionalIndemnityClaimData) => {
    setIsSubmitting(true);
    try {
      // Save to Firestore
      const docRef = await addDoc(collection(db, 'professionalIndemnityClaimsTable'), {
        ...data,
        submittedAt: new Date(),
        status: 'submitted'
      });

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
    setShowSummary(true);
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
              <Label htmlFor="coverageFromDate">Period of Cover - From *</Label>
              <Input
                id="coverageFromDate"
                type="date"
                {...formMethods.register('coverageFromDate')}
              />
            </div>
            <div>
              <Label htmlFor="coverageToDate">Period of Cover - To *</Label>
              <Input
                id="coverageToDate"
                type="date"
                {...formMethods.register('coverageToDate')}
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
              <Label htmlFor="dateOfBirth">Date of Birth *</Label>
              <Input
                id="dateOfBirth"
                type="date"
                {...formMethods.register('dateOfBirth')}
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

        {/* Success Modal */}
        <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-center text-green-600">
                Claim Submitted Successfully!
              </DialogTitle>
            </DialogHeader>
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p>Your professional indemnity claim has been submitted successfully.</p>
              <p className="text-sm text-muted-foreground">
                You will receive a confirmation email shortly with your claim reference number.
              </p>
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm">
                  <strong>For claims status enquiries, call 01 448 9570</strong>
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setShowSuccess(false)} className="w-full">
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default ProfessionalIndemnityClaimForm;