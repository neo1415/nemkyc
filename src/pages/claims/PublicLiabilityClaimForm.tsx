import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
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
import { FileText, User, Shield, Signature, CalendarIcon, CheckCircle2, AlertCircle, Plus, Trash2, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import MultiStepForm from '@/components/common/MultiStepForm';
import { useFormDraft } from '@/hooks/useFormDraft';
import FileUpload from '@/components/common/FileUpload';
import { uploadFile } from '@/services/fileService';
import { db } from '@/firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { sendEmail } from '@/services/emailService';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthRequiredSubmit } from '@/hooks/useAuthRequiredSubmit';
import AuthRequiredSubmit from '@/components/common/AuthRequiredSubmit';
import SuccessModal from '@/components/common/SuccessModal';

const publicLiabilitySchema = yup.object().shape({
  // Policy Details
  policyNumber: yup.string().required('Policy number is required'),
  coverageFromDate: yup.date().required('Coverage from date is required'),
  coverageToDate: yup.date().required('Coverage to date is required'),
  
  // Insured Details
  companyName: yup.string(),
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
  responsibleEmployer: yup.string(),
  
  // Police and Insurance
  policeInvolved: yup.string().required('Please specify if police were involved'),
  policeStation: yup.string().when('policeInvolved', {
    is: 'yes',
    then: (schema) => schema.required('Police station is required')
  }),
  officerNumber: yup.string().when('policeInvolved', {
    is: 'yes',
    then: (schema) => schema.required('Officer number is required')
  }),
  otherInsurance: yup.string().required('Please specify if you have other insurance'),
  otherInsuranceDetails: yup.string().when('otherInsurance', {
    is: 'yes',
    then: (schema) => schema.required('Other insurance details are required')
  }),
  
  // Claimant
  claimantName: yup.string().required('Claimant name is required'),
  claimantAddress: yup.string().required('Claimant address is required'),
  injuryNature: yup.string().required('Nature of injury is required'),
  claimNoticeReceived: yup.string().required('Please specify if claim notice was received'),
  noticeFrom: yup.string().when('claimNoticeReceived', {
    is: 'yes',
    then: (schema) => schema.required('Notice from is required')
  }),
  noticeWhen: yup.date().when('claimNoticeReceived', {
    is: 'yes',
    then: (schema) => schema.required('Notice when is required')
  }),
  noticeForm: yup.string().when('claimNoticeReceived', {
    is: 'yes',
    then: (schema) => schema.required('Notice form is required')
  }),
  
  // Declaration
  agreeToDataPrivacy: yup.boolean().oneOf([true], 'You must agree to data privacy'),
  declarationTrue: yup.boolean().oneOf([true], 'You must confirm the declaration is true'),
  declarationAdditionalInfo: yup.boolean().oneOf([true], 'You must agree to provide additional information'),
  declarationDocuments: yup.boolean().oneOf([true], 'You must agree to submit requested documents'),
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
  declarationAdditionalInfo: boolean;
  declarationDocuments: boolean;
  signature: string;
}

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
  declarationAdditionalInfo: false,
  declarationDocuments: false,
  signature: ''
};

const PublicLiabilityClaimForm: React.FC = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [showSummary, setShowSummary] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPostAuthLoading, setShowPostAuthLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File>>({});
  const [editingField, setEditingField] = useState<string | null>(null);
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
    // resolver: yupResolver(publicLiabilitySchema),
    defaultValues,
    mode: 'onChange'
  });

  const { fields: witnessFields, append: addWitness, remove: removeWitness } = useFieldArray({
    control: formMethods.control,
    name: 'witnesses'
  });

  const { saveDraft, clearDraft } = useFormDraft('publicLiability', formMethods);
  const watchedValues = formMethods.watch();

  // Auto-save draft
  React.useEffect(() => {
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

  const DatePickerField = ({ name, label }: { name: string; label: string }) => {
    const value = formMethods.watch(name);
    return (
      <div className="space-y-2">
        <Label>{label}</Label>
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
    );
  };

  const steps = [
    {
      id: 'policy',
      title: 'Policy Details',
      component: (
        <div className="space-y-4">
          <div>
            <Label htmlFor="policyNumber">Policy Number *</Label>
            <Input
              id="policyNumber"
              {...formMethods.register('policyNumber')}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <DatePickerField
                name="coverageFromDate"
                label="Period of Cover - From *"
              />
            </div>
            <div>
              <DatePickerField
                name="coverageToDate"
                label="Period of Cover - To *"
              />
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'insured',
      title: 'Insured Details',
      component: (
        <div className="space-y-4">
          <div>
            <Label htmlFor="companyName">Company Name (if applicable)</Label>
            <Input
              id="companyName"
              {...formMethods.register('companyName')}
            />
          </div>
          
          <div>
            <Label htmlFor="address">Address *</Label>
            <Textarea
              id="address"
              {...formMethods.register('address')}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone">Phone *</Label>
              <Input
                id="phone"
                {...formMethods.register('phone')}
              />
            </div>
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                {...formMethods.register('email')}
              />
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'loss',
      title: 'Details of Loss',
      component: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <DatePickerField
                name="accidentDate"
                label="Date of Accident *"
              />
            </div>
            <div>
              <Label htmlFor="accidentTime">Time of Accident *</Label>
              <Input
                id="accidentTime"
                type="time"
                {...formMethods.register('accidentTime')}
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="accidentPlace">Place where accident occurred *</Label>
            <Input
              id="accidentPlace"
              {...formMethods.register('accidentPlace')}
            />
          </div>
          
          <div>
            <Label htmlFor="accidentDetails">Full details of how accident occurred *</Label>
            <Textarea
              id="accidentDetails"
              {...formMethods.register('accidentDetails')}
              rows={4}
            />
          </div>
          
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
              <div key={field.id} className="border p-4 rounded-lg space-y-4">
                <div className="flex items-center justify-between">
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor={`witnesses.${index}.name`}>Name</Label>
                    <Input {...formMethods.register(`witnesses.${index}.name` as const)} />
                  </div>
                  <div>
                    <Label htmlFor={`witnesses.${index}.isEmployee`}>Is employee or independent?</Label>
                    <Select
                      value={watchedValues.witnesses?.[index]?.isEmployee || ''}
                      onValueChange={(value) => formMethods.setValue(`witnesses.${index}.isEmployee` as const, value as 'employee' | 'independent')}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="employee">Employee</SelectItem>
                        <SelectItem value="independent">Independent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor={`witnesses.${index}.address`}>Address</Label>
                    <Textarea {...formMethods.register(`witnesses.${index}.address` as const)} />
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div>
            <Label htmlFor="employeeActivity">What were you or your employees doing? *</Label>
            <Textarea
              id="employeeActivity"
              {...formMethods.register('employeeActivity')}
              rows={3}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="responsiblePersonName">Name of person who caused accident *</Label>
              <Input
                id="responsiblePersonName"
                {...formMethods.register('responsiblePersonName')}
              />
            </div>
            <div>
              <Label htmlFor="responsiblePersonAddress">Address of person who caused accident *</Label>
              <Textarea
                id="responsiblePersonAddress"
                {...formMethods.register('responsiblePersonAddress')}
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="responsibleEmployer">Name/address of that person's employer (if other than insured)</Label>
            <Textarea
              id="responsibleEmployer"
              {...formMethods.register('responsibleEmployer')}
            />
          </div>
        </div>
      )
    },
    {
      id: 'police',
      title: 'Police and Other Insurances',
      component: (
        <div className="space-y-4">
          <div>
            <Label>Were particulars taken by police? *</Label>
            <Select
              value={watchedValues.policeInvolved || ''}
              onValueChange={(value) => formMethods.setValue('policeInvolved', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="no">No</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {watchedValues.policeInvolved === 'yes' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="policeStation">Police Station *</Label>
                <Input
                  id="policeStation"
                  {...formMethods.register('policeStation')}
                />
              </div>
              <div>
                <Label htmlFor="officerNumber">Officer Number *</Label>
                <Input
                  id="officerNumber"
                  {...formMethods.register('officerNumber')}
                />
              </div>
            </div>
          )}
          
          <div>
            <Label>Do you hold other policies covering this accident? *</Label>
            <Select
              value={watchedValues.otherInsurance || ''}
              onValueChange={(value) => formMethods.setValue('otherInsurance', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="no">No</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {watchedValues.otherInsurance === 'yes' && (
            <div>
              <Label htmlFor="otherInsuranceDetails">Other insurance details *</Label>
              <Textarea
                id="otherInsuranceDetails"
                {...formMethods.register('otherInsuranceDetails')}
                rows={3}
              />
            </div>
          )}
        </div>
      )
    },
    {
      id: 'claimant',
      title: 'Claimant',
      component: (
        <div className="space-y-4">
          <div>
            <Label htmlFor="claimantName">Name *</Label>
            <Input
              id="claimantName"
              {...formMethods.register('claimantName')}
            />
          </div>
          
          <div>
            <Label htmlFor="claimantAddress">Address *</Label>
            <Textarea
              id="claimantAddress"
              {...formMethods.register('claimantAddress')}
            />
          </div>
          
          <div>
            <Label htmlFor="injuryNature">Nature of injury or damage *</Label>
            <Textarea
              id="injuryNature"
              {...formMethods.register('injuryNature')}
              rows={3}
            />
          </div>
          
          <div>
            <Label>Have you received claim notice? *</Label>
            <Select
              value={watchedValues.claimNoticeReceived || ''}
              onValueChange={(value) => formMethods.setValue('claimNoticeReceived', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="no">No</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {watchedValues.claimNoticeReceived === 'yes' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="noticeFrom">From whom *</Label>
                  <Input
                    id="noticeFrom"
                    {...formMethods.register('noticeFrom')}
                  />
                </div>
                <div>
                  <DatePickerField
                    name="noticeWhen"
                    label="When *"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="noticeForm">In what form *</Label>
                <Input
                  id="noticeForm"
                  {...formMethods.register('noticeForm')}
                />
              </div>
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
      )
    },
    {
      id: 'privacy',
      title: 'Data Privacy',
      component: (
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
              onCheckedChange={(checked) => formMethods.setValue('agreeToDataPrivacy', !!checked)}
            />
            <Label htmlFor="agreeToDataPrivacy">I agree to the data privacy terms *</Label>
          </div>
        </div>
      )
    },
    {
      id: 'declaration',
      title: 'Declaration & Signature',
      component: (
        <div className="space-y-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Declaration</h3>
            <div className="text-sm space-y-2">
              <p>1. I/We declare to the best of my/our knowledge and belief that the information given on this form is true in every respect and agree that if I/we have made any false or fraudulent statement, be it suppression or concealment, the policy shall be cancelled and the claim shall be forfeited.</p>
              <p>2. I/We agree to provide additional information to NEM Insurance, if required.</p>
              <p>3. I/We agree to submit all required and requested for documents and NEM Insurance shall not be held responsible for any delay in settlement of claim due to non-fulfillment of requirements.</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="declarationTrue"
                checked={watchedValues.declarationTrue || false}
                onCheckedChange={(checked) => formMethods.setValue('declarationTrue', !!checked)}
              />
              <Label htmlFor="declarationTrue">I agree that statements are true *</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="declarationAdditionalInfo"
                checked={watchedValues.declarationAdditionalInfo || false}
                onCheckedChange={(checked) => formMethods.setValue('declarationAdditionalInfo', !!checked)}
              />
              <Label htmlFor="declarationAdditionalInfo">I agree to provide more info *</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="declarationDocuments"
                checked={watchedValues.declarationDocuments || false}
                onCheckedChange={(checked) => formMethods.setValue('declarationDocuments', !!checked)}
              />
              <Label htmlFor="declarationDocuments">I agree on documents requested *</Label>
            </div>
          </div>
          
          <div>
            <Label htmlFor="signature">Signature of policyholder (digital signature) *</Label>
            <Input
              id="signature"
              {...formMethods.register('signature')}
              placeholder="Type your full name as signature"
            />
          </div>
          
          <div>
            <Label>Date</Label>
            <Input value={new Date().toISOString().split('T')[0]} disabled />
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
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

          <MultiStepForm
            steps={steps}
            onSubmit={onFinalSubmit}
            formMethods={formMethods}
          />

          {/* Summary Dialog */}
          <Dialog open={showSummary} onOpenChange={setShowSummary}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Claim Summary</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium">Policy Details</h4>
                  <p className="text-sm text-muted-foreground">Policy: {watchedValues.policyNumber}</p>
                </div>
                <div>
                  <h4 className="font-medium">Company</h4>
                  <p className="text-sm text-muted-foreground">
                    {watchedValues.companyName} - {watchedValues.email}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium">Accident</h4>
                  <p className="text-sm text-muted-foreground">
                    {watchedValues.accidentDate && format(new Date(watchedValues.accidentDate), "PPP")} at {watchedValues.accidentPlace}
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
            title="Public Liability Claim Submitted!"
            formType="Public Liability Claim"
            isLoading={authSubmitting}
            loadingMessage="Your public liability claim is being processed and submitted..."
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
                  Thank you for signing in! Your public liability claim is now being submitted...
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default PublicLiabilityClaimForm;