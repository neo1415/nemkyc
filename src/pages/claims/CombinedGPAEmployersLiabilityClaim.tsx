
import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { format } from 'date-fns';
import { Plus, Trash2, Calendar, Phone, Upload, Check, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../firebase/config';
import { useToast } from '../../hooks/use-toast';

import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Checkbox } from '../../components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '../../components/ui/radio-group';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../../components/ui/alert-dialog';

import MultiStepForm from '../../components/common/MultiStepForm';
import FormSection from '../../components/common/FormSection';
import FileUpload from '../../components/common/FileUpload';
import PhoneInput from '../../components/common/PhoneInput';
import AuthRequiredSubmit from '../../components/common/AuthRequiredSubmit';

import { CombinedGPAEmployersLiabilityClaimData, Witness, EarningsMonth } from '../../types';
import { combinedGPAEmployersLiabilityClaimSchema } from '../../utils/validation';

const CombinedGPAEmployersLiabilityClaim: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Initialize form with validation
  const form = useForm<CombinedGPAEmployersLiabilityClaimData>({
    resolver: yupResolver(combinedGPAEmployersLiabilityClaimSchema),
    defaultValues: {
      policyNumber: '',
      periodOfCoverFrom: '',
      periodOfCoverTo: '',
      insuredName: '',
      insuredAddress: '',
      insuredPhone: '',
      insuredEmail: '',
      injuredPartyName: '',
      injuredPartyAge: 0,
      injuredPartyAddress: '',
      averageMonthlyEarnings: 0,
      occupation: '',
      dateOfEmployment: '',
      notDirectlyEmployed: false,
      employerName: '',
      employerAddress: '',
      durationEmployed: '',
      maritalStatus: '',
      previousAccidents: false,
      previousAccidentsDetails: '',
      natureOfInjuries: '',
      machineryInvolved: '',
      accidentDate: '',
      accidentTime: '',
      accidentPlace: '',
      dateReported: '',
      dateTimeStoppedWork: '',
      workAtTime: '',
      howItOccurred: '',
      receivingTreatment: false,
      hospitalName: '',
      hospitalAddress: '',
      stillInHospital: false,
      dischargeDate: '',
      ableToDoduties: false,
      dutiesDetails: '',
      dateNatureResumedWork: '',
      doctorName: '',
      totallyDisabled: false,
      estimatedDuration: '',
      witnesses: [],
      otherInsurerName: '',
      otherInsurerAddress: '',
      otherInsurerPolicyNumber: '',
      earnings: Array.from({ length: 12 }, (_, i) => ({
        monthEnding: format(new Date(2024, i, 1), 'MMM yyyy'),
        wagesAndBonus: 0,
        monthlyAllowances: 0
      })),
      agreeToDataPrivacy: false,
      signature: ''
    }
  });

  const { control, watch, setValue, trigger, formState: { errors, isValid } } = form;

  // Field arrays for dynamic sections
  const { fields: witnessFields, append: addWitness, remove: removeWitness } = useFieldArray({
    control,
    name: 'witnesses'
  });

  const { fields: earningsFields, update: updateEarnings } = useFieldArray({
    control,
    name: 'earnings'
  });

  // Watch form values for conditional rendering
  const watchedValues = watch();

  // Auto-save to localStorage
  useEffect(() => {
    const subscription = watch((data) => {
      const formData = {
        data,
        timestamp: Date.now(),
        expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days
      };
      localStorage.setItem('combinedGPAEmployersLiabilityClaimDraft', JSON.stringify(formData));
    });
    return () => subscription.unsubscribe();
  }, [watch]);

  // Load from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem('combinedGPAEmployersLiabilityClaimDraft');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (parsed.expiresAt > Date.now()) {
          Object.keys(parsed.data).forEach(key => {
            if (parsed.data[key] !== undefined) {
              setValue(key as keyof CombinedGPAEmployersLiabilityClaimData, parsed.data[key]);
            }
          });
        } else {
          localStorage.removeItem('combinedGPAEmployersLiabilityClaimDraft');
        }
      } catch (error) {
        console.error('Error loading saved data:', error);
      }
    }
  }, [setValue]);

  const handleSubmit = async (data: CombinedGPAEmployersLiabilityClaimData) => {
    try {
      setIsSubmitting(true);

      // Save to Firestore
      const docRef = await addDoc(collection(db, 'combinedGPAEmployersLiabilityClaims'), {
        ...data,
        submittedAt: new Date(),
        status: 'pending'
      });

      console.log('Claim submitted with ID:', docRef.id);

      // Clear localStorage
      localStorage.removeItem('combinedGPAEmployersLiabilityClaimDraft');

      // Show success
      setShowSummary(false);
      setShowSuccess(true);

      toast({
        title: 'Claim Submitted Successfully',
        description: 'Your Combined GPA & Employers Liability claim has been submitted for processing.',
      });

    } catch (error) {
      console.error('Error submitting claim:', error);
      toast({
        title: 'Submission Error',
        description: 'There was an error submitting your claim. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 1: Policy Details
  const PolicyDetailsStep = () => (
    <FormSection title="Policy Details" description="Enter your policy information">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="policyNumber">Policy Number *</Label>
          <Input
            id="policyNumber"
            {...form.register('policyNumber')}
            className={errors.policyNumber ? 'border-red-500' : ''}
          />
          {errors.policyNumber && (
            <p className="text-sm text-red-600">{errors.policyNumber.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="periodOfCoverFrom">Period of Cover From *</Label>
          <Input
            id="periodOfCoverFrom"
            type="date"
            {...form.register('periodOfCoverFrom')}
            className={errors.periodOfCoverFrom ? 'border-red-500' : ''}
          />
          {errors.periodOfCoverFrom && (
            <p className="text-sm text-red-600">{errors.periodOfCoverFrom.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="periodOfCoverTo">Period of Cover To *</Label>
          <Input
            id="periodOfCoverTo"
            type="date"
            {...form.register('periodOfCoverTo')}
            className={errors.periodOfCoverTo ? 'border-red-500' : ''}
          />
          {errors.periodOfCoverTo && (
            <p className="text-sm text-red-600">{errors.periodOfCoverTo.message}</p>
          )}
        </div>
      </div>
    </FormSection>
  );

  // Step 2: Insured Details
  const InsuredDetailsStep = () => (
    <FormSection title="Insured Details" description="Details of the insured party">
      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="insuredName">Name *</Label>
          <Input
            id="insuredName"
            {...form.register('insuredName')}
            className={errors.insuredName ? 'border-red-500' : ''}
          />
          {errors.insuredName && (
            <p className="text-sm text-red-600">{errors.insuredName.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="insuredAddress">Address *</Label>
          <Textarea
            id="insuredAddress"
            {...form.register('insuredAddress')}
            className={errors.insuredAddress ? 'border-red-500' : ''}
            rows={3}
          />
          {errors.insuredAddress && (
            <p className="text-sm text-red-600">{errors.insuredAddress.message}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="insuredPhone">Phone *</Label>
            <PhoneInput
              value={watchedValues.insuredPhone || ''}
              onChange={(value) => setValue('insuredPhone', value)}
              error={errors.insuredPhone?.message}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="insuredEmail">Email *</Label>
            <Input
              id="insuredEmail"
              type="email"
              {...form.register('insuredEmail')}
              className={errors.insuredEmail ? 'border-red-500' : ''}
            />
            {errors.insuredEmail && (
              <p className="text-sm text-red-600">{errors.insuredEmail.message}</p>
            )}
          </div>
        </div>
      </div>
    </FormSection>
  );

  // Step 3: Injured Party Details
  const InjuredPartyDetailsStep = () => (
    <FormSection title="Injured Party Details" description="Details of the injured party">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="injuredPartyName">Name *</Label>
            <Input
              id="injuredPartyName"
              {...form.register('injuredPartyName')}
              className={errors.injuredPartyName ? 'border-red-500' : ''}
            />
            {errors.injuredPartyName && (
              <p className="text-sm text-red-600">{errors.injuredPartyName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="injuredPartyAge">Age *</Label>
            <Input
              id="injuredPartyAge"
              type="number"
              {...form.register('injuredPartyAge', { valueAsNumber: true })}
              className={errors.injuredPartyAge ? 'border-red-500' : ''}
            />
            {errors.injuredPartyAge && (
              <p className="text-sm text-red-600">{errors.injuredPartyAge.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="injuredPartyAddress">Address *</Label>
          <Textarea
            id="injuredPartyAddress"
            {...form.register('injuredPartyAddress')}
            className={errors.injuredPartyAddress ? 'border-red-500' : ''}
            rows={3}
          />
          {errors.injuredPartyAddress && (
            <p className="text-sm text-red-600">{errors.injuredPartyAddress.message}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="averageMonthlyEarnings">Average Monthly Earnings *</Label>
            <Input
              id="averageMonthlyEarnings"
              type="number"
              step="0.01"
              {...form.register('averageMonthlyEarnings', { valueAsNumber: true })}
              className={errors.averageMonthlyEarnings ? 'border-red-500' : ''}
            />
            {errors.averageMonthlyEarnings && (
              <p className="text-sm text-red-600">{errors.averageMonthlyEarnings.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="occupation">Occupation *</Label>
            <Input
              id="occupation"
              {...form.register('occupation')}
              className={errors.occupation ? 'border-red-500' : ''}
            />
            {errors.occupation && (
              <p className="text-sm text-red-600">{errors.occupation.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="dateOfEmployment">Date of Employment *</Label>
          <Input
            id="dateOfEmployment"
            type="date"
            {...form.register('dateOfEmployment')}
            className={errors.dateOfEmployment ? 'border-red-500' : ''}
          />
          {errors.dateOfEmployment && (
            <p className="text-sm text-red-600">{errors.dateOfEmployment.message}</p>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="notDirectlyEmployed"
              checked={watchedValues.notDirectlyEmployed}
              onCheckedChange={(checked) => setValue('notDirectlyEmployed', checked as boolean)}
            />
            <Label htmlFor="notDirectlyEmployed">Not directly employed by you</Label>
          </div>

          {watchedValues.notDirectlyEmployed && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 ml-6">
              <div className="space-y-2">
                <Label htmlFor="employerName">Employer's Name *</Label>
                <Input
                  id="employerName"
                  {...form.register('employerName')}
                  className={errors.employerName ? 'border-red-500' : ''}
                />
                {errors.employerName && (
                  <p className="text-sm text-red-600">{errors.employerName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="employerAddress">Employer's Address *</Label>
                <Textarea
                  id="employerAddress"
                  {...form.register('employerAddress')}
                  className={errors.employerAddress ? 'border-red-500' : ''}
                  rows={2}
                />
                {errors.employerAddress && (
                  <p className="text-sm text-red-600">{errors.employerAddress.message}</p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="durationEmployed">Duration Employed *</Label>
            <Input
              id="durationEmployed"
              {...form.register('durationEmployed')}
              placeholder="e.g., 2 years 3 months"
              className={errors.durationEmployed ? 'border-red-500' : ''}
            />
            {errors.durationEmployed && (
              <p className="text-sm text-red-600">{errors.durationEmployed.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="maritalStatus">Marital Status *</Label>
            <Select onValueChange={(value) => setValue('maritalStatus', value)}>
              <SelectTrigger className={errors.maritalStatus ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select marital status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="single">Single</SelectItem>
                <SelectItem value="married">Married</SelectItem>
                <SelectItem value="divorced">Divorced</SelectItem>
                <SelectItem value="widowed">Widowed</SelectItem>
              </SelectContent>
            </Select>
            {errors.maritalStatus && (
              <p className="text-sm text-red-600">{errors.maritalStatus.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <Label>Previous Accidents *</Label>
          <RadioGroup
            value={watchedValues.previousAccidents ? 'yes' : 'no'}
            onValueChange={(value) => setValue('previousAccidents', value === 'yes')}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="yes" id="previousAccidents-yes" />
              <Label htmlFor="previousAccidents-yes">Yes</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="no" id="previousAccidents-no" />
              <Label htmlFor="previousAccidents-no">No</Label>
            </div>
          </RadioGroup>

          {watchedValues.previousAccidents && (
            <div className="space-y-2">
              <Label htmlFor="previousAccidentsDetails">Details of Previous Accidents *</Label>
              <Textarea
                id="previousAccidentsDetails"
                {...form.register('previousAccidentsDetails')}
                className={errors.previousAccidentsDetails ? 'border-red-500' : ''}
                rows={3}
              />
              {errors.previousAccidentsDetails && (
                <p className="text-sm text-red-600">{errors.previousAccidentsDetails.message}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </FormSection>
  );

  // Step 4: Injury Details
  const InjuryDetailsStep = () => (
    <FormSection title="Injury Details" description="Details about the injury">
      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="natureOfInjuries">Nature of Injuries *</Label>
          <Textarea
            id="natureOfInjuries"
            {...form.register('natureOfInjuries')}
            className={errors.natureOfInjuries ? 'border-red-500' : ''}
            rows={4}
            placeholder="Describe the nature and extent of injuries"
          />
          {errors.natureOfInjuries && (
            <p className="text-sm text-red-600">{errors.natureOfInjuries.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="machineryInvolved">Machinery Involved (if any)</Label>
          <Textarea
            id="machineryInvolved"
            {...form.register('machineryInvolved')}
            rows={3}
            placeholder="Describe any machinery, equipment, or tools involved"
          />
        </div>
      </div>
    </FormSection>
  );

  // Step 5: Accident Details
  const AccidentDetailsStep = () => (
    <FormSection title="Accident Details" description="Details about how the accident occurred">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="accidentDate">Accident Date *</Label>
            <Input
              id="accidentDate"
              type="date"
              {...form.register('accidentDate')}
              className={errors.accidentDate ? 'border-red-500' : ''}
            />
            {errors.accidentDate && (
              <p className="text-sm text-red-600">{errors.accidentDate.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="accidentTime">Time *</Label>
            <Input
              id="accidentTime"
              type="time"
              {...form.register('accidentTime')}
              className={errors.accidentTime ? 'border-red-500' : ''}
            />
            {errors.accidentTime && (
              <p className="text-sm text-red-600">{errors.accidentTime.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="accidentPlace">Place *</Label>
          <Textarea
            id="accidentPlace"
            {...form.register('accidentPlace')}
            className={errors.accidentPlace ? 'border-red-500' : ''}
            rows={3}
            placeholder="Describe the exact location where the accident occurred"
          />
          {errors.accidentPlace && (
            <p className="text-sm text-red-600">{errors.accidentPlace.message}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="dateReported">Date Reported *</Label>
            <Input
              id="dateReported"
              type="date"
              {...form.register('dateReported')}
              className={errors.dateReported ? 'border-red-500' : ''}
            />
            {errors.dateReported && (
              <p className="text-sm text-red-600">{errors.dateReported.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="dateTimeStoppedWork">Date/Time Stopped Work *</Label>
            <Input
              id="dateTimeStoppedWork"
              type="datetime-local"
              {...form.register('dateTimeStoppedWork')}
              className={errors.dateTimeStoppedWork ? 'border-red-500' : ''}
            />
            {errors.dateTimeStoppedWork && (
              <p className="text-sm text-red-600">{errors.dateTimeStoppedWork.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="workAtTime">Work at Time *</Label>
          <Textarea
            id="workAtTime"
            {...form.register('workAtTime')}
            className={errors.workAtTime ? 'border-red-500' : ''}
            rows={3}
            placeholder="What work was being performed at the time of the accident?"
          />
          {errors.workAtTime && (
            <p className="text-sm text-red-600">{errors.workAtTime.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="howItOccurred">How It Occurred *</Label>
          <Textarea
            id="howItOccurred"
            {...form.register('howItOccurred')}
            className={errors.howItOccurred ? 'border-red-500' : ''}
            rows={4}
            placeholder="Provide a detailed description of how the accident occurred"
          />
          {errors.howItOccurred && (
            <p className="text-sm text-red-600">{errors.howItOccurred.message}</p>
          )}
        </div>
      </div>
    </FormSection>
  );

  // Step 6: Medical
  const MedicalStep = () => (
    <FormSection title="Medical" description="Medical treatment information">
      <div className="space-y-6">
        <div className="space-y-4">
          <Label>Receiving Treatment *</Label>
          <RadioGroup
            value={watchedValues.receivingTreatment ? 'yes' : 'no'}
            onValueChange={(value) => setValue('receivingTreatment', value === 'yes')}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="yes" id="receivingTreatment-yes" />
              <Label htmlFor="receivingTreatment-yes">Yes</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="no" id="receivingTreatment-no" />
              <Label htmlFor="receivingTreatment-no">No</Label>
            </div>
          </RadioGroup>

          {watchedValues.receivingTreatment && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 ml-6">
              <div className="space-y-2">
                <Label htmlFor="hospitalName">Hospital Name *</Label>
                <Input
                  id="hospitalName"
                  {...form.register('hospitalName')}
                  className={errors.hospitalName ? 'border-red-500' : ''}
                />
                {errors.hospitalName && (
                  <p className="text-sm text-red-600">{errors.hospitalName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="hospitalAddress">Hospital Address *</Label>
                <Textarea
                  id="hospitalAddress"
                  {...form.register('hospitalAddress')}
                  className={errors.hospitalAddress ? 'border-red-500' : ''}
                  rows={2}
                />
                {errors.hospitalAddress && (
                  <p className="text-sm text-red-600">{errors.hospitalAddress.message}</p>
                )}
              </div>
            </div>
          )}
        </div>

        {watchedValues.receivingTreatment && (
          <div className="space-y-4">
            <Label>Still in Hospital? *</Label>
            <RadioGroup
              value={watchedValues.stillInHospital ? 'yes' : 'no'}
              onValueChange={(value) => setValue('stillInHospital', value === 'yes')}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id="stillInHospital-yes" />
                <Label htmlFor="stillInHospital-yes">Yes</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="stillInHospital-no" />
                <Label htmlFor="stillInHospital-no">No</Label>
              </div>
            </RadioGroup>

            {!watchedValues.stillInHospital && (
              <div className="space-y-2 ml-6">
                <Label htmlFor="dischargeDate">Discharge Date *</Label>
                <Input
                  id="dischargeDate"
                  type="date"
                  {...form.register('dischargeDate')}
                  className={errors.dischargeDate ? 'border-red-500' : ''}
                />
                {errors.dischargeDate && (
                  <p className="text-sm text-red-600">{errors.dischargeDate.message}</p>
                )}
              </div>
            )}
          </div>
        )}

        <div className="space-y-4">
          <Label>Able to Do Duties? *</Label>
          <RadioGroup
            value={watchedValues.ableToDoduties ? 'yes' : 'no'}
            onValueChange={(value) => setValue('ableToDoduties', value === 'yes')}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="yes" id="ableToDoduties-yes" />
              <Label htmlFor="ableToDoduties-yes">Yes</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="no" id="ableToDoduties-no" />
              <Label htmlFor="ableToDoduties-no">No</Label>
            </div>
          </RadioGroup>

          {watchedValues.ableToDoduties && (
            <div className="space-y-2 ml-6">
              <Label htmlFor="dutiesDetails">Details *</Label>
              <Textarea
                id="dutiesDetails"
                {...form.register('dutiesDetails')}
                className={errors.dutiesDetails ? 'border-red-500' : ''}
                rows={3}
                placeholder="Describe what duties can be performed"
              />
              {errors.dutiesDetails && (
                <p className="text-sm text-red-600">{errors.dutiesDetails.message}</p>
              )}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="dateNatureResumedWork">Date and Nature of Resumed Work</Label>
          <Textarea
            id="dateNatureResumedWork"
            {...form.register('dateNatureResumedWork')}
            rows={2}
            placeholder="When did the injured party resume work and in what capacity?"
          />
        </div>
      </div>
    </FormSection>
  );

  // Step 7: Doctor Details
  const DoctorDetailsStep = () => (
    <FormSection title="Doctor Details" description="Attending doctor information">
      <div className="space-y-2">
        <Label htmlFor="doctorName">Name of Doctor *</Label>
        <Input
          id="doctorName"
          {...form.register('doctorName')}
          className={errors.doctorName ? 'border-red-500' : ''}
          placeholder="Full name of attending doctor"
        />
        {errors.doctorName && (
          <p className="text-sm text-red-600">{errors.doctorName.message}</p>
        )}
      </div>
    </FormSection>
  );

  // Step 8: Disablement
  const DisablementStep = () => (
    <FormSection title="Disablement" description="Information about disablement">
      <div className="space-y-6">
        <div className="space-y-4">
          <Label>Totally Disabled? *</Label>
          <RadioGroup
            value={watchedValues.totallyDisabled ? 'yes' : 'no'}
            onValueChange={(value) => setValue('totallyDisabled', value === 'yes')}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="yes" id="totallyDisabled-yes" />
              <Label htmlFor="totallyDisabled-yes">Yes</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="no" id="totallyDisabled-no" />
              <Label htmlFor="totallyDisabled-no">No</Label>
            </div>
          </RadioGroup>
        </div>

        <div className="space-y-2">
          <Label htmlFor="estimatedDuration">Estimated Duration *</Label>
          <Input
            id="estimatedDuration"
            {...form.register('estimatedDuration')}
            className={errors.estimatedDuration ? 'border-red-500' : ''}
            placeholder="e.g., 6 weeks, permanent, unknown"
          />
          {errors.estimatedDuration && (
            <p className="text-sm text-red-600">{errors.estimatedDuration.message}</p>
          )}
        </div>
      </div>
    </FormSection>
  );

  // Step 9: Witnesses
  const WitnessesStep = () => (
    <FormSection title="Witnesses" description="Add witness information">
      <div className="space-y-6">
        {witnessFields.map((field, index) => (
          <Card key={field.id} className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-medium">Witness {index + 1}</h4>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => removeWitness(index)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor={`witnesses.${index}.name`}>Name *</Label>
                <Input
                  {...form.register(`witnesses.${index}.name` as const)}
                  className={errors.witnesses?.[index]?.name ? 'border-red-500' : ''}
                />
                {errors.witnesses?.[index]?.name && (
                  <p className="text-sm text-red-600">{errors.witnesses[index]?.name?.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor={`witnesses.${index}.phone`}>Phone</Label>
                <PhoneInput
                  value={watchedValues.witnesses?.[index]?.phone || ''}
                  onChange={(value) => setValue(`witnesses.${index}.phone`, value)}
                />
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <Label htmlFor={`witnesses.${index}.address`}>Address *</Label>
              <Textarea
                {...form.register(`witnesses.${index}.address` as const)}
                className={errors.witnesses?.[index]?.address ? 'border-red-500' : ''}
                rows={2}
              />
              {errors.witnesses?.[index]?.address && (
                <p className="text-sm text-red-600">{errors.witnesses[index]?.address?.message}</p>
              )}
            </div>
          </Card>
        ))}

        <Button
          type="button"
          variant="outline"
          onClick={() => addWitness({ name: '', address: '', phone: '' })}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Witness
        </Button>
      </div>
    </FormSection>
  );

  // Step 10: Other Insurers
  const OtherInsurersStep = () => (
    <FormSection title="Other Insurers" description="Information about other insurance coverage">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="otherInsurerName">Insurer Name</Label>
          <Input
            id="otherInsurerName"
            {...form.register('otherInsurerName')}
            placeholder="Name of other insurance company"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="otherInsurerPolicyNumber">Policy Number</Label>
          <Input
            id="otherInsurerPolicyNumber"
            {...form.register('otherInsurerPolicyNumber')}
            placeholder="Other policy number"
          />
        </div>

        <div className="md:col-span-2 space-y-2">
          <Label htmlFor="otherInsurerAddress">Insurer Address</Label>
          <Textarea
            id="otherInsurerAddress"
            {...form.register('otherInsurerAddress')}
            rows={3}
            placeholder="Address of other insurance company"
          />
        </div>
      </div>
    </FormSection>
  );

  // Step 11: Statement of Earnings
  const StatementOfEarningsStep = () => (
    <FormSection title="Statement of Earnings" description="12-month earnings statement">
      <div className="space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-300 p-3 text-left">Month Ending</th>
                <th className="border border-gray-300 p-3 text-left">Wages & Bonus</th>
                <th className="border border-gray-300 p-3 text-left">Monthly Allowances</th>
              </tr>
            </thead>
            <tbody>
              {earningsFields.map((field, index) => (
                <tr key={field.id}>
                  <td className="border border-gray-300 p-3">
                    <Input
                      {...form.register(`earnings.${index}.monthEnding` as const)}
                      className={errors.earnings?.[index]?.monthEnding ? 'border-red-500' : ''}
                      placeholder="MMM YYYY"
                    />
                  </td>
                  <td className="border border-gray-300 p-3">
                    <Input
                      type="number"
                      step="0.01"
                      {...form.register(`earnings.${index}.wagesAndBonus` as const, { valueAsNumber: true })}
                      className={errors.earnings?.[index]?.wagesAndBonus ? 'border-red-500' : ''}
                      placeholder="0.00"
                    />
                  </td>
                  <td className="border border-gray-300 p-3">
                    <Input
                      type="number"
                      step="0.01"
                      {...form.register(`earnings.${index}.monthlyAllowances` as const, { valueAsNumber: true })}
                      className={errors.earnings?.[index]?.monthlyAllowances ? 'border-red-500' : ''}
                      placeholder="0.00"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {errors.earnings && (
          <p className="text-sm text-red-600">Please complete all 12 months of earnings data</p>
        )}
      </div>
    </FormSection>
  );

  // Step 12: Data Privacy
  const DataPrivacyStep = () => (
    <FormSection title="Data Privacy" description="Privacy policy and data usage">
      <div className="space-y-6">
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="font-semibold mb-4">Data Privacy</h3>
          <div className="space-y-3 text-sm">
            <p>i. Your data will solemnly be used for the purposes of this business contract and also to enable us reach you with the updates about our products and services.</p>
            <p>ii. Please note that your personal data will be treated with utmost respect and is well secured as required by Nigeria Data Protection Regulations 2019.</p>
            <p>iii. Your personal data shall not be shared with or sold to any third-party without your consent unless we are compelled by law or regulator.</p>
          </div>
        </div>
      </div>
    </FormSection>
  );

  // Step 13: Declaration & Signature
  const DeclarationStep = () => (
    <FormSection title="Declaration & Signature" description="Final declaration and signature">
      <div className="space-y-6">
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="font-semibold mb-4">Declaration</h3>
          <div className="space-y-3 text-sm">
            <p>1. I/We declare to the best of my/our knowledge and belief that the information given on this form is true in every respect and agree that if I/we have made any false or fraudulent statement, be it suppression or concealment, the policy shall be cancelled and the claim shall be forfeited.</p>
            <p>2. I/We agree to provide additional information to NEM Insurance, if required.</p>
            <p>3. I/We agree to submit all required and requested for documents and NEM Insurance shall not be held responsible for any delay in settlement of claim due to non-fulfillment of requirements.</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="agreeToDataPrivacy"
              checked={watchedValues.agreeToDataPrivacy}
              onCheckedChange={(checked) => setValue('agreeToDataPrivacy', checked as boolean)}
            />
            <Label htmlFor="agreeToDataPrivacy">
              I agree to the declaration and data privacy policy *
            </Label>
          </div>
          {errors.agreeToDataPrivacy && (
            <p className="text-sm text-red-600">{errors.agreeToDataPrivacy.message}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="signature">Digital Signature *</Label>
            <Input
              id="signature"
              {...form.register('signature')}
              className={errors.signature ? 'border-red-500' : ''}
              placeholder="Type your full name as signature"
            />
            {errors.signature && (
              <p className="text-sm text-red-600">{errors.signature.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="signatureDate">Date</Label>
            <Input
              id="signatureDate"
              type="date"
              value={format(new Date(), 'yyyy-MM-dd')}
              readOnly
              className="bg-gray-100"
            />
          </div>
        </div>

        {watchedValues.agreeToDataPrivacy && watchedValues.signature && (
          <div className="mt-6">
            <Button
              type="button"
              onClick={() => setShowSummary(true)}
              className="w-full"
              size="lg"
            >
              Review Claim Before Submission
            </Button>
          </div>
        )}
      </div>
    </FormSection>
  );

  // Summary Modal
  const SummaryModal = () => (
    <AlertDialog open={showSummary} onOpenChange={setShowSummary}>
      <AlertDialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <AlertDialogHeader>
          <AlertDialogTitle>Review Your Combined GPA & Employers Liability Claim</AlertDialogTitle>
          <AlertDialogDescription>
            Please review all information before final submission. You can go back to edit if needed.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-semibold">Policy Details</h4>
              <p>Policy Number: {watchedValues.policyNumber}</p>
              <p>Period: {watchedValues.periodOfCoverFrom} to {watchedValues.periodOfCoverTo}</p>
            </div>
            
            <div>
              <h4 className="font-semibold">Insured</h4>
              <p>{watchedValues.insuredName}</p>
              <p>{watchedValues.insuredEmail}</p>
              <p>{watchedValues.insuredPhone}</p>
            </div>

            <div>
              <h4 className="font-semibold">Injured Party</h4>
              <p>{watchedValues.injuredPartyName}, Age: {watchedValues.injuredPartyAge}</p>
              <p>Occupation: {watchedValues.occupation}</p>
              <p>Monthly Earnings: {watchedValues.averageMonthlyEarnings}</p>
            </div>

            <div>
              <h4 className="font-semibold">Accident</h4>
              <p>Date: {watchedValues.accidentDate}</p>
              <p>Time: {watchedValues.accidentTime}</p>
              <p>Place: {watchedValues.accidentPlace}</p>
            </div>
          </div>

          <div>
            <h4 className="font-semibold">Declaration</h4>
            <p className="text-sm">✓ Agreed to terms and data privacy policy</p>
            <p className="text-sm">Signature: {watchedValues.signature}</p>
            <p className="text-sm">Date: {format(new Date(), 'PPP')}</p>
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Go Back to Edit</AlertDialogCancel>
          <AlertDialogAction asChild>
            <AuthRequiredSubmit onSubmit={() => form.handleSubmit(handleSubmit)()} isSubmitting={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit Claim'}
            </AuthRequiredSubmit>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  // Success Modal
  const SuccessModal = () => (
    <AlertDialog open={showSuccess} onOpenChange={setShowSuccess}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center space-x-2">
            <div className="bg-green-100 p-2 rounded-full">
              <Check className="h-6 w-6 text-green-600" />
            </div>
            <AlertDialogTitle>Claim Submitted Successfully!</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="space-y-4">
            <p>Your Combined GPA & Employers Liability claim has been submitted and is now being processed.</p>
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">What happens next?</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• You will receive an email confirmation shortly</li>
                <li>• Our claims team will review your submission</li>
                <li>• We may contact you for additional information</li>
                <li>• You will be notified of the claim status updates</li>
              </ul>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Need Help?</h4>
              <p className="text-sm">For claim status inquiries, contact:</p>
              <p className="text-sm font-medium">claims@neminsurance.com</p>
              <p className="text-sm font-medium">+234-1-234-5678</p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={() => navigate('/claims')}>
            Return to Claims
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  // Form steps configuration
  const steps = [
    {
      id: 'policy-details',
      title: 'Policy Details',
      component: <PolicyDetailsStep />,
      isValid: !errors.policyNumber && !errors.periodOfCoverFrom && !errors.periodOfCoverTo
    },
    {
      id: 'insured-details',
      title: 'Insured Details',
      component: <InsuredDetailsStep />,
      isValid: !errors.insuredName && !errors.insuredAddress && !errors.insuredPhone && !errors.insuredEmail
    },
    {
      id: 'injured-party-details',
      title: 'Injured Party Details',
      component: <InjuredPartyDetailsStep />,
      isValid: !errors.injuredPartyName && !errors.injuredPartyAge && !errors.injuredPartyAddress && !errors.averageMonthlyEarnings && !errors.occupation && !errors.dateOfEmployment && !errors.durationEmployed && !errors.maritalStatus
    },
    {
      id: 'injury-details',
      title: 'Injury Details',
      component: <InjuryDetailsStep />,
      isValid: !errors.natureOfInjuries
    },
    {
      id: 'accident-details',
      title: 'Accident Details',
      component: <AccidentDetailsStep />,
      isValid: !errors.accidentDate && !errors.accidentTime && !errors.accidentPlace && !errors.dateReported && !errors.dateTimeStoppedWork && !errors.workAtTime && !errors.howItOccurred
    },
    {
      id: 'medical',
      title: 'Medical',
      component: <MedicalStep />,
      isValid: true
    },
    {
      id: 'doctor-details',
      title: 'Doctor Details',
      component: <DoctorDetailsStep />,
      isValid: !errors.doctorName
    },
    {
      id: 'disablement',
      title: 'Disablement',
      component: <DisablementStep />,
      isValid: !errors.estimatedDuration
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
      id: 'statement-of-earnings',
      title: 'Statement of Earnings',
      component: <StatementOfEarningsStep />,
      isValid: !errors.earnings
    },
    {
      id: 'data-privacy',
      title: 'Data Privacy',
      component: <DataPrivacyStep />,
      isValid: true
    },
    {
      id: 'declaration',
      title: 'Declaration & Signature',
      component: <DeclarationStep />,
      isValid: !errors.agreeToDataPrivacy && !errors.signature
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Combined GPA & Employers Liability Claim</h1>
          <p className="text-gray-600">Submit your combined claim for processing</p>
        </div>

        <MultiStepForm
          steps={steps}
          onSubmit={() => {}} // Handled by DeclarationStep
          submitButtonText="Submit Claim"
        />

        <SummaryModal />
        <SuccessModal />
      </div>
    </div>
  );
};

export default CombinedGPAEmployersLiabilityClaim;
