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
import { Calendar, CalendarIcon, Plus, Trash2, Upload, Edit2, Flame, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import MultiStepForm from '@/components/common/MultiStepForm';
import { useFormDraft } from '@/hooks/useFormDraft';
import FileUpload from '@/components/common/FileUpload';
import { uploadFile } from '@/services/fileService';
import { db } from '@/firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { FireSpecialPerilsClaimData } from '@/types/claims';

// Fire and Special Perils Claim Schema
const fireSpecialPerilsClaimSchema = yup.object().shape({
  // Policy Details
  policyNumber: yup.string().required("Policy number is required"),
  periodOfCoverFrom: yup.date().required("Period of cover from is required"),
  periodOfCoverTo: yup.date().required("Period of cover to is required"),

  // Insured Details
  name: yup.string().required("Name is required"),
  companyName: yup.string(),
  title: yup.string().required("Title is required"),
  dateOfBirth: yup.date().required("Date of birth is required"),
  gender: yup.string().required("Gender is required"),
  address: yup.string().required("Address is required"),
  phone: yup.string().required("Phone number is required"),
  email: yup.string().email("Valid email is required").required("Email is required"),

  // Loss Details
  premisesAddress: yup.string().required("Premises address is required"),
  premisesTelephone: yup.string().required("Premises telephone is required"),
  dateOfOccurrence: yup.date().required("Date of occurrence is required"),
  timeOfOccurrence: yup.string().required("Time of occurrence is required"),
  incidentDescription: yup.string().required("Incident description is required"),
  causeOfFire: yup.string().required("Cause of fire is required"),

  // Premises Use
  usedAsPerPolicy: yup.boolean(),
  usageDetails: yup.string().when('usedAsPerPolicy', {
    is: false,
    then: (schema) => schema.required("Usage details required when not used as per policy"),
    otherwise: (schema) => schema.notRequired()
  }),
  purposeOfUse: yup.string().required("Purpose of use is required"),
  unallowedRiskIntroduced: yup.boolean(),
  unallowedRiskDetails: yup.string().when('unallowedRiskIntroduced', {
    is: true,
    then: (schema) => schema.required("Unallowed risk details required"),
    otherwise: (schema) => schema.notRequired()
  }),
  measuresWhenDiscovered: yup.string().required("Measures when discovered is required"),

  // Property Ownership
  soleOwner: yup.boolean(),
  otherOwnersName: yup.string().when('soleOwner', {
    is: false,
    then: (schema) => schema.required("Other owners name required"),
    otherwise: (schema) => schema.notRequired()
  }),
  otherOwnersAddress: yup.string().when('soleOwner', {
    is: false,
    then: (schema) => schema.required("Other owners address required"),
    otherwise: (schema) => schema.notRequired()
  }),

  // Other Insurance
  hasOtherInsurance: yup.boolean(),
  otherInsurerDetails: yup.string().when('hasOtherInsurance', {
    is: true,
    then: (schema) => schema.required("Other insurer details required"),
    otherwise: (schema) => schema.notRequired()
  }),

  // Valuation
  premisesContentsValue: yup.number().required("Premises contents value is required"),
  hasPreviousClaim: yup.boolean(),
  previousClaimDate: yup.date().when('hasPreviousClaim', {
    is: true,
    then: (schema) => schema.required("Previous claim date required"),
    otherwise: (schema) => schema.notRequired()
  }),
  previousClaimAmount: yup.number().when('hasPreviousClaim', {
    is: true,
    then: (schema) => schema.required("Previous claim amount required"),
    otherwise: (schema) => schema.notRequired()
  }),

  // Items Lost or Damaged
  itemsLost: yup.array().of(
    yup.object().shape({
      description: yup.string().required("Item description is required"),
      costPrice: yup.number().required("Cost price is required"),
      purchaseDate: yup.date().required("Purchase date is required"),
      estimatedValue: yup.number().required("Estimated value is required"),
      salvageValue: yup.number().required("Salvage value is required"),
      netAmountClaimed: yup.number().required("Net amount claimed is required")
    })
  ).min(1, "At least one item must be listed"),

  // Declaration
  agreeToDataPrivacy: yup.boolean().oneOf([true], "You must agree to data privacy"),
  signature: yup.string().required("Signature is required")
});

const defaultValues: Partial<FireSpecialPerilsClaimData> = {
  policyNumber: '',
  name: '',
  companyName: '',
  title: '',
  gender: '',
  address: '',
  phone: '',
  email: '',
  premisesAddress: '',
  premisesTelephone: '',
  incidentDescription: '',
  causeOfFire: '',
  usedAsPerPolicy: true,
  purposeOfUse: '',
  unallowedRiskIntroduced: false,
  measuresWhenDiscovered: '',
  soleOwner: true,
  hasOtherInsurance: false,
  hasPreviousClaim: false,
  itemsLost: [{
    description: '',
    costPrice: 0,
    purchaseDate: '',
    estimatedValue: 0,
    salvageValue: 0,
    netAmountClaimed: 0
  }],
  agreeToDataPrivacy: false,
  signature: ''
};

const FireSpecialPerilsClaim: React.FC = () => {
  const [showSummary, setShowSummary] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File>>({});

  const formMethods = useForm<any>({
    resolver: yupResolver(fireSpecialPerilsClaimSchema),
    defaultValues,
    mode: 'onChange'
  });

  const { fields, append, remove } = useFieldArray({
    control: formMethods.control,
    name: 'itemsLost'
  });

  const { saveDraft, clearDraft } = useFormDraft('fireSpecialPerilsClaim', formMethods);

  const watchedValues = formMethods.watch();

  // Auto-save draft
  React.useEffect(() => {
    const subscription = formMethods.watch((data) => {
      saveDraft(data);
    });
    return () => subscription.unsubscribe();
  }, [formMethods, saveDraft]);

  const handleSubmit = async (data: FireSpecialPerilsClaimData) => {
    setIsSubmitting(true);
    try {
      // Upload files to Firebase Storage
      const fileUploadPromises: Array<Promise<[string, string]>> = [];
      
      Object.entries(uploadedFiles).forEach(([key, file]) => {
        fileUploadPromises.push(
          uploadFile(file, 'fire-special-perils-claims').then(url => [key + 'Url', url])
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
        formType: 'fire-special-perils-claim'
      };
      
      // Submit to Firestore
      await addDoc(collection(db, 'fire-special-perils-claims'), {
        ...submissionData,
        timestamp: serverTimestamp(),
        createdAt: new Date().toLocaleDateString('en-GB')
      });
      
      clearDraft();
      setShowSummary(false);
      setShowSuccess(true);
      toast({ title: "Fire and Special Perils claim submitted successfully!" });
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                {...formMethods.register('name')}
              />
            </div>
            <div>
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                {...formMethods.register('companyName')}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Select onValueChange={(value) => formMethods.setValue('title', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select title" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mr">Mr</SelectItem>
                  <SelectItem value="mrs">Mrs</SelectItem>
                  <SelectItem value="dr">Dr</SelectItem>
                  <SelectItem value="chief">Chief</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <DatePickerField
                name="dateOfBirth"
                label="Date of Birth *"
              />
            </div>
            <div>
              <Label htmlFor="gender">Gender *</Label>
              <Select onValueChange={(value) => formMethods.setValue('gender', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
      id: 'loss-details',
      title: 'Loss Details',
      component: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="premisesAddress">Premises Address *</Label>
              <Textarea
                id="premisesAddress"
                {...formMethods.register('premisesAddress')}
              />
            </div>
            <div>
              <Label htmlFor="premisesTelephone">Premises Telephone *</Label>
              <Input
                id="premisesTelephone"
                {...formMethods.register('premisesTelephone')}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <DatePickerField
                name="dateOfOccurrence"
                label="Date of Occurrence *"
              />
            </div>
            <div>
              <Label htmlFor="timeOfOccurrence">Time of Occurrence *</Label>
              <Input
                id="timeOfOccurrence"
                type="time"
                {...formMethods.register('timeOfOccurrence')}
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="incidentDescription">Description of Incident *</Label>
            <Textarea
              id="incidentDescription"
              rows={4}
              {...formMethods.register('incidentDescription')}
            />
          </div>
          
          <div>
            <Label htmlFor="causeOfFire">Cause of Fire *</Label>
            <Textarea
              id="causeOfFire"
              rows={3}
              {...formMethods.register('causeOfFire')}
            />
          </div>
        </div>
      )
    },
    {
      id: 'items-lost',
      title: 'Items Lost or Damaged',
      component: (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Items Lost or Damaged</h3>
            <Button
              type="button"
              onClick={() => append({
                description: '',
                costPrice: 0,
                purchaseDate: '',
                estimatedValue: 0,
                salvageValue: 0,
                netAmountClaimed: 0
              })}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Item
            </Button>
          </div>
          
          {fields.map((field, index) => (
            <Card key={field.id} className="p-4">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-medium">Item {index + 1}</h4>
                {fields.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => remove(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor={`itemsLost.${index}.description`}>Description *</Label>
                  <Textarea
                    id={`itemsLost.${index}.description`}
                    {...formMethods.register(`itemsLost.${index}.description`)}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor={`itemsLost.${index}.costPrice`}>Cost Price *</Label>
                    <Input
                      id={`itemsLost.${index}.costPrice`}
                      type="number"
                      {...formMethods.register(`itemsLost.${index}.costPrice`)}
                    />
                  </div>
                  <div>
                    <DatePickerField
                      name={`itemsLost.${index}.purchaseDate`}
                      label="Purchase Date *"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`itemsLost.${index}.estimatedValue`}>Estimated Value *</Label>
                    <Input
                      id={`itemsLost.${index}.estimatedValue`}
                      type="number"
                      {...formMethods.register(`itemsLost.${index}.estimatedValue`)}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor={`itemsLost.${index}.salvageValue`}>Salvage Value *</Label>
                    <Input
                      id={`itemsLost.${index}.salvageValue`}
                      type="number"
                      {...formMethods.register(`itemsLost.${index}.salvageValue`)}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`itemsLost.${index}.netAmountClaimed`}>Net Amount Claimed *</Label>
                    <Input
                      id={`itemsLost.${index}.netAmountClaimed`}
                      type="number"
                      {...formMethods.register(`itemsLost.${index}.netAmountClaimed`)}
                    />
                  </div>
                </div>
              </div>
            </Card>
          ))}
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
              label="Police Report"
              onFileSelect={(file) => setUploadedFiles(prev => ({ ...prev, policeReport: file }))}
            />
            
            <FileUpload
              label="Fire Service Report"
              onFileSelect={(file) => setUploadedFiles(prev => ({ ...prev, fireServiceReport: file }))}
            />
            
            <FileUpload
              label="Photos of Damage"
              onFileSelect={(file) => setUploadedFiles(prev => ({ ...prev, damagePhotos: file }))}
            />
            
            <FileUpload
              label="Receipts/Invoices"
              onFileSelect={(file) => setUploadedFiles(prev => ({ ...prev, receipts: file }))}
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
              <Flame className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="text-green-600">Claim Submitted Successfully!</CardTitle>
            <CardDescription>
              Your Fire and Special Perils claim has been submitted and is being processed.
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
                <Flame className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <CardTitle>Fire and Special Perils Insurance Claim</CardTitle>
                <CardDescription>
                  Complete this form to submit your fire and special perils insurance claim
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
              <DialogTitle>Review Your Fire and Special Perils Claim</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-2">Policy Information</h3>
                  <p><strong>Policy Number:</strong> {watchedValues.policyNumber}</p>
                  <p><strong>Cover Period:</strong> {watchedValues.periodOfCoverFrom ? format(new Date(watchedValues.periodOfCoverFrom), "PPP") : ''} - {watchedValues.periodOfCoverTo ? format(new Date(watchedValues.periodOfCoverTo), "PPP") : ''}</p>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">Insured Information</h3>
                  <p><strong>Name:</strong> {watchedValues.name}</p>
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

export default FireSpecialPerilsClaim;
