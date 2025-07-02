
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useAuth } from '../../contexts/AuthContext';
import { individualKYCSchema } from '../../utils/validation';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { RadioGroup, RadioGroupItem } from '../../components/ui/radio-group';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { toast } from '../../components/ui/use-toast';
import FormSection from '../../components/common/FormSection';
import FileUpload from '../../components/common/FileUpload';
import PhoneInput from '../../components/common/PhoneInput';
import MultiStepForm from '../../components/common/MultiStepForm';
import { User, FileText, Briefcase, Upload } from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { notifySubmission } from '../../services/notificationService';

interface IndividualKYCData {
  firstName: string;
  lastName: string;
  middleName?: string;
  dateOfBirth: Date;
  gender: 'male' | 'female' | 'other';
  nationality: string;
  countryOfResidence: string;
  email: string;
  phoneNumber: string;
  alternatePhone?: string;
  residentialAddress: string;
  mailingAddress?: string;
  identificationType: 'passport' | 'nationalId' | 'driversLicense';
  identificationNumber: string;
  issueDate: Date;
  expiryDate: Date;
  employmentStatus: 'employed' | 'selfEmployed' | 'unemployed' | 'retired' | 'student';
  occupation: string;
  employer?: string;
  annualIncome: number;
  identificationDocument?: File;
  proofOfAddress?: File;
  passport?: File;
}

const IndividualKYC: React.FC = () => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { register, handleSubmit, formState: { errors }, setValue, watch, trigger } = useForm<IndividualKYCData>({
    resolver: yupResolver(individualKYCSchema),
    defaultValues: {
      email: user?.email || '',
    }
  });

  const watchedValues = watch();

  const onSubmit = async (data: IndividualKYCData) => {
    if (!user) return;
    
    setIsSubmitting(true);
    try {
      const submissionId = `kyc_${Date.now()}`;
      
      await setDoc(doc(db, 'submissions', submissionId), {
        id: submissionId,
        userId: user.uid,
        formType: 'individual-kyc',
        data: data,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      // Send notification
      await notifySubmission(user, 'Individual KYC');
      
      toast({
        title: "KYC Form Submitted",
        description: "Your Individual KYC form has been submitted successfully.",
      });
      
      // Redirect to dashboard
      window.location.href = '/dashboard';
    } catch (error) {
      console.error('Error submitting KYC:', error);
      toast({
        title: "Submission Error",
        description: "Failed to submit KYC form. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const PersonalInfoStep = () => (
    <FormSection title="Personal Information" icon={<User className="h-5 w-5" />}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="firstName">First Name *</Label>
          <Input {...register('firstName')} />
          {errors.firstName && <p className="text-sm text-red-600">{errors.firstName.message}</p>}
        </div>
        
        <div>
          <Label htmlFor="lastName">Last Name *</Label>
          <Input {...register('lastName')} />
          {errors.lastName && <p className="text-sm text-red-600">{errors.lastName.message}</p>}
        </div>
        
        <div>
          <Label htmlFor="middleName">Middle Name</Label>
          <Input {...register('middleName')} />
        </div>
        
        <div>
          <Label htmlFor="dateOfBirth">Date of Birth *</Label>
          <Input type="date" {...register('dateOfBirth')} />
          {errors.dateOfBirth && <p className="text-sm text-red-600">{errors.dateOfBirth.message}</p>}
        </div>
        
        <div>
          <Label>Gender *</Label>
          <RadioGroup
            value={watchedValues.gender}
            onValueChange={(value) => setValue('gender', value as any)}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="male" id="male" />
              <Label htmlFor="male">Male</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="female" id="female" />
              <Label htmlFor="female">Female</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="other" id="other" />
              <Label htmlFor="other">Other</Label>
            </div>
          </RadioGroup>
          {errors.gender && <p className="text-sm text-red-600">{errors.gender.message}</p>}
        </div>
        
        <div>
          <Label htmlFor="nationality">Nationality *</Label>
          <Input {...register('nationality')} />
          {errors.nationality && <p className="text-sm text-red-600">{errors.nationality.message}</p>}
        </div>
        
        <div>
          <Label htmlFor="countryOfResidence">Country of Residence *</Label>
          <Input {...register('countryOfResidence')} />
          {errors.countryOfResidence && <p className="text-sm text-red-600">{errors.countryOfResidence.message}</p>}
        </div>
      </div>
    </FormSection>
  );

  const ContactInfoStep = () => (
    <FormSection title="Contact Information" icon={<FileText className="h-5 w-5" />}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="email">Email *</Label>
          <Input type="email" {...register('email')} />
          {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
        </div>
        
        <div>
          <PhoneInput
            label="Phone Number"
            required
            value={watchedValues.phoneNumber || ''}
            onChange={(value) => setValue('phoneNumber', value)}
            error={errors.phoneNumber?.message}
          />
        </div>
        
        <div>
          <PhoneInput
            label="Alternate Phone"
            value={watchedValues.alternatePhone || ''}
            onChange={(value) => setValue('alternatePhone', value)}
          />
        </div>
        
        <div className="md:col-span-2">
          <Label htmlFor="residentialAddress">Residential Address *</Label>
          <Textarea {...register('residentialAddress')} />
          {errors.residentialAddress && <p className="text-sm text-red-600">{errors.residentialAddress.message}</p>}
        </div>
        
        <div className="md:col-span-2">
          <Label htmlFor="mailingAddress">Mailing Address</Label>
          <Textarea {...register('mailingAddress')} />
        </div>
      </div>
    </FormSection>
  );

  const EmploymentStep = () => (
    <FormSection title="Employment Information" icon={<Briefcase className="h-5 w-5" />}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Employment Status *</Label>
          <Select
            value={watchedValues.employmentStatus}
            onValueChange={(value) => setValue('employmentStatus', value as any)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select employment status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="employed">Employed</SelectItem>
              <SelectItem value="selfEmployed">Self Employed</SelectItem>
              <SelectItem value="unemployed">Unemployed</SelectItem>
              <SelectItem value="retired">Retired</SelectItem>
              <SelectItem value="student">Student</SelectItem>
            </SelectContent>
          </Select>
          {errors.employmentStatus && <p className="text-sm text-red-600">{errors.employmentStatus.message}</p>}
        </div>
        
        <div>
          <Label htmlFor="occupation">Occupation *</Label>
          <Input {...register('occupation')} />
          {errors.occupation && <p className="text-sm text-red-600">{errors.occupation.message}</p>}
        </div>
        
        <div>
          <Label htmlFor="employer">Employer</Label>
          <Input {...register('employer')} />
        </div>
        
        <div>
          <Label htmlFor="annualIncome">Annual Income *</Label>
          <Input type="number" {...register('annualIncome')} />
          {errors.annualIncome && <p className="text-sm text-red-600">{errors.annualIncome.message}</p>}
        </div>
      </div>
    </FormSection>
  );

  const DocumentsStep = () => (
    <FormSection title="Required Documents" icon={<Upload className="h-5 w-5" />}>
      <div className="space-y-6">
        <FileUpload
          label="Identification Document"
          required
          onFileSelect={(file) => setValue('identificationDocument', file)}
          currentFile={watchedValues.identificationDocument}
          error={errors.identificationDocument?.message}
        />
        
        <FileUpload
          label="Proof of Address"
          required
          onFileSelect={(file) => setValue('proofOfAddress', file)}
          currentFile={watchedValues.proofOfAddress}
          error={errors.proofOfAddress?.message}
        />
        
        <FileUpload
          label="Passport Photo"
          onFileSelect={(file) => setValue('passport', file)}
          currentFile={watchedValues.passport}
          accept=".jpg,.jpeg,.png"
        />
      </div>
    </FormSection>
  );

  const steps = [
    {
      id: 'personal',
      title: 'Personal Information',
      component: <PersonalInfoStep />,
      isValid: !errors.firstName && !errors.lastName && !errors.dateOfBirth && !errors.gender && !errors.nationality && !errors.countryOfResidence
    },
    {
      id: 'contact',
      title: 'Contact Information',
      component: <ContactInfoStep />,
      isValid: !errors.email && !errors.phoneNumber && !errors.residentialAddress
    },
    {
      id: 'employment',
      title: 'Employment Information',
      component: <EmploymentStep />,
      isValid: !errors.employmentStatus && !errors.occupation && !errors.annualIncome
    },
    {
      id: 'documents',
      title: 'Document Upload',
      component: <DocumentsStep />,
      isValid: !errors.identificationDocument && !errors.proofOfAddress
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Individual KYC Application</h1>
          <p className="text-gray-600 mt-2">Please provide accurate information for identity verification</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <MultiStepForm
            steps={steps}
            onSubmit={onSubmit}
            isSubmitting={isSubmitting}
            submitButtonText="Submit KYC Application"
          />
        </form>
      </div>
    </div>
  );
};

export default IndividualKYC;
