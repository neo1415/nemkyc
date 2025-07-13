import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { CheckCircle } from 'lucide-react';
import MultiStepForm from '@/components/common/MultiStepForm';
import { useFormDraft } from '@/hooks/useFormDraft';
import { uploadFile } from '@/services/fileService';
import { db } from '@/firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Checkbox } from '@/components/ui/checkbox';

const burglaryClaimSchema = yup.object().shape({
  policyNumber: yup.string().required("Policy number is required"),
  insuredName: yup.string().required("Name of insured is required"),
  agreeToDataPrivacy: yup.boolean().oneOf([true], "You must agree to the data privacy terms"),
  signature: yup.string().required("Signature is required"),
  signatureDate: yup.date().required("Signature date is required")
});

type BurglaryClaimData = yup.InferType<typeof burglaryClaimSchema>;

const BurglaryClaimForm: React.FC = () => {
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm({
    resolver: yupResolver(burglaryClaimSchema),
    defaultValues: { signatureDate: new Date() },
    mode: 'onChange'
  });

  const { clearDraft } = useFormDraft('burglary-claim', {});

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'burglary-claims'), {
        ...data,
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
            control={form.control as any}
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
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Burglary Claim Form</h1>
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