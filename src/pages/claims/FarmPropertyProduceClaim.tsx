import React, { useEffect } from 'react';
import { useForm, useFieldArray, FormProvider, useFormContext } from 'react-hook-form';
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
import { Plus, Trash2, Wheat, Info } from 'lucide-react';
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
import { Button } from '@/components/ui/button';

// Farm Property and Produce Claim Schema - Matching JSON Schema Exactly
const farmPropertyProduceSchema = yup.object().shape({
  // Section 1: Policy & Insured Details
  policyNumber: yup.string().required("Policy Number is required"),
  nameOfInsured: yup.string().required("Name of the Insured is required"),
  phoneNumber: yup.string().required("Phone Number is required"),
  farmAddress: yup.string().required("Address of the farm where damage occurred is required"),
  dateOfIncident: yup.date().required("Date of the incident is required"),
  
  // Section 2: Cause of Loss
  causeOfLoss: yup.string().required("Cause of loss is required"),
  additionalLossDetails: yup.string().required("Additional details explaining the damage or loss is required"),
  
  // Section 3: Property Lost or Damaged
  damagedItems: yup.array().of(
    yup.object().shape({
      itemDescription: yup.string().required("Description of the item is required"),
      numberOrQuantity: yup.number().required("Number or Quantity is required").positive("Must be a positive number"),
      valueBeforeLoss: yup.string().required("Value immediately before the Loss occurred is required"),
      salvageValue: yup.string().required("Value of Salvage is required")
    })
  ).min(1, 'At least one damaged item is required'),
  
  // Section 4: Data Privacy Policy
  agreeToDataPrivacy: yup.boolean().oneOf([true], "You must agree to data privacy policy"),
  
  // Section 5: Declaration & Signature
  declarationTrue: yup.boolean().oneOf([true], "You must agree to the declaration"),
  signature: yup.string().required("Full Name (Digital Signature) is required")
});

interface DamagedItem {
  itemDescription: string;
  numberOrQuantity: number;
  valueBeforeLoss: string;
  salvageValue: string;
}

interface FarmPropertyProduceData {
  // Section 1: Policy & Insured Details
  policyNumber: string;
  nameOfInsured: string;
  phoneNumber: string;
  farmAddress: string;
  dateOfIncident: Date;
  
  // Section 2: Cause of Loss
  causeOfLoss: string;
  additionalLossDetails: string;
  
  // Section 3: Property Lost or Damaged
  damagedItems: DamagedItem[];

  // Section 4: Data Privacy Policy
  agreeToDataPrivacy: boolean;
  
  // Section 5: Declaration & Signature
  declarationTrue: boolean;
  signature: string;
}

const defaultValues: Partial<FarmPropertyProduceData> = {
  damagedItems: [],
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

const FarmPropertyProduceClaim: React.FC = () => {
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
    formType: 'Farm Property and Produce Insurance Claim',
    onSuccess: () => clearDraft()
  });

  const formMethods = useForm<any>({
    resolver: yupResolver(farmPropertyProduceSchema),
    defaultValues,
    mode: 'onChange'
  });

  // Make toast available globally for MultiStepForm
  useEffect(() => {
    (window as any).toast = toast;
  }, [toast]);

  const { fields: damagedItemFields, append: addDamagedItem, remove: removeDamagedItem } = useFieldArray({
    control: formMethods.control,
    name: 'damagedItems'
  });

  const { saveDraft, clearDraft } = useFormDraft('farmPropertyProduceClaim', formMethods);

  // Auto-save draft
  useEffect(() => {
    const subscription = formMethods.watch((data) => {
      saveDraft(data);
    });
    return () => subscription.unsubscribe();
  }, [formMethods, saveDraft]);

  // Main submit handler
  const onFinalSubmit = async (data: FarmPropertyProduceData) => {
    const currentDate = new Date();
    
    const finalData = {
      ...data,
      signatureDate: currentDate,
      status: 'processing',
      formType: 'Farm Property and Produce Insurance Claim'
    };

    await handleEnhancedSubmit(finalData);
  };

  // Handle authentication-required submission
  useAuthRequiredSubmit(formMethods, onFinalSubmit);

  // Step field mappings for validation
  const stepFieldMappings = {
    0: ['policyNumber', 'nameOfInsured', 'phoneNumber', 'farmAddress', 'dateOfIncident'],
    1: ['causeOfLoss', 'additionalLossDetails'],
    2: ['damagedItems'],
    3: ['agreeToDataPrivacy', 'declarationTrue', 'signature']
  };

  const causeOfLossOptions = [
    "Fire",
    "Lightning",
    "Windstorm",
    "Aircraft",
    "Burglary/Housebreaking",
    "Flood",
    "Explosion",
    "Earthquake and Explosion",
    "Impact"
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
            <FormField name="phoneNumber" label="Phone Number" required type="tel" />
            <FormTextarea 
              name="farmAddress" 
              label="Address of the farm where damage occurred (if loss or damage occurred in transit please indicate)" 
              required 
            />
            <FormDatePicker name="dateOfIncident" label="Date of the incident" required />
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
                What is the cause of the damage or loss? Please tick the box that best describes the cause of your loss.
                <span className="required-asterisk">*</span>
              </Label>
              <RadioGroup
                value={formMethods.watch('causeOfLoss') || ""}
                onValueChange={(value) => {
                  formMethods.setValue('causeOfLoss', value);
                  if (formMethods.formState.errors.causeOfLoss) {
                    formMethods.clearErrors('causeOfLoss');
                  }
                }}
                className="space-y-2"
              >
                {causeOfLossOptions.map((option) => (
                  <div key={option} className="flex items-center space-x-2">
                    <RadioGroupItem value={option} id={`cause-${option}`} />
                    <Label htmlFor={`cause-${option}`} className="font-normal cursor-pointer">
                      {option}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
              {formMethods.formState.errors.causeOfLoss && (
                <p className="text-sm text-red-500">
                  {formMethods.formState.errors.causeOfLoss.message?.toString()}
                </p>
              )}
            </div>
            
            <FormTextarea 
              name="additionalLossDetails" 
              label="Please provide additional details explaining how the damage or loss to your property or agricultural produce occurred" 
              required 
              placeholder="Describe the circumstances and extent of the loss"
            />
          </div>
        </FormProvider>
      )
    },
    {
      id: 'property-lost-damaged',
      title: 'Property Lost or Damaged',
      component: (
        <FormProvider {...formMethods}>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-lg font-semibold">
                Detail of items lost or damaged <span className="required-asterisk">*</span>
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addDamagedItem({ itemDescription: '', numberOrQuantity: 0, valueBeforeLoss: '', salvageValue: '' })}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </div>
            
            {damagedItemFields.length === 0 && (
              <div className="text-center p-8 border-2 border-dashed rounded-lg">
                <Wheat className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                <p className="text-gray-500">No damaged items added yet</p>
                <p className="text-sm text-gray-400">Click "Add Item" to add damaged items</p>
              </div>
            )}
            
            {damagedItemFields.map((field, index) => (
              <Card key={field.id} className="relative">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Item {index + 1}</CardTitle>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeDamagedItem(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormTextarea 
                    name={`damagedItems.${index}.itemDescription`} 
                    label="Description of the item lost or damaged" 
                    required 
                    maxLength={500}
                  />
                  <FormField 
                    name={`damagedItems.${index}.numberOrQuantity`} 
                    label="Number or Quantity (where appropriate)" 
                    required 
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="e.g., 50"
                  />
                  <FormField 
                    name={`damagedItems.${index}.valueBeforeLoss`} 
                    label="Value immediately before the Loss occurred (₦)" 
                    required 
                    type="text" 
                    placeholder="e.g., 50000" 
                  />
                  <FormField 
                    name={`damagedItems.${index}.salvageValue`} 
                    label="Value of Salvage (₦)" 
                    required 
                    type="text" 
                    placeholder="e.g., 5000" 
                  />
                </CardContent>
              </Card>
            ))}
            
            {formMethods.formState.errors.damagedItems && !Array.isArray(formMethods.formState.errors.damagedItems) && (
              <p className="text-sm text-red-500">
                {formMethods.formState.errors.damagedItems.message?.toString()}
              </p>
            )}
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-yellow-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <Card className="shadow-xl border-t-4 border-t-green-600">
          <CardHeader className="text-center space-y-2 bg-gradient-to-r from-green-600 to-yellow-600 text-white rounded-t-lg">
            <div className="flex justify-center mb-2">
              <Wheat className="h-12 w-12" />
            </div>
            <CardTitle className="text-3xl font-bold">Farm Property and Produce Insurance</CardTitle>
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
        formType="Farm Property and Produce Insurance Claim"
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
                    <span className="font-medium text-gray-600">Phone Number:</span>
                    <p className="text-gray-900">{data.phoneNumber || 'Not provided'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Address of the farm where damage occurred:</span>
                    <p className="text-gray-900">{data.farmAddress || 'Not provided'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Date of the incident:</span>
                    <p className="text-gray-900">{data.dateOfIncident ? format(new Date(data.dateOfIncident), 'dd/MM/yyyy') : 'Not provided'}</p>
                  </div>
                </div>
              </div>

              {/* Section 2: Cause of Loss */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-3">Cause of Loss</h3>
                <div className="grid grid-cols-1 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">Cause of Loss:</span>
                    <p className="text-gray-900">{data.causeOfLoss || 'Not provided'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Additional Details:</span>
                    <p className="text-gray-900">{data.additionalLossDetails || 'Not provided'}</p>
                  </div>
                </div>
              </div>

              {/* Section 3: Property Lost or Damaged */}
              {data.damagedItems && data.damagedItems.length > 0 && (
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold text-lg mb-3">Property Lost or Damaged</h3>
                  {data.damagedItems.map((item: any, index: number) => (
                    <div key={index} className="border-l-4 border-green-200 pl-4 mb-4">
                      <h4 className="font-medium text-gray-800 mb-2">Item {index + 1}</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="md:col-span-2">
                          <span className="font-medium text-gray-600">Description:</span>
                          <p className="text-gray-900">{item.itemDescription || 'Not provided'}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">Number or Quantity:</span>
                          <p className="text-gray-900">{item.numberOrQuantity || 'Not provided'}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">Value Before Loss:</span>
                          <p className="text-gray-900">₦{item.valueBeforeLoss || 'Not provided'}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">Salvage Value:</span>
                          <p className="text-gray-900">₦{item.salvageValue || 'Not provided'}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

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
              
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start space-x-3">
                  <Info className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-yellow-800">Important Notice</h3>
                    <p className="text-sm text-yellow-700 mt-1">
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
        message="Your Farm Property and Produce insurance claim has been submitted and is being processed. You will receive a confirmation email shortly."
      />
    </div>
  );
};

export default FarmPropertyProduceClaim;
