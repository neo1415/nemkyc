import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Calendar as ReactCalendar } from '@/components/ui/calendar';
import { Calendar, CalendarIcon, Upload, Edit2, Truck, FileText, CheckCircle2, Loader2, Plus, Trash2, Info } from 'lucide-react';
import { format } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import MultiStepForm from '@/components/common/MultiStepForm';
import { useFormDraft } from '@/hooks/useFormDraft';
import FileUpload from '@/components/common/FileUpload';
import { uploadFile } from '@/services/fileService';
import { useAuthRequiredSubmit } from '@/hooks/useAuthRequiredSubmit';
import SuccessModal from '@/components/common/SuccessModal';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import PhoneInput from '@/components/common/PhoneInput';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';

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
  const { toast } = useToast();
  const [showSummary, setShowSummary] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPostAuthLoading, setShowPostAuthLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File>>({});
  const { 
    handleSubmitWithAuth, 
    showSuccess: authShowSuccess, 
    setShowSuccess: setAuthShowSuccess,
    isSubmitting: authSubmitting
  } = useAuthRequiredSubmit();

  const formMethods = useForm<any>({
    // resolver: yupResolver(goodsInTransitClaimSchema),
    defaultValues,
    mode: 'onChange'
  });

  const { fields: goodsItemsFields, append: addGoodsItem, remove: removeGoodsItem } = useFieldArray({
    control: formMethods.control,
    name: 'goodsItems'
  });

  const { saveDraft, clearDraft } = useFormDraft('goodsInTransitClaim', formMethods);
  const watchedValues = formMethods.watch();

  // Check for pending submission when component mounts
  useEffect(() => {
    const checkPendingSubmission = () => {
      const hasPending = sessionStorage.getItem('pendingSubmission');
      if (hasPending) {
        setShowPostAuthLoading(true);
        setTimeout(() => setShowPostAuthLoading(false), 5000);
      }
    };
    checkPendingSubmission();
  }, []);

  // Hide post-auth loading when success modal shows
  useEffect(() => {
    if (authShowSuccess) {
      setShowPostAuthLoading(false);
    }
  }, [authShowSuccess]);

  // Auto-save draft
  useEffect(() => {
    const subscription = formMethods.watch((data) => {
      saveDraft(data);
    });
    return () => subscription.unsubscribe();
  }, [formMethods, saveDraft]);

  // Calculate total value from goods items in real-time
  // Old calculation logic: const total = watchedValues.goodsItems?.reduce((sum, item) => sum + (item.value || 0), 0) || 0;
  useEffect(() => {
    const subscription = formMethods.watch((data) => {
      const total = data.goodsItems?.reduce((sum, item) => 
        sum + ((item.quantity || 0) * (item.value || 0)), 0) || 0;
      if (total !== data.totalValue) {
        formMethods.setValue('totalValue', total);
      }
    });
    return () => subscription.unsubscribe();
  }, [formMethods]);

  // Main submit handler that checks authentication
  const handleSubmit = async (data: GoodsInTransitClaimData) => {
    // Prepare file upload data
    const fileUploadPromises: Array<Promise<[string, string]>> = [];
    
    for (const [key, file] of Object.entries(uploadedFiles)) {
      if (file) {
        fileUploadPromises.push(
          uploadFile(file, `goods-in-transit-claims/${Date.now()}-${file.name}`).then(url => [key, url])
        );
      }
    }

    const fileResults = await Promise.all(fileUploadPromises);
    const fileUrls = Object.fromEntries(fileResults);

    const finalData = {
      ...data,
      ...fileUrls,
      status: 'processing',
      formType: 'Goods In Transit Claim'
    };

    await handleSubmitWithAuth(finalData, 'Goods In Transit Claim');
    clearDraft();
    setShowSummary(false);
  };

  const onFinalSubmit = (data: GoodsInTransitClaimData) => {
    setShowSummary(true);
  };

  const DatePickerField = ({ name, label }: { name: string; label: string }) => {
    const value = formMethods.watch(name);
    return (
      <TooltipProvider>
        <div className="space-y-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Label className="flex items-center gap-1">
                {label}
                <Info className="h-3 w-3" />
              </Label>
            </TooltipTrigger>
            <TooltipContent>
              <p>Select the {label.toLowerCase()}</p>
            </TooltipContent>
          </Tooltip>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !value && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {value ? format(new Date(value), "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <ReactCalendar
                mode="single"
                selected={value ? new Date(value) : undefined}
                onSelect={(date) => formMethods.setValue(name, date)}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>
      </TooltipProvider>
    );
  };

  const steps = [
    {
      id: 'policy-details',
      title: 'Policy Details',
      component: (
        <div className="space-y-6">
          <FormField
            control={formMethods.control}
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
              control={formMethods.control}
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
              control={formMethods.control}
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
            control={formMethods.control}
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
            control={formMethods.control}
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
              control={formMethods.control}
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
              control={formMethods.control}
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
            control={formMethods.control}
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
              control={formMethods.control}
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
              control={formMethods.control}
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
            control={formMethods.control}
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
            control={formMethods.control}
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
              control={formMethods.control}
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
              control={formMethods.control}
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
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <FormField
            control={formMethods.control}
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
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        <Label htmlFor={`goodsItems_quantity_${index}`} className="flex items-center gap-1">
                          Quantity *
                          <Info className="h-3 w-3" />
                        </Label>
                        <Input
                          id={`goodsItems_quantity_${index}`}
                          type="number"
                          placeholder="Enter quantity"
                          {...formMethods.register(`goodsItems.${index}.quantity`, {
                            setValueAs: (value) => Number(value)
                          })}
                        />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Enter the quantity of this item</p>
                    </TooltipContent>
                  </Tooltip>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        <Label htmlFor={`goodsItems_description_${index}`} className="flex items-center gap-1">
                          Description *
                          <Info className="h-3 w-3" />
                        </Label>
                         <Textarea
                           id={`goodsItems_description_${index}`}
                           placeholder="Enter description"
                           rows={2}
                           {...formMethods.register(`goodsItems.${index}.description`)}
                         />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Enter a detailed description of the item</p>
                    </TooltipContent>
                  </Tooltip>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        <Label htmlFor={`goodsItems_value_${index}`} className="flex items-center gap-1">
                          Value (₦) *
                          <Info className="h-3 w-3" />
                        </Label>
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
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Enter the monetary value of the item</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
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
            control={formMethods.control}
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
            control={formMethods.control}
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
                control={formMethods.control}
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
                control={formMethods.control}
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
            control={formMethods.control}
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
            control={formMethods.control}
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
            control={formMethods.control}
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
            control={formMethods.control}
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
            control={formMethods.control}
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
            control={formMethods.control}
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

        <div>
          <MultiStepForm
            steps={steps}
      onSubmit={onFinalSubmit}
            formMethods={formMethods}
          />
        </div>

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
        
        {/* Success Modal */}
        <SuccessModal
          isOpen={showSuccess || authShowSuccess || authSubmitting}
          onClose={() => {
            setShowSuccess(false);
            setAuthShowSuccess();
          }}
          title="Goods In Transit Claim Submitted!"
          formType="Goods In Transit Claim"
          isLoading={authSubmitting}
          loadingMessage="Your goods in transit claim is being processed and submitted..."
        />
      </div>

      {/* Post-Authentication Loading Overlay */}
      {showPostAuthLoading && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-card p-8 rounded-lg shadow-lg animate-scale-in max-w-md mx-4">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
              <h3 className="text-xl font-semibold text-primary">Processing Your Submission</h3>
              <p className="text-muted-foreground">
                Thank you for signing in! Your goods in transit claim is now being submitted...
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoodsInTransitClaim;
