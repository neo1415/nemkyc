import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';
import MultiStepForm from '../../components/common/MultiStepForm';
import FormSection from '../../components/common/FormSection';
import PhoneInput from '../../components/common/PhoneInput';
import { useToast } from '../../hooks/use-toast';
import { useFormDraft } from '../../hooks/useFormDraft';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { RadioGroup, RadioGroupItem } from '../../components/ui/radio-group';
import { Label } from '../../components/ui/label';
import { Checkbox } from '../../components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { uploadFile } from '@/services/fileService';
import { useAuthRequiredSubmit } from '@/hooks/useAuthRequiredSubmit';
import SuccessModal from '@/components/common/SuccessModal';
import { Loader2 } from 'lucide-react';

const contractorsSchema = yup.object().shape({
  policyNumber: yup.string().required('Policy number is required'),
  periodOfCoverFrom: yup.date().required('Period start date is required'),
  periodOfCoverTo: yup.date().required('Period end date is required'),
  nameOfInsured: yup.string().required('Name is required'),
  companyName: yup.string(),
  title: yup.string().required('Title is required'),
  dateOfBirth: yup.date().required('Date of birth is required'),
  gender: yup.string().required('Gender is required'),
  address: yup.string().required('Address is required'),
  phone: yup.string().required('Phone is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  
  // Plant/Machinery Details
  plantItems: yup.array().of(yup.object().shape({
    itemNumber: yup.string().required('Item number is required'),
    yearOfManufacture: yup.string().required('Year of manufacture is required'),
    make: yup.string().required('Make is required'),
    registrationNumber: yup.string(),
    dateOfPurchase: yup.date().required('Date of purchase is required'),
    costPrice: yup.number().required('Cost price is required'),
    depreciation: yup.number(),
    sumClaimed: yup.number().required('Sum claimed is required'),
    valueType: yup.string().oneOf(['Repairs', 'Present Value']).required('Value type is required')
  })).min(1, 'At least one plant/machinery item is required'),
  
  // Loss/Damage Details
  lossDateTime: yup.string().required('Loss date/time is required'),
  lastIntact: yup.string().required('When last intact is required'),
  incidentLocation: yup.string().required('Location of incident is required'),
  damageDescription: yup.string().required('Damage description is required'),
  inspectionLocation: yup.string().required('Inspection location is required'),
  circumstances: yup.string().required('Circumstances are required'),
  suspicionInfo: yup.string(),
  
  // Witnesses
  witnesses: yup.array().of(yup.object().shape({
    name: yup.string().required('Witness name is required'),
    address: yup.string().required('Witness address is required'),
    phone: yup.string().required('Witness phone is required')
  })),
  
  // Theft/Third Party
  policeNotified: yup.string().oneOf(['yes', 'no']).required('Police notification status is required'),
  policeStation: yup.string(),
  otherActions: yup.string(),
  soleOwner: yup.string().oneOf(['yes', 'no']).required('Sole owner status is required'),
  soleOwnerDetails: yup.string(),
  otherInsurance: yup.string().oneOf(['yes', 'no']).required('Other insurance status is required'),
  otherInsuranceDetails: yup.string(),
  thirdPartyInvolved: yup.string().oneOf(['yes', 'no']).required('Third party involvement is required'),
  thirdPartyName: yup.string(),
  thirdPartyAddress: yup.string(),
  thirdPartyInsurer: yup.string(),
  
  declarationAccepted: yup.boolean().oneOf([true], 'Declaration required'),
  signature: yup.string().required('Signature required'),
  signatureDate: yup.date().required('Signature date required')
});

type ContractorsData = yup.InferType<typeof contractorsSchema>;

const defaultValues: Partial<ContractorsData> = {
  signatureDate: new Date(),
  policeNotified: 'no',
  soleOwner: 'yes',
  otherInsurance: 'no',
  thirdPartyInvolved: 'no',
  plantItems: [{
    itemNumber: '',
    yearOfManufacture: '',
    make: '',
    registrationNumber: '',
    dateOfPurchase: new Date(),
    costPrice: 0,
    depreciation: 0,
    sumClaimed: 0,
    valueType: 'Repairs'
  }],
  witnesses: []
};

const ContractorsPlantMachineryClaim: React.FC = () => {
  const { toast } = useToast();
  const [showSummary, setShowSummary] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPostAuthLoading, setShowPostAuthLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File>>({});
  const { 
    handleSubmitWithAuth, 
    showSuccess: authShowSuccess, 
    setShowSuccess: setAuthShowSuccess,
    isSubmitting: authSubmitting
  } = useAuthRequiredSubmit();

  // Check for pending submission when component mounts
  useEffect(() => {
    const checkPendingSubmission = () => {
      const hasPending = sessionStorage.getItem('pendingSubmission');
      if (hasPending) {
        setShowPostAuthLoading(true);
        // Hide loading after 5 seconds max (in case something goes wrong)
        setTimeout(() => setShowPostAuthLoading(false), 5000);
      }
    };

    checkPendingSubmission();
  }, []);

  // Hide post-auth loading when success modal shows
  useEffect(() => {
    if (authShowSuccess) {
      setShowPostAuthLoading(false);
    }
  }, [authShowSuccess]);

  const formMethods = useForm<Partial<ContractorsData>>({
    defaultValues,
    mode: 'onChange'
  });

  const { watch, setValue } = formMethods;
  const { saveDraft, clearDraft } = useFormDraft('contractors-claim', formMethods);
  const { fields: plantFields, append: appendPlant, remove: removePlant } = useFieldArray({
    control: formMethods.control,
    name: 'plantItems'
  });
  const { fields: witnessFields, append: appendWitness, remove: removeWitness } = useFieldArray({
    control: formMethods.control,
    name: 'witnesses'
  });
  
  const watchedValues = watch();

  useEffect(() => {
    const subscription = watch((value) => {
      saveDraft(value);
    });
    return () => subscription.unsubscribe();
  }, [watch, saveDraft]);

  const cleanData = (data: any) => {
    const cleaned = Object.entries(data).reduce((acc, [key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        acc[key] = value;
      }
      return acc;
    }, {} as any);
    return cleaned;
  };

  // Main submit handler that checks authentication
  const handleFormSubmit = async (data: ContractorsData) => {
    // Prepare file upload data
    const fileUploadPromises: Array<Promise<[string, string]>> = [];
    
    for (const [key, file] of Object.entries(uploadedFiles)) {
      if (file) {
        fileUploadPromises.push(
          uploadFile(file, `contractors-claims/${Date.now()}-${file.name}`).then(url => [key, url])
        );
      }
    }

    const fileResults = await Promise.all(fileUploadPromises);
    const fileUrls = Object.fromEntries(fileResults);

    const finalData = {
      ...data,
      ...fileUrls,
      status: 'processing',
      formType: 'Contractors Plant & Machinery Claim'
    };

    await handleSubmitWithAuth(finalData, 'Contractors Plant & Machinery Claim');
    clearDraft();
    setShowSummary(false);
  };

  const onFinalSubmit = (data: ContractorsData) => {
    setShowSummary(true);
  };

  const steps = [
    {
      id: 'policy',
      title: 'Policy Details',
      component: (
        <FormSection title="Policy Information" description="Enter your policy details">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="policyNumber">Policy Number *</Label>
              <Input
                {...formMethods.register('policyNumber')}
                placeholder="Enter policy number"
              />
              {formMethods.formState.errors.policyNumber && (
                <p className="text-sm text-red-600 mt-1">
                  {formMethods.formState.errors.policyNumber.message}
                </p>
              )}
            </div>
            
            <div>
              <Label htmlFor="periodOfCoverFrom">Period of Cover From *</Label>
              <Input
                type="date"
                {...formMethods.register('periodOfCoverFrom')}
              />
              {formMethods.formState.errors.periodOfCoverFrom && (
                <p className="text-sm text-red-600 mt-1">
                  {formMethods.formState.errors.periodOfCoverFrom.message}
                </p>
              )}
            </div>
            
            <div>
              <Label htmlFor="periodOfCoverTo">Period of Cover To *</Label>
              <Input
                type="date"
                {...formMethods.register('periodOfCoverTo')}
              />
              {formMethods.formState.errors.periodOfCoverTo && (
                <p className="text-sm text-red-600 mt-1">
                  {formMethods.formState.errors.periodOfCoverTo.message}
                </p>
              )}
            </div>
          </div>
        </FormSection>
      )
    },
    {
      id: 'insured',
      title: 'Insured Details',
      component: (
        <FormSection title="Insured Information" description="Enter the insured party details">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="nameOfInsured">Name of Insured *</Label>
              <Input
                {...formMethods.register('nameOfInsured')}
                placeholder="Enter full name"
              />
              {formMethods.formState.errors.nameOfInsured && (
                <p className="text-sm text-red-600 mt-1">
                  {formMethods.formState.errors.nameOfInsured.message}
                </p>
              )}
            </div>
            
            <div>
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                {...formMethods.register('companyName')}
                placeholder="Enter company name (optional)"
              />
            </div>
            
            <div>
              <Label htmlFor="title">Title *</Label>
              <Select onValueChange={(value) => setValue('title', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select title" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mr">Mr</SelectItem>
                  <SelectItem value="mrs">Mrs</SelectItem>
                  <SelectItem value="ms">Ms</SelectItem>
                  <SelectItem value="dr">Dr</SelectItem>
                  <SelectItem value="chief">Chief</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              {formMethods.formState.errors.title && (
                <p className="text-sm text-red-600 mt-1">
                  {formMethods.formState.errors.title.message}
                </p>
              )}
            </div>
            
            <div>
              <Label htmlFor="dateOfBirth">Date of Birth *</Label>
              <Input
                type="date"
                {...formMethods.register('dateOfBirth')}
              />
              {formMethods.formState.errors.dateOfBirth && (
                <p className="text-sm text-red-600 mt-1">
                  {formMethods.formState.errors.dateOfBirth.message}
                </p>
              )}
            </div>
            
            <div>
              <Label htmlFor="gender">Gender *</Label>
              <Select onValueChange={(value) => setValue('gender', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              {formMethods.formState.errors.gender && (
                <p className="text-sm text-red-600 mt-1">
                  {formMethods.formState.errors.gender.message}
                </p>
              )}
            </div>
            
            <div className="md:col-span-2">
              <Label htmlFor="address">Address *</Label>
              <Textarea
                {...formMethods.register('address')}
                placeholder="Enter full address"
                rows={3}
              />
              {formMethods.formState.errors.address && (
                <p className="text-sm text-red-600 mt-1">
                  {formMethods.formState.errors.address.message}
                </p>
              )}
            </div>
            
            <div>
              <PhoneInput
                label="Phone Number *"
                value={watchedValues.phone || ''}
                onChange={(value) => setValue('phone', value)}
                error={formMethods.formState.errors.phone?.message}
              />
            </div>
            
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                type="email"
                {...formMethods.register('email')}
                placeholder="Enter email address"
              />
              {formMethods.formState.errors.email && (
                <p className="text-sm text-red-600 mt-1">
                  {formMethods.formState.errors.email.message}
                </p>
              )}
            </div>
          </div>
        </FormSection>
      )
    },
    {
      id: 'plant-machinery',
      title: 'Plant/Machinery Details',
      component: (
        <FormSection title="Plant/Machinery Information" description="Provide details about the plant/machinery">
          <div className="space-y-6">
            {plantFields.map((field, index) => (
              <Card key={field.id} className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-lg font-semibold">Item {index + 1}</h4>
                  {plantFields.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removePlant(index)}
                    >
                      Remove
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Item Number *</Label>
                    <Input {...formMethods.register(`plantItems.${index}.itemNumber`)} />
                  </div>
                  <div>
                    <Label>Year of Manufacture *</Label>
                    <Input {...formMethods.register(`plantItems.${index}.yearOfManufacture`)} />
                  </div>
                  <div>
                    <Label>Make *</Label>
                    <Input {...formMethods.register(`plantItems.${index}.make`)} />
                  </div>
                  <div>
                    <Label>Registration Number</Label>
                    <Input {...formMethods.register(`plantItems.${index}.registrationNumber`)} />
                  </div>
                  <div>
                    <Label>Date of Purchase *</Label>
                    <Input type="date" {...formMethods.register(`plantItems.${index}.dateOfPurchase`)} />
                  </div>
                  <div>
                    <Label>Cost Price *</Label>
                    <Input type="number" step="0.01" {...formMethods.register(`plantItems.${index}.costPrice`)} />
                  </div>
                  <div>
                    <Label>Depreciation</Label>
                    <Input type="number" step="0.01" {...formMethods.register(`plantItems.${index}.depreciation`)} />
                  </div>
                  <div>
                    <Label>Sum Claimed *</Label>
                    <Input type="number" step="0.01" {...formMethods.register(`plantItems.${index}.sumClaimed`)} />
                  </div>
                  <div>
                    <Label>Value Type *</Label>
                    <Select onValueChange={(value: 'Repairs' | 'Present Value') => setValue(`plantItems.${index}.valueType`, value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select value type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Repairs">Repairs</SelectItem>
                        <SelectItem value="Present Value">Present Value</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </Card>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={() => appendPlant({
                itemNumber: '',
                yearOfManufacture: '',
                make: '',
                registrationNumber: '',
                dateOfPurchase: new Date(),
                costPrice: 0,
                depreciation: 0,
                sumClaimed: 0,
                valueType: 'Repairs'
              })}
            >
              Add Another Item
            </Button>
          </div>
        </FormSection>
      )
    },
    {
      id: 'loss-details',
      title: 'Loss/Damage Details',
      component: (
        <FormSection title="Loss/Damage Information" description="Provide details about the loss or damage">
          <div className="space-y-4">
            <div>
              <Label>Loss Date/Time *</Label>
              <Input type="datetime-local" {...formMethods.register('lossDateTime')} />
            </div>
            <div>
              <Label>When was it last seen intact? *</Label>
              <Textarea {...formMethods.register('lastIntact')} rows={3} />
            </div>
            <div>
              <Label>Location of Incident *</Label>
              <Textarea {...formMethods.register('incidentLocation')} rows={3} />
            </div>
            <div>
              <Label>Description of Damage *</Label>
              <Textarea {...formMethods.register('damageDescription')} rows={4} />
            </div>
            <div>
              <Label>Where can it be inspected? *</Label>
              <Textarea {...formMethods.register('inspectionLocation')} rows={3} />
            </div>
            <div>
              <Label>Circumstances *</Label>
              <Textarea {...formMethods.register('circumstances')} rows={4} />
            </div>
            <div>
              <Label>Any suspicion or other information</Label>
              <Textarea {...formMethods.register('suspicionInfo')} rows={3} />
            </div>
          </div>
        </FormSection>
      )
    },
    {
      id: 'witnesses',
      title: 'Witnesses',
      component: (
        <FormSection title="Witness Information" description="Provide details of any witnesses">
          <div className="space-y-6">
            {witnessFields.map((field, index) => (
              <Card key={field.id} className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-lg font-semibold">Witness {index + 1}</h4>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeWitness(index)}
                  >
                    Remove
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Name *</Label>
                    <Input {...formMethods.register(`witnesses.${index}.name`)} />
                  </div>
                  <div>
                    <Label>Phone *</Label>
                    <Input {...formMethods.register(`witnesses.${index}.phone`)} />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Address *</Label>
                    <Textarea {...formMethods.register(`witnesses.${index}.address`)} rows={3} />
                  </div>
                </div>
              </Card>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={() => appendWitness({ name: '', address: '', phone: '' })}
            >
              Add Witness
            </Button>
          </div>
        </FormSection>
      )
    },
    {
      id: 'theft-third-party',
      title: 'Theft / Third Party',
      component: (
        <FormSection title="Theft / Third Party Information" description="Additional information about theft and third parties">
          <div className="space-y-4">
            <div>
              <Label>Have police been informed? *</Label>
              <RadioGroup
                value={watchedValues.policeNotified}
                onValueChange={(value: 'yes' | 'no') => setValue('policeNotified', value)}
                className="flex space-x-4 mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="police-yes" />
                  <Label htmlFor="police-yes">Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="police-no" />
                  <Label htmlFor="police-no">No</Label>
                </div>
              </RadioGroup>
            </div>
            
            {watchedValues.policeNotified === 'yes' && (
              <div>
                <Label>Police Station & Details</Label>
                <Textarea {...formMethods.register('policeStation')} rows={3} />
              </div>
            )}
            
            <div>
              <Label>Other actions taken</Label>
              <Textarea {...formMethods.register('otherActions')} rows={3} />
            </div>
            
            <div>
              <Label>Are you the sole owner? *</Label>
              <RadioGroup
                value={watchedValues.soleOwner}
                onValueChange={(value: 'yes' | 'no') => setValue('soleOwner', value)}
                className="flex space-x-4 mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="sole-yes" />
                  <Label htmlFor="sole-yes">Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="sole-no" />
                  <Label htmlFor="sole-no">No</Label>
                </div>
              </RadioGroup>
            </div>
            
            {watchedValues.soleOwner === 'no' && (
              <div>
                <Label>Please provide details</Label>
                <Textarea {...formMethods.register('soleOwnerDetails')} rows={3} />
              </div>
            )}
            
            <div>
              <Label>Any other insurance on this property? *</Label>
              <RadioGroup
                value={watchedValues.otherInsurance}
                onValueChange={(value: 'yes' | 'no') => setValue('otherInsurance', value)}
                className="flex space-x-4 mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="insurance-yes" />
                  <Label htmlFor="insurance-yes">Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="insurance-no" />
                  <Label htmlFor="insurance-no">No</Label>
                </div>
              </RadioGroup>
            </div>
            
            {watchedValues.otherInsurance === 'yes' && (
              <div>
                <Label>Please provide details</Label>
                <Textarea {...formMethods.register('otherInsuranceDetails')} rows={3} />
              </div>
            )}
            
            <div>
              <Label>Is a third party involved? *</Label>
              <RadioGroup
                value={watchedValues.thirdPartyInvolved}
                onValueChange={(value: 'yes' | 'no') => setValue('thirdPartyInvolved', value)}
                className="flex space-x-4 mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="third-party-yes" />
                  <Label htmlFor="third-party-yes">Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="third-party-no" />
                  <Label htmlFor="third-party-no">No</Label>
                </div>
              </RadioGroup>
            </div>
            
            {watchedValues.thirdPartyInvolved === 'yes' && (
              <div className="space-y-4">
                <div>
                  <Label>Third Party Name</Label>
                  <Input {...formMethods.register('thirdPartyName')} />
                </div>
                <div>
                  <Label>Third Party Address</Label>
                  <Textarea {...formMethods.register('thirdPartyAddress')} rows={3} />
                </div>
                <div>
                  <Label>Third Party Insurer</Label>
                  <Input {...formMethods.register('thirdPartyInsurer')} />
                </div>
              </div>
            )}
          </div>
        </FormSection>
      )
    },
    {
      id: 'declaration',
      title: 'Declaration',
      component: (
        <FormSection title="Data Privacy & Declaration">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Data Privacy</h3>
              <div className="text-sm text-gray-600 space-y-2">
                <p>i. Your data will solemnly be used for the purposes of this business contract and also to enable us reach you with the updates about our products and services.</p>
                <p>ii. Please note that your personal data will be treated with utmost respect and is well secured as required by Nigeria Data Protection Regulations 2019.</p>
                <p>iii. Your personal data shall not be shared with or sold to any third-party without your consent unless we are compelled by law or regulator.</p>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-2">Declaration</h3>
              <div className="text-sm text-gray-600 space-y-2">
                <p>1. I/We declare to the best of my/our knowledge and belief that the information given on this form is true in every respect and agree that if I/we have made any false or fraudulent statement, be it suppression or concealment, the policy shall be cancelled and the claim shall be forfeited.</p>
                <p>2. I/We agree to provide additional information to NEM Insurance, if required.</p>
                <p>3. I/We agree to submit all required and requested for documents and NEM Insurance shall not be held responsible for any delay in settlement of claim due to non-fulfillment of requirements.</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="declaration"
                  checked={watchedValues.declarationAccepted}
                  onCheckedChange={(checked: boolean) => setValue('declarationAccepted', checked)}
                />
                <Label htmlFor="declaration" className="text-sm">
                  I agree to the data privacy policy and declaration above *
                </Label>
              </div>
              {formMethods.formState.errors.declarationAccepted && (
                <p className="text-sm text-red-600">
                  {formMethods.formState.errors.declarationAccepted.message}
                </p>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="signature">Digital Signature *</Label>
                  <Input
                    {...formMethods.register('signature')}
                    placeholder="Type your full name as signature"
                  />
                  {formMethods.formState.errors.signature && (
                    <p className="text-sm text-red-600 mt-1">
                      {formMethods.formState.errors.signature.message}
                    </p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="signatureDate">Date *</Label>
                  <Input
                    type="date"
                    {...formMethods.register('signatureDate')}
                  />
                  {formMethods.formState.errors.signatureDate && (
                    <p className="text-sm text-red-600 mt-1">
                      {formMethods.formState.errors.signatureDate.message}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </FormSection>
      )
    }
  ];

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <CardTitle className="text-green-600">Claim Submitted Successfully!</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">
              Your contractors plant & machinery claim has been submitted successfully. 
              You will receive a confirmation email shortly.
            </p>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">For claim status and inquiries:</h4>
              <p className="text-sm">Email: claims@neminsurance.com</p>
              <p className="text-sm">Phone: +234 1 234 5678</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Contractors Plant & Machinery Claim Form</h1>
          <p className="text-gray-600 mt-2">Submit your claim for contractors plant and machinery</p>
        </div>

        <MultiStepForm
          steps={steps}
          onSubmit={onFinalSubmit}
          formMethods={formMethods}
        />

        <Dialog open={showSummary} onOpenChange={setShowSummary}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Review Your Claim</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold">Policy Information</h3>
                <p>Policy Number: {watchedValues.policyNumber}</p>
                <p>Period: {watchedValues.periodOfCoverFrom?.toString()} to {watchedValues.periodOfCoverTo?.toString()}</p>
              </div>
              
              <div>
                <h3 className="font-semibold">Insured Details</h3>
                <p>Name: {watchedValues.nameOfInsured}</p>
                <p>Email: {watchedValues.email}</p>
                <p>Phone: {watchedValues.phone}</p>
              </div>
              
              <div>
                <h3 className="font-semibold">Plant/Machinery Details</h3>
                <p>Items: {watchedValues.plantItems?.length || 0} item(s)</p>
              </div>
              
              <div className="flex space-x-4">
                <Button variant="outline" onClick={() => setShowSummary(false)}>
                  Edit Details
                </Button>
                <Button onClick={() => handleFormSubmit(watchedValues)} disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Claim'
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        
        {/* Success Modal */}
        <SuccessModal
          isOpen={showSuccess || authShowSuccess || authSubmitting}
          onClose={() => {
            setShowSuccess(false);
            setAuthShowSuccess();
          }}
          title="Contractors Plant & Machinery Claim Submitted!"
          formType="Contractors Plant & Machinery Claim"
          isLoading={authSubmitting}
          loadingMessage="Your contractors plant & machinery claim is being processed and submitted..."
        />
      </div>

      {/* Post-Authentication Loading Overlay */}
      {showPostAuthLoading && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-card p-8 rounded-lg shadow-lg animate-scale-in max-w-md mx-4">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
              <h3 className="text-xl font-semibold text-primary">Processing Your Submission</h3>
              <p className="text-muted-foreground">
                Thank you for signing in! Your contractors plant & machinery claim is now being submitted...
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContractorsPlantMachineryClaim;
