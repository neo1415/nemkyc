
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
import { Calendar, CalendarIcon, Upload, Edit2, Users, FileText, CheckCircle2, Loader2, Plus, Trash2, Info } from 'lucide-react';
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
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { useAuthRequiredSubmit } from '@/hooks/useAuthRequiredSubmit';
import SuccessModal from '@/components/common/SuccessModal';

// Group Personal Accident Claim Schema
const groupPersonalAccidentClaimSchema = yup.object().shape({
  // Policy Details
  policyNumber: yup.string().required("Policy number is required"),
  periodOfCoverFrom: yup.date().required("Period of cover from is required"),
  periodOfCoverTo: yup.date().required("Period of cover to is required"),

  // Insured Details
  companyName: yup.string().required("Company name is required"),
  address: yup.string().required("Address is required"),
  phone: yup.string().required("Phone number is required"),
  email: yup.string().email("Valid email is required").required("Email is required"),

  // Accident Details
  accidentDate: yup.date().required("Accident date is required"),
  accidentTime: yup.string().required("Accident time is required"),
  accidentPlace: yup.string().required("Accident place is required"),
  incidentDescription: yup.string().required("Incident description is required"),
  particularsOfInjuries: yup.string().required("Particulars of injuries is required"),

  // Doctor Details
  doctorName: yup.string().required("Doctor name is required"),
  doctorAddress: yup.string().required("Doctor address is required"),
  isUsualDoctor: yup.boolean(),

  // Incapacity Details - at least one period must be filled
  totalIncapacityFrom: yup.string().when(['totalIncapacityTo', 'partialIncapacityFrom', 'partialIncapacityTo'], {
    is: (totalTo: any, partialFrom: any, partialTo: any) => !totalTo && !partialFrom && !partialTo,
    then: (schema) => schema.required("At least one incapacity period must be provided"),
    otherwise: (schema) => schema
  }),
  totalIncapacityTo: yup.string(),
  partialIncapacityFrom: yup.string(),
  partialIncapacityTo: yup.string(),

  // Other Insurer Details - required fields
  otherInsurerName: yup.string().required("Other insurer name is required"),
  otherInsurerAddress: yup.string().required("Other insurer address is required"),
  otherPolicyNumber: yup.string(),

  // Witnesses
  witnesses: yup.array().of(
    yup.object().shape({
      name: yup.string().required("Witness name is required"),
      address: yup.string().required("Witness address is required")
    })
  ),

  // Declaration
  agreeToDataPrivacy: yup.boolean().oneOf([true], 'You must agree to data privacy'),
  declarationTrue: yup.boolean().oneOf([true], 'You must confirm the declaration is true'),
  signature: yup.string().required('Signature is required'),
});

interface Witness {
  name: string;
  address: string;
}

interface GroupPersonalAccidentClaimData {
  // Policy Details
  policyNumber: string;
  periodOfCoverFrom: Date;
  periodOfCoverTo: Date;

  // Insured Details
  companyName: string;
  address: string;
  phone: string;
  email: string;

  // Accident Details
  accidentDate: Date;
  accidentTime: string;
  accidentPlace: string;
  incidentDescription: string;
  particularsOfInjuries: string;

  // Doctor Details
  doctorName: string;
  doctorAddress: string;
  isUsualDoctor: boolean;
  totalIncapacityFrom?: string;
  totalIncapacityTo?: string;
  partialIncapacityFrom?: string;
  partialIncapacityTo?: string;

  // Other Insurer
  otherInsurerName?: string;
  otherInsurerAddress?: string;
  otherPolicyNumber?: string;

  // Witnesses
  witnesses: Witness[];

  // Declaration
  agreeToDataPrivacy: boolean;
  declarationTrue: boolean;
  signature: string;
}

// Form field components with validation (defined outside main component to prevent focus loss)
const FormFieldComponent = ({ name, label, required = false, type = "text", maxLength, ...props }: any) => {
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

const FormTextareaComponent = ({ name, label, required = false, maxLength = 2500, ...props }: any) => {
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

const FormSelectComponent = ({ name, label, required = false, options, placeholder, children, ...props }: any) => {
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

const FormDatePickerComponent = ({ name, label, required = false }: any) => {
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

const defaultValues: Partial<GroupPersonalAccidentClaimData> = {
  policyNumber: '',
  companyName: '',
  address: '',
  phone: '',
  email: '',
  accidentTime: '',
  accidentPlace: '',
  incidentDescription: '',
  particularsOfInjuries: '',
  doctorName: '',
  doctorAddress: '',
  isUsualDoctor: false,
  totalIncapacityFrom: '',
  totalIncapacityTo: '',
  partialIncapacityFrom: '',
  partialIncapacityTo: '',
  otherInsurerName: '',
  otherInsurerAddress: '',
  otherPolicyNumber: '',
  witnesses: [],
  agreeToDataPrivacy: false,
  declarationTrue: false,
  signature: ''
};

const GroupPersonalAccidentClaim: React.FC = () => {
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
    resolver: yupResolver(groupPersonalAccidentClaimSchema),
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

  const { saveDraft, clearDraft } = useFormDraft('groupPersonalAccidentClaim', formMethods);
  const watchedValues = formMethods.watch();

  // Auto-save draft
  useEffect(() => {
    const subscription = formMethods.watch((data) => {
      saveDraft(data);
    });
    return () => subscription.unsubscribe();
  }, [formMethods, saveDraft]);

  // Main submit handler that checks authentication
  const handleSubmit = async (data: GroupPersonalAccidentClaimData) => {
    // Prepare file upload data
    const fileUploadPromises: Array<Promise<[string, string]>> = [];
    
    for (const [key, file] of Object.entries(uploadedFiles)) {
      if (file) {
        fileUploadPromises.push(
          uploadFile(file, `group-personal-accident-claims/${Date.now()}-${file.name}`).then(url => [key, url])
        );
      }
    }

    const fileResults = await Promise.all(fileUploadPromises);
    const fileUrls = Object.fromEntries(fileResults);

    const finalData = {
      ...data,
      ...fileUrls,
      status: 'processing',
      formType: 'Group Personal Accident Claim'
    };

    await handleSubmitWithAuth(finalData, 'Group Personal Accident Claim');
    clearDraft();
    setShowSummary(false);
  };

  const onFinalSubmit = (data: GroupPersonalAccidentClaimData) => {
    setShowSummary(true);
  };

  // Step field mappings for validation
  const stepFieldMappings = {
    0: ['policyNumber', 'periodOfCoverFrom', 'periodOfCoverTo', 'companyName', 'address', 'phone', 'email'],
    1: ['accidentDate', 'accidentTime', 'accidentPlace', 'incidentDescription', 'particularsOfInjuries'],
    2: ['witnesses', 'doctorName', 'doctorAddress', 'totalIncapacityFrom', 'totalIncapacityTo', 'partialIncapacityFrom', 'partialIncapacityTo', 'otherInsurerName', 'otherInsurerAddress', 'otherPolicyNumber'],
    3: ['agreeToDataPrivacy', 'declarationTrue', 'signature']
  };

  const DatePickerField = ({ name, label }: { name: string; label: string }) => {
    const value = formMethods.watch(name);
    return (
      <TooltipProvider>
        <div className="space-y-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Label className="flex items-center gap-1">
                {label}
                <Info className="h-3 w-3" />
              </Label>
            </TooltipTrigger>
            <TooltipContent>
              <p>Select the {label.toLowerCase()}</p>
            </TooltipContent>
          </Tooltip>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !value && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {value ? format(new Date(value), "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <ReactCalendar
                mode="single"
                selected={value ? new Date(value) : undefined}
                onSelect={(date) => formMethods.setValue(name, date)}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>
      </TooltipProvider>
    );
  };

  const steps = [
    {
      id: 'policy-insured',
      title: 'Policy & Insured Details',
      component: (
        <FormProvider {...formMethods}>
          <div className="space-y-6">
            {/* Policy Details Section */}
            <div className="border rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4">Policy Details</h3>
              <div className="space-y-4">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        <FormFieldComponent name="policyNumber" label="Policy Number" required />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Enter your group personal accident insurance policy number</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <DatePickerField
                    name="periodOfCoverFrom"
                    label="Period of Cover From *"
                  />
                  <DatePickerField
                    name="periodOfCoverTo"
                    label="Period of Cover To *"
                  />
                </div>
              </div>
            </div>

            {/* Insured Details Section */}
            <div className="border rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4">Insured Details</h3>
              <TooltipProvider>
                <div className="space-y-4">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        <FormFieldComponent name="companyName" label="Company Name" required />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Enter the insured company name</p>
                    </TooltipContent>
                  </Tooltip>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        <FormTextareaComponent name="address" label="Address" required placeholder="Enter full address" rows={3} />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Enter the complete address</p>
                    </TooltipContent>
                  </Tooltip>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div>
                          <FormFieldComponent name="phone" label="Phone Number" required />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Enter contact phone number</p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div>
                          <FormFieldComponent name="email" label="Email Address" type="email" required />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Enter email address for correspondence</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              </TooltipProvider>
            </div>
          </div>
        </FormProvider>
      )
    },
    {
      id: 'accident',
      title: 'Details of Loss',
      component: (
        <FormProvider {...formMethods}>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={formMethods.control}
                name="accidentDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Accident Date *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={formMethods.control}
                name="accidentTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time *</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={formMethods.control}
              name="accidentPlace"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Place *</FormLabel>
                  <FormControl>
                    <Input placeholder="Where did the accident occur?" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={formMethods.control}
              name="incidentDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Please describe incident *</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Describe how the incident occurred" rows={4} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={formMethods.control}
              name="particularsOfInjuries"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Particulars of Injuries *</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Describe the injuries sustained" rows={4} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </FormProvider>
      )
    },
    {
      id: 'medical-other',
      title: 'Medical & Other Information',
      component: (
        <FormProvider {...formMethods}>
          <div className="space-y-6">
            {/* Witnesses Section */}
            <div className="border rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4">Witnesses</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label className="text-lg font-semibold">Witnesses</Label>
                  <Button
                    type="button"
                    onClick={() => addWitness({ name: '', address: '' })}
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
                      <h4 className="font-semibold">Witness {index + 1}</h4>
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
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div>
                              <FormFieldComponent name={`witnesses.${index}.name`} label="Witness Name" required placeholder="Enter witness name" />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Enter the full name of the witness</p>
                          </TooltipContent>
                        </Tooltip>
                        
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div>
                              <FormTextareaComponent name={`witnesses.${index}.address`} label="Witness Address" required placeholder="Enter witness address" rows={2} />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Enter the complete address of the witness</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </Card>
                ))}
                
                {witnessFields.length === 0 && (
                  <div className="text-center text-sm text-muted-foreground border p-6 rounded-md">
                    No witnesses added yet. Click "Add Witness" to add witness information.
                  </div>
                )}
              </div>
            </div>

            {/* Doctor Information Section */}
            <div className="border rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4">Doctor Information</h3>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={formMethods.control}
                    name="doctorName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name of doctor *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter doctor's name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={formMethods.control}
                    name="doctorAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address of doctor *</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Enter doctor's address" rows={2} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={formMethods.control}
                  name="isUsualDoctor"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Is this your usual doctor?</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Incapacity Details Section */}
            <div className="border rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4">Incapacity Details</h3>
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium mb-4">Total incapacity period:</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={formMethods.control}
                      name="totalIncapacityFrom"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>From</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={formMethods.control}
                      name="totalIncapacityTo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>To</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-4">Partial incapacity period:</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={formMethods.control}
                      name="partialIncapacityFrom"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>From</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={formMethods.control}
                      name="partialIncapacityTo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>To</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Other Insurers Section */}
            <div className="border rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4">Other Insurers</h3>
              <div className="space-y-6">
                <FormField
                  control={formMethods.control}
                  name="otherInsurerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter other insurer name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={formMethods.control}
                  name="otherInsurerAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address *</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Enter other insurer address" rows={3} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={formMethods.control}
                  name="otherPolicyNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Policy Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter policy number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
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
            
            <FormField
              control={formMethods.control}
              name="signature"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Digital Signature *</FormLabel>
                  <FormControl>
                    <Input placeholder="Type your full name as signature" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                <Users className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight mb-2">Group Personal Accident Claim Form</h1>
              <p className="text-muted-foreground">
                Please provide accurate information about your group personal accident insurance claim
              </p>
            </div>

            <Card className="shadow-xl border-0 bg-white/50 backdrop-blur-sm">

              <CardContent>
                <MultiStepForm
                  steps={steps}
                  onSubmit={onFinalSubmit}
                  formMethods={formMethods}
                  submitButtonText="Submit Group Personal Accident Claim"
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
          title="Group Personal Accident Claim Submitted Successfully!"
          message="Your group personal accident claim has been received and is being processed. You will receive updates via email and SMS."
          formType="Group Personal Accident Claim"
        />
      </div>
    </FormProvider>
  );
};

export default GroupPersonalAccidentClaim;
