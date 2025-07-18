
import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import MultiStepForm from '../../components/common/MultiStepForm';
import FormSection from '../../components/common/FormSection';
import PhoneInput from '../../components/common/PhoneInput';
import FileUpload from '../../components/common/FileUpload';
import { useFormDraft } from '../../hooks/useFormDraft';
import { useAuthRequiredSubmit } from '../../hooks/useAuthRequiredSubmit';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
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
  signature: yup.string().required("Signature is required")
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
  businessType?: string;

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
  circumstancesOfLoss?: string;

  // Transport Details
  otherVehicleInvolved: boolean;
  dispatchAddress?: string;
  dispatchDate?: string;
  consigneeName?: string;
  consigneeAddress?: string;
  vehicleRegistration?: string;

  // Goods Items
  goodsItems: GoodsItem[];

  // Additional Details
  inspectionAddress?: string;
  isOwnerOfGoods: boolean;
  goodsInSoundCondition: boolean;
  checkedByDriver: boolean;
  staffLoadedUnloaded: boolean;
  receiptGiven: boolean;
  claimMadeAgainstYou: boolean;

  // Declaration
  agreeToDataPrivacy: boolean;
  signature: string;
}

const defaultValues: Partial<GoodsInTransitClaimData> = {
  policyNumber: '',
  companyName: '',
  address: '',
  phone: '',
  email: '',
  businessType: '',
  timeOfLoss: '',
  placeOfOccurrence: '',
  descriptionOfGoods: '',
  numberOfPackages: 0,
  totalWeight: 0,
  weightUnits: 'kg',
  totalValue: 0,
  howGoodsPacked: '',
  circumstancesOfLoss: '',
  otherVehicleInvolved: false,
  dispatchAddress: '',
  dispatchDate: '',
  consigneeName: '',
  consigneeAddress: '',
  goodsItems: [],
  inspectionAddress: '',
  isOwnerOfGoods: true,
  goodsInSoundCondition: true,
  checkedByDriver: true,
  vehicleRegistration: '',
  staffLoadedUnloaded: true,
  receiptGiven: true,
  claimMadeAgainstYou: false,
  agreeToDataPrivacy: false,
  signature: ''
};

const GoodsInTransitClaim: React.FC = () => {
  const [showSummary, setShowSummary] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File>>({});

  const formMethods = useForm<any>({
    resolver: yupResolver(goodsInTransitClaimSchema),
    defaultValues,
    mode: 'onChange'
  });

  const { fields: goodsItemsFields, append: addGoodsItem, remove: removeGoodsItem } = useFieldArray({
    control: formMethods.control,
    name: 'goodsItems'
  });

  const { watch, handleSubmit, setValue } = formMethods;
  const { saveDraft, loadDraft } = useFormDraft('goodsInTransitClaim', formMethods);
  const { 
    handleSubmitWithAuth, 
    showSuccess, 
    setShowSuccess, 
    isSubmitting 
  } = useAuthRequiredSubmit();
  
  const watchedValues = watch();

  // Auto-save draft
  useEffect(() => {
    const subscription = watch((data) => {
      saveDraft(data);
    });
    return () => subscription.unsubscribe();
  }, [watch, saveDraft]);

  useEffect(() => {
    loadDraft();
  }, [loadDraft]);

  // Calculate total value from goods items in real-time
  useEffect(() => {
    const subscription = watch((data) => {
      const total = data.goodsItems?.reduce((sum, item) => 
        sum + ((item.quantity || 0) * (item.value || 0)), 0) || 0;
      if (total !== data.totalValue) {
        setValue('totalValue', total);
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, setValue]);

  const onSubmit = async (data: GoodsInTransitClaimData) => {
    try {
      // Upload files if any
      let fileUrls = {};
      if (Object.keys(uploadedFiles).length > 0) {
        fileUrls = await uploadFormFiles(uploadedFiles, 'goods-in-transit-claims');
      }

      const submissionData = {
        ...data,
        ...fileUrls,
        formType: 'goods-in-transit-claim'
      };

      await handleSubmitWithAuth(submissionData, 'goods-in-transit-claim');
    } catch (error) {
      console.error('Submission error:', error);
    }
  };

  const handleFormSubmit = () => {
    setShowSummary(true);
  };

  const handleFileSelect = (key: string, file: File) => {
    setUploadedFiles(prev => ({ ...prev, [key]: file }));
  };

  const handleFileRemove = (key: string) => {
    setUploadedFiles(prev => {
      const updated = { ...prev };
      delete updated[key];
      return updated;
    });
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
            
            <div className="md:col-span-2">
              <Label htmlFor="businessType">Business Type</Label>
              <Input
                {...formMethods.register('businessType')}
                placeholder="Enter type of business"
              />
            </div>
          </div>
        </FormSection>
      )
    },
    {
      id: 'loss-details',
      title: 'Details of Loss',
      component: (
        <FormSection title="Loss Information" description="Provide details about the loss">
          <div className="space-y-4">
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
            </div>
            
            <div>
              <Label htmlFor="placeOfOccurrence">Place of Occurrence *</Label>
              <Input
                {...formMethods.register('placeOfOccurrence')}
                placeholder="Where did the loss occur?"
              />
              {formMethods.formState.errors.placeOfOccurrence && (
                <p className="text-sm text-red-600 mt-1">
                  {formMethods.formState.errors.placeOfOccurrence.message}
                </p>
              )}
            </div>
            
            <div>
              <Label htmlFor="descriptionOfGoods">Description of Goods Concerned *</Label>
              <Textarea
                {...formMethods.register('descriptionOfGoods')}
                placeholder="Describe the goods involved"
                rows={3}
              />
              {formMethods.formState.errors.descriptionOfGoods && (
                <p className="text-sm text-red-600 mt-1">
                  {formMethods.formState.errors.descriptionOfGoods.message}
                </p>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="numberOfPackages">Number of Packages *</Label>
                <Input
                  type="number"
                  {...formMethods.register('numberOfPackages')}
                  placeholder="Enter number"
                />
              </div>
              
              <div>
                <Label htmlFor="totalWeight">Total Weight *</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    step="0.01"
                    {...formMethods.register('totalWeight')}
                    placeholder="Enter weight"
                  />
                  <Select 
                    value={watchedValues.weightUnits} 
                    onValueChange={(value) => setValue('weightUnits', value)}
                  >
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kg">kg</SelectItem>
                      <SelectItem value="lbs">lbs</SelectItem>
                      <SelectItem value="tons">tons</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            
            <div>
              <Label htmlFor="howGoodsPacked">How Goods Were Packed *</Label>
              <Textarea
                {...formMethods.register('howGoodsPacked')}
                placeholder="Describe packaging method"
                rows={2}
              />
            </div>
            
            <div>
              <Label htmlFor="circumstancesOfLoss">Circumstances of Loss or Damage</Label>
              <Textarea
                {...formMethods.register('circumstancesOfLoss')}
                placeholder="Provide detailed circumstances"
                rows={4}
              />
            </div>
          </div>
        </FormSection>
      )
    },
    {
      id: 'particulars-of-goods',
      title: 'Particulars of Goods',
      component: (
        <FormSection title="Goods Items" description="List all goods involved in the claim">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Goods Items</h3>
              <Button
                type="button"
                onClick={() => addGoodsItem({ quantity: 1, description: '', value: 0 })}
                variant="outline"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </div>
            
            {goodsItemsFields.map((field, index) => (
              <Card key={field.id} className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-semibold">Item {index + 1}</h4>
                  <Button
                    type="button"
                    onClick={() => removeGoodsItem(index)}
                    variant="destructive"
                    size="sm"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor={`goodsItems_quantity_${index}`}>Quantity *</Label>
                    <Input
                      id={`goodsItems_quantity_${index}`}
                      type="number"
                      placeholder="Enter quantity"
                      {...formMethods.register(`goodsItems.${index}.quantity`, {
                        setValueAs: (value) => Number(value)
                      })}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor={`goodsItems_description_${index}`}>Description *</Label>
                    <Textarea
                      id={`goodsItems_description_${index}`}
                      placeholder="Enter description"
                      rows={2}
                      {...formMethods.register(`goodsItems.${index}.description`)}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor={`goodsItems_value_${index}`}>Value (₦) *</Label>
                    <Input
                      id={`goodsItems_value_${index}`}
                      type="number"
                      step="0.01"
                      placeholder="Enter value"
                      {...formMethods.register(`goodsItems.${index}.value`, {
                        setValueAs: (value) => Number(value)
                      })}
                    />
                  </div>
                </div>
              </Card>
            ))}
            
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-semibold">Total Value:</span>
                <span className="text-lg font-bold">₦{watchedValues.totalValue?.toLocaleString() || 0}</span>
              </div>
            </div>
          </div>
        </FormSection>
      )
    },
    {
      id: 'documents',
      title: 'Documents',
      component: (
        <FormSection title="Upload Supporting Documents" description="Please upload any relevant documents">
          <div className="space-y-6">
            <FileUpload
              label="Invoice/Receipt"
              onFileSelect={(file) => handleFileSelect('invoice', file)}
              onFileRemove={() => handleFileRemove('invoice')}
              currentFile={uploadedFiles.invoice}
            />
            
            <FileUpload
              label="Photos of Goods/Damage"
              onFileSelect={(file) => handleFileSelect('photos', file)}
              onFileRemove={() => handleFileRemove('photos')}
              currentFile={uploadedFiles.photos}
            />
            
            <FileUpload
              label="Transport Documents"
              onFileSelect={(file) => handleFileSelect('transportDocs', file)}
              onFileRemove={() => handleFileRemove('transportDocs')}
              currentFile={uploadedFiles.transportDocs}
            />
            
            <FileUpload
              label="Other Supporting Documents"
              onFileSelect={(file) => handleFileSelect('otherDocuments', file)}
              onFileRemove={() => handleFileRemove('otherDocuments')}
              currentFile={uploadedFiles.otherDocuments}
            />
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
                  checked={watchedValues.agreeToDataPrivacy}
                  onCheckedChange={(checked: boolean) => setValue('agreeToDataPrivacy', checked)}
                />
                <Label htmlFor="declaration" className="text-sm">
                  I agree to the data privacy policy and declaration above *
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
            </div>
          </div>
        </FormSection>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Goods-in-Transit Insurance Claim
          </h1>
          <p className="text-lg text-gray-600">
            Please fill out all required information accurately
          </p>
        </div>

        <MultiStepForm
          steps={steps}
          onSubmit={handleFormSubmit}
          formMethods={formMethods}
        />

        <Dialog open={showSummary} onOpenChange={setShowSummary}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Review Your Claim</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">Policy Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>Policy Number: {watchedValues.policyNumber}</div>
                  <div>Period: {watchedValues.periodOfCoverFrom} to {watchedValues.periodOfCoverTo}</div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Insured Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>Company: {watchedValues.companyName}</div>
                  <div>Email: {watchedValues.email}</div>
                  <div>Phone: {watchedValues.phone}</div>
                  <div>Address: {watchedValues.address}</div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Loss Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>Date: {watchedValues.dateOfLoss}</div>
                  <div>Time: {watchedValues.timeOfLoss}</div>
                  <div>Place: {watchedValues.placeOfOccurrence}</div>
                  <div>Total Value: ₦{watchedValues.totalValue?.toLocaleString()}</div>
                </div>
              </div>

              {watchedValues.goodsItems && watchedValues.goodsItems.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Goods Items</h3>
                  {watchedValues.goodsItems.map((item, index) => (
                    <div key={index} className="text-sm mb-2 p-2 bg-gray-50 rounded">
                      <div>Quantity: {item.quantity}</div>
                      <div>Description: {item.description}</div>
                      <div>Value: ₦{item.value?.toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowSummary(false)}>
                Edit Claim
              </Button>
              <Button onClick={handleSubmit(onSubmit)} disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Confirm & Submit'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <SuccessModal
          isOpen={showSuccess}
          onClose={() => setShowSuccess(false)}
          title="Claim Submitted Successfully!"
          message="Your goods-in-transit claim has been submitted successfully. You will receive a confirmation email shortly."
          formType="Goods-in-Transit Claim"
        />
      </div>
    </div>
  );
};

export default GoodsInTransitClaim;
