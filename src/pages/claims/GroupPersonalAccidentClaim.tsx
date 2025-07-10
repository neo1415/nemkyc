import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../firebase/config';
import { groupPersonalAccidentSchema } from '../../utils/validation';
import { GroupPersonalAccidentClaimData } from '../../types/claims';
import { emailService } from '../../services/emailService';
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

const GroupPersonalAccidentClaim = () => {
  const { toast } = useToast();
  const [showSummary, setShowSummary] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formMethods = useForm<GroupPersonalAccidentClaimData>({
    resolver: yupResolver(groupPersonalAccidentSchema) as any,
    defaultValues: {
      policyNumber: '',
      periodOfCoverFrom: '',
      periodOfCoverTo: '',
      companyName: '',
      address: '',
      phone: '',
      email: '',
      accidentDate: '',
      accidentTime: '',
      accidentPlace: '',
      incidentDescription: '',
      particularsOfInjuries: '',
      doctorName: '',
      doctorAddress: '',
      isUsualDoctor: false,
      totalIncapacityFrom: '',
      totalIncapacityTo: '',
      partialIncapacityFrom: '',
      partialIncapacityTo: '',
      otherInsurerName: '',
      otherInsurerAddress: '',
      otherPolicyNumber: '',
      witnesses: [{ name: '', address: '' }],
      agreeToDataPrivacy: false,
      signature: ''
    },
    mode: 'onChange'
  });

  const { fields: witnessFields, append: appendWitness, remove: removeWitness } = useFieldArray({
    control: formMethods.control,
    name: 'witnesses'
  });

  const { saveDraft, loadDraft, clearDraft } = useFormDraft('group-personal-accident-claim', formMethods);

  const watchedValues = formMethods.watch();

  useEffect(() => {
    const draft = loadDraft();
    if (draft) {
      Object.keys(draft).forEach((key) => {
        formMethods.setValue(key as keyof GroupPersonalAccidentClaimData, draft[key]);
      });
    }
  }, [formMethods, loadDraft]);

  useEffect(() => {
    const subscription = formMethods.watch((data) => {
      saveDraft(data);
    });
    return () => subscription.unsubscribe();
  }, [formMethods, saveDraft]);

  const addWitness = () => {
    appendWitness({ name: '', address: '' });
  };

  const handleSubmit = async (data: GroupPersonalAccidentClaimData) => {
    setIsSubmitting(true);
    try {
      // Save to Firestore
      const docRef = await addDoc(collection(db, 'groupPersonalAccidentClaims'), {
        ...data,
        submittedAt: new Date(),
        status: 'submitted'
      });

      // Send confirmation email
      await emailService.sendSubmissionConfirmation(
        data.email,
        'Group Personal Accident Insurance Claim'
      );

      clearDraft();
      setShowSummary(false);
      setShowSuccess(true);
      
      toast({
        title: "Claim Submitted Successfully",
        description: "Your group personal accident claim has been submitted and you'll receive a confirmation email shortly.",
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

  const onFinalSubmit = (data: GroupPersonalAccidentClaimData) => {
    setShowSummary(true);
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
              {...formMethods.register('policyNumber')}
              placeholder="Enter policy number"
            />
            {formMethods.formState.errors.policyNumber && (
              <p className="text-sm text-red-600">{formMethods.formState.errors.policyNumber.message}</p>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="periodOfCoverFrom">Period of Cover From *</Label>
              <Input
                id="periodOfCoverFrom"
                type="date"
                {...formMethods.register('periodOfCoverFrom')}
              />
              {formMethods.formState.errors.periodOfCoverFrom && (
                <p className="text-sm text-red-600">{formMethods.formState.errors.periodOfCoverFrom.message}</p>
              )}
            </div>
            
            <div>
              <Label htmlFor="periodOfCoverTo">Period of Cover To *</Label>
              <Input
                id="periodOfCoverTo"
                type="date"
                {...formMethods.register('periodOfCoverTo')}
              />
              {formMethods.formState.errors.periodOfCoverTo && (
                <p className="text-sm text-red-600">{formMethods.formState.errors.periodOfCoverTo.message}</p>
              )}
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
            <Label htmlFor="companyName">Company Name *</Label>
            <Input
              id="companyName"
              {...formMethods.register('companyName')}
              placeholder="Enter company name"
            />
            {formMethods.formState.errors.companyName && (
              <p className="text-sm text-red-600">{formMethods.formState.errors.companyName.message}</p>
            )}
          </div>
          
          <div>
            <Label htmlFor="address">Address *</Label>
            <Textarea
              id="address"
              {...formMethods.register('address')}
              placeholder="Enter full address"
            />
            {formMethods.formState.errors.address && (
              <p className="text-sm text-red-600">{formMethods.formState.errors.address.message}</p>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                {...formMethods.register('phone')}
                placeholder="Enter phone number"
              />
              {formMethods.formState.errors.phone && (
                <p className="text-sm text-red-600">{formMethods.formState.errors.phone.message}</p>
              )}
            </div>
            
            <div>
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                {...formMethods.register('email')}
                placeholder="Enter email address"
              />
              {formMethods.formState.errors.email && (
                <p className="text-sm text-red-600">{formMethods.formState.errors.email.message}</p>
              )}
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'accident',
      title: 'Accident Details',
      component: (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="accidentDate">Accident Date *</Label>
              <Input
                id="accidentDate"
                type="date"
                {...formMethods.register('accidentDate')}
              />
              {formMethods.formState.errors.accidentDate && (
                <p className="text-sm text-red-600">{formMethods.formState.errors.accidentDate.message}</p>
              )}
            </div>
            
            <div>
              <Label htmlFor="accidentTime">Accident Time *</Label>
              <Input
                id="accidentTime"
                type="time"
                {...formMethods.register('accidentTime')}
              />
              {formMethods.formState.errors.accidentTime && (
                <p className="text-sm text-red-600">{formMethods.formState.errors.accidentTime.message}</p>
              )}
            </div>
          </div>
          
          <div>
            <Label htmlFor="accidentPlace">Place of Accident *</Label>
            <Input
              id="accidentPlace"
              {...formMethods.register('accidentPlace')}
              placeholder="Where did the accident occur?"
            />
            {formMethods.formState.errors.accidentPlace && (
              <p className="text-sm text-red-600">{formMethods.formState.errors.accidentPlace.message}</p>
            )}
          </div>
          
          <div>
            <Label htmlFor="incidentDescription">How did the incident occur? *</Label>
            <Textarea
              id="incidentDescription"
              {...formMethods.register('incidentDescription')}
              placeholder="Describe how the incident occurred"
              rows={4}
            />
            {formMethods.formState.errors.incidentDescription && (
              <p className="text-sm text-red-600">{formMethods.formState.errors.incidentDescription.message}</p>
            )}
          </div>
          
          <div>
            <Label htmlFor="particularsOfInjuries">Particulars of Injuries *</Label>
            <Textarea
              id="particularsOfInjuries"
              {...formMethods.register('particularsOfInjuries')}
              placeholder="Describe the injuries sustained"
              rows={4}
            />
            {formMethods.formState.errors.particularsOfInjuries && (
              <p className="text-sm text-red-600">{formMethods.formState.errors.particularsOfInjuries.message}</p>
            )}
          </div>
        </div>
      )
    },
    {
      id: 'medical',
      title: 'Medical & Incapacity Details',
      component: (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="doctorName">Doctor's Name *</Label>
              <Input
                id="doctorName"
                {...formMethods.register('doctorName')}
                placeholder="Enter doctor's name"
              />
              {formMethods.formState.errors.doctorName && (
                <p className="text-sm text-red-600">{formMethods.formState.errors.doctorName.message}</p>
              )}
            </div>
            
            <div>
              <Label htmlFor="doctorAddress">Doctor's Address *</Label>
              <Input
                id="doctorAddress"
                {...formMethods.register('doctorAddress')}
                placeholder="Enter doctor's address"
              />
              {formMethods.formState.errors.doctorAddress && (
                <p className="text-sm text-red-600">{formMethods.formState.errors.doctorAddress.message}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isUsualDoctor"
              checked={watchedValues.isUsualDoctor}
              onCheckedChange={(checked) => formMethods.setValue('isUsualDoctor', checked as boolean)}
            />
            <Label htmlFor="isUsualDoctor">Is this the injured person's usual doctor?</Label>
          </div>
          
          <div>
            <h4 className="font-medium mb-4">Period of Total Incapacity</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="totalIncapacityFrom">From</Label>
                <Input
                  id="totalIncapacityFrom"
                  type="date"
                  {...formMethods.register('totalIncapacityFrom')}
                />
              </div>
              
              <div>
                <Label htmlFor="totalIncapacityTo">To</Label>
                <Input
                  id="totalIncapacityTo"
                  type="date"
                  {...formMethods.register('totalIncapacityTo')}
                />
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium mb-4">Period of Partial Incapacity</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="partialIncapacityFrom">From</Label>
                <Input
                  id="partialIncapacityFrom"
                  type="date"
                  {...formMethods.register('partialIncapacityFrom')}
                />
              </div>
              
              <div>
                <Label htmlFor="partialIncapacityTo">To</Label>
                <Input
                  id="partialIncapacityTo"
                  type="date"
                  {...formMethods.register('partialIncapacityTo')}
                />
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium mb-4">Other Insurance Details</h4>
            <div className="space-y-4">
              <div>
                <Label htmlFor="otherInsurerName">Other Insurer Name</Label>
                <Input
                  id="otherInsurerName"
                  {...formMethods.register('otherInsurerName')}
                  placeholder="Enter other insurer name"
                />
              </div>
              
              <div>
                <Label htmlFor="otherInsurerAddress">Other Insurer Address</Label>
                <Input
                  id="otherInsurerAddress"
                  {...formMethods.register('otherInsurerAddress')}
                  placeholder="Enter other insurer address"
                />
              </div>
              
              <div>
                <Label htmlFor="otherPolicyNumber">Other Policy Number</Label>
                <Input
                  id="otherPolicyNumber"
                  {...formMethods.register('otherPolicyNumber')}
                  placeholder="Enter other policy number"
                />
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'witnesses',
      title: 'Witnesses',
      component: (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Witnesses to the Accident</h3>
            <Button type="button" onClick={addWitness} variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Witness
            </Button>
          </div>
          
          <div className="space-y-4">
            {witnessFields.map((field, index) => (
              <Card key={field.id} className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium">Witness {index + 1}</h4>
                  {witnessFields.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeWitness(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
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
                    <Label htmlFor={`witnesses.${index}.address`}>Address *</Label>
                    <Input
                      {...formMethods.register(`witnesses.${index}.address`)}
                      placeholder="Enter witness address"
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
      id: 'declaration',
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
              onCheckedChange={(checked) => formMethods.setValue('agreeToDataPrivacy', checked as boolean)}
            />
            <Label htmlFor="agreeToDataPrivacy">
              I agree to the data privacy policy and consent to the processing of my personal information *
            </Label>
          </div>
          
          <div>
            <Label htmlFor="signature">Digital Signature *</Label>
            <Input
              id="signature"
              {...formMethods.register('signature')}
              placeholder="Type your full name as digital signature"
            />
            {formMethods.formState.errors.signature && (
              <p className="text-sm text-red-600">{formMethods.formState.errors.signature.message}</p>
            )}
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
          <h1 className="text-3xl font-bold text-gray-900">Group Personal Accident Claim Form</h1>
          <p className="text-gray-600 mt-2">Submit your personal accident claim</p>
        </div>

        <MultiStepForm
          steps={steps}
          onSubmit={formMethods.handleSubmit(onFinalSubmit)}
          isSubmitting={isSubmitting}
          submitButtonText="Submit Claim"
          formMethods={formMethods}
        />

        {/* Summary Modal */}
        <Dialog open={showSummary} onOpenChange={setShowSummary}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Review Your Claim</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">Policy Details</h3>
                <p><strong>Policy Number:</strong> {watchedValues.policyNumber}</p>
                <p><strong>Company:</strong> {watchedValues.companyName}</p>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Accident Information</h3>
                <p><strong>Date:</strong> {watchedValues.accidentDate}</p>
                <p><strong>Time:</strong> {watchedValues.accidentTime}</p>
                <p><strong>Place:</strong> {watchedValues.accidentPlace}</p>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Witnesses</h3>
                {watchedValues.witnesses?.map((witness, index) => (
                  <div key={index} className="border rounded p-3 mb-2">
                    <p><strong>{witness.name}</strong></p>
                    <p>{witness.address}</p>
                  </div>
                ))}
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowSummary(false)}>
                  Back to Edit
                </Button>
                <Button onClick={() => handleSubmit(watchedValues)} disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Confirm & Submit'
                  )}
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>

        {/* Success Modal */}
        <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-green-600">Claim Submitted Successfully!</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <p>Your group personal accident claim has been submitted successfully.</p>
              <p>You will receive a confirmation email shortly and updates on the status of your claim.</p>
              
              <Button onClick={() => {
                setShowSuccess(false);
                window.location.href = '/dashboard';
              }}>
                Go to Dashboard
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default GroupPersonalAccidentClaim;