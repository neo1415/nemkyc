import React, { useEffect } from 'react';
import { useForm, FormProvider, useFormContext } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { get } from 'lodash';
import { createPhoneValidation } from '@/utils/validation';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Sprout, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import MultiStepForm from '@/components/common/MultiStepForm';
import { useFormDraft } from '@/hooks/useFormDraft';
import { useEnhancedFormSubmit } from '@/hooks/useEnhancedFormSubmit';
import FormLoadingModal from '@/components/common/FormLoadingModal';
import FormSummaryDialog from '@/components/common/FormSummaryDialog';
import SuccessModal from '@/components/common/SuccessModal';
import DatePicker from '@/components/common/DatePicker';
import { format } from 'date-fns';

// Yield Index Insurance Schema
const yieldIndexSchema = yup.object().shape({
  // Section 1: Policy & Insured Details
  policyNumber: yup.string().required("Policy Number is required"),
  nameOfInsured: yup.string().required("Name of the Insured is required"),
  farmNameAndAddress: yup.string().required("Name and Address of the Farm is required"),
  phoneNumber: createPhoneValidation(),
  lossDateFrom: yup.date().required("Loss period start date is required"),
  lossDateTo: yup.date().required("Loss period end date is required"),
  
  // Section 2: Cause of Loss
  causeOfLoss: yup.array().of(yup.string()).min(1, "At least one cause of loss is required"),
  pestDiseaseSpecification: yup.string().when('causeOfLoss', {
    is: (val: string[]) => val && val.includes('Outbreak of Pest and Disease'),
    then: (schema) => schema.required("Please specify pest/disease"),
    otherwise: (schema) => schema
  }),
  otherCauseExplanation: yup.string().when('causeOfLoss', {
    is: (val: string[]) => val && val.includes('Other cause of loss not listed'),
    then: (schema) => schema.required("Please explain the cause"),
    otherwise: (schema) => schema
  }),
  
  // Section 3: Claim Details
  cropType: yup.string().required("Crop type is required"),
  cropGrowthStage: yup.string().required("Crop growth stage is required"),
  
  // Stage 1 & 2 cost fields (conditional on First Stage or Second Stage)
  costOfLandPreparation: yup.string().when('cropGrowthStage', {
    is: (val: string) => val === 'First Stage (Planting)' || val === 'Second Stage (Flowering)',
    then: (schema) => schema.required("Cost of land preparation is required"),
    otherwise: (schema) => schema
  }),
  costOfPlanting: yup.string().when('cropGrowthStage', {
    is: (val: string) => val === 'First Stage (Planting)' || val === 'Second Stage (Flowering)',
    then: (schema) => schema.required("Cost of planting is required"),
    otherwise: (schema) => schema
  }),
  costOfHerbicides: yup.string().when('cropGrowthStage', {
    is: (val: string) => val === 'First Stage (Planting)' || val === 'Second Stage (Flowering)',
    then: (schema) => schema.required("Cost of herbicides is required"),
    otherwise: (schema) => schema
  }),
  costOfFertilizer: yup.string().when('cropGrowthStage', {
    is: (val: string) => val === 'First Stage (Planting)' || val === 'Second Stage (Flowering)',
    then: (schema) => schema.required("Cost of fertilizer is required"),
    otherwise: (schema) => schema
  }),
  quantitySalvaged: yup.string().when('cropGrowthStage', {
    is: (val: string) => val === 'First Stage (Planting)' || val === 'Second Stage (Flowering)',
    then: (schema) => schema.required("Quantity salvaged is required"),
    otherwise: (schema) => schema
  }),
  
  // Stage 3 proportion selector (conditional on Third Stage)
  proportionOfLoss: yup.string().when('cropGrowthStage', {
    is: 'Third Stage (At maturity but before harvest time)',
    then: (schema) => schema.required("Proportion of loss is required"),
    otherwise: (schema) => schema
  }),
  
  // Always visible fields
  claimEstimate: yup.string().required("Claim estimate is required"),
  estimatedAreaOfDamage: yup.string().required("Estimated area of damage is required"),
  numberOfFarmersAffected: yup.number().required("Number of farmers affected is required").min(1, "Must be at least 1"),
  previousLossParticulars: yup.string().required("Previous loss particulars are required"),
  contactDetailsAtLossPremises: yup.string().required("Contact details at loss premises are required"),
  additionalLossDetails: yup.string().required("Additional loss details are required"),
  
  // Section 4: Data Privacy Policy
  agreeToDataPrivacy: yup.boolean().oneOf([true], "You must agree to data privacy policy"),
  
  // Section 5: Declaration & Signature
  declarationTrue: yup.boolean().oneOf([true], "You must agree to the declaration"),
  signature: yup.string().required("Full Name (Digital Signature) is required")
});

interface YieldIndexData {
  // Section 1: Policy & Insured Details
  policyNumber: string;
  nameOfInsured: string;
  farmNameAndAddress: string;
  phoneNumber: string;
  lossDateFrom: Date;
  lossDateTo: Date;
  
  // Section 2: Cause of Loss
  causeOfLoss: string[];
  pestDiseaseSpecification?: string;
  otherCauseExplanation?: string;
  
  // Section 3: Claim Details
  cropType: string;
  cropGrowthStage: string;
  
  // Stage 1 & 2 cost fields (conditional)
  costOfLandPreparation?: string;
  costOfPlanting?: string;
  costOfHerbicides?: string;
  costOfFertilizer?: string;
  quantitySalvaged?: string;
  
  // Stage 3 proportion selector (conditional)
  proportionOfLoss?: string;
  
  // Always visible fields
  claimEstimate: string;
  estimatedAreaOfDamage: string;
  numberOfFarmersAffected: number;
  previousLossParticulars: string;
  contactDetailsAtLossPremises: string;
  additionalLossDetails: string;

  // Section 4: Data Privacy Policy
  agreeToDataPrivacy: boolean;
  
  // Section 5: Declaration & Signature
  declarationTrue: boolean;
  signature: string;
}

const defaultValues: Partial<YieldIndexData> = {
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

const YieldIndexInsuranceClaim: React.FC = () => {
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
    formType: 'Yield Index Insurance Claim',
    onSuccess: () => clearDraft()
  });

  const formMethods = useForm<any>({
    resolver: yupResolver(yieldIndexSchema),
    defaultValues,
    mode: 'onChange'
  });

  // Make toast available globally for MultiStepForm
  useEffect(() => {
    (window as any).toast = toast;
  }, [toast]);

  const { saveDraft, clearDraft } = useFormDraft('yieldIndexClaim', formMethods);

  // Auto-save draft
  useEffect(() => {
    const subscription = formMethods.watch((data) => {
      saveDraft(data);
    });
    return () => subscription.unsubscribe();
  }, [formMethods, saveDraft]);

  // Main submit handler
  const onFinalSubmit = async (data: YieldIndexData) => {
    const currentDate = new Date();
    
    const finalData = {
      ...data,
      signatureDate: currentDate,
      status: 'processing',
      formType: 'Yield Index Insurance Claim'
    };

    await handleEnhancedSubmit(finalData);
  };

  // Step field mappings for validation
  const stepFieldMappings = {
    0: ['policyNumber', 'nameOfInsured', 'farmNameAndAddress', 'phoneNumber', 'lossDateFrom', 'lossDateTo'],
    1: ['causeOfLoss', 'additionalLossDetails'],
    2: ['cropType', 'cropGrowthStage', 'claimEstimate', 'estimatedAreaOfDamage', 'numberOfFarmersAffected', 'previousLossParticulars', 'contactDetailsAtLossPremises'],
    3: ['agreeToDataPrivacy', 'declarationTrue', 'signature']
  };

  const causeOfLossOptions = [
    "Fire",
    "Lightning",
    "Explosion",
    "Aircraft damage",
    "Windstorm Damage",
    "Flood",
    "Outbreak of Pest and Disease",
    "Drought"
  ];

  const cropTypeOptions = [
    "Rice",
    "Maize",
    "Cassava",
    "Yam",
    "Sorghum",
    "Millet",
    "Wheat",
    "Other"
  ];

  const cropGrowthStageOptions = [
    "First Stage (Planting)",
    "Second Stage (Flowering)",
    "Third Stage (At maturity but before harvest time)"
  ];

  const proportionOfLossOptions = [
    "Less than one-quarter",
    "About one-quarter of the crop",
    "About one-third of the crop",
    "About half of the crop",
    "More than half of the crop"
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
            <FormTextarea name="farmNameAndAddress" label="Address of the Farm" required />
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
                Cause of loss. Please tick the box that best describes the cause of loss.
                <span className="required-asterisk">*</span>
              </Label>
              <div className="space-y-2">
                {causeOfLossOptions.map((option) => (
                  <div key={option} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`cause-${option}`}
                      checked={(formMethods.watch('causeOfLoss') || []).includes(option)}
                      onCheckedChange={(checked) => {
                        const currentValues = formMethods.watch('causeOfLoss') || [];
                        let newValues;
                        if (checked) {
                          newValues = [...currentValues, option];
                        } else {
                          newValues = currentValues.filter((val: string) => val !== option);
                        }
                        formMethods.setValue('causeOfLoss', newValues);
                        if (formMethods.formState.errors.causeOfLoss) {
                          formMethods.clearErrors('causeOfLoss');
                        }
                      }}
                    />
                    <Label htmlFor={`cause-${option}`} className="font-normal cursor-pointer">
                      {option}
                    </Label>
                  </div>
                ))}
              </div>
              {formMethods.formState.errors.causeOfLoss && (
                <p className="text-sm text-red-500">
                  {formMethods.formState.errors.causeOfLoss.message?.toString()}
                </p>
              )}
            </div>
            
            {formMethods.watch('causeOfLoss') && formMethods.watch('causeOfLoss').includes('Outbreak of Pest and Disease') && (
              <FormField 
                name="pestDiseaseSpecification" 
                label="Please specify pest/disease" 
                required 
                placeholder="Specify the pest or disease" 
              />
            )}
            
            {formMethods.watch('causeOfLoss') && formMethods.watch('causeOfLoss').includes('Other cause of loss not listed') && (
              <FormTextarea 
                name="otherCauseExplanation" 
                label="If others, please explain" 
                required 
                placeholder="Describe the cause of loss" 
              />
            )}
            
            <FormTextarea 
              name="additionalLossDetails" 
              label="Please provide additional details explaining how the damage or loss to your crops occurred" 
              required 
              placeholder="Provide detailed information about the loss"
            />
          </div>
        </FormProvider>
      )
    },
    {
      id: 'claim-details',
      title: 'Stage 3 Loss Assessment',
      component: (
        <FormProvider {...formMethods}>
          <div className="space-y-4">
            <div className="space-y-3">
              <Label>
                What type of crops were damaged <span className="required-asterisk">*</span>
              </Label>
              <p className="text-sm text-gray-600 italic">
                If more than one type of crop please fill a different form for each of them
              </p>
              <RadioGroup
                value={formMethods.watch('cropType') || ""}
                onValueChange={(value) => {
                  formMethods.setValue('cropType', value);
                  if (formMethods.formState.errors.cropType) {
                    formMethods.clearErrors('cropType');
                  }
                }}
                className="space-y-2"
              >
                {cropTypeOptions.map((option) => (
                  <div key={option} className="flex items-center space-x-2">
                    <RadioGroupItem value={option} id={`crop-${option}`} />
                    <Label htmlFor={`crop-${option}`} className="font-normal cursor-pointer">
                      {option}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
              {formMethods.formState.errors.cropType && (
                <p className="text-sm text-red-500">
                  {formMethods.formState.errors.cropType.message?.toString()}
                </p>
              )}
            </div>
            
            <div className="space-y-3">
              <Label>
                I/we hereby declare that the loss/damage occurred to the best of our knowledge at:
              </Label>
              <Label>
                Crop Growth Stage <span className="required-asterisk">*</span>
              </Label>
              <RadioGroup
                value={formMethods.watch('cropGrowthStage') || ""}
                onValueChange={(value) => {
                  formMethods.setValue('cropGrowthStage', value);
                  if (formMethods.formState.errors.cropGrowthStage) {
                    formMethods.clearErrors('cropGrowthStage');
                  }
                }}
                className="space-y-2"
              >
                {cropGrowthStageOptions.map((option) => (
                  <div key={option} className="flex items-center space-x-2">
                    <RadioGroupItem value={option} id={`stage-${option}`} />
                    <Label htmlFor={`stage-${option}`} className="font-normal cursor-pointer">
                      {option}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
              {formMethods.formState.errors.cropGrowthStage && (
                <p className="text-sm text-red-500">
                  {formMethods.formState.errors.cropGrowthStage.message?.toString()}
                </p>
              )}
            </div>

            {/* Conditional Stage 1 & 2 cost fields */}
            {(formMethods.watch('cropGrowthStage') === 'First Stage (Planting)' || 
              formMethods.watch('cropGrowthStage') === 'Second Stage (Flowering)') && (
              <div className="space-y-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-semibold text-blue-800">Stage 1 & 2 Cost Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField 
                    name="costOfLandPreparation" 
                    label="Cost of Land Preparation (₦)" 
                    required 
                    type="text" 
                    placeholder="e.g., 50000" 
                  />
                  <FormField 
                    name="costOfPlanting" 
                    label="Cost of Planting (₦)" 
                    required 
                    type="text" 
                    placeholder="e.g., 30000" 
                  />
                  <FormField 
                    name="costOfHerbicides" 
                    label="Cost of Herbicides (₦)" 
                    required 
                    type="text" 
                    placeholder="e.g., 20000" 
                  />
                  <FormField 
                    name="costOfFertilizer" 
                    label="Cost of Fertilizer (₦)" 
                    required 
                    type="text" 
                    placeholder="e.g., 40000" 
                  />
                </div>
                <FormField 
                  name="quantitySalvaged" 
                  label="Quantity Salvaged" 
                  required 
                  type="text" 
                  placeholder="e.g., 2 bags" 
                />
              </div>
            )}

            {/* Conditional Stage 3 proportion selector */}
            {formMethods.watch('cropGrowthStage') === 'Third Stage (At maturity but before harvest time)' && (
              <div className="space-y-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-semibold text-green-800">Stage 3 Loss Assessment</h4>
                <Label>
                  Proportion of Loss <span className="required-asterisk">*</span>
                </Label>
                <RadioGroup
                  value={formMethods.watch('proportionOfLoss') || ""}
                  onValueChange={(value) => {
                    formMethods.setValue('proportionOfLoss', value);
                    if (formMethods.formState.errors.proportionOfLoss) {
                      formMethods.clearErrors('proportionOfLoss');
                    }
                  }}
                  className="space-y-2"
                >
                  {proportionOfLossOptions.map((option) => (
                    <div key={option} className="flex items-center space-x-2">
                      <RadioGroupItem value={option} id={`proportion-${option}`} />
                      <Label htmlFor={`proportion-${option}`} className="font-normal cursor-pointer">
                        {option}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
                {formMethods.formState.errors.proportionOfLoss && (
                  <p className="text-sm text-red-500">
                    {formMethods.formState.errors.proportionOfLoss.message?.toString()}
                  </p>
                )}
              </div>
            )}

            {/* General Claim Information - moved here from separate section */}
            <div className="space-y-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <h4 className="font-semibold text-gray-800">General Claim Information</h4>
              <FormField 
                name="claimEstimate" 
                label="Claim estimate (Naira)" 
                required 
                type="text" 
                placeholder="e.g., 500000" 
              />
              
              <FormField 
                name="estimatedAreaOfDamage" 
                label="Estimated Area of Damage (hectares)" 
                required 
                type="text" 
                placeholder="e.g., 5.5" 
              />
              
              <FormField 
                name="numberOfFarmersAffected" 
                label="Number of Farmers Affected" 
                required 
                type="number" 
                placeholder="e.g., 10" 
                min="1"
              />
              
              <FormTextarea 
                name="previousLossParticulars" 
                label="Previous Loss Particulars" 
                required 
                placeholder="Provide details of any previous losses"
              />
              
              <FormField 
                name="contactDetailsAtLossPremises" 
                label="Contact Details at Loss Premises" 
                required 
                type="text" 
                placeholder="Phone number or contact person at the farm"
              />
            </div>
          </div>
        </FormProvider>
      )
    },
    {
      id: 'data-privacy-declaration',
      title: 'Data Privacy Policy & Declaration',
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <Card className="shadow-xl border-t-4 border-t-green-600">
          <CardHeader className="text-center space-y-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-t-lg">
            <div className="flex justify-center mb-2">
              <Sprout className="h-12 w-12" />
            </div>
            <CardTitle className="text-3xl font-bold">Yield Index Insurance</CardTitle>
            <CardDescription className="text-green-100 text-lg">
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
        formType="Yield Index Insurance Claim"
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
                    <span className="font-medium text-gray-600">Farm Name and Address:</span>
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
                    <span className="font-medium text-gray-600">Cause of Loss:</span>
                    <p className="text-gray-900">{data.causeOfLoss ? data.causeOfLoss.join(', ') : 'Not provided'}</p>
                  </div>
                  {data.pestDiseaseSpecification && (
                    <div>
                      <span className="font-medium text-gray-600">Pest/Disease Specification:</span>
                      <p className="text-gray-900">{data.pestDiseaseSpecification}</p>
                    </div>
                  )}
                  {data.otherCauseExplanation && (
                    <div>
                      <span className="font-medium text-gray-600">Other Cause Explanation:</span>
                      <p className="text-gray-900">{data.otherCauseExplanation}</p>
                    </div>
                  )}
                  <div>
                    <span className="font-medium text-gray-600">Additional Loss Details:</span>
                    <p className="text-gray-900">{data.additionalLossDetails || 'Not provided'}</p>
                  </div>
                </div>
              </div>

              {/* Section 3: Claim Details */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-3">Claim Details</h3>
                <div className="grid grid-cols-1 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">Crop Type:</span>
                    <p className="text-gray-900">{data.cropType || 'Not provided'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Crop Growth Stage:</span>
                    <p className="text-gray-900">{data.cropGrowthStage || 'Not provided'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Claim Estimate:</span>
                    <p className="text-gray-900">₦{data.claimEstimate || 'Not provided'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Estimated Area of Damage:</span>
                    <p className="text-gray-900">{data.estimatedAreaOfDamage || 'Not provided'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Number of Farmers Affected:</span>
                    <p className="text-gray-900">{data.numberOfFarmersAffected || 'Not provided'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Previous Loss Particulars:</span>
                    <p className="text-gray-900">{data.previousLossParticulars || 'Not provided'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Contact Details at Loss Premises:</span>
                    <p className="text-gray-900">{data.contactDetailsAtLossPremises || 'Not provided'}</p>
                  </div>
                </div>
              </div>

              {/* Section 4: Declaration */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-3">Declaration</h3>
                <div className="grid grid-cols-1 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">Data Privacy Agreement:</span>
                    <p className="text-gray-900">{data.agreeToDataPrivacy ? 'Agreed' : 'Not agreed'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Declaration Acceptance:</span>
                    <p className="text-gray-900">{data.declarationTrue ? 'Agreed' : 'Not agreed'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Digital Signature:</span>
                    <p className="text-gray-900">{data.signature || 'Not provided'}</p>
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start space-x-3">
                  <Info className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-green-800">Important Notice</h3>
                    <p className="text-sm text-green-700 mt-1">
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
        message="Your Yield Index insurance claim has been submitted and is being processed. You will receive a confirmation email shortly."
      />
    </div>
  );
};

export default YieldIndexInsuranceClaim;
