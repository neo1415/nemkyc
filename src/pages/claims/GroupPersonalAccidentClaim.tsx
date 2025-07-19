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
import { Calendar, CalendarIcon, Upload, Edit2, Users, FileText, CheckCircle2, Loader2, Plus, Trash2, Info } from 'lucide-react';
import { format } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import MultiStepForm from '@/components/common/MultiStepForm';
import { useFormDraft } from '@/hooks/useFormDraft';
import FileUpload from '@/components/common/FileUpload';
import { uploadFile } from '@/services/fileService';
import { db } from '@/firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
// import { emailService } from '@/services/emailService';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { useAuthRequiredSubmit } from '@/hooks/useAuthRequiredSubmit';
import SuccessModal from '@/components/common/SuccessModal';

// Group Personal Accident Claim Schema
const groupPersonalAccidentClaimSchema = yup.object().shape({
  // Policy Details
  policyNumber: yup.string().required("Policy number is required"),
  periodOfCoverFrom: yup.date().required("Period of cover from is required"),
  periodOfCoverTo: yup.date().required("Period of cover to is required"),

  // Insured Details
  companyName: yup.string().required("Company name is required"),
  address: yup.string().required("Address is required"),
  phone: yup.string().required("Phone number is required"),
  email: yup.string().email("Valid email is required").required("Email is required"),

  // Accident Details
  accidentDate: yup.date().required("Accident date is required"),
  accidentTime: yup.string().required("Accident time is required"),
  accidentPlace: yup.string().required("Accident place is required"),
  incidentDescription: yup.string().required("Incident description is required"),
  particularsOfInjuries: yup.string().required("Particulars of injuries is required"),

  // Doctor Details
  doctorName: yup.string().required("Doctor name is required"),
  doctorAddress: yup.string().required("Doctor address is required"),
  isUsualDoctor: yup.boolean(),

  // Witnesses
  witnesses: yup.array().of(
    yup.object().shape({
      name: yup.string().required("Witness name is required"),
      address: yup.string().required("Witness address is required")
    })
  ),

  // Declaration
  agreeToDataPrivacy: yup.boolean().oneOf([true], "You must agree to data privacy"),
  signature: yup.string().required("Signature is required")
});

interface Witness {
  name: string;
  address: string;
}

interface GroupPersonalAccidentClaimData {
  // Policy Details
  policyNumber: string;
  periodOfCoverFrom: Date;
  periodOfCoverTo: Date;

  // Insured Details
  companyName: string;
  address: string;
  phone: string;
  email: string;

  // Accident Details
  accidentDate: Date;
  accidentTime: string;
  accidentPlace: string;
  incidentDescription: string;
  particularsOfInjuries: string;

  // Doctor Details
  doctorName: string;
  doctorAddress: string;
  isUsualDoctor: boolean;
  totalIncapacityFrom?: string;
  totalIncapacityTo?: string;
  partialIncapacityFrom?: string;
  partialIncapacityTo?: string;

  // Other Insurer
  otherInsurerName?: string;
  otherInsurerAddress?: string;
  otherPolicyNumber?: string;

  // Witnesses
  witnesses: Witness[];

  // Declaration
  agreeToDataPrivacy: boolean;
  signature: string;
}

const defaultValues: Partial<GroupPersonalAccidentClaimData> = {
  policyNumber: '',
  companyName: '',
  address: '',
  phone: '',
  email: '',
  accidentTime: '',
  accidentPlace: '',
  incidentDescription: '',
  particularsOfInjuries: '',
  doctorName: '',
  doctorAddress: '',
  isUsualDoctor: false,
  totalIncapacityFrom: '',
  totalIncapacityTo: '',
  partialIncapacityFrom: '',
  partialIncapacityTo: '',
  otherInsurerName: '',
  otherInsurerAddress: '',
  otherPolicyNumber: '',
  witnesses: [],
  agreeToDataPrivacy: false,
  signature: ''
};

const GroupPersonalAccidentClaim: React.FC = () => {
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

  // Check for pending submission when component mounts
  useEffect(() => {
    const checkPendingSubmission = () => {
      const hasPending = sessionStorage.getItem('pendingSubmission');
      if (hasPending) {
        setShowPostAuthLoading(true);
        // Hide loading after 5 seconds max (in case something goes wrong)
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

  const formMethods = useForm<any>({
    // resolver: yupResolver(groupPersonalAccidentClaimSchema),
    defaultValues,
    mode: 'onChange'
  });

  const { fields: witnessFields, append: addWitness, remove: removeWitness } = useFieldArray({
    control: formMethods.control,
    name: 'witnesses'
  });

  const { saveDraft, clearDraft } = useFormDraft('groupPersonalAccidentClaim', formMethods);
  const watchedValues = formMethods.watch();

  // Auto-save draft
  useEffect(() => {
    const subscription = formMethods.watch((data) => {
      saveDraft(data);
    });
    return () => subscription.unsubscribe();
  }, [formMethods, saveDraft]);

  // Main submit handler that checks authentication
  const handleSubmit = async (data: GroupPersonalAccidentClaimData) => {
    // Prepare file upload data
    const fileUploadPromises: Array<Promise<[string, string]>> = [];
    
    for (const [key, file] of Object.entries(uploadedFiles)) {
      if (file) {
        fileUploadPromises.push(
          uploadFile(file, `group-personal-accident-claims/${Date.now()}-${file.name}`).then(url => [key, url])
        );
      }
    }

    const fileResults = await Promise.all(fileUploadPromises);
    const fileUrls = Object.fromEntries(fileResults);

    const finalData = {
      ...data,
      ...fileUrls,
      status: 'processing',
      formType: 'Group Personal Accident Claim'
    };

    await handleSubmitWithAuth(finalData, 'Group Personal Accident Claim');
    clearDraft();
    setShowSummary(false);
  };

  const onFinalSubmit = (data: GroupPersonalAccidentClaimData) => {
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
      id: 'policy',
      title: 'Policy Details',
      component: (
        <div className="space-y-4">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <Label htmlFor="policyNumber" className="flex items-center gap-1">
                    Policy Number *
                    <Info className="h-3 w-3" />
                  </Label>
                  <Input
                    id="policyNumber"
                    {...formMethods.register('policyNumber')}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Enter your group personal accident insurance policy number</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DatePickerField
              name="periodOfCoverFrom"
              label="Period of Cover From *"
            />
            <DatePickerField
              name="periodOfCoverTo"
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
        <TooltipProvider>
          <div className="space-y-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <Label htmlFor="companyName" className="flex items-center gap-1">
                    Company Name *
                    <Info className="h-3 w-3" />
                  </Label>
                  <Input
                    id="companyName"
                    {...formMethods.register('companyName')}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Enter the insured company name</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <Label htmlFor="address" className="flex items-center gap-1">
                    Address *
                    <Info className="h-3 w-3" />
                  </Label>
                  <Textarea
                    id="address"
                    placeholder="Enter full address"
                    rows={3}
                    {...formMethods.register('address')}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Enter the complete address</p>
              </TooltipContent>
            </Tooltip>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Label htmlFor="phone" className="flex items-center gap-1">
                      Phone Number *
                      <Info className="h-3 w-3" />
                    </Label>
                    <Input
                      id="phone"
                      {...formMethods.register('phone')}
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Enter contact phone number</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Label htmlFor="email" className="flex items-center gap-1">
                      Email Address *
                      <Info className="h-3 w-3" />
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      {...formMethods.register('email')}
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Enter email address for correspondence</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </TooltipProvider>
      )
    },
    {
      id: 'accident',
      title: 'Details of Loss',
      component: (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={formMethods.control}
              name="accidentDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Accident Date *</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={formMethods.control}
              name="accidentTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Time *</FormLabel>
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
            name="accidentPlace"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Place *</FormLabel>
                <FormControl>
                  <Input placeholder="Where did the accident occur?" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={formMethods.control}
            name="incidentDescription"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Incident Description *</FormLabel>
                <FormControl>
                  <Textarea placeholder="Describe how the incident occurred" rows={4} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={formMethods.control}
            name="particularsOfInjuries"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Particulars of Injuries *</FormLabel>
                <FormControl>
                  <Textarea placeholder="Describe the injuries sustained" rows={4} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      )
    },
    {
      id: 'witnesses',
      title: 'Witness Information',
      component: (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Witnesses</h3>
            <Button
              type="button"
              onClick={() => addWitness({ name: '', address: '' })}
              variant="outline"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Witness
            </Button>
          </div>
          
          {witnessFields.map((field, index) => (
            <Card key={field.id} className="p-4">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-semibold">Witness {index + 1}</h4>
                <Button
                  type="button"
                  onClick={() => removeWitness(index)}
                  variant="destructive"
                  size="sm"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="space-y-4">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        <Label htmlFor={`witness_name_${index}`} className="flex items-center gap-1">
                          Witness Name *
                          <Info className="h-3 w-3" />
                        </Label>
                        <Input
                          id={`witness_name_${index}`}
                          placeholder="Enter witness name"
                          {...formMethods.register(`witnesses.${index}.name`)}
                        />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Enter the full name of the witness</p>
                    </TooltipContent>
                  </Tooltip>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        <Label htmlFor={`witness_address_${index}`} className="flex items-center gap-1">
                          Witness Address *
                          <Info className="h-3 w-3" />
                        </Label>
                        <Textarea
                          id={`witness_address_${index}`}
                          placeholder="Enter witness address"
                          rows={2}
                          {...formMethods.register(`witnesses.${index}.address`)}
                        />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Enter the complete address of the witness</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </Card>
          ))}
          
          {witnessFields.length === 0 && (
            <div className="text-center text-sm text-muted-foreground border p-6 rounded-md">
              No witnesses added yet. Click "Add Witness" to add witness information.
            </div>
          )}
        </div>
      )
    },
    {
      id: 'doctor',
      title: 'Doctor Information',
      component: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={formMethods.control}
              name="doctorName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name of doctor *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter doctor's name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={formMethods.control}
              name="doctorAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address of doctor *</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Enter doctor's address" rows={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <FormField
            control={formMethods.control}
            name="isUsualDoctor"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Is this your usual doctor?</FormLabel>
                </div>
              </FormItem>
            )}
          />
        </div>
      )
    },
    {
      id: 'incapacity',
      title: 'Incapacity Details',
      component: (
        <div className="space-y-6">
          <div>
            <h4 className="font-medium mb-4">Total incapacity period:</h4>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={formMethods.control}
                name="totalIncapacityFrom"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>From</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={formMethods.control}
                name="totalIncapacityTo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>To</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
          
          <div>
            <h4 className="font-medium mb-4">Partial incapacity period:</h4>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={formMethods.control}
                name="partialIncapacityFrom"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>From</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={formMethods.control}
                name="partialIncapacityTo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>To</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'other-insurers',
      title: 'Other Insurers',
      component: (
        <div className="space-y-6">
          <FormField
            control={formMethods.control}
            name="otherInsurerName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name *</FormLabel>
                <FormControl>
                  <Input placeholder="Enter other insurer name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={formMethods.control}
            name="otherInsurerAddress"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Address *</FormLabel>
                <FormControl>
                  <Textarea placeholder="Enter other insurer address" rows={3} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={formMethods.control}
            name="otherPolicyNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Policy Number</FormLabel>
                <FormControl>
                  <Input placeholder="Enter policy number" {...field} />
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
            Your group personal accident claim has been submitted and you'll receive a confirmation email shortly.
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
            Group Personal Accident Insurance Claim
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
                <h3 className="font-semibold mb-2">Accident Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>Date: {watchedValues.accidentDate}</div>
                  <div>Time: {watchedValues.accidentTime}</div>
                  <div>Place: {watchedValues.accidentPlace}</div>
                </div>
                <div className="mt-2 text-sm">
                  <div>Description: {watchedValues.incidentDescription}</div>
                  <div>Injuries: {watchedValues.particularsOfInjuries}</div>
                </div>
              </div>

              {watchedValues.witnesses && watchedValues.witnesses.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Witnesses</h3>
                  {watchedValues.witnesses.map((witness, index) => (
                    <div key={index} className="text-sm mb-2">
                      <div>Name: {witness.name}</div>
                      <div>Address: {witness.address}</div>
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
          title="Group Personal Accident Claim Submitted!"
          formType="Group Personal Accident Claim"
          isLoading={authSubmitting}
          loadingMessage="Your group personal accident claim is being processed and submitted..."
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
                Thank you for signing in! Your group personal accident claim is now being submitted...
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupPersonalAccidentClaim;