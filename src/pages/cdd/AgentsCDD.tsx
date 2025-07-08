import React, { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useAuth } from '../../contexts/AuthContext';
import { agentsCDDSchema } from '../../utils/validation';
import { AgentsCDDData } from '../../types';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Checkbox } from '../../components/ui/checkbox';
import { toast } from '../../components/ui/use-toast';
import FormSection from '../../components/common/FormSection';
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

const AgentsCDD: React.FC = () => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  const formMethods = useForm<AgentsCDDData>({
    resolver: yupResolver(agentsCDDSchema) as any,
    defaultValues: {
      firstName: '',
      middleName: '',
      lastName: '',
      residentialAddress: '',
      gender: 'male',
      position: '',
      dateOfBirth: '',
      placeOfBirth: '',
      otherSourceOfIncome: 'salary',
      otherSourceOfIncomeOther: '',
      nationality: '',
      phoneNumber: '',
      bvn: '',
      taxIdNumber: '',
      occupation: '',
      email: user?.email || '',
      validMeansOfId: 'passport',
      identificationNumber: '',
      issuedDate: '',
      expiryDate: '',
      issuingBody: '',
      agentName: '',
      agentsOfficeAddress: '',
      naicomLicenseNumber: '',
      licenseIssuedDate: '',
      licenseExpiryDate: '',
      emailAddress: user?.email || '',
      website: '',
      mobileNumber: '',
      taxIdentificationNumber: '',
      arianMembershipNumber: '',
      listOfAgentsApprovedPrincipals: '',
      localAccountNumber: '',
      localBankName: '',
      localBankBranch: '',
      localAccountOpeningDate: '',
      foreignAccountNumber: '',
      foreignBankName: '',
      foreignBankBranch: '',
      foreignAccountOpeningDate: '',
      agreeToDataPrivacy: false,
      signature: '',
    }
  });

  const { register, handleSubmit, formState: { errors }, setValue, watch } = formMethods;
  const watchedValues = watch();

  const onSubmit = async (data: AgentsCDDData) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    
    setIsSubmitting(true);
    try {
      const submissionId = `cdd_agents_${Date.now()}`;
      
      await setDoc(doc(db, 'submissions', submissionId), {
        id: submissionId,
        userId: user.uid,
        formType: 'agents-cdd',
        data: data,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      await notifySubmission(user, 'Agents CDD');
      
      toast({
        title: "CDD Form Submitted",
        description: "Your Agents CDD form has been submitted successfully.",
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
          <Label htmlFor="firstName">First Name *</Label>
          <Input {...register('firstName')} />
          {errors.firstName && <p className="text-sm text-red-600">{errors.firstName.message}</p>}
        </div>
        
        <div>
          <Label htmlFor="middleName">Middle Name</Label>
          <Input {...register('middleName')} />
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
          <Label htmlFor="position">Position/Role *</Label>
          <Input {...register('position')} />
          {errors.position && <p className="text-sm text-red-600">{errors.position.message}</p>}
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
          <Label>Other Source of Income *</Label>
          <Select
            value={watchedValues.otherSourceOfIncome || 'salary'}
            onValueChange={(value) => setValue('otherSourceOfIncome', value as any)}
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
          {errors.otherSourceOfIncome && <p className="text-sm text-red-600">{errors.otherSourceOfIncome.message}</p>}
        </div>
        
        {watchedValues.otherSourceOfIncome === 'other' && (
          <div>
            <Label htmlFor="otherSourceOfIncomeOther">Please specify income source *</Label>
            <Input {...register('otherSourceOfIncomeOther')} />
            {errors.otherSourceOfIncomeOther && <p className="text-sm text-red-600">{errors.otherSourceOfIncomeOther.message}</p>}
          </div>
        )}
        
        <div>
          <Label htmlFor="nationality">Nationality *</Label>
          <Input {...register('nationality')} />
          {errors.nationality && <p className="text-sm text-red-600">{errors.nationality.message}</p>}
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
          <Label htmlFor="bvn">BVN *</Label>
          <Input {...register('bvn')} placeholder="11 digits" />
          {errors.bvn && <p className="text-sm text-red-600">{errors.bvn.message}</p>}
        </div>
        
        <div>
          <Label htmlFor="taxIdNumber">Tax ID Number</Label>
          <Input {...register('taxIdNumber')} />
        </div>
        
        <div>
          <Label htmlFor="occupation">Occupation *</Label>
          <Input {...register('occupation')} />
          {errors.occupation && <p className="text-sm text-red-600">{errors.occupation.message}</p>}
        </div>
        
        <div>
          <Label htmlFor="email">Email *</Label>
          <Input type="email" {...register('email')} />
          {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
        </div>
        
        <div>
          <Label>Valid Means of ID *</Label>
          <Select
            value={watchedValues.validMeansOfId || 'passport'}
            onValueChange={(value) => setValue('validMeansOfId', value as any)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Choose identification type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="passport">International Passport</SelectItem>
              <SelectItem value="nimc">NIMC</SelectItem>
              <SelectItem value="driversLicense">Drivers Licence</SelectItem>
              <SelectItem value="votersCard">Voters Card</SelectItem>
            </SelectContent>
          </Select>
          {errors.validMeansOfId && <p className="text-sm text-red-600">{errors.validMeansOfId.message}</p>}
        </div>
        
        <div>
          <Label htmlFor="identificationNumber">Identification Number *</Label>
          <Input {...register('identificationNumber')} />
          {errors.identificationNumber && <p className="text-sm text-red-600">{errors.identificationNumber.message}</p>}
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
          <Label htmlFor="issuingBody">Issuing Body *</Label>
          <Input {...register('issuingBody')} />
          {errors.issuingBody && <p className="text-sm text-red-600">{errors.issuingBody.message}</p>}
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
          <Label htmlFor="agentName">Agent Name *</Label>
          <Input {...register('agentName')} />
          {errors.agentName && <p className="text-sm text-red-600">{errors.agentName.message}</p>}
        </div>
        
        <div>
          <Label htmlFor="naicomLicenseNumber">NAICOM License Number (RIA) *</Label>
          <Input {...register('naicomLicenseNumber')} />
          {errors.naicomLicenseNumber && <p className="text-sm text-red-600">{errors.naicomLicenseNumber.message}</p>}
        </div>
        
        <DatePickerField
          label="License Issued Date"
          name="licenseIssuedDate"
          required
          formMethods={formMethods}
          error={errors.licenseIssuedDate?.message}
        />
        
        <DatePickerField
          label="License Expiry Date"
          name="licenseExpiryDate"
          required
          formMethods={formMethods}
          error={errors.licenseExpiryDate?.message}
        />
        
        <div>
          <Label htmlFor="emailAddress">Email Address *</Label>
          <Input type="email" {...register('emailAddress')} />
          {errors.emailAddress && <p className="text-sm text-red-600">{errors.emailAddress.message}</p>}
        </div>
        
        <div>
          <Label htmlFor="website">Website *</Label>
          <Input {...register('website')} />
          {errors.website && <p className="text-sm text-red-600">{errors.website.message}</p>}
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
          <Label htmlFor="taxIdentificationNumber">Tax Identification Number</Label>
          <Input {...register('taxIdentificationNumber')} />
        </div>
        
        <div>
          <Label htmlFor="arianMembershipNumber">ARIAN Membership Number *</Label>
          <Input {...register('arianMembershipNumber')} />
          {errors.arianMembershipNumber && <p className="text-sm text-red-600">{errors.arianMembershipNumber.message}</p>}
        </div>
        
        <div className="md:col-span-2">
          <Label htmlFor="agentsOfficeAddress">Agents Office Address *</Label>
          <Textarea {...register('agentsOfficeAddress')} />
          {errors.agentsOfficeAddress && <p className="text-sm text-red-600">{errors.agentsOfficeAddress.message}</p>}
        </div>
        
        <div className="md:col-span-2">
          <Label htmlFor="listOfAgentsApprovedPrincipals">List of Agents Approved Principals (Insurers) *</Label>
          <Textarea {...register('listOfAgentsApprovedPrincipals')} />
          {errors.listOfAgentsApprovedPrincipals && <p className="text-sm text-red-600">{errors.listOfAgentsApprovedPrincipals.message}</p>}
        </div>
      </div>
    </FormSection>
  );

  const FinancialInfoStep = () => (
    <FormSection title="Financial Information" icon={<CreditCard className="h-5 w-5" />}>
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">Local Account Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="localAccountNumber">Account Number *</Label>
              <Input {...register('localAccountNumber')} />
              {errors.localAccountNumber && <p className="text-sm text-red-600">{errors.localAccountNumber.message}</p>}
            </div>
            
            <div>
              <Label htmlFor="localBankName">Bank Name *</Label>
              <Input {...register('localBankName')} />
              {errors.localBankName && <p className="text-sm text-red-600">{errors.localBankName.message}</p>}
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
              <Label htmlFor="foreignAccountNumber">Account Number</Label>
              <Input {...register('foreignAccountNumber')} />
            </div>
            
            <div>
              <Label htmlFor="foreignBankName">Bank Name</Label>
              <Input {...register('foreignBankName')} />
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
        
        <div>
          <Label htmlFor="signature">Electronic Signature *</Label>
          <Textarea 
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
      isValid: !errors.firstName && !errors.lastName && !errors.residentialAddress && !errors.gender && !errors.position && !errors.dateOfBirth && !errors.placeOfBirth && !errors.otherSourceOfIncome && !errors.nationality && !errors.phoneNumber && !errors.bvn && !errors.occupation && !errors.email && !errors.validMeansOfId && !errors.identificationNumber && !errors.issuedDate && !errors.issuingBody
    },
    {
      id: 'additional',
      title: 'Additional Information',
      component: <AdditionalInfoStep />,
      isValid: !errors.agentName && !errors.agentsOfficeAddress && !errors.naicomLicenseNumber && !errors.licenseIssuedDate && !errors.licenseExpiryDate && !errors.emailAddress && !errors.website && !errors.mobileNumber && !errors.arianMembershipNumber && !errors.listOfAgentsApprovedPrincipals
    },
    {
      id: 'financial',
      title: 'Financial Information',
      component: <FinancialInfoStep />,
      isValid: !errors.localAccountNumber && !errors.localBankName && !errors.localBankBranch && !errors.localAccountOpeningDate
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
          <h1 className="text-3xl font-bold text-gray-900">Agents CDD Application</h1>
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
          formType="Agents CDD"
        />
      </div>
    </div>
  );
};

export default AgentsCDD;