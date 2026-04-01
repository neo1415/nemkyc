import React, { useEffect } from 'react';
import { useForm, useFieldArray, FormProvider, useFormContext } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { get } from 'lodash';
import { createEmailValidation, createPhoneValidation } from '@/utils/validation';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Plus, Trash2, Home, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import MultiStepForm from '@/components/common/MultiStepForm';
import { useFormDraft } from '@/hooks/useFormDraft';
import { useEnhancedFormSubmit } from '@/hooks/useEnhancedFormSubmit';
import FormLoadingModal from '@/components/common/FormLoadingModal';
import FormSummaryDialog from '@/components/common/FormSummaryDialog';
import SuccessModal from '@/components/common/SuccessModal';
import DatePicker from '@/components/common/DatePicker';
import { format } from 'date-fns';

// NEM Home Protection Claim Schema
const nemHomeProtectionSchema = yup.object().shape({
  // Section 1: Policy Information
  policyNumber: yup.string().required("Policy number is required"),
  periodOfCoverFrom: yup.date().required("Period of cover from is required"),
  periodOfCoverTo: yup.date().required("Period of cover to is required"),

  // Section 2: Insured Details
  title: yup.string(),
  surname: yup.string().required("Surname is required"),
  firstName: yup.string().required("First name is required"),
  otherName: yup.string(),
  dateOfBirth: yup.date(),
  gender: yup.string(),
  companyName: yup.string(),
  address: yup.string().required("Address is required"),
  phone: createPhoneValidation(),
  email: createEmailValidation(),
  
  // Section 3: Details of Loss
  lossAddress: yup.string().required("Loss address is required"),
  perilType: yup.string().required("Peril type is required"),
  dateOfLoss: yup.date().required("Date of loss is required"),
  timeOfLoss: yup.string().required("Time of loss is required"),
  medicalCertificateRequired: yup.boolean(),
  extentOfDamage: yup.string().required("Extent of damage is required"),
  propertyInterest: yup.string().required("Property interest is required"),
  propertyInterestOther: yup.string(),
  isSoleOwner: yup.string().required("Sole owner status is required"),
  otherOwnerName: yup.string(),
  otherOwnerPhone: yup.string(),
  otherOwnerAddress: yup.string(),
  hasOtherInsurance: yup.string().required("Other insurance status is required"),
  otherInsurerName: yup.string(),
  otherInsurerAddress: yup.string(),
  destroyedPropertyItems: yup.array().of(
    yup.object().shape({
      itemDescription: yup.string().required("Item description is required"),
      costOfItem: yup.string().required("Cost of item is required"),
      dateOfPurchase: yup.date().required("Date of purchase is required"),
      valueAtTimeOfLoss: yup.string().required("Value at time of loss is required")
    })
  ).test('min-items', 'At least one property item is required', function(value) {
    // Only validate if we're on the details-of-loss step or later
    const parent = this.parent;
    if (!parent || !parent.lossAddress) {
      // If we haven't filled basic loss details yet, don't validate array
      return true;
    }
    return value && value.length >= 1;
  }),

  // Section 4: Declaration & Signature
  agreeToDataPrivacy: yup.boolean().oneOf([true], "You must agree to data privacy policy"),
  declarationTrue: yup.boolean().oneOf([true], "You must agree to the declaration"),
  signature: yup.string().required("Signature is required")
});

interface PropertyItem {
  itemDescription: string;
  costOfItem: string;
  dateOfPurchase: Date;
  valueAtTimeOfLoss: string;
}

interface NEMHomeProtectionData {
  // Section 1: Policy Information
  policyNumber: string;
  periodOfCoverFrom: Date;
  periodOfCoverTo: Date;
  
  // Section 2: Insured Details
  title?: string;
  surname: string;
  firstName: string;
  otherName?: string;
  dateOfBirth?: Date;
  gender?: string;
  companyName?: string;
  address: string;
  phone: string;
  email?: string;
  
  // Section 3: Details of Loss
  lossAddress: string;
  perilType: string;
  dateOfLoss: Date;
  timeOfLoss: string;
  medicalCertificateRequired?: boolean;
  extentOfDamage: string;
  propertyInterest: string;
  propertyInterestOther?: string;
  isSoleOwner: string;
  otherOwnerName?: string;
  otherOwnerPhone?: string;
  otherOwnerAddress?: string;
  hasOtherInsurance: string;
  otherInsurerName?: string;
  otherInsurerAddress?: string;
  destroyedPropertyItems: PropertyItem[];

  // Section 4: Declaration & Signature
  agreeToDataPrivacy: boolean;
  declarationTrue: boolean;
  signature: string;
}

const defaultValues: Partial<NEMHomeProtectionData> = {
  destroyedPropertyItems: [],
  agreeToDataPrivacy: false,
  declarationTrue: false
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

const FormSelect = ({ name, label, required = false, options, placeholder, children, ...props }: any) => {
  const { setValue, watch, formState: { errors }, clearErrors } = useFormContext();
  const value = watch(name);
  const error = get(errors, name);

  return (
    <div className="space-y-2">
      <Label htmlFor={name}>
        {label}
        {required && <span className="required-asterisk">*</span>}
      </Label>
      <Select 
        value={value || ""} 
        onValueChange={(val) => {
          setValue(name, val);
          if (error) {
            clearErrors(name);
          }
        }} 
        {...props}
      >
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

const NEMHomeProtectionClaim: React.FC = () => {
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
    formType: 'NEM Home Protection Claim',
    onSuccess: () => clearDraft()
  });

  const formMethods = useForm<any>({
    resolver: yupResolver(nemHomeProtectionSchema),
    defaultValues,
    mode: 'onChange'
  });

  // Make toast available globally for MultiStepForm
  useEffect(() => {
    (window as any).toast = toast;
  }, [toast]);

  const { fields: propertyItemFields, append: addPropertyItem, remove: removePropertyItem } = useFieldArray({
    control: formMethods.control,
    name: 'destroyedPropertyItems'
  });

  const { saveDraft, clearDraft } = useFormDraft('nemHomeProtectionClaim', formMethods);

  // Auto-save draft
  useEffect(() => {
    const subscription = formMethods.watch((data) => {
      saveDraft(data);
    });
    return () => subscription.unsubscribe();
  }, [formMethods, saveDraft]);

  // Main submit handler
  const onFinalSubmit = async (data: NEMHomeProtectionData) => {
    const currentDate = new Date();
    
    const finalData = {
      ...data,
      signatureDate: currentDate,
      status: 'processing',
      formType: 'NEM Home Protection Claim'
    };

    await handleEnhancedSubmit(finalData);
  };

  // Step field mappings for validation
  const stepFieldMappings = {
    0: ['policyNumber', 'periodOfCoverFrom', 'periodOfCoverTo'],
    1: ['surname', 'firstName', 'address', 'phone'],
    2: ['lossAddress', 'perilType', 'dateOfLoss', 'timeOfLoss', 'extentOfDamage', 'propertyInterest', 'isSoleOwner', 'hasOtherInsurance'],
    3: ['agreeToDataPrivacy', 'declarationTrue', 'signature']
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
            <FormSelect name="title" label="Title" placeholder="Select title" options={["Mr", "Mrs", "Miss", "Ms", "Dr", "Prof", "Chief", "Other"]} />
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField name="surname" label="Surname" required />
              <FormField name="firstName" label="First Name" required />
              <FormField name="otherName" label="Other Name" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormDatePicker name="dateOfBirth" label="Date of Birth" />
              <FormSelect name="gender" label="Gender" placeholder="Select gender" options={["Male", "Female"]} />
            </div>
            
            <FormField name="companyName" label="Name of the Company (if Applicable)" />
            <FormTextarea name="address" label="Address" required />
            <FormField name="phone" label="Phone Number" required type="tel" />
            <FormField name="email" label="Email" type="email" />
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
            <FormTextarea name="lossAddress" label="Full Address of premises where the loss occurred" required placeholder="Include description and situation of the premises" />
            
            <FormSelect name="perilType" label="Type of Peril" required placeholder="Select peril type">
              <SelectItem value="fire">Fire</SelectItem>
              <SelectItem value="flood">Flood</SelectItem>
              <SelectItem value="water">Water</SelectItem>
              <SelectItem value="storm">Storm</SelectItem>
              <SelectItem value="lightning">Lightning</SelectItem>
              <SelectItem value="explosion">Explosion</SelectItem>
              <SelectItem value="accident">Accident</SelectItem>
            </FormSelect>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormDatePicker name="dateOfLoss" label="Date of Loss" required />
              <FormField name="timeOfLoss" label="Time of Loss" required type="time" />
            </div>
            
            {(formMethods.watch('perilType') === 'flood' || 
              formMethods.watch('perilType') === 'water' || 
              formMethods.watch('perilType') === 'accident') && (
              <div className="flex items-start space-x-2 p-4 bg-blue-50 rounded-md">
                <Checkbox
                  id="medicalCertificateRequired"
                  checked={formMethods.watch('medicalCertificateRequired')}
                  onCheckedChange={(checked) => formMethods.setValue('medicalCertificateRequired', checked as boolean)}
                />
                <Label htmlFor="medicalCertificateRequired" className="text-sm">
                  If domestic accident leading to medical expenses, please fill the attached Certificate of Medical Attendant
                </Label>
              </div>
            )}
            
            <FormTextarea name="extentOfDamage" label="Extent of Damage by the Peril" required placeholder="Describe the extent and nature of damage to the property" />
            
            <FormSelect name="propertyInterest" label="Your interest in the Property" required placeholder="Select property interest">
              <SelectItem value="owner">Owner</SelectItem>
              <SelectItem value="owner-agent">Owner Agent</SelectItem>
              <SelectItem value="trustee">Trustee</SelectItem>
              <SelectItem value="mortgagor">Mortgagor</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </FormSelect>
            
            {formMethods.watch('propertyInterest') === 'other' && (
              <FormField name="propertyInterestOther" label="Please state other interest" placeholder="Describe your interest in the property" />
            )}
            
            <FormSelect name="isSoleOwner" label="Are you the sole owner of the property damaged?" required placeholder="Select option">
              <SelectItem value="yes">Yes</SelectItem>
              <SelectItem value="no">No</SelectItem>
            </FormSelect>
            
            {formMethods.watch('isSoleOwner') === 'no' && (
              <>
                <FormField name="otherOwnerName" label="Name of other owners" placeholder="Enter names of other owners" />
                <FormField name="otherOwnerPhone" label="Phone Number of other owners" placeholder="Enter phone number" type="tel" />
                <FormTextarea name="otherOwnerAddress" label="Address of other owners" placeholder="Enter address of other owners" />
              </>
            )}
            
            <FormSelect name="hasOtherInsurance" label="Is there any other insurance cover against this loss?" required placeholder="Select option">
              <SelectItem value="yes">Yes</SelectItem>
              <SelectItem value="no">No</SelectItem>
            </FormSelect>
            
            {formMethods.watch('hasOtherInsurance') === 'yes' && (
              <>
                <FormField name="otherInsurerName" label="Name of other Insurers" placeholder="Enter name of other insurers" />
                <FormTextarea name="otherInsurerAddress" label="Address of other Insurers" placeholder="Enter address of other insurers" />
              </>
            )}
            
            {/* Property Items Array */}
            <div className="space-y-4 border-t pt-4">
              <div className="flex items-center justify-between">
                <Label className="text-lg font-semibold">Detail of Property Destroyed <span className="required-asterisk">*</span></Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addPropertyItem({ itemDescription: '', costOfItem: '', dateOfPurchase: new Date(), valueAtTimeOfLoss: '' })}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Property Item
                </Button>
              </div>
              
              {propertyItemFields.length === 0 && (
                <div className="text-center p-8 border-2 border-dashed rounded-lg">
                  <FileText className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                  <p className="text-gray-500">No property items added yet</p>
                  <p className="text-sm text-gray-400">Click "Add Property Item" to add items</p>
                </div>
              )}
              
              {propertyItemFields.map((field, index) => (
                <Card key={field.id} className="relative">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Property Item {index + 1}</CardTitle>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removePropertyItem(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField name={`destroyedPropertyItems.${index}.itemDescription`} label="Item Description" required />
                    <FormField name={`destroyedPropertyItems.${index}.costOfItem`} label="Cost of the Item (₦)" required type="text" placeholder="e.g., 50000" />
                    <FormDatePicker name={`destroyedPropertyItems.${index}.dateOfPurchase`} label="Date of Purchase" required />
                    <FormField name={`destroyedPropertyItems.${index}.valueAtTimeOfLoss`} label="Value at the Time of Loss (₦)" required type="text" placeholder="e.g., 45000" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </FormProvider>
      )
    },
    {
      id: 'declaration-signature',
      title: 'Section 4: Data Privacy & Declaration',
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <Card className="shadow-xl border-t-4 border-t-blue-600">
          <CardHeader className="text-center space-y-2 bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-t-lg">
            <div className="flex justify-center mb-2">
              <Home className="h-12 w-12" />
            </div>
            <CardTitle className="text-3xl font-bold">NEM Home Protection Policy</CardTitle>
            <CardDescription className="text-blue-100 text-lg">
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
      <FormLoadingModal isOpen={showLoading} message={loadingMessage} />

      {/* Summary Dialog */}
      <FormSummaryDialog
        open={showSummary}
        onOpenChange={setShowSummary}
        onConfirm={confirmSubmit}
        formData={submissionData}
        formType="NEM Home Protection Claim"
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
                  {data.title && (
                    <div>
                      <span className="font-medium text-gray-600">Title:</span>
                      <p className="text-gray-900">{data.title}</p>
                    </div>
                  )}
                  <div>
                    <span className="font-medium text-gray-600">Surname:</span>
                    <p className="text-gray-900">{data.surname || 'Not provided'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">First Name:</span>
                    <p className="text-gray-900">{data.firstName || 'Not provided'}</p>
                  </div>
                  {data.otherName && (
                    <div>
                      <span className="font-medium text-gray-600">Other Name:</span>
                      <p className="text-gray-900">{data.otherName}</p>
                    </div>
                  )}
                  {data.dateOfBirth && (
                    <div>
                      <span className="font-medium text-gray-600">Date of Birth:</span>
                      <p className="text-gray-900">{format(new Date(data.dateOfBirth), 'dd/MM/yyyy')}</p>
                    </div>
                  )}
                  {data.gender && (
                    <div>
                      <span className="font-medium text-gray-600">Gender:</span>
                      <p className="text-gray-900 capitalize">{data.gender}</p>
                    </div>
                  )}
                  {data.companyName && (
                    <div className="md:col-span-2">
                      <span className="font-medium text-gray-600">Company Name:</span>
                      <p className="text-gray-900">{data.companyName}</p>
                    </div>
                  )}
                  <div className="md:col-span-2">
                    <span className="font-medium text-gray-600">Address:</span>
                    <p className="text-gray-900">{data.address || 'Not provided'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Phone Number:</span>
                    <p className="text-gray-900">{data.phone || 'Not provided'}</p>
                  </div>
                  {data.email && (
                    <div>
                      <span className="font-medium text-gray-600">Email:</span>
                      <p className="text-gray-900">{data.email}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Section 3: Details of Loss */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-3">Details of Loss</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="md:col-span-2">
                    <span className="font-medium text-gray-600">Loss Address:</span>
                    <p className="text-gray-900">{data.lossAddress || 'Not provided'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Type of Peril:</span>
                    <p className="text-gray-900 capitalize">{data.perilType || 'Not provided'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Date of Loss:</span>
                    <p className="text-gray-900">{data.dateOfLoss ? format(new Date(data.dateOfLoss), 'dd/MM/yyyy') : 'Not provided'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Time of Loss:</span>
                    <p className="text-gray-900">{data.timeOfLoss || 'Not provided'}</p>
                  </div>
                  <div className="md:col-span-2">
                    <span className="font-medium text-gray-600">Extent of Damage:</span>
                    <p className="text-gray-900">{data.extentOfDamage || 'Not provided'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Property Interest:</span>
                    <p className="text-gray-900 capitalize">{data.propertyInterest || 'Not provided'}</p>
                  </div>
                  {data.propertyInterestOther && (
                    <div>
                      <span className="font-medium text-gray-600">Other Interest:</span>
                      <p className="text-gray-900">{data.propertyInterestOther}</p>
                    </div>
                  )}
                  <div>
                    <span className="font-medium text-gray-600">Sole Owner:</span>
                    <p className="text-gray-900 capitalize">{data.isSoleOwner || 'Not provided'}</p>
                  </div>
                  {data.isSoleOwner === 'no' && (
                    <>
                      {data.otherOwnerName && (
                        <div className="md:col-span-2">
                          <span className="font-medium text-gray-600">Other Owners Name:</span>
                          <p className="text-gray-900">{data.otherOwnerName}</p>
                        </div>
                      )}
                      {data.otherOwnerPhone && (
                        <div>
                          <span className="font-medium text-gray-600">Other Owners Phone:</span>
                          <p className="text-gray-900">{data.otherOwnerPhone}</p>
                        </div>
                      )}
                      {data.otherOwnerAddress && (
                        <div className="md:col-span-2">
                          <span className="font-medium text-gray-600">Other Owners Address:</span>
                          <p className="text-gray-900">{data.otherOwnerAddress}</p>
                        </div>
                      )}
                    </>
                  )}
                  <div>
                    <span className="font-medium text-gray-600">Other Insurance:</span>
                    <p className="text-gray-900 capitalize">{data.hasOtherInsurance || 'Not provided'}</p>
                  </div>
                  {data.hasOtherInsurance === 'yes' && (
                    <>
                      {data.otherInsurerName && (
                        <div className="md:col-span-2">
                          <span className="font-medium text-gray-600">Other Insurers Name:</span>
                          <p className="text-gray-900">{data.otherInsurerName}</p>
                        </div>
                      )}
                      {data.otherInsurerAddress && (
                        <div className="md:col-span-2">
                          <span className="font-medium text-gray-600">Other Insurers Address:</span>
                          <p className="text-gray-900">{data.otherInsurerAddress}</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Property Items */}
              {data.destroyedPropertyItems && data.destroyedPropertyItems.length > 0 && (
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold text-lg mb-3">Property Destroyed</h3>
                  {data.destroyedPropertyItems.map((item: any, index: number) => (
                    <div key={index} className="border-l-4 border-blue-200 pl-4 mb-4">
                      <h4 className="font-medium text-gray-800 mb-2">Item {index + 1}</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="md:col-span-2">
                          <span className="font-medium text-gray-600">Description:</span>
                          <p className="text-gray-900">{item.itemDescription || 'Not provided'}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">Cost of Item:</span>
                          <p className="text-gray-900">₦{item.costOfItem || 'Not provided'}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">Date of Purchase:</span>
                          <p className="text-gray-900">{item.dateOfPurchase ? format(new Date(item.dateOfPurchase), 'dd/MM/yyyy') : 'Not provided'}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">Value at Time of Loss:</span>
                          <p className="text-gray-900">₦{item.valueAtTimeOfLoss || 'Not provided'}</p>
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
        message="Your NEM Home Protection claim has been submitted and is being processed. You will receive a confirmation email shortly."
      />
    </div>
  );
};

export default NEMHomeProtectionClaim;
