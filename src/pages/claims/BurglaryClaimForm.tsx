import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { toast } from 'sonner';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import FormSection from '../../components/common/FormSection';
import MultiStepForm from '../../components/common/MultiStepForm';
import PhoneInput from '../../components/common/PhoneInput';
import { useAuthRequiredSubmit } from '../../hooks/useAuthRequiredSubmit';
import { uploadFormFiles } from '../../services/fileService';
import { RadioGroup, RadioGroupItem } from '../../components/ui/radio-group';
import { Label } from '../../components/ui/label';
import { Checkbox } from '../../components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import SuccessModal from '../../components/common/SuccessModal';

const burglarySchema = yup.object().shape({
  policyNumber: yup.string().required('Policy number is required'),
  periodOfCoverFrom: yup.date().required('Period start date is required'),
  periodOfCoverTo: yup.date().required('Period end date is required'),
  insuredName: yup.string().required('Insured name is required'),
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
  witnessDetails: yup.string(),
  stolenItems: yup.string().required('Stolen items description is required'),
  estimatedValue: yup.number().min(0, 'Value must be positive').required('Estimated value is required'),
  declarationAccepted: yup.boolean().oneOf([true], 'Declaration must be accepted'),
  signature: yup.string().required('Signature required'),
  signatureDate: yup.date().required('Signature date required')
});

type BurglaryData = yup.InferType<typeof burglarySchema>;

const defaultValues: Partial<BurglaryData> = {
  signatureDate: new Date(),
  policeNotified: 'no'
};

const BurglaryClaimForm: React.FC = () => {
  const [showSummary, setShowSummary] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File>>({});

  const formMethods = useForm({
    resolver: yupResolver(burglarySchema),
    defaultValues,
    mode: 'onChange'
  });

  const { watch, handleSubmit, setValue } = formMethods;
  const { 
    handleSubmitWithAuth, 
    showSuccess, 
    setShowSuccess, 
    isSubmitting 
  } = useAuthRequiredSubmit();

  const watchedValues = watch();

  const onSubmit = async (data: any) => {
    try {
      const fileUrls = await uploadFormFiles(uploadedFiles, 'burglary-claims');
      const submissionData = {
        ...data,
        files: fileUrls,
        formType: 'burglary-claim',
        submissionId: `BUR-${Date.now()}`,
        submittedAt: new Date().toISOString()
      };

      await handleSubmitWithAuth(submissionData, 'burglary-claims');
    } catch (error) {
      console.error('Submission error:', error);
      toast.error('Failed to submit claim. Please try again.');
    }
  };

  const steps = [
    {
      id: 'policy-details',
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
      id: 'insured-details',
      title: 'Insured Details',
      component: (
        <FormSection title="Insured Information" description="Enter the insured details">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="insuredName">Insured Name *</Label>
              <Input
                {...formMethods.register('insuredName')}
                placeholder="Enter insured name"
              />
              {formMethods.formState.errors.insuredName && (
                <p className="text-sm text-red-600 mt-1">
                  {formMethods.formState.errors.insuredName.message}
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
      id: 'loss-details',
      title: 'Loss Details',
      component: (
        <FormSection title="Details of Loss" description="Provide information about the burglary">
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
            
            <div className="md:col-span-2">
              <Label htmlFor="lossLocation">Location of Loss *</Label>
              <Textarea
                {...formMethods.register('lossLocation')}
                placeholder="Describe where the burglary occurred"
                rows={2}
              />
              {formMethods.formState.errors.lossLocation && (
                <p className="text-sm text-red-600 mt-1">
                  {formMethods.formState.errors.lossLocation.message}
                </p>
              )}
            </div>
            
            <div className="md:col-span-2">
              <Label htmlFor="howItHappened">How it Happened *</Label>
              <Textarea
                {...formMethods.register('howItHappened')}
                placeholder="Describe how the burglary occurred"
                rows={4}
              />
              {formMethods.formState.errors.howItHappened && (
                <p className="text-sm text-red-600 mt-1">
                  {formMethods.formState.errors.howItHappened.message}
                </p>
              )}
            </div>
            
            <div className="md:col-span-2">
              <Label>Was the police notified? *</Label>
              <RadioGroup
                value={watchedValues.policeNotified || ''}
                onValueChange={(value) => setValue('policeNotified', value)}
                className="flex flex-row space-x-4 mt-2"
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
              <div className="md:col-span-2">
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
            
            <div className="md:col-span-2">
              <Label htmlFor="witnessDetails">Witness Details</Label>
              <Textarea
                {...formMethods.register('witnessDetails')}
                placeholder="Provide witness information if any"
                rows={3}
              />
            </div>
            
            <div className="md:col-span-2">
              <Label htmlFor="stolenItems">Stolen Items *</Label>
              <Textarea
                {...formMethods.register('stolenItems')}
                placeholder="List all stolen items"
                rows={4}
              />
              {formMethods.formState.errors.stolenItems && (
                <p className="text-sm text-red-600 mt-1">
                  {formMethods.formState.errors.stolenItems.message}
                </p>
              )}
            </div>
            
            <div>
              <Label htmlFor="estimatedValue">Estimated Value (₦) *</Label>
              <Input
                type="number"
                {...formMethods.register('estimatedValue')}
                placeholder="Enter estimated value"
                min="0"
                step="0.01"
              />
              {formMethods.formState.errors.estimatedValue && (
                <p className="text-sm text-red-600 mt-1">
                  {formMethods.formState.errors.estimatedValue.message}
                </p>
              )}
            </div>
          </div>
        </FormSection>
      )
    },
    {
      id: 'declaration',
      title: 'Declaration',
      component: (
        <FormSection title="Declaration and Signature" description="Complete your claim submission">
          <div className="space-y-4">
            <div className="flex items-start space-x-2">
              <Checkbox
                id="declarationAccepted"
                checked={watchedValues.declarationAccepted || false}
                onCheckedChange={(checked) => setValue('declarationAccepted', checked)}
              />
              <Label htmlFor="declarationAccepted" className="text-sm">
                I declare that the information provided is true and complete to the best of my knowledge
                and belief. I understand that any false information may void this claim.
              </Label>
            </div>
            {formMethods.formState.errors.declarationAccepted && (
              <p className="text-sm text-red-600">
                {formMethods.formState.errors.declarationAccepted.message}
              </p>
            )}
            
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
        </FormSection>
      )
    }
  ];

  const handleFormSubmit = (data: any) => {
    setShowSummary(true);
  };

  const confirmSubmission = () => {
    setShowSummary(false);
    handleSubmit(onSubmit)();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Burglary Claim Form
            </h1>
            <p className="text-gray-600">
              Submit your burglary claim with all required details
            </p>
          </div>

          <MultiStepForm
            steps={steps}
            onSubmit={handleFormSubmit}
            formMethods={formMethods}
            uploadedFiles={uploadedFiles}
            setUploadedFiles={setUploadedFiles}
          />
        </div>

        <Dialog open={showSummary} onOpenChange={setShowSummary}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Confirm Submission</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p>Please review your burglary claim details before submitting:</p>
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <p><strong>Policy Number:</strong> {watchedValues.policyNumber}</p>
                <p><strong>Insured Name:</strong> {watchedValues.insuredName}</p>
                <p><strong>Loss Date:</strong> {watchedValues.lossDate}</p>
                <p><strong>Estimated Value:</strong> ₦{watchedValues.estimatedValue}</p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowSummary(false)}>
                Back to Edit
              </Button>
              <Button onClick={confirmSubmission} disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Submit Claim'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <SuccessModal
          isOpen={showSuccess}
          onClose={() => setShowSuccess(false)}
          title="Claim Submitted Successfully!"
          message="Your burglary claim has been submitted successfully. You will receive a confirmation email shortly."
          formType="Burglary Claim"
        />
      </div>
    </div>
  );
};

export default BurglaryClaimForm;