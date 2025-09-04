import React, { useState, useEffect } from 'react';
import { useForm, FormProvider, useFormContext } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { get } from 'lodash';
import MultiStepForm from '@/components/common/MultiStepForm';
import FormSection from '@/components/common/FormSection';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { CheckCircle2, Loader2, FileText, Info } from 'lucide-react';
import { useFormDraft } from '@/hooks/useFormDraft';
import { uploadFile } from '@/services/fileService';
import { useAuthRequiredSubmit } from '@/hooks/useAuthRequiredSubmit';
import SuccessModal from '@/components/common/SuccessModal';
import FileUpload from '@/components/common/FileUpload';
import { cn } from '@/lib/utils';

interface FidelityGuaranteeClaimData {
  // Policy Details
  policyNumber: string;
  periodOfCoverFrom: Date;
  periodOfCoverTo: Date;
  
  // Insured Details
  companyName: string;
  address: string;
  phone: string;
  email: string;
  
  // Details of Defaulter
  defaulterName: string;
  defaulterAge: number;
  defaulterAddress: string;
  defaulterOccupation: string;
  dateOfDiscovery: Date;
  
  // Details of Default
  defaultDetails: string;
  defaultAmount: number;
  hasPreviousIrregularity: boolean;
  previousIrregularityDetails: string;
  lastCorrectCheckDate: Date;
  hasDefaulterProperty: boolean;
  defaulterPropertyDetails: string;
  hasRemunerationDue: boolean;
  remunerationDetails: string;
  hasOtherSecurity: boolean;
  otherSecurityDetails: string;
  
  // Employment Status
  hasBeenDischarged: boolean;
  dischargeDate: Date;
  hasSettlementProposal: boolean;
  settlementProposalDetails: string;
  
  // Declaration
  agreeToDataPrivacy: boolean;
  declarationTrue: boolean;
  signature: string;
}

const schema = yup.object().shape({
  policyNumber: yup.string().required('Policy number is required'),
  periodOfCoverFrom: yup.date().required('Period of cover start date is required'),
  periodOfCoverTo: yup.date().required('Period of cover end date is required'),
  companyName: yup.string().required('Company name is required'),
  address: yup.string().required('Address is required'),
  phone: yup.string().required('Phone number is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  defaulterName: yup.string().required('Defaulter name is required'),
  defaulterAge: yup.number().min(1, 'Age must be positive').required('Defaulter age is required'),
  defaulterAddress: yup.string().required('Defaulter address is required'),
  defaulterOccupation: yup.string().required('Defaulter occupation is required'),
  dateOfDiscovery: yup.date().required('Date of discovery is required'),
  defaultDetails: yup.string().required('Default details are required'),
  defaultAmount: yup.number().min(0, 'Amount must be positive').required('Default amount is required'),
  lastCorrectCheckDate: yup.date().required('Last correct check date is required'),
  previousIrregularityDetails: yup.string().when('hasPreviousIrregularity', {
    is: true,
    then: (schema) => schema.required('Please explain the previous irregularity'),
    otherwise: (schema) => schema.notRequired()
  }),
  defaulterPropertyDetails: yup.string().when('hasDefaulterProperty', {
    is: true,
    then: (schema) => schema.required('Please provide property details'),
    otherwise: (schema) => schema.notRequired()
  }),
  remunerationDetails: yup.string().when('hasRemunerationDue', {
    is: true,
    then: (schema) => schema.required('Please provide remuneration details'),
    otherwise: (schema) => schema.notRequired()
  }),
  otherSecurityDetails: yup.string().when('hasOtherSecurity', {
    is: true,
    then: (schema) => schema.required('Please provide other security details'),
    otherwise: (schema) => schema.notRequired()
  }),
  dischargeDate: yup.date().when('hasBeenDischarged', {
    is: true,
    then: (schema) => schema.required('Please provide discharge date'),
    otherwise: (schema) => schema.notRequired()
  }),
  settlementProposalDetails: yup.string().when('hasSettlementProposal', {
    is: true,
    then: (schema) => schema.required('Please provide settlement proposal details'),
    otherwise: (schema) => schema.notRequired()
  }),
  agreeToDataPrivacy: yup.boolean().oneOf([true], 'You must agree to data privacy'),
  declarationTrue: yup.boolean().oneOf([true], 'You must confirm the declaration is true'),
  signature: yup.string().required('Signature is required'),
});

// Form field components with validation
const FormField = ({ name, label, required = false, type = "text", maxLength, ...props }: any) => {
  const { register, formState: { errors }, clearErrors } = useFormContext();
  const error = get(errors, name);
  
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
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

const FormTextarea = ({ name, label, required = false, maxLength = 2500, rows = 3, ...props }: any) => {
  const { register, watch, formState: { errors }, clearErrors } = useFormContext();
  const currentValue = watch(name) || '';
  const error = get(errors, name);
  
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <Textarea
        id={name}
        rows={rows}
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

const FormDatePicker = ({ name, label, required = false }: any) => {
  const { setValue, watch, formState: { errors }, clearErrors } = useFormContext();
  const value = watch(name);
  const error = get(errors, name);
  
  return (
    <div className="space-y-2">
      <Label>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
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

const YesNoCheckbox = ({ name, label, required = false }: any) => {
  const { setValue, watch, formState: { errors }, clearErrors } = useFormContext();
  const value = watch(name);
  const error = get(errors, name);
  
  return (
    <div className="space-y-2">
      <Label>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <div className="flex items-center space-x-4 mt-2">
        <div className="flex items-center space-x-2">
          <Checkbox
            id={`${name}Yes`}
            checked={value === true}
            onCheckedChange={(checked) => {
              setValue(name, !!checked);
              if (error) {
                clearErrors(name);
              }
            }}
          />
          <Label htmlFor={`${name}Yes`}>Yes</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id={`${name}No`}
            checked={value === false}
            onCheckedChange={(checked) => {
              setValue(name, !checked);
              if (error) {
                clearErrors(name);
              }
            }}
          />
          <Label htmlFor={`${name}No`}>No</Label>
        </div>
      </div>
      {error && (
        <p className="text-sm text-destructive mt-1">{error.message?.toString()}</p>
      )}
    </div>
  );
};

const defaultValues: Partial<FidelityGuaranteeClaimData> = {
  policyNumber: '',
  companyName: '',
  address: '',
  phone: '',
  email: '',
  defaulterName: '',
  defaulterAge: 0,
  defaulterAddress: '',
  defaulterOccupation: '',
  defaultDetails: '',
  defaultAmount: 0,
  hasPreviousIrregularity: false,
  previousIrregularityDetails: '',
  hasDefaulterProperty: false,
  defaulterPropertyDetails: '',
  hasRemunerationDue: false,
  remunerationDetails: '',
  hasOtherSecurity: false,
  otherSecurityDetails: '',
  hasBeenDischarged: false,
  hasSettlementProposal: false,
  settlementProposalDetails: '',
  agreeToDataPrivacy: false,
  declarationTrue: false,
  signature: ''
};

const FidelityGuaranteeClaim: React.FC = () => {
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

  const formMethods = useForm<any>({
    resolver: yupResolver(schema),
    defaultValues,
    mode: 'onChange'
  });

  // Make toast available globally for MultiStepForm
  useEffect(() => {
    (window as any).toast = toast;
  }, [toast]);

  const watchedValues = formMethods.watch();
  const { saveDraft, clearDraft } = useFormDraft('fidelityGuaranteeClaim', formMethods);

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

  const handleSubmit = async (data: FidelityGuaranteeClaimData) => {
    // Prepare file upload data
    const fileUploadPromises: Array<Promise<[string, string]>> = [];
    
    for (const [key, file] of Object.entries(uploadedFiles)) {
      if (file) {
        fileUploadPromises.push(
          uploadFile(file, `fidelity-guarantee-claims/${Date.now()}-${file.name}`).then(url => [key, url])
        );
      }
    }

    const fileResults = await Promise.all(fileUploadPromises);
    const fileUrls = Object.fromEntries(fileResults);

    const finalData = {
      ...data,
      ...fileUrls,
      status: 'processing',
      formType: 'Fidelity Guarantee Claim'
    };

    await handleSubmitWithAuth(finalData, 'Fidelity Guarantee Claim');
    clearDraft();
    setShowSummary(false);
  };

  const onFinalSubmit = (data: FidelityGuaranteeClaimData) => {
    setShowSummary(true);
  };

  // Step field mappings for validation
  const stepFieldMappings = {
    0: ['policyNumber', 'periodOfCoverFrom', 'periodOfCoverTo', 'companyName', 'address', 'phone', 'email'],
    1: ['defaulterName', 'defaulterAge', 'defaulterAddress', 'defaulterOccupation', 'dateOfDiscovery'],
    2: ['defaultDetails', 'defaultAmount', 'hasPreviousIrregularity', 'previousIrregularityDetails', 'lastCorrectCheckDate', 'hasDefaulterProperty', 'defaulterPropertyDetails', 'hasRemunerationDue', 'remunerationDetails', 'hasOtherSecurity', 'otherSecurityDetails', 'hasBeenDischarged', 'dischargeDate', 'hasSettlementProposal', 'settlementProposalDetails'],
    3: ['agreeToDataPrivacy', 'declarationTrue', 'signature']
  };

  const steps = [
    {
      id: "policy-insured",
      title: "Policy & Insured Details",
      component: (
        <FormProvider {...formMethods}>
          <div className="space-y-6">
            {/* Policy Details Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-primary border-b pb-2">Policy Information</h3>
              <FormField name="policyNumber" label="Policy Number" required placeholder="Enter policy number" />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormDatePicker name="periodOfCoverFrom" label="Period of Cover From" required />
                <FormDatePicker name="periodOfCoverTo" label="Period of Cover To" required />
              </div>
            </div>

            {/* Insured Details Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-primary border-b pb-2">Insured Information</h3>
              <FormField name="companyName" label="Company Name" required placeholder="Enter company name" />

              <FormTextarea name="address" label="Address" required placeholder="Enter company address" rows={3} />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField name="phone" label="Phone Number" required placeholder="Enter phone number" />
                <FormField name="email" label="Email Address" type="email" required placeholder="Enter email address" />
              </div>
            </div>
          </div>
        </FormProvider>
      ),
    },
    {
      id: "defaulter-details",
      title: "Details of Defaulter",
      component: (
        <FormProvider {...formMethods}>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField name="defaulterName" label="Name" required placeholder="Enter defaulter's name" />
              <FormField name="defaulterAge" label="Age" type="number" required placeholder="Enter age" />
            </div>

            <FormTextarea name="defaulterAddress" label="Present Address" required placeholder="Enter defaulter's current address" rows={3} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField name="defaulterOccupation" label="Occupation" required placeholder="Enter occupation" />
              <FormDatePicker name="dateOfDiscovery" label="Date of Discovery of Default" required />
            </div>
          </div>
        </FormProvider>
      ),
    },
    {
      id: "default-employment",
      title: "Default Details & Employment Status",
      component: (
        <FormProvider {...formMethods}>
          <div className="space-y-6">
            {/* Default Details Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-primary border-b pb-2">Details of Default</h3>
              <FormTextarea 
                name="defaultDetails" 
                label="How long, and in what manner, has the default been carried out and concealed?" 
                required 
                placeholder="Provide detailed explanation of the default"
                rows={4} 
              />

              <FormField 
                name="defaultAmount" 
                label="Amount of the Default (₦)" 
                type="number" 
                step="0.01" 
                required 
                placeholder="0.00" 
              />

              <YesNoCheckbox name="hasPreviousIrregularity" label="Previous irregularity in accounts?" required />

              {watchedValues.hasPreviousIrregularity === true && (
                <FormTextarea 
                  name="previousIrregularityDetails" 
                  label="Please Explain" 
                  required 
                  placeholder="Provide details about previous irregularities"
                  rows={3} 
                />
              )}

              <FormDatePicker name="lastCorrectCheckDate" label="On what date was the account last checked and found correct?" required />

              <YesNoCheckbox name="hasDefaulterProperty" label="Any property/furniture of the defaulter known?" required />

              {watchedValues.hasDefaulterProperty === true && (
                <FormTextarea 
                  name="defaulterPropertyDetails" 
                  label="Please Provide Details" 
                  required 
                  placeholder="Describe the property/furniture"
                  rows={3} 
                />
              )}

              <YesNoCheckbox name="hasRemunerationDue" label="Any salary, commission or other remuneration due to defaulter?" required />

              {watchedValues.hasRemunerationDue === true && (
                <FormTextarea 
                  name="remunerationDetails" 
                  label="Please Provide Details" 
                  required 
                  placeholder="Describe the remuneration due"
                  rows={3} 
                />
              )}

              <YesNoCheckbox name="hasOtherSecurity" label="Other security in addition to the guarantee?" required />

              {watchedValues.hasOtherSecurity === true && (
                <FormTextarea 
                  name="otherSecurityDetails" 
                  label="Please Provide Details" 
                  required 
                  placeholder="Describe the other security"
                  rows={3} 
                />
              )}
            </div>

            {/* Employment Status Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-primary border-b pb-2">Employment Status</h3>
              <YesNoCheckbox name="hasBeenDischarged" label="Has the defaulter been discharged?" required />

              {watchedValues.hasBeenDischarged === true && (
                <FormDatePicker name="dischargeDate" label="Date of Discharge" required />
              )}

              <YesNoCheckbox name="hasSettlementProposal" label="Has a proposal for settlement been put forward?" required />

              {watchedValues.hasSettlementProposal === true && (
                <FormTextarea 
                  name="settlementProposalDetails" 
                  label="Please Provide Details" 
                  required 
                  placeholder="Describe the settlement proposal"
                  rows={4} 
                />
              )}
            </div>
          </div>
        </FormProvider>
      ),
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
                checked={watchedValues.agreeToDataPrivacy || false}
                onCheckedChange={(checked) => {
                  formMethods.setValue('agreeToDataPrivacy', !!checked);
                  if (formMethods.formState.errors.agreeToDataPrivacy) {
                    formMethods.clearErrors('agreeToDataPrivacy');
                  }
                }}
                className={cn(formMethods.formState.errors.agreeToDataPrivacy && "border-destructive")}
              />
              <Label htmlFor="agreeToDataPrivacy">
                I agree to the data privacy terms <span className="text-red-500 ml-1">*</span>
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
                checked={watchedValues.declarationTrue || false}
                onCheckedChange={(checked) => {
                  formMethods.setValue('declarationTrue', !!checked);
                  if (formMethods.formState.errors.declarationTrue) {
                    formMethods.clearErrors('declarationTrue');
                  }
                }}
                className={cn(formMethods.formState.errors.declarationTrue && "border-destructive")}
              />
              <Label htmlFor="declarationTrue">
                I agree that statements are true <span className="text-red-500 ml-1">*</span>
              </Label>
            </div>
            {formMethods.formState.errors.declarationTrue && (
              <p className="text-sm text-destructive">
                {formMethods.formState.errors.declarationTrue.message?.toString()}
              </p>
            )}
            
            <FormField name="signature" label="Signature of policyholder (digital signature)" required placeholder="Type your full name as signature" />
            
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
        {/* Post-auth loading overlay */}
        {showPostAuthLoading && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 flex flex-col items-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-lg font-semibold">Completing your submission...</p>
              <p className="text-sm text-muted-foreground text-center">Please wait while we process your claim.</p>
            </div>
          </div>
        )}

        <div className="container mx-auto py-8 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
                <FileText className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight mb-2">Fidelity Guarantee Claim Form</h1>
              <p className="text-muted-foreground">
                Please provide accurate information about your fidelity guarantee claim
              </p>
            </div>

            <Card className="shadow-xl border-0 bg-white/50 backdrop-blur-sm">
              <CardHeader className="text-center pb-2">
                <CardTitle className="flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  Fidelity Guarantee Claim
                </CardTitle>
              </CardHeader>
              <CardContent>
                <MultiStepForm
                  steps={steps}
                  onSubmit={onFinalSubmit}
                  formMethods={formMethods}
                  submitButtonText="Submit Claim"
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
              <DialogTitle>Confirm Your Fidelity Guarantee Claim Submission</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Policy Number:</span>
                  <p>{watchedValues.policyNumber}</p>
                </div>
                <div>
                  <span className="font-medium">Company Name:</span>
                  <p>{watchedValues.companyName}</p>
                </div>
                <div>
                  <span className="font-medium">Defaulter Name:</span>
                  <p>{watchedValues.defaulterName}</p>
                </div>
                <div>
                  <span className="font-medium">Default Amount:</span>
                  <p>₦{watchedValues.defaultAmount?.toLocaleString()}</p>
                </div>
                <div>
                  <span className="font-medium">Email:</span>
                  <p>{watchedValues.email}</p>
                </div>
                <div>
                  <span className="font-medium">Phone:</span>
                  <p>{watchedValues.phone}</p>
                </div>
              </div>
              <div>
                <span className="font-medium">Default Details:</span>
                <p className="text-sm mt-1">{watchedValues.defaultDetails}</p>
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

        <SuccessModal
          isOpen={authShowSuccess}
          onClose={() => setAuthShowSuccess()}
          title="Claim Submitted Successfully!"
          message="Your fidelity guarantee claim has been submitted successfully. You will receive a confirmation email shortly."
          formType="Fidelity Guarantee Claim"
        />
      </div>
    </FormProvider>
  );
};

export default FidelityGuaranteeClaim;
