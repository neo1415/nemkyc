import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase/config';
import MultiStepForm from '@/components/common/MultiStepForm';
import FormSection from '@/components/common/FormSection';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { useFormDraft } from '@/hooks/useFormDraft';
import { emailService } from '@/services/emailService';

interface FidelityGuaranteeClaimData {
  // Policy Details
  policyNumber: string;
  periodOfCoverFrom: string;
  periodOfCoverTo: string;
  
  // Insured Details
  companyName: string;
  address: string;
  phone: string;
  email: string;
  
  // Details of Defaulter
  defaulterName: string;
  defaulterAge: number;
  defaulterAddress: string;
  defaulterOccupation: string;
  dateOfDiscovery: string;
  
  // Details of Default
  defaultDetails: string;
  defaultAmount: number;
  hasPreviousIrregularity: boolean;
  previousIrregularityDetails: string;
  lastCorrectCheckDate: string;
  hasDefaulterProperty: boolean;
  defaulterPropertyDetails: string;
  hasRemunerationDue: boolean;
  remunerationDetails: string;
  hasOtherSecurity: boolean;
  otherSecurityDetails: string;
  
  // Employment Status
  hasBeenDischarged: boolean;
  dischargeDate: string;
  hasSettlementProposal: boolean;
  settlementProposalDetails: string;
  
  // Declaration
  agreeToDataPrivacy: boolean;
  signature: string;
  signatureDate: string;
}

const schema = yup.object().shape({
  policyNumber: yup.string().required('Policy number is required'),
  periodOfCoverFrom: yup.string().required('Period of cover start date is required'),
  periodOfCoverTo: yup.string().required('Period of cover end date is required'),
  companyName: yup.string().required('Company name is required'),
  address: yup.string().required('Address is required'),
  phone: yup.string().required('Phone number is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  defaulterName: yup.string().required('Defaulter name is required'),
  defaulterAge: yup.number().min(1, 'Age must be positive').required('Defaulter age is required'),
  defaulterAddress: yup.string().required('Defaulter address is required'),
  defaulterOccupation: yup.string().required('Defaulter occupation is required'),
  dateOfDiscovery: yup.string().required('Date of discovery is required'),
  defaultDetails: yup.string().required('Default details are required'),
  defaultAmount: yup.number().min(0, 'Amount must be positive').required('Default amount is required'),
  lastCorrectCheckDate: yup.string().required('Last correct check date is required'),
  agreeToDataPrivacy: yup.boolean().oneOf([true], 'You must agree to the data privacy notice'),
  signature: yup.string().required('Signature is required'),
});

const FidelityGuaranteeClaim: React.FC = () => {
  const { toast } = useToast();
  const [showSummary, setShowSummary] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formMethods = useForm<FidelityGuaranteeClaimData>({
    // resolver: yupResolver(schema as any),
    defaultValues: {
      policyNumber: '',
      periodOfCoverFrom: '',
      periodOfCoverTo: '',
      companyName: '',
      address: '',
      phone: '',
      email: '',
      defaulterName: '',
      defaulterAge: 0,
      defaulterAddress: '',
      defaulterOccupation: '',
      dateOfDiscovery: '',
      defaultDetails: '',
      defaultAmount: 0,
      hasPreviousIrregularity: false,
      previousIrregularityDetails: '',
      lastCorrectCheckDate: '',
      hasDefaulterProperty: false,
      defaulterPropertyDetails: '',
      hasRemunerationDue: false,
      remunerationDetails: '',
      hasOtherSecurity: false,
      otherSecurityDetails: '',
      hasBeenDischarged: false,
      dischargeDate: '',
      hasSettlementProposal: false,
      settlementProposalDetails: '',
      agreeToDataPrivacy: false,
      signature: '',
      signatureDate: new Date().toISOString().split('T')[0],
    },
  });

  const watchedValues = formMethods.watch();
  const { saveDraft, loadDraft, clearDraft } = useFormDraft('fidelityGuaranteeClaim', formMethods);

  useEffect(() => {
    loadDraft();
  }, [loadDraft]);

  useEffect(() => {
    saveDraft(watchedValues);
  }, [watchedValues, saveDraft]);

  const handleSubmit = async (data: FidelityGuaranteeClaimData) => {
    setIsSubmitting(true);
    try {
      // Save to Firestore
      const docRef = await addDoc(collection(db, 'fidelityGuaranteeClaims'), {
        ...data,
        submittedAt: new Date(),
        timestamp: serverTimestamp(),
        createdAt: new Date().toLocaleDateString('en-GB'),
        status: 'pending'
      });

      // Send confirmation email
      // await emailService.sendSubmissionConfirmation(
      //   data.email,
      //   'Fidelity Guarantee Claim'
      // );

      clearDraft();
      setShowSummary(false);
      setShowSuccess(true);
      
      toast({
        title: "Claim Submitted Successfully",
        description: "Your fidelity guarantee claim has been submitted and you will receive a confirmation email shortly.",
      });

    } catch (error) {
      toast({
        title: "Submission Error",
        description: "There was an error submitting your claim. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const onFinalSubmit = (data: FidelityGuaranteeClaimData) => {
    // Check data privacy agreement and signature before showing summary
    if (!data.agreeToDataPrivacy) {
      toast({
        title: "Agreement Required",
        description: "You must agree to the data privacy notice and declaration.",
        variant: "destructive",
      });
      return;
    }

    if (!data.signature || data.signature.trim() === '') {
      toast({
        title: "Signature Required",
        description: "Please provide your digital signature.",
        variant: "destructive",
      });
      return;
    }

    setShowSummary(true);
  };

  const steps = [
    {
      id: "policy-details",
      title: "Policy Details",
      component: (
        <FormSection title="Policy Information" description="Enter your policy details">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="policyNumber">Policy Number *</Label>
              <Input
                id="policyNumber"
                {...formMethods.register('policyNumber')}
                placeholder="Enter policy number"
              />
              {formMethods.formState.errors.policyNumber && (
                <p className="text-sm text-red-600 mt-1">{formMethods.formState.errors.policyNumber.message}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="periodOfCoverFrom">Period of Cover From *</Label>
                <Input
                  id="periodOfCoverFrom"
                  type="date"
                  {...formMethods.register('periodOfCoverFrom')}
                />
                {formMethods.formState.errors.periodOfCoverFrom && (
                  <p className="text-sm text-red-600 mt-1">{formMethods.formState.errors.periodOfCoverFrom.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="periodOfCoverTo">To *</Label>
                <Input
                  id="periodOfCoverTo"
                  type="date"
                  {...formMethods.register('periodOfCoverTo')}
                />
                {formMethods.formState.errors.periodOfCoverTo && (
                  <p className="text-sm text-red-600 mt-1">{formMethods.formState.errors.periodOfCoverTo.message}</p>
                )}
              </div>
            </div>
          </div>
        </FormSection>
      ),
    },
    {
      id: "insured-details", 
      title: "Insured Details",
      component: (
        <FormSection title="Company Information" description="Enter your company details">
          <div className="space-y-4">
            <div>
              <Label htmlFor="companyName">Company Name *</Label>
              <Input
                id="companyName"
                {...formMethods.register('companyName')}
                placeholder="Enter company name"
              />
              {formMethods.formState.errors.companyName && (
                <p className="text-sm text-red-600 mt-1">{formMethods.formState.errors.companyName.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="address">Address *</Label>
              <Textarea
                id="address"
                {...formMethods.register('address')}
                placeholder="Enter company address"
                rows={3}
              />
              {formMethods.formState.errors.address && (
                <p className="text-sm text-red-600 mt-1">{formMethods.formState.errors.address.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  {...formMethods.register('phone')}
                  placeholder="Enter phone number"
                />
                {formMethods.formState.errors.phone && (
                  <p className="text-sm text-red-600 mt-1">{formMethods.formState.errors.phone.message}</p>
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
                  <p className="text-sm text-red-600 mt-1">{formMethods.formState.errors.email.message}</p>
                )}
              </div>
            </div>
          </div>
        </FormSection>
      ),
    },
    {
      id: "defaulter-details",
      title: "Details of Defaulter",
      component: (
        <FormSection title="Defaulter Information" description="Provide details about the defaulter">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="defaulterName">Name *</Label>
                <Input
                  id="defaulterName"
                  {...formMethods.register('defaulterName')}
                  placeholder="Enter defaulter's name"
                />
                {formMethods.formState.errors.defaulterName && (
                  <p className="text-sm text-red-600 mt-1">{formMethods.formState.errors.defaulterName.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="defaulterAge">Age *</Label>
                <Input
                  id="defaulterAge"
                  type="number"
                  {...formMethods.register('defaulterAge', { valueAsNumber: true })}
                  placeholder="Enter age"
                />
                {formMethods.formState.errors.defaulterAge && (
                  <p className="text-sm text-red-600 mt-1">{formMethods.formState.errors.defaulterAge.message}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="defaulterAddress">Present Address *</Label>
              <Textarea
                id="defaulterAddress"
                {...formMethods.register('defaulterAddress')}
                placeholder="Enter defaulter's current address"
                rows={3}
              />
              {formMethods.formState.errors.defaulterAddress && (
                <p className="text-sm text-red-600 mt-1">{formMethods.formState.errors.defaulterAddress.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="defaulterOccupation">Occupation *</Label>
                <Input
                  id="defaulterOccupation"
                  {...formMethods.register('defaulterOccupation')}
                  placeholder="Enter occupation"
                />
                {formMethods.formState.errors.defaulterOccupation && (
                  <p className="text-sm text-red-600 mt-1">{formMethods.formState.errors.defaulterOccupation.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="dateOfDiscovery">Date of Discovery of Default *</Label>
                <Input
                  id="dateOfDiscovery"
                  type="date"
                  {...formMethods.register('dateOfDiscovery')}
                />
                {formMethods.formState.errors.dateOfDiscovery && (
                  <p className="text-sm text-red-600 mt-1">{formMethods.formState.errors.dateOfDiscovery.message}</p>
                )}
              </div>
            </div>
          </div>
        </FormSection>
      ),
    },
    {
      id: "default-details",
      title: "Details of Default",
      component: (
        <FormSection title="Default Information" description="Provide details about the default">
          <div className="space-y-4">
            <div>
              <Label htmlFor="defaultDetails">How long, and in what manner, has the default been carried out and concealed? *</Label>
              <Textarea
                id="defaultDetails"
                {...formMethods.register('defaultDetails')}
                placeholder="Provide detailed explanation of the default"
                rows={4}
              />
              {formMethods.formState.errors.defaultDetails && (
                <p className="text-sm text-red-600 mt-1">{formMethods.formState.errors.defaultDetails.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="defaultAmount">Amount of the Default (₦) *</Label>
              <Input
                id="defaultAmount"
                type="number"
                step="0.01"
                {...formMethods.register('defaultAmount', { valueAsNumber: true })}
                placeholder="0.00"
              />
              {formMethods.formState.errors.defaultAmount && (
                <p className="text-sm text-red-600 mt-1">{formMethods.formState.errors.defaultAmount.message}</p>
              )}
            </div>

            <div>
              <Label>Previous irregularity in accounts? *</Label>
              <div className="flex items-center space-x-4 mt-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="previousIrregularityYes"
                    checked={watchedValues.hasPreviousIrregularity === true}
                    onCheckedChange={(checked) => formMethods.setValue('hasPreviousIrregularity', !!checked)}
                  />
                  <Label htmlFor="previousIrregularityYes">Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="previousIrregularityNo"
                    checked={watchedValues.hasPreviousIrregularity === false}
                    onCheckedChange={(checked) => formMethods.setValue('hasPreviousIrregularity', !checked)}
                  />
                  <Label htmlFor="previousIrregularityNo">No</Label>
                </div>
              </div>
            </div>

            {watchedValues.hasPreviousIrregularity === true && (
              <div>
                <Label htmlFor="previousIrregularityDetails">Please Explain *</Label>
                <Textarea
                  id="previousIrregularityDetails"
                  {...formMethods.register('previousIrregularityDetails')}
                  placeholder="Provide details about previous irregularities"
                  rows={3}
                />
              </div>
            )}

            <div>
              <Label htmlFor="lastCorrectCheckDate">On what date was the account last checked and found correct? *</Label>
              <Input
                id="lastCorrectCheckDate"
                type="date"
                {...formMethods.register('lastCorrectCheckDate')}
              />
              {formMethods.formState.errors.lastCorrectCheckDate && (
                <p className="text-sm text-red-600 mt-1">{formMethods.formState.errors.lastCorrectCheckDate.message}</p>
              )}
            </div>

            <div>
              <Label>Any property/furniture of the defaulter known? *</Label>
              <div className="flex items-center space-x-4 mt-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="defaulterPropertyYes"
                    checked={watchedValues.hasDefaulterProperty === true}
                    onCheckedChange={(checked) => formMethods.setValue('hasDefaulterProperty', !!checked)}
                  />
                  <Label htmlFor="defaulterPropertyYes">Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="defaulterPropertyNo"
                    checked={watchedValues.hasDefaulterProperty === false}
                    onCheckedChange={(checked) => formMethods.setValue('hasDefaulterProperty', !checked)}
                  />
                  <Label htmlFor="defaulterPropertyNo">No</Label>
                </div>
              </div>
            </div>

            {watchedValues.hasDefaulterProperty === true && (
              <div>
                <Label htmlFor="defaulterPropertyDetails">Please Provide Details *</Label>
                <Textarea
                  id="defaulterPropertyDetails"
                  {...formMethods.register('defaulterPropertyDetails')}
                  placeholder="Describe the property/furniture"
                  rows={3}
                />
              </div>
            )}

            <div>
              <Label>Any salary, commission or other remuneration due to defaulter? *</Label>
              <div className="flex items-center space-x-4 mt-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remunerationYes"
                    checked={watchedValues.hasRemunerationDue === true}
                    onCheckedChange={(checked) => formMethods.setValue('hasRemunerationDue', !!checked)}
                  />
                  <Label htmlFor="remunerationYes">Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remunerationNo"
                    checked={watchedValues.hasRemunerationDue === false}
                    onCheckedChange={(checked) => formMethods.setValue('hasRemunerationDue', !checked)}
                  />
                  <Label htmlFor="remunerationNo">No</Label>
                </div>
              </div>
            </div>

            {watchedValues.hasRemunerationDue === true && (
              <div>
                <Label htmlFor="remunerationDetails">Please Provide Details *</Label>
                <Textarea
                  id="remunerationDetails"
                  {...formMethods.register('remunerationDetails')}
                  placeholder="Describe the remuneration due"
                  rows={3}
                />
              </div>
            )}

            <div>
              <Label>Other security in addition to the guarantee? *</Label>
              <div className="flex items-center space-x-4 mt-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="otherSecurityYes"
                    checked={watchedValues.hasOtherSecurity === true}
                    onCheckedChange={(checked) => formMethods.setValue('hasOtherSecurity', !!checked)}
                  />
                  <Label htmlFor="otherSecurityYes">Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="otherSecurityNo"
                    checked={watchedValues.hasOtherSecurity === false}
                    onCheckedChange={(checked) => formMethods.setValue('hasOtherSecurity', !checked)}
                  />
                  <Label htmlFor="otherSecurityNo">No</Label>
                </div>
              </div>
            </div>

            {watchedValues.hasOtherSecurity === true && (
              <div>
                <Label htmlFor="otherSecurityDetails">Please Provide Details *</Label>
                <Textarea
                  id="otherSecurityDetails"
                  {...formMethods.register('otherSecurityDetails')}
                  placeholder="Describe the other security"
                  rows={3}
                />
              </div>
            )}
          </div>
        </FormSection>
      ),
    },
    {
      id: "employment-status",
      title: "Employment Status",
      component: (
        <FormSection title="Employment Status Information" description="Details about the defaulter's employment status">
          <div className="space-y-4">
            <div>
              <Label>Has the defaulter been discharged? *</Label>
              <div className="flex items-center space-x-4 mt-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="dischargedYes"
                    checked={watchedValues.hasBeenDischarged === true}
                    onCheckedChange={(checked) => formMethods.setValue('hasBeenDischarged', !!checked)}
                  />
                  <Label htmlFor="dischargedYes">Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="dischargedNo"
                    checked={watchedValues.hasBeenDischarged === false}
                    onCheckedChange={(checked) => formMethods.setValue('hasBeenDischarged', !checked)}
                  />
                  <Label htmlFor="dischargedNo">No</Label>
                </div>
              </div>
            </div>

            {watchedValues.hasBeenDischarged === true && (
              <div>
                <Label htmlFor="dischargeDate">Date of Discharge *</Label>
                <Input
                  id="dischargeDate"
                  type="date"
                  {...formMethods.register('dischargeDate')}
                />
              </div>
            )}

            <div>
              <Label>Has a proposal for settlement been put forward? *</Label>
              <div className="flex items-center space-x-4 mt-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="settlementYes"
                    checked={watchedValues.hasSettlementProposal === true}
                    onCheckedChange={(checked) => formMethods.setValue('hasSettlementProposal', !!checked)}
                  />
                  <Label htmlFor="settlementYes">Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="settlementNo"
                    checked={watchedValues.hasSettlementProposal === false}
                    onCheckedChange={(checked) => formMethods.setValue('hasSettlementProposal', !checked)}
                  />
                  <Label htmlFor="settlementNo">No</Label>
                </div>
              </div>
            </div>

            {watchedValues.hasSettlementProposal === true && (
              <div>
                <Label htmlFor="settlementProposalDetails">Please Provide Details *</Label>
                <Textarea
                  id="settlementProposalDetails"
                  {...formMethods.register('settlementProposalDetails')}
                  placeholder="Describe the settlement proposal"
                  rows={4}
                />
              </div>
            )}
          </div>
        </FormSection>
      ),
    },
    {
      id: "data-privacy",
      title: "Data Privacy & Declaration",
      component: (
        <FormSection title="Data Privacy Notice & Declaration" description="Please read and agree to the terms below">
          <div className="space-y-6">
            <Card className="p-6">
              <CardHeader>
                <CardTitle className="text-lg">Data Privacy</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm space-y-2">
                  <p><strong>i.</strong> Your data will solemnly be used for the purposes of this business contract and also to enable us reach you with the updates about our products and services.</p>
                  <p><strong>ii.</strong> Please note that your personal data will be treated with utmost respect and is well secured as required by Nigeria Data Protection Regulations 2019.</p>
                  <p><strong>iii.</strong> Your personal data shall not be shared with or sold to any third-party without your consent unless we are compelled by law or regulator.</p>
                </div>
              </CardContent>
            </Card>

            <Card className="p-6">
              <CardHeader>
                <CardTitle className="text-lg">Declaration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm space-y-2">
                  <p><strong>1.</strong> I/We declare to the best of my/our knowledge and belief that the information given on this form is true in every respect and agree that if I/we have made any false or fraudulent statement, be it suppression or concealment, the policy shall be cancelled and the claim shall be forfeited.</p>
                  <p><strong>2.</strong> I/We agree to provide additional information to NEM Insurance, if required.</p>
                  <p><strong>3.</strong> I/We agree to submit all required and requested for documents and NEM Insurance shall not be held responsible for any delay in settlement of claim due to non-fulfillment of requirements.</p>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="agreeToDataPrivacy"
                  checked={watchedValues.agreeToDataPrivacy}
                  onCheckedChange={(checked) => formMethods.setValue('agreeToDataPrivacy', !!checked)}
                />
                <Label htmlFor="agreeToDataPrivacy" className="text-sm">
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
                  placeholder="Type your full name as digital signature"
                />
                {formMethods.formState.errors.signature && (
                  <p className="text-sm text-red-600 mt-1">{formMethods.formState.errors.signature.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="signatureDate">Date</Label>
                <Input
                  id="signatureDate"
                  type="date"
                  {...formMethods.register('signatureDate')}
                  value={watchedValues.signatureDate}
                  readOnly
                />
              </div>
            </div>
          </div>
        </FormSection>
      ),
    },
  ];

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-6">
            <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Claim Submitted Successfully!</h2>
            <p className="text-gray-600 mb-6">
              Your fidelity guarantee claim has been received and is being processed.
            </p>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm font-medium text-blue-800">
                For claims status enquiries, call 01 448 9570
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Fidelity Guarantee Insurance Claim Form
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
              <DialogTitle>Review Your Fidelity Guarantee Claim Submission</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><strong>Policy Number:</strong> {watchedValues.policyNumber}</div>
                <div><strong>Company:</strong> {watchedValues.companyName}</div>
                <div><strong>Email:</strong> {watchedValues.email}</div>
                <div><strong>Default Amount:</strong> ₦{watchedValues.defaultAmount?.toLocaleString()}</div>
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
      </div>
    </div>
  );
};

export default FidelityGuaranteeClaim;
