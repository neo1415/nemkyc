import React, { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useAuth } from '../../contexts/AuthContext';
import { individualCDDSchema } from '../../utils/validation';
import { IndividualCDDData } from '../../types';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Checkbox } from '../../components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import FormSection from '../../components/common/FormSection';
import FileUpload from '../../components/common/FileUpload';
import PhoneInput from '../../components/common/PhoneInput';
import MultiStepForm from '../../components/common/MultiStepForm';
import AuthRequiredSubmit from '../../components/common/AuthRequiredSubmit';
import { User, Info, CreditCard, FileText } from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { notifySubmission } from '../../services/notificationService';

const DatePickerField = ({ label, name, required = false, formMethods, error }: any) => {
  const value = formMethods.watch(name);
  return (
    <div>
      <Label htmlFor={name}>{label} {required && '*'}</Label>
      <Input
        type="date"
        value={value || ''}
        onChange={(e) => formMethods.setValue(name, e.target.value)}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
};

const IndividualCDD: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  const formMethods = useForm<IndividualCDDData>({
    resolver: yupResolver(individualCDDSchema) as any,
    defaultValues: {
      title: '',
      firstName: '',
      lastName: '',
      contactAddress: '',
      gender: 'male',
      residenceCountry: '',
      dateOfBirth: '',
      placeOfBirth: '',
      email: user?.email || '',
      mobileNumber: '',
      residentialAddress: '',
      nationality: '',
      occupation: '',
      position: '',
      businessType: 'soleProprietor',
      businessTypeOther: '',
      employerEmail: '',
      employerName: '',
      employerTelephone: '',
      employerAddress: '',
      taxId: '',
      bvn: '',
      idType: 'passport',
      identificationNumber: '',
      issuingCountry: '',
      issuedDate: '',
      expiryDate: '',
      annualIncomeRange: 'lessThan1M',
      premiumPaymentSource: 'salary',
      premiumPaymentSourceOther: '',
      signature: '',
      agreeToDataPrivacy: false,
    }
  });

  const { register, handleSubmit, formState: { errors }, setValue, watch } = formMethods;
  const watchedValues = watch();
  
  const handleFileSelect = useCallback((field: string, file: File) => {
    setValue(field as any, file);
  }, [setValue]);

  const onSubmit = async (data: IndividualCDDData) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    
    setIsSubmitting(true);
    try {
      const submissionId = `cdd_individual_${Date.now()}`;
      
      await setDoc(doc(db, 'submissions', submissionId), {
        id: submissionId,
        userId: user.uid,
        formType: 'individual-cdd',
        data: data,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      await notifySubmission(user, 'Individual CDD');
      
      toast({
        title: "CDD Form Submitted",
        description: "Your Individual CDD form has been submitted successfully.",
      });
      
      window.location.href = '/dashboard';
    } catch (error) {
      console.error('Error submitting CDD:', error);
      toast({
        title: "Submission Error",
        description: "Failed to submit CDD form. Please try again.",
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
          <Label htmlFor="title">Title *</Label>
          <Input {...register('title')} />
          {errors.title && <p className="text-sm text-red-600">{errors.title.message}</p>}
        </div>
        
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
          <Label>Gender *</Label>
          <Select
            value={watchedValues.gender || 'male'}
            onValueChange={(value) => setValue('gender', value as any)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
            </SelectContent>
          </Select>
          {errors.gender && <p className="text-sm text-red-600">{errors.gender.message}</p>}
        </div>
        
        <div>
          <Label htmlFor="residenceCountry">Residence Country *</Label>
          <Input {...register('residenceCountry')} />
          {errors.residenceCountry && <p className="text-sm text-red-600">{errors.residenceCountry.message}</p>}
        </div>
        
        <DatePickerField
          label="Date of Birth"
          name="dateOfBirth"
          required
          formMethods={formMethods}
          error={errors.dateOfBirth?.message}
        />
        
        <div>
          <Label htmlFor="placeOfBirth">Place of Birth *</Label>
          <Input {...register('placeOfBirth')} />
          {errors.placeOfBirth && <p className="text-sm text-red-600">{errors.placeOfBirth.message}</p>}
        </div>
        
        <div>
          <Label htmlFor="email">Email *</Label>
          <Input type="email" {...register('email')} />
          {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
        </div>
        
        <div>
          <PhoneInput
            label="Mobile Number"
            required
            value={watchedValues.mobileNumber || ''}
            onChange={(value) => setValue('mobileNumber', value)}
            error={errors.mobileNumber?.message}
          />
        </div>
        
        <div>
          <Label htmlFor="nationality">Nationality *</Label>
          <Input {...register('nationality')} />
          {errors.nationality && <p className="text-sm text-red-600">{errors.nationality.message}</p>}
        </div>
        
        <div>
          <Label htmlFor="occupation">Occupation *</Label>
          <Input {...register('occupation')} />
          {errors.occupation && <p className="text-sm text-red-600">{errors.occupation.message}</p>}
        </div>
        
        <div>
          <Label htmlFor="position">Position</Label>
          <Input {...register('position')} />
        </div>
        
        <div className="md:col-span-2">
          <Label htmlFor="contactAddress">Contact Address *</Label>
          <Textarea {...register('contactAddress')} />
          {errors.contactAddress && <p className="text-sm text-red-600">{errors.contactAddress.message}</p>}
        </div>
        
        <div className="md:col-span-2">
          <Label htmlFor="residentialAddress">Residential Address *</Label>
          <Textarea {...register('residentialAddress')} />
          {errors.residentialAddress && <p className="text-sm text-red-600">{errors.residentialAddress.message}</p>}
        </div>
      </div>
    </FormSection>
  );

  const AdditionalInfoStep = () => (
    <FormSection title="Additional Information" icon={<Info className="h-5 w-5" />}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Business Type *</Label>
          <Select
            value={watchedValues.businessType || 'soleProprietor'}
            onValueChange={(value) => setValue('businessType', value as any)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Choose company type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="soleProprietor">Sole Proprietor</SelectItem>
              <SelectItem value="limitedLiability">Limited Liability Company</SelectItem>
              <SelectItem value="publicLimited">Public Limited Company</SelectItem>
              <SelectItem value="jointVenture">Joint Venture</SelectItem>
              <SelectItem value="other">Other (please specify)</SelectItem>
            </SelectContent>
          </Select>
          {errors.businessType && <p className="text-sm text-red-600">{errors.businessType.message}</p>}
        </div>
        
        {watchedValues.businessType === 'other' && (
          <div>
            <Label htmlFor="businessTypeOther">Please specify business type *</Label>
            <Input {...register('businessTypeOther')} />
            {errors.businessTypeOther && <p className="text-sm text-red-600">{errors.businessTypeOther.message}</p>}
          </div>
        )}
        
        <div>
          <Label htmlFor="employerEmail">Employer's Email *</Label>
          <Input type="email" {...register('employerEmail')} />
          {errors.employerEmail && <p className="text-sm text-red-600">{errors.employerEmail.message}</p>}
        </div>
        
        <div>
          <Label htmlFor="employerName">Employer's Name</Label>
          <Input {...register('employerName')} />
        </div>
        
        <div>
          <PhoneInput
            label="Employer's Telephone"
            value={watchedValues.employerTelephone || ''}
            onChange={(value) => setValue('employerTelephone', value)}
          />
        </div>
        
        <div>
          <Label htmlFor="taxId">Tax Identification Number</Label>
          <Input {...register('taxId')} />
        </div>
        
        <div>
          <Label htmlFor="bvn">BVN *</Label>
          <Input {...register('bvn')} placeholder="11 digits" />
          {errors.bvn && <p className="text-sm text-red-600">{errors.bvn.message}</p>}
        </div>
        
        <div>
          <Label>ID Type *</Label>
          <Select
            value={watchedValues.idType || 'passport'}
            onValueChange={(value) => setValue('idType', value as any)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Choose ID type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="passport">International Passport</SelectItem>
              <SelectItem value="nimc">NIMC</SelectItem>
              <SelectItem value="driversLicense">Drivers Licence</SelectItem>
              <SelectItem value="votersCard">Voters Card</SelectItem>
              <SelectItem value="nin">NIN</SelectItem>
            </SelectContent>
          </Select>
          {errors.idType && <p className="text-sm text-red-600">{errors.idType.message}</p>}
        </div>
        
        <div>
          <Label htmlFor="identificationNumber">Identification Number *</Label>
          <Input {...register('identificationNumber')} />
          {errors.identificationNumber && <p className="text-sm text-red-600">{errors.identificationNumber.message}</p>}
        </div>
        
        <div>
          <Label htmlFor="issuingCountry">Issuing Country *</Label>
          <Input {...register('issuingCountry')} />
          {errors.issuingCountry && <p className="text-sm text-red-600">{errors.issuingCountry.message}</p>}
        </div>
        
        <DatePickerField
          label="Issued Date"
          name="issuedDate"
          required
          formMethods={formMethods}
          error={errors.issuedDate?.message}
        />
        
        <DatePickerField
          label="Expiry Date"
          name="expiryDate"
          formMethods={formMethods}
          error={errors.expiryDate?.message}
        />
        
        <div className="md:col-span-2">
          <Label htmlFor="employerAddress">Employer's Address</Label>
          <Textarea {...register('employerAddress')} />
        </div>
      </div>
    </FormSection>
  );

  const AccountDetailsStep = () => (
    <FormSection title="Account Details & Uploads" icon={<CreditCard className="h-5 w-5" />}>
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Annual Income Range *</Label>
            <Select
              value={watchedValues.annualIncomeRange || 'lessThan1M'}
              onValueChange={(value) => setValue('annualIncomeRange', value as any)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select income range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lessThan1M">Less Than 1 Million</SelectItem>
                <SelectItem value="1M-4M">1 Million - 4 Million</SelectItem>
                <SelectItem value="4.1M-10M">4.1 Million - 10 Million</SelectItem>
                <SelectItem value="moreThan10M">More Than 10 Million</SelectItem>
              </SelectContent>
            </Select>
            {errors.annualIncomeRange && <p className="text-sm text-red-600">{errors.annualIncomeRange.message}</p>}
          </div>
          
          <div>
            <Label>Premium Payment Source *</Label>
            <Select
              value={watchedValues.premiumPaymentSource || 'salary'}
              onValueChange={(value) => setValue('premiumPaymentSource', value as any)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose income source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="salary">Salary or Business Income</SelectItem>
                <SelectItem value="investments">Investments or Dividends</SelectItem>
                <SelectItem value="other">Other (please specify)</SelectItem>
              </SelectContent>
            </Select>
            {errors.premiumPaymentSource && <p className="text-sm text-red-600">{errors.premiumPaymentSource.message}</p>}
          </div>
          
          {watchedValues.premiumPaymentSource === 'other' && (
            <div>
              <Label htmlFor="premiumPaymentSourceOther">Please specify payment source *</Label>
              <Input {...register('premiumPaymentSourceOther')} />
              {errors.premiumPaymentSourceOther && <p className="text-sm text-red-600">{errors.premiumPaymentSourceOther.message}</p>}
            </div>
          )}
        </div>
        
        <FileUpload
          label="Upload Means of Identification"
          required
          onFileSelect={(file) => handleFileSelect('identificationDocument', file)}
          currentFile={watchedValues.identificationDocument}
          accept=".jpg,.jpeg,.png,.pdf"
          maxSize={3}
          error={errors.identificationDocument?.message}
        />
        
        <div>
          <Label htmlFor="signature">Digital Signature *</Label>
          <Textarea 
            {...register('signature')}
            placeholder="Type your full name as signature"
          />
          {errors.signature && <p className="text-sm text-red-600">{errors.signature.message}</p>}
        </div>
      </div>
    </FormSection>
  );

  const PrivacyStep = () => (
    <FormSection title="Data Privacy & Declaration" icon={<FileText className="h-5 w-5" />}>
      <div className="space-y-6">
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-700 mb-4">
            By submitting this form, I acknowledge that I have read and understood the data privacy policy. 
            I consent to the collection, processing, and storage of my personal information as outlined in the policy.
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Checkbox
            id="agreeToDataPrivacy"
            checked={watchedValues.agreeToDataPrivacy || false}
            onCheckedChange={(checked) => setValue('agreeToDataPrivacy', checked as boolean)}
          />
          <Label htmlFor="agreeToDataPrivacy" className="text-sm">
            I agree to the data privacy policy *
          </Label>
        </div>
        {errors.agreeToDataPrivacy && <p className="text-sm text-red-600">{errors.agreeToDataPrivacy.message}</p>}
      </div>
    </FormSection>
  );

  const steps = [
    {
      id: 'personal',
      title: 'Personal Information',
      component: <PersonalInfoStep />,
      isValid: !errors.title && !errors.firstName && !errors.lastName && !errors.contactAddress && !errors.gender && !errors.residenceCountry && !errors.dateOfBirth && !errors.placeOfBirth && !errors.email && !errors.mobileNumber && !errors.residentialAddress && !errors.nationality && !errors.occupation
    },
    {
      id: 'additional',
      title: 'Additional Information',
      component: <AdditionalInfoStep />,
      isValid: !errors.businessType && !errors.employerEmail && !errors.bvn && !errors.idType && !errors.identificationNumber && !errors.issuingCountry && !errors.issuedDate
    },
    {
      id: 'account',
      title: 'Account Details & Uploads',
      component: <AccountDetailsStep />,
      isValid: !errors.annualIncomeRange && !errors.premiumPaymentSource && !errors.identificationDocument && !errors.signature
    },
    {
      id: 'privacy',
      title: 'Data Privacy & Declaration',
      component: <PrivacyStep />,
      isValid: !errors.agreeToDataPrivacy
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Individual CDD Application</h1>
          <p className="text-gray-600 mt-2">Please provide accurate information for customer due diligence</p>
        </div>

        <MultiStepForm
          steps={steps}
          onSubmit={onSubmit}
          isSubmitting={isSubmitting}
          submitButtonText="Submit CDD Application"
          formMethods={formMethods}
        />

        <AuthRequiredSubmit
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onProceedToSignup={() => {
            window.location.href = '/signup';
          }}
          formType="Individual CDD"
        />
      </div>
    </div>
  );
};

export default IndividualCDD;