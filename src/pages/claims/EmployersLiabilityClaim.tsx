
import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useAuth } from '../../contexts/AuthContext';
import { employersLiabilityClaimSchema } from '../../utils/validation';
import { EmployersLiabilityClaimData, Witness } from '../../types';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { RadioGroup, RadioGroupItem } from '../../components/ui/radio-group';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { toast } from '../../components/ui/use-toast';
import FormSection from '../../components/common/FormSection';
import PhoneInput from '../../components/common/PhoneInput';
import MultiStepForm from '../../components/common/MultiStepForm';
import AuthRequiredSubmit from '../../components/common/AuthRequiredSubmit';
import { User, FileText, Briefcase, Calendar, Users, Shield, Building, DollarSign, Plus, Trash2 } from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { notifySubmission } from '../../services/notificationService';

const EmployersLiabilityClaim: React.FC = () => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  const { register, handleSubmit, formState: { errors }, setValue, watch, control, trigger } = useForm({
    resolver: yupResolver(employersLiabilityClaimSchema) as any,
    defaultValues: {
      policyNumber: '',
      periodOfCoverFrom: '',
      periodOfCoverTo: '',
      insuredName: '',
      insuredAddress: '',
      insuredPhone: '',
      insuredEmail: user?.email || '',
      injuredPartyName: '',
      injuredPartyAge: 0,
      injuredPartyAddress: '',
      averageMonthlyEarnings: 0,
      occupation: '',
      dateOfEmployment: '',
      maritalStatus: '',
      numberOfChildren: 0,
      agesOfChildren: '',
      previousAccidents: false,
      previousAccidentsDetails: '',
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
      descriptionOfWork: '',
      howAccidentOccurred: '',
      soberOrIntoxicated: true,
      receivingTreatment: false,
      hospitalName: '',
      hospitalAddress: '',
      doctorName: '',
      doctorAddress: '',
      totallyDisabled: false,
      dateStoppedWorking: '',
      estimatedDurationOfDisablement: '',
      ableToDoAnyDuties: false,
      dutiesDetails: '',
      claimMadeOnYou: false,
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
    }
  });

  const { fields: witnessFields, append: appendWitness, remove: removeWitness } = useFieldArray({
    control,
    name: 'witnesses'
  });

  const watchedValues = watch();

  const onSubmit = async (data: EmployersLiabilityClaimData) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    
    setIsSubmitting(true);
    try {
      const submissionId = `employers_liability_claim_${Date.now()}`;
      
      await setDoc(doc(db, 'submissions', submissionId), {
        id: submissionId,
        userId: user.uid,
        formType: 'employers-liability-claim',
        data: data,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      await notifySubmission(user, 'Employers Liability Claim');
      
      toast({
        title: "Claim Submitted",
        description: "Your Employers Liability Claim has been submitted successfully.",
      });
      
      window.location.href = '/dashboard';
    } catch (error) {
      console.error('Error submitting claim:', error);
      toast({
        title: "Submission Error",
        description: "Failed to submit claim. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const PolicyDetailsStep = () => (
    <FormSection title="Policy Details" icon={<Shield className="h-5 w-5" />}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <Label htmlFor="policyNumber">Policy Number *</Label>
          <Input {...register('policyNumber')} />
          {errors.policyNumber && <p className="text-sm text-red-600">{errors.policyNumber.message}</p>}
        </div>
        
        <div>
          <Label htmlFor="periodOfCoverFrom">Period of Cover From *</Label>
          <Input type="date" {...register('periodOfCoverFrom')} />
          {errors.periodOfCoverFrom && <p className="text-sm text-red-600">{errors.periodOfCoverFrom.message}</p>}
        </div>
        
        <div>
          <Label htmlFor="periodOfCoverTo">Period of Cover To *</Label>
          <Input type="date" {...register('periodOfCoverTo')} />
          {errors.periodOfCoverTo && <p className="text-sm text-red-600">{errors.periodOfCoverTo.message}</p>}
        </div>
      </div>
    </FormSection>
  );

  const InsuredDetailsStep = () => (
    <FormSection title="Insured Details" icon={<User className="h-5 w-5" />}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <Label htmlFor="insuredName">Name *</Label>
          <Input {...register('insuredName')} />
          {errors.insuredName && <p className="text-sm text-red-600">{errors.insuredName.message}</p>}
        </div>
        
        <div className="md:col-span-2">
          <Label htmlFor="insuredAddress">Address *</Label>
          <Textarea {...register('insuredAddress')} />
          {errors.insuredAddress && <p className="text-sm text-red-600">{errors.insuredAddress.message}</p>}
        </div>
        
        <div>
          <PhoneInput
            label="Phone"
            required
            value={watchedValues.insuredPhone || ''}
            onChange={(value) => setValue('insuredPhone', value)}
            error={errors.insuredPhone?.message}
          />
        </div>
        
        <div>
          <Label htmlFor="insuredEmail">Email *</Label>
          <Input type="email" {...register('insuredEmail')} />
          {errors.insuredEmail && <p className="text-sm text-red-600">{errors.insuredEmail.message}</p>}
        </div>
      </div>
    </FormSection>
  );

  const InjuredPartyDetailsStep = () => (
    <FormSection title="Injured Party Details" icon={<Users className="h-5 w-5" />}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="injuredPartyName">Name *</Label>
          <Input {...register('injuredPartyName')} />
          {errors.injuredPartyName && <p className="text-sm text-red-600">{errors.injuredPartyName.message}</p>}
        </div>
        
        <div>
          <Label htmlFor="injuredPartyAge">Age *</Label>
          <Input type="number" {...register('injuredPartyAge')} />
          {errors.injuredPartyAge && <p className="text-sm text-red-600">{errors.injuredPartyAge.message}</p>}
        </div>
        
        <div className="md:col-span-2">
          <Label htmlFor="injuredPartyAddress">Address *</Label>
          <Textarea {...register('injuredPartyAddress')} />
          {errors.injuredPartyAddress && <p className="text-sm text-red-600">{errors.injuredPartyAddress.message}</p>}
        </div>
        
        <div>
          <Label htmlFor="averageMonthlyEarnings">Average Monthly Earnings *</Label>
          <Input type="number" step="0.01" {...register('averageMonthlyEarnings')} />
          {errors.averageMonthlyEarnings && <p className="text-sm text-red-600">{errors.averageMonthlyEarnings.message}</p>}
        </div>
        
        <div>
          <Label htmlFor="occupation">Occupation *</Label>
          <Input {...register('occupation')} />
          {errors.occupation && <p className="text-sm text-red-600">{errors.occupation.message}</p>}
        </div>
        
        <div>
          <Label htmlFor="dateOfEmployment">Date of Employment *</Label>
          <Input type="date" {...register('dateOfEmployment')} />
          {errors.dateOfEmployment && <p className="text-sm text-red-600">{errors.dateOfEmployment.message}</p>}
        </div>
        
        <div>
          <Label>Marital Status *</Label>
          <Select
            value={watchedValues.maritalStatus}
            onValueChange={(value) => setValue('maritalStatus', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select marital status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="single">Single</SelectItem>
              <SelectItem value="married">Married</SelectItem>
              <SelectItem value="divorced">Divorced</SelectItem>
              <SelectItem value="widowed">Widowed</SelectItem>
            </SelectContent>
          </Select>
          {errors.maritalStatus && <p className="text-sm text-red-600">{errors.maritalStatus.message}</p>}
        </div>
        
        <div>
          <Label htmlFor="numberOfChildren">Number of Children *</Label>
          <Input type="number" min="0" {...register('numberOfChildren')} />
          {errors.numberOfChildren && <p className="text-sm text-red-600">{errors.numberOfChildren.message}</p>}
        </div>
        
        <div className="md:col-span-2">
          <Label htmlFor="agesOfChildren">Ages of Children</Label>
          <Textarea {...register('agesOfChildren')} placeholder="Enter ages separated by commas" />
        </div>
        
        <div className="md:col-span-2">
          <Label>Previous Accidents *</Label>
          <RadioGroup
            value={watchedValues.previousAccidents ? 'yes' : 'no'}
            onValueChange={(value) => setValue('previousAccidents', value === 'yes')}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="no" id="previousAccidents-no" />
              <Label htmlFor="previousAccidents-no">No</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="yes" id="previousAccidents-yes" />
              <Label htmlFor="previousAccidents-yes">Yes</Label>
            </div>
          </RadioGroup>
          {errors.previousAccidents && <p className="text-sm text-red-600">{errors.previousAccidents.message}</p>}
        </div>
        
        {watchedValues.previousAccidents && (
          <div className="md:col-span-2">
            <Label htmlFor="previousAccidentsDetails">Previous Accidents Details *</Label>
            <Textarea {...register('previousAccidentsDetails')} />
            {errors.previousAccidentsDetails && <p className="text-sm text-red-600">{errors.previousAccidentsDetails.message}</p>}
          </div>
        )}
      </div>
    </FormSection>
  );

  const InjuryDetailsStep = () => (
    <FormSection title="Injury Details" icon={<FileText className="h-5 w-5" />}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <Label htmlFor="natureOfInjuries">Nature of Injuries *</Label>
          <Textarea {...register('natureOfInjuries')} />
          {errors.natureOfInjuries && <p className="text-sm text-red-600">{errors.natureOfInjuries.message}</p>}
        </div>
        
        <div className="md:col-span-2">
          <Label htmlFor="machineryInvolved">Machinery Involved (if relevant)</Label>
          <Textarea {...register('machineryInvolved')} />
        </div>
        
        <div>
          <Label htmlFor="supervisorName">Supervisor Name *</Label>
          <Input {...register('supervisorName')} />
          {errors.supervisorName && <p className="text-sm text-red-600">{errors.supervisorName.message}</p>}
        </div>
        
        <div>
          <Label htmlFor="supervisorPosition">Supervisor Position *</Label>
          <Input {...register('supervisorPosition')} />
          {errors.supervisorPosition && <p className="text-sm text-red-600">{errors.supervisorPosition.message}</p>}
        </div>
      </div>
    </FormSection>
  );

  const AccidentDetailsStep = () => (
    <FormSection title="Accident Details" icon={<Calendar className="h-5 w-5" />}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="accidentDate">Accident Date *</Label>
          <Input type="date" {...register('accidentDate')} />
          {errors.accidentDate && <p className="text-sm text-red-600">{errors.accidentDate.message}</p>}
        </div>
        
        <div>
          <Label htmlFor="accidentTime">Time *</Label>
          <Input type="time" {...register('accidentTime')} />
          {errors.accidentTime && <p className="text-sm text-red-600">{errors.accidentTime.message}</p>}
        </div>
        
        <div className="md:col-span-2">
          <Label htmlFor="accidentPlace">Place *</Label>
          <Textarea {...register('accidentPlace')} />
          {errors.accidentPlace && <p className="text-sm text-red-600">{errors.accidentPlace.message}</p>}
        </div>
        
        <div>
          <Label htmlFor="dateReported">Date Reported *</Label>
          <Input type="date" {...register('dateReported')} />
          {errors.dateReported && <p className="text-sm text-red-600">{errors.dateReported.message}</p>}
        </div>
        
        <div>
          <Label htmlFor="reportedBy">Reported by *</Label>
          <Input {...register('reportedBy')} />
          {errors.reportedBy && <p className="text-sm text-red-600">{errors.reportedBy.message}</p>}
        </div>
        
        <div>
          <Label htmlFor="dateStoppedWork">Date Injured Party Stopped Work *</Label>
          <Input type="date" {...register('dateStoppedWork')} />
          {errors.dateStoppedWork && <p className="text-sm text-red-600">{errors.dateStoppedWork.message}</p>}
        </div>
        
        <div className="md:col-span-2">
          <Label htmlFor="descriptionOfWork">Description of Work Engaged In *</Label>
          <Textarea {...register('descriptionOfWork')} />
          {errors.descriptionOfWork && <p className="text-sm text-red-600">{errors.descriptionOfWork.message}</p>}
        </div>
        
        <div className="md:col-span-2">
          <Label htmlFor="howAccidentOccurred">How the Accident Occurred *</Label>
          <Textarea {...register('howAccidentOccurred')} />
          {errors.howAccidentOccurred && <p className="text-sm text-red-600">{errors.howAccidentOccurred.message}</p>}
        </div>
        
        <div className="md:col-span-2">
          <Label>Sober or Intoxicated *</Label>
          <RadioGroup
            value={watchedValues.soberOrIntoxicated ? 'sober' : 'intoxicated'}
            onValueChange={(value) => setValue('soberOrIntoxicated', value === 'sober')}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="sober" id="sober" />
              <Label htmlFor="sober">Sober</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="intoxicated" id="intoxicated" />
              <Label htmlFor="intoxicated">Intoxicated</Label>
            </div>
          </RadioGroup>
          {errors.soberOrIntoxicated && <p className="text-sm text-red-600">{errors.soberOrIntoxicated.message}</p>}
        </div>
      </div>
    </FormSection>
  );

  const MedicalStep = () => (
    <FormSection title="Medical" icon={<Building className="h-5 w-5" />}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <Label>Receiving Treatment *</Label>
          <RadioGroup
            value={watchedValues.receivingTreatment ? 'yes' : 'no'}
            onValueChange={(value) => setValue('receivingTreatment', value === 'yes')}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="no" id="receivingTreatment-no" />
              <Label htmlFor="receivingTreatment-no">No</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="yes" id="receivingTreatment-yes" />
              <Label htmlFor="receivingTreatment-yes">Yes</Label>
            </div>
          </RadioGroup>
          {errors.receivingTreatment && <p className="text-sm text-red-600">{errors.receivingTreatment.message}</p>}
        </div>
        
        {watchedValues.receivingTreatment && (
          <>
            <div>
              <Label htmlFor="hospitalName">Hospital Name *</Label>
              <Input {...register('hospitalName')} />
              {errors.hospitalName && <p className="text-sm text-red-600">{errors.hospitalName.message}</p>}
            </div>
            
            <div>
              <Label htmlFor="hospitalAddress">Hospital Address *</Label>
              <Textarea {...register('hospitalAddress')} />
              {errors.hospitalAddress && <p className="text-sm text-red-600">{errors.hospitalAddress.message}</p>}
            </div>
          </>
        )}
        
        <div>
          <Label htmlFor="doctorName">Doctor Name *</Label>
          <Input {...register('doctorName')} />
          {errors.doctorName && <p className="text-sm text-red-600">{errors.doctorName.message}</p>}
        </div>
        
        <div>
          <Label htmlFor="doctorAddress">Doctor Address *</Label>
          <Textarea {...register('doctorAddress')} />
          {errors.doctorAddress && <p className="text-sm text-red-600">{errors.doctorAddress.message}</p>}
        </div>
      </div>
    </FormSection>
  );

  const DisablementStep = () => (
    <FormSection title="Disablement" icon={<Shield className="h-5 w-5" />}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <Label>Totally Disabled? *</Label>
          <RadioGroup
            value={watchedValues.totallyDisabled ? 'yes' : 'no'}
            onValueChange={(value) => setValue('totallyDisabled', value === 'yes')}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="no" id="totallyDisabled-no" />
              <Label htmlFor="totallyDisabled-no">No</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="yes" id="totallyDisabled-yes" />
              <Label htmlFor="totallyDisabled-yes">Yes</Label>
            </div>
          </RadioGroup>
          {errors.totallyDisabled && <p className="text-sm text-red-600">{errors.totallyDisabled.message}</p>}
        </div>
        
        <div>
          <Label htmlFor="dateStoppedWorking">Date Stopped Working *</Label>
          <Input type="date" {...register('dateStoppedWorking')} />
          {errors.dateStoppedWorking && <p className="text-sm text-red-600">{errors.dateStoppedWorking.message}</p>}
        </div>
        
        <div>
          <Label htmlFor="estimatedDurationOfDisablement">Estimated Duration of Disablement *</Label>
          <Input {...register('estimatedDurationOfDisablement')} />
          {errors.estimatedDurationOfDisablement && <p className="text-sm text-red-600">{errors.estimatedDurationOfDisablement.message}</p>}
        </div>
        
        <div className="md:col-span-2">
          <Label>Able to do any duties? *</Label>
          <RadioGroup
            value={watchedValues.ableToDoAnyDuties ? 'yes' : 'no'}
            onValueChange={(value) => setValue('ableToDoAnyDuties', value === 'yes')}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="no" id="ableToDoAnyDuties-no" />
              <Label htmlFor="ableToDoAnyDuties-no">No</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="yes" id="ableToDoAnyDuties-yes" />
              <Label htmlFor="ableToDoAnyDuties-yes">Yes</Label>
            </div>
          </RadioGroup>
          {errors.ableToDoAnyDuties && <p className="text-sm text-red-600">{errors.ableToDoAnyDuties.message}</p>}
        </div>
        
        {watchedValues.ableToDoAnyDuties && (
          <div className="md:col-span-2">
            <Label htmlFor="dutiesDetails">Duties Details *</Label>
            <Textarea {...register('dutiesDetails')} />
            {errors.dutiesDetails && <p className="text-sm text-red-600">{errors.dutiesDetails.message}</p>}
          </div>
        )}
        
        <div className="md:col-span-2">
          <Label>Has any claim been made on you? *</Label>
          <RadioGroup
            value={watchedValues.claimMadeOnYou ? 'yes' : 'no'}
            onValueChange={(value) => setValue('claimMadeOnYou', value === 'yes')}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="no" id="claimMadeOnYou-no" />
              <Label htmlFor="claimMadeOnYou-no">No</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="yes" id="claimMadeOnYou-yes" />
              <Label htmlFor="claimMadeOnYou-yes">Yes</Label>
            </div>
          </RadioGroup>
          {errors.claimMadeOnYou && <p className="text-sm text-red-600">{errors.claimMadeOnYou.message}</p>}
        </div>
      </div>
    </FormSection>
  );

  const WitnessesStep = () => (
    <FormSection title="Witnesses" icon={<Users className="h-5 w-5" />}>
      <div className="space-y-4">
        {witnessFields.map((field, index) => (
          <Card key={field.id} className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-medium">Witness {index + 1}</h4>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => removeWitness(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor={`witnesses.${index}.name`}>Witness Name *</Label>
                <Input {...register(`witnesses.${index}.name` as const)} />
                {errors.witnesses?.[index] && (errors.witnesses[index] as any)?.name && (
                  <p className="text-sm text-red-600">{(errors.witnesses[index] as any)?.name?.message}</p>
                )}
              </div>
              
              <div>
                <PhoneInput
                  label="Witness Phone"
                  value={watchedValues.witnesses?.[index]?.phone || ''}
                  onChange={(value) => setValue(`witnesses.${index}.phone`, value)}
                />
              </div>
              
              <div className="md:col-span-2">
                <Label htmlFor={`witnesses.${index}.address`}>Witness Address *</Label>
                <Textarea {...register(`witnesses.${index}.address` as const)} />
                {errors.witnesses?.[index] && (errors.witnesses[index] as any)?.address && (
                  <p className="text-sm text-red-600">{(errors.witnesses[index] as any)?.address?.message}</p>
                )}
              </div>
            </div>
          </Card>
        ))}
        
        <Button
          type="button"
          variant="outline"
          onClick={() => appendWitness({ name: '', address: '', phone: '' })}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Witness
        </Button>
      </div>
    </FormSection>
  );

  const OtherInsurersStep = () => (
    <FormSection title="Other Insurers" icon={<Building className="h-5 w-5" />}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="otherInsurerName">Name</Label>
          <Input {...register('otherInsurerName')} />
        </div>
        
        <div>
          <Label htmlFor="otherInsurerPolicyNumber">Policy Number</Label>
          <Input {...register('otherInsurerPolicyNumber')} />
        </div>
        
        <div className="md:col-span-2">
          <Label htmlFor="otherInsurerAddress">Address</Label>
          <Textarea {...register('otherInsurerAddress')} />
        </div>
      </div>
    </FormSection>
  );

  const EarningsStep = () => (
    <FormSection title="Statement of Earnings" icon={<DollarSign className="h-5 w-5" />}>
      <div className="space-y-4">
        <p className="text-sm text-gray-600">Complete earnings information for the last 12 months</p>
        <div className="space-y-4">
          {Array.from({ length: 12 }, (_, index) => (
            <Card key={index} className="p-4">
              <h4 className="font-medium mb-4">Month {index + 1}</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor={`earnings.${index}.monthEnding`}>Month Ending *</Label>
                  <Input type="date" {...register(`earnings.${index}.monthEnding` as const)} />
                  {errors.earnings?.[index]?.monthEnding && (
                    <p className="text-sm text-red-600">{errors.earnings[index]?.monthEnding?.message}</p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor={`earnings.${index}.wagesAndBonus`}>Wages & Bonus *</Label>
                  <Input type="number" step="0.01" {...register(`earnings.${index}.wagesAndBonus` as const)} />
                  {errors.earnings?.[index]?.wagesAndBonus && (
                    <p className="text-sm text-red-600">{errors.earnings[index]?.wagesAndBonus?.message}</p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor={`earnings.${index}.monthlyAllowances`}>Monthly Allowances *</Label>
                  <Input type="number" step="0.01" {...register(`earnings.${index}.monthlyAllowances` as const)} />
                  {errors.earnings?.[index]?.monthlyAllowances && (
                    <p className="text-sm text-red-600">{errors.earnings[index]?.monthlyAllowances?.message}</p>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </FormSection>
  );

  const DataPrivacyStep = () => (
    <FormSection title="Data Privacy & Declaration" icon={<Shield className="h-5 w-5" />}>
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">Data Privacy</h3>
          <div className="space-y-2 text-sm text-gray-700">
            <p>i. Your data will solemnly be used for the purposes of this business contract and also to enable us reach you with the updates about our products and services.</p>
            <p>ii. Please note that your personal data will be treated with utmost respect and is well secured as required by Nigeria Data Protection Regulations 2019.</p>
            <p>iii. Your personal data shall not be shared with or sold to any third-party without your consent unless we are compelled by law or regulator.</p>
          </div>
        </div>
        
        <div>
          <h3 className="text-lg font-semibold mb-4">Declaration</h3>
          <div className="space-y-2 text-sm text-gray-700">
            <p>1. I/We declare to the best of my/our knowledge and belief that the information given on this form is true in every respect and agree that if I/we have made any false or fraudulent statement, be it suppression or concealment, the policy shall be cancelled and the claim shall be forfeited.</p>
            <p>2. I/We agree to provide additional information to NEM Insurance, if required.</p>
            <p>3. I/We agree to submit all required and requested for documents and NEM Insurance shall not be held responsible for any delay in settlement of claim due to non-fulfillment of requirements.</p>
          </div>
        </div>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="agreeToDataPrivacy">
              <input
                type="checkbox"
                {...register('agreeToDataPrivacy')}
                className="mr-2"
              />
              I agree to the data privacy policy and declaration *
            </Label>
            {errors.agreeToDataPrivacy && <p className="text-sm text-red-600">{errors.agreeToDataPrivacy.message}</p>}
          </div>
          
          <div>
            <Label htmlFor="signature">Digital Signature *</Label>
            <Input {...register('signature')} placeholder="Type your full name as signature" />
            {errors.signature && <p className="text-sm text-red-600">{errors.signature.message}</p>}
          </div>
          
          <div>
            <Label>Date</Label>
            <Input value={new Date().toLocaleDateString()} disabled />
          </div>
        </div>
      </div>
    </FormSection>
  );

  const steps = [
    {
      id: 'policy',
      title: 'Policy Details',
      component: <PolicyDetailsStep />,
      isValid: !errors.policyNumber && !errors.periodOfCoverFrom && !errors.periodOfCoverTo
    },
    {
      id: 'insured',
      title: 'Insured Details',
      component: <InsuredDetailsStep />,
      isValid: !errors.insuredName && !errors.insuredAddress && !errors.insuredPhone && !errors.insuredEmail
    },
    {
      id: 'injured-party',
      title: 'Injured Party Details',
      component: <InjuredPartyDetailsStep />,
      isValid: !errors.injuredPartyName && !errors.injuredPartyAge && !errors.injuredPartyAddress && !errors.averageMonthlyEarnings && !errors.occupation && !errors.dateOfEmployment && !errors.maritalStatus && !errors.numberOfChildren && !errors.previousAccidents
    },
    {
      id: 'injury',
      title: 'Injury Details',
      component: <InjuryDetailsStep />,
      isValid: !errors.natureOfInjuries && !errors.supervisorName && !errors.supervisorPosition
    },
    {
      id: 'accident',
      title: 'Accident Details',
      component: <AccidentDetailsStep />,
      isValid: !errors.accidentDate && !errors.accidentTime && !errors.accidentPlace && !errors.dateReported && !errors.reportedBy && !errors.dateStoppedWork && !errors.descriptionOfWork && !errors.howAccidentOccurred && !errors.soberOrIntoxicated
    },
    {
      id: 'medical',
      title: 'Medical',
      component: <MedicalStep />,
      isValid: !errors.receivingTreatment && !errors.doctorName && !errors.doctorAddress
    },
    {
      id: 'disablement',
      title: 'Disablement',
      component: <DisablementStep />,
      isValid: !errors.totallyDisabled && !errors.dateStoppedWorking && !errors.estimatedDurationOfDisablement && !errors.ableToDoAnyDuties && !errors.claimMadeOnYou
    },
    {
      id: 'witnesses',
      title: 'Witnesses',
      component: <WitnessesStep />,
      isValid: true
    },
    {
      id: 'other-insurers',
      title: 'Other Insurers',
      component: <OtherInsurersStep />,
      isValid: true
    },
    {
      id: 'earnings',
      title: 'Statement of Earnings',
      component: <EarningsStep />,
      isValid: !errors.earnings
    },
    {
      id: 'privacy',
      title: 'Data Privacy & Declaration',
      component: <DataPrivacyStep />,
      isValid: !errors.agreeToDataPrivacy && !errors.signature
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Employers Liability Claim Form</h1>
          <p className="text-gray-600 mt-2">Please provide accurate information for your claim submission</p>
        </div>

        <MultiStepForm
          steps={steps}
          onSubmit={handleSubmit(onSubmit)}
          isSubmitting={isSubmitting}
          submitButtonText="Submit Claim"
          formMethods={{ register, handleSubmit, formState: { errors }, setValue, watch, control }}
        />

        <AuthRequiredSubmit
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onProceedToSignup={() => {
            window.location.href = '/signup';
          }}
          formType="Employers Liability Claim"
        />
      </div>
    </div>
  );
};

export default EmployersLiabilityClaim;
