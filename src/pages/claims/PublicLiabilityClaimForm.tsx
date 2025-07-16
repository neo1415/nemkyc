import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
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
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { Label } from '../../components/ui/label';

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
  policeInvolved: string;
  policeStation?: string;
  officerNumber?: string;
  otherInsurance: string;
  otherInsuranceDetails?: string;
  claimantName: string;
  claimantAddress: string;
  injuryNature: string;
  claimNoticeReceived: string;
  noticeFrom?: string;
  noticeWhen?: string;
  noticeForm?: string;
  agreeToDataPrivacy: boolean;
  signature: string;
}

const defaultValues: Partial<PublicLiabilityClaimData> = {
  policyNumber: '',
  coverageFromDate: '',
  coverageToDate: '',
  companyName: '',
  address: '',
  phone: '',
  email: '',
  accidentDate: '',
  accidentTime: '',
  accidentPlace: '',
  accidentDetails: '',
  witnesses: [{ name: '', address: '', isEmployee: 'independent' }],
  employeeActivity: '',
  responsiblePersonName: '',
  responsiblePersonAddress: '',
  responsibleEmployer: '',
  policeInvolved: 'no',
  policeStation: '',
  officerNumber: '',
  otherInsurance: 'no',
  otherInsuranceDetails: '',
  claimantName: '',
  claimantAddress: '',
  injuryNature: '',
  claimNoticeReceived: 'no',
  noticeFrom: '',
  noticeWhen: '',
  noticeForm: '',
  agreeToDataPrivacy: false,
  signature: ''
};

const PublicLiabilityClaimForm: React.FC = () => {
  const { toast } = useToast();
  const [showSummary, setShowSummary] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formMethods = useForm<PublicLiabilityClaimData>({
    defaultValues,
    mode: 'onChange'
  });

  const { fields: witnessFields, append: appendWitness, remove: removeWitness } = useFieldArray({
    control: formMethods.control,
    name: 'witnesses'
  });

  const { saveDraft, loadDraft, clearDraft } = useFormDraft('public-liability-claim', formMethods);

  const watchedValues = formMethods.watch();

  useEffect(() => {
    const draft = loadDraft();
    if (draft) {
      Object.keys(draft).forEach((key) => {
        formMethods.setValue(key as keyof PublicLiabilityClaimData, draft[key]);
      });
    }
  }, [formMethods, loadDraft]);

  useEffect(() => {
    const subscription = formMethods.watch((data) => {
      saveDraft(data);
    });
    return () => subscription.unsubscribe();
  }, [formMethods, saveDraft]);

  const handleSubmit = async (data: PublicLiabilityClaimData) => {
    setIsSubmitting(true);
    try {
      // Save to Firestore
      const docRef = await addDoc(collection(db, 'publicLiabilityClaimsTable'), {
        ...data,
        submittedAt: new Date(),
        status: 'submitted'
      });

      clearDraft();
      setShowSummary(false);
      setShowSuccess(true);
      
      toast({
        title: "Claim Submitted Successfully",
        description: "Your public liability claim has been submitted and you'll receive a confirmation email shortly.",
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

  const onFinalSubmit = (data: PublicLiabilityClaimData) => {
    setShowSummary(true);
  };

  const addWitness = () => {
    appendWitness({ name: '', address: '', isEmployee: 'independent' });
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
          <div>
            <Label htmlFor="companyName">Company Name (if applicable)</Label>
            <Input
              id="companyName"
              {...formMethods.register('companyName')}
            />
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
      id: 'loss',
      title: 'Details of Loss',
      component: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="accidentDate">Date of Accident *</Label>
              <Input
                id="accidentDate"
                type="date"
                {...formMethods.register('accidentDate')}
              />
            </div>
            <div>
              <Label htmlFor="accidentTime">Time of Accident *</Label>
              <Input
                id="accidentTime"
                type="time"
                {...formMethods.register('accidentTime')}
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="accidentPlace">Place where accident occurred *</Label>
            <Input
              id="accidentPlace"
              {...formMethods.register('accidentPlace')}
            />
          </div>
          
          <div>
            <Label htmlFor="accidentDetails">Full details of how accident occurred *</Label>
            <Textarea
              id="accidentDetails"
              {...formMethods.register('accidentDetails')}
              rows={4}
            />
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-4">
              <Label>Names & addresses of all witnesses</Label>
              <Button type="button" onClick={addWitness} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Witness
              </Button>
            </div>
            
            {witnessFields.map((field, index) => (
              <div key={field.id} className="border p-4 rounded-lg space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium">Witness {index + 1}</h4>
                  <Button
                    type="button"
                    onClick={() => removeWitness(index)}
                    variant="ghost"
                    size="sm"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor={`witnesses.${index}.name`}>Name</Label>
                    <Input {...formMethods.register(`witnesses.${index}.name` as const)} />
                  </div>
                  <div>
                    <Label htmlFor={`witnesses.${index}.isEmployee`}>Is employee or independent?</Label>
                    <Select
                      value={watchedValues.witnesses?.[index]?.isEmployee || ''}
                      onValueChange={(value) => formMethods.setValue(`witnesses.${index}.isEmployee` as const, value as 'employee' | 'independent')}
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
                    <Textarea {...formMethods.register(`witnesses.${index}.address` as const)} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )
    },
    {
      id: 'declaration',
      title: 'Declaration',
      component: (
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Data Privacy Notice</h3>
            <div className="prose prose-sm max-w-none">
              <p><strong>i.</strong> Your data will solemnly be used for the purposes of this business contract and also to enable us reach you with the updates about our products and services.</p>
              <p><strong>ii.</strong> Please note that your personal data will be treated with utmost respect and is well secured as required by Nigeria Data Protection Regulations 2019.</p>
              <p><strong>iii.</strong> Your personal data shall not be shared with or sold to any third-party without your consent unless we are compelled by law or regulator.</p>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Declaration</h3>
            <div className="prose prose-sm max-w-none mb-6">
              <p><strong>1.</strong> I/We declare to the best of my/our knowledge and belief that the information given on this form is true in every respect and agree that if I/we have made any false or fraudulent statement, be it suppression or concealment, the policy shall be cancelled and the claim shall be forfeited.</p>
              <p><strong>2.</strong> I/We agree to provide additional information to NEM Insurance, if required.</p>
              <p><strong>3.</strong> I/We agree to submit all required and requested for documents and NEM Insurance shall not be held responsible for any delay in settlement of claim due to non-fulfillment of requirements.</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="agreeToDataPrivacy"
                  checked={watchedValues.agreeToDataPrivacy}
                  onCheckedChange={(checked) => formMethods.setValue('agreeToDataPrivacy', !!checked)}
                />
                <Label htmlFor="agreeToDataPrivacy">
                  I agree to the data privacy notice and declaration above *
                </Label>
              </div>

              <div>
                <Label htmlFor="signature">Digital Signature *</Label>
                <Input
                  id="signature"
                  {...formMethods.register('signature')}
                  placeholder="Type your full name as signature"
                />
              </div>

              <div>
                <Label>Date</Label>
                <Input
                  type="date"
                  value={new Date().toISOString().split('T')[0]}
                  disabled
                />
              </div>
            </div>
          </Card>
        </div>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Public Liability Insurance Claim Form
            </h1>
            <p className="text-muted-foreground">
              Please fill out all required information to submit your claim
            </p>
          </div>

        <MultiStepForm
          steps={steps}
          onSubmit={onFinalSubmit}
          isSubmitting={isSubmitting}
          submitButtonText="Review Claim"
          formMethods={formMethods}
        />

        {/* Summary Dialog */}
        <Dialog open={showSummary} onOpenChange={setShowSummary}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Review Your Public Liability Claim Submission</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><strong>Policy Number:</strong> {watchedValues.policyNumber}</div>
                <div><strong>Company:</strong> {watchedValues.companyName}</div>
                <div><strong>Email:</strong> {watchedValues.email}</div>
                <div><strong>Accident Date:</strong> {watchedValues.accidentDate}</div>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-blue-800">
                  For claims status enquiries, call 01 448 9570
                </p>
              </div>
            </div>
            <DialogFooter>
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
                  'Submit Claim'
                )}
              </Button>
            </DialogFooter>
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
                <p>Your public liability claim has been submitted successfully.</p>
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
    </div>
  );
};

export default PublicLiabilityClaimForm;