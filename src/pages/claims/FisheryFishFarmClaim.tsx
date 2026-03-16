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
import { Fish, Info } from 'lucide-react';
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

// Fishery and Fish Farm Claim Schema - Matching JSON Schema Exactly
const fisheryFishFarmSchema = yup.object().shape({
  // Section 1: Policy & Insured Details
  policyNumber: yup.string().required("Policy Number is required"),
  nameOfInsured: yup.string().required("Name of the Insured is required"),
  farmNameAndAddress: yup.string().required("Name and Address of the Farm is required"),
  phoneNumber: yup.string().required("Phone Number is required"),
  dateOfLoss: yup.date().required("Date of Loss is required"),
  
  // Section 2: Type & Cause of Loss
  typeOfLoss: yup.string().required("Type of Loss is required"),
  dateAndPeriodLossOccurred: yup.string().when('typeOfLoss', {
    is: 'Death',
    then: (schema) => schema.required("Date and Period loss occurred is required"),
    otherwise: (schema) => schema
  }),
  causeOfDeath: yup.string().when('typeOfLoss', {
    is: 'Death',
    then: (schema) => schema.required("Cause of death is required"),
    otherwise: (schema) => schema
  }),
  diseaseSpecification: yup.string().when('causeOfDeath', {
    is: 'Outbreak of Disease',
    then: (schema) => schema.required("Please specify disease/pest"),
    otherwise: (schema) => schema
  }),
  otherCauseExplanation: yup.string().when('causeOfDeath', {
    is: 'Other cause of loss not listed',
    then: (schema) => schema.required("Please explain the cause"),
    otherwise: (schema) => schema
  }),
  vetOrFishExpertDetails: yup.string().when('typeOfLoss', {
    is: 'Death',
    then: (schema) => schema.required("Name and address of Veterinary Surgeon / Fish Expert is required"),
    otherwise: (schema) => schema
  }),
  
  // Section 3: Claim Details
  claimEstimate: yup.string().required("Claim estimate is required"),
  previousLossParticulars: yup.string(),
  contactDetailsAtLossPremises: yup.string(),
  
  // Section 4: Data Privacy Policy
  agreeToDataPrivacy: yup.boolean().oneOf([true], "You must agree to data privacy policy"),
  
  // Section 5: Declaration & Signature
  declarationTrue: yup.boolean().oneOf([true], "You must agree to the declaration"),
  signature: yup.string().required("Full Name (Digital Signature) is required")
});

interface FisheryFishFarmData {
  // Section 1: Policy & Insured Details
  policyNumber: string;
  nameOfInsured: string;
  farmNameAndAddress: string;
  phoneNumber: string;
  dateOfLoss: Date;
  
  // Section 2: Type & Cause of Loss
  typeOfLoss: string;
  dateAndPeriodLossOccurred?: string;
  causeOfDeath?: string;
  diseaseSpecification?: string;
  otherCauseExplanation?: string;
  vetOrFishExpertDetails?: string;
  
  // Section 3: Claim Details
  claimEstimate: string;
  previousLossParticulars?: string;
  contactDetailsAtLossPremises?: string;

  // Section 4: Data Privacy Policy
  agreeToDataPrivacy: boolean;
  
  // Section 5: Declaration & Signature
  declarationTrue: boolean;
  signature: string;
}

const defaultValues: Partial<FisheryFishFarmData> = {
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

const FisheryFishFarmClaim: React.FC = () => {
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
    formType: 'Fishery and Fish Farm Insurance Claim',
    onSuccess: () => clearDraft()
  });

  const formMethods = useForm<any>({
    resolver: yupResolver(fisheryFishFarmSchema),
    defaultValues,
    mode: 'onChange'
  });

  // Make toast available globally for MultiStepForm
  useEffect(() => {
    (window as any).toast = toast;
  }, [toast]);

  const { saveDraft, clearDraft } = useFormDraft('fisheryFishFarmClaim', formMethods);

  // Auto-save draft
  useEffect(() => {
    const subscription = formMethods.watch((data) => {
      saveDraft(data);
    });
    return () => subscription.unsubscribe();
  }, [formMethods, saveDraft]);

  // Main submit handler
  const onFinalSubmit = async (data: FisheryFishFarmData) => {
    const currentDate = new Date();
    
    const finalData = {
      ...data,
      signatureDate: currentDate,
      status: 'processing',
      formType: 'Fishery and Fish Farm Insurance Claim'
    };

    await handleEnhancedSubmit(finalData);
  };

  // Step field mappings for validation
  const stepFieldMappings = {
    0: ['policyNumber', 'nameOfInsured', 'farmNameAndAddress', 'phoneNumber', 'dateOfLoss'],
    1: ['typeOfLoss'],
    2: ['claimEstimate'],
    3: ['agreeToDataPrivacy', 'declarationTrue', 'signature']
  };

  const typeOfLossOptions = [
    "Death",
    "Collapse of Fish Pond (Dyke)"
  ];

  const causeOfDeathOptions = [
    "Fire",
    "Lightning",
    "Windstorm Damage",
    "Flood",
    "Outbreak of Disease",
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
            <FormDatePicker name="dateOfLoss" label="Date of Loss" required />
          </div>
        </FormProvider>
      )
    },
    {
      id: 'type-cause-of-loss',
      title: 'Type & Cause of Loss',
      component: (
        <FormProvider {...formMethods}>
          <div className="space-y-4">
            <div className="space-y-3">
              <Label>
                Type of Loss
                <span className="required-asterisk">*</span>
              </Label>
              <RadioGroup
                value={formMethods.watch('typeOfLoss') || ""}
                onValueChange={(value) => {
                  formMethods.setValue('typeOfLoss', value);
                  if (formMethods.formState.errors.typeOfLoss) {
                    formMethods.clearErrors('typeOfLoss');
                  }
                }}
                className="space-y-2"
              >
                {typeOfLossOptions.map((option) => (
                  <div key={option} className="flex items-center space-x-2">
                    <RadioGroupItem value={option} id={`type-${option}`} />
                    <Label htmlFor={`type-${option}`} className="font-normal cursor-pointer">
                      {option}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
              {formMethods.formState.errors.typeOfLoss && (
                <p className="text-sm text-red-500">
                  {formMethods.formState.errors.typeOfLoss.message?.toString()}
                </p>
              )}
            </div>
            
            {formMethods.watch('typeOfLoss') === 'Death' && (
              <>
                <FormField 
                  name="dateAndPeriodLossOccurred" 
                  label="Date and Period loss occurred" 
                  required 
                  placeholder="e.g. 01/03/2026 over 3 days" 
                />
                
                <div className="space-y-3">
                  <Label>
                    Cause of death as confirmed by a Fishery Expert or Veterinary Surgeon
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
                
                {formMethods.watch('causeOfDeath') === 'Outbreak of Disease' && (
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
                    label="If other, please explain" 
                    required 
                    placeholder="Describe the cause of loss" 
                  />
                )}
                
                <FormTextarea 
                  name="vetOrFishExpertDetails" 
                  label="Name and address of Veterinary Surgeon / Fish Expert" 
                  required 
                  placeholder="Provide the expert's name and address"
                />
              </>
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
                <p>ii. Please note that your personal data will be treated with utmost respect and is well secured as required by Nigeria Data Protection Regulations 2023.</p>
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
              <Fish className="h-12 w-12" />
            </div>
            <CardTitle className="text-3xl font-bold">Fishery and Fish Farm Insurance</CardTitle>
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
        formType="Fishery and Fish Farm Insurance Claim"
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
                    <span className="font-medium text-gray-600">Date of Loss:</span>
                    <p className="text-gray-900">{data.dateOfLoss ? format(new Date(data.dateOfLoss), 'dd/MM/yyyy') : 'Not provided'}</p>
                  </div>
                </div>
              </div>

              {/* Section 2: Type & Cause of Loss */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-3">Type & Cause of Loss</h3>
                <div className="grid grid-cols-1 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">Type of Loss:</span>
                    <p className="text-gray-900">{data.typeOfLoss || 'Not provided'}</p>
                  </div>
                  {data.typeOfLoss === 'Death' && (
                    <>
                      {data.dateAndPeriodLossOccurred && (
                        <div>
                          <span className="font-medium text-gray-600">Date and Period loss occurred:</span>
                          <p className="text-gray-900">{data.dateAndPeriodLossOccurred}</p>
                        </div>
                      )}
                      {data.causeOfDeath && (
                        <div>
                          <span className="font-medium text-gray-600">Cause of Death:</span>
                          <p className="text-gray-900">{data.causeOfDeath}</p>
                        </div>
                      )}
                      {data.causeOfDeath === 'Outbreak of Disease' && data.diseaseSpecification && (
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
                      {data.vetOrFishExpertDetails && (
                        <div>
                          <span className="font-medium text-gray-600">Veterinary Surgeon / Fish Expert Details:</span>
                          <p className="text-gray-900">{data.vetOrFishExpertDetails}</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Section 3: Claim Details */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-3">Claim Details</h3>
                <div className="grid grid-cols-1 gap-4 text-sm">
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
        message="Your Fishery and Fish Farm insurance claim has been submitted and is being processed. You will receive a confirmation email shortly."
      />
    </div>
  );
};

export default FisheryFishFarmClaim;
