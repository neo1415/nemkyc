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
import MultiStepForm from '../../components/common/MultiStepForm';
import FormSection from '../../components/common/FormSection';
import FileUpload from '../../components/common/FileUpload';
import PhoneInput from '../../components/common/PhoneInput';
import { GoodsInTransitClaimData, GoodsItem } from '../../types/claims';
import { useFormDraft } from '../../hooks/useFormDraft';
import { useToast } from '../../hooks/use-toast';
import { Building2, MapPin, Clock, Package, FileText, Shield, Plus, Trash2 } from 'lucide-react';

const defaultValues: Partial<GoodsInTransitClaimData> = {
  policyNumber: '',
  periodOfCoverFrom: '',
  periodOfCoverTo: '',
  companyName: '',
  address: '',
  phone: '',
  email: '',
  businessType: '',
  dateOfLoss: '',
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
  goodsItems: [{ quantity: 1, description: '', value: 0 }],
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
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const formMethods = useForm<GoodsInTransitClaimData>({
    defaultValues,
    mode: 'onChange'
  });

  const { control, handleSubmit, watch, setValue } = formMethods;
  const { saveDraft, clearDraft } = useFormDraft('goods-in-transit-claim', formMethods);

  const goodsItemsFieldArray = useFieldArray({
    control,
    name: "goodsItems"
  });

  const watchedValues = watch();
  
  // Auto-save draft when form values change
  React.useEffect(() => {
    const subscription = watch((data) => {
      saveDraft(data);
    });
    return () => subscription.unsubscribe();
  }, [watch, saveDraft]);

  // Calculate total value from goods items
  React.useEffect(() => {
    const total = watchedValues.goodsItems?.reduce((sum, item) => sum + (item.value || 0), 0) || 0;
    if (total !== watchedValues.totalValue) {
      setValue('totalValue', total);
    }
  }, [watchedValues.goodsItems, setValue, watchedValues.totalValue]);

  const onSubmit = async (data: GoodsInTransitClaimData) => {
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
        description: "Your goods-in-transit claim has been submitted and you will receive a confirmation email shortly.",
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
        <FormSection title="Company Information" icon={<Building2 className="h-5 w-5" />}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="companyName">Company Name *</Label>
              <Input
                id="companyName"
                {...formMethods.register('companyName', { required: true })}
                placeholder="Enter company name"
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
              <Label htmlFor="phone">Phone *</Label>
              <PhoneInput
                value={watchedValues.phone || ''}
                onChange={(value) => setValue('phone', value)}
                placeholder="Enter phone number"
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
            <div className="md:col-span-2">
              <Label htmlFor="businessType">Business Type</Label>
              <Input
                id="businessType"
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
        <FormSection title="Loss Information" icon={<MapPin className="h-5 w-5" />}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="dateOfLoss">Date of Loss *</Label>
              <Input
                id="dateOfLoss"
                type="date"
                {...formMethods.register('dateOfLoss', { required: true })}
              />
            </div>
            <div>
              <Label htmlFor="timeOfLoss">Time of Loss *</Label>
              <Input
                id="timeOfLoss"
                type="time"
                {...formMethods.register('timeOfLoss', { required: true })}
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="placeOfOccurrence">Place of Occurrence *</Label>
              <Input
                id="placeOfOccurrence"
                {...formMethods.register('placeOfOccurrence', { required: true })}
                placeholder="Where did the loss occur?"
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="descriptionOfGoods">Description of Goods Concerned *</Label>
              <Textarea
                id="descriptionOfGoods"
                {...formMethods.register('descriptionOfGoods', { required: true })}
                placeholder="Describe the goods involved"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="numberOfPackages">Number of Packages *</Label>
              <Input
                id="numberOfPackages"
                type="number"
                {...formMethods.register('numberOfPackages', { required: true, valueAsNumber: true })}
                placeholder="Enter number"
              />
            </div>
            <div>
              <Label htmlFor="totalWeight">Total Weight *</Label>
              <div className="flex gap-2">
                <Input
                  id="totalWeight"
                  type="number"
                  step="0.01"
                  {...formMethods.register('totalWeight', { required: true, valueAsNumber: true })}
                  placeholder="Enter weight"
                />
                <Select value={watchedValues.weightUnits} onValueChange={(value) => setValue('weightUnits', value)}>
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
            <div className="md:col-span-2">
              <Label htmlFor="howGoodsPacked">How Goods Were Packed *</Label>
              <Textarea
                id="howGoodsPacked"
                {...formMethods.register('howGoodsPacked', { required: true })}
                placeholder="Describe packaging method"
                rows={2}
              />
            </div>
          </div>
        </FormSection>
      )
    },
    {
      id: 'circumstances',
      title: 'Circumstances',
      component: (
        <FormSection title="Circumstances of Loss" icon={<Clock className="h-5 w-5" />}>
          <div className="space-y-4">
            <div>
              <Label htmlFor="circumstancesOfLoss">Circumstances of Loss or Damage *</Label>
              <Textarea
                id="circumstancesOfLoss"
                {...formMethods.register('circumstancesOfLoss', { required: true })}
                placeholder="Provide detailed circumstances"
                rows={4}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="otherVehicleInvolved"
                checked={watchedValues.otherVehicleInvolved}
                onCheckedChange={(checked) => setValue('otherVehicleInvolved', !!checked)}
              />
              <Label htmlFor="otherVehicleInvolved">Another vehicle was involved</Label>
            </div>

            {watchedValues.otherVehicleInvolved && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-6">
                <div>
                  <Label htmlFor="otherVehicleOwnerName">Name of Owner</Label>
                  <Input
                    id="otherVehicleOwnerName"
                    {...formMethods.register('otherVehicleOwnerName')}
                    placeholder="Enter owner's name"
                  />
                </div>
                <div>
                  <Label htmlFor="otherVehicleOwnerAddress">Address of Owner</Label>
                  <Textarea
                    id="otherVehicleOwnerAddress"
                    {...formMethods.register('otherVehicleOwnerAddress')}
                    placeholder="Enter owner's address"
                    rows={2}
                  />
                </div>
                <div>
                  <Label htmlFor="witnessName">Witness Name</Label>
                  <Input
                    id="witnessName"
                    {...formMethods.register('witnessName')}
                    placeholder="Enter witness name"
                  />
                </div>
                <div>
                  <Label htmlFor="witnessAddress">Witness Address</Label>
                  <Textarea
                    id="witnessAddress"
                    {...formMethods.register('witnessAddress')}
                    placeholder="Enter witness address"
                    rows={2}
                  />
                </div>
                <div>
                  <Label htmlFor="policeStation">Police Station Advised</Label>
                  <Input
                    id="policeStation"
                    {...formMethods.register('policeStation')}
                    placeholder="Enter police station"
                  />
                </div>
                <div>
                  <Label htmlFor="dateReportedToPolice">Date Reported to Police</Label>
                  <Input
                    id="dateReportedToPolice"
                    type="date"
                    {...formMethods.register('dateReportedToPolice')}
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dispatchAddress">Dispatch Address *</Label>
                <Textarea
                  id="dispatchAddress"
                  {...formMethods.register('dispatchAddress', { required: true })}
                  placeholder="Enter dispatch address"
                  rows={2}
                />
              </div>
              <div>
                <Label htmlFor="dispatchDate">Dispatch Date *</Label>
                <Input
                  id="dispatchDate"
                  type="date"
                  {...formMethods.register('dispatchDate', { required: true })}
                />
              </div>
              <div>
                <Label htmlFor="consigneeName">Consignee Name *</Label>
                <Input
                  id="consigneeName"
                  {...formMethods.register('consigneeName', { required: true })}
                  placeholder="Enter consignee name"
                />
              </div>
              <div>
                <Label htmlFor="consigneeAddress">Consignee Address *</Label>
                <Textarea
                  id="consigneeAddress"
                  {...formMethods.register('consigneeAddress', { required: true })}
                  placeholder="Enter consignee address"
                  rows={2}
                />
              </div>
            </div>
          </div>
        </FormSection>
      )
    },
    {
      id: 'goods-particulars',
      title: 'Particulars of Goods',
      component: (
        <FormSection title="Goods Lost or Damaged" icon={<Package className="h-5 w-5" />}>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Items List</h3>
              <Button
                type="button"
                onClick={() => goodsItemsFieldArray.append({ quantity: 1, description: '', value: 0 })}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Item
              </Button>
            </div>

            {goodsItemsFieldArray.fields.map((field, index) => (
              <Card key={field.id} className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor={`goodsItems.${index}.quantity`}>Quantity *</Label>
                    <Input
                      id={`goodsItems.${index}.quantity`}
                      type="number"
                      {...formMethods.register(`goodsItems.${index}.quantity`, { required: true, valueAsNumber: true })}
                      placeholder="Qty"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor={`goodsItems.${index}.description`}>Description *</Label>
                    <Input
                      id={`goodsItems.${index}.description`}
                      {...formMethods.register(`goodsItems.${index}.description`, { required: true })}
                      placeholder="Item description"
                    />
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Label htmlFor={`goodsItems.${index}.value`}>Value (₦) *</Label>
                      <Input
                        id={`goodsItems.${index}.value`}
                        type="number"
                        step="0.01"
                        {...formMethods.register(`goodsItems.${index}.value`, { required: true, valueAsNumber: true })}
                        placeholder="0.00"
                      />
                    </div>
                    {goodsItemsFieldArray.fields.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => goodsItemsFieldArray.remove(index)}
                        className="mt-6 h-10 w-10 p-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-medium">Total Value:</span>
                <span className="text-lg font-bold">₦{watchedValues.totalValue?.toLocaleString() || '0.00'}</span>
              </div>
            </div>

            <div>
              <Label htmlFor="inspectionAddress">Address Where Damaged Goods Can Be Inspected *</Label>
              <Textarea
                id="inspectionAddress"
                {...formMethods.register('inspectionAddress', { required: true })}
                placeholder="Enter inspection address"
                rows={2}
              />
            </div>
          </div>
        </FormSection>
      )
    },
    {
      id: 'ownership-transport',
      title: 'Ownership & Transport',
      component: (
        <FormSection title="Ownership and Transport Details" icon={<Shield className="h-5 w-5" />}>
          <div className="space-y-6">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isOwnerOfGoods"
                checked={watchedValues.isOwnerOfGoods}
                onCheckedChange={(checked) => setValue('isOwnerOfGoods', !!checked)}
              />
              <Label htmlFor="isOwnerOfGoods">I am the owner of the goods</Label>
            </div>

            {watchedValues.isOwnerOfGoods && (
              <div className="ml-6 space-y-4">
                <div>
                  <Label htmlFor="howTransported">How/By Whom Were Goods Transported?</Label>
                  <Textarea
                    id="howTransported"
                    {...formMethods.register('howTransported')}
                    placeholder="Describe transportation method and carrier"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="transporterInsurerName">Name of Their Insurers</Label>
                    <Input
                      id="transporterInsurerName"
                      {...formMethods.register('transporterInsurerName')}
                      placeholder="Enter insurer name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="transporterInsurerAddress">Address of Their Insurers</Label>
                    <Textarea
                      id="transporterInsurerAddress"
                      {...formMethods.register('transporterInsurerAddress')}
                      placeholder="Enter insurer address"
                      rows={2}
                    />
                  </div>
                </div>
              </div>
            )}

            {!watchedValues.isOwnerOfGoods && (
              <div className="ml-6 space-y-4">
                <h4 className="font-medium">Claiming as Carrier</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="goodsOwnerName">Name of Goods Owner</Label>
                    <Input
                      id="goodsOwnerName"
                      {...formMethods.register('goodsOwnerName')}
                      placeholder="Enter owner name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="goodsOwnerAddress">Address of Goods Owner</Label>
                    <Textarea
                      id="goodsOwnerAddress"
                      {...formMethods.register('goodsOwnerAddress')}
                      placeholder="Enter owner address"
                      rows={2}
                    />
                  </div>
                  <div>
                    <Label htmlFor="goodsOwnerInsurerName">Name of Their Insurers</Label>
                    <Input
                      id="goodsOwnerInsurerName"
                      {...formMethods.register('goodsOwnerInsurerName')}
                      placeholder="Enter insurer name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="goodsOwnerInsurerAddress">Address of Their Insurers</Label>
                    <Textarea
                      id="goodsOwnerInsurerAddress"
                      {...formMethods.register('goodsOwnerInsurerAddress')}
                      placeholder="Enter insurer address"
                      rows={2}
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="border-t pt-4">
              <h4 className="font-medium mb-4">Vehicle/Transport Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="goodsInSoundCondition"
                    checked={watchedValues.goodsInSoundCondition}
                    onCheckedChange={(checked) => setValue('goodsInSoundCondition', !!checked)}
                  />
                  <Label htmlFor="goodsInSoundCondition">Goods in sound condition on receipt?</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="checkedByDriver"
                    checked={watchedValues.checkedByDriver}
                    onCheckedChange={(checked) => setValue('checkedByDriver', !!checked)}
                  />
                  <Label htmlFor="checkedByDriver">Checked by your driver?</Label>
                </div>
                <div>
                  <Label htmlFor="vehicleRegistration">Vehicle Registration Number *</Label>
                  <Input
                    id="vehicleRegistration"
                    {...formMethods.register('vehicleRegistration', { required: true })}
                    placeholder="Enter registration number"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="staffLoadedUnloaded"
                    checked={watchedValues.staffLoadedUnloaded}
                    onCheckedChange={(checked) => setValue('staffLoadedUnloaded', !!checked)}
                  />
                  <Label htmlFor="staffLoadedUnloaded">Did you or your staff load/unload?</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="receiptGiven"
                    checked={watchedValues.receiptGiven}
                    onCheckedChange={(checked) => setValue('receiptGiven', !!checked)}
                  />
                  <Label htmlFor="receiptGiven">Was a receipt given?</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="claimMadeAgainstYou"
                    checked={watchedValues.claimMadeAgainstYou}
                    onCheckedChange={(checked) => setValue('claimMadeAgainstYou', !!checked)}
                  />
                  <Label htmlFor="claimMadeAgainstYou">Claim made against you?</Label>
                </div>
              </div>

              {watchedValues.claimMadeAgainstYou && (
                <div className="mt-4">
                  <Label htmlFor="claimReceivedDate">Date Claim Received</Label>
                  <Input
                    id="claimReceivedDate"
                    type="date"
                    {...formMethods.register('claimReceivedDate')}
                  />
                </div>
              )}

              <div className="mt-4">
                <FileUpload
                  label="Condition of Carriage Document (if applicable)"
                  accept=".pdf,.jpg,.jpeg,.png"
                  maxSize={3}
                  currentFile={watchedValues.carriageConditionFile?.name}
                  onFileSelect={(file) => {
                    setValue('carriageConditionFile', {
                      name: file.name,
                      type: file.type,
                      url: URL.createObjectURL(file)
                    });
                  }}
                  onFileRemove={() => setValue('carriageConditionFile', undefined)}
                />
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

            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm font-medium text-blue-800">
                For claims status enquiries, call: 01 448 9570
              </p>
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
          <h1 className="text-3xl font-bold text-gray-900">Goods-in-Transit Insurance Claim</h1>
          <p className="text-gray-600 mt-2">
            Please provide accurate information for your goods-in-transit insurance claim.
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
                  <strong>Company:</strong> {watchedValues.companyName}
                </div>
                <div>
                  <strong>Loss Date:</strong> {watchedValues.dateOfLoss}
                </div>
                <div>
                  <strong>Total Value:</strong> ₦{watchedValues.totalValue?.toLocaleString()}
                </div>
              </div>
              
              <div>
                <strong>Goods Items:</strong>
                <div className="mt-2 space-y-1">
                  {watchedValues.goodsItems?.map((item, index) => (
                    <div key={index} className="text-sm">
                      {item.quantity}x {item.description} - ₦{item.value?.toLocaleString()}
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
              <p>Your goods-in-transit claim has been submitted successfully.</p>
              <p className="text-sm text-gray-600 mt-2">
                You will receive a confirmation email shortly with your claim reference number.
              </p>
              <p className="text-sm font-medium mt-4">
                For enquiries, call: 01 448 9570
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

export default GoodsInTransitClaim;