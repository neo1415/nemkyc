import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Button } from '../../components/ui/button';
import { Textarea } from '../../components/ui/textarea';
import { Checkbox } from '../../components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '../../components/ui/radio-group';
import MultiStepForm from '../../components/common/MultiStepForm';
import FormSection from '../../components/common/FormSection';
import PhoneInput from '../../components/common/PhoneInput';
import { ContractorsPlantMachineryClaimData, PlantMachineryItem, Witness } from '../../types/claims';
import { useFormDraft } from '../../hooks/useFormDraft';
import { useToast } from '../../hooks/use-toast';
import { Building2, Wrench, MapPin, Users, Shield, FileText, Plus, Trash2 } from 'lucide-react';

const defaultValues: Partial<ContractorsPlantMachineryClaimData> = {
  policyNumber: '',
  periodOfCoverFrom: '',
  periodOfCoverTo: '',
  nameOfInsured: '',
  companyName: '',
  title: '',
  dateOfBirth: '',
  gender: '',
  address: '',
  phone: '',
  email: '',
  plantMachineryItems: [{
    itemNumber: '',
    yearOfManufacture: new Date().getFullYear(),
    make: '',
    registrationNumber: '',
    dateOfPurchase: '',
    costPrice: 0,
    deductionForAge: 0,
    sumClaimed: 0,
    claimType: 'presentValue'
  }],
  dateOfLoss: '',
  timeOfLoss: '',
  whereDidLossOccur: '',
  partsDamaged: '',
  whereCanBeInspected: '',
  fullAccountCircumstances: '',
  witnesses: [{
    name: '',
    address: '',
    phone: ''
  }],
  policeInformed: false,
  isSoleOwner: true,
  hasOtherInsurance: false,
  thirdPartyInvolved: false,
  agreeToDataPrivacy: false,
  signature: ''
};

const ContractorsPlantMachineryClaim: React.FC = () => {
  const [showSummary, setShowSummary] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const formMethods = useForm<ContractorsPlantMachineryClaimData>({
    defaultValues,
    mode: 'onChange'
  });

  const { control, handleSubmit, watch, setValue } = formMethods;
  const { saveDraft, clearDraft } = useFormDraft('contractors-plant-machinery-claim', formMethods);

  const plantMachineryFieldArray = useFieldArray({
    control,
    name: "plantMachineryItems"
  });

  const witnessesFieldArray = useFieldArray({
    control,
    name: "witnesses"
  });

  const watchedValues = watch();
  
  // Auto-save draft when form values change
  React.useEffect(() => {
    const subscription = watch((data) => {
      saveDraft(data);
    });
    return () => subscription.unsubscribe();
  }, [watch, saveDraft]);

  const onSubmit = async (data: ContractorsPlantMachineryClaimData) => {
    setShowSummary(true);
  };

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setShowSummary(false);
      setShowSuccess(true);
      clearDraft();
      
      toast({
        title: "Claim Submitted Successfully",
        description: "Your contractors, plant and machinery claim has been submitted and you will receive a confirmation email shortly.",
      });
    } catch (error) {
      toast({
        title: "Submission Failed",
        description: "There was an error submitting your claim. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    {
      id: 'policy-details',
      title: 'Policy Details',
      component: (
        <FormSection title="Policy Information" icon={<FileText className="h-5 w-5" />}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="policyNumber">Policy Number *</Label>
              <Input
                id="policyNumber"
                {...formMethods.register('policyNumber', { required: true })}
                placeholder="Enter policy number"
              />
            </div>
            <div>
              <Label htmlFor="periodOfCoverFrom">Period of Cover From *</Label>
              <Input
                id="periodOfCoverFrom"
                type="date"
                {...formMethods.register('periodOfCoverFrom', { required: true })}
              />
            </div>
            <div>
              <Label htmlFor="periodOfCoverTo">Period of Cover To *</Label>
              <Input
                id="periodOfCoverTo"
                type="date"
                {...formMethods.register('periodOfCoverTo', { required: true })}
              />
            </div>
          </div>
        </FormSection>
      )
    },
    {
      id: 'insured-details',
      title: 'Insured Details',
      component: (
        <FormSection title="Personal Information" icon={<Building2 className="h-5 w-5" />}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="nameOfInsured">Name of Insured *</Label>
              <Input
                id="nameOfInsured"
                {...formMethods.register('nameOfInsured', { required: true })}
                placeholder="Enter full name"
              />
            </div>
            <div>
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                {...formMethods.register('companyName')}
                placeholder="Enter company name (if applicable)"
              />
            </div>
            <div>
              <Label htmlFor="title">Title *</Label>
              <Select value={watchedValues.title} onValueChange={(value) => setValue('title', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select title" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Mr">Mr</SelectItem>
                  <SelectItem value="Mrs">Mrs</SelectItem>
                  <SelectItem value="Ms">Ms</SelectItem>
                  <SelectItem value="Chief">Chief</SelectItem>
                  <SelectItem value="Dr">Dr</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="dateOfBirth">Date of Birth *</Label>
              <Input
                id="dateOfBirth"
                type="date"
                {...formMethods.register('dateOfBirth', { required: true })}
              />
            </div>
            <div>
              <Label htmlFor="gender">Gender *</Label>
              <Select value={watchedValues.gender} onValueChange={(value) => setValue('gender', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="phone">Phone *</Label>
              <PhoneInput
                value={watchedValues.phone || ''}
                onChange={(value) => setValue('phone', value)}
                placeholder="Enter phone number"
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="address">Address *</Label>
              <Textarea
                id="address"
                {...formMethods.register('address', { required: true })}
                placeholder="Enter full address"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                {...formMethods.register('email', { required: true })}
                placeholder="Enter email address"
              />
            </div>
          </div>
        </FormSection>
      )
    },
    {
      id: 'plant-machinery',
      title: 'Plant/Machinery Details',
      component: (
        <FormSection title="Plant and Machinery Items" icon={<Wrench className="h-5 w-5" />}>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Equipment Details</h3>
              <Button
                type="button"
                onClick={() => plantMachineryFieldArray.append({
                  itemNumber: '',
                  yearOfManufacture: new Date().getFullYear(),
                  make: '',
                  registrationNumber: '',
                  dateOfPurchase: '',
                  costPrice: 0,
                  deductionForAge: 0,
                  sumClaimed: 0,
                  claimType: 'presentValue'
                })}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Item
              </Button>
            </div>

            {plantMachineryFieldArray.fields.map((field, index) => (
              <Card key={field.id} className="p-4">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">Item {index + 1}</h4>
                    {plantMachineryFieldArray.fields.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => plantMachineryFieldArray.remove(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor={`plantMachineryItems.${index}.itemNumber`}>Item Number *</Label>
                      <Input
                        id={`plantMachineryItems.${index}.itemNumber`}
                        {...formMethods.register(`plantMachineryItems.${index}.itemNumber`, { required: true })}
                        placeholder="Item/Serial number"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`plantMachineryItems.${index}.yearOfManufacture`}>Year of Manufacture *</Label>
                      <Input
                        id={`plantMachineryItems.${index}.yearOfManufacture`}
                        type="number"
                        min="1900"
                        max={new Date().getFullYear()}
                        {...formMethods.register(`plantMachineryItems.${index}.yearOfManufacture`, { required: true, valueAsNumber: true })}
                        placeholder="Year"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`plantMachineryItems.${index}.make`}>Make *</Label>
                      <Input
                        id={`plantMachineryItems.${index}.make`}
                        {...formMethods.register(`plantMachineryItems.${index}.make`, { required: true })}
                        placeholder="Manufacturer/Brand"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`plantMachineryItems.${index}.registrationNumber`}>Registration Number</Label>
                      <Input
                        id={`plantMachineryItems.${index}.registrationNumber`}
                        {...formMethods.register(`plantMachineryItems.${index}.registrationNumber`)}
                        placeholder="Registration number"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`plantMachineryItems.${index}.dateOfPurchase`}>Date of Purchase *</Label>
                      <Input
                        id={`plantMachineryItems.${index}.dateOfPurchase`}
                        type="date"
                        {...formMethods.register(`plantMachineryItems.${index}.dateOfPurchase`, { required: true })}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`plantMachineryItems.${index}.costPrice`}>Cost Price (₦) *</Label>
                      <Input
                        id={`plantMachineryItems.${index}.costPrice`}
                        type="number"
                        step="0.01"
                        {...formMethods.register(`plantMachineryItems.${index}.costPrice`, { required: true, valueAsNumber: true })}
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`plantMachineryItems.${index}.deductionForAge`}>Deduction for Age/Use (₦)</Label>
                      <Input
                        id={`plantMachineryItems.${index}.deductionForAge`}
                        type="number"
                        step="0.01"
                        {...formMethods.register(`plantMachineryItems.${index}.deductionForAge`, { valueAsNumber: true })}
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`plantMachineryItems.${index}.sumClaimed`}>Sum Claimed (₦) *</Label>
                      <Input
                        id={`plantMachineryItems.${index}.sumClaimed`}
                        type="number"
                        step="0.01"
                        {...formMethods.register(`plantMachineryItems.${index}.sumClaimed`, { required: true, valueAsNumber: true })}
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <Label>Claim Type *</Label>
                      <RadioGroup
                        value={watchedValues.plantMachineryItems?.[index]?.claimType}
                        onValueChange={(value) => setValue(`plantMachineryItems.${index}.claimType`, value as 'presentValue' | 'repairs')}
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="presentValue" id={`presentValue-${index}`} />
                          <Label htmlFor={`presentValue-${index}`}>Present Value</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="repairs" id={`repairs-${index}`} />
                          <Label htmlFor={`repairs-${index}`}>Repairs</Label>
                        </div>
                      </RadioGroup>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </FormSection>
      )
    },
    {
      id: 'loss-details',
      title: 'Loss/Damage Details',
      component: (
        <FormSection title="Loss and Damage Information" icon={<MapPin className="h-5 w-5" />}>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dateOfLoss">Date of Loss/Damage *</Label>
                <Input
                  id="dateOfLoss"
                  type="date"
                  {...formMethods.register('dateOfLoss', { required: true })}
                />
              </div>
              <div>
                <Label htmlFor="timeOfLoss">Time of Loss/Damage *</Label>
                <Input
                  id="timeOfLoss"
                  type="time"
                  {...formMethods.register('timeOfLoss', { required: true })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="lastSeenIntact">If Unknown, When and Where Last Seen Intact</Label>
              <Textarea
                id="lastSeenIntact"
                {...formMethods.register('lastSeenIntact')}
                placeholder="Describe when and where the equipment was last seen in good condition"
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="whereDidLossOccur">Where Did Loss/Damage Occur? *</Label>
              <Textarea
                id="whereDidLossOccur"
                {...formMethods.register('whereDidLossOccur', { required: true })}
                placeholder="Describe the location where the loss or damage occurred"
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="partsDamaged">Parts Damaged and Extent of Damage *</Label>
              <Textarea
                id="partsDamaged"
                {...formMethods.register('partsDamaged', { required: true })}
                placeholder="Describe what parts were damaged and the extent of the damage"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="whereCanBeInspected">Where Can Plant/Machinery Be Inspected? *</Label>
              <Textarea
                id="whereCanBeInspected"
                {...formMethods.register('whereCanBeInspected', { required: true })}
                placeholder="Provide the address where the equipment can be inspected"
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="fullAccountCircumstances">Full Account of Circumstances *</Label>
              <Textarea
                id="fullAccountCircumstances"
                {...formMethods.register('fullAccountCircumstances', { required: true })}
                placeholder="Provide a detailed account of how the loss or damage occurred"
                rows={4}
              />
            </div>

            <div>
              <Label htmlFor="suspicionInformation">Suspicion or Information on Responsible Parties</Label>
              <Textarea
                id="suspicionInformation"
                {...formMethods.register('suspicionInformation')}
                placeholder="If you suspect anyone or have information about responsible parties, provide details"
                rows={3}
              />
            </div>
          </div>
        </FormSection>
      )
    },
    {
      id: 'witnesses',
      title: 'Witnesses',
      component: (
        <FormSection title="Witness Information" icon={<Users className="h-5 w-5" />}>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Witnesses</h3>
              <Button
                type="button"
                onClick={() => witnessesFieldArray.append({ name: '', address: '', phone: '' })}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Witness
              </Button>
            </div>

            {witnessesFieldArray.fields.map((field, index) => (
              <Card key={field.id} className="p-4">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">Witness {index + 1}</h4>
                    {witnessesFieldArray.fields.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => witnessesFieldArray.remove(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`witnesses.${index}.name`}>Witness Name *</Label>
                      <Input
                        id={`witnesses.${index}.name`}
                        {...formMethods.register(`witnesses.${index}.name`, { required: true })}
                        placeholder="Enter witness name"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`witnesses.${index}.phone`}>Phone Number *</Label>
                      <PhoneInput
                        value={watchedValues.witnesses?.[index]?.phone || ''}
                        onChange={(value) => setValue(`witnesses.${index}.phone`, value)}
                        placeholder="Enter phone number"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor={`witnesses.${index}.address`}>Address *</Label>
                      <Textarea
                        id={`witnesses.${index}.address`}
                        {...formMethods.register(`witnesses.${index}.address`, { required: true })}
                        placeholder="Enter witness address"
                        rows={2}
                      />
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </FormSection>
      )
    },
    {
      id: 'theft-third-party',
      title: 'Theft & Third Party Details',
      component: (
        <FormSection title="Additional Information" icon={<Shield className="h-5 w-5" />}>
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="policeInformed"
                  checked={watchedValues.policeInformed}
                  onCheckedChange={(checked) => setValue('policeInformed', !!checked)}
                />
                <Label htmlFor="policeInformed">Police informed?</Label>
              </div>

              {watchedValues.policeInformed && (
                <div className="ml-6">
                  <Label htmlFor="policeStation">Police Station</Label>
                  <Input
                    id="policeStation"
                    {...formMethods.register('policeStation')}
                    placeholder="Enter police station name"
                  />
                </div>
              )}

              <div>
                <Label htmlFor="otherRecoveryActions">Other Recovery Actions Taken</Label>
                <Textarea
                  id="otherRecoveryActions"
                  {...formMethods.register('otherRecoveryActions')}
                  placeholder="Describe any other actions taken to recover the equipment"
                  rows={2}
                />
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isSoleOwner"
                    checked={watchedValues.isSoleOwner}
                    onCheckedChange={(checked) => setValue('isSoleOwner', !!checked)}
                  />
                  <Label htmlFor="isSoleOwner">Are you the sole owner?</Label>
                </div>

                {!watchedValues.isSoleOwner && (
                  <div className="ml-6">
                    <Label htmlFor="ownershipDetails">Ownership Details</Label>
                    <Textarea
                      id="ownershipDetails"
                      {...formMethods.register('ownershipDetails')}
                      placeholder="Provide details about other owners"
                      rows={2}
                    />
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="hasOtherInsurance"
                    checked={watchedValues.hasOtherInsurance}
                    onCheckedChange={(checked) => setValue('hasOtherInsurance', !!checked)}
                  />
                  <Label htmlFor="hasOtherInsurance">Any other insurance on the item?</Label>
                </div>

                {watchedValues.hasOtherInsurance && (
                  <div className="ml-6">
                    <Label htmlFor="otherInsuranceDetails">Other Insurance Details</Label>
                    <Textarea
                      id="otherInsuranceDetails"
                      {...formMethods.register('otherInsuranceDetails')}
                      placeholder="Provide details about other insurance coverage"
                      rows={2}
                    />
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="thirdPartyInvolved"
                    checked={watchedValues.thirdPartyInvolved}
                    onCheckedChange={(checked) => setValue('thirdPartyInvolved', !!checked)}
                  />
                  <Label htmlFor="thirdPartyInvolved">Third party involved?</Label>
                </div>

                {watchedValues.thirdPartyInvolved && (
                  <div className="ml-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="thirdPartyName">Third Party Name</Label>
                      <Input
                        id="thirdPartyName"
                        {...formMethods.register('thirdPartyName')}
                        placeholder="Enter third party name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="thirdPartyInsurer">Third Party Insurer</Label>
                      <Input
                        id="thirdPartyInsurer"
                        {...formMethods.register('thirdPartyInsurer')}
                        placeholder="Enter insurer name"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="thirdPartyAddress">Third Party Address</Label>
                      <Textarea
                        id="thirdPartyAddress"
                        {...formMethods.register('thirdPartyAddress')}
                        placeholder="Enter third party address"
                        rows={2}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </FormSection>
      )
    },
    {
      id: 'declaration',
      title: 'Declaration & Signature',
      component: (
        <FormSection title="Declaration and Signature" icon={<FileText className="h-5 w-5" />}>
          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium mb-2">Data Privacy Notice</h3>
              <p className="text-sm text-gray-600">
                I hereby authorize the processing of my personal data in accordance with applicable data protection laws. 
                This information will be used solely for the purpose of processing this insurance claim and related communications.
              </p>
            </div>

            <div className="flex items-start space-x-2">
              <Checkbox
                id="agreeToDataPrivacy"
                checked={watchedValues.agreeToDataPrivacy}
                onCheckedChange={(checked) => setValue('agreeToDataPrivacy', !!checked)}
              />
              <Label htmlFor="agreeToDataPrivacy" className="leading-normal">
                I agree to the data privacy terms and confirm that all information provided is true and accurate to the best of my knowledge. *
              </Label>
            </div>

            <div>
              <Label htmlFor="signature">Digital Signature *</Label>
              <Input
                id="signature"
                {...formMethods.register('signature', { required: true })}
                placeholder="Type your full name as signature"
              />
            </div>
          </div>
        </FormSection>
      )
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Contractors, Plant and Machinery Claim</h1>
          <p className="text-gray-600 mt-2">
            Please provide accurate information for your contractors, plant and machinery insurance claim.
          </p>
        </div>

        <MultiStepForm
          steps={steps}
          onSubmit={onSubmit}
          isSubmitting={isSubmitting}
          submitButtonText="Review Claim"
          formMethods={formMethods}
        />

        {/* Summary Dialog */}
        <Dialog open={showSummary} onOpenChange={setShowSummary}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Review Your Claim</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Policy Number:</strong> {watchedValues.policyNumber}
                </div>
                <div>
                  <strong>Insured:</strong> {watchedValues.nameOfInsured}
                </div>
                <div>
                  <strong>Loss Date:</strong> {watchedValues.dateOfLoss}
                </div>
                <div>
                  <strong>Items:</strong> {watchedValues.plantMachineryItems?.length || 0}
                </div>
              </div>
              
              <div>
                <strong>Plant/Machinery Items:</strong>
                <div className="mt-2 space-y-2">
                  {watchedValues.plantMachineryItems?.map((item, index) => (
                    <div key={index} className="text-sm bg-gray-50 p-2 rounded">
                      <div><strong>Item {index + 1}:</strong> {item.make} ({item.itemNumber})</div>
                      <div>Year: {item.yearOfManufacture}, Claim: ₦{item.sumClaimed?.toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowSummary(false)}>
                Edit
              </Button>
              <Button onClick={handleFinalSubmit} disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Submit Claim'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Success Dialog */}
        <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Claim Submitted Successfully!</DialogTitle>
            </DialogHeader>
            <div className="text-center py-4">
              <div className="text-green-600 text-4xl mb-4">✓</div>
              <p>Your contractors, plant and machinery claim has been submitted successfully.</p>
              <p className="text-sm text-gray-600 mt-2">
                You will receive a confirmation email shortly with your claim reference number.
              </p>
            </div>
            <DialogFooter>
              <Button onClick={() => setShowSuccess(false)} className="w-full">
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default ContractorsPlantMachineryClaim;