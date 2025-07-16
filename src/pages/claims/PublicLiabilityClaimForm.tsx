import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useFormDraft } from '../../hooks/useFormDraft';
import { useToast } from '../../hooks/use-toast';

import MultiStepForm from '../../components/common/MultiStepForm';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Checkbox } from '../../components/ui/checkbox';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Badge } from '../../components/ui/badge';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { Label } from '../../components/ui/label';


interface Witness {
  name: string;
  address: string;
  isEmployee: 'employee' | 'independent';
}

interface PublicLiabilityClaimData {
  policyNumber: string;
  coverageFromDate: string;
  coverageToDate: string;
  companyName?: string;
  address: string;
  phone: string;
  email: string;
  accidentDate: string;
  accidentTime: string;
  accidentPlace: string;
  accidentDetails: string;
  witnesses: Witness[];
  employeeActivity: string;
  responsiblePersonName: string;
  responsiblePersonAddress: string;
  responsibleEmployer?: string;
  policeInvolved: 'yes' | 'no';
  policeStation?: string;
  officerNumber?: string;
  otherInsurance: 'yes' | 'no';
  otherInsuranceDetails?: string;
  claimantName: string;
  claimantAddress: string;
  injuryNature: string;
  claimNoticeReceived: 'yes' | 'no';
  noticeFrom?: string;
  noticeWhen?: string;
  noticeForm?: string;
  agreeToDataPrivacy: boolean;
  signature: string;
}

const defaultValues: Partial<PublicLiabilityClaimData> = {
  policyNumber: '',
  coverageFromDate: '',
  coverageToDate: '',
  companyName: '',
  address: '',
  phone: '',
  email: '',
  accidentDate: '',
  accidentTime: '',
  accidentPlace: '',
  accidentDetails: '',
  witnesses: [{ name: '', address: '', isEmployee: 'independent' }],
  employeeActivity: '',
  responsiblePersonName: '',
  responsiblePersonAddress: '',
  responsibleEmployer: '',
  policeInvolved: 'no',
  policeStation: '',
  officerNumber: '',
  otherInsurance: 'no',
  otherInsuranceDetails: '',
  claimantName: '',
  claimantAddress: '',
  injuryNature: '',
  claimNoticeReceived: 'no',
  noticeFrom: '',
  noticeWhen: '',
  noticeForm: '',
  agreeToDataPrivacy: false,
  signature: ''
};

const PublicLiabilityClaimForm: React.FC = () => {
  const { toast } = useToast();
  const [showSummary, setShowSummary] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formMethods = useForm<PublicLiabilityClaimData>({
    defaultValues,
    mode: 'onChange'
  });

  const { fields: witnessFields, append: addWitness, remove: removeWitness } = useFieldArray({
    control: formMethods.control,
    name: 'witnesses'
  });

  const { saveDraft, loadDraft, clearDraft } = useFormDraft('public-liability-claim', formMethods);

  const watchedValues = formMethods.watch();

  useEffect(() => {
    const draft = loadDraft();
    if (draft) {
      Object.keys(draft).forEach((key) => {
        formMethods.setValue(key as keyof PublicLiabilityClaimData, draft[key]);
      });
    }
  }, [formMethods, loadDraft]);

  useEffect(() => {
    const subscription = formMethods.watch((data) => {
      saveDraft(data);
    });
    return () => subscription.unsubscribe();
  }, [formMethods, saveDraft]);

  const handleSubmit = async (data: PublicLiabilityClaimData) => {
    setIsSubmitting(true);
    try {
      // Save to Firestore
      const docRef = await addDoc(collection(db, 'publicLiabilityClaimsTable'), {
        ...data,
        submittedAt: new Date(),
        status: 'submitted'
      });

      clearDraft();
      setShowSummary(false);
      setShowSuccess(true);
      
      toast({
        title: "Claim Submitted Successfully",
        description: "Your public liability claim has been submitted and you'll receive a confirmation email shortly.",
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

  const onFinalSubmit = (data: PublicLiabilityClaimData) => {
    setShowSummary(true);
  };

  const addWitness = () => {
    addWitness({ name: '', address: '', isEmployee: 'independent' });
  };

  const steps = [
    {
      id: 'policy',
      title: 'Policy Details',
      component: (
        <div className="space-y-4">
          <div>
            <Label htmlFor="policyNumber">Policy Number *</Label>
            <Input
              id="policyNumber"
              {...formMethods.register('policyNumber')}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="coverageFromDate">Period of Cover - From *</Label>
              <Input
                id="coverageFromDate"
                type="date"
                {...formMethods.register('coverageFromDate')}
              />
            </div>
            <div>
              <Label htmlFor="coverageToDate">Period of Cover - To *</Label>
              <Input
                id="coverageToDate"
                type="date"
                {...formMethods.register('coverageToDate')}
              />
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'insured',
      title: 'Insured Details',
      component: (
        <div className="space-y-4">
          <div>
            <Label htmlFor="companyName">Company Name (if applicable)</Label>
            <Input
              id="companyName"
              {...formMethods.register('companyName')}
            />
          </div>
          
          <div>
            <Label htmlFor="address">Address *</Label>
            <Textarea
              id="address"
              {...formMethods.register('address')}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone">Phone *</Label>
              <Input
                id="phone"
                {...formMethods.register('phone')}
              />
            </div>
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                {...formMethods.register('email')}
              />
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'loss',
      title: 'Details of Loss',
      component: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="accidentDate">Date of Accident *</Label>
              <Input
                id="accidentDate"
                type="date"
                {...formMethods.register('accidentDate')}
              />
            </div>
            <div>
              <Label htmlFor="accidentTime">Time of Accident *</Label>
              <Input
                id="accidentTime"
                type="time"
                {...formMethods.register('accidentTime')}
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="accidentPlace">Place where accident occurred *</Label>
            <Input
              id="accidentPlace"
              {...formMethods.register('accidentPlace')}
            />
          </div>
          
          <div>
            <Label htmlFor="accidentDetails">Full details of how accident occurred *</Label>
            <Textarea
              id="accidentDetails"
              {...formMethods.register('accidentDetails')}
              rows={4}
            />
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-4">
              <Label>Names & addresses of all witnesses</Label>
              <Button type="button" onClick={addWitness} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Witness
              </Button>
            </div>
            
            {witnessFields.map((field, index) => (
              <div key={field.id} className="border p-4 rounded-lg space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Witness {index + 1}</h4>
                  <Button
                    type="button"
                    onClick={() => removeWitness(index)}
                    variant="ghost"
                    size="sm"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor={`witnesses.${index}.name`}>Name</Label>
                    <Input {...formMethods.register(`witnesses.${index}.name` as const)} />
                  </div>
                  <div>
                    <Label htmlFor={`witnesses.${index}.isEmployee`}>Is employee or independent?</Label>
                    <Select
                      value={watchedValues.witnesses?.[index]?.isEmployee || ''}
                      onValueChange={(value) => formMethods.setValue(`witnesses.${index}.isEmployee` as const, value as 'employee' | 'independent')}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="employee">Employee</SelectItem>
                        <SelectItem value="independent">Independent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor={`witnesses.${index}.address`}>Address</Label>
                    <Textarea {...formMethods.register(`witnesses.${index}.address` as const)} />
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div>
            <Label htmlFor="employeeActivity">What were you or your employees doing? *</Label>
            <Textarea
              id="employeeActivity"
              {...formMethods.register('employeeActivity')}
              rows={3}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="responsiblePersonName">Name of person who caused accident *</Label>
              <Input
                id="responsiblePersonName"
                {...formMethods.register('responsiblePersonName')}
              />
            </div>
            <div>
              <Label htmlFor="responsiblePersonAddress">Address of person who caused accident *</Label>
              <Textarea
                id="responsiblePersonAddress"
                {...formMethods.register('responsiblePersonAddress')}
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="responsibleEmployer">Name/address of that person's employer (if other than insured)</Label>
            <Textarea
              id="responsibleEmployer"
              {...formMethods.register('responsibleEmployer')}
            />
          </div>
        </div>
      )
    },
    {
      id: 'police',
      title: 'Police and Other Insurances',
      component: (
        <div className="space-y-4">
          <div>
            <Label>Were particulars taken by police? *</Label>
            <Select
              value={watchedValues.policeInvolved || ''}
              onValueChange={(value) => formMethods.setValue('policeInvolved', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="no">No</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {watchedValues.policeInvolved === 'yes' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="policeStation">Police Station *</Label>
                <Input
                  id="policeStation"
                  {...formMethods.register('policeStation')}
                />
              </div>
              <div>
                <Label htmlFor="officerNumber">Officer Number *</Label>
                <Input
                  id="officerNumber"
                  {...formMethods.register('officerNumber')}
                />
              </div>
            </div>
          )}
          
          <div>
            <Label>Do you hold other policies covering this accident? *</Label>
            <Select
              value={watchedValues.otherInsurance || ''}
              onValueChange={(value) => formMethods.setValue('otherInsurance', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="no">No</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {watchedValues.otherInsurance === 'yes' && (
            <div>
              <Label htmlFor="otherInsuranceDetails">Other insurance details *</Label>
              <Textarea
                id="otherInsuranceDetails"
                {...formMethods.register('otherInsuranceDetails')}
                rows={3}
              />
            </div>
          )}
        </div>
      )
    },
    {
      id: 'claimant',
      title: 'Claimant',
      component: (
        <div className="space-y-4">
          <div>
            <Label htmlFor="claimantName">Name *</Label>
            <Input
              id="claimantName"
              {...formMethods.register('claimantName')}
            />
          </div>
          
          <div>
            <Label htmlFor="claimantAddress">Address *</Label>
            <Textarea
              id="claimantAddress"
              {...formMethods.register('claimantAddress')}
            />
          </div>
          
          <div>
            <Label htmlFor="injuryNature">Nature of injury or damage *</Label>
            <Textarea
              id="injuryNature"
              {...formMethods.register('injuryNature')}
              rows={3}
            />
          </div>
          
          <div>
            <Label>Have you received claim notice? *</Label>
            <Select
              value={watchedValues.claimNoticeReceived || ''}
              onValueChange={(value) => formMethods.setValue('claimNoticeReceived', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="no">No</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {watchedValues.claimNoticeReceived === 'yes' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="noticeFrom">From whom *</Label>
                  <Input
                    id="noticeFrom"
                    {...formMethods.register('noticeFrom')}
                  />
                </div>
                <div>
                  <DatePickerField
                    name="noticeWhen"
                    label="When *"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="noticeForm">In what form *</Label>
                <Input
                  id="noticeForm"
                  {...formMethods.register('noticeForm')}
                />
              </div>
              <FileUpload
                label="Notice Document (if written)"
                onFileSelect={(file) => setUploadedFiles(prev => ({ ...prev, noticeDocument: file }))}
                currentFile={uploadedFiles.noticeDocument}
                accept=".pdf,.jpg,.png"
                maxSize={3}
              />
            </div>
          )}
        </div>
      )
    },
    {
      id: 'privacy',
      title: 'Data Privacy',
      component: (
        <div className="space-y-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Data Privacy</h3>
            <div className="text-sm space-y-2">
              <p>i. Your data will solemnly be used for the purposes of this business contract and also to enable us reach you with the updates about our products and services.</p>
              <p>ii. Please note that your personal data will be treated with utmost respect and is well secured as required by Nigeria Data Protection Regulations 2019.</p>
              <p>iii. Your personal data shall not be shared with or sold to any third-party without your consent unless we are compelled by law or regulator.</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="agreeToDataPrivacy"
              checked={watchedValues.agreeToDataPrivacy || false}
              onCheckedChange={(checked) => formMethods.setValue('agreeToDataPrivacy', !!checked)}
            />
            <Label htmlFor="agreeToDataPrivacy">I agree to the data privacy terms *</Label>
          </div>
        </div>
      )
    },
    {
      id: 'declaration',
      title: 'Declaration & Signature',
      component: (
        <div className="space-y-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Declaration</h3>
            <div className="text-sm space-y-2">
              <p>1. I/We declare to the best of my/our knowledge and belief that the information given on this form is true in every respect and agree that if I/we have made any false or fraudulent statement, be it suppression or concealment, the policy shall be cancelled and the claim shall be forfeited.</p>
              <p>2. I/We agree to provide additional information to NEM Insurance, if required.</p>
              <p>3. I/We agree to submit all required and requested for documents and NEM Insurance shall not be held responsible for any delay in settlement of claim due to non-fulfillment of requirements.</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="declarationTrue"
                checked={watchedValues.declarationTrue || false}
                onCheckedChange={(checked) => formMethods.setValue('declarationTrue', !!checked)}
              />
              <Label htmlFor="declarationTrue">I agree that statements are true *</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="declarationAdditionalInfo"
                checked={watchedValues.declarationAdditionalInfo || false}
                onCheckedChange={(checked) => formMethods.setValue('declarationAdditionalInfo', !!checked)}
              />
              <Label htmlFor="declarationAdditionalInfo">I agree to provide more info *</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="declarationDocuments"
                checked={watchedValues.declarationDocuments || false}
                onCheckedChange={(checked) => formMethods.setValue('declarationDocuments', !!checked)}
              />
              <Label htmlFor="declarationDocuments">I agree on documents requested *</Label>
            </div>
          </div>
          
          <div>
            <Label htmlFor="signature">Signature of policyholder (digital signature) *</Label>
            <Input
              id="signature"
              {...formMethods.register('signature')}
              placeholder="Type your full name as signature"
            />
          </div>
          
          <div>
            <Label>Date</Label>
            <Input value={new Date().toISOString().split('T')[0]} disabled />
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Public Liability Insurance Claim Form</h1>
          <p className="text-gray-600 mt-2">Submit your public liability insurance claim with all required details</p>
        </div>

        <MultiStepForm
          steps={steps}
          onSubmit={onFinalSubmit}
          isSubmitting={isSubmitting}
          submitButtonText="Review & Submit Claim"
          formMethods={formMethods}
        />

        {/* Summary Dialog */}
        <Dialog open={showSummary} onOpenChange={setShowSummary}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Review Your Claim Submission</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><strong>Policy Number:</strong> {watchedValues.policyNumber}</div>
                <div><strong>Company Name:</strong> {watchedValues.companyName}</div>
                <div><strong>Claimant Name:</strong> {watchedValues.claimantName}</div>
                <div><strong>Accident Date:</strong> {watchedValues.accidentDate ? format(new Date(watchedValues.accidentDate), "PPP") : ''}</div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowSummary(false)}>
                  Back to Edit
                </Button>
                <Button onClick={() => handleSubmit(formMethods.getValues())} disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Confirm & Submit'
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Success Modal */}
        <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-center text-green-600">
                Claim Submitted Successfully!
              </DialogTitle>
            </DialogHeader>
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p>Your public liability claim has been submitted successfully.</p>
              <p className="text-sm text-muted-foreground">
                You will receive a confirmation email shortly with your claim reference number.
              </p>
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm">
                  <strong>For claims status enquiries, call 01 448 9570</strong>
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setShowSuccess(false)} className="w-full">
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default PublicLiabilityClaimForm;