import React, { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useAuth } from '../../contexts/AuthContext';
import { individualKYCSchema } from '../../utils/validation';
import { IndividualKYCData } from '../../types';
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
import { User, CreditCard, Upload, FileText } from 'lucide-react';
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

const IndividualKYC: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  const formMethods = useForm<IndividualKYCData>({
    resolver: yupResolver(individualKYCSchema) as any,
    defaultValues: {
      email: user?.email || '',
      agreeToDataPrivacy: false,
      signature: '',
      officeLocation: '',
      title: '',
      firstName: '',
      middleName: '',
      lastName: '',
      contactAddress: '',
      occupation: '',
      gender: 'male',
      dateOfBirth: '',
      mothersMaidenName: '',
      city: '',
      state: '',
      country: '',
      nationality: 'Nigerian',
      residentialAddress: '',
      mobileNumber: '',
      taxId: '',
      bvn: '',
      idType: 'passport',
      identificationNumber: '',
      issuingCountry: '',
      issuedDate: '',
      sourceOfIncome: 'salary',
      annualIncomeRange: 'lessThan1M',
      premiumPaymentSource: 'salary',
      localBankName: '',
      localAccountNumber: '',
      localBankBranch: '',
      localAccountOpeningDate: ''
    }
  });

  const { register, handleSubmit, formState: { errors }, setValue, watch } = formMethods;
  const watchedValues = watch();
  
  const handleFileSelect = useCallback((field: string, file: File) => {
    setValue(field as any, file);
  }, [setValue]);

  const onSubmit = async (data: IndividualKYCData) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    
    setIsSubmitting(true);
    try {
      const submissionId = `kyc_individual_${Date.now()}`;
      
      await setDoc(doc(db, 'submissions', submissionId), {
        id: submissionId,
        userId: user.uid,
        formType: 'individual-kyc',
        data: data,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      await notifySubmission(user, 'Individual KYC');
      
      toast({
        title: "KYC Form Submitted",
        description: "Your Individual KYC form has been submitted successfully.",
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

  const PersonalInfoStep = () => (
    <FormSection title="Personal Information" icon={<User className="h-5 w-5" />}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="officeLocation">Office Location *</Label>
          <Input {...register('officeLocation')} />
          {errors.officeLocation && <p className="text-sm text-red-600">{errors.officeLocation.message}</p>}
        </div>
        
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
          <Label htmlFor="middleName">Middle Name *</Label>
          <Input {...register('middleName')} />
          {errors.middleName && <p className="text-sm text-red-600">{errors.middleName.message}</p>}
        </div>
        
        <div>
          <Label htmlFor="lastName">Last Name *</Label>
          <Input {...register('lastName')} />
          {errors.lastName && <p className="text-sm text-red-600">{errors.lastName.message}</p>}
        </div>
        
        <div>
          <Label htmlFor="occupation">Occupation *</Label>
          <Input {...register('occupation')} />
          {errors.occupation && <p className="text-sm text-red-600">{errors.occupation.message}</p>}
        </div>
        
        <div>
          <Label>Gender *</Label>
          <Select
            value={watchedValues.gender}
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
        
        <DatePickerField
          label="Date of Birth"
          name="dateOfBirth"
          required
          formMethods={formMethods}
          error={errors.dateOfBirth?.message}
        />
        
        <div>
          <Label htmlFor="mothersMaidenName">Mother's Maiden Name *</Label>
          <Input {...register('mothersMaidenName')} />
          {errors.mothersMaidenName && <p className="text-sm text-red-600">{errors.mothersMaidenName.message}</p>}
        </div>
        
        <div>
          <Label htmlFor="employersName">Employer's Name</Label>
          <Input {...register('employersName')} />
        </div>
        
        <div>
          <PhoneInput
            label="Employer's Telephone"
            value={watchedValues.employersTelephone || ''}
            onChange={(value) => setValue('employersTelephone', value)}
          />
        </div>
        
        <div>
          <Label htmlFor="city">City *</Label>
          <Input {...register('city')} />
          {errors.city && <p className="text-sm text-red-600">{errors.city.message}</p>}
        </div>
        
        <div>
          <Label htmlFor="state">State *</Label>
          <Input {...register('state')} />
          {errors.state && <p className="text-sm text-red-600">{errors.state.message}</p>}
        </div>
        
        <div>
          <Label htmlFor="country">Country *</Label>
          <Input {...register('country')} />
          {errors.country && <p className="text-sm text-red-600">{errors.country.message}</p>}
        </div>
        
        <div>
          <Label>Nationality *</Label>
          <Select
            value={watchedValues.nationality}
            onValueChange={(value) => setValue('nationality', value as any)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select nationality" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Nigerian">Nigerian</SelectItem>
              <SelectItem value="Foreign">Foreign</SelectItem>
              <SelectItem value="Both">Both</SelectItem>
            </SelectContent>
          </Select>
          {errors.nationality && <p className="text-sm text-red-600">{errors.nationality.message}</p>}
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
          <Label htmlFor="email">Email *</Label>
          <Input type="email" {...register('email')} />
          {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
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
            value={watchedValues.idType}
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
        
        <div>
          <Label>Source of Income *</Label>
          <Select
            value={watchedValues.sourceOfIncome}
            onValueChange={(value) => setValue('sourceOfIncome', value as any)}
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
          {errors.sourceOfIncome && <p className="text-sm text-red-600">{errors.sourceOfIncome.message}</p>}
        </div>
        
        {watchedValues.sourceOfIncome === 'other' && (
          <div>
            <Label htmlFor="sourceOfIncomeOther">Please specify other source *</Label>
            <Input {...register('sourceOfIncomeOther')} />
            {errors.sourceOfIncomeOther && <p className="text-sm text-red-600">{errors.sourceOfIncomeOther.message}</p>}
          </div>
        )}
        
        <div>
          <Label>Annual Income Range *</Label>
          <Select
            value={watchedValues.annualIncomeRange}
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
            value={watchedValues.premiumPaymentSource}
            onValueChange={(value) => setValue('premiumPaymentSource', value as any)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Choose payment source" />
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
            <Label htmlFor="premiumPaymentSourceOther">Please specify other source *</Label>
            <Input {...register('premiumPaymentSourceOther')} />
            {errors.premiumPaymentSourceOther && <p className="text-sm text-red-600">{errors.premiumPaymentSourceOther.message}</p>}
          </div>
        )}
        
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
        
        <div className="md:col-span-2">
          <Label htmlFor="employersAddress">Employer's Address</Label>
          <Textarea {...register('employersAddress')} />
        </div>
      </div>
    </FormSection>
  );

  const AccountDetailsStep = () => (
    <FormSection title="Account Details" icon={<CreditCard className="h-5 w-5" />}>
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">Local Account Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="localBankName">Bank Name *</Label>
              <Input {...register('localBankName')} />
              {errors.localBankName && <p className="text-sm text-red-600">{errors.localBankName.message}</p>}
            </div>
            
            <div>
              <Label htmlFor="localAccountNumber">Account Number *</Label>
              <Input {...register('localAccountNumber')} />
              {errors.localAccountNumber && <p className="text-sm text-red-600">{errors.localAccountNumber.message}</p>}
            </div>
            
            <div>
              <Label htmlFor="localBankBranch">Bank Branch *</Label>
              <Input {...register('localBankBranch')} />
              {errors.localBankBranch && <p className="text-sm text-red-600">{errors.localBankBranch.message}</p>}
            </div>
            
            <DatePickerField
              label="Account Opening Date"
              name="localAccountOpeningDate"
              required
              formMethods={formMethods}
              error={errors.localAccountOpeningDate?.message}
            />
          </div>
        </div>
        
        <div>
          <h3 className="text-lg font-semibold mb-4">Foreign Account Details (Optional)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="foreignBankName">Bank Name</Label>
              <Input {...register('foreignBankName')} />
            </div>
            
            <div>
              <Label htmlFor="foreignAccountNumber">Account Number</Label>
              <Input {...register('foreignAccountNumber')} />
            </div>
            
            <div>
              <Label htmlFor="foreignBankBranch">Bank Branch</Label>
              <Input {...register('foreignBankBranch')} />
            </div>
            
            <DatePickerField
              label="Account Opening Date"
              name="foreignAccountOpeningDate"
              formMethods={formMethods}
              error={errors.foreignAccountOpeningDate?.message}
            />
          </div>
        </div>
      </div>
    </FormSection>
  );

  const UploadStep = () => (
    <FormSection title="Upload Documents" icon={<Upload className="h-5 w-5" />}>
      <div className="space-y-6">
        <FileUpload
          label="Upload Means of Identification"
          required
          onFileSelect={(file) => handleFileSelect('identificationDocument', file)}
          currentFile={watchedValues.identificationDocument}
          accept=".jpg,.jpeg,.png,.pdf"
          maxSize={3}
          error={errors.identificationDocument?.message}
        />
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
            checked={watchedValues.agreeToDataPrivacy}
            onCheckedChange={(checked) => setValue('agreeToDataPrivacy', checked as boolean)}
          />
          <Label htmlFor="agreeToDataPrivacy" className="text-sm">
            I agree to the data privacy policy *
          </Label>
        </div>
        {errors.agreeToDataPrivacy && <p className="text-sm text-red-600">{errors.agreeToDataPrivacy.message}</p>}
        
        <div>
          <Label htmlFor="signature">Electronic Signature *</Label>
          <Input
            {...register('signature')}
            placeholder="Type your full name as signature"
          />
          {errors.signature && <p className="text-sm text-red-600">{errors.signature.message}</p>}
        </div>
      </div>
    </FormSection>
  );

  const steps = [
    {
      id: 'personal',
      title: 'Personal Information',
      component: <PersonalInfoStep />,
      isValid: !errors.firstName && !errors.lastName && !errors.middleName && !errors.occupation && !errors.gender && !errors.dateOfBirth && !errors.nationality && !errors.mobileNumber && !errors.email && !errors.bvn && !errors.idType && !errors.identificationNumber && !errors.issuingCountry && !errors.issuedDate && !errors.sourceOfIncome && !errors.annualIncomeRange && !errors.premiumPaymentSource && !errors.contactAddress && !errors.residentialAddress
    },
    {
      id: 'account',
      title: 'Account Details',
      component: <AccountDetailsStep />,
      isValid: !errors.localBankName && !errors.localAccountNumber && !errors.localBankBranch && !errors.localAccountOpeningDate
    },
    {
      id: 'upload',
      title: 'Upload Documents',
      component: <UploadStep />,
      isValid: !errors.identificationDocument
    },
    {
      id: 'privacy',
      title: 'Data Privacy & Declaration',
      component: <PrivacyStep />,
      isValid: !errors.agreeToDataPrivacy && !errors.signature
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Individual KYC Application</h1>
          <p className="text-gray-600 mt-2">Please provide accurate information for identity verification</p>
        </div>

        <MultiStepForm
          steps={steps}
          onSubmit={onSubmit}
          isSubmitting={isSubmitting}
          submitButtonText="Submit KYC Application"
          formMethods={formMethods}
        />

        <AuthRequiredSubmit
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onProceedToSignup={() => {
            window.location.href = '/signup';
          }}
          formType="Individual KYC"
        />
      </div>
    </div>
  );
};

export default IndividualKYC;