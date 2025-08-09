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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Calendar, CalendarIcon, Upload, Edit2, DollarSign, FileText, CheckCircle2, Loader2, Plus, Trash2, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import MultiStepForm from '@/components/common/MultiStepForm';
import { useFormDraft } from '@/hooks/useFormDraft';
import FileUpload from '@/components/common/FileUpload';
import { uploadFile } from '@/services/fileService';
import { useAuthRequiredSubmit } from '@/hooks/useAuthRequiredSubmit';
import SuccessModal from '@/components/common/SuccessModal';

// Money Insurance Claim Schema
const moneyInsuranceSchema = yup.object().shape({
  // Policy Details
  policyNumber: yup.string().required('Policy number is required'),
  periodOfCoverFrom: yup.date().required('Period start date is required'),
  periodOfCoverTo: yup.date().required('Period end date is required'),

  // Insured Details
  companyName: yup.string().required('Company name is required'),
  address: yup.string().required('Address is required'),
  phone: yup.string().required('Phone is required'),
  email: yup.string().email('Invalid email').required('Email is required'),

  // Loss Details
  lossDate: yup.date().required('Loss date is required'),
  lossTime: yup.string().required('Loss time is required'),
  lossLocation: yup.string().required('Loss location is required'),
  moneyLocation: yup.string().oneOf(['transit', 'safe']).required('Money location is required'),

  // Discoverer Details
  discovererName: yup.string().required('Discoverer name is required'),
  discovererPosition: yup.string().when('moneyLocation', {
    is: 'transit',
    then: (schema) => schema.notRequired(),
    otherwise: (schema) => schema.notRequired()
  }),
  discovererSalary: yup.number().min(0, 'Salary must be positive').when('moneyLocation', {
    is: 'transit',
    then: (schema) => schema.notRequired(),
    otherwise: (schema) => schema.notRequired()
  }),

  // Transit Details (only required when moneyLocation is 'transit')
  policeEscort: yup.string().oneOf(['yes', 'no']).when('moneyLocation', {
    is: 'transit',
    then: (schema) => schema.required('Police escort information is required'),
    otherwise: (schema) => schema.notRequired()
  }),
  amountAtStart: yup.number().min(0, 'Amount must be positive').when('moneyLocation', {
    is: 'transit',
    then: (schema) => schema.required('Amount at journey start is required'),
    otherwise: (schema) => schema.notRequired()
  }),
  disbursements: yup.number().min(0, 'Disbursements must be positive').when('moneyLocation', {
    is: 'transit',
    then: (schema) => schema.required('Disbursements information is required'),
    otherwise: (schema) => schema.notRequired()
  }),
  doubtIntegrity: yup.string().oneOf(['yes', 'no']).when('moneyLocation', {
    is: 'transit',
    then: (schema) => schema.required('Integrity information is required'),
    otherwise: (schema) => schema.notRequired()
  }),
  integrityExplanation: yup.string().when(['doubtIntegrity', 'moneyLocation'], {
    is: (doubtIntegrity: string, moneyLocation: string) => doubtIntegrity === 'yes' && moneyLocation === 'transit',
    then: (schema) => schema.required('Explanation required'),
    otherwise: (schema) => schema.notRequired()
  }),

  // Safe Details (only required when moneyLocation is 'safe')
  safeType: yup.string().when('moneyLocation', {
    is: 'safe',
    then: (schema) => schema.required('Safe type is required'),
    otherwise: (schema) => schema.notRequired()
  }),
  keyholders: yup.array().when('moneyLocation', {
    is: 'safe',
    then: (schema) => schema.of(
      yup.object().shape({
        name: yup.string().required('Keyholder name is required'),
        position: yup.string().required('Position is required'),
        salary: yup.number().min(0, 'Salary must be positive').required('Salary is required')
      })
    ).min(1, 'At least one keyholder is required'),
    otherwise: (schema) => schema.notRequired()
  }),

  // General Details
  howItHappened: yup.string().required('How it happened is required'),
  policeNotified: yup.string().oneOf(['yes', 'no']).required('Police notification status is required'),
  policeStation: yup.string().when('policeNotified', {
    is: 'yes',
    then: (schema) => schema.required('Police station details required'),
    otherwise: (schema) => schema.notRequired()
  }),
  previousLoss: yup.string().oneOf(['yes', 'no']).required('Previous loss status is required'),
  previousLossDetails: yup.string().when('previousLoss', {
    is: 'yes',
    then: (schema) => schema.required('Previous loss details required'),
    otherwise: (schema) => schema.notRequired()
  }),
  lossAmount: yup.number().min(0, 'Loss amount must be positive').required('Loss amount is required'),
  lossDescription: yup.string().required('Loss description is required'),

  // Declaration
  agreeToDataPrivacy: yup.boolean().oneOf([true], 'You must agree to data privacy'),
  declarationTrue: yup.boolean().oneOf([true], 'You must confirm the declaration is true'),
  signature: yup.string().required('Signature is required'),
});

interface Keyholder {
  name: string;
  position: string;
  salary: number;
}

interface MoneyInsuranceData {
  // Policy Details
  policyNumber: string;
  periodOfCoverFrom: Date;
  periodOfCoverTo: Date;

  // Insured Details
  companyName: string;
  address: string;
  phone: string;
  email: string;

  // Loss Details
  lossDate: Date;
  lossTime: string;
  lossLocation: string;
  moneyLocation: string;

  // Discoverer Details
  discovererName: string;
  discovererPosition?: string;
  discovererSalary?: number;

  // Transit Details
  policeEscort?: string;
  amountAtStart?: number;
  disbursements?: number;
  doubtIntegrity?: string;
  integrityExplanation?: string;

  // Safe Details
  safeType?: string;
  keyholders: Keyholder[];

  // General Details
  howItHappened: string;
  policeNotified: string;
  policeStation?: string;
  previousLoss: string;
  previousLossDetails?: string;
  lossAmount: number;
  lossDescription: string;

  // Declaration
  agreeToDataPrivacy: boolean;
  declarationTrue: boolean;
  signature: string;
}

// Form field components with validation (same as Motor Claim)
const FormField = ({ name, label, required = false, type = "text", maxLength, ...props }: any) => {
  const { register, formState: { errors }, clearErrors } = useFormContext();
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
        {required && <span className="required-asterisk">*</span>}
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
        {required && <span className="required-asterisk">*</span>}
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

const defaultValues: Partial<MoneyInsuranceData> = {
  policyNumber: '',
  companyName: '',
  address: '',
  phone: '',
  email: '',
  lossTime: '',
  lossLocation: '',
  moneyLocation: 'safe', // Default to 'safe'
  discovererName: '',
  discovererPosition: '',
  discovererSalary: 0,
  policeEscort: '',
  amountAtStart: 0,
  disbursements: 0,
  doubtIntegrity: '',
  integrityExplanation: '',
  safeType: '',
  keyholders: [],
  howItHappened: '',
  policeNotified: '',
  policeStation: '',
  previousLoss: '',
  previousLossDetails: '',
  lossAmount: 0,
  lossDescription: '',
  agreeToDataPrivacy: false,
  declarationTrue: false,
  signature: ''
};

const MoneyInsuranceClaim: React.FC = () => {
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
        // Hide loading after 5 seconds max (in case something goes wrong)
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
    resolver: yupResolver(moneyInsuranceSchema),
    defaultValues,
    mode: 'onChange'
  });

  const { fields: keyholderFields, append: addKeyholder, remove: removeKeyholder } = useFieldArray({
    control: formMethods.control,
    name: 'keyholders'
  });

  const { saveDraft, clearDraft } = useFormDraft('moneyInsuranceClaim', formMethods);
  const watchedValues = formMethods.watch();

  // Initialize with one keyholder when form loads (since default is 'safe')
  useEffect(() => {
    if (keyholderFields.length === 0 && watchedValues.moneyLocation === 'safe') {
      addKeyholder({
        name: '',
        position: '',
        salary: 0
      });
    }
  }, [keyholderFields.length, watchedValues.moneyLocation, addKeyholder]);

  // Auto-save draft
  useEffect(() => {
    const subscription = formMethods.watch((data) => {
      saveDraft(data);
    });
    return () => subscription.unsubscribe();
  }, [formMethods, saveDraft]);

  // Main submit handler that checks authentication
  const handleSubmit = async (data: MoneyInsuranceData) => {
    // Prepare file upload data
    const fileUploadPromises: Array<Promise<[string, string]>> = [];
    
    for (const [key, file] of Object.entries(uploadedFiles)) {
      if (file) {
        fileUploadPromises.push(
          uploadFile(file, `money-insurance-claims/${Date.now()}-${file.name}`).then(url => [key, url])
        );
      }
    }

    const fileResults = await Promise.all(fileUploadPromises);
    const fileUrls = Object.fromEntries(fileResults);

    const finalData = {
      ...data,
      ...fileUrls,
      status: 'processing',
      formType: 'Money Insurance Claim'
    };

    await handleSubmitWithAuth(finalData, 'Money Insurance Claim');
    clearDraft();
    setShowSummary(false);
  };

  const onFinalSubmit = (data: MoneyInsuranceData) => {
    setShowSummary(true);
  };

  // Custom validation for merged loss details step
  const validateStep = async (stepId: string): Promise<boolean> => {
    if (stepId === 'loss') {
      const moneyLocation = watchedValues.moneyLocation;
      const errors: string[] = [];

      // Always required fields
      if (!watchedValues.lossDate) errors.push('Loss date is required');
      if (!watchedValues.lossTime) errors.push('Loss time is required');
      if (!watchedValues.lossLocation) errors.push('Loss location is required');
      if (!watchedValues.moneyLocation) errors.push('Money location is required');
      if (!watchedValues.discovererName) errors.push('Discoverer name is required');

      if (moneyLocation === 'transit') {
        // Transit specific validations
        if (!watchedValues.policeEscort) errors.push('Police escort information is required');
        if (watchedValues.amountAtStart === undefined || watchedValues.amountAtStart === null) errors.push('Amount at journey start is required');
        if (watchedValues.disbursements === undefined || watchedValues.disbursements === null) errors.push('Disbursements information is required');
        if (!watchedValues.doubtIntegrity) errors.push('Employee integrity information is required');
        if (watchedValues.doubtIntegrity === 'yes' && !watchedValues.integrityExplanation) errors.push('Integrity explanation is required');
      } else if (moneyLocation === 'safe') {
        // Safe specific validations
        if (!watchedValues.safeType) errors.push('Safe type is required');
        if (!watchedValues.keyholders || watchedValues.keyholders.length === 0) {
          errors.push('At least one keyholder is required');
        } else {
          // Validate each keyholder
          watchedValues.keyholders.forEach((keyholder: any, index: number) => {
            if (!keyholder.name) errors.push(`Keyholder ${index + 1} name is required`);
            if (!keyholder.position) errors.push(`Keyholder ${index + 1} position is required`);
            if (keyholder.salary === undefined || keyholder.salary === null) errors.push(`Keyholder ${index + 1} salary is required`);
          });
        }
      }

      if (errors.length > 0) {
        toast({
          title: "Required Fields Missing",
          description: errors.join(', '),
          variant: "destructive",
        });
        return false;
      }
    }
    return true;
  };

  // Step field mappings for validation
  const stepFieldMappings = {
    0: ['policyNumber', 'periodOfCoverFrom', 'periodOfCoverTo'],
    1: ['companyName', 'address', 'phone', 'email'],
    2: [], // Custom validation for merged section
    3: ['howItHappened', 'policeNotified', 'policeStation', 'previousLoss', 'previousLossDetails', 'lossAmount', 'lossDescription'],
    4: ['agreeToDataPrivacy', 'declarationTrue', 'signature']
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
            <FormField name="companyName" label="Company Name" required />
            <FormTextarea name="address" label="Address" required />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField name="phone" label="Phone Number" required />
              <FormField name="email" label="Email" type="email" required />
            </div>
          </div>
        </FormProvider>
      )
    },
    {
      id: 'loss',
      title: 'Details of Loss',
      component: (
        <FormProvider {...formMethods}>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormDatePicker name="lossDate" label="When did it happen?" required />
              <FormField name="lossTime" label="Time" type="time" required />
            </div>
            
            <FormTextarea name="lossLocation" label="Where did it happen?" required />
            
            <FormSelect name="moneyLocation" label="Was the money in transit or locked in a safe?" required placeholder="Select location">
              <SelectItem value="transit">In Transit</SelectItem>
              <SelectItem value="safe">Locked in Safe</SelectItem>
            </FormSelect>

            {/* Conditional rendering based on money location */}
            {watchedValues.moneyLocation === 'transit' && (
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium text-grey-900 mb-3">Transit Loss Details</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField name="discovererName" label="Name of person who discovered loss" required />
                    <FormField name="discovererPosition" label="Position" />
                    <FormField name="discovererSalary" label="Salary (₦)" type="number" step="0.01" />
                  </div>
                  
                  <FormSelect name="policeEscort" label="Was there a police escort?" required placeholder="Select yes or no">
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                  </FormSelect>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField name="amountAtStart" label="Amount at journey start (₦)" type="number" step="0.01" required />
                    <FormField name="disbursements" label="Disbursements during journey (₦)" type="number" step="0.01" required />
                  </div>
                  
                  <FormSelect name="doubtIntegrity" label="Any reason to doubt integrity of employee?" required placeholder="Select yes or no">
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                  </FormSelect>
                  
                  {watchedValues.doubtIntegrity === 'yes' && (
                    <FormTextarea name="integrityExplanation" label="Explanation" required />
                  )}
                </div>
              </div>
            )}

            {watchedValues.moneyLocation === 'safe' && (
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium text-grey-900 mb-3">Safe Loss Details</h3>
                  
                  <FormSelect name="safeType" label="Was the safe bricked into wall or standing free?" required placeholder="Select option">
                    <SelectItem value="bricked">Bricked into wall</SelectItem>
                    <SelectItem value="standing">Standing free</SelectItem>
                  </FormSelect>
                  
                  <div className="space-y-4">
                    <Label>Names, positions, salaries of employees in charge of keys *</Label>
                    
                    {keyholderFields.map((keyholder, index) => (
                      <Card key={keyholder.id} className="p-4">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-lg font-medium">Keyholder {index + 1}</h3>
                          {keyholderFields.length > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeKeyholder(index)}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Remove
                            </Button>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <FormField name={`keyholders.${index}.name`} label="Name" required />
                          <FormField name={`keyholders.${index}.position`} label="Position" required />
                          <FormField name={`keyholders.${index}.salary`} label="Salary (₦)" type="number" step="0.01" required />
                        </div>
                      </Card>
                    ))}
                    
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => addKeyholder({
                        name: '',
                        position: '',
                        salary: 0
                      })}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Keyholder
                    </Button>

                    {keyholderFields.length === 0 && (
                      <p className="text-sm text-destructive">At least one keyholder is required</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </FormProvider>
      )
    },
    {
      id: 'general',
      title: 'Additional Information',
      component: (
        <FormProvider {...formMethods}>
          <div className="space-y-4">
            <FormTextarea name="howItHappened" label="How did it happen?" required />
            
            <FormSelect name="policeNotified" label="Have police been notified?" required placeholder="Select yes or no">
              <SelectItem value="yes">Yes</SelectItem>
              <SelectItem value="no">No</SelectItem>
            </FormSelect>
            
            {watchedValues.policeNotified === 'yes' && (
              <FormField name="policeStation" label="Police Station" required />
            )}
            
            <FormSelect name="previousLoss" label="Previous loss under the policy?" required placeholder="Select yes or no">
              <SelectItem value="yes">Yes</SelectItem>
              <SelectItem value="no">No</SelectItem>
            </FormSelect>
            
            {watchedValues.previousLoss === 'yes' && (
              <FormTextarea name="previousLossDetails" label="Details of previous loss" required />
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField name="lossAmount" label="What is the amount of loss? (₦)" type="number" step="0.01" required />
              <FormTextarea name="lossDescription" label="What did it consist of?" required />
            </div>
          </div>
        </FormProvider>
      )
    },
    {
      id: 'declaration',
      title: 'Declaration & Signature',
      component: (
        <FormProvider {...formMethods}>
          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Data Privacy</h3>
              <div className="text-sm space-y-2">
                <p>i. Your data will solemnly be used for the purposes of this business contract and also to enable us reach you with the updates about our products and services.</p>
                <p>ii. Please note that your personal data will be treated with utmost respect and is well secured as required by Nigeria Data Protection Regulations 2019.</p>
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
                I declare that the above statements are true <span className="required-asterisk">*</span>
              </Label>
            </div>
            {formMethods.formState.errors.declarationTrue && (
              <p className="text-sm text-destructive">
                {formMethods.formState.errors.declarationTrue.message?.toString()}
              </p>
            )}
            
            <FormField name="signature" label="Digital Signature" required placeholder="Type your full name as signature" />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Date</Label>
                <Input value={new Date().toISOString().split('T')[0]} disabled />
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
                <DollarSign className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight mb-2">Money Insurance Claim Form</h1>
              <p className="text-muted-foreground">
                Please provide accurate information about your money insurance claim
              </p>
            </div>

            <Card className="shadow-xl border-0 bg-white/50 backdrop-blur-sm">

              <CardContent>
                <MultiStepForm
                  steps={steps}
                  onSubmit={onFinalSubmit}
                  formMethods={formMethods}
                  submitButtonText="Submit Money Insurance Claim"
                  stepFieldMappings={stepFieldMappings}
                  validateStep={validateStep}
                />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Summary Dialog */}
        <Dialog open={showSummary} onOpenChange={setShowSummary}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Confirm Your Submission</DialogTitle>
              <h3 className="font-semibold text-yellow-800">Important Notice</h3>
                <p className="text-sm text-yellow-700 mt-1">
                  Please review all information carefully before submitting. Once submitted, you cannot modify your details.
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
          title="Money Insurance Claim Submitted Successfully!"
          message="Your money insurance claim has been received and is being processed. You will receive updates via email and SMS."
          formType="Money Insurance Claim"
        />
      </div>
    </FormProvider>
  );
};

export default MoneyInsuranceClaim;
