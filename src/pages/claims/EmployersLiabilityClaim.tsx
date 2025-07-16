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
  phone: string;
}

interface EarningsMonth {
  monthEnding: string;
  wagesAndBonus: number;
  monthlyAllowances: number;
}

interface EmployersLiabilityClaimData {
  // Policy Details
  policyNumber: string;
  periodOfCoverFrom: string;
  periodOfCoverTo: string;

  // Insured Details
  name: string;
  address: string;
  phone: string;
  email: string;

  // Injured Party Details
  injuredPartyName: string;
  injuredPartyAge: number;
  injuredPartyAddress: string;
  averageMonthlyEarnings: number;
  occupation: string;
  dateOfEmployment: string;
  maritalStatus: string;
  numberOfChildren: number;
  agesOfChildren?: string;
  previousAccidents: string;
  previousAccidentsDetails?: string;

  // Injury Details
  natureOfInjuries: string;
  machineryInvolved?: string;
  supervisorName?: string;
  supervisorPosition?: string;

  // Accident Details
  accidentDate: string;
  accidentTime: string;
  accidentPlace: string;
  dateReported: string;
  reportedBy: string;
  dateStoppedWork: string;
  workDescription: string;
  howAccidentOccurred: string;
  soberOrIntoxicated: string;

  // Medical
  receivingTreatment: string;
  hospitalName?: string;
  hospitalAddress?: string;
  doctorName?: string;
  doctorAddress?: string;

  // Disablement
  totallyDisabled: string;
  dateStoppedWorking?: string;
  estimatedDuration?: string;
  ableToDoAnyDuties: string;
  dutiesDetails?: string;
  claimMadeOnYou: string;

  // Witnesses
  witnesses: Witness[];

  // Other Insurers
  otherInsurerName?: string;
  otherInsurerAddress?: string;
  otherInsurerPolicyNumber?: string;

  // Statement of Earnings
  earnings: EarningsMonth[];

  // Declaration
  agreeToDataPrivacy: boolean;
  signature: string;
}

const defaultValues: Partial<EmployersLiabilityClaimData> = {
  policyNumber: '',
  periodOfCoverFrom: '',
  periodOfCoverTo: '',
  name: '',
  address: '',
  phone: '',
  email: '',
  injuredPartyName: '',
  injuredPartyAge: 0,
  injuredPartyAddress: '',
  averageMonthlyEarnings: 0,
  occupation: '',
  dateOfEmployment: '',
  maritalStatus: '',
  numberOfChildren: 0,
  agesOfChildren: '',
  previousAccidents: '',
  natureOfInjuries: '',
  machineryInvolved: '',
  supervisorName: '',
  supervisorPosition: '',
  accidentDate: '',
  accidentTime: '',
  accidentPlace: '',
  dateReported: '',
  reportedBy: '',
  dateStoppedWork: '',
  workDescription: '',
  howAccidentOccurred: '',
  soberOrIntoxicated: '',
  receivingTreatment: '',
  hospitalName: '',
  hospitalAddress: '',
  doctorName: '',
  doctorAddress: '',
  totallyDisabled: '',
  dateStoppedWorking: '',
  estimatedDuration: '',
  ableToDoAnyDuties: '',
  dutiesDetails: '',
  claimMadeOnYou: '',
  witnesses: [],
  otherInsurerName: '',
  otherInsurerAddress: '',
  otherInsurerPolicyNumber: '',
  earnings: Array.from({ length: 12 }, (_, i) => ({
    monthEnding: '',
    wagesAndBonus: 0,
    monthlyAllowances: 0
  })),
  agreeToDataPrivacy: false,
  signature: ''
};

const EmployersLiabilityClaim: React.FC = () => {
  const { toast } = useToast();
  const [showSummary, setShowSummary] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formMethods = useForm<EmployersLiabilityClaimData>({
    defaultValues,
    mode: 'onChange'
  });

  const { fields: witnessFields, append: appendWitness, remove: removeWitness } = useFieldArray({
    control: formMethods.control,
    name: 'witnesses'
  });

  const { saveDraft, loadDraft, clearDraft } = useFormDraft('employers-liability-claim', formMethods);

  const watchedValues = formMethods.watch();

  useEffect(() => {
    const draft = loadDraft();
    if (draft) {
      Object.keys(draft).forEach((key) => {
        formMethods.setValue(key as keyof EmployersLiabilityClaimData, draft[key]);
      });
    }
  }, [formMethods, loadDraft]);

  useEffect(() => {
    const subscription = formMethods.watch((data) => {
      saveDraft(data);
    });
    return () => subscription.unsubscribe();
  }, [formMethods, saveDraft]);

  const handleSubmit = async (data: EmployersLiabilityClaimData) => {
    setIsSubmitting(true);
    try {
      // Save to Firestore
      const docRef = await addDoc(collection(db, 'employersLiabilityClaimsTable'), {
        ...data,
        submittedAt: new Date(),
        status: 'submitted'
      });

      clearDraft();
      setShowSummary(false);
      setShowSuccess(true);
      
      toast({
        title: "Claim Submitted Successfully",
        description: "Your employers liability claim has been submitted and you'll receive a confirmation email shortly.",
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

  const onFinalSubmit = (data: EmployersLiabilityClaimData) => {
    setShowSummary(true);
  };

  const addWitness = () => {
    appendWitness({ name: '', address: '', phone: '' });
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
              <Label htmlFor="periodOfCoverFrom">Period of Cover From *</Label>
              <Input
                id="periodOfCoverFrom"
                type="date"
                {...formMethods.register('periodOfCoverFrom')}
              />
            </div>
            <div>
              <Label htmlFor="periodOfCoverTo">Period of Cover To *</Label>
              <Input
                id="periodOfCoverTo"
                type="date"
                {...formMethods.register('periodOfCoverTo')}
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
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              {...formMethods.register('name')}
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
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                {...formMethods.register('phone')}
              />
            </div>
            <div>
              <Label htmlFor="email">Email Address *</Label>
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
      id: 'witnesses',
      title: 'Witness Information',
      component: (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Witnesses to the Accident</h3>
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
                  <Label htmlFor={`witnesses.${index}.name`}>Name *</Label>
                  <Input
                    {...formMethods.register(`witnesses.${index}.name`)}
                    placeholder="Enter witness name"
                  />
                </div>
                <div>
                  <Label htmlFor={`witnesses.${index}.phone`}>Phone *</Label>
                  <Input
                    {...formMethods.register(`witnesses.${index}.phone`)}
                    placeholder="Enter witness phone"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor={`witnesses.${index}.address`}>Address *</Label>
                  <Textarea
                    {...formMethods.register(`witnesses.${index}.address`)}
                    placeholder="Enter witness address"
                    rows={2}
                  />
                </div>
              </div>
            </div>
          ))}
          
          {witnessFields.length === 0 && (
            <div className="text-center p-8 text-gray-500">
              No witnesses added yet. Click "Add Witness" to add witness information.
            </div>
          )}
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
              Employers Liability Insurance Claim Form
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
              <DialogTitle>Review Your Employers Liability Claim Submission</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><strong>Policy Number:</strong> {watchedValues.policyNumber}</div>
                <div><strong>Name:</strong> {watchedValues.name}</div>
                <div><strong>Email:</strong> {watchedValues.email}</div>
                <div><strong>Injured Party:</strong> {watchedValues.injuredPartyName}</div>
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
                <p>Your employers liability claim has been submitted successfully.</p>
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

export default EmployersLiabilityClaim;
