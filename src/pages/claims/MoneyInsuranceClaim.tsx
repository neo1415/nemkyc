import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { MultiStepForm } from '../../components/common/MultiStepForm';
import { FormSection } from '../../components/common/FormSection';
import { PhoneInput } from '../../components/common/PhoneInput';
import { useToast } from '../../hooks/use-toast';
import { useFormDraft } from '../../hooks/useFormDraft';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '../../components/ui/radio-group';
import { Label } from '../../components/ui/label';
import { Checkbox } from '../../components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { CalendarIcon, CheckCircle } from 'lucide-react';
import { Calendar } from '../../components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../../components/ui/popover';
import { format } from 'date-fns';
import { cn } from '../../lib/utils';

const moneyInsuranceSchema = z.object({
  policyNumber: z.string().min(1, 'Policy number is required'),
  periodOfCoverFrom: z.date({ required_error: 'Period start date is required' }),
  periodOfCoverTo: z.date({ required_error: 'Period end date is required' }),
  companyName: z.string().min(1, 'Company name is required'),
  address: z.string().min(1, 'Address is required'),
  phone: z.string().min(1, 'Phone is required'),
  email: z.string().email('Invalid email'),
  lossDate: z.date({ required_error: 'Loss date is required' }),
  lossTime: z.string().min(1, 'Loss time is required'),
  lossLocation: z.string().min(1, 'Loss location is required'),
  moneyLocation: z.enum(['in transit', 'locked in safe']),
  policeEscort: z.enum(['yes', 'no']).optional(),
  employeePossessionAmount: z.number().min(0, 'Amount must be positive').optional(),
  disbursementsMade: z.number().min(0, 'Amount must be positive').optional(),
  doubtEmployeeIntegrity: z.enum(['yes', 'no']).optional(),
  integrityExplanation: z.string().optional(),
  discovererSafe: z.string().optional(),
  howItHappened: z.string().min(1, 'How it happened is required'),
  policeNotified: z.enum(['yes', 'no']),
  policeStation: z.string().optional(),
  previousLoss: z.enum(['yes', 'no']),
  previousLossDetails: z.string().optional(),
  lossAmount: z.number().min(0, 'Loss amount must be positive'),
  lossDescription: z.string().min(1, 'Loss description is required'),
  declarationAccepted: z.boolean().refine((val) => val === true, 'Declaration required'),
  signature: z.string().min(1, 'Signature required'),
  signatureDate: z.date({ required_error: 'Signature date required' })
});

type MoneyInsuranceData = z.infer<typeof moneyInsuranceSchema>;

const defaultValues: Partial<MoneyInsuranceData> = {
  signatureDate: new Date(),
  policeNotified: 'no',
  previousLoss: 'no',
  policeEscort: 'no',
  doubtEmployeeIntegrity: 'no',
  moneyLocation: 'in transit'
};

export const MoneyInsuranceClaim: React.FC = () => {
  const [showSummary, setShowSummary] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const formMethods = useForm<MoneyInsuranceData>({
    resolver: yupResolver(moneyInsuranceSchema),
    defaultValues,
    mode: 'onChange'
  });

  const { saveDraft, clearDraft } = useFormDraft('money-insurance-claim', formMethods);

  useEffect(() => {
    const subscription = formMethods.watch((data) => {
      saveDraft(data);
    });
    return () => subscription.unsubscribe();
  }, [formMethods, saveDraft]);

  const onSubmit = async (data: MoneyInsuranceData) => {
    setShowSummary(true);
  };

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    try {
      const formData = formMethods.getValues();
      
      const cleanData = Object.fromEntries(
        Object.entries(formData).filter(([_, value]) => value !== undefined)
      );

      const submissionData = {
        ...cleanData,
        status: 'processing',
        submittedAt: new Date().toISOString(),
        formType: 'money-insurance-claim'
      };

      await addDoc(collection(db, 'moneyInsuranceClaims'), submissionData);

      // await emailService.sendSubmissionConfirmation({...});

      clearDraft();
      setShowSummary(false);
      setShowSuccess(true);
      
      toast({
        title: "Claim Submitted Successfully",
        description: "Your money insurance claim has been submitted.",
      });
    } catch (error) {
      console.error('Submission error:', error);
      toast({
        title: "Submission Error",
        description: "There was an error submitting your claim.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const DatePickerField = ({ name, label }: { name: keyof MoneyInsuranceData; label: string }) => (
    <div className="space-y-2">
      <Label htmlFor={name}>{label} *</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !formMethods.watch(name) && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {formMethods.watch(name) ? (
              format(formMethods.watch(name) as Date, "PPP")
            ) : (
              <span>Pick a date</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={formMethods.watch(name) as Date}
            onSelect={(date) => date && formMethods.setValue(name, date)}
            initialFocus
            className="pointer-events-auto"
          />
        </PopoverContent>
      </Popover>
      {formMethods.formState.errors[name] && (
        <p className="text-sm text-destructive">{formMethods.formState.errors[name]?.message}</p>
      )}
    </div>
  );

  const steps = [
    {
      id: 'policy-details',
      title: 'Policy Details',
      component: (
        <FormSection title="Policy Information">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="policyNumber">Policy Number *</Label>
              <Input
                id="policyNumber"
                {...formMethods.register('policyNumber')}
                placeholder="Enter policy number"
              />
              {formMethods.formState.errors.policyNumber && (
                <p className="text-sm text-destructive">{formMethods.formState.errors.policyNumber.message}</p>
              )}
            </div>
            <DatePickerField name="periodOfCoverFrom" label="Period of Cover From" />
            <DatePickerField name="periodOfCoverTo" label="Period of Cover To" />
          </div>
        </FormSection>
      )
    },
    {
      id: 'general',
      title: 'General',
      component: (
        <FormSection title="General Information">
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="howItHappened">How did it happen? *</Label>
              <Textarea
                id="howItHappened"
                {...formMethods.register('howItHappened')}
                placeholder="Describe how the loss occurred"
                rows={4}
              />
              {formMethods.formState.errors.howItHappened && (
                <p className="text-sm text-destructive">{formMethods.formState.errors.howItHappened.message}</p>
              )}
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Have police been notified? *</Label>
                <RadioGroup
                  value={formMethods.watch('policeNotified')}
                  onValueChange={(value) => formMethods.setValue('policeNotified', value as 'yes' | 'no')}
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
              </div>
              {formMethods.watch('policeNotified') === 'yes' && (
                <div className="space-y-2">
                  <Label htmlFor="policeStation">Police Station</Label>
                  <Input
                    id="policeStation"
                    {...formMethods.register('policeStation')}
                    placeholder="Enter police station name"
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="lossAmount">What is the amount of loss? *</Label>
                <Input
                  id="lossAmount"
                  type="number"
                  step="0.01"
                  {...formMethods.register('lossAmount', { valueAsNumber: true })}
                  placeholder="Enter loss amount"
                />
                {formMethods.formState.errors.lossAmount && (
                  <p className="text-sm text-destructive">{formMethods.formState.errors.lossAmount.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="lossDescription">What did it consist of? *</Label>
              <Textarea
                id="lossDescription"
                {...formMethods.register('lossDescription')}
                placeholder="Describe what the loss consisted of"
                rows={3}
              />
              {formMethods.formState.errors.lossDescription && (
                <p className="text-sm text-destructive">{formMethods.formState.errors.lossDescription.message}</p>
              )}
            </div>
          </div>
        </FormSection>
      )
    },
    {
      id: 'declaration',
      title: 'Declaration & Signature',
      component: (
        <FormSection title="Data Privacy & Declaration">
          <div className="space-y-6">
            <div className="p-4 bg-muted rounded-lg">
              <h3 className="font-semibold mb-2">Data Privacy</h3>
              <div className="text-sm space-y-2">
                <p>i. Your data will solemnly be used for the purposes of this business contract and also to enable us reach you with updates about our products and services.</p>
                <p>ii. Please note that your personal data will be treated with utmost respect and is well secured as required by Nigeria Data Protection Regulations 2019.</p>
                <p>iii. Your personal data shall not be shared with or sold to any third-party without your consent unless we are compelled by law or regulator.</p>
              </div>
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <h3 className="font-semibold mb-2">Declaration</h3>
              <div className="text-sm space-y-2">
                <p>1. I/We declare to the best of my/our knowledge and belief that the information given on this form is true in every respect and agree that if I/we have made any false or fraudulent statement, be it suppression or concealment, the policy shall be cancelled and the claim shall be forfeited.</p>
                <p>2. I/We agree to provide additional information to NEM Insurance, if required.</p>
                <p>3. I/We agree to submit all required and requested for documents and NEM Insurance shall not be held responsible for any delay in settlement of claim due to non-fulfillment of requirements.</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="declarationAccepted"
                  checked={formMethods.watch('declarationAccepted')}
                  onCheckedChange={(checked) => formMethods.setValue('declarationAccepted', checked as boolean)}
                />
                <Label htmlFor="declarationAccepted">
                  I accept the above declaration and data privacy policy *
                </Label>
              </div>
              {formMethods.formState.errors.declarationAccepted && (
                <p className="text-sm text-destructive">{formMethods.formState.errors.declarationAccepted.message}</p>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="signature">Digital Signature *</Label>
                  <Input
                    id="signature"
                    {...formMethods.register('signature')}
                    placeholder="Type your full name as signature"
                  />
                  {formMethods.formState.errors.signature && (
                    <p className="text-sm text-destructive">{formMethods.formState.errors.signature.message}</p>
                  )}
                </div>
                <DatePickerField name="signatureDate" label="Date" />
              </div>
            </div>
          </div>
        </FormSection>
      )
    }
  ];

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Money Insurance Claim Form</h1>
          <p className="text-muted-foreground mt-2">
            Please fill out all required information to process your claim.
          </p>
        </div>

        <MultiStepForm
          steps={steps}
          onSubmit={onSubmit}
          isSubmitting={isSubmitting}
          submitButtonText="Submit Claim"
          formMethods={formMethods}
        />

        <Dialog open={showSummary} onOpenChange={setShowSummary}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Claim Summary</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowSummary(false)}>
                  Edit
                </Button>
                <Button onClick={handleFinalSubmit} disabled={isSubmitting}>
                  {isSubmitting ? 'Submitting...' : 'Confirm Submit'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle className="h-6 w-6 text-green-600" />
                Claim Submitted Successfully
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p>Your money insurance claim has been submitted successfully.</p>
              <Button onClick={() => setShowSuccess(false)} className="w-full">
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};