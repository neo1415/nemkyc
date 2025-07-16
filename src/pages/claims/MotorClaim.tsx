import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../firebase/config';
import { emailService } from '../../services/emailService';
import { useFormDraft } from '../../hooks/useFormDraft';
import { useToast } from '../../hooks/use-toast';
import * as yup from 'yup';
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

const motorClaimSchema = yup.object().shape({
  policyNumber: yup.string().required('Policy number is required'),
  periodOfCoverFrom: yup.string().required('Start of cover is required'),
  periodOfCoverTo: yup.string().required('End of cover is required'),
  nameCompany: yup.string().required('Name of company is required'),
  title: yup.string().required('Title is required'),
  dateOfBirth: yup.string().required('Date of birth is required'),
  gender: yup.string().required('Gender is required'),
  address: yup.string().required('Address is required'),
  phone: yup.string().required('Phone is required'),
  email: yup.string().email('Must be a valid email').required('Email is required'),
  registrationNumber: yup.string().required('Registration number is required'),
  make: yup.string().required('Make is required'),
  model: yup.string().required('Model is required'),
  year: yup.string().required('Year is required'),
  engineNumber: yup.string().required('Engine number is required'),
  chassisNumber: yup.string().required('Chassis number is required'),
  registeredInYourName: yup.string().required('This field is required'),
  registeredInYourNameDetails: yup.string(),
  ownedSolely: yup.string().required('This field is required'),
  ownedSolelyDetails: yup.string(),
  hirePurchase: yup.string().required('This field is required'),
  hirePurchaseDetails: yup.string(),
  vehicleUsage: yup.string().required('Vehicle usage is required'),
  trailerAttached: yup.string().required('This field is required'),
  damageDescription: yup.string().required('Description of damage is required'),
  inspectionLocation: yup.string().required('Inspection location is required'),
  incidentLocation: yup.string().required('Incident location is required'),
  incidentDate: yup.string().required('Incident date is required'),
  incidentTime: yup.string().required('Incident time is required'),
  policeReported: yup.string().required('Police reported field is required'),
  policeStationDetails: yup.string(),
  incidentDescription: yup.string().required('Description of incident is required'),
  witnesses: yup.array().of(
    yup.object().shape({
      name: yup.string().required('Witness name is required'),
      address: yup.string().required('Witness address is required'),
      phone: yup.string().required('Witness phone is required'),
      isPassenger: yup.boolean()
    })
  ),
  otherVehicleInvolved: yup.string().required('This field is required'),
  otherVehicleRegNumber: yup.string(),
  otherVehicleMakeModel: yup.string(),
  otherDriverName: yup.string(),
  otherDriverPhone: yup.string(),
  otherDriverAddress: yup.string(),
  otherVehicleInjuryDamage: yup.string(),
  agreeToDataPrivacy: yup.boolean().oneOf([true], 'You must agree to data privacy'),
  declarationTrue: yup.boolean().oneOf([true], 'You must declare all info is true'),
  declarationAdditionalInfo: yup.boolean().oneOf([true], 'You must agree to provide more info'),
  declarationDocuments: yup.boolean().oneOf([true], 'You must agree to submit documents'),
  signature: yup.string().required('Signature is required')
});

interface Witness {
  name: string;
  address: string;
  phone: string;
  isPassenger: boolean;
}

interface MotorClaimData {
  policyNumber: string;
  periodOfCoverFrom: string;
  periodOfCoverTo: string;
  nameCompany: string;
  title: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  phone: string;
  email: string;
  registrationNumber: string;
  make: string;
  model: string;
  year: string;
  engineNumber: string;
  chassisNumber: string;
  registeredInYourName: string;
  registeredInYourNameDetails: string;
  ownedSolely: string;
  ownedSolelyDetails: string;
  hirePurchase: string;
  hirePurchaseDetails: string;
  vehicleUsage: string;
  trailerAttached: string;
  damageDescription: string;
  inspectionLocation: string;
  incidentLocation: string;
  incidentDate: string;
  incidentTime: string;
  policeReported: string;
  policeStationDetails: string;
  incidentDescription: string;
  witnesses: Witness[];
  otherVehicleInvolved: string;
  otherVehicleRegNumber: string;
  otherVehicleMakeModel: string;
  otherDriverName: string;
  otherDriverPhone: string;
  otherDriverAddress: string;
  otherVehicleInjuryDamage: string;
  agreeToDataPrivacy: boolean;
  declarationTrue: boolean;
  declarationAdditionalInfo: boolean;
  declarationDocuments: boolean;
  signature: string;
}

const defaultValues: Partial<MotorClaimData> = {
  policyNumber: '',
  periodOfCoverFrom: '',
  periodOfCoverTo: '',
  nameCompany: '',
  title: '',
  dateOfBirth: '',
  gender: '',
  address: '',
  phone: '',
  email: '',
  registrationNumber: '',
  make: '',
  model: '',
  year: '',
  engineNumber: '',
  chassisNumber: '',
  registeredInYourName: '',
  registeredInYourNameDetails: '',
  ownedSolely: '',
  ownedSolelyDetails: '',
  hirePurchase: '',
  hirePurchaseDetails: '',
  vehicleUsage: '',
  trailerAttached: '',
  damageDescription: '',
  inspectionLocation: '',
  incidentLocation: '',
  incidentDate: '',
  incidentTime: '',
  policeReported: '',
  policeStationDetails: '',
  incidentDescription: '',
  witnesses: [],
  otherVehicleInvolved: '',
  otherVehicleRegNumber: '',
  otherVehicleMakeModel: '',
  otherDriverName: '',
  otherDriverPhone: '',
  otherDriverAddress: '',
  otherVehicleInjuryDamage: '',
  agreeToDataPrivacy: false,
  declarationTrue: false,
  declarationAdditionalInfo: false,
  declarationDocuments: false,
  signature: ''
};

const MotorClaim: React.FC = () => {
  const [showSummary, setShowSummary] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formMethods = useForm<MotorClaimData>({
    resolver: yupResolver(motorClaimSchema),
    defaultValues,
    mode: 'onChange'
  });

  const { fields: witnessFields, append: addWitness, remove: removeWitness } = useFieldArray({
    control: formMethods.control,
    name: 'witnesses'
  });

  const { saveDraft, loadDraft, clearDraft } = useFormDraft('motor-claim', formMethods);
  const watchedValues = formMethods.watch();

  useEffect(() => {
    const draft = loadDraft();
    if (draft) {
      Object.keys(draft).forEach((key) => {
        formMethods.setValue(key as keyof MotorClaimData, draft[key]);
      });
    }
  }, [formMethods, loadDraft]);

  useEffect(() => {
    const subscription = formMethods.watch((data) => {
      saveDraft(data);
    });
    return () => subscription.unsubscribe();
  }, [formMethods, saveDraft]);


  const handleSubmit = async (data: MotorClaimData) => {
    setIsSubmitting(true);
    try {
      // Save to Firestore
      const docRef = await addDoc(collection(db, 'motorClaims'), {
        ...data,
        submittedAt: new Date(),
        status: 'submitted'
      });

      clearDraft();
      setShowSummary(false);
      setShowSuccess(true);
      
      toast({
        title: "Claim Submitted Successfully",
        description: "Your motor claim has been submitted and you'll receive a confirmation email shortly.",
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

  const onFinalSubmit = (data: MotorClaimData) => {
    setShowSummary(true);
  };

  const steps = [
    {
      id: 'policy',
      title: 'Policy Details',
      component: (
        <div className="space-y-6">
          <div>
            <Label htmlFor="policyNumber">Policy Number *</Label>
            <Input
              id="policyNumber"
              {...formMethods.register('policyNumber')}
              placeholder="Enter policy number"
            />
            {formMethods.formState.errors.policyNumber && (
              <p className="text-sm text-red-600">{formMethods.formState.errors.policyNumber.message}</p>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="periodOfCoverFrom">Period of Cover From *</Label>
              <Input
                id="periodOfCoverFrom"
                type="date"
                {...formMethods.register('periodOfCoverFrom')}
              />
              {formMethods.formState.errors.periodOfCoverFrom && (
                <p className="text-sm text-red-600">{formMethods.formState.errors.periodOfCoverFrom.message}</p>
              )}
            </div>
            
            <div>
              <Label htmlFor="periodOfCoverTo">Period of Cover To *</Label>
              <Input
                id="periodOfCoverTo"
                type="date"
                {...formMethods.register('periodOfCoverTo')}
              />
              {formMethods.formState.errors.periodOfCoverTo && (
                <p className="text-sm text-red-600">{formMethods.formState.errors.periodOfCoverTo.message}</p>
              )}
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'insured',
      title: 'Insured Details',
      component: (
        <div className="space-y-6">
          <div>
            <Label htmlFor="nameCompany">Name / Company Name *</Label>
            <Input
              id="nameCompany"
              {...formMethods.register('nameCompany')}
              placeholder="Enter your name or company name"
            />
            {formMethods.formState.errors.nameCompany && (
              <p className="text-sm text-red-600">{formMethods.formState.errors.nameCompany.message}</p>
            )}
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Select
                value={watchedValues.title}
                onValueChange={(value) => formMethods.setValue('title', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select title" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Mr">Mr</SelectItem>
                  <SelectItem value="Mrs">Mrs</SelectItem>
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
                {...formMethods.register('dateOfBirth')}
              />
              {formMethods.formState.errors.dateOfBirth && (
                <p className="text-sm text-red-600">{formMethods.formState.errors.dateOfBirth.message}</p>
              )}
            </div>
            
            <div>
              <Label htmlFor="gender">Gender *</Label>
              <Select
                value={watchedValues.gender}
                onValueChange={(value) => formMethods.setValue('gender', value)}
              >
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
              <p className="text-sm text-red-600">{formMethods.formState.errors.address.message}</p>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                {...formMethods.register('phone')}
                placeholder="Enter phone number"
              />
              {formMethods.formState.errors.phone && (
                <p className="text-sm text-red-600">{formMethods.formState.errors.phone.message}</p>
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
                <p className="text-sm text-red-600">{formMethods.formState.errors.email.message}</p>
              )}
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'vehicle',
      title: 'Vehicle Details',
      component: (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="registrationNumber">Registration Number *</Label>
              <Input
                id="registrationNumber"
                {...formMethods.register('registrationNumber')}
                placeholder="Enter registration number"
              />
            </div>
            
            <div>
              <Label htmlFor="make">Make *</Label>
              <Input
                id="make"
                {...formMethods.register('make')}
                placeholder="Enter vehicle make"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="model">Model *</Label>
              <Input
                id="model"
                {...formMethods.register('model')}
                placeholder="Enter vehicle model"
              />
            </div>
            
            <div>
              <Label htmlFor="year">Year *</Label>
              <Input
                id="year"
                {...formMethods.register('year')}
                placeholder="Enter year"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="engineNumber">Engine Number *</Label>
              <Input
                id="engineNumber"
                {...formMethods.register('engineNumber')}
                placeholder="Enter engine number"
              />
            </div>
            
            <div>
              <Label htmlFor="chassisNumber">Chassis Number *</Label>
              <Input
                id="chassisNumber"
                {...formMethods.register('chassisNumber')}
                placeholder="Enter chassis number"
              />
            </div>
          </div>
          
          <div>
            <Label>Is the vehicle registered in your name? *</Label>
            <Select
              value={watchedValues.registeredInYourName}
              onValueChange={(value) => formMethods.setValue('registeredInYourName', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select option" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="no">No</SelectItem>
              </SelectContent>
            </Select>
            
            {watchedValues.registeredInYourName === 'no' && (
              <div className="mt-2">
                <Label htmlFor="registeredInYourNameDetails">Details *</Label>
                <Textarea
                  id="registeredInYourNameDetails"
                  {...formMethods.register('registeredInYourNameDetails')}
                  placeholder="Provide details"
                  rows={2}
                />
              </div>
            )}
          </div>
          
          <div>
            <Label>Is the vehicle owned solely by you? *</Label>
            <Select
              value={watchedValues.ownedSolely}
              onValueChange={(value) => formMethods.setValue('ownedSolely', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select option" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="no">No</SelectItem>
              </SelectContent>
            </Select>
            
            {watchedValues.ownedSolely === 'no' && (
              <div className="mt-2">
                <Label htmlFor="ownedSolelyDetails">Details *</Label>
                <Textarea
                  id="ownedSolelyDetails"
                  {...formMethods.register('ownedSolelyDetails')}
                  placeholder="Provide details"
                  rows={2}
                />
              </div>
            )}
          </div>
          
          <div>
            <Label>Is the vehicle subject to hire purchase? *</Label>
            <Select
              value={watchedValues.hirePurchase}
              onValueChange={(value) => formMethods.setValue('hirePurchase', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select option" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="no">No</SelectItem>
              </SelectContent>
            </Select>
            
            {watchedValues.hirePurchase === 'yes' && (
              <div className="mt-2">
                <Label htmlFor="hirePurchaseDetails">Details *</Label>
                <Textarea
                  id="hirePurchaseDetails"
                  {...formMethods.register('hirePurchaseDetails')}
                  placeholder="Provide hire purchase details"
                  rows={2}
                />
              </div>
            )}
          </div>
          
          <div>
            <Label htmlFor="vehicleUsage">Vehicle Usage *</Label>
            <Select
              value={watchedValues.vehicleUsage}
              onValueChange={(value) => formMethods.setValue('vehicleUsage', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select usage" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="private">Private</SelectItem>
                <SelectItem value="commercial">Commercial</SelectItem>
                <SelectItem value="uber">Uber/Ride-sharing</SelectItem>
                <SelectItem value="taxi">Taxi</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label>Was a trailer attached? *</Label>
            <Select
              value={watchedValues.trailerAttached}
              onValueChange={(value) => formMethods.setValue('trailerAttached', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select option" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="no">No</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="damageDescription">Description of Damage *</Label>
            <Textarea
              id="damageDescription"
              {...formMethods.register('damageDescription')}
              placeholder="Describe the damage to your vehicle"
              rows={4}
            />
          </div>
          
          <div>
            <Label htmlFor="inspectionLocation">Where can the vehicle be inspected? *</Label>
            <Input
              id="inspectionLocation"
              {...formMethods.register('inspectionLocation')}
              placeholder="Enter inspection location"
            />
          </div>
        </div>
      )
    },
    {
      id: 'incident',
      title: 'Incident Details',
      component: (
        <div className="space-y-6">
          <div>
            <Label htmlFor="incidentLocation">Where did the incident occur? *</Label>
            <Input
              id="incidentLocation"
              {...formMethods.register('incidentLocation')}
              placeholder="Enter incident location"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="incidentDate">Date of Incident *</Label>
              <Input
                id="incidentDate"
                type="date"
                {...formMethods.register('incidentDate')}
              />
            </div>
            
            <div>
              <Label htmlFor="incidentTime">Time *</Label>
              <Input
                id="incidentTime"
                type="time"
                {...formMethods.register('incidentTime')}
              />
            </div>
          </div>
          
          <div>
            <Label>Was the incident reported to the police? *</Label>
            <Select
              value={watchedValues.policeReported}
              onValueChange={(value) => formMethods.setValue('policeReported', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select option" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="no">No</SelectItem>
              </SelectContent>
            </Select>
            
            {watchedValues.policeReported === 'yes' && (
              <div className="mt-2">
                <Label htmlFor="policeStationDetails">Police Station Details *</Label>
                <Textarea
                  id="policeStationDetails"
                  {...formMethods.register('policeStationDetails')}
                  placeholder="Enter police station name and report details"
                  rows={2}
                />
              </div>
            )}
          </div>
          
          <div>
            <Label htmlFor="incidentDescription">How did the incident occur? *</Label>
            <Textarea
              id="incidentDescription"
              {...formMethods.register('incidentDescription')}
              placeholder="Describe in detail how the incident happened"
              rows={4}
            />
          </div>
        </div>
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
          // This correctly calls the "addWitness" function from the useFieldArray hook
          onClick={() => addWitness({ name: '', address: '', phone: '', isPassenger: false })}
          variant="outline"
          size="sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Witness
        </Button>
      </div>

      {witnessFields.map((field, index) => (
        <Card key={field.id} className="p-4 space-y-4">
          <div className="flex justify-between items-center">
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

          {/* Corrected fields below */}
          <div>
            <Label htmlFor={`witnesses.${index}.name`}>Witness Name *</Label>
            <Input
              {...formMethods.register(`witnesses.${index}.name`)}
              placeholder="Enter witness name"
            />
          </div>

          <div>
            <Label htmlFor={`witnesses.${index}.address`}>Witness Address *</Label>
            <Textarea
              {...formMethods.register(`witnesses.${index}.address`)}
              placeholder="Enter witness address"
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor={`witnesses.${index}.phone`}>Witness Phone *</Label>
            <Input
              {...formMethods.register(`witnesses.${index}.phone`)}
              placeholder="Enter phone number"
            />
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <Checkbox
              id={`witnesses.${index}.isPassenger`}
              checked={watchedValues.witnesses?.[index]?.isPassenger || false}
              onCheckedChange={(checked) =>
                formMethods.setValue(`witnesses.${index}.isPassenger`, !!checked)
              }
            />
            <Label htmlFor={`witnesses.${index}.isPassenger`}>Was passenger</Label>
          </div>
        </Card>
      ))}

      {witnessFields.length === 0 && (
        <div className="text-center text-sm text-muted-foreground border p-6 rounded-md">
          No witnesses added yet. Click "Add Witness" to add witness information.
        </div>
      )}
    </div>
  )
},
    {
      id: 'other-vehicle',
      title: 'Other Vehicle/Property',
      component: (
        <div className="space-y-6">
          <div>
            <Label>Was another vehicle involved? *</Label>
            <Select
              value={watchedValues.otherVehicleInvolved}
              onValueChange={(value) => formMethods.setValue('otherVehicleInvolved', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select option" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="no">No</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {watchedValues.otherVehicleInvolved === 'yes' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="otherVehicleRegNumber">Registration Number *</Label>
                  <Input
                    id="otherVehicleRegNumber"
                    {...formMethods.register('otherVehicleRegNumber')}
                    placeholder="Enter registration number"
                  />
                </div>
                
                <div>
                  <Label htmlFor="otherVehicleMakeModel">Make & Model *</Label>
                  <Input
                    id="otherVehicleMakeModel"
                    {...formMethods.register('otherVehicleMakeModel')}
                    placeholder="Enter make and model"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="otherDriverName">Driver Name *</Label>
                  <Input
                    id="otherDriverName"
                    {...formMethods.register('otherDriverName')}
                    placeholder="Enter driver name"
                  />
                </div>
                
                <div>
                  <Label htmlFor="otherDriverPhone">Phone Number *</Label>
                  <Input
                    id="otherDriverPhone"
                    {...formMethods.register('otherDriverPhone')}
                    placeholder="Enter phone number"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="otherDriverAddress">Address *</Label>
                <Textarea
                  id="otherDriverAddress"
                  {...formMethods.register('otherDriverAddress')}
                  placeholder="Enter address"
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="otherVehicleInjuryDamage">Nature of injury or damage to other vehicle/property *</Label>
                <Textarea
                  id="otherVehicleInjuryDamage"
                  {...formMethods.register('otherVehicleInjuryDamage')}
                  placeholder="Describe the injury or damage"
                  rows={4}
                />
              </div>
            </div>
          )}
        </div>
      )
    },
    {
      id: 'declaration',
      title: 'Declaration & Privacy',
      component: (
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Data Privacy Notice</h3>
            <div className="prose prose-sm max-w-none">
              <p><strong>i.</strong> Your data will solemnly be used for the purposes of this business contract and also to enable us reach you with the updates about our products and services.</p>
              <p><strong>ii.</strong> Please note that your personal data will be treated with utmost respect and is well secured as required by Nigeria Data Protection Regulations 2019.</p>
              <p><strong>iii.</strong> Your personal data shall not be shared with or sold to any third-party without your consent unless we are compelled by law or regulator.</p>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Declaration</h3>
            <div className="prose prose-sm max-w-none mb-6">
              <p><strong>1.</strong> I/We declare to the best of my/our knowledge and belief that the information given on this form is true in every respect and agree that if I/we have made any false or fraudulent statement, be it suppression or concealment, the policy shall be cancelled and the claim shall be forfeited.</p>
              <p><strong>2.</strong> I/We agree to provide additional information to NEM Insurance, if required.</p>
              <p><strong>3.</strong> I/We agree to submit all required and requested for documents and NEM Insurance shall not be held responsible for any delay in settlement of claim due to non-fulfillment of requirements.</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="agreeToDataPrivacy"
                  checked={watchedValues.agreeToDataPrivacy}
                  onCheckedChange={(checked) => formMethods.setValue('agreeToDataPrivacy', !!checked)}
                />
                <Label htmlFor="agreeToDataPrivacy">
                  I agree to the data privacy notice *
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="declarationTrue"
                  checked={watchedValues.declarationTrue}
                  onCheckedChange={(checked) => formMethods.setValue('declarationTrue', !!checked)}
                />
                <Label htmlFor="declarationTrue">
                  I declare that the statements above are true *
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="declarationAdditionalInfo"
                  checked={watchedValues.declarationAdditionalInfo}
                  onCheckedChange={(checked) => formMethods.setValue('declarationAdditionalInfo', !!checked)}
                />
                <Label htmlFor="declarationAdditionalInfo">
                  I agree to provide additional information if required *
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="declarationDocuments"
                  checked={watchedValues.declarationDocuments}
                  onCheckedChange={(checked) => formMethods.setValue('declarationDocuments', !!checked)}
                />
                <Label htmlFor="declarationDocuments">
                  I agree to submit all required documents *
                </Label>
              </div>

              <div>
                <Label htmlFor="signature">Digital Signature *</Label>
                <Input
                  id="signature"
                  {...formMethods.register('signature')}
                  placeholder="Type your full name as signature"
                />
                {formMethods.formState.errors.signature && (
                  <p className="text-sm text-red-600">{formMethods.formState.errors.signature.message}</p>
                )}
              </div>

              <div>
                <Label>Date</Label>
                <Input
                  type="date"
                  value={new Date().toISOString().split('T')[0]}
                  disabled
                />
              </div>
            </div>
          </Card>
        </div>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Motor Insurance Claim Form
            </h1>
            <p className="text-muted-foreground">
              Please fill out all required information to submit your claim
            </p>
          </div>

        <MultiStepForm
          steps={steps}
          onSubmit={onFinalSubmit}
          isSubmitting={isSubmitting}
          submitButtonText="Review Claim"
          formMethods={formMethods}
        />

        {/* Summary Dialog */}
        <Dialog open={showSummary} onOpenChange={setShowSummary}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Review Your Motor Claim Submission</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><strong>Policy Number:</strong> {watchedValues.policyNumber}</div>
                <div><strong>Name/Company:</strong> {watchedValues.nameCompany}</div>
                <div><strong>Email:</strong> {watchedValues.email}</div>
                <div><strong>Vehicle:</strong> {watchedValues.make} {watchedValues.model}</div>
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
              <Button onClick={() => handleSubmit(formMethods.getValues())} disabled={isSubmitting}>
                {isSubmitting ? (
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
                <p>Your motor claim has been submitted successfully.</p>
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
    </div>
  );
};

export default MotorClaim;
