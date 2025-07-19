
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
import { CalendarIcon, Plus, Trash2, Upload, Edit2, Shield, FileText, CheckCircle2, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import MultiStepForm from '@/components/common/MultiStepForm';
import { useFormDraft } from '@/hooks/useFormDraft';
import FileUpload from '@/components/common/FileUpload';
import { uploadFile } from '@/services/fileService';
import { db } from '@/firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { emailService } from '@/services/emailService';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';
import { useAuthRequiredSubmit } from '@/hooks/useAuthRequiredSubmit';
import SuccessModal from '@/components/common/SuccessModal';

// All Risk Claim Schema
const allRiskClaimSchema = yup.object().shape({
  // Policy Details
  policyNumber: yup.string().required("Policy number is required"),
  periodOfCoverFrom: yup.date().required("Period of cover from is required"),
  periodOfCoverTo: yup.date().required("Period of cover to is required"),

  // Insured Details
  nameOfInsured: yup.string().required("Name of insured is required"),
  address: yup.string().required("Address is required"),
  phone: yup.string().required("Phone number is required"),
  email: yup.string().email("Valid email is required").required("Email is required"),

  // Details of Loss
  typeOfClaim: yup.string().required("Type of claim is required"),
  locationOfClaim: yup.string().required("Location of claim is required"),
  dateOfOccurrence: yup.date().required("Date of occurrence is required"),
  timeOfOccurrence: yup.string().required("Time of occurrence is required"),
  propertyDescription: yup.string().required("Property description is required"),
  circumstancesOfLoss: yup.string().required("Circumstances of loss is required"),
  estimateOfLoss: yup.number().required("Estimate of loss is required"),

  // Property Details
  propertyItems: yup.array().of(
    yup.object().shape({
      description: yup.string().required("Description is required"),
      dateOfPurchase: yup.date().required("Date of purchase is required"),
      costPrice: yup.number().required("Cost price is required"),
      deductionForAge: yup.number().required("Deduction for age is required"),
      amountClaimed: yup.number().required("Amount claimed is required"),
      remarks: yup.string().required("Remarks is required")
    })
  ),

  // Ownership & Recovery
  soleOwner: yup.boolean().required("Please specify if sole owner"),
  ownershipExplanation: yup.string().when('soleOwner', {
    is: false,
    then: (schema) => schema.required("Explanation required when not sole owner"),
    otherwise: (schema) => schema.notRequired()
  }),
  hasHirePurchase: yup.boolean().required("Please specify if hire purchase agreement exists"),
  hirePurchaseCompany: yup.string().when('hasHirePurchase', {
    is: true,
    then: (schema) => schema.required("Hire purchase company required"),
    otherwise: (schema) => schema.notRequired()
  }),
  hirePurchaseAddress: yup.string().when('hasHirePurchase', {
    is: true,
    then: (schema) => schema.required("Hire purchase address required"),
    otherwise: (schema) => schema.notRequired()
  }),
  recoveryStepsTaken: yup.string().required("Recovery steps taken is required"),
  hasOtherInsurance: yup.boolean().required("Please specify if other insurance exists"),
  otherInsuranceDetails: yup.string().when('hasOtherInsurance', {
    is: true,
    then: (schema) => schema.required("Other insurance details required"),
    otherwise: (schema) => schema.notRequired()
  }),
  hasPreviousLoss: yup.boolean().required("Please specify if previous loss occurred"),
  previousLossDetails: yup.string().when('hasPreviousLoss', {
    is: true,
    then: (schema) => schema.required("Previous loss details required"),
    otherwise: (schema) => schema.notRequired()
  }),
  totalPropertyValue: yup.number().required("Total property value is required"),
  hasOtherInsuranceAtTime: yup.boolean().required("Please specify if other insurance at time of incident"),
  otherInsuranceAtTimeDetails: yup.string().when('hasOtherInsuranceAtTime', {
    is: true,
    then: (schema) => schema.required("Other insurance at time details required"),
    otherwise: (schema) => schema.notRequired()
  }),
  hasPriorClaims: yup.boolean().required("Please specify if prior claims exist"),
  priorClaimsDetails: yup.string().when('hasPriorClaims', {
    is: true,
    then: (schema) => schema.required("Prior claims details required"),
    otherwise: (schema) => schema.notRequired()
  }),
  policeInformed: yup.boolean().required("Please specify if police informed"),
  policeStationDetails: yup.string().when('policeInformed', {
    is: true,
    then: (schema) => schema.required("Police station details required"),
    otherwise: (schema) => schema.notRequired()
  }),

  // Declaration
  agreeToDataPrivacy: yup.boolean().oneOf([true], "You must agree to data privacy"),
  signature: yup.string().required("Signature is required")
});

interface AllRiskPropertyItem {
  description: string;
  dateOfPurchase: Date;
  costPrice: number;
  deductionForAge: number;
  amountClaimed: number;
  remarks: string;
}

interface AllRiskClaimData {
  // Policy Details
  policyNumber: string;
  periodOfCoverFrom: Date;
  periodOfCoverTo: Date;

  // Insured Details
  nameOfInsured: string;
  address: string;
  phone: string;
  email: string;

  // Details of Loss
  typeOfClaim: string;
  locationOfClaim: string;
  dateOfOccurrence: Date;
  timeOfOccurrence: string;
  propertyDescription: string;
  circumstancesOfLoss: string;
  estimateOfLoss: number;

  // Property Details
  propertyItems: AllRiskPropertyItem[];

  // Ownership & Recovery
  soleOwner: boolean;
  ownershipExplanation?: string;
  hasHirePurchase: boolean;
  hirePurchaseCompany?: string;
  hirePurchaseAddress?: string;
  recoveryStepsTaken: string;
  hasOtherInsurance: boolean;
  otherInsuranceDetails?: string;
  hasPreviousLoss: boolean;
  previousLossDetails?: string;
  totalPropertyValue: number;
  hasOtherInsuranceAtTime: boolean;
  otherInsuranceAtTimeDetails?: string;
  hasPriorClaims: boolean;
  priorClaimsDetails?: string;
  policeInformed: boolean;
  policeStationDetails?: string;

  // Declaration
  agreeToDataPrivacy: boolean;
  signature: string;
  signatureDate: Date;
}

const defaultValues: Partial<AllRiskClaimData> = {
  policyNumber: '',
  nameOfInsured: '',
  address: '',
  phone: '',
  email: '',
  typeOfClaim: '',
  locationOfClaim: '',
  timeOfOccurrence: '',
  propertyDescription: '',
  circumstancesOfLoss: '',
  estimateOfLoss: 0,
  propertyItems: [],
  soleOwner: false,
  hasHirePurchase: false,
  recoveryStepsTaken: '',
  hasOtherInsurance: false,
  hasPreviousLoss: false,
  totalPropertyValue: 0,
  hasOtherInsuranceAtTime: false,
  hasPriorClaims: false,
  policeInformed: false,
  agreeToDataPrivacy: false,
  signature: ''
};

const AllRiskClaim: React.FC = () => {
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
    // resolver: yupResolver(allRiskClaimSchema),
    defaultValues,
    mode: 'onChange'
  });

  const { fields: propertyFields, append: addProperty, remove: removeProperty } = useFieldArray({
    control: formMethods.control,
    name: 'propertyItems'
  });

  const { saveDraft, clearDraft } = useFormDraft('allRiskClaim', formMethods);
  const watchedValues = formMethods.watch();

  // Auto-save draft
  useEffect(() => {
    const subscription = formMethods.watch((data) => {
      saveDraft(data);
    });
    return () => subscription.unsubscribe();
  }, [formMethods, saveDraft]);

  // Main submit handler that checks authentication
  const handleSubmit = async (data: AllRiskClaimData) => {
    // Prepare file upload data
    const fileUploadPromises: Array<Promise<[string, string]>> = [];
    
    for (const [key, file] of Object.entries(uploadedFiles)) {
      if (file) {
        fileUploadPromises.push(
          uploadFile(file, `all-risk-claims/${Date.now()}-${file.name}`).then(url => [key, url])
        );
      }
    }

    const fileResults = await Promise.all(fileUploadPromises);
    const fileUrls = Object.fromEntries(fileResults);

    const finalData = {
      ...data,
      ...fileUrls,
      status: 'processing',
      formType: 'All Risk Claim'
    };

    await handleSubmitWithAuth(finalData, 'All Risk Claim');
    clearDraft();
    setShowSummary(false);
  };

  const onFinalSubmit = (data: AllRiskClaimData) => {
    setShowSummary(true);
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
      id: 'policy',
      title: 'Policy Details',
      component: (
        <div className="space-y-4">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <Label htmlFor="policyNumber" className="flex items-center gap-1">
                    Policy Number *
                    <Info className="h-3 w-3" />
                  </Label>
                  <Input
                    id="policyNumber"
                    {...formMethods.register('policyNumber')}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Enter your all risk insurance policy number</p>
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
      )
    },
    {
      id: 'insured',
      title: 'Insured Details',
      component: (
        <TooltipProvider>
          <div className="space-y-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <Label htmlFor="nameOfInsured" className="flex items-center gap-1">
                    Name of Insured *
                    <Info className="h-3 w-3" />
                  </Label>
                  <Input
                    id="nameOfInsured"
                    {...formMethods.register('nameOfInsured')}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Enter the full name of the insured person</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <Label htmlFor="address" className="flex items-center gap-1">
                    Address *
                    <Info className="h-3 w-3" />
                  </Label>
                  <Textarea
                    id="address"
                    {...formMethods.register('address')}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Enter your full residential address</p>
              </TooltipContent>
            </Tooltip>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Label htmlFor="phone" className="flex items-center gap-1">
                      Phone Number *
                      <Info className="h-3 w-3" />
                    </Label>
                    <Input
                      id="phone"
                      {...formMethods.register('phone')}
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Enter your contact phone number</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Label htmlFor="email" className="flex items-center gap-1">
                      Email Address *
                      <Info className="h-3 w-3" />
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      {...formMethods.register('email')}
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Enter your email address for correspondence</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </TooltipProvider>
      )
    },
    {
      id: 'loss',
      title: 'Details of Loss',
      component: (
        <TooltipProvider>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Label htmlFor="typeOfClaim" className="flex items-center gap-1">
                      Type of Claim *
                      <Info className="h-3 w-3" />
                    </Label>
                    <Input
                      id="typeOfClaim"
                      {...formMethods.register('typeOfClaim')}
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Specify the type of claim (theft, damage, etc.)</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Label htmlFor="locationOfClaim" className="flex items-center gap-1">
                      Location of Claim *
                      <Info className="h-3 w-3" />
                    </Label>
                    <Input
                      id="locationOfClaim"
                      {...formMethods.register('locationOfClaim')}
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Enter where the incident occurred</p>
                </TooltipContent>
              </Tooltip>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DatePickerField
                name="dateOfOccurrence"
                label="Date of Occurrence *"
              />
              <div>
                <Label htmlFor="timeOfOccurrence">Time *</Label>
                <Input
                  id="timeOfOccurrence"
                  type="time"
                  {...formMethods.register('timeOfOccurrence')}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="propertyDescription">Describe property involved (model, make, year etc) *</Label>
              <Textarea
                id="propertyDescription"
                {...formMethods.register('propertyDescription')}
                rows={3}
              />
            </div>
            
            <div>
              <Label htmlFor="circumstancesOfLoss">Circumstances of loss/damage *</Label>
              <Textarea
                id="circumstancesOfLoss"
                {...formMethods.register('circumstancesOfLoss')}
                rows={4}
              />
            </div>
            
            <div>
              <Label htmlFor="estimateOfLoss">Estimate of loss/repairs *</Label>
              <Input
                id="estimateOfLoss"
                type="number"
                {...formMethods.register('estimateOfLoss')}
              />
            </div>
          </div>
        </TooltipProvider>
      )
    },
    {
      id: 'property',
      title: 'Property Details',
      component: (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Property Items</h3>
            <Button
              type="button"
              onClick={() => addProperty({ 
                description: '', 
                dateOfPurchase: new Date(), 
                costPrice: 0, 
                deductionForAge: 0, 
                amountClaimed: 0, 
                remarks: '' 
              })}
              variant="outline"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </div>
          
          {propertyFields.map((field, index) => (
            <div key={field.id} className="border p-4 rounded-lg space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-medium">Item {index + 1}</h4>
                <Button
                  type="button"
                  onClick={() => removeProperty(index)}
                  variant="ghost"
                  size="sm"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              
              <div>
                <Label htmlFor={`propertyItems.${index}.description`}>Description *</Label>
                <Textarea
                  {...formMethods.register(`propertyItems.${index}.description`)}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Date of Purchase *</Label>
                  <DatePickerField
                    name={`propertyItems.${index}.dateOfPurchase`}
                    label="Date of Purchase"
                  />
                </div>
                <div>
                  <Label htmlFor={`propertyItems.${index}.costPrice`}>Cost Price *</Label>
                  <Input
                    type="number"
                    {...formMethods.register(`propertyItems.${index}.costPrice`)}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor={`propertyItems.${index}.deductionForAge`}>Deduction for age/use/wear *</Label>
                  <Input
                    type="number"
                    {...formMethods.register(`propertyItems.${index}.deductionForAge`)}
                  />
                </div>
                <div>
                  <Label htmlFor={`propertyItems.${index}.amountClaimed`}>Amount claimed *</Label>
                  <Input
                    type="number"
                    {...formMethods.register(`propertyItems.${index}.amountClaimed`)}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor={`propertyItems.${index}.remarks`}>Remarks *</Label>
                <Textarea
                  {...formMethods.register(`propertyItems.${index}.remarks`)}
                />
              </div>
            </div>
          ))}
          
          {propertyFields.length === 0 && (
            <div className="text-center p-8 text-gray-500">
              No property items added yet. Click "Add Item" to add property details.
            </div>
          )}
        </div>
      )
    },
    {
      id: 'ownership',
      title: 'Ownership & Recovery Questions',
      component: (
        <div className="space-y-4">
          <div>
            <Label>Are you the sole owner? *</Label>
            <div className="flex items-center space-x-4 mt-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="soleOwner-yes"
                  checked={watchedValues.soleOwner === true}
                  onCheckedChange={(checked) => formMethods.setValue('soleOwner', checked)}
                />
                <Label htmlFor="soleOwner-yes">Yes</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="soleOwner-no"
                  checked={watchedValues.soleOwner === false}
                  onCheckedChange={(checked) => formMethods.setValue('soleOwner', !checked)}
                />
                <Label htmlFor="soleOwner-no">No</Label>
              </div>
            </div>
          </div>
          
          {watchedValues.soleOwner === false && (
            <div>
              <Label htmlFor="ownershipExplanation">If no, explain *</Label>
              <Textarea
                id="ownershipExplanation"
                {...formMethods.register('ownershipExplanation')}
              />
            </div>
          )}
          
          <div>
            <Label>Any hire purchase agreement? *</Label>
            <div className="flex items-center space-x-4 mt-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasHirePurchase-yes"
                  checked={watchedValues.hasHirePurchase === true}
                  onCheckedChange={(checked) => formMethods.setValue('hasHirePurchase', checked)}
                />
                <Label htmlFor="hasHirePurchase-yes">Yes</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasHirePurchase-no"
                  checked={watchedValues.hasHirePurchase === false}
                  onCheckedChange={(checked) => formMethods.setValue('hasHirePurchase', !checked)}
                />
                <Label htmlFor="hasHirePurchase-no">No</Label>
              </div>
            </div>
          </div>
          
          {watchedValues.hasHirePurchase === true && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="hirePurchaseCompany">Hire company name *</Label>
                <Input
                  id="hirePurchaseCompany"
                  {...formMethods.register('hirePurchaseCompany')}
                />
              </div>
              <div>
                <Label htmlFor="hirePurchaseAddress">Hire company address *</Label>
                <Textarea
                  id="hirePurchaseAddress"
                  {...formMethods.register('hirePurchaseAddress')}
                />
              </div>
            </div>
          )}
          
          <div>
            <Label htmlFor="recoveryStepsTaken">Steps taken to recover lost property *</Label>
            <Textarea
              id="recoveryStepsTaken"
              {...formMethods.register('recoveryStepsTaken')}
              rows={3}
            />
          </div>
          
          <div>
            <Label>Any other insurance on this property? *</Label>
            <div className="flex items-center space-x-4 mt-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasOtherInsurance-yes"
                  checked={watchedValues.hasOtherInsurance === true}
                  onCheckedChange={(checked) => formMethods.setValue('hasOtherInsurance', checked)}
                />
                <Label htmlFor="hasOtherInsurance-yes">Yes</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasOtherInsurance-no"
                  checked={watchedValues.hasOtherInsurance === false}
                  onCheckedChange={(checked) => formMethods.setValue('hasOtherInsurance', !checked)}
                />
                <Label htmlFor="hasOtherInsurance-no">No</Label>
              </div>
            </div>
          </div>
          
          {watchedValues.hasOtherInsurance === true && (
            <div>
              <Label htmlFor="otherInsuranceDetails">If yes, details *</Label>
              <Textarea
                id="otherInsuranceDetails"
                {...formMethods.register('otherInsuranceDetails')}
              />
            </div>
          )}
          
          <div>
            <Label>Ever sustained same loss before? *</Label>
            <div className="flex items-center space-x-4 mt-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasPreviousLoss-yes"
                  checked={watchedValues.hasPreviousLoss === true}
                  onCheckedChange={(checked) => formMethods.setValue('hasPreviousLoss', checked)}
                />
                <Label htmlFor="hasPreviousLoss-yes">Yes</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasPreviousLoss-no"
                  checked={watchedValues.hasPreviousLoss === false}
                  onCheckedChange={(checked) => formMethods.setValue('hasPreviousLoss', !checked)}
                />
                <Label htmlFor="hasPreviousLoss-no">No</Label>
              </div>
            </div>
          </div>
          
          {watchedValues.hasPreviousLoss === true && (
            <div>
              <Label htmlFor="previousLossDetails">If yes, details *</Label>
              <Textarea
                id="previousLossDetails"
                {...formMethods.register('previousLossDetails')}
              />
            </div>
          )}
          
          <div>
            <Label htmlFor="totalPropertyValue">Total value of insured property at time of loss *</Label>
            <Input
              id="totalPropertyValue"
              type="number"
              {...formMethods.register('totalPropertyValue')}
            />
          </div>
          
          <div>
            <Label>Other insurance in place at time of incident? *</Label>
            <div className="flex items-center space-x-4 mt-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasOtherInsuranceAtTime-yes"
                  checked={watchedValues.hasOtherInsuranceAtTime === true}
                  onCheckedChange={(checked) => formMethods.setValue('hasOtherInsuranceAtTime', checked)}
                />
                <Label htmlFor="hasOtherInsuranceAtTime-yes">Yes</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasOtherInsuranceAtTime-no"
                  checked={watchedValues.hasOtherInsuranceAtTime === false}
                  onCheckedChange={(checked) => formMethods.setValue('hasOtherInsuranceAtTime', !checked)}
                />
                <Label htmlFor="hasOtherInsuranceAtTime-no">No</Label>
              </div>
            </div>
          </div>
          
          {watchedValues.hasOtherInsuranceAtTime === true && (
            <div>
              <Label htmlFor="otherInsuranceAtTimeDetails">If yes, insurer/policy details *</Label>
              <Textarea
                id="otherInsuranceAtTimeDetails"
                {...formMethods.register('otherInsuranceAtTimeDetails')}
              />
            </div>
          )}
          
          <div>
            <Label>Prior claims under any burglary/all risk policy? *</Label>
            <div className="flex items-center space-x-4 mt-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasPriorClaims-yes"
                  checked={watchedValues.hasPriorClaims === true}
                  onCheckedChange={(checked) => formMethods.setValue('hasPriorClaims', checked)}
                />
                <Label htmlFor="hasPriorClaims-yes">Yes</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasPriorClaims-no"
                  checked={watchedValues.hasPriorClaims === false}
                  onCheckedChange={(checked) => formMethods.setValue('hasPriorClaims', !checked)}
                />
                <Label htmlFor="hasPriorClaims-no">No</Label>
              </div>
            </div>
          </div>
          
          {watchedValues.hasPriorClaims === true && (
            <div>
              <Label htmlFor="priorClaimsDetails">If yes, details *</Label>
              <Textarea
                id="priorClaimsDetails"
                {...formMethods.register('priorClaimsDetails')}
              />
            </div>
          )}
          
          <div>
            <Label>Informed police? *</Label>
            <div className="flex items-center space-x-4 mt-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="policeInformed-yes"
                  checked={watchedValues.policeInformed === true}
                  onCheckedChange={(checked) => formMethods.setValue('policeInformed', checked)}
                />
                <Label htmlFor="policeInformed-yes">Yes</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="policeInformed-no"
                  checked={watchedValues.policeInformed === false}
                  onCheckedChange={(checked) => formMethods.setValue('policeInformed', !checked)}
                />
                <Label htmlFor="policeInformed-no">No</Label>
              </div>
            </div>
          </div>
          
          {watchedValues.policeInformed === true && (
            <div>
              <Label htmlFor="policeStationDetails">If yes, police station details *</Label>
              <Textarea
                id="policeStationDetails"
                {...formMethods.register('policeStationDetails')}
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
          <div className="p-4 rounded-lg">
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
          <div className="p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Declaration</h3>
            <div className="text-sm space-y-2">
              <p>1. I/We declare to the best of my/our knowledge and belief that the information given on this form is true in every respect and agree that if I/we have made any false or fraudulent statement, be it suppression or concealment, the policy shall be cancelled and the claim shall be forfeited.</p>
              <p>2. I/We agree to provide additional information to NEM Insurance, if required.</p>
              <p>3. I/We agree to submit all required and requested for documents and NEM Insurance shall not be held responsible for any delay in settlement of claim due to non-fulfillment of requirements.</p>
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
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Shield className="h-8 w-8 text-primary" />
            All Risk Insurance Claim Form
          </h1>
          <p className="text-gray-600 mt-2">
            Submit your all risk insurance claim with all required details and supporting documents.
          </p>
        </div>

        <MultiStepForm
          steps={steps}
          onSubmit={onFinalSubmit}
          formMethods={formMethods}
        />

        {/* Summary Dialog */}
        <Dialog open={showSummary} onOpenChange={setShowSummary}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Review Your All Risk Claim Submission</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><strong>Policy Number:</strong> {watchedValues.policyNumber}</div>
                <div><strong>Name:</strong> {watchedValues.nameOfInsured}</div>
                <div><strong>Email:</strong> {watchedValues.email}</div>
                <div><strong>Type of Claim:</strong> {watchedValues.typeOfClaim}</div>
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
          title="All Risk Claim Submitted!"
          formType="All Risk Claim"
          isLoading={authSubmitting}
          loadingMessage="Your all risk claim is being processed and submitted..."
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
                Thank you for signing in! Your all risk claim is now being submitted...
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllRiskClaim;
