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
import { FileText, Shield, CalendarIcon, CheckCircle2, Plus, Trash2, Loader2, Info } from 'lucide-react';
import { format } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import MultiStepForm from '@/components/common/MultiStepForm';
import { useFormDraft } from '@/hooks/useFormDraft';
import FileUpload from '@/components/common/FileUpload';
import { uploadFile } from '@/services/fileService';
import { useAuthRequiredSubmit } from '@/hooks/useAuthRequiredSubmit';
import SuccessModal from '@/components/common/SuccessModal';

// Public Liability Schema - Complete validation for all fields
const publicLiabilitySchema = yup.object().shape({
  // Policy Details
  policyNumber: yup.string().required('Policy number is required'),
  coverageFromDate: yup.date().required('Coverage from date is required'),
  coverageToDate: yup.date().required('Coverage to date is required'),
  
  // Insured Details
  companyName: yup.string(), // Optional field
  address: yup.string().required('Address is required'),
  phone: yup.string().required('Phone number is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  
  // Loss Details
  accidentDate: yup.date().required('Accident date is required'),
  accidentTime: yup.string().required('Accident time is required'),
  accidentPlace: yup.string().required('Place of accident is required'),
  accidentDetails: yup.string().required('Accident details are required'),
  witnesses: yup.array().of(yup.object().shape({
    name: yup.string().required('Witness name is required'),
    address: yup.string().required('Witness address is required'),
    isEmployee: yup.string().required('Please specify if witness is employee or independent')
  })),
  employeeActivity: yup.string().required('Employee activity details are required'),
  responsiblePersonName: yup.string().required('Responsible person name is required'),
  responsiblePersonAddress: yup.string().required('Responsible person address is required'),
  responsibleEmployer: yup.string(), // Optional
  
  // Police and Insurance
  policeInvolved: yup.string().required('Please specify if police were involved'),
  policeStation: yup.string().when('policeInvolved', {
    is: 'yes',
    then: (schema) => schema.required('Police station is required'),
    otherwise: (schema) => schema.notRequired()
  }),
  officerNumber: yup.string().when('policeInvolved', {
    is: 'yes',
    then: (schema) => schema.required('Officer number is required'),
    otherwise: (schema) => schema.notRequired()
  }),
  otherInsurance: yup.string().required('Please specify if you have other insurance'),
  otherInsuranceDetails: yup.string().when('otherInsurance', {
    is: 'yes',
    then: (schema) => schema.required('Other insurance details are required'),
    otherwise: (schema) => schema.notRequired()
  }),
  
  // Claimant
  claimantName: yup.string().required('Claimant name is required'),
  claimantAddress: yup.string().required('Claimant address is required'),
  injuryNature: yup.string().required('Nature of injury is required'),
  claimNoticeReceived: yup.string().required('Please specify if claim notice was received'),
  noticeFrom: yup.string().when('claimNoticeReceived', {
    is: 'yes',
    then: (schema) => schema.required('Notice from is required'),
    otherwise: (schema) => schema.notRequired()
  }),
  noticeWhen: yup.date().when('claimNoticeReceived', {
    is: 'yes',
    then: (schema) => schema.required('Notice when is required'),
    otherwise: (schema) => schema.notRequired()
  }),
  noticeForm: yup.string().when('claimNoticeReceived', {
    is: 'yes',
    then: (schema) => schema.required('Notice form is required'),
    otherwise: (schema) => schema.notRequired()
  }),
  
  // Declaration
  agreeToDataPrivacy: yup.boolean().oneOf([true], 'You must agree to data privacy'),
  declarationTrue: yup.boolean().oneOf([true], 'You must confirm the declaration is true'),
  signature: yup.string().required('Signature is required'),
});

interface Witness {
  name: string;
  address: string;
  isEmployee: 'employee' | 'independent';
}

interface PublicLiabilityClaimData {
  policyNumber: string;
  coverageFromDate: Date;
  coverageToDate: Date;
  companyName?: string;
  address: string;
  phone: string;
  email: string;
  accidentDate: Date;
  accidentTime: string;
  accidentPlace: string;
  accidentDetails: string;
  witnesses: Witness[];
  employeeActivity: string;
  responsiblePersonName: string;
  responsiblePersonAddress: string;
  responsibleEmployer?: string;
  policeInvolved: 'yes' | 'no';
  policeStation?: string;
  officerNumber?: string;
  otherInsurance: 'yes' | 'no';
  otherInsuranceDetails?: string;
  claimantName: string;
  claimantAddress: string;
  injuryNature: string;
  claimNoticeReceived: 'yes' | 'no';
  noticeFrom?: string;
  noticeWhen?: Date;
  noticeForm?: string;
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
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !value && "text-muted-foreground",
              error && "border-destructive"
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
            onSelect={(date) => {
              setValue(name, date);
              if (error) {
                clearErrors(name);
              }
            }}
            initialFocus
            className="pointer-events-auto"
          />
        </PopoverContent>
      </Popover>
      {error && (
        <p className="text-sm text-destructive">{error.message?.toString()}</p>
      )}
    </div>
  );
};

const defaultValues: Partial<PublicLiabilityClaimData> = {
  policyNumber: '',
  companyName: '',
  address: '',
  phone: '',
  email: '',
  accidentTime: '',
  accidentPlace: '',
  accidentDetails: '',
  witnesses: [{ name: '', address: '', isEmployee: 'independent' }],
  employeeActivity: '',
  responsiblePersonName: '',
  responsiblePersonAddress: '',
  responsibleEmployer: '',
  policeInvolved: 'no',
  policeStation: '',
  officerNumber: '',
  otherInsurance: 'no',
  otherInsuranceDetails: '',
  claimantName: '',
  claimantAddress: '',
  injuryNature: '',
  claimNoticeReceived: 'no',
  noticeFrom: '',
  noticeForm: '',
  agreeToDataPrivacy: false,
  declarationTrue: false,
  signature: ''
};

const PublicLiabilityClaimForm: React.FC = () => {
  const { toast } = useToast();
  const [showSummary, setShowSummary] = useState(false);
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
    resolver: yupResolver(publicLiabilitySchema),
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

  const { saveDraft, clearDraft } = useFormDraft('publicLiability', formMethods);
  const watchedValues = formMethods.watch();

  // Auto-save draft
  useEffect(() => {
    const subscription = formMethods.watch((data) => {
      saveDraft(data);
    });
    return () => subscription.unsubscribe();
  }, [formMethods, saveDraft]);

  // Main submit handler that checks authentication
  const handleSubmit = async (data: PublicLiabilityClaimData) => {
    // Prepare file upload data
    const fileUploadPromises: Array<Promise<[string, string]>> = [];
    
    for (const [key, file] of Object.entries(uploadedFiles)) {
      if (file) {
        fileUploadPromises.push(
          uploadFile(file, `public-liability-claims/${Date.now()}-${file.name}`).then(url => [key, url])
        );
      }
    }

    const fileResults = await Promise.all(fileUploadPromises);
    const fileUrls = Object.fromEntries(fileResults);

    const finalData = {
      ...data,
      ...fileUrls,
      status: 'processing',
      formType: 'Public Liability Claim'
    };

    await handleSubmitWithAuth(finalData, 'Public Liability Claim');
    clearDraft();
    setShowSummary(false);
  };

  const onFinalSubmit = (data: PublicLiabilityClaimData) => {
    setShowSummary(true);
  };

  // Step field mappings for validation
  const stepFieldMappings = {
    0: ['policyNumber', 'coverageFromDate', 'coverageToDate'],
    1: ['address', 'phone', 'email'], // companyName is optional
    2: ['accidentDate', 'accidentTime', 'accidentPlace', 'accidentDetails', 'witnesses', 'employeeActivity', 'responsiblePersonName', 'responsiblePersonAddress'],
    3: ['policeInvolved', 'policeStation', 'officerNumber', 'otherInsurance', 'otherInsuranceDetails'],
    4: ['claimantName', 'claimantAddress', 'injuryNature', 'claimNoticeReceived', 'noticeFrom', 'noticeWhen', 'noticeForm'],
    5: ['agreeToDataPrivacy', 'declarationTrue', 'signature']
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
              <FormDatePicker name="coverageFromDate" label="Period of Cover - From" required />
              <FormDatePicker name="coverageToDate" label="Period of Cover - To" required />
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
            <FormField name="companyName" label="Company Name (if applicable)" />
            <FormTextarea name="address" label="Address" required />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField name="phone" label="Phone" required />
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
              <FormDatePicker name="accidentDate" label="Date of Accident" required />
              <FormField name="accidentTime" label="Time of Accident" type="time" required />
            </div>
            
            <FormField name="accidentPlace" label="Place where accident occurred" required />
            <FormTextarea name="accidentDetails" label="Full details of how accident occurred" required rows={4} />
            
            <div>
              <div className="flex items-center justify-between mb-4">
                <Label>Names & addresses of all witnesses</Label>
                <Button
                  type="button"
                  onClick={() => addWitness({ name: '', address: '', isEmployee: 'independent' })}
                  className="flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Witness</span>
                </Button>
              </div>
              
              {witnessFields.map((field, index) => (
                <Card key={field.id} className="p-4 mb-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium">Witness {index + 1}</h4>
                    {witnessFields.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeWitness(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField name={`witnesses.${index}.name`} label="Name" required />
                      <FormSelect name={`witnesses.${index}.isEmployee`} label="Is employee or independent?" required placeholder="Select status">
                        <SelectItem value="employee">Employee</SelectItem>
                        <SelectItem value="independent">Independent</SelectItem>
                      </FormSelect>
                    </div>
                    <FormTextarea name={`witnesses.${index}.address`} label="Address" required />
                  </div>
                </Card>
              ))}
            </div>
            
            <FormTextarea name="employeeActivity" label="What Work were you or your employees engaged to do?" required rows={3} />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField name="responsiblePersonName" label="Name of person who caused accident" required />
              <FormTextarea name="responsiblePersonAddress" label="Address of person who caused accident" required />
            </div>
            
            <FormTextarea name="responsibleEmployer" label="Name/address of that person's employer (if other than insured)" />
          </div>
        </FormProvider>
      )
    },
    {
      id: 'police',
      title: 'Police and Other Insurances',
      component: (
        <FormProvider {...formMethods}>
          <div className="space-y-4">
            <FormSelect name="policeInvolved" label="Were particulars taken by police?" required placeholder="Select">
              <SelectItem value="yes">Yes</SelectItem>
              <SelectItem value="no">No</SelectItem>
            </FormSelect>
            
            {watchedValues.policeInvolved === 'yes' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField name="policeStation" label="Police Station" required />
                <FormField name="officerNumber" label="Officer Number" required />
              </div>
            )}
            
            <FormSelect name="otherInsurance" label="Do you hold other policies covering this accident?" required placeholder="Select">
              <SelectItem value="yes">Yes</SelectItem>
              <SelectItem value="no">No</SelectItem>
            </FormSelect>
            
            {watchedValues.otherInsurance === 'yes' && (
              <FormTextarea name="otherInsuranceDetails" label="Other insurance details" required rows={3} />
            )}
          </div>
        </FormProvider>
      )
    },
    {
      id: 'claimant',
      title: 'Particulars of Possible Claimant',
      component: (
        <FormProvider {...formMethods}>
          <div className="space-y-4">
            <FormField name="claimantName" label="Name" required />
            <FormTextarea name="claimantAddress" label="Address" required />
            <FormTextarea name="injuryNature" label="Nature of injury or damage" required rows={3} />
            
            <FormSelect name="claimNoticeReceived" label="Have you received claim notice?" required placeholder="Select">
              <SelectItem value="yes">Yes</SelectItem>
              <SelectItem value="no">No</SelectItem>
            </FormSelect>
            
            {watchedValues.claimNoticeReceived === 'yes' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField name="noticeFrom" label="From whom" required />
                  <FormDatePicker name="noticeWhen" label="When" required />
                </div>
                <FormField name="noticeForm" label="In what form" required />
                <FileUpload
                  label="Notice Document (if written)"
                  onFileSelect={(file) => setUploadedFiles(prev => ({ ...prev, noticeDocument: file }))}
                  currentFile={uploadedFiles.noticeDocument}
                  accept=".pdf,.jpg,.png"
                  maxSize={3}
                />
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
                <Shield className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight mb-2">Public Liability Claim Form</h1>
              <p className="text-muted-foreground">
                Submit your public liability insurance claim with all required details
              </p>
            </div>

            <Card className="shadow-xl border-0 bg-white/50 backdrop-blur-sm">
            
              <CardContent>
                <MultiStepForm
                  steps={steps}
                  onSubmit={onFinalSubmit}
                  formMethods={formMethods}
                  submitButtonText="Submit Public Liability Claim"
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
                <DialogTitle>Claim Review </DialogTitle>
                <p>Please Ensure all Information is correct before submitting</p>
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
          isOpen={authShowSuccess}
          onClose={() => setAuthShowSuccess()}
          title="Public Liability Claim Submitted!"
          formType="Public Liability Claim"
          isLoading={authSubmitting}
          loadingMessage="Your public liability claim is being processed and submitted..."
        />

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
                  Thank you for signing in! Your public liability claim is now being submitted...
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </FormProvider>
  );
};

export default PublicLiabilityClaimForm;
