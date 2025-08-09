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
import { Calendar, CalendarIcon, Upload, Edit2, Shield, FileText, CheckCircle2, Loader2, Plus, Trash2, Info } from 'lucide-react';
import { format } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import MultiStepForm from '@/components/common/MultiStepForm';
import { useFormDraft } from '@/hooks/useFormDraft';
import FileUpload from '@/components/common/FileUpload';
import { uploadFile } from '@/services/fileService';
import { db } from '@/firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
// import { emailService } from '@/services/emailService';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthRequiredSubmit } from '@/hooks/useAuthRequiredSubmit';
import AuthRequiredSubmit from '@/components/common/AuthRequiredSubmit';
import SuccessModal from '@/components/common/SuccessModal';

// Combined GPA & Employers Liability Claim Schema
const combinedGPAEmployersLiabilityClaimSchema = yup.object().shape({
  // Policy Details
  policyNumber: yup.string().required("Policy number is required"),
  periodOfCoverFrom: yup.date().required("Period of cover from is required"),
  periodOfCoverTo: yup.date().required("Period of cover to is required"),

  // Insured Details
  name: yup.string().required("Name is required"),
  address: yup.string().required("Address is required"),
  phone: yup.string().required("Phone number is required"),
  email: yup.string().email("Valid email is required").required("Email is required"),

  // Injured Party Details
  injuredPartyName: yup.string().required("Injured party name is required"),
  injuredPartyAge: yup.number().required("Injured party age is required"),
  injuredPartyAddress: yup.string().required("Injured party address is required"),
  averageMonthlyEarnings: yup.number().required("Average monthly earnings is required"),
  occupation: yup.string().required("Occupation is required"),
  dateOfEmployment: yup.date().required("Date of employment is required"),
  notDirectlyEmployed: yup.boolean(),
  employerName: yup.string().when('notDirectlyEmployed', {
    is: true,
    then: (schema) => schema.required("Employer name required"),
    otherwise: (schema) => schema.notRequired()
  }),
  employerAddress: yup.string().when('notDirectlyEmployed', {
    is: true,
    then: (schema) => schema.required("Employer address required"),
    otherwise: (schema) => schema.notRequired()
  }),
  durationEmployed: yup.string(),
  maritalStatus: yup.string().required("Marital status is required"),
  previousAccidents: yup.string().required("Previous accidents field is required"),
  previousAccidentsDetails: yup.string().when('previousAccidents', {
    is: 'yes',
    then: (schema) => schema.required("Details required for previous accidents"),
    otherwise: (schema) => schema.notRequired()
  }),

  // Injury Details
  natureOfInjuries: yup.string().required("Nature of injuries is required"),
  machineryInvolved: yup.string(),

  // Accident Details
  accidentDate: yup.date().required("Accident date is required"),
  accidentTime: yup.string().required("Accident time is required"),
  accidentPlace: yup.string().required("Accident place is required"),
  dateReported: yup.date().required("Date reported is required"),
  dateTimeStoppedWork: yup.string().required("Date/time stopped work is required"),
  workAtTime: yup.string().required("Work at time is required"),
  howItOccurred: yup.string().required("How it occurred is required"),

  // Medical
  receivingTreatment: yup.string().required("Receiving treatment field is required"),
  hospitalName: yup.string().when('receivingTreatment', {
    is: 'yes',
    then: (schema) => schema.required("Hospital name required"),
    otherwise: (schema) => schema.notRequired()
  }),
  hospitalAddress: yup.string().when('receivingTreatment', {
    is: 'yes',
    then: (schema) => schema.required("Hospital address required"),
    otherwise: (schema) => schema.notRequired()
  }),
  stillInHospital: yup.string().when('receivingTreatment', {
    is: 'yes',
    then: (schema) => schema.required("Still in hospital field required"),
    otherwise: (schema) => schema.notRequired()
  }),
  dischargeDate: yup.date().when('stillInHospital', {
    is: 'no',
    then: (schema) => schema.required("Discharge date required"),
    otherwise: (schema) => schema.notRequired()
  }),
  ableToDoduties: yup.string().required("Able to do duties field is required"),
  dutiesDetails: yup.string().when('ableToDoduties', {
    is: 'yes',
    then: (schema) => schema.required("Duties details required"),
    otherwise: (schema) => schema.notRequired()
  }),
  dateNatureResumedWork: yup.string(),

  // Doctor Details
  doctorName: yup.string().required("Doctor name is required"),

  // Disablement
  totallyDisabled: yup.string().required("Totally disabled field is required"),
  estimatedDuration: yup.string(),

  // Witnesses
  witnesses: yup.array().of(
    yup.object().shape({
      name: yup.string().required("Witness name is required"),
      address: yup.string().required("Witness address is required"),
      phone: yup.string().required("Witness phone is required")
    })
  ),

  // Other Insurers
  otherInsurerName: yup.string(),
  otherInsurerAddress: yup.string(),
  otherInsurerPolicyNumber: yup.string(),

  // Statement of Earnings (12-month table)
  earnings: yup.array().of(
    yup.object().shape({
      monthEnding: yup.string(),
      wagesAndBonus: yup.number(),
      monthlyAllowances: yup.number()
    })
  ),

  // Declaration
  agreeToDataPrivacy: yup.boolean().oneOf([true], "You must agree to data privacy"),
  declarationTrue: yup.boolean().oneOf([true], "You must agree that statements are true"),
  declarationAdditionalInfo: yup.boolean().oneOf([true], "You must agree to provide additional information"),
  declarationDocuments: yup.boolean().oneOf([true], "You must agree to submit documents"),
  signature: yup.string().required("Signature is required")
});

interface Witness {
  name: string;
  address: string;
  phone: string;
}

interface EarningsMonth {
  monthEnding: string;
  wagesAndBonus: number;
  monthlyAllowances: number;
}

interface CombinedGPAEmployersLiabilityClaimData {
  // Policy Details
  policyNumber: string;
  periodOfCoverFrom: Date;
  periodOfCoverTo: Date;

  // Insured Details
  name: string;
  address: string;
  phone: string;
  email: string;

  // Injured Party Details
  injuredPartyName: string;
  injuredPartyAge: number;
  injuredPartyAddress: string;
  averageMonthlyEarnings: number;
  occupation: string;
  dateOfEmployment: Date;
  notDirectlyEmployed: boolean;
  employerName?: string;
  employerAddress?: string;
  durationEmployed?: string;
  maritalStatus: string;
  previousAccidents: string;
  previousAccidentsDetails?: string;

  // Injury Details
  natureOfInjuries: string;
  machineryInvolved?: string;

  // Accident Details
  accidentDate: Date;
  accidentTime: string;
  accidentPlace: string;
  dateReported: Date;
  dateTimeStoppedWork: string;
  workAtTime: string;
  howItOccurred: string;

  // Medical
  receivingTreatment: string;
  hospitalName?: string;
  hospitalAddress?: string;
  stillInHospital?: string;
  dischargeDate?: Date;
  ableToDoduties: string;
  dutiesDetails?: string;
  dateNatureResumedWork?: string;

  // Doctor Details
  doctorName: string;

  // Disablement
  totallyDisabled: string;
  estimatedDuration?: string;

  // Witnesses
  witnesses: Witness[];

  // Other Insurers
  otherInsurerName?: string;
  otherInsurerAddress?: string;
  otherInsurerPolicyNumber?: string;

  // Statement of Earnings
  earnings: EarningsMonth[];

  // Declaration
  agreeToDataPrivacy: boolean;
  declarationTrue: boolean;
  declarationAdditionalInfo: boolean;
  declarationDocuments: boolean;
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

const defaultValues: Partial<CombinedGPAEmployersLiabilityClaimData> = {
  policyNumber: '',
  name: '',
  address: '',
  phone: '',
  email: '',
  injuredPartyName: '',
  injuredPartyAge: 0,
  injuredPartyAddress: '',
  averageMonthlyEarnings: 0,
  occupation: '',
  notDirectlyEmployed: false,
  employerName: '',
  employerAddress: '',
  durationEmployed: '',
  maritalStatus: '',
  previousAccidents: '',
  natureOfInjuries: '',
  machineryInvolved: '',
  accidentTime: '',
  accidentPlace: '',
  dateTimeStoppedWork: '',
  workAtTime: '',
  howItOccurred: '',
  receivingTreatment: '',
  hospitalName: '',
  hospitalAddress: '',
  stillInHospital: '',
  ableToDoduties: '',
  dutiesDetails: '',
  dateNatureResumedWork: '',
  doctorName: '',
  totallyDisabled: '',
  estimatedDuration: '',
  witnesses: [],
  otherInsurerName: '',
  otherInsurerAddress: '',
  otherInsurerPolicyNumber: '',
  earnings: Array.from({ length: 12 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (11 - i));
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return {
      monthEnding: `${month}/${year}`,
      wagesAndBonus: 0,
      monthlyAllowances: 0
    };
  }),
  agreeToDataPrivacy: false,
  declarationTrue: false,
  declarationAdditionalInfo: false,
  declarationDocuments: false,
  signature: ''
};

const CombinedGPAEmployersLiabilityClaim: React.FC = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [showSummary, setShowSummary] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPostAuthLoading, setShowPostAuthLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File>>({});
  const { 
    handleSubmitWithAuth, 
    showAuthDialog, 
    showSuccess: authShowSuccess,
    setShowSuccess: setAuthShowSuccess,
    isSubmitting: authSubmitting,
    proceedToSignup,
    dismissAuthDialog,
    formType
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
    resolver: yupResolver(combinedGPAEmployersLiabilityClaimSchema),
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

  const { saveDraft, clearDraft } = useFormDraft('combinedGPAEmployersLiabilityClaim', formMethods);
  const watchedValues = formMethods.watch();

  // Auto-save draft
  useEffect(() => {
    const subscription = formMethods.watch((data) => {
      saveDraft(data);
    });
    return () => subscription.unsubscribe();
  }, [formMethods, saveDraft]);

  // Main submit handler that checks authentication
  const handleSubmit = async (data: CombinedGPAEmployersLiabilityClaimData) => {
    // Prepare file upload data
    const fileUploadPromises: Array<Promise<[string, string]>> = [];
    
    for (const [key, file] of Object.entries(uploadedFiles)) {
      if (file) {
        fileUploadPromises.push(
          uploadFile(file, `combined-gpa-employers-liability-claims/${Date.now()}-${file.name}`).then(url => [key, url])
        );
      }
    }

    const fileResults = await Promise.all(fileUploadPromises);
    const fileUrls = Object.fromEntries(fileResults);

    const finalData = {
      ...data,
      ...fileUrls,
      status: 'processing',
      formType: 'Combined GPA & Employers Liability Claim'
    };

    await handleSubmitWithAuth(finalData, 'Combined GPA & Employers Liability Claim');
    clearDraft();
    setShowSummary(false);
  };

  const onFinalSubmit = (data: CombinedGPAEmployersLiabilityClaimData) => {
    setShowSummary(true);
  };

  // Step field mappings for validation
  const stepFieldMappings = {
    0: ['policyNumber', 'periodOfCoverFrom', 'periodOfCoverTo'],
    1: ['name', 'address', 'phone', 'email'],
    2: ['injuredPartyName', 'injuredPartyAge', 'injuredPartyAddress', 'averageMonthlyEarnings', 'occupation', 'dateOfEmployment', 'employerName', 'employerAddress', 'durationEmployed', 'maritalStatus', 'previousAccidents', 'previousAccidentsDetails'],
    3: ['natureOfInjuries', 'machineryInvolved'],
    4: ['accidentDate', 'accidentTime', 'accidentPlace', 'dateReported', 'dateTimeStoppedWork', 'workAtTime', 'howItOccurred'],
    5: ['receivingTreatment', 'hospitalName', 'hospitalAddress', 'stillInHospital', 'dischargeDate', 'ableToDoduties', 'dutiesDetails', 'dateNatureResumedWork'],
    6: ['doctorName'],
    7: ['totallyDisabled', 'estimatedDuration'],
    8: ['witnesses'],
    9: ['otherInsurerName', 'otherInsurerAddress', 'otherInsurerPolicyNumber'],
    10: ['earnings'],
    11: ['agreeToDataPrivacy', 'declarationTrue', 'declarationAdditionalInfo', 'declarationDocuments', 'signature']
  };

  const steps = [
    {
      id: 'policy',
      title: 'Policy Details',
      component: (
        <FormProvider {...formMethods}>
          <div className="space-y-4">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <FormField name="policyNumber" label="Policy Number" required />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Enter your combined GPA & employers liability insurance policy number</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormDatePicker
                name="periodOfCoverFrom"
                label="Period of Cover From"
                required
              />
              <FormDatePicker
                name="periodOfCoverTo"
                label="Period of Cover To"
                required
              />
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
          <TooltipProvider>
            <div className="space-y-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <FormField name="name" label="Name" required />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Enter the insured person's name</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <FormTextarea name="address" label="Address" required />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Enter the insured's full address</p>
                </TooltipContent>
              </Tooltip>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <FormField name="phone" label="Phone Number" required />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Enter contact phone number</p>
                  </TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <FormField name="email" label="Email Address" type="email" required />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Enter email address for correspondence</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </TooltipProvider>
        </FormProvider>
      )
    },
    {
      id: 'injured-party',
      title: 'Injured Party Details',
      component: (
        <FormProvider {...formMethods}>
          <TooltipProvider>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <FormField name="injuredPartyName" label="Name" required />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Enter the injured party's full name</p>
                  </TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <FormField name="injuredPartyAge" label="Age" type="number" required />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Enter the age of the injured party</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <FormTextarea name="injuredPartyAddress" label="Address" required />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Enter the injured party's address</p>
                </TooltipContent>
              </Tooltip>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <FormField name="averageMonthlyEarnings" label="Average Monthly Earnings" type="number" required />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Enter the average monthly earnings in Naira</p>
                  </TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <FormField name="occupation" label="Occupation" required />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Enter the occupation/job title</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              
              <FormDatePicker
                name="dateOfEmployment"
                label="Date of Employment"
                required
              />

              <FormField name="durationEmployed" label="f) How long has the person been continuously employed by you?" />
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="notDirectlyEmployed"
                  checked={watchedValues.notDirectlyEmployed || false}
                  onCheckedChange={(checked) => formMethods.setValue('notDirectlyEmployed', checked)}
                />
                <Label htmlFor="notDirectlyEmployed">If Injured Party is not directly employed</Label>
              </div>
              
              {watchedValues.notDirectlyEmployed && (
                <div className="space-y-4">
                  <FormField name="employerName" label="Employer Name" required />
                  <FormTextarea name="employerAddress" label="Employer Address" required />
                </div>
              )}
              
              <FormSelect name="maritalStatus" label="Marital Status" required placeholder="Select marital status">
                <SelectItem value="Single">Single</SelectItem>
                <SelectItem value="Married">Married</SelectItem>
                <SelectItem value="Divorced">Divorced</SelectItem>
                <SelectItem value="Widowed">Widowed</SelectItem>
              </FormSelect>
              
              <FormSelect name="previousAccidents" label="Previous Accidents" required placeholder="Select yes or no">
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="no">No</SelectItem>
              </FormSelect>
              
              {watchedValues.previousAccidents === 'yes' && (
                <FormTextarea name="previousAccidentsDetails" label="Previous Accidents Details" required />
              )}
            </div>
          </TooltipProvider>
        </FormProvider>
      )
    },
    {
      id: 'injury',
      title: 'Injury Details',
      component: (
        <FormProvider {...formMethods}>
          <TooltipProvider>
            <div className="space-y-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <FormTextarea name="natureOfInjuries" label="Nature of Injuries" required />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Describe the nature and extent of injuries</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <FormTextarea name="machineryInvolved" label="If Machinery is Involved, Please include details" />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Describe any machinery involved in the incident</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        </FormProvider>
      )
    },
    {
      id: 'accident',
      title: 'Accident Details',
      component: (
        <FormProvider {...formMethods}>
          <TooltipProvider>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormDatePicker
                  name="accidentDate"
                  label="Accident Date"
                  required
                />
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <FormField name="accidentTime" label="Time" type="time" required />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Enter the time when the accident occurred</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <FormTextarea name="accidentPlace" label="Where did the accident occur ?" required />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Describe the location where the accident occurred</p>
                </TooltipContent>
              </Tooltip>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormDatePicker
                  name="dateReported"
                  label="Date Accident was Reported"
                  required
                />
                
                <FormField name="dateTimeStoppedWork" label="Date/Time Stopped Work" type="datetime-local" required />
              </div>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <FormTextarea name="workAtTime" label="State fully the work upon which the injured party was engaged at the time of the incident" required />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Describe the work being performed when the accident occurred</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <FormTextarea name="howItOccurred" label="Describe how the accident occurred" required />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Provide a detailed description of how the accident happened</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        </FormProvider>
      )
    },
    {
      id: 'medical',
      title: 'Medical',
      component: (
        <FormProvider {...formMethods}>
          <TooltipProvider>
            <div className="space-y-4">
              <FormSelect name="receivingTreatment" label="Is the Injured Party receiving medical attention ?" required placeholder="Select yes or no">
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="no">No</SelectItem>
              </FormSelect>
              
              {watchedValues.receivingTreatment === 'yes' && (
                <div className="space-y-4">
                  <FormField name="hospitalName" label="Hospital Name" required />
                  <FormTextarea name="hospitalAddress" label="Hospital Address" required />
                  
                  <FormSelect name="stillInHospital" label="Still in Hospital?" required placeholder="Select yes or no">
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                  </FormSelect>
                  
                  {watchedValues.stillInHospital === 'no' && (
                    <FormDatePicker
                      name="dischargeDate"
                      label="Discharge Date"
                      required
                    />
                  )}
                </div>
              )}
              
              <FormSelect name="ableToDoduties" label="Is the Injured Party able to carry out any part of his duties ?" required placeholder="Select yes or no">
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="no">No</SelectItem>
              </FormSelect>
              
              {watchedValues.ableToDoduties === 'yes' && (
                <FormTextarea name="dutiesDetails" label="Duties Details" required />
              )}
              
              <FormTextarea name="dateNatureResumedWork" label="Date and Nature of Resumed Work" />
            </div>
          </TooltipProvider>
        </FormProvider>
      )
    },
    {
      id: 'doctor',
      title: 'Doctor Details',
      component: (
        <FormProvider {...formMethods}>
          <TooltipProvider>
            <div className="space-y-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <FormField name="doctorName" label="Name of Doctor" required />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Enter the name of the attending doctor</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        </FormProvider>
      )
    },
    {
      id: 'disablement',
      title: 'Disablement',
      component: (
        <FormProvider {...formMethods}>
          <TooltipProvider>
            <div className="space-y-4">
              <FormSelect name="totallyDisabled" label="Is the Injured Party totally disabled?" required placeholder="Select yes or no">
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="no">No</SelectItem>
              </FormSelect>
              
              <FormField name="estimatedDuration" label=") How long is disablement likely to last?" />
            </div>
          </TooltipProvider>
        </FormProvider>
      )
    },
    {
      id: 'witnesses',
      title: 'Witnesses',
      component: (
        <FormProvider {...formMethods}>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label className="text-lg font-semibold">Witnesses</Label>
              <Button
                type="button"
                onClick={() => addWitness({ name: '', address: '', phone: '' })}
                variant="outline"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Witness
              </Button>
            </div>
            
            {witnessFields.map((field, index) => (
              <Card key={field.id} className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold">Witness {index + 1}</h3>
                  <Button
                    type="button"
                    onClick={() => removeWitness(index)}
                    variant="destructive"
                    size="sm"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="space-y-4">
                  <FormField name={`witnesses.${index}.name`} label="Witness Name" required />
                  <FormTextarea name={`witnesses.${index}.address`} label="Witness Address" required />
                  <FormField name={`witnesses.${index}.phone`} label="Witness Phone" required />
                </div>
              </Card>
            ))}
          </div>
        </FormProvider>
      )
    },
    {
      id: 'other-insurers',
      title: 'Other Insurers',
      component: (
        <FormProvider {...formMethods}>
          <TooltipProvider>
            <div className="space-y-4">
              <FormField name="otherInsurerName" label="Other Insurer Name" />
              <FormTextarea name="otherInsurerAddress" label="Other Insurer Address" />
              <FormField name="otherInsurerPolicyNumber" label="Policy Number" />
            </div>
          </TooltipProvider>
        </FormProvider>
      )
    },
    {
      id: 'earnings',
      title: 'Statement of Earnings',
      component: (
        <FormProvider {...formMethods}>
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr>
                    <th className="border border-gray-300 p-2 bg-gray-50">Month Ending</th>
                    <th className="border border-gray-300 p-2 bg-gray-50">Wages & Bonus</th>
                    <th className="border border-gray-300 p-2 bg-gray-50">Plus Monthly Allowances</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 12 }, (_, index) => (
                    <tr key={index}>
                      <td className="border border-gray-300 p-2">
                        <Input
                          {...formMethods.register(`earnings.${index}.monthEnding`)}
                          placeholder="MM/YYYY"
                        />
                      </td>
                      <td className="border border-gray-300 p-2">
                        <Input
                          type="number"
                          {...formMethods.register(`earnings.${index}.wagesAndBonus`)}
                          placeholder="0"
                        />
                      </td>
                      <td className="border border-gray-300 p-2">
                        <Input
                          type="number"
                          {...formMethods.register(`earnings.${index}.monthlyAllowances`)}
                          placeholder="0"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
             
             <div className="flex items-center space-x-2">
               <Checkbox 
                 id="declarationAdditionalInfo"
                 checked={formMethods.watch('declarationAdditionalInfo') || false}
                 onCheckedChange={(checked) => {
                   formMethods.setValue('declarationAdditionalInfo', !!checked);
                   if (formMethods.formState.errors.declarationAdditionalInfo) {
                     formMethods.clearErrors('declarationAdditionalInfo');
                   }
                 }}
                 className={cn(formMethods.formState.errors.declarationAdditionalInfo && "border-destructive")}
               />
               <Label htmlFor="declarationAdditionalInfo">
                 I agree to provide additional information <span className="required-asterisk">*</span>
               </Label>
             </div>
             {formMethods.formState.errors.declarationAdditionalInfo && (
               <p className="text-sm text-destructive">
                 {formMethods.formState.errors.declarationAdditionalInfo.message?.toString()}
               </p>
             )}
             
             <div className="flex items-center space-x-2">
               <Checkbox 
                 id="declarationDocuments"
                 checked={formMethods.watch('declarationDocuments') || false}
                 onCheckedChange={(checked) => {
                   formMethods.setValue('declarationDocuments', !!checked);
                   if (formMethods.formState.errors.declarationDocuments) {
                     formMethods.clearErrors('declarationDocuments');
                   }
                 }}
                 className={cn(formMethods.formState.errors.declarationDocuments && "border-destructive")}
               />
               <Label htmlFor="declarationDocuments">
                 I agree to submit required documents <span className="required-asterisk">*</span>
               </Label>
             </div>
             {formMethods.formState.errors.declarationDocuments && (
               <p className="text-sm text-destructive">
                 {formMethods.formState.errors.declarationDocuments.message?.toString()}
               </p>
             )}

          
             <FormField name="signature" label="Signature of policyholder (digital signature)" required placeholder="Type your full name as signature" />
             
             <div>
               <Label>Date</Label>
               <Input value={new Date().toISOString().split('T')[0]} disabled />
             </div>
             
             <div>
               <Label>File Uploads</Label>
               <FileUpload
                 onFileSelect={(file) => setUploadedFiles(prev => ({ ...prev, supportingDocuments: file }))}
                 onFileRemove={() => setUploadedFiles(prev => ({ ...prev, supportingDocuments: undefined }))}
                 currentFile={uploadedFiles.supportingDocuments}
                 accept=".jpg,.jpeg,.png,.pdf"
                 maxSize={3}
                 label="Upload Supporting Documents"
               />
             </div>
          </div>
        </FormProvider>
      )
    }
  ];

  if (showSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Claim Submitted Successfully!</h3>
                <p className="text-sm text-gray-600 mt-2">
                  Your Combined GPA & Employers Liability claim has been submitted successfully. You will receive a confirmation email shortly.
                </p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg text-sm">
                <p className="font-semibold mb-2">For claim status and inquiries:</p>
                <p>Email: claims@neminsurance.com</p>
                <p>Phone: +234 1 280 0000</p>
                <p>Address: 32 Adeola Odeku Street, Victoria Island, Lagos</p>
              </div>
              <Button onClick={() => window.location.href = '/'} className="w-full">
                Return to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <FormProvider {...formMethods}>
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="container mx-auto py-8 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
                <Shield className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight mb-2">Combined GPA & Employers Liability Claim Form</h1>
              <p className="text-muted-foreground">
                Submit your combined GPA & employers liability insurance claim with all required details
              </p>
            </div>

            <MultiStepForm
              steps={steps}
              onSubmit={onFinalSubmit}
              formMethods={formMethods}
              stepFieldMappings={stepFieldMappings}
            />

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
                    Back to Edit
                  </Button>
                  <Button onClick={() => handleSubmit(watchedValues)} disabled={authSubmitting}>
                    {authSubmitting ? (
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
              title="Combined GPA & Employers Liability Claim Submitted!"
              formType="Combined GPA & Employers Liability Claim"
              isLoading={authSubmitting}
              loadingMessage="Your combined GPA & employers liability claim is being processed and submitted..."
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
                    Thank you for signing in! Your combined GPA & employers liability claim is now being submitted...
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </FormProvider>
  );
};

export default CombinedGPAEmployersLiabilityClaim;
