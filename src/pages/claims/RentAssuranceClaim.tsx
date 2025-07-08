import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { RentAssuranceClaimData } from '../../types/claims';
import { emailService } from '../../services/emailService';
import { useFormDraft } from '../../hooks/useFormDraft';
import { useToast } from '../../hooks/use-toast';

import MultiStepForm from '../../components/common/MultiStepForm';
import FormSection from '../../components/common/FormSection';
import FileUpload from '../../components/common/FileUpload';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Checkbox } from '../../components/ui/checkbox';
import { Button } from '../../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Loader2 } from 'lucide-react';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../../components/ui/form';

const rentAssuranceSchema = yup.object({
  policyNumber: yup.string().required('Policy number is required'),
  periodOfCoverFrom: yup.string().required('Period of cover from is required'),
  periodOfCoverTo: yup.string().required('Period of cover to is required'),
  nameOfInsured: yup.string().required('Name of insured is required'),
  address: yup.string().required('Address is required'),
  age: yup.number().required('Age is required').min(1, 'Age must be valid'),
  email: yup.string().email('Invalid email').required('Email is required'),
  phone: yup.string().required('Phone number is required'),
  nameOfLandlord: yup.string().required('Name of landlord is required'),
  addressOfLandlord: yup.string().required('Address of landlord is required'),
  livingAtPremisesFrom: yup.string().required('Living at premises from date is required'),
  livingAtPremisesTo: yup.string().required('Living at premises to date is required'),
  periodOfDefaultFrom: yup.string().required('Period of default from is required'),
  periodOfDefaultTo: yup.string().required('Period of default to is required'),
  amountDefaulted: yup.number().required('Amount defaulted is required').min(0),
  rentDueDate: yup.string().required('Rent due date is required'),
  rentPaymentFrequency: yup.string().required('Rent payment frequency is required'),
  causeOfInabilityToPay: yup.string().required('Cause of inability to pay is required'),
  nameOfBeneficiary: yup.string().required('Name of beneficiary is required'),
  beneficiaryAge: yup.number().required('Beneficiary age is required').min(1),
  beneficiaryAddress: yup.string().required('Beneficiary address is required'),
  beneficiaryEmail: yup.string().email('Invalid email').required('Beneficiary email is required'),
  beneficiaryPhone: yup.string().required('Beneficiary phone is required'),
  beneficiaryOccupation: yup.string().required('Beneficiary occupation is required'),
  writtenDeclaration: yup.string().required('Written declaration is required'),
  agreeToDataPrivacy: yup.boolean().oneOf([true], 'You must agree to the data privacy policy'),
  signature: yup.string().required('Signature is required'),
});

const RentAssuranceClaim = () => {
  const { toast } = useToast();
  const [showSummary, setShowSummary] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<RentAssuranceClaimData>({
    resolver: yupResolver(rentAssuranceSchema) as any,
    defaultValues: {
      policyNumber: '',
      periodOfCoverFrom: '',
      periodOfCoverTo: '',
      nameOfInsured: '',
      address: '',
      age: 0,
      email: '',
      phone: '',
      nameOfLandlord: '',
      addressOfLandlord: '',
      livingAtPremisesFrom: '',
      livingAtPremisesTo: '',
      periodOfDefaultFrom: '',
      periodOfDefaultTo: '',
      amountDefaulted: 0,
      rentDueDate: '',
      rentPaymentFrequency: '',
      rentPaymentFrequencyOther: '',
      causeOfInabilityToPay: '',
      nameOfBeneficiary: '',
      beneficiaryAge: 0,
      beneficiaryAddress: '',
      beneficiaryEmail: '',
      beneficiaryPhone: '',
      beneficiaryOccupation: '',
      writtenDeclaration: '',
      agreeToDataPrivacy: false,
      signature: '',
    }
  });

  const { control, setValue, watch, getValues } = form;

  const { saveDraft, loadDraft, clearDraft } = useFormDraft('rent-assurance-claim', {
    setValue,
    watch,
  });

  useEffect(() => {
    const draft = loadDraft();
    if (draft) {
      Object.entries(draft).forEach(([key, value]) => {
        setValue(key as any, value);
      });
    }
  }, [loadDraft, setValue]);

  useEffect(() => {
    const subscription = watch((data) => {
      const timeout = setTimeout(() => saveDraft(data), 300);
      return () => clearTimeout(timeout);
    });
    return () => subscription.unsubscribe();
  }, [saveDraft, watch]);

  const submit = async (data: RentAssuranceClaimData) => {
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'rentAssuranceClaims'), {
        ...data,
        submittedAt: new Date(),
        status: 'submitted',
      });

      await emailService.sendSubmissionConfirmation(data.email, 'Rent Assurance Policy Claim');

      clearDraft();
      setShowSummary(false);
      setShowSuccess(true);

      toast({
        title: 'Claim Submitted Successfully',
        description: "Your rent assurance claim has been submitted and you'll receive a confirmation email shortly.",
      });
    } catch (error) {
      console.error('Error submitting claim:', error);
      toast({
        title: 'Submission Error',
        description: 'There was an error submitting your claim. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const onFinalSubmit = () => {
    if (form.formState.isValid) {
      setShowSummary(true);
    }
  };

  const PolicyDetailsSection = () => (
    <FormSection title="Policy Details" description="Enter your policy information">
      <div className="grid md:grid-cols-2 gap-6">
        <FormField
          control={control}
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
        <div className="md:col-span-2">
          <FormLabel>Period of Cover *</FormLabel>
          <div className="grid md:grid-cols-2 gap-4 mt-2">
            <FormField
              control={control}
              name="periodOfCoverFrom"
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
              control={control}
              name="periodOfCoverTo"
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
    </FormSection>
  );

  const InsuredDetailsSection = () => (
    <FormSection title="Insured Details" description="Tenant information">
      <div className="space-y-6">
        <FormField
          control={control}
          name="nameOfInsured"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name of Insured (Tenant) *</FormLabel>
              <FormControl>
                <Input placeholder="Enter full name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address *</FormLabel>
              <FormControl>
                <Textarea placeholder="Enter full address" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid md:grid-cols-3 gap-6">
          <FormField
            control={control}
            name="age"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Age *</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="Enter age" 
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
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
          <FormField
            control={control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone *</FormLabel>
                <FormControl>
                  <Input placeholder="Enter phone number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <FormField
            control={control}
            name="nameOfLandlord"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name of Landlord *</FormLabel>
                <FormControl>
                  <Input placeholder="Enter landlord's name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="addressOfLandlord"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Address of Landlord *</FormLabel>
                <FormControl>
                  <Textarea placeholder="Enter landlord's address" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div>
          <FormLabel>How long living at premises *</FormLabel>
          <div className="grid md:grid-cols-2 gap-4 mt-2">
            <FormField
              control={control}
              name="livingAtPremisesFrom"
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
              control={control}
              name="livingAtPremisesTo"
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
    </FormSection>
  );

  const ClaimInformationSection = () => {
    const rentPaymentFrequency = watch('rentPaymentFrequency');

    return (
      <FormSection title="Claim Information" description="Details about the default">
        <div className="space-y-6">
          <div>
            <FormLabel>Period of Default *</FormLabel>
            <div className="grid md:grid-cols-2 gap-4 mt-2">
              <FormField
                control={control}
                name="periodOfDefaultFrom"
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
                control={control}
                name="periodOfDefaultTo"
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
          <div className="grid md:grid-cols-2 gap-6">
            <FormField
              control={control}
              name="amountDefaulted"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount Defaulted *</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="Enter amount" 
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="rentDueDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rent Due Date *</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={control}
            name="rentPaymentFrequency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Frequency of Rent Payment *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment frequency" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="yearly">Yearly</SelectItem>
                    <SelectItem value="half-yearly">Half-yearly</SelectItem>
                    <SelectItem value="biannually">Biannually</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          {rentPaymentFrequency === 'other' && (
            <FormField
              control={control}
              name="rentPaymentFrequencyOther"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Specify Other Frequency *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter payment frequency" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          <FormField
            control={control}
            name="causeOfInabilityToPay"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cause of Inability to Pay *</FormLabel>
                <FormControl>
                  <Textarea placeholder="Explain the cause of inability to pay rent" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </FormSection>
    );
  };

  const BeneficiaryDetailsSection = () => (
    <FormSection title="Beneficiary Details" description="Landlord information">
      <div className="space-y-6">
        <FormField
          control={control}
          name="nameOfBeneficiary"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name of Beneficiary (Landlord) *</FormLabel>
              <FormControl>
                <Input placeholder="Enter beneficiary's name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid md:grid-cols-2 gap-6">
          <FormField
            control={control}
            name="beneficiaryAge"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Age *</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="Enter age" 
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="beneficiaryOccupation"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Occupation *</FormLabel>
                <FormControl>
                  <Input placeholder="Enter occupation" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={control}
          name="beneficiaryAddress"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address *</FormLabel>
              <FormControl>
                <Textarea placeholder="Enter full address" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid md:grid-cols-2 gap-6">
          <FormField
            control={control}
            name="beneficiaryEmail"
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
          <FormField
            control={control}
            name="beneficiaryPhone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone *</FormLabel>
                <FormControl>
                  <Input placeholder="Enter phone number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
    </FormSection>
  );

  const DocumentsSection = () => (
    <FormSection title="File Uploads" description="Upload required documents">
      <div className="space-y-6">
        <FileUpload
          label="Rent Agreement"
          onFileSelect={(file) => setValue('rentAgreement', file)}
          onFileRemove={() => setValue('rentAgreement', undefined)}
          currentFile={watch('rentAgreement')}
          accept=".pdf,.jpg,.jpeg,.png"
          maxSize={3}
        />
        <FileUpload
          label="Demand Note"
          onFileSelect={(file) => setValue('demandNote', file)}
          onFileRemove={() => setValue('demandNote', undefined)}
          currentFile={watch('demandNote')}
          accept=".pdf,.jpg,.jpeg,.png"
          maxSize={3}
        />
        <FileUpload
          label="Quit Notice"
          onFileSelect={(file) => setValue('quitNotice', file)}
          onFileRemove={() => setValue('quitNotice', undefined)}
          currentFile={watch('quitNotice')}
          accept=".pdf,.jpg,.jpeg,.png"
          maxSize={3}
        />
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm font-medium text-blue-800">
            For claims status enquiries, call 01 448 9570
          </p>
        </div>
      </div>
    </FormSection>
  );

  const DataPrivacySection = () => (
    <FormSection title="Data Privacy" description="Privacy policy and data usage">
      <div className="prose prose-sm max-w-none">
        <div className="bg-muted p-4 rounded-lg space-y-3">
          <p><strong>i.</strong> Your data will solemnly be used for the purposes of this business contract and also to enable us reach you with the updates about our products and services.</p>
          <p><strong>ii.</strong> Please note that your personal data will be treated with utmost respect and is well secured as required by Nigeria Data Protection Regulations 2019.</p>
          <p><strong>iii.</strong> Your personal data shall not be shared with or sold to any third-party without your consent unless we are compelled by law or regulator.</p>
        </div>
      </div>
    </FormSection>
  );

  const DeclarationSection = () => (
    <FormSection title="Declaration & Signature" description="Final declaration and signature">
      <div className="space-y-6">
        <FormField
          control={control}
          name="writtenDeclaration"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Written Declaration *</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="I, [name], of [address], do hereby warrant that the particulars and statements contained in this claim are true and that I have not suppressed any material facts... amounting in all to..." 
                  {...field}
                  rows={4}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="agreeToDataPrivacy"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <FormLabel className="font-normal">
                I agree to the data privacy policy and declaration statements above *
              </FormLabel>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="signature"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Digital Signature *</FormLabel>
              <FormControl>
                <Input placeholder="Type your full name as digital signature" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="text-sm text-muted-foreground">
          Date: {new Date().toLocaleDateString()}
        </div>
      </div>
    </FormSection>
  );

  const steps = [
    {
      id: 'policy-details',
      title: 'Policy Details',
      component: <PolicyDetailsSection />,
      isValid: true
    },
    {
      id: 'insured-details',
      title: 'Insured Details',
      component: <InsuredDetailsSection />,
      isValid: true
    },
    {
      id: 'claim-information',
      title: 'Claim Information',
      component: <ClaimInformationSection />,
      isValid: true
    },
    {
      id: 'beneficiary-details',
      title: 'Beneficiary Details',
      component: <BeneficiaryDetailsSection />,
      isValid: true
    },
    {
      id: 'documents',
      title: 'Documents',
      component: <DocumentsSection />,
      isValid: true
    },
    {
      id: 'data-privacy',
      title: 'Data Privacy',
      component: <DataPrivacySection />,
      isValid: true
    },
    {
      id: 'declaration',
      title: 'Declaration & Signature',
      component: <DeclarationSection />,
      isValid: true
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Rent Assurance Policy Claim Form
          </h1>
          <p className="text-gray-600">
            Please fill out all required fields accurately
          </p>
        </div>

        <Form {...form}>
          <MultiStepForm
            steps={steps}
            onSubmit={onFinalSubmit}
            isSubmitting={isSubmitting}
            submitButtonText="Submit Claim"
            formMethods={form}
          />
        </Form>

        {/* Summary Dialog */}
        <Dialog open={showSummary} onOpenChange={setShowSummary}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Claim Summary</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Policy Information</h4>
                  <p className="text-sm">Policy Number: {getValues('policyNumber')}</p>
                  <p className="text-sm">Insured Name: {getValues('nameOfInsured')}</p>
                  <p className="text-sm">Email: {getValues('email')}</p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Claim Details</h4>
                  <p className="text-sm">Amount Defaulted: {getValues('amountDefaulted')}</p>
                  <p className="text-sm">Beneficiary: {getValues('nameOfBeneficiary')}</p>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowSummary(false)}>
                Edit Information
              </Button>
              <Button onClick={() => submit(getValues())} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Confirm Submission'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Success Dialog */}
        <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-center text-green-600">
                Claim Submitted Successfully!
              </DialogTitle>
            </DialogHeader>
            <div className="text-center py-4">
              <div className="mb-4">
                <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  ✓
                </div>
                <p className="text-gray-600 mb-4">
                  Your rent assurance claim has been submitted successfully. 
                  You will receive a confirmation email shortly.
                </p>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-blue-800">
                    For claims status enquiries, call 01 448 9570
                  </p>
                </div>
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

export default RentAssuranceClaim;