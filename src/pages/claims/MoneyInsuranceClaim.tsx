
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import MultiStepForm from '../../components/common/MultiStepForm';
import FormSection from '../../components/common/FormSection';
import PhoneInput from '../../components/common/PhoneInput';
import FileUpload from '../../components/common/FileUpload';
import { useFormDraft } from '../../hooks/useFormDraft';
import { useAuthRequiredSubmit } from '../../hooks/useAuthRequiredSubmit';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '../../components/ui/radio-group';
import { Label } from '../../components/ui/label';
import { Checkbox } from '../../components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { uploadFormFiles } from '../../services/fileService';
import SuccessModal from '../../components/common/SuccessModal';

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
  howItHappened: yup.string().required('How it happened is required'),
  policeNotified: yup.string().oneOf(['yes', 'no']).required('Police notification status is required'),
  policeStation: yup.string().when('policeNotified', {
    is: 'yes',
    then: (schema) => schema.required('Police station is required when police is notified')
  }),
  lossAmount: yup.number().min(0, 'Loss amount must be positive').required('Loss amount is required'),
  lossDescription: yup.string().required('Loss description is required'),
  declarationAccepted: yup.boolean().oneOf([true], 'Declaration required'),
  signature: yup.string().required('Signature required'),
  signatureDate: yup.date().required('Signature date required')
});

type MoneyInsuranceData = yup.InferType<typeof moneyInsuranceSchema>;

const defaultValues: Partial<MoneyInsuranceData> = {
  signatureDate: new Date(),
  policeNotified: 'no'
};

const MoneyInsuranceClaim: React.FC = () => {
  const [showSummary, setShowSummary] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File>>({});

  const formMethods = useForm({
    resolver: yupResolver(moneyInsuranceSchema),
    defaultValues,
    mode: 'onChange'
  });

  const { watch, handleSubmit, setValue } = formMethods;
  const { saveDraft, loadDraft } = useFormDraft('money-insurance-claim', formMethods);
  const { 
    handleSubmitWithAuth, 
    showSuccess, 
    setShowSuccess, 
    isSubmitting 
  } = useAuthRequiredSubmit();
  
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

  const onSubmit = async (data: MoneyInsuranceData) => {
    try {
      // Upload files if any
      let fileUrls = {};
      if (Object.keys(uploadedFiles).length > 0) {
        fileUrls = await uploadFormFiles(uploadedFiles, 'money-insurance-claims');
      }

      const submissionData = {
        ...data,
        ...fileUrls,
        formType: 'money-insurance-claim'
      };

      await handleSubmitWithAuth(submissionData, 'money-insurance-claim');
    } catch (error) {
      console.error('Submission error:', error);
    }
  };

  const handleFormSubmit = () => {
    setShowSummary(true);
  };

  const handleFileSelect = (key: string, file: File) => {
    setUploadedFiles(prev => ({ ...prev, [key]: file }));
  };

  const handleFileRemove = (key: string) => {
    setUploadedFiles(prev => {
      const updated = { ...prev };
      delete updated[key];
      return updated;
    });
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
        <FormSection title="Company Information" description="Enter the insured company details">
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
      title: 'Loss Details',
      component: (
        <FormSection title="Loss Information" description="Provide details about the loss">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="lossDate">Date of Loss *</Label>
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
                <Label htmlFor="lossTime">Time of Loss *</Label>
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
              <Label htmlFor="lossLocation">Where did the loss occur? *</Label>
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
              <Label htmlFor="howItHappened">How did the loss occur? *</Label>
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
                <Label htmlFor="policeStation">Police Station *</Label>
                <Input
                  {...formMethods.register('policeStation')}
                  placeholder="Enter police station name"
                />
                {formMethods.formState.errors.policeStation && (
                  <p className="text-sm text-red-600 mt-1">
                    {formMethods.formState.errors.policeStation.message}
                  </p>
                )}
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
      id: 'documents',
      title: 'Documents',
      component: (
        <FormSection title="Upload Supporting Documents" description="Please upload any relevant documents">
          <div className="space-y-6">
            <FileUpload
              label="Police Report"
              onFileSelect={(file) => handleFileSelect('policeReport', file)}
              onFileRemove={() => handleFileRemove('policeReport')}
              currentFile={uploadedFiles.policeReport}
            />
            
            <FileUpload
              label="Evidence Photos"
              onFileSelect={(file) => handleFileSelect('photos', file)}
              onFileRemove={() => handleFileRemove('photos')}
              currentFile={uploadedFiles.photos}
            />
            
            <FileUpload
              label="Other Supporting Documents"
              onFileSelect={(file) => handleFileSelect('otherDocuments', file)}
              onFileRemove={() => handleFileRemove('otherDocuments')}
              currentFile={uploadedFiles.otherDocuments}
            />
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">Money Insurance Claim Form</h1>
          <p className="text-gray-600 mt-2">Submit your claim for money insurance</p>
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
                <Button onClick={handleSubmit(onSubmit)} disabled={isSubmitting}>
                  {isSubmitting ? 'Submitting...' : 'Confirm & Submit'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <SuccessModal
          isOpen={showSuccess}
          onClose={() => setShowSuccess(false)}
          title="Claim Submitted Successfully!"
          message="Your money insurance claim has been submitted successfully. You will receive a confirmation email shortly."
          formType="Money Insurance Claim"
        />
      </div>
    </div>
  );
};

export default MoneyInsuranceClaim;
