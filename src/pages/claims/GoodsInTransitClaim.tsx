import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray, FormProvider } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { GoodsInTransitClaimData } from '../../types/claims';
import { useFormDraft } from '../../hooks/useFormDraft';
import { useToast } from '../../hooks/use-toast';

import MultiStepForm from '../../components/common/MultiStepForm';
import PhoneInput from '../../components/common/PhoneInput';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '../../components/ui/form';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Checkbox } from '../../components/ui/checkbox';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Badge } from '../../components/ui/badge';
import { Loader2, Plus, Trash2 } from 'lucide-react';

const GoodsInTransitClaim: React.FC = () => {
  const { toast } = useToast();
  const [showSummary, setShowSummary] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const methods = useForm<GoodsInTransitClaimData>({
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
      goodsInSoundCondition: true,
      checkedByDriver: true,
      vehicleRegistration: '',
      staffLoadedUnloaded: true,
      receiptGiven: true,
      claimMadeAgainstYou: false,
      agreeToDataPrivacy: false,
      signature: ''
    },
    mode: 'onChange'
  });

  const { fields: goodsItemsFields, append: appendGoodsItem, remove: removeGoodsItem } = useFieldArray({
    control: methods.control,
    name: 'goodsItems'
  });

  const { saveDraft, loadDraft, clearDraft } = useFormDraft('goods-in-transit-claim', methods);

  const watchedValues = methods.watch();

  useEffect(() => {
    const draft = loadDraft();
    if (draft) {
      Object.keys(draft).forEach((key) => {
        methods.setValue(key as keyof GoodsInTransitClaimData, draft[key]);
      });
    }
  }, [methods, loadDraft]);

  useEffect(() => {
    const subscription = methods.watch((data) => {
      saveDraft(data);
    });
    return () => subscription.unsubscribe();
  }, [methods, saveDraft]);

  // Calculate total value from goods items
  useEffect(() => {
    const total = watchedValues.goodsItems?.reduce((sum, item) => sum + (item.value || 0), 0) || 0;
    if (total !== watchedValues.totalValue) {
      methods.setValue('totalValue', total);
    }
  }, [watchedValues.goodsItems, methods, watchedValues.totalValue]);

  const handleSubmit = async (data: GoodsInTransitClaimData) => {
    if (!data.agreeToDataPrivacy) {
      toast({
        title: "Agreement Required",
        description: "You must agree to the data privacy notice and declaration.",
        variant: "destructive",
      });
      return;
    }

    if (!data.signature || data.signature.trim() === '') {
      toast({
        title: "Signature Required",
        description: "Please provide your digital signature.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const docRef = await addDoc(collection(db, 'goodsInTransitClaims'), {
        ...data,
        goodsItems: data.goodsItems,
        totalValue: data.totalValue,
        submittedAt: new Date(),
        status: 'submitted'
      });

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

  const addGoodsItem = () => {
    appendGoodsItem({ quantity: 1, description: '', value: 0 });
  };

  const steps = [
    {
      id: 'policy-details',
      title: 'Policy Details',
      component: (
        <div className="space-y-6">
          <FormField
            control={methods.control}
            name="policyNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Policy Number *</FormLabel>
                <FormControl>
                  <Input placeholder="Enter policy number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={methods.control}
              name="periodOfCoverFrom"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Period of Cover From *</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={methods.control}
              name="periodOfCoverTo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Period of Cover To *</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
      )
    },
    {
      id: 'insured-details',
      title: 'Insured Details',
      component: (
        <div className="space-y-6">
          <FormField
            control={methods.control}
            name="companyName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Company Name *</FormLabel>
                <FormControl>
                  <Input placeholder="Enter company name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={methods.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Address *</FormLabel>
                <FormControl>
                  <Textarea placeholder="Enter full address" rows={3} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={methods.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone *</FormLabel>
                  <FormControl>
                    <PhoneInput
                      value={field.value || ''}
                      onChange={field.onChange}
                      placeholder="Enter phone number"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={methods.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email *</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="Enter email address" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <FormField
            control={methods.control}
            name="businessType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Business Type</FormLabel>
                <FormControl>
                  <Input placeholder="Enter type of business" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      )
    },
    {
      id: 'loss-details',
      title: 'Details of Loss',
      component: (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={methods.control}
              name="dateOfLoss"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date of Loss *</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={methods.control}
              name="timeOfLoss"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Time of Loss *</FormLabel>
                  <FormControl>
                    <Input type="time" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <FormField
            control={methods.control}
            name="placeOfOccurrence"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Place of Occurrence *</FormLabel>
                <FormControl>
                  <Input placeholder="Where did the loss occur?" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={methods.control}
            name="descriptionOfGoods"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description of Goods Concerned *</FormLabel>
                <FormControl>
                  <Textarea placeholder="Describe the goods involved" rows={3} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={methods.control}
              name="numberOfPackages"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Number of Packages *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Enter number"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={methods.control}
              name="totalWeight"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Total Weight *</FormLabel>
                  <FormControl>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Enter weight"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                      <Select 
                        value={watchedValues.weightUnits} 
                        onValueChange={(value) => methods.setValue('weightUnits', value)}
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
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <FormField
            control={methods.control}
            name="howGoodsPacked"
            render={({ field }) => (
              <FormItem>
                <FormLabel>How Goods Were Packed *</FormLabel>
                <FormControl>
                  <Textarea placeholder="Describe packaging method" rows={2} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      )
    },
    {
      id: 'particulars-of-goods',
      title: 'Particulars of Goods',
      component: (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Goods Items</h3>
            <Button
              type="button"
              onClick={addGoodsItem}
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
                <FormField
                  control={methods.control}
                  name={`goodsItems.${index}.quantity`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantity</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Enter quantity"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={methods.control}
                  name={`goodsItems.${index}.description`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter description" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={methods.control}
                  name={`goodsItems.${index}.value`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Value (₦)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Enter value"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
      )
    },
    {
      id: 'circumstances',
      title: 'Circumstances',
      component: (
        <div className="space-y-6">
          <FormField
            control={methods.control}
            name="circumstancesOfLoss"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Circumstances of Loss or Damage *</FormLabel>
                <FormControl>
                  <Textarea placeholder="Provide detailed circumstances" rows={4} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={methods.control}
            name="otherVehicleInvolved"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Another vehicle was involved</FormLabel>
                </div>
              </FormItem>
            )}
          />

          {watchedValues.otherVehicleInvolved && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-6">
              <FormField
                control={methods.control}
                name="otherVehicleOwnerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name of Owner</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter owner's name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={methods.control}
                name="otherVehicleOwnerAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address of Owner</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Enter owner's address" rows={2} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}
        </div>
      )
    },
    {
      id: 'dispatch-details',
      title: 'Dispatch Details',
      component: (
        <div className="space-y-6">
          <FormField
            control={methods.control}
            name="dispatchAddress"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Dispatch Address *</FormLabel>
                <FormControl>
                  <Textarea placeholder="Enter dispatch address" rows={3} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={methods.control}
            name="dispatchDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Dispatch Date *</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={methods.control}
            name="consigneeName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Consignee Name *</FormLabel>
                <FormControl>
                  <Input placeholder="Enter consignee name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={methods.control}
            name="consigneeAddress"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Consignee Address *</FormLabel>
                <FormControl>
                  <Textarea placeholder="Enter consignee address" rows={3} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      )
    },
    {
      id: 'declaration',
      title: 'Declaration',
      component: (
        <div className="space-y-6">
          <FormField
            control={methods.control}
            name="agreeToDataPrivacy"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>
                    I agree to the data privacy notice and declaration *
                  </FormLabel>
                </div>
              </FormItem>
            )}
          />
          
          <FormField
            control={methods.control}
            name="signature"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Digital Signature *</FormLabel>
                <FormControl>
                  <Input placeholder="Type your full name as signature" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      )
    }
  ];

  if (showSuccess) {
    return (
      <div className="max-w-md mx-auto text-center p-6">
        <div className="bg-green-50 rounded-lg p-6 mb-6">
          <h2 className="text-2xl font-bold text-green-800 mb-2">Claim Submitted Successfully!</h2>
          <p className="text-green-600">
            Your goods-in-transit claim has been submitted and you'll receive a confirmation email shortly.
          </p>
        </div>
        <Button onClick={() => window.location.reload()}>
          Submit Another Claim
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Goods-in-Transit Insurance Claim
          </h1>
          <p className="text-lg text-gray-600">
            Please fill out all required information accurately
          </p>
        </div>

        <FormProvider {...methods}>
          <MultiStepForm
            steps={steps}
            onSubmit={onFinalSubmit}
            formMethods={methods}
          />
        </FormProvider>

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
              <Button onClick={() => handleSubmit(watchedValues)} disabled={isSubmitting}>
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
      </div>
    </div>
  );
};

export default GoodsInTransitClaim;