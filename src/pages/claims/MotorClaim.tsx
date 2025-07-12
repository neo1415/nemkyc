import React, { useState } from 'react';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar as ReactCalendar } from '@/components/ui/calendar';
import { Calendar, CalendarIcon, Plus, Trash2, Upload, Edit2, Car, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import MultiStepForm from '@/components/common/MultiStepForm';
import { useFormDraft } from '@/hooks/useFormDraft';
import FileUpload from '@/components/common/FileUpload';
import { uploadFile } from '@/services/fileService';
import { db } from '@/firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

// Motor Claim Schema
const motorClaimSchema = yup.object().shape({
  // Policy Details
  policyNumber: yup.string().required("Policy number is required"),
  periodOfCoverFrom: yup.date().required("Period of cover from is required"),
  periodOfCoverTo: yup.date().required("Period of cover to is required"),

  // Insured Details
  nameOfInsured: yup.string().required("Name of insured is required"),
  address: yup.string().required("Address is required"),
  phone: yup.string().required("Phone number is required"),
  email: yup.string().email("Valid email is required").required("Email is required"),

  // Vehicle Details
  make: yup.string().required("Vehicle make is required"),
  model: yup.string().required("Vehicle model is required"),
  year: yup.number().required("Vehicle year is required"),
  registrationNumber: yup.string().required("Registration number is required"),
  chassisNumber: yup.string().required("Chassis number is required"),
  engineNumber: yup.string().required("Engine number is required"),
  color: yup.string().required("Vehicle color is required"),
  
  // Accident Details
  accidentDate: yup.date().required("Accident date is required"),
  accidentTime: yup.string().required("Accident time is required"),
  accidentPlace: yup.string().required("Accident place is required"),
  accidentDescription: yup.string().required("Accident description is required"),
  
  // Driver Details
  driverName: yup.string().required("Driver name is required"),
  driverLicenseNumber: yup.string().required("Driver license number is required"),
  driverAge: yup.number().required("Driver age is required"),
  
  // Damage Details
  damageDescription: yup.string().required("Damage description is required"),
  estimatedRepairCost: yup.number().required("Estimated repair cost is required"),
  
  // Police Details
  policeReported: yup.boolean(),
  policeStation: yup.string().when('policeReported', {
    is: true,
    then: (schema) => schema.required("Police station is required when reported"),
    otherwise: (schema) => schema.notRequired()
  }),
  
  // Third Party Details
  thirdPartyInvolved: yup.boolean(),
  thirdPartyName: yup.string().when('thirdPartyInvolved', {
    is: true,
    then: (schema) => schema.required("Third party name is required"),
    otherwise: (schema) => schema.notRequired()
  }),
  thirdPartyInsurer: yup.string().when('thirdPartyInvolved', {
    is: true,
    then: (schema) => schema.required("Third party insurer is required"),
    otherwise: (schema) => schema.notRequired()
  }),

  // Declaration
  agreeToDataPrivacy: yup.boolean().oneOf([true], "You must agree to data privacy"),
  signature: yup.string().required("Signature is required")
});

interface MotorClaimData {
  // Policy Details
  policyNumber: string;
  periodOfCoverFrom: string;
  periodOfCoverTo: string;

  // Insured Details
  nameOfInsured: string;
  address: string;
  phone: string;
  email: string;

  // Vehicle Details
  make: string;
  model: string;
  year: number;
  registrationNumber: string;
  chassisNumber: string;
  engineNumber: string;
  color: string;
  
  // Accident Details
  accidentDate: string;
  accidentTime: string;
  accidentPlace: string;
  accidentDescription: string;
  
  // Driver Details
  driverName: string;
  driverLicenseNumber: string;
  driverAge: number;
  
  // Damage Details
  damageDescription: string;
  estimatedRepairCost: number;
  
  // Police Details
  policeReported: boolean;
  policeStation?: string;
  
  // Third Party Details
  thirdPartyInvolved: boolean;
  thirdPartyName?: string;
  thirdPartyInsurer?: string;

  // Declaration
  agreeToDataPrivacy: boolean;
  signature: string;
}

const defaultValues: Partial<MotorClaimData> = {
  policyNumber: '',
  nameOfInsured: '',
  address: '',
  phone: '',
  email: '',
  make: '',
  model: '',
  registrationNumber: '',
  chassisNumber: '',
  engineNumber: '',
  color: '',
  accidentPlace: '',
  accidentDescription: '',
  driverName: '',
  driverLicenseNumber: '',
  damageDescription: '',
  policeReported: false,
  thirdPartyInvolved: false,
  agreeToDataPrivacy: false,
  signature: ''
};

const MotorClaim: React.FC = () => {
  const [showSummary, setShowSummary] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File>>({});
  const [editingField, setEditingField] = useState<string | null>(null);

  const formMethods = useForm<any>({
    resolver: yupResolver(motorClaimSchema),
    defaultValues,
    mode: 'onChange'
  });

  const { saveDraft, clearDraft } = useFormDraft('motorClaim', formMethods);

  const watchedValues = formMethods.watch();

  // Auto-save draft
  React.useEffect(() => {
    const subscription = formMethods.watch((data) => {
      saveDraft(data);
    });
    return () => subscription.unsubscribe();
  }, [formMethods, saveDraft]);

  const handleSubmit = async (data: MotorClaimData) => {
    setIsSubmitting(true);
    try {
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
      title: 'Policy Information',
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
                name="periodOfCoverFrom"
                label="Period of Cover From *"
              />
            </div>
            <div>
              <DatePickerField
                name="periodOfCoverTo"
                label="Period of Cover To *"
              />
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'insured',
      title: 'Insured Information',
      component: (
        <div className="space-y-4">
          <div>
            <Label htmlFor="nameOfInsured">Name of Insured *</Label>
            <Input
              id="nameOfInsured"
              {...formMethods.register('nameOfInsured')}
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
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                {...formMethods.register('phone')}
              />
            </div>
            <div>
              <Label htmlFor="email">Email Address *</Label>
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
      id: 'vehicle',
      title: 'Vehicle Information',
      component: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <div>
              <Label htmlFor="year">Year *</Label>
              <Input
                id="year"
                type="number"
                {...formMethods.register('year')}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="registrationNumber">Registration Number *</Label>
              <Input
                id="registrationNumber"
                {...formMethods.register('registrationNumber')}
              />
            </div>
            <div>
              <Label htmlFor="color">Color *</Label>
              <Input
                id="color"
                {...formMethods.register('color')}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="chassisNumber">Chassis Number *</Label>
              <Input
                id="chassisNumber"
                {...formMethods.register('chassisNumber')}
              />
            </div>
            <div>
              <Label htmlFor="engineNumber">Engine Number *</Label>
              <Input
                id="engineNumber"
                {...formMethods.register('engineNumber')}
              />
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'accident',
      title: 'Accident Details',
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
            <Label htmlFor="accidentPlace">Place of Accident *</Label>
            <Input
              id="accidentPlace"
              {...formMethods.register('accidentPlace')}
            />
          </div>
          
          <div>
            <Label htmlFor="accidentDescription">Description of Accident *</Label>
            <Textarea
              id="accidentDescription"
              rows={4}
              {...formMethods.register('accidentDescription')}
            />
          </div>
          
          <div>
            <Label htmlFor="damageDescription">Description of Damage *</Label>
            <Textarea
              id="damageDescription"
              rows={4}
              {...formMethods.register('damageDescription')}
            />
          </div>
          
          <div>
            <Label htmlFor="estimatedRepairCost">Estimated Repair Cost *</Label>
            <Input
              id="estimatedRepairCost"
              type="number"
              {...formMethods.register('estimatedRepairCost')}
            />
          </div>
        </div>
      )
    },
    {
      id: 'driver',
      title: 'Driver Information',
      component: (
        <div className="space-y-4">
          <div>
            <Label htmlFor="driverName">Driver Name *</Label>
            <Input
              id="driverName"
              {...formMethods.register('driverName')}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="driverLicenseNumber">Driver License Number *</Label>
              <Input
                id="driverLicenseNumber"
                {...formMethods.register('driverLicenseNumber')}
              />
            </div>
            <div>
              <Label htmlFor="driverAge">Driver Age *</Label>
              <Input
                id="driverAge"
                type="number"
                {...formMethods.register('driverAge')}
              />
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'police',
      title: 'Police & Third Party Details',
      component: (
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="policeReported"
              checked={watchedValues.policeReported || false}
              onCheckedChange={(checked) => formMethods.setValue('policeReported', checked)}
            />
            <Label htmlFor="policeReported">Was the accident reported to police?</Label>
          </div>
          
          {watchedValues.policeReported && (
            <div>
              <Label htmlFor="policeStation">Police Station *</Label>
              <Input
                id="policeStation"
                {...formMethods.register('policeStation')}
              />
            </div>
          )}
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="thirdPartyInvolved"
              checked={watchedValues.thirdPartyInvolved || false}
              onCheckedChange={(checked) => formMethods.setValue('thirdPartyInvolved', checked)}
            />
            <Label htmlFor="thirdPartyInvolved">Was third party involved?</Label>
          </div>
          
          {watchedValues.thirdPartyInvolved && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="thirdPartyName">Third Party Name *</Label>
                <Input
                  id="thirdPartyName"
                  {...formMethods.register('thirdPartyName')}
                />
              </div>
              <div>
                <Label htmlFor="thirdPartyInsurer">Third Party Insurer *</Label>
                <Input
                  id="thirdPartyInsurer"
                  {...formMethods.register('thirdPartyInsurer')}
                />
              </div>
            </div>
          )}
        </div>
      )
    },
    {
      id: 'documents',
      title: 'Document Uploads',
      component: (
        <div className="space-y-6">
          <FileUpload
            label="Vehicle Photos (showing damage)"
            onFileSelect={(file) => setUploadedFiles(prev => ({ ...prev, vehiclePhotos: file }))}
            accept="image/*"
            currentFile={uploadedFiles.vehiclePhotos}
          />
          
          <FileUpload
            label="Driver's License"
            onFileSelect={(file) => setUploadedFiles(prev => ({ ...prev, driverLicense: file }))}
            accept="image/*,.pdf"
            currentFile={uploadedFiles.driverLicense}
          />
          
          <FileUpload
            label="Vehicle Registration Document"
            onFileSelect={(file) => setUploadedFiles(prev => ({ ...prev, vehicleRegistration: file }))}
            accept="image/*,.pdf"
            currentFile={uploadedFiles.vehicleRegistration}
          />
          
          {watchedValues.policeReported && (
            <FileUpload
              label="Police Report"
              onFileSelect={(file) => setUploadedFiles(prev => ({ ...prev, policeReport: file }))}
              accept="image/*,.pdf"
              currentFile={uploadedFiles.policeReport}
            />
          )}
        </div>
      )
    },
    {
      id: 'declaration',
      title: 'Declaration',
      component: (
        <div className="space-y-6">
          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-medium mb-4">Declaration</h4>
            <div className="space-y-2 text-sm">
              <p>I/We declare that the statements made and the answers given are true and complete. I/We understand that any false information may invalidate the claim.</p>
              <p>I/We agree to provide additional information as may be required by the Company.</p>
              <p>I/We authorize the Company to obtain medical reports and other information relevant to this claim.</p>
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
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="agreeToDataPrivacy"
              checked={watchedValues.agreeToDataPrivacy || false}
              onCheckedChange={(checked) => formMethods.setValue('agreeToDataPrivacy', checked)}
            />
            <Label htmlFor="agreeToDataPrivacy">
              I agree to the data privacy terms and conditions *
            </Label>
          </div>
        </div>
      )
    }
  ];

  if (showSuccess) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <div className="mb-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Claim Submitted Successfully!</h1>
            <p className="text-gray-600">
              Your motor insurance claim has been submitted and is being processed. 
              You will receive a confirmation email shortly.
            </p>
          </div>
          <Button onClick={() => window.location.href = '/dashboard'}>
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Car className="h-8 w-8 text-primary" />
            Motor Insurance Claim
          </h1>
          <p className="text-gray-600 mt-2">
            Submit your motor vehicle insurance claim with all required details and supporting documents.
          </p>
        </div>

        <MultiStepForm
          steps={steps}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          formMethods={formMethods}
        />
      </div>
    </div>
  );
};

export default MotorClaim;