import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray, FormProvider, useFormContext } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { get } from 'lodash';
import { createEmailValidation, createPhoneValidation, createFromDateValidation, createToDateValidation } from '@/utils/validation';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Plus, Trash2, Info } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import MultiStepForm from '@/components/common/MultiStepForm';
import { useFormDraft } from '@/hooks/useFormDraft';
import { uploadFile } from '@/services/fileService';
import { useEnhancedFormSubmit } from '@/hooks/useEnhancedFormSubmit';
import FormLoadingModal from '@/components/common/FormLoadingModal';
import FormSummaryDialog from '@/components/common/FormSummaryDialog';
import SuccessModal from '@/components/common/SuccessModal';
import DatePicker from '@/components/common/DatePicker';

// Smart Motorist Protection Claim Schema
const smartMotoristProtectionSchema = yup.object().shape({
  // Section 1: Policy Information
  policyNumber: yup.string().required("Policy number is required"),
  periodOfCoverFrom: createFromDateValidation(),
  periodOfCoverTo: createToDateValidation(),

  // Section 2: Insured Details
  nameOfInsured: yup.string().required("Insured name is required"),
  address: yup.string().required("Address is required"),
  phone: createPhoneValidation(),
  email: createEmailValidation(),
  
  // Section 3: Details of Loss
  accidentDate: createFromDateValidation(),
  accidentTime: yup.string().required("Accident time is required"),
  accidentLocation: yup.string().required("Place of accident is required"),
  accidentDescription: yup.string().required("Please describe incident is required"),
  injuryDescription: yup.string(),
  witnesses: yup.array().of(
    yup.object().shape({
      name: yup.string().required("Witness name is required"),
      address: yup.string().required("Witness address is required")
    })
  ),
  doctorNameAddress: yup.string(),
  isUsualDoctor: yup.string(),
  totalIncapacityFrom: createFromDateValidation().optional(),
  totalIncapacityTo: createToDateValidation().optional(),
  partialIncapacityFrom: createFromDateValidation().optional(),
  partialIncapacityTo: createToDateValidation().optional(),
  otherInsurerName: yup.string(),
  otherInsurerAddress: yup.string(),
  otherInsurerPolicyNumber: yup.string(),

  // Section 4: Data Privacy Policy
  agreeToDataPrivacy: yup.boolean().oneOf([true], "You must agree to data privacy policy"),
  
  // Section 5: Declaration & Signature
  declarationTrue: yup.boolean().oneOf([true], "You must agree to the declaration"),
  signature: yup.string().required("Signature is required")
});
interface Witness {
  name: string;
  address: string;
}

interface SmartMotoristProtectionData {
  // Section 1: Policy Information
  policyNumber: string;
  periodOfCoverFrom: Date;
  periodOfCoverTo: Date;
  
  // Section 2: Insured Details
  nameOfInsured: string;
  address: string;
  phone: string;
  email: string;
  
  // Section 3: Details of Loss
  accidentDate: Date;
  accidentTime: string;
  accidentLocation: string;
  accidentDescription: string;
  injuryDescription?: string;
  witnesses: Witness[];
  doctorNameAddress?: string;
  isUsualDoctor?: string;
  totalIncapacityFrom?: Date;
  totalIncapacityTo?: Date;
  partialIncapacityFrom?: Date;
  partialIncapacityTo?: Date;
  otherInsurerName?: string;
  otherInsurerAddress?: string;
  otherInsurerPolicyNumber?: string;

  // Section 4: Data Privacy Policy
  agreeToDataPrivacy: boolean;
  
  // Section 5: Declaration & Signature
  declarationTrue: boolean;
  signature: string;
}

const defaultValues: Partial<SmartMotoristProtectionData> = {
  witnesses: [],
  agreeToDataPrivacy: false,
  declarationTrue: false
};

// Form field components following Motor Claims pattern exactly
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

const FormSelect = ({ name, label, required = false, options, placeholder, children, ...props }: any) => {
  const { setValue, watch, formState: { errors } } = useFormContext();
  const value = watch(name);
  const error = get(errors, name);

  return (
    <div className="space-y-2">
      <Label htmlFor={name}>
        {label}
        {required && <span className="required-asterisk">*</span>}
      </Label>
      <Select value={value || ""} onValueChange={(val) => setValue(name, val)} {...props}>
        <SelectTrigger className={cn(
          "w-full",
          error && "border-red-500 focus:border-red-500"
        )}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {children || options?.map((option: string) => (
            <SelectItem key={option} value={option.toLowerCase()}>{option}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && (
        <p className="text-sm text-red-500">{error.message?.toString()}</p>
      )}
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

const SmartMotoristProtectionClaim: React.FC = () => {
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
    formType: 'Smart Motorist Protection Claim',
    onSuccess: () => clearDraft()
  });

  const formMethods = useForm<any>({
    resolver: yupResolver(smartMotoristProtectionSchema),
    defaultValues,
    mode: 'onChange'
  });

  // Make toast available globally for MultiStepForm
  useEffect(() => {
    (window as any).toast = toast;
  }, [toast]);

  const { fields: witnessFields, append: addWitness, remove: removeWitness } = useFieldArray({
    control: formMethods.control,
    name: 'witnesses'
  });

  const { saveDraft, clearDraft } = useFormDraft('smartMotoristProtectionClaim', formMethods);

  // Auto-save draft
  useEffect(() => {
    const subscription = formMethods.watch((data) => {
      saveDraft(data);
    });
    return () => subscription.unsubscribe();
  }, [formMethods, saveDraft]);
  // Main submit handler - shows summary after validation
  const onFinalSubmit = async (data: SmartMotoristProtectionData) => {
    // Set signature date to current date automatically
    const currentDate = new Date();
    
    const finalData = {
      ...data,
      signatureDate: currentDate,
      status: 'processing',
      formType: 'Smart Motorist Protection Claim'
    };

    // Use enhanced submit which will show loading immediately
    await handleEnhancedSubmit(finalData);
  };

  // Step field mappings for validation
  const stepFieldMappings = {
    0: ['policyNumber', 'periodOfCoverFrom', 'periodOfCoverTo'], // Section 1: Policy Information
    1: ['nameOfInsured', 'address', 'phone', 'email'], // Section 2: Insured Details
    2: ['accidentDate', 'accidentTime', 'accidentLocation', 'accidentDescription'], // Section 3: Details of Loss
    3: ['agreeToDataPrivacy', 'declarationTrue', 'signature'] // Section 4: Data Privacy Policy & Declaration
  };

  const steps = [
    {
      id: 'policy-information',
      title: 'Section 1: Policy Information',
      component: (
        <FormProvider {...formMethods}>
          <div className="space-y-4">
            <FormField name="policyNumber" label="Policy Number" required />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormDatePicker name="periodOfCoverFrom" label="Period of Cover: From" required />
              <FormDatePicker name="periodOfCoverTo" label="Period of Cover: To" required />
            </div>
          </div>
        </FormProvider>
      )
    },
    {
      id: 'insured-details',
      title: 'Section 2: Insured Details',
      component: (
        <FormProvider {...formMethods}>
          <div className="space-y-4">
            <FormField name="nameOfInsured" label="Insured Name" required />
            <FormTextarea name="address" label="Address" required />
            <FormField 
              name="phone" 
              label="Phone" 
              required 
              type="tel"
              pattern="[0-9+\-\(\)\s]*"
              onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => {
                const allowedChars = /[0-9+\-\(\)\s]/;
                if (!allowedChars.test(e.key)) {
                  e.preventDefault();
                }
              }}
            />
            <FormField name="email" label="Email" required type="email" />
          </div>
        </FormProvider>
      )
    },
    {
      id: 'details-of-loss',
      title: 'Section 3: Details of Loss',
      component: (
        <FormProvider {...formMethods}>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormDatePicker name="accidentDate" label="Accident Date" required />
              <FormField name="accidentTime" label="Accident Time" required type="time" />
            </div>
            
            <FormField name="accidentLocation" label="Place of Accident" required />
            <FormTextarea name="accidentDescription" label="Please describe incident" required />
            <FormTextarea name="injuryDescription" label="Particulars of Injuries" />
            
            {/* Witnesses Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Name and Address of Witnesses</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addWitness({ name: '', address: '' })}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Witness
                </Button>
              </div>
              
              {witnessFields.map((field, index) => (
                <div key={field.id} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Witness {index + 1}</h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeWitness(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <FormField name={`witnesses.${index}.name`} label="Witness Name" required />
                  <FormTextarea name={`witnesses.${index}.address`} label="Witness Address" required />
                </div>
              ))}
            </div>
            
            {/* Doctor Information - Combined field */}
            <div className="space-y-4">
              <FormTextarea name="doctorNameAddress" label="Name and Address of Doctor in attendance" />
              
              {formMethods.watch('doctorNameAddress') && (
                <FormSelect name="isUsualDoctor" label="Is he your usual Doctor?" placeholder="Select Yes or No">
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </FormSelect>
              )}
            </div>
            
            {/* Incapacity Information - Date ranges */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-800">Total Incapacity Period</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormDatePicker name="totalIncapacityFrom" label="From" />
                <FormDatePicker name="totalIncapacityTo" label="To" />
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-medium text-gray-800">Partial Incapacity Period</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormDatePicker name="partialIncapacityFrom" label="From" />
                <FormDatePicker name="partialIncapacityTo" label="To" />
              </div>
            </div>
            
            {/* Other Insurers - Split into separate fields */}
            <div className="space-y-4">
              <FormField name="otherInsurerName" label="Name of any other insurers concerned with this accident" />
              <FormTextarea name="otherInsurerAddress" label="Address of any other insurers concerned with this accident" />
              <FormField name="otherInsurerPolicyNumber" label="Policy number of any other insurers concerned with this accident" />
            </div>
          </div>
        </FormProvider>
      )
    },
    {
      id: 'data-privacy-policy',
      title: 'Section 4: Data Privacy Policy',
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
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card>
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <FileText className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Smart Motorist Protection Claim Form
          </CardTitle>
          <CardDescription className="text-gray-600 max-w-2xl mx-auto">
            Please fill out this form completely and accurately. All required fields must be completed before submission.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <MultiStepForm
            steps={steps}
            onSubmit={onFinalSubmit}
            stepFieldMappings={stepFieldMappings}
            formMethods={formMethods}
            submitButtonText="Submit Claim"
          />
        </CardContent>
      </Card>

      {/* Loading Modal */}
      <FormLoadingModal
        isOpen={showLoading}
        message={loadingMessage}
      />

      {/* Summary Dialog */}
      <FormSummaryDialog
        open={showSummary}
        onOpenChange={setShowSummary}
        formData={submissionData}
        formType="Smart Motorist Protection Claim"
        onConfirm={confirmSubmit}
        isSubmitting={isSubmitting}
        renderSummary={(data) => {
          if (!data) return <div className="text-center py-8 text-gray-500">No data to display</div>;
          
          return (
            <div className="space-y-6">
              {/* Section 1: Policy Information */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-3">Policy Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">Policy Number:</span>
                    <p className="text-gray-900">{data.policyNumber || 'Not provided'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Cover Period From:</span>
                    <p className="text-gray-900">{data.periodOfCoverFrom ? format(new Date(data.periodOfCoverFrom), 'dd/MM/yyyy') : 'Not provided'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Cover Period To:</span>
                    <p className="text-gray-900">{data.periodOfCoverTo ? format(new Date(data.periodOfCoverTo), 'dd/MM/yyyy') : 'Not provided'}</p>
                  </div>
                </div>
              </div>
              {/* Section 2: Insured Details */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-3">Insured Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">Insured Name:</span>
                    <p className="text-gray-900">{data.nameOfInsured || 'Not provided'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Phone Number:</span>
                    <p className="text-gray-900">{data.phone || 'Not provided'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Email:</span>
                    <p className="text-gray-900">{data.email || 'Not provided'}</p>
                  </div>
                  <div className="md:col-span-2">
                    <span className="font-medium text-gray-600">Address:</span>
                    <p className="text-gray-900">{data.address || 'Not provided'}</p>
                  </div>
                </div>
              </div>

              {/* Section 3: Details of Loss */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-3">Details of Loss</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">Accident Date:</span>
                    <p className="text-gray-900">{data.accidentDate ? format(new Date(data.accidentDate), 'dd/MM/yyyy') : 'Not provided'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Accident Time:</span>
                    <p className="text-gray-900">{data.accidentTime || 'Not provided'}</p>
                  </div>
                  <div className="md:col-span-2">
                    <span className="font-medium text-gray-600">Place of Accident:</span>
                    <p className="text-gray-900">{data.accidentLocation || 'Not provided'}</p>
                  </div>
                  <div className="md:col-span-2">
                    <span className="font-medium text-gray-600">Incident Description:</span>
                    <p className="text-gray-900">{data.accidentDescription || 'Not provided'}</p>
                  </div>
                  {data.injuryDescription && (
                    <div className="md:col-span-2">
                      <span className="font-medium text-gray-600">Particulars of Injuries:</span>
                      <p className="text-gray-900">{data.injuryDescription}</p>
                    </div>
                  )}
                </div>
              </div>
              {/* Doctor Information */}
              {data.doctorNameAddress && (
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold text-lg mb-3">Doctor Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="md:col-span-2">
                      <span className="font-medium text-gray-600">Doctor Name and Address:</span>
                      <p className="text-gray-900">{data.doctorNameAddress}</p>
                    </div>
                    {data.isUsualDoctor && (
                      <div>
                        <span className="font-medium text-gray-600">Usual Doctor:</span>
                        <p className="text-gray-900 capitalize">{data.isUsualDoctor}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Incapacity Periods */}
              {((data.totalIncapacityFrom && data.totalIncapacityTo) || (data.partialIncapacityFrom && data.partialIncapacityTo)) && (
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold text-lg mb-3">Incapacity Periods</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    {data.totalIncapacityFrom && data.totalIncapacityTo && (
                      <>
                        <div>
                          <span className="font-medium text-gray-600">Total Incapacity From:</span>
                          <p className="text-gray-900">{format(new Date(data.totalIncapacityFrom), 'dd/MM/yyyy')}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">Total Incapacity To:</span>
                          <p className="text-gray-900">{format(new Date(data.totalIncapacityTo), 'dd/MM/yyyy')}</p>
                        </div>
                      </>
                    )}
                    {data.partialIncapacityFrom && data.partialIncapacityTo && (
                      <>
                        <div>
                          <span className="font-medium text-gray-600">Partial Incapacity From:</span>
                          <p className="text-gray-900">{format(new Date(data.partialIncapacityFrom), 'dd/MM/yyyy')}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">Partial Incapacity To:</span>
                          <p className="text-gray-900">{format(new Date(data.partialIncapacityTo), 'dd/MM/yyyy')}</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
              {/* Other Insurers */}
              {(data.otherInsurerName || data.otherInsurerAddress || data.otherInsurerPolicyNumber) && (
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold text-lg mb-3">Other Insurers</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    {data.otherInsurerName && (
                      <div>
                        <span className="font-medium text-gray-600">Insurer Name:</span>
                        <p className="text-gray-900">{data.otherInsurerName}</p>
                      </div>
                    )}
                    {data.otherInsurerPolicyNumber && (
                      <div>
                        <span className="font-medium text-gray-600">Policy Number:</span>
                        <p className="text-gray-900">{data.otherInsurerPolicyNumber}</p>
                      </div>
                    )}
                    {data.otherInsurerAddress && (
                      <div className="md:col-span-2">
                        <span className="font-medium text-gray-600">Insurer Address:</span>
                        <p className="text-gray-900">{data.otherInsurerAddress}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Witnesses */}
              {data.witnesses && data.witnesses.length > 0 && (
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold text-lg mb-3">Witnesses</h3>
                  {data.witnesses.map((witness: any, index: number) => (
                    <div key={index} className="border-l-4 border-blue-200 pl-4 mb-4">
                      <h4 className="font-medium text-gray-800 mb-2">Witness {index + 1}</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-600">Name:</span>
                          <p className="text-gray-900">{witness.name || 'Not provided'}</p>
                        </div>
                        <div className="md:col-span-2">
                          <span className="font-medium text-gray-600">Address:</span>
                          <p className="text-gray-900">{witness.address || 'Not provided'}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {/* Declaration */}
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
        message="Your Smart Motorist Protection claim has been submitted and is being processed. You will receive a confirmation email shortly."
      />
    </div>
  );
};

export default SmartMotoristProtectionClaim;