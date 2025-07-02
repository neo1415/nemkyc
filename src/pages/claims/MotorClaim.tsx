import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';
import { useAuth } from '../../contexts/AuthContext';
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
import { Car, FileText, Upload, DollarSign } from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { notifySubmission } from '../../services/notificationService';

const motorClaimSchema = Yup.object({
  // Claimant Information
  claimantName: Yup.string().required('Claimant name is required'),
  claimantPhone: Yup.string().required('Phone number is required'),
  claimantEmail: Yup.string().email('Invalid email').required('Email is required'),
  claimantAddress: Yup.string().required('Address is required'),
  
  // Vehicle Information
  vehicleMake: Yup.string().required('Vehicle make is required'),
  vehicleModel: Yup.string().required('Vehicle model is required'),
  vehicleYear: Yup.number().required('Vehicle year is required').min(1900).max(new Date().getFullYear() + 1),
  vehicleRegistration: Yup.string().required('Vehicle registration is required'),
  chassisNumber: Yup.string().required('Chassis number is required'),
  engineNumber: Yup.string().required('Engine number is required'),
  
  // Policy Information
  policyNumber: Yup.string().required('Policy number is required'),
  policyStartDate: Yup.date().required('Policy start date is required'),
  policyEndDate: Yup.date().required('Policy end date is required'),
  
  // Incident Information
  incidentDate: Yup.date().required('Incident date is required').max(new Date(), 'Incident date cannot be in the future'),
  incidentTime: Yup.string().required('Incident time is required'),
  incidentLocation: Yup.string().required('Incident location is required'),
  incidentDescription: Yup.string().required('Incident description is required'),
  damageDescription: Yup.string().required('Damage description is required'),
  
  // Claim Information
  claimAmount: Yup.number().required('Claim amount is required').positive('Claim amount must be positive'),
  thirdPartyInvolved: Yup.string().oneOf(['yes', 'no']).required('Please specify if third party was involved'),
  policeReportFiled: Yup.string().oneOf(['yes', 'no']).required('Please specify if police report was filed'),
  
  // Documents
  vehiclePhotos: Yup.mixed().required('Vehicle photos are required'),
  policeReport: Yup.mixed().optional(),
  driverLicense: Yup.mixed().required('Driver license is required'),
  vehicleRegistrationDoc: Yup.mixed().required('Vehicle registration document is required'),
});

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
  vehiclePhotos?: File;
  policeReport?: File;
  driverLicense?: File;
  vehicleRegistrationDoc?: File;
}

const MotorClaim: React.FC = () => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<MotorClaimData>({
    resolver: yupResolver(motorClaimSchema),
    defaultValues: {
      claimantEmail: user?.email || '',
    }
  });

  const watchedValues = watch();

  const onSubmit = async (data: MotorClaimData) => {
    if (!user) return;
    
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
          onFileSelect={(file) => setValue('vehiclePhotos', file)}
          currentFile={watchedValues.vehiclePhotos}
          error={errors.vehiclePhotos?.message}
          accept=".jpg,.jpeg,.png"
        />
        
        <FileUpload
          label="Driver's License"
          onFileSelect={(file) => setValue('driverLicense', file)}
          currentFile={watchedValues.driverLicense}
          error={errors.driverLicense?.message}
        />
        
        <FileUpload
          label="Vehicle Registration Document"
          onFileSelect={(file) => setValue('vehicleRegistrationDoc', file)}
          currentFile={watchedValues.vehicleRegistrationDoc}
          error={errors.vehicleRegistrationDoc?.message}
        />
        
        {watchedValues.policeReportFiled === 'yes' && (
          <FileUpload
            label="Police Report"
            onFileSelect={(file) => setValue('policeReport', file)}
            currentFile={watchedValues.policeReport}
            error={errors.policeReport?.message}
          />
        )}
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
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Motor Insurance Claim</h1>
          <p className="text-gray-600 mt-2">Submit your motor vehicle insurance claim with all required details</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <MultiStepForm
            steps={steps}
            onSubmit={handleSubmit(onSubmit)}
            isSubmitting={isSubmitting}
            submitButtonText="Submit Motor Claim"
          />
        </form>
      </div>
    </div>
  );
};

export default MotorClaim;
