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
import { Calendar, CalendarIcon, Upload, Edit2, Car, FileText, CheckCircle2, Loader2, Plus, Trash2, Info } from 'lucide-react';
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
  declarationAdditionalInfo: yup.boolean().oneOf([true], "You must agree to provide additional information"),
  declarationDocuments: yup.boolean().oneOf([true], "You must agree to submit documents"),
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

  // Other Vehicle
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
  declarationAdditionalInfo: boolean;
  declarationDocuments: boolean;
  signature: string;
}

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
  declarationAdditionalInfo: false,
  declarationDocuments: false,
  signature: ''
};

const MotorClaim: React.FC = () => {
  const { toast } = useToast();
  const [showSummary, setShowSummary] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File>>({});

  const formMethods = useForm<any>({
    // resolver: yupResolver(motorClaimSchema),
    defaultValues,
    mode: 'onChange'
  });

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

  const handleSubmit = async (data: MotorClaimData) => {
    setIsSubmitting(true);
    try {
      // Clean data by removing undefined values
      const cleanData = Object.fromEntries(
        Object.entries(data).filter(([_, value]) => value !== undefined)
      );

      // Upload files to Firebase Storage
      const fileUploadPromises: Array<Promise<[string, string]>> = [];
      
      Object.entries(uploadedFiles).forEach(([key, file]) => {
        fileUploadPromises.push(
          uploadFile(file, 'motor-claims').then(url => [key + 'Url', url])
        );
      });
      
      const uploadedUrls = await Promise.all(fileUploadPromises);
      const fileUrls = Object.fromEntries(uploadedUrls);
      
      // Prepare form data with file URLs
      const submissionData = {
        ...cleanData,
        ...fileUrls,
        status: 'processing',
        submittedAt: new Date().toISOString(),
        formType: 'motor-claim'
      };
      
      // Submit to Firestore
      await addDoc(collection(db, 'motor-claims'), {
        ...submissionData,
        timestamp: serverTimestamp(),
        createdAt: new Date().toLocaleDateString('en-GB')
      });

      // Send confirmation email
      // await emailService.sendSubmissionConfirmation(data.email, 'Motor Claim');
      
      clearDraft();
      setShowSummary(false);
      setShowSuccess(true);
      toast({
        title: "Claim Submitted Successfully",
        description: "Your motor claim has been submitted and you'll receive a confirmation email shortly.",
      });
    } catch (error) {
      console.error('Error submitting claim:', error);
      toast({
        title: "Submission Error",
        description: "There was an error submitting your claim. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const onFinalSubmit = (data: MotorClaimData) => {
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
                <p>Enter your motor insurance policy number</p>
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
                  <Label htmlFor="nameCompany" className="flex items-center gap-1">
                    Name / Company Name *
                    <Info className="h-3 w-3" />
                  </Label>
                  <Input
                    id="nameCompany"
                    {...formMethods.register('nameCompany')}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Enter the insured person's or company name</p>
              </TooltipContent>
            </Tooltip>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Label className="flex items-center gap-1">
                      Title *
                      <Info className="h-3 w-3" />
                    </Label>
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
                </TooltipTrigger>
                <TooltipContent>
                  <p>Select appropriate title</p>
                </TooltipContent>
              </Tooltip>

              <DatePickerField
                name="dateOfBirth"
                label="Date of Birth *"
              />

              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Label className="flex items-center gap-1">
                      Gender *
                      <Info className="h-3 w-3" />
                    </Label>
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
                </TooltipTrigger>
                <TooltipContent>
                  <p>Select gender</p>
                </TooltipContent>
              </Tooltip>
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
                  <p>Enter a valid phone number</p>
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
                  <p>Enter a valid email address</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </TooltipProvider>
      )
    },
    {
      id: 'vehicle',
      title: 'Vehicle Details',
      component: (
        <TooltipProvider>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Label htmlFor="registrationNumber" className="flex items-center gap-1">
                      Registration Number *
                      <Info className="h-3 w-3" />
                    </Label>
                    <Input
                      id="registrationNumber"
                      {...formMethods.register('registrationNumber')}
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Enter vehicle registration number</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Label htmlFor="make" className="flex items-center gap-1">
                      Make *
                      <Info className="h-3 w-3" />
                    </Label>
                    <Input
                      id="make"
                      {...formMethods.register('make')}
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Enter vehicle make (e.g., Toyota, Honda)</p>
                </TooltipContent>
              </Tooltip>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Label htmlFor="model" className="flex items-center gap-1">
                      Model *
                      <Info className="h-3 w-3" />
                    </Label>
                    <Input
                      id="model"
                      {...formMethods.register('model')}
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Enter vehicle model</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Label htmlFor="year" className="flex items-center gap-1">
                      Year *
                      <Info className="h-3 w-3" />
                    </Label>
                    <Input
                      id="year"
                      {...formMethods.register('year')}
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Enter vehicle year of manufacture</p>
                </TooltipContent>
              </Tooltip>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Label htmlFor="engineNumber" className="flex items-center gap-1">
                      Engine Number *
                      <Info className="h-3 w-3" />
                    </Label>
                    <Input
                      id="engineNumber"
                      {...formMethods.register('engineNumber')}
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Enter vehicle engine number</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Label htmlFor="chassisNumber" className="flex items-center gap-1">
                      Chassis Number *
                      <Info className="h-3 w-3" />
                    </Label>
                    <Input
                      id="chassisNumber"
                      {...formMethods.register('chassisNumber')}
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Enter vehicle chassis number</p>
                </TooltipContent>
              </Tooltip>
            </div>
            
            <div className="space-y-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Label className="flex items-center gap-1">
                      Is the vehicle registered in your name? *
                      <Info className="h-3 w-3" />
                    </Label>
                    <Select
                      value={watchedValues.registeredInYourName || ''}
                      onValueChange={(value) => formMethods.setValue('registeredInYourName', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select option" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Select whether the vehicle is registered in your name</p>
                </TooltipContent>
              </Tooltip>
              
              {watchedValues.registeredInYourName === 'no' && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <Label htmlFor="registeredInYourNameDetails" className="flex items-center gap-1">
                        Details *
                        <Info className="h-3 w-3" />
                      </Label>
                      <Textarea
                        id="registeredInYourNameDetails"
                        {...formMethods.register('registeredInYourNameDetails')}
                      />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Provide details about vehicle registration</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
            
            <div className="space-y-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Label className="flex items-center gap-1">
                      Is the vehicle owned solely by you? *
                      <Info className="h-3 w-3" />
                    </Label>
                    <Select
                      value={watchedValues.ownedSolely || ''}
                      onValueChange={(value) => formMethods.setValue('ownedSolely', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select option" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Select whether you are the sole owner</p>
                </TooltipContent>
              </Tooltip>
              
              {watchedValues.ownedSolely === 'no' && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <Label htmlFor="ownedSolelyDetails" className="flex items-center gap-1">
                        Details *
                        <Info className="h-3 w-3" />
                      </Label>
                      <Textarea
                        id="ownedSolelyDetails"
                        {...formMethods.register('ownedSolelyDetails')}
                      />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Provide details about vehicle ownership</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
            
            <div className="space-y-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Label className="flex items-center gap-1">
                      Is the vehicle under hire purchase? *
                      <Info className="h-3 w-3" />
                    </Label>
                    <Select
                      value={watchedValues.hirePurchase || ''}
                      onValueChange={(value) => formMethods.setValue('hirePurchase', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select option" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Select whether vehicle is under hire purchase</p>
                </TooltipContent>
              </Tooltip>
              
              {watchedValues.hirePurchase === 'yes' && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <Label htmlFor="hirePurchaseDetails" className="flex items-center gap-1">
                        Details *
                        <Info className="h-3 w-3" />
                      </Label>
                      <Textarea
                        id="hirePurchaseDetails"
                        {...formMethods.register('hirePurchaseDetails')}
                      />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Provide hire purchase details</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <Label className="flex items-center gap-1">
                    Vehicle Usage *
                    <Info className="h-3 w-3" />
                  </Label>
                  <Select
                    value={watchedValues.vehicleUsage || ''}
                    onValueChange={(value) => formMethods.setValue('vehicleUsage', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select usage" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Private">Private</SelectItem>
                      <SelectItem value="Commercial">Commercial</SelectItem>
                      <SelectItem value="Business">Business</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Select primary vehicle usage</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <Label className="flex items-center gap-1">
                    Was a trailer attached? *
                    <Info className="h-3 w-3" />
                  </Label>
                  <Select
                    value={watchedValues.trailerAttached || ''}
                    onValueChange={(value) => formMethods.setValue('trailerAttached', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select option" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">Yes</SelectItem>
                      <SelectItem value="no">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Select whether a trailer was attached</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      )
    },
    {
      id: 'damage',
      title: 'Damage Details',
      component: (
        <TooltipProvider>
          <div className="space-y-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <Label htmlFor="damageDescription" className="flex items-center gap-1">
                    Description of Damage *
                    <Info className="h-3 w-3" />
                  </Label>
                  <Textarea
                    id="damageDescription"
                    {...formMethods.register('damageDescription')}
                    rows={3}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Describe the damage to your vehicle</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <Label htmlFor="inspectionLocation" className="flex items-center gap-1">
                    Where can the vehicle be inspected? *
                    <Info className="h-3 w-3" />
                  </Label>
                  <Textarea
                    id="inspectionLocation"
                    {...formMethods.register('inspectionLocation')}
                    rows={2}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Provide location where vehicle can be inspected</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      )
    },
    {
      id: 'incident',
      title: 'Incident Details',
      component: (
        <TooltipProvider>
          <div className="space-y-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <Label htmlFor="incidentLocation" className="flex items-center gap-1">
                    Where did the incident occur? *
                    <Info className="h-3 w-3" />
                  </Label>
                  <Textarea
                    id="incidentLocation"
                    {...formMethods.register('incidentLocation')}
                    rows={2}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Describe the exact location of the incident</p>
              </TooltipContent>
            </Tooltip>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DatePickerField
                name="incidentDate"
                label="Date of Incident *"
              />
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Label htmlFor="incidentTime" className="flex items-center gap-1">
                      Time of Incident *
                      <Info className="h-3 w-3" />
                    </Label>
                    <Input
                      id="incidentTime"
                      type="time"
                      {...formMethods.register('incidentTime')}
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Enter the time when incident occurred</p>
                </TooltipContent>
              </Tooltip>
            </div>
            
            <div className="space-y-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Label className="flex items-center gap-1">
                      Was the incident reported to police? *
                      <Info className="h-3 w-3" />
                    </Label>
                    <Select
                      value={watchedValues.policeReported || ''}
                      onValueChange={(value) => formMethods.setValue('policeReported', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select option" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Select whether incident was reported to police</p>
                </TooltipContent>
              </Tooltip>
              
              {watchedValues.policeReported === 'yes' && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <Label htmlFor="policeStationDetails" className="flex items-center gap-1">
                        Police Station Details *
                        <Info className="h-3 w-3" />
                      </Label>
                      <Textarea
                        id="policeStationDetails"
                        {...formMethods.register('policeStationDetails')}
                        rows={2}
                      />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Provide police station details and report number if available</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <Label htmlFor="incidentDescription" className="flex items-center gap-1">
                    Description of How Incident Occurred *
                    <Info className="h-3 w-3" />
                  </Label>
                  <Textarea
                    id="incidentDescription"
                    {...formMethods.register('incidentDescription')}
                    rows={4}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Provide detailed description of how the incident occurred</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      )
    },
    {
      id: 'witnesses',
      title: 'Witnesses',
      component: (
        <TooltipProvider>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">Witnesses</h3>
                <p className="text-sm text-muted-foreground">Add any witnesses to the incident</p>
              </div>
              <Button
                type="button"
                onClick={() => addWitness({ name: '', address: '', phone: '', isPassenger: false })}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Witness
              </Button>
            </div>
            
            {witnessFields.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <p>No witnesses added yet</p>
                <p className="text-sm">Click "Add Witness" to add witnesses</p>
              </div>
            )}
            
            {witnessFields.map((field, index) => (
              <Card key={field.id} className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium">Witness {index + 1}</h4>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => removeWitness(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="space-y-3">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        <Label htmlFor={`witnesses.${index}.name`} className="flex items-center gap-1">
                          Name *
                          <Info className="h-3 w-3" />
                        </Label>
                        <Input
                          id={`witnesses.${index}.name`}
                          {...formMethods.register(`witnesses.${index}.name`)}
                        />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Enter the witness's full name</p>
                    </TooltipContent>
                  </Tooltip>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        <Label htmlFor={`witnesses.${index}.address`} className="flex items-center gap-1">
                          Address *
                          <Info className="h-3 w-3" />
                        </Label>
                        <Textarea
                          id={`witnesses.${index}.address`}
                          {...formMethods.register(`witnesses.${index}.address`)}
                          rows={2}
                        />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Enter the witness's full address</p>
                    </TooltipContent>
                  </Tooltip>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        <Label htmlFor={`witnesses.${index}.phone`} className="flex items-center gap-1">
                          Phone Number *
                          <Info className="h-3 w-3" />
                        </Label>
                        <Input
                          id={`witnesses.${index}.phone`}
                          {...formMethods.register(`witnesses.${index}.phone`)}
                        />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Enter the witness's phone number</p>
                    </TooltipContent>
                  </Tooltip>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`witnesses.${index}.isPassenger`}
                      checked={watchedValues.witnesses?.[index]?.isPassenger || false}
                      onCheckedChange={(checked) => 
                        formMethods.setValue(`witnesses.${index}.isPassenger`, !!checked)
                      }
                    />
                    <Label htmlFor={`witnesses.${index}.isPassenger`}>
                      Was this person a passenger in your vehicle?
                    </Label>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TooltipProvider>
      )
    },
    {
      id: 'other-vehicle',
      title: 'Other Vehicle',
      component: (
        <TooltipProvider>
          <div className="space-y-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <Label className="flex items-center gap-1">
                    Was another vehicle involved? *
                    <Info className="h-3 w-3" />
                  </Label>
                  <Select
                    value={watchedValues.otherVehicleInvolved || ''}
                    onValueChange={(value) => formMethods.setValue('otherVehicleInvolved', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select option" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">Yes</SelectItem>
                      <SelectItem value="no">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Select whether another vehicle was involved</p>
              </TooltipContent>
            </Tooltip>
            
            {watchedValues.otherVehicleInvolved === 'yes' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        <Label htmlFor="otherVehicleRegNumber" className="flex items-center gap-1">
                          Registration Number *
                          <Info className="h-3 w-3" />
                        </Label>
                        <Input
                          id="otherVehicleRegNumber"
                          {...formMethods.register('otherVehicleRegNumber')}
                        />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Enter other vehicle's registration number</p>
                    </TooltipContent>
                  </Tooltip>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        <Label htmlFor="otherVehicleMakeModel" className="flex items-center gap-1">
                          Make and Model *
                          <Info className="h-3 w-3" />
                        </Label>
                        <Input
                          id="otherVehicleMakeModel"
                          {...formMethods.register('otherVehicleMakeModel')}
                        />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Enter other vehicle's make and model</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <Label htmlFor="otherDriverName" className="flex items-center gap-1">
                        Driver's Name *
                        <Info className="h-3 w-3" />
                      </Label>
                      <Input
                        id="otherDriverName"
                        {...formMethods.register('otherDriverName')}
                      />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Enter other driver's full name</p>
                  </TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <Label htmlFor="otherDriverPhone" className="flex items-center gap-1">
                        Driver's Phone *
                        <Info className="h-3 w-3" />
                      </Label>
                      <Input
                        id="otherDriverPhone"
                        {...formMethods.register('otherDriverPhone')}
                      />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Enter other driver's phone number</p>
                  </TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <Label htmlFor="otherDriverAddress" className="flex items-center gap-1">
                        Driver's Address *
                        <Info className="h-3 w-3" />
                      </Label>
                      <Textarea
                        id="otherDriverAddress"
                        {...formMethods.register('otherDriverAddress')}
                        rows={2}
                      />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Enter other driver's full address</p>
                  </TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <Label htmlFor="otherVehicleInjuryDamage" className="flex items-center gap-1">
                        Injury/Damage to Other Vehicle
                        <Info className="h-3 w-3" />
                      </Label>
                      <Textarea
                        id="otherVehicleInjuryDamage"
                        {...formMethods.register('otherVehicleInjuryDamage')}
                        rows={3}
                      />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Describe any injury or damage to the other vehicle</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            )}
          </div>
        </TooltipProvider>
      )
    },
    {
      id: 'declaration',
      title: 'Declaration',
      component: (
        <TooltipProvider>
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="agreeToDataPrivacy"
                  checked={watchedValues.agreeToDataPrivacy || false}
                  onCheckedChange={(checked) => formMethods.setValue('agreeToDataPrivacy', !!checked)}
                />
                <Label htmlFor="agreeToDataPrivacy" className="text-sm leading-relaxed">
                  I agree to the processing of my personal data in accordance with the data privacy policy
                </Label>
              </div>
              
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="declarationTrue"
                  checked={watchedValues.declarationTrue || false}
                  onCheckedChange={(checked) => formMethods.setValue('declarationTrue', !!checked)}
                />
                <Label htmlFor="declarationTrue" className="text-sm leading-relaxed">
                  I declare that all the statements made in this claim are true to the best of my knowledge
                </Label>
              </div>
              
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="declarationAdditionalInfo"
                  checked={watchedValues.declarationAdditionalInfo || false}
                  onCheckedChange={(checked) => formMethods.setValue('declarationAdditionalInfo', !!checked)}
                />
                <Label htmlFor="declarationAdditionalInfo" className="text-sm leading-relaxed">
                  I agree to provide any additional information that may be required
                </Label>
              </div>
              
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="declarationDocuments"
                  checked={watchedValues.declarationDocuments || false}
                  onCheckedChange={(checked) => formMethods.setValue('declarationDocuments', !!checked)}
                />
                <Label htmlFor="declarationDocuments" className="text-sm leading-relaxed">
                  I agree to submit all necessary supporting documents
                </Label>
              </div>
            </div>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <Label htmlFor="signature" className="flex items-center gap-1">
                    Signature *
                    <Info className="h-3 w-3" />
                  </Label>
                  <Input
                    id="signature"
                    {...formMethods.register('signature')}
                    placeholder="Type your full name as signature"
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Type your full name as your digital signature</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      )
    }
  ];

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-green-600">Claim Submitted!</CardTitle>
            <CardDescription>
              Your motor claim has been successfully submitted. You'll receive a confirmation email shortly.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => window.location.href = '/claims'}
              className="w-full"
            >
              Back to Claims
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
              <Car className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">Motor Claim Form</h1>
            <p className="text-muted-foreground">
              Submit your motor insurance claim with all required details
            </p>
          </div>

          <MultiStepForm
            steps={steps}
            onFinalSubmit={onFinalSubmit}
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
                  <h4 className="font-medium">Vehicle</h4>
                  <p className="text-sm text-muted-foreground">
                    {watchedValues.make} {watchedValues.model} ({watchedValues.year}) - {watchedValues.registrationNumber}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium">Incident</h4>
                  <p className="text-sm text-muted-foreground">
                    {watchedValues.incidentDate && format(new Date(watchedValues.incidentDate), "PPP")} at {watchedValues.incidentTime}
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
        </div>
      </div>
    </div>
  );
};

export default MotorClaim;
