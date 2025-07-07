import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useAuth } from '../../contexts/AuthContext';
import { combinedGPAEmployersLiabilityClaimSchema } from '../../utils/validation';
import { CombinedGPAEmployersLiabilityClaimData, Witness, EarningsMonth } from '../../types';
import { useFormDraft } from '../../hooks/useFormDraft';
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
import { FileText, User, UserCheck, AlertTriangle, Calendar, Stethoscope, Users, Building, Plus, Trash2, ClipboardList, Shield } from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { notifySubmission } from '../../services/notificationService';

const CombinedGPAEmployersLiabilityClaim: React.FC = () => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  const { register, handleSubmit, formState: { errors }, setValue, watch, control } = useForm<CombinedGPAEmployersLiabilityClaimData>({
    resolver: yupResolver(combinedGPAEmployersLiabilityClaimSchema),
    defaultValues: {
      insuredEmail: user?.email || '',
      agreeToDataPrivacy: false,
      signature: '',
      witnesses: [],
      earnings: Array.from({ length: 12 }, (_, i) => ({
        monthEnding: '',
        wagesAndBonus: 0,
        monthlyAllowances: 0
      }))
    }
  });

  const { fields: witnessFields, append: appendWitness, remove: removeWitness } = useFieldArray({
    control,
    name: 'witnesses'
  });

  const watchedValues = watch();
  const { saveDraft } = useFormDraft('combined-gpa-employers-liability-claim', { setValue, watch });

  // Auto-save draft
  React.useEffect(() => {
    const subscription = watch((data) => {
      saveDraft(data);
    });
    return () => subscription.unsubscribe();
  }, [watch, saveDraft]);

  const onSubmit = async (data: CombinedGPAEmployersLiabilityClaimData) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    
    setIsSubmitting(true);
    try {
      const submissionId = `claim_combined_gpa_employers_liability_${Date.now()}`;
      
      await setDoc(doc(db, 'submissions', submissionId), {
        id: submissionId,
        userId: user.uid,
        formType: 'combined-gpa-employers-liability-claim',
        data: data,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      await notifySubmission(user, 'Combined GPA & Employers Liability Claim');
      
      toast({
        title: "Claim Submitted",
        description: "Your Combined GPA & Employers Liability claim has been submitted successfully.",
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
        <div>
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
    <FormSection title="Insured Details" icon={<UserCheck className="h-5 w-5" />}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="insuredName">Insured Name *</Label>
          <Input {...register('insuredName')} />
          {errors.insuredName && <p className="text-sm text-red-600">{errors.insuredName.message}</p>}
        </div>
        <div>
          <Label htmlFor="insuredAddress">Insured Address *</Label>
          <Textarea {...register('insuredAddress')} />
          {errors.insuredAddress && <p className="text-sm text-red-600">{errors.insuredAddress.message}</p>}
        </div>
        <div>
          <Label htmlFor="insuredPhone">Insured Phone *</Label>
          <PhoneInput
            label="Insured Phone"
            required
            value={watchedValues.insuredPhone || ''}
            onChange={(value) => setValue('insuredPhone', value)}
            error={errors.insuredPhone?.message}
          />
        </div>
        <div>
          <Label htmlFor="insuredEmail">Insured Email *</Label>
          <Input type="email" {...register('insuredEmail')} />
          {errors.insuredEmail && <p className="text-sm text-red-600">{errors.insuredEmail.message}</p>}
        </div>
      </div>
    </FormSection>
  );

  const InjuredPartyStep = () => (
    <FormSection title="Injured Party Details" icon={<User className="h-5 w-5" />}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="injuredPartyName">Injured Party Name *</Label>
          <Input {...register('injuredPartyName')} />
          {errors.injuredPartyName && <p className="text-sm text-red-600">{errors.injuredPartyName.message}</p>}
        </div>
        <div>
          <Label htmlFor="injuredPartyAge">Injured Party Age *</Label>
          <Input type="number" {...register('injuredPartyAge', { valueAsNumber: true })} />
          {errors.injuredPartyAge && <p className="text-sm text-red-600">{errors.injuredPartyAge.message}</p>}
        </div>
        <div>
          <Label htmlFor="injuredPartyAddress">Injured Party Address *</Label>
          <Textarea {...register('injuredPartyAddress')} />
          {errors.injuredPartyAddress && <p className="text-sm text-red-600">{errors.injuredPartyAddress.message}</p>}
        </div>
        <div>
          <Label htmlFor="averageMonthlyEarnings">Average Monthly Earnings *</Label>
          <Input type="number" {...register('averageMonthlyEarnings', { valueAsNumber: true })} />
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
          <Label htmlFor="notDirectlyEmployed">Not Directly Employed</Label>
          <Checkbox
            id="notDirectlyEmployed"
            checked={watchedValues.notDirectlyEmployed}
            onCheckedChange={(checked) => setValue('notDirectlyEmployed', checked as boolean)}
          />
        </div>
        {watchedValues.notDirectlyEmployed && (
          <>
            <div>
              <Label htmlFor="employerName">Employer Name</Label>
              <Input {...register('employerName')} />
            </div>
            <div>
              <Label htmlFor="employerAddress">Employer Address</Label>
              <Textarea {...register('employerAddress')} />
            </div>
            <div>
              <Label htmlFor="durationEmployed">Duration Employed</Label>
              <Input {...register('durationEmployed')} />
            </div>
          </>
        )}
        <div>
          <Label htmlFor="maritalStatus">Marital Status</Label>
          <Select
            value={watchedValues.maritalStatus}
            onValueChange={(value) => setValue('maritalStatus', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Marital Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="single">Single</SelectItem>
              <SelectItem value="married">Married</SelectItem>
              <SelectItem value="divorced">Divorced</SelectItem>
              <SelectItem value="widowed">Widowed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="previousAccidents">Previous Accidents</Label>
          <Checkbox
            id="previousAccidents"
            checked={watchedValues.previousAccidents}
            onCheckedChange={(checked) => setValue('previousAccidents', checked as boolean)}
          />
        </div>
        {watchedValues.previousAccidents && (
          <div>
            <Label htmlFor="previousAccidentsDetails">Previous Accidents Details</Label>
            <Textarea {...register('previousAccidentsDetails')} />
          </div>
        )}
      </div>
    </FormSection>
  );

  const InjuryDetailsStep = () => (
    <FormSection title="Injury Details" icon={<Stethoscope className="h-5 w-5" />}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="natureOfInjuries">Nature of Injuries *</Label>
          <Textarea {...register('natureOfInjuries')} />
          {errors.natureOfInjuries && <p className="text-sm text-red-600">{errors.natureOfInjuries.message}</p>}
        </div>
        <div>
          <Label htmlFor="machineryInvolved">Machinery Involved</Label>
          <Input {...register('machineryInvolved')} />
        </div>
      </div>
    </FormSection>
  );

  const AccidentDetailsStep = () => (
    <FormSection title="Accident Details" icon={<AlertTriangle className="h-5 w-5" />}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="accidentDate">Accident Date *</Label>
          <Input type="date" {...register('accidentDate')} />
          {errors.accidentDate && <p className="text-sm text-red-600">{errors.accidentDate.message}</p>}
        </div>
        <div>
          <Label htmlFor="accidentTime">Accident Time *</Label>
          <Input type="time" {...register('accidentTime')} />
          {errors.accidentTime && <p className="text-sm text-red-600">{errors.accidentTime.message}</p>}
        </div>
        <div>
          <Label htmlFor="accidentPlace">Accident Place *</Label>
          <Input {...register('accidentPlace')} />
          {errors.accidentPlace && <p className="text-sm text-red-600">{errors.accidentPlace.message}</p>}
        </div>
        <div>
          <Label htmlFor="dateReported">Date Reported *</Label>
          <Input type="date" {...register('dateReported')} />
          {errors.dateReported && <p className="text-sm text-red-600">{errors.dateReported.message}</p>}
        </div>
        <div>
          <Label htmlFor="dateTimeStoppedWork">Date/Time Stopped Work *</Label>
          <Input type="datetime-local" {...register('dateTimeStoppedWork')} />
          {errors.dateTimeStoppedWork && <p className="text-sm text-red-600">{errors.dateTimeStoppedWork.message}</p>}
        </div>
        <div>
          <Label htmlFor="workAtTime">Work at Time *</Label>
          <Textarea {...register('workAtTime')} />
          {errors.workAtTime && <p className="text-sm text-red-600">{errors.workAtTime.message}</p>}
        </div>
        <div>
          <Label htmlFor="howItOccurred">How It Occurred *</Label>
          <Textarea {...register('howItOccurred')} />
          {errors.howItOccurred && <p className="text-sm text-red-600">{errors.howItOccurred.message}</p>}
        </div>
      </div>
    </FormSection>
  );

  const MedicalStep = () => (
    <FormSection title="Medical" icon={<ClipboardList className="h-5 w-5" />}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="receivingTreatment">Receiving Treatment *</Label>
          <Checkbox
            id="receivingTreatment"
            checked={watchedValues.receivingTreatment}
            onCheckedChange={(checked) => setValue('receivingTreatment', checked as boolean)}
          />
        </div>
        {watchedValues.receivingTreatment && (
          <>
            <div>
              <Label htmlFor="hospitalName">Hospital Name</Label>
              <Input {...register('hospitalName')} />
            </div>
            <div>
              <Label htmlFor="hospitalAddress">Hospital Address</Label>
              <Textarea {...register('hospitalAddress')} />
            </div>
            <div>
              <Label htmlFor="stillInHospital">Still in Hospital</Label>
              <Checkbox
                id="stillInHospital"
                checked={watchedValues.stillInHospital}
                onCheckedChange={(checked) => setValue('stillInHospital', checked as boolean)}
              />
            </div>
            {watchedValues.stillInHospital && (
              <div>
                <Label htmlFor="dischargeDate">Discharge Date</Label>
                <Input type="date" {...register('dischargeDate')} />
              </div>
            )}
            <div>
              <Label htmlFor="ableToDoduties">Able to Do Duties</Label>
              <Checkbox
                id="ableToDoduties"
                checked={watchedValues.ableToDoduties}
                onCheckedChange={(checked) => setValue('ableToDoduties', checked as boolean)}
              />
            </div>
            {watchedValues.ableToDoduties && (
              <div>
                <Label htmlFor="dutiesDetails">Duties Details</Label>
                <Textarea {...register('dutiesDetails')} />
              </div>
            )}
            <div>
              <Label htmlFor="dateNatureResumedWork">Date Nature Resumed Work</Label>
              <Input type="date" {...register('dateNatureResumedWork')} />
            </div>
          </>
        )}
      </div>
    </FormSection>
  );

  const DoctorDetailsStep = () => (
    <FormSection title="Doctor Details" icon={<Calendar className="h-5 w-5" />}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="doctorName">Doctor Name *</Label>
          <Input {...register('doctorName')} />
          {errors.doctorName && <p className="text-sm text-red-600">{errors.doctorName.message}</p>}
        </div>
      </div>
    </FormSection>
  );

  const DisablementStep = () => (
    <FormSection title="Disablement" icon={<Building className="h-5 w-5" />}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="totallyDisabled">Totally Disabled *</Label>
          <Checkbox
            id="totallyDisabled"
            checked={watchedValues.totallyDisabled}
            onCheckedChange={(checked) => setValue('totallyDisabled', checked as boolean)}
          />
        </div>
        {watchedValues.totallyDisabled && (
          <div>
            <Label htmlFor="estimatedDuration">Estimated Duration</Label>
            <Input {...register('estimatedDuration')} />
          </div>
        )}
      </div>
    </FormSection>
  );

  const WitnessesStep = () => (
    <FormSection title="Witnesses" icon={<Users className="h-5 w-5" />}>
      <div className="space-y-6">
        {witnessFields.map((field, index) => (
          <div key={field.id} className="p-4 border rounded-lg space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-medium">Witness {index + 1}</h4>
              {witnessFields.length > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeWitness(index)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Name</Label>
                <Input {...register(`witnesses.${index}.name`)} />
              </div>
              <div>
                <Label>Address</Label>
                <Textarea {...register(`witnesses.${index}.address`)} />
              </div>
            </div>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          onClick={() => appendWitness({ name: '', address: '' })}
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
          <Label htmlFor="otherInsurerName">Other Insurer Name</Label>
          <Input {...register('otherInsurerName')} />
        </div>
        <div>
          <Label htmlFor="otherInsurerAddress">Other Insurer Address</Label>
          <Textarea {...register('otherInsurerAddress')} />
        </div>
        <div>
          <Label htmlFor="otherInsurerPolicyNumber">Other Insurer Policy Number</Label>
          <Input {...register('otherInsurerPolicyNumber')} />
        </div>
      </div>
    </FormSection>
  );

  const EarningsStep = () => (
    <FormSection title="Statement of Earnings" icon={<FileText className="h-5 w-5" />}>
      <div className="space-y-4">
        {Array.from({ length: 12 }).map((_, index) => (
          <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor={`earnings[${index}].monthEnding`}>Month Ending</Label>
              <Input type="date" {...register(`earnings.${index}.monthEnding`)} />
            </div>
            <div>
              <Label htmlFor={`earnings[${index}].wagesAndBonus`}>Wages and Bonus</Label>
              <Input type="number" {...register(`earnings.${index}.wagesAndBonus`, { valueAsNumber: true })} />
            </div>
            <div>
              <Label htmlFor={`earnings[${index}].monthlyAllowances`}>Monthly Allowances</Label>
              <Input type="number" {...register(`earnings.${index}.monthlyAllowances`, { valueAsNumber: true })} />
            </div>
          </div>
        ))}
      </div>
    </FormSection>
  );

  const DataPrivacyStep = () => (
    <FormSection title="Data Privacy & Declaration" icon={<Building className="h-5 w-5" />}>
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
      id: 'policy-details',
      title: 'Policy Details',
      component: <PolicyDetailsStep />,
      isValid: !!watchedValues.policyNumber && !!watchedValues.periodOfCoverFrom && !!watchedValues.periodOfCoverTo
    },
    {
      id: 'insured-details',
      title: 'Insured Details',
      component: <InsuredDetailsStep />,
      isValid: !!watchedValues.insuredName && !!watchedValues.insuredAddress && !!watchedValues.insuredPhone && !!watchedValues.insuredEmail
    },
    {
      id: 'injured-party',
      title: 'Injured Party Details',
      component: <InjuredPartyStep />,
      isValid: !!watchedValues.injuredPartyName && !!watchedValues.injuredPartyAge && !!watchedValues.occupation
    },
    {
      id: 'injury-details',
      title: 'Injury Details',
      component: <InjuryDetailsStep />,
      isValid: !!watchedValues.natureOfInjuries
    },
    {
      id: 'accident-details',
      title: 'Accident Details',
      component: <AccidentDetailsStep />,
      isValid: !!watchedValues.accidentDate && !!watchedValues.accidentTime && !!watchedValues.accidentPlace
    },
    {
      id: 'medical',
      title: 'Medical',
      component: <MedicalStep />,
      isValid: typeof watchedValues.receivingTreatment === 'boolean'
    },
    {
      id: 'doctor-details',
      title: 'Doctor Details',
      component: <DoctorDetailsStep />,
      isValid: !!watchedValues.doctorName
    },
    {
      id: 'disablement',
      title: 'Disablement',
      component: <DisablementStep />,
      isValid: typeof watchedValues.totallyDisabled === 'boolean'
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
      isValid: true
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
          <h1 className="text-3xl font-bold text-gray-900">Combined GPA & Employers Liability Claim</h1>
          <p className="text-gray-600 mt-2">Submit a claim for combined General Personal Accident and Employers Liability coverage</p>
        </div>

        <MultiStepForm
          steps={steps}
          onSubmit={handleSubmit(onSubmit)}
          isSubmitting={isSubmitting}
          submitButtonText="Submit Combined Claim"
        />

        <AuthRequiredSubmit
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onProceedToSignup={() => {
            saveDraft(watchedValues);
            window.location.href = '/signup';
          }}
          formType="Combined GPA & Employers Liability Claim"
        />
      </div>
    </div>
  );
};

export default CombinedGPAEmployersLiabilityClaim;
