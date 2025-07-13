import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../firebase/config';
// import { goodsInTransitSchema } from '../../utils/validation';
import { GoodsInTransitClaimData } from '../../types/claims';
import { emailService } from '../../services/emailService';
import { useFormDraft } from '../../hooks/useFormDraft';
import { useToast } from '../../hooks/use-toast';

import MultiStepForm from '../../components/common/MultiStepForm';
import FileUpload from '../../components/common/FileUpload';
import PhoneInput from '../../components/common/PhoneInput';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Checkbox } from '../../components/ui/checkbox';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Badge } from '../../components/ui/badge';
import { Label } from '../../components/ui/label';
import { Loader2, Plus, Trash2, Building2, MapPin, Clock, Package, FileText, Shield } from 'lucide-react';

const GoodsInTransitClaim: React.FC = () => {
  const { toast } = useToast();
  const [showSummary, setShowSummary] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formMethods = useForm<GoodsInTransitClaimData>({
    // resolver: yupResolver(goodsInTransitSchema) as any,
    defaultValues: {
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
      // transportMethod: '',
      // transporterInsurer: '',
      // ownerName: '',
      // ownerInsurer: '',
      goodsInSoundCondition: true,
      checkedByDriver: true,
      vehicleRegistration: '',
      staffLoadedUnloaded: true,
      receiptGiven: true,
      claimMadeAgainstYou: false,
      // claimDateReceived: '',
      agreeToDataPrivacy: false,
      signature: ''
    },
    mode: 'onChange'
  });

  const { fields: goodsItemsFields, append: appendGoodsItem, remove: removeGoodsItem } = useFieldArray({
    control: formMethods.control,
    name: 'goodsItems'
  });

  const { saveDraft, loadDraft, clearDraft } = useFormDraft('goods-in-transit-claim', formMethods);

  const watchedValues = formMethods.watch();

  useEffect(() => {
    const draft = loadDraft();
    if (draft) {
      Object.keys(draft).forEach((key) => {
        formMethods.setValue(key as keyof GoodsInTransitClaimData, draft[key]);
      });
    }
  }, [formMethods, loadDraft]);

  useEffect(() => {
    const subscription = formMethods.watch((data) => {
      saveDraft(data);
    });
    return () => subscription.unsubscribe();
  }, [formMethods, saveDraft]);

  // Calculate total value from goods items
  useEffect(() => {
    const total = watchedValues.goodsItems?.reduce((sum, item) => sum + (item.value || 0), 0) || 0;
    if (total !== watchedValues.totalValue) {
      formMethods.setValue('totalValue', total);
    }
  }, [watchedValues.goodsItems, formMethods, watchedValues.totalValue]);

  const handleSubmit = async (data: GoodsInTransitClaimData) => {
    setIsSubmitting(true);
    try {
      // Save to Firestore
      const docRef = await addDoc(collection(db, 'goodsInTransitClaims'), {
        ...data,
        submittedAt: new Date(),
        status: 'submitted'
      });

      // Send confirmation email
      await emailService.sendSubmissionConfirmation(
        data.email,
        'Goods-in-Transit Insurance Claim'
      );

      clearDraft();
      setShowSummary(false);
      setShowSuccess(true);
      
      toast({
        title: "Claim Submitted Successfully",
        description: "Your goods-in-transit claim has been submitted and you'll receive a confirmation email shortly.",
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

  const onFinalSubmit = (data: GoodsInTransitClaimData) => {
    setShowSummary(true);
  };

  const steps = [
    {
      id: 'policy-details',
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
      id: 'insured-details',
      title: 'Insured Details',
      component: (
        <div className="space-y-6">
          <div>
            <Label htmlFor="companyName">Company Name *</Label>
            <Input
              id="companyName"
              {...formMethods.register('companyName')}
              placeholder="Enter company name"
            />
            {formMethods.formState.errors.companyName && (
              <p className="text-sm text-red-600">{formMethods.formState.errors.companyName.message}</p>
            )}
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
              <Label htmlFor="phone">Phone *</Label>
              <PhoneInput
                value={watchedValues.phone || ''}
                onChange={(value) => formMethods.setValue('phone', value)}
                placeholder="Enter phone number"
              />
              {formMethods.formState.errors.phone && (
                <p className="text-sm text-red-600">{formMethods.formState.errors.phone.message}</p>
              )}
            </div>
            
            <div>
              <Label htmlFor="email">Email *</Label>
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
          
          <div>
            <Label htmlFor="businessType">Business Type</Label>
            <Input
              id="businessType"
              {...formMethods.register('businessType')}
              placeholder="Enter type of business"
            />
          </div>
        </div>
      )
    },
    {
      id: 'loss-details',
      title: 'Details of Loss',
      component: (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="dateOfLoss">Date of Loss *</Label>
              <Input
                id="dateOfLoss"
                type="date"
                {...formMethods.register('dateOfLoss')}
              />
              {formMethods.formState.errors.dateOfLoss && (
                <p className="text-sm text-red-600">{formMethods.formState.errors.dateOfLoss.message}</p>
              )}
            </div>
            
            <div>
              <Label htmlFor="timeOfLoss">Time of Loss *</Label>
              <Input
                id="timeOfLoss"
                type="time"
                {...formMethods.register('timeOfLoss')}
              />
              {formMethods.formState.errors.timeOfLoss && (
                <p className="text-sm text-red-600">{formMethods.formState.errors.timeOfLoss.message}</p>
              )}
            </div>
          </div>
          
          <div>
            <Label htmlFor="placeOfOccurrence">Place of Occurrence *</Label>
            <Input
              id="placeOfOccurrence"
              {...formMethods.register('placeOfOccurrence')}
              placeholder="Where did the loss occur?"
            />
            {formMethods.formState.errors.placeOfOccurrence && (
              <p className="text-sm text-red-600">{formMethods.formState.errors.placeOfOccurrence.message}</p>
            )}
          </div>
          
          <div>
            <Label htmlFor="descriptionOfGoods">Description of Goods Concerned *</Label>
            <Textarea
              id="descriptionOfGoods"
              {...formMethods.register('descriptionOfGoods')}
              placeholder="Describe the goods involved"
              rows={3}
            />
            {formMethods.formState.errors.descriptionOfGoods && (
              <p className="text-sm text-red-600">{formMethods.formState.errors.descriptionOfGoods.message}</p>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="numberOfPackages">Number of Packages *</Label>
              <Input
                id="numberOfPackages"
                type="number"
                {...formMethods.register('numberOfPackages', { valueAsNumber: true })}
                placeholder="Enter number"
              />
              {formMethods.formState.errors.numberOfPackages && (
                <p className="text-sm text-red-600">{formMethods.formState.errors.numberOfPackages.message}</p>
              )}
            </div>
            
            <div>
              <Label htmlFor="totalWeight">Total Weight *</Label>
              <div className="flex gap-2">
                <Input
                  id="totalWeight"
                  type="number"
                  step="0.01"
                  {...formMethods.register('totalWeight', { valueAsNumber: true })}
                  placeholder="Enter weight"
                />
                <Select 
                  value={watchedValues.weightUnits} 
                  onValueChange={(value) => formMethods.setValue('weightUnits', value)}
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
              {formMethods.formState.errors.totalWeight && (
                <p className="text-sm text-red-600">{formMethods.formState.errors.totalWeight.message}</p>
              )}
            </div>
          </div>
          
          <div>
            <Label htmlFor="howGoodsPacked">How Goods Were Packed *</Label>
            <Textarea
              id="howGoodsPacked"
              {...formMethods.register('howGoodsPacked')}
              placeholder="Describe packaging method"
              rows={2}
            />
            {formMethods.formState.errors.howGoodsPacked && (
              <p className="text-sm text-red-600">{formMethods.formState.errors.howGoodsPacked.message}</p>
            )}
          </div>
        </div>
      )
    },
    {
      id: 'circumstances',
      title: 'Circumstances',
      component: (
        <div className="space-y-6">
          <div>
            <Label htmlFor="circumstancesOfLoss">Circumstances of Loss or Damage *</Label>
            <Textarea
              id="circumstancesOfLoss"
              {...formMethods.register('circumstancesOfLoss')}
              placeholder="Provide detailed circumstances"
              rows={4}
            />
            {formMethods.formState.errors.circumstancesOfLoss && (
              <p className="text-sm text-red-600">{formMethods.formState.errors.circumstancesOfLoss.message}</p>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="otherVehicleInvolved"
              checked={watchedValues.otherVehicleInvolved}
              onCheckedChange={(checked) => formMethods.setValue('otherVehicleInvolved', !!checked)}
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
                {...formMethods.register('dispatchAddress')}
                placeholder="Enter dispatch address"
                rows={2}
              />
              {formMethods.formState.errors.dispatchAddress && (
                <p className="text-sm text-red-600">{formMethods.formState.errors.dispatchAddress.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="dispatchDate">Dispatch Date *</Label>
              <Input
                id="dispatchDate"
                type="date"
                {...formMethods.register('dispatchDate')}
              />
              {formMethods.formState.errors.dispatchDate && (
                <p className="text-sm text-red-600">{formMethods.formState.errors.dispatchDate.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="consigneeName">Consignee Name *</Label>
              <Input
                id="consigneeName"
                {...formMethods.register('consigneeName')}
                placeholder="Enter consignee name"
              />
              {formMethods.formState.errors.consigneeName && (
                <p className="text-sm text-red-600">{formMethods.formState.errors.consigneeName.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="consigneeAddress">Consignee Address *</Label>
              <Textarea
                id="consigneeAddress"
                {...formMethods.register('consigneeAddress')}
                placeholder="Enter consignee address"
                rows={2}
              />
              {formMethods.formState.errors.consigneeAddress && (
                <p className="text-sm text-red-600">{formMethods.formState.errors.consigneeAddress.message}</p>
              )}
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'goods-particulars',
      title: 'Particulars of Goods',
      component: (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Items List</h3>
            <Button
              type="button"
              onClick={() => appendGoodsItem({ quantity: 1, description: '', value: 0 })}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Item
            </Button>
          </div>

          {goodsItemsFields.map((field, index) => (
            <Card key={field.id} className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor={`goodsItems.${index}.quantity`}>Quantity *</Label>
                  <Input
                    id={`goodsItems.${index}.quantity`}
                    type="number"
                    {...formMethods.register(`goodsItems.${index}.quantity`, { valueAsNumber: true })}
                    placeholder="Qty"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor={`goodsItems.${index}.description`}>Description *</Label>
                  <Input
                    id={`goodsItems.${index}.description`}
                    {...formMethods.register(`goodsItems.${index}.description`)}
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
                      {...formMethods.register(`goodsItems.${index}.value`, { valueAsNumber: true })}
                      placeholder="0.00"
                    />
                  </div>
                  {goodsItemsFields.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeGoodsItem(index)}
                      className="mt-6 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}

          <div className="mt-4 p-4 bg-muted rounded-lg">
            <div className="text-lg font-semibold">
              Total Value: ₦{watchedValues.totalValue?.toLocaleString() || 0}
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'inspection',
      title: 'Where Inspected',
      component: (
        <div className="space-y-6">
          <div>
            <Label htmlFor="inspectionAddress">Address where damaged goods can be inspected *</Label>
            <Textarea
              id="inspectionAddress"
              {...formMethods.register('inspectionAddress')}
              placeholder="Enter inspection address"
              rows={3}
            />
            {formMethods.formState.errors.inspectionAddress && (
              <p className="text-sm text-red-600">{formMethods.formState.errors.inspectionAddress.message}</p>
            )}
          </div>
        </div>
      )
    },
    {
      id: 'owner-details',
      title: 'If you are owner of goods',
      component: (
        <div className="space-y-6">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isOwnerOfGoods"
              checked={watchedValues.isOwnerOfGoods}
              onCheckedChange={(checked) => formMethods.setValue('isOwnerOfGoods', !!checked)}
            />
            <Label htmlFor="isOwnerOfGoods">I am the owner of the goods</Label>
          </div>

          {watchedValues.isOwnerOfGoods && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="transportMethod">How/by whom were goods transported? *</Label>
                <Textarea
                  id="transportMethod"
                  {...formMethods.register('howGoodsPacked')}
                  placeholder="Describe transport method and company"
                  rows={2}
                />
              </div>
              
              <div>
                <Label htmlFor="transporterInsurer">Name & address of their insurers</Label>
                <Textarea
                  id="transporterInsurer"
                  {...formMethods.register('circumstancesOfLoss')}
                  placeholder="Enter transporter's insurer details"
                  rows={2}
                />
              </div>
            </div>
          )}

          {!watchedValues.isOwnerOfGoods && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="ownerName">Name & address of goods owner</Label>
                <Textarea
                  id="ownerName"
                  {...formMethods.register('dispatchAddress')}
                  placeholder="Enter owner details"
                  rows={2}
                />
              </div>
              
              <div>
                <Label htmlFor="ownerInsurer">Name & address of their insurers</Label>
                <Textarea
                  id="ownerInsurer"
                  {...formMethods.register('consigneeAddress')}
                  placeholder="Enter owner's insurer details"
                  rows={2}
                />
              </div>
            </div>
          )}
        </div>
      )
    },
    {
      id: 'vehicle-transport',
      title: 'Vehicle / Transport',
      component: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="goodsInSoundCondition"
                checked={watchedValues.goodsInSoundCondition}
                onCheckedChange={(checked) => formMethods.setValue('goodsInSoundCondition', !!checked)}
              />
              <Label htmlFor="goodsInSoundCondition">Goods in sound condition on receipt?</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="checkedByDriver"
                checked={watchedValues.checkedByDriver}
                onCheckedChange={(checked) => formMethods.setValue('checkedByDriver', !!checked)}
              />
              <Label htmlFor="checkedByDriver">Checked by your driver?</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="staffLoadedUnloaded"
                checked={watchedValues.staffLoadedUnloaded}
                onCheckedChange={(checked) => formMethods.setValue('staffLoadedUnloaded', !!checked)}
              />
              <Label htmlFor="staffLoadedUnloaded">Did you or your staff load/unload?</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="receiptGiven"
                checked={watchedValues.receiptGiven}
                onCheckedChange={(checked) => formMethods.setValue('receiptGiven', !!checked)}
              />
              <Label htmlFor="receiptGiven">Was a receipt given?</Label>
            </div>
          </div>

          <div>
            <Label htmlFor="vehicleRegistration">Vehicle registration number</Label>
            <Input
              id="vehicleRegistration"
              {...formMethods.register('vehicleRegistration')}
              placeholder="Enter vehicle registration"
            />
          </div>

          <div>
            <Label htmlFor="carriageConditions">Condition of carriage (upload specimen if needed)</Label>
            <FileUpload
              accept=".pdf,.jpg,.png"
              maxSize={3}
              onFileSelect={(file) => {
                // Handle file upload logic here
                console.log('File selected:', file);
              }}
              label="Upload carriage conditions document"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="claimMadeAgainstYou"
              checked={watchedValues.claimMadeAgainstYou}
              onCheckedChange={(checked) => formMethods.setValue('claimMadeAgainstYou', !!checked)}
            />
            <Label htmlFor="claimMadeAgainstYou">Claim made against you?</Label>
          </div>

          {watchedValues.claimMadeAgainstYou && (
            <div>
              <Label htmlFor="claimDateReceived">Date received</Label>
              <Input
                id="claimDateReceived"
                type="date"
                {...formMethods.register('dispatchDate')}
              />
            </div>
          )}
        </div>
      )
    },
    {
      id: 'data-privacy',
      title: 'Data Privacy & Declaration',
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
                  I agree to the data privacy notice and declaration above *
                </Label>
              </div>
              {formMethods.formState.errors.agreeToDataPrivacy && (
                <p className="text-sm text-red-600">{formMethods.formState.errors.agreeToDataPrivacy.message}</p>
              )}

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
              Goods-in-Transit Insurance Claim Form
            </h1>
            <p className="text-muted-foreground">
              Please fill out all required information to submit your claim
            </p>
          </div>

          <MultiStepForm
            steps={steps}
            onSubmit={onFinalSubmit}
            isSubmitting={isSubmitting}
            submitButtonText="Submit Claim"
            formMethods={formMethods}
          />

          {/* Summary Modal */}
          <Dialog open={showSummary} onOpenChange={setShowSummary}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Review Your Claim</DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                {/* Summary content here */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <h4 className="font-semibold">Policy Details</h4>
                    <p>Policy Number: {watchedValues.policyNumber}</p>
                    <p>Period: {watchedValues.periodOfCoverFrom} to {watchedValues.periodOfCoverTo}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold">Company Information</h4>
                    <p>Company: {watchedValues.companyName}</p>
                    <p>Email: {watchedValues.email}</p>
                    <p>Phone: {watchedValues.phone}</p>
                  </div>
                  <div className="md:col-span-2">
                    <h4 className="font-semibold">Claim Details</h4>
                    <p>Date of Loss: {watchedValues.dateOfLoss}</p>
                    <p>Place: {watchedValues.placeOfOccurrence}</p>
                    <p>Total Value: ₦{watchedValues.totalValue?.toLocaleString()}</p>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowSummary(false)}>
                  Edit Details
                </Button>
                <Button onClick={() => handleSubmit(watchedValues)} disabled={isSubmitting}>
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
                <p>Your goods-in-transit claim has been submitted successfully.</p>
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

export default GoodsInTransitClaim;