import React, { useState, useEffect } from 'react'; import { useForm, useFieldArray, FormProvider, useFormContext } from 'react-hook-form'; import { yupResolver } from '@hookform/resolvers/yup'; import * as yup from 'yup'; import { get } from 'lodash'; import { useToast } from '@/hooks/use-toas

pasted


import React, { useState, useEffect } from 'react'; import { useForm, useFieldArray } from 'react-hook-form'; import { yupResolver } from '@hookform/resolvers/yup'; import * as yup from 'yup'; import { useToast } from '@/hooks/use-toast'; import { Card, CardContent, CardDescription, CardHeade

pasted

ook at this component :see how the validation and all that is? want you to use the same validation logic and styling without making a mistake. and then rewrite this one for me fully, or i guess if theres any part you feel i dont need , then you can remove hose parts and just add comments ther so i'll lmnow what toa dd onmy own, the thing is want a full rewrite but i dont wat you to run out of space, you get? , so heres what youre rewriting, dont forget , all i need you to do for the burglary claim form is to make sure that it is validated in the same way as motor. not change field names or labels or titles, just make sure that all fields are filled before going to the next section or step, please this is the burglary form that you are  doing te validation and stuff for, all yiur handlig is the validation in the same way the motor claim is being habdled, you. this is the form:

Edit
Looking at the Motor Claim form's validation structure, I can see it uses FormProvider context, custom form field components with validation, and proper error handling. I'll rewrite the Burglary Claim form to use the same validation approach while keeping all the original field names and labels intact.


Validated Burglary Claim Form
Code 



Continue

Edit

Validated Burglary Claim Form
Code ∙ Version 2 
I've rewritten the Burglary Claim form to use the exact same validation structure as the Motor Claim form. Here are the key changes I made:

✅ Applied Same Validation Pattern:
Added Yup Schema Validation - Complete schema with conditional validations
Used FormProvider Context - Wrapped all components with FormProvider
Created Validated Form Components - FormField, FormTextarea, FormSelect, FormDatePicker with error handling
Added Step Field Mappings - For proper step-by-step validation
Used Same Error Display - Red borders and error messages
🔧 Key Features Added:
✅ Real-time validation with error clearing
✅ Required field asterisks
✅ Character count for textareas
✅ Proper date picker validation
✅ Boolean field validation for checkboxes
✅ Conditional field validation (when/then/otherwise)
✅ Array validation for property items
📝 Note on Missing Sections:
I added a comment at the bottom showing you exactly how to add the remaining boolean sections (soleOwner, otherInsurance, previousLoss) in the "Details of Loss" step. They follow the exact same pattern as the ones I completed.

🎯 What's Different from Original:
Now uses proper form validation
Fields are properly required and validated
Users can't proceed to next step without filling required fields
Error messages show for invalid/missing data
Same styling and UX as Motor Claim form
The form now has the same robust validation as your Motor Claim form while keeping all the original field names, labels, and structure intact!





You are out of free messages until 9:00 PM


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
import { Calendar as ReactCalendar } from '@/components/ui/calendar';
import { CalendarIcon, Plus, Trash2, Upload, Edit2, AlertTriangle, FileText, CheckCircle2, Loader2, Info } from 'lucide-react';
import { format } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import MultiStepForm from '@/components/common/MultiStepForm';
import { useFormDraft } from '@/hooks/useFormDraft';
import FileUpload from '@/components/common/FileUpload';
import { uploadFile } from '@/services/fileService';
import { useAuthRequiredSubmit } from '@/hooks/useAuthRequiredSubmit';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import SuccessModal from '@/components/common/SuccessModal';

// Burglary Claim Schema - Same validation structure as Motor Claim
const burglaryClaimSchema = yup.object().shape({
  // Policy Details
  policyNumber: yup.string().required("Policy number is required"),
  periodOfCoverFrom: yup.date().required("Period of cover from is required"),
  periodOfCoverTo: yup.date().required("Period of cover to is required"),

  // Insured Details
  nameOfInsured: yup.string().required("Name of insured is required"),
  companyName: yup.string(),
  title: yup.string().required("Title is required"),
  dateOfBirth: yup.date().required("Date of birth is required"),
  gender: yup.string().required("Gender is required"),
  address: yup.string().required("Address is required"),
  phone: yup.string().required("Phone number is required"),
  email: yup.string().email("Valid email is required").required("Email is required"),

  // Details of Loss
  premisesAddress: yup.string().required("Premises address is required"),
  premisesTelephone: yup.string().required("Premises telephone is required"),
  dateOfTheft: yup.date().required("Date of theft is required"),
  timeOfTheft: yup.string().required("Time of theft is required"),
  howEntryEffected: yup.string().required("How entry was effected is required"),
  roomsEntered: yup.string().required("Rooms entered is required"),
  premisesOccupied: yup.boolean().required("Please specify if premises occupied"),
  lastOccupiedDate: yup.string().when('premisesOccupied', {
    is: false,
    then: (schema) => schema.required("Last occupied date required"),
    otherwise: (schema) => schema.notRequired()
  }),
  suspicions: yup.boolean().required("Please specify if you have suspicions"),
  suspicionName: yup.string().when('suspicions', {
    is: true,
    then: (schema) => schema.required("Name required"),
    otherwise: (schema) => schema.notRequired()
  }),
  policeInformed: yup.boolean().required("Please specify if police informed"),
  policeDate: yup.date().when('policeInformed', {
    is: true,
    then: (schema) => schema.required("Police date required"),
    otherwise: (schema) => schema.notRequired()
  }),
  policeStation: yup.string().when('policeInformed', {
    is: true,
    then: (schema) => schema.required("Police station required"),
    otherwise: (schema) => schema.notRequired()
  }),
  soleOwner: yup.boolean().required("Please specify if sole owner"),
  ownerDetails: yup.string().when('soleOwner', {
    is: false,
    then: (schema) => schema.required("Owner details required"),
    otherwise: (schema) => schema.notRequired()
  }),
  otherInsurance: yup.boolean().required("Please specify if other insurance exists"),
  otherInsurerDetails: yup.string().when('otherInsurance', {
    is: true,
    then: (schema) => schema.required("Other insurer details required"),
    otherwise: (schema) => schema.notRequired()
  }),
  totalContentsValue: yup.number().required("Total contents value is required"),
  sumInsuredFirePolicy: yup.number().required("Sum insured under fire policy is required"),
  fireInsurerName: yup.string().required("Fire insurer name is required"),
  fireInsurerAddress: yup.string().required("Fire insurer address is required"),
  previousLoss: yup.boolean().required("Please specify if previous loss occurred"),
  previousLossDetails: yup.string().when('previousLoss', {
    is: true,
    then: (schema) => schema.required("Previous loss details required"),
    otherwise: (schema) => schema.notRequired()
  }),

  // Property Items
  propertyItems: yup.array().of(
    yup.object().shape({
      description: yup.string().required("Description is required"),
      costPrice: yup.number().required("Cost price is required"),
      dateOfPurchase: yup.date().required("Date of purchase is required"),
      estimatedValue: yup.number().required("Estimated value is required"),
      netAmountClaimed: yup.number().required("Net amount claimed is required")
    })
  ),

  // Declaration
  agreeToDataPrivacy: yup.boolean().oneOf([true], "You must agree to data privacy"),
  declarationTrue: yup.boolean().oneOf([true], "You must agree that statements are true"),
  signature: yup.string().required("Signature is required")
});

// Same validation field components as Motor Claim
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

const FormSelect = ({ name, label, required = false, placeholder, children, ...props }: any) => {
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

// Validated Checkbox Component
const FormCheckbox = ({ name, label, required = false, ...props }: any) => {
  const { setValue, watch, formState: { errors }, clearErrors } = useFormContext();
  const value = watch(name);
  const error = get(errors, name);
  
  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-2">
        <Checkbox
          id={name}
          checked={value || false}
          onCheckedChange={(checked) => {
            setValue(name, !!checked);
            if (error) {
              clearErrors(name);
            }
          }}
          className={error ? 'border-destructive' : ''}
          {...props}
        />
        <Label htmlFor={name}>
          {label}
          {required && <span className="required-asterisk">*</span>}
        </Label>
      </div>
      {error && (
        <p className="text-sm text-destructive">{error.message?.toString()}</p>
      )}
    </div>
  );
};

// Interface definitions remain the same
interface BurglaryPropertyItem {
  description: string;
  costPrice: number;
  dateOfPurchase: Date;
  estimatedValue: number;
  netAmountClaimed: number;
}

interface BurglaryClaimData {
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

  // Details of Loss
  premisesAddress: string;
  premisesTelephone: string;
  dateOfTheft: Date;
  timeOfTheft: string;
  howEntryEffected: string;
  roomsEntered: string;
  premisesOccupied: boolean;
  lastOccupiedDate?: string;
  suspicions: boolean;
  suspicionName?: string;
  policeInformed: boolean;
  policeDate?: Date;
  policeStation?: string;
  soleOwner: boolean;
  ownerDetails?: string;
  otherInsurance: boolean;
  otherInsurerDetails?: string;
  totalContentsValue: number;
  sumInsuredFirePolicy: number;
  fireInsurerName: string;
  fireInsurerAddress: string;
  previousLoss: boolean;
  previousLossDetails?: string;

  // Property Items
  propertyItems: BurglaryPropertyItem[];

  // Declaration
  agreeToDataPrivacy: boolean;
  declarationTrue: boolean;
  signature: string;
}

const defaultValues: Partial<BurglaryClaimData> = {
  policyNumber: '',
  nameOfInsured: '',
  companyName: '',
  title: '',
  address: '',
  phone: '',
  email: '',
  gender: '',
  premisesAddress: '',
  premisesTelephone: '',
  timeOfTheft: '',
  howEntryEffected: '',
  roomsEntered: '',
  premisesOccupied: false,
  suspicions: false,
  policeInformed: false,
  soleOwner: false,
  otherInsurance: false,
  totalContentsValue: 0,
  sumInsuredFirePolicy: 0,
  fireInsurerName: '',
  fireInsurerAddress: '',
  previousLoss: false,
  propertyItems: [],
  agreeToDataPrivacy: false,
  declarationTrue: false,
  signature: ''
};

const BurglaryClaimForm: React.FC = () => {
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

  const formMethods = useForm<any>({
    resolver: yupResolver(burglaryClaimSchema),
    defaultValues,
    mode: 'onChange'
  });

  // Make toast available globally for MultiStepForm
  useEffect(() => {
    (window as any).toast = toast;
  }, [toast]);

  const { fields: propertyFields, append: addProperty, remove: removeProperty } = useFieldArray({
    control: formMethods.control,
    name: 'propertyItems'
  });

  const { saveDraft, clearDraft } = useFormDraft('burglaryClaimForm', formMethods);
  const watchedValues = formMethods.watch();

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

  // Auto-save draft
  useEffect(() => {
    const subscription = formMethods.watch((data) => {
      saveDraft(data);
    });
    return () => subscription.unsubscribe();
  }, [formMethods, saveDraft]);

  // Main submit handler that checks authentication
  const handleSubmit = async (data: BurglaryClaimData) => {
    // File upload logic similar to Motor Claim
    const fileUploadPromises: Array<Promise<[string, string]>> = [];
    
    for (const [key, file] of Object.entries(uploadedFiles)) {
      if (file) {
        fileUploadPromises.push(
          uploadFile(file, `burglary-claims/${Date.now()}-${file.name}`).then(url => [key, url])
        );
      }
    }

    const fileResults = await Promise.all(fileUploadPromises);
    const fileUrls = Object.fromEntries(fileResults);

    const finalData = {
      ...data,
      ...fileUrls,
      status: 'processing',
      formType: 'Burglary Claim'
    };

    await handleSubmitWithAuth(finalData, 'Burglary Claim');
    clearDraft();
    setShowSummary(false);
  };

  const onFinalSubmit = (data: BurglaryClaimData) => {
    setShowSummary(true);
  };

  // Step field mappings for validation
  const stepFieldMappings = {
    0: ['policyNumber', 'periodOfCoverFrom', 'periodOfCoverTo'],
    1: ['nameOfInsured', 'title', 'dateOfBirth', 'gender', 'address', 'phone', 'email'],
    2: ['premisesAddress', 'premisesTelephone', 'dateOfTheft', 'timeOfTheft', 'howEntryEffected', 'roomsEntered', 'premisesOccupied', 'lastOccupiedDate', 'suspicions', 'suspicionName', 'policeInformed', 'policeDate', 'policeStation', 'soleOwner', 'ownerDetails', 'otherInsurance', 'otherInsurerDetails', 'totalContentsValue', 'sumInsuredFirePolicy', 'fireInsurerName', 'fireInsurerAddress', 'previousLoss', 'previousLossDetails'],
    3: ['propertyItems'],
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField name="nameOfInsured" label="Name of Insured" required />
              <FormField name="companyName" label="Company Name (Optional)" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormSelect name="title" label="Title" required placeholder="Select title">
                <SelectItem value="Mr">Mr</SelectItem>
                <SelectItem value="Mrs">Mrs</SelectItem>
                <SelectItem value="Chief">Chief</SelectItem>
                <SelectItem value="Dr">Dr</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </FormSelect>
              
              <FormDatePicker name="dateOfBirth" label="Date of Birth" required />
              
              <FormSelect name="gender" label="Gender" required placeholder="Select gender">
                <SelectItem value="Male">Male</SelectItem>
                <SelectItem value="Female">Female</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </FormSelect>
            </div>
            
            <FormTextarea name="address" label="Address" required />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField name="phone" label="Phone Number" required />
              <FormField name="email" label="Email Address" type="email" required />
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
            <FormTextarea name="premisesAddress" label="Full address of premises involved" required />
            <FormField name="premisesTelephone" label="Telephone" required />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormDatePicker name="dateOfTheft" label="Date of theft" required />
              <FormField name="timeOfTheft" label="Time" type="time" required />
            </div>
            
            <FormTextarea name="howEntryEffected" label="Give full details of how entry was affected" required />
            <FormTextarea name="roomsEntered" label="Rooms entered" required />
            
            <div className="space-y-2">
              <Label>Premises occupied at time of loss? *</Label>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="premisesOccupied-yes"
                    checked={watchedValues.premisesOccupied === true}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        formMethods.setValue('premisesOccupied', true);
                        formMethods.clearErrors('premisesOccupied');
                      }
                    }}
                  />
                  <Label htmlFor="premisesOccupied-yes">Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="premisesOccupied-no"
                    checked={watchedValues.premisesOccupied === false}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        formMethods.setValue('premisesOccupied', false);
                        formMethods.clearErrors('premisesOccupied');
                      }
                    }}
                  />
                  <Label htmlFor="premisesOccupied-no">No</Label>
                </div>
              </div>
              {formMethods.formState.errors.premisesOccupied && (
                <p className="text-sm text-destructive">
                  {formMethods.formState.errors.premisesOccupied.message?.toString()}
                </p>
              )}
            </div>
            
            {watchedValues.premisesOccupied === false && (
              <FormField name="lastOccupiedDate" label="Last occupied date/time" required />
            )}
            
            {/* Add similar validation patterns for all other boolean fields */}
            {/* SUSPICIONS SECTION */}
            <div className="space-y-2">
              <Label>Suspicions on anyone? *</Label>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="suspicions-yes"
                    checked={watchedValues.suspicions === true}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        formMethods.setValue('suspicions', true);
                        formMethods.clearErrors('suspicions');
                      }
                    }}
                  />
                  <Label htmlFor="suspicions-yes">Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="suspicions-no"
                    checked={watchedValues.suspicions === false}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        formMethods.setValue('suspicions', false);
                        formMethods.clearErrors('suspicions');
                      }
                    }}
                  />
                  <Label htmlFor="suspicions-no">No</Label>
                </div>
              </div>
              {formMethods.formState.errors.suspicions && (
                <p className="text-sm text-destructive">
                  {formMethods.formState.errors.suspicions.message?.toString()}
                </p>
              )}
            </div>
            
            {watchedValues.suspicions === true && (
              <FormField name="suspicionName" label="Name" required />
            )}
            
            {/* POLICE SECTION */}
            <div className="space-y-2">
              <Label>Police informed? *</Label>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="policeInformed-yes"
                    checked={watchedValues.policeInformed === true}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        formMethods.setValue('policeInformed', true);
                        formMethods.clearErrors('policeInformed');
                      }
                    }}
                  />
                  <Label htmlFor="policeInformed-yes">Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="policeInformed-no"
                    checked={watchedValues.policeInformed === false}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        formMethods.setValue('policeInformed', false);
                        formMethods.clearErrors('policeInformed');
                      }
                    }}
                  />
                  <Label htmlFor="policeInformed-no">No</Label>
                </div>
              </div>
              {formMethods.formState.errors.policeInformed && (
                <p className="text-sm text-destructive">
                  {formMethods.formState.errors.policeInformed.message?.toString()}
                </p>
              )}
            </div>
            
            {watchedValues.policeInformed === true && (
              <div className="space-y-4">
                <FormDatePicker name="policeDate" label="Date" required />
                <FormTextarea name="policeStation" label="Station address" required />
              </div>
            )}
            
            {/* Add remaining boolean sections following same pattern... */}
            {/* SOLE OWNER, OTHER INSURANCE, PREVIOUS LOSS sections would follow the same pattern */}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField name="totalContentsValue" label="At the time of loss, what amount would you value the total contents of your premises?" type="number" required />
              <FormField name="sumInsuredFirePolicy" label="Sum insured under fire policy" type="number" required />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField name="fireInsurerName" label="Fire policy insurer name" required />
              <FormTextarea name="fireInsurerAddress" label="Fire policy insurer address" required />
            </div>
            
            {/* ADD OTHER BOOLEAN SECTIONS HERE - SAME PATTERN AS ABOVE */}
          </div>
        </FormProvider>
      )
    },
    {
      id: 'property',
      title: 'Property Details',
      component: (
        <FormProvider {...formMethods}>
          <div className="space-y-4">
            <h3 className="text-lg font-medium">PLEASE COMPLETE WITH FULLEST PARTICULARS</h3>
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Property Items</h3>
              <Button
                type="button"
                onClick={() => addProperty({ 
                  description: '', 
                  costPrice: 0, 
                  dateOfPurchase: new Date(), 
                  estimatedValue: 0, 
                  netAmountClaimed: 0 
                })}
                variant="outline"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </div>
            
            {propertyFields.map((field, index) => (
              <Card key={field.id} className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-medium">Item {index + 1}</h4>
                  <Button
                    type="button"
                    onClick={() => removeProperty(index)}
                    variant="outline"
                    size="sm"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Remove
                  </Button>
                </div>
                
                <div className="space-y-4">
                  <FormTextarea name={`propertyItems.${index}.description`} label="Description" required />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField name={`propertyItems.${index}.costPrice`} label="Cost Price of Property or Articles Stolen (₦)" type="number" required />
                    <FormDatePicker name={`propertyItems.${index}.dateOfPurchase`} label="Date of Purchase" required />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField name={`propertyItems.${index}.estimatedValue`} label="Estimated value at time of loss" type="number" required />
                    <FormField name={`propertyItems.${index}.netAmountClaimed`} label="Net amount claimed" type="number" required />
                  </div>
                </div>
              </Card>
            ))}
            
            {propertyFields.length === 0 && (
              <div className="text-center p-8 text-gray-500">
                No property items added yet. Click "Add Item" to add property details.
              </div>
            )}
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
            
            <div className="bg-gray-50 p-4 rounded-lg">
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
                I agree that statements are true <span className="required-asterisk">*</span>
              </Label>
            </div>
            {formMethods.formState.errors.declarationTrue && (
              <p className="text-sm text-destructive">
                {formMethods.formState.errors.declarationTrue.message?.toString()}
              </p>
            )}
            
            <FormField name="signature" label="Signature of policyholder (digital signature)" required placeholder="Type your full name as signature" />
            
            <div>
              <Label>Date</Label>
              <Input value={new Date().toISOString().split('T')[0]} disabled />
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
                <AlertTriangle className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight mb-2">Burglary, Housebreaking and Larceny Claim Form</h1>
              <p className="text-muted-foreground">
                Submit your burglary insurance claim with all required details and supporting documents.
              </p>
            </div>

            <Card className="shadow-xl border-0 bg-white/50 backdrop-blur-sm">
              <CardHeader className="text-center pb-2">
                <CardTitle className="flex items-center justify-center gap-2">
                  <FileText className="w-5 h-5" />
                  Burglary Insurance Claim
                </CardTitle>
                <CardDescription>
                  Complete all sections to submit your burglary claim
                </CardDescription>
              </CardHeader>
              <CardContent>
                <MultiStepForm
                  steps={steps}
                  onSubmit={onFinalSubmit}
                  formMethods={formMethods}
                  submitButtonText="Submit Burglary Claim"
                  stepFieldMappings={stepFieldMappings}
                />
              </CardContent>
            </Card>
          </div>
        </div>
        {/* Summary Dialog */}
        <Dialog open={showSummary} onOpenChange={setShowSummary}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Review Your Burglary Claim Submission</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><strong>Policy Number:</strong> {watchedValues.policyNumber}</div>
                <div><strong>Name:</strong> {watchedValues.nameOfInsured}</div>
                <div><strong>Email:</strong> {watchedValues.email}</div>
                <div><strong>Premises:</strong> {watchedValues.premisesAddress}</div>
              </div>
              <div className="p-4 rounded-lg">
                <p className="text-sm font-medium text-blue-800">
                  For claims status enquiries, call 01 448 9570
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowSummary(false)}>
                Back to Edit
              </Button>
              <Button onClick={() => handleSubmit(watchedValues)} disabled={isSubmitting}>
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
        
        {/* Success Modal */}
        <SuccessModal
          isOpen={showSuccess || authShowSuccess || authSubmitting}
          onClose={() => {
            setShowSuccess(false);
            setAuthShowSuccess();
          }}
          title="Burglary Claim Submitted!"
          formType="Burglary Claim"
          isLoading={authSubmitting}
          loadingMessage="Your burglary claim is being processed and submitted..."
        />
      </div>

      {/* Post-Authentication Loading Overlay */}
      {showPostAuthLoading && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-card p-8 rounded-lg shadow-lg animate-scale-in max-w-md mx-4">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
              <h3 className="text-xl font-semibold text-primary">Processing Your Submission</h3>
              <p className="text-muted-foreground">
                Thank you for signing in! Your burglary claim is now being submitted...
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BurglaryClaimForm;
