import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useAuth } from '../../contexts/AuthContext';
import { corporateCDDSchema } from '../../utils/validation';
import { CorporateCDDData } from '../../types';
import { useFormDraft } from '../../hooks/useFormDraft';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Checkbox } from '../../components/ui/checkbox';
import { toast } from '../../components/ui/use-toast';
import FormSection from '../../components/common/FormSection';
import FileUpload from '../../components/common/FileUpload';
import PhoneInput from '../../components/common/PhoneInput';
import MultiStepForm from '../../components/common/MultiStepForm';
import AuthRequiredSubmit from '../../components/common/AuthRequiredSubmit';
import { Building2, Users, CreditCard, Upload, Plus, Trash2 } from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { notifySubmission } from '../../services/notificationService';

const CorporateCDD: React.FC = () => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  const { register, handleSubmit, formState: { errors }, setValue, watch, control } = useForm<CorporateCDDData>({
    resolver: yupResolver(corporateCDDSchema),
    defaultValues: {
      email: user?.email || '',
      agreeToDataPrivacy: false,
      signature: '',
      directors: [{ 
        firstName: '', middleName: '', lastName: '', dateOfBirth: '', placeOfBirth: '',
        nationality: '', country: '', occupation: '', email: '', phoneNumber: '', bvn: '',
        employerName: '', employerPhone: '', residentialAddress: '', taxIdNumber: '',
        idType: '', identificationNumber: '', issuingBody: '', issuedDate: '', expiryDate: '',
        incomeSource: '', incomeSourceOther: ''
      }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'directors'
  });

  const watchedValues = watch();
  const { saveDraft } = useFormDraft('corporate-cdd', { setValue, watch });

  // Auto-save draft
  React.useEffect(() => {
    const subscription = watch((data) => {
      saveDraft(data);
    });
    return () => subscription.unsubscribe();
  }, [watch, saveDraft]);

  const onSubmit = async (data: CorporateCDDData) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    
    setIsSubmitting(true);
    try {
      const submissionId = `cdd_corporate_${Date.now()}`;
      
      await setDoc(doc(db, 'submissions', submissionId), {
        id: submissionId,
        userId: user.uid,
        formType: 'corporate-cdd',
        data: data,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      await notifySubmission(user, 'Corporate CDD');
      
      toast({
        title: "CDD Form Submitted",
        description: "Your Corporate CDD form has been submitted successfully.",
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

  const CompanyInfoStep = () => (
    <FormSection title="Company Information" icon={<Building2 className="h-5 w-5" />}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="companyName">Company Name *</Label>
          <Input {...register('companyName')} />
          {errors.companyName && <p className="text-sm text-red-600">{errors.companyName.message}</p>}
        </div>
        
        <div>
          <Label htmlFor="incorporationNumber">Incorporation Number *</Label>
          <Input {...register('incorporationNumber')} />
          {errors.incorporationNumber && <p className="text-sm text-red-600">{errors.incorporationNumber.message}</p>}
        </div>
        
        <div className="md:col-span-2">
          <Label htmlFor="registeredAddress">Registered Company Address *</Label>
          <Textarea {...register('registeredAddress')} />
          {errors.registeredAddress && <p className="text-sm text-red-600">{errors.registeredAddress.message}</p>}
        </div>
        
        <div>
          <Label htmlFor="incorporationState">Incorporation State *</Label>
          <Input {...register('incorporationState')} />
          {errors.incorporationState && <p className="text-sm text-red-600">{errors.incorporationState.message}</p>}
        </div>
        
        <div>
          <Label htmlFor="incorporationDate">Date of Incorporation *</Label>
          <Input type="date" {...register('incorporationDate')} />
          {errors.incorporationDate && <p className="text-sm text-red-600">{errors.incorporationDate.message}</p>}
        </div>
        
        <div className="md:col-span-2">
          <Label htmlFor="businessNature">Nature of Business *</Label>
          <Textarea {...register('businessNature')} />
          {errors.businessNature && <p className="text-sm text-red-600">{errors.businessNature.message}</p>}
        </div>
        
        <div>
          <Label>Company Type *</Label>
          <Select
            value={watchedValues.companyType}
            onValueChange={(value) => setValue('companyType', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Choose Company Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sole-proprietor">Sole Proprietor</SelectItem>
              <SelectItem value="unlimited-liability">Unlimited Liability Company</SelectItem>
              <SelectItem value="limited-liability">Limited Liability Company</SelectItem>
              <SelectItem value="public-limited">Public Limited Company</SelectItem>
              <SelectItem value="joint-venture">Joint Venture</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
          {errors.companyType && <p className="text-sm text-red-600">{errors.companyType.message}</p>}
        </div>
        
        {watchedValues.companyType === 'other' && (
          <div>
            <Label htmlFor="companyTypeOther">Please specify *</Label>
            <Input {...register('companyTypeOther')} />
            {errors.companyTypeOther && <p className="text-sm text-red-600">{errors.companyTypeOther.message}</p>}
          </div>
        )}
        
        <div>
          <Label htmlFor="email">Email Address *</Label>
          <Input type="email" {...register('email')} />
          {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
        </div>
        
        <div>
          <Label htmlFor="website">Website *</Label>
          <Input {...register('website')} />
          {errors.website && <p className="text-sm text-red-600">{errors.website.message}</p>}
        </div>
        
        <div>
          <Label htmlFor="taxId">Tax Identification Number</Label>
          <Input {...register('taxId')} />
          {errors.taxId && <p className="text-sm text-red-600">{errors.taxId.message}</p>}
        </div>
        
        <div>
          <PhoneInput
            label="Telephone Number"
            required
            value={watchedValues.telephone || ''}
            onChange={(value) => setValue('telephone', value)}
            error={errors.telephone?.message}
          />
        </div>
      </div>
    </FormSection>
  );

  const DirectorsStep = () => (
    <FormSection title="Directors Information" icon={<Users className="h-5 w-5" />}>
      <div className="space-y-6">
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
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              
              <div>
                <Label>Date of Birth *</Label>
                <Input type="date" {...register(`directors.${index}.dateOfBirth`)} />
                {errors.directors?.[index]?.dateOfBirth && (
                  <p className="text-sm text-red-600">{errors.directors[index]?.dateOfBirth?.message}</p>
                )}
              </div>
              
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
                <Label>Phone Number *</Label>
                <Input {...register(`directors.${index}.phoneNumber`)} />
                {errors.directors?.[index]?.phoneNumber && (
                  <p className="text-sm text-red-600">{errors.directors[index]?.phoneNumber?.message}</p>
                )}
              </div>
              
              <div>
                <Label>BVN *</Label>
                <Input {...register(`directors.${index}.bvn`)} maxLength={11} />
                {errors.directors?.[index]?.bvn && (
                  <p className="text-sm text-red-600">{errors.directors[index]?.bvn?.message}</p>
                )}
              </div>
              
              <div>
                <Label>Employer's Name</Label>
                <Input {...register(`directors.${index}.employerName`)} />
              </div>
              
              <div className="md:col-span-3">
                <Label>Residential Address *</Label>
                <Textarea {...register(`directors.${index}.residentialAddress`)} />
                {errors.directors?.[index]?.residentialAddress && (
                  <p className="text-sm text-red-600">{errors.directors[index]?.residentialAddress?.message}</p>
                )}
              </div>
              
              <div>
                <Label>ID Type *</Label>
                <Select
                  value={watchedValues.directors?.[index]?.idType}
                  onValueChange={(value) => setValue(`directors.${index}.idType`, value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose Identification Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="international-passport">International Passport</SelectItem>
                    <SelectItem value="nimc">NIMC</SelectItem>
                    <SelectItem value="drivers-licence">Driver's Licence</SelectItem>
                    <SelectItem value="voters-card">Voters Card</SelectItem>
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
              
              <div>
                <Label>Issued Date *</Label>
                <Input type="date" {...register(`directors.${index}.issuedDate`)} />
                {errors.directors?.[index]?.issuedDate && (
                  <p className="text-sm text-red-600">{errors.directors[index]?.issuedDate?.message}</p>
                )}
              </div>
              
              <div>
                <Label>Expiry Date</Label>
                <Input type="date" {...register(`directors.${index}.expiryDate`)} />
              </div>
              
              <div>
                <Label>Source of Income *</Label>
                <Select
                  value={watchedValues.directors?.[index]?.incomeSource}
                  onValueChange={(value) => setValue(`directors.${index}.incomeSource`, value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose Income Source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="salary-business">Salary or Business Income</SelectItem>
                    <SelectItem value="investments">Investments or Dividends</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {errors.directors?.[index]?.incomeSource && (
                  <p className="text-sm text-red-600">{errors.directors[index]?.incomeSource?.message}</p>
                )}
              </div>
              
              {watchedValues.directors?.[index]?.incomeSource === 'other' && (
                <div>
                  <Label>Please specify *</Label>
                  <Input {...register(`directors.${index}.incomeSourceOther`)} />
                </div>
              )}
            </div>
          </div>
        ))}
        
        <Button
          type="button"
          variant="outline"
          onClick={() => append({ 
            firstName: '', middleName: '', lastName: '', dateOfBirth: '', placeOfBirth: '',
            nationality: '', country: '', occupation: '', email: '', phoneNumber: '', bvn: '',
            employerName: '', employerPhone: '', residentialAddress: '', taxIdNumber: '',
            idType: '', identificationNumber: '', issuingBody: '', issuedDate: '', expiryDate: '',
            incomeSource: '', incomeSourceOther: ''
          })}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Director
        </Button>
      </div>
    </FormSection>
  );

  const AccountDetailsStep = () => (
    <FormSection title="Account Details" icon={<CreditCard className="h-5 w-5" />}>
      <div className="space-y-6">
        <div>
          <h4 className="font-medium mb-4">Local Account Details</h4>
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
            
            <div>
              <Label htmlFor="localAccountOpeningDate">Account Opening Date *</Label>
              <Input type="date" {...register('localAccountOpeningDate')} />
              {errors.localAccountOpeningDate && <p className="text-sm text-red-600">{errors.localAccountOpeningDate.message}</p>}
            </div>
          </div>
        </div>
        
        <div>
          <h4 className="font-medium mb-4">Foreign Account Details (Optional)</h4>
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
            
            <div>
              <Label htmlFor="foreignAccountOpeningDate">Account Opening Date</Label>
              <Input type="date" {...register('foreignAccountOpeningDate')} />
            </div>
          </div>
        </div>
      </div>
    </FormSection>
  );

  const DocumentsStep = () => (
    <FormSection title="Document Upload" icon={<Upload className="h-5 w-5" />}>
      <div className="space-y-6">
        <FileUpload
          label="Upload Your CAC Certificate"
          required
          onFileSelect={(file) => setValue('cacCertificate', file)}
          currentFile={watchedValues.cacCertificate}
          error={errors.cacCertificate?.message}
        />
        
        <FileUpload
          label="Upload Means of Identification"
          required
          onFileSelect={(file) => setValue('identificationMeans', file)}
          currentFile={watchedValues.identificationMeans}
          error={errors.identificationMeans?.message}
        />
      </div>
    </FormSection>
  );

  const DataPrivacyStep = () => (
    <FormSection title="Data Privacy & Declaration" icon={<Building2 className="h-5 w-5" />}>
      <div className="space-y-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium mb-4">Data Privacy</h4>
          <div className="space-y-2 text-sm">
            <p>i. Your data will solemnly be used for the purposes of this business contract and also to enable us reach you with the updates about our products and services.</p>
            <p>ii. Please note that your personal data will be treated with utmost respect and is well secured as required by Nigeria Data Protection Regulations 2019.</p>
            <p>iii. Your personal data shall not be shared with or sold to any third-party without your consent unless we are compelled by law or regulator.</p>
          </div>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium mb-4">Declaration</h4>
          <div className="space-y-2 text-sm">
            <p>1. I/We declare to the best of my/our knowledge and belief that the information given on this form is true in every respect and agree that if I/we have made any false or fraudulent statement, be it suppression or concealment, the policy shall be cancelled and the claim shall be forfeited.</p>
            <p>2. I/We agree to provide additional information to NEM Insurance, if required.</p>
            <p>3. I/We agree to submit all required and requested for documents and NEM Insurance shall not be held responsible for any delay in settlement of claim due to non-fulfillment of requirements.</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="agreeToDataPrivacy"
            checked={watchedValues.agreeToDataPrivacy}
            onCheckedChange={(checked) => setValue('agreeToDataPrivacy', checked as boolean)}
          />
          <Label htmlFor="agreeToDataPrivacy">I agree to the data privacy policy and declaration *</Label>
        </div>
        {errors.agreeToDataPrivacy && <p className="text-sm text-red-600">{errors.agreeToDataPrivacy.message}</p>}
        
        <div>
          <Label htmlFor="signature">Digital Signature *</Label>
          <Input {...register('signature')} placeholder="Type your full name as signature" />
          {errors.signature && <p className="text-sm text-red-600">{errors.signature.message}</p>}
        </div>
        
        <div>
          <Label>Date</Label>
          <Input type="date" value={new Date().toISOString().split('T')[0]} readOnly />
        </div>
      </div>
    </FormSection>
  );

  const steps = [
    {
      id: 'company-info',
      title: 'Company Information',
      component: <CompanyInfoStep />,
      isValid: !errors.companyName && !errors.incorporationNumber && !errors.registeredAddress
    },
    {
      id: 'directors',
      title: 'Directors Information',
      component: <DirectorsStep />,
      isValid: !errors.directors
    },
    {
      id: 'account-details',
      title: 'Account Details',
      component: <AccountDetailsStep />,
      isValid: !errors.localBankName && !errors.localAccountNumber
    },
    {
      id: 'documents',
      title: 'Document Upload',
      component: <DocumentsStep />,
      isValid: !errors.cacCertificate && !errors.identificationMeans
    },
    {
      id: 'privacy-declaration',
      title: 'Data Privacy & Declaration',
      component: <DataPrivacyStep />,
      isValid: watchedValues.agreeToDataPrivacy && watchedValues.signature
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Corporate CDD</h1>
          <p className="text-gray-600 mt-2">Complete Customer Due Diligence for corporate entities</p>
        </div>

        <MultiStepForm
          steps={steps}
          onSubmit={handleSubmit(onSubmit)}
          isSubmitting={isSubmitting}
          submitButtonText="Submit Corporate CDD"
        />

        <AuthRequiredSubmit
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onProceedToSignup={() => {
            // Save form data and redirect to signup
            saveDraft(watchedValues);
            window.location.href = '/signup';
          }}
          formType="Corporate CDD"
        />
      </div>
    </div>
  );
};

export default CorporateCDD;
