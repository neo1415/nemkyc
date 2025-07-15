import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useAuth } from '../../contexts/AuthContext';
import { partnersCDDSchema } from '../../utils/validation';
import { PartnersCDDData } from '../../types';
import { useFormDraft } from '../../hooks/useFormDraft';
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
import { Building2, Users, CreditCard, Upload, Plus, Trash2 } from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { notifySubmission } from '../../services/notificationService';

const PartnersCDD: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  const formMethods = useForm({
    resolver: yupResolver(partnersCDDSchema),
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
    control: formMethods.control,
    name: 'directors'
  });

  const watchedValues = formMethods.watch();
  const { saveDraft } = useFormDraft('partners-cdd', formMethods);

  // Auto-save draft
  React.useEffect(() => {
    const subscription = formMethods.watch((data) => {
      saveDraft(data);
    });
    return () => subscription.unsubscribe();
  }, [formMethods, saveDraft]);

  const onSubmit = async (data: PartnersCDDData) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    
    setIsSubmitting(true);
    try {
      const submissionId = `cdd_partners_${Date.now()}`;
      
      await setDoc(doc(db, 'submissions', submissionId), {
        id: submissionId,
        userId: user.uid,
        formType: 'partners-cdd',
        data: data,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      await notifySubmission(user, 'Partners CDD');
      
      toast({
        title: "CDD Form Submitted",
        description: "Your Partners CDD form has been submitted successfully.",
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
          <Input {...formMethods.register('companyName')} />
          {formMethods.formState.errors.companyName && <p className="text-sm text-red-600">{formMethods.formState.errors.companyName.message}</p>}
        </div>
        
        <div>
          <Label htmlFor="incorporationNumber">Incorporation Number *</Label>
          <Input {...formMethods.register('incorporationNumber')} />
          {formMethods.formState.errors.incorporationNumber && <p className="text-sm text-red-600">{formMethods.formState.errors.incorporationNumber.message}</p>}
        </div>
        
        <div className="md:col-span-2">
          <Label htmlFor="registeredAddress">Registered Company Address *</Label>
          <Textarea {...formMethods.register('registeredAddress')} />
          {formMethods.formState.errors.registeredAddress && <p className="text-sm text-red-600">{formMethods.formState.errors.registeredAddress.message}</p>}
        </div>
        
        <div>
          <Label htmlFor="city">City *</Label>
          <Input {...formMethods.register('city')} />
          {formMethods.formState.errors.city && <p className="text-sm text-red-600">{formMethods.formState.errors.city.message}</p>}
        </div>
        
        <div>
          <Label htmlFor="state">State *</Label>
          <Input {...formMethods.register('state')} />
          {formMethods.formState.errors.state && <p className="text-sm text-red-600">{formMethods.formState.errors.state.message}</p>}
        </div>
        
        <div>
          <Label htmlFor="country">Country *</Label>
          <Input {...formMethods.register('country')} />
          {formMethods.formState.errors.country && <p className="text-sm text-red-600">{formMethods.formState.errors.country.message}</p>}
        </div>
        
        <div>
          <Label htmlFor="email">Email Address *</Label>
          <Input type="email" {...formMethods.register('email')} />
          {formMethods.formState.errors.email && <p className="text-sm text-red-600">{formMethods.formState.errors.email.message}</p>}
        </div>
        
        <div>
          <Label htmlFor="website">Website *</Label>
          <Input {...formMethods.register('website')} />
          {formMethods.formState.errors.website && <p className="text-sm text-red-600">{formMethods.formState.errors.website.message}</p>}
        </div>
        
        <div>
          <Label htmlFor="contactPersonName">Contact Person Name *</Label>
          <Input {...formMethods.register('contactPersonName')} />
          {formMethods.formState.errors.contactPersonName && <p className="text-sm text-red-600">{formMethods.formState.errors.contactPersonName.message}</p>}
        </div>
        
        <div>
          <PhoneInput
            label="Contact Person Number"
            required
            value={watchedValues.contactPersonNumber || ''}
            onChange={(value) => formMethods.setValue('contactPersonNumber', value)}
            error={formMethods.formState.errors.contactPersonNumber?.message}
          />
        </div>
        
        <div>
          <Label htmlFor="taxId">Tax Identification Number</Label>
          <Input {...formMethods.register('taxId')} />
          {formMethods.formState.errors.taxId && <p className="text-sm text-red-600">{formMethods.formState.errors.taxId.message}</p>}
        </div>
        
        <div>
          <Label htmlFor="vatRegistrationNumber">VAT Registration Number *</Label>
          <Input {...formMethods.register('vatRegistrationNumber')} />
          {formMethods.formState.errors.vatRegistrationNumber && <p className="text-sm text-red-600">{formMethods.formState.errors.vatRegistrationNumber.message}</p>}
        </div>
        
        <div>
          <Label htmlFor="incorporationDate">Date of Incorporation *</Label>
          <Input type="date" {...formMethods.register('incorporationDate')} />
          {formMethods.formState.errors.incorporationDate && <p className="text-sm text-red-600">{formMethods.formState.errors.incorporationDate.message}</p>}
        </div>
        
        <div>
          <Label htmlFor="incorporationState">Incorporation State *</Label>
          <Input {...formMethods.register('incorporationState')} />
          {formMethods.formState.errors.incorporationState && <p className="text-sm text-red-600">{formMethods.formState.errors.incorporationState.message}</p>}
        </div>
        
        <div className="md:col-span-2">
          <Label htmlFor="businessNature">Nature of Business *</Label>
          <Textarea {...formMethods.register('businessNature')} />
          {formMethods.formState.errors.businessNature && <p className="text-sm text-red-600">{formMethods.formState.errors.businessNature.message}</p>}
        </div>
        
        <div>
          <Label htmlFor="bvn">BVN *</Label>
          <Input {...formMethods.register('bvn')} maxLength={11} />
          {formMethods.formState.errors.bvn && <p className="text-sm text-red-600">{formMethods.formState.errors.bvn.message}</p>}
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
                <Input {...formMethods.register(`directors.${index}.firstName`)} />
                {formMethods.formState.errors.directors?.[index]?.firstName && (
                  <p className="text-sm text-red-600">{formMethods.formState.errors.directors[index]?.firstName?.message}</p>
                )}
              </div>
              
              <div>
                <Label>Middle Name</Label>
                <Input {...formMethods.register(`directors.${index}.middleName`)} />
              </div>
              
              <div>
                <Label>Last Name *</Label>
                <Input {...formMethods.register(`directors.${index}.lastName`)} />
                {formMethods.formState.errors.directors?.[index]?.lastName && (
                  <p className="text-sm text-red-600">{formMethods.formState.errors.directors[index]?.lastName?.message}</p>
                )}
              </div>
              
              <div>
                <Label>Date of Birth *</Label>
                <Input type="date" {...formMethods.register(`directors.${index}.dateOfBirth`)} />
                {formMethods.formState.errors.directors?.[index]?.dateOfBirth && (
                  <p className="text-sm text-red-600">{formMethods.formState.errors.directors[index]?.dateOfBirth?.message}</p>
                )}
              </div>
              
              <div>
                <Label>Place of Birth *</Label>
                <Input {...formMethods.register(`directors.${index}.placeOfBirth`)} />
                {formMethods.formState.errors.directors?.[index]?.placeOfBirth && (
                  <p className="text-sm text-red-600">{formMethods.formState.errors.directors[index]?.placeOfBirth?.message}</p>
                )}
              </div>
              
              <div>
                <Label>Nationality *</Label>
                <Input {...formMethods.register(`directors.${index}.nationality`)} />
                {formMethods.formState.errors.directors?.[index]?.nationality && (
                  <p className="text-sm text-red-600">{formMethods.formState.errors.directors[index]?.nationality?.message}</p>
                )}
              </div>
              
              <div>
                <Label>Country *</Label>
                <Input {...formMethods.register(`directors.${index}.country`)} />
                {formMethods.formState.errors.directors?.[index]?.country && (
                  <p className="text-sm text-red-600">{formMethods.formState.errors.directors[index]?.country?.message}</p>
                )}
              </div>
              
              <div>
                <Label>Occupation *</Label>
                <Input {...formMethods.register(`directors.${index}.occupation`)} />
                {formMethods.formState.errors.directors?.[index]?.occupation && (
                  <p className="text-sm text-red-600">{formMethods.formState.errors.directors[index]?.occupation?.message}</p>
                )}
              </div>
              
              <div>
                <Label>Email *</Label>
                <Input type="email" {...formMethods.register(`directors.${index}.email`)} />
                {formMethods.formState.errors.directors?.[index]?.email && (
                  <p className="text-sm text-red-600">{formMethods.formState.errors.directors[index]?.email?.message}</p>
                )}
              </div>
              
              <div>
                <Label>Phone Number *</Label>
                <Input {...formMethods.register(`directors.${index}.phoneNumber`)} />
                {formMethods.formState.errors.directors?.[index]?.phoneNumber && (
                  <p className="text-sm text-red-600">{formMethods.formState.errors.directors[index]?.phoneNumber?.message}</p>
                )}
              </div>
              
              <div>
                <Label>BVN *</Label>
                <Input {...formMethods.register(`directors.${index}.bvn`)} maxLength={11} />
                {formMethods.formState.errors.directors?.[index]?.bvn && (
                  <p className="text-sm text-red-600">{formMethods.formState.errors.directors[index]?.bvn?.message}</p>
                )}
              </div>
              
              <div>
                <Label>Employer's Name</Label>
                <Input {...formMethods.register(`directors.${index}.employerName`)} />
              </div>
              
              <div className="md:col-span-3">
                <Label>Residential Address *</Label>
                <Textarea {...formMethods.register(`directors.${index}.residentialAddress`)} />
                {formMethods.formState.errors.directors?.[index]?.residentialAddress && (
                  <p className="text-sm text-red-600">{formMethods.formState.errors.directors[index]?.residentialAddress?.message}</p>
                )}
              </div>
              
              <div>
                <Label>ID Type *</Label>
                <Select
                  value={watchedValues.directors?.[index]?.idType}
                  onValueChange={(value) => formMethods.setValue(`directors.${index}.idType`, value)}
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
                {formMethods.formState.errors.directors?.[index]?.idType && (
                  <p className="text-sm text-red-600">{formMethods.formState.errors.directors[index]?.idType?.message}</p>
                )}
              </div>
              
              <div>
                <Label>Identification Number *</Label>
                <Input {...formMethods.register(`directors.${index}.identificationNumber`)} />
                {formMethods.formState.errors.directors?.[index]?.identificationNumber && (
                  <p className="text-sm text-red-600">{formMethods.formState.errors.directors[index]?.identificationNumber?.message}</p>
                )}
              </div>
              
              <div>
                <Label>Issuing Body *</Label>
                <Input {...formMethods.register(`directors.${index}.issuingBody`)} />
                {formMethods.formState.errors.directors?.[index]?.issuingBody && (
                  <p className="text-sm text-red-600">{formMethods.formState.errors.directors[index]?.issuingBody?.message}</p>
                )}
              </div>
              
              <div>
                <Label>Issued Date *</Label>
                <Input type="date" {...formMethods.register(`directors.${index}.issuedDate`)} />
                {formMethods.formState.errors.directors?.[index]?.issuedDate && (
                  <p className="text-sm text-red-600">{formMethods.formState.errors.directors[index]?.issuedDate?.message}</p>
                )}
              </div>
              
              <div>
                <Label>Expiry Date</Label>
                <Input type="date" {...formMethods.register(`directors.${index}.expiryDate`)} />
              </div>
              
              <div>
                <Label>Source of Income *</Label>
                <Select
                  value={watchedValues.directors?.[index]?.incomeSource}
                  onValueChange={(value) => formMethods.setValue(`directors.${index}.incomeSource`, value)}
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
                {formMethods.formState.errors.directors?.[index]?.incomeSource && (
                  <p className="text-sm text-red-600">{formMethods.formState.errors.directors[index]?.incomeSource?.message}</p>
                )}
              </div>
              
              {watchedValues.directors?.[index]?.incomeSource === 'other' && (
                <div>
                  <Label>Please specify *</Label>
                  <Input {...formMethods.register(`directors.${index}.incomeSourceOther`)} />
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
              <Input {...formMethods.register('localBankName')} />
              {formMethods.formState.errors.localBankName && <p className="text-sm text-red-600">{formMethods.formState.errors.localBankName.message}</p>}
            </div>
            
            <div>
              <Label htmlFor="localAccountNumber">Account Number *</Label>
              <Input {...formMethods.register('localAccountNumber')} />
              {formMethods.formState.errors.localAccountNumber && <p className="text-sm text-red-600">{formMethods.formState.errors.localAccountNumber.message}</p>}
            </div>
            
            <div>
              <Label htmlFor="localBankBranch">Bank Branch *</Label>
              <Input {...formMethods.register('localBankBranch')} />
              {formMethods.formState.errors.localBankBranch && <p className="text-sm text-red-600">{formMethods.formState.errors.localBankBranch.message}</p>}
            </div>
            
            <div>
              <Label htmlFor="localAccountOpeningDate">Account Opening Date *</Label>
              <Input type="date" {...formMethods.register('localAccountOpeningDate')} />
              {formMethods.formState.errors.localAccountOpeningDate && <p className="text-sm text-red-600">{formMethods.formState.errors.localAccountOpeningDate.message}</p>}
            </div>
          </div>
        </div>
        
        <div>
          <h4 className="font-medium mb-4">Foreign Account Details (Optional)</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="foreignBankName">Bank Name</Label>
              <Input {...formMethods.register('foreignBankName')} />
            </div>
            
            <div>
              <Label htmlFor="foreignAccountNumber">Account Number</Label>
              <Input {...formMethods.register('foreignAccountNumber')} />
            </div>
            
            <div>
              <Label htmlFor="foreignBankBranch">Bank Branch</Label>
              <Input {...formMethods.register('foreignBankBranch')} />
            </div>
            
            <div>
              <Label htmlFor="foreignAccountOpeningDate">Account Opening Date</Label>
              <Input type="date" {...formMethods.register('foreignAccountOpeningDate')} />
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
          label="Certificate of Incorporation"
          required
          onFileSelect={(file) => formMethods.setValue('certificateOfIncorporation', file)}
          currentFile={watchedValues.certificateOfIncorporation as File}
          error={formMethods.formState.errors.certificateOfIncorporation?.message}
        />
        
        <FileUpload
          label="Director ID 1"
          required
          onFileSelect={(file) => formMethods.setValue('directorId1', file)}
          currentFile={watchedValues.directorId1 as File}
          error={formMethods.formState.errors.directorId1?.message}
        />
        
        <FileUpload
          label="Director ID 2"
          required
          onFileSelect={(file) => formMethods.setValue('directorId2', file)}
          currentFile={watchedValues.directorId2 as File}
          error={formMethods.formState.errors.directorId2?.message}
        />
        
        <FileUpload
          label="CAC Status Report"
          required
          onFileSelect={(file) => formMethods.setValue('cacStatusReport', file)}
          currentFile={watchedValues.cacStatusReport as File}
          error={formMethods.formState.errors.cacStatusReport?.message}
        />
        
        <FileUpload
          label="VAT Registration License"
          required
          onFileSelect={(file) => formMethods.setValue('vatRegistrationLicense', file)}
          currentFile={watchedValues.vatRegistrationLicense as File}
          error={formMethods.formState.errors.vatRegistrationLicense?.message}
        />
        
        <FileUpload
          label="Tax Clearance Certificate"
          required
          onFileSelect={(file) => formMethods.setValue('taxClearanceCertificate', file)}
          currentFile={watchedValues.taxClearanceCertificate as File}
          error={formMethods.formState.errors.taxClearanceCertificate?.message}
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
            onCheckedChange={(checked) => formMethods.setValue('agreeToDataPrivacy', checked as boolean)}
          />
          <Label htmlFor="agreeToDataPrivacy">I agree to the data privacy policy and declaration *</Label>
        </div>
        {formMethods.formState.errors.agreeToDataPrivacy && <p className="text-sm text-red-600">{formMethods.formState.errors.agreeToDataPrivacy.message}</p>}
        
        <div>
          <Label htmlFor="signature">Digital Signature *</Label>
          <Input {...formMethods.register('signature')} placeholder="Type your full name as signature" />
          {formMethods.formState.errors.signature && <p className="text-sm text-red-600">{formMethods.formState.errors.signature.message}</p>}
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
      isValid: !formMethods.formState.errors.companyName && !formMethods.formState.errors.incorporationNumber && !formMethods.formState.errors.registeredAddress
    },
    {
      id: 'directors',
      title: 'Directors Information',
      component: <DirectorsStep />,
      isValid: !formMethods.formState.errors.directors
    },
    {
      id: 'account-details',
      title: 'Account Details',
      component: <AccountDetailsStep />,
      isValid: !formMethods.formState.errors.localBankName && !formMethods.formState.errors.localAccountNumber
    },
    {
      id: 'documents',
      title: 'Document Upload',
      component: <DocumentsStep />,
      isValid: !formMethods.formState.errors.certificateOfIncorporation
    },
    {
      id: 'privacy-declaration',
      title: 'Data Privacy & Declaration',
      component: <DataPrivacyStep />,
      isValid: !!watchedValues.agreeToDataPrivacy && !!watchedValues.signature
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Partners CDD</h1>
          <p className="text-gray-600 mt-2">Complete Customer Due Diligence for partners</p>
        </div>

        <MultiStepForm
          steps={steps}
          onSubmit={onSubmit}
          isSubmitting={isSubmitting}
          submitButtonText="Submit Partners CDD"
          formMethods={formMethods}
        />

        <AuthRequiredSubmit
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onProceedToSignup={() => {
            saveDraft(watchedValues);
            window.location.href = '/signup';
          }}
          formType="Partners CDD"
        />
      </div>
    </div>
  );
};

export default PartnersCDD;