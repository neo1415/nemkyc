import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import MultiStepForm from '../../components/common/MultiStepForm';
import FormSection from '../../components/common/FormSection';
import PhoneInput from '../../components/common/PhoneInput';
import { useToast } from '../../hooks/use-toast';
import { useFormDraft } from '../../hooks/useFormDraft';
import { uploadFile } from '../../services/fileService';
import { useAuthRequiredSubmit } from '../../hooks/useAuthRequiredSubmit';
import SuccessModal from '../../components/common/SuccessModal';
import { Loader2 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '../../components/ui/radio-group';
import { Label } from '../../components/ui/label';
import { Checkbox } from '../../components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';

const moneyInsuranceSchema = yup.object().shape({
  policyNumber: yup.string().required('Policy number is required'),
  periodOfCoverFrom: yup.date().required('Period start date is required'),
  periodOfCoverTo: yup.date().required('Period end date is required'),
  companyName: yup.string().required('Company name is required'),
  address: yup.string().required('Address is required'),
  phone: yup.string().required('Phone is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  lossDate: yup.date().required('Loss date is required'),
  lossTime: yup.string().required('Loss time is required'),
  lossLocation: yup.string().required('Loss location is required'),
  moneyLocation: yup.string().oneOf(['transit', 'safe']).required('Money location is required'),
  discovererName: yup.string().required('Discoverer name is required'),
  discovererPosition: yup.string(),
  discovererSalary: yup.number().min(0, 'Salary must be positive'),
  policeEscort: yup.string().oneOf(['yes', 'no']),
  amountAtStart: yup.number().min(0, 'Amount must be positive'),
  disbursements: yup.number().min(0, 'Disbursements must be positive'),
  doubtIntegrity: yup.string().oneOf(['yes', 'no']),
  integrityExplanation: yup.string(),
  safeType: yup.string(),
  keyholders: yup.array().of(
    yup.object({
      name: yup.string().required('Name is required'),
      position: yup.string().required('Position is required'),
      salary: yup.number().min(0, 'Salary must be positive').required('Salary is required')
    })
  ),
  howItHappened: yup.string().required('How it happened is required'),
  policeNotified: yup.string().oneOf(['yes', 'no']).required('Police notification status is required'),
  policeStation: yup.string(),
  previousLoss: yup.string().oneOf(['yes', 'no']).required('Previous loss status is required'),
  previousLossDetails: yup.string(),
  lossAmount: yup.number().min(0, 'Loss amount must be positive').required('Loss amount is required'),
  lossDescription: yup.string().required('Loss description is required'),
  agreeToDataPrivacy: yup.boolean().oneOf([true], 'You must agree to data privacy'),
  declarationTrue: yup.boolean().oneOf([true], 'You must confirm the declaration is true'),
  signature: yup.string().required('Signature is required'),
});

type MoneyInsuranceData = yup.InferType<typeof moneyInsuranceSchema>;

const defaultValues: Partial<MoneyInsuranceData> = {
  signatureDate: new Date(),
  policeNotified: 'no',
  previousLoss: 'no',
  keyholders: [{ name: '', position: '', salary: 0 }]
};

const MoneyInsuranceClaim: React.FC = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [showPostAuthLoading, setShowPostAuthLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File>>({});
  const { 
    handleSubmitWithAuth, 
    showSuccess: authShowSuccess, 
    setShowSuccess: setAuthShowSuccess,
    isSubmitting: authSubmitting
  } = useAuthRequiredSubmit();

  const formMethods = useForm<Partial<MoneyInsuranceData>>({
    defaultValues,
    mode: 'onChange'
  });

  const { watch, setValue, getValues } = formMethods;
  const { saveDraft, loadDraft, clearDraft } = useFormDraft('money-insurance-claim', formMethods);
  
  const watchedValues = watch();

  // Check for pending submission when component mounts
  useEffect(() => {
    const checkPendingSubmission = () => {
      const hasPending = sessionStorage.getItem('pendingSubmission');
      if (hasPending) {
        setShowPostAuthLoading(true);
        // Hide loading after 5 seconds max (in case something goes wrong)
        setTimeout(() => setShowPostAuthLoading(false), 5000);
      }
    };

    checkPendingSubmission();
  }, []);

  // Hide post-auth loading when success modal shows
  useEffect(() => {
    if (authShowSuccess) {
      setShowPostAuthLoading(false);
    }
  }, [authShowSuccess]);

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

  // Main submit handler that checks authentication
  const handleSubmit = async (data: MoneyInsuranceData) => {
    // Prepare file upload data
    const fileUploadPromises: Array<Promise<[string, string]>> = [];
    
    for (const [key, file] of Object.entries(uploadedFiles)) {
      if (file) {
        fileUploadPromises.push(
          uploadFile(file, `money-insurance-claims/${Date.now()}-${file.name}`).then(url => [key, url])
        );
      }
    }

    const fileResults = await Promise.all(fileUploadPromises);
    const fileUrls = Object.fromEntries(fileResults);

    const finalData = {
      ...data,
      ...fileUrls,
      status: 'processing',
      formType: 'Money Insurance Claim'
    };

    await handleSubmitWithAuth(finalData, 'Money Insurance Claim');
    clearDraft();
    setShowSummary(false);
  };

  const onFinalSubmit = (data: MoneyInsuranceData) => {
    setShowSummary(true);
  };

  const steps = [
    {
      id: 'policy',
      title: 'Policy Details',
      component: (
        <FormSection title="Policy Details" description="Enter your policy information">
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
        <FormSection title="Insured Details" description="Enter the insured company details">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="companyName">Company Name *</Label>
              <Input
                {...formMethods.register('companyName')}
                placeholder="Enter company name"
              />
              {formMethods.formState.errors.companyName && (
                <p className="text-sm text-red-600 mt-1">
                  {formMethods.formState.errors.companyName.message}
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
      id: 'loss',
      title: 'Details of Loss',
      component: (
        <FormSection title="Details of Loss" description="Provide details about when and where the loss occurred">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="lossDate">Date *</Label>
                <Input
                  type="date"
                  {...formMethods.register('lossDate')}
                />
                {formMethods.formState.errors.lossDate && (
                  <p className="text-sm text-red-600 mt-1">
                    {formMethods.formState.errors.lossDate.message}
                  </p>
                )}
              </div>
              
              <div>
                <Label htmlFor="lossTime">Time *</Label>
                <Input
                  type="time"
                  {...formMethods.register('lossTime')}
                />
                {formMethods.formState.errors.lossTime && (
                  <p className="text-sm text-red-600 mt-1">
                    {formMethods.formState.errors.lossTime.message}
                  </p>
                )}
              </div>
            </div>
            
            <div>
              <Label htmlFor="lossLocation">Where did it happen? *</Label>
              <Textarea
                {...formMethods.register('lossLocation')}
                placeholder="Describe the location where the loss occurred"
                rows={3}
              />
              {formMethods.formState.errors.lossLocation && (
                <p className="text-sm text-red-600 mt-1">
                  {formMethods.formState.errors.lossLocation.message}
                </p>
              )}
            </div>
            
            <div>
              <Label>Was the money in transit or locked in a safe? *</Label>
              <RadioGroup
                value={watchedValues.moneyLocation}
                onValueChange={(value: 'transit' | 'safe') => setValue('moneyLocation', value)}
                className="flex space-x-4 mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="transit" id="transit" />
                  <Label htmlFor="transit">In Transit</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="safe" id="safe" />
                  <Label htmlFor="safe">Locked in Safe</Label>
                </div>
              </RadioGroup>
              {formMethods.formState.errors.moneyLocation && (
                <p className="text-sm text-red-600 mt-1">
                  {formMethods.formState.errors.moneyLocation.message}
                </p>
              )}
            </div>
          </div>
        </FormSection>
      )
    },
    {
      id: 'transit',
      title: 'If loss was in transit',
      component: (
        <FormSection title="Transit Loss Details" description="Complete this section if money was lost in transit">
          <div className="space-y-4">
            <div>
              <Label htmlFor="discovererName">Name of person who discovered loss *</Label>
              <Input
                {...formMethods.register('discovererName')}
                placeholder="Enter name"
              />
              {formMethods.formState.errors.discovererName && (
                <p className="text-sm text-red-600 mt-1">
                  {formMethods.formState.errors.discovererName.message}
                </p>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="discovererPosition">Position</Label>
                <Input
                  {...formMethods.register('discovererPosition')}
                  placeholder="Enter position"
                />
              </div>
              
              <div>
                <Label htmlFor="discovererSalary">Salary (₦)</Label>
                <Input
                  type="number"
                  step="0.01"
                  {...formMethods.register('discovererSalary')}
                  placeholder="Enter salary"
                />
              </div>
            </div>
            
            <div>
              <Label>Was there a police escort?</Label>
              <RadioGroup
                value={watchedValues.policeEscort}
                onValueChange={(value: 'yes' | 'no') => setValue('policeEscort', value)}
                className="flex space-x-4 mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="escort-yes" />
                  <Label htmlFor="escort-yes">Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="escort-no" />
                  <Label htmlFor="escort-no">No</Label>
                </div>
              </RadioGroup>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="amountAtStart">How much was in employee's possession at journey start? (₦)</Label>
                <Input
                  type="number"
                  step="0.01"
                  {...formMethods.register('amountAtStart')}
                  placeholder="Enter amount"
                />
              </div>
              
              <div>
                <Label htmlFor="disbursements">What disbursements were made by him during journey? (₦)</Label>
                <Input
                  type="number"
                  step="0.01"
                  {...formMethods.register('disbursements')}
                  placeholder="Enter disbursements"
                />
              </div>
            </div>
            
            <div>
              <Label>Any reason to doubt integrity of employee?</Label>
              <RadioGroup
                value={watchedValues.doubtIntegrity}
                onValueChange={(value: 'yes' | 'no') => setValue('doubtIntegrity', value)}
                className="flex space-x-4 mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="doubt-yes" />
                  <Label htmlFor="doubt-yes">Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="doubt-no" />
                  <Label htmlFor="doubt-no">No</Label>
                </div>
              </RadioGroup>
            </div>
            
            {watchedValues.doubtIntegrity === 'yes' && (
              <div>
                <Label htmlFor="integrityExplanation">Explanation</Label>
                <Textarea
                  {...formMethods.register('integrityExplanation')}
                  placeholder="Explain your concerns"
                  rows={3}
                />
              </div>
            )}
          </div>
        </FormSection>
      )
    },
    {
      id: 'safe',
      title: 'If loss was in safe',
      component: (
        <FormSection title="Safe Loss Details" description="Complete this section if money was lost from a safe">
          <div className="space-y-4">
            <div>
              <Label htmlFor="discovererName">Name of person who discovered loss</Label>
              <Input
                {...formMethods.register('discovererName')}
                placeholder="Enter name"
              />
            </div>
            
            <div>
              <Label htmlFor="safeType">Was the safe bricked into wall or standing free?</Label>
              <select
                {...formMethods.register('safeType')}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="">Select option</option>
                <option value="bricked">Bricked into wall</option>
                <option value="standing">Standing free</option>
              </select>
            </div>
            
            <div>
              <Label>Names, positions, salaries of employees in charge of keys</Label>
              {watchedValues.keyholders?.map((_, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2 p-4 border rounded">
                  <div>
                    <Label htmlFor={`keyholders.${index}.name`}>Name</Label>
                    <Input
                      {...formMethods.register(`keyholders.${index}.name`)}
                      placeholder="Enter name"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`keyholders.${index}.position`}>Position</Label>
                    <Input
                      {...formMethods.register(`keyholders.${index}.position`)}
                      placeholder="Enter position"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`keyholders.${index}.salary`}>Salary (₦)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      {...formMethods.register(`keyholders.${index}.salary`)}
                      placeholder="Enter salary"
                    />
                  </div>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const current = getValues('keyholders') || [];
                  setValue('keyholders', [...current, { name: '', position: '', salary: 0 }]);
                }}
                className="mt-2"
              >
                Add Another Keyholder
              </Button>
            </div>
          </div>
        </FormSection>
      )
    },
    {
      id: 'general',
      title: 'General',
      component: (
        <FormSection title="General Information" description="Additional details about the loss">
          <div className="space-y-4">
            <div>
              <Label htmlFor="howItHappened">How did it happen? *</Label>
              <Textarea
                {...formMethods.register('howItHappened')}
                placeholder="Describe how the loss occurred"
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
            
            <div>
              <Label>Previous loss under the policy? *</Label>
              <RadioGroup
                value={watchedValues.previousLoss}
                onValueChange={(value: 'yes' | 'no') => setValue('previousLoss', value)}
                className="flex space-x-4 mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="previous-yes" />
                  <Label htmlFor="previous-yes">Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="previous-no" />
                  <Label htmlFor="previous-no">No</Label>
                </div>
              </RadioGroup>
              {formMethods.formState.errors.previousLoss && (
                <p className="text-sm text-red-600 mt-1">
                  {formMethods.formState.errors.previousLoss.message}
                </p>
              )}
            </div>
            
            {watchedValues.previousLoss === 'yes' && (
              <div>
                <Label htmlFor="previousLossDetails">Details of previous loss</Label>
                <Textarea
                  {...formMethods.register('previousLossDetails')}
                  placeholder="Provide details of previous loss"
                  rows={3}
                />
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="lossAmount">What is the amount of loss? (₦) *</Label>
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
                <Label htmlFor="lossDescription">What did it consist of? *</Label>
                <Textarea
                  {...formMethods.register('lossDescription')}
                  placeholder="Describe what was lost"
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
      title: 'Declaration & Signature',
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
              id="declarationTrue"
              checked={watchedValues.declarationTrue || false}
              onCheckedChange={(checked) => formMethods.setValue('declarationTrue', !!checked)}
            />
            <Label htmlFor="declarationTrue">I agree that statements are true *</Label>
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
              Your money insurance claim has been submitted successfully. 
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
          <h1 className="text-3xl font-bold text-gray-900">Money Insurance Claim Form</h1>
          <p className="text-gray-600 mt-2">Submit your claim for money insurance</p>
        </div>

        <MultiStepForm
          steps={steps}
          onSubmit={onFinalSubmit}
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
                <h3 className="font-semibold">Company Details</h3>
                <p>Company: {watchedValues.companyName}</p>
                <p>Email: {watchedValues.email}</p>
                <p>Phone: {watchedValues.phone}</p>
              </div>
              
              <div>
                <h3 className="font-semibold">Loss Details</h3>
                <p>Amount: ₦{watchedValues.lossAmount}</p>
                <p>Description: {watchedValues.lossDescription}</p>
                <p>Date: {watchedValues.lossDate?.toString()}</p>
              </div>
              
              <div className="flex space-x-4">
                <Button variant="outline" onClick={() => setShowSummary(false)}>
                  Edit Details
                </Button>
                <Button onClick={() => handleSubmit(getValues())} disabled={isSubmitting}>
                  {isSubmitting ? 'Submitting...' : 'Confirm & Submit'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        
        {/* Success Modal */}
        <SuccessModal
          isOpen={showSuccess || authShowSuccess || authSubmitting}
          onClose={() => {
            setShowSuccess(false);
            setAuthShowSuccess();
          }}
          title="Money Insurance Claim Submitted!"
          formType="Money Insurance Claim"
          isLoading={authSubmitting}
          loadingMessage="Your money insurance claim is being processed and submitted..."
        />
      </div>

      {/* Post-Authentication Loading Overlay */}
      {showPostAuthLoading && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-card p-8 rounded-lg shadow-lg animate-scale-in max-w-md mx-4">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
              <h3 className="text-xl font-semibold text-primary">Processing Your Submission</h3>
              <p className="text-muted-foreground">
                Thank you for signing in! Your money insurance claim is now being submitted...
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MoneyInsuranceClaim;
