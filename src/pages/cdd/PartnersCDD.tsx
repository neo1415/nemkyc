
import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { partnersCDDSchema } from '../../utils/validation';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Trash2, Plus, Building, User, CreditCard, Upload, FileText } from 'lucide-react';
import { toast } from '../../components/ui/use-toast';
import FileUpload from '../../components/common/FileUpload';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { ScrollArea } from '../../components/ui/scroll-area';
import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../firebase/config';
import { sendSubmissionConfirmation } from '../../services/emailService';
import { useAuth } from '../../contexts/AuthContext';

interface PartnersCDDData {
  companyName: string;
  registeredAddress: string;
  city: string;
  state: string;
  country: string;
  email: string;
  website: string;
  contactPersonName: string;
  contactPersonNumber: string;
  taxId?: string;
  vatRegistrationNumber: string;
  incorporationNumber: string;
  incorporationDate: string;
  incorporationState: string;
  businessNature: string;
  bvn: string;
  directors: Array<{
    title: string;
    gender: string;
    firstName: string;
    middleName?: string;
    lastName: string;
    residentialAddress: string;
    position: string;
    dateOfBirth: string;
    placeOfBirth: string;
    occupation: string;
    bvn: string;
    taxIdNumber?: string;
    passportNumber: string;
    passportIssuedCountry: string;
    incomeSource: string;
    incomeSourceOther?: string;
    nationality: string;
    phoneNumber: string;
    email: string;
    idType: string;
    identificationNumber: string;
    issuedDate: string;
    expiryDate: string;
    issuingBody: string;
  }>;
  localAccountNumber: string;
  localBankName: string;
  localBankBranch: string;
  localAccountOpeningDate: string;
  foreignAccountNumber?: string;
  foreignBankName?: string;
  foreignBankBranch?: string;
  foreignAccountOpeningDate?: string;
  certificateOfIncorporation?: File;
  directorId1?: File;
  directorId2?: File;
  cacStatusReport?: File;
  vatRegistrationLicense?: File;
  taxClearanceCertificate?: File;
  signature: string;
}

const PartnersCDD: React.FC = () => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [showSummary, setShowSummary] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<PartnersCDDData>({
    resolver: yupResolver(partnersCDDSchema),
    defaultValues: {
      directors: [{
        title: '',
        gender: '',
        firstName: '',
        lastName: '',
        residentialAddress: '',
        position: '',
        dateOfBirth: '',
        placeOfBirth: '',
        occupation: '',
        bvn: '',
        passportNumber: '',
        passportIssuedCountry: '',
        incomeSource: '',
        nationality: '',
        phoneNumber: '',
        email: '',
        idType: '',
        identificationNumber: '',
        issuedDate: '',
        expiryDate: '',
        issuingBody: ''
      }],
      signature: ''
    },
    mode: 'onChange'
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'directors'
  });

  const steps = [
    { title: 'Company Info', icon: Building },
    { title: 'Directors Info', icon: User },
    { title: 'Account Details', icon: CreditCard },
    { title: 'Uploads', icon: Upload },
    { title: 'Data Privacy & Declaration', icon: FileText }
  ];

  const watchedValues = form.watch();

  useEffect(() => {
    const subscription = form.watch((data) => {
      localStorage.setItem('partners-cdd-draft', JSON.stringify({
        ...data,
        timestamp: Date.now()
      }));
    });
    return () => subscription.unsubscribe();
  }, [form]);

  useEffect(() => {
    const saved = localStorage.getItem('partners-cdd-draft');
    if (saved) {
      const { timestamp, ...data } = JSON.parse(saved);
      if (Date.now() - timestamp < 7 * 24 * 60 * 60 * 1000) {
        Object.keys(data).forEach(key => {
          if (data[key] !== undefined) {
            form.setValue(key as any, data[key]);
          }
        });
      }
    }
  }, [form]);

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const onSubmit = async (data: PartnersCDDData) => {
    if (currentStep < steps.length - 1) {
      nextStep();
      return;
    }

    setShowSummary(true);
  };

  const handleFinalSubmit = async () => {
    if (!user) return;
    
    setIsSubmitting(true);
    try {
      const formData = form.getValues();
      const fileUrls: Record<string, string> = {};

      // Upload files
      const fileFields = ['certificateOfIncorporation', 'directorId1', 'directorId2', 'cacStatusReport', 'vatRegistrationLicense', 'taxClearanceCertificate'];
      for (const fileField of fileFields) {
        const file = formData[fileField as keyof PartnersCDDData] as File;
        if (file) {
          const storageRef = ref(storage, `partners-cdd/${user.uid}/${fileField}-${Date.now()}`);
          const snapshot = await uploadBytes(storageRef, file);
          fileUrls[fileField] = await getDownloadURL(snapshot.ref);
        }
      }

      const submissionData = {
        ...formData,
        fileUrls,
        userId: user.uid,
        userEmail: user.email,
        submittedAt: new Date(),
        status: 'pending'
      };

      await addDoc(collection(db, 'partners-cdd-submissions'), submissionData);

      if (user.email) {
        await sendSubmissionConfirmation(user.email, 'Partners CDD');
      }

      localStorage.removeItem('partners-cdd-draft');
      setShowSummary(false);
      setShowSuccess(true);

      toast({
        title: "Form submitted successfully!",
        description: "Your Partners CDD form has been submitted.",
      });
    } catch (error) {
      console.error('Submission error:', error);
      toast({
        title: "Submission failed",
        description: "Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Company Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="companyName">Company Name *</Label>
                  <Input
                    id="companyName"
                    {...form.register('companyName')}
                    placeholder="Enter company name"
                  />
                  {form.formState.errors.companyName && (
                    <p className="text-red-500 text-sm">{form.formState.errors.companyName.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    {...form.register('city')}
                    placeholder="Enter city"
                  />
                  {form.formState.errors.city && (
                    <p className="text-red-500 text-sm">{form.formState.errors.city.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="state">State *</Label>
                  <Input
                    id="state"
                    {...form.register('state')}
                    placeholder="Enter state"
                  />
                  {form.formState.errors.state && (
                    <p className="text-red-500 text-sm">{form.formState.errors.state.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="country">Country *</Label>
                  <Input
                    id="country"
                    {...form.register('country')}
                    placeholder="Enter country"
                  />
                  {form.formState.errors.country && (
                    <p className="text-red-500 text-sm">{form.formState.errors.country.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    {...form.register('email')}
                    placeholder="Enter email address"
                  />
                  {form.formState.errors.email && (
                    <p className="text-red-500 text-sm">{form.formState.errors.email.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="website">Website *</Label>
                  <Input
                    id="website"
                    {...form.register('website')}
                    placeholder="Enter website URL"
                  />
                  {form.formState.errors.website && (
                    <p className="text-red-500 text-sm">{form.formState.errors.website.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="contactPersonName">Contact Person Name *</Label>
                  <Input
                    id="contactPersonName"
                    {...form.register('contactPersonName')}
                    placeholder="Enter contact person name"
                  />
                  {form.formState.errors.contactPersonName && (
                    <p className="text-red-500 text-sm">{form.formState.errors.contactPersonName.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="contactPersonNumber">Contact Person Number *</Label>
                  <Input
                    id="contactPersonNumber"
                    type="tel"
                    {...form.register('contactPersonNumber')}
                    placeholder="Enter contact person number"
                  />
                  {form.formState.errors.contactPersonNumber && (
                    <p className="text-red-500 text-sm">{form.formState.errors.contactPersonNumber.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="taxId">Tax Identification Number</Label>
                  <Input
                    id="taxId"
                    {...form.register('taxId')}
                    placeholder="Enter tax ID"
                  />
                </div>

                <div>
                  <Label htmlFor="vatRegistrationNumber">VAT Registration Number *</Label>
                  <Input
                    id="vatRegistrationNumber"
                    {...form.register('vatRegistrationNumber')}
                    placeholder="Enter VAT registration number"
                  />
                  {form.formState.errors.vatRegistrationNumber && (
                    <p className="text-red-500 text-sm">{form.formState.errors.vatRegistrationNumber.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="incorporationNumber">Incorporation/RC Number *</Label>
                  <Input
                    id="incorporationNumber"
                    {...form.register('incorporationNumber')}
                    placeholder="Enter incorporation number"
                  />
                  {form.formState.errors.incorporationNumber && (
                    <p className="text-red-500 text-sm">{form.formState.errors.incorporationNumber.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="incorporationDate">Date of Incorporation/Registration *</Label>
                  <Input
                    id="incorporationDate"
                    type="date"
                    {...form.register('incorporationDate')}
                  />
                  {form.formState.errors.incorporationDate && (
                    <p className="text-red-500 text-sm">{form.formState.errors.incorporationDate.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="incorporationState">Incorporation State *</Label>
                  <Input
                    id="incorporationState"
                    {...form.register('incorporationState')}
                    placeholder="Enter incorporation state"
                  />
                  {form.formState.errors.incorporationState && (
                    <p className="text-red-500 text-sm">{form.formState.errors.incorporationState.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="bvn">BVN *</Label>
                  <Input
                    id="bvn"
                    {...form.register('bvn')}
                    placeholder="Enter 11-digit BVN"
                    maxLength={11}
                  />
                  {form.formState.errors.bvn && (
                    <p className="text-red-500 text-sm">{form.formState.errors.bvn.message}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="registeredAddress">Registered Company Address *</Label>
                <Textarea
                  id="registeredAddress"
                  {...form.register('registeredAddress')}
                  placeholder="Enter registered address"
                  rows={3}
                />
                {form.formState.errors.registeredAddress && (
                  <p className="text-red-500 text-sm">{form.formState.errors.registeredAddress.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="businessNature">Nature of Business *</Label>
                <Textarea
                  id="businessNature"
                  {...form.register('businessNature')}
                  placeholder="Describe nature of business"
                  rows={3}
                />
                {form.formState.errors.businessNature && (
                  <p className="text-red-500 text-sm">{form.formState.errors.businessNature.message}</p>
                )}
              </div>
            </CardContent>
          </Card>
        );

      case 1:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 justify-between">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Directors Info
                </div>
                <Button
                  type="button"
                  onClick={() => append({
                    title: '',
                    gender: '',
                    firstName: '',
                    lastName: '',
                    residentialAddress: '',
                    position: '',
                    dateOfBirth: '',
                    placeOfBirth: '',
                    occupation: '',
                    bvn: '',
                    passportNumber: '',
                    passportIssuedCountry: '',
                    incomeSource: '',
                    nationality: '',
                    phoneNumber: '',
                    email: '',
                    idType: '',
                    identificationNumber: '',
                    issuedDate: '',
                    expiryDate: '',
                    issuingBody: ''
                  })}
                  className="flex items-center gap-1"
                >
                  <Plus className="h-4 w-4" />
                  Add Director
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {fields.map((field, index) => (
                <div key={field.id} className="border p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-semibold">Director {index + 1}</h4>
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => remove(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor={`directors.${index}.title`}>Title *</Label>
                      <Input
                        {...form.register(`directors.${index}.title`)}
                        placeholder="Enter title"
                      />
                      {form.formState.errors.directors?.[index]?.title && (
                        <p className="text-red-500 text-sm">{form.formState.errors.directors[index]?.title?.message}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor={`directors.${index}.gender`}>Gender *</Label>
                      <Select onValueChange={(value) => form.setValue(`directors.${index}.gender`, value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                        </SelectContent>
                      </Select>
                      {form.formState.errors.directors?.[index]?.gender && (
                        <p className="text-red-500 text-sm">{form.formState.errors.directors[index]?.gender?.message}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor={`directors.${index}.firstName`}>First Name *</Label>
                      <Input
                        {...form.register(`directors.${index}.firstName`)}
                        placeholder="Enter first name"
                      />
                      {form.formState.errors.directors?.[index]?.firstName && (
                        <p className="text-red-500 text-sm">{form.formState.errors.directors[index]?.firstName?.message}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor={`directors.${index}.middleName`}>Middle Name</Label>
                      <Input
                        {...form.register(`directors.${index}.middleName`)}
                        placeholder="Enter middle name"
                      />
                    </div>

                    <div>
                      <Label htmlFor={`directors.${index}.lastName`}>Last Name *</Label>
                      <Input
                        {...form.register(`directors.${index}.lastName`)}
                        placeholder="Enter last name"
                      />
                      {form.formState.errors.directors?.[index]?.lastName && (
                        <p className="text-red-500 text-sm">{form.formState.errors.directors[index]?.lastName?.message}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor={`directors.${index}.position`}>Position *</Label>
                      <Input
                        {...form.register(`directors.${index}.position`)}
                        placeholder="Enter position"
                      />
                      {form.formState.errors.directors?.[index]?.position && (
                        <p className="text-red-500 text-sm">{form.formState.errors.directors[index]?.position?.message}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor={`directors.${index}.dateOfBirth`}>Date of Birth *</Label>
                      <Input
                        type="date"
                        {...form.register(`directors.${index}.dateOfBirth`)}
                      />
                      {form.formState.errors.directors?.[index]?.dateOfBirth && (
                        <p className="text-red-500 text-sm">{form.formState.errors.directors[index]?.dateOfBirth?.message}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor={`directors.${index}.placeOfBirth`}>Place of Birth *</Label>
                      <Input
                        {...form.register(`directors.${index}.placeOfBirth`)}
                        placeholder="Enter place of birth"
                      />
                      {form.formState.errors.directors?.[index]?.placeOfBirth && (
                        <p className="text-red-500 text-sm">{form.formState.errors.directors[index]?.placeOfBirth?.message}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor={`directors.${index}.occupation`}>Occupation *</Label>
                      <Input
                        {...form.register(`directors.${index}.occupation`)}
                        placeholder="Enter occupation"
                      />
                      {form.formState.errors.directors?.[index]?.occupation && (
                        <p className="text-red-500 text-sm">{form.formState.errors.directors[index]?.occupation?.message}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor={`directors.${index}.bvn`}>BVN *</Label>
                      <Input
                        {...form.register(`directors.${index}.bvn`)}
                        placeholder="Enter 11-digit BVN"
                        maxLength={11}
                      />
                      {form.formState.errors.directors?.[index]?.bvn && (
                        <p className="text-red-500 text-sm">{form.formState.errors.directors[index]?.bvn?.message}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor={`directors.${index}.taxIdNumber`}>Tax ID Number</Label>
                      <Input
                        {...form.register(`directors.${index}.taxIdNumber`)}
                        placeholder="Enter tax ID"
                      />
                    </div>

                    <div>
                      <Label htmlFor={`directors.${index}.passportNumber`}>International Passport Number *</Label>
                      <Input
                        {...form.register(`directors.${index}.passportNumber`)}
                        placeholder="Enter passport number"
                      />
                      {form.formState.errors.directors?.[index]?.passportNumber && (
                        <p className="text-red-500 text-sm">{form.formState.errors.directors[index]?.passportNumber?.message}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor={`directors.${index}.passportIssuedCountry`}>Passport Issued Country *</Label>
                      <Input
                        {...form.register(`directors.${index}.passportIssuedCountry`)}
                        placeholder="Enter issuing country"
                      />
                      {form.formState.errors.directors?.[index]?.passportIssuedCountry && (
                        <p className="text-red-500 text-sm">{form.formState.errors.directors[index]?.passportIssuedCountry?.message}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor={`directors.${index}.nationality`}>Nationality *</Label>
                      <Input
                        {...form.register(`directors.${index}.nationality`)}
                        placeholder="Enter nationality"
                      />
                      {form.formState.errors.directors?.[index]?.nationality && (
                        <p className="text-red-500 text-sm">{form.formState.errors.directors[index]?.nationality?.message}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor={`directors.${index}.phoneNumber`}>Phone Number *</Label>
                      <Input
                        type="tel"
                        {...form.register(`directors.${index}.phoneNumber`)}
                        placeholder="Enter phone number"
                      />
                      {form.formState.errors.directors?.[index]?.phoneNumber && (
                        <p className="text-red-500 text-sm">{form.formState.errors.directors[index]?.phoneNumber?.message}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor={`directors.${index}.email`}>Email *</Label>
                      <Input
                        type="email"
                        {...form.register(`directors.${index}.email`)}
                        placeholder="Enter email"
                      />
                      {form.formState.errors.directors?.[index]?.email && (
                        <p className="text-red-500 text-sm">{form.formState.errors.directors[index]?.email?.message}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor={`directors.${index}.idType`}>ID Type *</Label>
                      <Select onValueChange={(value) => form.setValue(`directors.${index}.idType`, value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose Identification Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="international-passport">International Passport</SelectItem>
                          <SelectItem value="nimc">NIMC</SelectItem>
                          <SelectItem value="drivers-licence">Drivers Licence</SelectItem>
                          <SelectItem value="voters-card">Voters Card</SelectItem>
                        </SelectContent>
                      </Select>
                      {form.formState.errors.directors?.[index]?.idType && (
                        <p className="text-red-500 text-sm">{form.formState.errors.directors[index]?.idType?.message}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor={`directors.${index}.identificationNumber`}>Identification Number *</Label>
                      <Input
                        {...form.register(`directors.${index}.identificationNumber`)}
                        placeholder="Enter identification number"
                      />
                      {form.formState.errors.directors?.[index]?.identificationNumber && (
                        <p className="text-red-500 text-sm">{form.formState.errors.directors[index]?.identificationNumber?.message}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor={`directors.${index}.issuedDate`}>Issued Date *</Label>
                      <Input
                        type="date"
                        {...form.register(`directors.${index}.issuedDate`)}
                      />
                      {form.formState.errors.directors?.[index]?.issuedDate && (
                        <p className="text-red-500 text-sm">{form.formState.errors.directors[index]?.issuedDate?.message}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor={`directors.${index}.expiryDate`}>Expiry Date *</Label>
                      <Input
                        type="date"
                        {...form.register(`directors.${index}.expiryDate`)}
                      />
                      {form.formState.errors.directors?.[index]?.expiryDate && (
                        <p className="text-red-500 text-sm">{form.formState.errors.directors[index]?.expiryDate?.message}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor={`directors.${index}.issuingBody`}>Issuing Body *</Label>
                      <Input
                        {...form.register(`directors.${index}.issuingBody`)}
                        placeholder="Enter issuing body"
                      />
                      {form.formState.errors.directors?.[index]?.issuingBody && (
                        <p className="text-red-500 text-sm">{form.formState.errors.directors[index]?.issuingBody?.message}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor={`directors.${index}.incomeSource`}>Source of Income *</Label>
                      <Select onValueChange={(value) => form.setValue(`directors.${index}.incomeSource`, value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose Income Source" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="salary-business">Salary or Business Income</SelectItem>
                          <SelectItem value="investments">Investments or Dividends</SelectItem>
                          <SelectItem value="other">Other (please specify)</SelectItem>
                        </SelectContent>
                      </Select>
                      {form.formState.errors.directors?.[index]?.incomeSource && (
                        <p className="text-red-500 text-sm">{form.formState.errors.directors[index]?.incomeSource?.message}</p>
                      )}
                    </div>

                    {watchedValues.directors?.[index]?.incomeSource === 'other' && (
                      <div>
                        <Label htmlFor={`directors.${index}.incomeSourceOther`}>Please specify *</Label>
                        <Input
                          {...form.register(`directors.${index}.incomeSourceOther`)}
                          placeholder="Specify income source"
                        />
                      </div>
                    )}
                  </div>

                  <div className="mt-4">
                    <Label htmlFor={`directors.${index}.residentialAddress`}>Residential Address *</Label>
                    <Textarea
                      {...form.register(`directors.${index}.residentialAddress`)}
                      placeholder="Enter residential address"
                      rows={3}
                    />
                    {form.formState.errors.directors?.[index]?.residentialAddress && (
                      <p className="text-red-500 text-sm">{form.formState.errors.directors[index]?.residentialAddress?.message}</p>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        );

      case 2:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Account Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-semibold mb-4">Local Account Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="localAccountNumber">Account Number *</Label>
                    <Input
                      id="localAccountNumber"
                      {...form.register('localAccountNumber')}
                      placeholder="Enter account number"
                    />
                    {form.formState.errors.localAccountNumber && (
                      <p className="text-red-500 text-sm">{form.formState.errors.localAccountNumber.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="localBankName">Bank Name *</Label>
                    <Input
                      id="localBankName"
                      {...form.register('localBankName')}
                      placeholder="Enter bank name"
                    />
                    {form.formState.errors.localBankName && (
                      <p className="text-red-500 text-sm">{form.formState.errors.localBankName.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="localBankBranch">Bank Branch *</Label>
                    <Input
                      id="localBankBranch"
                      {...form.register('localBankBranch')}
                      placeholder="Enter bank branch"
                    />
                    {form.formState.errors.localBankBranch && (
                      <p className="text-red-500 text-sm">{form.formState.errors.localBankBranch.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="localAccountOpeningDate">Account Opening Date *</Label>
                    <Input
                      id="localAccountOpeningDate"
                      type="date"
                      {...form.register('localAccountOpeningDate')}
                    />
                    {form.formState.errors.localAccountOpeningDate && (
                      <p className="text-red-500 text-sm">{form.formState.errors.localAccountOpeningDate.message}</p>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-4">Foreign Account Details (Optional)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="foreignAccountNumber">Account Number</Label>
                    <Input
                      id="foreignAccountNumber"
                      {...form.register('foreignAccountNumber')}
                      placeholder="Enter foreign account number"
                    />
                  </div>

                  <div>
                    <Label htmlFor="foreignBankName">Bank Name</Label>
                    <Input
                      id="foreignBankName"
                      {...form.register('foreignBankName')}
                      placeholder="Enter foreign bank name"
                    />
                  </div>

                  <div>
                    <Label htmlFor="foreignBankBranch">Bank Branch</Label>
                    <Input
                      id="foreignBankBranch"
                      {...form.register('foreignBankBranch')}
                      placeholder="Enter foreign bank branch"
                    />
                  </div>

                  <div>
                    <Label htmlFor="foreignAccountOpeningDate">Account Opening Date</Label>
                    <Input
                      id="foreignAccountOpeningDate"
                      type="date"
                      {...form.register('foreignAccountOpeningDate')}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 3:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload Documents
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <FileUpload
                  label="Certificate of Incorporation"
                  required
                  onFileSelect={(file) => form.setValue('certificateOfIncorporation', file)}
                  currentFile={watchedValues.certificateOfIncorporation}
                  error={form.formState.errors.certificateOfIncorporation?.message}
                />
              </div>

              <div>
                <FileUpload
                  label="Means of Identification for Director 1"
                  required
                  onFileSelect={(file) => form.setValue('directorId1', file)}
                  currentFile={watchedValues.directorId1}
                  error={form.formState.errors.directorId1?.message}
                />
              </div>

              <div>
                <FileUpload
                  label="Means of Identification for Director 2"
                  required
                  onFileSelect={(file) => form.setValue('directorId2', file)}
                  currentFile={watchedValues.directorId2}
                  error={form.formState.errors.directorId2?.message}
                />
              </div>

              <div>
                <FileUpload
                  label="CAC Status Report"
                  required
                  onFileSelect={(file) => form.setValue('cacStatusReport', file)}
                  currentFile={watchedValues.cacStatusReport}
                  error={form.formState.errors.cacStatusReport?.message}
                />
              </div>

              <div>
                <FileUpload
                  label="VAT Registration License"
                  required
                  onFileSelect={(file) => form.setValue('vatRegistrationLicense', file)}
                  currentFile={watchedValues.vatRegistrationLicense}
                  error={form.formState.errors.vatRegistrationLicense?.message}
                />
              </div>

              <div>
                <FileUpload
                  label="Tax Clearance Certificate (within last 3 years)"
                  required
                  onFileSelect={(file) => form.setValue('taxClearanceCertificate', file)}
                  currentFile={watchedValues.taxClearanceCertificate}
                  error={form.formState.errors.taxClearanceCertificate?.message}
                />
              </div>
            </CardContent>
          </Card>
        );

      case 4:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Data Privacy & Declaration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="prose max-w-none">
                <h4 className="font-semibold">Data Privacy</h4>
                <p className="text-sm">
                  i. Your data will solemnly be used for the purposes of this business contract and also to enable us reach you with the updates about our products and services.<br/>
                  ii. Please note that your personal data will be treated with utmost respect and is well secured as required by Nigeria Data Protection Regulations 2019.<br/>
                  iii. Your personal data shall not be shared with or sold to any third-party without your consent unless we are compelled by law or regulator.
                </p>

                <h4 className="font-semibold mt-4">Declaration</h4>
                <p className="text-sm">
                  1. I/We declare to the best of my/our knowledge and belief that the information given on this form is true in every respect and agree that if I/we have made any false or fraudulent statement, be it suppression or concealment, the policy shall be cancelled and the claim shall be forfeited.<br/>
                  2. I/We agree to provide additional information to NEM Insurance, if required.<br/>
                  3. I/We agree to submit all required and requested for documents and NEM Insurance shall not be held responsible for any delay in settlement of claim due to non-fulfillment of requirements.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="signature">Digital Signature *</Label>
                  <Input
                    id="signature"
                    {...form.register('signature')}
                    placeholder="Type your full name as signature"
                  />
                  {form.formState.errors.signature && (
                    <p className="text-red-500 text-sm">{form.formState.errors.signature.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={new Date().toISOString().split('T')[0]}
                    readOnly
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Partners CDD</h1>
          <div className="flex items-center justify-between">
            <p className="text-gray-600">Complete your partners customer due diligence form</p>
            <div className="flex space-x-2">
              {steps.map((step, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                    index === currentStep
                      ? 'bg-red-900 text-white'
                      : index < currentStep
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {index + 1}
                </div>
              ))}
            </div>
          </div>
          <div className="mt-2">
            <p className="text-sm text-gray-500">
              Step {currentStep + 1} of {steps.length}: {steps[currentStep]?.title}
            </p>
          </div>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)}>
          {renderStep()}

          <div className="flex justify-between mt-8">
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 0}
            >
              Previous
            </Button>

            <Button type="submit">
              {currentStep === steps.length - 1 ? 'Submit Form' : 'Next'}
            </Button>
          </div>
        </form>

        {/* Summary Dialog */}
        <Dialog open={showSummary} onOpenChange={setShowSummary}>
          <DialogContent className="max-w-4xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>Form Summary - Please Review</DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-4 p-4">
                <div>
                  <h4 className="font-semibold">Company Details</h4>
                  <p>Company Name: {watchedValues.companyName}</p>
                  <p>Incorporation Number: {watchedValues.incorporationNumber}</p>
                  <p>Email: {watchedValues.email}</p>
                </div>
                
                <div>
                  <h4 className="font-semibold">Directors ({watchedValues.directors?.length})</h4>
                  {watchedValues.directors?.map((director, index) => (
                    <p key={index}>
                      {index + 1}. {director.firstName} {director.lastName} - {director.position}
                    </p>
                  ))}
                </div>

                <div>
                  <h4 className="font-semibold">Bank Details</h4>
                  <p>Bank: {watchedValues.localBankName}</p>
                  <p>Account: {watchedValues.localAccountNumber}</p>
                </div>
              </div>
            </ScrollArea>
            <div className="flex justify-end space-x-2 p-4">
              <Button variant="outline" onClick={() => setShowSummary(false)}>
                Edit Form
              </Button>
              <Button onClick={handleFinalSubmit} disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Confirm & Submit'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Success Dialog */}
        <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Form Submitted Successfully! 🎉</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p>Your Partners CDD form has been submitted successfully.</p>
              <p className="text-sm text-gray-600">
                For inquiries about your submission status, please contact us at support@neminsurance.com or call 01 448 9570.
              </p>
              <Button onClick={() => setShowSuccess(false)} className="w-full">
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default PartnersCDD;
