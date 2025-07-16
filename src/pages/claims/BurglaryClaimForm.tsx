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

interface BurglaryPropertyItem {
  description: string;
  costPrice: number;
  dateOfPurchase: string;
  estimatedValue: number;
  netAmountClaimed: number;
}

interface BurglaryClaimData {
  // Policy Details
  policyNumber: string;
  periodOfCoverFrom: string;
  periodOfCoverTo: string;

  // Insured Details
  nameOfInsured: string;
  companyName?: string;
  title: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  phone: string;
  email: string;

  // Details of Loss
  premisesAddress: string;
  premisesTelephone: string;
  dateOfTheft: string;
  timeOfTheft: string;
  howEntryEffected: string;
  roomsEntered: string;
  premisesOccupied: boolean;
  lastOccupiedDate?: string;
  suspicions: boolean;
  suspicionName?: string;
  policeInformed: boolean;
  policeDate?: string;
  policeStation?: string;
  soleOwner: boolean;
  ownerDetails?: string;
  otherInsurance: boolean;
  otherInsurerDetails?: string;
  totalContentsValue: number;
  sumInsuredFirePolicy: number;
  fireInsurerName: string;
  fireInsurerAddress: string;
  previousLoss: boolean;
  previousLossDetails?: string;

  // Property Items
  propertyItems: BurglaryPropertyItem[];

  // Declaration
  agreeToDataPrivacy: boolean;
  signature: string;
}

const defaultValues: Partial<BurglaryClaimData> = {
  policyNumber: '',
  periodOfCoverFrom: '',
  periodOfCoverTo: '',
  nameOfInsured: '',
  companyName: '',
  title: '',
  dateOfBirth: '',
  address: '',
  phone: '',
  email: '',
  gender: '',
  premisesAddress: '',
  premisesTelephone: '',
  dateOfTheft: '',
  timeOfTheft: '',
  howEntryEffected: '',
  roomsEntered: '',
  premisesOccupied: false,
  suspicions: false,
  policeInformed: false,
  policeDate: '',
  soleOwner: false,
  otherInsurance: false,
  totalContentsValue: 0,
  sumInsuredFirePolicy: 0,
  fireInsurerName: '',
  fireInsurerAddress: '',
  previousLoss: false,
  propertyItems: [],
  agreeToDataPrivacy: false,
  signature: ''
};

const BurglaryClaimForm: React.FC = () => {
  const { toast } = useToast();
  const [showSummary, setShowSummary] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formMethods = useForm<BurglaryClaimData>({
    defaultValues,
    mode: 'onChange'
  });

  const { fields: propertyFields, append: appendProperty, remove: removeProperty } = useFieldArray({
    control: formMethods.control,
    name: 'propertyItems'
  });

  const { saveDraft, loadDraft, clearDraft } = useFormDraft('burglary-claim-form', formMethods);

  const watchedValues = formMethods.watch();

  useEffect(() => {
    const draft = loadDraft();
    if (draft) {
      Object.keys(draft).forEach((key) => {
        formMethods.setValue(key as keyof BurglaryClaimData, draft[key]);
      });
    }
  }, [formMethods, loadDraft]);

  useEffect(() => {
    const subscription = formMethods.watch((data) => {
      saveDraft(data);
    });
    return () => subscription.unsubscribe();
  }, [formMethods, saveDraft]);

  const handleSubmit = async (data: BurglaryClaimData) => {
    setIsSubmitting(true);
    try {
      // Save to Firestore
      const docRef = await addDoc(collection(db, 'burglaryClaimsTable'), {
        ...data,
        submittedAt: new Date(),
        status: 'submitted'
      });

      clearDraft();
      setShowSummary(false);
      setShowSuccess(true);
      
      toast({
        title: "Claim Submitted Successfully",
        description: "Your burglary claim has been submitted and you'll receive a confirmation email shortly.",
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

  const onFinalSubmit = (data: BurglaryClaimData) => {
    setShowSummary(true);
  };

  const addProperty = () => {
    appendProperty({ description: '', costPrice: 0, dateOfPurchase: '', estimatedValue: 0, netAmountClaimed: 0 });
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="nameOfInsured">Name of Insured *</Label>
              <Input
                id="nameOfInsured"
                {...formMethods.register('nameOfInsured')}
              />
            </div>
            
            <div>
              <Label htmlFor="companyName">Company Name (Optional)</Label>
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
      id: 'loss',
      title: 'Details of Loss',
      component: (
        <div className="space-y-6">
          <div>
            <Label htmlFor="premisesAddress">Address of premises *</Label>
            <Textarea
              id="premisesAddress"
              {...formMethods.register('premisesAddress')}
              placeholder="Enter the address where the theft occurred"
            />
          </div>
          
          <div>
            <Label htmlFor="premisesTelephone">Telephone number of premises *</Label>
            <Input
              id="premisesTelephone"
              {...formMethods.register('premisesTelephone')}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="dateOfTheft">Date of theft *</Label>
              <Input
                id="dateOfTheft"
                type="date"
                {...formMethods.register('dateOfTheft')}
              />
            </div>
            <div>
              <Label htmlFor="timeOfTheft">Time of theft *</Label>
              <Input
                id="timeOfTheft"
                type="time"
                {...formMethods.register('timeOfTheft')}
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="howEntryEffected">How was entry effected? *</Label>
            <Textarea
              id="howEntryEffected"
              {...formMethods.register('howEntryEffected')}
              placeholder="Describe how the thieves gained entry"
              rows={3}
            />
          </div>
          
          <div>
            <Label htmlFor="roomsEntered">Which rooms were entered? *</Label>
            <Textarea
              id="roomsEntered"
              {...formMethods.register('roomsEntered')}
              placeholder="List all rooms that were entered"
              rows={2}
            />
          </div>
        </div>
      )
    },
    {
      id: 'property',
      title: 'Property Items',
      component: (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Property Stolen or Damaged</h3>
            <Button type="button" onClick={addProperty} variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </div>
          
          {propertyFields.map((field, index) => (
            <div key={field.id} className="border p-4 rounded-lg space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-medium">Item {index + 1}</h4>
                <Button
                  type="button"
                  onClick={() => removeProperty(index)}
                  variant="ghost"
                  size="sm"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor={`propertyItems.${index}.description`}>Description *</Label>
                  <Textarea
                    {...formMethods.register(`propertyItems.${index}.description`)}
                    placeholder="Describe the item in detail"
                  />
                </div>
                <div>
                  <Label htmlFor={`propertyItems.${index}.costPrice`}>Cost Price *</Label>
                  <Input
                    type="number"
                    {...formMethods.register(`propertyItems.${index}.costPrice`, { valueAsNumber: true })}
                  />
                </div>
                <div>
                  <Label htmlFor={`propertyItems.${index}.dateOfPurchase`}>Date of Purchase *</Label>
                  <Input
                    type="date"
                    {...formMethods.register(`propertyItems.${index}.dateOfPurchase`)}
                  />
                </div>
                <div>
                  <Label htmlFor={`propertyItems.${index}.estimatedValue`}>Estimated Value *</Label>
                  <Input
                    type="number"
                    {...formMethods.register(`propertyItems.${index}.estimatedValue`, { valueAsNumber: true })}
                  />
                </div>
                <div>
                  <Label htmlFor={`propertyItems.${index}.netAmountClaimed`}>Net Amount Claimed *</Label>
                  <Input
                    type="number"
                    {...formMethods.register(`propertyItems.${index}.netAmountClaimed`, { valueAsNumber: true })}
                  />
                </div>
              </div>
            </div>
          ))}
          
          {propertyFields.length === 0 && (
            <div className="text-center p-8 text-gray-500">
              No property items added yet. Click "Add Item" to add stolen or damaged items.
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
              Burglary Insurance Claim Form
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
              <DialogTitle>Review Your Burglary Claim Submission</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><strong>Policy Number:</strong> {watchedValues.policyNumber}</div>
                <div><strong>Insured:</strong> {watchedValues.nameOfInsured}</div>
                <div><strong>Email:</strong> {watchedValues.email}</div>
                <div><strong>Date of Theft:</strong> {watchedValues.dateOfTheft}</div>
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
                <p>Your burglary claim has been submitted successfully.</p>
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

export default BurglaryClaimForm;