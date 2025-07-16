import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../firebase/config';
// import { groupPersonalAccidentSchema } from '../../utils/validation';
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
    // resolver: yupResolver(groupPersonalAccidentSchema) as any,
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
      // await emailService.sendSubmissionConfirmation(
      //   data.email,
      //   'Group Personal Accident Insurance Claim'
      // );

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
              rows={3}
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
      title: 'Details of Loss',
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
              <Label htmlFor="accidentTime">Time *</Label>
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
            <Label htmlFor="accidentPlace">Place *</Label>
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
            <Label htmlFor="incidentDescription">Incident Description *</Label>
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
      id: 'witnesses',
      title: 'Witness Information',
      component: (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Label className="text-lg font-semibold">Witnesses</Label>
            <Button
              type="button"
              onClick={() => appendWitness({ name: '', address: '' })}
              variant="outline"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Witness
            </Button>
          </div>
          
          {witnessFields.map((field, index) => (
            <Card key={field.id} className="p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold">Witness {index + 1}</h3>
                <Button
                  type="button"
                  onClick={() => removeWitness(index)}
                  variant="destructive"
                  size="sm"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor={`witnesses.${index}.name`}>Witness Name *</Label>
                  <Input
                    {...formMethods.register(`witnesses.${index}.name`)}
                    placeholder="Enter witness name"
                  />
                </div>
                
                <div>
                  <Label htmlFor={`witnesses.${index}.address`}>Witness Address *</Label>
                  <Textarea
                    {...formMethods.register(`witnesses.${index}.address`)}
                    placeholder="Enter witness address"
                    rows={2}
                  />
                </div>
              </div>
            </Card>
          ))}
          
          {witnessFields.length === 0 && (
            <div className="text-center text-sm text-muted-foreground border p-6 rounded-md">
              No witnesses added yet. Click "Add Witness" to add witness information.
            </div>
          )}
        </div>
      )
    },
    {
      id: 'doctor',
      title: 'Doctor Information',
      component: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="doctorName">Name of doctor *</Label>
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
              <Label htmlFor="doctorAddress">Address of doctor *</Label>
              <Textarea
                id="doctorAddress"
                {...formMethods.register('doctorAddress')}
                placeholder="Enter doctor's address"
                rows={2}
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
            <Label htmlFor="isUsualDoctor">Is this your usual doctor?</Label>
          </div>
        </div>
      )
    },
    {
      id: 'incapacity',
      title: 'Incapacity Details',
      component: (
        <div className="space-y-6">
          <div>
            <h4 className="font-medium mb-4">Total incapacity period:</h4>
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
            <h4 className="font-medium mb-4">Partial incapacity period:</h4>
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
        </div>
      )
    },
    {
      id: 'other-insurers',
      title: 'Other Insurers',
      component: (
        <div className="space-y-6">
          <div>
            <Label htmlFor="otherInsurerName">Name *</Label>
            <Input
              id="otherInsurerName"
              {...formMethods.register('otherInsurerName')}
              placeholder="Enter other insurer name"
            />
            {formMethods.formState.errors.otherInsurerName && (
              <p className="text-sm text-red-600">{formMethods.formState.errors.otherInsurerName.message}</p>
            )}
          </div>
          
          <div>
            <Label htmlFor="otherInsurerAddress">Address *</Label>
            <Textarea
              id="otherInsurerAddress"
              {...formMethods.register('otherInsurerAddress')}
              placeholder="Enter other insurer address"
              rows={3}
            />
            {formMethods.formState.errors.otherInsurerAddress && (
              <p className="text-sm text-red-600">{formMethods.formState.errors.otherInsurerAddress.message}</p>
            )}
          </div>
          
          <div>
            <Label htmlFor="otherPolicyNumber">Policy Number</Label>
            <Input
              id="otherPolicyNumber"
              {...formMethods.register('otherPolicyNumber')}
              placeholder="Enter other policy number"
            />
          </div>
        </div>
      )
    },
    {
      id: 'data-privacy',
      title: 'Data Privacy & Declaration',
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
              {formMethods.formState.errors.agreeToDataPrivacy && (
                <p className="text-sm text-red-600">{formMethods.formState.errors.agreeToDataPrivacy.message}</p>
              )}

              <div>
                <Label htmlFor="signature">Digital Signature *</Label>
                <Input
                  id="signature"
                  {...formMethods.register('signature')}
                  placeholder="Type your full name as signature"
                />
                {formMethods.formState.errors.signature && (
                  <p className="text-sm text-red-600">{formMethods.formState.errors.signature.message}</p>
                )}
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
              Group Personal Accident Insurance Claim Form
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
              <DialogTitle>Review Your Group Personal Accident Claim Submission</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><strong>Policy Number:</strong> {watchedValues.policyNumber}</div>
                <div><strong>Company:</strong> {watchedValues.companyName}</div>
                <div><strong>Email:</strong> {watchedValues.email}</div>
                <div><strong>Doctor:</strong> {watchedValues.doctorName}</div>
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
                <p>Your group personal accident claim has been submitted successfully.</p>
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

export default GroupPersonalAccidentClaim;
