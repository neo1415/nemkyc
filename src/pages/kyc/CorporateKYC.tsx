import React, { useState, useCallback } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useAuth } from '../../contexts/AuthContext';
import { corporateKYCSchema } from '../../utils/validation';
import { CorporateKYCData } from '../../types';
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
import { Building2, Users, Upload, FileText, Plus, Trash2 } from 'lucide-react';
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

const CorporateKYC: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  const formMethods = useForm<CorporateKYCData>({
    resolver: yupResolver(corporateKYCSchema) as any,
    defaultValues: {
      email: user?.email || '',
      directors: [{
        firstName: '',
        middleName: '',
        lastName: '',
        dateOfBirth: '',
        placeOfBirth: '',
        nationality: '',
        country: '',
        occupation: '',
        email: '',
        phoneNumber: '',
        bvn: '',
        residentialAddress: '',
        idType: 'passport',
        identificationNumber: '',
        issuingBody: '',
        issuedDate: '',
        sourceOfIncome: 'salary'
      }],
      agreeToDataPrivacy: false,
      signature: '',
      nemBranchOffice: '',
      insured: '',
      officeAddress: '',
      ownershipOfCompany: 'Nigerian',
      contactPerson: '',
      website: '',
      incorporationNumber: '',
      incorporationState: '',
      incorporationDate: '',
      bvn: '',
      contactPersonMobile: '',
      businessType: '',
      estimatedTurnover: 'lessThan10M',
      premiumPaymentSource: 'salary',
      companyVerificationDocument: 'incorporation'
    }
  });

  const { register, handleSubmit, formState: { errors }, setValue, watch, control } = formMethods;
  const watchedValues = watch();

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'directors'
  });
  
  const handleFileSelect = useCallback((field: string, file: File) => {
    setValue(field as any, file);
  }, [setValue]);

  const onSubmit = async (data: CorporateKYCData) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    
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
          <Label htmlFor="nemBranchOffice">NEM Branch Office *</Label>
          <Input {...register('nemBranchOffice')} />
          {errors.nemBranchOffice && <p className="text-sm text-red-600">{errors.nemBranchOffice.message}</p>}
        </div>
        
        <div>
          <Label htmlFor="insured">Insured *</Label>
          <Input {...register('insured')} />
          {errors.insured && <p className="text-sm text-red-600">{errors.insured.message}</p>}
        </div>
        
        <div>
          <Label>Ownership of Company *</Label>
          <Select
            value={watchedValues.ownershipOfCompany}
            onValueChange={(value) => setValue('ownershipOfCompany', value as any)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select ownership" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Nigerian">Nigerian</SelectItem>
              <SelectItem value="Foreign">Foreign</SelectItem>
              <SelectItem value="Both">Both</SelectItem>
            </SelectContent>
          </Select>
          {errors.ownershipOfCompany && <p className="text-sm text-red-600">{errors.ownershipOfCompany.message}</p>}
        </div>
        
        <div>
          <Label htmlFor="contactPerson">Contact Person *</Label>
          <Input {...register('contactPerson')} />
          {errors.contactPerson && <p className="text-sm text-red-600">{errors.contactPerson.message}</p>}
        </div>
        
        <div>
          <Label htmlFor="website">Website *</Label>
          <Input {...register('website')} placeholder="https://..." />
          {errors.website && <p className="text-sm text-red-600">{errors.website.message}</p>}
        </div>
        
        <div>
          <Label htmlFor="incorporationNumber">Incorporation Number *</Label>
          <Input {...register('incorporationNumber')} />
          {errors.incorporationNumber && <p className="text-sm text-red-600">{errors.incorporationNumber.message}</p>}
        </div>
        
        <div>
          <Label htmlFor="incorporationState">Incorporation State *</Label>
          <Input {...register('incorporationState')} />
          {errors.incorporationState && <p className="text-sm text-red-600">{errors.incorporationState.message}</p>}
        </div>
        
        <DatePickerField
          label="Date of Incorporation/Registration"
          name="incorporationDate"
          required
          formMethods={formMethods}
          error={errors.incorporationDate?.message}
        />
        
        <div>
          <Label htmlFor="bvn">BVN *</Label>
          <Input {...register('bvn')} placeholder="11 digits" />
          {errors.bvn && <p className="text-sm text-red-600">{errors.bvn.message}</p>}
        </div>
        
        <div>
          <PhoneInput
            label="Contact Person Mobile Number"
            required
            value={watchedValues.contactPersonMobile || ''}
            onChange={(value) => setValue('contactPersonMobile', value)}
            error={errors.contactPersonMobile?.message}
          />
        </div>
        
        <div>
          <Label htmlFor="taxId">Tax Identification Number</Label>
          <Input {...register('taxId')} />
        </div>
        
        <div>
          <Label htmlFor="email">Email Address *</Label>
          <Input type="email" {...register('email')} />
          {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
        </div>
        
        <div>
          <Label htmlFor="businessType">Business Type/Occupation *</Label>
          <Input {...register('businessType')} />
          {errors.businessType && <p className="text-sm text-red-600">{errors.businessType.message}</p>}
        </div>
        
        <div>
          <Label>Estimated Turnover *</Label>
          <Select
            value={watchedValues.estimatedTurnover}
            onValueChange={(value) => setValue('estimatedTurnover', value as any)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select turnover range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="lessThan10M">Less Than 10 Million</SelectItem>
              <SelectItem value="11M-50M">11 Million - 50 Million</SelectItem>
              <SelectItem value="51M-200M">51 Million - 200 Million</SelectItem>
              <SelectItem value="moreThan200M">More Than 200 Million</SelectItem>
            </SelectContent>
          </Select>
          {errors.estimatedTurnover && <p className="text-sm text-red-600">{errors.estimatedTurnover.message}</p>}
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
          <Label htmlFor="officeAddress">Office Address *</Label>
          <Textarea {...register('officeAddress')} />
          {errors.officeAddress && <p className="text-sm text-red-600">{errors.officeAddress.message}</p>}
        </div>
      </div>
    </FormSection>
  );

  const DirectorsStep = () => (
    <FormSection title="Director Information" icon={<Users className="h-5 w-5" />}>
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
                <Label>First Name *</Label>
                <Input {...register(`directors.${index}.firstName`)} />
                {errors.directors?.[index]?.firstName && (
                  <p className="text-sm text-red-600">{errors.directors[index]?.firstName?.message}</p>
                )}
              </div>
              
              <div>
                <Label>Middle Name</Label>
                <Input {...register(`directors.${index}.middleName`)} />
              </div>
              
              <div>
                <Label>Last Name *</Label>
                <Input {...register(`directors.${index}.lastName`)} />
                {errors.directors?.[index]?.lastName && (
                  <p className="text-sm text-red-600">{errors.directors[index]?.lastName?.message}</p>
                )}
              </div>
              
              <DatePickerField
                label="Date of Birth"
                name={`directors.${index}.dateOfBirth`}
                required
                formMethods={formMethods}
                error={errors.directors?.[index]?.dateOfBirth?.message}
              />
              
              <div>
                <Label>Place of Birth *</Label>
                <Input {...register(`directors.${index}.placeOfBirth`)} />
                {errors.directors?.[index]?.placeOfBirth && (
                  <p className="text-sm text-red-600">{errors.directors[index]?.placeOfBirth?.message}</p>
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
                <Label>Country *</Label>
                <Input {...register(`directors.${index}.country`)} />
                {errors.directors?.[index]?.country && (
                  <p className="text-sm text-red-600">{errors.directors[index]?.country?.message}</p>
                )}
              </div>
              
              <div>
                <Label>Occupation *</Label>
                <Input {...register(`directors.${index}.occupation`)} />
                {errors.directors?.[index]?.occupation && (
                  <p className="text-sm text-red-600">{errors.directors[index]?.occupation?.message}</p>
                )}
              </div>
              
              <div>
                <Label>Email *</Label>
                <Input type="email" {...register(`directors.${index}.email`)} />
                {errors.directors?.[index]?.email && (
                  <p className="text-sm text-red-600">{errors.directors[index]?.email?.message}</p>
                )}
              </div>
              
              <div>
                <PhoneInput
                  label="Phone Number"
                  required
                  value={watchedValues.directors?.[index]?.phoneNumber || ''}
                  onChange={(value) => setValue(`directors.${index}.phoneNumber`, value)}
                  error={errors.directors?.[index]?.phoneNumber?.message}
                />
              </div>
              
              <div>
                <Label>BVN *</Label>
                <Input {...register(`directors.${index}.bvn`)} placeholder="11 digits" />
                {errors.directors?.[index]?.bvn && (
                  <p className="text-sm text-red-600">{errors.directors[index]?.bvn?.message}</p>
                )}
              </div>
              
              <div>
                <Label>Employer's Name</Label>
                <Input {...register(`directors.${index}.employersName`)} />
              </div>
              
              <div>
                <PhoneInput
                  label="Employer's Phone Number"
                  value={watchedValues.directors?.[index]?.employersPhone || ''}
                  onChange={(value) => setValue(`directors.${index}.employersPhone`, value)}
                />
              </div>
              
              <div>
                <Label>Tax ID Number</Label>
                <Input {...register(`directors.${index}.taxIdNumber`)} />
              </div>
              
              <div>
                <Label>ID Type *</Label>
                <Select
                  value={watchedValues.directors?.[index]?.idType || 'passport'}
                  onValueChange={(value) => setValue(`directors.${index}.idType`, value as any)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose ID type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="passport">International Passport</SelectItem>
                    <SelectItem value="nimc">NIMC</SelectItem>
                    <SelectItem value="driversLicense">Drivers Licence</SelectItem>
                    <SelectItem value="votersCard">Voters Card</SelectItem>
                  </SelectContent>
                </Select>
                {errors.directors?.[index]?.idType && (
                  <p className="text-sm text-red-600">{errors.directors[index]?.idType?.message}</p>
                )}
              </div>
              
              <div>
                <Label>Identification Number *</Label>
                <Input {...register(`directors.${index}.identificationNumber`)} />
                {errors.directors?.[index]?.identificationNumber && (
                  <p className="text-sm text-red-600">{errors.directors[index]?.identificationNumber?.message}</p>
                )}
              </div>
              
              <div>
                <Label>Issuing Body *</Label>
                <Input {...register(`directors.${index}.issuingBody`)} />
                {errors.directors?.[index]?.issuingBody && (
                  <p className="text-sm text-red-600">{errors.directors[index]?.issuingBody?.message}</p>
                )}
              </div>
              
              <DatePickerField
                label="Issued Date"
                name={`directors.${index}.issuedDate`}
                required
                formMethods={formMethods}
                error={errors.directors?.[index]?.issuedDate?.message}
              />
              
              <DatePickerField
                label="Expiry Date"
                name={`directors.${index}.expiryDate`}
                formMethods={formMethods}
                error={errors.directors?.[index]?.expiryDate?.message}
              />
              
              <div>
                <Label>Source of Income *</Label>
                <Select
                  value={watchedValues.directors?.[index]?.sourceOfIncome || 'salary'}
                  onValueChange={(value) => setValue(`directors.${index}.sourceOfIncome`, value as any)}
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
                {errors.directors?.[index]?.sourceOfIncome && (
                  <p className="text-sm text-red-600">{errors.directors[index]?.sourceOfIncome?.message}</p>
                )}
              </div>
              
              {watchedValues.directors?.[index]?.sourceOfIncome === 'other' && (
                <div>
                  <Label>Please specify other source *</Label>
                  <Input {...register(`directors.${index}.sourceOfIncomeOther`)} />
                  {errors.directors?.[index]?.sourceOfIncomeOther && (
                    <p className="text-sm text-red-600">{errors.directors[index]?.sourceOfIncomeOther?.message}</p>
                  )}
                </div>
              )}
              
              <div className="md:col-span-2">
                <Label>Residential Address *</Label>
                <Textarea {...register(`directors.${index}.residentialAddress`)} />
                {errors.directors?.[index]?.residentialAddress && (
                  <p className="text-sm text-red-600">{errors.directors[index]?.residentialAddress?.message}</p>
                )}
              </div>
            </div>
          </div>
        ))}
        
        <Button
          type="button"
          variant="outline"
          onClick={() => append({
            firstName: '',
            middleName: '',
            lastName: '',
            dateOfBirth: '',
            placeOfBirth: '',
            nationality: '',
            country: '',
            occupation: '',
            email: '',
            phoneNumber: '',
            bvn: '',
            residentialAddress: '',
            idType: 'passport',
            identificationNumber: '',
            issuingBody: '',
            issuedDate: '',
            sourceOfIncome: 'salary'
          })}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Director
        </Button>
      </div>
    </FormSection>
  );

  const AccountVerificationStep = () => (
    <FormSection title="Account Details & Verification Upload" icon={<Upload className="h-5 w-5" />}>
      <div className="space-y-6">
        <div>
          <Label>Company Name Verification Document *</Label>
          <Select
            value={watchedValues.companyVerificationDocument}
            onValueChange={(value) => setValue('companyVerificationDocument', value as any)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select verification document" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="incorporation">Certificate of Incorporation or Business Registration</SelectItem>
              <SelectItem value="cacStatus">CAC Status Report</SelectItem>
              <SelectItem value="boardResolution">Board Resolution</SelectItem>
              <SelectItem value="powerOfAttorney">Power of Attorney</SelectItem>
            </SelectContent>
          </Select>
          {errors.companyVerificationDocument && <p className="text-sm text-red-600">{errors.companyVerificationDocument.message}</p>}
        </div>
        
        <FileUpload
          label="Upload Your Verification Document"
          required
          onFileSelect={(file) => handleFileSelect('verificationDocumentUpload', file)}
          currentFile={watchedValues.verificationDocumentUpload}
          accept=".jpg,.jpeg,.png,.pdf"
          error={errors.verificationDocumentUpload?.message}
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
      id: 'company',
      title: 'Company Information',
      component: <CompanyInfoStep />,
      isValid: !errors.nemBranchOffice && !errors.insured && !errors.officeAddress && !errors.ownershipOfCompany && !errors.contactPerson && !errors.website && !errors.incorporationNumber && !errors.incorporationState && !errors.incorporationDate && !errors.bvn && !errors.contactPersonMobile && !errors.email && !errors.businessType && !errors.estimatedTurnover && !errors.premiumPaymentSource
    },
    {
      id: 'directors',
      title: 'Director Information',
      component: <DirectorsStep />,
      isValid: !errors.directors
    },
    {
      id: 'verification',
      title: 'Account Details & Verification',
      component: <AccountVerificationStep />,
      isValid: !errors.companyVerificationDocument && !errors.verificationDocumentUpload
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
          <h1 className="text-3xl font-bold text-gray-900">Corporate KYC Application</h1>
          <p className="text-gray-600 mt-2">Please provide complete company information for verification</p>
        </div>

        <MultiStepForm
          steps={steps}
          onSubmit={onSubmit}
          isSubmitting={isSubmitting}
          submitButtonText="Submit Corporate KYC"
          formMethods={formMethods}
        />

        <AuthRequiredSubmit
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onProceedToSignup={() => {
            window.location.href = '/signup';
          }}
          formType="Corporate KYC"
        />
      </div>
    </div>
  );
};

export default CorporateKYC;