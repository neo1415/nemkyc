import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, CheckCircle, Plus, Trash2 } from 'lucide-react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

const allRiskClaimSchema = yup.object().shape({
  policyNumber: yup.string().required("Policy number is required"),
  periodOfCoverFrom: yup.date().required("Period of cover from is required"),
  periodOfCoverTo: yup.date().required("Period of cover to is required"),
  insuredName: yup.string().required("Name of insured is required"),
  address: yup.string().required("Address is required"),
  phone: yup.string().required("Phone number is required"),
  email: yup.string().email("Invalid email format").required("Email is required"),
  typeOfClaim: yup.string().required("Type of claim is required"),
  locationOfClaim: yup.string().required("Location of claim is required"),
  dateOfOccurrence: yup.date().required("Date of occurrence is required"),
  timeOfOccurrence: yup.string().required("Time of occurrence is required"),
  propertyDescription: yup.string().required("Property description is required"),
  circumstancesOfLoss: yup.string().required("Circumstances of loss/damage is required"),
  estimateOfLoss: yup.number().positive("Must be a positive number").required("Estimate of loss/repairs is required"),
  propertyItems: yup.array().of(
    yup.object().shape({
      description: yup.string().required("Description is required"),
      dateOfPurchase: yup.date().required("Date of purchase is required"),
      costPrice: yup.number().positive("Must be a positive number").required("Cost price is required"),
      deductionForAge: yup.number().min(0, "Cannot be negative").required("Deduction for age/use/wear is required"),
      amountClaimed: yup.number().positive("Must be a positive number").required("Amount claimed is required"),
      remarks: yup.string()
    })
  ).min(1, "At least one property item is required"),
  agreeToDataPrivacy: yup.boolean().oneOf([true], "You must agree to the data privacy terms"),
  signature: yup.string().required("Signature is required"),
  signatureDate: yup.date().required("Signature date is required")
});

type AllRiskClaimData = yup.InferType<typeof allRiskClaimSchema>;

const AllRiskClaim: React.FC = () => {
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File>>({});

  const form = useForm<AllRiskClaimData>({
    resolver: yupResolver(allRiskClaimSchema),
    defaultValues: {
      propertyItems: [{ description: '', dateOfPurchase: undefined, costPrice: undefined, deductionForAge: 0, amountClaimed: undefined, remarks: '' }],
      signatureDate: new Date()
    },
    mode: 'onChange'
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "propertyItems"
  });

  const { saveDraft, loadDraft, clearDraft } = useFormDraft('all-risk-claim', {});

  const onSubmit = async (data: AllRiskClaimData) => {
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
            control={form.control}
            name="policyNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500">Policy Number</FormLabel>
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
      title: 'Declaration & Signature',
      component: (
        <div className="space-y-6">
          <FormField
            control={form.control}
            name="agreeToDataPrivacy"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500">
                  I agree to the declaration and data privacy terms
                </FormLabel>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="signature"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="after:content-['*'] after:ml-0.5 after:text-red-500">Digital Signature</FormLabel>
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