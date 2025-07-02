
import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useAuth } from '../../contexts/AuthContext';
import { corporateKYCSchema } from '../../utils/validation';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { toast } from '../../components/ui/use-toast';
import FormSection from '../../components/common/FormSection';
import FileUpload from '../../components/common/FileUpload';
import PhoneInput from '../../components/common/PhoneInput';
import MultiStepForm from '../../components/common/MultiStepForm';
import { Building2, FileText, Users, Upload, Plus, Trash2 } from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { notifySubmission } from '../../services/notificationService';

interface Director {
  name: string;
  position: string;
  nationality: string;
  shareholding?: number;
}

interface CorporateKYCData {
  companyName: string;
  registrationNumber: string;
  incorporationDate: Date;
  countryOfIncorporation: string;
  businessType: string;
  industry: string;
  registeredAddress: string;
  businessAddress: string;
  phoneNumber: string;
  email: string;
  website?: string;
  annualRevenue: number;
  numberOfEmployees: number;
  directors: Director[];
  certificateOfIncorporation?: File;
  memorandumOfAssociation?: File;
  auditedFinancialStatements?: File;
  boardResolution?: File;
}

const CorporateKYC: React.FC = () => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { register, handleSubmit, formState: { errors }, setValue, watch, control } = useForm<CorporateKYCData>({
    resolver: yupResolver(corporateKYCSchema),
    defaultValues: {
      email: user?.email || '',
      directors: [{ name: '', position: '', nationality: '', shareholding: 0 }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'directors'
  });

  const watchedValues = watch();

  const onSubmit = async (data: CorporateKYCData) => {
    if (!user) return;
    
    setIsSubmitting(true);
    try {
      const submissionId = `kyc_corporate_${Date.now()}`;
      
      await setDoc(doc(db, 'submissions', submissionId), {
        id: submissionId,
        userId: user.uid,
        formType: 'corporate-kyc',
        data: data,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      await notifySubmission(user, 'Corporate KYC');
      
      toast({
        title: "KYC Form Submitted",
        description: "Your Corporate KYC form has been submitted successfully.",
      });
      
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

  const CompanyInfoStep = () => (
    <FormSection title="Company Information" icon={<Building2 className="h-5 w-5" />}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="companyName">Company Name *</Label>
          <Input {...register('companyName')} />
          {errors.companyName && <p className="text-sm text-red-600">{errors.companyName.message}</p>}
        </div>
        
        <div>
          <Label htmlFor="registrationNumber">Registration Number *</Label>
          <Input {...register('registrationNumber')} />
          {errors.registrationNumber && <p className="text-sm text-red-600">{errors.registrationNumber.message}</p>}
        </div>
        
        <div>
          <Label htmlFor="incorporationDate">Incorporation Date *</Label>
          <Input type="date" {...register('incorporationDate')} />
          {errors.incorporationDate && <p className="text-sm text-red-600">{errors.incorporationDate.message}</p>}
        </div>
        
        <div>
          <Label htmlFor="countryOfIncorporation">Country of Incorporation *</Label>
          <Input {...register('countryOfIncorporation')} />
          {errors.countryOfIncorporation && <p className="text-sm text-red-600">{errors.countryOfIncorporation.message}</p>}
        </div>
        
        <div>
          <Label htmlFor="businessType">Business Type *</Label>
          <Input {...register('businessType')} />
          {errors.businessType && <p className="text-sm text-red-600">{errors.businessType.message}</p>}
        </div>
        
        <div>
          <Label htmlFor="industry">Industry *</Label>
          <Input {...register('industry')} />
          {errors.industry && <p className="text-sm text-red-600">{errors.industry.message}</p>}
        </div>
      </div>
    </FormSection>
  );

  const ContactInfoStep = () => (
    <FormSection title="Contact Information" icon={<FileText className="h-5 w-5" />}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <Label htmlFor="registeredAddress">Registered Address *</Label>
          <Textarea {...register('registeredAddress')} />
          {errors.registeredAddress && <p className="text-sm text-red-600">{errors.registeredAddress.message}</p>}
        </div>
        
        <div className="md:col-span-2">
          <Label htmlFor="businessAddress">Business Address *</Label>
          <Textarea {...register('businessAddress')} />
          {errors.businessAddress && <p className="text-sm text-red-600">{errors.businessAddress.message}</p>}
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
          <Label htmlFor="email">Email *</Label>
          <Input type="email" {...register('email')} />
          {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
        </div>
        
        <div>
          <Label htmlFor="website">Website</Label>
          <Input {...register('website')} />
        </div>
        
        <div>
          <Label htmlFor="annualRevenue">Annual Revenue *</Label>
          <Input type="number" {...register('annualRevenue')} />
          {errors.annualRevenue && <p className="text-sm text-red-600">{errors.annualRevenue.message}</p>}
        </div>
        
        <div>
          <Label htmlFor="numberOfEmployees">Number of Employees *</Label>
          <Input type="number" {...register('numberOfEmployees')} />
          {errors.numberOfEmployees && <p className="text-sm text-red-600">{errors.numberOfEmployees.message}</p>}
        </div>
      </div>
    </FormSection>
  );

  const DirectorsStep = () => (
    <FormSection title="Directors and Shareholders" icon={<Users className="h-5 w-5" />}>
      <div className="space-y-4">
        {fields.map((field, index) => (
          <div key={field.id} className="p-4 border rounded-lg space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-medium">Director {index + 1}</h4>
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Name *</Label>
                <Input {...register(`directors.${index}.name`)} />
                {errors.directors?.[index]?.name && (
                  <p className="text-sm text-red-600">{errors.directors[index]?.name?.message}</p>
                )}
              </div>
              
              <div>
                <Label>Position *</Label>
                <Input {...register(`directors.${index}.position`)} />
                {errors.directors?.[index]?.position && (
                  <p className="text-sm text-red-600">{errors.directors[index]?.position?.message}</p>
                )}
              </div>
              
              <div>
                <Label>Nationality *</Label>
                <Input {...register(`directors.${index}.nationality`)} />
                {errors.directors?.[index]?.nationality && (
                  <p className="text-sm text-red-600">{errors.directors[index]?.nationality?.message}</p>
                )}
              </div>
              
              <div>
                <Label>Shareholding (%)</Label>
                <Input type="number" {...register(`directors.${index}.shareholding`)} />
              </div>
            </div>
          </div>
        ))}
        
        <Button
          type="button"
          variant="outline"
          onClick={() => append({ name: '', position: '', nationality: '', shareholding: 0 })}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Director
        </Button>
      </div>
    </FormSection>
  );

  const DocumentsStep = () => (
    <FormSection title="Required Documents" icon={<Upload className="h-5 w-5" />}>
      <div className="space-y-6">
        <FileUpload
          label="Certificate of Incorporation"
          required
          onFileSelect={(file) => setValue('certificateOfIncorporation', file)}
          currentFile={watchedValues.certificateOfIncorporation}
          error={errors.certificateOfIncorporation?.message}
        />
        
        <FileUpload
          label="Memorandum of Association"
          required
          onFileSelect={(file) => setValue('memorandumOfAssociation', file)}
          currentFile={watchedValues.memorandumOfAssociation}
          error={errors.memorandumOfAssociation?.message}
        />
        
        <FileUpload
          label="Audited Financial Statements"
          required
          onFileSelect={(file) => setValue('auditedFinancialStatements', file)}
          currentFile={watchedValues.auditedFinancialStatements}
          error={errors.auditedFinancialStatements?.message}
        />
        
        <FileUpload
          label="Board Resolution"
          required
          onFileSelect={(file) => setValue('boardResolution', file)}
          currentFile={watchedValues.boardResolution}
          error={errors.boardResolution?.message}
        />
      </div>
    </FormSection>
  );

  const steps = [
    {
      id: 'company',
      title: 'Company Information',
      component: <CompanyInfoStep />,
      isValid: !errors.companyName && !errors.registrationNumber && !errors.incorporationDate
    },
    {
      id: 'contact',
      title: 'Contact Information',
      component: <ContactInfoStep />,
      isValid: !errors.registeredAddress && !errors.businessAddress && !errors.phoneNumber && !errors.email
    },
    {
      id: 'directors',
      title: 'Directors & Shareholders',
      component: <DirectorsStep />,
      isValid: !errors.directors
    },
    {
      id: 'documents',
      title: 'Document Upload',
      component: <DocumentsStep />,
      isValid: !errors.certificateOfIncorporation && !errors.memorandumOfAssociation
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Corporate KYC Application</h1>
          <p className="text-gray-600 mt-2">Please provide complete company information for verification</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <MultiStepForm
            steps={steps}
            onSubmit={onSubmit}
            isSubmitting={isSubmitting}
            submitButtonText="Submit Corporate KYC"
          />
        </form>
      </div>
    </div>
  );
};

export default CorporateKYC;
