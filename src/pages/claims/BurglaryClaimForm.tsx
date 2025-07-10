import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useAuth } from '../../contexts/AuthContext';
import { burglaryClaimSchema } from '../../utils/validation';
import { BurglaryClaimData } from '../../types';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Checkbox } from '../../components/ui/checkbox';
import { toast } from '../../components/ui/use-toast';
import { Badge } from '../../components/ui/badge';
import { doc, setDoc, collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../firebase/config';
import { notifySubmission } from '../../services/notificationService';
import AuthRequiredSubmit from '../../components/common/AuthRequiredSubmit';
import PhoneInput from '../../components/common/PhoneInput';
import MultiStepForm from '../../components/common/MultiStepForm';
import { Shield, FileText, Home, Plus, Trash2, Upload, Check, DollarSign, X, Lock } from 'lucide-react';
import { useFormDraft } from '../../hooks/useFormDraft';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../components/ui/dialog';

const BurglaryClaimForm: React.FC = () => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [submittedData, setSubmittedData] = useState<BurglaryClaimData | null>(null);

  const formMethods = useForm({
    resolver: yupResolver(burglaryClaimSchema),
    defaultValues: {
      policyNumber: '',
      periodOfCoverFrom: '',
      periodOfCoverTo: '',
      nameOfInsured: '',
      companyName: '',
      title: '',
      dateOfBirth: '',
      gender: '',
      address: '',
      phone: '',
      email: user?.email || '',
      premisesAddress: '',
      premisesTelephone: '',
      dateOfTheft: '',
      timeOfTheft: '',
      howEntryEffected: '',
      roomsEntered: '',
      premisesOccupied: false,
      lastOccupiedDateTime: '',
      suspicionOnAnyone: false,
      suspicionName: '',
      policeInformed: false,
      policeDate: '',
      policeStation: '',
      firePolicyNumber: '',
      soleOwner: true,
      ownerName: '',
      ownerAddress: '',
      otherInsurance: false,
      otherInsurerDetails: '',
      totalContentsValue: 0,
      sumInsuredFirePolicy: 0,
      firePolicyInsurerName: '',
      firePolicyInsurerAddress: '',
      previousBurglaryLoss: false,
      previousLossExplanation: '',
      propertyItems: [{ description: '', costPrice: 0, purchaseDate: '', estimatedValue: 0, netAmountClaimed: 0 }],
      agreeToDataPrivacy: false,
      signature: ''
    },
    mode: 'onChange'
  });

  const { register, handleSubmit, formState: { errors }, setValue, watch } = formMethods;
  
  const { fields, append, remove } = useFieldArray({
    control: formMethods.control,
    name: 'propertyItems'
  });

  const watchedValues = formMethods.watch();

  // Save draft to localStorage with 7-day expiry
  const { saveDraft } = useFormDraft('burglary-claim', formMethods);

  React.useEffect(() => {
    const subscription = formMethods.watch((data) => {
      saveDraft(data);
    });
    return () => subscription.unsubscribe();
  }, [formMethods, saveDraft]);

  const addPropertyItem = () => {
    append({ description: '', costPrice: 0, purchaseDate: '', estimatedValue: 0, netAmountClaimed: 0 });
  };

  const removePropertyItem = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  const onSubmit = async (data: BurglaryClaimData) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    setShowSummary(true);
    setSubmittedData(data);
  };

  const handleFinalSubmit = async () => {
    if (!submittedData || !user) return;
    
    setIsSubmitting(true);
    setShowSummary(false);
    
    try {
      const submissionId = `claim_burglary_${Date.now()}`;
      
      // Save to Firestore
      await setDoc(doc(db, 'submissions', submissionId), {
        id: submissionId,
        userId: user.uid,
        formType: 'burglary-claim',
        data: submittedData,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Send notification
      await notifySubmission(user, 'Burglary Claim');
      
      setShowSuccess(true);

      toast({
        title: "Claim Submitted Successfully",
        description: "Your burglary claim has been submitted and is being processed.",
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

  const steps = [
    {
      id: 'policy',
      title: 'Policy Details',
      component: (
        <div className="space-y-6">
          <div>
            <Label htmlFor="policyNumber">Policy Number *</Label>
            <Input
              id="policyNumber"
              {...register('policyNumber')}
              placeholder="Enter policy number"
            />
            {errors.policyNumber && <p className="text-sm text-red-600">{errors.policyNumber.message}</p>}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="periodOfCoverFrom">Period of Cover From *</Label>
              <Input
                id="periodOfCoverFrom"
                type="date"
                {...register('periodOfCoverFrom')}
              />
              {errors.periodOfCoverFrom && <p className="text-sm text-red-600">{errors.periodOfCoverFrom.message}</p>}
            </div>
            
            <div>
              <Label htmlFor="periodOfCoverTo">Period of Cover To *</Label>
              <Input
                id="periodOfCoverTo"
                type="date"
                {...register('periodOfCoverTo')}
              />
              {errors.periodOfCoverTo && <p className="text-sm text-red-600">{errors.periodOfCoverTo.message}</p>}
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'insured',
      title: 'Insured Details',
      component: (
        <div className="space-y-6">
          <div>
            <Label htmlFor="nameOfInsured">Name of Insured *</Label>
            <Input
              id="nameOfInsured"
              {...register('nameOfInsured')}
              placeholder="Enter name of insured"
            />
            {errors.nameOfInsured && <p className="text-sm text-red-600">{errors.nameOfInsured.message}</p>}
          </div>
          
          <div>
            <Label htmlFor="companyName">Company Name (Optional)</Label>
            <Input
              id="companyName"
              {...register('companyName')}
              placeholder="Enter company name"
            />
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Title *</Label>
              <Select
                value={watchedValues.title}
                onValueChange={(value) => setValue('title', value)}
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
              {errors.title && <p className="text-sm text-red-600">{errors.title.message}</p>}
            </div>
            
            <div>
              <Label htmlFor="dateOfBirth">Date of Birth *</Label>
              <Input
                id="dateOfBirth"
                type="date"
                {...register('dateOfBirth')}
              />
              {errors.dateOfBirth && <p className="text-sm text-red-600">{errors.dateOfBirth.message}</p>}
            </div>
            
            <div>
              <Label>Gender *</Label>
              <Select
                value={watchedValues.gender}
                onValueChange={(value) => setValue('gender', value)}
              >
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
          </div>
          
          <div>
            <Label htmlFor="address">Address *</Label>
            <Textarea
              id="address"
              {...register('address')}
              placeholder="Enter full address"
            />
            {errors.address && <p className="text-sm text-red-600">{errors.address.message}</p>}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                {...register('phone')}
                placeholder="Enter phone number"
              />
              {errors.phone && <p className="text-sm text-red-600">{errors.phone.message}</p>}
            </div>
            
            <div>
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                placeholder="Enter email address"
              />
              {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
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
            <Label htmlFor="premisesAddress">Full Address of Premises Involved *</Label>
            <Textarea
              id="premisesAddress"
              {...register('premisesAddress')}
              placeholder="Enter premises address"
            />
            {errors.premisesAddress && <p className="text-sm text-red-600">{errors.premisesAddress.message}</p>}
          </div>
          
          <div>
            <Label htmlFor="premisesTelephone">Premises Telephone *</Label>
            <Input
              id="premisesTelephone"
              {...register('premisesTelephone')}
              placeholder="Enter premises telephone"
            />
            {errors.premisesTelephone && <p className="text-sm text-red-600">{errors.premisesTelephone.message}</p>}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="dateOfTheft">Date of Theft *</Label>
              <Input
                id="dateOfTheft"
                type="date"
                {...register('dateOfTheft')}
              />
              {errors.dateOfTheft && <p className="text-sm text-red-600">{errors.dateOfTheft.message}</p>}
            </div>
            
            <div>
              <Label htmlFor="timeOfTheft">Time of Theft *</Label>
              <Input
                id="timeOfTheft"
                type="time"
                {...register('timeOfTheft')}
              />
              {errors.timeOfTheft && <p className="text-sm text-red-600">{errors.timeOfTheft.message}</p>}
            </div>
          </div>
          
          <div>
            <Label htmlFor="howEntryEffected">How Entry was Effected *</Label>
            <Textarea
              id="howEntryEffected"
              {...register('howEntryEffected')}
              placeholder="Describe how entry was effected"
            />
            {errors.howEntryEffected && <p className="text-sm text-red-600">{errors.howEntryEffected.message}</p>}
          </div>
          
          <div>
            <Label htmlFor="roomsEntered">Rooms Entered *</Label>
            <Textarea
              id="roomsEntered"
              {...register('roomsEntered')}
              placeholder="List rooms that were entered"
            />
            {errors.roomsEntered && <p className="text-sm text-red-600">{errors.roomsEntered.message}</p>}
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="premisesOccupied"
              checked={watchedValues.premisesOccupied}
              onCheckedChange={(checked) => setValue('premisesOccupied', checked as boolean)}
            />
            <Label htmlFor="premisesOccupied">Premises occupied at time of loss?</Label>
          </div>
          
          {!watchedValues.premisesOccupied && (
            <div className="ml-6">
              <Label htmlFor="lastOccupiedDateTime">Last Occupied Date & Time *</Label>
              <Input
                id="lastOccupiedDateTime"
                type="datetime-local"
                {...register('lastOccupiedDateTime')}
              />
            </div>
          )}
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="suspicionOnAnyone"
              checked={watchedValues.suspicionOnAnyone}
              onCheckedChange={(checked) => setValue('suspicionOnAnyone', checked as boolean)}
            />
            <Label htmlFor="suspicionOnAnyone">Suspicions on anyone?</Label>
          </div>
          
          {watchedValues.suspicionOnAnyone && (
            <div className="ml-6">
              <Label htmlFor="suspicionName">Name of Suspected Person *</Label>
              <Input
                id="suspicionName"
                {...register('suspicionName')}
                placeholder="Enter name of suspected person"
              />
            </div>
          )}
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="policeInformed"
              checked={watchedValues.policeInformed}
              onCheckedChange={(checked) => setValue('policeInformed', checked as boolean)}
            />
            <Label htmlFor="policeInformed">Police informed?</Label>
          </div>
          
          {watchedValues.policeInformed && (
            <div className="grid grid-cols-2 gap-4 ml-6">
              <div>
                <Label htmlFor="policeDate">Police Date *</Label>
                <Input
                  id="policeDate"
                  type="date"
                  {...register('policeDate')}
                />
              </div>
              
              <div>
                <Label htmlFor="policeStation">Police Station *</Label>
                <Input
                  id="policeStation"
                  {...register('policeStation')}
                  placeholder="Enter police station"
                />
              </div>
            </div>
          )}
        </div>
      )
    },
    {
      id: 'ownership',
      title: 'Ownership & Insurance',
      component: (
        <div className="space-y-6">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="soleOwner"
              checked={watchedValues.soleOwner}
              onCheckedChange={(checked) => setValue('soleOwner', checked as boolean)}
            />
            <Label htmlFor="soleOwner">Are you the sole owner of the property?</Label>
          </div>
          
          {!watchedValues.soleOwner && (
            <div className="grid grid-cols-2 gap-4 ml-6">
              <div>
                <Label htmlFor="ownerName">Owner Name *</Label>
                <Input
                  id="ownerName"
                  {...register('ownerName')}
                  placeholder="Enter owner name"
                />
              </div>
              
              <div>
                <Label htmlFor="ownerAddress">Owner Address *</Label>
                <Input
                  id="ownerAddress"
                  {...register('ownerAddress')}
                  placeholder="Enter owner address"
                />
              </div>
            </div>
          )}
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="otherInsurance"
              checked={watchedValues.otherInsurance}
              onCheckedChange={(checked) => setValue('otherInsurance', checked as boolean)}
            />
            <Label htmlFor="otherInsurance">Any other insurance covering this property?</Label>
          </div>
          
          {watchedValues.otherInsurance && (
            <div className="ml-6">
              <Label htmlFor="otherInsurerDetails">Other Insurer Details *</Label>
              <Textarea
                id="otherInsurerDetails"
                {...register('otherInsurerDetails')}
                placeholder="Provide details of other insurance"
              />
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="totalContentsValue">Value of Total Contents *</Label>
              <Input
                id="totalContentsValue"
                type="number"
                {...register('totalContentsValue', { valueAsNumber: true })}
                placeholder="Enter total value"
              />
              {errors.totalContentsValue && <p className="text-sm text-red-600">{errors.totalContentsValue.message}</p>}
            </div>
            
            <div>
              <Label htmlFor="sumInsuredFirePolicy">Sum Insured Under Fire Policy *</Label>
              <Input
                id="sumInsuredFirePolicy"
                type="number"
                {...register('sumInsuredFirePolicy', { valueAsNumber: true })}
                placeholder="Enter sum insured"
              />
              {errors.sumInsuredFirePolicy && <p className="text-sm text-red-600">{errors.sumInsuredFirePolicy.message}</p>}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firePolicyInsurerName">Fire Policy Insurer Name</Label>
              <Input
                id="firePolicyInsurerName"
                {...register('firePolicyInsurerName')}
                placeholder="Enter insurer name"
              />
            </div>
            
            <div>
              <Label htmlFor="firePolicyInsurerAddress">Fire Policy Insurer Address</Label>
              <Input
                id="firePolicyInsurerAddress"
                {...register('firePolicyInsurerAddress')}
                placeholder="Enter insurer address"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="previousBurglaryLoss"
              checked={watchedValues.previousBurglaryLoss}
              onCheckedChange={(checked) => setValue('previousBurglaryLoss', checked as boolean)}
            />
            <Label htmlFor="previousBurglaryLoss">Previous burglary/theft loss?</Label>
          </div>
          
          {watchedValues.previousBurglaryLoss && (
            <div className="ml-6">
              <Label htmlFor="previousLossExplanation">Previous Loss Explanation *</Label>
              <Textarea
                id="previousLossExplanation"
                {...register('previousLossExplanation')}
                placeholder="Explain the previous loss"
              />
            </div>
          )}
        </div>
      )
    },
    {
      id: 'property',
      title: 'Property Details',
      component: (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Property Items</h3>
            <Button type="button" onClick={addPropertyItem} variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </div>
          
          <div className="space-y-4">
            {fields.map((field, index) => (
              <Card key={field.id} className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium">Item {index + 1}</h4>
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removePropertyItem(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor={`propertyItems.${index}.description`}>Description *</Label>
                    <Textarea
                      {...register(`propertyItems.${index}.description`)}
                      placeholder="Describe the item"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor={`propertyItems.${index}.costPrice`}>Cost Price *</Label>
                    <Input
                      type="number"
                      {...register(`propertyItems.${index}.costPrice`, { valueAsNumber: true })}
                      placeholder="Enter cost price"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor={`propertyItems.${index}.purchaseDate`}>Date of Purchase *</Label>
                    <Input
                      type="date"
                      {...register(`propertyItems.${index}.purchaseDate`)}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor={`propertyItems.${index}.estimatedValue`}>Estimated Value at Time of Loss *</Label>
                    <Input
                      type="number"
                      {...register(`propertyItems.${index}.estimatedValue`, { valueAsNumber: true })}
                      placeholder="Enter estimated value"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor={`propertyItems.${index}.netAmountClaimed`}>Net Amount Claimed *</Label>
                    <Input
                      type="number"
                      {...register(`propertyItems.${index}.netAmountClaimed`, { valueAsNumber: true })}
                      placeholder="Enter net amount claimed"
                    />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )
    },
    {
      id: 'privacy-declaration',
      title: 'Data Privacy & Declaration',
      component: (
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Data Privacy Notice</h3>
            <div className="prose prose-sm max-w-none">
              <p>
                We collect and process your personal information in accordance with applicable data protection laws.
                Your data will be used to process your claim and may be shared with relevant parties including
                investigators, adjusters, and medical professionals as necessary for claim assessment.
              </p>
              <p>
                By submitting this form, you consent to the collection, processing, and storage of your personal
                information for the purposes of claim processing and related activities.
              </p>
            </div>
          </Card>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="agreeToDataPrivacy"
              checked={watchedValues.agreeToDataPrivacy}
              onCheckedChange={(checked) => setValue('agreeToDataPrivacy', checked as boolean)}
            />
            <Label htmlFor="agreeToDataPrivacy">
              I agree to the data privacy policy and consent to the processing of my personal information *
            </Label>
          </div>
          
          <div>
            <Label htmlFor="signature">Digital Signature *</Label>
            <Input
              id="signature"
              {...register('signature')}
              placeholder="Type your full name as digital signature"
            />
            {errors.signature && <p className="text-sm text-red-600">{errors.signature.message}</p>}
          </div>
          
          <div className="text-sm text-gray-600">
            <p><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Burglary, Housebreaking and Larceny Claim Form</h1>
          <p className="text-gray-600 mt-2">Submit your burglary claim with detailed information</p>
        </div>

        <MultiStepForm
          steps={steps}
          onSubmit={handleSubmit(onSubmit)}
          isSubmitting={isSubmitting}
          submitButtonText="Submit Burglary Claim"
          formMethods={formMethods}
        />

        {/* Summary Modal */}
        <Dialog open={showSummary} onOpenChange={setShowSummary}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Review Your Claim</DialogTitle>
              <DialogDescription>
                Please review all information before final submission
              </DialogDescription>
            </DialogHeader>
            
            {submittedData && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-2">Policy Details</h3>
                  <p><strong>Policy Number:</strong> {submittedData.policyNumber}</p>
                  <p><strong>Period:</strong> {submittedData.periodOfCoverFrom} to {submittedData.periodOfCoverTo}</p>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">Insured Details</h3>
                  <p><strong>Name:</strong> {submittedData.nameOfInsured}</p>
                  <p><strong>Email:</strong> {submittedData.email}</p>
                  <p><strong>Phone:</strong> {submittedData.phone}</p>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">Property Items</h3>
                  <div className="space-y-2">
                    {submittedData.propertyItems?.map((item, index) => (
                      <div key={index} className="border rounded p-3">
                        <p><strong>Item {index + 1}:</strong> {item.description}</p>
                        <p><strong>Amount Claimed:</strong> ₦{item.netAmountClaimed?.toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <Button onClick={handleFinalSubmit} disabled={isSubmitting}>
                    {isSubmitting ? 'Submitting...' : 'Confirm & Submit'}
                  </Button>
                  <Button variant="outline" onClick={() => setShowSummary(false)}>
                    Back to Edit
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Success Modal */}
        <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Check className="h-6 w-6 text-green-600" />
                Claim Submitted Successfully
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <p>Your burglary claim has been submitted successfully and is now being processed.</p>
              <p>You will receive email updates on the status of your claim.</p>
              
              <Button onClick={() => {
                setShowSuccess(false);
                window.location.href = '/dashboard';
              }}>
                Go to Dashboard
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <AuthRequiredSubmit
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onProceedToSignup={() => {
            window.location.href = '/signup';
          }}
          formType="Burglary Claim"
        />
      </div>
    </div>
  );
};

export default BurglaryClaimForm;