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
  periodOfCoverFrom: yup.date().required("Period of cover from is required").typeError('Please select a valid date'),
  periodOfCoverTo: yup.date().required("Period of cover to is required").typeError('Please select a valid date'),

  // Insured Details
  companyName: yup.string().required("Company name is required"),
  address: yup.string().required("Address is required"),
  phone: yup.string().required("Phone number is required"),
  email: yup.string().email("Valid email is required").required("Email is required"),
  businessType: yup.string(),

  // Loss Details
  dateOfLoss: yup.date().required("Date of loss is required").typeError('Please select a valid date'),
  timeOfLoss: yup.string().required("Time of loss is required"),
  placeOfOccurrence: yup.string().required("Place of occurrence is required"),
  descriptionOfGoods: yup.string().required("Description of goods is required"),
  numberOfPackages: yup.number().required("Number of packages is required").min(1),
  totalWeight: yup.number().required("Total weight is required").min(0),
  totalValue: yup.number().required("Total value is required").min(0),
  goodsPackaging: yup.string().required("Goods packaging description is required"),

  // Circumstances
  lossCircumstances: yup.string().required("Loss circumstances are required"),
  otherVehicleInvolved: yup.boolean(),
  ownerName: yup.string().when('otherVehicleInvolved', {
    is: true,
    then: (schema) => schema.required("Owner name is required"),
    otherwise: (schema) => schema.notRequired()
  }),
  ownerAddress: yup.string().when('otherVehicleInvolved', {
    is: true,
    then: (schema) => schema.required("Owner address is required"),
    otherwise: (schema) => schema.notRequired()
  }),
  witnessName: yup.string(),
  witnessAddress: yup.string(),
  policeStationAdvised: yup.string(),
  dateReportedToPolice: yup
    .date()
    .transform((value, originalValue) => (originalValue === '' ? undefined : value))
    .typeError('Please select a valid date')
    .nullable()
    .notRequired(),
  dispatchAddress: yup.string().required("Dispatch address is required"),
  dispatchDate: yup.date().required("Dispatch date is required").typeError('Please select a valid date'),
  consigneeName: yup.string().required("Consignee name is required"),
  consigneeAddress: yup.string().required("Consignee address is required"),

  // Goods Items
  goodsItems: yup.array().of(
    yup.object().shape({
      quantity: yup.number().required("Quantity is required").min(1, "Quantity must be at least 1"),
      description: yup.string().required("Description is required"),
      value: yup.number().required("Value is required").min(0, "Value must be non-negative")
    })
  ),

  // Inspection
  inspectionAddress: yup.string().required("Inspection address is required"),

  // If owner of goods
  isOwnerOfGoods: yup.boolean(),
  howAndByWhomWereGoodsTransported: yup.string().when('isOwnerOfGoods', {
    is: true,
    then: (schema) => schema.required("Transportation details are required"),
    otherwise: (schema) => schema.notRequired()
  }),
  transporterInsurerName: yup.string().when('isOwnerOfGoods', {
    is: true,
    then: (schema) => schema.required("Transporter insurer name is required"),
    otherwise: (schema) => schema.notRequired()
  }),
  transporterInsurerAddress: yup.string().when('isOwnerOfGoods', {
    is: true,
    then: (schema) => schema.required("Transporter insurer address is required"),
    otherwise: (schema) => schema.notRequired()
  }),

  // If claiming as carrier
  goodsOwnerName: yup.string().when('isOwnerOfGoods', {
    is: false,
    then: (schema) => schema.required("Goods owner name is required"),
    otherwise: (schema) => schema.notRequired()
  }),
  goodsOwnerAddress: yup.string().when('isOwnerOfGoods', {
    is: false,
    then: (schema) => schema.required("Goods owner address is required"),
    otherwise: (schema) => schema.notRequired()
  }),
  goodsOwnerInsurer: yup.string().when('isOwnerOfGoods', {
    is: false,
    then: (schema) => schema.required("Goods owner insurer details are required"),
    otherwise: (schema) => schema.notRequired()
  }),

  // Vehicle/Transport
  goodsSoundOnReceipt: yup.boolean().required("Please confirm if goods were sound on receipt"),
  checkedByDriver: yup.boolean().required("Please confirm if goods were checked by driver"),
  vehicleRegistrationNumber: yup.string().required("Vehicle registration number is required"),
  loadedByYouOrStaff: yup.boolean().required("Please confirm who loaded the goods"),
  receiptGiven: yup.boolean().when('loadedByYouOrStaff', {
    is: true,
    then: (schema) => schema.required("Please confirm if receipt was given"),
    otherwise: (schema) => schema.notRequired()
  }),
  carriageConditionDocument: yup
    .mixed()
    .required("Carriage condition document is required")
    .test('fileType', 'Please upload a PNG, JPG, JPEG, PDF, DOC, or DOCX file', (value) => {
      if (!value) return false;
      const file = Array.isArray(value) ? value[0] : value;
      const allowed = ['image/png','image/jpg','image/jpeg','application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      return file && allowed.includes(file.type);
    })
    .test('fileSize', 'File size must be less than 3MB', (value) => {
      const file = Array.isArray(value) ? value[0] : value;
      return file ? file.size <= 3 * 1024 * 1024 : false;
    }),
  claimMadeAgainstYou: yup.boolean().required("Please confirm if claim was made against you"),
  claimDateReceived: yup
    .date()
    .transform((value, originalValue) => (originalValue === '' ? undefined : value))
    .typeError('Please select a valid date')
    .when('claimMadeAgainstYou', {
      is: true,
      then: (schema) => schema.required("Claim date is required"),
      otherwise: (schema) => schema.notRequired().nullable()
    }),

  // Declaration
  declarationAgreed: yup.boolean().oneOf([true], "You must agree to the declaration"),
  signatureOfPolicyholder: yup.string().required("Signature is required"),
  dateSigned: yup.date().required("Date signed is required").typeError('Please select a valid date')
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
  goodsPackaging: string;

  // Circumstances
  lossCircumstances: string;
  otherVehicleInvolved: boolean;
  ownerName?: string;
  ownerAddress?: string;
  witnessName?: string;
  witnessAddress?: string;
  policeStationAdvised?: string;
  dateReportedToPolice?: Date;
  dispatchAddress: string;
  dispatchDate: Date;
  consigneeName: string;
  consigneeAddress: string;

  // Goods Items
  goodsItems: GoodsItem[];

  // Inspection
  inspectionAddress: string;

  // If owner of goods
  isOwnerOfGoods: boolean;
  howAndByWhomWereGoodsTransported?: string;
  transporterInsurerName?: string;
  transporterInsurerAddress?: string;

  // If claiming as carrier
  goodsOwnerName?: string;
  goodsOwnerAddress?: string;
  goodsOwnerInsurer?: string;

  // Vehicle/Transport
  goodsSoundOnReceipt: boolean;
  checkedByDriver: boolean;
  vehicleRegistrationNumber: string;
  loadedByYouOrStaff: boolean;
  receiptGiven: boolean;
  carriageConditionDocument?: File;
  claimMadeAgainstYou: boolean;
  claimDateReceived?: Date;

  // Declaration
  declarationAgreed: boolean;
  signatureOfPolicyholder: string;
  dateSigned: Date;
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
  goodsPackaging: '',
  lossCircumstances: '',
  otherVehicleInvolved: false,
  ownerName: '',
  ownerAddress: '',
  witnessName: '',
  witnessAddress: '',
  policeStationAdvised: '',
  dispatchAddress: '',
  consigneeName: '',
  consigneeAddress: '',
  goodsItems: [],
  inspectionAddress: '',
  isOwnerOfGoods: false,
  howAndByWhomWereGoodsTransported: '',
  transporterInsurerName: '',
  transporterInsurerAddress: '',
  goodsOwnerName: '',
  goodsOwnerAddress: '',
  goodsOwnerInsurer: '',
  goodsSoundOnReceipt: false,
  checkedByDriver: false,
  vehicleRegistrationNumber: '',
  loadedByYouOrStaff: false,
  receiptGiven: false,
  carriageConditionDocument: undefined,
  claimMadeAgainstYou: false,
  declarationAgreed: false,
  signatureOfPolicyholder: '',
  dateSigned: new Date()
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
    resolver: yupResolver(goodsInTransitClaimSchema),
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

  const stepFieldMappings = {
    0: ['policyNumber', 'periodOfCoverFrom', 'periodOfCoverTo'],
    1: ['companyName', 'address', 'phone', 'email', 'businessType'],
    2: ['dateOfLoss', 'timeOfLoss', 'placeOfOccurrence', 'descriptionOfGoods', 'numberOfPackages', 'totalWeight', 'weightUnits', 'totalValue', 'goodsPackaging'],
    3: ['goodsItems'],
    4: ['lossCircumstances', 'otherVehicleInvolved', 'ownerName', 'ownerAddress', 'witnessName', 'witnessAddress', 'policeStationAdvised', 'dateReportedToPolice', 'dispatchAddress', 'dispatchDate', 'consigneeName', 'consigneeAddress'],
    5: ['inspectionAddress'],
    6: ['isOwnerOfGoods', 'howAndByWhomWereGoodsTransported', 'transporterInsurerName', 'transporterInsurerAddress'],
    7: ['goodsOwnerName', 'goodsOwnerAddress', 'goodsOwnerInsurer'],
    8: ['goodsSoundOnReceipt', 'checkedByDriver', 'vehicleRegistrationNumber', 'loadedByYouOrStaff', 'receiptGiven', 'carriageConditionDocument', 'claimMadeAgainstYou', 'claimDateReceived'],
    9: ['declarationAgreed', 'signatureOfPolicyholder', 'dateSigned']
  };

  const steps = [
    {
      id: 'policy-details',
      title: 'Policy Details',
      component: (
        <div className="space-y-6">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <FormField
                  control={formMethods.control}
                  name="policyNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1">
                        Policy Number *
                        <Info className="h-3 w-3" />
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Enter policy number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TooltipTrigger>
              <TooltipContent>
                <p>Enter your insurance policy number as shown on your policy document</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <div className="grid grid-cols-2 gap-4">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <FormField
                    control={formMethods.control}
                    name="periodOfCoverFrom"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1">
                          Period of Cover From *
                          <Info className="h-3 w-3" />
                        </FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <p>The start date of your insurance policy coverage period</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <FormField
                    control={formMethods.control}
                    name="periodOfCoverTo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1">
                          Period of Cover To *
                          <Info className="h-3 w-3" />
                        </FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <p>The end date of your insurance policy coverage period</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      )
    },
    {
      id: 'insured-details',
      title: 'Insured Details',
      component: (
        <div className="space-y-6">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <FormField
                  control={formMethods.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1">
                        Company Name *
                        <Info className="h-3 w-3" />
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Enter company name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TooltipTrigger>
              <TooltipContent>
                <p>Enter the full legal name of your company as shown on the insurance policy</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <FormField
                  control={formMethods.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1">
                        Address *
                        <Info className="h-3 w-3" />
                      </FormLabel>
                      <FormControl>
                        <Textarea placeholder="Enter full address" rows={3} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TooltipTrigger>
              <TooltipContent>
                <p>Enter your complete business address including street, city, state, and postal code</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <div className="grid grid-cols-2 gap-4">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <FormField
                    control={formMethods.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1">
                          Phone *
                          <Info className="h-3 w-3" />
                        </FormLabel>
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
                </TooltipTrigger>
                <TooltipContent>
                  <p>Enter your primary business phone number where we can reach you regarding this claim</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <FormField
                    control={formMethods.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1">
                          Email *
                          <Info className="h-3 w-3" />
                        </FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="Enter email address" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Enter your business email address for claim correspondence and updates</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <FormField
                  control={formMethods.control}
                  name="businessType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1">
                        Business Type
                        <Info className="h-3 w-3" />
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Enter type of business" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TooltipTrigger>
              <TooltipContent>
                <p>Describe the nature of your business (e.g., manufacturing, retail, logistics, etc.)</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )
    },
    {
      id: 'loss-details',
      title: 'Details of Loss',
      component: (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <FormField
                    control={formMethods.control}
                    name="dateOfLoss"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1">
                          Date of Loss *
                          <Info className="h-3 w-3" />
                        </FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Enter the exact date when the loss or damage to your goods occurred</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <FormField
                    control={formMethods.control}
                    name="timeOfLoss"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1">
                          Time of Loss *
                          <Info className="h-3 w-3" />
                        </FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Enter the approximate time when the loss occurred (24-hour format)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <FormField
                  control={formMethods.control}
                  name="placeOfOccurrence"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1">
                        Place of Occurrence *
                        <Info className="h-3 w-3" />
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Where did the loss occur?" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TooltipTrigger>
              <TooltipContent>
                <p>Specify the exact location where the loss or damage occurred (city, state, landmark, etc.)</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <FormField
                  control={formMethods.control}
                  name="descriptionOfGoods"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1">
                        Description of Goods Concerned *
                        <Info className="h-3 w-3" />
                      </FormLabel>
                      <FormControl>
                        <Textarea placeholder="Describe the goods involved" rows={3} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TooltipTrigger>
              <TooltipContent>
                <p>Provide a detailed description of the goods that were lost or damaged, including type, model, brand, etc.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <div className="grid grid-cols-2 gap-4">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <FormField
                    control={formMethods.control}
                    name="numberOfPackages"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1">
                          Number of Packages *
                          <Info className="h-3 w-3" />
                        </FormLabel>
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
                </TooltipTrigger>
                <TooltipContent>
                  <p>Enter the total number of packages, boxes, containers, or units that were being transported</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <FormField
                    control={formMethods.control}
                    name="totalWeight"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1">
                          Total Weight *
                          <Info className="h-3 w-3" />
                        </FormLabel>
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
                </TooltipTrigger>
                <TooltipContent>
                  <p>Enter the total weight of all goods being transported and select the appropriate unit</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <FormField
                  control={formMethods.control}
                  name="totalValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1">
                        Total Value (₦) *
                        <Info className="h-3 w-3" />
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Enter total value"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TooltipTrigger>
              <TooltipContent>
                <p>Enter the total monetary value of all goods being transported in Nigerian Naira</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <FormField
                  control={formMethods.control}
                  name="goodsPackaging"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1">
                        Goods Packaging *
                        <Info className="h-3 w-3" />
                      </FormLabel>
                      <FormControl>
                        <Textarea placeholder="Describe packaging method" rows={2} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TooltipTrigger>
              <TooltipContent>
                <p>Describe how the goods were packaged (e.g., cardboard boxes, wooden crates, plastic wrap, etc.)</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
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
                      <p>Enter the quantity of this specific item</p>
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
                      <p>Enter a detailed description of this specific item including brand, model, specifications</p>
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
                      <p>Enter the monetary value of this specific item in Nigerian Naira</p>
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
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <FormField
                  control={formMethods.control}
                  name="lossCircumstances"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1">
                        Loss Circumstances *
                        <Info className="h-3 w-3" />
                      </FormLabel>
                      <FormControl>
                        <Textarea placeholder="Provide detailed circumstances of loss" rows={4} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TooltipTrigger>
              <TooltipContent>
                <p>Provide a detailed explanation of how the loss occurred, including all relevant circumstances and events</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
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
                        <FormLabel className="flex items-center gap-1">
                          Other Vehicle Involved
                          <Info className="h-3 w-3" />
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
              </TooltipTrigger>
              <TooltipContent>
                <p>Check this box if another vehicle was involved in the incident that caused the loss</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {watchedValues.otherVehicleInvolved && (
            <div className="ml-6 space-y-4">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <FormField
                      control={formMethods.control}
                      name="ownerName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-1">
                            Owner Name *
                            <Info className="h-3 w-3" />
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="Enter owner's name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Enter the name of the owner of the other vehicle involved in the incident</p>
                  </TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <FormField
                      control={formMethods.control}
                      name="ownerAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-1">
                            Owner Address *
                            <Info className="h-3 w-3" />
                          </FormLabel>
                          <FormControl>
                            <Textarea placeholder="Enter owner's address" rows={3} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Enter the full address of the owner of the other vehicle</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}
          
          <div className="space-y-4">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <FormField
                    control={formMethods.control}
                    name="witnessName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1">
                          Witness Name
                          <Info className="h-3 w-3" />
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="Enter witness name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Enter the name of any witness to the incident</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <FormField
                    control={formMethods.control}
                    name="witnessAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1">
                          Witness Address
                          <Info className="h-3 w-3" />
                        </FormLabel>
                        <FormControl>
                          <Textarea placeholder="Enter witness address" rows={3} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Enter the full address of the witness</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <FormField
                  control={formMethods.control}
                  name="policeStationAdvised"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1">
                        Police Station Advised
                        <Info className="h-3 w-3" />
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Enter police station name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TooltipTrigger>
              <TooltipContent>
                <p>Enter the name of the police station that was notified about the incident</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <FormField
                  control={formMethods.control}
                  name="dateReportedToPolice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1">
                        Date Reported to Police
                        <Info className="h-3 w-3" />
                      </FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TooltipTrigger>
              <TooltipContent>
                <p>Enter the date when the incident was reported to the police</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <FormField
                  control={formMethods.control}
                  name="dispatchAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1">
                        Dispatch Address *
                        <Info className="h-3 w-3" />
                      </FormLabel>
                      <FormControl>
                        <Textarea placeholder="Enter dispatch address" rows={3} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TooltipTrigger>
              <TooltipContent>
                <p>Enter the address from where the goods were dispatched or picked up</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <FormField
                  control={formMethods.control}
                  name="dispatchDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1">
                        Dispatch Date *
                        <Info className="h-3 w-3" />
                      </FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TooltipTrigger>
              <TooltipContent>
                <p>Enter the date when the goods were dispatched or picked up for transport</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <div className="space-y-4">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <FormField
                    control={formMethods.control}
                    name="consigneeName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1">
                          Consignee Name *
                          <Info className="h-3 w-3" />
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="Enter consignee name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Enter the name of the person or company who was to receive the goods</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <FormField
                    control={formMethods.control}
                    name="consigneeAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1">
                          Consignee Address *
                          <Info className="h-3 w-3" />
                        </FormLabel>
                        <FormControl>
                          <Textarea placeholder="Enter consignee address" rows={3} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Enter the full address where the goods were to be delivered</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      )
    },
    {
      id: 'inspection',
      title: 'Where Inspected',
      component: (
        <div className="space-y-6">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <FormField
                  control={formMethods.control}
                  name="inspectionAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1">
                        Inspection Address *
                        <Info className="h-3 w-3" />
                      </FormLabel>
                      <FormControl>
                        <Textarea placeholder="Enter inspection address" rows={3} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TooltipTrigger>
              <TooltipContent>
                <p>Enter the address where the damaged goods can be inspected by our claims assessor</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )
    },
    {
      id: 'owner-details',
      title: 'If You Are Owner of Goods',
      component: (
        <div className="space-y-6">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <FormField
                  control={formMethods.control}
                  name="isOwnerOfGoods"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="flex items-center gap-1">
                          I am the owner of the goods
                          <Info className="h-3 w-3" />
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
              </TooltipTrigger>
              <TooltipContent>
                <p>Check this box if you are the legal owner of the goods that were lost or damaged</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          {watchedValues.isOwnerOfGoods && (
            <div className="space-y-4">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <FormField
                      control={formMethods.control}
                      name="howAndByWhomWereGoodsTransported"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-1">
                            How and By Whom Were Goods Transported *
                            <Info className="h-3 w-3" />
                          </FormLabel>
                          <FormControl>
                            <Textarea placeholder="Describe transportation method and provider" rows={3} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Describe the transportation method used and provide details about the transport company or carrier</p>
                  </TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <FormField
                      control={formMethods.control}
                      name="transporterInsurerName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-1">
                            Transporter Insurer Name *
                            <Info className="h-3 w-3" />
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="Enter transporter's insurer name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Enter the name of the insurance company that covers the transporter</p>
                  </TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <FormField
                      control={formMethods.control}
                      name="transporterInsurerAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-1">
                            Transporter Insurer Address *
                            <Info className="h-3 w-3" />
                          </FormLabel>
                          <FormControl>
                            <Textarea placeholder="Enter transporter's insurer address" rows={3} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Enter the full address of the insurance company that covers the transporter</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}
        </div>
      )
    },
    {
      id: 'carrier-details',
      title: 'If You Are Claiming As Carrier',
      component: (
        <div className="space-y-6">
          {!watchedValues.isOwnerOfGoods && (
            <TooltipProvider>
              <div className="space-y-4">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <FormField
                      control={formMethods.control}
                      name="goodsOwnerName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-1">
                            Goods Owner Name *
                            <Info className="h-3 w-3" />
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="Enter goods owner name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Enter the name of the person or company who owns the goods</p>
                  </TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <FormField
                      control={formMethods.control}
                      name="goodsOwnerAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-1">
                            Goods Owner Address *
                            <Info className="h-3 w-3" />
                          </FormLabel>
                          <FormControl>
                            <Textarea placeholder="Enter goods owner address" rows={3} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Enter the full address of the goods owner</p>
                  </TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <FormField
                      control={formMethods.control}
                      name="goodsOwnerInsurer"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-1">
                            Goods Owner Insurer *
                            <Info className="h-3 w-3" />
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="Enter goods owner insurer details" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Enter the name of the insurance company that covers the goods owner</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </TooltipProvider>
          )}
        </div>
      )
    },
    {
      id: 'vehicle-transport',
      title: 'Vehicle / Transport',
      component: (
        <div className="space-y-6">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <FormField
                  control={formMethods.control}
                  name="goodsSoundOnReceipt"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={(checked) => {
                            field.onChange(checked === true);
                            if (formMethods.formState.errors.goodsSoundOnReceipt) {
                              formMethods.clearErrors('goodsSoundOnReceipt');
                            }
                          }}
                          className={cn(formMethods.formState.errors.goodsSoundOnReceipt && "border-destructive")}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="flex items-center gap-1">
                          Goods Sound on Receipt *
                          <Info className="h-3 w-3" />
                        </FormLabel>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TooltipTrigger>
              <TooltipContent>
                <p>Confirm whether the goods were in good condition when they were received for transport</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <FormField
                  control={formMethods.control}
                  name="checkedByDriver"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={(checked) => {
                            field.onChange(checked === true);
                            if (formMethods.formState.errors.checkedByDriver) {
                              formMethods.clearErrors('checkedByDriver');
                            }
                          }}
                          className={cn(formMethods.formState.errors.checkedByDriver && "border-destructive")}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="flex items-center gap-1">
                          Checked by Driver *
                          <Info className="h-3 w-3" />
                        </FormLabel>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TooltipTrigger>
              <TooltipContent>
                <p>Confirm whether the driver checked the goods before transport</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <FormField
                  control={formMethods.control}
                  name="vehicleRegistrationNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1">
                        Vehicle Registration Number *
                        <Info className="h-3 w-3" />
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Enter vehicle registration number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TooltipTrigger>
              <TooltipContent>
                <p>Enter the registration/license plate number of the vehicle used for transport</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <FormField
                  control={formMethods.control}
                  name="loadedByYouOrStaff"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={(checked) => {
                            field.onChange(checked === true);
                            if (formMethods.formState.errors.loadedByYouOrStaff) {
                              formMethods.clearErrors('loadedByYouOrStaff');
                            }
                          }}
                          className={cn(formMethods.formState.errors.loadedByYouOrStaff && "border-destructive")}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="flex items-center gap-1">
                          Loaded by You or Staff *
                          <Info className="h-3 w-3" />
                        </FormLabel>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TooltipTrigger>
              <TooltipContent>
                <p>Confirm whether you or your staff loaded the goods onto the transport vehicle</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          {watchedValues.loadedByYouOrStaff && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <FormField
                    control={formMethods.control}
                    name="receiptGiven"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 ml-6">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={(checked) => {
                              field.onChange(checked === true);
                              if (formMethods.formState.errors.receiptGiven) {
                                formMethods.clearErrors('receiptGiven');
                              }
                            }}
                            className={cn(formMethods.formState.errors.receiptGiven && "border-destructive")}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="flex items-center gap-1">
                            Receipt Given *
                            <Info className="h-3 w-3" />
                          </FormLabel>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Confirm if a receipt was given when the goods were loaded by you or your staff</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    What condition or carriage do you use (Please attach a specimen-copy) <span className="required-asterisk">*</span>
                    <Info className="h-3 w-3" />
                  </Label>
                  <FileUpload
                    onFileSelect={(file) => {
                      setUploadedFiles(prev => ({ ...prev, carriageConditionDocument: file }));
                      formMethods.setValue('carriageConditionDocument', file);
                      if (formMethods.formState.errors.carriageConditionDocument) {
                        formMethods.clearErrors('carriageConditionDocument');
                      }
                    }}
                    maxSize={3 * 1024 * 1024}
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  />
                  {uploadedFiles.carriageConditionDocument && (
                    <div className="text-sm text-green-600">
                      {uploadedFiles.carriageConditionDocument.name}
                    </div>
                  )}
                  {formMethods.formState.errors.carriageConditionDocument && (
                    <p className="text-sm text-destructive">
                      {formMethods.formState.errors.carriageConditionDocument.message?.toString()}
                    </p>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Upload a document showing the terms and conditions of carriage. This should be a specimen copy of your standard carriage conditions. Maximum file size: 3MB</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <FormField
                  control={formMethods.control}
                  name="claimMadeAgainstYou"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={(checked) => {
                            field.onChange(checked === true);
                            if (formMethods.formState.errors.claimMadeAgainstYou) {
                              formMethods.clearErrors('claimMadeAgainstYou');
                            }
                          }}
                          className={cn(formMethods.formState.errors.claimMadeAgainstYou && "border-destructive")}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="flex items-center gap-1">
                          Claim Made Against You *
                          <Info className="h-3 w-3" />
                        </FormLabel>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TooltipTrigger>
              <TooltipContent>
                <p>Confirm if any claim has been made against you regarding this loss</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          {watchedValues.claimMadeAgainstYou && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <FormField
                    control={formMethods.control}
                    name="claimDateReceived"
                    render={({ field }) => (
                      <FormItem className="ml-6">
                        <FormLabel className="flex items-center gap-1">
                          Claim Date Received *
                          <Info className="h-3 w-3" />
                        </FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Enter the date when you received the claim made against you</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      )
    },
    {
      id: 'declaration',
      title: 'Data Privacy and Declaration',
      component: (
        <div className="space-y-6">
          <div className="p-4 border rounded-lg bg-gray-50">
            <h4 className="font-semibold mb-2">Data Privacy Notice</h4>
            <p className="text-sm text-gray-700 mb-4">
              We collect and process your personal data in accordance with applicable data protection laws. 
              Your information will be used to process your insurance claim and may be shared with relevant 
              third parties including adjusters, investigators, and other insurers as necessary for claim processing. 
              You have rights regarding your personal data including access, correction, and deletion subject to 
              legal and contractual requirements.
            </p>
          </div>
          
          <div className="p-4 border rounded-lg bg-gray-50">
            <h4 className="font-semibold mb-2">Declaration</h4>
            <div className="text-sm text-gray-700 space-y-2">
              <p>1. I/We declare to the best of my/our knowledge and belief that the information given on this form is true in every respect and agree that if I/we have made any false or fraudulent statement, be it suppression or concealment, the policy shall be cancelled and the claim shall be forfeited.</p>
              <p>2. I/We agree that this declaration shall form the basis of the contract between me/us and the Company.</p>
              <p>3. I/We undertake to inform the Company of any other insurance covering the same risk.</p>
              <p>4. I/We authorize the Company to obtain any information from any person, organization or entity that the Company deems necessary to evaluate this claim.</p>
            </div>
          </div>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <FormField
                  control={formMethods.control}
                  name="declarationAgreed"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={(checked) => {
                            field.onChange(checked === true);
                            if (formMethods.formState.errors.declarationAgreed) {
                              formMethods.clearErrors('declarationAgreed');
                            }
                          }}
                          className={cn(formMethods.formState.errors.declarationAgreed && "border-destructive")}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="flex items-center gap-1">
                          I agree to the data privacy notice and declaration above *
                          <Info className="h-3 w-3" />
                        </FormLabel>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TooltipTrigger>
              <TooltipContent>
                <p>You must agree to the data privacy notice and declaration to proceed with your claim</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <FormField
                  control={formMethods.control}
                  name="signatureOfPolicyholder"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1">
                        Signature of Policyholder *
                        <Info className="h-3 w-3" />
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Type your full name as digital signature" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TooltipTrigger>
              <TooltipContent>
                <p>Type your full legal name as it appears on your identification document to serve as your digital signature</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <FormField
                  control={formMethods.control}
                  name="dateSigned"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1">
                        Date Signed *
                        <Info className="h-3 w-3" />
                      </FormLabel>
                      <FormControl>
                        <Input 
                          type="date" 
                          {...field}
                          value={field.value ? format(new Date(field.value), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TooltipTrigger>
              <TooltipContent>
                <p>The date when you are signing this claim form (defaults to today's date)</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
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
            submitButtonText="Submit Goods In Transit Claim"
            stepFieldMappings={stepFieldMappings}
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