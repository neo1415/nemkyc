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
import { useEnhancedFormSubmit } from '@/hooks/useEnhancedFormSubmit';
import FormLoadingModal from '@/components/common/FormLoadingModal';
import FormSummaryDialog from '@/components/common/FormSummaryDialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import SuccessModal from '@/components/common/SuccessModal';

// Motor Claim Schema
const motorClaimSchema = yup.object().shape({
  // Section 1: Insured Detail
  insuredSurname: yup.string().required("Insured surname is required"),
  insuredFirstName: yup.string().required("Insured first name is required"),
  phone: yup.string().required("Phone number is required"),
  email: yup.string().email("Valid email is required").required("Email is required"),

  // Section 2: Vehicle Details
  registrationNumber: yup.string().required("Registration number is required"),
  policyNumber: yup.string().required("Policy number is required"),
  periodOfCoverFrom: yup.date().required("Period of cover from is required"),
  periodOfCoverTo: yup.date().required("Period of cover to is required"),
  trailerAttached: yup.string().required("Trailer attached field is required"),

  // Section 3: Incident Details
  incidentLocation: yup.string().required("Where did the incident occur is required"),
  incidentDate: yup.date().required("Date of incident is required"),
  incidentTime: yup.string().required("Time of incident is required"),
  policeReported: yup.string().required("Was incident reported to police is required"),
  policeStationDetails: yup.string().when('policeReported', {
    is: 'yes',
    then: (schema) => schema.required("Police station details required"),
    otherwise: (schema) => schema.notRequired()
  }),
  incidentDescription: yup.string().required("Full description of how the incident occurred is required"),

  // Other Vehicle (part of incident)
  otherVehicleInvolved: yup.string().required("Was another vehicle involved field is required"),
  otherVehicleRegNumber: yup.string().when('otherVehicleInvolved', {
    is: 'yes',
    then: (schema) => schema.required("Other vehicle registration required"),
    otherwise: (schema) => schema.notRequired()
  }),
  otherVehicleMake: yup.string().when('otherVehicleInvolved', {
    is: 'yes',
    then: (schema) => schema.required("Other vehicle make required"),
    otherwise: (schema) => schema.notRequired()
  }),
  otherDriverName: yup.string().when('otherVehicleInvolved', {
    is: 'yes',
    then: (schema) => schema.required("Other driver name required"),
    otherwise: (schema) => schema.notRequired()
  }),
  otherDriverAddress: yup.string().when('otherVehicleInvolved', {
    is: 'yes',
    then: (schema) => schema.required("Other driver address required"),
    otherwise: (schema) => schema.notRequired()
  }),
  otherVehicleInjuryDamage: yup.string().when('otherVehicleInvolved', {
    is: 'yes',
    then: (schema) => schema.required("Injury or damage to the other vehicle is required"),
    otherwise: (schema) => schema.notRequired()
  }),

  // Eye witnesses (part of incident)
  witnesses: yup.array().of(
    yup.object().shape({
      name: yup.string().required("Eye witness name is required"),
      address: yup.string().required("Eye witness address is required"),
      phone: yup.string().required("Eye witness phone number is required")
    })
  ),

  // Declaration
  agreeToDataPrivacy: yup.boolean().oneOf([true], "You must agree to data privacy"),
  declarationTrue: yup.boolean().oneOf([true], "You must agree that statements are true"),
  signature: yup.string().required("Signature is required")
});

interface Witness {
  name: string;
  address: string;
  phone: string;
}

interface MotorClaimData {
  // Section 1: Insured Detail
  insuredSurname: string;
  insuredFirstName: string;
  phone: string;
  email: string;
  
  // Section 2: Vehicle Details
  registrationNumber: string;
  policyNumber: string;
  periodOfCoverFrom: Date;
  periodOfCoverTo: Date;
  trailerAttached: string;
  
  // Section 3: Incident Details
  incidentLocation: string;
  incidentDate: Date;
  incidentTime: string;
  policeReported: string;
  policeStationDetails?: string;
  incidentDescription: string;
  
  // Other vehicle details (part of incident)
  otherVehicleInvolved: string;
  otherVehicleRegNumber?: string;
  otherVehicleMake?: string;
  otherDriverName?: string;
  otherDriverAddress?: string;
  otherVehicleInjuryDamage?: string;
  
  // Eye witness details (part of incident)
  witnesses: Witness[];
  
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
  // Section 1: Insured Detail
  insuredSurname: '',
  insuredFirstName: '',
  phone: '',
  email: '',
  
  // Section 2: Vehicle Details
  registrationNumber: '',
  policyNumber: '',
  trailerAttached: '',
  
  // Section 3: Incident Details
  incidentLocation: '',
  incidentTime: '',
  policeReported: '',
  policeStationDetails: '',
  incidentDescription: '',
  
  // Other vehicle details
  otherVehicleInvolved: '',
  otherVehicleRegNumber: '',
  otherVehicleMake: '',
  otherDriverName: '',
  otherDriverAddress: '',
  otherVehicleInjuryDamage: '',
  
  // Eye witness details
  witnesses: [],
  
  // Declaration
  agreeToDataPrivacy: false,
  declarationTrue: false,
  signature: ''
};

const MotorClaim: React.FC = () => {
  const { toast } = useToast();
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File>>({});
  const [fileErrors, setFileErrors] = useState<Record<string, string>>({});
  
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
    formType: 'Motor Claim',
    onSuccess: () => clearDraft()
  });

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

  // Main submit handler - shows summary after validation
  const onFinalSubmit = async (data: MotorClaimData) => {
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

    // Use enhanced submit which will show loading immediately
    await handleEnhancedSubmit(finalData);
  };

  // Step field mappings for validation
  const stepFieldMappings = {
    0: ['insuredSurname', 'insuredFirstName', 'phone', 'email'], // Section 1: Insured Detail
    1: ['registrationNumber', 'policyNumber', 'periodOfCoverFrom', 'periodOfCoverTo', 'trailerAttached'], // Section 2: Vehicle Details  
    2: ['incidentLocation', 'incidentDate', 'incidentTime', 'policeReported', 'policeStationDetails', 'incidentDescription', 'otherVehicleInvolved', 'otherVehicleRegNumber', 'otherVehicleMake', 'otherDriverName', 'otherDriverAddress', 'otherVehicleInjuryDamage', 'witnesses'], // Section 3: Incident Details
    3: ['agreeToDataPrivacy', 'declarationTrue', 'signature'] // Declaration
  };

  const steps = [
    {
      id: 'insured-detail',
      title: 'Section 1: Insured Detail',
      component: (
        <FormProvider {...formMethods}>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField name="insuredSurname" label="Insured (Surname first)" required />
              <FormField name="insuredFirstName" label="First Name" required />
            </div>
            <FormField name="phone" label="Phone Number" required />
            <FormField name="email" label="Email Address" required />
          </div>
        </FormProvider>
      )
    },
    {
      id: 'vehicle-details',
      title: 'Section 2: Vehicle Details',
      component: (
        <FormProvider {...formMethods}>
          <div className="space-y-4">
            <FormField name="registrationNumber" label="Registration Number" required />
            <FormField name="policyNumber" label="Policy Number" required />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormDatePicker name="periodOfCoverFrom" label="Period of Cover From" required />
              <FormDatePicker name="periodOfCoverTo" label="Period of Cover To" required />
            </div>
            
            <FormSelect name="trailerAttached" label="Was trailer attached?" required placeholder="Select Yes or No">
              <SelectItem value="yes">Yes</SelectItem>
              <SelectItem value="no">No</SelectItem>
            </FormSelect>
          </div>
        </FormProvider>
      )
    },
    {
      id: 'incident-details',
      title: 'Section 3: Incident Details',
      component: (
        <FormProvider {...formMethods}>
          <div className="space-y-4">
            <FormField name="incidentLocation" label="Where did the incident occur?" required />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormDatePicker name="incidentDate" label="Date of incident" required />
              <FormField name="incidentTime" label="Time of incident" required type="time" />
            </div>
            
            <FormSelect name="policeReported" label="Was incident reported to police?" required placeholder="Select Yes or No">
              <SelectItem value="yes">Yes</SelectItem>
              <SelectItem value="no">No</SelectItem>
            </FormSelect>
            
            {formMethods.watch('policeReported') === 'yes' && (
              <div className="space-y-4 border-l-4 border-blue-500 pl-4">
                <FormTextarea name="policeStationDetails" label="Police Station Details" required />
                
                <FileUpload
                  label="Police Report"
                  onFileSelect={(file) => {
                    setUploadedFiles(prev => ({ ...prev, policeReport: file }));
                    setFileErrors(prev => ({ ...prev, policeReport: '' }));
                  }}
                  onFileRemove={() => {
                    setUploadedFiles(prev => {
                      const copy = { ...prev };
                      delete copy.policeReport;
                      return copy;
                    });
                  }}
                  currentFile={uploadedFiles.policeReport}
                  accept=".pdf,.jpg,.jpeg,.png"
                  maxSize={5}
                  error={fileErrors.policeReport}
                />
                <p className="text-sm text-muted-foreground">
                  Upload police report if available (Optional - PDF, JPG, PNG up to 5MB)
                </p>
              </div>
            )}
            
            <FormTextarea name="incidentDescription" label="Full description of how the incident occurred" required />
            
            <FormSelect name="otherVehicleInvolved" label="Was another vehicle involved?" required placeholder="Select Yes or No">
              <SelectItem value="yes">Yes</SelectItem>
              <SelectItem value="no">No</SelectItem>
            </FormSelect>
            
            {formMethods.watch('otherVehicleInvolved') === 'yes' && (
              <div className="space-y-4 border-l-4 border-primary pl-4">
                <h4 className="font-medium text-primary">Other Vehicle Details</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField name="otherVehicleRegNumber" label="Registration Number" required />
                  <FormField name="otherVehicleMake" label="Make" required />
                </div>
                
                <FormField name="otherDriverName" label="Driver's Name" required />
                <FormTextarea name="otherDriverAddress" label="Driver Address" required />
                <FormTextarea name="otherVehicleInjuryDamage" label="Injury or damage to the other vehicle" required />
                
                <div className="mt-6">
                  <h5 className="font-medium text-primary mb-4">Third Party Information</h5>
                  <FileUpload
                    label="Third Party Vehicle Damage Photos"
                    onFileSelect={(file) => {
                      setUploadedFiles(prev => ({ ...prev, thirdPartyDamagePhotos: file }));
                      setFileErrors(prev => ({ ...prev, thirdPartyDamagePhotos: '' }));
                    }}
                    onFileRemove={() => {
                      setUploadedFiles(prev => {
                        const copy = { ...prev };
                        delete copy.thirdPartyDamagePhotos;
                        return copy;
                      });
                    }}
                    currentFile={uploadedFiles.thirdPartyDamagePhotos}
                    accept=".pdf,.jpg,.jpeg,.png"
                    maxSize={5}
                    error={fileErrors.thirdPartyDamagePhotos}
                  />
                  <p className="text-sm text-muted-foreground mt-2">
                    Upload photos of the third party vehicle damage (Optional - JPG, PNG, PDF up to 5MB)
                  </p>
                </div>
              </div>
            )}
            
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground mb-4">
                Detail of eye witness – Name, Address and Phone Number (optional)
              </div>
              
              {witnessFields.map((witness, index) => (
                <Card key={witness.id} className="p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">Eye Witness {index + 1}</h3>
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
                    <FormField name={`witnesses.${index}.phone`} label="Phone Number" required />
                  </div>
                </Card>
              ))}
              
              <Button
                type="button"
                variant="outline"
                onClick={() => addWitness({
                  name: '',
                  address: '',
                  phone: ''
                })}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Eye Witness
              </Button>
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
    <FormProvider {...formMethods}>
      <div className="min-h-screen bg-white py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-8">
            <Car className="h-12 w-12 text-primary mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Motor Insurance Claim</h1>
            <p className="text-gray-600">Submit your motor insurance claim quickly and easily</p>
          </div>

          <MultiStepForm 
            steps={steps}
            onSubmit={onFinalSubmit}
            stepFieldMappings={stepFieldMappings}
            formMethods={formMethods}
          />
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
          formData={submissionData}
          formType="Motor Claim"
          onConfirm={confirmSubmit}
          isSubmitting={isSubmitting}
          renderSummary={(data) => {
            if (!data) return <div className="text-center py-8 text-gray-500">No data to display</div>;
            
            return (
              <div className="space-y-6">
                {/* Section 1: Insured Details */}
                <div className="border rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-3">Insured Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">Surname:</span>
                    <p className="text-gray-900">{data.insuredSurname || 'Not provided'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">First Name:</span>
                    <p className="text-gray-900">{data.insuredFirstName || 'Not provided'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Phone Number:</span>
                    <p className="text-gray-900">{data.phone || 'Not provided'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Email:</span>
                    <p className="text-gray-900">{data.email || 'Not provided'}</p>
                  </div>
                </div>
              </div>

              {/* Section 2: Vehicle Details */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-3">Vehicle Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">Registration Number:</span>
                    <p className="text-gray-900">{data.registrationNumber || 'Not provided'}</p>
                  </div>
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
                  <div>
                    <span className="font-medium text-gray-600">Trailer Attached:</span>
                    <p className="text-gray-900 capitalize">{data.trailerAttached || 'Not provided'}</p>
                  </div>
                </div>
              </div>

              {/* Section 3: Incident Details */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-3">Incident Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">Incident Location:</span>
                    <p className="text-gray-900">{data.incidentLocation || 'Not provided'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Incident Date:</span>
                    <p className="text-gray-900">{data.incidentDate ? format(new Date(data.incidentDate), 'dd/MM/yyyy') : 'Not provided'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Incident Time:</span>
                    <p className="text-gray-900">{data.incidentTime || 'Not provided'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Police Reported:</span>
                    <p className="text-gray-900 capitalize">{data.policeReported || 'Not provided'}</p>
                  </div>
                  {data.policeReported === 'yes' && (
                    <>
                      <div className="md:col-span-2">
                        <span className="font-medium text-gray-600">Police Station Details:</span>
                        <p className="text-gray-900">{data.policeStationDetails || 'Not provided'}</p>
                      </div>
                      {uploadedFiles.policeReport && (
                        <div className="md:col-span-2">
                          <span className="font-medium text-gray-600">Police Report:</span>
                          <p className="text-gray-900">{uploadedFiles.policeReport.name}</p>
                        </div>
                      )}
                    </>
                  )}
                  <div className="md:col-span-2">
                    <span className="font-medium text-gray-600">Incident Description:</span>
                    <p className="text-gray-900">{data.incidentDescription || 'Not provided'}</p>
                  </div>
                </div>
              </div>

              {/* Other Vehicle Details */}
              {data.otherVehicleInvolved === 'yes' && (
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold text-lg mb-3">Other Vehicle Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-600">Registration Number:</span>
                      <p className="text-gray-900">{data.otherVehicleRegNumber || 'Not provided'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Make:</span>
                      <p className="text-gray-900">{data.otherVehicleMake || 'Not provided'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Driver Name:</span>
                      <p className="text-gray-900">{data.otherDriverName || 'Not provided'}</p>
                    </div>
                    <div className="md:col-span-2">
                      <span className="font-medium text-gray-600">Driver Address:</span>
                      <p className="text-gray-900">{data.otherDriverAddress || 'Not provided'}</p>
                    </div>
                    <div className="md:col-span-2">
                      <span className="font-medium text-gray-600">Injury/Damage to Other Vehicle:</span>
                      <p className="text-gray-900">{data.otherVehicleInjuryDamage || 'Not provided'}</p>
                    </div>
                    {uploadedFiles.thirdPartyDamagePhotos && (
                      <div className="md:col-span-2">
                        <span className="font-medium text-gray-600">Third Party Damage Photos:</span>
                        <p className="text-gray-900">{uploadedFiles.thirdPartyDamagePhotos.name}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Witnesses */}
              {data.witnesses && data.witnesses.length > 0 && (
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold text-lg mb-3">Eye Witnesses</h3>
                  {data.witnesses.map((witness: any, index: number) => (
                    <div key={index} className="border-l-4 border-blue-200 pl-4 mb-4">
                      <h4 className="font-medium text-gray-800 mb-2">Witness {index + 1}</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-600">Name:</span>
                          <p className="text-gray-900">{witness.name || 'Not provided'}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">Phone:</span>
                          <p className="text-gray-900">{witness.phone || 'Not provided'}</p>
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
          title="Motor Claim Submitted Successfully!"
          message="Your entry is successful with a copy sent to your email address. Our claim team will contact you shortly through your email or phone number."
          formType="Motor Claim"
        />
      </div>
    </FormProvider>
  );
};

export default MotorClaim;
