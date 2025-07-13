
import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { toast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Calendar as ReactCalendar } from '@/components/ui/calendar';
import { CalendarIcon, Plus, Trash2, Upload, Edit2, AlertTriangle, FileText, CheckCircle2, Loader2 } from 'lucide-react';
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

// Burglary Claim Schema
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
  signature: yup.string().required("Signature is required")
});

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
  signature: string;
  signatureDate: Date;
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
  signature: ''
};

const BurglaryClaimForm: React.FC = () => {
  const [showSummary, setShowSummary] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File>>({});

  const formMethods = useForm<any>({
    resolver: yupResolver(burglaryClaimSchema),
    defaultValues,
    mode: 'onChange'
  });

  const { fields: propertyFields, append: addProperty, remove: removeProperty } = useFieldArray({
    control: formMethods.control,
    name: 'propertyItems'
  });

  const { saveDraft, clearDraft } = useFormDraft('burglaryClaimForm', formMethods);
  const watchedValues = formMethods.watch();

  // Auto-save draft
  useEffect(() => {
    const subscription = formMethods.watch((data) => {
      saveDraft(data);
    });
    return () => subscription.unsubscribe();
  }, [formMethods, saveDraft]);

  const handleSubmit = async (data: BurglaryClaimData) => {
    setShowSummary(true);
  };

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    try {
      const data = formMethods.getValues();
      
      // Upload files to Firebase Storage
      const fileUploadPromises: Array<Promise<[string, string]>> = [];
      
      Object.entries(uploadedFiles).forEach(([key, file]) => {
        fileUploadPromises.push(
          uploadFile(file, 'burglary-claims').then(url => [key + 'Url', url])
        );
      });
      
      const uploadedUrls = await Promise.all(fileUploadPromises);
      const fileUrls = Object.fromEntries(uploadedUrls);
      
      // Prepare form data with file URLs
      const submissionData = {
        ...data,
        ...fileUrls,
        status: 'processing',
        submittedAt: new Date().toISOString(),
        formType: 'burglary-claim',
        signatureDate: new Date()
      };
      
      // Submit to Firestore
      await addDoc(collection(db, 'burglary-claims'), {
        ...submissionData,
        timestamp: serverTimestamp(),
        createdAt: new Date().toLocaleDateString('en-GB')
      });

      // Send confirmation email
      await emailService.sendSubmissionConfirmation(data.email, 'Burglary Insurance Claim');
      
      clearDraft();
      setShowSummary(false);
      setShowSuccess(true);
      toast({ title: "Burglary claim submitted successfully!" });
    } catch (error) {
      console.error('Submission error:', error);
      toast({ title: "Submission failed", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
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
                <p>Enter your burglary insurance policy number</p>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <Label htmlFor="companyName" className="flex items-center gap-1">
                      Company Name (Optional)
                      <Info className="h-3 w-3" />
                    </Label>
                    <Input
                      id="companyName"
                      {...formMethods.register('companyName')}
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Enter company name if applicable</p>
                </TooltipContent>
              </Tooltip>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Title *</Label>
                <Select
                  value={watchedValues.title || ''}
                  onValueChange={(value) => formMethods.setValue('title', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select title" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Mr">Mr</SelectItem>
                    <SelectItem value="Mrs">Mrs</SelectItem>
                    <SelectItem value="Chief">Chief</SelectItem>
                    <SelectItem value="Dr">Dr</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DatePickerField
                name="dateOfBirth"
                label="Date of Birth *"
              />
              <div>
                <Label>Gender *</Label>
                <Select
                  value={watchedValues.gender || ''}
                  onValueChange={(value) => formMethods.setValue('gender', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
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
            <div>
              <Label htmlFor="premisesAddress">Full address of premises involved *</Label>
              <Textarea
                id="premisesAddress"
                {...formMethods.register('premisesAddress')}
              />
            </div>
            
            <div>
              <Label htmlFor="premisesTelephone">Telephone *</Label>
              <Input
                id="premisesTelephone"
                {...formMethods.register('premisesTelephone')}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DatePickerField
                name="dateOfTheft"
                label="Date of theft *"
              />
              <div>
                <Label htmlFor="timeOfTheft">Time *</Label>
                <Input
                  id="timeOfTheft"
                  type="time"
                  {...formMethods.register('timeOfTheft')}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="howEntryEffected">How entry was effected *</Label>
              <Textarea
                id="howEntryEffected"
                {...formMethods.register('howEntryEffected')}
                rows={3}
              />
            </div>
            
            <div>
              <Label htmlFor="roomsEntered">Rooms entered *</Label>
              <Textarea
                id="roomsEntered"
                {...formMethods.register('roomsEntered')}
              />
            </div>
            
            <div>
              <Label>Premises occupied at time of loss? *</Label>
              <div className="flex items-center space-x-4 mt-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="premisesOccupied-yes"
                    checked={watchedValues.premisesOccupied === true}
                    onCheckedChange={(checked) => formMethods.setValue('premisesOccupied', checked)}
                  />
                  <Label htmlFor="premisesOccupied-yes">Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="premisesOccupied-no"
                    checked={watchedValues.premisesOccupied === false}
                    onCheckedChange={(checked) => formMethods.setValue('premisesOccupied', !checked)}
                  />
                  <Label htmlFor="premisesOccupied-no">No</Label>
                </div>
              </div>
            </div>
            
            {watchedValues.premisesOccupied === false && (
              <div>
                <Label htmlFor="lastOccupiedDate">Last occupied date/time *</Label>
                <Input
                  id="lastOccupiedDate"
                  {...formMethods.register('lastOccupiedDate')}
                />
              </div>
            )}
            
            <div>
              <Label>Suspicions on anyone? *</Label>
              <div className="flex items-center space-x-4 mt-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="suspicions-yes"
                    checked={watchedValues.suspicions === true}
                    onCheckedChange={(checked) => formMethods.setValue('suspicions', checked)}
                  />
                  <Label htmlFor="suspicions-yes">Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="suspicions-no"
                    checked={watchedValues.suspicions === false}
                    onCheckedChange={(checked) => formMethods.setValue('suspicions', !checked)}
                  />
                  <Label htmlFor="suspicions-no">No</Label>
                </div>
              </div>
            </div>
            
            {watchedValues.suspicions === true && (
              <div>
                <Label htmlFor="suspicionName">Name *</Label>
                <Input
                  id="suspicionName"
                  {...formMethods.register('suspicionName')}
                />
              </div>
            )}
            
            <div>
              <Label>Police informed? *</Label>
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
              <div className="space-y-4">
                <DatePickerField
                  name="policeDate"
                  label="Date *"
                />
                <div>
                  <Label htmlFor="policeStation">Station address *</Label>
                  <Textarea
                    id="policeStation"
                    {...formMethods.register('policeStation')}
                  />
                </div>
              </div>
            )}
            
            <div>
              <Label>Are you sole owner? *</Label>
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
                <Label htmlFor="ownerDetails">Owner name/address *</Label>
                <Textarea
                  id="ownerDetails"
                  {...formMethods.register('ownerDetails')}
                />
              </div>
            )}
            
            <div>
              <Label>Any other insurance? *</Label>
              <div className="flex items-center space-x-4 mt-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="otherInsurance-yes"
                    checked={watchedValues.otherInsurance === true}
                    onCheckedChange={(checked) => formMethods.setValue('otherInsurance', checked)}
                  />
                  <Label htmlFor="otherInsurance-yes">Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="otherInsurance-no"
                    checked={watchedValues.otherInsurance === false}
                    onCheckedChange={(checked) => formMethods.setValue('otherInsurance', !checked)}
                  />
                  <Label htmlFor="otherInsurance-no">No</Label>
                </div>
              </div>
            </div>
            
            {watchedValues.otherInsurance === true && (
              <div>
                <Label htmlFor="otherInsurerDetails">Insurer details *</Label>
                <Textarea
                  id="otherInsurerDetails"
                  {...formMethods.register('otherInsurerDetails')}
                />
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="totalContentsValue">Value of total contents *</Label>
                <Input
                  id="totalContentsValue"
                  type="number"
                  {...formMethods.register('totalContentsValue')}
                />
              </div>
              <div>
                <Label htmlFor="sumInsuredFirePolicy">Sum insured under fire policy *</Label>
                <Input
                  id="sumInsuredFirePolicy"
                  type="number"
                  {...formMethods.register('sumInsuredFirePolicy')}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fireInsurerName">Fire policy insurer name *</Label>
                <Input
                  id="fireInsurerName"
                  {...formMethods.register('fireInsurerName')}
                />
              </div>
              <div>
                <Label htmlFor="fireInsurerAddress">Fire policy insurer address *</Label>
                <Textarea
                  id="fireInsurerAddress"
                  {...formMethods.register('fireInsurerAddress')}
                />
              </div>
            </div>
            
            <div>
              <Label>Previous burglary/theft loss? *</Label>
              <div className="flex items-center space-x-4 mt-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="previousLoss-yes"
                    checked={watchedValues.previousLoss === true}
                    onCheckedChange={(checked) => formMethods.setValue('previousLoss', checked)}
                  />
                  <Label htmlFor="previousLoss-yes">Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="previousLoss-no"
                    checked={watchedValues.previousLoss === false}
                    onCheckedChange={(checked) => formMethods.setValue('previousLoss', !checked)}
                  />
                  <Label htmlFor="previousLoss-no">No</Label>
                </div>
              </div>
            </div>
            
            {watchedValues.previousLoss === true && (
              <div>
                <Label htmlFor="previousLossDetails">Explanation *</Label>
                <Textarea
                  id="previousLossDetails"
                  {...formMethods.register('previousLossDetails')}
                />
              </div>
            )}
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
                  <Label htmlFor={`propertyItems.${index}.costPrice`}>Cost Price *</Label>
                  <Input
                    type="number"
                    {...formMethods.register(`propertyItems.${index}.costPrice`)}
                  />
                </div>
                <div>
                  <Label>Date of Purchase *</Label>
                  <DatePickerField
                    name={`propertyItems.${index}.dateOfPurchase`}
                    label="Date of Purchase"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor={`propertyItems.${index}.estimatedValue`}>Estimated value at time of loss *</Label>
                  <Input
                    type="number"
                    {...formMethods.register(`propertyItems.${index}.estimatedValue`)}
                  />
                </div>
                <div>
                  <Label htmlFor={`propertyItems.${index}.netAmountClaimed`}>Net amount claimed *</Label>
                  <Input
                    type="number"
                    {...formMethods.register(`propertyItems.${index}.netAmountClaimed`)}
                  />
                </div>
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
            <AlertTriangle className="h-8 w-8 text-primary" />
            Burglary, Housebreaking and Larceny Claim Form
          </h1>
          <p className="text-gray-600 mt-2">
            Submit your burglary insurance claim with all required details and supporting documents.
          </p>
        </div>

        <MultiStepForm
          steps={steps}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          submitButtonText="Review Claim"
          formMethods={formMethods}
        />

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
              <Button onClick={handleFinalSubmit} disabled={isSubmitting}>
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

        {/* Success Dialog */}
        <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-center text-green-600">
                Claim Submitted Successfully!
              </DialogTitle>
            </DialogHeader>
            <div className="text-center py-4">
              <div className="mb-4">
                <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  ✓
                </div>
                <p className="text-gray-600 mb-4">
                  Your burglary insurance claim has been submitted successfully. 
                  You will receive a confirmation email shortly.
                </p>
                <div className="p-4 rounded-lg">
                  <p className="text-sm font-medium text-blue-800">
                    For claims status enquiries, call 01 448 9570
                  </p>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setShowSuccess(false)} className="w-full">
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default BurglaryClaimForm;
