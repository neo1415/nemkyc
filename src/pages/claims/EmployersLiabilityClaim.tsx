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
import { Calendar, CalendarIcon, Upload, Edit2, HardHat, FileText, CheckCircle2, Loader2, Plus, Trash2, Info } from 'lucide-react';
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

// Employers Liability Claim Schema
const employersLiabilityClaimSchema = yup.object().shape({
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
  maritalStatus: yup.string().required("Marital status is required"),
  numberOfChildren: yup.number().required("Number of children is required"),
  agesOfChildren: yup.string(),
  previousAccidents: yup.string().required("Previous accidents field is required"),
  previousAccidentsDetails: yup.string().when('previousAccidents', {
    is: 'yes',
    then: (schema) => schema.required("Details required for previous accidents"),
    otherwise: (schema) => schema.notRequired()
  }),

  // Injury Details
  natureOfInjuries: yup.string().required("Nature of injuries is required"),
  machineryInvolved: yup.string(),
  supervisorName: yup.string(),
  supervisorPosition: yup.string(),

  // Accident Details
  accidentDate: yup.date().required("Accident date is required"),
  accidentTime: yup.string().required("Accident time is required"),
  accidentPlace: yup.string().required("Accident place is required"),
  dateReported: yup.date().required("Date reported is required"),
  reportedBy: yup.string().required("Reported by is required"),
  dateStoppedWork: yup.date().required("Date stopped work is required"),
  workDescription: yup.string().required("Work description is required"),
  howAccidentOccurred: yup.string().required("How accident occurred is required"),
  soberOrIntoxicated: yup.string().required("Sober or intoxicated field is required"),

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
  doctorName: yup.string(),
  doctorAddress: yup.string(),

  // Disablement
  totallyDisabled: yup.string().required("Totally disabled field is required"),
  dateStoppedWorking: yup.date().when('totallyDisabled', {
    is: 'yes',
    then: (schema) => schema.required("Date stopped working required"),
    otherwise: (schema) => schema.notRequired()
  }),
  estimatedDuration: yup.string(),
  ableToDoAnyDuties: yup.string().required("Able to do any duties field is required"),
  dutiesDetails: yup.string().when('ableToDoAnyDuties', {
    is: 'yes',
    then: (schema) => schema.required("Duties details required"),
    otherwise: (schema) => schema.notRequired()
  }),
  claimMadeOnYou: yup.string().required("Claim made on you field is required"),

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

interface EmployersLiabilityClaimData {
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
  maritalStatus: string;
  numberOfChildren: number;
  agesOfChildren?: string;
  previousAccidents: string;
  previousAccidentsDetails?: string;

  // Injury Details
  natureOfInjuries: string;
  machineryInvolved?: string;
  supervisorName?: string;
  supervisorPosition?: string;

  // Accident Details
  accidentDate: Date;
  accidentTime: string;
  accidentPlace: string;
  dateReported: Date;
  reportedBy: string;
  dateStoppedWork: Date;
  workDescription: string;
  howAccidentOccurred: string;
  soberOrIntoxicated: string;

  // Medical
  receivingTreatment: string;
  hospitalName?: string;
  hospitalAddress?: string;
  doctorName?: string;
  doctorAddress?: string;

  // Disablement
  totallyDisabled: string;
  dateStoppedWorking?: Date;
  estimatedDuration?: string;
  ableToDoAnyDuties: string;
  dutiesDetails?: string;
  claimMadeOnYou: string;

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

const defaultValues: Partial<EmployersLiabilityClaimData> = {
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
  maritalStatus: '',
  numberOfChildren: 0,
  agesOfChildren: '',
  previousAccidents: '',
  natureOfInjuries: '',
  machineryInvolved: '',
  supervisorName: '',
  supervisorPosition: '',
  accidentTime: '',
  accidentPlace: '',
  reportedBy: '',
  workDescription: '',
  howAccidentOccurred: '',
  soberOrIntoxicated: '',
  receivingTreatment: '',
  hospitalName: '',
  hospitalAddress: '',
  doctorName: '',
  doctorAddress: '',
  totallyDisabled: '',
  estimatedDuration: '',
  ableToDoAnyDuties: '',
  dutiesDetails: '',
  claimMadeOnYou: '',
  witnesses: [],
  otherInsurerName: '',
  otherInsurerAddress: '',
  otherInsurerPolicyNumber: '',
  earnings: Array.from({ length: 12 }, (_, i) => ({
    monthEnding: '',
    wagesAndBonus: 0,
    monthlyAllowances: 0
  })),
  agreeToDataPrivacy: false,
  declarationTrue: false,
  declarationAdditionalInfo: false,
  declarationDocuments: false,
  signature: ''
};

const EmployersLiabilityClaim: React.FC = () => {
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File>>({});

  const formMethods = useForm<any>({
    resolver: yupResolver(employersLiabilityClaimSchema),
    defaultValues,
    mode: 'onChange'
  });

  const { fields: witnessFields, append: addWitness, remove: removeWitness } = useFieldArray({
    control: formMethods.control,
    name: 'witnesses'
  });

  const { saveDraft, clearDraft } = useFormDraft('employersLiabilityClaim', formMethods);
  const watchedValues = formMethods.watch();

  // Auto-save draft
  useEffect(() => {
    const subscription = formMethods.watch((data) => {
      saveDraft(data);
    });
    return () => subscription.unsubscribe();
  }, [formMethods, saveDraft]);

  const handleSubmit = async (data: EmployersLiabilityClaimData) => {
    setIsSubmitting(true);
    try {
      // Upload files to Firebase Storage
      const fileUploadPromises: Array<Promise<[string, string]>> = [];
      
      Object.entries(uploadedFiles).forEach(([key, file]) => {
        fileUploadPromises.push(
          uploadFile(file, 'employers-liability-claims').then(url => [key + 'Url', url])
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
        formType: 'employers-liability-claim'
      };
      
      // Submit to Firestore
      await addDoc(collection(db, 'employers-liability-claims'), {
        ...submissionData,
        timestamp: serverTimestamp(),
        createdAt: new Date().toLocaleDateString('en-GB')
      });

      // Send confirmation email
      await emailService.sendSubmissionConfirmation(data.email, 'Employers Liability Claim');
      
      clearDraft();
      setShowSuccess(true);
      toast({ title: "Employers Liability claim submitted successfully!" });
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
                <p>Enter your employers liability insurance policy number</p>
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
                  <Label htmlFor="name" className="flex items-center gap-1">
                    Name *
                    <Info className="h-3 w-3" />
                  </Label>
                  <Input
                    id="name"
                    {...formMethods.register('name')}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Enter the insured person's name</p>
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
                <p>Enter the insured's full address</p>
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
                  <p>Enter contact phone number</p>
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
                  <p>Enter email address for correspondence</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </TooltipProvider>
      )
    },
    {
      id: 'injured-party',
      title: 'Injured Party Details',
      component: (
        <TooltipProvider>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Label htmlFor="injuredPartyName" className="flex items-center gap-1">
                      Name *
                      <Info className="h-3 w-3" />
                    </Label>
                    <Input
                      id="injuredPartyName"
                      {...formMethods.register('injuredPartyName')}
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Enter the injured party's full name</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Label htmlFor="injuredPartyAge" className="flex items-center gap-1">
                      Age *
                      <Info className="h-3 w-3" />
                    </Label>
                    <Input
                      id="injuredPartyAge"
                      type="number"
                      {...formMethods.register('injuredPartyAge')}
                    />
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
                  <Label htmlFor="injuredPartyAddress" className="flex items-center gap-1">
                    Address *
                    <Info className="h-3 w-3" />
                  </Label>
                  <Textarea
                    id="injuredPartyAddress"
                    {...formMethods.register('injuredPartyAddress')}
                  />
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
                    <Label htmlFor="averageMonthlyEarnings" className="flex items-center gap-1">
                      Average Monthly Earnings *
                      <Info className="h-3 w-3" />
                    </Label>
                    <Input
                      id="averageMonthlyEarnings"
                      type="number"
                      {...formMethods.register('averageMonthlyEarnings')}
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Enter the average monthly earnings in Naira</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Label htmlFor="occupation" className="flex items-center gap-1">
                      Occupation *
                      <Info className="h-3 w-3" />
                    </Label>
                    <Input
                      id="occupation"
                      {...formMethods.register('occupation')}
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Enter the occupation/job title</p>
                </TooltipContent>
              </Tooltip>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DatePickerField
                name="dateOfEmployment"
                label="Date of Employment *"
              />
              
              <div>
                <Label>Marital Status *</Label>
                <Select
                  value={watchedValues.maritalStatus || ''}
                  onValueChange={(value) => formMethods.setValue('maritalStatus', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select marital status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Single">Single</SelectItem>
                    <SelectItem value="Married">Married</SelectItem>
                    <SelectItem value="Divorced">Divorced</SelectItem>
                    <SelectItem value="Widowed">Widowed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="numberOfChildren">Number of Children *</Label>
                <Input
                  id="numberOfChildren"
                  type="number"
                  {...formMethods.register('numberOfChildren')}
                />
              </div>
              
              <div>
                <Label htmlFor="agesOfChildren">Ages of Children</Label>
                <Textarea
                  id="agesOfChildren"
                  placeholder="e.g., 5, 8, 12"
                  {...formMethods.register('agesOfChildren')}
                />
              </div>
            </div>
            
            <div>
              <Label>Previous Accidents *</Label>
              <Select
                value={watchedValues.previousAccidents || ''}
                onValueChange={(value) => formMethods.setValue('previousAccidents', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select yes or no" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {watchedValues.previousAccidents === 'yes' && (
              <div>
                <Label htmlFor="previousAccidentsDetails">Previous Accidents Details *</Label>
                <Textarea
                  id="previousAccidentsDetails"
                  {...formMethods.register('previousAccidentsDetails')}
                />
              </div>
            )}
          </div>
        </TooltipProvider>
      )
    },
    {
      id: 'injury',
      title: 'Injury Details',
      component: (
        <TooltipProvider>
          <div className="space-y-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <Label htmlFor="natureOfInjuries" className="flex items-center gap-1">
                    Nature of Injuries *
                    <Info className="h-3 w-3" />
                  </Label>
                  <Textarea
                    id="natureOfInjuries"
                    {...formMethods.register('natureOfInjuries')}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Describe the nature and extent of injuries</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <Label htmlFor="machineryInvolved" className="flex items-center gap-1">
                    Machinery Involved
                    <Info className="h-3 w-3" />
                  </Label>
                  <Textarea
                    id="machineryInvolved"
                    {...formMethods.register('machineryInvolved')}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Describe any machinery involved in the incident</p>
              </TooltipContent>
            </Tooltip>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="supervisorName">Name of Supervisor</Label>
                <Input
                  id="supervisorName"
                  {...formMethods.register('supervisorName')}
                />
              </div>
              
              <div>
                <Label htmlFor="supervisorPosition">Position of Supervisor</Label>
                <Input
                  id="supervisorPosition"
                  {...formMethods.register('supervisorPosition')}
                />
              </div>
            </div>
          </div>
        </TooltipProvider>
      )
    },
    {
      id: 'accident',
      title: 'Accident Details',
      component: (
        <TooltipProvider>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DatePickerField
                name="accidentDate"
                label="Accident Date *"
              />
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Label htmlFor="accidentTime" className="flex items-center gap-1">
                      Time *
                      <Info className="h-3 w-3" />
                    </Label>
                    <Input
                      id="accidentTime"
                      type="time"
                      {...formMethods.register('accidentTime')}
                    />
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
                  <Label htmlFor="accidentPlace" className="flex items-center gap-1">
                    Place *
                    <Info className="h-3 w-3" />
                  </Label>
                  <Textarea
                    id="accidentPlace"
                    {...formMethods.register('accidentPlace')}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Describe the location where the accident occurred</p>
              </TooltipContent>
            </Tooltip>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DatePickerField
                name="dateReported"
                label="Date Reported *"
              />
              
              <div>
                <Label htmlFor="reportedBy">Reported By *</Label>
                <Input
                  id="reportedBy"
                  {...formMethods.register('reportedBy')}
                />
              </div>
            </div>
            
            <DatePickerField
              name="dateStoppedWork"
              label="Date Injured Party Stopped Work *"
            />
            
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <Label htmlFor="workDescription" className="flex items-center gap-1">
                    Description of Work Engaged In *
                    <Info className="h-3 w-3" />
                  </Label>
                  <Textarea
                    id="workDescription"
                    {...formMethods.register('workDescription')}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Describe the work being performed when the accident occurred</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <Label htmlFor="howAccidentOccurred" className="flex items-center gap-1">
                    How the Accident Occurred *
                    <Info className="h-3 w-3" />
                  </Label>
                  <Textarea
                    id="howAccidentOccurred"
                    {...formMethods.register('howAccidentOccurred')}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Provide a detailed description of how the accident happened</p>
              </TooltipContent>
            </Tooltip>
            
            <div>
              <Label>Sober or Intoxicated *</Label>
              <Select
                value={watchedValues.soberOrIntoxicated || ''}
                onValueChange={(value) => formMethods.setValue('soberOrIntoxicated', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select condition" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sober">Sober</SelectItem>
                  <SelectItem value="intoxicated">Intoxicated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </TooltipProvider>
      )
    },
    {
      id: 'medical',
      title: 'Medical',
      component: (
        <TooltipProvider>
          <div className="space-y-4">
            <div>
              <Label>Receiving Treatment *</Label>
              <Select
                value={watchedValues.receivingTreatment || ''}
                onValueChange={(value) => formMethods.setValue('receivingTreatment', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select yes or no" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {watchedValues.receivingTreatment === 'yes' && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="hospitalName">Hospital Name *</Label>
                  <Input
                    id="hospitalName"
                    {...formMethods.register('hospitalName')}
                  />
                </div>
                
                <div>
                  <Label htmlFor="hospitalAddress">Hospital Address *</Label>
                  <Textarea
                    id="hospitalAddress"
                    {...formMethods.register('hospitalAddress')}
                  />
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="doctorName">Name of Doctor</Label>
                <Input
                  id="doctorName"
                  {...formMethods.register('doctorName')}
                />
              </div>
              
              <div>
                <Label htmlFor="doctorAddress">Address of Doctor</Label>
                <Textarea
                  id="doctorAddress"
                  {...formMethods.register('doctorAddress')}
                />
              </div>
            </div>
          </div>
        </TooltipProvider>
      )
    },
    {
      id: 'disablement',
      title: 'Disablement',
      component: (
        <TooltipProvider>
          <div className="space-y-4">
            <div>
              <Label>Totally Disabled? *</Label>
              <Select
                value={watchedValues.totallyDisabled || ''}
                onValueChange={(value) => formMethods.setValue('totallyDisabled', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select yes or no" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {watchedValues.totallyDisabled === 'yes' && (
              <DatePickerField
                name="dateStoppedWorking"
                label="Date Stopped Working *"
              />
            )}
            
            <div>
              <Label htmlFor="estimatedDuration">Estimated Duration of Disablement</Label>
              <Input
                id="estimatedDuration"
                {...formMethods.register('estimatedDuration')}
              />
            </div>
            
            <div>
              <Label>Able to Do Any Duties? *</Label>
              <Select
                value={watchedValues.ableToDoAnyDuties || ''}
                onValueChange={(value) => formMethods.setValue('ableToDoAnyDuties', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select yes or no" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {watchedValues.ableToDoAnyDuties === 'yes' && (
              <div>
                <Label htmlFor="dutiesDetails">Duties Details *</Label>
                <Textarea
                  id="dutiesDetails"
                  {...formMethods.register('dutiesDetails')}
                />
              </div>
            )}
            
            <div>
              <Label>Has Any Claim Been Made on You? *</Label>
              <Select
                value={watchedValues.claimMadeOnYou || ''}
                onValueChange={(value) => formMethods.setValue('claimMadeOnYou', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select yes or no" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </TooltipProvider>
      )
    },
    {
      id: 'witnesses',
      title: 'Witnesses',
      component: (
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
                <div>
                  <Label htmlFor={`witnesses.${index}.name`}>Witness Name *</Label>
                  <Input
                    {...formMethods.register(`witnesses.${index}.name`)}
                  />
                </div>
                
                <div>
                  <Label htmlFor={`witnesses.${index}.address`}>Witness Address *</Label>
                  <Textarea
                    {...formMethods.register(`witnesses.${index}.address`)}
                  />
                </div>
                
                <div>
                  <Label htmlFor={`witnesses.${index}.phone`}>Witness Phone *</Label>
                  <Input
                    {...formMethods.register(`witnesses.${index}.phone`)}
                  />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )
    },
    {
      id: 'other-insurers',
      title: 'Other Insurers',
      component: (
        <TooltipProvider>
          <div className="space-y-4">
            <div>
              <Label htmlFor="otherInsurerName">Other Insurer Name</Label>
              <Input
                id="otherInsurerName"
                {...formMethods.register('otherInsurerName')}
              />
            </div>
            
            <div>
              <Label htmlFor="otherInsurerAddress">Other Insurer Address</Label>
              <Textarea
                id="otherInsurerAddress"
                {...formMethods.register('otherInsurerAddress')}
              />
            </div>
            
            <div>
              <Label htmlFor="otherInsurerPolicyNumber">Policy Number</Label>
              <Input
                id="otherInsurerPolicyNumber"
                {...formMethods.register('otherInsurerPolicyNumber')}
              />
            </div>
          </div>
        </TooltipProvider>
      )
    },
    {
      id: 'earnings',
      title: 'Statement of Earnings',
      component: (
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
      )
    },
    {
      id: 'declaration',
      title: 'Data Privacy & Declaration',
      component: (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">Data Privacy</h3>
            <div className="text-sm space-y-2 mb-4 p-4 bg-gray-50 rounded">
              <p>i. Your data will solemnly be used for the purposes of this business contract and also to enable us reach you with the updates about our products and services.</p>
              <p>ii. Please note that your personal data will be treated with utmost respect and is well secured as required by Nigeria Data Protection Regulations 2019.</p>
              <p>iii. Your personal data shall not be shared with or sold to any third-party without your consent unless we are compelled by law or regulator.</p>
            </div>
            
            <div className="flex items-start space-x-2">
              <Checkbox
                id="agreeToDataPrivacy"
                checked={watchedValues.agreeToDataPrivacy || false}
                onCheckedChange={(checked) => formMethods.setValue('agreeToDataPrivacy', checked)}
                className="mt-1"
              />
              <Label htmlFor="agreeToDataPrivacy" className="text-sm">
                I agree to the data privacy policy *
              </Label>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Declaration</h3>
            <div className="text-sm space-y-2 mb-4 p-4 bg-gray-50 rounded">
              <p>1. I/We declare to the best of my/our knowledge and belief that the information given on this form is true in every respect and agree that if I/we have made any false or fraudulent statement, be it suppression or concealment, the policy shall be cancelled and the claim shall be forfeited.</p>
              <p>2. I/We agree to provide additional information to NEM Insurance, if required.</p>
              <p>3. I/We agree to submit all required and requested for documents and NEM Insurance shall not be held responsible for any delay in settlement of claim due to non-fulfillment of requirements.</p>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="declarationTrue"
                  checked={watchedValues.declarationTrue || false}
                  onCheckedChange={(checked) => formMethods.setValue('declarationTrue', checked)}
                  className="mt-1"
                />
                <Label htmlFor="declarationTrue" className="text-sm">
                  I declare that the information given is true *
                </Label>
              </div>
              
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="declarationAdditionalInfo"
                  checked={watchedValues.declarationAdditionalInfo || false}
                  onCheckedChange={(checked) => formMethods.setValue('declarationAdditionalInfo', checked)}
                  className="mt-1"
                />
                <Label htmlFor="declarationAdditionalInfo" className="text-sm">
                  I agree to provide additional information if required *
                </Label>
              </div>
              
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="declarationDocuments"
                  checked={watchedValues.declarationDocuments || false}
                  onCheckedChange={(checked) => formMethods.setValue('declarationDocuments', checked)}
                  className="mt-1"
                />
                <Label htmlFor="declarationDocuments" className="text-sm">
                  I agree to submit all required documents *
                </Label>
              </div>
            </div>
          </div>
          
          <div>
            <Label htmlFor="signature">Digital Signature *</Label>
            <Input
              id="signature"
              placeholder="Type your full name as signature"
              {...formMethods.register('signature')}
            />
          </div>
          
          <div>
            <Label>Date</Label>
            <Input
              value={new Date().toLocaleDateString()}
              disabled
              className="bg-gray-100"
            />
          </div>
          
          <div>
            <Label>File Uploads</Label>
            <FileUpload
              onFileSelect={(file) => setUploadedFiles(prev => ({ ...prev, [file.name]: file }))}
              accept=".jpg,.jpeg,.png,.pdf"
              maxSize={3}
            />
          </div>
        </div>
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
                  Your employers liability claim has been submitted successfully. You will receive a confirmation email shortly.
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
    <div className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HardHat className="h-5 w-5" />
              Employers Liability Claim Form
            </CardTitle>
            <CardDescription>
              Submit your employers liability insurance claim
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MultiStepForm
              steps={steps}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              submitButtonText="Submit Claim"
              formMethods={formMethods}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EmployersLiabilityClaim;
