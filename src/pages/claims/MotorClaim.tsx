import React, { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useAuth } from '../../contexts/AuthContext';
import { motorClaimSchema } from '../../utils/validation';
import { MotorClaimData as MotorClaimType } from '../../types';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { toast } from '../../components/ui/use-toast';
import FormSection from '../../components/common/FormSection';
import FileUpload from '../../components/common/FileUpload';
import PhoneInput from '../../components/common/PhoneInput';
import MultiStepForm from '../../components/common/MultiStepForm';
import AuthRequiredSubmit from '../../components/common/AuthRequiredSubmit';
import { Car, FileText, Upload, DollarSign } from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { notifySubmission } from '../../services/notificationService';

interface MotorClaimData {
  claimantName: string;
  claimantPhone: string;
  claimantEmail: string;
  claimantAddress: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear: number;
  vehicleRegistration: string;
  chassisNumber: string;
  engineNumber: string;
  policyNumber: string;
  policyStartDate: string;
  policyEndDate: string;
  incidentDate: string;
  incidentTime: string;
  incidentLocation: string;
  incidentDescription: string;
  damageDescription: string;
  claimAmount: number;
  thirdPartyInvolved: 'yes' | 'no';
  policeReportFiled: 'yes' | 'no';
  policeReported: boolean;
  policeStation?: string;
  policeReportNumber?: string;
  estimatedDamage: number;
  driverName: string;
  driverLicense: string;
  witnessName?: string;
  witnessPhone?: string;
  vehiclePhotos?: File;
  policeReport?: File;
  vehicleRegistrationDoc?: File;
  signature: string;
  agreeToTerms: boolean;
}

const MotorClaim: React.FC = () => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  const { register, handleSubmit, formState: { errors }, setValue, watch, control } = useForm<MotorClaimData>({
    resolver: yupResolver(motorClaimSchema) as any,
    defaultValues: {
      claimantEmail: user?.email || '',
      policeReported: false,
      agreeToTerms: false,
      signature: ''
    }
  });

  const watchedValues = watch();
  
  // Use useCallback to prevent re-renders on setValue calls
  const handleFileSelect = React.useCallback((field: string, file: File) => {
    setValue(field as any, file);
  }, [setValue]);

  const onSubmit = async (data: MotorClaimData) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    
    setIsSubmitting(true);
    try {
      const submissionId = `claim_motor_${Date.now()}`;
      
      await setDoc(doc(db, 'submissions', submissionId), {
        id: submissionId,
        userId: user.uid,
        formType: 'motor-claim',
        claimType: 'motor',
        claimAmount: data.claimAmount,
        incidentDate: data.incidentDate,
        data: data,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      await notifySubmission(user, 'Motor Claim');
      
      toast({
        title: "Claim Submitted",
        description: "Your motor claim has been submitted successfully.",
      });
      
      window.location.href = '/dashboard';
    } catch (error) {
      console.error('Error submitting claim:', error);
      toast({
        title: "Submission Error",
        description: "Failed to submit claim. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const ClaimantInfoStep = () => (
    <FormSection title="Claimant Information" icon={<FileText className="h-5 w-5" />}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="claimantName">Full Name *</Label>
          <Input {...register('claimantName')} />
          {errors.claimantName && <p className="text-sm text-red-600">{errors.claimantName.message}</p>}
        </div>
        
        <div>
          <PhoneInput
            label="Phone Number"
            required
            value={watchedValues.claimantPhone || ''}
            onChange={(value) => setValue('claimantPhone', value)}
            error={errors.claimantPhone?.message}
          />
        </div>
        
        <div>
          <Label htmlFor="claimantEmail">Email *</Label>
          <Input type="email" {...register('claimantEmail')} />
          {errors.claimantEmail && <p className="text-sm text-red-600">{errors.claimantEmail.message}</p>}
        </div>
        
        <div className="md:col-span-2">
          <Label htmlFor="claimantAddress">Address *</Label>
          <Textarea {...register('claimantAddress')} />
          {errors.claimantAddress && <p className="text-sm text-red-600">{errors.claimantAddress.message}</p>}
        </div>
      </div>
    </FormSection>
  );

  const VehicleInfoStep = () => (
    <FormSection title="Vehicle Information" icon={<Car className="h-5 w-5" />}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="vehicleMake">Vehicle Make *</Label>
          <Input {...register('vehicleMake')} placeholder="e.g., Toyota, Honda" />
          {errors.vehicleMake && <p className="text-sm text-red-600">{errors.vehicleMake.message}</p>}
        </div>
        
        <div>
          <Label htmlFor="vehicleModel">Vehicle Model *</Label>
          <Input {...register('vehicleModel')} placeholder="e.g., Camry, Accord" />
          {errors.vehicleModel && <p className="text-sm text-red-600">{errors.vehicleModel.message}</p>}
        </div>
        
        <div>
          <Label htmlFor="vehicleYear">Year *</Label>
          <Input type="number" {...register('vehicleYear')} />
          {errors.vehicleYear && <p className="text-sm text-red-600">{errors.vehicleYear.message}</p>}
        </div>
        
        <div>
          <Label htmlFor="vehicleRegistration">Registration Number *</Label>
          <Input {...register('vehicleRegistration')} />
          {errors.vehicleRegistration && <p className="text-sm text-red-600">{errors.vehicleRegistration.message}</p>}
        </div>
        
        <div>
          <Label htmlFor="chassisNumber">Chassis Number *</Label>
          <Input {...register('chassisNumber')} />
          {errors.chassisNumber && <p className="text-sm text-red-600">{errors.chassisNumber.message}</p>}
        </div>
        
        <div>
          <Label htmlFor="engineNumber">Engine Number *</Label>
          <Input {...register('engineNumber')} />
          {errors.engineNumber && <p className="text-sm text-red-600">{errors.engineNumber.message}</p>}
        </div>
      </div>
    </FormSection>
  );

  const IncidentDetailsStep = () => (
    <FormSection title="Incident Details" icon={<FileText className="h-5 w-5" />}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="incidentDate">Date of Incident *</Label>
          <Input type="date" {...register('incidentDate')} />
          {errors.incidentDate && <p className="text-sm text-red-600">{errors.incidentDate.message}</p>}
        </div>
        
        <div>
          <Label htmlFor="incidentTime">Time of Incident *</Label>
          <Input type="time" {...register('incidentTime')} />
          {errors.incidentTime && <p className="text-sm text-red-600">{errors.incidentTime.message}</p>}
        </div>
        
        <div className="md:col-span-2">
          <Label htmlFor="incidentLocation">Location of Incident *</Label>
          <Input {...register('incidentLocation')} />
          {errors.incidentLocation && <p className="text-sm text-red-600">{errors.incidentLocation.message}</p>}
        </div>
        
        <div className="md:col-span-2">
          <Label htmlFor="incidentDescription">Description of Incident *</Label>
          <Textarea {...register('incidentDescription')} rows={4} />
          {errors.incidentDescription && <p className="text-sm text-red-600">{errors.incidentDescription.message}</p>}
        </div>
        
        <div className="md:col-span-2">
          <Label htmlFor="damageDescription">Description of Damage *</Label>
          <Textarea {...register('damageDescription')} rows={4} />
          {errors.damageDescription && <p className="text-sm text-red-600">{errors.damageDescription.message}</p>}
        </div>
        
        <div>
          <Label htmlFor="claimAmount">Claim Amount *</Label>
          <Input type="number" {...register('claimAmount')} />
          {errors.claimAmount && <p className="text-sm text-red-600">{errors.claimAmount.message}</p>}
        </div>
        
        <div>
          <Label>Third Party Involved? *</Label>
          <Select
            value={watchedValues.thirdPartyInvolved}
            onValueChange={(value) => setValue('thirdPartyInvolved', value as any)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="yes">Yes</SelectItem>
              <SelectItem value="no">No</SelectItem>
            </SelectContent>
          </Select>
          {errors.thirdPartyInvolved && <p className="text-sm text-red-600">{errors.thirdPartyInvolved.message}</p>}
        </div>
        
        <div>
          <Label>Police Report Filed? *</Label>
          <Select
            value={watchedValues.policeReportFiled}
            onValueChange={(value) => setValue('policeReportFiled', value as any)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="yes">Yes</SelectItem>
              <SelectItem value="no">No</SelectItem>
            </SelectContent>
          </Select>
          {errors.policeReportFiled && <p className="text-sm text-red-600">{errors.policeReportFiled.message}</p>}
        </div>
      </div>
    </FormSection>
  );

  const DocumentsStep = () => (
    <FormSection title="Required Documents" icon={<Upload className="h-5 w-5" />}>
      <div className="space-y-6">
        <FileUpload
          label="Vehicle Photos (Damage)"
          onFileSelect={(file) => handleFileSelect('vehiclePhotos', file)}
          currentFile={watchedValues.vehiclePhotos}
          error={errors.vehiclePhotos?.message}
          accept=".jpg,.jpeg,.png"
        />
        
        <FileUpload
          label="Driver's License"
          onFileSelect={(file) => handleFileSelect('driverLicense', file)}
          currentFile={watchedValues.driverLicense}
          error={errors.driverLicense?.message}
        />
        
        <FileUpload
          label="Vehicle Registration Document"
          onFileSelect={(file) => handleFileSelect('vehicleRegistrationDoc', file)}
          currentFile={watchedValues.vehicleRegistrationDoc}
          error={errors.vehicleRegistrationDoc?.message}
        />
        
        {watchedValues.policeReportFiled === 'yes' && (
          <FileUpload
            label="Police Report"
            onFileSelect={(file) => handleFileSelect('policeReport', file)}
            currentFile={watchedValues.policeReport}
            error={errors.policeReport?.message}
          />
        )}
      </div>
    </FormSection>
  );

  const TermsAndConditionsStep = () => (
    <FormSection title="Terms and Conditions" icon={<FileText className="h-5 w-5" />}>
      <div className="space-y-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium mb-4">Terms and Conditions</h4>
          <div className="space-y-2 text-sm">
            <p>1. I/We declare to the best of my/our knowledge and belief that the information given on this form is true in every respect and agree that if I/we have made any false or fraudulent statement, be it suppression or concealment, the policy shall be cancelled and the claim shall be forfeited.</p>
            <p>2. I/We agree to provide additional information to NEM Insurance, if required.</p>
            <p>3. I/We agree to submit all required and requested for documents and NEM Insurance shall not be held responsible for any delay in settlement of claim due to non-fulfillment of requirements.</p>
          </div>
        </div>
        
        <div>
          <Label htmlFor="signature">Digital Signature *</Label>
          <Input {...register('signature')} placeholder="Type your full name as signature" />
          {errors.signature && <p className="text-sm text-red-600">{errors.signature.message}</p>}
        </div>
        
        <div className="flex items-center space-x-2">
          <Input type="checkbox" id="agreeToTerms" {...register('agreeToTerms')} className="h-4 w-4" />
          <Label htmlFor="agreeToTerms">I agree to the terms and conditions *</Label>
        </div>
        {errors.agreeToTerms && <p className="text-sm text-red-600">{errors.agreeToTerms.message}</p>}
      </div>
    </FormSection>
  );

  const steps = [
    {
      id: 'claimant',
      title: 'Claimant Information',
      component: <ClaimantInfoStep />,
      isValid: !errors.claimantName && !errors.claimantPhone && !errors.claimantEmail && !errors.claimantAddress
    },
    {
      id: 'vehicle',
      title: 'Vehicle Information',
      component: <VehicleInfoStep />,
      isValid: !errors.vehicleMake && !errors.vehicleModel && !errors.vehicleYear && !errors.vehicleRegistration
    },
    {
      id: 'incident',
      title: 'Incident Details',
      component: <IncidentDetailsStep />,
      isValid: !errors.incidentDate && !errors.incidentTime && !errors.incidentLocation && !errors.claimAmount
    },
    {
      id: 'documents',
      title: 'Document Upload',
      component: <DocumentsStep />,
      isValid: !errors.vehiclePhotos && !errors.driverLicense && !errors.vehicleRegistrationDoc
    },
    {
      id: 'terms',
      title: 'Terms and Conditions',
      component: <TermsAndConditionsStep />,
      isValid: !!watchedValues.agreeToTerms && !!watchedValues.signature
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Motor Insurance Claim</h1>
          <p className="text-gray-600 mt-2">Submit your motor vehicle insurance claim with all required details</p>
        </div>

        <MultiStepForm
          steps={steps}
          onSubmit={handleSubmit(onSubmit)}
          isSubmitting={isSubmitting}
          submitButtonText="Submit Motor Claim"
          formMethods={{ register, handleSubmit, formState: { errors }, setValue, watch, control }}
        />

        <AuthRequiredSubmit
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onProceedToSignup={() => {
            window.location.href = '/signup';
          }}
          formType="Motor Claim"
        />
      </div>
    </div>
  );
};

export default MotorClaim;
