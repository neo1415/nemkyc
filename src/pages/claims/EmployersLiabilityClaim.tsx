import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useFormDraft } from '../../hooks/useFormDraft';
import { useToast } from '../../hooks/use-toast';

import MultiStepForm from '../../components/common/MultiStepForm';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Checkbox } from '../../components/ui/checkbox';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Badge } from '../../components/ui/badge';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { Label } from '../../components/ui/label';


interface Witness {
  name: string;
  address: string;
  phone: string;
}

interface EarningsMonth {
  monthEnding: string;
  wagesAndBonus: number;
  monthlyAllowances: number;
}

interface EmployersLiabilityClaimData {
  // Policy Details
  policyNumber: string;
  periodOfCoverFrom: string;
  periodOfCoverTo: string;

  // Insured Details
  name: string;
  address: string;
  phone: string;
  email: string;

  // Injured Party Details
  injuredPartyName: string;
  injuredPartyAge: number;
  injuredPartyAddress: string;
  averageMonthlyEarnings: number;
  occupation: string;
  dateOfEmployment: string;
  maritalStatus: string;
  numberOfChildren: number;
  agesOfChildren?: string;
  previousAccidents: string;
  previousAccidentsDetails?: string;

  // Injury Details
  natureOfInjuries: string;
  machineryInvolved?: string;
  supervisorName?: string;
  supervisorPosition?: string;

  // Accident Details
  accidentDate: string;
  accidentTime: string;
  accidentPlace: string;
  dateReported: string;
  reportedBy: string;
  dateStoppedWork: string;
  workDescription: string;
  howAccidentOccurred: string;
  soberOrIntoxicated: string;

  // Medical
  receivingTreatment: string;
  hospitalName?: string;
  hospitalAddress?: string;
  doctorName?: string;
  doctorAddress?: string;

  // Disablement
  totallyDisabled: string;
  dateStoppedWorking?: string;
  estimatedDuration?: string;
  ableToDoAnyDuties: string;
  dutiesDetails?: string;
  claimMadeOnYou: string;

  // Witnesses
  witnesses: Witness[];

  // Other Insurers
  otherInsurerName?: string;
  otherInsurerAddress?: string;
  otherInsurerPolicyNumber?: string;

  // Statement of Earnings
  earnings: EarningsMonth[];

  // Declaration
  agreeToDataPrivacy: boolean;
  signature: string;
}

const defaultValues: Partial<EmployersLiabilityClaimData> = {
  policyNumber: '',
  periodOfCoverFrom: '',
  periodOfCoverTo: '',
  name: '',
  address: '',
  phone: '',
  email: '',
  injuredPartyName: '',
  injuredPartyAge: 0,
  injuredPartyAddress: '',
  averageMonthlyEarnings: 0,
  occupation: '',
  dateOfEmployment: '',
  maritalStatus: '',
  numberOfChildren: 0,
  agesOfChildren: '',
  previousAccidents: '',
  natureOfInjuries: '',
  machineryInvolved: '',
  supervisorName: '',
  supervisorPosition: '',
  accidentDate: '',
  accidentTime: '',
  accidentPlace: '',
  dateReported: '',
  reportedBy: '',
  dateStoppedWork: '',
  workDescription: '',
  howAccidentOccurred: '',
  soberOrIntoxicated: '',
  receivingTreatment: '',
  hospitalName: '',
  hospitalAddress: '',
  doctorName: '',
  doctorAddress: '',
  totallyDisabled: '',
  dateStoppedWorking: '',
  estimatedDuration: '',
  ableToDoAnyDuties: '',
  dutiesDetails: '',
  claimMadeOnYou: '',
  witnesses: [],
  otherInsurerName: '',
  otherInsurerAddress: '',
  otherInsurerPolicyNumber: '',
  earnings: Array.from({ length: 12 }, (_, i) => ({
    monthEnding: '',
    wagesAndBonus: 0,
    monthlyAllowances: 0
  })),
  agreeToDataPrivacy: false,
  signature: ''
};

const EmployersLiabilityClaim: React.FC = () => {
  const { toast } = useToast();
  const [showSummary, setShowSummary] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formMethods = useForm<EmployersLiabilityClaimData>({
    defaultValues,
    mode: 'onChange'
  });

  const { fields: witnessFields, append: addWitness, remove: removeWitness } = useFieldArray({
    control: formMethods.control,
    name: 'witnesses'
  });

  const { saveDraft, loadDraft, clearDraft } = useFormDraft('employers-liability-claim', formMethods);

  const watchedValues = formMethods.watch();

  useEffect(() => {
    const draft = loadDraft();
    if (draft) {
      Object.keys(draft).forEach((key) => {
        formMethods.setValue(key as keyof EmployersLiabilityClaimData, draft[key]);
      });
    }
  }, [formMethods, loadDraft]);

  useEffect(() => {
    const subscription = formMethods.watch((data) => {
      saveDraft(data);
    });
    return () => subscription.unsubscribe();
  }, [formMethods, saveDraft]);

  const handleSubmit = async (data: EmployersLiabilityClaimData) => {
    setIsSubmitting(true);
    try {
      // Save to Firestore
      const docRef = await addDoc(collection(db, 'employersLiabilityClaimsTable'), {
        ...data,
        submittedAt: new Date(),
        status: 'submitted'
      });

      clearDraft();
      setShowSummary(false);
      setShowSuccess(true);
      
      toast({
        title: "Claim Submitted Successfully",
        description: "Your employers liability claim has been submitted and you'll receive a confirmation email shortly.",
      });
    } catch (error) {
      console.error('Error submitting claim:', error);
      toast({
        title: "Submission Error",
        description: "There was an error submitting your claim. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const onFinalSubmit = (data: EmployersLiabilityClaimData) => {
    setShowSummary(true);
  };

  const addWitness = () => {
    addWitness({ name: '', address: '', phone: '' });
  };

  const steps = [
    {
      id: 'policy',
      title: 'Policy Details',
      component: (
        <div className="space-y-4">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <Label htmlFor="policyNumber" className="flex items-center gap-1">
                    Policy Number *
                    <Info className="h-3 w-3" />
                  </Label>
                  <Input
                    id="policyNumber"
                    {...formMethods.register('policyNumber')}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Enter your employers liability insurance policy number</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="periodOfCoverFrom">Period of Cover From *</Label>
              <Input
                id="periodOfCoverFrom"
                type="date"
                {...formMethods.register('periodOfCoverFrom')}
              />
            </div>
            <div>
              <Label htmlFor="periodOfCoverTo">Period of Cover To *</Label>
              <Input
                id="periodOfCoverTo"
                type="date"
                {...formMethods.register('periodOfCoverTo')}
              />
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'insured',
      title: 'Insured Details',
      component: (
        <TooltipProvider>
          <div className="space-y-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <Label htmlFor="name" className="flex items-center gap-1">
                    Name *
                    <Info className="h-3 w-3" />
                  </Label>
                  <Input
                    id="name"
                    {...formMethods.register('name')}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Enter the insured person's name</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <Label htmlFor="address" className="flex items-center gap-1">
                    Address *
                    <Info className="h-3 w-3" />
                  </Label>
                  <Textarea
                    id="address"
                    {...formMethods.register('address')}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Enter the insured's full address</p>
              </TooltipContent>
            </Tooltip>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Label htmlFor="phone" className="flex items-center gap-1">
                      Phone Number *
                      <Info className="h-3 w-3" />
                    </Label>
                    <Input
                      id="phone"
                      {...formMethods.register('phone')}
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Enter contact phone number</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Label htmlFor="email" className="flex items-center gap-1">
                      Email Address *
                      <Info className="h-3 w-3" />
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      {...formMethods.register('email')}
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Enter email address for correspondence</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </TooltipProvider>
      )
    },
    {
      id: 'injured-party',
      title: 'Injured Party Details',
      component: (
        <TooltipProvider>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Label htmlFor="injuredPartyName" className="flex items-center gap-1">
                      Name *
                      <Info className="h-3 w-3" />
                    </Label>
                    <Input
                      id="injuredPartyName"
                      {...formMethods.register('injuredPartyName')}
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Enter the injured party's full name</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Label htmlFor="injuredPartyAge" className="flex items-center gap-1">
                      Age *
                      <Info className="h-3 w-3" />
                    </Label>
                    <Input
                      id="injuredPartyAge"
                      type="number"
                      {...formMethods.register('injuredPartyAge')}
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Enter the age of the injured party</p>
                </TooltipContent>
              </Tooltip>
            </div>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <Label htmlFor="injuredPartyAddress" className="flex items-center gap-1">
                    Address *
                    <Info className="h-3 w-3" />
                  </Label>
                  <Textarea
                    id="injuredPartyAddress"
                    {...formMethods.register('injuredPartyAddress')}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Enter the injured party's address</p>
              </TooltipContent>
            </Tooltip>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Label htmlFor="averageMonthlyEarnings" className="flex items-center gap-1">
                      Average Monthly Earnings *
                      <Info className="h-3 w-3" />
                    </Label>
                    <Input
                      id="averageMonthlyEarnings"
                      type="number"
                      {...formMethods.register('averageMonthlyEarnings')}
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Enter the average monthly earnings in Naira</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Label htmlFor="occupation" className="flex items-center gap-1">
                      Occupation *
                      <Info className="h-3 w-3" />
                    </Label>
                    <Input
                      id="occupation"
                      {...formMethods.register('occupation')}
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Enter the occupation/job title</p>
                </TooltipContent>
              </Tooltip>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DatePickerField
                name="dateOfEmployment"
                label="Date of Employment *"
              />
              
              <div>
                <Label>Marital Status *</Label>
                <Select
                  value={watchedValues.maritalStatus || ''}
                  onValueChange={(value) => formMethods.setValue('maritalStatus', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select marital status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Single">Single</SelectItem>
                    <SelectItem value="Married">Married</SelectItem>
                    <SelectItem value="Divorced">Divorced</SelectItem>
                    <SelectItem value="Widowed">Widowed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="numberOfChildren">Number of Children *</Label>
                <Input
                  id="numberOfChildren"
                  type="number"
                  {...formMethods.register('numberOfChildren')}
                />
              </div>
              
              <div>
                <Label htmlFor="agesOfChildren">Ages of Children</Label>
                <Textarea
                  id="agesOfChildren"
                  placeholder="e.g., 5, 8, 12"
                  {...formMethods.register('agesOfChildren')}
                />
              </div>
            </div>
            
            <div>
              <Label>Previous Accidents *</Label>
              <Select
                value={watchedValues.previousAccidents || ''}
                onValueChange={(value) => formMethods.setValue('previousAccidents', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select yes or no" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {watchedValues.previousAccidents === 'yes' && (
              <div>
                <Label htmlFor="previousAccidentsDetails">Previous Accidents Details *</Label>
                <Textarea
                  id="previousAccidentsDetails"
                  {...formMethods.register('previousAccidentsDetails')}
                />
              </div>
            )}
          </div>
        </TooltipProvider>
      )
    },
    {
      id: 'injury',
      title: 'Injury Details',
      component: (
        <TooltipProvider>
          <div className="space-y-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <Label htmlFor="natureOfInjuries" className="flex items-center gap-1">
                    Nature of Injuries *
                    <Info className="h-3 w-3" />
                  </Label>
                  <Textarea
                    id="natureOfInjuries"
                    {...formMethods.register('natureOfInjuries')}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Describe the nature and extent of injuries</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <Label htmlFor="machineryInvolved" className="flex items-center gap-1">
                    Machinery Involved
                    <Info className="h-3 w-3" />
                  </Label>
                  <Textarea
                    id="machineryInvolved"
                    {...formMethods.register('machineryInvolved')}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Describe any machinery involved in the incident</p>
              </TooltipContent>
            </Tooltip>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="supervisorName">Name of Supervisor</Label>
                <Input
                  id="supervisorName"
                  {...formMethods.register('supervisorName')}
                />
              </div>
              
              <div>
                <Label htmlFor="supervisorPosition">Position of Supervisor</Label>
                <Input
                  id="supervisorPosition"
                  {...formMethods.register('supervisorPosition')}
                />
              </div>
            </div>
          </div>
        </TooltipProvider>
      )
    },
    {
      id: 'accident',
      title: 'Accident Details',
      component: (
        <TooltipProvider>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DatePickerField
                name="accidentDate"
                label="Accident Date *"
              />
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Label htmlFor="accidentTime" className="flex items-center gap-1">
                      Time *
                      <Info className="h-3 w-3" />
                    </Label>
                    <Input
                      id="accidentTime"
                      type="time"
                      {...formMethods.register('accidentTime')}
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Enter the time when the accident occurred</p>
                </TooltipContent>
              </Tooltip>
            </div>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <Label htmlFor="accidentPlace" className="flex items-center gap-1">
                    Place *
                    <Info className="h-3 w-3" />
                  </Label>
                  <Textarea
                    id="accidentPlace"
                    {...formMethods.register('accidentPlace')}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Describe the location where the accident occurred</p>
              </TooltipContent>
            </Tooltip>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DatePickerField
                name="dateReported"
                label="Date Reported *"
              />
              
              <div>
                <Label htmlFor="reportedBy">Reported By *</Label>
                <Input
                  id="reportedBy"
                  {...formMethods.register('reportedBy')}
                />
              </div>
            </div>
            
            <DatePickerField
              name="dateStoppedWork"
              label="Date Injured Party Stopped Work *"
            />
            
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <Label htmlFor="workDescription" className="flex items-center gap-1">
                    Description of Work Engaged In *
                    <Info className="h-3 w-3" />
                  </Label>
                  <Textarea
                    id="workDescription"
                    {...formMethods.register('workDescription')}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Describe the work being performed when the accident occurred</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <Label htmlFor="howAccidentOccurred" className="flex items-center gap-1">
                    How the Accident Occurred *
                    <Info className="h-3 w-3" />
                  </Label>
                  <Textarea
                    id="howAccidentOccurred"
                    {...formMethods.register('howAccidentOccurred')}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Provide a detailed description of how the accident happened</p>
              </TooltipContent>
            </Tooltip>
            
            <div>
              <Label>Sober or Intoxicated *</Label>
              <Select
                value={watchedValues.soberOrIntoxicated || ''}
                onValueChange={(value) => formMethods.setValue('soberOrIntoxicated', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select condition" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sober">Sober</SelectItem>
                  <SelectItem value="intoxicated">Intoxicated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </TooltipProvider>
      )
    },
    {
      id: 'medical',
      title: 'Medical',
      component: (
        <TooltipProvider>
          <div className="space-y-4">
            <div>
              <Label>Receiving Treatment *</Label>
              <Select
                value={watchedValues.receivingTreatment || ''}
                onValueChange={(value) => formMethods.setValue('receivingTreatment', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select yes or no" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {watchedValues.receivingTreatment === 'yes' && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="hospitalName">Hospital Name *</Label>
                  <Input
                    id="hospitalName"
                    {...formMethods.register('hospitalName')}
                  />
                </div>
                
                <div>
                  <Label htmlFor="hospitalAddress">Hospital Address *</Label>
                  <Textarea
                    id="hospitalAddress"
                    {...formMethods.register('hospitalAddress')}
                  />
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="doctorName">Name of Doctor</Label>
                <Input
                  id="doctorName"
                  {...formMethods.register('doctorName')}
                />
              </div>
              
              <div>
                <Label htmlFor="doctorAddress">Address of Doctor</Label>
                <Textarea
                  id="doctorAddress"
                  {...formMethods.register('doctorAddress')}
                />
              </div>
            </div>
          </div>
        </TooltipProvider>
      )
    },
    {
      id: 'disablement',
      title: 'Disablement',
      component: (
        <TooltipProvider>
          <div className="space-y-4">
            <div>
              <Label>Totally Disabled? *</Label>
              <Select
                value={watchedValues.totallyDisabled || ''}
                onValueChange={(value) => formMethods.setValue('totallyDisabled', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select yes or no" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {watchedValues.totallyDisabled === 'yes' && (
              <DatePickerField
                name="dateStoppedWorking"
                label="Date Stopped Working *"
              />
            )}
            
            <div>
              <Label htmlFor="estimatedDuration">Estimated Duration of Disablement</Label>
              <Input
                id="estimatedDuration"
                {...formMethods.register('estimatedDuration')}
              />
            </div>
            
            <div>
              <Label>Able to Do Any Duties? *</Label>
              <Select
                value={watchedValues.ableToDoAnyDuties || ''}
                onValueChange={(value) => formMethods.setValue('ableToDoAnyDuties', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select yes or no" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {watchedValues.ableToDoAnyDuties === 'yes' && (
              <div>
                <Label htmlFor="dutiesDetails">Duties Details *</Label>
                <Textarea
                  id="dutiesDetails"
                  {...formMethods.register('dutiesDetails')}
                />
              </div>
            )}
            
            <div>
              <Label>Has Any Claim Been Made on You? *</Label>
              <Select
                value={watchedValues.claimMadeOnYou || ''}
                onValueChange={(value) => formMethods.setValue('claimMadeOnYou', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select yes or no" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </TooltipProvider>
      )
    },
    {
      id: 'witnesses',
      title: 'Witnesses',
      component: (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Label className="text-lg font-semibold">Witnesses</Label>
            <Button
              type="button"
              onClick={() => addWitness({ name: '', address: '', phone: '' })}
              variant="outline"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Witness
            </Button>
          </div>
          
          {witnessFields.map((field, index) => (
            <Card key={field.id} className="p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold">Witness {index + 1}</h3>
                <Button
                  type="button"
                  onClick={() => removeWitness(index)}
                  variant="destructive"
                  size="sm"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor={`witnesses.${index}.name`}>Witness Name *</Label>
                  <Input
                    {...formMethods.register(`witnesses.${index}.name`)}
                  />
                </div>
                
                <div>
                  <Label htmlFor={`witnesses.${index}.address`}>Witness Address *</Label>
                  <Textarea
                    {...formMethods.register(`witnesses.${index}.address`)}
                  />
                </div>
                
                <div>
                  <Label htmlFor={`witnesses.${index}.phone`}>Witness Phone *</Label>
                  <Input
                    {...formMethods.register(`witnesses.${index}.phone`)}
                  />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )
    },
    {
      id: 'other-insurers',
      title: 'Other Insurers',
      component: (
        <TooltipProvider>
          <div className="space-y-4">
            <div>
              <Label htmlFor="otherInsurerName">Other Insurer Name</Label>
              <Input
                id="otherInsurerName"
                {...formMethods.register('otherInsurerName')}
              />
            </div>
            
            <div>
              <Label htmlFor="otherInsurerAddress">Other Insurer Address</Label>
              <Textarea
                id="otherInsurerAddress"
                {...formMethods.register('otherInsurerAddress')}
              />
            </div>
            
            <div>
              <Label htmlFor="otherInsurerPolicyNumber">Policy Number</Label>
              <Input
                id="otherInsurerPolicyNumber"
                {...formMethods.register('otherInsurerPolicyNumber')}
              />
            </div>
          </div>
        </TooltipProvider>
      )
    },
    {
      id: 'earnings',
      title: 'Statement of Earnings',
      component: (
        <div className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr>
                  <th className="border border-gray-300 p-2 bg-gray-50">Month Ending</th>
                  <th className="border border-gray-300 p-2 bg-gray-50">Wages & Bonus</th>
                  <th className="border border-gray-300 p-2 bg-gray-50">Plus Monthly Allowances</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 12 }, (_, index) => (
                  <tr key={index}>
                    <td className="border border-gray-300 p-2">
                      <Input
                        {...formMethods.register(`earnings.${index}.monthEnding`)}
                        placeholder="MM/YYYY"
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
                      <Input
                        type="number"
                        {...formMethods.register(`earnings.${index}.wagesAndBonus`)}
                        placeholder="0"
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
                      <Input
                        type="number"
                        {...formMethods.register(`earnings.${index}.monthlyAllowances`)}
                        placeholder="0"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )
    },
    {
      id: 'declaration',
      title: 'Data Privacy & Declaration',
      component: (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">Data Privacy</h3>
            <div className="text-sm space-y-2 mb-4 p-4 bg-gray-50 rounded">
              <p>i. Your data will solemnly be used for the purposes of this business contract and also to enable us reach you with the updates about our products and services.</p>
              <p>ii. Please note that your personal data will be treated with utmost respect and is well secured as required by Nigeria Data Protection Regulations 2019.</p>
              <p>iii. Your personal data shall not be shared with or sold to any third-party without your consent unless we are compelled by law or regulator.</p>
            </div>
            
            <div className="flex items-start space-x-2">
              <Checkbox
                id="agreeToDataPrivacy"
                checked={watchedValues.agreeToDataPrivacy || false}
                onCheckedChange={(checked) => formMethods.setValue('agreeToDataPrivacy', checked)}
                className="mt-1"
              />
              <Label htmlFor="agreeToDataPrivacy" className="text-sm">
                I agree to the data privacy policy *
              </Label>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Declaration</h3>
            <div className="text-sm space-y-2 mb-4 p-4 bg-gray-50 rounded">
              <p>1. I/We declare to the best of my/our knowledge and belief that the information given on this form is true in every respect and agree that if I/we have made any false or fraudulent statement, be it suppression or concealment, the policy shall be cancelled and the claim shall be forfeited.</p>
              <p>2. I/We agree to provide additional information to NEM Insurance, if required.</p>
              <p>3. I/We agree to submit all required and requested for documents and NEM Insurance shall not be held responsible for any delay in settlement of claim due to non-fulfillment of requirements.</p>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="declarationTrue"
                  checked={watchedValues.declarationTrue || false}
                  onCheckedChange={(checked) => formMethods.setValue('declarationTrue', checked)}
                  className="mt-1"
                />
                <Label htmlFor="declarationTrue" className="text-sm">
                  I declare that the information given is true *
                </Label>
              </div>
              
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="declarationAdditionalInfo"
                  checked={watchedValues.declarationAdditionalInfo || false}
                  onCheckedChange={(checked) => formMethods.setValue('declarationAdditionalInfo', checked)}
                  className="mt-1"
                />
                <Label htmlFor="declarationAdditionalInfo" className="text-sm">
                  I agree to provide additional information if required *
                </Label>
              </div>
              
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="declarationDocuments"
                  checked={watchedValues.declarationDocuments || false}
                  onCheckedChange={(checked) => formMethods.setValue('declarationDocuments', checked)}
                  className="mt-1"
                />
                <Label htmlFor="declarationDocuments" className="text-sm">
                  I agree to submit all required documents *
                </Label>
              </div>
            </div>
          </div>
          
          <div>
            <Label htmlFor="signature">Digital Signature *</Label>
            <Input
              id="signature"
              placeholder="Type your full name as signature"
              {...formMethods.register('signature')}
            />
          </div>
          
          <div>
            <Label>Date</Label>
            <Input
              value={new Date().toLocaleDateString()}
              disabled
              className="bg-gray-100"
            />
          </div>
          
          <div>
            <Label>File Uploads</Label>
            <FileUpload
              onFileSelect={(file) => setUploadedFiles(prev => ({ ...prev, [file.name]: file }))}
              accept=".jpg,.jpeg,.png,.pdf"
              maxSize={3}
            />
          </div>
        </div>
      )
    }
  ];

  if (showSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Claim Submitted Successfully!</h3>
                <p className="text-sm text-gray-600 mt-2">
                  Your employers liability claim has been submitted successfully. You will receive a confirmation email shortly.
                </p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg text-sm">
                <p className="font-semibold mb-2">For claim status and inquiries:</p>
                <p>Email: claims@neminsurance.com</p>
                <p>Phone: +234 1 280 0000</p>
                <p>Address: 32 Adeola Odeku Street, Victoria Island, Lagos</p>
              </div>
              <Button onClick={() => window.location.href = '/'} className="w-full">
                Return to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HardHat className="h-5 w-5" />
              Employers Liability Claim Form
            </CardTitle>
            <CardDescription>
              Submit your employers liability insurance claim
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MultiStepForm
              steps={steps}
              onSubmit={onFinalSubmit}
              isSubmitting={isSubmitting}
              submitButtonText="Review & Submit Claim"
              formMethods={formMethods}
            />
          </CardContent>
        </Card>

        {/* Summary Dialog */}
        <Dialog open={showSummary} onOpenChange={setShowSummary}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Review Your Employers Liability Claim Submission</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><strong>Policy Number:</strong> {watchedValues.policyNumber}</div>
                <div><strong>Name:</strong> {watchedValues.name}</div>
                <div><strong>Email:</strong> {watchedValues.email}</div>
                <div><strong>Injured Party:</strong> {watchedValues.injuredPartyName}</div>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-blue-800">
                  For claims status enquiries, call 01 448 9570
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowSummary(false)}>
                Edit Details
              </Button>
              <Button onClick={() => handleSubmit(formMethods.getValues())} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Confirm & Submit'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Success Modal */}
        <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-center text-green-600">
                Claim Submitted Successfully!
              </DialogTitle>
            </DialogHeader>
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p>Your employers liability claim has been submitted successfully.</p>
              <p className="text-sm text-muted-foreground">
                You will receive a confirmation email shortly with your claim reference number.
              </p>
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm">
                  <strong>For claims status enquiries, call 01 448 9570</strong>
                </p>
              </div>
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

export default EmployersLiabilityClaim;
