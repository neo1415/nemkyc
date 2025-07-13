import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Calendar as ReactCalendar } from '@/components/ui/calendar';
import { CalendarIcon, Plus, Trash2, CheckCircle2, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import MultiStepForm from '@/components/common/MultiStepForm';
import { useFormDraft } from '@/hooks/useFormDraft';
import FileUpload from '@/components/common/FileUpload';
import { uploadFile } from '@/services/fileService';
import { db } from '@/firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';
import { Card } from '@/components/ui/card';

// Corporate CDD Schema
const corporateCDDSchema = yup.object().shape({
  companyName: yup.string().min(3).max(50).required("Company name is required"),
  registeredAddress: yup.string().min(3).max(60).required("Registered address is required"),
  incorporationNumber: yup.string().min(7).max(15).required("Incorporation number is required"),
  incorporationState: yup.string().min(3).max(50).required("Incorporation state is required"),
  dateOfIncorporation: yup.date().required("Date of incorporation is required"),
  natureOfBusiness: yup.string().min(3).max(60).required("Nature of business is required"),
  companyType: yup.string().required("Company type is required"),
  email: yup.string().email().min(5).max(50).required("Email is required"),
  website: yup.string().required("Website is required"),
  telephone: yup.string().min(5).max(11).required("Telephone is required"),
  directors: yup.array().of(yup.object().shape({
    firstName: yup.string().min(3).max(30).required("First name is required"),
    lastName: yup.string().min(3).max(30).required("Last name is required"),
    email: yup.string().email().required("Email is required"),
    phone: yup.string().required("Phone is required"),
    bvn: yup.string().length(11).required("BVN is required")
  })).min(1, "At least one director is required"),
  bankName: yup.string().min(3).max(50).required("Bank name is required"),
  accountNumber: yup.string().min(7).max(10).required("Account number is required"),
  agreeToDataPrivacy: yup.boolean().oneOf([true], "You must agree to data privacy"),
  declarationTrue: yup.boolean().oneOf([true], "You must agree that statements are true"),
  signature: yup.string().required("Signature is required")
});

const CorporateCDD: React.FC = () => {
  const [showSummary, setShowSummary] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File>>({});

  const formMethods = useForm<any>({
    resolver: yupResolver(corporateCDDSchema),
    defaultValues: {
      companyName: '',
      directors: [],
      agreeToDataPrivacy: false,
      declarationTrue: false,
      signature: ''
    },
    mode: 'onChange'
  });

  const { fields: directorFields, append: addDirector, remove: removeDirector } = useFieldArray({
    control: formMethods.control,
    name: 'directors'
  });

  const { saveDraft, clearDraft } = useFormDraft('corporateCDD', formMethods);
  const watchedValues = formMethods.watch();

  useEffect(() => {
    const subscription = formMethods.watch((data) => {
      saveDraft(data);
    });
    return () => subscription.unsubscribe();
  }, [formMethods, saveDraft]);

  const handleSubmit = async (data: any) => {
    setShowSummary(true);
  };

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    try {
      const data = formMethods.getValues();
      
      const fileUploadPromises: Array<Promise<[string, string]>> = [];
      Object.entries(uploadedFiles).forEach(([key, file]) => {
        fileUploadPromises.push(
          uploadFile(file, 'corporate-cdd').then(url => [key + 'Url', url])
        );
      });
      
      const uploadedUrls = await Promise.all(fileUploadPromises);
      const fileUrls = Object.fromEntries(uploadedUrls);
      
      const submissionData = {
        ...data,
        ...fileUrls,
        status: 'processing',
        submittedAt: new Date().toISOString(),
        formType: 'corporate-cdd'
      };
      
      await addDoc(collection(db, 'motor-claims'), {
        ...submissionData,
        timestamp: serverTimestamp(),
        createdAt: new Date().toLocaleDateString('en-GB')
      });

      clearDraft();
      setShowSummary(false);
      setShowSuccess(true);
      toast({ title: "Corporate CDD form submitted successfully!" });
    } catch (error) {
      console.error('Submission error:', error);
      toast({ title: "Submission failed", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
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
              <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !value && "text-muted-foreground")}>
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
              />
            </PopoverContent>
          </Popover>
        </div>
      </TooltipProvider>
    );
  };

  const steps = [
    {
      id: 'company',
      title: 'Company Info',
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
                  <Input id="companyName" {...formMethods.register('companyName')} />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Enter the registered company name</p>
              </TooltipContent>
            </Tooltip>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input placeholder="Email" {...formMethods.register('email')} />
              <Input placeholder="Website" {...formMethods.register('website')} />
            </div>
          </div>
        </TooltipProvider>
      )
    },
    {
      id: 'directors',
      title: 'Directors Info',
      component: (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Company Directors</h3>
            <Button
              type="button"
              variant="outline"
              onClick={() => addDirector({ firstName: '', lastName: '', email: '', phone: '', bvn: '' })}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Director
            </Button>
          </div>

          {directorFields.map((field, index) => (
            <Card key={field.id} className="p-4">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-medium">Director {index + 1}</h4>
                <Button type="button" variant="destructive" size="sm" onClick={() => removeDirector(index)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input placeholder="First Name" {...formMethods.register(`directors.${index}.firstName`)} />
                <Input placeholder="Last Name" {...formMethods.register(`directors.${index}.lastName`)} />
                <Input placeholder="Email" {...formMethods.register(`directors.${index}.email`)} />
                <Input placeholder="Phone" {...formMethods.register(`directors.${index}.phone`)} />
                <Input placeholder="BVN" {...formMethods.register(`directors.${index}.bvn`)} />
              </div>
            </Card>
          ))}
        </div>
      )
    },
    {
      id: 'declaration',
      title: 'Data Privacy & Declaration',
      component: (
        <div className="space-y-6">
          <div className="prose max-w-none text-sm">
            <h3>Data Privacy</h3>
            <p>Your data will be used for business purposes and kept secure according to Nigeria Data Protection Regulations 2019.</p>
            <h3>Declaration</h3>
            <p>I declare that all information provided is true and accurate.</p>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="agreeToDataPrivacy"
                checked={watchedValues.agreeToDataPrivacy || false}
                onCheckedChange={(checked) => formMethods.setValue('agreeToDataPrivacy', checked)}
              />
              <Label htmlFor="agreeToDataPrivacy">I agree to the data privacy terms *</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="declarationTrue"
                checked={watchedValues.declarationTrue || false}
                onCheckedChange={(checked) => formMethods.setValue('declarationTrue', checked)}
              />
              <Label htmlFor="declarationTrue">I declare all information is true *</Label>
            </div>

            <div>
              <Label htmlFor="signature">Digital Signature *</Label>
              <Input
                id="signature"
                {...formMethods.register('signature')}
                placeholder="Type your full name"
              />
            </div>
          </div>
        </div>
      )
    }
  ];

  return (
    <>
      <MultiStepForm
        steps={steps}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        submitButtonText="Submit Corporate CDD"
        formMethods={formMethods}
      />

      <Dialog open={showSummary} onOpenChange={setShowSummary}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Corporate CDD Summary</DialogTitle>
          </DialogHeader>
          <div>
            <p><strong>Company:</strong> {watchedValues.companyName}</p>
            <p><strong>Directors:</strong> {watchedValues.directors?.length || 0}</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSummary(false)}>Edit</Button>
            <Button onClick={handleFinalSubmit} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
              Success!
            </DialogTitle>
          </DialogHeader>
          <p>Corporate CDD form submitted successfully.</p>
          <DialogFooter>
            <Button onClick={() => setShowSuccess(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CorporateCDD;