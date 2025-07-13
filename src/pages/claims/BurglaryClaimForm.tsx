
import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { CheckCircle, Plus, Trash2, Calendar, Clock } from 'lucide-react';
import MultiStepForm from '@/components/common/MultiStepForm';
import { useFormDraft } from '@/hooks/useFormDraft';
import { uploadFile } from '@/services/fileService';
import { db } from '@/firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import FileUpload from '@/components/common/FileUpload';

const burglaryClaimSchema = yup.object().shape({
  // Policy Details
  policyNumber: yup.string().required("Policy number is required"),
  periodOfCoverFrom: yup.date().required("Period of cover from is required"),
  periodOfCoverTo: yup.date().required("Period of cover to is required"),
  
  // Insured Details
  nameOfInsured: yup.string().required("Name of insured is required"),
  companyName: yup.string(),
  title: yup.string().required("Title is required"),
  dateOfBirth: yup.date().required("Date of birth is required"),
  gender: yup.string().required("Gender is required"),
  address: yup.string().required("Address is required"),
  phone: yup.string().required("Phone number is required"),
  email: yup.string().email("Invalid email format").required("Email is required"),
  
  // Details of Loss
  premisesAddress: yup.string().required("Premises address is required"),
  premisesTelephone: yup.string().required("Premises telephone is required"),
  dateOfTheft: yup.date().required("Date of theft is required"),
  timeOfTheft: yup.string().required("Time of theft is required"),
  howEntryEffected: yup.string().required("How entry was effected is required"),
  roomsEntered: yup.string().required("Rooms entered is required"),
  premisesOccupied: yup.boolean().required("Please specify if premises were occupied"),
  lastOccupiedDate: yup.string().when('premisesOccupied', {
    is: false,
    then: (schema) => schema.required("Last occupied date is required"),
    otherwise: (schema) => schema
  }),
  suspicions: yup.boolean().required("Please specify if you have suspicions"),
  suspicionName: yup.string().when('suspicions', {
    is: true,
    then: (schema) => schema.required("Suspicion name is required"),
    otherwise: (schema) => schema
  }),
  policeInformed: yup.boolean().required("Please specify if police were informed"),
  policeDate: yup.date().when('policeInformed', {
    is: true,
    then: (schema) => schema.required("Police informed date is required"),
    otherwise: (schema) => schema
  }),
  policeStation: yup.string().when('policeInformed', {
    is: true,
    then: (schema) => schema.required("Police station address is required"),
    otherwise: (schema) => schema
  }),
  soleOwner: yup.boolean().required("Please specify if you are sole owner"),
  ownerDetails: yup.string().when('soleOwner', {
    is: false,
    then: (schema) => schema.required("Owner details are required"),
    otherwise: (schema) => schema
  }),
  otherInsurance: yup.boolean().required("Please specify if you have other insurance"),
  otherInsurerDetails: yup.string().when('otherInsurance', {
    is: true,
    then: (schema) => schema.required("Other insurer details are required"),
    otherwise: (schema) => schema
  }),
  totalContentsValue: yup.number().positive("Must be a positive number").required("Total contents value is required"),
  sumInsuredFirePolicy: yup.number().positive("Must be a positive number").required("Sum insured under fire policy is required"),
  fireInsurerName: yup.string().required("Fire insurer name is required"),
  fireInsurerAddress: yup.string().required("Fire insurer address is required"),
  previousLoss: yup.boolean().required("Please specify if you had previous loss"),
  previousLossDetails: yup.string().when('previousLoss', {
    is: true,
    then: (schema) => schema.required("Previous loss details are required"),
    otherwise: (schema) => schema
  }),
  
  // Property Items
  propertyItems: yup.array().of(
    yup.object().shape({
      description: yup.string().required("Description is required"),
      costPrice: yup.number().positive("Must be a positive number").required("Cost price is required"),
      dateOfPurchase: yup.date().required("Date of purchase is required"),
      estimatedValue: yup.number().positive("Must be a positive number").required("Estimated value is required"),
      netAmountClaimed: yup.number().positive("Must be a positive number").required("Net amount claimed is required")
    })
  ).min(1, "At least one property item is required"),
  
  // Declaration
  agreeToDataPrivacy: yup.boolean().oneOf([true], "You must agree to the data privacy terms"),
  signature: yup.string().required("Signature is required"),
  signatureDate: yup.date().required("Signature date is required")
});

type BurglaryClaimData = yup.InferType<typeof burglaryClaimSchema>;

const BurglaryClaimForm: React.FC = () => {
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File>>({});

  const form = useForm({
    resolver: yupResolver(burglaryClaimSchema),
    defaultValues: {
      propertyItems: [{ description: '', costPrice: undefined, dateOfPurchase: undefined, estimatedValue: undefined, netAmountClaimed: undefined }],
      signatureDate: new Date(),
      premisesOccupied: true,
      suspicions: false,
      policeInformed: false,
      soleOwner: true,
      otherInsurance: false,
      previousLoss: false
    },
    mode: 'onChange'
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "propertyItems"
  });

  const { saveDraft, loadDraft, clearDraft } = useFormDraft('burglary-claim', {});

  const watchedValues = form.watch();

  useEffect(() => {
    const draft = loadDraft();
    if (draft) {
      Object.keys(draft).forEach((key) => {
        form.setValue(key as keyof BurglaryClaimData, draft[key]);
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
          const url = await uploadFile(file, `burglary-claims/${Date.now()}_${file.name}`);
          fileUrls[key] = url;
        }
      }

      await addDoc(collection(db, 'burglary-claims'), {
        ...data,
        ...fileUrls,
        status: 'processing',
        submittedAt: new Date().toISOString(),
        formType: 'burglary-claim',
        timestamp: serverTimestamp(),
        createdAt: new Date().toLocaleDateString('en-GB')
      });
      
      clearDraft();
      setShowSuccess(true);
      toast({ title: "Burglary claim submitted successfully!" });
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
            name="companyName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  <Tooltip>
                    <TooltipTrigger>Company Name</TooltipTrigger>
                    <TooltipContent>Company name if applicable</TooltipContent>
                  </Tooltip>
                </FormLabel>
                <FormControl>
                  <Input placeholder="Enter company name (optional)" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control as any}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500">
                    <Tooltip>
                      <TooltipTrigger>Title</TooltipTrigger>
                      <TooltipContent>Select your title</TooltipContent>
                    </Tooltip>
                  </FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select title" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Mr">Mr</SelectItem>
                      <SelectItem value="Mrs">Mrs</SelectItem>
                      <SelectItem value="Miss">Miss</SelectItem>
                      <SelectItem value="Dr">Dr</SelectItem>
                      <SelectItem value="Prof">Prof</SelectItem>
                      <SelectItem value="Chief">Chief</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control as any}
              name="gender"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500">
                    <Tooltip>
                      <TooltipTrigger>Gender</TooltipTrigger>
                      <TooltipContent>Select your gender</TooltipContent>
                    </Tooltip>
                  </FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control as any}
            name="dateOfBirth"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500">
                  <Tooltip>
                    <TooltipTrigger>Date of Birth</TooltipTrigger>
                    <TooltipContent>Your date of birth</TooltipContent>
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
            name="premisesAddress"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500">
                  <Tooltip>
                    <TooltipTrigger>Full Address of Premises Involved</TooltipTrigger>
                    <TooltipContent>Complete address where the burglary occurred</TooltipContent>
                  </Tooltip>
                </FormLabel>
                <FormControl>
                  <Textarea placeholder="Enter full address of premises" rows={3} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control as any}
            name="premisesTelephone"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500">
                  <Tooltip>
                    <TooltipTrigger>Premises Telephone</TooltipTrigger>
                    <TooltipContent>Phone number of the premises</TooltipContent>
                  </Tooltip>
                </FormLabel>
                <FormControl>
                  <Input placeholder="Enter premises telephone" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control as any}
              name="dateOfTheft"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500">
                    <Tooltip>
                      <TooltipTrigger>Date of Theft</TooltipTrigger>
                      <TooltipContent>Date when the theft occurred</TooltipContent>
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
              name="timeOfTheft"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500">
                    <Tooltip>
                      <TooltipTrigger>Time of Theft</TooltipTrigger>
                      <TooltipContent>Approximate time when theft occurred</TooltipContent>
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
            name="howEntryEffected"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500">
                  <Tooltip>
                    <TooltipTrigger>How Entry Was Effected</TooltipTrigger>
                    <TooltipContent>Describe how the burglars gained entry</TooltipContent>
                  </Tooltip>
                </FormLabel>
                <FormControl>
                  <Textarea placeholder="Describe how entry was made" rows={3} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control as any}
            name="roomsEntered"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500">
                  <Tooltip>
                    <TooltipTrigger>Rooms Entered</TooltipTrigger>
                    <TooltipContent>Which rooms were entered by the burglars</TooltipContent>
                  </Tooltip>
                </FormLabel>
                <FormControl>
                  <Textarea placeholder="List the rooms that were entered" rows={2} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <FormField
                control={form.control as any}
                name="premisesOccupied"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel>
                      <Tooltip>
                        <TooltipTrigger>Premises occupied at time of loss?</TooltipTrigger>
                        <TooltipContent>Were the premises occupied when the theft occurred?</TooltipContent>
                      </Tooltip>
                    </FormLabel>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            {!watchedValues.premisesOccupied && (
              <FormField
                control={form.control as any}
                name="lastOccupiedDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500">
                      <Tooltip>
                        <TooltipTrigger>Last Occupied Date/Time</TooltipTrigger>
                        <TooltipContent>When were the premises last occupied?</TooltipContent>
                      </Tooltip>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Enter last occupied date/time" {...field} />
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
                name="suspicions"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel>
                      <Tooltip>
                        <TooltipTrigger>Do you have suspicions on anyone?</TooltipTrigger>
                        <TooltipContent>Do you suspect anyone of involvement?</TooltipContent>
                      </Tooltip>
                    </FormLabel>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            {watchedValues.suspicions && (
              <FormField
                control={form.control as any}
                name="suspicionName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500">
                      <Tooltip>
                        <TooltipTrigger>Name of Suspected Person</TooltipTrigger>
                        <TooltipContent>Name of the person you suspect</TooltipContent>
                      </Tooltip>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Enter name of suspected person" {...field} />
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
                        <TooltipTrigger>Police informed?</TooltipTrigger>
                        <TooltipContent>Have you informed the police about this incident?</TooltipContent>
                      </Tooltip>
                    </FormLabel>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            {watchedValues.policeInformed && (
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control as any}
                  name="policeDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500">
                        <Tooltip>
                          <TooltipTrigger>Date Informed</TooltipTrigger>
                          <TooltipContent>Date when police were informed</TooltipContent>
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
                  name="policeStation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500">
                        <Tooltip>
                          <TooltipTrigger>Police Station Address</TooltipTrigger>
                          <TooltipContent>Address of the police station</TooltipContent>
                        </Tooltip>
                      </FormLabel>
                      <FormControl>
                        <Textarea placeholder="Enter police station address" rows={3} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
          </div>
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
                        <TooltipContent>Are you the sole owner of the stolen property?</TooltipContent>
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
                name="ownerDetails"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500">
                      <Tooltip>
                        <TooltipTrigger>Owner Name & Address</TooltipTrigger>
                        <TooltipContent>Name and address of other owners</TooltipContent>
                      </Tooltip>
                    </FormLabel>
                    <FormControl>
                      <Textarea placeholder="Enter owner name and address" rows={3} {...field} />
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
                name="otherInsurance"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel>
                      <Tooltip>
                        <TooltipTrigger>Any other insurance?</TooltipTrigger>
                        <TooltipContent>Do you have other insurance covering this property?</TooltipContent>
                      </Tooltip>
                    </FormLabel>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            {watchedValues.otherInsurance && (
              <FormField
                control={form.control as any}
                name="otherInsurerDetails"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500">
                      <Tooltip>
                        <TooltipTrigger>Other Insurer Details</TooltipTrigger>
                        <TooltipContent>Details of other insurance coverage</TooltipContent>
                      </Tooltip>
                    </FormLabel>
                    <FormControl>
                      <Textarea placeholder="Enter other insurer details" rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control as any}
              name="totalContentsValue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500">
                    <Tooltip>
                      <TooltipTrigger>Value of Total Contents</TooltipTrigger>
                      <TooltipContent>Total value of all contents in the premises</TooltipContent>
                    </Tooltip>
                  </FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="Enter total value" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control as any}
              name="sumInsuredFirePolicy"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500">
                    <Tooltip>
                      <TooltipTrigger>Sum Insured Under Fire Policy</TooltipTrigger>
                      <TooltipContent>Amount insured under your fire insurance policy</TooltipContent>
                    </Tooltip>
                  </FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="Enter sum insured" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control as any}
              name="fireInsurerName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500">
                    <Tooltip>
                      <TooltipTrigger>Fire Insurer Name</TooltipTrigger>
                      <TooltipContent>Name of your fire insurance company</TooltipContent>
                    </Tooltip>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Enter fire insurer name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control as any}
              name="fireInsurerAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500">
                    <Tooltip>
                      <TooltipTrigger>Fire Insurer Address</TooltipTrigger>
                      <TooltipContent>Address of your fire insurance company</TooltipContent>
                    </Tooltip>
                  </FormLabel>
                  <FormControl>
                    <Textarea placeholder="Enter fire insurer address" rows={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <FormField
                control={form.control as any}
                name="previousLoss"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel>
                      <Tooltip>
                        <TooltipTrigger>Previous burglary/theft loss?</TooltipTrigger>
                        <TooltipContent>Have you had previous burglary or theft losses?</TooltipContent>
                      </Tooltip>
                    </FormLabel>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            {watchedValues.previousLoss && (
              <FormField
                control={form.control as any}
                name="previousLossDetails"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500">
                      <Tooltip>
                        <TooltipTrigger>Previous Loss Details</TooltipTrigger>
                        <TooltipContent>Provide details of previous losses</TooltipContent>
                      </Tooltip>
                    </FormLabel>
                    <FormControl>
                      <Textarea placeholder="Provide details of previous losses" rows={3} {...field} />
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
      id: 'property-details',
      title: 'Property Details',
      component: (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Items Lost or Stolen</h3>
            <Button
              type="button"
              onClick={() => append({ description: '', costPrice: undefined, dateOfPurchase: undefined, estimatedValue: undefined, netAmountClaimed: undefined })}
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
                  
                  <FormField
                    control={form.control as any}
                    name={`propertyItems.${index}.dateOfPurchase`}
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500">
                          <Tooltip>
                            <TooltipTrigger>Date of Purchase</TooltipTrigger>
                            <TooltipContent>When was this item purchased?</TooltipContent>
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
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control as any}
                    name={`propertyItems.${index}.estimatedValue`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500">
                          <Tooltip>
                            <TooltipTrigger>Estimated Value at Time of Loss</TooltipTrigger>
                            <TooltipContent>Current estimated value of the item</TooltipContent>
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
                    name={`propertyItems.${index}.netAmountClaimed`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500">
                          <Tooltip>
                            <TooltipTrigger>Net Amount Claimed</TooltipTrigger>
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
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Burglary, Housebreaking and Larceny Claim Form</h1>
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
                    Your Burglary claim has been submitted successfully.
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

export default BurglaryClaimForm;
