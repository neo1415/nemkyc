import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Trash2, CheckCircle2, Loader2 } from 'lucide-react';
import MultiStepForm from '@/components/common/MultiStepForm';
import { useFormDraft } from '@/hooks/useFormDraft';
import FileUpload from '@/components/common/FileUpload';
import { uploadFile } from '@/services/fileService';
import { db } from '@/firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Card } from '@/components/ui/card';

const naicomSchema = yup.object().shape({
  companyName: yup.string().required("Company name is required"),
  taxId: yup.string().required("Tax ID is required"),
  directors: yup.array().min(1, "At least one director required"),
  agreeToDataPrivacy: yup.boolean().oneOf([true], "Must agree to privacy"),
  signature: yup.string().required("Signature required")
});

const NaicomCorporateCDD: React.FC = () => {
  const [showSummary, setShowSummary] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File>>({});

  const formMethods = useForm({
    resolver: yupResolver(naicomSchema),
    defaultValues: { companyName: '', directors: [], agreeToDataPrivacy: false, signature: '' }
  });

  const { fields: directorFields, append: addDirector, remove: removeDirector } = useFieldArray({
    control: formMethods.control,
    name: 'directors'
  });

  const { saveDraft, clearDraft } = useFormDraft('naicomCDD', formMethods);
  const watchedValues = formMethods.watch();

  useEffect(() => {
    const subscription = formMethods.watch((data) => saveDraft(data));
    return () => subscription.unsubscribe();
  }, [formMethods, saveDraft]);

  const handleSubmit = async (data: any) => setShowSummary(true);

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    try {
      const data = formMethods.getValues();
      
      const submissionData = {
        ...data,
        status: 'processing',
        formType: 'naicom-company-cdd',
        submittedAt: new Date().toISOString()
      };
      
      await addDoc(collection(db, 'motor-claims'), {
        ...submissionData,
        timestamp: serverTimestamp()
      });

      clearDraft();
      setShowSummary(false);
      setShowSuccess(true);
      toast({ title: "NAICOM CDD submitted successfully!" });
    } catch (error) {
      toast({ title: "Submission failed", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    {
      id: 'company',
      title: 'Company Details',
      component: (
        <div className="space-y-4">
          <div>
            <Label>Company Name *</Label>
            <Input {...formMethods.register('companyName')} />
          </div>
          <div>
            <Label>Tax ID *</Label>
            <Input {...formMethods.register('taxId')} />
          </div>
        </div>
      )
    },
    {
      id: 'directors',
      title: 'Director Info',
      component: (
        <div className="space-y-6">
          <div className="flex justify-between">
            <h3>Directors</h3>
            <Button type="button" onClick={() => addDirector({ firstName: '', lastName: '' })}>
              <Plus className="h-4 w-4" /> Add Director
            </Button>
          </div>
          {directorFields.map((field, index) => (
            <Card key={field.id} className="p-4">
              <div className="flex justify-between mb-4">
                <h4>Director {index + 1}</h4>
                <Button type="button" size="sm" onClick={() => removeDirector(index)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input placeholder="First Name" {...formMethods.register(`directors.${index}.firstName`)} />
                <Input placeholder="Last Name" {...formMethods.register(`directors.${index}.lastName`)} />
              </div>
            </Card>
          ))}
        </div>
      )
    },
    {
      id: 'uploads',
      title: 'Uploads',
      component: (
        <div className="space-y-6">
          <FileUpload
            label="Upload CAC Certificate *"
            onFileSelect={(file) => setUploadedFiles(prev => ({ ...prev, cac: file }))}
            accept=".jpg,.png,.pdf"
            maxSize={3 * 1024 * 1024}
          />
          <FileUpload
            label="Upload NAICOM License *"
            onFileSelect={(file) => setUploadedFiles(prev => ({ ...prev, license: file }))}
            accept=".jpg,.png,.pdf"
            maxSize={3 * 1024 * 1024}
          />
        </div>
      )
    },
    {
      id: 'declaration',
      title: 'Declaration',
      component: (
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={watchedValues.agreeToDataPrivacy}
              onCheckedChange={(checked) => formMethods.setValue('agreeToDataPrivacy', checked)}
            />
            <Label>I agree to data privacy terms *</Label>
          </div>
          <div>
            <Label>Digital Signature *</Label>
            <Input {...formMethods.register('signature')} placeholder="Type your name" />
          </div>
        </div>
      )
    }
  ];

  return (
    <>
      <MultiStepForm steps={steps} onSubmit={handleSubmit} formMethods={formMethods} />
      
      <Dialog open={showSummary} onOpenChange={setShowSummary}>
        <DialogContent>
          <DialogHeader><DialogTitle>Summary</DialogTitle></DialogHeader>
          <div><p>Company: {watchedValues.companyName}</p></div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSummary(false)}>Edit</Button>
            <Button onClick={handleFinalSubmit} disabled={isSubmitting}>Submit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle><CheckCircle2 className="inline mr-2" />Success!</DialogTitle>
          </DialogHeader>
          <p>NAICOM CDD submitted successfully.</p>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default NaicomCorporateCDD;