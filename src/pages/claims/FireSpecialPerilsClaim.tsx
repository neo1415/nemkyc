import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import MultiStepForm from '@/components/common/MultiStepForm';
import FormSection from '@/components/common/FormSection';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { CheckCircle2, Loader2, Trash2, Plus } from 'lucide-react';
import { useFormDraft } from '@/hooks/useFormDraft';
import { uploadFile } from '@/services/fileService';
import { useAuthRequiredSubmit } from '@/hooks/useAuthRequiredSubmit';
import SuccessModal from '@/components/common/SuccessModal';

interface FireSpecialPerilsClaimData {
  // Policy Details
  policyNumber: string;
  periodOfCoverFrom: string;
  periodOfCoverTo: string;
  
  // Insured Details
  name: string;
  companyName: string;
  title: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  phone: string;
  email: string;
  
  // Loss Details
  premisesAddress: string;
  premisesPhone: string;
  dateOfOccurrence: string;
  timeOfOccurrence: string;
  incidentDescription: string;
  causeOfFire: string;
  
  // Premises Use
  premisesUsedAsPerPolicy: boolean;
  premisesUsageDetails: string;
  purposeOfPremises: string;
  unallowedRiskIntroduced: boolean;
  unallowedRiskDetails: string;
  measuresWhenFireDiscovered: string;
  
  // Property Ownership
  soleOwner: boolean;
  otherOwnersName: string;
  otherOwnersAddress: string;
  
  // Other Insurance
  hasOtherInsurance: boolean;
  otherInsuranceName: string;
  otherInsuranceAddress: string;
  
  // Valuation
  premisesContentsValue: number;
  hasPreviousClaim: boolean;
  previousClaimDate: string;
  previousClaimAmount: number;
  
  // Items Lost/Damaged
  itemsLost: Array<{
    sn: number;
    description: string;
    costPrice: number;
    dateOfPurchase: string;
    estimatedValueAtOccurrence: number;
    valueOfSalvage: number;
    netAmountClaimed: number;
  }>;
  
  // Declaration
  agreeToDataPrivacy: boolean;
  signature: string;
  signatureDate: string;
}

const schema = yup.object().shape({
  policyNumber: yup.string().required('Policy number is required'),
  periodOfCoverFrom: yup.string().required('Period of cover start date is required'),
  periodOfCoverTo: yup.string().required('Period of cover end date is required'),
  name: yup.string().required('Name is required'),
  companyName: yup.string(),
  title: yup.string().required('Title is required'),
  dateOfBirth: yup.string().required('Date of birth is required'),
  gender: yup.string().required('Gender is required'),
  address: yup.string().required('Address is required'),
  phone: yup.string().required('Phone number is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  premisesAddress: yup.string().required('Premises address is required'),
  premisesPhone: yup.string().required('Premises phone is required'),
  dateOfOccurrence: yup.string().required('Date of occurrence is required'),
  timeOfOccurrence: yup.string().required('Time of occurrence is required'),
  incidentDescription: yup.string().required('Incident description is required'),
  causeOfFire: yup.string().required('Cause of fire is required'),
  premisesUsedAsPerPolicy: yup.boolean(),
  premisesUsageDetails: yup.string(),
  purposeOfPremises: yup.string().required('Purpose of premises is required'),
  unallowedRiskIntroduced: yup.boolean(),
  unallowedRiskDetails: yup.string(),
  measuresWhenFireDiscovered: yup.string().required('Measures taken when fire was discovered is required'),
  soleOwner: yup.boolean(),
  otherOwnersName: yup.string(),
  otherOwnersAddress: yup.string(),
  hasOtherInsurance: yup.boolean(),
  otherInsuranceName: yup.string(),
  otherInsuranceAddress: yup.string(),
  premisesContentsValue: yup.number().min(0, 'Value must be positive').required('Premises contents value is required'),
  hasPreviousClaim: yup.boolean(),
  previousClaimDate: yup.string(),
  previousClaimAmount: yup.number().min(0, 'Amount must be positive'),
  itemsLost: yup.array().of(
    yup.object().shape({
      sn: yup.number(),
      description: yup.string().required('Description is required'),
      costPrice: yup.number().min(0, 'Cost price must be positive').required('Cost price is required'),
      dateOfPurchase: yup.string().required('Date of purchase is required'),
      estimatedValueAtOccurrence: yup.number().min(0, 'Estimated value must be positive').required('Estimated value is required'),
      valueOfSalvage: yup.number().min(0, 'Salvage value must be positive'),
      netAmountClaimed: yup.number().min(0, 'Net amount must be positive'),
    })
  ).min(1, 'At least one item must be added'),
  agreeToDataPrivacy: yup.boolean().oneOf([true], 'You must agree to the data privacy notice'),
  signature: yup.string().required('Signature is required'),
  signatureDate: yup.string(),
});

const FireSpecialPerilsClaim: React.FC = () => {
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

  const formMethods = useForm<FireSpecialPerilsClaimData>({
    // resolver: yupResolver(schema as any),
    defaultValues: {
      policyNumber: '',
      periodOfCoverFrom: '',
      periodOfCoverTo: '',
      name: '',
      companyName: '',
      title: '',
      dateOfBirth: '',
      gender: '',
      address: '',
      phone: '',
      email: '',
      premisesAddress: '',
      premisesPhone: '',
      dateOfOccurrence: '',
      timeOfOccurrence: '',
      incidentDescription: '',
      causeOfFire: '',
      premisesUsedAsPerPolicy: true,
      premisesUsageDetails: '',
      purposeOfPremises: '',
      unallowedRiskIntroduced: false,
      unallowedRiskDetails: '',
      measuresWhenFireDiscovered: '',
      soleOwner: true,
      otherOwnersName: '',
      otherOwnersAddress: '',
      hasOtherInsurance: false,
      otherInsuranceName: '',
      otherInsuranceAddress: '',
      premisesContentsValue: 0,
      hasPreviousClaim: false,
      previousClaimDate: '',
      previousClaimAmount: 0,
      itemsLost: [{ 
        sn: 1, 
        description: '', 
        costPrice: 0, 
        dateOfPurchase: '', 
        estimatedValueAtOccurrence: 0, 
        valueOfSalvage: 0, 
        netAmountClaimed: 0 
      }],
      agreeToDataPrivacy: false,
      signature: '',
      signatureDate: new Date().toISOString().split('T')[0],
    },
  });

  const watchedValues = formMethods.watch();
  const { saveDraft, loadDraft, clearDraft } = useFormDraft('fireSpecialPerilsClaim', formMethods);

  useEffect(() => {
    loadDraft();
  }, [loadDraft]);

  useEffect(() => {
    saveDraft(watchedValues);
  }, [watchedValues, saveDraft]);

  // Calculate net amount claimed for each item
  useEffect(() => {
    const items = formMethods.getValues('itemsLost');
    items.forEach((item, index) => {
      const netAmount = (item.estimatedValueAtOccurrence || 0) - (item.valueOfSalvage || 0);
      if (netAmount !== item.netAmountClaimed) {
        formMethods.setValue(`itemsLost.${index}.netAmountClaimed`, netAmount);
      }
    });
  }, [watchedValues.itemsLost, formMethods]);

  // Main submit handler that checks authentication
  const handleSubmit = async (data: FireSpecialPerilsClaimData) => {
    // Prepare file upload data
    const fileUploadPromises: Array<Promise<[string, string]>> = [];
    
    for (const [key, file] of Object.entries(uploadedFiles)) {
      if (file) {
        fileUploadPromises.push(
          uploadFile(file, `fire-special-perils-claims/${Date.now()}-${file.name}`).then(url => [key, url])
        );
      }
    }

    const fileResults = await Promise.all(fileUploadPromises);
    const fileUrls = Object.fromEntries(fileResults);

    const finalData = {
      ...data,
      ...fileUrls,
      status: 'processing',
      formType: 'Fire and Special Perils Claim'
    };

    await handleSubmitWithAuth(finalData, 'Fire and Special Perils Claim');
    clearDraft();
    setShowSummary(false);
  };

  const onFinalSubmit = (data: FireSpecialPerilsClaimData) => {
    // Check data privacy agreement and signature before showing summary
    if (!data.agreeToDataPrivacy) {
      toast({
        title: "Agreement Required",
        description: "You must agree to the data privacy notice and declaration.",
        variant: "destructive",
      });
      return;
    }

    if (!data.signature || data.signature.trim() === '') {
      toast({
        title: "Signature Required",
        description: "Please provide your digital signature.",
        variant: "destructive",
      });
      return;
    }

    setShowSummary(true);
  };

  const addItem = () => {
    const currentItems = formMethods.getValues('itemsLost');
    const newItem = {
      sn: currentItems.length + 1,
      description: '',
      costPrice: 0,
      dateOfPurchase: '',
      estimatedValueAtOccurrence: 0,
      valueOfSalvage: 0,
      netAmountClaimed: 0
    };
    formMethods.setValue('itemsLost', [...currentItems, newItem]);
  };

  const removeItem = (index: number) => {
    const currentItems = formMethods.getValues('itemsLost');
    if (currentItems.length > 1) {
      const updatedItems = currentItems.filter((_, i) => i !== index);
      // Renumber items
      updatedItems.forEach((item, i) => {
        item.sn = i + 1;
      });
      formMethods.setValue('itemsLost', updatedItems);
    }
  };

  const steps = [
    {
      id: "policy-details",
      title: "Policy Details",
      component: (
        <FormSection title="Policy Information" description="Enter your policy details">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="policyNumber">Policy Number *</Label>
              <Input
                id="policyNumber"
                {...formMethods.register('policyNumber')}
                placeholder="Enter policy number"
              />
              {formMethods.formState.errors.policyNumber && (
                <p className="text-sm text-red-600 mt-1">{formMethods.formState.errors.policyNumber.message}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="periodOfCoverFrom">Period of Cover From *</Label>
                <Input
                  id="periodOfCoverFrom"
                  type="date"
                  {...formMethods.register('periodOfCoverFrom')}
                />
                {formMethods.formState.errors.periodOfCoverFrom && (
                  <p className="text-sm text-red-600 mt-1">{formMethods.formState.errors.periodOfCoverFrom.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="periodOfCoverTo">To *</Label>
                <Input
                  id="periodOfCoverTo"
                  type="date"
                  {...formMethods.register('periodOfCoverTo')}
                />
                {formMethods.formState.errors.periodOfCoverTo && (
                  <p className="text-sm text-red-600 mt-1">{formMethods.formState.errors.periodOfCoverTo.message}</p>
                )}
              </div>
            </div>
          </div>
        </FormSection>
      ),
    },
    {
      id: "insured-details",
      title: "Insured Details",
      component: (
        <FormSection title="Insured Information" description="Enter your personal/company details">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  {...formMethods.register('name')}
                  placeholder="Enter full name"
                />
                {formMethods.formState.errors.name && (
                  <p className="text-sm text-red-600 mt-1">{formMethods.formState.errors.name.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  {...formMethods.register('companyName')}
                  placeholder="Enter company name (optional)"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Select onValueChange={(value) => formMethods.setValue('title', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select title" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Mr">Mr</SelectItem>
                    <SelectItem value="Mrs">Mrs</SelectItem>
                    <SelectItem value="Ms">Ms</SelectItem>
                    <SelectItem value="Dr">Dr</SelectItem>
                    <SelectItem value="Chief">Chief</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {formMethods.formState.errors.title && (
                  <p className="text-sm text-red-600 mt-1">{formMethods.formState.errors.title.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  {...formMethods.register('dateOfBirth')}
                />
                {formMethods.formState.errors.dateOfBirth && (
                  <p className="text-sm text-red-600 mt-1">{formMethods.formState.errors.dateOfBirth.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="gender">Gender *</Label>
                <Select onValueChange={(value) => formMethods.setValue('gender', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {formMethods.formState.errors.gender && (
                  <p className="text-sm text-red-600 mt-1">{formMethods.formState.errors.gender.message}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="address">Address *</Label>
              <Textarea
                id="address"
                {...formMethods.register('address')}
                placeholder="Enter full address"
                rows={3}
              />
              {formMethods.formState.errors.address && (
                <p className="text-sm text-red-600 mt-1">{formMethods.formState.errors.address.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  {...formMethods.register('phone')}
                  placeholder="Enter phone number"
                />
                {formMethods.formState.errors.phone && (
                  <p className="text-sm text-red-600 mt-1">{formMethods.formState.errors.phone.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  {...formMethods.register('email')}
                  placeholder="Enter email address"
                />
                {formMethods.formState.errors.email && (
                  <p className="text-sm text-red-600 mt-1">{formMethods.formState.errors.email.message}</p>
                )}
              </div>
            </div>
          </div>
        </FormSection>
      ),
    },
    {
      id: "loss-details",
      title: "Loss Details",
      component: (
        <FormSection title="Loss Information" description="Provide details about the incident">
          <div className="space-y-4">
            <div>
              <Label htmlFor="premisesAddress">Full Address of Premises Involved *</Label>
              <Textarea
                id="premisesAddress"
                {...formMethods.register('premisesAddress')}
                placeholder="Enter complete address of affected premises"
                rows={3}
              />
              {formMethods.formState.errors.premisesAddress && (
                <p className="text-sm text-red-600 mt-1">{formMethods.formState.errors.premisesAddress.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="premisesPhone">Premises Telephone *</Label>
              <Input
                id="premisesPhone"
                {...formMethods.register('premisesPhone')}
                placeholder="Enter premises phone number"
              />
              {formMethods.formState.errors.premisesPhone && (
                <p className="text-sm text-red-600 mt-1">{formMethods.formState.errors.premisesPhone.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dateOfOccurrence">Date of Occurrence *</Label>
                <Input
                  id="dateOfOccurrence"
                  type="date"
                  {...formMethods.register('dateOfOccurrence')}
                />
                {formMethods.formState.errors.dateOfOccurrence && (
                  <p className="text-sm text-red-600 mt-1">{formMethods.formState.errors.dateOfOccurrence.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="timeOfOccurrence">Time of Occurrence *</Label>
                <Input
                  id="timeOfOccurrence"
                  type="time"
                  {...formMethods.register('timeOfOccurrence')}
                />
                {formMethods.formState.errors.timeOfOccurrence && (
                  <p className="text-sm text-red-600 mt-1">{formMethods.formState.errors.timeOfOccurrence.message}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="incidentDescription">Incident Description *</Label>
              <Textarea
                id="incidentDescription"
                {...formMethods.register('incidentDescription')}
                placeholder="Provide detailed description of what happened"
                rows={4}
              />
              {formMethods.formState.errors.incidentDescription && (
                <p className="text-sm text-red-600 mt-1">{formMethods.formState.errors.incidentDescription.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="causeOfFire">Cause of Fire *</Label>
              <Textarea
                id="causeOfFire"
                {...formMethods.register('causeOfFire')}
                placeholder="Describe the cause of fire. Include any suspicious circumstances if cause is undiscovered"
                rows={3}
              />
              {formMethods.formState.errors.causeOfFire && (
                <p className="text-sm text-red-600 mt-1">{formMethods.formState.errors.causeOfFire.message}</p>
              )}
            </div>
          </div>
        </FormSection>
      ),
    },
    {
      id: "premises-use",
      title: "Premises Use",
      component: (
        <FormSection title="Premises Usage Information" description="Details about how the premises were being used">
          <div className="space-y-4">
            <div>
              <Label>Was the premises used as per policy? *</Label>
              <div className="flex items-center space-x-4 mt-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="premisesUsedYes"
                    checked={watchedValues.premisesUsedAsPerPolicy === true}
                    onCheckedChange={(checked) => formMethods.setValue('premisesUsedAsPerPolicy', !!checked)}
                  />
                  <Label htmlFor="premisesUsedYes">Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="premisesUsedNo"
                    checked={watchedValues.premisesUsedAsPerPolicy === false}
                    onCheckedChange={(checked) => formMethods.setValue('premisesUsedAsPerPolicy', !checked)}
                  />
                  <Label htmlFor="premisesUsedNo">No</Label>
                </div>
              </div>
            </div>

            {watchedValues.premisesUsedAsPerPolicy === false && (
              <div>
                <Label htmlFor="premisesUsageDetails">If No, Please Provide Details *</Label>
                <Textarea
                  id="premisesUsageDetails"
                  {...formMethods.register('premisesUsageDetails')}
                  placeholder="Explain how the premises was being used differently from the policy"
                  rows={3}
                />
              </div>
            )}

            <div>
              <Label htmlFor="purposeOfPremises">Purpose Premises Was Being Used For *</Label>
              <Textarea
                id="purposeOfPremises"
                {...formMethods.register('purposeOfPremises')}
                placeholder="Describe the purpose for which the premises was being used"
                rows={3}
              />
              {formMethods.formState.errors.purposeOfPremises && (
                <p className="text-sm text-red-600 mt-1">{formMethods.formState.errors.purposeOfPremises.message}</p>
              )}
            </div>

            <div>
              <Label>Any Unallowed Element of Risk Introduced?</Label>
              <div className="flex items-center space-x-4 mt-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="unallowedRiskYes"
                    checked={watchedValues.unallowedRiskIntroduced === true}
                    onCheckedChange={(checked) => formMethods.setValue('unallowedRiskIntroduced', !!checked)}
                  />
                  <Label htmlFor="unallowedRiskYes">Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="unallowedRiskNo"
                    checked={watchedValues.unallowedRiskIntroduced === false}
                    onCheckedChange={(checked) => formMethods.setValue('unallowedRiskIntroduced', !checked)}
                  />
                  <Label htmlFor="unallowedRiskNo">No</Label>
                </div>
              </div>
            </div>

            {watchedValues.unallowedRiskIntroduced === true && (
              <div>
                <Label htmlFor="unallowedRiskDetails">Please Explain *</Label>
                <Textarea
                  id="unallowedRiskDetails"
                  {...formMethods.register('unallowedRiskDetails')}
                  placeholder="Describe the unallowed risk element"
                  rows={3}
                />
              </div>
            )}

            <div>
              <Label htmlFor="measuresWhenFireDiscovered">Measures Taken When Fire Was Discovered *</Label>
              <Textarea
                id="measuresWhenFireDiscovered"
                {...formMethods.register('measuresWhenFireDiscovered')}
                placeholder="Describe what actions were taken when the fire was discovered"
                rows={3}
              />
              {formMethods.formState.errors.measuresWhenFireDiscovered && (
                <p className="text-sm text-red-600 mt-1">{formMethods.formState.errors.measuresWhenFireDiscovered.message}</p>
              )}
            </div>
          </div>
        </FormSection>
      ),
    },
    {
      id: "property-ownership",
      title: "Property Ownership",
      component: (
        <FormSection title="Property Ownership Details" description="Information about property ownership">
          <div className="space-y-4">
            <div>
              <Label>Are you the sole owner? *</Label>
              <div className="flex items-center space-x-4 mt-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="soleOwnerYes"
                    checked={watchedValues.soleOwner === true}
                    onCheckedChange={(checked) => formMethods.setValue('soleOwner', !!checked)}
                  />
                  <Label htmlFor="soleOwnerYes">Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="soleOwnerNo"
                    checked={watchedValues.soleOwner === false}
                    onCheckedChange={(checked) => formMethods.setValue('soleOwner', !checked)}
                  />
                  <Label htmlFor="soleOwnerNo">No</Label>
                </div>
              </div>
            </div>

            {watchedValues.soleOwner === false && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="otherOwnersName">Name of Other Owners *</Label>
                  <Input
                    id="otherOwnersName"
                    {...formMethods.register('otherOwnersName')}
                    placeholder="Enter names of other owners"
                  />
                </div>
                <div>
                  <Label htmlFor="otherOwnersAddress">Address of Other Owners *</Label>
                  <Textarea
                    id="otherOwnersAddress"
                    {...formMethods.register('otherOwnersAddress')}
                    placeholder="Enter address of other owners"
                    rows={3}
                  />
                </div>
              </div>
            )}
          </div>
        </FormSection>
      ),
    },
    {
      id: "other-insurance",
      title: "Other Insurance",
      component: (
        <FormSection title="Other Insurance Information" description="Details about any other insurance policies">
          <div className="space-y-4">
            <div>
              <Label>Any other policy on the property? *</Label>
              <div className="flex items-center space-x-4 mt-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="hasOtherInsuranceYes"
                    checked={watchedValues.hasOtherInsurance === true}
                    onCheckedChange={(checked) => formMethods.setValue('hasOtherInsurance', !!checked)}
                  />
                  <Label htmlFor="hasOtherInsuranceYes">Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="hasOtherInsuranceNo"
                    checked={watchedValues.hasOtherInsurance === false}
                    onCheckedChange={(checked) => formMethods.setValue('hasOtherInsurance', !checked)}
                  />
                  <Label htmlFor="hasOtherInsuranceNo">No</Label>
                </div>
              </div>
            </div>

            {watchedValues.hasOtherInsurance === true && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="otherInsuranceName">Name of Other Insurer *</Label>
                  <Input
                    id="otherInsuranceName"
                    {...formMethods.register('otherInsuranceName')}
                    placeholder="Enter name of other insurance company"
                  />
                </div>
                <div>
                  <Label htmlFor="otherInsuranceAddress">Address of Other Insurer *</Label>
                  <Textarea
                    id="otherInsuranceAddress"
                    {...formMethods.register('otherInsuranceAddress')}
                    placeholder="Enter address of other insurance company"
                    rows={3}
                  />
                </div>
              </div>
            )}
          </div>
        </FormSection>
      ),
    },
    {
      id: "valuation",
      title: "Valuation",
      component: (
        <FormSection title="Valuation Information" description="Property valuation and previous claim details">
          <div className="space-y-4">
            <div>
              <Label htmlFor="premisesContentsValue">Value of Premises Contents (₦) *</Label>
              <Input
                id="premisesContentsValue"
                type="number"
                step="0.01"
                {...formMethods.register('premisesContentsValue', { valueAsNumber: true })}
                placeholder="0.00"
              />
              {formMethods.formState.errors.premisesContentsValue && (
                <p className="text-sm text-red-600 mt-1">{formMethods.formState.errors.premisesContentsValue.message}</p>
              )}
            </div>

            <div>
              <Label>Previous claim under similar policy? *</Label>
              <div className="flex items-center space-x-4 mt-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="hasPreviousClaimYes"
                    checked={watchedValues.hasPreviousClaim === true}
                    onCheckedChange={(checked) => formMethods.setValue('hasPreviousClaim', !!checked)}
                  />
                  <Label htmlFor="hasPreviousClaimYes">Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="hasPreviousClaimNo"
                    checked={watchedValues.hasPreviousClaim === false}
                    onCheckedChange={(checked) => formMethods.setValue('hasPreviousClaim', !checked)}
                  />
                  <Label htmlFor="hasPreviousClaimNo">No</Label>
                </div>
              </div>
            </div>

            {watchedValues.hasPreviousClaim === true && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="previousClaimDate">Date of Previous Claim *</Label>
                  <Input
                    id="previousClaimDate"
                    type="date"
                    {...formMethods.register('previousClaimDate')}
                  />
                </div>
                <div>
                  <Label htmlFor="previousClaimAmount">Amount of Loss (₦) *</Label>
                  <Input
                    id="previousClaimAmount"
                    type="number"
                    step="0.01"
                    {...formMethods.register('previousClaimAmount', { valueAsNumber: true })}
                    placeholder="0.00"
                  />
                </div>
              </div>
            )}
          </div>
        </FormSection>
      ),
    },
    {
      id: "items-lost",
      title: "Items Lost or Damaged",
      component: (
        <FormSection title="Itemized List of Lost/Damaged Property" description="List all items that were lost or damaged">
          <div className="space-y-4">
            {watchedValues.itemsLost?.map((item, index) => (
              <Card key={`item-${index}`} className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-medium">Item {index + 1}</h4>
                  {watchedValues.itemsLost.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeItem(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor={`description-${index}`}>Description *</Label>
                    <Textarea
                      id={`description-${index}`}
                      {...formMethods.register(`itemsLost.${index}.description`)}
                      placeholder="Describe the item"
                      rows={2}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor={`costPrice-${index}`}>Cost Price (₦) *</Label>
                      <Input
                        id={`costPrice-${index}`}
                        type="number"
                        step="0.01"
                        {...formMethods.register(`itemsLost.${index}.costPrice`, { valueAsNumber: true })}
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`dateOfPurchase-${index}`}>Date of Purchase *</Label>
                      <Input
                        id={`dateOfPurchase-${index}`}
                        type="date"
                        {...formMethods.register(`itemsLost.${index}.dateOfPurchase`)}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`estimatedValue-${index}`}>Estimated Value at Occurrence (₦) *</Label>
                      <Input
                        id={`estimatedValue-${index}`}
                        type="number"
                        step="0.01"
                        {...formMethods.register(`itemsLost.${index}.estimatedValueAtOccurrence`, { valueAsNumber: true })}
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`salvageValue-${index}`}>Value of Salvage (₦)</Label>
                      <Input
                        id={`salvageValue-${index}`}
                        type="number"
                        step="0.01"
                        {...formMethods.register(`itemsLost.${index}.valueOfSalvage`, { valueAsNumber: true })}
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`netAmount-${index}`}>Net Amount Claimed (₦)</Label>
                      <Input
                        id={`netAmount-${index}`}
                        type="number"
                        step="0.01"
                        value={item.netAmountClaimed || 0}
                        readOnly
                        className="bg-gray-50"
                      />
                    </div>
                  </div>
                </div>
              </Card>
            ))}
            
            <Button type="button" variant="outline" onClick={addItem} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Another Item
            </Button>
          </div>
        </FormSection>
      ),
    },
    {
      id: "data-privacy",
      title: "Data Privacy & Declaration",
      component: (
        <FormSection title="Data Privacy Notice & Declaration" description="Please read and agree to the terms below">
          <div className="space-y-6">
            <Card className="p-6">
              <CardHeader>
                <CardTitle className="text-lg">Data Privacy</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm space-y-2">
                  <p><strong>i.</strong> Your data will solemnly be used for the purposes of this business contract and also to enable us reach you with the updates about our products and services.</p>
                  <p><strong>ii.</strong> Please note that your personal data will be treated with utmost respect and is well secured as required by Nigeria Data Protection Regulations 2019.</p>
                  <p><strong>iii.</strong> Your personal data shall not be shared with or sold to any third-party without your consent unless we are compelled by law or regulator.</p>
                </div>
              </CardContent>
            </Card>

            <Card className="p-6">
              <CardHeader>
                <CardTitle className="text-lg">Declaration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm space-y-2">
                  <p><strong>1.</strong> I/We declare to the best of my/our knowledge and belief that the information given on this form is true in every respect and agree that if I/we have made any false or fraudulent statement, be it suppression or concealment, the policy shall be cancelled and the claim shall be forfeited.</p>
                  <p><strong>2.</strong> I/We agree to provide additional information to NEM Insurance, if required.</p>
                  <p><strong>3.</strong> I/We agree to submit all required and requested for documents and NEM Insurance shall not be held responsible for any delay in settlement of claim due to non-fulfillment of requirements.</p>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="agreeToDataPrivacy"
                  checked={watchedValues.agreeToDataPrivacy}
                  onCheckedChange={(checked) => formMethods.setValue('agreeToDataPrivacy', !!checked)}
                />
                <Label htmlFor="agreeToDataPrivacy" className="text-sm">
                  I agree to the data privacy notice and declaration above *
                </Label>
              </div>
              {formMethods.formState.errors.agreeToDataPrivacy && (
                <p className="text-sm text-red-600">{formMethods.formState.errors.agreeToDataPrivacy.message}</p>
              )}

              <div>
                <Label htmlFor="signature">Digital Signature *</Label>
                <Input
                  id="signature"
                  {...formMethods.register('signature')}
                  placeholder="Type your full name as digital signature"
                />
                {formMethods.formState.errors.signature && (
                  <p className="text-sm text-red-600 mt-1">{formMethods.formState.errors.signature.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="signatureDate">Date</Label>
                <Input
                  id="signatureDate"
                  type="date"
                  {...formMethods.register('signatureDate')}
                  value={watchedValues.signatureDate}
                  readOnly
                />
              </div>
            </div>
          </div>
        </FormSection>
      ),
    },
  ];

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-6">
            <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Claim Submitted Successfully!</h2>
            <p className="text-gray-600 mb-6">
              Your fire and special perils claim has been received and is being processed.
            </p>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm font-medium text-blue-800">
                For claims status enquiries, call 01 448 9570
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Fire and Special Perils Claim Form
          </h1>
          <p className="text-muted-foreground">
            Please fill out all required information to submit your claim
          </p>
        </div>

        <MultiStepForm
          steps={steps}
          onSubmit={onFinalSubmit}
          formMethods={formMethods}
        />
        
        {/* Success Modal */}
        <SuccessModal 
          isOpen={authShowSuccess} 
          onClose={() => setAuthShowSuccess(false)}
          title="Fire and Special Perils Claim Submitted Successfully!"
          message="Your fire and special perils claim has been submitted and you will receive a confirmation email shortly."
        />

        {/* Post-Auth Loading */}
        {showPostAuthLoading && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="max-w-md mx-4">
              <CardContent className="flex flex-col items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                <p>Processing your submission...</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Summary Dialog */}
        <Dialog open={showSummary} onOpenChange={setShowSummary}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Review Your Fire and Special Perils Claim Submission</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><strong>Policy Number:</strong> {watchedValues.policyNumber}</div>
                <div><strong>Name:</strong> {watchedValues.name}</div>
                <div><strong>Email:</strong> {watchedValues.email}</div>
                <div><strong>Premises Contents Value:</strong> ₦{watchedValues.premisesContentsValue?.toLocaleString()}</div>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-blue-800">
                  For claims status enquiries, call 01 448 9570
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowSummary(false)}>
                Back to Edit
              </Button>
              <Button onClick={() => handleSubmit(formMethods.getValues())} disabled={authSubmitting}>
                        {authSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          'Submit Claim'
                        )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default FireSpecialPerilsClaim;
