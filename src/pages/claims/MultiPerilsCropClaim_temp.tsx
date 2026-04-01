import React, { useEffect } from 'react';
import { useForm, FormProvider, useFormContext } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { get } from 'lodash';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Beef, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import MultiStepForm from '@/components/common/MultiStepForm';
import { useFormDraft } from '@/hooks/useFormDraft';
import { useEnhancedFormSubmit } from '@/hooks/useEnhancedFormSubmit';
import { useAuthRequiredSubmit } from '@/hooks/useAuthRequiredSubmit';
import FormLoadingModal from '@/components/common/FormLoadingModal';
import FormSummaryDialog from '@/components/common/FormSummaryDialog';
import SuccessModal from '@/components/common/SuccessModal';
import DatePicker from '@/components/common/DatePicker';
import { format } from 'date-fns';

// Livestock Claim Schema - Matching JSON Schema Exactly
const livestockSchema = yup.object().shape({
  // Section 1: Policy & Insured Details
  policyNumber: yup.string().required("Policy Number is required"),
  nameOfInsured: yup.string().required("Name of the Insured is required"),
  farmNameAndAddress: yup.string().required("Name and Address of the Farm is required"),
  phoneNumber: yup.string().required("Phone Number is required"),
  lossDateFrom: yup.date().required("Loss period start date is required"),
  lossDateTo: yup.date().required("Loss period end date is required"),
  
  // Section 2: Cause of Loss
  causeOfDeath: yup.string().required("Cause of death is required"),
  diseaseSpecification: yup.string().when('causeOfDeath', {
    is: 'Outbreak of Pest and Disease',
    then: (schema) => schema.required("Please specify disease/pest"),
    otherwise: (schema) => schema
  }),
  otherCauseExplanation: yup.string().when('causeOfDeath', {
    is: 'Other cause of loss not listed',
    then: (schema) => schema.required("Please explain the cause"),
    otherwise: (schema) => schema
  }),
  
  // Section 3: Claim Details
  vetSurgeonDetails: yup.string().required("Name and address of Veterinary Surgeon is required"),
  claimEstimate: yup.string().required("Claim estimate is required"),
  previousLossParticulars: yup.string(),
  contactDetailsAtLossPremises: yup.string(),
  
  // Section 4: Data Privacy Policy
  agreeToDataPrivacy: yup.boolean().oneOf([true], "You must agree to data privacy policy"),
  
  // Section 5: Declaration & Signature
  declarationTrue: yup.boolean().oneOf([true], "You must agree to the declaration"),
  signature: yup.string().required("Full Name (Digital Signature) is required")
});

interface LivestockData {
  // Section 1: Policy & Insured Details
  policyNumber: string;
  nameOfInsured: string;
  farmNameAndAddress: string;
  phoneNumber: string;
  lossDateFrom: Date;
  lossDateTo: Date;
  
  // Section 2: Cause of Loss
  causeOfDeath: string;
  diseaseSpecification?: string;
  otherCauseExplanation?: string;
  
  // Section 3: Claim Details
  vetSurgeonDetails: string;
  claimEstimate: string;
  previousLossParticulars?: string;
  contactDetailsAtLossPremises?: string;

  // Section 4: Data Privacy Policy
  agreeToDataPrivacy: boolean;
  
  // Section 5: Declaration & Signature
  declarationTrue: boolean;
  signature: string;
}

const defaultValues: Partial<LivestockData> = {
  agreeToDataPrivacy: false,
  declarationTrue: false,
  signature: ''
};

// Form field components
const FormField = ({ name, label, required = false, type = "text", maxLength, ...props }: any) => {
  const { register, formState: { errors } } = useFormContext();
  const error = get(errors, name);

  return (
    <div className="space-y-2">
      <Label htmlFor={name}>
        {label}
        {required && <span className="required-asterisk">*</span>}
      </Label>
      <Input
        id={name}
        type={type}
        maxLength={maxLength}
        {...register(name)}
        className={cn(
          "w-full",
          error && "border-red-500 focus:border-red-500"
        )}
        {...props}
      />
      {error && (
        <p className="text-sm text-red-500">{error.message?.toString()}</p>
      )}
    </div>
  );
};

const FormTextarea = ({ name, label, required = false, maxLength = 2500, ...props }: any) => {
  const { register, formState: { errors } } = useFormContext();
  const error = get(errors, name);

  return (
    <div className="space-y-2">
      <Label htmlFor={name}>
        {label}
        {required && <span className="required-asterisk">*</span>}
      </Label>
      <Textarea
        id={name}
        maxLength={maxLength}
        {...register(name)}
        className={cn(
          "w-full min-h-[100px] resize-y",
          error && "border-red-500 focus:border-red-500"
        )}
        {...props}
      />
      <div className="flex justify-between text-xs text-gray-500">
        <span>{error && <span className="text-red-500">{error.message?.toString()}</span>}</span>
        <span>{maxLength} characters max</span>
      </div>
    </div>
  );
};

const FormDatePicker = ({ name, label, required = false }: any) => {
  return (
    <DatePicker
      name={name}
      label={label}
      required={required}
    />
  );
};

const LivestockClaim: React.FC = () => {
  const { toast } = useToast();
  
  const {
    handleSubmit: handleEnhancedSubmit,
    showSummary,
    setShowSummary,
    showLoading,
    loadingMessage,
    showSuccess,
    confirmSubmit,
    closeSuccess,
    formData: submissionData,
    isSubmitting
  } = useEnhancedFormSubmit({
    formType: 'Livestock Insurance Claim',
    onSuccess: () => clearDraft()
  });

  const formMethods = useForm<any>({
    resolver: yupResolver(livestockSchema),
    defaultValues,
    mode: 'onChange'
  });

  // Make toast available globally for MultiStepForm
  useEffect(() => {
    (window as any).toast = toast;
  }, [toast]);

  const { saveDraft, clearDraft } = useFormDraft('livestockClaim', formMethods);

  // Auto-save draft
  useEffect(() => {
    const subscription = formMethods.watch((data) => {
      saveDraft(data);
    });
    return () => subscription.unsubscribe();
  }, [formMethods, saveDraft]);

  // Main submit handler
  const onFinalSubmit = async (data: LivestockData) => {
    const currentDate = new Date();
    
    const finalData = {
      ...data,
      signatureDate: currentDate,
      status: 'processing',
      formType: 'Livestock Insurance Claim'
    };

    await handleEnhancedSubmit(finalData);
  };

  // Step field mappings for validation
  const stepFieldMappings = {
    0: ['policyNumber', 'nameOfInsured', 'farmNameAndAddress', 'phoneNumber', 'lossDateFrom', 'lossDateTo'],
    1: ['causeOfDeath'],
    2: ['vetSurgeonDetails', 'claimEstimate'],
    3: ['agreeToDataPrivacy', 'declarationTrue', 'signature']
  };

  const causeOfDeathOptions = [
    "Fire",
    "Lightning",
    "Windstorm Damage",
    "Flood",
    "Outbreak of Pest and Disease",
    "Accident",
    "Other cause of loss not listed"
  ];

  const steps = [
    {
      id: 'policy-insured-details',
      title: 'Policy & Insured Details',
      component: (
        <FormProvider {...formMethods}>
          <div className="space-y-4">
            <FormField name="policyNumber" label="Policy Number" required />
            <FormField name="nameOfInsured" label="Name of the Insured" required />
            <FormTextarea name="farmNameAndAddress" label="Name and Address of the Farm" required />
            <FormField name="phoneNumber" label="Phone Number" required type="tel" />
            
            <div className="space-y-2">
              <Label>Date and period of Loss <span className="required-asterisk">*</span></Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormDatePicker name="lossDateFrom" label="From" required />
                <FormDatePicker name="lossDateTo" label="To" required />
              </div>
            </div>
          </div>
        </FormProvider>
      )
    },
    {
      id: 'cause-of-loss',
      title: 'Cause of Loss',
      component: (
        <FormProvider {...formMethods}>
          <div className="space-y-4">
            <div className="space-y-3">
              <Label>
                Cause of death as confirmed by a Veterinary Surgeon. Please tick the box that best describes the cause of death.
                <span className="required-asterisk">*</span>
              </Label>
              <RadioGroup
                value={formMethods.watch('causeOfDeath') || ""}
                onValueChange={(value) => {
                  formMethods.setValue('causeOfDeath', value);
                  if (formMethods.formState.errors.causeOfDeath) {
                    formMethods.clearErrors('causeOfDeath');
                  }
                }}
                className="space-y-2"
              >
                {causeOfDeathOptions.map((option) => (
                  <div key={option} className="flex items-center space-x-2">
                    <RadioGroupItem value={option} id={`cause-${option}`} />
                    <Label htmlFor={`cause-${option}`} className="font-normal cursor-pointer">
                      {option}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
              {formMethods.formState.errors.causeOfDeath && (
                <p className="text-sm text-red-500">
                  {formMethods.formState.errors.causeOfDeath.message?.toString()}
                </p>
              )}
            </div>
            
            {formMethods.watch('causeOfDeath') === 'Outbreak of Pest and Disease' && (
              <FormField 
                name="diseaseSpecification" 
                label="Please specify disease/pest" 
                required 
                placeholder="Specify the disease or pest" 
              />
            )}
            
            {formMethods.watch('causeOfDeath') === 'Other cause of loss not listed' && (
              <FormTextarea 
                name="otherCauseExplanation" 
                label="If others, please explain" 
                required 
                placeholder="Describe the cause of loss" 
              />
            )}
          </div>
        </FormProvider>
      )
    },
    {
      id: 'claim-details',
      title: 'Claim Details',
      component: (
        <FormProvider {...formMethods}>
          <div className="space-y-4">
            <FormTextarea 
              name="vetSurgeonDetails" 
              label="Name and address of Veterinary Surgeon" 
              required 
              placeholder="Provide the veterinary surgeon's name and address"
            />
            
            <FormField 
              name="claimEstimate" 
              label="Claim estimate (Naira)" 
              required 
              type="text" 
              placeholder="e.g., 500000" 
            />
            
            <FormTextarea 
              name="previousLossParticulars" 
              label="Have you ever suffered a loss? If so, give full particulars" 
              placeholder="Describe any previous losses (optional)"
            />
            
            <FormField 
              name="contactDetailsAtLossPremises" 
              label="Contact details at loss premises" 
              placeholder="Phone number or contact person at the farm (optional)"
            />
          </div>
        </FormProvider>
      )
    },
    {
      id: 'data-privacy-declaration',
      title: 'Section 4: Data Privacy Policy & Declaration',
      component: (
        <FormProvider {...formMethods}>
          <div className="space-y-6">
            <div className="bg-white border border-gray-200 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Data Privacy</h3>
              <div className="text-sm space-y-2">
                <p>i. Your data will solemnly be used for the purposes of this business contract and also to enable us reach you with the updates about our products and services.</p>
                <p>ii. Please note that your personal data will be treated with utmost respect and is well secured as required by Nigeria Data Protection Act 2023.</p>
                <p>iii. Your personal data shall not be shared with or sold to any third-party without your consent unless we are compelled by law or regulator.</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="agreeToDataPrivacy"
                checked={formMethods.watch('agreeToDataPrivacy') || false}
                onCheckedChange={(checked) => {
                  formMethods.setValue('agreeToDataPrivacy', !!checked);
                  if (formMethods.formState.errors.agreeToDataPrivacy) {
                    formMethods.clearErrors('agreeToDataPrivacy');
                  }
                }}
                className={cn(formMethods.formState.errors.agreeToDataPrivacy && "border-destructive")}
              />
              <Label htmlFor="agreeToDataPrivacy">
                I agree to the data privacy terms <span className="required-asterisk">*</span>
              </Label>
            </div>
            {formMethods.formState.errors.agreeToDataPrivacy && (
              <p className="text-sm text-destructive">
                {formMethods.formState.errors.agreeToDataPrivacy.message?.toString()}
              </p>
            )}
            
            <div className="bg-blue-50 p-4 rounded-lg">
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
                checked={formMethods.watch('declarationTrue') || false}
                onCheckedChange={(checked) => {
                  formMethods.setValue('declarationTrue', !!checked);
                  if (formMethods.formState.errors.declarationTrue) {
                    formMethods.clearErrors('declarationTrue');
                  }
                }}
                className={cn(formMethods.formState.errors.declarationTrue && "border-destructive")}
              />
              <Label htmlFor="declarationTrue">
                I/We declare that the statements above are true <span className="required-asterisk">*</span>
              </Label>
            </div>
            {formMethods.formState.errors.declarationTrue && (
              <p className="text-sm text-destructive">
                {formMethods.formState.errors.declarationTrue.message?.toString()}
              </p>
            )}
            
            <FormField name="signature" label="Full Name (Digital Signature)" required />
          </div>
        </FormProvider>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <Card className="shadow-xl border-t-4 border-t-amber-600">
          <CardHeader className="text-center space-y-2 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-t-lg">
            <div className="flex justify-center mb-2">
              <Beef className="h-12 w-12" />
            </div>
            <CardTitle className="text-3xl font-bold">Livestock Insurance</CardTitle>
            <CardDescription className="text-amber-100 text-lg">
              Claim Form
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <MultiStepForm
              steps={steps}
              onSubmit={formMethods.handleSubmit(onFinalSubmit)}
              formMethods={formMethods}
              stepFieldMappings={stepFieldMappings}
              isSubmitting={isSubmitting}
            />
          </CardContent>
        </Card>
      </div>

      {/* Loading Modal */}
      <FormLoadingModal
        isOpen={showLoading}
        message={loadingMessage}
      />

      {/* Summary Dialog */}
      <FormSummaryDialog
        open={showSummary}
        onOpenChange={setShowSummary}
        onConfirm={confirmSubmit}
        formData={submissionData}
        formType="Livestock Insurance Claim"
        isSubmitting={isSubmitting}
        renderSummary={(data) => {
          if (!data) return <div className="text-center py-8 text-gray-500">No data to display</div>;
          
          return (
            <div className="space-y-6">
              {/* Section 1: Policy & Insured Details */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-3">Policy & Insured Details</h3>
                <div className="grid grid-cols-1 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">Policy Number:</span>
                    <p className="text-gray-900">{data.policyNumber || 'Not provided'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Name of the Insured:</span>
                    <p className="text-gray-900">{data.nameOfInsured || 'Not provided'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Name and Address of the Farm:</span>
                    <p className="text-gray-900">{data.farmNameAndAddress || 'Not provided'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Phone Number:</span>
                    <p className="text-gray-900">{data.phoneNumber || 'Not provided'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Loss Period From:</span>
                    <p className="text-gray-900">{data.lossDateFrom ? format(new Date(data.lossDateFrom), 'dd/MM/yyyy') : 'Not provided'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Loss Period To:</span>
                    <p className="text-gray-900">{data.lossDateTo ? format(new Date(data.lossDateTo), 'dd/MM/yyyy') : 'Not provided'}</p>
                  </div>
                </div>
              </div>

              {/* Section 2: Cause of Loss */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-3">Cause of Loss</h3>
                <div className="grid grid-cols-1 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">Cause of Death:</span>
                    <p className="text-gray-900">{data.causeOfDeath || 'Not provided'}</p>
                  </div>
                  {data.causeOfDeath === 'Outbreak of Pest and Disease' && data.diseaseSpecification && (
                    <div>
                      <span className="font-medium text-gray-600">Disease/Pest Specification:</span>
                      <p className="text-gray-900">{data.diseaseSpecification}</p>
                    </div>
                  )}
                  {data.causeOfDeath === 'Other cause of loss not listed' && data.otherCauseExplanation && (
                    <div>
                      <span className="font-medium text-gray-600">Other Cause Explanation:</span>
                      <p className="text-gray-900">{data.otherCauseExplanation}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Section 3: Claim Details */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-3">Claim Details</h3>
                <div className="grid grid-cols-1 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">Veterinary Surgeon Details:</span>
                    <p className="text-gray-900">{data.vetSurgeonDetails || 'Not provided'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Claim Estimate:</span>
                    <p className="text-gray-900">₦{data.claimEstimate || 'Not provided'}</p>
                  </div>
                  {data.previousLossParticulars && (
                    <div>
                      <span className="font-medium text-gray-600">Previous Loss Particulars:</span>
                      <p className="text-gray-900">{data.previousLossParticulars}</p>
                    </div>
                  )}
                  {data.contactDetailsAtLossPremises && (
                    <div>
                      <span className="font-medium text-gray-600">Contact Details at Loss Premises:</span>
                      <p className="text-gray-900">{data.contactDetailsAtLossPremises}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Section 4: Data Privacy Policy & Declaration */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-3">Data Privacy Policy & Declaration</h3>
                <div className="grid grid-cols-1 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">Agreed to Data Privacy:</span>
                    <p className="text-gray-900">{data.agreeToDataPrivacy ? 'Yes' : 'No'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Declaration Confirmed:</span>
                    <p className="text-gray-900">{data.declarationTrue ? 'Yes' : 'No'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Full Name (Digital Signature):</span>
                    <p className="text-gray-900">{data.signature || 'Not provided'}</p>
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-start space-x-3">
                  <Info className="w-5 h-5 text-amber-600 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-amber-800">Important Notice</h3>
                    <p className="text-sm text-amber-700 mt-1">
                      Please review all information carefully before submitting. Once submitted, you cannot modify your claim details.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        }}
      />

      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccess}
        onClose={closeSuccess}
        title="Claim Submitted Successfully!"
        message="Your Livestock insurance claim has been submitted and is being processed. You will receive a confirmation email shortly."
      />
    </div>
  );
};

export default LivestockClaim;
