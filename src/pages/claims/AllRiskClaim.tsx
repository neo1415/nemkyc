import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar as ReactCalendar } from '@/components/ui/calendar';
import { Calendar, CalendarIcon, Plus, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import MultiStepForm from '@/components/common/MultiStepForm';
import { AllRiskClaimData } from '@/types/claims';
import { useFormDraft } from '@/hooks/useFormDraft';

const allRiskClaimSchema = z.object({
  // Policy Details
  policyNumber: z.string().min(1, "Policy number is required"),
  periodOfCoverFrom: z.coerce.date(),
  periodOfCoverTo: z.coerce.date(),
  
  // Insured Details
  nameOfInsured: z.string().min(1, "Name is required"),
  address: z.string().min(1, "Address is required"),
  phone: z.string().min(1, "Phone is required"),
  email: z.string().email("Valid email is required"),
  
  // Details of Loss
  typeOfClaim: z.string().min(1, "Type of claim is required"),
  locationOfClaim: z.string().min(1, "Location is required"),
  dateOfOccurrence: z.coerce.date(),
  timeOfOccurrence: z.string().min(1, "Time is required"),
  propertyDescription: z.string().min(1, "Property description is required"),
  circumstancesOfLoss: z.string().min(1, "Circumstances are required"),
  estimateOfLoss: z.number().min(0, "Estimate must be positive"),
  
  // Property Details
  propertyItems: z.array(z.object({
    description: z.string().min(1, "Description is required"),
    dateOfPurchase: z.coerce.date(),
    costPrice: z.number().min(0, "Cost price must be positive"),
    deductionForAge: z.number().min(0, "Deduction must be positive"),
    amountClaimed: z.number().min(0, "Amount claimed must be positive"),
    remarks: z.string().optional()
  })).min(1, "At least one property item is required"),
  
  // Ownership & Recovery
  isSoleOwner: z.boolean(),
  ownershipExplanation: z.string().optional(),
  hasHirePurchase: z.boolean(),
  hirePurchaseCompany: z.string().optional(),
  hirePurchaseAddress: z.string().optional(),
  recoveryStepsTaken: z.string().min(1, "Recovery steps are required"),
  hasOtherInsurance: z.boolean(),
  otherInsuranceDetails: z.string().optional(),
  hasPreviousLoss: z.boolean(),
  previousLossDetails: z.string().optional(),
  totalPropertyValue: z.number().min(0, "Total value must be positive"),
  hasOtherInsuranceAtTime: z.boolean(),
  otherInsuranceAtTimeDetails: z.string().optional(),
  hasPriorClaims: z.boolean(),
  priorClaimsDetails: z.string().optional(),
  policeInformed: z.boolean(),
  policeStationDetails: z.string().optional(),
  
  // Declaration
  agreeToDataPrivacy: z.boolean().refine(val => val === true, "You must agree to data privacy"),
  signature: z.string().min(1, "Signature is required")
});

const defaultValues: Partial<AllRiskClaimData> = {
  policyNumber: '',
  nameOfInsured: '',
  address: '',
  phone: '',
  email: '',
  typeOfClaim: '',
  locationOfClaim: '',
  timeOfOccurrence: '',
  propertyDescription: '',
  circumstancesOfLoss: '',
  estimateOfLoss: 0,
  propertyItems: [{
    description: '',
    dateOfPurchase: '',
    costPrice: 0,
    deductionForAge: 0,
    amountClaimed: 0,
    remarks: ''
  }],
  isSoleOwner: true,
  ownershipExplanation: '',
  hasHirePurchase: false,
  hirePurchaseCompany: '',
  hirePurchaseAddress: '',
  recoveryStepsTaken: '',
  hasOtherInsurance: false,
  otherInsuranceDetails: '',
  hasPreviousLoss: false,
  previousLossDetails: '',
  totalPropertyValue: 0,
  hasOtherInsuranceAtTime: false,
  otherInsuranceAtTimeDetails: '',
  hasPriorClaims: false,
  priorClaimsDetails: '',
  policeInformed: false,
  policeStationDetails: '',
  agreeToDataPrivacy: false,
  signature: ''
};

const AllRiskClaim: React.FC = () => {
  const [showSummary, setShowSummary] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formMethods = useForm<any>({
    resolver: zodResolver(allRiskClaimSchema),
    defaultValues,
    mode: 'onChange'
  });

  const { saveDraft, clearDraft } = useFormDraft('allRisk', formMethods);
  const { fields, append, remove } = useFieldArray({
    control: formMethods.control,
    name: 'propertyItems'
  });

  const watchedValues = formMethods.watch();

  // Auto-save draft
  React.useEffect(() => {
    const subscription = formMethods.watch((data) => {
      saveDraft(data);
    });
    return () => subscription.unsubscribe();
  }, [formMethods, saveDraft]);

  const handleSubmit = async (data: AllRiskClaimData) => {
    setIsSubmitting(true);
    try {
      // Submit logic would go here
      console.log('All Risk Claim submitted:', data);
      clearDraft();
      setShowSummary(false);
      setShowSuccess(true);
      toast({ title: "Claim submitted successfully!" });
    } catch (error) {
      toast({ title: "Submission failed", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const DatePickerField = ({ field, label }: { field: any; label: string }) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !field.value && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {field.value ? format(new Date(field.value), "PPP") : <span>Pick a date</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <ReactCalendar
            mode="single"
            selected={field.value}
            onSelect={field.onChange}
            initialFocus
            className="pointer-events-auto"
          />
        </PopoverContent>
      </Popover>
    </div>
  );

  const steps = [
    {
      id: 'policy',
      title: 'Policy Details',
      component: (
        <div className="space-y-4">
          <div>
            <Label htmlFor="policyNumber">Policy Number *</Label>
            <Input
              id="policyNumber"
              {...formMethods.register('policyNumber')}
            />
            {formMethods.formState.errors.policyNumber && (
              <p className="text-sm text-red-600 mt-1">
                {formMethods.formState.errors.policyNumber.message as string}
              </p>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DatePickerField
              field={formMethods.control._formValues.periodOfCoverFrom}
              label="Period of Cover From *"
            />
            <DatePickerField
              field={formMethods.control._formValues.periodOfCoverTo}
              label="Period of Cover To *"
            />
          </div>
        </div>
      )
    },
    {
      id: 'insured',
      title: 'Insured Details',
      component: (
        <div className="space-y-4">
          <div>
            <Label htmlFor="nameOfInsured">Name of Insured *</Label>
            <Input
              id="nameOfInsured"
              {...formMethods.register('nameOfInsured')}
            />
          </div>
          
          <div>
            <Label htmlFor="address">Address *</Label>
            <Textarea
              id="address"
              {...formMethods.register('address')}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone">Phone *</Label>
              <Input
                id="phone"
                type="tel"
                {...formMethods.register('phone')}
              />
            </div>
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                {...formMethods.register('email')}
              />
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'loss',
      title: 'Details of Loss',
      component: (
        <div className="space-y-4">
          <div>
            <Label htmlFor="typeOfClaim">Type of Claim *</Label>
            <Input
              id="typeOfClaim"
              {...formMethods.register('typeOfClaim')}
            />
          </div>
          
          <div>
            <Label htmlFor="locationOfClaim">Location of Claim *</Label>
            <Textarea
              id="locationOfClaim"
              {...formMethods.register('locationOfClaim')}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DatePickerField
              field={formMethods.control._formValues.dateOfOccurrence}
              label="Date of Occurrence *"
            />
            <div>
              <Label htmlFor="timeOfOccurrence">Time of Occurrence *</Label>
              <Input
                id="timeOfOccurrence"
                type="time"
                {...formMethods.register('timeOfOccurrence')}
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="propertyDescription">Property Description *</Label>
            <Textarea
              id="propertyDescription"
              {...formMethods.register('propertyDescription')}
              placeholder="Model, make, year, etc."
            />
          </div>
          
          <div>
            <Label htmlFor="circumstancesOfLoss">Circumstances of Loss/Damage *</Label>
            <Textarea
              id="circumstancesOfLoss"
              {...formMethods.register('circumstancesOfLoss')}
            />
          </div>
          
          <div>
            <Label htmlFor="estimateOfLoss">Estimate of Loss/Repairs *</Label>
            <Input
              id="estimateOfLoss"
              type="number"
              step="0.01"
              {...formMethods.register('estimateOfLoss', { valueAsNumber: true })}
            />
          </div>
        </div>
      )
    },
    {
      id: 'property',
      title: 'Property Details',
      component: (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Property Items</h3>
            <Button
              type="button"
              onClick={() => append({
                description: '',
                dateOfPurchase: '',
                costPrice: 0,
                deductionForAge: 0,
                amountClaimed: 0,
                remarks: ''
              })}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Item
            </Button>
          </div>
          
          {fields.map((field, index) => (
            <Card key={field.id} className="p-4">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-medium">Item {index + 1}</h4>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => remove(index)}
                  disabled={fields.length === 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Description *</Label>
                  <Textarea
                    {...formMethods.register(`propertyItems.${index}.description`)}
                  />
                </div>
                
                <div>
                  <Label>Date of Purchase *</Label>
                  <Input
                    type="date"
                    {...formMethods.register(`propertyItems.${index}.dateOfPurchase`)}
                  />
                </div>
                
                <div>
                  <Label>Cost Price *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    {...formMethods.register(`propertyItems.${index}.costPrice`, { valueAsNumber: true })}
                  />
                </div>
                
                <div>
                  <Label>Deduction for Age/Use/Wear</Label>
                  <Input
                    type="number"
                    step="0.01"
                    {...formMethods.register(`propertyItems.${index}.deductionForAge`, { valueAsNumber: true })}
                  />
                </div>
                
                <div>
                  <Label>Amount Claimed *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    {...formMethods.register(`propertyItems.${index}.amountClaimed`, { valueAsNumber: true })}
                  />
                </div>
                
                <div>
                  <Label>Remarks</Label>
                  <Textarea
                    {...formMethods.register(`propertyItems.${index}.remarks`)}
                  />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )
    },
    {
      id: 'ownership',
      title: 'Ownership & Recovery',
      component: (
        <div className="space-y-6">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isSoleOwner"
              checked={watchedValues.isSoleOwner}
              onCheckedChange={(checked) => formMethods.setValue('isSoleOwner', checked === true)}
            />
            <Label htmlFor="isSoleOwner">Are you the sole owner?</Label>
          </div>
          
          {!watchedValues.isSoleOwner && (
            <div>
              <Label htmlFor="ownershipExplanation">Ownership Explanation</Label>
              <Textarea
                id="ownershipExplanation"
                {...formMethods.register('ownershipExplanation')}
              />
            </div>
          )}
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="hasHirePurchase"
              checked={watchedValues.hasHirePurchase}
              onCheckedChange={(checked) => formMethods.setValue('hasHirePurchase', checked === true)}
            />
            <Label htmlFor="hasHirePurchase">Any hire purchase agreement?</Label>
          </div>
          
          {watchedValues.hasHirePurchase && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="hirePurchaseCompany">Hire Purchase Company</Label>
                <Input
                  id="hirePurchaseCompany"
                  {...formMethods.register('hirePurchaseCompany')}
                />
              </div>
              <div>
                <Label htmlFor="hirePurchaseAddress">Company Address</Label>
                <Textarea
                  id="hirePurchaseAddress"
                  {...formMethods.register('hirePurchaseAddress')}
                />
              </div>
            </div>
          )}
          
          <div>
            <Label htmlFor="recoveryStepsTaken">Steps taken to recover lost property *</Label>
            <Textarea
              id="recoveryStepsTaken"
              {...formMethods.register('recoveryStepsTaken')}
            />
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="hasOtherInsurance"
                checked={watchedValues.hasOtherInsurance}
                onCheckedChange={(checked) => formMethods.setValue('hasOtherInsurance', checked === true)}
              />
              <Label htmlFor="hasOtherInsurance">Any other insurance on this property?</Label>
            </div>
            
            {watchedValues.hasOtherInsurance && (
              <div>
                <Label htmlFor="otherInsuranceDetails">Other Insurance Details</Label>
                <Textarea
                  id="otherInsuranceDetails"
                  {...formMethods.register('otherInsuranceDetails')}
                />
              </div>
            )}
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="hasPreviousLoss"
                checked={watchedValues.hasPreviousLoss}
                onCheckedChange={(checked) => formMethods.setValue('hasPreviousLoss', checked === true)}
              />
              <Label htmlFor="hasPreviousLoss">Ever sustained same loss before?</Label>
            </div>
            
            {watchedValues.hasPreviousLoss && (
              <div>
                <Label htmlFor="previousLossDetails">Previous Loss Details</Label>
                <Textarea
                  id="previousLossDetails"
                  {...formMethods.register('previousLossDetails')}
                />
              </div>
            )}
          </div>
          
          <div>
            <Label htmlFor="totalPropertyValue">Total value of insured property at time of loss *</Label>
            <Input
              id="totalPropertyValue"
              type="number"
              step="0.01"
              {...formMethods.register('totalPropertyValue', { valueAsNumber: true })}
            />
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="policeInformed"
                checked={watchedValues.policeInformed}
                onCheckedChange={(checked) => formMethods.setValue('policeInformed', checked === true)}
              />
              <Label htmlFor="policeInformed">Informed police?</Label>
            </div>
            
            {watchedValues.policeInformed && (
              <div>
                <Label htmlFor="policeStationDetails">Police Station Details</Label>
                <Textarea
                  id="policeStationDetails"
                  {...formMethods.register('policeStationDetails')}
                />
              </div>
            )}
          </div>
        </div>
      )
    },
    {
      id: 'declaration',
      title: 'Declaration & Signature',
      component: (
        <div className="space-y-6">
          <div className="p-4 bg-muted rounded-lg">
            <h3 className="font-medium mb-2">Data Privacy Notice</h3>
            <p className="text-sm text-muted-foreground">
              Your personal data will be processed in accordance with our privacy policy and applicable data protection laws.
              We will use your information to process your claim and may share it with relevant third parties as necessary
              for claim processing and fraud prevention.
            </p>
          </div>
          
          <div className="flex items-start space-x-2">
            <Checkbox
              id="agreeToDataPrivacy"
              checked={watchedValues.agreeToDataPrivacy}
              onCheckedChange={(checked) => formMethods.setValue('agreeToDataPrivacy', checked === true)}
            />
            <Label htmlFor="agreeToDataPrivacy" className="text-sm">
              I agree to the data privacy terms and confirm that all information provided is true and accurate to the best of my knowledge *
            </Label>
          </div>
          
          <div>
            <Label htmlFor="signature">Digital Signature *</Label>
            <Input
              id="signature"
              placeholder="Type your full name as signature"
              {...formMethods.register('signature')}
            />
          </div>
          
          <div className="text-center pt-4">
            <Button
              type="button"
              onClick={() => {
                const isValid = formMethods.trigger();
                if (isValid) setShowSummary(true);
              }}
            >
              Review & Submit
            </Button>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">All Risk Claim Form</h1>
          <p className="text-gray-600">Submit your all risk insurance claim</p>
        </div>

        <MultiStepForm
          steps={steps}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          submitButtonText="Submit Claim"
          formMethods={formMethods}
        />

        {/* Summary Dialog */}
        <Dialog open={showSummary} onOpenChange={setShowSummary}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Review Your All Risk Claim</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">Policy Details</h3>
                <p><strong>Policy Number:</strong> {watchedValues.policyNumber}</p>
                <p><strong>Period:</strong> {watchedValues.periodOfCoverFrom && format(new Date(watchedValues.periodOfCoverFrom), "PP")} - {watchedValues.periodOfCoverTo && format(new Date(watchedValues.periodOfCoverTo), "PP")}</p>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Insured Details</h3>
                <p><strong>Name:</strong> {watchedValues.nameOfInsured}</p>
                <p><strong>Address:</strong> {watchedValues.address}</p>
                <p><strong>Contact:</strong> {watchedValues.phone} | {watchedValues.email}</p>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Property Items ({watchedValues.propertyItems?.length || 0})</h3>
                {watchedValues.propertyItems?.map((item, index) => (
                  <div key={index} className="p-3 border rounded mb-2">
                    <p><strong>Description:</strong> {item.description}</p>
                    <p><strong>Amount Claimed:</strong> ₦{item.amountClaimed?.toLocaleString()}</p>
                  </div>
                ))}
              </div>
              
              <div className="flex gap-4 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowSummary(false)}
                >
                  Edit Details
                </Button>
                <Button
                  onClick={() => {
                    const formData = formMethods.getValues();
                    handleSubmit(formData as AllRiskClaimData);
                  }}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Submitting...' : 'Confirm & Submit'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Success Dialog */}
        <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Claim Submitted Successfully!</DialogTitle>
            </DialogHeader>
            <div className="text-center space-y-4">
              <div className="text-green-600 text-6xl">✓</div>
              <p>Your all risk claim has been submitted successfully.</p>
              <p className="text-sm text-muted-foreground">
                You will receive a confirmation email shortly. For status enquiries, please contact us.
              </p>
              <Button onClick={() => setShowSuccess(false)}>
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AllRiskClaim;