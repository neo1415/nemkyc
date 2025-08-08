import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray, FormProvider, useFormContext } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { get } from 'lodash';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Settings, Upload, FileText, CheckCircle2, Loader2, Plus, Trash2, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import MultiStepForm from '@/components/common/MultiStepForm';
import { useFormDraft } from '@/hooks/useFormDraft';
import FileUpload from '@/components/common/FileUpload';
import { uploadFile } from '@/services/fileService';
import { useAuthRequiredSubmit } from '@/hooks/useAuthRequiredSubmit';
import SuccessModal from '@/components/common/SuccessModal';
import PhoneInput from '@/components/common/PhoneInput';

// Enhanced schema with better validation
const contractorsSchema = yup.object().shape({
  // Policy Details
  policyNumber: yup.string().required('Policy number is required'),
  periodOfCoverFrom: yup.date().required('Period start date is required'),
  periodOfCoverTo: yup.date().required('Period end date is required'),

  // Insured Details
  nameOfInsured: yup.string().required('Name is required'),
  companyName: yup.string(),
  title: yup.string().required('Title is required'),
  dateOfBirth: yup.date().required('Date of birth is required'),
  gender: yup.string().required('Gender is required'),
  address: yup.string().required('Address is required'),
  phone: yup.string().required('Phone is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  
  // Plant/Machinery Details
  plantMachineryItems: yup.array().of(yup.object().shape({
    itemNumber: yup.string().required('Item number is required'),
    yearOfManufacture: yup.number()
      .required('Year of manufacture is required')
      .min(1900, 'Year must be after 1900')
      .max(new Date().getFullYear(), 'Year cannot be in the future'),
    make: yup.string().required('Make is required'),
    registrationNumber: yup.string(),
    dateOfPurchase: yup.date().required('Date of purchase is required'),
    costPrice: yup.number()
      .required('Cost price is required')
      .min(0, 'Cost price must be positive'),
    deductionForAge: yup.number()
      .min(0, 'Deduction cannot be negative'),
    sumClaimed: yup.number()
      .required('Sum claimed is required')
      .min(0, 'Sum claimed must be positive'),
    claimType: yup.string()
      .oneOf(['presentValue', 'repairs'], 'Please select a valid claim type')
      .required('Claim type is required')
  })).min(1, 'At least one plant/machinery item is required'),
  
  // Loss/Damage Details
  dateOfLoss: yup.date().required('Date of loss is required'),
  timeOfLoss: yup.string().required('Time of loss is required'),
  lastSeenIntact: yup.string(),
  whereDidLossOccur: yup.string().required('Location of loss is required'),
  partsDamaged: yup.string().required('Parts damaged description is required'),
  whereCanBeInspected: yup.string().required('Inspection location is required'),
  fullAccountCircumstances: yup.string().required('Full account of circumstances is required'),
  suspicionInformation: yup.string(),
  
  // Theft/Third Party
  policeInformed: yup.boolean().required('Police informed status is required'),
  policeStation: yup.string().when('policeInformed', {
    is: true,
    then: (schema) => schema.required('Police station details required'),
    otherwise: (schema) => schema.notRequired()
  }),
  otherRecoveryActions: yup.string(),
  isSoleOwner: yup.boolean().required('Sole owner status is required'),
  ownershipDetails: yup.string().when('isSoleOwner', {
    is: false,
    then: (schema) => schema.required('Ownership details required'),
    otherwise: (schema) => schema.notRequired()
  }),
  hasOtherInsurance: yup.boolean().required('Other insurance status is required'),
  otherInsuranceDetails: yup.string().when('hasOtherInsurance', {
    is: true,
    then: (schema) => schema.required('Other insurance details required'),
    otherwise: (schema) => schema.notRequired()
  }),
  thirdPartyInvolved: yup.boolean().required('Third party involvement is required'),
  thirdPartyName: yup.string().when('thirdPartyInvolved', {
    is: true,
    then: (schema) => schema.required('Third party name required'),
    otherwise: (schema) => schema.notRequired()
  }),
  thirdPartyAddress: yup.string().when('thirdPartyInvolved', {
    is: true,
    then: (schema) => schema.required('Third party address required'),
    otherwise: (schema) => schema.notRequired()
  }),
  thirdPartyInsurer: yup.string().when('thirdPartyInvolved', {
    is: true,
    then: (schema) => schema.required('Third party insurer required'),
    otherwise: (schema) => schema.notRequired()
  }),
  
  // Declaration
  agreeToDataPrivacy: yup.boolean().oneOf([true], 'You must agree to data privacy'),
  signature: yup.string().required('Signature required')
});

interface PlantMachineryItem {
  itemNumber: string;
  yearOfManufacture: number;
  make: string;
  registrationNumber?: string;
  dateOfPurchase: Date;
  costPrice: number;
  deductionForAge?: number;
  sumClaimed: number;
  claimType: 'presentValue' | 'repairs';
}

interface ContractorsData {
  // Policy Details
  policyNumber: string;
  periodOfCoverFrom: Date;
  periodOfCoverTo: Date;

  // Insured Details
  nameOfInsured: string;
  companyName?: string;
  title: string;
  dateOfBirth: Date;
  gender: string;
  address: string;
  phone: string;
  email: string;
  
  // Plant/Machinery Details
  plantMachineryItems: PlantMachineryItem[];
  
  // Loss/Damage Details
  dateOfLoss: Date;
  timeOfLoss: string;
  lastSeenIntact?: string;
  whereDidLossOccur: string;
  partsDamaged: string;
  whereCanBeInspected: string;
  fullAccountCircumstances: string;
  suspicionInformation?: string;
  
  // Theft/Third Party
  policeInformed: boolean;
  policeStation?: string;
  otherRecoveryActions?: string;
  isSoleOwner: boolean;
  ownershipDetails?: string;
  hasOtherInsurance: boolean;
  otherInsuranceDetails?: string;
  thirdPartyInvolved: boolean;
  thirdPartyName?: string;
  thirdPartyAddress?: string;
  thirdPartyInsurer?: string;
  
  // Declaration
  agreeToDataPrivacy: boolean;
  signature: string;
}

// Reusable form components
const FormField = ({ name, label, required = false, type = "text", maxLength, ...props }: any) => {
  const { register, formState: { errors }, clearErrors } = useFormContext();
  const error = get(errors, name);
  
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <Input
        id={name}
        type={type}
        maxLength={maxLength}
        {...register(name, {
          onChange: () => {
            if (error) {
              clearErrors(name);
            }
          }
        })}
        className={error ? 'border-destructive' : ''}
        {...props}
      />
      {error && (
        <p className="text-sm text-destructive">{error.message?.toString()}</p>
      )}
    </div>
  );
};

const FormTextarea = ({ name, label, required = false, maxLength = 2500, ...props }: any) => {
  const { register, watch, formState: { errors }, clearErrors } = useFormContext();
  const currentValue = watch(name) || '';
  const error = get(errors, name);
  
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <Textarea
        id={name}
        {...register(name, {
          onChange: () => {
            if (error) {
              clearErrors(name);
            }
          }
        })}
        className={error ? 'border-destructive' : ''}
        maxLength={maxLength}
        {...props}
      />
      <div className="flex justify-between">
        {error && (
          <p className="text-sm text-destructive">{error.message?.toString()}</p>
        )}
        <span className="text-sm text-muted-foreground ml-auto">
          {currentValue.length}/{maxLength}
        </span>
      </div>
    </div>
  );
};

const FormSelect = ({ name, label, required = false, placeholder, children, ...props }: any) => {
  const { setValue, watch, formState: { errors }, clearErrors } = useFormContext();
  const value = watch(name);
  const error = get(errors, name);
  
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <Select
        value={value}
        onValueChange={(newValue) => {
          setValue(name, newValue);
          if (error) {
            clearErrors(name);
          }
        }}
        {...props}
      >
        <SelectTrigger className={error ? 'border-destructive' : ''}>
          <SelectValue placeholder={placeholder || `Select ${label}`} />
        </SelectTrigger>
        <SelectContent>
          {children}
        </SelectContent>
      </Select>
      {error && (
        <p className="text-sm text-destructive">{error.message?.toString()}</p>
      )}
    </div>
  );
};

const FormDatePicker = ({ name, label, required = false }: any) => {
  const { setValue, watch, formState: { errors }, clearErrors } = useFormContext();
  const value = watch(name);
  const error = get(errors, name);
  
  return (
    <div className="space-y-2">
      <Label>
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <Input
        type="date"
        value={value ? (typeof value === 'string' ? value : value.toISOString().split('T')[0]) : ''}
        onChange={(e) => {
          const dateValue = e.target.value ? new Date(e.target.value) : undefined;
          setValue(name, dateValue);
          if (error) {
            clearErrors(name);
          }
        }}
        className={error ? 'border-destructive' : ''}
      />
      {error && (
        <p className="text-sm text-destructive">{error.message?.toString()}</p>
      )}
    </div>
  );
};

const FormRadioGroup = ({ name, label, required = false, options }: any) => {
  const { setValue, watch, formState: { errors }, clearErrors } = useFormContext();
  const value = watch(name);
  const error = get(errors, name);
  
  return (
    <div className="space-y-2">
      <Label>
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <RadioGroup
        value={value?.toString()}
        onValueChange={(newValue) => {
          setValue(name, newValue === 'true');
          if (error) {
            clearErrors(name);
          }
        }}
        className="flex space-x-6 mt-2"
      >
        {options.map((option: any) => (
          <div key={option.value} className="flex items-center space-x-2">
            <RadioGroupItem value={option.value} id={`${name}-${option.value}`} />
            <Label htmlFor={`${name}-${option.value}`}>{option.label}</Label>
          </div>
        ))}
      </RadioGroup>
      {error && (
        <p className="text-sm text-destructive mt-2">{error.message?.toString()}</p>
      )}
    </div>
  );
};

const defaultValues: Partial<ContractorsData> = {
  policyNumber: '',
  nameOfInsured: '',
  companyName: '',
  title: '',
  gender: '',
  address: '',
  phone: '',
  email: '',
  plantMachineryItems: [{
    itemNumber: '',
    yearOfManufacture: new Date().getFullYear(),
    make: '',
    registrationNumber: '',
    dateOfPurchase: new Date(),
    costPrice: 0,
    deductionForAge: 0,
    sumClaimed: 0,
    claimType: 'repairs'
  }],
  policeInformed: false,
  isSoleOwner: true,
  hasOtherInsurance: false,
  thirdPartyInvolved: false,
  agreeToDataPrivacy: false,
  signature: ''
};

const ContractorsPlantMachineryClaim: React.FC = () => {
  const { toast } = useToast();
  const [showSummary, setShowSummary] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPostAuthLoading, setShowPostAuthLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File>>({});
  const { 
    handleSubmitWithAuth, 
    showSuccess: authShowSuccess, 
    setShowSuccess: setAuthShowSuccess,
    isSubmitting: authSubmitting
  } = useAuthRequiredSubmit();

  // Check for pending submission when component mounts
  useEffect(() => {
    const checkPendingSubmission = () => {
      const hasPending = sessionStorage.getItem('pendingSubmission');
      if (hasPending) {
        setShowPostAuthLoading(true);
        setTimeout(() => setShowPostAuthLoading(false), 5000);
      }
    };
    checkPendingSubmission();
  }, []);

  // Hide post-auth loading when success modal shows
  useEffect(() => {
    if (authShowSuccess) {
      setShowPostAuthLoading(false);
    }
  }, [authShowSuccess]);

  const formMethods = useForm<any>({
    resolver: yupResolver(contractorsSchema),
    defaultValues,
    mode: 'onChange'
  });

  // Make toast available globally for MultiStepForm
  useEffect(() => {
    (window as any).toast = toast;
  }, [toast]);

  const { fields: plantFields, append: appendPlant, remove: removePlant } = useFieldArray({
    control: formMethods.control,
    name: 'plantMachineryItems'
  });

  const { saveDraft, clearDraft } = useFormDraft('contractors-claim', formMethods);
  const watchedValues = formMethods.watch();

  // Auto-save draft
  useEffect(() => {
    const subscription = formMethods.watch((data) => {
      saveDraft(data);
    });
    return () => subscription.unsubscribe();
  }, [formMethods, saveDraft]);

  // Main submit handler that checks authentication
  const handleSubmit = async (data: ContractorsData) => {
    // Prepare file upload data
    const fileUploadPromises: Array<Promise<[string, string]>> = [];
    
    for (const [key, file] of Object.entries(uploadedFiles)) {
      if (file) {
        fileUploadPromises.push(
          uploadFile(file, `contractors-claims/${Date.now()}-${file.name}`).then(url => [key, url])
        );
      }
    }

    const fileResults = await Promise.all(fileUploadPromises);
    const fileUrls = Object.fromEntries(fileResults);

    const finalData = {
      ...data,
      ...fileUrls,
      status: 'processing',
      formType: 'Contractors Plant & Machinery Claim'
    };

    await handleSubmitWithAuth(finalData, 'Contractors Plant & Machinery Claim');
    clearDraft();
    setShowSummary(false);
  };

  const onFinalSubmit = (data: ContractorsData) => {
    setShowSummary(true);
  };

  // Step field mappings for validation
  const stepFieldMappings = {
    0: ['policyNumber', 'periodOfCoverFrom', 'periodOfCoverTo'],
    1: ['nameOfInsured', 'companyName', 'title', 'dateOfBirth', 'gender', 'address', 'phone', 'email'],
    2: ['plantMachineryItems'],
    3: ['dateOfLoss', 'timeOfLoss', 'lastSeenIntact', 'whereDidLossOccur', 'partsDamaged', 'whereCanBeInspected', 'fullAccountCircumstances', 'suspicionInformation'],
    4: ['policeInformed', 'policeStation', 'otherRecoveryActions', 'isSoleOwner', 'ownershipDetails', 'hasOtherInsurance', 'otherInsuranceDetails', 'thirdPartyInvolved', 'thirdPartyName', 'thirdPartyAddress', 'thirdPartyInsurer'],
    5: ['agreeToDataPrivacy', 'signature']
  };

  const steps = [
    {
      id: 'policy',
      title: 'Policy Details',
      component: (
        <FormProvider {...formMethods}>
          <div className="space-y-4">
            <FormField name="policyNumber" label="Policy Number" required />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormDatePicker name="periodOfCoverFrom" label="Period of Cover From" required />
              <FormDatePicker name="periodOfCoverTo" label="Period of Cover To" required />
            </div>
          </div>
        </FormProvider>
      )
    },
    {
      id: 'insured',
      title: 'Insured Details',
      component: (
        <FormProvider {...formMethods}>
          <div className="space-y-4">
            <FormField name="nameOfInsured" label="Name of Insured" required />
            <FormField name="companyName" label="Company Name (If Applicable)" />
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormSelect name="title" label="Title" required placeholder="Select title">
                <SelectItem value="mr">Mr</SelectItem>
                <SelectItem value="mrs">Mrs</SelectItem>
                <SelectItem value="ms">Ms</SelectItem>
                <SelectItem value="dr">Dr</SelectItem>
                <SelectItem value="chief">Chief</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </FormSelect>

              <FormDatePicker name="dateOfBirth" label="Date of Birth" required />

              <FormSelect name="gender" label="Gender" required placeholder="Select gender">
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </FormSelect>
            </div>
            
            <FormTextarea name="address" label="Address" required />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>
                  Phone Number <span className="text-destructive ml-1">*</span>
                </Label>
                <PhoneInput
                  value={watchedValues.phone || ''}
                  onChange={(value) => formMethods.setValue('phone', value)}
                  error={formMethods.formState.errors.phone?.message?.toString()}
                />
              </div>
              <FormField name="email" label="Email" type="email" required />
            </div>
          </div>
        </FormProvider>
      )
    },
    {
      id: 'plant-machinery',
      title: 'Plant/Machinery Details',
      component: (
        <FormProvider {...formMethods}>
          <div className="space-y-6">
            {plantFields.map((field, index) => (
              <Card key={field.id} className="p-6 bg-gray-50/50">
                <div className="flex justify-between items-center mb-6">
                  <h4 className="text-lg font-semibold text-primary">Plant/Machinery Item {index + 1}</h4>
                  {plantFields.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removePlant(index)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Remove
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField name={`plantMachineryItems.${index}.itemNumber`} label="Item Number" required />
                  <FormField 
                    name={`plantMachineryItems.${index}.yearOfManufacture`} 
                    label="Year of Manufacture" 
                    type="number" 
                    required 
                  />
                  <FormField name={`plantMachineryItems.${index}.make`} label="Make" required />
                  <FormField name={`plantMachineryItems.${index}.registrationNumber`} label="Registration Number" />
                  <FormDatePicker name={`plantMachineryItems.${index}.dateOfPurchase`} label="Date of Purchase" required />
                  <FormField 
                    name={`plantMachineryItems.${index}.costPrice`} 
                    label="Cost Price" 
                    type="number" 
                    step="0.01" 
                    required 
                  />
                  <FormField 
                    name={`plantMachineryItems.${index}.deductionForAge`} 
                    label="Deduction for Age" 
                    type="number" 
                    step="0.01" 
                  />
                  <FormField 
                    name={`plantMachineryItems.${index}.sumClaimed`} 
                    label="Sum Claimed" 
                    type="number" 
                    step="0.01" 
                    required 
                  />
                  <FormSelect name={`plantMachineryItems.${index}.claimType`} label="Claim Type" required placeholder="Select claim type">
                    <SelectItem value="repairs">Repairs</SelectItem>
                    <SelectItem value="presentValue">Present Value</SelectItem>
                  </FormSelect>
                </div>
              </Card>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={() => appendPlant({
                itemNumber: '',
                yearOfManufacture: new Date().getFullYear(),
                make: '',
                registrationNumber: '',
                dateOfPurchase: new Date(),
                costPrice: 0,
                deductionForAge: 0,
                sumClaimed: 0,
                claimType: 'repairs'
              })}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Another Plant/Machinery Item
            </Button>
          </div>
        </FormProvider>
      )
    },
    {
      id: 'loss-details',
      title: 'Loss/Damage Details',
      component: (
        <FormProvider {...formMethods}>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormDatePicker name="dateOfLoss" label="Date of Loss" required />
              <FormField name="timeOfLoss" label="Time of Loss" type="time" required />
            </div>
            <FormTextarea name="lastSeenIntact" label="When was it last seen intact?" />
            <FormTextarea name="whereDidLossOccur" label="Where did the loss/damage occur?" required />
            <FormTextarea name="partsDamaged" label="Parts of Damage and Extent of Damage?" required />
            <FormTextarea name="whereCanBeInspected" label="Where can the plant/machinery be inspected?" required />
            <FormTextarea name="fullAccountCircumstances" label="Give a full account of the circumstances" required />
            <FormTextarea name="suspicionInformation" label="Any suspicion or other information" />
          </div>
        </FormProvider>
      )
    },
    {
      id: 'theft-third-party',
      title: 'Theft / Third Party',
      component: (
        <FormProvider {...formMethods}>
          <div className="space-y-6">
            <FormRadioGroup 
              name="policeInformed" 
              label="Have police been informed?" 
              required
              options={[
                { value: 'true', label: 'Yes' },
                { value: 'false', label: 'No' }
              ]}
            />
            
            {watchedValues.policeInformed && (
              <FormTextarea name="policeStation" label="If so, When and Which Police Staion" required />
            )}
            
            <FormTextarea name="otherRecoveryActions" label="Any other recovery actions taken ?" />
            
            <FormRadioGroup 
              name="isSoleOwner" 
              label="Are you the sole owner?" 
              required
              options={[
                { value: 'true', label: 'Yes' },
                { value: 'false', label: 'No' }
              ]}
            />
            
            {!watchedValues.isSoleOwner && (
              <FormTextarea name="ownershipDetails" label="Please provide full ownership details" required />
            )}
            
            <FormRadioGroup 
              name="hasOtherInsurance" 
              label="Do you have other insurance on this property?" 
              required
              options={[
                { value: 'true', label: 'Yes' },
                { value: 'false', label: 'No' }
              ]}
            />
            
            {watchedValues.hasOtherInsurance && (
              <FormTextarea name="otherInsuranceDetails" label="Please provide other insurance details covering property" required />
            )}
            
            <FormRadioGroup 
              name="thirdPartyInvolved" 
              label="Is a third party involved?" 
              required
              options={[
                { value: 'true', label: 'Yes' },
                { value: 'false', label: 'No' }
              ]}
            />
            
            {watchedValues.thirdPartyInvolved && (
              <div className="space-y-4 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-900">Third Party Details</h4>
                <FormField name="thirdPartyName" label="Third Party Name" required />
                <FormTextarea name="thirdPartyAddress" label="Third Party Address" required />
                <FormField name="thirdPartyInsurer" label="Third Party Insurer" required />
              </div>
            )}
          </div>
        </FormProvider>
      )
    },
    // {
    //   id: 'files',
    //   title: 'Supporting Documents',
    //   component: (
    //     <FormProvider {...formMethods}>
    //       <div className="space-y-6">
    //         <div className="text-center">
    //           <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
    //           <h3 className="text-lg font-semibold mb-2">Upload Supporting Documents</h3>
    //           <p className="text-muted-foreground mb-6">
    //             Please upload any relevant documents to support your claim (photos, receipts, reports, etc.)
    //           </p>
    //         </div>

    //         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    //           <div>
    //             <Label>Photos of Damaged Items</Label>
    //             <FileUpload
    //               accept="image/*"
    //               multiple
    //               onFilesChange={(files) => {
    //                 if (files.length > 0) {
    //                   setUploadedFiles(prev => ({ ...prev, damagePhotos: files[0] }));
    //                 }
    //               }}
    //               maxSize={10}
    //               className="mt-2"
    //             />
    //           </div>

    //           <div>
    //             <Label>Purchase Receipts/Invoices</Label>
    //             <FileUpload
    //               accept=".pdf,.jpg,.jpeg,.png"
    //               multiple
    //               onFilesChange={(files) => {
    //                 if (files.length > 0) {
    //                   setUploadedFiles(prev => ({ ...prev, purchaseReceipts: files[0] }));
    //                 }
    //               }}
    //               maxSize={10}
    //               className="mt-2"
    //             />
    //           </div>

    //           <div>
    //             <Label>Police Report (if applicable)</Label>
    //             <FileUpload
    //               accept=".pdf,.jpg,.jpeg,.png"
    //               onFilesChange={(files) => {
    //                 if (files.length > 0) {
    //                   setUploadedFiles(prev => ({ ...prev, policeReport: files[0] }));
    //                 }
    //               }}
    //               maxSize={10}
    //               className="mt-2"
    //             />
    //           </div>

    //           <div>
    //             <Label>Other Supporting Documents</Label>
    //             <FileUpload
    //               accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
    //               multiple
    //               onFilesChange={(files) => {
    //                 if (files.length > 0) {
    //                   setUploadedFiles(prev => ({ ...prev, otherDocuments: files[0] }));
    //                 }
    //               }}
    //               maxSize={10}
    //               className="mt-2"
    //             />
    //           </div>
    //         </div>

    //         <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
    //           <div className="flex items-start space-x-3">
    //             <Info className="w-5 h-5 text-yellow-600 mt-0.5" />
    //             <div>
    //               <h4 className="font-semibold text-yellow-800">Document Guidelines</h4>
    //               <ul className="text-sm text-yellow-700 mt-1 list-disc list-inside space-y-1">
    //                 <li>Maximum file size: 10MB per file</li>
    //                 <li>Accepted formats: PDF, JPG, JPEG, PNG, DOC, DOCX</li>
    //                 <li>Clear, legible photos/scans work best</li>
    //                 <li>Multiple files can be uploaded for each category</li>
    //               </ul>
    //             </div>
    //           </div>
    //         </div>
    //       </div>
    //     </FormProvider>
    //   )
    // },
    {
      id: 'declaration',
      title: 'Declaration',
      component: (
        <FormProvider {...formMethods}>
          <div className="space-y-6">
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">Data Privacy</h3>
              <div className="text-sm text-gray-700 space-y-3">
                <p>i. Your data will solemnly be used for the purposes of this business contract and also to enable us reach you with the updates about our products and services.</p>
                <p>ii. Please note that your personal data will be treated with utmost respect and is well secured as required by Nigeria Data Protection Regulations 2019.</p>
                <p>iii. Your personal data shall not be shared with or sold to any third-party without your consent unless we are compelled by law or regulator.</p>
              </div>
            </div>
            
            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">Declaration</h3>
              <div className="text-sm text-grey-800 space-y-3">
                <p>1. I/We declare to the best of my/our knowledge and belief that the information given on this form is true in every respect and agree that if I/we have made any false or fraudulent statement, be it suppression or concealment, the policy shall be cancelled and the claim shall be forfeited.</p>
                <p>2. I/We agree to provide additional information to NEM Insurance, if required.</p>
                <p>3. I/We agree to submit all required and requested for documents and NEM Insurance shall not be held responsible for any delay in settlement of claim due to non-fulfillment of requirements.</p>
              </div>
            </div>
            
            <div className="space-y-4">
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
                  I agree to the data privacy policy and declaration above <span className="text-destructive ml-1">*</span>
                </Label>
              </div>
              {formMethods.formState.errors.agreeToDataPrivacy && (
                <p className="text-sm text-destructive">
                  {formMethods.formState.errors.agreeToDataPrivacy.message?.toString()}
                </p>
              )}
              
              <FormField name="signature" label="Digital Signature" required placeholder="Type your full name as signature" />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
{/*                 <div>
                  <Label>Place</Label>
                  <Input value="Nigeria" disabled className="bg-gray-50" />
                </div> */}
                <div>
                  <Label>Date</Label>
                  <Input value={new Date().toISOString().split('T')[0]} disabled className="bg-gray-50" />
                </div>
              </div>
            </div>
          </div>
        </FormProvider>
      )
    }
  ];

  return (
    <FormProvider {...formMethods}>
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        {/* Loading overlay */}
        {showPostAuthLoading && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 flex flex-col items-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-lg font-semibold">Completing your submission...</p>
              <p className="text-sm text-muted-foreground text-center">
                Please do not close this window while we process your claim
              </p>
            </div>
          </div>
        )}

        <div className="container mx-auto py-8 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
                <Settings className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight mb-2">Contractors Plant & Machinery Claim</h1>
              <p className="text-muted-foreground">
                Submit your claim for contractors plant and machinery insurance
              </p>
            </div>

            <Card className="shadow-xl border-0 bg-white/50 backdrop-blur-sm">

              <CardContent>
                <MultiStepForm
                  steps={steps}
                  onSubmit={onFinalSubmit}
                  formMethods={formMethods}
                  submitButtonText="Submit Contractors Claim"
                  stepFieldMappings={stepFieldMappings}
                />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Summary Dialog */}
        <Dialog open={showSummary} onOpenChange={setShowSummary}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Confirm Your Contractors Claim Submission</DialogTitle>
              <h3 className="font-semibold text-yellow-800">Important Notice</h3>
              <p className="text-sm text-yellow-700 mt-1">
                Please review all information carefully before submitting. Once submitted, you cannot modify your claim details. Uploaded documents will be processed with your claim.
              </p>
            </DialogHeader>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowSummary(false)}>
                Review Again
              </Button>
              <Button 
                onClick={() => handleSubmit(watchedValues)}
                disabled={authSubmitting}
                className="min-w-[120px]"
              >
                {authSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Claim'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Success Modal */}
        <SuccessModal
          isOpen={authShowSuccess}
          onClose={() => setAuthShowSuccess()}
          title="Contractors Claim Submitted Successfully!"
          message="Your contractors plant & machinery claim has been received and is being processed. You will receive updates via email and SMS."
          formType="Contractors Plant & Machinery Claim"
        />
      </div>
    </FormProvider>
  );
};

export default ContractorsPlantMachineryClaim;
