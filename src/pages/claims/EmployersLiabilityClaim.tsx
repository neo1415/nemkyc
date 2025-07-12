import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
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
import { Calendar, CalendarIcon, Upload, Edit2, HardHat, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import MultiStepForm from '@/components/common/MultiStepForm';
import { useFormDraft } from '@/hooks/useFormDraft';
import FileUpload from '@/components/common/FileUpload';
import { uploadFile } from '@/services/fileService';
import { db } from '@/firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

// Employers Liability Claim Schema
const employersLiabilityClaimSchema = yup.object().shape({
  // Policy Details
  policyNumber: yup.string().required("Policy number is required"),
  periodOfCoverFrom: yup.date().required("Period of cover from is required"),
  periodOfCoverTo: yup.date().required("Period of cover to is required"),

  // Insured Details
  companyName: yup.string().required("Company name is required"),
  address: yup.string().required("Address is required"),
  phone: yup.string().required("Phone number is required"),
  email: yup.string().email("Valid email is required").required("Email is required"),

  // Employee Details
  employeeName: yup.string().required("Employee name is required"),
  employeeAddress: yup.string().required("Employee address is required"),
  employeeAge: yup.number().required("Employee age is required"),
  employeeJobTitle: yup.string().required("Employee job title is required"),
  employmentStartDate: yup.date().required("Employment start date is required"),
  employeeWages: yup.number().required("Employee wages is required"),

  // Accident Details
  accidentDate: yup.date().required("Accident date is required"),
  accidentTime: yup.string().required("Accident time is required"),
  accidentLocation: yup.string().required("Accident location is required"),
  accidentDescription: yup.string().required("Accident description is required"),
  injuryNature: yup.string().required("Nature of injury is required"),
  injuryBodyPart: yup.string().required("Injured body part is required"),

  // Medical Details
  medicalAttentionGiven: yup.boolean(),
  doctorName: yup.string().when('medicalAttentionGiven', {
    is: true,
    then: (schema) => schema.required("Doctor name required when medical attention given"),
    otherwise: (schema) => schema.notRequired()
  }),
  hospitalName: yup.string().when('medicalAttentionGiven', {
    is: true,
    then: (schema) => schema.required("Hospital name required when medical attention given"),
    otherwise: (schema) => schema.notRequired()
  }),
  medicalCosts: yup.number().when('medicalAttentionGiven', {
    is: true,
    then: (schema) => schema.required("Medical costs required when medical attention given"),
    otherwise: (schema) => schema.notRequired()
  }),

  // Witness Information
  witnessName: yup.string(),
  witnessAddress: yup.string(),
  witnessPhone: yup.string(),

  // Safety Measures
  safetyMeasuresInPlace: yup.boolean(),
  safetyMeasuresDetails: yup.string().when('safetyMeasuresInPlace', {
    is: true,
    then: (schema) => schema.required("Safety measures details required"),
    otherwise: (schema) => schema.notRequired()
  }),
  employeeTraining: yup.boolean(),
  trainingDetails: yup.string().when('employeeTraining', {
    is: true,
    then: (schema) => schema.required("Training details required"),
    otherwise: (schema) => schema.notRequired()
  }),

  // Previous Claims
  hasPreviousClaims: yup.boolean(),
  previousClaimsDetails: yup.string().when('hasPreviousClaims', {
    is: true,
    then: (schema) => schema.required("Previous claims details required"),
    otherwise: (schema) => schema.notRequired()
  }),

  // Declaration
  agreeToDataPrivacy: yup.boolean().oneOf([true], "You must agree to data privacy"),
  signature: yup.string().required("Signature is required")
});

interface EmployersLiabilityClaimData {
  // Policy Details
  policyNumber: string;
  periodOfCoverFrom: string;
  periodOfCoverTo: string;

  // Insured Details
  companyName: string;
  address: string;
  phone: string;
  email: string;

  // Employee Details
  employeeName: string;
  employeeAddress: string;
  employeeAge: number;
  employeeJobTitle: string;
  employmentStartDate: string;
  employeeWages: number;

  // Accident Details
  accidentDate: string;
  accidentTime: string;
  accidentLocation: string;
  accidentDescription: string;
  injuryNature: string;
  injuryBodyPart: string;

  // Medical Details
  medicalAttentionGiven: boolean;
  doctorName?: string;
  hospitalName?: string;
  medicalCosts?: number;

  // Witness Information
  witnessName?: string;
  witnessAddress?: string;
  witnessPhone?: string;

  // Safety Measures
  safetyMeasuresInPlace: boolean;
  safetyMeasuresDetails?: string;
  employeeTraining: boolean;
  trainingDetails?: string;

  // Previous Claims
  hasPreviousClaims: boolean;
  previousClaimsDetails?: string;

  // Declaration
  agreeToDataPrivacy: boolean;
  signature: string;
}

const defaultValues: Partial<EmployersLiabilityClaimData> = {
  policyNumber: '',
  companyName: '',
  address: '',
  phone: '',
  email: '',
  employeeName: '',
  employeeAddress: '',
  employeeJobTitle: '',
  accidentLocation: '',
  accidentDescription: '',
  injuryNature: '',
  injuryBodyPart: '',
  medicalAttentionGiven: false,
  safetyMeasuresInPlace: false,
  employeeTraining: false,
  hasPreviousClaims: false,
  agreeToDataPrivacy: false,
  signature: ''
};

const EmployersLiabilityClaim: React.FC = () => {
  const [showSummary, setShowSummary] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File>>({});

  const formMethods = useForm<any>({
    resolver: yupResolver(employersLiabilityClaimSchema),
    defaultValues,
    mode: 'onChange'
  });

  const { saveDraft, clearDraft } = useFormDraft('employersLiabilityClaim', formMethods);

  const watchedValues = formMethods.watch();

  // Auto-save draft
  React.useEffect(() => {
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
      
      clearDraft();
      setShowSummary(false);
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
      title: 'Company Information',
      component: (
        <div className="space-y-4">
          <div>
            <Label htmlFor="companyName">Company Name *</Label>
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
      id: 'employee',
      title: 'Employee Information',
      component: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="employeeName">Employee Name *</Label>
              <Input
                id="employeeName"
                {...formMethods.register('employeeName')}
              />
            </div>
            <div>
              <Label htmlFor="employeeAge">Employee Age *</Label>
              <Input
                id="employeeAge"
                type="number"
                {...formMethods.register('employeeAge')}
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="employeeAddress">Employee Address *</Label>
            <Textarea
              id="employeeAddress"
              {...formMethods.register('employeeAddress')}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="employeeJobTitle">Job Title *</Label>
              <Input
                id="employeeJobTitle"
                {...formMethods.register('employeeJobTitle')}
              />
            </div>
            <div>
              <DatePickerField
                name="employmentStartDate"
                label="Employment Start Date *"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="employeeWages">Employee Wages (per month) *</Label>
            <Input
              id="employeeWages"
              type="number"
              {...formMethods.register('employeeWages')}
            />
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
            <Label htmlFor="accidentLocation">Location of Accident *</Label>
            <Input
              id="accidentLocation"
              {...formMethods.register('accidentLocation')}
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="injuryNature">Nature of Injury *</Label>
              <Input
                id="injuryNature"
                {...formMethods.register('injuryNature')}
              />
            </div>
            <div>
              <Label htmlFor="injuryBodyPart">Injured Body Part *</Label>
              <Input
                id="injuryBodyPart"
                {...formMethods.register('injuryBodyPart')}
              />
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'medical',
      title: 'Medical Details',
      component: (
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="medicalAttentionGiven"
              checked={watchedValues.medicalAttentionGiven || false}
              onCheckedChange={(checked) => formMethods.setValue('medicalAttentionGiven', checked)}
            />
            <Label htmlFor="medicalAttentionGiven">Was medical attention given?</Label>
          </div>
          
          {watchedValues.medicalAttentionGiven && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="doctorName">Doctor Name *</Label>
                  <Input
                    id="doctorName"
                    {...formMethods.register('doctorName')}
                  />
                </div>
                <div>
                  <Label htmlFor="hospitalName">Hospital/Clinic Name *</Label>
                  <Input
                    id="hospitalName"
                    {...formMethods.register('hospitalName')}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="medicalCosts">Medical Costs *</Label>
                <Input
                  id="medicalCosts"
                  type="number"
                  {...formMethods.register('medicalCosts')}
                />
              </div>
            </div>
          )}
        </div>
      )
    },
    {
      id: 'witness',
      title: 'Witness Information',
      component: (
        <div className="space-y-4">
          <div>
            <Label htmlFor="witnessName">Witness Name</Label>
            <Input
              id="witnessName"
              {...formMethods.register('witnessName')}
            />
          </div>
          
          <div>
            <Label htmlFor="witnessAddress">Witness Address</Label>
            <Textarea
              id="witnessAddress"
              {...formMethods.register('witnessAddress')}
            />
          </div>
          
          <div>
            <Label htmlFor="witnessPhone">Witness Phone</Label>
            <Input
              id="witnessPhone"
              {...formMethods.register('witnessPhone')}
            />
          </div>
        </div>
      )
    },
    {
      id: 'safety',
      title: 'Safety Measures',
      component: (
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="safetyMeasuresInPlace"
              checked={watchedValues.safetyMeasuresInPlace || false}
              onCheckedChange={(checked) => formMethods.setValue('safetyMeasuresInPlace', checked)}
            />
            <Label htmlFor="safetyMeasuresInPlace">Were safety measures in place?</Label>
          </div>
          
          {watchedValues.safetyMeasuresInPlace && (
            <div>
              <Label htmlFor="safetyMeasuresDetails">Details of Safety Measures *</Label>
              <Textarea
                id="safetyMeasuresDetails"
                {...formMethods.register('safetyMeasuresDetails')}
              />
            </div>
          )}
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="employeeTraining"
              checked={watchedValues.employeeTraining || false}
              onCheckedChange={(checked) => formMethods.setValue('employeeTraining', checked)}
            />
            <Label htmlFor="employeeTraining">Had the employee received safety training?</Label>
          </div>
          
          {watchedValues.employeeTraining && (
            <div>
              <Label htmlFor="trainingDetails">Training Details *</Label>
              <Textarea
                id="trainingDetails"
                {...formMethods.register('trainingDetails')}
              />
            </div>
          )}
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="hasPreviousClaims"
              checked={watchedValues.hasPreviousClaims || false}
              onCheckedChange={(checked) => formMethods.setValue('hasPreviousClaims', checked)}
            />
            <Label htmlFor="hasPreviousClaims">Any previous claims under this policy?</Label>
          </div>
          
          {watchedValues.hasPreviousClaims && (
            <div>
              <Label htmlFor="previousClaimsDetails">Previous Claims Details *</Label>
              <Textarea
                id="previousClaimsDetails"
                {...formMethods.register('previousClaimsDetails')}
              />
            </div>
          )}
        </div>
      )
    },
    {
      id: 'documents',
      title: 'Documents',
      component: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FileUpload
              label="Accident Report"
              onFileSelect={(file) => setUploadedFiles(prev => ({ ...prev, accidentReport: file }))}
            />
            
            <FileUpload
              label="Medical Reports"
              onFileSelect={(file) => setUploadedFiles(prev => ({ ...prev, medicalReports: file }))}
            />
            
            <FileUpload
              label="Medical Bills"
              onFileSelect={(file) => setUploadedFiles(prev => ({ ...prev, medicalBills: file }))}
            />
            
            <FileUpload
              label="Employment Records"
              onFileSelect={(file) => setUploadedFiles(prev => ({ ...prev, employmentRecords: file }))}
            />
          </div>
        </div>
      )
    },
    {
      id: 'declaration',
      title: 'Declaration',
      component: (
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="agreeToDataPrivacy"
              checked={watchedValues.agreeToDataPrivacy || false}
              onCheckedChange={(checked) => formMethods.setValue('agreeToDataPrivacy', checked)}
            />
            <Label htmlFor="agreeToDataPrivacy">
              I agree to the processing of my personal data in accordance with data privacy regulations *
            </Label>
          </div>
          
          <div>
            <Label htmlFor="signature">Digital Signature *</Label>
            <Input
              id="signature"
              placeholder="Type your full name as digital signature"
              {...formMethods.register('signature')}
            />
          </div>
        </div>
      )
    }
  ];

  const handleFormSubmit = (data: any) => {
    setShowSummary(true);
  };

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <HardHat className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="text-green-600">Claim Submitted Successfully!</CardTitle>
            <CardDescription>
              Your Employers Liability claim has been submitted and is being processed.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => window.location.href = '/claims'} className="w-full">
              Return to Claims
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <HardHat className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <CardTitle>Employers Liability Insurance Claim</CardTitle>
                <CardDescription>
                  Complete this form to submit your employers liability insurance claim
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        <MultiStepForm
          steps={steps}
          onSubmit={handleFormSubmit}
          isSubmitting={isSubmitting}
          submitButtonText="Submit Claim"
          formMethods={formMethods}
        />

        <Dialog open={showSummary} onOpenChange={setShowSummary}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Review Your Employers Liability Claim</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-2">Policy Information</h3>
                  <p><strong>Policy Number:</strong> {watchedValues.policyNumber}</p>
                  <p><strong>Cover Period:</strong> {watchedValues.periodOfCoverFrom ? format(new Date(watchedValues.periodOfCoverFrom), "PPP") : ''} - {watchedValues.periodOfCoverTo ? format(new Date(watchedValues.periodOfCoverTo), "PPP") : ''}</p>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">Company Information</h3>
                  <p><strong>Company:</strong> {watchedValues.companyName}</p>
                  <p><strong>Email:</strong> {watchedValues.email}</p>
                  <p><strong>Phone:</strong> {watchedValues.phone}</p>
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowSummary(false)}>
                  Back to Edit
                </Button>
                <Button onClick={() => handleSubmit(watchedValues)} disabled={isSubmitting}>
                  {isSubmitting ? 'Submitting...' : 'Confirm & Submit'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default EmployersLiabilityClaim;