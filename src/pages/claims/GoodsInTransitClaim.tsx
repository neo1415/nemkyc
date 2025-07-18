import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { toast } from 'sonner';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import FormSection from '../../components/common/FormSection';
import MultiStepForm from '../../components/common/MultiStepForm';
import PhoneInput from '../../components/common/PhoneInput';
import { useAuthRequiredSubmit } from '../../hooks/useAuthRequiredSubmit';
import { Label } from '../../components/ui/label';
import { Checkbox } from '../../components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Card, CardContent } from '../../components/ui/card';
import { Plus, Trash2 } from 'lucide-react';
import { uploadFormFiles } from '../../services/fileService';
import SuccessModal from '../../components/common/SuccessModal';

// Goods In Transit Claim Schema
const goodsInTransitClaimSchema = yup.object().shape({
  // Policy Details
  policyNumber: yup.string().required("Policy number is required"),
  periodOfCoverFrom: yup.date().required("Period of cover from is required"),
  periodOfCoverTo: yup.date().required("Period of cover to is required"),

  // Insured Details
  companyName: yup.string().required("Company name is required"),
  address: yup.string().required("Address is required"),
  phone: yup.string().required("Phone number is required"),
  email: yup.string().email("Valid email is required").required("Email is required"),

  // Loss Details
  dateOfLoss: yup.date().required("Date of loss is required"),
  timeOfLoss: yup.string().required("Time of loss is required"),
  placeOfOccurrence: yup.string().required("Place of occurrence is required"),
  descriptionOfGoods: yup.string().required("Description of goods is required"),

  // Goods Items
  goodsItems: yup.array().of(
    yup.object().shape({
      quantity: yup.number().required("Quantity is required").min(1, "Quantity must be at least 1"),
      description: yup.string().required("Description is required"),
      value: yup.number().required("Value is required").min(0, "Value must be non-negative")
    })
  ),

  // Declaration
  agreeToDataPrivacy: yup.boolean().oneOf([true], "You must agree to data privacy"),
  signature: yup.string().required("Signature is required"),
  signatureDate: yup.date().required("Signature date is required")
});

interface GoodsItem {
  quantity: number;
  description: string;
  value: number;
}

interface GoodsInTransitClaimData {
  // Policy Details
  policyNumber: string;
  periodOfCoverFrom: Date;
  periodOfCoverTo: Date;

  // Insured Details
  companyName: string;
  address: string;
  phone: string;
  email: string;
  businessType: string;

  // Loss Details
  dateOfLoss: Date;
  timeOfLoss: string;
  placeOfOccurrence: string;
  descriptionOfGoods: string;
  numberOfPackages: number;
  totalWeight: number;
  weightUnits: string;
  totalValue: number;
  howGoodsPacked: string;

  // Circumstances
  circumstancesOfLoss: string;
  otherVehicleInvolved: boolean;
  otherVehicleOwnerName?: string;
  otherVehicleOwnerAddress?: string;
  witnessName?: string;
  witnessAddress?: string;
  policeStation?: string;
  dateReportedToPolice?: Date;
  dispatchAddress: string;
  dispatchDate: Date;
  consigneeName: string;
  consigneeAddress: string;

  // Particulars of Goods
  goodsItems: GoodsItem[];

  // Inspection
  inspectionAddress: string;

  // If owner of goods
  isOwnerOfGoods: boolean;
  howTransported?: string;
  transporterInsurerName?: string;
  transporterInsurerAddress?: string;

  // If claiming as carrier
  goodsOwnerName?: string;
  goodsOwnerAddress?: string;
  goodsOwnerInsurerName?: string;
  goodsOwnerInsurerAddress?: string;

  // Vehicle/Transport
  goodsInSoundCondition: boolean;
  checkedByDriver: boolean;
  vehicleRegistration: string;
  staffLoadedUnloaded: boolean;
  receiptGiven: boolean;
  carriageConditionFile?: {
    name: string;
    type: string;
    url: string;
  };
  claimMadeAgainstYou: boolean;
  claimReceivedDate?: Date;

  // Declaration
  agreeToDataPrivacy: boolean;
  signature: string;
  signatureDate: Date;
}

type GoodsInTransitData = yup.InferType<typeof goodsInTransitClaimSchema>;

const defaultValues: Partial<GoodsInTransitData> = {
  goodsItems: [{ quantity: 1, description: "", value: 0 }]
};

const GoodsInTransitClaim: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [showSummary, setShowSummary] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File>>({});

  const formMethods = useForm({
    resolver: yupResolver(goodsInTransitClaimSchema) as any,
    defaultValues,
    mode: 'onChange'
  });

  const { watch, handleSubmit, setValue, formState: { errors } } = formMethods;
  const { 
    handleSubmitWithAuth, 
    showSuccess, 
    setShowSuccess, 
    isSubmitting 
  } = useAuthRequiredSubmit();

  const watchedValues = watch();
  const goodsItems = watch("goodsItems") || [];

  const onSubmit = async (data: any) => {
    try {
      const fileUrls = await uploadFormFiles(uploadedFiles, 'goods-in-transit-claims');
      const submissionData = {
        ...data,
        files: fileUrls,
        formType: 'goods-in-transit-claim',
        submissionId: `GIT-${Date.now()}`,
        submittedAt: new Date().toISOString()
      };

      await handleSubmitWithAuth(submissionData, 'goods-in-transit-claims');
    } catch (error) {
      console.error('Submission error:', error);
      toast.error('Failed to submit claim. Please try again.');
    }
  };

  const addGoodsItem = () => {
    const currentItems = goodsItems || [];
    setValue("goodsItems", [...currentItems, { quantity: 1, description: "", value: 0 }]);
  };

  const removeGoodsItem = (index: number) => {
    const currentItems = goodsItems || [];
    if (currentItems.length > 1) {
      setValue("goodsItems", currentItems.filter((_, i) => i !== index));
    }
  };

  const updateGoodsItem = (index: number, field: keyof GoodsItem, value: any) => {
    const currentItems = [...(goodsItems || [])];
    currentItems[index] = { ...currentItems[index], [field]: value };
    setValue("goodsItems", currentItems);
  };

  const steps = [
    {
      id: 'policy-details',
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
      id: 'insured-details',
      title: 'Insured Details',
      component: (
        <FormSection title="Insured Information" description="Enter the insured details">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="companyName">Company Name *</Label>
              <Input
                {...formMethods.register('companyName')}
                placeholder="Enter company name"
              />
              {formMethods.formState.errors.companyName && (
                <p className="text-sm text-red-600 mt-1">
                  {formMethods.formState.errors.companyName.message}
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
      id: 'loss-details',
      title: 'Loss Details',
      component: (
        <FormSection title="Details of Loss" description="Provide information about the goods-in-transit loss">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="dateOfLoss">Date of Loss *</Label>
              <Input
                type="date"
                {...formMethods.register('dateOfLoss')}
              />
              {formMethods.formState.errors.dateOfLoss && (
                <p className="text-sm text-red-600 mt-1">
                  {formMethods.formState.errors.dateOfLoss.message}
                </p>
              )}
            </div>
            
            <div>
              <Label htmlFor="timeOfLoss">Time of Loss *</Label>
              <Input
                type="time"
                {...formMethods.register('timeOfLoss')}
              />
              {formMethods.formState.errors.timeOfLoss && (
                <p className="text-sm text-red-600 mt-1">
                  {formMethods.formState.errors.timeOfLoss.message}
                </p>
              )}
            </div>
            
            <div className="md:col-span-2">
              <Label htmlFor="placeOfOccurrence">Place of Occurrence *</Label>
              <Textarea
                {...formMethods.register('placeOfOccurrence')}
                placeholder="Describe where the loss occurred"
                rows={2}
              />
              {formMethods.formState.errors.placeOfOccurrence && (
                <p className="text-sm text-red-600 mt-1">
                  {formMethods.formState.errors.placeOfOccurrence.message}
                </p>
              )}
            </div>
            
            <div className="md:col-span-2">
              <Label htmlFor="descriptionOfGoods">Description of Goods *</Label>
              <Textarea
                {...formMethods.register('descriptionOfGoods')}
                placeholder="Describe the goods that were lost or damaged"
                rows={3}
              />
              {formMethods.formState.errors.descriptionOfGoods && (
                <p className="text-sm text-red-600 mt-1">
                  {formMethods.formState.errors.descriptionOfGoods.message}
                </p>
              )}
            </div>
          </div>
        </FormSection>
      )
    },
    {
      id: 'goods-items',
      title: 'Goods Items',
      component: (
        <FormSection title="Particulars of Goods" description="List the goods that were lost or damaged">
          <div className="space-y-4">
            {goodsItems.map((item: GoodsItem, index: number) => (
              <Card key={index} className="p-4">
                <CardContent className="p-0">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-medium">Item {index + 1}</h4>
                    {goodsItems.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeGoodsItem(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor={`quantity-${index}`}>Quantity *</Label>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity || ''}
                        onChange={(e) => updateGoodsItem(index, 'quantity', parseInt(e.target.value) || 0)}
                        placeholder="Enter quantity"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor={`description-${index}`}>Description *</Label>
                      <Input
                        value={item.description || ''}
                        onChange={(e) => updateGoodsItem(index, 'description', e.target.value)}
                        placeholder="Enter description"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor={`value-${index}`}>Value (₦) *</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.value || ''}
                        onChange={(e) => updateGoodsItem(index, 'value', parseFloat(e.target.value) || 0)}
                        placeholder="Enter value"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            <Button
              type="button"
              variant="outline"
              onClick={addGoodsItem}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Another Item
            </Button>
          </div>
        </FormSection>
      )
    },
    {
      id: 'declaration',
      title: 'Declaration',
      component: (
        <FormSection title="Declaration and Signature" description="Complete your claim submission">
          <div className="space-y-4">
            <div className="flex items-start space-x-2">
              <Checkbox
                id="agreeToDataPrivacy"
                checked={watchedValues.agreeToDataPrivacy as boolean || false}
                onCheckedChange={(checked: boolean) => setValue('agreeToDataPrivacy', checked)}
              />
              <Label htmlFor="agreeToDataPrivacy" className="text-sm">
                I declare that the information provided is true and complete to the best of my knowledge
                and belief. I understand that any false information may void this claim.
              </Label>
            </div>
            {formMethods.formState.errors.agreeToDataPrivacy && (
              <p className="text-sm text-red-600">
                {formMethods.formState.errors.agreeToDataPrivacy.message}
              </p>
            )}
            
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
                defaultValue={new Date().toISOString().split('T')[0]}
              />
              {formMethods.formState.errors.signatureDate && (
                <p className="text-sm text-red-600 mt-1">
                  {formMethods.formState.errors.signatureDate.message}
                </p>
              )}
            </div>
          </div>
        </FormSection>
      )
    }
  ];

  const handleFormSubmit = (data: any) => {
    setShowSummary(true);
  };

  const confirmSubmission = () => {
    setShowSummary(false);
    handleSubmit(onSubmit)();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Goods-in-Transit Claim Form
            </h1>
            <p className="text-gray-600">
              Submit your goods-in-transit claim with all required details
            </p>
          </div>

          <MultiStepForm
            steps={steps}
            onSubmit={handleFormSubmit}
            formMethods={formMethods}
          />
        </div>

        <Dialog open={showSummary} onOpenChange={setShowSummary}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Confirm Submission</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p>Please review your goods-in-transit claim details before submitting:</p>
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <p><strong>Policy Number:</strong> {watchedValues.policyNumber}</p>
                <p><strong>Company Name:</strong> {watchedValues.companyName}</p>
                <p><strong>Date of Loss:</strong> {watchedValues.dateOfLoss?.toString()}</p>
                <p><strong>Number of Items:</strong> {goodsItems.length}</p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowSummary(false)}>
                Back to Edit
              </Button>
              <Button onClick={confirmSubmission} disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Submit Claim'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <SuccessModal
          isOpen={showSuccess}
          onClose={() => setShowSuccess()}
          title="Claim Submitted Successfully!"
          message="Your goods-in-transit claim has been submitted successfully. You will receive a confirmation email shortly."
          formType="Goods-in-Transit Claim"
        />
      </div>
    </div>
  );
};

export default GoodsInTransitClaim;