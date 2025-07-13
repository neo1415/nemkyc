import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import MultiStepForm from '../../components/common/MultiStepForm';
import FormSection from '../../components/common/FormSection';
import PhoneInput from '../../components/common/PhoneInput';
import { useToast } from '../../hooks/use-toast';
import { useFormDraft } from '../../hooks/useFormDraft';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { RadioGroup, RadioGroupItem } from '../../components/ui/radio-group';
import { Label } from '../../components/ui/label';
import { Checkbox } from '../../components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';

const contractorsSchema = yup.object().shape({
  policyNumber: yup.string().required('Policy number is required'),
  periodOfCoverFrom: yup.date().required('Period start date is required'),
  periodOfCoverTo: yup.date().required('Period end date is required'),
  nameOfInsured: yup.string().required('Name is required'),
  companyName: yup.string(),
  title: yup.string().required('Title is required'),
  dateOfBirth: yup.date().required('Date of birth is required'),
  gender: yup.string().required('Gender is required'),
  address: yup.string().required('Address is required'),
  phone: yup.string().required('Phone is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  howItHappened: yup.string().required('How it happened is required'),
  policeNotified: yup.string().oneOf(['yes', 'no']).required('Police notification status is required'),
  policeStation: yup.string(),
  lossAmount: yup.number().min(0, 'Loss amount must be positive').required('Loss amount is required'),
  lossDescription: yup.string().required('Loss description is required'),
  declarationAccepted: yup.boolean().oneOf([true], 'Declaration required'),
  signature: yup.string().required('Signature required'),
  signatureDate: yup.date().required('Signature date required')
});

type ContractorsData = yup.InferType<typeof contractorsSchema>;

const defaultValues: Partial<ContractorsData> = {
  signatureDate: new Date(),
  policeNotified: 'no'
};

const ContractorsPlantMachineryClaim: React.FC = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showSummary, setShowSummary] = useState(false);

  const formMethods = useForm<Partial<ContractorsData>>({
    defaultValues,
    mode: 'onChange'
  });

  const { watch, handleSubmit, setValue } = formMethods;
  const { saveDraft, loadDraft } = useFormDraft('contractors-claim', formMethods);
  
  const watchedValues = watch();

  useEffect(() => {
    const subscription = watch((value) => {
      saveDraft(value);
    });
    return () => subscription.unsubscribe();
  }, [watch, saveDraft]);

  useEffect(() => {
    loadDraft();
  }, [loadDraft]);

  const cleanData = (data: any) => {
    const cleaned = Object.entries(data).reduce((acc, [key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        acc[key] = value;
      }
      return acc;
    }, {} as any);
    return cleaned;
  };

  const onSubmit = async (data: ContractorsData) => {
    setIsSubmitting(true);
    try {
      const cleanedData = cleanData(data);
      
      await addDoc(collection(db, 'contractors-claims'), {
        ...cleanedData,
        submittedAt: new Date().toISOString(),
        status: 'pending'
      });

      // await sendEmail({
      //   to: data.email,
      //   template: 'claim-confirmation',
      //   data: { claimType: 'Contractors Plant & Machinery Claim', ...data }
      // });

      setShowSummary(false);
      setShowSuccess(true);
      toast({
        title: "Claim Submitted Successfully",
        description: "Your contractors plant & machinery claim has been submitted.",
      });
    } catch (error) {
      console.error('Submission error:', error);
      toast({
        title: "Submission Failed",
        description: "Please try again or contact support.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFormSubmit = () => {
    if (watchedValues.declarationAccepted) {
      setShowSummary(true);
    }
  };

  const steps = [
    {
      id: 'policy',
      title: 'Policy Details',
      component: (
        <FormSection title="Policy Information" description="Enter your policy details">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="policyNumber">Policy Number *</Label>
              <Input
                {...formMethods.register('policyNumber')}
                placeholder="Enter policy number"
              />
              {formMethods.formState.errors.policyNumber && (
                <p className="text-sm text-red-600 mt-1">
                  {formMethods.formState.errors.policyNumber.message}
                </p>
              )}
            </div>
            
            <div>
              <Label htmlFor="periodOfCoverFrom">Period of Cover From *</Label>
              <Input
                type="date"
                {...formMethods.register('periodOfCoverFrom')}
              />
              {formMethods.formState.errors.periodOfCoverFrom && (
                <p className="text-sm text-red-600 mt-1">
                  {formMethods.formState.errors.periodOfCoverFrom.message}
                </p>
              )}
            </div>
            
            <div>
              <Label htmlFor="periodOfCoverTo">Period of Cover To *</Label>
              <Input
                type="date"
                {...formMethods.register('periodOfCoverTo')}
              />
              {formMethods.formState.errors.periodOfCoverTo && (
                <p className="text-sm text-red-600 mt-1">
                  {formMethods.formState.errors.periodOfCoverTo.message}
                </p>
              )}
            </div>
          </div>
        </FormSection>
      )
    },
    {
      id: 'insured',
      title: 'Insured Details',
      component: (
        <FormSection title="Insured Information" description="Enter the insured party details">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="nameOfInsured">Name of Insured *</Label>
              <Input
                {...formMethods.register('nameOfInsured')}
                placeholder="Enter full name"
              />
              {formMethods.formState.errors.nameOfInsured && (
                <p className="text-sm text-red-600 mt-1">
                  {formMethods.formState.errors.nameOfInsured.message}
                </p>
              )}
            </div>
            
            <div>
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                {...formMethods.register('companyName')}
                placeholder="Enter company name (optional)"
              />
            </div>
            
            <div>
              <Label htmlFor="title">Title *</Label>
              <Select onValueChange={(value) => setValue('title', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select title" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mr">Mr</SelectItem>
                  <SelectItem value="mrs">Mrs</SelectItem>
                  <SelectItem value="ms">Ms</SelectItem>
                  <SelectItem value="dr">Dr</SelectItem>
                  <SelectItem value="chief">Chief</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              {formMethods.formState.errors.title && (
                <p className="text-sm text-red-600 mt-1">
                  {formMethods.formState.errors.title.message}
                </p>
              )}
            </div>
            
            <div>
              <Label htmlFor="dateOfBirth">Date of Birth *</Label>
              <Input
                type="date"
                {...formMethods.register('dateOfBirth')}
              />
              {formMethods.formState.errors.dateOfBirth && (
                <p className="text-sm text-red-600 mt-1">
                  {formMethods.formState.errors.dateOfBirth.message}
                </p>
              )}
            </div>
            
            <div>
              <Label htmlFor="gender">Gender *</Label>
              <Select onValueChange={(value) => setValue('gender', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              {formMethods.formState.errors.gender && (
                <p className="text-sm text-red-600 mt-1">
                  {formMethods.formState.errors.gender.message}
                </p>
              )}
            </div>
            
            <div className="md:col-span-2">
              <Label htmlFor="address">Address *</Label>
              <Textarea
                {...formMethods.register('address')}
                placeholder="Enter full address"
                rows={3}
              />
              {formMethods.formState.errors.address && (
                <p className="text-sm text-red-600 mt-1">
                  {formMethods.formState.errors.address.message}
                </p>
              )}
            </div>
            
            <div>
              <PhoneInput
                label="Phone Number *"
                value={watchedValues.phone || ''}
                onChange={(value) => setValue('phone', value)}
                error={formMethods.formState.errors.phone?.message}
              />
            </div>
            
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                type="email"
                {...formMethods.register('email')}
                placeholder="Enter email address"
              />
              {formMethods.formState.errors.email && (
                <p className="text-sm text-red-600 mt-1">
                  {formMethods.formState.errors.email.message}
                </p>
              )}
            </div>
          </div>
        </FormSection>
      )
    },
    {
      id: 'details',
      title: 'Loss Details',
      component: (
        <FormSection title="Loss Information" description="Provide details about the loss or damage">
          <div className="space-y-4">
            <div>
              <Label htmlFor="howItHappened">How did the loss occur? *</Label>
              <Textarea
                {...formMethods.register('howItHappened')}
                placeholder="Describe how the loss or damage occurred"
                rows={4}
              />
              {formMethods.formState.errors.howItHappened && (
                <p className="text-sm text-red-600 mt-1">
                  {formMethods.formState.errors.howItHappened.message}
                </p>
              )}
            </div>
            
            <div>
              <Label>Have police been notified? *</Label>
              <RadioGroup
                value={watchedValues.policeNotified}
                onValueChange={(value: 'yes' | 'no') => setValue('policeNotified', value)}
                className="flex space-x-4 mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="police-yes" />
                  <Label htmlFor="police-yes">Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="police-no" />
                  <Label htmlFor="police-no">No</Label>
                </div>
              </RadioGroup>
              {formMethods.formState.errors.policeNotified && (
                <p className="text-sm text-red-600 mt-1">
                  {formMethods.formState.errors.policeNotified.message}
                </p>
              )}
            </div>
            
            {watchedValues.policeNotified === 'yes' && (
              <div>
                <Label htmlFor="policeStation">Police Station</Label>
                <Input
                  {...formMethods.register('policeStation')}
                  placeholder="Enter police station name"
                />
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="lossAmount">Amount of Loss *</Label>
                <Input
                  type="number"
                  step="0.01"
                  {...formMethods.register('lossAmount')}
                  placeholder="Enter loss amount"
                />
                {formMethods.formState.errors.lossAmount && (
                  <p className="text-sm text-red-600 mt-1">
                    {formMethods.formState.errors.lossAmount.message}
                  </p>
                )}
              </div>
              
              <div>
                <Label htmlFor="lossDescription">Description of Loss *</Label>
                <Textarea
                  {...formMethods.register('lossDescription')}
                  placeholder="Describe what was lost/damaged"
                  rows={3}
                />
                {formMethods.formState.errors.lossDescription && (
                  <p className="text-sm text-red-600 mt-1">
                    {formMethods.formState.errors.lossDescription.message}
                  </p>
                )}
              </div>
            </div>
          </div>
        </FormSection>
      )
    },
    {
      id: 'declaration',
      title: 'Declaration',
      component: (
        <FormSection title="Data Privacy & Declaration">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Data Privacy</h3>
              <div className="text-sm text-gray-600 space-y-2">
                <p>i. Your data will solemnly be used for the purposes of this business contract and also to enable us reach you with the updates about our products and services.</p>
                <p>ii. Please note that your personal data will be treated with utmost respect and is well secured as required by Nigeria Data Protection Regulations 2019.</p>
                <p>iii. Your personal data shall not be shared with or sold to any third-party without your consent unless we are compelled by law or regulator.</p>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-2">Declaration</h3>
              <div className="text-sm text-gray-600 space-y-2">
                <p>1. I/We declare to the best of my/our knowledge and belief that the information given on this form is true in every respect and agree that if I/we have made any false or fraudulent statement, be it suppression or concealment, the policy shall be cancelled and the claim shall be forfeited.</p>
                <p>2. I/We agree to provide additional information to NEM Insurance, if required.</p>
                <p>3. I/We agree to submit all required and requested for documents and NEM Insurance shall not be held responsible for any delay in settlement of claim due to non-fulfillment of requirements.</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="declaration"
                  checked={watchedValues.declarationAccepted}
                  onCheckedChange={(checked: boolean) => setValue('declarationAccepted', checked)}
                />
                <Label htmlFor="declaration" className="text-sm">
                  I agree to the data privacy policy and declaration above *
                </Label>
              </div>
              {formMethods.formState.errors.declarationAccepted && (
                <p className="text-sm text-red-600">
                  {formMethods.formState.errors.declarationAccepted.message}
                </p>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="signature">Digital Signature *</Label>
                  <Input
                    {...formMethods.register('signature')}
                    placeholder="Type your full name as signature"
                  />
                  {formMethods.formState.errors.signature && (
                    <p className="text-sm text-red-600 mt-1">
                      {formMethods.formState.errors.signature.message}
                    </p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="signatureDate">Date *</Label>
                  <Input
                    type="date"
                    {...formMethods.register('signatureDate')}
                  />
                  {formMethods.formState.errors.signatureDate && (
                    <p className="text-sm text-red-600 mt-1">
                      {formMethods.formState.errors.signatureDate.message}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </FormSection>
      )
    }
  ];

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <CardTitle className="text-green-600">Claim Submitted Successfully!</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">
              Your contractors plant & machinery claim has been submitted successfully. 
              You will receive a confirmation email shortly.
            </p>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">For claim status and inquiries:</h4>
              <p className="text-sm">Email: claims@neminsurance.com</p>
              <p className="text-sm">Phone: +234 1 234 5678</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Contractors Plant & Machinery Claim Form</h1>
          <p className="text-gray-600 mt-2">Submit your claim for contractors plant and machinery</p>
        </div>

        <MultiStepForm
          steps={steps}
          onSubmit={handleFormSubmit}
          isSubmitting={isSubmitting}
          submitButtonText="Submit Claim"
          formMethods={formMethods}
        />

        <Dialog open={showSummary} onOpenChange={setShowSummary}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Review Your Claim</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold">Policy Information</h3>
                <p>Policy Number: {watchedValues.policyNumber}</p>
                <p>Period: {watchedValues.periodOfCoverFrom?.toString()} to {watchedValues.periodOfCoverTo?.toString()}</p>
              </div>
              
              <div>
                <h3 className="font-semibold">Insured Details</h3>
                <p>Name: {watchedValues.nameOfInsured}</p>
                <p>Email: {watchedValues.email}</p>
                <p>Phone: {watchedValues.phone}</p>
              </div>
              
              <div>
                <h3 className="font-semibold">Loss Details</h3>
                <p>Amount: ₦{watchedValues.lossAmount}</p>
                <p>Description: {watchedValues.lossDescription}</p>
              </div>
              
              <div className="flex space-x-4">
                <Button variant="outline" onClick={() => setShowSummary(false)}>
                  Edit Details
                </Button>
                <Button onClick={handleSubmit(onSubmit)} disabled={isSubmitting}>
                  {isSubmitting ? 'Submitting...' : 'Confirm & Submit'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default ContractorsPlantMachineryClaim;