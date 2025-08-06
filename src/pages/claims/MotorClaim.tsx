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
import { Calendar, CalendarIcon, Upload, Edit2, Car, FileText, CheckCircle2, Loader2, Plus, Trash2, Info } from 'lucide-react';
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

// Motor Claim Schema
const motorClaimSchema = yup.object().shape({
  // Policy Details
  policyNumber: yup.string().required("Policy number is required"),
  periodOfCoverFrom: yup.date().required("Period of cover from is required"),
  periodOfCoverTo: yup.date().required("Period of cover to is required"),

  // Insured Details
  nameCompany: yup.string().required("Name/Company is required"),
  title: yup.string().required("Title is required"),
  dateOfBirth: yup.date().required("Date of birth is required"),
  gender: yup.string().required("Gender is required"),
  address: yup.string().required("Address is required"),
  phone: yup.string().required("Phone number is required"),
  email: yup.string().email("Valid email is required").required("Email is required"),

  // Vehicle Details
  registrationNumber: yup.string().required("Registration number is required"),
  make: yup.string().required("Make is required"),
  model: yup.string().required("Model is required"),
  year: yup.string().required("Year is required"),
  engineNumber: yup.string().required("Engine number is required"),
  chassisNumber: yup.string().required("Chassis number is required"),
  registeredInYourName: yup.string().required("Registration ownership field is required"),
  registeredInYourNameDetails: yup.string().when('registeredInYourName', {
    is: 'no',
    then: (schema) => schema.required("Details required for registration ownership"),
    otherwise: (schema) => schema.notRequired()
  }),
  ownedSolely: yup.string().required("Sole ownership field is required"),
  ownedSolelyDetails: yup.string().when('ownedSolely', {
    is: 'no',
    then: (schema) => schema.required("Details required for sole ownership"),
    otherwise: (schema) => schema.notRequired()
  }),
  hirePurchase: yup.string().required("Hire purchase field is required"),
  hirePurchaseDetails: yup.string().when('hirePurchase', {
    is: 'yes',
    then: (schema) => schema.required("Details required for hire purchase"),
    otherwise: (schema) => schema.notRequired()
  }),
  vehicleUsage: yup.string().required("Vehicle usage is required"),
  trailerAttached: yup.string().required("Trailer attached field is required"),

  // Damage Details
  damageDescription: yup.string().required("Damage description is required"),
  inspectionLocation: yup.string().required("Inspection location is required"),

  // Incident Details
  incidentLocation: yup.string().required("Incident location is required"),
  incidentDate: yup.date().required("Incident date is required"),
  incidentTime: yup.string().required("Incident time is required"),
  policeReported: yup.string().required("Police reported field is required"),
  policeStationDetails: yup.string().when('policeReported', {
    is: 'yes',
    then: (schema) => schema.required("Police station details required"),
    otherwise: (schema) => schema.notRequired()
  }),
  incidentDescription: yup.string().required("Incident description is required"),

  // Witnesses
  witnesses: yup.array().of(
    yup.object().shape({
      name: yup.string().required("Witness name is required"),
      address: yup.string().required("Witness address is required"),
      phone: yup.string().required("Witness phone is required"),
      isPassenger: yup.boolean()
    })
  ),

  // Other Vehicle
  otherVehicleInvolved: yup.string().required("Other vehicle involved field is required"),
  otherVehicleRegNumber: yup.string().when('otherVehicleInvolved', {
    is: 'yes',
    then: (schema) => schema.required("Other vehicle registration required"),
    otherwise: (schema) => schema.notRequired()
  }),
  otherVehicleMakeModel: yup.string().when('otherVehicleInvolved', {
    is: 'yes',
    then: (schema) => schema.required("Other vehicle make/model required"),
    otherwise: (schema) => schema.notRequired()
  }),
  otherDriverName: yup.string().when('otherVehicleInvolved', {
    is: 'yes',
    then: (schema) => schema.required("Other driver name required"),
    otherwise: (schema) => schema.notRequired()
  }),
  otherDriverPhone: yup.string().when('otherVehicleInvolved', {
    is: 'yes',
    then: (schema) => schema.required("Other driver phone required"),
    otherwise: (schema) => schema.notRequired()
  }),
  otherDriverAddress: yup.string().when('otherVehicleInvolved', {
    is: 'yes',
    then: (schema) => schema.required("Other driver address required"),
    otherwise: (schema) => schema.notRequired()
  }),
  otherVehicleInjuryDamage: yup.string(),

  // Declaration
  agreeToDataPrivacy: yup.boolean().oneOf([true], "You must agree to data privacy"),
  declarationTrue: yup.boolean().oneOf([true], "You must agree that statements are true"),
  signature: yup.string().required("Signature is required")
});

interface Witness {
  name: string;
  address: string;
  phone: string;
  isPassenger: boolean;
}

interface MotorClaimData {
  // Policy Details
  policyNumber: string;
  periodOfCoverFrom: Date;
  periodOfCoverTo: Date;

  // Insured Details
  nameCompany: string;
  title: string;
  dateOfBirth: Date;
  gender: string;
  address: string;
  phone: string;
  email: string;

  // Vehicle Details
  registrationNumber: string;
  make: string;
  model: string;
  year: string;
  engineNumber: string;
  chassisNumber: string;
  registeredInYourName: string;
  registeredInYourNameDetails?: string;
  ownedSolely: string;
  ownedSolelyDetails?: string;
  hirePurchase: string;
  hirePurchaseDetails?: string;
  vehicleUsage: string;
  trailerAttached: string;

  // Damage Details
  damageDescription: string;
  inspectionLocation: string;

  // Incident Details
  incidentLocation: string;
  incidentDate: Date;
  incidentTime: string;
  policeReported: string;
  policeStationDetails?: string;
  incidentDescription: string;

  // Witnesses
  witnesses: Witness[];

  // Other Vehicle Details
  otherVehicleInvolved: string;
  otherVehicleRegNumber?: string;
  otherVehicleMakeModel?: string;
  otherDriverName?: string;
  otherDriverPhone?: string;
  otherDriverAddress?: string;
  otherVehicleInjuryDamage?: string;

  // Declaration
  agreeToDataPrivacy: boolean;
  declarationTrue: boolean;
  signature: string;
}

// Form field components with validation (defined outside main component to prevent focus loss)
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

const defaultValues: Partial<MotorClaimData> = {
  policyNumber: '',
  nameCompany: '',
  title: '',
  gender: '',
  address: '',
  phone: '',
  email: '',
  registrationNumber: '',
  make: '',
  model: '',
  year: '',
  engineNumber: '',
  chassisNumber: '',
  registeredInYourName: '',
  registeredInYourNameDetails: '',
  ownedSolely: '',
  ownedSolelyDetails: '',
  hirePurchase: '',
  hirePurchaseDetails: '',
  vehicleUsage: '',
  trailerAttached: '',
  damageDescription: '',
  inspectionLocation: '',
  incidentLocation: '',
  incidentTime: '',
  policeReported: '',
  policeStationDetails: '',
  incidentDescription: '',
  witnesses: [],
  otherVehicleInvolved: '',
  otherVehicleRegNumber: '',
  otherVehicleMakeModel: '',
  otherDriverName: '',
  otherDriverPhone: '',
  otherDriverAddress: '',
  otherVehicleInjuryDamage: '',
  agreeToDataPrivacy: false,
  declarationTrue: false,
  signature: ''
};

const MotorClaim: React.FC = () => {
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
    resolver: yupResolver(motorClaimSchema),
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

  const { saveDraft, clearDraft } = useFormDraft('motorClaim', formMethods);
  const watchedValues = formMethods.watch();

  // Auto-save draft
  useEffect(() => {
    const subscription = formMethods.watch((data) => {
      saveDraft(data);
    });
    return () => subscription.unsubscribe();
  }, [formMethods, saveDraft]);

  // Main submit handler that checks authentication
  const handleSubmit = async (data: MotorClaimData) => {
    // Prepare file upload data
    const fileUploadPromises: Array<Promise<[string, string]>> = [];
    
    for (const [key, file] of Object.entries(uploadedFiles)) {
      if (file) {
        fileUploadPromises.push(
          uploadFile(file, `motor-claims/${Date.now()}-${file.name}`).then(url => [key, url])
        );
      }
    }

    const fileResults = await Promise.all(fileUploadPromises);
    const fileUrls = Object.fromEntries(fileResults);

    const finalData = {
      ...data,
      ...fileUrls,
      status: 'processing',
      formType: 'Motor Claim'
    };

    await handleSubmitWithAuth(finalData, 'Motor Claim');
    clearDraft();
    setShowSummary(false);
  };

  const onFinalSubmit = (data: MotorClaimData) => {
    setShowSummary(true);
  };

  // Step field mappings for validation
  const stepFieldMappings = {
    0: ['policyNumber', 'periodOfCoverFrom', 'periodOfCoverTo'],
    1: ['nameCompany', 'title', 'dateOfBirth', 'gender', 'address', 'phone', 'email'],
    2: ['registrationNumber', 'make', 'model', 'year', 'engineNumber', 'chassisNumber', 'registeredInYourName', 'registeredInYourNameDetails', 'ownedSolely', 'ownedSolelyDetails', 'hirePurchase', 'hirePurchaseDetails', 'vehicleUsage', 'trailerAttached'],
    3: ['damageDescription', 'inspectionLocation'],
    4: ['incidentLocation', 'incidentDate', 'incidentTime', 'policeReported', 'policeStationDetails', 'incidentDescription'],
    5: ['witnesses'],
    6: ['otherVehicleInvolved', 'otherVehicleRegNumber', 'otherVehicleMakeModel', 'otherDriverName', 'otherDriverPhone', 'otherDriverAddress'],
    7: ['agreeToDataPrivacy', 'declarationTrue', 'signature']
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
            <FormField name="nameCompany" label="Name / Company Name" required />
            
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
              <FormField name="email" label="Email" type="email" required />
            </div>
          </div>
        </FormProvider>
      )
    },
    {
      id: 'vehicle',
      title: 'Vehicle Details',
      component: (
        <FormProvider {...formMethods}>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField name="registrationNumber" label="Registration Number" required />
              <FormField name="make" label="Make" required />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField name="model" label="Model" required />
              <FormField name="year" label="Year" required />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField name="engineNumber" label="Engine Number" required />
              <FormField name="chassisNumber" label="Chassis Number" required />
            </div>
            
            <FormSelect name="registeredInYourName" label="Is the vehicle registered in your name?" required placeholder="Select yes or no">
              <SelectItem value="yes">Yes</SelectItem>
              <SelectItem value="no">No</SelectItem>
            </FormSelect>
            
            {watchedValues.registeredInYourName === 'no' && (
              <FormTextarea name="registeredInYourNameDetails" label="If No, provide details" required />
            )}
            
            <FormSelect name="ownedSolely" label="Is the vehicle owned solely by you?" required placeholder="Select yes or no">
              <SelectItem value="yes">Yes</SelectItem>
              <SelectItem value="no">No</SelectItem>
            </FormSelect>
            
            {watchedValues.ownedSolely === 'no' && (
              <FormTextarea name="ownedSolelyDetails" label="If No, provide details" required />
            )}
            
            <FormSelect name="hirePurchase" label="Is the vehicle on hire purchase?" required placeholder="Select yes or no">
              <SelectItem value="yes">Yes</SelectItem>
              <SelectItem value="no">No</SelectItem>
            </FormSelect>
            
            {watchedValues.hirePurchase === 'yes' && (
              <FormTextarea name="hirePurchaseDetails" label="If Yes, provide details" required />
            )}
            
            <FormSelect name="vehicleUsage" label="Vehicle Usage" required placeholder="Select usage">
              <SelectItem value="Private">Private</SelectItem>
              <SelectItem value="Commercial">Commercial</SelectItem>
              <SelectItem value="Both">Both</SelectItem>
            </FormSelect>
            
            <FormSelect name="trailerAttached" label="Was trailer attached?" required placeholder="Select yes or no">
              <SelectItem value="yes">Yes</SelectItem>
              <SelectItem value="no">No</SelectItem>
            </FormSelect>
          </div>
        </FormProvider>
      )
    },
    {
      id: 'damage',
      title: 'Damage Details',
      component: (
        <FormProvider {...formMethods}>
          <div className="space-y-4">
            <FormTextarea name="damageDescription" label="Description of Damage" required />
            <FormField name="inspectionLocation" label="Where can the vehicle be inspected?" required />
          </div>
        </FormProvider>
      )
    },
    {
      id: 'incident',
      title: 'Incident Details',
      component: (
        <FormProvider {...formMethods}>
          <div className="space-y-4">
            <FormField name="incidentLocation" label="Where did the incident occur?" required />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormDatePicker name="incidentDate" label="Date of Incident" required />
              <FormField name="incidentTime" label="Time of Incident" type="time" required />
            </div>
            
            <FormSelect name="policeReported" label="Was the incident reported to police?" required placeholder="Select yes or no">
              <SelectItem value="yes">Yes</SelectItem>
              <SelectItem value="no">No</SelectItem>
            </FormSelect>
            
            {watchedValues.policeReported === 'yes' && (
              <FormTextarea name="policeStationDetails" label="Police Station Details" required />
            )}
            
            <FormTextarea name="incidentDescription" label="Full description of how the incident occurred" required />
          </div>
        </FormProvider>
      )
    },
    {
      id: 'witnesses',
      title: 'Witnesses',
      component: (
        <FormProvider {...formMethods}>
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground mb-4">
              Add any witnesses to the incident (optional)
            </div>
            
            {witnessFields.map((witness, index) => (
              <Card key={witness.id} className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">Witness {index + 1}</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeWitness(index)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Remove
                  </Button>
                </div>
                
                <div className="space-y-4">
                  <FormField name={`witnesses.${index}.name`} label="Name" required />
                  <FormTextarea name={`witnesses.${index}.address`} label="Address" required />
                  <FormField name={`witnesses.${index}.phone`} label="Phone" required />
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`witnesses.${index}.isPassenger`}
                      checked={formMethods.watch(`witnesses.${index}.isPassenger`) || false}
                      onCheckedChange={(checked) => {
                        formMethods.setValue(`witnesses.${index}.isPassenger`, !!checked);
                      }}
                    />
                    <Label htmlFor={`witnesses.${index}.isPassenger`}>Was this person a passenger?</Label>
                  </div>
                </div>
              </Card>
            ))}
            
            <Button
              type="button"
              variant="outline"
              onClick={() => addWitness({
                name: '',
                address: '',
                phone: '',
                isPassenger: false
              })}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Witness
            </Button>
          </div>
        </FormProvider>
      )
    },
    {
      id: 'otherVehicle',
      title: 'Other Vehicle Details',
      component: (
        <FormProvider {...formMethods}>
          <div className="space-y-4">
            <FormSelect name="otherVehicleInvolved" label="Was another vehicle involved?" required placeholder="Select yes or no">
              <SelectItem value="yes">Yes</SelectItem>
              <SelectItem value="no">No</SelectItem>
            </FormSelect>
            
            {watchedValues.otherVehicleInvolved === 'yes' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField name="otherVehicleRegNumber" label="Registration Number" required />
                  <FormField name="otherVehicleMakeModel" label="Make/Model" required />
                </div>
                
                <FormField name="otherDriverName" label="Driver's Name" required />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField name="otherDriverPhone" label="Driver's Phone" required />
                  <FormTextarea name="otherDriverAddress" label="Driver's Address" required />
                </div>
                
                <FormTextarea name="otherVehicleInjuryDamage" label="Injury/Damage to Other Vehicle" />
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
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Declaration</h3>
              <p className="text-sm">
                I hereby declare that the statements made above are true and complete to the best of my knowledge and belief and I have not concealed any material facts.
              </p>
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
                <Label>Place</Label>
                <Input value="Nigeria" disabled />
              </div>
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
                <Car className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight mb-2">Motor Claim Form</h1>
              <p className="text-muted-foreground">
                Please provide accurate information about your motor insurance claim
              </p>
            </div>

            <Card className="shadow-xl border-0 bg-white/50 backdrop-blur-sm">
              <CardHeader className="text-center pb-2">
                <CardTitle className="flex items-center justify-center gap-2">
                  <FileText className="w-5 h-5" />
                  Motor Insurance Claim
                </CardTitle>
                <CardDescription>
                  Complete all sections to submit your motor claim
                </CardDescription>
              </CardHeader>
              <CardContent>
                <MultiStepForm
                  steps={steps}
                  onSubmit={onFinalSubmit}
                  formMethods={formMethods}
                  submitButtonText="Submit Motor Claim"
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
              <DialogTitle>Confirm Your Motor Claim Submission</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Policy Number:</span>
                  <p>{watchedValues.policyNumber}</p>
                </div>
                <div>
                  <span className="font-medium">Insured Name:</span>
                  <p>{watchedValues.nameCompany}</p>
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
          title="Motor Claim Submitted Successfully!"
          message="Your motor claim has been received and is being processed. You will receive updates via email and SMS."
          formType="Motor Claim"
        />
      </div>
    </FormProvider>
  );
};

export default MotorClaim;
