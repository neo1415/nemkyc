
import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { Calendar, CheckCircle, Plus, Trash2, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import MultiStepForm from '@/components/common/MultiStepForm';
import { useFormDraft } from '@/hooks/useFormDraft';
import FileUpload from '@/components/common/FileUpload';
import { uploadFile } from '@/services/fileService';
import { db } from '@/firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

const allRiskClaimSchema = yup.object().shape({
  // Policy Details
  policyNumber: yup.string().required("Policy number is required"),
  periodOfCoverFrom: yup.date().required("Period of cover from is required"),
  periodOfCoverTo: yup.date().required("Period of cover to is required"),
  
  // Insured Details
  nameOfInsured: yup.string().required("Name of insured is required"),
  address: yup.string().required("Address is required"),
  phone: yup.string().required("Phone number is required"),
  email: yup.string().email("Invalid email format").required("Email is required"),
  
  // Details of Loss
  typeOfClaim: yup.string().required("Type of claim is required"),
  locationOfClaim: yup.string().required("Location of claim is required"),
  dateOfOccurrence: yup.date().required("Date of occurrence is required"),
  timeOfOccurrence: yup.string().required("Time of occurrence is required"),
  propertyDescription: yup.string().required("Property description is required"),
  circumstancesOfLoss: yup.string().required("Circumstances of loss/damage is required"),
  estimateOfLoss: yup.number().positive("Must be a positive number").required("Estimate of loss/repairs is required"),
  
  // Property Items
  propertyItems: yup.array().of(
    yup.object().shape({
      description: yup.string().required("Description is required"),
      dateOfPurchase: yup.date().required("Date of purchase is required"),
      costPrice: yup.number().positive("Must be a positive number").required("Cost price is required"),
      deductionForAge: yup.number().min(0, "Cannot be negative").required("Deduction for age is required"),
      amountClaimed: yup.number().positive("Must be a positive number").required("Amount claimed is required"),
      remarks: yup.string()
    })
  ).min(1, "At least one property item is required"),
  
  // Ownership & Recovery
  soleOwner: yup.boolean().required("Please specify if you are sole owner"),
  ownershipExplanation: yup.string().when('soleOwner', {
    is: false,
    then: (schema) => schema.required("Ownership explanation is required"),
    otherwise: (schema) => schema
  }),
  hasHirePurchase: yup.boolean().required("Please specify if there's hire purchase agreement"),
  hirePurchaseCompany: yup.string().when('hasHirePurchase', {
    is: true,
    then: (schema) => schema.required("Hire purchase company name is required"),
    otherwise: (schema) => schema
  }),
  hirePurchaseAddress: yup.string().when('hasHirePurchase', {
    is: true,
    then: (schema) => schema.required("Hire purchase company address is required"),
    otherwise: (schema) => schema
  }),
  recoveryStepsTaken: yup.string().required("Recovery steps taken is required"),
  hasOtherInsurance: yup.boolean().required("Please specify if there's other insurance"),
  otherInsuranceDetails: yup.string().when('hasOtherInsurance', {
    is: true,
    then: (schema) => schema.required("Other insurance details are required"),
    otherwise: (schema) => schema
  }),
  hasPreviousLoss: yup.boolean().required("Please specify if you had previous loss"),
  previousLossDetails: yup.string().when('hasPreviousLoss', {
    is: true,
    then: (schema) => schema.required("Previous loss details are required"),
    otherwise: (schema) => schema
  }),
  totalPropertyValue: yup.number().positive("Must be a positive number").required("Total property value is required"),
  hasOtherInsuranceAtTime: yup.boolean().required("Please specify if other insurance was in place"),
  otherInsuranceAtTimeDetails: yup.string().when('hasOtherInsuranceAtTime', {
    is: true,
    then: (schema) => schema.required("Other insurance details are required"),
    otherwise: (schema) => schema
  }),
  hasPriorClaims: yup.boolean().required("Please specify if you had prior claims"),
  priorClaimsDetails: yup.string().when('hasPriorClaims', {
    is: true,
    then: (schema) => schema.required("Prior claims details are required"),
    otherwise: (schema) => schema
  }),
  policeInformed: yup.boolean().required("Please specify if police were informed"),
  policeStationDetails: yup.string().when('policeInformed', {
    is: true,
    then: (schema) => schema.required("Police station details are required"),
    otherwise: (schema) => schema
  }),
  
  // Declaration
  agreeToDataPrivacy: yup.boolean().oneOf([true], "You must agree to the data privacy terms"),
  signature: yup.string().required("Signature is required"),
  signatureDate: yup.date().required("Signature date is required")
});

type AllRiskClaimData = yup.InferType<typeof allRiskClaimSchema>;

const AllRiskClaim: React.FC = () => {
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File>>({});

  const form = useForm({
    resolver: yupResolver(allRiskClaimSchema),
    defaultValues: {
      propertyItems: [{ description: '', dateOfPurchase: undefined, costPrice: undefined, deductionForAge: 0, amountClaimed: undefined, remarks: '' }],
      signatureDate: new Date(),
      soleOwner: true,
      hasHirePurchase: false,
      hasOtherInsurance: false,
      hasPreviousLoss: false,
      hasOtherInsuranceAtTime: false,
      hasPriorClaims: false,
      policeInformed: false
    },
    mode: 'onChange'
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "propertyItems"
  });

  const { saveDraft, loadDraft, clearDraft } = useFormDraft('all-risk-claim', {});

  const watchedValues = form.watch();

  useEffect(() => {
    const draft = loadDraft();
    if (draft) {
      Object.keys(draft).forEach((key) => {
        form.setValue(key as keyof AllRiskClaimData, draft[key]);
      });
    }
  }, [form, loadDraft]);

  useEffect(() => {
    const subscription = form.watch((data) => {
      saveDraft(data);
    });
    return () => subscription.unsubscribe();
  }, [form, saveDraft]);

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      const fileUrls: Record<string, string> = {};
      for (const [key, file] of Object.entries(uploadedFiles)) {
        if (file) {
          const url = await uploadFile(file, `all-risk-claims/${Date.now()}_${file.name}`);
          fileUrls[key] = url;
        }
      }

      await addDoc(collection(db, 'all-risk-claims'), {
        ...data,
        ...fileUrls,
        status: 'processing',
        submittedAt: new Date().toISOString(),
        formType: 'all-risk-claim',
        timestamp: serverTimestamp(),
        createdAt: new Date().toLocaleDateString('en-GB')
      });
      
      clearDraft();
      setShowSuccess(true);
      toast({ title: "All Risk claim submitted successfully!" });
    } catch (error) {
      console.error('Submission error:', error);
      toast({ title: "Submission failed", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileUpload = (fieldName: string) => (file: File) => {
    setUploadedFiles(prev => ({ ...prev, [fieldName]: file }));
  };

  const steps = [
    {
      id: 'policy-details',
      title: 'Policy Details',
      component: (
        <div className="space-y-4">
          <FormField
            control={form.control as any}
            name="policyNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500">
                  <Tooltip>
                    <TooltipTrigger>Policy Number</TooltipTrigger>
                    <TooltipContent>Enter your insurance policy number</TooltipContent>
                  </Tooltip>
                </FormLabel>
                <FormControl>
                  <Input placeholder="Enter policy number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control as any}
              name="periodOfCoverFrom"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500">
                    <Tooltip>
                      <TooltipTrigger>Period of Cover From</TooltipTrigger>
                      <TooltipContent>Start date of your policy coverage</TooltipContent>
                    </Tooltip>
                  </FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <Calendar className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control as any}
              name="periodOfCoverTo"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500">
                    <Tooltip>
                      <TooltipTrigger>Period of Cover To</TooltipTrigger>
                      <TooltipContent>End date of your policy coverage</TooltipContent>
                    </Tooltip>
                  </FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <Calendar className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
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
        <div className="space-y-4">
          <FormField
            control={form.control as any}
            name="nameOfInsured"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500">
                  <Tooltip>
                    <TooltipTrigger>Name of Insured</TooltipTrigger>
                    <TooltipContent>Full name as it appears on the policy</TooltipContent>
                  </Tooltip>
                </FormLabel>
                <FormControl>
                  <Input placeholder="Enter full name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control as any}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500">
                  <Tooltip>
                    <TooltipTrigger>Address</TooltipTrigger>
                    <TooltipContent>Your full residential address</TooltipContent>
                  </Tooltip>
                </FormLabel>
                <FormControl>
                  <Textarea placeholder="Enter full address" rows={3} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control as any}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500">
                    <Tooltip>
                      <TooltipTrigger>Phone Number</TooltipTrigger>
                      <TooltipContent>Your contact phone number</TooltipContent>
                    </Tooltip>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Enter phone number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control as any}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500">
                    <Tooltip>
                      <TooltipTrigger>Email Address</TooltipTrigger>
                      <TooltipContent>Your email address for correspondence</TooltipContent>
                    </Tooltip>
                  </FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="Enter email address" {...field} />
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
      id: 'loss-details',
      title: 'Details of Loss',
      component: (
        <div className="space-y-4">
          <FormField
            control={form.control as any}
            name="typeOfClaim"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500">
                  <Tooltip>
                    <TooltipTrigger>Type of Claim</TooltipTrigger>
                    <TooltipContent>What type of claim are you making?</TooltipContent>
                  </Tooltip>
                </FormLabel>
                <FormControl>
                  <Input placeholder="Enter type of claim" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control as any}
            name="locationOfClaim"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500">
                  <Tooltip>
                    <TooltipTrigger>Location of Claim</TooltipTrigger>
                    <TooltipContent>Where did the incident occur?</TooltipContent>
                  </Tooltip>
                </FormLabel>
                <FormControl>
                  <Textarea placeholder="Enter location where incident occurred" rows={2} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control as any}
              name="dateOfOccurrence"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500">
                    <Tooltip>
                      <TooltipTrigger>Date of Occurrence</TooltipTrigger>
                      <TooltipContent>Date when the incident occurred</TooltipContent>
                    </Tooltip>
                  </FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <Calendar className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control as any}
              name="timeOfOccurrence"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500">
                    <Tooltip>
                      <TooltipTrigger>Time of Occurrence</TooltipTrigger>
                      <TooltipContent>Approximate time when incident occurred</TooltipContent>
                    </Tooltip>
                  </FormLabel>
                  <FormControl>
                    <Input type="time" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control as any}
            name="propertyDescription"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500">
                  <Tooltip>
                    <TooltipTrigger>Describe Property Involved</TooltipTrigger>
                    <TooltipContent>Describe the property involved (model, make, year, etc.)</TooltipContent>
                  </Tooltip>
                </FormLabel>
                <FormControl>
                  <Textarea placeholder="Describe the property involved (model, make, year, etc.)" rows={3} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control as any}
            name="circumstancesOfLoss"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500">
                  <Tooltip>
                    <TooltipTrigger>Circumstances of Loss/Damage</TooltipTrigger>
                    <TooltipContent>Provide detailed circumstances of how the loss or damage occurred</TooltipContent>
                  </Tooltip>
                </FormLabel>
                <FormControl>
                  <Textarea placeholder="Provide detailed circumstances of loss or damage" rows={4} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control as any}
            name="estimateOfLoss"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500">
                  <Tooltip>
                    <TooltipTrigger>Estimate of Loss/Repairs</TooltipTrigger>
                    <TooltipContent>Estimated cost of loss or repairs</TooltipContent>
                  </Tooltip>
                </FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" placeholder="Enter estimated amount" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      )
    },
    {
      id: 'property-details',
      title: 'Property Details',
      component: (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Property Items</h3>
            <Button
              type="button"
              onClick={() => append({ description: '', dateOfPurchase: undefined, costPrice: undefined, deductionForAge: 0, amountClaimed: undefined, remarks: '' })}
              variant="outline"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </div>
          
          {fields.map((field, index) => (
            <Card key={field.id} className="p-4">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-medium">Item {index + 1}</h4>
                {fields.length > 1 && (
                  <Button
                    type="button"
                    onClick={() => remove(index)}
                    variant="ghost"
                    size="sm"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
              
              <div className="space-y-4">
                <FormField
                  control={form.control as any}
                  name={`propertyItems.${index}.description`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500">
                        <Tooltip>
                          <TooltipTrigger>Description</TooltipTrigger>
                          <TooltipContent>Detailed description of the item</TooltipContent>
                        </Tooltip>
                      </FormLabel>
                      <FormControl>
                        <Textarea placeholder="Describe the item in detail" rows={2} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control as any}
                    name={`propertyItems.${index}.dateOfPurchase`}
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500">
                          <Tooltip>
                            <TooltipTrigger>Date of Purchase/Manufacture</TooltipTrigger>
                            <TooltipContent>When was this item purchased or manufactured?</TooltipContent>
                          </Tooltip>
                        </FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <Calendar className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <CalendarComponent
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              initialFocus
                              className={cn("p-3 pointer-events-auto")}
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control as any}
                    name={`propertyItems.${index}.costPrice`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500">
                          <Tooltip>
                            <TooltipTrigger>Cost Price</TooltipTrigger>
                            <TooltipContent>Original purchase price of the item</TooltipContent>
                          </Tooltip>
                        </FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="0.00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control as any}
                    name={`propertyItems.${index}.deductionForAge`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500">
                          <Tooltip>
                            <TooltipTrigger>Deduction for Age/Use/Wear</TooltipTrigger>
                            <TooltipContent>Amount to be deducted for depreciation</TooltipContent>
                          </Tooltip>
                        </FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="0.00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control as any}
                    name={`propertyItems.${index}.amountClaimed`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500">
                          <Tooltip>
                            <TooltipTrigger>Amount Claimed</TooltipTrigger>
                            <TooltipContent>Amount you are claiming for this item</TooltipContent>
                          </Tooltip>
                        </FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="0.00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control as any}
                  name={`propertyItems.${index}.remarks`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        <Tooltip>
                          <TooltipTrigger>Remarks</TooltipTrigger>
                          <TooltipContent>Any additional remarks about this item</TooltipContent>
                        </Tooltip>
                      </FormLabel>
                      <FormControl>
                        <Textarea placeholder="Any additional remarks" rows={2} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </Card>
          ))}
          
          {fields.length === 0 && (
            <div className="text-center p-8 text-gray-500">
              No items added yet. Click "Add Item" to add property information.
            </div>
          )}
        </div>
      )
    },
    {
      id: 'ownership-recovery',
      title: 'Ownership & Recovery Questions',
      component: (
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <FormField
                control={form.control as any}
                name="soleOwner"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel>
                      <Tooltip>
                        <TooltipTrigger>Are you sole owner?</TooltipTrigger>
                        <TooltipContent>Are you the sole owner of the property?</TooltipContent>
                      </Tooltip>
                    </FormLabel>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            {!watchedValues.soleOwner && (
              <FormField
                control={form.control as any}
                name="ownershipExplanation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500">
                      <Tooltip>
                        <TooltipTrigger>Ownership Explanation</TooltipTrigger>
                        <TooltipContent>Explain the ownership structure</TooltipContent>
                      </Tooltip>
                    </FormLabel>
                    <FormControl>
                      <Textarea placeholder="Explain ownership details" rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <FormField
                control={form.control as any}
                name="hasHirePurchase"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel>
                      <Tooltip>
                        <TooltipTrigger>Any hire purchase agreement?</TooltipTrigger>
                        <TooltipContent>Is there a hire purchase agreement on this property?</TooltipContent>
                      </Tooltip>
                    </FormLabel>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            {watchedValues.hasHirePurchase && (
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control as any}
                  name="hirePurchaseCompany"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500">
                        <Tooltip>
                          <TooltipTrigger>Hire Purchase Company Name</TooltipTrigger>
                          <TooltipContent>Name of the hire purchase company</TooltipContent>
                        </Tooltip>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Enter company name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control as any}
                  name="hirePurchaseAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500">
                        <Tooltip>
                          <TooltipTrigger>Hire Purchase Company Address</TooltipTrigger>
                          <TooltipContent>Address of the hire purchase company</TooltipContent>
                        </Tooltip>
                      </FormLabel>
                      <FormControl>
                        <Textarea placeholder="Enter company address" rows={2} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
          </div>

          <FormField
            control={form.control as any}
            name="recoveryStepsTaken"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500">
                  <Tooltip>
                    <TooltipTrigger>Steps Taken to Recover Lost Property</TooltipTrigger>
                    <TooltipContent>What steps have you taken to recover the lost property?</TooltipContent>
                  </Tooltip>
                </FormLabel>
                <FormControl>
                  <Textarea placeholder="Describe steps taken to recover property" rows={3} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <FormField
                control={form.control as any}
                name="hasOtherInsurance"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel>
                      <Tooltip>
                        <TooltipTrigger>Any other insurance on this property?</TooltipTrigger>
                        <TooltipContent>Do you have other insurance covering this property?</TooltipContent>
                      </Tooltip>
                    </FormLabel>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            {watchedValues.hasOtherInsurance && (
              <FormField
                control={form.control as any}
                name="otherInsuranceDetails"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500">
                      <Tooltip>
                        <TooltipTrigger>Other Insurance Details</TooltipTrigger>
                        <TooltipContent>Provide details of other insurance</TooltipContent>
                      </Tooltip>
                    </FormLabel>
                    <FormControl>
                      <Textarea placeholder="Provide other insurance details" rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <FormField
                control={form.control as any}
                name="hasPreviousLoss"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel>
                      <Tooltip>
                        <TooltipTrigger>Ever sustained same loss before?</TooltipTrigger>
                        <TooltipContent>Have you sustained similar loss before?</TooltipContent>
                      </Tooltip>
                    </FormLabel>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            {watchedValues.hasPreviousLoss && (
              <FormField
                control={form.control as any}
                name="previousLossDetails"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500">
                      <Tooltip>
                        <TooltipTrigger>Previous Loss Details</TooltipTrigger>
                        <TooltipContent>Provide details of previous loss</TooltipContent>
                      </Tooltip>
                    </FormLabel>
                    <FormControl>
                      <Textarea placeholder="Provide details of previous loss" rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>

          <FormField
            control={form.control as any}
            name="totalPropertyValue"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500">
                  <Tooltip>
                    <TooltipTrigger>Total Value of Insured Property at Time of Loss</TooltipTrigger>
                    <TooltipContent>What was the total value of all insured property?</TooltipContent>
                  </Tooltip>
                </FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" placeholder="Enter total value" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <FormField
                control={form.control as any}
                name="hasOtherInsuranceAtTime"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel>
                      <Tooltip>
                        <TooltipTrigger>Other insurance in place at time of incident?</TooltipTrigger>
                        <TooltipContent>Was there other insurance in place when the incident occurred?</TooltipContent>
                      </Tooltip>
                    </FormLabel>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            {watchedValues.hasOtherInsuranceAtTime && (
              <FormField
                control={form.control as any}
                name="otherInsuranceAtTimeDetails"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500">
                      <Tooltip>
                        <TooltipTrigger>Insurer/Policy Details</TooltipTrigger>
                        <TooltipContent>Provide insurer and policy details</TooltipContent>
                      </Tooltip>
                    </FormLabel>
                    <FormControl>
                      <Textarea placeholder="Provide insurer and policy details" rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <FormField
                control={form.control as any}
                name="hasPriorClaims"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel>
                      <Tooltip>
                        <TooltipTrigger>Prior claims under any burglary/all risk policy?</TooltipTrigger>
                        <TooltipContent>Have you made prior claims under burglary or all risk policies?</TooltipContent>
                      </Tooltip>
                    </FormLabel>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            {watchedValues.hasPriorClaims && (
              <FormField
                control={form.control as any}
                name="priorClaimsDetails"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500">
                      <Tooltip>
                        <TooltipTrigger>Prior Claims Details</TooltipTrigger>
                        <TooltipContent>Provide details of prior claims</TooltipContent>
                      </Tooltip>
                    </FormLabel>
                    <FormControl>
                      <Textarea placeholder="Provide details of prior claims" rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <FormField
                control={form.control as any}
                name="policeInformed"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel>
                      <Tooltip>
                        <TooltipTrigger>Informed police?</TooltipTrigger>
                        <TooltipContent>Have you informed the police about this incident?</TooltipContent>
                      </Tooltip>
                    </FormLabel>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            {watchedValues.policeInformed && (
              <FormField
                control={form.control as any}
                name="policeStationDetails"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500">
                      <Tooltip>
                        <TooltipTrigger>Police Station Details</TooltipTrigger>
                        <TooltipContent>Provide police station details</TooltipContent>
                      </Tooltip>
                    </FormLabel>
                    <FormControl>
                      <Textarea placeholder="Provide police station details" rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>
        </div>
      )
    },
    {
      id: 'data-privacy',
      title: 'Data Privacy',
      component: (
        <Card className="p-6">
          <CardHeader>
            <CardTitle>Data Privacy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="prose prose-sm max-w-none">
              <p><strong>i.</strong> Your data will solemnly be used for the purposes of this business contract and also to enable us reach you with the updates about our products and services.</p>
              <p><strong>ii.</strong> Please note that your personal data will be treated with utmost respect and is well secured as required by Nigeria Data Protection Regulations 2019.</p>
              <p><strong>iii.</strong> Your personal data shall not be shared with or sold to any third-party without your consent unless we are compelled by law or regulator.</p>
            </div>
          </CardContent>
        </Card>
      )
    },
    {
      id: 'declaration',
      title: 'Declaration & Signature',
      component: (
        <div className="space-y-6">
          <Card className="p-6">
            <CardHeader>
              <CardTitle>Declaration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="prose prose-sm max-w-none">
                <p><strong>1.</strong> I/We declare to the best of my/our knowledge and belief that the information given on this form is true in every respect and agree that if I/we have made any false or fraudulent statement, be it suppression or concealment, the policy shall be cancelled and the claim shall be forfeited.</p>
                <p><strong>2.</strong> I/We agree to provide additional information to NEM Insurance, if required.</p>
                <p><strong>3.</strong> I/We agree to submit all required and requested for documents and NEM Insurance shall not be held responsible for any delay in settlement of claim due to non-fulfillment of requirements.</p>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <FormField
              control={form.control as any}
              name="agreeToDataPrivacy"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500">
                    I agree to the data privacy notice and declaration above
                  </FormLabel>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control as any}
              name="signature"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500">
                    <Tooltip>
                      <TooltipTrigger>Digital Signature</TooltipTrigger>
                      <TooltipContent>Type your full name as signature</TooltipContent>
                    </Tooltip>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Type your full name as signature" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control as any}
              name="signatureDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500">
                    <Tooltip>
                      <TooltipTrigger>Date</TooltipTrigger>
                      <TooltipContent>Date of signature</TooltipContent>
                    </Tooltip>
                  </FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <Calendar className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
      )
    }
  ];

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-slate-900 mb-2">All Risk Claim Form</h1>
              <p className="text-slate-600">Please fill out all required information to submit your claim</p>
            </div>

            <Form {...form}>
              <MultiStepForm
                steps={steps}
                onSubmit={onSubmit}
                isSubmitting={isSubmitting}
                formMethods={form}
              />
            </Form>

            <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-5 w-5" />
                    Claim Submitted Successfully
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Your All Risk claim has been submitted successfully. We will review your claim and contact you soon.
                  </p>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm font-medium">For claims status enquiries:</p>
                    <p className="text-sm">Call: 01 448 9570</p>
                    <p className="text-sm">Email: claims@neminsurance.com</p>
                  </div>
                  <Button onClick={() => setShowSuccess(false)} className="w-full">Close</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default AllRiskClaim;
