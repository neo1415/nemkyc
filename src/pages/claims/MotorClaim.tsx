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
import { Calendar, CalendarIcon, Plus, Trash2, Upload, Edit2, Car, FileText, CheckCircle2, Loader2 } from 'lucide-react';
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

// Motor Claim Schema
const motorClaimSchema = yup.object().shape({
  // Policy Details
  policyNumber: yup.string().required("Policy number is required"),
  periodOfCoverFrom: yup.date().required("Period of cover from is required"),
  periodOfCoverTo: yup.date().required("Period of cover to is required"),

  // Insured Details
  nameCompany: yup.string().required("Name/Company name is required"),
  title: yup.string().required("Title is required"),
  dateOfBirth: yup.date().required("Date of birth is required"),
  gender: yup.string().required("Gender is required"),
  address: yup.string().required("Address is required"),
  phone: yup.string().required("Phone number is required"),
  email: yup.string().email("Valid email is required").required("Email is required"),

  // Vehicle Details
  registrationNumber: yup.string().required("Registration number is required"),
  make: yup.string().required("Vehicle make is required"),
  model: yup.string().required("Vehicle model is required"),
  year: yup.number().required("Vehicle year is required"),
  engineNumber: yup.string().required("Engine number is required"),
  chassisNumber: yup.string().required("Chassis number is required"),
  registeredInYourName: yup.string().required("Please specify if registered in your name"),
  registeredInYourNameDetails: yup.string().when('registeredInYourName', {
    is: 'no',
    then: (schema) => schema.required("Details required when not registered in your name"),
    otherwise: (schema) => schema.notRequired()
  }),
  ownedSolely: yup.string().required("Please specify if owned solely by you"),
  ownedSolelyDetails: yup.string().when('ownedSolely', {
    is: 'no',
    then: (schema) => schema.required("Details required when not owned solely by you"),
    otherwise: (schema) => schema.notRequired()
  }),
  hirePurchase: yup.string().required("Please specify if subject to hire purchase"),
  hirePurchaseDetails: yup.string().when('hirePurchase', {
    is: 'yes',
    then: (schema) => schema.required("Details required for hire purchase agreement"),
    otherwise: (schema) => schema.notRequired()
  }),
  vehicleUsage: yup.string().required("Vehicle usage is required"),
  trailerAttached: yup.string().required("Please specify if trailer was attached"),
  damageDescription: yup.string().required("Damage description is required"),
  inspectionLocation: yup.string().required("Inspection location is required"),
  
  // Incident Details
  incidentLocation: yup.string().required("Incident location is required"),
  incidentDate: yup.date().required("Incident date is required"),
  incidentTime: yup.string().required("Incident time is required"),
  policeReported: yup.string().required("Please specify if reported to police"),
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
  
  // Other Drivers/Property Damage
  otherVehicleInvolved: yup.string().required("Please specify if other vehicle involved"),
  otherVehicleDetails: yup.object().when('otherVehicleInvolved', {
    is: 'yes',
    then: (schema) => schema.shape({
      regNumber: yup.string().required("Registration number required"),
      makeModel: yup.string().required("Make and model required"),
      name: yup.string().required("Driver name required"),
      phone: yup.string().required("Phone number required"),
      address: yup.string().required("Address required"),
      injuryDamage: yup.string().required("Injury/damage description required")
    }),
    otherwise: (schema) => schema.notRequired()
  }),

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

interface OtherVehicleDetails {
  regNumber: string;
  makeModel: string;
  name: string;
  phone: string;
  address: string;
  injuryDamage: string;
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
  year: number;
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
  
  // Other Drivers/Property
  otherVehicleInvolved: string;
  otherVehicleDetails?: OtherVehicleDetails;

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
  address: '',
  phone: '',
  email: '',
  gender: '',
  registrationNumber: '',
  make: '',
  model: '',
  engineNumber: '',
  chassisNumber: '',
  registeredInYourName: '',
  ownedSolely: '',
  hirePurchase: '',
  vehicleUsage: '',
  trailerAttached: '',
  damageDescription: '',
  inspectionLocation: '',
  incidentLocation: '',
  incidentTime: '',
  policeReported: '',
  incidentDescription: '',
  witnesses: [],
  otherVehicleInvolved: '',
  agreeToDataPrivacy: false,
  declarationTrue: false,
  declarationAdditionalInfo: false,
  declarationDocuments: false,
  signature: ''
};

const MotorClaim: React.FC = () => {
  const [showSummary, setShowSummary] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File>>({});

  const formMethods = useForm<any>({
    resolver: yupResolver(motorClaimSchema),
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
          uploadFile(file, 'motor-claims').then(url => [key + 'Url', url])
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
        formType: 'motor-claim'
      };
      
      // Submit to Firestore
      await addDoc(collection(db, 'motor-claims'), {
        ...submissionData,
        timestamp: serverTimestamp(),
        createdAt: new Date().toLocaleDateString('en-GB')
      });

      // Send confirmation email
      // await emailService.sendSubmissionConfirmation(data.email, 'Motor Insurance Claim');
      
      clearDraft();
      setShowSummary(false);
      setShowSuccess(true);
      toast({ title: "Motor claim submitted successfully!" });
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
                <p>Enter your full name or company name</p>
              </TooltipContent>
            </Tooltip>
            
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
                      Vehicle Registration Number *
                      <Info className="h-3 w-3" />
                    </Label>
                    <Input
                      id="registrationNumber"
                      {...formMethods.register('registrationNumber')}
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Enter the vehicle registration number</p>
                </TooltipContent>
              </Tooltip>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="make">Make *</Label>
                  <Input
                    id="make"
                    {...formMethods.register('make')}
                  />
                </div>
                <div>
                  <Label htmlFor="model">Model *</Label>
                  <Input
                    id="model"
                    {...formMethods.register('model')}
                  />
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="year">Year *</Label>
                <Input
                  id="year"
                  type="number"
                  {...formMethods.register('year')}
                />
              </div>
              <div>
                <Label htmlFor="engineNumber">Engine Number *</Label>
                <Input
                  id="engineNumber"
                  {...formMethods.register('engineNumber')}
                />
              </div>
              <div>
                <Label htmlFor="chassisNumber">Chassis Number *</Label>
                <Input
                  id="chassisNumber"
                  {...formMethods.register('chassisNumber')}
                />
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label>Registered in your name? *</Label>
                <Select
                  value={watchedValues.registeredInYourName || ''}
                  onValueChange={(value) => formMethods.setValue('registeredInYourName', value)}
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
              
              {watchedValues.registeredInYourName === 'no' && (
                <div>
                  <Label htmlFor="registeredInYourNameDetails">Details *</Label>
                  <Textarea
                    id="registeredInYourNameDetails"
                    {...formMethods.register('registeredInYourNameDetails')}
                  />
                </div>
              )}
              
              <div>
                <Label>Owned solely by you? *</Label>
                <Select
                  value={watchedValues.ownedSolely || ''}
                  onValueChange={(value) => formMethods.setValue('ownedSolely', value)}
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
              
              {watchedValues.ownedSolely === 'no' && (
                <div>
                  <Label htmlFor="ownedSolelyDetails">Details *</Label>
                  <Textarea
                    id="ownedSolelyDetails"
                    {...formMethods.register('ownedSolelyDetails')}
                  />
                </div>
              )}
              
              <div>
                <Label>Subject of a hire purchase agreement? *</Label>
                <Select
                  value={watchedValues.hirePurchase || ''}
                  onValueChange={(value) => formMethods.setValue('hirePurchase', value)}
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
              
              {watchedValues.hirePurchase === 'yes' && (
                <div>
                  <Label htmlFor="hirePurchaseDetails">Details *</Label>
                  <Textarea
                    id="hirePurchaseDetails"
                    {...formMethods.register('hirePurchaseDetails')}
                  />
                </div>
              )}
            </div>
            
            <div>
              <Label htmlFor="vehicleUsage">What was the vehicle being used for? *</Label>
              <Textarea
                id="vehicleUsage"
                {...formMethods.register('vehicleUsage')}
              />
            </div>
            
            <div>
              <Label>Was a trailer attached? *</Label>
              <Select
                value={watchedValues.trailerAttached || ''}
                onValueChange={(value) => formMethods.setValue('trailerAttached', value)}
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
            
            <div>
              <Label htmlFor="damageDescription">Brief description of damage *</Label>
              <Textarea
                id="damageDescription"
                {...formMethods.register('damageDescription')}
                rows={3}
              />
            </div>
            
            <div>
              <Label htmlFor="inspectionLocation">Name, address, phone where vehicle can be inspected *</Label>
              <Textarea
                id="inspectionLocation"
                {...formMethods.register('inspectionLocation')}
                rows={3}
              />
            </div>
          </div>
        </TooltipProvider>
      )
    },
    {
      id: 'incident',
      title: 'Circumstances of the Incident',
      component: (
        <TooltipProvider>
          <div className="space-y-4">
            <div>
              <Label htmlFor="incidentLocation">Where did the incident happen? *</Label>
              <Input
                id="incidentLocation"
                {...formMethods.register('incidentLocation')}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DatePickerField
                name="incidentDate"
                label="Date *"
              />
              <div>
                <Label htmlFor="incidentTime">Time *</Label>
                <Input
                  id="incidentTime"
                  type="time"
                  {...formMethods.register('incidentTime')}
                />
              </div>
            </div>
            
            <div>
              <Label>Reported to police? *</Label>
              <Select
                value={watchedValues.policeReported || ''}
                onValueChange={(value) => formMethods.setValue('policeReported', value)}
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
            
            {watchedValues.policeReported === 'yes' && (
              <div>
                <Label htmlFor="policeStationDetails">Station details *</Label>
                <Textarea
                  id="policeStationDetails"
                  {...formMethods.register('policeStationDetails')}
                />
              </div>
            )}
            
            <div>
              <Label htmlFor="incidentDescription">Full description of what happened *</Label>
              <Textarea
                id="incidentDescription"
                {...formMethods.register('incidentDescription')}
                rows={4}
              />
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
            <h3 className="text-lg font-medium">Witnesses</h3>
            <Button
              type="button"
              onClick={() => addWitness({ name: '', address: '', phone: '', isPassenger: false })}
              variant="outline"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Witness
            </Button>
          </div>
          
          {witnessFields.map((field, index) => (
            <div key={field.id} className="border p-4 rounded-lg space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-medium">Witness {index + 1}</h4>
                <Button
                  type="button"
                  onClick={() => removeWitness(index)}
                  variant="ghost"
                  size="sm"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor={`witnesses.${index}.name`}>Name *</Label>
                  <Input
                    {...formMethods.register(`witnesses.${index}.name`)}
                  />
                </div>
                <div>
                  <Label htmlFor={`witnesses.${index}.phone`}>Phone *</Label>
                  <Input
                    {...formMethods.register(`witnesses.${index}.phone`)}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor={`witnesses.${index}.address`}>Address *</Label>
                <Textarea
                  {...formMethods.register(`witnesses.${index}.address`)}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={`witnesses.${index}.isPassenger`}
                  checked={watchedValues.witnesses?.[index]?.isPassenger || false}
                  onCheckedChange={(checked) => 
                    formMethods.setValue(`witnesses.${index}.isPassenger`, checked)
                  }
                />
                <Label htmlFor={`witnesses.${index}.isPassenger`}>
                  Was a passenger
                </Label>
              </div>
            </div>
          ))}
          
          {witnessFields.length === 0 && (
            <div className="text-center p-8 text-gray-500">
              No witnesses added yet. Click "Add Witness" to add witness information.
            </div>
          )}
        </div>
      )
    },
    {
      id: 'otherDrivers',
      title: 'Other Drivers Involved and Property Damage',
      component: (
        <div className="space-y-4">
          <div>
            <Label>Another vehicle involved? *</Label>
            <Select
              value={watchedValues.otherVehicleInvolved || ''}
              onValueChange={(value) => formMethods.setValue('otherVehicleInvolved', value)}
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
          
          {watchedValues.otherVehicleInvolved === 'yes' && (
            <div className="bg-gray-50 p-4 rounded-lg space-y-4">
              <h3 className="font-medium">Other Vehicle Details</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="otherVehicleDetails.regNumber">Car reg number *</Label>
                  <Input
                    {...formMethods.register('otherVehicleDetails.regNumber')}
                  />
                </div>
                <div>
                  <Label htmlFor="otherVehicleDetails.makeModel">Make/model *</Label>
                  <Input
                    {...formMethods.register('otherVehicleDetails.makeModel')}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="otherVehicleDetails.name">Name *</Label>
                  <Input
                    {...formMethods.register('otherVehicleDetails.name')}
                  />
                </div>
                <div>
                  <Label htmlFor="otherVehicleDetails.phone">Phone *</Label>
                  <Input
                    {...formMethods.register('otherVehicleDetails.phone')}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="otherVehicleDetails.address">Address *</Label>
                <Textarea
                  {...formMethods.register('otherVehicleDetails.address')}
                />
              </div>
              
              <div>
                <Label htmlFor="otherVehicleDetails.injuryDamage">Description of injury/damage *</Label>
                <Textarea
                  {...formMethods.register('otherVehicleDetails.injuryDamage')}
                  rows={3}
                />
              </div>
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
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Car className="h-8 w-8 text-primary" />
            Motor Insurance Claim Form
          </h1>
          <p className="text-gray-600 mt-2">
            Submit your motor vehicle insurance claim with all required details and supporting documents.
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
              <DialogTitle>Review Your Motor Claim Submission</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><strong>Policy Number:</strong> {watchedValues.policyNumber}</div>
                <div><strong>Name/Company:</strong> {watchedValues.nameCompany}</div>
                <div><strong>Email:</strong> {watchedValues.email}</div>
                <div><strong>Vehicle:</strong> {watchedValues.make} {watchedValues.model}</div>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
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
                  Your motor insurance claim has been submitted successfully. 
                  You will receive a confirmation email shortly.
                </p>
                <div className="bg-blue-50 p-4 rounded-lg">
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

export default MotorClaim;
